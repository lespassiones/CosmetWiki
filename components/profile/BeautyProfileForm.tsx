"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSkinProfile } from "@/app/advisor/actions";
import { GLASS_PILL, GLASS_PILL_DARK } from "@/lib/ui/glass";
import {
  HAIR_CONCERN_LABEL,
  HAIR_CONCERNS,
  PROFILE_GOAL_LABEL,
  PROFILE_GOALS,
  SKIN_CONCERN_LABEL,
  SKIN_CONCERNS,
  SKIN_TYPE_BODY_LABEL,
  SKIN_TYPE_FACE_LABEL,
  SKIN_TYPES_BODY,
  SKIN_TYPES_FACE,
  type HairConcern,
  type ProfileGoal,
  type SkinConcern,
  type SkinProfile,
  type SkinTypeBody,
  type SkinTypeFace,
} from "@/lib/skin/profile";

/**
 * Formulaire complet du profil beauté : type de peau visage, type de peau
 * corps, préoccupations, cheveux, allergies, autres précisions. Utilisé à 2
 * endroits :
 *  - `/advisor` (onboarding Beauty Advisor)
 *  - `/profile` (SkinProfileCard en mode édition)
 *
 * Tous les champs sont facultatifs : l'utilisateur peut sauvegarder à tout
 * moment, le profil se complète au fil du temps.
 */

const SELECT_OTHER = "__other__" as const;

