"use client";

import { useState } from "react";
import Link from "next/link";
import { GLASS_CARD } from "@/lib/ui/glass";
import { BeautyProfileForm } from "./BeautyProfileForm";
import {
  HAIR_CONCERN_LABEL,
  isProfileComplete,
  SKIN_CONCERN_LABEL,
  SKIN_TYPE_BODY_LABEL,
  SKIN_TYPE_FACE_LABEL,
  type SkinProfile,
} from "@/lib/skin/profile";

/**
 * Compact, inline "Profil beauté" card for /profile.
 *
 * Two modes:
 *  - read  : shows current skin type + concerns + hair + allergies (or a CTA
 *            to complete the profile when empty)
 *  - edit  : delegates to BeautyProfileForm — single source of truth shared
 *            with the Beauty Advisor onboarding.
 *
 * Renamed from "Profil peau" to "Profil beauté" because the profile now
 * covers more than skin (hair, allergies, free-form notes).
 */
export function SkinProfileCard({ initial }: { initial: SkinProfile }) {
  const [editing, setEditing] = useState(false);

  const filled = isProfileComplete(initial);

  if (!editing) {
    return (
      <section className={`${GLASS_CARD} p-5`}>
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <FaceIcon className="h-6 w-6 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-[15px] font-semibold text-ink leading-tight">Profil beauté</h2>
              <p className="text-[12px] text-[#6B7280] mt-0.5">Peau, cheveux, sensibilités</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#F43F5E] ring-1 ring-rose-200 hover:bg-rose-50 transition shrink-0"
          >
            <PencilIcon className="h-3.5 w-3.5" />
            {filled ? "Modifier" : "Compléter"}
          </button>
        </header>

        {filled ? (
          <ReadView profile={initial} />
        ) : (
          <p className="text-[13px] text-[#6B7280] leading-relaxed">
            Renseigne ton type de peau, tes préoccupations, tes cheveux et tes
            allergies pour que le Beauty Advisor adapte ses réponses à ton profil.
          </p>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#F9FAFB] ring-1 ring-black/[0.04] px-3 py-2.5">
          <InfoIcon className="h-4 w-4 text-[#6B7280] mt-0.5 shrink-0" />
          <p className="text-[11px] text-[#6B7280] leading-snug">
            Ces infos sont utilisées par le{" "}
            <Link href="/advisor" className="underline hover:text-[#F43F5E]">
              Beauty Advisor
            </Link>
            {" "}
            pour personnaliser ses réponses.
          </p>
        </div>
      </section>
    );
  }

  // Edit mode: NO outer card. The form's per-section fieldsets already
  // provide their own chrome, so wrapping them again would just nest cards.
  // The freed horizontal space is exploited by the form's `lg:grid-cols-2`.
  return (
    <section>
      <header className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-sm font-semibold">Profil beauté</h2>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-[12px] text-[#6B7280] hover:text-ink"
        >
          Annuler
        </button>
      </header>
      <BeautyProfileForm
        initial={initial}
        onSaved={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    </section>
  );
}

function ReadView({ profile }: { profile: SkinProfile }) {
  const concerns = profile.concerns ?? [];
  const hairConcerns = profile.hairConcerns ?? [];
  const faceText = profile.skinTypeFace
    ? SKIN_TYPE_FACE_LABEL[profile.skinTypeFace]
    : profile.otherSkinTypeFace
      ? `${profile.otherSkinTypeFace} (autre)`
      : null;
  const bodyText = profile.skinTypeBody
    ? SKIN_TYPE_BODY_LABEL[profile.skinTypeBody]
    : profile.otherSkinTypeBody
      ? `${profile.otherSkinTypeBody} (autre)`
      : null;
  return (
    <ul className="divide-y divide-black/[0.06]">
      {faceText && (
        <li className="flex items-start gap-3 py-3">
          <DropIcon className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-[#6B7280] font-medium">
              Type de peau visage
            </p>
            <p className="text-[14px] font-semibold text-ink mt-0.5">{faceText}</p>
          </div>
        </li>
      )}

      {bodyText && (
        <li className="flex items-start gap-3 py-3">
          <DropIcon className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-[#6B7280] font-medium">
              Type de peau corps
            </p>
            <p className="text-[14px] font-semibold text-ink mt-0.5">{bodyText}</p>
          </div>
        </li>
      )}

      <li className="flex items-start gap-3 py-3">
        <AlertIcon className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-[#6B7280] font-medium">
            Préoccupations
          </p>
          <div className="mt-1.5">
            {concerns.length === 0 && !profile.otherConcerns ? (
              <span className="text-ink-muted text-[13px]">-</span>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {concerns.map((c) => (
                  <li
                    key={c}
                    className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[12px] font-medium text-rose-700 ring-1 ring-rose-100"
                  >
                    {SKIN_CONCERN_LABEL[c]}
                  </li>
                ))}
                {profile.otherConcerns ? (
                  <li className="inline-flex items-center rounded-full bg-rose-50/60 px-2.5 py-0.5 text-[12px] font-medium text-rose-700/90 ring-1 ring-rose-100">
                    {profile.otherConcerns}
                  </li>
                ) : null}
              </ul>
            )}
          </div>
        </div>
      </li>

      {(hairConcerns.length > 0 || profile.otherHair) && (
        <li className="flex items-start gap-3 py-3">
          <HairIcon className="h-5 w-5 text-sky-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-[#6B7280] font-medium">
              Cheveux
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {hairConcerns.map((c) => (
                <li
                  key={c}
                  className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[12px] font-medium text-sky-700 ring-1 ring-sky-100"
                >
                  {HAIR_CONCERN_LABEL[c]}
                </li>
              ))}
              {profile.otherHair ? (
                <li className="inline-flex items-center rounded-full bg-sky-50/60 px-2.5 py-0.5 text-[12px] font-medium text-sky-700/90 ring-1 ring-sky-100">
                  {profile.otherHair}
                </li>
              ) : null}
            </ul>
          </div>
        </li>
      )}

      <li className="flex items-start gap-3 py-3">
        <LeafIcon className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-[#6B7280] font-medium">
            Allergies / intolérances
          </p>
          <p className="text-[14px] font-semibold text-ink mt-0.5 whitespace-pre-wrap break-words">
            {profile.allergiesFreeform?.trim() || "Aucune renseignée"}
          </p>
        </div>
      </li>

      {profile.otherNotes ? (
        <li className="flex items-start gap-3 py-3">
          <NoteIcon className="h-5 w-5 text-violet-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-[#6B7280] font-medium">
              Autres précisions
            </p>
            <p className="text-[13px] text-ink-muted mt-0.5 whitespace-pre-wrap break-words">
              {profile.otherNotes}
            </p>
          </div>
        </li>
      ) : null}
    </ul>
  );
}

function FaceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14c.9 1.1 2.1 1.7 3.5 1.7s2.6-.6 3.5-1.7" />
      <circle cx="9" cy="10" r="0.6" fill="currentColor" />
      <circle cx="15" cy="10" r="0.6" fill="currentColor" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function DropIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.5c-.4 0-.78.2-1.02.55C9.36 5.3 5 11.36 5 14.8a7 7 0 0 0 14 0c0-3.44-4.36-9.5-5.98-11.75A1.26 1.26 0 0 0 12 2.5z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 3c-9 0-13 5-13 11 0 4 2 7 6 7s10-5 10-13c0-2-1-4-3-5z" />
      <path d="M8 21c0-5 3-9 7-11" />
    </svg>
  );
}

function HairIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 14a7 7 0 0 1 14 0v6" />
      <path d="M5 14v6" />
      <path d="M9 14c0-3 1-6 3-9" />
      <path d="M15 14c0-3-1-6-3-9" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <circle cx="12" cy="8" r="0.6" fill="currentColor" />
    </svg>
  );
}
