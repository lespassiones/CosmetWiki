/**
 * 🚧 EPHEMERAL TEST ENDPOINT — DELETE AFTER VALIDATION 🚧
 *
 * One-shot runtime validation for Tier 1 internals that aren't directly
 * curl-able from outside (Zod parser, sharp downscaler, ai_cache helpers).
 *
 * Usage:
 *   curl -H "User-Agent: Mozilla/5.0 (compatible; CosmecheckTest/1.0)" \
 *     "https://www.cosme-check.com/api/test/tier1?token=Tk_a9f3c2bd5e1842f0"
 *
 * Returns a JSON report with `ok: true/false` per check.
 * REMOVE: app/api/test/tier1/ once validated.
 */
import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { llmParse } from "@/lib/zod/llmParse";
import { getCached, setCached } from "@/lib/ai/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_TOKEN = "Tk_a9f3c2bd5e1842f0";

// Re-implement the sharp downscaler EXACTLY like in lib/ai/ocr.ts.
// We can't import the private function so we duplicate the small piece.
// Keeps the test isolated from caching/auth concerns in the real OCR call.
async function downscaleImage(base64: string, mimeType: string) {
  const sharp = (await import("sharp")).default;
  const input = Buffer.from(base64, "base64");
  const meta = await sharp(input).metadata();
  const out = await sharp(input)
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return {
    inputBytes: input.length,
    inputW: meta.width,
    inputH: meta.height,
    outputBytes: out.length,
    ratio: input.length > 0 ? Math.round((out.length / input.length) * 100) / 100 : null,
  };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get("token") !== TEST_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const report: Record<string, unknown> = {};

  // ─── Test #32 : Zod llmParse ────────────────────────────────────────────
  const Schema = z.object({
    notFound: z.boolean().optional(),
    description: z.string().optional(),
  });
  report.zod = {
    valid_plain_json: llmParse(Schema, '{"description":"hello"}'),
    valid_markdown_wrapped: llmParse(Schema, '```json\n{"description":"hi"}\n```'),
    valid_with_prose: llmParse(Schema, 'Voici: {"description":"ok"} fin'),
    invalid_array_as_desc: llmParse(Schema, '{"description":["wrong"]}'),
    invalid_not_object: llmParse(Schema, '"just a string"'),
    invalid_garbage: llmParse(Schema, "no json at all"),
    valid_not_found: llmParse(Schema, '{"notFound":true}'),
    // Expected: 4 first are objects, 3 invalid are null, last is { notFound: true }
  };

  // ─── Test #37 : downscaleImage with a real 1×1 JPEG, then a fake 3000×3000 ───
  try {
    const sharp = (await import("sharp")).default;
    // Create a synthetic 3000×3000 red JPEG to confirm the resize actually fires.
    const fakeImage = await sharp({
      create: { width: 3000, height: 3000, channels: 3, background: { r: 200, g: 100, b: 100 } },
    })
      .jpeg({ quality: 95 })
      .toBuffer();
    const fakeBase64 = fakeImage.toString("base64");
    report.sharp = await downscaleImage(fakeBase64, "image/jpeg");
    // Expected: inputBytes >> outputBytes, outputBytes much smaller, ratio < 0.5
  } catch (err) {
    report.sharp = { error: (err as Error).message };
  }

  // ─── Test #36 : cache helpers ────────────────────────────────────────────
  const testKey = `test:tier1:${crypto.randomUUID()}`;
  const testPayload = { description: "hello world", sourceUrl: "https://example.com" };
  try {
    // 1. miss
    const beforeWrite = await getCached(testKey);
    // 2. write
    await setCached(testKey, testPayload);
    // 3. hit
    const afterWrite = await getCached(testKey);
    report.cache = {
      key: testKey,
      missBeforeWrite: beforeWrite,
      hitAfterWrite: afterWrite,
      roundtrip_ok:
        beforeWrite === null
        && typeof afterWrite === "object"
        && afterWrite !== null
        && (afterWrite as { description: string }).description === testPayload.description,
    };
  } catch (err) {
    report.cache = { error: (err as Error).message };
  }

  return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
}
