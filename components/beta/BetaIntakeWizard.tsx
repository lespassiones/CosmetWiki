"use client";

/**
 * Questionnaire d'inscription bêta (page /beta), AVANT d'obtenir l'accès.
 * Étape 0 = identité (prénom, nom, email, consentement RGPD). Étapes suivantes
 * = questions persona (adaptées du guide « Validation Persona »). Tout est
 * collecté côté client puis envoyé EN UNE FOIS via joinBeta (le testeur n'existe
 * pas encore avant la soumission).
 *
 * Questions DATA-DRIVEN (tableau INTAKE_STEPS) → faciles à remplacer quand la
 * liste finale sera prête. Les réponses sont stockées en jsonb (clés i1..iN).
 * Aucune question persona n'est obligatoire pour l'instant (mettre
 * `required: true` pour en rendre une bloquante).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinBeta } from "@/app/beta/actions";

type Q =
  | { id: string; type: "short" | "textarea"; label: string; required?: boolean; placeholder?: string }
  | { id: string; type: "radio" | "checkbox"; label: string; required?: boolean; options: string[] };

const INTAKE_STEPS: { title: string; questions: Q[] }[] = [
  {
    title: "Un peu de contexte",
    questions: [
      { id: "i1", type: "radio", label: "Quel est ton âge ?", options: ["Moins de 20 ans", "21-30 ans", "31-40 ans", "41-50 ans", "Plus de 50 ans"] },
      { id: "i2", type: "short", label: "Ta profession ?", placeholder: "ex : étudiante, infirmière…" },
      { id: "i3", type: "textarea", label: "Comment décrirais-tu ta peau et tes cheveux ?" },
      { id: "i4", type: "textarea", label: "As-tu des problématiques ou des objectifs particuliers ?" },
    ],
  },
  {
    title: "Tes habitudes d'achat",
    questions: [
      { id: "i5", type: "textarea", label: "Raconte-nous ton dernier achat cosmétique (quel produit, pourquoi, où) ?" },
      { id: "i6", type: "textarea", label: "Comment as-tu choisi ce produit ?" },
      {
        id: "i7",
        type: "checkbox",
        label: "Qu'as-tu consulté pour décider ?",
        options: ["Les ingrédients", "Des avis en ligne", "Google", "Les réseaux sociaux", "Une application", "Un pharmacien", "Un dermatologue", "Rien"],
      },
      { id: "i8", type: "short", label: "Combien de cosmétiques as-tu achetés cette année (environ) ?" },
      { id: "i9", type: "short", label: "Combien ne t'ont finalement pas convenu ?" },
    ],
  },
  {
    title: "Difficultés & budget",
    questions: [
      { id: "i10", type: "textarea", label: "Qu'est-ce qui est le plus difficile quand tu choisis un cosmétique ?" },
      { id: "i11", type: "textarea", label: "Que fais-tu des produits qui ne te conviennent pas ?" },
      {
        id: "i12",
        type: "radio",
        label: "Combien estimes-tu perdre par an en achats inadaptés ?",
        options: ["Moins de 20 €", "20 à 50 €", "50 à 100 €", "Plus de 100 €", "Je ne sais pas"],
      },
      { id: "i13", type: "textarea", label: "Qu'utilises-tu aujourd'hui pour choisir tes cosmétiques ? Qu'est-ce qui manque ?" },
    ],
  },
  {
    title: "Ta vision",
    questions: [
      { id: "i14", type: "textarea", label: "À quoi ressemblerait la solution idéale pour choisir tes cosmétiques ?" },
      { id: "i15", type: "radio", label: "Serais-tu prêt·e à payer pour éviter les mauvais achats ?", options: ["Oui", "Non", "Peut-être"] },
      { id: "i16", type: "radio", label: "Si oui, quel budget par mois ?", options: ["Moins de 5 €", "5 à 10 €", "Plus de 10 €"] },
      { id: "i17", type: "textarea", label: "Un dernier conseil pour nous ?" },
    ],
  },
];

// Map id → intitulé, pour stocker chaque réponse AVEC sa question (l'admin
// affiche alors { question, réponse } sans dépendre d'une liste dupliquée).
const INTAKE_LABELS: Record<string, string> = {};
INTAKE_STEPS.forEach((s) => s.questions.forEach((q) => (INTAKE_LABELS[q.id] = q.label)));

const TOTAL_STEPS = INTAKE_STEPS.length + 1; // +1 pour l'étape identité

export function BetaIntakeWizard({ source }: { source?: string }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0); // 0 = identité
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isIdentityStep = stepIndex === 0;
  const isLast = stepIndex === TOTAL_STEPS - 1;
  const personaStep = isIdentityStep ? null : INTAKE_STEPS[stepIndex - 1];

  function setAnswer(id: string, value: string) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  function toggleCheckbox(id: string, opt: string) {
    setAnswers((a) => {
      const current = (a[id] ?? "").split(" · ").filter(Boolean);
      const next = current.includes(opt) ? current.filter((o) => o !== opt) : [...current, opt];
      return { ...a, [id]: next.join(" · ") };
    });
  }

  function validateStep(): string | null {
    if (isIdentityStep) {
      if (!email.includes("@")) return "Merci d'indiquer un email valide.";
      if (!consent) return "Tu dois accepter d'être contacté pour rejoindre la bêta.";
      return null;
    }
    for (const q of personaStep!.questions) {
      if (q.required && !(answers[q.id] ?? "").trim()) {
        return "Merci de répondre aux questions obligatoires avant de continuer.";
      }
    }
    return null;
  }

  function next() {
    setError(null);
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    if (!isLast) {
      setStepIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Dernière étape → envoi unique. On joint l'intitulé à chaque réponse.
    const intake: Record<string, { q: string; a: string }> = {};
    for (const [id, a] of Object.entries(answers)) {
      const val = (a ?? "").trim();
      if (val && INTAKE_LABELS[id]) intake[id] = { q: INTAKE_LABELS[id], a: val };
    }
    startTransition(async () => {
      const res = await joinBeta({
        firstName,
        lastName,
        email,
        consent,
        source: source ?? null,
        intake,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/beta/merci");
    });
  }

  const progressPct = ((stepIndex + 1) / TOTAL_STEPS) * 100;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
          Étape {stepIndex + 1} / {TOTAL_STEPS}
        </p>
        <p className="text-[12px] font-medium text-[#6B7280]">
          {isIdentityStep ? "Tes infos" : personaStep!.title}
        </p>
      </div>
      <div className="mb-6 h-[5px] w-full overflow-hidden rounded-full bg-[#EDEDED]">
        <div className="h-full rounded-full bg-[#111111] transition-all duration-300" style={{ width: `${progressPct}%` }} />
      </div>

      {isIdentityStep ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom" value={firstName} onChange={setFirstName} autoComplete="given-name" />
            <Field label="Nom" value={lastName} onChange={setLastName} autoComplete="family-name" />
          </div>
          <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" required />
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D1D5DB] accent-[#111111]"
            />
            <span className="text-[12px] leading-4 text-[#6B7280]">
              J&apos;accepte que mon adresse email soit utilisée pour être contacté afin de
              tester l&apos;application Cosme Check (accès, retours et relances), conformément à la{" "}
              <a href="/confidentialite" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="font-medium text-[#111111] underline underline-offset-2">
                politique de confidentialité
              </a>
              .
            </span>
          </label>
        </div>
      ) : (
        <div className="space-y-7">
          {personaStep!.questions.map((q) => (
            <div key={q.id}>
              <p className="mb-2 text-[14px] font-medium leading-5 text-[#111111]">
                {q.label}
                {q.required && <span className="text-[#E11D48]"> *</span>}
              </p>
              {q.type === "radio" && (
                <div className="flex flex-col gap-2">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <OptionButton key={opt} label={opt} selected={selected} onClick={() => setAnswer(q.id, selected ? "" : opt)} />
                    );
                  })}
                </div>
              )}
              {q.type === "checkbox" && (
                <div className="flex flex-col gap-2">
                  {q.options.map((opt) => {
                    const selected = (answers[q.id] ?? "").split(" · ").includes(opt);
                    return (
                      <OptionButton key={opt} label={opt} selected={selected} multi onClick={() => toggleCheckbox(q.id, opt)} />
                    );
                  })}
                </div>
              )}
              {q.type === "short" && (
                <input
                  type="text"
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  maxLength={2000}
                  className="w-full rounded-xl border-[1.5px] border-[#E5E5E0] bg-white px-4 py-3 text-[14px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#111111] focus:outline-none"
                />
              )}
              {q.type === "textarea" && (
                <textarea
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Ta réponse…"
                  className="w-full resize-none rounded-xl border-[1.5px] border-[#E5E5E0] bg-white px-4 py-3 text-[14px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#111111] focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-[#E11D48]">
          {error}
        </p>
      )}

      <div className="mt-7 flex items-center gap-3">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStepIndex((i) => i - 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={pending}
            className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-[#111111] ring-1 ring-[#E5E7EB] transition hover:bg-[#F9FAFB] disabled:opacity-50"
          >
            Retour
          </button>
        )}
        <button
          type="button"
          onClick={next}
          disabled={pending || (isIdentityStep && !consent)}
          className="flex-1 rounded-xl bg-[#111111] py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Envoi…" : isLast ? "Rejoindre la bêta" : "Suivant"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#6B7280]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
      />
    </label>
  );
}

function OptionButton({
  label,
  selected,
  multi,
  onClick,
}: {
  label: string;
  selected: boolean;
  multi?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex w-full items-center justify-between rounded-xl border-[1.5px] px-4 py-3 text-left text-[14px] transition"
      style={selected ? { backgroundColor: "#111111", borderColor: "#111111", color: "#fff" } : { backgroundColor: "#fff", borderColor: "#E5E5E0", color: "#111111" }}
    >
      <span>{label}</span>
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center border-2 ${multi ? "rounded-md" : "rounded-full"}`}
        style={{ borderColor: selected ? "#fff" : "#D1D5DB", backgroundColor: selected && multi ? "#fff" : "transparent" }}
      >
        {selected && (multi ? <span className="text-[11px] font-bold text-[#111111]">✓</span> : <span className="h-2 w-2 rounded-full bg-white" />)}
      </span>
    </button>
  );
}
