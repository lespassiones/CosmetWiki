"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GLASS_PILL, GLASS_PILL_DARK } from "@/lib/ui/glass";

type Step = "capture" | "processing" | "review" | "error";

export function PhotoOcrFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("capture");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [uncertain, setUncertain] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function onPick(file: File) {
    setErrorMsg(null);
    setUsingFallback(false);
    if (!file.type.startsWith("image/")) {
      setStep("error");
      setErrorMsg("Le fichier sélectionné n'est pas une image.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setStep("processing");

    // Primary: GPT-4o-mini vision on the server.
    let primaryOk = false;
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await fetch("/api/ocr", { method: "POST", body: fd });
      if (r.ok) {
        const data = (await r.json()) as
          | { found: true; text: string; uncertain: string[] }
          | { found: false; reason: string };
        if (data.found) {
          setText(data.text);
          setUncertain(data.uncertain ?? []);
          setStep("review");
          primaryOk = true;
        }
      }
    } catch {
      // ignore — go to fallback
    }

    if (primaryOk) return;

    // Fallback: Tesseract.js client-side.
    try {
      setUsingFallback(true);
      const { default: Tesseract } = await import("tesseract.js");
      const { data: ocr } = await Tesseract.recognize(file, "eng+fra");
      const cleanedText = (ocr.text ?? "").replace(/\s+/g, " ").trim();
      if (!cleanedText) throw new Error("empty");
      setText(cleanedText);
      setUncertain([]);
      setStep("review");
    } catch {
      setStep("error");
      setErrorMsg(
        "Impossible de lire le texte de cette image. Réessaie avec une photo plus nette ou tape la liste manuellement.",
      );
    }
  }

  function analyse() {
    const t = text.trim();
    if (t.length === 0) return;
    // Push the OCR'd text to the home in INCI mode via sessionStorage so it
    // pre-fills the textarea without showing in the URL.
    try {
      sessionStorage.setItem("cw:scanPhotoText", t);
    } catch {
      // ignore — fallback to URL param below
    }
    router.push(`/?mode=paste&inci=${encodeURIComponent(t)}`);
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0B0F] text-white flex flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Fermer"
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <h1 className="text-[15px] font-semibold">
          {step === "capture" ? "Cadre la composition" : step === "review" ? "Vérifie le texte" : ""}
        </h1>
        <div className="w-9" />
      </header>

      {step === "capture" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-3xl border-2 border-dashed border-white/30 overflow-hidden">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/[0.08]" />
              ))}
            </div>
            <Corners />
          </div>
          <p className="text-sm text-white/70 max-w-xs">
            Aligne la liste d&apos;ingrédients à l&apos;intérieur du cadre, puis lance la prise de photo.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              if (f) onPick(f);
            }}
            className="hidden"
          />
          <div className="flex gap-3 w-full max-w-sm">
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute("capture");
                  fileInputRef.current.click();
                  fileInputRef.current.setAttribute("capture", "environment");
                }
              }}
              className="flex-1 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium py-3 transition"
            >
              Galerie
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-xl bg-white text-black text-sm font-semibold py-3 hover:bg-white/90 transition"
            >
              Prendre la photo
            </button>
          </div>
          <p className="text-[11px] text-white/40">
            Analyse via GPT-4o-mini Vision · Tesseract.js en secours si indisponible
          </p>
        </div>
      )}

      {step === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-sm text-white/70">Lecture de la composition…</p>
        </div>
      )}

      {step === "review" && (
        <div className="flex-1 flex flex-col bg-[#FAFAFA] text-[#111111] overflow-hidden">
          <div className="px-5 pt-4 pb-2 flex items-center gap-3 border-b border-[#E5E7EB]">
            {previewUrl && (
              <div
                aria-hidden
                className="h-12 w-12 rounded-lg bg-cover bg-center bg-[#E5E7EB] shrink-0"
                style={{ backgroundImage: `url(${previewUrl})` }}
              />
            )}
            <div className="text-[12px] text-[#6B7280]">
              {usingFallback
                ? "Texte extrait avec Tesseract.js (hors-ligne). Vérifie attentivement."
                : uncertain.length > 0
                  ? `${uncertain.length} mot${uncertain.length > 1 ? "s" : ""} marqué${uncertain.length > 1 ? "s" : ""} comme incertain${uncertain.length > 1 ? "s" : ""} : ${uncertain.slice(0, 3).join(", ")}${uncertain.length > 3 ? "…" : ""}. Vérifie avant d'analyser.`
                  : "Texte extrait avec succès. Vérifie ou édite si nécessaire."}
            </div>
          </div>
          <div className="flex-1 px-5 py-4 overflow-auto">
            <label className="block text-[11px] text-[#6B7280] uppercase tracking-wide mb-2">
              Composition détectée
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              className="w-full h-full min-h-[200px] rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-[13px] leading-relaxed outline-none focus:border-[#111111] resize-none"
              aria-label="Composition INCI détectée"
            />
          </div>
          <div className="px-5 py-4 border-t border-[#E5E7EB] bg-white flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep("capture");
                setText("");
                setUncertain([]);
              }}
              className={`${GLASS_PILL} flex-1 py-3 text-sm font-medium`}
            >
              Reprendre
            </button>
            <button
              type="button"
              onClick={analyse}
              disabled={text.trim().length === 0}
              className={`${GLASS_PILL_DARK} flex-1 py-3 text-sm font-semibold disabled:opacity-40`}
            >
              Analyser cette liste
            </button>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-white/80">{errorMsg ?? "Échec inconnu."}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("capture")}
              className="rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-5 py-2.5"
            >
              Réessayer
            </button>
            <button
              type="button"
              onClick={() => router.push("/?mode=paste")}
              className="rounded-xl bg-white text-black text-sm font-semibold px-5 py-2.5"
            >
              Saisir à la main
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Corners() {
  const base =
    "absolute h-6 w-6 border-white/80";
  return (
    <>
      <div className={`${base} top-3 left-3 border-l-2 border-t-2 rounded-tl-lg`} />
      <div className={`${base} top-3 right-3 border-r-2 border-t-2 rounded-tr-lg`} />
      <div className={`${base} bottom-3 left-3 border-l-2 border-b-2 rounded-bl-lg`} />
      <div className={`${base} bottom-3 right-3 border-r-2 border-b-2 rounded-br-lg`} />
    </>
  );
}
