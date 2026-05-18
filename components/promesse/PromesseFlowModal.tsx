"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GLASS_PILL, GLASS_PILL_DARK } from "@/lib/ui/glass";
import { apiFetch } from "@/lib/clientApi";
import type { IdentifyCandidate, IdentifyResponse } from "@/app/api/promesse/identify/route";
import type { FetchDescriptionResponse } from "@/app/api/promesse/fetch-description/route";

type Step = "identifying" | "pickCandidate" | "fetchingDescription" | "manualPromise" | "redirecting" | "error";

const MIN_MANUAL_DESC = 30;
const MAX_MANUAL_DESC = 4000;

export function PromesseFlowModal({
  open,
  onClose,
  inci,
  productLabel,
  brand,
  productType,
  analysisId,
}: {
  open: boolean;
  onClose: () => void;
  inci: string;
  productLabel: string | null;
  brand: string | null;
  productType: string | null;
  analysisId: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identifying");
  const [candidates, setCandidates] = useState<IdentifyCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [manualDescription, setManualDescription] = useState("");
  const [notFoundReason, setNotFoundReason] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Reset state and kick off the identification each time the modal opens.
    setStep("identifying");
    setCandidates([]);
    setError(null);
    setManualDescription("");
    setNotFoundReason(null);
    void identify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  async function identify() {
    try {
      const r = await apiFetch("/api/promesse/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inci, productLabel, brand, productType }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as {
          error?: string;
          credits?: { used?: number; limit?: number; remaining?: number };
        };
        // Quota exhausted: the global CreditsExhaustedModal is already showing
        // (apiFetch dispatches the event on 429-with-credits). Fold this sheet
        // away so the user isn't staring at two stacked dialogs.
        if (r.status === 429 && j?.credits) {
          onClose();
          return;
        }
        setError(j.error ?? `Erreur ${r.status}`);
        setStep("error");
        return;
      }
      const data = (await r.json()) as IdentifyResponse;
      if (data.notFound) {
        setNotFoundReason(data.reason);
        setStep("manualPromise");
        return;
      }
      setCandidates(data.candidates);
      setStep("pickCandidate");
    } catch (err) {
      setError((err as Error).message ?? "Erreur réseau");
      setStep("error");
    }
  }

  async function pickCandidate(c: IdentifyCandidate) {
    setStep("fetchingDescription");
    setError(null);
    try {
      const r = await apiFetch("/api/promesse/fetch-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: c.sourceUrl,
          candidateName: c.name,
          brand: c.brand,
          productType: c.productType,
          analysisId,
        }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as {
          error?: string;
          credits?: { used?: number; limit?: number; remaining?: number };
        };
        if (r.status === 429 && j?.credits) {
          onClose();
          return;
        }
        setError(j.error ?? `Erreur ${r.status}`);
        setStep("error");
        return;
      }
      const data = (await r.json()) as FetchDescriptionResponse;
      if (data.notFound) {
        // Couldn't fetch a description but we still know which product it is -
        // jump straight to the manual entry with the candidate name as hint.
        setNotFoundReason(data.reason);
        setStep("manualPromise");
        return;
      }
      jumpToWizard(data.description);
    } catch (err) {
      setError((err as Error).message ?? "Erreur réseau");
      setStep("error");
    }
  }

  function submitManual() {
    const desc = manualDescription.trim();
    if (desc.length < MIN_MANUAL_DESC) {
      setError(`Décris la promesse en au moins ${MIN_MANUAL_DESC} caractères.`);
      return;
    }
    jumpToWizard(desc);
  }

  function jumpToWizard(description: string) {
    setStep("redirecting");
    const params = new URLSearchParams();
    if (analysisId) params.set("analysisId", analysisId);
    params.set("description", description.slice(0, MAX_MANUAL_DESC));
    router.push(`/promesses/nouvelle?${params.toString()}`);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end lg:items-center justify-center bg-[rgba(17,17,17,0.55)] animate-[fadeIn_180ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-label="Analyser la promesse du produit"
      onClick={onClose}
    >
      <div
        className="w-full lg:max-w-xl bg-white rounded-t-3xl lg:rounded-3xl shadow-xl pb-6 pt-3 lg:pt-6 max-h-[88vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden mx-auto h-1 w-10 rounded-full bg-[#D1D5DB] mb-4" aria-hidden />

        <div className="px-5 lg:px-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[18px] font-semibold text-ink">Analyser la promesse</h2>
              <p className="text-[12px] text-[#6B7280] mt-0.5">
                On compare ce que le produit prétend faire avec ce qu&apos;il y a vraiment dedans.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="shrink-0 grid h-8 w-8 place-items-center rounded-full text-[#6B7280] hover:bg-black/[0.04] hover:text-ink"
            >
              <span aria-hidden className="text-lg leading-none">×</span>
            </button>
          </div>

          {step === "identifying" && (
            <Loader headline="Recherche du produit…" subline="On parcourt le web pour retrouver ta référence à partir de la composition." />
          )}

          {step === "fetchingDescription" && (
            <Loader headline="Récupération de la promesse…" subline="On lit la fiche officielle pour extraire les claims marketing." />
          )}

          {step === "pickCandidate" && (
            <div className="space-y-3">
              <p className="text-[13px] text-[#6B7280]">
                On a trouvé {candidates.length === 1 ? "un candidat" : `${candidates.length} candidats`}. Choisis le bon produit pour récupérer sa promesse.
              </p>
              <ul className="space-y-2">
                {candidates.map((c, i) => (
                  <li key={`${c.name}-${i}`}>
                    <button
                      type="button"
                      onClick={() => pickCandidate(c)}
                      className="w-full text-left rounded-2xl ring-1 ring-[#E5E7EB] hover:ring-[#111111] bg-white p-3 transition group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {c.brand && (
                            <div className="text-[10px] uppercase tracking-wide text-pink-500/80 font-semibold">
                              {c.brand}
                            </div>
                          )}
                          <div className="text-[14px] font-semibold text-ink leading-snug">
                            {c.name}
                          </div>
                          {c.productType && (
                            <div className="text-[11px] text-[#6B7280] mt-0.5">
                              {c.productType}
                            </div>
                          )}
                          <a
                            href={c.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-block mt-1.5 text-[11px] text-rose-500 hover:underline truncate max-w-full"
                          >
                            <span aria-hidden className="inline-block blur-[4px] select-none align-middle">
                              {prettyHost(c.sourceUrl)}
                            </span>
                            <span className="sr-only">{prettyHost(c.sourceUrl)}</span>
                            {" "}↗
                          </a>
                        </div>
                        <div className="shrink-0 text-right">
                          <ConfidenceBadge value={c.confidence} />
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              {/* Restyled as a clearly clickable green pill - the previous
                  flat phrase read like body copy and users missed it. Uses
                  emerald-50/200 so it doesn't compete visually with the
                  primary emerald-500 "Analyser la promesse" button outside
                  the modal. */}
              <button
                type="button"
                onClick={() => {
                  setNotFoundReason("user_rejected_candidates");
                  setStep("manualPromise");
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold ring-1 ring-emerald-200 hover:ring-emerald-300 py-2.5 px-4 text-[13px] transition"
              >
                <span aria-hidden>✎</span>
                Aucun de ceux-ci - décrire la promesse moi-même
              </button>
            </div>
          )}

          {step === "manualPromise" && (
            <div className="space-y-3">
              <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 px-3 py-2 text-[12px] text-amber-900">
                {notFoundReason === "user_rejected_candidates"
                  ? "Pas de problème - décris toi-même la promesse du produit telle qu'elle apparaît sur l'emballage."
                  : "On n'a pas pu retrouver le produit ou sa fiche officielle. Décris ce qu'il promet pour qu'on puisse analyser la cohérence."}
              </div>
              <label htmlFor="manual-desc" className="block text-[12px] font-medium text-[#374151]">
                Que prétend faire ce produit ?
              </label>
              <textarea
                id="manual-desc"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value.slice(0, MAX_MANUAL_DESC))}
                rows={6}
                placeholder="Ex : Crème hydratante visage 24 h. Renforce la barrière cutanée, apaise les peaux sèches. Sans parfum, formule riche en céramides…"
                className="w-full rounded-xl bg-white ring-1 ring-[#E5E7EB] px-3 py-2.5 text-[13px] outline-none transition focus:ring-2 focus:ring-rose-300"
              />
              <div className="flex items-center justify-between text-[11px] text-[#9CA3AF]">
                <span>{manualDescription.trim().length} caractères</span>
                <span>min {MIN_MANUAL_DESC} · max {MAX_MANUAL_DESC}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`${GLASS_PILL} px-4 py-2.5 text-[13px] font-medium`}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submitManual}
                  className={`${GLASS_PILL_DARK} flex-1 px-4 py-2.5 text-[13px] font-semibold`}
                >
                  Lancer l&apos;analyse de cohérence
                </button>
              </div>
            </div>
          )}

          {step === "redirecting" && (
            <Loader headline="Préparation de l'analyse…" subline="On t'emmène vers l'analyse de cohérence." />
          )}

          {step === "error" && (
            <div className="space-y-3">
              <p role="alert" className="text-[13px] text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                {error ?? "Une erreur est survenue."}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`${GLASS_PILL} flex-1 px-4 py-2.5 text-[13px] font-medium`}
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("identifying");
                    void identify();
                  }}
                  className={`${GLASS_PILL_DARK} flex-1 px-4 py-2.5 text-[13px] font-semibold`}
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {error && step !== "error" && step !== "manualPromise" && (
            <p role="alert" className="mt-3 text-[12px] text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}

function Loader({ headline, subline }: { headline: string; subline: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10">
      <div className="h-10 w-10 rounded-full border-2 border-rose-200 border-t-rose-500 animate-spin" />
      <p className="mt-3 text-[14px] font-semibold text-ink">{headline}</p>
      <p className="mt-1 text-[12px] text-[#6B7280] max-w-xs">{subline}</p>
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    value >= 0.8
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : value >= 0.6
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-[#F3F4F6] text-[#6B7280] ring-[#E5E7EB]";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tone}`}>
      {pct}% confiance
    </span>
  );
}

function prettyHost(url: string): string {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}
