/**
 * Badge « Noté N étoiles sur Cosme Check » en SVG autonome (aucune police ni
 * image externe : la marque peut le télécharger et l'héberger elle-même, ou le
 * convertir en PNG dans le navigateur). Les étoiles reprennent le dessin de
 * l'app (Star3D : face en dégradé, épaisseur sombre, petit reflet).
 *
 * Logique pure, testée dans tests/brandSubmission.test.ts.
 */
import { STAR_EMPTY, STAR_LABEL, STAR_PALETTE, type StarCount, type StarPalette } from "./stars";

export const BADGE_WIDTH = 440;
export const BADGE_HEIGHT = 156;

const STAR_PATH =
  "M12 2.9L14.88 8.54L21.13 9.53L16.66 14.01L17.64 20.27L12 17.4L6.36 20.27L7.34 14.01L2.87 9.53L9.12 8.54Z";

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Coupe proprement un nom trop long pour tenir sur la ligne du badge. */
export function truncate(s: string, max: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function gradient(id: string, p: StarPalette): string {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${p.light}"/><stop offset="60%" stop-color="${p.face}"/><stop offset="100%" stop-color="${p.face}"/></linearGradient>`;
}

function star(x: number, y: number, size: number, p: StarPalette, gradId: string): string {
  const s = size / 24;
  return (
    `<g transform="translate(${x} ${y}) scale(${s})">` +
    `<path d="${STAR_PATH}" transform="translate(0 1)" fill="${p.dark}" stroke="${p.dark}" stroke-width="2.8" stroke-linejoin="round"/>` +
    `<path d="${STAR_PATH}" fill="url(#${gradId})" stroke="url(#${gradId})" stroke-width="2.8" stroke-linejoin="round"/>` +
    `<ellipse cx="9.4" cy="8.9" rx="1.9" ry="1.1" transform="rotate(-35 9.4 8.9)" fill="#FFFFFF" opacity="0.45"/>` +
    `</g>`
  );
}

export type BadgeInput = {
  stars: StarCount;
  brand?: string | null;
  productName?: string | null;
};

export function buildBadgeSvg({ stars, brand, productName }: BadgeInput): string {
  const palette = STAR_PALETTE[stars];
  const product = truncate([brand, productName].filter(Boolean).join(" · "), 52);
  const size = 30;
  const gap = 6;
  const starsY = 56;
  const starRow = Array.from({ length: 5 }, (_, i) =>
    star(24 + i * (size + gap), starsY, size, i < stars ? palette : STAR_EMPTY, i < stars ? "cc-full" : "cc-empty"),
  ).join("");
  const scoreX = 24 + 5 * (size + gap) + 8;
  const title = `Noté ${stars} étoile${stars > 1 ? "s" : ""} sur 5 sur Cosme Check`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${BADGE_WIDTH}" height="${BADGE_HEIGHT}" viewBox="0 0 ${BADGE_WIDTH} ${BADGE_HEIGHT}" role="img" aria-label="${escapeXml(title)}">` +
    `<title>${escapeXml(title)}</title>` +
    `<defs>${gradient("cc-full", palette)}${gradient("cc-empty", STAR_EMPTY)}</defs>` +
    `<rect x="1" y="1" width="${BADGE_WIDTH - 2}" height="${BADGE_HEIGHT - 2}" rx="22" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>` +
    `<text x="24" y="40" font-family="${FONT}" font-size="21" font-weight="700" letter-spacing="-0.3"><tspan fill="#111111">Cosme</tspan><tspan fill="#F43F5E" dx="6">Check</tspan></text>` +
    `<text x="${BADGE_WIDTH - 24}" y="39" text-anchor="end" font-family="${FONT}" font-size="12" font-weight="600" fill="#6B7280" letter-spacing="0.6">NOTE DE LA COMPOSITION</text>` +
    starRow +
    `<text x="${scoreX}" y="${starsY + 25}" font-family="${FONT}" font-size="24" font-weight="700" fill="${palette.dark}">${stars}/5</text>` +
    `<text x="24" y="118" font-family="${FONT}" font-size="15" font-weight="600" fill="#111111">${escapeXml(STAR_LABEL[stars])}</text>` +
    `<text x="24" y="139" font-family="${FONT}" font-size="12.5" fill="#6B7280">${escapeXml(product || "cosme-check.com")}</text>` +
    `</svg>`
  );
}
