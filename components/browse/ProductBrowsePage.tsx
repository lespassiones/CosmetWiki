"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CATEGORY_EMOJI,
  getChildrenAtPath,
  isLeafPath,
  pathToSlug,
  type CategoryNode,
} from "@/lib/categories";

type BrowseProduct = {
  ean: string;
  brand: string | null;
  name: string;
  image_url: string | null;
  score: number | null;
  score_label: string | null;
  score_tone: string | null;
  ingredients_text: string | null;
};

type BrowseState = {
  path: string[];
  products: BrowseProduct[];
  offset: number;
  hasMore: boolean;
};

const PENDING_SOURCE_KEY = "cw:pendingProductSource";
const PENDING_INCI_KEY = "cw:pendingInci";
const BROWSE_STATE_KEY = "cw:browseState";

function scoreVisual(score: number): { bg: string; fg: string; icon: React.ReactNode } {
  if (score >= 17) return { bg: "bg-emerald-100", fg: "text-emerald-600", icon: <HeartSvg /> };
  if (score >= 13) return { bg: "bg-emerald-100", fg: "text-emerald-600", icon: <LeafSvg /> };
  if (score >= 9)  return { bg: "bg-amber-100",   fg: "text-amber-600",   icon: <EyeSvg /> };
  if (score >= 5)  return { bg: "bg-orange-100",  fg: "text-orange-600",  icon: <TriangleSvg /> };
  return                  { bg: "bg-rose-100",    fg: "text-rose-600",    icon: <OctagonSvg /> };
}

