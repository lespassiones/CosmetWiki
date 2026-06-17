import Image from "next/image";
import Link from "next/link";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const mark = size === "lg" ? "h-5" : size === "sm" ? "h-3.5" : "h-4";

  return (
    <Link href="/" className="group inline-flex items-center gap-2">
      <Image
        src="/image/logo-cc.webp"
        alt=""
        aria-hidden
        width={337}
        height={96}
        priority
        className={`${mark} w-auto`}
      />
      <span className={`font-semibold tracking-tight ${text}`}>
        <span className="text-ink">Cosme </span>
        <span className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
          Check
        </span>
      </span>
    </Link>
  );
}
