import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductBrowsePage } from "@/components/browse/ProductBrowsePage";

export const metadata: Metadata = {
  title: "Parcourir les produits · Cosme Check",
  description: "Explorez plus de 48 000 produits cosmétiques par catégorie ou recherchez par nom.",
};

export default function ProduitsPage() {
  return (
    <Suspense>
      <ProductBrowsePage />
    </Suspense>
  );
}
