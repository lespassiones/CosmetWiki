export default function HistoryDetailLoading() {
  return (
    <div className="w-full px-3 lg:px-6 pt-4 pb-16" aria-busy>
      <div className="flex items-center justify-end gap-2 mb-2">
        <div className="h-9 w-32 rounded-full bg-black/[0.05] animate-pulse" />
        <div className="h-9 w-9 rounded-full bg-black/[0.05] animate-pulse" />
      </div>
      <div className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-5 lg:p-7 animate-pulse">
        <div className="h-3 w-48 rounded bg-black/[0.05] mb-4" />
        <div className="h-7 w-2/3 max-w-md rounded bg-black/[0.06] mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] gap-6">
          <div className="h-[260px] rounded-2xl bg-black/[0.04]" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-black/[0.04]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
