export default function PromesseDetailLoading() {
  return (
    <div className="mx-auto max-w-[90rem] px-5 lg:px-10 xl:px-14 py-6 lg:py-10 space-y-4 lg:space-y-5" aria-busy>
      <div className="h-3 w-64 rounded bg-black/[0.05] animate-pulse" />
      <div className="space-y-2">
        <div className="h-7 lg:h-9 w-2/3 max-w-xl rounded bg-black/[0.06] animate-pulse" />
        <div className="h-4 w-1/2 max-w-md rounded bg-black/[0.04] animate-pulse" />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 lg:gap-5">
        <div className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] h-72 animate-pulse" />
        <div className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] h-72 animate-pulse" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)] gap-4 lg:gap-5">
        <div className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] h-80 animate-pulse" />
        <div className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] h-80 animate-pulse" />
      </section>

      <div className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] h-56 animate-pulse" />

      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 lg:gap-5">
        <div className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] h-64 animate-pulse" />
        <div className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] h-64 animate-pulse" />
      </section>
    </div>
  );
}
