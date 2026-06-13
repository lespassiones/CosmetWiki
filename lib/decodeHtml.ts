/**
 * Decode HTML entities in a string. Applied to product names and brand names
 * coming from the DB or web-scraped sources where entities may have been
 * stored raw (e.g. "L&amp;#39;Oréal" → "L'Oréal").
 */
export function decodeHtml(str: string | null | undefined): string {
  if (!str) return str ?? "";
  return str
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x60;/g, "`")
    .replace(/&#39;/g, "'")
    .replace(/&#47;/g, "/");
}
