export default function HistoryLoading() {
  return (
    <div className="mx-auto max-w-4xl px-5 lg:px-8 py-8 lg:py-12" aria-busy>
      <div className="h-7 lg:h-8 w-44 rounded bg-black/[0.06] animate-pulse mb-6" />
      <ul className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-4 flex items-center gap-4 animate-pulse"
          >
            <div className="h-14 w-14 shrink-0 rounded-xl bg-black/[0.05]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 max-w-[18rem] rounded bg-black/[0.05]" />
              <div className="h-3 w-1/2 max-w-[12rem] rounded bg-black/[0.04]" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
