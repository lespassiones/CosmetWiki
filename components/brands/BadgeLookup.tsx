"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseAnon } from "@/lib/supabase";
import { buildBadgeSvg, BADGE_HEIGHT, BADGE_WIDTH } from "@/lib/brands/badgeSvg";
import { STAR_LABEL, starsForProduct, type StarCount } from "@/lib/brands/stars";
import { LEGAL } from "@/lib/legal";

/**
 * Badge d'un produit, retrouvé par son code-barres. Une seule lecture par clé
 * primaire (`catalog.ean`), faite par le navigateur avec la clé publique :
 * aucune fonction serveur, aucun calcul. La page sert aussi de page de
 * vérification : le badge affiché par une marque renvoie ici (?ean=...).
 */

type Product = {
  ean: string;
  brand: string | null;
  name: string | null;
  image_url: string | null;
  score: number | null;
  count_orange: number | null;
  count_rouge: number | null;
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "notFound" }
  | { kind: "error" }
  | { kind: "found"; product: Product; stars: StarCount | null };

function eanFromLocation(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("ean")?.trim() ?? "";
}

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function svgToPng(svg: string): Promise<Blob | null> {
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("svg"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = BADGE_WIDTH * 2;
    canvas.height = BADGE_HEIGHT * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function BadgeLookup() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [copied, setCopied] = useState(false);

  async function lookup(raw: string) {
    const ean = raw.trim().startsWith("cc-") ? raw.trim() : raw.replace(/\D/g, "");
    if (!ean) return;
    setState({ kind: "loading" });
    setCopied(false);
    const { data, error } = await supabaseAnon()
      .schema("cosme_check")
      .from("catalog")
      .select("ean, brand, name, image_url, score, count_orange, count_rouge")
      .eq("ean", ean)
      .maybeSingle();
    if (error) return setState({ kind: "error" });
    if (!data) return setState({ kind: "notFound" });
    const product = data as Product;
    setState({ kind: "found", product, stars: starsForProduct(product) });
    const url = new URL(window.location.href);
    url.searchParams.set("ean", product.ean);
    window.history.replaceState(null, "", url.toString());
  }

  useEffect(() => {
    const ean = eanFromLocation();
    if (ean) {
      setQuery(ean);
      void lookup(ean);
    }
  }, []);

  const found = state.kind === "found" ? state : null;
  const svg = useMemo(
    () =>
      found?.stars
        ? buildBadgeSvg({ stars: found.stars, brand: found.product.brand, productName: found.product.name })
        : null,
    [found],
  );
  const pageUrl = found ? `${LEGAL.siteUrl}/marques/badge?ean=${encodeURIComponent(found.product.ean)}` : "";
  const embed =
    found?.stars != null
      ? `<a href="${pageUrl}" target="_blank" rel="noopener"><img src="${LEGAL.siteUrl}/badges/cosme-check-${found.stars}-etoiles.png" width="330" alt="Noté ${found.stars} étoiles sur 5 sur Cosme Check"></a>`
      : "";
  const fileBase = found ? `cosme-check-${found.product.ean}` : "badge";

  return (
    <div className="space-y-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(query);
        }}
        className="flex gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          inputMode="numeric"
          placeholder="Code-barres du produit"
          aria-label="Code-barres du produit"
          className="min-w-0 flex-1 rounded-full border border-[#E5E7EB] bg-white px-5 py-3.5 text-[15px] outline-none transition focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
        />
        <button
          type="submit"
          disabled={state.kind === "loading"}
          className="rounded-full bg-[#F43F5E] px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#E11D48] disabled:opacity-60"
        >
          {state.kind === "loading" ? "…" : "Voir"}
        </button>
      </form>

      {state.kind === "notFound" ? (
        <p className="rounded-2xl bg-[#FAFAFA] p-5 text-[15px] text-ink-muted ring-1 ring-black/[0.05]">
          Ce produit n&apos;est pas encore référencé.{" "}
          <a href="/marques#marques-formulaire" className="font-medium text-[#E11D48] underline">
            Proposez-le
          </a>
          .
        </p>
      ) : null}
      {state.kind === "error" ? (
        <p className="rounded-2xl bg-rose-50 p-5 text-[15px] text-rose-700 ring-1 ring-rose-100">
          Recherche impossible pour le moment. Réessayez dans un instant.
        </p>
      ) : null}

      {found ? (
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_24px_-12px_rgba(17,17,17,0.08)] ring-1 ring-black/[0.05] sm:p-8">
          <div className="flex items-center gap-4">
            {found.product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={found.product.image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-contain ring-1 ring-black/[0.05]" />
            ) : null}
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-ink-subtle">{found.product.brand}</p>
              <p className="text-[17px] font-bold leading-snug text-ink">{found.product.name}</p>
              <p className="mt-0.5 text-[13px] text-ink-subtle">
                {found.stars ? `${found.stars}/5 · ${STAR_LABEL[found.stars]}` : "Pas encore noté"}
              </p>
            </div>
          </div>

          {svg ? (
            <>
              <div
                className="mt-6 overflow-hidden [&>svg]:h-auto [&>svg]:w-full [&>svg]:max-w-[440px]"
                // SVG construit par buildBadgeSvg : tout texte variable y est échappé.
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const png = await svgToPng(svg);
                    if (png) download(`${fileBase}.png`, png);
                  }}
                  className="rounded-full bg-[#111111] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-black"
                >
                  Télécharger en PNG
                </button>
                <button
                  type="button"
                  onClick={() => download(`${fileBase}.svg`, new Blob([svg], { type: "image/svg+xml" }))}
                  className="rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-ink ring-1 ring-black/[0.1] transition hover:bg-black/[0.03]"
                >
                  SVG
                </button>
              </div>

              <div className="mt-7">
                <p className="text-[13px] font-medium text-ink-muted">Code à coller sur votre site</p>
                <textarea
                  readOnly
                  value={embed}
                  rows={3}
                  onFocus={(e) => e.currentTarget.select()}
                  className="mt-1.5 w-full resize-none rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 font-mono text-[12px] text-ink-muted"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(embed).catch(() => undefined);
                    setCopied(true);
                  }}
                  className="mt-1 text-[13px] font-medium text-[#E11D48] underline"
                >
                  {copied ? "Copié" : "Copier le code"}
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
