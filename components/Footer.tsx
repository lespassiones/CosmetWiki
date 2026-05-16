import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-black/[0.05] bg-white/40 backdrop-blur-[2px]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-1.5 px-6 py-2 text-[11px] leading-tight text-ink-subtle sm:flex-row sm:gap-2 sm:py-1">
        <div className="flex items-center gap-1">
          <span>© {year}</span>
          <span className="font-medium text-ink-muted">Cosme Check</span>
          <span aria-hidden>·</span>
          <span>Tous droits réservés</span>
        </div>
        <span aria-hidden className="hidden sm:inline">·</span>
        <nav className="flex items-center gap-2.5">
          <Link href="/mentions-legales" className="hover:text-ink-muted transition-colors">
            Mentions légales
          </Link>
          <span aria-hidden>·</span>
          <Link href="/confidentialite" className="hover:text-ink-muted transition-colors">
            Confidentialité
          </Link>
          <span aria-hidden>·</span>
          <Link href="/cgu" className="hover:text-ink-muted transition-colors">
            CGU
          </Link>
        </nav>
      </div>
    </footer>
  );
}
