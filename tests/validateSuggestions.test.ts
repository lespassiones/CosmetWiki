import { describe, it, expect } from "vitest";
import { validateSuggestions } from "@/lib/ai/validateSuggestions";

// Handoff §2.3 — the AI guardrail must NEVER block display: with no AI key
// configured (the case in the test env), it degrades to logical:true for every
// item, preserving order and length.
describe("validateSuggestions (degrade-safe)", () => {
  it("returns an empty array for no items", async () => {
    expect(await validateSuggestions([])).toEqual([]);
  });

  it("degrades to logical:true for every item when no AI provider is available", async () => {
    const items = [
      { product: "Vernis rouge", alternative: "Vernis nude" },
      { product: "Shampoing doux", alternative: "Shampoing solide" },
    ];
    const res = await validateSuggestions(items);
    expect(res).toHaveLength(2);
    expect(res.every((r) => r.logical === true)).toBe(true);
    expect(res.every((r) => r.product_type === "")).toBe(true);
  });
});
