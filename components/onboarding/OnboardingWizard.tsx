"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  HAIR_CONCERNS,
  HAIR_CONCERN_LABEL,
  PROFILE_GOALS,
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
  dismissOnboarding,
  saveOnboardingStep,
} from "@/app/onboarding/actions";

type StepKey = "skin" | "concerns" | "goals";

const STEPS: { key: StepKey; title: string; subtitle: string }[] = [
  {
    key: "skin",
    title: "Parle-nous de ta peau",
    subtitle: "Type de peau visage, corps et cheveux. Tout est optionnel.",
  },
  {
    key: "concerns",
    title: "Tes préoccupations",
    subtitle: "Ce que tu cibles, tes allergies et toute précision utile.",
  },
  {
    key: "goals",
    title: "Que cherches-tu chez Cosme Check ?",
    subtitle: "Choisis ce qui te parle — on adaptera nos conseils.",
  },
];

type Props = {
  initial: SkinProfile;
  /** Where to send the user once the wizard is done or dismissed. */
  finalNext: string;
};

export function OnboardingWizard({ initial, finalNext }: Props) {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Local form state — kept in memory between steps so the user can navigate
  // back/forth without losing inputs. Saves happen on "Suivant".
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
  const [hairConcerns, setHairConcerns] = useState<Set<HairConcern>>(
    new Set(initial.hairConcerns ?? []),
  );
  const [otherHair, setOtherHair] = useState(initial.otherHair ?? "");
  const [concerns, setConcerns] = useState<Set<SkinConcern>>(
    new Set(initial.concerns ?? []),
  );
  const [otherConcerns, setOtherConcerns] = useState(initial.otherConcerns ?? "");
  const [allergies, setAllergies] = useState(initial.allergiesFreeform ?? "");
  const [otherNotes, setOtherNotes] = useState(initial.otherNotes ?? "");
  const [goals, setGoals] = useState<Set<ProfileGoal>>(new Set(initial.goals ?? []));
  const [otherGoals, setOtherGoals] = useState(initial.otherGoals ?? "");

  const isLast = stepIdx === STEPS.length - 1;
  const currentStep = STEPS[stepIdx];

  function buildFormDataForCurrentStep(): FormData {
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
      hairConcerns.forEach((c) => fd.append("hair_concerns", c));
      if (otherHair.trim()) fd.set("other_hair", otherHair.trim());
    } else if (currentStep.key === "concerns") {
      concerns.forEach((c) => fd.append("concerns", c));
      if (otherConcerns.trim()) fd.set("other_concerns", otherConcerns.trim());
      if (allergies.trim()) fd.set("allergies", allergies.trim());
      if (otherNotes.trim()) fd.set("other_notes", otherNotes.trim());
    } else {
      goals.forEach((g) => fd.append("goals", g));
      if (otherGoals.trim()) fd.set("other_goals", otherGoals.trim());
    }
    return fd;
  }

  function commitStep(after: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await saveOnboardingStep(buildFormDataForCurrentStep());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      after();
    });
  }

  function handleNext() {
    commitStep(() => {
      if (isLast) {
        router.replace(finalNext);
      } else {
        setStepIdx((i) => i + 1);
      }
    });
  }

  function handleSkipStep() {
    // Skipping a step still marks the onboarding as shown (via the action).
    // We submit an empty form for this step so nothing is overwritten but
    // the flag flips.
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("step", currentStep.key);
      const res = await saveOnboardingStep(fd);
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

  function handleDismissAll() {
    setError(null);
    startTransition(async () => {
      const res = await dismissOnboarding();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace(finalNext);
    });
  }

  function handleBack() {
    if (stepIdx === 0) return;
    setStepIdx((i) => i - 1);
  }

  return (
    <div className="w-full max-w-xl">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-[#6B7280] mb-2">
          <span className="font-semibold">
            Étape {stepIdx + 1} / {STEPS.length}
          </span>
          <button
            type="button"
            onClick={handleDismissAll}
            disabled={pending}
            className="text-[12px] normal-case tracking-normal text-[#6B7280] hover:text-black disabled:opacity-40"
          >
            Plus tard
          </button>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#F3F4F6] overflow-hidden">
          <div
            className="h-full bg-[#F43F5E] transition-all duration-300"
            style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <header className="mb-6">
        <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-black leading-tight">
          {currentStep.title}
        </h1>
        <p className="mt-1.5 text-[13.5px] text-[#374151] leading-relaxed">
          {currentStep.subtitle}
        </p>
      </header>

      <div className="space-y-6">
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
            hairConcerns={hairConcerns}
            setHairConcerns={setHairConcerns}
            otherHair={otherHair}
            setOtherHair={setOtherHair}
          />
        )}

        {currentStep.key === "concerns" && (
          <ConcernsStep
            concerns={concerns}
            setConcerns={setConcerns}
            otherConcerns={otherConcerns}
            setOtherConcerns={setOtherConcerns}
            allergies={allergies}
            setAllergies={setAllergies}
            otherNotes={otherNotes}
            setOtherNotes={setOtherNotes}
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
          className="mt-4 text-[12px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2"
        >
          {error}
        </p>
      )}

      {/* Footer actions */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={stepIdx === 0 || pending}
          className="text-[13px] text-[#6B7280] hover:text-black disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Retour
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSkipStep}
            disabled={pending}
            className="rounded-full px-4 py-2.5 text-[13px] font-medium text-[#6B7280] hover:text-black hover:bg-[#F3F4F6] transition disabled:opacity-40"
          >
            Passer
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={pending}
            className="rounded-full bg-black text-white text-[13px] font-semibold px-5 py-2.5 hover:bg-[#1F2937] transition disabled:opacity-50"
          >
            {pending ? "…" : isLast ? "Terminer" : "Suivant →"}
          </button>
        </div>
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
  hairConcerns: Set<HairConcern>;
  setHairConcerns: (v: Set<HairConcern>) => void;
  otherHair: string;
  setOtherHair: (v: string) => void;
}) {
  return (
    <>
      <Fieldset legend="Peau du visage">
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
      </Fieldset>

      <Fieldset legend="Peau du corps">
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
      </Fieldset>

      <Fieldset legend="Cheveux">
        <ChipMulti
          options={HAIR_CONCERNS.map((c) => ({
            value: c,
            label: HAIR_CONCERN_LABEL[c],
          }))}
          values={props.hairConcerns}
          onToggle={(v) => {
            const next = new Set(props.hairConcerns);
            if (next.has(v as HairConcern)) next.delete(v as HairConcern);
            else next.add(v as HairConcern);
            props.setHairConcerns(next);
          }}
        />
        <TextInput
          placeholder="Autre (boucles, colorés, longueurs cassantes…)"
          value={props.otherHair}
          onChange={props.setOtherHair}
          maxLength={200}
        />
      </Fieldset>
    </>
  );
}

