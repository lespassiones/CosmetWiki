export default function AnalyseLoading() {
  return (
    <div className="mx-auto max-w-5xl px-5 lg:px-8 py-8 lg:py-12" aria-busy>
      <div className="h-7 lg:h-8 w-48 rounded bg-black/[0.06] animate-pulse mb-3" />
      <div className="-mx-5 h-[2px] bg-black/30 lg:mx-0 lg:h-px lg:bg-black/[0.08]" />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-5 h-28 animate-pulse"
          >
            <div className="h-3 w-24 rounded bg-black/[0.05] mb-3" />
            <div className="h-8 w-20 rounded bg-black/[0.06]" />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-5 animate-pulse space-y-3">
        <div className="h-4 w-2/3 max-w-md rounded bg-black/[0.05]" />
        <div className="h-3 w-5/6 rounded bg-black/[0.04]" />
        <div className="h-3 w-4/6 rounded bg-black/[0.04]" />
      </div>
      <ul className="mt-6 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="rounded-xl bg-white/60 ring-1 ring-black/[0.05] p-3 flex items-center gap-3 animate-pulse"
          >
            <div className="h-3 w-3 shrink-0 rounded-full bg-black/[0.06]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-2/5 rounded bg-black/[0.05]" />
              <div className="h-2.5 w-1/4 rounded bg-black/[0.04]" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
