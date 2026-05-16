export default function IngredientLoading() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg" aria-busy>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-6">
        <div className="h-7 w-32 rounded bg-black/[0.06] animate-pulse" />
      </header>
      <main className="mx-auto w-full max-w-3xl px-6 pb-12">
        {/* Hero gradient + title placeholder */}
        <div className="rounded-3xl bg-gradient-to-br from-black/[0.05] to-black/[0.02] ring-1 ring-black/[0.05] p-6 lg:p-8 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-black/[0.10]" />
            <div className="h-3 w-24 rounded bg-black/[0.05]" />
          </div>
          <div className="mt-3 h-8 lg:h-10 w-2/3 rounded bg-black/[0.07]" />
          <div className="mt-3 h-3 w-1/3 rounded bg-black/[0.05]" />
        </div>

        {/* Description */}
        <div className="mt-6 rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-5 lg:p-6 space-y-2 animate-pulse">
          <div className="h-4 w-32 rounded bg-black/[0.06]" />
          <div className="h-3 w-full rounded bg-black/[0.04]" />
          <div className="h-3 w-5/6 rounded bg-black/[0.04]" />
          <div className="h-3 w-4/6 rounded bg-black/[0.04]" />
        </div>

        {/* Functions / classification */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-5 h-32 animate-pulse"
            >
              <div className="h-3 w-24 rounded bg-black/[0.06] mb-3" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-black/[0.04]" />
                <div className="h-3 w-5/6 rounded bg-black/[0.04]" />
              </div>
            </div>
          ))}
        </div>

        {/* Products grid */}
        <div className="mt-6 h-4 w-44 rounded bg-black/[0.06] animate-pulse mb-3" />
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <li
              key={i}
              className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-4 flex items-center gap-3 animate-pulse"
            >
              <div className="h-14 w-14 shrink-0 rounded-xl bg-black/[0.05]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/3 rounded bg-black/[0.05]" />
                <div className="h-3 w-1/2 rounded bg-black/[0.04]" />
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
