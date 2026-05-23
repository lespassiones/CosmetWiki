"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  HAIR_PROBLEM_CONCERNS,
  HAIR_STATE_CONCERNS,
  HAIR_CONCERN_LABEL,
  PROFILE_GOAL_GROUPS,
  PROFILE_GOAL_LABEL,
  SKIN_CONCERNS,
  SKIN_CONCERN_LABEL,
  SKIN_TYPES_BODY,
  SKIN_TYPE_BODY_LABEL,
  SKIN_TYPES_FACE,
  SKIN_TYPE_FACE_LABEL,
  type HairConcern,
  type ProfileGoal,
  type SkinConcern,
  type SkinProfile,
  type SkinTypeBody,
  type SkinTypeFace,
} from "@/lib/skin/profile";
import {
  completeOnboarding,
  dismissOnboarding,
  saveOnboardingStep,
} from "@/app/onboarding/actions";

type StepKey = "skin" | "concerns" | "goals";

type StepConfig = {
  key: StepKey;
  romanNumeral: "I" | "II" | "III";
  title: string;
  subtitle: string;
  /** Label of the primary CTA on this step. */
  ctaLabel: string;
};

const STEPS: StepConfig[] = [
  {
    key: "skin",
    romanNumeral: "I",
    title: "Parlons de\nta peau.",
    subtitle: "Un instant pour que chaque analyse devienne tienne.",
    ctaLabel: "Continuer",
  },
  {
    key: "concerns",
    romanNumeral: "II",
    title: "Tes\npréoccupations.",
    subtitle: "On orientera nos analyses vers ce qui compte pour toi.",
    ctaLabel: "Continuer",
  },
  {
    key: "goals",
    romanNumeral: "III",
    title: "Tes objectifs.",
    subtitle: "Pour orienter nos recommandations vers ce que tu veux vraiment.",
    ctaLabel: "Entrer dans Cosme Check",
  },
];

const AUTOSAVE_DEBOUNCE_MS = 600;

type Props = {
  initial: SkinProfile;
  /** Where to send the user once the wizard is done or fully dismissed. */
  finalNext: string;
};

