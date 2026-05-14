import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { GLASS_CARD, GLASS_CARD_HOVER, GLASS_PILL_DARK } from "@/lib/ui/glass";
import { computeMetrics } from "@/lib/coherence/engine";
import { CoherenceItemActions } from "@/components/coherence/CoherenceItemActions";
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
            // Recompute on read so analyses saved before the metrics formula
            // changed are still displayed with the current logic.
            const m = computeMetrics(r.result_json.promises);
            const supported = m.tenueCount + m.partielleCount;
            return (
              <li key={r.id} className="relative">
                <Link
                  href={`/promesses/${r.id}`}
                  className={`${GLASS_CARD} ${GLASS_CARD_HOVER} flex items-center gap-4 p-4 pr-16`}
                >
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <span className="text-base font-bold leading-none">
                      {m.tenuePct}
                    </span>
                    <span className="text-[10px] mt-0.5">%</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[#111111] truncate">{productName}</div>
                    <div className="text-[12px] text-[#6B7280]">
                      {supported} / {m.totalPromises} promesse
                      {m.totalPromises > 1 ? "s" : ""} soutenue
                      {supported > 1 ? "s" : ""} · indice marketing {m.marketingIndex} %
                      <span className="mx-1">·</span>
                      {formatDate(r.created_at)}
                    </div>
                  </div>
                </Link>
                {/* The 3-dot menu sits in absolute on top of the row so the
                    <Link> wrapper stays clickable everywhere else. */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
                  <CoherenceItemActions id={r.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
