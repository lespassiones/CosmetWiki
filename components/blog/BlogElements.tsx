import type { ReactNode } from "react";

export function ArticleImage({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="my-10">
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-black/[0.04] ring-1 ring-black/[0.04]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-[13px] italic text-ink-subtle">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function CheckList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-4 space-y-2.5 text-[15.5px] leading-relaxed text-ink">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-bold text-emerald-700"
          >
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function WarnList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-4 space-y-2.5 text-[15.5px] leading-relaxed text-ink">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700"
          >
            !
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Highlight({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded-sm bg-amber-100/80 px-1 font-medium text-ink">
      {children}
    </mark>
  );
}

export function Underline({ children }: { children: ReactNode }) {
  return (
    <u className="decoration-rose-400 decoration-2 underline-offset-4">
      {children}
    </u>
  );
}

type CalloutTone = "emerald" | "rose" | "indigo" | "amber" | "violet";

const CALLOUT_TONES: Record<CalloutTone, string> = {
  emerald: "border-emerald-400 bg-emerald-50/60 text-emerald-700",
  rose: "border-rose-400 bg-rose-50/60 text-rose-700",
  indigo: "border-indigo-400 bg-indigo-50/60 text-indigo-700",
  amber: "border-amber-400 bg-amber-50/60 text-amber-700",
  violet: "border-violet-400 bg-violet-50/60 text-violet-700",
};

export function Callout({
  title,
  tone = "emerald",
  children,
}: {
  title: string;
  tone?: CalloutTone;
  children: ReactNode;
}) {
  return (
    <div className={`mt-5 rounded-xl border-l-4 p-4 ${CALLOUT_TONES[tone]}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider">
        {title}
      </div>
      <div className="mt-1 text-[15px] leading-relaxed text-ink">{children}</div>
    </div>
  );
}
