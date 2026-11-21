/**
 * POST /api/marques
 *
 * Espace marques : une marque saisit ses infos UNE fois puis envoie tous ses
 * produits. Le navigateur découpe l'envoi en paquets (10 produits et ~3,5 Mo de
 * photos maximum par requête, limite Vercel 4,5 Mo) qui partagent un `batchId`.
 *
 * multipart/form-data :
 *   brand, contactEmail, contactName, certify, hp (pot de miel)
 *   batchId   : uuid commun à tous les paquets d'un envoi
 *   final     : "1" sur le dernier paquet → les mails partent
 *   products  : JSON [{ productName, ean, noEan, volume, productType,
 *               productTypeOther, zones, inci, properties, madeIn, productUrl,
 *               photoFront?, photoInci? }]   (photo* = clé de fichier)
 *   file_<clé> : photo (déjà compressée). Une photo partagée par plusieurs
 *               produits (bouton « Dupliquer ») n'est envoyée qu'une fois :
 *               son chemin est déterministe, `brand-submissions/<batchId>/<clé>`.
 *
 * RIEN n'est noté ni publié ici : chaque produit devient une fiche `pending`
 * de `cosme_check.brand_product_submissions`. Vérification, note et mail
 * « produit référencé » se font en interne (admin, Retours > Marques).
 */
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseService } from "@/lib/supabase";
import { checkRateLimitShared } from "@/lib/ratelimit";
import { getTrustedIp } from "@/lib/clientIp";
import {
  MAX_PRODUCTS_PER_BATCH,
  MAX_PRODUCTS_PER_REQUEST,
  PHOTO_KEY_RE,
  validateBrandContact,
  validateBrandSubmission,
  type BrandSubmission,
} from "@/lib/brands/submission";
import { notifyTeam, sendMail } from "@/lib/mail";
import { brandAckEmail, brandTeamEmail, type BrandProductForEmail } from "@/lib/emails/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "cosmetwiki-products";
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const PHOTO_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProductIn = Record<string, unknown> & { photoFront?: unknown; photoInci?: unknown };

