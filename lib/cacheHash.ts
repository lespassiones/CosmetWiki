import { createHash } from "node:crypto";

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

// Strip Unicode combining diacritical marks (U+0300..U+036F) after NFKD.
const DIACRITICS = /[̀-ͯ]/g;

export function normalizeInciText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .replace(/[^a-z0-9, ]+/g, " ")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDescriptionText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]+/g, "")
    .trim();
}

export function hashInci(text: string): string {
  return sha256Hex(normalizeInciText(text));
}

export function hashDescription(text: string): string {
  return sha256Hex(normalizeDescriptionText(text));
}
