import { NextRequest, NextResponse } from "next/server";
import { ocrFromImageBase64, ocrFrontFromImageBase64 } from "@/lib/ai/ocr";
import { apiGate } from "@/lib/apiGate";
import { logError } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024;     // 6 MB after base64 decode
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

type ImagePayload = { base64: string; mimeType: string };

async function readImage(file: unknown): Promise<{ ok: true; image: ImagePayload } | { ok: false; error: string; status: number }> {
  if (!(file instanceof File)) return { ok: false, error: "Image manquante.", status: 400 };
  if (!ALLOWED_MIME.has(file.type)) return { ok: false, error: "Format d'image non supporté.", status: 400 };
  if (file.size > MAX_BYTES) return { ok: false, error: "Image trop volumineuse (max 6 Mo).", status: 413 };
  const buf = Buffer.from(await file.arrayBuffer());
  return { ok: true, image: { base64: buf.toString("base64"), mimeType: file.type } };
}

export async function POST(req: NextRequest) {
  const gate = await apiGate(req, { feature: "ocr" });
  if (!gate.ok) return gate.response;

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  // Back-compat: the old single-image flow sent `image=<file>`. The new
  // two-photo flow sends `image_back=<file>` (required) and optionally
  // `image_front=<file>`. Either shape works on this endpoint — we treat
  // `image` as an alias for `image_back`.
  const backFile = formData.get("image_back") ?? formData.get("image");
  const frontFile = formData.get("image_front");

  const backRead = await readImage(backFile);
  if (!backRead.ok) {
    return NextResponse.json({ error: backRead.error }, { status: backRead.status });
  }

  let frontImage: ImagePayload | null = null;
  if (frontFile) {
    const frontRead = await readImage(frontFile);
    // A bad front photo shouldn't kill the whole request — the INCI on the
    // back is the hard requirement. Surface the warning and continue without
    // the front.
    if (frontRead.ok) {
      frontImage = frontRead.image;
    }
  }

  const userId = gate.user.id;

  try {
    // Run the two OCR passes in parallel — they hit independent caches and
    // independent OpenAI calls, no shared state.
    const [back, front] = await Promise.all([
      ocrFromImageBase64(backRead.image.base64, backRead.image.mimeType, userId),
      frontImage
        ? ocrFrontFromImageBase64(frontImage.base64, frontImage.mimeType, userId)
        : Promise.resolve(null),
    ]);

    // Keep the response shape back-compat with the previous single-image
    // contract: top-level `found`/`text`/`uncertain`/`reason` mirror the back
    // OCR. New consumers can read `back` and `front` explicitly.
    if (back.found) {
      return NextResponse.json({
        found: true,
        text: back.text,
        uncertain: back.uncertain,
        validation: back.validation,
        back,
        front,
      });
    }
    return NextResponse.json({
      found: false,
      reason: back.reason,
      back,
      front,
    });
  } catch (err) {
    logError("ocr", err, { userId });
    return NextResponse.json({ error: "Erreur lors du scan." }, { status: 500 });
  }
}
