"use client";

/**
 * OnboardingWizard (web) — TWIN du mobile (components/onboarding/OnboardingWizard).
 *
 * Questionnaire profil en 11 MICRO-ÉTAPES (une question par écran), regroupées
 * en 3 blocs pastel :
 *   - Bloc « Ta peau » (violet)         : visage, corps, état des cheveux
 *   - Bloc « Tes préoccupations » (rose): peau, cheveux, autre
 *   - Bloc « Tes objectifs » (vert)     : visage, corps, cheveux, routine, autre
 *
 * Chrome : barre de progression globale (couleur du bloc), kicker + pastilles
 * numérotées de sous-étape, titre court, cartes pleine largeur, nav bas
 * (Suivant / « C'est parti ! »), « Passer » discret (saute une sous-question).
 *
 * Persistance INCHANGÉE : mêmes server actions (saveOnboardingStep par bloc,
 * completeOnboarding) → même stockage que le mobile.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
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
  saveNewsletterConsent,
  saveOnboardingStep,
} from "@/app/onboarding/actions";

type Bloc = "skin" | "concerns" | "goals" | "newsletter";
type Tone = "violet" | "rose" | "vert";

const TONES: Record<Tone, { solid: string; soft: string; text: string }> = {
  violet: { solid: "#8B5CF6", soft: "#F1ECFB", text: "#6D28D9" },
  rose: { solid: "#F43F5E", soft: "#FCE3EC", text: "#E11D48" },
  vert: { solid: "#16A34A", soft: "#E4F3E9", text: "#15803D" },
};

type MicroStep = {
  id: string;
  bloc: Bloc;
  blocLabel: string;
  tone: Tone;
  title: string;
};

const MICRO_STEPS: MicroStep[] = [
  // Bloc 1 — Ta peau (violet)
  { id: "face", bloc: "skin", blocLabel: "Ta peau", tone: "violet", title: "Ton type de peau au visage ?" },
  { id: "body", bloc: "skin", blocLabel: "Ta peau", tone: "violet", title: "Et la peau de ton corps ?" },
  { id: "hairState", bloc: "skin", blocLabel: "Ta peau", tone: "violet", title: "Comment sont tes cheveux ?" },
  // Bloc 2 — Tes préoccupations (rose)
  { id: "skinConcerns", bloc: "concerns", blocLabel: "Tes préoccupations", tone: "rose", title: "Qu'est-ce qui te préoccupe ?" },
  { id: "hairConcerns", bloc: "concerns", blocLabel: "Tes préoccupations", tone: "rose", title: "Et côté cheveux ?" },
  { id: "otherConcern", bloc: "concerns", blocLabel: "Tes préoccupations", tone: "rose", title: "Autre chose à signaler ?" },
  // Bloc 3 — Tes objectifs (vert)
  { id: "goalsFace", bloc: "goals", blocLabel: "Tes objectifs", tone: "vert", title: "Tes objectifs pour le visage" },
  { id: "goalsBody", bloc: "goals", blocLabel: "Tes objectifs", tone: "vert", title: "Tes objectifs pour le corps" },
  { id: "goalsHair", bloc: "goals", blocLabel: "Tes objectifs", tone: "vert", title: "Tes objectifs cheveux" },
  { id: "goalsRoutine", bloc: "goals", blocLabel: "Tes objectifs", tone: "vert", title: "Et ta routine ?" },
  { id: "otherGoal", bloc: "goals", blocLabel: "Tes objectifs", tone: "vert", title: "Un autre objectif en tête ?" },
];

/** Étape finale optionnelle (opt-in newsletter) ajoutée après le questionnaire
 *  pour les inscrits qui n'ont pas eu la case sur le formulaire (cas Google). */
const NEWSLETTER_STEP: MicroStep = {
  id: "newsletter",
  bloc: "newsletter",
  blocLabel: "Newsletter",
  tone: "rose",
  title: "Reste dans la boucle",
};

const AUTOSAVE_DEBOUNCE_MS = 600;

const goalOptions = (label: string) =>
  PROFILE_GOAL_GROUPS.find((g) => g.label === label)!.goals.map((k) => ({
    value: k as string,
    label: PROFILE_GOAL_LABEL[k],
  }));

type Props = {
  initial: SkinProfile;
  finalNext: string;
  firstName?: string | null;
  /** Ajoute l'étape finale « newsletter » (inscrits Google). */
  needsNewsletterStep?: boolean;
};

