/**
 * Badges App Store et Google Play.
 *
 * Extraits de `LandingHero` et `LandingFooter`, qui en avaient chacun leur
 * propre copie avec les URLs des stores écrites en dur. Le hero, le pied de
 * page et la modale de téléchargement partagent maintenant ce composant, et les
 * URLs viennent de `lib/storeLink.ts`, le module qui porte aussi les tests et
 * qui alimente la route `/dl` du QR code imprimé. Un changement
 * d'identifiant de store se fait donc à un seul endroit.
 *
 * `size="compact"` reproduit exactement les dimensions qu'avait le pied de
 * page (42 px de haut) pour ne rien déplacer visuellement.
 */
import { DEFAULT_CAMPAIGN, appleUrl, playUrl } from "@/lib/storeLink";

type Size = "default" | "compact";

type Props = {
  align?: "center" | "left";
  /** Slug de campagne propagé aux deux stores pour l'attribution. */
  campaign?: string;
  /**
   * Média côté Play. `web` par défaut, car un badge cliqué sur le site n'est
   * pas un QR scanné : le défaut `qr_code` de `playUrl` ne vaut que pour les
   * QR imprimés qui atteignent `/dl` sans paramètre.
   */
  medium?: string;
  size?: Size;
  className?: string;
};

const METRICS: Record<Size, { apple: string; play: string; icon: string; top: string; name: string }> = {
  default: {
    apple: "h-[44px] w-[140px]",
    play: "h-[44px] w-[150px]",
    icon: "h-7 w-7",
    top: "text-[9px]",
    name: "text-[15px]",
  },
  compact: {
    apple: "h-[42px] w-[132px]",
    play: "h-[42px] w-[140px]",
    icon: "h-6 w-6",
    top: "text-[8px]",
    name: "text-[14px]",
  },
};

const SHELL =
  "flex items-center gap-2 rounded-lg bg-black px-3 text-white transition hover:brightness-110 active:scale-95";

export function StoreBadges({
  align = "center",
  campaign,
  medium = "web",
  size = "default",
  className = "",
}: Props) {
  const justify = align === "left" ? "justify-start" : "justify-center";
  return (
    <div className={`flex flex-wrap items-center gap-3 ${justify} ${className}`}>
      <AppleStoreBadge campaign={campaign} size={size} />
      <GooglePlayBadge campaign={campaign} medium={medium} size={size} />
    </div>
  );
}

export function AppleStoreBadge({
  campaign,
  size = "default",
}: {
  campaign?: string;
  size?: Size;
}) {
  const m = METRICS[size];
  return (
    <a
      href={campaign ? appleUrl(campaign) : appleUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Télécharger sur l'App Store"
      className={`${SHELL} ${m.apple}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden className={`${m.icon} fill-current`}>
        <path d="M17.05 12.04c-.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.74-1.78-3.33-1.8-1.42-.15-2.77.84-3.5.84-.73 0-1.84-.82-3.03-.79-1.56.02-3 .91-3.8 2.31-1.62 2.82-.41 6.97 1.17 9.25.77 1.12 1.69 2.37 2.89 2.33 1.16-.05 1.6-.75 3-.75s1.8.75 3.03.72c1.25-.02 2.04-1.14 2.8-2.27.88-1.3 1.25-2.56 1.27-2.62-.03-.02-2.44-.94-2.46-3.77zM14.84 5.27c.64-.78 1.07-1.86.95-2.93-.92.04-2.04.61-2.7 1.39-.6.69-1.12 1.8-.98 2.85 1.03.08 2.08-.52 2.73-1.31z" />
      </svg>
      <div className="flex flex-col text-left leading-none">
        <span className={`${m.top} tracking-wide`}>Télécharger sur</span>
        <span className={`${m.name} font-semibold tracking-tight`}>App Store</span>
      </div>
    </a>
  );
}

export function GooglePlayBadge({
  campaign,
  medium = "web",
  size = "default",
}: {
  campaign?: string;
  medium?: string;
  size?: Size;
}) {
  const m = METRICS[size];
  return (
    <a
      href={playUrl(campaign ?? DEFAULT_CAMPAIGN, medium)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Télécharger sur Google Play"
      className={`${SHELL} ${m.play}`}
    >
      <svg viewBox="0 0 60 64" aria-hidden className={m.icon}>
        <path d="M0 5.4v53.2c0 1.7 1.4 3 3 3l30-30L3 1.5C1.4 1.8 0 3.2 0 5.4z" fill="#4285F4" />
        <path d="M48.6 22.4 39 17 33 23l9 9 6.6-5.4c2-1.5 2-4.7 0-6.2z" fill="#FBBC04" />
        <path d="M3 1.5c.4 0 .7.1 1.1.3L42 22 36 28 0 4.5C0 3 1.3 1.5 3 1.5z" fill="#34A853" />
        <path d="m3 62.5 33-30 6 6L4.1 62.2c-.4.2-.7.3-1.1.3z" fill="#EA4335" />
      </svg>
      <div className="flex flex-col text-left leading-none">
        <span className={`${m.top} tracking-wide`}>Disponible sur</span>
        <span className={`${m.name} font-semibold tracking-tight`}>Google Play</span>
      </div>
    </a>
  );
}
