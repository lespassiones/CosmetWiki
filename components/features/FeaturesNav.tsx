"use client";

import { useEffect, useState } from "react";

export type NavItem = {
  id: string;
  number: string;
  label: string;
};

type Props = {
  items: NavItem[];
};

export function FeaturesNav({ items }: Props) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top of the viewport that is intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      {
        // Trigger near the top - feels natural when a header section is in view.
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Sommaire des fonctionnalités" className="lg:sticky lg:top-28">
      <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
        Sur cette page
      </p>
      <ul className="mt-3 flex flex-col gap-1">
        {items.map((it) => {
          const isActive = active === it.id;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] transition-colors ${
                  isActive
                    ? "bg-rose-50 text-[#F43F5E] ring-1 ring-rose-100"
                    : "text-ink/70 hover:bg-black/[0.03] hover:text-ink"
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                    isActive
                      ? "bg-[#F43F5E] text-white"
                      : "bg-black/[0.04] text-ink-muted group-hover:bg-black/[0.07]"
                  }`}
                >
                  {it.number}
                </span>
                <span className="font-medium">{it.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
