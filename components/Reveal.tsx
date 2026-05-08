/**
 * Wraps a block with the `reveal-on-mount` CSS animation defined in
 * `globals.css`. Pure markup (no client hooks), so it can be used inside both
 * server and client components.
 */
export function Reveal({
  delayMs = 0,
  children,
  className = "",
}: {
  delayMs?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`reveal-on-mount ${className}`}
      style={{ ["--reveal-delay" as string]: `${delayMs}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
