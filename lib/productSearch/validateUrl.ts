/**
 * Safety validation for user-supplied URLs we're about to fetch server-side.
 *
 * Defends against SSRF: an attacker submitting `http://localhost:5432` or
 * `http://169.254.169.254/...` would otherwise have us call internal services
 * and potentially leak their responses back. We reject those before issuing
 * any fetch.
 *
 * Note: this is a STRING-based check, not a DNS check — we don't resolve
 * the hostname. That means a public domain whose A record secretly points
 * to a private IP would slip through. For our use case (consumer-facing
 * cosmetics e-commerce URLs) the string check covers 99 % of intent;
 * adding DNS resolution would be the next hardening step.
 */

const HTTP_SCHEMES = new Set(["http:", "https:"]);

/** Hostnames we always refuse, regardless of scheme. */
const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
  "kubernetes.default.svc",
  "host.docker.internal",
]);

/** IPv4 ranges (CIDR-ish, matched by string prefix) that are private/internal. */
const BLOCKED_IPV4_PREFIXES = [
  "0.",       // RFC 1122 "this network"
  "10.",      // RFC 1918 private
  "127.",     // loopback
  "169.254.", // link-local (covers AWS/Azure/GCP metadata endpoints)
  "192.168.", // RFC 1918 private
  "224.",     // multicast (224.0.0.0/4)
];

/** Specific IPv6 hosts to reject. */
const BLOCKED_IPV6 = new Set(["::", "::1"]);

/** RFC 1918 172.16.0.0/12 → 172.16.x – 172.31.x. */
function isBlocked172(host: string): boolean {
  if (!host.startsWith("172.")) return false;
  const parts = host.split(".");
  if (parts.length < 2) return false;
  const second = Number(parts[1]);
  return Number.isInteger(second) && second >= 16 && second <= 31;
}

function isLikelyPrivateIPv6(host: string): boolean {
  // Strip brackets if URL parsing left them on.
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_IPV6.has(h)) return true;
  // Unique-local (fc00::/7) and link-local (fe80::/10).
  if (h.startsWith("fc") || h.startsWith("fd")) return true;
  if (h.startsWith("fe8") || h.startsWith("fe9") || h.startsWith("fea") || h.startsWith("feb")) return true;
  return false;
}

export type UrlValidationResult =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

/**
 * Parse the URL string and return a validated URL object. Refuses anything
 * non-http(s), private IP ranges, cloud metadata endpoints, and `.local`
 * mDNS hosts.
 */
export function validateUserUrl(input: string): UrlValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, reason: "URL vide." };
  if (trimmed.length > 2048) return { ok: false, reason: "URL trop longue." };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: "URL invalide." };
  }

  if (!HTTP_SCHEMES.has(parsed.protocol)) {
    return { ok: false, reason: "Seuls les liens http(s) sont acceptés." };
  }

  // Strip credentials early so they don't leak into logs.
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "Les identifiants dans l'URL ne sont pas autorisés." };
  }

  const host = parsed.hostname.toLowerCase();
  if (!host) return { ok: false, reason: "Domaine manquant." };
  if (BLOCKED_HOSTS.has(host)) {
    return { ok: false, reason: "Domaine interne refusé." };
  }
  if (host.endsWith(".local") || host.endsWith(".internal")) {
    return { ok: false, reason: "Domaine interne refusé." };
  }

  // IPv4 / IPv6 numeric host detection — simple string heuristics good enough
  // for our SSRF posture.
  if (host.includes(":")) {
    if (isLikelyPrivateIPv6(host)) {
      return { ok: false, reason: "Adresse IP privée refusée." };
    }
  } else if (/^[\d.]+$/.test(host)) {
    if (BLOCKED_IPV4_PREFIXES.some((p) => host.startsWith(p))) {
      return { ok: false, reason: "Adresse IP privée refusée." };
    }
    if (isBlocked172(host)) {
      return { ok: false, reason: "Adresse IP privée refusée." };
    }
  }

  return { ok: true, url: parsed };
}
