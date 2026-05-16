export default function CompareLoading() {
  return (
    <div className="mx-auto max-w-5xl px-5 lg:px-8 py-8 lg:py-12" aria-busy>
      <div className="h-7 lg:h-8 w-56 rounded bg-black/[0.06] animate-pulse mb-3" />
      <div className="-mx-5 h-[2px] bg-black/30 lg:mx-0 lg:h-px lg:bg-black/[0.08]" />
      <div className="mt-3 h-4 w-72 max-w-full rounded bg-black/[0.05] animate-pulse" />
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-5 space-y-3 animate-pulse"
          >
            <div className="h-5 w-2/3 rounded bg-black/[0.06]" />
            <div className="h-10 w-24 rounded bg-black/[0.07]" />
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full rounded bg-black/[0.04]" />
              <div className="h-3 w-5/6 rounded bg-black/[0.04]" />
              <div className="h-3 w-4/6 rounded bg-black/[0.04]" />
            </div>
            <div className="h-32 w-full rounded-xl bg-black/[0.04]" />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-5 space-y-3 animate-pulse">
        <div className="h-5 w-40 rounded bg-black/[0.06]" />
        <div className="h-3 w-full rounded bg-black/[0.04]" />
        <div className="h-3 w-5/6 rounded bg-black/[0.04]" />
      </div>
    </div>
  );
}