export function OnboardingWizard({ initial, finalNext }: Props) {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // ─── Step-1 state ──────────────────────────────────────────────────────
  const [skinTypeFace, setSkinTypeFace] = useState<SkinTypeFace | "autre" | "">(
    initial.skinTypeFace ?? (initial.otherSkinTypeFace ? "autre" : ""),
  );
  const [otherSkinTypeFace, setOtherSkinTypeFace] = useState(
    initial.otherSkinTypeFace ?? "",
  );
  const [skinTypeBody, setSkinTypeBody] = useState<SkinTypeBody | "autre" | "">(
    initial.skinTypeBody ?? (initial.otherSkinTypeBody ? "autre" : ""),
  );
  const [otherSkinTypeBody, setOtherSkinTypeBody] = useState(
    initial.otherSkinTypeBody ?? "",
  );
  const initialHairState = new Set<HairConcern>();
  for (const c of initial.hairConcerns ?? []) {
    if (HAIR_STATE_CONCERNS.includes(c)) initialHairState.add(c);
  }
  const [hairStateConcerns, setHairStateConcerns] =
    useState<Set<HairConcern>>(initialHairState);
  const [otherHair, setOtherHair] = useState(initial.otherHair ?? "");

  // ─── Step-2 state ──────────────────────────────────────────────────────
  const [concerns, setConcerns] = useState<Set<SkinConcern>>(
    new Set(initial.concerns ?? []),
  );
  const initialHairProblems = new Set<HairConcern>();
  for (const c of initial.hairConcerns ?? []) {
    if (HAIR_PROBLEM_CONCERNS.includes(c)) initialHairProblems.add(c);
  }
  const [hairProblemConcerns, setHairProblemConcerns] =
    useState<Set<HairConcern>>(initialHairProblems);
  const [otherConcerns, setOtherConcerns] = useState(initial.otherConcerns ?? "");
  const [allergies, setAllergies] = useState(initial.allergiesFreeform ?? "");

  // ─── Step-3 state ──────────────────────────────────────────────────────
  const [goals, setGoals] = useState<Set<ProfileGoal>>(
    new Set(initial.goals ?? []),
  );
  const [otherGoals, setOtherGoals] = useState(initial.otherGoals ?? "");

  const isLast = stepIdx === STEPS.length - 1;
  const currentStep = STEPS[stepIdx];

  // Compose the FormData payload for the step currently on screen.
  const buildFormData = useMemo(() => {
    return (): FormData => {
      const fd = new FormData();
      fd.set("step", currentStep.key);
      if (currentStep.key === "skin") {
        if (skinTypeFace && skinTypeFace !== "autre")
          fd.set("skin_type_face", skinTypeFace);
        if (skinTypeFace === "autre" && otherSkinTypeFace.trim())
          fd.set("other_skin_type_face", otherSkinTypeFace.trim());
        if (skinTypeBody && skinTypeBody !== "autre")
          fd.set("skin_type_body", skinTypeBody);
        if (skinTypeBody === "autre" && otherSkinTypeBody.trim())
          fd.set("other_skin_type_body", otherSkinTypeBody.trim());
        hairStateConcerns.forEach((c) => fd.append("hair_concerns", c));
        if (otherHair.trim()) fd.set("other_hair", otherHair.trim());
      } else if (currentStep.key === "concerns") {
        concerns.forEach((c) => fd.append("concerns", c));
        hairProblemConcerns.forEach((c) =>
          fd.append("hair_problem_concerns", c),
        );
        if (otherConcerns.trim()) fd.set("other_concerns", otherConcerns.trim());
        if (allergies.trim()) fd.set("allergies", allergies.trim());
      } else {
        goals.forEach((g) => fd.append("goals", g));
        if (otherGoals.trim()) fd.set("other_goals", otherGoals.trim());
      }
      return fd;
    };
  }, [
    currentStep.key,
    skinTypeFace,
    otherSkinTypeFace,
    skinTypeBody,
    otherSkinTypeBody,
    hairStateConcerns,
    otherHair,
    concerns,
    hairProblemConcerns,
    otherConcerns,
    allergies,
    goals,
    otherGoals,
  ]);

  // ─── Auto-save (debounced 600ms) ───────────────────────────────────────
  // Persists the current step in the background each time the user touches an
  // input, so closing the tab in the middle of the wizard doesn't lose work.
  // The final save still happens on "Continuer" to guarantee the latest state.
  const hasMountedRef = useRef(false);
  useEffect(() => {
    // Skip the very first render (initial mount) so we don't overwrite the
    // freshly-read profile with itself.
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    const handle = window.setTimeout(() => {
      // Fire-and-forget — the user sees the next save (or the next button
      // click) clear any UI state if needed. We swallow errors silently here
      // to avoid flashing toasts on every keystroke; the final "Continuer"
      // save still surfaces real errors.
      void saveOnboardingStep(buildFormData()).catch(() => undefined);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [buildFormData]);

  function commitStep(after: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await saveOnboardingStep(buildFormData());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      after();
    });
  }

  function handleContinue() {
    if (isLast) {
      // Final step: save the data AND flip `onboardingShown` to true via
      // completeOnboarding so we never auto-show the wizard again on the
      // next sign-in.
      setError(null);
      startTransition(async () => {
        const saveRes = await saveOnboardingStep(buildFormData());
        if (!saveRes.ok) {
          setError(saveRes.error);
          return;
        }
        const completeRes = await completeOnboarding();
        if (!completeRes.ok) {
          setError(completeRes.error);
          return;
        }
        router.replace(finalNext);
      });
      return;
    }
    commitStep(() => setStepIdx((i) => i + 1));
  }

  function handleSkipStep() {
    // "Passer" advances by ONE step without saving anything for the current
    // one. Existing data on previously-saved steps stays untouched. On the
    // last step we just mark onboarding as shown and head to the dashboard.
    setError(null);
    startTransition(async () => {
      const res = await dismissOnboarding();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (isLast) {
        router.replace(finalNext);
      } else {
        setStepIdx((i) => i + 1);
      }
    });
  }

  function handleBack() {
    if (stepIdx === 0) return;
    setStepIdx((i) => i - 1);
  }

  const progressPct = ((stepIdx + 1) / STEPS.length) * 100;

  return (
    <div className="w-full">
      {/* Header: roman-numeral step indicator + "Passer" link (top-right). */}
      <header className="mb-7 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6B7280]">
          Étape {currentStep.romanNumeral} / III
        </p>
        <button
          type="button"
          onClick={handleSkipStep}
          disabled={pending}
          className="text-[12px] font-medium text-[#9CA3AF] transition hover:text-[#374151] disabled:opacity-40"
        >
          Plus tard
        </button>
      </header>

      {/* Progress bar */}
      <div className="-mt-3 mb-8 h-[3px] w-full overflow-hidden rounded-full bg-[#F3F4F6]">
        <div
          className="h-full bg-[#F43F5E] transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Editorial title + subtitle */}
      <header className="mb-8">
        <h1
          className="font-serif text-[40px] sm:text-[52px] font-semibold leading-[1.05] tracking-tight text-[#111111]"
          style={{ whiteSpace: "pre-line" }}
        >
          {currentStep.title}
        </h1>
        <p className="mt-3 text-[14px] sm:text-[15px] leading-relaxed text-[#4B4B4B]">
          {currentStep.subtitle}
        </p>
      </header>

      <div className="space-y-8">
        {currentStep.key === "skin" && (
          <SkinStep
            skinTypeFace={skinTypeFace}
            setSkinTypeFace={setSkinTypeFace}
            otherSkinTypeFace={otherSkinTypeFace}
            setOtherSkinTypeFace={setOtherSkinTypeFace}
            skinTypeBody={skinTypeBody}
            setSkinTypeBody={setSkinTypeBody}
            otherSkinTypeBody={otherSkinTypeBody}
            setOtherSkinTypeBody={setOtherSkinTypeBody}
            hairStateConcerns={hairStateConcerns}
            setHairStateConcerns={setHairStateConcerns}
            otherHair={otherHair}
            setOtherHair={setOtherHair}
          />
        )}

        {currentStep.key === "concerns" && (
          <ConcernsStep
            concerns={concerns}
            setConcerns={setConcerns}
            hairProblemConcerns={hairProblemConcerns}
            setHairProblemConcerns={setHairProblemConcerns}
            otherConcerns={otherConcerns}
            setOtherConcerns={setOtherConcerns}
            allergies={allergies}
            setAllergies={setAllergies}
          />
        )}

        {currentStep.key === "goals" && (
          <GoalsStep
            goals={goals}
            setGoals={setGoals}
            otherGoals={otherGoals}
            setOtherGoals={setOtherGoals}
          />
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700"
        >
          {error}
        </p>
      )}

      {/* Footer actions — back link on the left, primary CTA below full-width. */}
      <div className="mt-10 space-y-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={pending}
          className="block w-full rounded-md bg-[#F43F5E] py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#E11D48] disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : `${currentStep.ctaLabel} →`}
        </button>
        {stepIdx > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={pending}
            className="block text-[12px] font-medium text-[#6B7280] transition hover:text-[#111111] disabled:opacity-40"
          >
            ← Retour
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Step components ────────────────────────────────────────────────────────

function SkinStep(props: {
  skinTypeFace: SkinTypeFace | "autre" | "";
  setSkinTypeFace: (v: SkinTypeFace | "autre" | "") => void;
  otherSkinTypeFace: string;
  setOtherSkinTypeFace: (v: string) => void;
  skinTypeBody: SkinTypeBody | "autre" | "";
  setSkinTypeBody: (v: SkinTypeBody | "autre" | "") => void;
  otherSkinTypeBody: string;
  setOtherSkinTypeBody: (v: string) => void;
  hairStateConcerns: Set<HairConcern>;
  setHairStateConcerns: (v: Set<HairConcern>) => void;
  otherHair: string;
  setOtherHair: (v: string) => void;
}) {
  return (
    <>
      <Section legend="Visage">
        <ChipGroup
          name="skin_type_face"
          options={SKIN_TYPES_FACE.map((s) => ({
            value: s,
            label: SKIN_TYPE_FACE_LABEL[s],
          }))}
          value={props.skinTypeFace}
          onChange={(v) => props.setSkinTypeFace(v as SkinTypeFace | "autre" | "")}
          allowOther
        />
        {props.skinTypeFace === "autre" && (
          <TextInput
            placeholder="Décris-le brièvement"
            value={props.otherSkinTypeFace}
            onChange={props.setOtherSkinTypeFace}
            maxLength={120}
          />
        )}
      </Section>

      <Section legend="Corps">
        <ChipGroup
          name="skin_type_body"
          options={SKIN_TYPES_BODY.map((s) => ({
            value: s,
            label: SKIN_TYPE_BODY_LABEL[s],
          }))}
          value={props.skinTypeBody}
          onChange={(v) => props.setSkinTypeBody(v as SkinTypeBody | "autre" | "")}
          allowOther
        />
        {props.skinTypeBody === "autre" && (
          <TextInput
            placeholder="Décris-le brièvement"
            value={props.otherSkinTypeBody}
            onChange={props.setOtherSkinTypeBody}
            maxLength={120}
          />
        )}
      </Section>

      <Section legend="Cheveux">
        <ChipMulti
          options={HAIR_STATE_CONCERNS.map((c) => ({
            value: c,
            label: HAIR_CONCERN_LABEL[c],
          }))}
          values={props.hairStateConcerns}
          onToggle={(v) => {
            const next = new Set(props.hairStateConcerns);
            if (next.has(v as HairConcern)) next.delete(v as HairConcern);
            else next.add(v as HairConcern);
            props.setHairStateConcerns(next);
          }}
        />
        <TextInput
          placeholder="Autre (boucles, colorés, longueurs cassantes…)"
          value={props.otherHair}
          onChange={props.setOtherHair}
          maxLength={200}
        />
      </Section>
    </>
  );
}

function ConcernsStep(props: {
  concerns: Set<SkinConcern>;
  setConcerns: (v: Set<SkinConcern>) => void;
  hairProblemConcerns: Set<HairConcern>;
  setHairProblemConcerns: (v: Set<HairConcern>) => void;
  otherConcerns: string;
  setOtherConcerns: (v: string) => void;
  allergies: string;
  setAllergies: (v: string) => void;
}) {
  // Compose a single mixed grid (skin concerns first, hair problems after),
  // each chip labelled in plain French.
  return (
    <>
      <Section legend="Tes préoccupations">
        <ChipMixedMulti
          skinOptions={SKIN_CONCERNS.map((c) => ({
            value: c,
            label: SKIN_CONCERN_LABEL[c],
          }))}
          skinValues={props.concerns}
          onToggleSkin={(v) => {
            const next = new Set(props.concerns);
            if (next.has(v as SkinConcern)) next.delete(v as SkinConcern);
            else next.add(v as SkinConcern);
            props.setConcerns(next);
          }}
          hairOptions={HAIR_PROBLEM_CONCERNS.map((c) => ({
            value: c,
            label: HAIR_CONCERN_LABEL[c],
          }))}
          hairValues={props.hairProblemConcerns}
          onToggleHair={(v) => {
            const next = new Set(props.hairProblemConcerns);
            if (next.has(v as HairConcern)) next.delete(v as HairConcern);
            else next.add(v as HairConcern);
            props.setHairProblemConcerns(next);
          }}
        />
        <TextInput
          placeholder="Autre (eczéma, rosacée, cicatrices…)"
          value={props.otherConcerns}
          onChange={props.setOtherConcerns}
          maxLength={300}
        />
      </Section>

      <Section legend="Allergies ou intolérances">
        <TextArea
          placeholder="Ex : nickel, parfum, lanoline, sulfates…"
          value={props.allergies}
          onChange={props.setAllergies}
          maxLength={500}
          rows={2}
        />
      </Section>
    </>
  );
}

function GoalsStep(props: {
  goals: Set<ProfileGoal>;
  setGoals: (v: Set<ProfileGoal>) => void;
  otherGoals: string;
  setOtherGoals: (v: string) => void;
}) {
  return (
    <>
      {PROFILE_GOAL_GROUPS.map((group) => (
        <Section key={group.label} legend={group.label}>
          <ChipMulti
            options={group.goals.map((g) => ({
              value: g,
              label: PROFILE_GOAL_LABEL[g],
            }))}
            values={props.goals as Set<string>}
            onToggle={(v) => {
              const next = new Set(props.goals);
              if (next.has(v as ProfileGoal)) next.delete(v as ProfileGoal);
              else next.add(v as ProfileGoal);
              props.setGoals(next);
            }}
          />
        </Section>
      ))}

      <Section legend="Autre objectif">
        <TextArea
          placeholder="Ex : « Je veux comprendre les étiquettes » ou « J'aimerais une routine simple pour ma peau mixte »…"
          value={props.otherGoals}
          onChange={props.setOtherGoals}
          maxLength={300}
          rows={3}
        />
      </Section>
    </>
  );
}

// ─── Shared inputs ─────────────────────────────────────────────────────────

function Section({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-[#EDE9E4] pt-5">
      <legend className="float-left -mt-[11px] bg-[#FAFAF7] pr-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4B4B4B]">
        {legend}
      </legend>
      <div className="mt-2 space-y-3">{children}</div>
    </fieldset>
  );
}

function ChipGroup({
  name,
  options,
  value,
  onChange,
  allowOther = false,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  allowOther?: boolean;
}) {
  const all = allowOther
    ? [...options, { value: "autre", label: "Autre…" }]
    : options;
  return (
    <div className="flex flex-wrap gap-2">
      {all.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={`${name}-${opt.value}`}
            type="button"
            onClick={() => onChange(active ? "" : opt.value)}
            className={`rounded-md border px-4 py-2 text-[13px] transition ${
              active
                ? "border-[#111111] bg-[#111111] text-white"
                : "border-[#E5E5E0] bg-white text-[#111111] hover:border-[#111111]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ChipMulti({
  options,
  values,
  onToggle,
}: {
  options: { value: string; label: string }[];
  values: Set<string>;
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = values.has(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            aria-pressed={active}
            className={`rounded-md border px-4 py-2 text-[13px] transition ${
              active
                ? "border-[#111111] bg-[#111111] text-white"
                : "border-[#E5E5E0] bg-white text-[#111111] hover:border-[#111111]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Step-2 picker that mixes skin concerns + hair problems in a single
 * rectangular-chip grid. Two callbacks under the hood so the wizard can
 * route each toggle into the right storage bucket (skin → `concerns`,
 * hair → `hairConcerns`).
 */
function ChipMixedMulti({
  skinOptions,
  skinValues,
  onToggleSkin,
  hairOptions,
  hairValues,
  onToggleHair,
}: {
  skinOptions: { value: string; label: string }[];
  skinValues: Set<SkinConcern>;
  onToggleSkin: (v: string) => void;
  hairOptions: { value: string; label: string }[];
  hairValues: Set<HairConcern>;
  onToggleHair: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {skinOptions.map((opt) => {
        const active = skinValues.has(opt.value as SkinConcern);
        return (
          <button
            key={`s-${opt.value}`}
            type="button"
            onClick={() => onToggleSkin(opt.value)}
            aria-pressed={active}
            className={`rounded-md border px-4 py-2 text-[13px] transition ${
              active
                ? "border-[#111111] bg-[#111111] text-white"
                : "border-[#E5E5E0] bg-white text-[#111111] hover:border-[#111111]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
      {hairOptions.map((opt) => {
        const active = hairValues.has(opt.value as HairConcern);
        return (
          <button
            key={`h-${opt.value}`}
            type="button"
            onClick={() => onToggleHair(opt.value)}
            aria-pressed={active}
            className={`rounded-md border px-4 py-2 text-[13px] transition ${
              active
                ? "border-[#111111] bg-[#111111] text-white"
                : "border-[#E5E5E0] bg-white text-[#111111] hover:border-[#111111]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function TextInput({
  placeholder,
  value,
  onChange,
  maxLength,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={maxLength}
      className="w-full rounded-md border border-[#E5E5E0] bg-white px-3 py-2.5 text-[13px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#111111] focus:outline-none"
    />
  );
}

function TextArea({
  placeholder,
  value,
  onChange,
  maxLength,
  rows = 3,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  rows?: number;
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={maxLength}
      rows={rows}
      className="w-full resize-none rounded-md border border-[#E5E5E0] bg-white px-3 py-2.5 text-[13px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#111111] focus:outline-none"
    />
  );
}
