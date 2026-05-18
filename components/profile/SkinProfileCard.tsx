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
 * Persists via the existing `saveSkinProfile` server action - single source
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
            pour que le Beauty Advisor adapte ses réponses à ta peau.
          </p>
        )}

        <p className="mt-4 text-[11px] text-[#9CA3AF] leading-snug">
          Ces infos sont utilisées par le{" "}
          <Link href="/advisor" className="underline hover:text-[#F43F5E]">
            Beauty Advisor
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
  const skinTypeText = profile.skinType
    ? SKIN_TYPE_LABEL[profile.skinType]
    : profile.otherSkinType
      ? `${profile.otherSkinType} (autre)`
      : "-";
  return (
    <dl className="space-y-3 text-sm">
      <div>
        <dt className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1">
          Type de peau
        </dt>
        <dd className="font-medium text-ink">{skinTypeText}</dd>
      </div>

      <div>
        <dt className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1.5">
          Préoccupations
        </dt>
        <dd>
          {concerns.length === 0 && !profile.otherConcerns ? (
            <span className="text-ink-muted">-</span>
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
        </dd>
      </div>

      {(hairConcerns.length > 0 || profile.otherHair) && (
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
              {profile.otherHair ? (
                <li className="inline-flex items-center rounded-full bg-sky-50/60 px-2.5 py-0.5 text-[12px] font-medium text-sky-700/90 ring-1 ring-sky-100">
                  {profile.otherHair}
                </li>
              ) : null}
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

      {profile.otherNotes ? (
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-[#6B7280] mb-1">
            Autres précisions
          </dt>
          <dd className="text-ink-muted text-[13px] whitespace-pre-wrap">
            {profile.otherNotes}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

/**
 * Form refactor (2026-05): all multi-choice sections now use a dropdown
 * checkbox panel (collapses by default) instead of a wall of pills, and each
 * section exposes an "Autre" free-text field so the user can describe
 * something we didn't pre-list. Type de peau uses a single-select dropdown
 * (one preset OR a custom value, never both).
 */
const SELECT_OTHER = "__other__" as const;

function SkinProfileForm({
  initial,
  onSaved,
}: {
  initial: SkinProfile;
  onSaved: () => void;
}) {
  // Skin type: either a preset value, the literal "__other__" sentinel, or "".
  const [skinType, setSkinType] = useState<SkinType | typeof SELECT_OTHER | "">(
    initial.skinType ?? (initial.otherSkinType ? SELECT_OTHER : ""),
  );
  const [otherSkinType, setOtherSkinType] = useState(initial.otherSkinType ?? "");
  const [concerns, setConcerns] = useState<Set<SkinConcern>>(
    new Set(initial.concerns ?? []),
  );
  const [otherConcerns, setOtherConcerns] = useState(initial.otherConcerns ?? "");
  const [hairConcerns, setHairConcerns] = useState<Set<HairConcern>>(
    new Set(initial.hairConcerns ?? []),
  );
  const [otherHair, setOtherHair] = useState(initial.otherHair ?? "");
  const [allergies, setAllergies] = useState(initial.allergiesFreeform ?? "");
  const [otherNotes, setOtherNotes] = useState(initial.otherNotes ?? "");
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
    const hasPresetType = skinType && skinType !== SELECT_OTHER;
    const hasOtherType = skinType === SELECT_OTHER && otherSkinType.trim().length > 0;
    if (!hasPresetType && !hasOtherType) {
      setError("Choisis ton type de peau (ou décris-le dans 'Autre').");
      return;
    }
    if (concerns.size === 0 && otherConcerns.trim().length === 0) {
      setError("Sélectionne au moins une préoccupation (ou décris-la dans 'Autre').");
      return;
    }
    const fd = new FormData();
    if (hasPresetType) fd.set("skin_type", skinType);
    if (hasOtherType) fd.set("other_skin_type", otherSkinType.trim());
    for (const c of concerns) fd.append("concerns", c);
    if (otherConcerns.trim()) fd.set("other_concerns", otherConcerns.trim());
    for (const c of hairConcerns) fd.append("hair_concerns", c);
    if (otherHair.trim()) fd.set("other_hair", otherHair.trim());
    if (allergies.trim()) fd.set("allergies", allergies.trim());
    if (otherNotes.trim()) fd.set("other_notes", otherNotes.trim());
    startTransition(async () => {
      const r = await saveSkinProfile(fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      onSaved();
    });
  }

  const SECTION = "rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]";
  const INPUT =
    "w-full rounded-xl bg-[#F9FAFB] ring-1 ring-[#E5E7EB] px-3.5 py-2.5 text-[13px] outline-none transition focus:ring-2 focus:ring-rose-300 focus:bg-white";

  return (
    <div className="space-y-3">
      {/* Type de peau — single select with Autre option */}
      <fieldset className={SECTION}>
        <legend className="text-[13px] font-semibold text-ink mb-2.5 px-1 -ml-1">
          Type de peau
        </legend>
        <select
          value={skinType}
          onChange={(e) => setSkinType(e.target.value as SkinType | typeof SELECT_OTHER | "")}
          className={INPUT}
        >
          <option value="" disabled>
            Choisis ton type de peau
          </option>
          {SKIN_TYPES.map((t) => (
            <option key={t} value={t}>
              {SKIN_TYPE_LABEL[t]}
            </option>
          ))}
          <option value={SELECT_OTHER}>Autre…</option>
        </select>
        {skinType === SELECT_OTHER && (
          <input
            type="text"
            value={otherSkinType}
            onChange={(e) => setOtherSkinType(e.target.value.slice(0, 120))}
            placeholder="Décris ton type de peau"
            className={`${INPUT} mt-2`}
            maxLength={120}
          />
        )}
      </fieldset>

      {/* Préoccupations — multi-select dropdown panel + Autre */}
      <fieldset className={SECTION}>
        <legend className="text-[13px] font-semibold text-ink mb-2.5 px-1 -ml-1">
          Préoccupations
        </legend>
        <MultiSelectDropdown
          label="Sélectionne tes préoccupations"
          summaryWhenEmpty="Aucune sélectionnée"
          options={SKIN_CONCERNS.map((c) => ({ value: c, label: SKIN_CONCERN_LABEL[c] }))}
          values={concerns}
          onToggle={toggleConcern}
        />
        <label className="mt-3 block text-[12px] font-medium text-[#6B7280]">
          Autre <span className="text-[#9CA3AF] font-normal">(facultatif)</span>
        </label>
        <input
          type="text"
          value={otherConcerns}
          onChange={(e) => setOtherConcerns(e.target.value.slice(0, 300))}
          placeholder="Ex : peau réactive au froid, cicatrices d'acné…"
          className={`${INPUT} mt-1.5`}
          maxLength={300}
        />
      </fieldset>

      {/* Cheveux — multi-select dropdown + Autre */}
      <fieldset className={SECTION}>
        <legend className="text-[13px] font-semibold text-ink mb-2.5 px-1 -ml-1">
          Cheveux{" "}
          <span className="text-[11px] font-normal text-[#9CA3AF]">(facultatif)</span>
        </legend>
        <MultiSelectDropdown
          label="Sélectionne tes préoccupations capillaires"
          summaryWhenEmpty="Aucune sélectionnée"
          options={HAIR_CONCERNS.map((c) => ({ value: c, label: HAIR_CONCERN_LABEL[c] }))}
          values={hairConcerns}
          onToggle={toggleHair}
          accent="sky"
        />
        <label className="mt-3 block text-[12px] font-medium text-[#6B7280]">
          Autre <span className="text-[#9CA3AF] font-normal">(facultatif)</span>
        </label>
        <input
          type="text"
          value={otherHair}
          onChange={(e) => setOtherHair(e.target.value.slice(0, 200))}
          placeholder="Ex : cheveux crépus, chute saisonnière…"
          className={`${INPUT} mt-1.5`}
          maxLength={200}
        />
      </fieldset>

      {/* Allergies — already free text */}
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
          className={INPUT}
        />
      </fieldset>

      {/* Catch-all "Autre" — anything that didn't fit above */}
      <fieldset className={SECTION}>
        <legend className="text-[13px] font-semibold text-ink mb-2 px-1 -ml-1">
          Autres précisions{" "}
          <span className="text-[11px] font-normal text-[#9CA3AF]">(facultatif)</span>
        </legend>
        <p className="text-[11px] text-[#6B7280] mb-2">
          Quelque chose que tu veux signaler et qui n&apos;entre pas dans les sections au-dessus ?
        </p>
        <textarea
          value={otherNotes}
          onChange={(e) => setOtherNotes(e.target.value.slice(0, 500))}
          rows={2}
          maxLength={500}
          placeholder="Ex : grossesse, traitement dermato en cours, climat tropical…"
          className={INPUT}
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

/**
 * Collapsible multi-select. Renders a click-to-open summary button that
 * expands a checkbox list. Avoids the previous wall of pills while keeping
 * multi-selection trivial.
 */
function MultiSelectDropdown<T extends string>({
  label,
  summaryWhenEmpty,
  options,
  values,
  onToggle,
  accent = "rose",
}: {
  label: string;
  summaryWhenEmpty: string;
  options: { value: T; label: string }[];
  values: Set<T>;
  onToggle: (v: T) => void;
  accent?: "rose" | "sky";
}) {
  const [open, setOpen] = useState(false);
  const selectedLabels = options.filter((o) => values.has(o.value)).map((o) => o.label);
  const summary = selectedLabels.length === 0 ? summaryWhenEmpty : selectedLabels.join(", ");
  const checkColor =
    accent === "sky" ? "accent-sky-500" : "accent-rose-500";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl bg-[#F9FAFB] ring-1 ring-[#E5E7EB] px-3.5 py-2.5 text-left text-[13px] text-ink hover:bg-white transition"
      >
        <span className={`truncate ${selectedLabels.length === 0 ? "text-[#9CA3AF]" : ""}`}>
          {summary}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 shrink-0 text-[#6B7280] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <p className="mt-1 text-[11px] text-[#9CA3AF]">{label} (plusieurs choix possibles)</p>
      {open && (
        <ul className="mt-2 rounded-xl bg-white ring-1 ring-[#E5E7EB] divide-y divide-[#F3F4F6] max-h-60 overflow-y-auto">
          {options.map((o) => {
            const checked = values.has(o.value);
            return (
              <li key={o.value}>
                <label className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-ink cursor-pointer hover:bg-[#FAFAFA]">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(o.value)}
                    className={`h-4 w-4 rounded ${checkColor}`}
                  />
                  <span className="flex-1">{o.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