function ConcernsStep(props: {
  concerns: Set<SkinConcern>;
  setConcerns: (v: Set<SkinConcern>) => void;
  otherConcerns: string;
  setOtherConcerns: (v: string) => void;
  allergies: string;
  setAllergies: (v: string) => void;
  otherNotes: string;
  setOtherNotes: (v: string) => void;
}) {
  return (
    <>
      <Fieldset legend="Préoccupations principales">
        <ChipMulti
          options={SKIN_CONCERNS.map((c) => ({
            value: c,
            label: SKIN_CONCERN_LABEL[c],
          }))}
          values={props.concerns}
          onToggle={(v) => {
            const next = new Set(props.concerns);
            if (next.has(v as SkinConcern)) next.delete(v as SkinConcern);
            else next.add(v as SkinConcern);
            props.setConcerns(next);
          }}
        />
        <TextInput
          placeholder="Autre (eczéma, rosacée, cicatrices…)"
          value={props.otherConcerns}
          onChange={props.setOtherConcerns}
          maxLength={300}
        />
      </Fieldset>

      <Fieldset legend="Allergies / intolérances">
        <TextArea
          placeholder="Ex : parfum, méthylisothiazolinone, lanoline…"
          value={props.allergies}
          onChange={props.setAllergies}
          maxLength={500}
          rows={2}
        />
      </Fieldset>

      <Fieldset legend="Autres précisions (optionnel)">
        <TextArea
          placeholder="Grossesse, traitement dermato, climat sec, etc."
          value={props.otherNotes}
          onChange={props.setOtherNotes}
          maxLength={500}
          rows={2}
        />
      </Fieldset>
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
    <Fieldset legend="Sélectionne ce qui te correspond">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PROFILE_GOALS.map((g) => {
          const active = props.goals.has(g);
          return (
            <button
              key={g}
              type="button"
              onClick={() => {
                const next = new Set(props.goals);
                if (next.has(g)) next.delete(g);
                else next.add(g);
                props.setGoals(next);
              }}
              className={`text-left rounded-2xl border px-4 py-3 text-[13.5px] font-medium transition ${
                active
                  ? "border-black bg-black text-white"
                  : "border-[#E5E7EB] bg-white text-black hover:border-black"
              }`}
            >
              <span className="block">{PROFILE_GOAL_LABEL[g]}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
          Autre — dis-nous ce que tu veux dans tes mots
        </label>
        <TextArea
          placeholder="Ex : « Je veux comprendre les étiquettes » ou « J'aimerais une routine simple pour ma peau mixte »…"
          value={props.otherGoals}
          onChange={props.setOtherGoals}
          maxLength={300}
          rows={3}
        />
      </div>
    </Fieldset>
  );
}

// ─── Shared inputs ─────────────────────────────────────────────────────────

function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5">
      <legend className="text-[12.5px] font-semibold text-black px-1">{legend}</legend>
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
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border transition ${
              active
                ? "bg-black text-white border-black"
                : "bg-white text-black border-[#E5E7EB] hover:border-black"
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
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border transition ${
              active
                ? "bg-black text-white border-black"
                : "bg-white text-black border-[#E5E7EB] hover:border-black"
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
      className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] text-black placeholder:text-[#9CA3AF] focus:outline-none focus:border-black"
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
      className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] text-black placeholder:text-[#9CA3AF] focus:outline-none focus:border-black resize-none"
    />
  );
}
