import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getProfile, getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import type { Frequency, RoutineProduct } from "@/lib/routine/engine";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { readUserRestrictions } from "@/lib/restrictions/types";
import { loadIngredientFamilies } from "@/lib/restrictions/families";
import { selectAtRiskProducts } from "@/lib/routine/atRisk";
import { SuggestionsPageClient } from "@/components/routine/SuggestionsPageClient";
import { getAppConfig } from "@/lib/appConfig";

export const metadata = { title: "Suggestions intelligentes · Cosme Check" };
export const dynamic = "force-dynamic";

/**
 * Dedicated "Suggestions intelligentes" page. Recomputes the at-risk set from
 * the user's routine (same logic as /routine) and hands it to the client, which
 * fetches the best catalog alternative per product and renders them as a normal,
 * top-anchored list. No at-risk product → back to the routine page.
 */
export default async function SuggestionsPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in");

  // Feature flag (admin Paramètres) : suggestions désactivées → retour routine.
  const cfg = await getAppConfig();
  if (!cfg.flag_suggestions) redirect("/routine");

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const [{ data }, profile, families] = await Promise.all([
    sb
      .schema("cosme_check")
      .from("routine_items")
      .select(
        "frequency, analyses(id, name, product_label, score, result_json, ean, category_precise)",
      )
      .order("added_at", { ascending: false })
      .limit(100),
    getProfile(),
    loadIngredientFamilies(),
  ]);

  const rows = (data ?? []) as unknown as {
    frequency: Frequency;
    analyses: {
      id: string;
      name: string | null;
      product_label: string | null;
      score: number | null;
      result_json: AnalyseResponse;
      ean: string | null;
      category_precise: string | null;
    } | null;
  }[];

  const products: RoutineProduct[] = rows
    .filter((it) => it.analyses)
    .map((it) => ({
      id: it.analyses!.id,
      name: it.analyses!.product_label ?? it.analyses!.name ?? "Analyse",
      frequency: it.frequency,
      score: it.analyses!.score,
      result: it.analyses!.result_json,
      ean: it.analyses!.ean,
      categoryPrecise: it.analyses!.category_precise,
    }));

  // Restrictions AVANT la sélection : un produit vert mais restreint doit
  // compter comme « à optimiser » (parité mobile).
  const restrictions = readUserRestrictions(profile?.preferences ?? null);
  const atRiskProducts = selectAtRiskProducts(products, { restrictions, families });
  if (atRiskProducts.length === 0) redirect("/routine");

  // Empreinte des restrictions (familles + ingrédients) : intégrée à la clé de
  // cache côté client → modifier ses restrictions invalide les suggestions cachées.
  const restrictionsSig = [
    [...restrictions.families].sort().join(","),
    restrictions.ingredients
      .map((i) => i.name)
      .sort()
      .join(","),
  ].join(";");

  return <SuggestionsPageClient products={atRiskProducts} restrictionsSig={restrictionsSig} />;
}