export function BeautyProfileForm({
  initial,
  onSaved,
  onCancel,
  submitLabel = "Enregistrer",
  showCancel = true,
  redirectAfterSave,
}: {
  initial: SkinProfile;
  onSaved?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  showCancel?: boolean;
  redirectAfterSave?: string;
}) {
  const router = useRouter();
  const [skinTypeFace, setSkinTypeFace] = useState<
    SkinTypeFace | typeof SELECT_OTHER | ""
  >(initial.skinTypeFace ?? (initial.otherSkinTypeFace ? SELECT_OTHER : ""));
  const [otherSkinTypeFace, setOtherSkinTypeFace] = useState(
    initial.otherSkinTypeFace ?? "",
  );
  const [skinTypeBody, setSkinTypeBody] = useState<
    SkinTypeBody | typeof SELECT_OTHER | ""
  >(initial.skinTypeBody ?? (initial.otherSkinTypeBody ? SELECT_OTHER : ""));
  const [otherSkinTypeBody, setOtherSkinTypeBody] = useState(
    initial.otherSkinTypeBody ?? "",
  );
  const [concerns, setConcerns] = useState<Set<SkinConcern>>(
    new Set(initial.concerns ?? []),
  );
  const [otherConcerns, setOtherConcerns] = useState(initial.otherConcerns ?? "");
  // "Autre" is now a dedicated option in the dropdown - the free-text input
  // only shows when the option is ticked. Init: ticked iff legacy text was
  // saved.
  const [showOtherConcerns, setShowOtherConcerns] = useState(
    Boolean(initial.otherConcerns?.trim()),
  );
  const [hairConcerns, setHairConcerns] = useState<Set<HairConcern>>(
    new Set(initial.hairConcerns ?? []),
  );
  const [otherHair, setOtherHair] = useState(initial.otherHair ?? "");
  const [showOtherHair, setShowOtherHair] = useState(
    Boolean(initial.otherHair?.trim()),
  );
  const [allergies, setAllergies] = useState(initial.allergiesFreeform ?? "");
  const [otherNotes, setOtherNotes] = useState(initial.otherNotes ?? "");
  const [goals, setGoals] = useState<Set<ProfileGoal>>(
    new Set(initial.goals ?? []),
  );
  const [otherGoals, setOtherGoals] = useState(initial.otherGoals ?? "");
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

  function toggleGoal(g: ProfileGoal) {
    setGoals((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }

  function submit() {
    setError(null);
    const fd = new FormData();

    if (skinTypeFace && skinTypeFace !== SELECT_OTHER) {
      fd.set("skin_type_face", skinTypeFace);
    }
    if (skinTypeFace === SELECT_OTHER && otherSkinTypeFace.trim()) {
      fd.set("other_skin_type_face", otherSkinTypeFace.trim());
    }
    if (skinTypeBody && skinTypeBody !== SELECT_OTHER) {
      fd.set("skin_type_body", skinTypeBody);
    }
    if (skinTypeBody === SELECT_OTHER && otherSkinTypeBody.trim()) {
      fd.set("other_skin_type_body", otherSkinTypeBody.trim());
    }
    for (const c of concerns) fd.append("concerns", c);
    if (showOtherConcerns && otherConcerns.trim()) {
      fd.set("other_concerns", otherConcerns.trim());
    }
    for (const c of hairConcerns) fd.append("hair_concerns", c);
    if (showOtherHair && otherHair.trim()) {
      fd.set("other_hair", otherHair.trim());
    }
    if (allergies.trim()) fd.set("allergies", allergies.trim());
    if (otherNotes.trim()) fd.set("other_notes", otherNotes.trim());
    // `goals_submitted` flips `saveSkinProfile` into the goals-update branch
    // (it preserves existing goals when the field is absent).
    fd.set("goals_submitted", "1");
    for (const g of goals) fd.append("goals", g);
    if (otherGoals.trim()) fd.set("other_goals", otherGoals.trim());

    startTransition(async () => {
      const r = await saveSkinProfile(fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      onSaved?.();
      if (redirectAfterSave) router.push(redirectAfterSave);
    });
  }

  const SECTION = "rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]";
  const INPUT =
    "w-full rounded-xl bg-[#F9FAFB] ring-1 ring-[#E5E7EB] px-3.5 py-2.5 text-[13px] outline-none transition focus:ring-2 focus:ring-rose-300 focus:bg-white";

  return (
    <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3">
      <SkinTypeFieldset
        title="Type de peau visage"
        sectionClass={SECTION}
        inputClass={INPUT}
        value={skinTypeFace}
        onChange={setSkinTypeFace}
        otherValue={otherSkinTypeFace}
        onOtherChange={setOtherSkinTypeFace}
        options={SKIN_TYPES_FACE.map((t) => ({
          value: t,
          label: SKIN_TYPE_FACE_LABEL[t],
        }))}
        placeholder="Choisis ton type de peau visage"
        otherPlaceholder="Décris ton type de peau visage"
      />

      <SkinTypeFieldset
        title="Type de peau corps"
        sectionClass={SECTION}
        inputClass={INPUT}
        value={skinTypeBody}
        onChange={setSkinTypeBody}
        otherValue={otherSkinTypeBody}
        onOtherChange={setOtherSkinTypeBody}
        options={SKIN_TYPES_BODY.map((t) => ({
          value: t,
          label: SKIN_TYPE_BODY_LABEL[t],
        }))}
        placeholder="Choisis ton type de peau corps"
        otherPlaceholder="Décris ton type de peau corps"
      />

      <fieldset className={SECTION}>
        <legend className="text-[13px] font-semibold text-ink mb-2.5 px-1 -ml-1">
          Préoccupations
        </legend>
        <MultiSelectDropdown
          label="Sélectionne tes préoccupations"
          summaryWhenEmpty="Aucune sélectionnée"
          options={SKIN_CONCERNS.map((c) => ({
            value: c,
            label: SKIN_CONCERN_LABEL[c],
          }))}
          values={concerns}
          onToggle={toggleConcern}
          otherSelected={showOtherConcerns}
          onToggleOther={() => setShowOtherConcerns((v) => !v)}
        />
        {showOtherConcerns && (
          <input
            type="text"
            value={otherConcerns}
            onChange={(e) => setOtherConcerns(e.target.value.slice(0, 300))}
            placeholder="Précise ton autre préoccupation (ex : peau réactive au froid…)"
            className={`${INPUT} mt-3`}
            maxLength={300}
          />
        )}
      </fieldset>

      <fieldset className={SECTION}>
        <legend className="text-[13px] font-semibold text-ink mb-2.5 px-1 -ml-1">
          Cheveux
        </legend>
        <MultiSelectDropdown
          label="Sélectionne tes préoccupations capillaires"
          summaryWhenEmpty="Aucune sélectionnée"
          options={HAIR_CONCERNS.map((c) => ({
            value: c,
            label: HAIR_CONCERN_LABEL[c],
          }))}
          values={hairConcerns}
          onToggle={toggleHair}
          accent="sky"
          otherSelected={showOtherHair}
          onToggleOther={() => setShowOtherHair((v) => !v)}
        />
        {showOtherHair && (
          <input
            type="text"
            value={otherHair}
            onChange={(e) => setOtherHair(e.target.value.slice(0, 200))}
            placeholder="Précise ta préoccupation capillaire (ex : cheveux crépus…)"
            className={`${INPUT} mt-3`}
            maxLength={200}
          />
        )}
      </fieldset>

      <fieldset className={SECTION}>
        <legend className="text-[13px] font-semibold text-ink mb-2 px-1 -ml-1">
          Allergies / intolérances
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

      <fieldset className={SECTION}>
        <legend className="text-[13px] font-semibold text-ink mb-2 px-1 -ml-1">
          Autres précisions
        </legend>
        <p className="text-[11px] text-[#6B7280] mb-2">
          Quelque chose que tu veux signaler et qui n&apos;entre pas dans les sections
          au-dessus ?
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

      <fieldset className={`${SECTION} lg:col-span-2`}>
        <legend className="text-[13px] font-semibold text-ink mb-2 px-1 -ml-1">
          Souhaits
        </legend>
        <p className="text-[11px] text-[#6B7280] mb-3">
          Qu&apos;est-ce que tu attends de Cosme Check ? (plusieurs choix possibles)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROFILE_GOALS.map((g) => {
            const active = goals.has(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGoal(g)}
                className={`text-left rounded-xl px-3.5 py-2.5 text-[13px] font-medium ring-1 transition ${
                  active
                    ? "bg-rose-50 ring-rose-300 text-rose-700"
                    : "bg-[#F9FAFB] ring-[#E5E7EB] text-ink hover:bg-white"
                }`}
              >
                {PROFILE_GOAL_LABEL[g]}
              </button>
            );
          })}
        </div>
        <label className="block text-[11px] text-[#6B7280] mt-3 mb-1">
          Autre : dis-le dans tes mots (optionnel)
        </label>
        <textarea
          value={otherGoals}
          onChange={(e) => setOtherGoals(e.target.value.slice(0, 300))}
          rows={2}
          maxLength={300}
          placeholder="Ex : « comprendre les étiquettes » ou « routine simple peau mixte »…"
          className={INPUT}
        />
      </fieldset>

      {error && (
        <p
          role="alert"
          className="text-[13px] text-[#E11D48] bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 lg:col-span-2"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 pt-1 lg:col-span-2">
        {showCancel && (
          <button
            type="button"
            onClick={onCancel ?? onSaved}
            className={`${GLASS_PILL} px-4 py-2 text-[13px] font-semibold text-ink`}
          >
            Annuler
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className={`${GLASS_PILL_DARK} flex-1 px-4 py-2.5 text-[13px] font-semibold disabled:opacity-50`}
        >
          {pending ? "Enregistrement…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

function SkinTypeFieldset<T extends string>({
  title,
  sectionClass,
  inputClass,
  value,
  onChange,
  otherValue,
  onOtherChange,
  options,
  placeholder,
  otherPlaceholder,
}: {
  title: string;
  sectionClass: string;
  inputClass: string;
  value: T | typeof SELECT_OTHER | "";
  onChange: (v: T | typeof SELECT_OTHER | "") => void;
  otherValue: string;
  onOtherChange: (v: string) => void;
  options: { value: T; label: string }[];
  placeholder: string;
  otherPlaceholder: string;
}) {
  return (
    <fieldset className={sectionClass}>
      <legend className="text-[13px] font-semibold text-ink mb-2.5 px-1 -ml-1">
        {title}
      </legend>
      <SingleSelectDropdown
        ariaLabel={title}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        options={[
          ...options,
          { value: SELECT_OTHER as unknown as T, label: "Autre…" },
        ]}
      />
      {value === SELECT_OTHER && (
        <input
          type="text"
          value={otherValue}
          onChange={(e) => onOtherChange(e.target.value.slice(0, 120))}
          placeholder={otherPlaceholder}
          className={`${inputClass} mt-2`}
          maxLength={120}
        />
      )}
    </fieldset>
  );
}

// Shared chrome for the dropdown trigger button (used by Single + Multi).
const DROPDOWN_TRIGGER =
  "flex w-full items-center justify-between gap-2 rounded-xl bg-[#F9FAFB] ring-1 ring-[#E5E7EB] px-3.5 py-2.5 text-left text-[13px] text-ink hover:bg-white transition";
const DROPDOWN_PANEL =
  "mt-2 rounded-xl bg-white ring-1 ring-[#E5E7EB] divide-y divide-[#F3F4F6] max-h-60 overflow-y-auto";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 text-[#6B7280] transition-transform ${
        open ? "rotate-180" : ""
      }`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SingleSelectDropdown<T extends string>({
  ariaLabel,
  placeholder,
  value,
  onChange,
  options,
}: {
  ariaLabel: string;
  placeholder: string;
  value: T | "";
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const summary = selected?.label ?? placeholder;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open ? "true" : "false"}
        aria-label={ariaLabel}
        className={DROPDOWN_TRIGGER}
      >
        <span className={`truncate ${!selected ? "text-[#9CA3AF]" : ""}`}>
          {summary}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <ul className={DROPDOWN_PANEL}>
          {options.map((o) => {
            const isActive = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] cursor-pointer hover:bg-[#FAFAFA] ${
                    isActive ? "bg-rose-50 text-rose-700 font-medium" : "text-ink"
                  }`}
                >
                  <span className="flex-1">{o.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MultiSelectDropdown<T extends string>({
  label,
  summaryWhenEmpty,
  options,
  values,
  onToggle,
  accent = "rose",
  otherSelected = false,
  onToggleOther,
}: {
  label: string;
  summaryWhenEmpty: string;
  options: { value: T; label: string }[];
  values: Set<T>;
  onToggle: (v: T) => void;
  accent?: "rose" | "sky";
  /** When `onToggleOther` is provided, an extra "Autre…" row appears at the
   *  bottom of the dropdown. The parent shows its free-text input only when
   *  `otherSelected` is true. */
  otherSelected?: boolean;
  onToggleOther?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabels = options
    .filter((o) => values.has(o.value))
    .map((o) => o.label);
  if (otherSelected) selectedLabels.push("Autre");
  const summary =
    selectedLabels.length === 0 ? summaryWhenEmpty : selectedLabels.join(", ");
  const checkColor = accent === "sky" ? "accent-sky-500" : "accent-rose-500";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open ? "true" : "false"}
        className={DROPDOWN_TRIGGER}
      >
        {/* `min-w-0` is required so the flex child can actually shrink below
            its intrinsic width — without it the `truncate` is a no-op and a
            long summary ("Sécheresse, Pores dilatés, Excès de sébum…")
            pushes the dropdown out of its parent card. */}
        <span
          className={`min-w-0 flex-1 truncate ${selectedLabels.length === 0 ? "text-[#9CA3AF]" : ""}`}
          title={summary}
        >
          {summary}
        </span>
        <span className="shrink-0">
          <ChevronIcon open={open} />
        </span>
      </button>
      <p className="mt-1 text-[11px] text-[#9CA3AF]">
        {label} (plusieurs choix possibles)
      </p>
      {open && (
        <ul className={DROPDOWN_PANEL}>
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
          {onToggleOther && (
            <li>
              <label className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-ink cursor-pointer hover:bg-[#FAFAFA]">
                <input
                  type="checkbox"
                  checked={otherSelected}
                  onChange={onToggleOther}
                  className={`h-4 w-4 rounded ${checkColor}`}
                />
                <span className="flex-1">Autre…</span>
              </label>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
