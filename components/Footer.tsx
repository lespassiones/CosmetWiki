export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-black/[0.05] bg-white/40 backdrop-blur-[2px]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-1 px-6 py-0.5 text-[11px] leading-tight text-ink-subtle">
        <span>© {year}</span>
        <span className="font-medium text-ink-muted">Cosme Check</span>
        <span aria-hidden>·</span>
        <span>Tous droits réservés</span>
      </div>
    </footer>
  );
}
