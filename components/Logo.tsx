import Link from "next/link";

/** Brand mark — the three coloured dots only, on a transparent background. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="58 196 396 120" className={className} aria-hidden role="img">
      <circle cx="117" cy="256" r="55.5" fill="#F6099B" />
      <circle cx="256" cy="256" r="55.5" fill="#54D41D" />
      <circle cx="395" cy="256" r="55.5" fill="#5F1EE1" />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const mark = size === "lg" ? "h-5" : size === "sm" ? "h-3.5" : "h-4";

  return (
    <Link href="/" className="group inline-flex items-center gap-2">
      <LogoMark className={`${mark} w-auto`} />
      <span className={`font-semibold tracking-tight ${text}`}>
        <span className="text-ink">Cosme </span>
        <span className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
          Check
        </span>
      </span>
    </Link>
  );
}
