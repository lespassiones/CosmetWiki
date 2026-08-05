import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import type { BlobCounts } from "@/components/blob/IngredientBlob";
import { RoutineProductCard } from "@/components/routine/RoutineProductCard";

export const metadata = { title: "Mes favoris · Cosme Check" };
export const dynamic = "force-dynamic";

/**
 * Page « Mes favoris » (twin web de app/routine/favoris.tsx mobile).
 *
 * Liste toutes les analyses marquées favori (colonne analyses.favori), quelle
 * que soit leur source : marque-page depuis l'historique OU « Garder en favori »
 * depuis le deck de suggestions. Même carte épurée que la routine soin (photo +
 * nom + marque + donut) ; le tap ouvre l'analyse (/history/[id]).
 */
export default async function FavorisPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/routine/favoris");

  return (
    <Suspense
      fallback={
        <div className="neu-page mx-auto max-w-3xl px-5 lg:px-8 pt-4 pb-8 lg:py-12" aria-busy>
          <div className="h-6 w-40 rounded-xl bg-[#c5ccd6]/50 animate-pulse" />
          <div className="mt-6 space-y-3">
            <div className="neu h-20 animate-pulse" />
            <div className="neu h-20 animate-pulse" />
            <div className="neu h-20 animate-pulse" />
          </div>
        </div>
      }
    >
      <FavorisContent />
    </Suspense>
  );
}

async function FavorisContent() {
  const user = await getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);

  const { data } = await sb
    .schema("cosme_check")
    .from("analyses")
    .select("id, name, product_label, brand, score, result_json, ean")
    .eq("user_id", user.id)
    .eq("favori", true)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as unknown as {
    id: string;
    name: string | null;
    product_label: string | null;
    brand: string | null;
    score: number | null;
    result_json: AnalyseResponse;
    ean: string | null;
  }[];

  // Résolution image en LOT (EAN = source de vérité), une seule requête catalog.
  const eans = Array.from(
    new Set(rows.map((r) => r.ean).filter((e): e is string => Boolean(e))),
  );
  const imageByEan = new Map<string, string>();
  if (eans.length > 0) {
    const { data: catRows } = await sb
      .schema("cosme_check")
      .from("catalog")
      .select("ean, image_url")
      .in("ean", eans);
    for (const c of (catRows ?? []) as { ean: string; image_url: string | null }[]) {
      if (c.image_url) imageByEan.set(c.ean, c.image_url);
    }
  }

  return (
    <div className="neu-page mx-auto max-w-3xl px-5 lg:px-8 pt-4 pb-8 lg:py-12">
      <header>
        <Link
          href="/routine"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#6B7280] hover:text-[#111]"
        >
          <span aria-hidden>‹</span> Retour à ma routine
        </Link>
        <h1 className="mt-3 text-2xl lg:text-3xl font-bold">Mes favoris</h1>
        <div className="mt-3 -mx-5 h-px bg-[#c5ccd6] lg:mx-0" />
      </header>

      {rows.length === 0 ? (
        <div className="mt-8 neu p-8 text-center">
          <p className="text-sm text-[#6B7280]">
            Aucun favori pour l&apos;instant. Mets des produits en favori depuis l&apos;historique
            (marque-page) ou en gardant une alternative proposée.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => {
            const c = r.result_json?.counts;
            const counts: BlobCounts | null = c
              ? { vert: c.vert, jaune: c.jaune, orange: c.orange, rouge: c.rouge }
              : null;
            return (
              <li key={r.id}>
                <RoutineProductCard
                  routineItemId={r.id}
                  href={`/history/${r.id}`}
                  name={r.product_label ?? r.name ?? "Produit"}
                  brand={r.brand}
                  counts={counts}
                  imageUrl={r.ean ? imageByEan.get(r.ean) ?? null : null}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
