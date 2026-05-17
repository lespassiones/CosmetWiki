/**
 * Client-side helper for calls to credit-consuming API routes.
 *
 * Wraps `fetch` and:
 *   - Dispatches `cosmecheck:credits-updated` after any 2xx so the pill refetches
 *   - Dispatches `cosmecheck:credits-exhausted` after a 429-with-credits so the
 *     modal opens automatically
 *
 * Drop-in replacement for fetch. Use it at call sites that hit any of the
 * 6 credit-charging endpoints.
 */

type CreditsPayload = { used?: number; limit?: number; remaining?: number };

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);

  if (res.ok) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cosmecheck:credits-updated"));
    }
    return res;
  }

  // 429 with credits payload → trigger the exhaustion modal.
  if (res.status === 429 && typeof window !== "undefined") {
    try {
      const clone = res.clone();
      const data = (await clone.json()) as { credits?: CreditsPayload };
      if (data?.credits) {
        window.dispatchEvent(
          new CustomEvent("cosmecheck:credits-exhausted", { detail: data.credits }),
        );
      }
    } catch {
      // not JSON or no credits payload — fall through, caller handles
    }
  }

  return res;
}
