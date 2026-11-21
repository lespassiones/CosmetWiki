// Génère les badges GÉNÉRIQUES (sans nom de produit) de l'espace marques :
//   public/badges/cosme-check-{1..5}-etoiles.svg et .png (x2, pour les mails)
// Le mail « produit référencé » affiche le PNG (Gmail et Outlook n'affichent
// pas le SVG) ; la page /marques/badge génère la version personnalisée dans le
// navigateur. Relancer après toute retouche de lib/brands/badgeSvg.ts :
//   node scripts/brands/generate-badges.mjs
import { registerHooks } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Node lit le TypeScript tel quel, mais exige l'extension dans les imports
// relatifs : on la rajoute à la résolution.
registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (e) {
      if (specifier.startsWith(".")) return next(`${specifier}.ts`, context);
      throw e;
    }
  },
});

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { buildBadgeSvg, BADGE_WIDTH } = await import("../../lib/brands/badgeSvg.ts");

const out = join(root, "public", "badges");
mkdirSync(out, { recursive: true });

for (const stars of [1, 2, 3, 4, 5]) {
  const svg = buildBadgeSvg({ stars });
  const base = join(out, `cosme-check-${stars}-etoiles`);
  writeFileSync(`${base}.svg`, svg, "utf8");
  await sharp(Buffer.from(svg), { density: 144 })
    .resize({ width: BADGE_WIDTH * 2 })
    .png({ compressionLevel: 9 })
    .toFile(`${base}.png`);
  console.log(`ok ${stars} étoile(s)`);
}
