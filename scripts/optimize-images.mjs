#!/usr/bin/env node
/**
 * Convertit toutes les images PNG/JPG de `public/image/` en WebP optimisés.
 *
 * - Resize : max 1920 px de large (suffisant pour tous les usages web).
 * - Qualité WebP : 82 (excellent rapport qualité/poids pour de la photo).
 * - Idempotent : ignore les fichiers déjà convertis et à jour.
 * - Sortie : `<nom>.webp` à côté du PNG d'origine.
 *
 * Usage :
 *   node scripts/optimize-images.mjs           // convertit sans supprimer
 *   node scripts/optimize-images.mjs --delete  // supprime les PNG après conversion
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(process.cwd(), "public/image");
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 82;
const DELETE_ORIGINALS = process.argv.includes("--delete");

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function bytesToKb(n) {
  return `${(n / 1024).toFixed(0)} KB`;
}

async function main() {
  const files = await walk(ROOT);
  console.log(`Found ${files.length} image(s) to process in ${ROOT}\n`);

  let totalOriginal = 0;
  let totalNew = 0;
  let converted = 0;
  let skipped = 0;
  let deleted = 0;

  for (const file of files) {
    const ext = path.extname(file);
    const out = file.replace(ext, ".webp");

    const origStat = await fs.stat(file);
    totalOriginal += origStat.size;

    // Idempotency : skip if webp exists and is newer than the source.
    try {
      const webpStat = await fs.stat(out);
      if (webpStat.mtimeMs >= origStat.mtimeMs) {
        totalNew += webpStat.size;
        skipped += 1;
        console.log(`  skip   ${path.relative(ROOT, file)} (.webp up to date)`);
        if (DELETE_ORIGINALS) {
          await fs.unlink(file);
          deleted += 1;
        }
        continue;
      }
    } catch {
      // No webp yet, proceed to convert.
    }

    const meta = await sharp(file).metadata();
    const needsResize = (meta.width ?? 0) > MAX_WIDTH;

    let pipeline = sharp(file);
    if (needsResize) {
      pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    }
    await pipeline.webp({ quality: WEBP_QUALITY, effort: 6 }).toFile(out);

    const newStat = await fs.stat(out);
    totalNew += newStat.size;
    converted += 1;

    const ratio = (1 - newStat.size / origStat.size) * 100;
    console.log(
      `  ok     ${path.relative(ROOT, file)}  ${bytesToKb(origStat.size)} -> ${bytesToKb(newStat.size)}  (-${ratio.toFixed(0)}%${needsResize ? `, resized to ${MAX_WIDTH}px` : ""})`,
    );

    if (DELETE_ORIGINALS) {
      await fs.unlink(file);
      deleted += 1;
    }
  }

  console.log("");
  console.log(`Converted : ${converted}`);
  console.log(`Skipped   : ${skipped}`);
  if (DELETE_ORIGINALS) console.log(`Deleted   : ${deleted}`);
  console.log(
    `Total     : ${bytesToKb(totalOriginal)} -> ${bytesToKb(totalNew)}  (-${((1 - totalNew / totalOriginal) * 100).toFixed(0)}%)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
