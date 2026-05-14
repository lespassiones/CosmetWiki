export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-8 py-8 lg:py-12" aria-busy>
      <div className="flex items-center gap-4 mb-8 animate-pulse">
        <div className="h-14 w-14 rounded-full bg-black/[0.06]" />
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-black/[0.06]" />
          <div className="h-3 w-56 rounded bg-black/[0.04]" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-5 h-32 animate-pulse"
          >
            <div className="h-4 w-32 rounded bg-black/[0.05] mb-3" />
            <div className="h-3 w-2/3 rounded bg-black/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
