"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProcessingOverlay, randomProcessingTotal } from "../ProcessingOverlay";
import { apiFetch } from "@/lib/clientApi";
import { quickInciSanityCheck } from "@/lib/ai/validate";

// Step lifecycle:
//   capture     - user picks photo(s)
//   processing  - OCR running
//   navigating  - OCR succeeded + sanity check passed: bridge while /analyse loads
//   no_inci     - OCR returned but the text doesn't look like an INCI list
//                 (or Vision + Tesseract both failed). We stay here with a
//                 friendly recovery screen rather than dropping the user on
//                 the analyse error page.
type Step = "capture" | "processing" | "navigating" | "no_inci";

type FrontInfo = {
  productName: string | null;
  brand: string | null;
  productType: string | null;
};

type NoInciReason = "ocr_failed" | "no_list_found";

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noInciReason, setNoInciReason] = useState<NoInciReason>("no_list_found");
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

  /** Stash text + identity in sessionStorage and route to /analyse. We do this
   *  through the same overlay AnalysisRunner paints on mount so the user
   *  never sees the OCR raw text. */
  function handoff(text: string, front: FrontInfo | null) {
    try {
      sessionStorage.setItem(PENDING_INCI_KEY, text);
      if (front && (front.brand || front.productName)) {
        sessionStorage.setItem(
          PENDING_SOURCE_KEY,
          JSON.stringify({
            source: "photo",
            sourceUrl: null,
            brand: front.brand ?? null,
            productName: front.productName ?? null,
            productType: front.productType ?? null,
          }),
        );
      } else {
        sessionStorage.removeItem(PENDING_SOURCE_KEY);
      }
    } catch {
      /* ignore */
    }
    setNavBudget(randomProcessingTotal());
    setStep("navigating");
    router.push(`/analyse?inci=${encodeURIComponent(text.slice(0, 6000))}`);
  }

  async function process() {
    if (!backFile) {
      setErrorMsg("La photo des ingrédients (au dos) est obligatoire.");
      return;
    }
    setErrorMsg(null);
    setStep("processing");

    let extractedText: string | null = null;
    let frontInfo: FrontInfo | null = null;

    // Primary: server-side Vision OCR on both photos in parallel.
    try {
      const fd = new FormData();
      fd.append("image_back", backFile);
      if (frontFile) fd.append("image_front", frontFile);
      const r = await apiFetch("/api/ocr", { method: "POST", body: fd });
      if (r.ok) {
        const data = (await r.json()) as {
          found: boolean;
          text?: string;
          uncertain?: string[];
          reason?: string;
          front?: { found: boolean; productName: string | null; brand: string | null; productType: string | null } | null;
        };
        if (data.found && typeof data.text === "string") {
          extractedText = data.text;
          if (data.front && data.front.found) {
            frontInfo = {
              productName: data.front.productName,
              brand: data.front.brand,
              productType: data.front.productType,
            };
          }
        }
      }
    } catch {
      // ignore - go to fallback
    }

    // Fallback: Tesseract.js client-side on the back photo only.
    if (extractedText === null) {
      try {
        const { default: Tesseract } = await import("tesseract.js");
        const { data: ocr } = await Tesseract.recognize(backFile, "eng+fra");
        const cleanedText = (ocr.text ?? "").replace(/\s+/g, " ").trim();
        if (cleanedText) {
          extractedText = cleanedText;
        }
      } catch {
        /* ignore */
      }
    }

    if (extractedText === null) {
      // Both pipelines failed entirely. Photo unreadable.
      setNoInciReason("ocr_failed");
      setStep("no_inci");
      return;
    }

    // OCR returned something. Check it actually looks like an INCI list
    // before bouncing the user to /analyse — saves them landing on the
    // generic "Texte trop court" error.
    const sanity = quickInciSanityCheck(extractedText);
    if (!sanity.ok) {
      setNoInciReason("no_list_found");
      setStep("no_inci");
      return;
    }

    handoff(extractedText, frontInfo);
  }

  function reset() {
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    if (backPreview) URL.revokeObjectURL(backPreview);
    setFrontFile(null);
    setBackFile(null);
    setFrontPreview(null);
    setBackPreview(null);
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
          {step === "capture" ? "Photos du produit" : ""}
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

      {step === "no_inci" && (
        <NoInciScreen
          reason={noInciReason}
          backPreview={backPreview}
          onRetake={reset}
          onPaste={() => router.push("/?mode=paste")}
        />
      )}
    </div>
  );
}

function NoInciScreen({
  reason,
  backPreview,
  onRetake,
  onPaste,
}: {
  reason: NoInciReason;
  backPreview: string | null;
  onRetake: () => void;
  onPaste: () => void;
}) {
  const title =
    reason === "ocr_failed"
      ? "On n'arrive pas à lire la photo"
      : "Pas de liste d'ingrédients trouvée";
  const subtitle =
    reason === "ocr_failed"
      ? "Le texte est flou ou trop sombre pour être déchiffré."
      : "La photo ne semble pas contenir une liste INCI. C'est peut-être un produit sans liste visible côté affiché, ou la photo cadre la mauvaise face de l'emballage.";

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-6 pt-6 pb-8 text-center">
      <div className="relative h-32 w-32 mb-5">
        {backPreview ? (
          <div
            aria-hidden
            className="absolute inset-0 rounded-3xl bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${backPreview})` }}
          />
        ) : (
          <div aria-hidden className="absolute inset-0 rounded-3xl bg-white/[0.04]" />
        )}
        <div
          aria-hidden
          className="absolute inset-0 rounded-3xl ring-1 ring-white/15 flex items-center justify-center backdrop-blur-sm"
        >
          <span className="text-4xl">🔎</span>
        </div>
      </div>

      <h2 className="text-[18px] font-semibold mb-2">{title}</h2>
      <p className="text-[13px] text-white/70 leading-relaxed max-w-sm">
        {subtitle}
      </p>

      <div className="mt-6 w-full max-w-sm rounded-2xl bg-white/[0.04] ring-1 ring-white/10 px-4 py-3 text-left">
        <p className="text-[11px] uppercase tracking-wide font-semibold text-white/50 mb-2">
          Astuces pour une meilleure photo
        </p>
        <ul className="space-y-1.5 text-[12.5px] text-white/75">
          <li className="flex items-start gap-2">
            <span aria-hidden className="text-white/40 mt-0.5">·</span>
            <span>Cadre <span className="font-semibold text-white">la face où apparaît la liste INCI</span> (souvent au dos ou sous l&apos;étiquette).</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="text-white/40 mt-0.5">·</span>
            <span>Bonne lumière, sans reflet ni ombre sur le texte.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="text-white/40 mt-0.5">·</span>
            <span>Approche-toi pour que la liste remplisse le cadre, texte net.</span>
          </li>
        </ul>
      </div>

      <div className="mt-6 flex flex-col gap-2 w-full max-w-sm">
        <button
          type="button"
          onClick={onRetake}
          className="w-full rounded-xl bg-white text-black text-sm font-semibold py-3 hover:bg-white/90 transition"
        >
          Reprendre une photo
        </button>
        <button
          type="button"
          onClick={onPaste}
          className="w-full rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium py-3 transition"
        >
          Saisir la liste à la main
        </button>
      </div>
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
