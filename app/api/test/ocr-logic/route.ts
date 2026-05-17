/**
 * 🚧 EPHEMERAL TEST ENDPOINT — DELETE AFTER VALIDATION 🚧
 *
 * Validates the #19 OCR decision logic (skip pass 2 if validation rate >= 0.70)
 * WITHOUT spending money on real Vision calls. Takes a raw text payload as if
 * it were the output of pass 1, runs validateOcrText against the INCI DB, and
 * tells us whether pass 2 would be triggered.
 *
 * Protected by the same token as the cascade test endpoint.
 *
 * Usage:
 *   curl -X POST "https://www.cosme-check.com/api/test/ocr-logic?token=Tk_a9f3c2bd5e1842f0" \
 *     -H 'Content-Type: application/json' \
 *     -d '{"text":"Aqua, Glycerin, Cetearyl Alcohol, Tocopherol"}'
 *
 * REMOVE: app/api/test/ocr-logic/ folder once OCR logic is validated.
 */
import { NextResponse, type NextRequest } from "next/server";
import { parseInciList } from "@/lib/inciParser";
import { validateOcrText } from "@/lib/ai/ocr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_TOKEN = "Tk_a9f3c2bd5e1842f0";

// Mirror of `shouldTriggerSecondPass` in lib/ai/ocr.ts (kept private over
// there). The decision rule we want to validate end-to-end.
function inSecondPassWindow(text: string): boolean {
  const tokens = parseInciList(text);
  return tokens.length >= 6 && tokens.length < 18;
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") ?? "";
  const tokenFromHeader = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const tokenFromQuery = url.searchParams.get("token") ?? "";

  if (tokenFromHeader !== TEST_TOKEN && tokenFromQuery !== TEST_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { text?: string };
  try {
    body = (await req.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const text = (body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "missing text" }, { status: 400 });

  const startedAt = Date.now();
  const validation = await validateOcrText(text);
  const windowFlag = inSecondPassWindow(text);
  const needsSecondPass = windowFlag && validation.rate < 0.70;

  return NextResponse.json(
    {
      input: { text: text.slice(0, 120) + (text.length > 120 ? "…" : ""), totalChars: text.length },
      validation,
      secondPassWindow: windowFlag,
      secondPassTriggered: needsSecondPass,
      decision: needsSecondPass
        ? "would_trigger_pass2"
        : windowFlag
          ? "skip_pass2_because_rate_ok"
          : "skip_pass2_because_outside_window",
      durationMs: Date.now() - startedAt,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