export function OnboardingWizard({
  initial,
  finalNext,
  firstName,
  needsNewsletterStep = false,
}: Props) {
  const router = useRouter();
  const STEPS = useMemo(
    () => (needsNewsletterStep ? [...MICRO_STEPS, NEWSLETTER_STEP] : MICRO_STEPS),
    [needsNewsletterStep],
  );
  const TOTAL = STEPS.length;
  const [index, setIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  // ─── État (identique à l'ancien wizard, même stockage) ───────────────────
  const [skinTypeFace, setSkinTypeFace] = useState<SkinTypeFace | "autre" | "">(
    initial.skinTypeFace ?? (initial.otherSkinTypeFace ? "autre" : ""),
  );
  const [otherSkinTypeFace, setOtherSkinTypeFace] = useState(initial.otherSkinTypeFace ?? "");
  const [skinTypeBody, setSkinTypeBody] = useState<SkinTypeBody | "autre" | "">(
    initial.skinTypeBody ?? (initial.otherSkinTypeBody ? "autre" : ""),
  );
  const [otherSkinTypeBody, setOtherSkinTypeBody] = useState(initial.otherSkinTypeBody ?? "");

  const initHairState = new Set<HairConcern>();
  for (const c of initial.hairConcerns ?? []) if (HAIR_STATE_CONCERNS.includes(c)) initHairState.add(c);
  const [hairStateConcerns, setHairStateConcerns] = useState<Set<HairConcern>>(initHairState);
  const [otherHair, setOtherHair] = useState(initial.otherHair ?? "");

  const [concerns, setConcerns] = useState<Set<SkinConcern>>(new Set(initial.concerns ?? []));
  const initHairProblems = new Set<HairConcern>();
  for (const c of initial.hairConcerns ?? []) if (HAIR_PROBLEM_CONCERNS.includes(c)) initHairProblems.add(c);
  const [hairProblemConcerns, setHairProblemConcerns] = useState<Set<HairConcern>>(initHairProblems);
  const [otherConcerns, setOtherConcerns] = useState(initial.otherConcerns ?? "");
  // Conservé (sans UI dédiée, comme le mobile) pour ne pas écraser une valeur existante.
  const [allergies] = useState(initial.allergiesFreeform ?? "");

  const [goals, setGoals] = useState<Set<ProfileGoal>>(new Set(initial.goals ?? []));
  const [otherGoals, setOtherGoals] = useState(initial.otherGoals ?? "");

  const step = STEPS[index];
  const bloc = step.bloc;
  const tone = TONES[step.tone];
  const isLast = index === TOTAL - 1;

  const blocSteps = STEPS.filter((s) => s.bloc === bloc);
  const blocPos = blocSteps.findIndex((s) => s.id === step.id);

  // ─── FormData d'un bloc (mêmes champs que les server actions) ─────────────
  const buildFormData = useCallback(
    (b: Bloc): FormData => {
      const fd = new FormData();
      fd.set("step", b);
      if (b === "newsletter") return fd; // pas de données profil à cette étape
      if (b === "skin") {
        if (skinTypeFace && skinTypeFace !== "autre") fd.set("skin_type_face", skinTypeFace);
        if (skinTypeFace === "autre" && otherSkinTypeFace.trim())
          fd.set("other_skin_type_face", otherSkinTypeFace.trim());
        if (skinTypeBody && skinTypeBody !== "autre") fd.set("skin_type_body", skinTypeBody);
        if (skinTypeBody === "autre" && otherSkinTypeBody.trim())
          fd.set("other_skin_type_body", otherSkinTypeBody.trim());
        hairStateConcerns.forEach((c) => fd.append("hair_concerns", c));
        if (otherHair.trim()) fd.set("other_hair", otherHair.trim());
      } else if (b === "concerns") {
        concerns.forEach((c) => fd.append("concerns", c));
        hairProblemConcerns.forEach((c) => fd.append("hair_problem_concerns", c));
        if (otherConcerns.trim()) fd.set("other_concerns", otherConcerns.trim());
        if (allergies.trim()) fd.set("allergies", allergies.trim());
      } else {
        goals.forEach((g) => fd.append("goals", g));
        if (otherGoals.trim()) fd.set("other_goals", otherGoals.trim());
      }
      return fd;
    },
    [
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
    ],
  );

  // ─── Auto-save débouncé du bloc courant ──────────────────────────────────
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (bloc === "newsletter") return; // rien à auto-sauver sur l'étape newsletter
    const h = window.setTimeout(() => {
      void saveOnboardingStep(buildFormData(bloc)).catch(() => undefined);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(h);
  }, [bloc, buildFormData]);

  function goNext() {
    setError(null);
    // UI instantanee : on avance tout de suite et on sauvegarde le bloc courant
    // en arriere-plan (non bloquant). L'auto-save debounce persiste deja les
    // changements, et finish() fait une sauvegarde finale avant la redirection.
    void saveOnboardingStep(buildFormData(bloc)).catch(() => undefined);
    setIndex((i) => Math.min(i + 1, TOTAL - 1));
  }

  function finish() {
    setError(null);
    startTransition(async () => {
      if (step.bloc === "newsletter") {
        // Étape newsletter : enregistre l'opt-in (+ synchro Brevo côté action).
        // Fail-open : ne bloque jamais la fin de l'onboarding.
        await saveNewsletterConsent(newsletterOptIn).catch(() => undefined);
      } else {
        const save = await saveOnboardingStep(buildFormData(bloc));
        if (!save.ok) {
          setError(save.error);
          return;
        }
      }
      const done = await completeOnboarding();
      if (!done.ok) {
        setError(done.error);
        return;
      }
      router.replace(finalNext);
    });
  }

  function handleSkip() {
    // « Passer » saute UNIQUEMENT la sous-question courante (avance d'une étape).
    // Sur la dernière, il termine le questionnaire. L'auto-save a déjà persisté
    // ce qui a éventuellement été rempli sur l'étape.
    setError(null);
    if (isLast) {
      finish();
      return;
    }
    setIndex((i) => Math.min(i + 1, TOTAL - 1));
  }

  function handleBack() {
    if (index > 0) setIndex((i) => i - 1);
  }

  const toggle = <T,>(setter: (v: Set<T>) => void, set: Set<T>, key: T) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  const kicker = index === 0 && firstName ? `Bonjour ${firstName}` : step.blocLabel;
  const progressPct = ((index + 1) / TOTAL) * 100;

  return (
    <div className="w-full">
      <style>{`@keyframes obFade{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}`}</style>

      {/* Header : retour (gauche) + Passer (droite) */}
      <div className="flex min-h-[40px] items-center justify-between">
        {index > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={pending}
            aria-label="Précédent"
            className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-[#111111] transition hover:bg-black/5 disabled:opacity-40"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : (
          <span className="h-9 w-9" />
        )}
        <button
          type="button"
          onClick={handleSkip}
          disabled={pending}
          className="text-[13px] font-medium text-[#9CA3AF] transition hover:text-[#374151] disabled:opacity-40"
        >
          Passer
        </button>
      </div>

      {/* Barre de progression (couleur du bloc) */}
      <div className="mt-2 h-[5px] w-full overflow-hidden rounded-full bg-[#EDEDED]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%`, backgroundColor: tone.solid }}
        />
      </div>

      {/* Kicker + pastilles numérotées du bloc */}
      <div className="mt-7 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: tone.text }}>
          {kicker}
        </p>
        <div className="flex gap-1.5">
          {blocSteps.map((s, i) => {
            const active = i === blocPos;
            const done = i < blocPos;
            return (
              <span
                key={s.id}
                className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-semibold"
                style={
                  active
                    ? { backgroundColor: tone.solid, color: "#fff" }
                    : done
                      ? { backgroundColor: tone.soft, color: tone.text }
                      : { backgroundColor: "#EDEDED", color: "#9CA3AF" }
                }
              >
                {i + 1}
              </span>
            );
          })}
        </div>
      </div>

      {/* Titre + corps (animé au changement d'étape) */}
      <div key={step.id} style={{ animation: "obFade 260ms ease-out" }} className="mt-6">
        <h1 className="mb-6 text-[26px] font-bold leading-tight tracking-tight text-[#111111]">
          {step.title}
        </h1>

        {step.id === "face" && (
          <SingleSelect
            tone={step.tone}
            options={SKIN_TYPES_FACE.map((k) => ({ value: k as string, label: SKIN_TYPE_FACE_LABEL[k] }))}
            value={skinTypeFace}
            onPick={(k) => setSkinTypeFace((cur) => (cur === k ? "" : (k as SkinTypeFace | "autre")))}
            otherPlaceholder="Décris ta peau du visage"
            otherValue={otherSkinTypeFace}
            onOtherChange={setOtherSkinTypeFace}
          />
        )}

        {step.id === "body" && (
          <SingleSelect
            tone={step.tone}
            options={SKIN_TYPES_BODY.map((k) => ({ value: k as string, label: SKIN_TYPE_BODY_LABEL[k] }))}
            value={skinTypeBody}
            onPick={(k) => setSkinTypeBody((cur) => (cur === k ? "" : (k as SkinTypeBody | "autre")))}
            otherPlaceholder="Décris la peau de ton corps"
            otherValue={otherSkinTypeBody}
            onOtherChange={setOtherSkinTypeBody}
          />
        )}

        {step.id === "hairState" && (
          <MultiSelect
            tone={step.tone}
            options={HAIR_STATE_CONCERNS.map((k) => ({ value: k as string, label: HAIR_CONCERN_LABEL[k] }))}
            values={hairStateConcerns as Set<string>}
            onToggle={(k) => toggle(setHairStateConcerns, hairStateConcerns, k as HairConcern)}
            otherPlaceholder="Décris l'état de tes cheveux (boucles, colorés…)"
            otherValue={otherHair}
            onOtherChange={setOtherHair}
          />
        )}

        {step.id === "skinConcerns" && (
          <MultiSelect
            tone={step.tone}
            options={SKIN_CONCERNS.map((k) => ({ value: k as string, label: SKIN_CONCERN_LABEL[k] }))}
            values={concerns as Set<string>}
            onToggle={(k) => toggle(setConcerns, concerns, k as SkinConcern)}
          />
        )}

        {step.id === "hairConcerns" && (
          <MultiSelect
            tone={step.tone}
            options={HAIR_PROBLEM_CONCERNS.map((k) => ({ value: k as string, label: HAIR_CONCERN_LABEL[k] }))}
            values={hairProblemConcerns as Set<string>}
            onToggle={(k) => toggle(setHairProblemConcerns, hairProblemConcerns, k as HairConcern)}
          />
        )}

        {step.id === "otherConcern" && (
          <FreeText
            value={otherConcerns}
            onChange={setOtherConcerns}
            placeholder="ex : tiraillements, allergie connue, ingrédient à éviter…"
          />
        )}

        {step.id === "goalsFace" && (
          <MultiSelect
            tone={step.tone}
            options={goalOptions("Visage")}
            values={goals as Set<string>}
            onToggle={(k) => toggle(setGoals, goals, k as ProfileGoal)}
          />
        )}
        {step.id === "goalsBody" && (
          <MultiSelect
            tone={step.tone}
            options={goalOptions("Corps")}
            values={goals as Set<string>}
            onToggle={(k) => toggle(setGoals, goals, k as ProfileGoal)}
          />
        )}
        {step.id === "goalsHair" && (
          <MultiSelect
            tone={step.tone}
            options={goalOptions("Cheveux")}
            values={goals as Set<string>}
            onToggle={(k) => toggle(setGoals, goals, k as ProfileGoal)}
          />
        )}
        {step.id === "goalsRoutine" && (
          <MultiSelect
            tone={step.tone}
            options={goalOptions("Routine")}
            values={goals as Set<string>}
            onToggle={(k) => toggle(setGoals, goals, k as ProfileGoal)}
          />
        )}
        {step.id === "otherGoal" && (
          <FreeText
            value={otherGoals}
            onChange={setOtherGoals}
            placeholder="Un objectif qui n'est pas dans la liste ?"
          />
        )}

        {step.id === "newsletter" && (
          <NewsletterOptIn
            checked={newsletterOptIn}
            onToggle={setNewsletterOptIn}
            tone={step.tone}
          />
        )}
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
          {error}
        </p>
      )}

      {/* Nav bas — bouton principal couleur du bloc */}
      <div className="mt-9">
        <button
          type="button"
          onClick={isLast ? finish : goNext}
          disabled={pending}
          className="block h-[54px] w-full rounded-full text-[15px] font-semibold text-white shadow-[0_6px_16px_-6px_rgba(15,23,42,0.35)] transition disabled:opacity-60"
          style={{ backgroundColor: tone.solid }}
        >
          {pending ? "Enregistrement…" : isLast ? "C'est parti !" : "Suivant"}
        </button>
      </div>
    </div>
  );
}

