"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProcessingOverlay, randomProcessingTotal } from "../ProcessingOverlay";
import { GLASS_PILL, GLASS_PILL_DARK } from "@/lib/ui/glass";

// Bridge between "user clicked Analyser" and "AnalysisRunner has mounted on
// /analyse". Without this bridge the user sees the review page for the 1-2 s
// it takes Next.js to fetch the RSC payload for the destination.
type Step = "capture" | "processing" | "review" | "error" | "navigating";

type FrontInfo = {
  productName: string | null;
  brand: string | null;
  productType: string | null;
};

// Mirror the constants ScanSheet uses so the rest of the app (AnalysisRunner,
// ProductHero) reads the same handoff keys regardless of entry point.
const PENDING_INCI_KEY = "cw:pendingInci";
const PENDING_SOURCE_KEY = "cw:pendingProductSource";

export function PhotoOcrFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("capture");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [uncertain, setUncertain] = useState<string[]>([]);
  const [front, setFront] = useState<FrontInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [navBudget, setNavBudget] = useState<number>(0);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Revoke blob URLs on unmount / replacement so we don't leak previews.
  useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      if (backPreview) URL.revokeObjectURL(backPreview);
    };
  }, [frontPreview, backPreview]);

  function pickFront(file: File) {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Le fichier sélectionné n'est pas une image.");
      return;
    }
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    setFrontFile(file);
    setFrontPreview(URL.createObjectURL(file));
    setErrorMsg(null);
  }

  function pickBack(file: File) {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Le fichier sélectionné n'est pas une image.");
      return;
    }
    if (backPreview) URL.revokeObjectURL(backPreview);
    setBackFile(file);
    setBackPreview(URL.createObjectURL(file));
    setErrorMsg(null);
  }

  async function process() {
    if (!backFile) {
      setErrorMsg("La photo des ingrédients (au dos) est obligatoire.");
      return;
    }
    setErrorMsg(null);
    setUsingFallback(false);
    setStep("processing");

    // Primary: server-side Vision OCR on both photos in parallel.
    let primaryOk = false;
    try {
      const fd = new FormData();
      fd.append("image_back", backFile);
      if (frontFile) fd.append("image_front", frontFile);
      const r = await fetch("/api/ocr", { method: "POST", body: fd });
      if (r.ok) {
        const data = (await r.json()) as {
          found: boolean;
          text?: string;
          uncertain?: string[];
          reason?: string;
          front?: { found: boolean; productName: string | null; brand: string | null; productType: string | null } | null;
        };
        if (data.found && typeof data.text === "string") {
          setText(data.text);
          setUncertain(data.uncertain ?? []);
          if (data.front && data.front.found) {
            setFront({
              productName: data.front.productName,
              brand: data.front.brand,
              productType: data.front.productType,
            });
          } else {
            setFront(null);
          }
          setStep("review");
          primaryOk = true;
        }
      }
    } catch {
      // ignore — go to fallback
    }

    if (primaryOk) return;

    // Fallback: Tesseract.js client-side on the back photo only (front
    // identity isn't critical, the user can still proceed without it).
    try {
      setUsingFallback(true);
      const { default: Tesseract } = await import("tesseract.js");
      const { data: ocr } = await Tesseract.recognize(backFile, "eng+fra");
      const cleanedText = (ocr.text ?? "").replace(/\s+/g, " ").trim();
      if (!cleanedText) throw new Error("empty");
      setText(cleanedText);
      setUncertain([]);
      setFront(null);
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
    // Stash the INCI in sessionStorage BEFORE navigating. AnalysisRunner
    // reads this key first and only falls back to the URL searchParam if
    // it's missing — without this, Next.js can serve a prefetched `/analyse`
    // shell with no inci and bounce the user back to the home page.
    try {
      sessionStorage.setItem(PENDING_INCI_KEY, t);
      // If the front OCR yielded any identity info, stash it so the analyser
      // pipeline can use it as productLabel and as input to the web-search
      // identification step later. We mirror the shape ProductSearchInput
      // uses to keep the downstream consumers (ProductHero, AnalyseResultPanel)
      // happy without branching.
      if (front && (front.brand || front.productName)) {
        const productName = front.productName ?? "";
        const brand = front.brand ?? "";
        sessionStorage.setItem(
          PENDING_SOURCE_KEY,
          JSON.stringify({
            source: "photo",
            sourceUrl: null,
            brand: brand || null,
            productName: productName || null,
            productType: front.productType ?? null,
          }),
        );
      } else {
        sessionStorage.removeItem(PENDING_SOURCE_KEY);
      }
    } catch {
      /* ignore */
    }
    // Bridge the 1-2 s Next.js round-trip with the same overlay AnalysisRunner
    // will paint on mount. Without this the review page sits idle while
    // /analyse loads, which feels like the click didn't register.
    setNavBudget(randomProcessingTotal());
    setStep("navigating");
    router.push(`/analyse?inci=${encodeURIComponent(t.slice(0, 6000))}`);
  }

  function reset() {
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    if (backPreview) URL.revokeObjectURL(backPreview);
    setFrontFile(null);
    setBackFile(null);
    setFrontPreview(null);
    setBackPreview(null);
    setText("");
    setUncertain([]);
    setFront(null);
    setStep("capture");
  }

  // Soft-nav bridge: paint the same overlay AnalysisRunner will show on mount,
  // so the user gets immediate feedback while Next.js fetches the /analyse RSC.
  if (step === "navigating") {
    return (
      <ProcessingOverlay
        totalMs={navBudget}
        headline="On décode la composition…"
      />
    );
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
          {step === "capture" ? "Photos du produit" : step === "review" ? "Vérifie le texte" : ""}
        </h1>
        <div className="w-9" />
      </header>

      {step === "capture" && (
        <div className="flex-1 overflow-auto px-5 pb-6">
          <p className="text-[13px] text-white/70 text-center max-w-md mx-auto mt-1 mb-5">
            Prends <span className="font-semibold text-white">deux photos</span> : le devant pour identifier le produit, le dos pour lire les ingrédients. Les photos ne sont pas stockées.
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <UploadZone
              label="Devant"
              hint="Nom & marque"
              optional
              preview={frontPreview}
              onPick={pickFront}
              inputRef={frontInputRef}
            />
            <UploadZone
              label="Dos"
              hint="Liste INCI"
              preview={backPreview}
              onPick={pickBack}
              inputRef={backInputRef}
            />
          </div>

          <p className="text-[11px] text-white/40 text-center mt-4 max-w-md mx-auto">
            Le dos est obligatoire. Sans le devant, l&apos;analyse reste possible mais on ne pourra pas identifier le produit automatiquement.
          </p>

          {errorMsg && (
            <p role="alert" className="mt-3 max-w-md mx-auto text-[12px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {errorMsg}
            </p>
          )}

          <div className="mt-6 max-w-md mx-auto">
            <button
              type="button"
              onClick={process}
              disabled={!backFile}
              className="w-full rounded-xl bg-white text-black text-sm font-semibold py-3 hover:bg-white/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {backFile && frontFile ? "Analyser les deux photos" : backFile ? "Analyser (sans la photo de devant)" : "Ajoute au moins la photo du dos"}
            </button>
          </div>

          <p className="text-[11px] text-white/40 text-center mt-3 max-w-md mx-auto">
            Analyse via GPT-4o-mini Vision · Tesseract.js en secours si indisponible
          </p>
        </div>
      )}

      {step === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-sm text-white/70">
            {frontFile ? "Lecture du produit et de la composition…" : "Lecture de la composition…"}
          </p>
        </div>
      )}

      {step === "review" && (
        <div className="flex-1 flex flex-col bg-[#FAFAFA] text-[#111111] overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              {backPreview && (
                <div
                  aria-hidden
                  className="h-12 w-12 rounded-lg bg-cover bg-center bg-[#E5E7EB] shrink-0"
                  style={{ backgroundImage: `url(${backPreview})` }}
                />
              )}
              <div className="text-[12px] text-[#6B7280] flex-1">
                {usingFallback
                  ? "Texte extrait avec Tesseract.js (hors-ligne). Vérifie attentivement."
                  : uncertain.length > 0
                    ? `${uncertain.length} mot${uncertain.length > 1 ? "s" : ""} marqué${uncertain.length > 1 ? "s" : ""} comme incertain${uncertain.length > 1 ? "s" : ""} : ${uncertain.slice(0, 3).join(", ")}${uncertain.length > 3 ? "…" : ""}. Vérifie avant d'analyser.`
                    : "Texte extrait avec succès. Vérifie ou édite si nécessaire."}
              </div>
            </div>

            {front && (front.brand || front.productName) && (
              <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold mb-0.5">
                  Produit identifié
                </div>
                <div className="text-[13px] text-emerald-900">
                  {front.brand ? <span className="font-semibold">{front.brand}</span> : null}
                  {front.brand && front.productName ? " · " : null}
                  {front.productName ?? null}
                  {front.productType ? (
                    <span className="ml-2 inline-block text-[11px] text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                      {front.productType}
                    </span>
                  ) : null}
                </div>
              </div>
            )}
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
              onClick={reset}
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

function UploadZone({
  label,
  hint,
  preview,
  onPick,
  inputRef,
  optional = false,
}: {
  label: string;
  hint: string;
  preview: string | null;
  onPick: (f: File) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-white/30 hover:border-white/60 transition bg-white/[0.04] overflow-hidden flex flex-col items-center justify-center text-center"
      >
        {preview ? (
          <>
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${preview})` }}
            />
            <span className="relative z-10 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-full">
              Modifier
            </span>
          </>
        ) : (
          <>
            <svg className="h-7 w-7 text-white/60 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M3 7a2 2 0 0 1 2-2h2.5L9 3h6l1.5 2H19a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            <span className="text-[12px] font-semibold text-white">{label}</span>
            <span className="text-[10px] text-white/50 mt-0.5">{hint}</span>
            {optional && (
              <span className="absolute top-2 right-2 text-[9px] uppercase tracking-wide bg-white/10 text-white/70 px-1.5 py-0.5 rounded-full">
                option
              </span>
            )}
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          if (f) onPick(f);
          e.currentTarget.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}
