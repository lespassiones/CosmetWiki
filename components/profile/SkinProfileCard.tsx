"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveSkinProfile } from "@/app/advisor/actions";
import { GLASS_CARD, GLASS_PILL, GLASS_PILL_DARK } from "@/lib/ui/glass";
import {
  HAIR_CONCERN_LABEL,
  HAIR_CONCERNS,
  SKIN_CONCERN_LABEL,
  SKIN_CONCERNS,
  SKIN_TYPE_LABEL,
  SKIN_TYPES,
  type HairConcern,
  type SkinConcern,
  type SkinProfile,
  type SkinType,
} from "@/lib/skin/profile";

/**
 * Compact, inline "Profil peau" editor for /profile.
 *
 * Two modes:
 *  - read  : shows the current skin type + concerns + allergies (or a CTA to
 *            complete the profile when empty)
 *  - edit  : the same form as the advisor onboarding, pre-filled from `initial`
 *
 * Persists via the existing `saveSkinProfile` server action — single source
 * of truth, no duplicate validation.
 */
export function SkinProfileCard({ initial }: { initial: SkinProfile }) {
  const [editing, setEditing] = useState(false);

  const filled = Boolean(initial.skinType) && (initial.concerns?.length ?? 0) > 0;

  if (!editing) {
    return (
      <section className={`${GLASS_CARD} p-5`}>
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Profil peau</h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[12px] font-medium text-[#F43F5E] hover:underline"
          >
            {filled ? "Modifier" : "Compléter →"}
          </button>
        </header>

        {filled ? (
          <ReadView profile={initial} />
        ) : (
          <p className="text-[13px] text-[#6B7280] leading-relaxed">
            Renseigne ton type de peau, tes préoccupations et tes allergies
            pour que le Skin Advisor adapte ses réponses à ta peau.
          </p>
        )}

        <p className="mt-4 text-[11px] text-[#9CA3AF] leading-snug">
          Ces infos sont utilisées par le{" "}
          <Link href="/advisor" className="underline hover:text-[#F43F5E]">
            Skin Advisor
          </Link>
          {" "}
          pour personnaliser ses réponses.
        </p>
      </section>
    );
  }

  return (
    <section className={`${GLASS_CARD} p-5`}>
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Profil peau</h2>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-[12px] text-[#6B7280] hover:text-ink"
        >
          Annuler
        </button>
      </header>
      <SkinProfileForm
        initial={initial}
        onSaved={() => setEditing(false)}
      />
    </section>
  );
}

function ReadView({ profile }: { profile: SkinProfile }) {
  const concerns = profile.concerns ?? [];
  const hairConcerns = profile.hairConcerns ?? [];
  return (
    <dl className="space-y-3 text-sm">
      <div>
        <dt className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1">
          Type de peau
        </dt>
        <dd className="font-medium text-ink">
          {profile.skinType ? SKIN_TYPE_LABEL[profile.skinType] : "—"}
        </dd>
      </div>

      <div>
        <dt className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1.5">
          Préoccupations
        </dt>
        <dd>
          {concerns.length === 0 ? (
            <span className="text-ink-muted">—</span>
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
            </ul>
          )}
        </dd>
      </div>

      {/* Cheveux only shown in the read view when at least one is set —
          empty stays hidden to keep the card tidy. */}
      {hairConcerns.length > 0 && (
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1.5">
            Cheveux
          </dt>
          <dd>
            <ul className="flex flex-wrap gap-1.5">
              {hairConcerns.map((c) => (
                <li
                  key={c}
                  className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[12px] font-medium text-sky-700 ring-1 ring-sky-100"
                >
                  {HAIR_CONCERN_LABEL[c]}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      )}

      <div>
        <dt className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1">
          Allergies / intolérances
        </dt>
        <dd className="text-ink-muted text-[13px] whitespace-pre-wrap">
          {profile.allergiesFreeform?.trim() || "Aucune renseignée"}
        </dd>
      </div>
    </dl>
  );
}

function SkinProfileForm({
  initial,
  onSaved,
}: {
  initial: SkinProfile;
  onSaved: () => void;
}) {
  const [skinType, setSkinType] = useState<SkinType | "">(initial.skinType ?? "");
  const [concerns, setConcerns] = useState<Set<SkinConcern>>(
    new Set(initial.concerns ?? []),
  );
  const [hairConcerns, setHairConcerns] = useState<Set<HairConcern>>(
    new Set(initial.hairConcerns ?? []),
  );
  const [allergies, setAllergies] = useState(initial.allergiesFreeform ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleConcern(c: SkinConcern) {
    setConcerns((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  function toggleHair(c: HairConcern) {
    setHairConcerns((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  function submit() {
    setError(null);
    if (!skinType) {
      setError("Choisis ton type de peau.");
      return;
    }
    if (concerns.size === 0) {
      setError("Sélectionne au moins une préoccupation.");
      return;
    }
    const fd = new FormData();
    fd.set("skin_type", skinType);
    for (const c of concerns) fd.append("concerns", c);
    for (const c of hairConcerns) fd.append("hair_concerns", c);
    if (allergies.trim()) fd.set("allergies", allergies.trim());
    startTransition(async () => {
      const r = await saveSkinProfile(fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      onSaved();
    });
  }

  // Each form section lives in its own opaque-white sub-card. The parent
  // SkinProfileCard uses a translucent GLASS_CARD background; making the
  // sub-sections fully white creates the visual hierarchy that was missing
  // (form sections clearly delimited, pills standing out from their section
  // background instead of melting into the card chrome).
  const SECTION = "rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]";
  const PILL_INACTIVE =
    "bg-[#F3F4F6] ring-1 ring-[#E5E7EB] text-ink hover:bg-[#E9EBEE]";

  return (
    <div className="space-y-3">
      <fieldset className={SECTION}>
        <legend className="text-[13px] font-semibold text-ink mb-2.5 px-1 -ml-1">
          Type de peau
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {SKIN_TYPES.map((t) => {
            const active = skinType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSkinType(t)}
                aria-pressed={active ? "true" : "false"}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                  active ? "bg-[#111111] text-white" : PILL_INACTIVE
                }`}
              >
                {SKIN_TYPE_LABEL[t]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className={SECTION}>
        <legend className="text-[13px] font-semibold text-ink mb-0.5 px-1 -ml-1">
          Préoccupations
        </legend>
        <p className="text-[11px] text-[#6B7280] mb-2.5">Plusieurs choix possibles.</p>
        <div className="flex flex-wrap gap-1.5">
          {SKIN_CONCERNS.map((c) => {
            const active = concerns.has(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleConcern(c)}
                aria-pressed={active ? "true" : "false"}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                  active ? "bg-[#F43F5E] text-white" : PILL_INACTIVE
                }`}
              >
                {SKIN_CONCERN_LABEL[c]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className={SECTION}>
        <legend className="text-[13px] font-semibold text-ink mb-0.5 px-1 -ml-1">
          Cheveux{" "}
          <span className="text-[11px] font-normal text-[#9CA3AF]">(facultatif)</span>
        </legend>
        <p className="text-[11px] text-[#6B7280] mb-2.5">Plusieurs choix possibles.</p>
        <div className="flex flex-wrap gap-1.5">
          {HAIR_CONCERNS.map((c) => {
            const active = hairConcerns.has(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleHair(c)}
                aria-pressed={active ? "true" : "false"}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                  active ? "bg-sky-500 text-white" : PILL_INACTIVE
                }`}
              >
                {HAIR_CONCERN_LABEL[c]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className={SECTION}>
        <legend className="text-[13px] font-semibold text-ink mb-2 px-1 -ml-1">
          Allergies / intolérances{" "}
          <span className="text-[11px] font-normal text-[#9CA3AF]">(facultatif)</span>
        </legend>
        <textarea
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Ex : alcool, parfum, certains conservateurs…"
          className="w-full rounded-xl bg-[#F9FAFB] ring-1 ring-[#E5E7EB] px-3.5 py-2.5 text-[13px] outline-none transition focus:ring-2 focus:ring-rose-300 focus:bg-white"
        />
      </fieldset>

      {error && (
        <p role="alert" className="text-[13px] text-[#E11D48] bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onSaved}
          className={`${GLASS_PILL} px-4 py-2 text-[13px] font-semibold text-ink`}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className={`${GLASS_PILL_DARK} flex-1 px-4 py-2.5 text-[13px] font-semibold disabled:opacity-50`}
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
