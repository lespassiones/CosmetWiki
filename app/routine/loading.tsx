export default function RoutineLoading() {
  return (
    <div className="mx-auto max-w-5xl px-5 lg:px-8 py-8 lg:py-12 space-y-6" aria-busy>
      <div className="h-7 lg:h-8 w-44 rounded bg-black/[0.06] animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-5 h-32 animate-pulse"
          >
            <div className="h-3 w-24 rounded bg-black/[0.05] mb-3" />
            <div className="h-8 w-20 rounded bg-black/[0.06]" />
          </div>
        ))}
      </div>
      <ul className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-4 flex items-center gap-4 animate-pulse"
          >
            <div className="h-12 w-12 shrink-0 rounded-xl bg-black/[0.05]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 max-w-[18rem] rounded bg-black/[0.05]" />
              <div className="h-3 w-1/3 max-w-[10rem] rounded bg-black/[0.04]" />
            </div>
            <div className="h-8 w-20 rounded-full bg-black/[0.04]" />
          </li>
        ))}
      </ul>
    </div>
  );
}
