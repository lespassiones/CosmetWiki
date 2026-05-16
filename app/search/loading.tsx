export default function SearchLoading() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg" aria-busy>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-6">
        <div className="h-7 w-32 rounded bg-black/[0.06] animate-pulse" />
        <div className="hidden sm:flex gap-2">
          <div className="h-4 w-20 rounded bg-black/[0.05] animate-pulse" />
          <div className="h-4 w-20 rounded bg-black/[0.05] animate-pulse" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-6 pb-12">
        <div className="h-12 w-full rounded-full bg-white/60 ring-1 ring-black/[0.05] animate-pulse mb-6" />
        <div className="h-4 w-48 rounded bg-black/[0.05] animate-pulse mb-4" />
        <ul className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <li
              key={i}
              className="rounded-xl bg-white/60 ring-1 ring-black/[0.05] p-3 flex items-center gap-3 animate-pulse"
            >
              <div className="h-3 w-3 shrink-0 rounded-full bg-black/[0.07]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/5 rounded bg-black/[0.05]" />
                <div className="h-2.5 w-1/4 rounded bg-black/[0.04]" />
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
