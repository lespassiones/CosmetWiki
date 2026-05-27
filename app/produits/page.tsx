import type { Metadata } from "next";
import { Suspense } from "react";
import { supabaseAnon } from "@/lib/supabase";
import { ProductBrowsePage } from "@/components/browse/ProductBrowsePage";
import type { CategoryCount } from "@/components/browse/ProductBrowsePage";

export const metadata: Metadata = {
  title: "Parcourir les produits · Cosme Check",
  description: "Explorez plus de 48 000 produits cosmétiques par catégorie ou recherchez par nom.",
};

export const revalidate = 3600;

async function fetchCategoryCounts(): Promise<CategoryCount[]> {
  try {
    const { data, error } = await supabaseAnon().rpc("cosme_check_get_category_counts");
    if (error || !data) return [];
    return (data as CategoryCount[]).filter((r) => r.cnt >= 10);
  } catch {
    return [];
  }
}

export default async function ProduitsPage() {
  const counts = await fetchCategoryCounts();
  return (
    <Suspense>
      <ProductBrowsePage categoryCounts={counts} />
    </Suspense>
  );
}
