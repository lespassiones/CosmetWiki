export default function NouvellePromesseLoading() {
  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-8 py-8 lg:py-12 space-y-6" aria-busy>
      <div className="h-3 w-56 rounded bg-black/[0.05] animate-pulse" />
      <div className="h-7 lg:h-8 w-2/3 max-w-md rounded bg-black/[0.06] animate-pulse" />
      <div className="rounded-2xl bg-white/60 ring-1 ring-black/[0.05] p-6 space-y-4 animate-pulse">
        <div className="h-4 w-1/2 rounded bg-black/[0.05]" />
        <div className="h-32 rounded-xl bg-black/[0.04]" />
        <div className="h-10 w-40 rounded-full bg-black/[0.05]" />
      </div>
    </div>
  );
}
