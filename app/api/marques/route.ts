/**
 * POST /api/marques
 *
 * Espace marques : une marque propose un produit à référencer (formulaire de
 * /marques, multipart/form-data, une fiche par produit).
 *
 *   1. Pot de miel + limite partagée (20 fiches par heure et par IP).
 *   2. Validation (lib/brands/submission.ts, même code que le formulaire).
 *   3. Photos facultatives (face, liste d'ingrédients) déjà compressées par le
 *      navigateur, rangées dans le bucket public `cosmetwiki-products` sous
 *      `brand-submissions/<id>/`.
 *   4. Ligne `cosme_check.brand_product_submissions` (status `pending`).
 *   5. E-mail à l'équipe (contact@ + boîte de Brian) et accusé de réception à
 *      la marque. Fail-open : la fiche est enregistrée même si Brevo tombe.
 *
 * RIEN n'est noté ni publié ici : la fiche attend la vérification de l'équipe.
 * La note, l'entrée au catalogue et le mail « produit référencé » se font en
 * interne, depuis l'admin (CosmeCheckAdmin, Retours > Marques).
 */
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseService } from "@/lib/supabase";
import { checkRateLimitShared } from "@/lib/ratelimit";
import { getTrustedIp } from "@/lib/clientIp";
import { validateBrandSubmission } from "@/lib/brands/submission";
import { notifyTeam, sendMail } from "@/lib/mail";
import { brandAckEmail, brandTeamEmail } from "@/lib/emails/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "cosmetwiki-products";
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function adminUrl(): string | null {
  const base = (process.env.ADMIN_APP_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/feedback/brands` : null;
}

export async function POST(req: NextRequest) {
  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  // Pot de miel : champ invisible que seuls les robots remplissent.
  const hp = fd.get("hp");
  if (typeof hp === "string" && hp.length > 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getTrustedIp(req.headers);
  const rate = await checkRateLimitShared(`brand-submit:${ip}`, 20, 3600);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trop de fiches envoyées en peu de temps. Réessayez dans une heure." },
      { status: 429, headers: { "Retry-After": String(Math.max(60, Math.ceil(rate.retryAfterMs / 1000))) } },
    );
  }

  const field = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : undefined;
  };
  const result = validateBrandSubmission({
    brand: field("brand"),
    company: field("company"),
    contactName: field("contactName"),
    contactEmail: field("contactEmail"),
    contactRole: field("contactRole"),
    brandWebsite: field("brandWebsite"),
    productName: field("productName"),
    ean: field("ean"),
    noEan: field("noEan"),
    volume: field("volume"),
    productType: field("productType"),
    productTypeOther: field("productTypeOther"),
    zones: fd.getAll("zones").filter((z): z is string => typeof z === "string"),
    inci: field("inci"),
    properties: field("properties"),
    madeIn: field("madeIn"),
    productUrl: field("productUrl"),
    certify: field("certify"),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error, field: result.field }, { status: 400 });
  }
  const data = result.data;

  // Photos (facultatives).
  const photos: { key: "front" | "inci"; file: File }[] = [];
  for (const key of ["front", "inci"] as const) {
    const f = fd.get(`photo_${key}`);
    if (f && typeof f !== "string" && f.size > 0) {
      if (!PHOTO_TYPES[f.type]) {
        return NextResponse.json({ error: "Photo : formats acceptés JPG, PNG ou WebP.", field: `photo_${key}` }, { status: 400 });
      }
      if (f.size > MAX_PHOTO_BYTES) {
        return NextResponse.json({ error: "Photo trop lourde (3 Mo maximum).", field: `photo_${key}` }, { status: 400 });
      }
      photos.push({ key, file: f });
    }
  }

  const svc = supabaseService();
  const id = randomUUID();
  const paths: Partial<Record<"front" | "inci", string>> = {};

  for (const p of photos) {
    const path = `brand-submissions/${id}/${p.key === "front" ? "face" : "ingredients"}.${PHOTO_TYPES[p.file.type]}`;
    const { error } = await svc.storage
      .from(BUCKET)
      .upload(path, Buffer.from(await p.file.arrayBuffer()), { contentType: p.file.type, upsert: false });
    if (error) {
      console.warn("[marques] upload photo échoué", error.message);
      continue; // la fiche reste utile sans la photo, l'équipe redemandera
    }
    paths[p.key] = path;
  }

  const { error: insErr } = await svc
    .schema("cosme_check")
    .from("brand_product_submissions")
    .insert({
      id,
      brand: data.brand,
      company: data.company,
      contact_name: data.contactName,
      contact_email: data.contactEmail,
      contact_role: data.contactRole,
      brand_website: data.brandWebsite,
      product_name: data.productName,
      ean: data.ean,
      volume: data.volume,
      product_type: data.productType,
      zones: data.zones,
      inci: data.inci,
      properties: data.properties,
      made_in: data.madeIn,
      product_url: data.productUrl,
      photo_front_path: paths.front ?? null,
      photo_inci_path: paths.inci ?? null,
      submitter_ip: ip,
    });
  if (insErr) {
    console.error("[marques] insertion échouée", insErr.message);
    return NextResponse.json({ error: "L'envoi a échoué. Réessayez dans un instant." }, { status: 500 });
  }

  const { count: earlier } = await svc
    .schema("cosme_check")
    .from("brand_product_submissions")
    .select("id", { count: "exact", head: true })
    .ilike("contact_email", data.contactEmail)
    .neq("id", id);

  const publicUrl = (path: string) => svc.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const photoUrls = [
    ...(paths.front ? [{ label: "Photo de face", url: publicUrl(paths.front) }] : []),
    ...(paths.inci ? [{ label: "Photo des ingrédients", url: publicUrl(paths.inci) }] : []),
  ];

  const team = brandTeamEmail({ id, ...data }, { photoUrls, adminUrl: adminUrl(), earlierFromBrand: earlier ?? 0 });
  const ack = brandAckEmail(data);
  // Attendus : sur Vercel la fonction est gelée dès la réponse envoyée.
  await Promise.all([
    notifyTeam({
      subject: team.subject,
      html: team.html,
      replyTo: { email: data.contactEmail, name: data.contactName },
      tags: ["marques-demande"],
    }),
    sendMail({
      to: [{ email: data.contactEmail, name: data.contactName }],
      subject: ack.subject,
      html: ack.html,
      tags: ["marques-accuse"],
    }),
  ]);

  return NextResponse.json({ ok: true, id });
}
