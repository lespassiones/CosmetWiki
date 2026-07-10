/**
 * Fallback INSTANTANÉ (App Router Suspense) affiché dès le clic sur « Suggestions
 * intelligentes », pendant que le server component résout (fetch routine + profil).
 * Sans lui, l'utilisateur clique et ne voit RIEN jusqu'à l'arrivée de la page.
 * Le markup reprend l'état "loading" de SuggestionsPageClient → transition fluide,
 * puis le client prend le relais avec le même spinner pendant le fetch des alternatives.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-md px-5 pt-5 pb-8">
      <div className="mb-1 flex items-center gap-2">
        <div className="h-9 w-9 shrink-0 rounded-full bg-white/80 ring-1 ring-black/[0.06]" />
        <h1 className="flex items-center gap-2 text-[17px] font-bold">
          <span aria-hidden>✨</span>
          Suggestions intelligentes
        </h1>
      </div>
      <p className="mb-5 pl-11 text-[12px] text-ink-muted">
        Pour tes produits pénalisants, un remplaçant mieux noté dans la même catégorie.
      </p>

      <div aria-busy aria-label="Chargement des suggestions">
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-black/[0.06]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 shrink-0 animate-spin text-[#FF5A8A]"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="text-[13px] font-medium text-ink">
            Recherche des meilleures alternatives…
          </span>
        </div>
        <ul className="space-y-4">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="h-[360px] animate-pulse rounded-3xl bg-gradient-to-br from-black/[0.06] to-black/[0.02] ring-1 ring-black/[0.04]"
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
