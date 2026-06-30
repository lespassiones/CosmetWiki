"use client";

import { useEffect, useState } from "react";
import { AnalyseResultPanel } from "./AnalyseResultPanel";
import { resolveAndCacheProductImage } from "@/lib/storage/productImageCache";
import { supabaseAnon } from "@/lib/supabase";

type AnalyseResultPanelProps = React.ComponentProps<typeof AnalyseResultPanel>;
type Props = Omit<AnalyseResultPanelProps, "productImageUrl">;

export function AnalyseResultPanelClient({
  analysisId,
  brand,
  productLabel,
  ean,
  ...props
}: Props & {
  analysisId?: string | null
  brand?: string | null
  productLabel?: string | null
  ean?: string | null
}) {
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [catalogCategory, setCatalogCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) {
      return;
    }

    let cancelled = false;
    void resolveAndCacheProductImage(analysisId, ean, brand, productLabel).then((url) => {
      if (!cancelled) {
        setProductImageUrl(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [analysisId, ean, brand, productLabel]);

  // Résout la catégorie depuis le catalogue si elle manque
  useEffect(() => {
    if (props.result?.catalogCategory) {
      return;
    }

    let cancelled = false;

    // Prioritize EAN-exact lookup (fastest = PK lookup, deterministic).
    // cosme_check_search_catalog ne matche PAS l'EAN (recherche texte brand+name).
    const searchEAN = async () => {
      if (ean) {
        try {
          const { data, error } = await supabaseAnon()
            .rpc("cosme_check_get_product_by_ean", { p_ean: ean });

          if (!cancelled && !error && data && Array.isArray(data) && data.length > 0) {
            const row = data[0] as { category?: string };
            if (row?.category) {
              setCatalogCategory(row.category);
              return true;
            }
          }
        } catch {
          // Fall through to brand+name search
        }
      }
      return false;
    };

    // Fallback to brand + name search
    const searchBrandName = async () => {
      if (!brand || !productLabel) return;

      try {
        const { data, error } = await supabaseAnon()
          .rpc("cosme_check_search_catalog", { p_query: `${brand} ${productLabel}`, p_limit: 1 });

        if (!cancelled && !error && data && Array.isArray(data) && data.length > 0) {
          const row = data[0] as { category?: string };
          if (row?.category) {
            setCatalogCategory(row.category);
          }
        }
      } catch {
        // Ignore search errors
      }
    };

    (async () => {
      const found = await searchEAN();
      if (!found && !cancelled) {
        await searchBrandName();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ean, brand, productLabel, props.result?.catalogCategory]);

  // Construct productSource from brand if provided
  const productSource = brand ? { source: "scan", sourceUrl: null, brand } : null;

  // Merge catalogCategory from resolution if result doesn't have it
  const resultWithCategory = {
    ...props.result,
    catalogCategory: props.result?.catalogCategory || catalogCategory,
  };

  // Render immediately even if still loading - image will appear when ready
  return (
    <AnalyseResultPanel
      {...props}
      result={resultWithCategory}
      analysisId={analysisId}
      brand={brand}
      productLabel={productLabel}
      ean={ean}
      productImageUrl={productImageUrl}
      productSource={productSource}
    />
  );
}
