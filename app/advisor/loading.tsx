export default function AdvisorLoading() {
  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-8 py-8 lg:py-12 space-y-5" aria-busy>
      <div className="h-7 lg:h-8 w-44 rounded bg-black/[0.06] animate-pulse" />
      <div className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-6 space-y-3 animate-pulse">
        <div className="h-3 w-1/3 rounded bg-black/[0.05]" />
        <div className="h-3 w-2/3 rounded bg-black/[0.05]" />
        <div className="h-3 w-1/2 rounded bg-black/[0.05]" />
      </div>
      <div className="h-12 rounded-full bg-black/[0.05] animate-pulse" />
    </div>
  );
}
