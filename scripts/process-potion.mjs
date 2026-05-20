/**
 * Detoure le fond blanc de potion.png et exporte une icône WebP légère.
 *
 * Stratégie : pour chaque pixel, on calcule la "blancheur" (min des canaux RGB).
 * Plus la blancheur est élevée, plus l'alpha est faible. Cela donne un détourage
 * doux qui préserve les transitions et les reflets du flacon.
 */
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const SRC = "public/image/petiteImage/potion.png";
const OUT = "public/image/petiteImage/potion.webp";
const TARGET_SIZE = 256;

// Seuils de blancheur (en valeur min des canaux RGB, 0..255).
// - en dessous de NOT_WHITE  -> opaque
// - au-dessus de FULL_WHITE   -> totalement transparent
// - entre les deux            -> alpha gradient (anti-crénelage)
const NOT_WHITE = 235;
const FULL_WHITE = 250;

const { data, info } = await sharp(SRC)
  .resize(TARGET_SIZE, TARGET_SIZE, { fit: "inside" })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const pixels = Buffer.from(data);

for (let i = 0; i < pixels.length; i += channels) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];
  const whiteness = Math.min(r, g, b);

  let alpha;
  if (whiteness >= FULL_WHITE) alpha = 0;
  else if (whiteness <= NOT_WHITE) alpha = 255;
  else {
    const t = (whiteness - NOT_WHITE) / (FULL_WHITE - NOT_WHITE);
    alpha = Math.round(255 * (1 - t));
  }

  pixels[i + 3] = alpha;
}

const webp = await sharp(pixels, { raw: { width, height, channels } })
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
  .webp({ quality: 88, alphaQuality: 95, effort: 6 })
  .toBuffer();

await writeFile(OUT, webp);

const kb = (webp.length / 1024).toFixed(1);
console.log(`OK -> ${OUT}  (${width}x${height} source, ${kb} KB)`);