export function ProductBrowsePage() {
  const router = useRouter();
  // Destination du bouton retour : la page d'origine (?from=…) si elle est un
  // chemin interne, sinon l'accueil. Permet d'ouvrir la recherche depuis
  // /promesses/choisir et d'y revenir.
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const backHref = fromParam && fromParam.startsWith("/") ? fromParam : "/";
  const [path, setPath] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BrowseProduct[]>([]);
  const [browseProducts, setBrowseProducts] = useState<BrowseProduct[]>([]);
  const [browseOffset, setBrowseOffset] = useState(0);
  const [browseHasMore, setBrowseHasMore] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseLoadingMore, setBrowseLoadingMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOffset, setSearchOffset] = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Quand true, le useEffect sur `path` saute le fetch (restoration depuis sessionStorage)
  const skipNextPathEffectRef = useRef(false);

  const BROWSE_PAGE = 24;
  const SEARCH_PAGE = 50;

  // Restauration de l'état browse depuis sessionStorage (retour depuis /analyse)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(BROWSE_STATE_KEY);
      if (!saved) return;
      const state = JSON.parse(saved) as BrowseState;
      skipNextPathEffectRef.current = true;
      setPath(state.path);
      setBrowseProducts(state.products);
      setBrowseOffset(state.offset);
      setBrowseHasMore(state.hasMore);
    } catch {}
  }, []);

  // Debounce search query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setSearchResults([]); // Reset results on new query
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Fetch search results (paginated, 50 per page)
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSearchResults([]);
      setSearchOffset(0);
      setSearchHasMore(false);
      return;
    }
    setSearchLoading(true);
    fetch(`/api/catalog-search?q=${encodeURIComponent(debouncedQuery)}&limit=${SEARCH_PAGE}&offset=0`)
      .then((r) => r.json() as Promise<{ products: BrowseProduct[] }>)
      .then((data) => {
        const products = data.products ?? [];
        setSearchResults(products);
        setSearchHasMore(products.length === SEARCH_PAGE);
        setSearchOffset(SEARCH_PAGE);
      })
      .catch(() => {
        setSearchResults([]);
        setSearchHasMore(false);
      })
      .finally(() => setSearchLoading(false));
  }, [debouncedQuery]);

  const loadMoreSearch = useCallback(() => {
    if (debouncedQuery.length < 2 || searchLoadingMore) return;
    setSearchLoadingMore(true);
    fetch(`/api/catalog-search?q=${encodeURIComponent(debouncedQuery)}&limit=${SEARCH_PAGE}&offset=${searchOffset}`)
      .then((r) => r.json() as Promise<{ products: BrowseProduct[] }>)
      .then((data) => {
        const products = data.products ?? [];
        setSearchResults((prev) => {
          const seen = new Set(prev.map((p) => p.ean));
          return [...prev, ...products.filter((p) => !seen.has(p.ean))];
        });
        setSearchHasMore(products.length === SEARCH_PAGE);
        setSearchOffset((prev) => prev + SEARCH_PAGE);
      })
      .catch(() => {})
      .finally(() => setSearchLoadingMore(false));
  }, [debouncedQuery, searchOffset, searchLoadingMore]);

  // Fetch products only when path reaches a leaf.
  // Skipped once after sessionStorage restoration to avoid re-fetching already loaded products.
  useEffect(() => {
    if (skipNextPathEffectRef.current) {
      skipNextPathEffectRef.current = false;
      return;
    }
    if (!isLeafPath(path)) {
      setBrowseProducts([]);
      setBrowseOffset(0);
      setBrowseHasMore(false);
      // L'utilisateur a navigué hors de la feuille — on efface l'état sauvegardé
      try { sessionStorage.removeItem(BROWSE_STATE_KEY); } catch {}
      return;
    }
    const slug = pathToSlug(path);
    setBrowseLoading(true);
    setBrowseProducts([]);
    setBrowseOffset(0);
    fetch(`/api/browse-category-slug?slug=${encodeURIComponent(slug)}&limit=${BROWSE_PAGE}&offset=0`)
      .then((r) => r.json() as Promise<{ products: BrowseProduct[] }>)
      .then((data) => {
        const products = data.products ?? [];
        setBrowseProducts(products);
        setBrowseHasMore(products.length === BROWSE_PAGE);
        setBrowseOffset(BROWSE_PAGE);
      })
      .catch(() => setBrowseProducts([]))
      .finally(() => setBrowseLoading(false));
  }, [path]);

  const loadMoreBrowse = useCallback(() => {
    if (!isLeafPath(path) || browseLoadingMore) return;
    const slug = pathToSlug(path);
    setBrowseLoadingMore(true);
    fetch(`/api/browse-category-slug?slug=${encodeURIComponent(slug)}&limit=${BROWSE_PAGE}&offset=${browseOffset}`)
      .then((r) => r.json() as Promise<{ products: BrowseProduct[] }>)
      .then((data) => {
        const products = data.products ?? [];
        setBrowseProducts((prev) => {
          const seen = new Set(prev.map((p) => p.ean));
          return [...prev, ...products.filter((p) => !seen.has(p.ean))];
        });
        setBrowseHasMore(products.length === BROWSE_PAGE);
        setBrowseOffset((prev) => prev + BROWSE_PAGE);
      })
      .catch(() => {})
      .finally(() => setBrowseLoadingMore(false));
  }, [path, browseOffset, browseLoadingMore]);

  function tapNode(node: CategoryNode) {
    setPath((prev) => [...prev, node.name]);
  }

  function handleProductClick(p: BrowseProduct) {
    if (p.ingredients_text) {
      // Sauvegarde la position de navigation pour le retour arrière
      try {
        const state: BrowseState = {
          path,
          products: browseProducts,
          offset: browseOffset,
          hasMore: browseHasMore,
        };
        sessionStorage.setItem(BROWSE_STATE_KEY, JSON.stringify(state));
      } catch {}
      sessionStorage.setItem(PENDING_SOURCE_KEY, JSON.stringify({
        source: "catalog",
        sourceUrl: null,
        brand: p.brand,
        productName: p.name,
        ean: p.ean,
      }));
      sessionStorage.setItem(PENDING_INCI_KEY, p.ingredients_text);
      // slice(0, 6000) : aligné sur TOUS les autres points d'entrée vers /analyse
      // (AlternativesCarousel, AdvisorChat, SuggestionsPageClient, ScanSheet).
      // L'ancien slice(0, 200) tronquait l'INCI en plein mot → analyses à 9
      // ingrédients "tout vert" (bug résolu le 14 juil 2026). Le sessionStorage
      // ci-dessus porte de toute façon la liste COMPLÈTE (source autoritaire).
      router.push("/analyse?inci=" + encodeURIComponent(p.ingredients_text.slice(0, 6000)));
    }
  }

  const showSearch = debouncedQuery.length >= 2;
  const showBrowse = !showSearch;
  const children = getChildrenAtPath(path);
  const isLeaf = isLeafPath(path);
  const currentName = path.length > 0 ? path[path.length - 1] : null;

  // ── Infinite scroll : charge la page suivante automatiquement quand le
  //    sentinel entre dans le viewport (remplace le bouton "Voir plus").
  //    rootMargin 400px = précharge avant d'atteindre le bas → défilement fluide.
  //    Un seul sentinel est monté à la fois (recherche XOR browse-feuille).
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const onIntersectRef = useRef<() => void>(() => {});
  onIntersectRef.current = () => {
    if (showSearch) {
      if (searchHasMore && !searchLoadingMore) loadMoreSearch();
    } else if (isLeaf) {
      if (browseHasMore && !browseLoadingMore) loadMoreBrowse();
    }
  };
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) onIntersectRef.current(); },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [showSearch, isLeaf, searchHasMore, browseHasMore]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header sticky */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-black/[0.06] px-4 py-3">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <Link
            href={backHref}
            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full hover:bg-black/[0.05] transition-colors"
            aria-label="Retour"
          >
            <svg viewBox="0 0 20 20" className="w-5 h-5 fill-[#111]" aria-hidden>
              <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
            </svg>
          </Link>
          <div className="flex-1 relative">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full h-10 rounded-full bg-[#F3F4F6] pl-10 pr-4 text-[15px] text-ink placeholder:text-ink-muted outline-none focus:ring-2 focus:ring-[#F43F5E]/30"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted"
              viewBox="0 0 20 20" fill="currentColor" aria-hidden
            >
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#F43F5E]/30 border-t-[#F43F5E] rounded-full animate-spin" aria-hidden />
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-24 pt-5">
        {/* SEARCH MODE */}
        {showSearch && (
          <div>
            {searchLoading && (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#F43F5E]/30 border-t-[#F43F5E] rounded-full animate-spin" />
              </div>
            )}
            {!searchLoading && searchResults.length === 0 && (
              <p className="text-sm text-ink-muted text-center py-12">Aucun résultat pour « {debouncedQuery} »</p>
            )}
            {!searchLoading && searchResults.length > 0 && (
              <p className="text-[12px] text-ink-muted mb-3">{searchResults.length}{searchHasMore ? "+" : ""} produit{searchResults.length > 1 ? "s" : ""}</p>
            )}
            <div className="space-y-2">
              {searchResults.map((p) => (
                <button
                  key={p.ean}
                  onClick={() => handleProductClick(p)}
                  disabled={!p.ingredients_text}
                  className="w-full flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-black/[0.06] hover:ring-[#F43F5E]/40 hover:bg-rose-50/30 transition-all text-left disabled:opacity-50"
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-11 h-11 shrink-0 rounded-lg object-contain bg-gray-50" />
                  ) : (
                    <div className="w-11 h-11 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-lg">🧴</div>
                  )}
                  <div className="min-w-0 flex-1">
                    {p.brand && <div className="text-[11px] text-ink-muted truncate">{p.brand}</div>}
                    <div className="text-[14px] font-medium text-ink truncate">{p.name}</div>
                    {!p.ingredients_text && <div className="text-[11px] text-ink-muted">Composition indisponible</div>}
                  </div>
                  {p.score != null && <ScoreBadge score={p.score} />}
                </button>
              ))}
            </div>
            {searchHasMore && (
              <div ref={loadMoreRef} className="flex justify-center items-center mt-6 h-10">
                {searchLoadingMore && (
                  <div className="w-5 h-5 border-2 border-[#F43F5E]/30 border-t-[#F43F5E] rounded-full animate-spin" />
                )}
              </div>
            )}
          </div>
        )}

        {/* BROWSE MODE */}
        {showBrowse && (
          <>
            {/* Breadcrumb dynamique */}
            {path.length > 0 && (
              <div className="flex items-center gap-2 mb-4 text-sm text-ink-muted flex-wrap">
                <button onClick={() => setPath([])} className="hover:text-ink transition-colors">
                  Catégories
                </button>
                {path.map((seg, i) => (
                  <React.Fragment key={i}>
                    <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current opacity-40 shrink-0" aria-hidden>
                      <path d="M6 3l5 5-5 5"/>
                    </svg>
                    {i < path.length - 1 ? (
                      <button
                        onClick={() => setPath(path.slice(0, i + 1))}
                        className="hover:text-ink transition-colors"
                      >
                        {seg}
                      </button>
                    ) : (
                      <span className="text-ink font-medium">{seg}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Navigation catégories / sous-catégories (nœud non-feuille) */}
            {!isLeaf && (
              <>
                {path.length === 0 && (
                  <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-muted mb-3">
                    Catégories
                  </h2>
                )}
                {path.length > 0 && currentName && (
                  <h2 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
                    {path.length === 1 && (
                      <span>{CATEGORY_EMOJI[currentName] ?? "🧴"}</span>
                    )}
                    {currentName}
                  </h2>
                )}
                <div className="space-y-2">
                  {children.map((node) => (
                    <button
                      key={node.name}
                      onClick={() => tapNode(node)}
                      className="w-full flex items-center gap-3 rounded-xl bg-white px-4 py-3.5 ring-1 ring-black/[0.06] hover:ring-[#F43F5E]/40 hover:bg-rose-50/40 transition-all text-left"
                    >
                      {path.length === 0 && (
                        <span className="text-xl leading-none">{CATEGORY_EMOJI[node.name] ?? "🧴"}</span>
                      )}
                      <span className="flex-1 text-[15px] font-medium text-ink">{node.name}</span>
                      <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0 fill-current text-ink-muted opacity-50" aria-hidden>
                        <path d="M6 3l5 5-5 5"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Grille produits (feuille) */}
            {isLeaf && (
              <>
                <h2 className="text-base font-semibold text-ink mb-3">
                  {currentName}
                  {browseProducts.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-ink-muted">
                      {browseProducts.length}{browseHasMore ? "+" : ""} produits
                    </span>
                  )}
                </h2>
                {browseLoading && (
                  <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-[#F43F5E]/30 border-t-[#F43F5E] rounded-full animate-spin" />
                  </div>
                )}
                {!browseLoading && browseProducts.length === 0 && (
                  <p className="text-sm text-ink-muted text-center py-12">
                    Aucun produit trouvé dans cette catégorie.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {browseProducts.map((p) => (
                    <BrowseProductCard key={p.ean} product={p} onClick={() => handleProductClick(p)} />
                  ))}
                </div>
                {browseHasMore && (
                  <div ref={loadMoreRef} className="flex justify-center items-center mt-6 h-10">
                    {browseLoadingMore && (
                      <div className="w-5 h-5 border-2 border-[#F43F5E]/30 border-t-[#F43F5E] rounded-full animate-spin" />
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}


function BrowseProductCard({ product, onClick }: { product: BrowseProduct; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-2xl bg-white ring-1 ring-black/[0.06] hover:ring-[#F43F5E]/40 hover:bg-rose-50/20 transition-all overflow-hidden text-left"
    >
      <div className="relative w-full aspect-square bg-gray-50 flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <span className="text-3xl opacity-30">🧴</span>
        )}
        {product.score != null && (
          <div className="absolute top-2 right-2">
            <ScoreBadge score={product.score} />
          </div>
        )}
      </div>
      <div className="p-2.5">
        {product.brand && (
          <div className="text-[10px] text-ink-muted truncate uppercase tracking-wide">{product.brand}</div>
        )}
        <div className="text-[13px] font-medium text-ink leading-tight line-clamp-2">{product.name}</div>
      </div>
    </button>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const { bg, fg, icon } = scoreVisual(score);
  return (
    <div className={`flex items-center justify-center w-7 h-7 rounded-full shadow-sm ${bg}`}>
      <span className={`w-3.5 h-3.5 ${fg}`}>{icon}</span>
    </div>
  );
}

function HeartSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full" aria-hidden>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}
function LeafSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden>
      <path d="M11 20A7 7 0 0 1 4 13V8a7 7 0 0 1 7-7h7v6a7 7 0 0 1-7 7h-3" />
      <path d="M2 21c4-5 7-7 14-9" />
    </svg>
  );
}
function EyeSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function TriangleSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}
function OctagonSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden>
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
