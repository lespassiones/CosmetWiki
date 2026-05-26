"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductSearchResult } from "@/lib/productSearch/types";

type FoundPayload = {
  ingredientsText: string;
  brand: string | null;
  productName: string | null;
  source: string;
  sourceUrl: string | null;
  ean?: string | null;
};

type Props = {
  onFound: (input: FoundPayload) => void;
  /** Switch to the manual INCI tab. */
  onFallbackToManual: () => void;
  /** Switch to the product-name search tab. */
  onFallbackToProductSearch: () => void;
};

type ErrorReason =
  | "permission-denied"
  | "no-camera"
  | "insecure"
  | "unsupported"
  | "generic";

type ScannerState =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "scanning" }
  | { kind: "looking-up"; barcode: string }
  | { kind: "error"; message: string; reason: ErrorReason }
  | { kind: "not-found"; barcode: string };

// Format list passed to the native BarcodeDetector. Same set is supported by
// @zxing/browser (the fallback) automatically - no need to filter there.
const FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "qr_code",
  "code_128",
] as const;

// Mirrors the server-side check. A QR on a phone box typically encodes a URL
// or an IMEI (15 digits) - neither matches, so we drop them client-side and
// keep scanning instead of burning a request and the rate-limit budget.
const BARCODE_RE = /^\d{8,14}$/;