function adminUrl(): string | null {
  const base = (process.env.ADMIN_APP_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/feedback/brands` : null;
}

function bad(error: string, extra: Record<string, unknown> = {}, status = 400) {
  return NextResponse.json({ error, ...extra }, { status });
}

export async function POST(req: NextRequest) {
  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return bad("Requête invalide.");
  }

  const hp = fd.get("hp");
  if (typeof hp === "string" && hp.length > 0) return bad("Forbidden", {}, 403);

  const ip = getTrustedIp(req.headers);
  const rate = await checkRateLimitShared(`brand-submit:${ip}`, 30, 3600);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trop d'envois en peu de temps. Réessayez dans une heure." },
      { status: 429, headers: { "Retry-After": String(Math.max(60, Math.ceil(rate.retryAfterMs / 1000))) } },
    );
  }

  const text = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : undefined;
  };
  const contact = { brand: text("brand"), contactEmail: text("contactEmail"), contactName: text("contactName") };
  const c = validateBrandContact(contact);
  if (!c.ok) return bad(c.error, { field: c.field, step: "brand" });
  if (text("certify") !== "on") return bad("Cochez la case pour confirmer.", { field: "certify" });

  const batchId = text("batchId") ?? "";
  if (!UUID_RE.test(batchId)) return bad("Envoi invalide.");
  const isFinal = text("final") === "1";

  let productsIn: ProductIn[];
  try {
    productsIn = JSON.parse(text("products") ?? "[]") as ProductIn[];
  } catch {
    return bad("Produits illisibles.");
  }
  if (!Array.isArray(productsIn) || productsIn.length > MAX_PRODUCTS_PER_REQUEST) return bad("Envoi invalide.");
  if (productsIn.length === 0 && !isFinal) return bad("Aucun produit.");

  // Validation complète AVANT toute écriture (même code que le navigateur).
  const products: { data: BrandSubmission; front: string | null; inci: string | null }[] = [];
  for (const [index, p] of productsIn.entries()) {
    const r = validateBrandSubmission({ ...p, ...contact, certify: "on" });
    if (!r.ok) return bad(r.error, { field: r.field, index });
    const key = (v: unknown) => (typeof v === "string" && PHOTO_KEY_RE.test(v) ? v : null);
    products.push({ data: r.data, front: key(p.photoFront), inci: key(p.photoInci) });
  }

  const svc = supabaseService();
  const table = () => svc.schema("cosme_check").from("brand_product_submissions");

  const { count: already } = await table().select("id", { count: "exact", head: true }).eq("batch_id", batchId);
  if ((already ?? 0) + products.length > MAX_PRODUCTS_PER_BATCH) {
    return bad(`${MAX_PRODUCTS_PER_BATCH} produits maximum par envoi. Envoyez le reste ensuite.`);
  }

  // Photos de ce paquet : un fichier par clé, chemin déterministe dans le dossier de l'envoi.
  const pathOf = new Map<string, string>();
  for (const [name, value] of fd.entries()) {
    if (!name.startsWith("file_") || typeof value === "string") continue;
    const key = name.slice(5);
    if (!PHOTO_KEY_RE.test(key) || value.size === 0) continue;
    const ext = PHOTO_EXT[value.type];
    if (!ext) return bad("Photo : formats acceptés JPG, PNG ou WebP.");
    if (value.size > MAX_PHOTO_BYTES) return bad("Photo trop lourde (3 Mo maximum).");
    const path = `brand-submissions/${batchId}/${key}.${ext}`;
    const { error } = await svc.storage
      .from(BUCKET)
      .upload(path, Buffer.from(await value.arrayBuffer()), { contentType: value.type, upsert: true });
    if (error) console.warn("[marques] upload photo échoué", error.message);
    else pathOf.set(key, path);
  }
  // Photo envoyée dans un paquet précédent du même envoi (produit dupliqué) :
  // on la retrouve dans le dossier de l'envoi.
  const missing = products.some((p) => [p.front, p.inci].some((k) => k && !pathOf.has(k)));
  if (missing) {
    const { data: files } = await svc.storage.from(BUCKET).list(`brand-submissions/${batchId}`, { limit: 200 });
    for (const f of files ?? []) {
      const key = f.name.replace(/\.[a-z]+$/, "");
      if (!pathOf.has(key)) pathOf.set(key, `brand-submissions/${batchId}/${f.name}`);
    }
  }
  const resolvePhoto = (key: string | null) => (key ? (pathOf.get(key) ?? null) : null);

  if (products.length > 0) {
    const { error: insErr } = await table().insert(
      products.map(({ data, front, inci }) => ({
        id: randomUUID(),
        batch_id: batchId,
        brand: data.brand,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        product_name: data.productName,
        ean: data.ean,
        volume: data.volume,
        product_type: data.productType,
        zones: data.zones,
        inci: data.inci,
        properties: data.properties,
        made_in: data.madeIn,
        product_url: data.productUrl,
        photo_front_path: resolvePhoto(front),
        photo_inci_path: resolvePhoto(inci),
        submitter_ip: ip,
      })),
    );
    if (insErr) {
      console.error("[marques] insertion échouée", insErr.message);
      return bad("L'envoi a échoué. Réessayez dans un instant.", {}, 500);
    }
  }

  if (!isFinal) return NextResponse.json({ ok: true, saved: products.length });

  // Dernier paquet : UN mail équipe et UN accusé pour tout l'envoi.
  const { data: rows } = await table()
    .select("id, product_name, ean, volume, product_type, zones, inci, properties, made_in, product_url, photo_front_path, photo_inci_path")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true });
  const all = rows ?? [];
  if (all.length === 0) return bad("Aucun produit reçu.");

  const email = contact.contactEmail!.trim().toLowerCase();
  const { count: earlier } = await table()
    .select("id", { count: "exact", head: true })
    .ilike("contact_email", email)
    .neq("batch_id", batchId);

  const publicUrl = (p: string) => svc.storage.from(BUCKET).getPublicUrl(p).data.publicUrl;
  const forEmail: BrandProductForEmail[] = all.map((r) => ({
    id: r.id,
    productName: r.product_name,
    ean: r.ean,
    volume: r.volume,
    productType: r.product_type,
    zones: r.zones ?? [],
    inci: r.inci,
    properties: r.properties,
    madeIn: r.made_in,
    productUrl: r.product_url,
    photoUrls: [
      ...(r.photo_front_path ? [{ label: "Photo de face", url: publicUrl(r.photo_front_path) }] : []),
      ...(r.photo_inci_path ? [{ label: "Photo des ingrédients", url: publicUrl(r.photo_inci_path) }] : []),
    ],
  }));

  const contactForEmail = {
    brand: contact.brand!.trim(),
    contactName: contact.contactName?.trim() || null,
    contactEmail: email,
  };
  const team = brandTeamEmail(contactForEmail, forEmail, { adminUrl: adminUrl(), earlierFromBrand: earlier ?? 0 });
  const ack = brandAckEmail(contactForEmail, forEmail.map((p) => p.productName));
  // Attendus : sur Vercel la fonction est gelée dès la réponse envoyée.
  await Promise.all([
    notifyTeam({
      subject: team.subject,
      html: team.html,
      replyTo: { email, name: contactForEmail.contactName },
      tags: ["marques-demande"],
    }),
    sendMail({ to: [{ email, name: contactForEmail.contactName }], subject: ack.subject, html: ack.html, tags: ["marques-accuse"] }),
  ]);

  return NextResponse.json({ ok: true, saved: products.length, total: all.length });
}
