import Link from "next/link";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const flask = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-5 w-5" : "h-6 w-6";

  return (
    <Link href="/" className="group inline-flex items-center gap-2">
      <span aria-hidden className={`${flask} text-ink`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-full w-full"
        >
          <path d="M9 3h6" />
          <path d="M10 3v6.2L4.6 19.3A1 1 0 0 0 5.5 21h13a1 1 0 0 0 .9-1.7L14 9.2V3" />
          <path d="M7.4 14.6h9.2" />
        </svg>
      </span>
      <span className={`font-semibold tracking-tight ${text}`}>
        <span className="text-ink">Cosmet</span>
        <span className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
          Wiki
        </span>
      </span>
    </Link>
  );
}
