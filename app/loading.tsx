export default function HomeLoading() {
  return (
    <section
      aria-busy
      aria-label="Tableau de bord"
      className="mx-auto w-full max-w-6xl px-5 lg:px-8 mt-2 lg:mt-6"
    >
      <div className="h-8 lg:h-10 w-56 rounded bg-black/[0.06] animate-pulse" />
      <div className="mt-3 -mx-5 h-[2px] bg-black/30 lg:mx-0 lg:mt-4 lg:h-px lg:bg-black/[0.08]" />
      <div className="mt-3 lg:mt-4 h-4 w-2/3 max-w-md rounded bg-black/[0.05] animate-pulse" />
      <div className="mt-4 h-16 rounded-2xl bg-black/[0.04] animate-pulse" />
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        <div className="h-44 rounded-2xl bg-black/[0.04] animate-pulse" />
        <div className="h-44 rounded-2xl bg-black/[0.04] animate-pulse" />
      </div>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        <div className="h-28 rounded-2xl bg-black/[0.04] animate-pulse" />
        <div className="h-28 rounded-2xl bg-black/[0.04] animate-pulse" />
      </div>
    </section>
  );
}