export function BarcodeScannerInput({
  onFound,
  onFallbackToManual,
  onFallbackToProductSearch,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<ScannerState>({ kind: "idle" });
  // Hold latest callbacks in refs so the camera effect doesn't re-run
  // when a parent re-render produces new function identities.
  const onFoundRef = useRef(onFound);
  useEffect(() => {
    onFoundRef.current = onFound;
  }, [onFound]);
  // Lets the JSX retry buttons resume the underlying decoder loop without
  // remounting the camera.
  const resumeDetectionRef = useRef<(() => void) | null>(null);
  const detectedRef = useRef(false);

  // Once the camera mounts we start decoding immediately.
  useEffect(() => {
    let aborted = false;
    let stream: MediaStream | null = null;
    let stopDecoder: (() => void) | null = null;

    async function lookupBarcode(barcode: string) {
      if (detectedRef.current) return;

      // Drop QR payloads that aren't numeric barcodes (URLs, IMEIs on phone
      // boxes…) without hitting the API, and keep scanning silently.
      if (!BARCODE_RE.test(barcode)) {
        resumeDetectionRef.current?.();
        return;
      }

      detectedRef.current = true;
      // small haptic cue on phones that support it
      try {
        navigator.vibrate?.(80);
      } catch {
        /* ignore */
      }
      setState({ kind: "looking-up", barcode });
      try {
        const r = await fetch("/api/product-by-barcode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode }),
        });
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          setState({
            kind: "error",
            reason: "generic",
            message: j.error ?? `Erreur ${r.status}`,
          });
          // Don't auto-resume: rate limits or server errors would loop right
          // back in. The retry button in the error panel resumes manually.
          detectedRef.current = false;
          return;
        }
        const data = (await r.json()) as ProductSearchResult;
        if (!data.found) {
          setState({ kind: "not-found", barcode });
          return;
        }
        onFoundRef.current({
          ingredientsText: data.ingredientsText,
          brand: data.brand,
          productName: data.productName,
          source: data.source,
          sourceUrl: data.sourceUrl,
          ean: barcode,
        });
      } catch (e) {
        setState({
          kind: "error",
          reason: "generic",
          message: (e as Error).message ?? "Erreur réseau",
        });
        detectedRef.current = false;
      }
    }

    async function start() {
      setState({ kind: "starting" });
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setState({
          kind: "error",
          reason: "unsupported",
          message:
            "Ton navigateur ne supporte pas l'accès à la caméra. Utilise un autre mode de saisie.",
        });
        return;
      }

      // getUserMedia silently fails outside a secure context. Surface a
      // specific message so the user knows reloading via HTTPS is the fix.
      if (typeof window !== "undefined" && window.isSecureContext === false) {
        setState({
          kind: "error",
          reason: "insecure",
          message:
            "Ouvre le site en HTTPS pour autoriser l'accès caméra (ou via localhost en développement).",
        });
        return;
      }

      // If the user has already denied camera permission for this origin,
      // Chrome won't show a prompt again - getUserMedia just rejects with
      // NotAllowedError. Detect that state up-front so we can show the
      // unblock instructions instead of pretending we just got refused.
      try {
        type CameraStatus = { state: "granted" | "denied" | "prompt" };
        const perms = (
          navigator as unknown as {
            permissions?: {
              query: (d: { name: string }) => Promise<CameraStatus>;
            };
          }
        ).permissions;
        const status = await perms?.query({ name: "camera" });
        if (aborted) return;
        if (status?.state === "denied") {
          setState({
            kind: "error",
            reason: "permission-denied",
            message:
              "L'accès caméra est bloqué pour ce site. Réautorise-la depuis les réglages du navigateur, puis recharge la page.",
          });
          return;
        }
      } catch {
        // Permissions API doesn't expose 'camera' on Safari < 16 / older
        // browsers. Fall through and let getUserMedia handle it.
      }

      try {
        // Prefer the rear camera on mobile (environment). On desktop the
        // browser will fall back to the default webcam silently.
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (aborted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setState({ kind: "scanning" });

        // Native BarcodeDetector (Chrome / Edge / Android Chrome).
        type BarcodeResult = { rawValue: string };
        type BarcodeDetectorCtor = new (opts: { formats: string[] }) => {
          detect: (source: HTMLVideoElement) => Promise<BarcodeResult[]>;
        };
        const NativeDetector = (
          window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }
        ).BarcodeDetector;
        if (NativeDetector) {
          const detector = new NativeDetector({
            formats: FORMATS as unknown as string[],
          });
          let raf = 0;
          const tick = async () => {
            if (aborted) return;
            try {
              const codes = await detector.detect(video);
              if (codes.length > 0) {
                const value = codes[0]!.rawValue.trim();
                if (value) {
                  void lookupBarcode(value);
                  return;
                }
              }
            } catch {
              /* transient decode error - keep going */
            }
            raf = requestAnimationFrame(tick);
          };
          const startTick = () => {
            raf = requestAnimationFrame(tick);
          };
          resumeDetectionRef.current = startTick;
          startTick();
          stopDecoder = () => cancelAnimationFrame(raf);
          return;
        }

        // Fallback : @zxing/browser (Safari iOS, Firefox). The reader's own
        // callback fires continuously, so resuming just means letting the
        // detectedRef gate fall again - no explicit restart needed.
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoElement(
          video,
          (result, err) => {
            if (aborted) return;
            void err; // ignore NotFoundException (no barcode in current frame)
            if (result) {
              const text = result.getText().trim();
              if (text) void lookupBarcode(text);
            }
          },
        );
        resumeDetectionRef.current = () => {};
        stopDecoder = () => controls.stop();
      } catch (e) {
        const err = e as DOMException;
        if (err.name === "NotAllowedError") {
          setState({
            kind: "error",
            reason: "permission-denied",
            message:
              "Accès caméra refusé. Réautorise la caméra dans les réglages du navigateur, puis recharge la page.",
          });
        } else if (
          err.name === "NotFoundError" ||
          err.name === "OverconstrainedError"
        ) {
          setState({
            kind: "error",
            reason: "no-camera",
            message: "Aucune caméra détectée sur cet appareil.",
          });
        } else {
          setState({
            kind: "error",
            reason: "generic",
            message: err.message ?? "Impossible de démarrer la caméra.",
          });
        }
      }
    }

    void start();
    return () => {
      aborted = true;
      stopDecoder?.();
      resumeDetectionRef.current = null;
      stream?.getTracks().forEach((t) => t.stop());
      const v = videoRef.current;
      if (v) v.srcObject = null;
    };
  }, []);

  const resumeScanning = () => {
    detectedRef.current = false;
    setState({ kind: "scanning" });
    resumeDetectionRef.current?.();
  };

  const isCamLive = state.kind === "scanning" || state.kind === "looking-up";

  return (
    <div className="w-full">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/90 ring-1 ring-black/10 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.18)]">
        <video
          ref={videoRef}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            isCamLive ? "opacity-100" : "opacity-30"
          }`}
          muted
          playsInline
        />
        {/* Viseur */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-2/3 w-4/5 max-w-md">
            <span className="absolute inset-0 rounded-2xl border-2 border-white/80" />
            {/* corners */}
            {[
              "top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl",
              "top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl",
              "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl",
              "bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl",
            ].map((cls, i) => (
              <span
                key={i}
                className={`absolute h-7 w-7 border-rose-300 ${cls}`}
                aria-hidden
              />
            ))}
            {/* horizontal scan line */}
            {state.kind === "scanning" ? (
              <span
                aria-hidden
                className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-rose-400 to-transparent shadow-[0_0_18px_2px_rgba(244,63,94,0.55)]"
              />
            ) : null}
          </div>
        </div>

        {/* Status overlay */}
        {state.kind === "starting" ? (
          <CenteredPanel>Activation de la caméra…</CenteredPanel>
        ) : null}
        {state.kind === "looking-up" ? (
          <CenteredPanel>
            <span className="block">Code détecté</span>
            <span className="mt-1 block font-mono text-[12px] text-white/70">
              {state.barcode}
            </span>
            <span className="mt-3 block text-[13px] text-white/80">
              Recherche du produit…
            </span>
          </CenteredPanel>
        ) : null}
      </div>

      <p className="mt-3 text-center text-[13px] text-ink-subtle">
        Approche le code-barres ou le QR du produit du cadre. La caméra scanne
        en continu.
      </p>

      {state.kind === "error" ? (
        <div className="mt-4 rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100">
          <p className="text-[13px] font-medium text-rose-700">
            {state.message}
          </p>
          {state.reason === "permission-denied" ? (
            <PermissionDeniedHelp />
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {state.reason === "permission-denied" ? (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink ring-1 ring-black/[0.06] transition-colors hover:bg-rose-100/30"
              >
                Recharger la page
              </button>
            ) : (
              <button
                type="button"
                onClick={resumeScanning}
                className="rounded-xl bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink ring-1 ring-black/[0.06] transition-colors hover:bg-rose-100/30"
              >
                Scanner un autre code
              </button>
            )}
            <button
              type="button"
              onClick={onFallbackToProductSearch}
              className="rounded-xl bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink ring-1 ring-black/[0.06] transition-colors hover:bg-rose-100/30"
            >
              Chercher par nom
            </button>
            <button
              type="button"
              onClick={onFallbackToManual}
              className="rounded-xl bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink ring-1 ring-black/[0.06] transition-colors hover:bg-rose-100/30"
            >
              Coller la liste INCI
            </button>
          </div>
        </div>
      ) : null}

      {state.kind === "not-found" ? (
        <div className="mt-4 rounded-2xl bg-white/65 p-4 ring-1 ring-white/70">
          <p className="text-[14px] text-ink">
            Code-barres{" "}
            <span className="font-mono text-[12px]">{state.barcode}</span> non
            référencé sur Open Beauty Facts.
          </p>
          <p className="mt-1 text-[13px] text-ink-muted">
            Tu peux chercher le produit par son nom, ou coller la liste INCI
            telle qu'elle apparaît sur le packaging.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onFallbackToProductSearch}
              className="rounded-xl bg-gradient-to-b from-rose-400 to-pink-400 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(251,113,133,0.55),inset_0_1px_0_0_rgba(255,255,255,0.30)] transition-all hover:from-rose-500 hover:to-pink-500"
            >
              Chercher par nom
            </button>
            <button
              type="button"
              onClick={onFallbackToManual}
              className="rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-ink ring-1 ring-black/[0.06] transition-colors hover:bg-white"
            >
              Coller la liste INCI
            </button>
            <button
              type="button"
              onClick={resumeScanning}
              className="rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-ink ring-1 ring-black/[0.06] transition-colors hover:bg-white"
            >
              Scanner un autre code
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PermissionDeniedHelp() {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const platform: "ios" | "android" | "desktop" = /iPhone|iPad|iPod/i.test(ua)
    ? "ios"
    : /Android/i.test(ua)
      ? "android"
      : "desktop";

  if (platform === "ios") {
    return (
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-[13px] text-rose-700/90">
        <li>
          Touche le <strong>« AA »</strong> à gauche de la barre d&apos;adresse.
        </li>
        <li>
          Choisis <strong>Réglages du site web</strong> →{" "}
          <strong>Caméra</strong> → <strong>Autoriser</strong>.
        </li>
        <li>Recharge la page.</li>
      </ol>
    );
  }
  if (platform === "android") {
    return (
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-[13px] text-rose-700/90">
        <li>
          Touche l&apos;icône <strong>cadenas</strong> à gauche de l&apos;URL.
        </li>
        <li>
          Ouvre <strong>Autorisations</strong> → <strong>Caméra</strong> →{" "}
          <strong>Autoriser</strong>.
        </li>
        <li>Recharge la page.</li>
      </ol>
    );
  }
  return (
    <ol className="mt-3 list-decimal space-y-1 pl-5 text-[13px] text-rose-700/90">
      <li>
        Clique sur le <strong>cadenas</strong> à gauche de l&apos;URL.
      </li>
      <li>
        Passe <strong>Caméra</strong> sur <em>Autoriser</em>.
      </li>
      <li>Recharge la page.</li>
    </ol>
  );
}

function CenteredPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="rounded-xl bg-black/60 px-4 py-3 text-center text-[14px] font-medium text-white backdrop-blur-md">
        {children}
      </div>
    </div>
  );
}
