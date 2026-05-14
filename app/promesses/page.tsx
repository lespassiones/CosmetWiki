import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { GLASS_CARD, GLASS_CARD_HOVER, GLASS_PILL_DARK } from "@/lib/ui/glass";
import type { CoherenceResult } from "@/lib/coherence/types";

export const metadata = { title: "Promesses · Cosme Check" };

type Row = {
  id: string;
  analysis_id: string;
  description: string;
  result_json: CoherenceResult;
  created_at: string;
  analyses?: { name: string | null; product_label: string | null } | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PromessesPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/promesses");

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data, error } = await sb
    .schema("cosme_check")
    .from("coherence_analyses")
    .select("id, analysis_id, description, result_json, created_at, analyses(name, product_label)")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (error ? [] : (data ?? [])) as unknown as Row[];

  return (
    <div className="mx-auto max-w-4xl px-5 lg:px-8 py-8 lg:py-12">
      <h1 className="text-2xl lg:text-3xl font-bold mb-2">Promesses du produit vs Formule</h1>

      <div className="mt-3 -mx-5 h-[2px] bg-black/30 lg:mx-0 lg:mt-4 lg:h-px lg:bg-black/[0.08]" />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-[#6B7280]">
          {rows.length === 0
            ? "Aucune analyse de cohérence pour le moment."
            : `${rows.length} analyse${rows.length > 1 ? "s" : ""} de cohérence sauvegardée${rows.length > 1 ? "s" : ""}.`}
        </p>
        <Link
          href="/promesses/nouvelle"
          className={`${GLASS_PILL_DARK} text-[12px] font-semibold px-3 py-2`}
        >
          + Nouvelle analyse
        </Link>
      </div>

      {rows.length === 0 ? (
        <article className={`${GLASS_CARD} p-6 lg:p-8 mt-6 text-center`}>
          <p className="text-[14px] text-[#6B7280] mb-4">
            Compare les promesses marketing d&apos;un produit avec sa formule
            réelle. On te dit ce qui est tenu et ce qui relève du marketing.
          </p>
          <Link
            href="/promesses/nouvelle"
            className={`${GLASS_PILL_DARK} inline-block px-5 py-2.5 text-sm font-semibold`}
          >
            Lancer ma première analyse
          </Link>
        </article>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => {
            const productName
              = r.analyses?.product_label
              ?? r.analyses?.name
              ?? `Analyse du ${formatDate(r.created_at)}`;
            const m = r.result_json.metrics;
            return (
              <li key={r.id}>
                <Link
                  href={`/promesses/${r.id}`}
                  className={`${GLASS_CARD} ${GLASS_CARD_HOVER} flex items-center gap-4 p-4`}
                >
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <span className="text-base font-bold leading-none">
                      {m.tenuePct}
                    </span>
                    <span className="text-[10px] mt-0.5">% tenu</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[#111111] truncate">{productName}</div>
                    <div className="text-[12px] text-[#6B7280]">
                      {m.tenueCount} / {m.totalPromises} promesse
                      {m.totalPromises > 1 ? "s" : ""} tenue
                      {m.tenueCount > 1 ? "s" : ""} · indice marketing {m.marketingIndex} %
                      <span className="mx-1">·</span>
                      {formatDate(r.created_at)}
                    </div>
                  </div>
                  <svg
                    className="h-4 w-4 text-[#9CA3AF]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
