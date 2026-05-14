export default function OffreLoading() {
  return (
    <div className="mx-auto max-w-4xl px-5 lg:px-8 py-8 lg:py-12 space-y-6" aria-busy>
      <div className="space-y-3 text-center">
        <div className="mx-auto h-7 lg:h-9 w-2/3 max-w-md rounded bg-black/[0.06] animate-pulse" />
        <div className="mx-auto h-4 w-1/2 max-w-sm rounded bg-black/[0.04] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-6 h-72 animate-pulse"
          >
            <div className="h-5 w-24 rounded bg-black/[0.06] mb-4" />
            <div className="h-9 w-32 rounded bg-black/[0.06] mb-6" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-black/[0.04]" />
              <div className="h-3 w-5/6 rounded bg-black/[0.04]" />
              <div className="h-3 w-4/6 rounded bg-black/[0.04]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