// ─── Cartes d'option ─────────────────────────────────────────────────────────

type Opt = { value: string; label: string };

function OptionCard({
  label,
  selected,
  tone,
  multi = false,
  onClick,
}: {
  label: string;
  selected: boolean;
  tone: Tone;
  multi?: boolean;
  onClick: () => void;
}) {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex w-full items-center justify-between rounded-2xl border-[1.5px] px-5 py-4 text-left transition"
      style={
        selected
          ? { backgroundColor: t.soft, borderColor: t.solid }
          : { backgroundColor: "#fff", borderColor: "#E5E5E0" }
      }
    >
      <span className="pr-3 text-[15px] font-medium" style={{ color: selected ? t.text : "#111111" }}>
        {label}
      </span>
      <span
        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center border-2 ${multi ? "rounded-md" : "rounded-full"}`}
        style={{
          borderColor: selected ? t.solid : "#D1D5DB",
          backgroundColor: selected && multi ? t.solid : "transparent",
        }}
      >
        {selected && multi ? (
          <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-12" />
          </svg>
        ) : selected ? (
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.solid }} />
        ) : null}
      </span>
    </button>
  );
}

function OtherInput({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={200}
      className="mt-1 w-full rounded-xl border-[1.5px] border-[#E5E5E0] bg-white px-4 py-3 text-[15px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#111111] focus:outline-none"
    />
  );
}

function SingleSelect({
  tone,
  options,
  value,
  onPick,
  otherPlaceholder,
  otherValue,
  onOtherChange,
}: {
  tone: Tone;
  options: Opt[];
  value: string;
  onPick: (key: string) => void;
  otherPlaceholder?: string;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => (
        <OptionCard
          key={opt.value}
          label={opt.label}
          selected={value === opt.value}
          tone={tone}
          onClick={() => onPick(opt.value)}
        />
      ))}
      {otherPlaceholder && (
        <OptionCard
          label="Autre"
          selected={value === "autre"}
          tone={tone}
          onClick={() => onPick("autre")}
        />
      )}
      {otherPlaceholder && value === "autre" && onOtherChange && (
        <OtherInput value={otherValue ?? ""} placeholder={otherPlaceholder} onChange={onOtherChange} />
      )}
    </div>
  );
}

function MultiSelect({
  tone,
  options,
  values,
  onToggle,
  otherPlaceholder,
  otherValue,
  onOtherChange,
}: {
  tone: Tone;
  options: Opt[];
  values: Set<string>;
  onToggle: (key: string) => void;
  otherPlaceholder?: string;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
}) {
  const [otherOpen, setOtherOpen] = useState(Boolean(otherValue));
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => (
        <OptionCard
          key={opt.value}
          label={opt.label}
          selected={values.has(opt.value)}
          tone={tone}
          multi
          onClick={() => onToggle(opt.value)}
        />
      ))}
      {otherPlaceholder && (
        <OptionCard
          label="Autre"
          selected={otherOpen}
          tone={tone}
          multi
          onClick={() => {
            const next = !otherOpen;
            setOtherOpen(next);
            if (!next) onOtherChange?.("");
          }}
        />
      )}
      {otherPlaceholder && otherOpen && onOtherChange && (
        <OtherInput value={otherValue ?? ""} placeholder={otherPlaceholder} onChange={onOtherChange} />
      )}
    </div>
  );
}

function FreeText({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={300}
      rows={4}
      className="w-full resize-none rounded-2xl border-[1.5px] border-[#E5E5E0] bg-white px-4 py-3 text-[15px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#111111] focus:outline-none"
    />
  );
}

// ─── Étape finale newsletter (opt-in) ────────────────────────────────────────

function NewsletterOptIn({
  checked,
  onToggle,
  tone,
}: {
  checked: boolean;
  onToggle: (v: boolean) => void;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[15px] leading-6 text-[#374151]">
        Reçois nos meilleurs conseils, décryptages et nouveautés par email. Un
        envoi de temps en temps, jamais de spam.
      </p>
      <button
        type="button"
        onClick={() => onToggle(!checked)}
        aria-pressed={checked}
        className="flex w-full items-center justify-between rounded-2xl border-[1.5px] px-5 py-4 text-left transition"
        style={
          checked
            ? { backgroundColor: t.soft, borderColor: t.solid }
            : { backgroundColor: "#fff", borderColor: "#E5E5E0" }
        }
      >
        <span
          className="pr-3 text-[15px] font-medium"
          style={{ color: checked ? t.text : "#111111" }}
        >
          Oui, je veux recevoir la newsletter
        </span>
        <span
          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-2"
          style={{
            borderColor: checked ? t.solid : "#D1D5DB",
            backgroundColor: checked ? t.solid : "transparent",
          }}
        >
          {checked ? (
            <svg
              className="h-3.5 w-3.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12l5 5 9-12" />
            </svg>
          ) : null}
        </span>
      </button>
    </div>
  );
}
