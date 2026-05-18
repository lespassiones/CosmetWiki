import Link from "next/link";

type BlogCTAProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  note?: string;
};

export function BlogCTA({
  eyebrow = "Analyse gratuite",
  title = "Vérifiez la composition de vos cosmétiques",
  description = "Connectez-vous à Cosme Check pour obtenir la note ingrédient par ingrédient de vos produits, identifier les composants controversés et comparer avec des alternatives plus propres.",
  ctaLabel = "Se connecter",
  ctaHref = "/auth/sign-in",
  note = "Gratuit · Sans engagement",
}: BlogCTAProps) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl bg-[#0F172A] p-6 ring-1 ring-black/5 sm:p-8">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-300/90">
        <span aria-hidden className="h-px w-6 bg-rose-300/70" />
        {eyebrow}
      </div>
      <h3 className="mt-4 text-[22px] font-bold leading-tight tracking-tight text-white sm:text-[24px]">
        {title}
      </h3>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-300">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          {ctaLabel}
          <span aria-hidden>→</span>
        </Link>
        {note ? (
          <span className="text-[13px] text-slate-400">{note}</span>
        ) : null}
      </div>
    </div>
  );
}
