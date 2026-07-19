// HTTP fetch with browser-like headers, used for scraping product pages
// from sources that gate raw bot User-Agents.

import { validateUserUrl } from "./validateUrl";

const BROWSER_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

export async function fetchPageHtml(
  url: string,
  timeoutMs = 8_000,
): Promise<string | null> {
  try {
    // SSRF : on ne suit PAS les redirections en aveugle. Chaque saut est
    // revalidé par validateUserUrl (un 302 vers 169.254.169.254 / une IP privée
    // est refusé). Max 5 sauts.
    let target = url;
    for (let hop = 0; hop < 5; hop++) {
      const v = validateUserUrl(target);
      if (!v.ok) return null;
      const r = await fetch(v.url.toString(), {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "manual",
      });
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get("location");
        if (!loc) return null;
        target = new URL(loc, v.url).toString();
        continue;
      }
      if (!r.ok) return null;
      const ct = r.headers.get("content-type") ?? "";
      if (!ct.includes("html") && !ct.includes("text") && !ct.includes("xml")) {
        return null;
      }
      return await r.text();
    }
    return null;
  } catch {
    return null;
  }
}
