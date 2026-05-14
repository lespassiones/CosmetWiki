export default function PromessesLoading() {
  return (
    <div className="mx-auto max-w-4xl px-5 lg:px-8 py-8 lg:py-12" aria-busy>
      <div className="h-7 lg:h-8 w-72 max-w-full rounded bg-black/[0.06] animate-pulse mb-3" />
      <div className="-mx-5 h-[2px] bg-black/30 lg:mx-0 lg:h-px lg:bg-black/[0.08]" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="h-4 w-48 rounded bg-black/[0.05] animate-pulse" />
        <div className="h-8 w-36 rounded-full bg-black/[0.05] animate-pulse" />
      </div>
      <ul className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-4 flex items-center gap-4 animate-pulse"
          >
            <div className="h-14 w-14 shrink-0 rounded-xl bg-black/[0.05]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 max-w-[18rem] rounded bg-black/[0.05]" />
              <div className="h-3 w-1/2 max-w-[14rem] rounded bg-black/[0.04]" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
