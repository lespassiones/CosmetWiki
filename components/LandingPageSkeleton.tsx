// Skeleton générique pour les pages landing publiques. Affiché par les
// loading.tsx pendant que le RSC payload est en route. Volontairement neutre
// (pas de hero spécifique) pour rester réutilisable. La hauteur de 77 px du
// faux header reproduit celle de PublicHeader → pas de "saut" visuel quand
// la vraie page se monte par-dessus.
export function LandingPageSkeleton() {
  return (
    <div aria-busy aria-label="Chargement de la page" className="min-h-svh">
      <div className="h-[77px] w-full" />
      <main className="mx-auto w-full max-w-[1280px] px-6 sm:px-8 pt-8 pb-16">
        <div className="space-y-4">
          <div className="h-10 w-3/4 max-w-2xl rounded-md bg-black/[0.05] animate-pulse" />
          <div className="h-4 w-2/3 max-w-xl rounded bg-black/[0.04] animate-pulse" />
          <div className="h-4 w-1/2 max-w-md rounded bg-black/[0.04] animate-pulse" />
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-black/[0.04] animate-pulse"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
