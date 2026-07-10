"use client";

/**
 * Questionnaire d'inscription bêta (page /beta), AVANT d'obtenir l'accès.
 * DEUX étapes seulement :
 *   1. Identité : prénom, nom, email, consentement RGPD.
 *   2. Questions persona (adaptées du guide « Validation Persona »), regroupées
 *      par thème sur un seul écran aéré.
 * Tout est collecté côté client puis envoyé EN UNE FOIS via joinBeta (le testeur
 * n'existe pas avant la soumission). Réponses stockées en jsonb (clés i1..iN),
 * chacune avec son intitulé pour un affichage auto-décrit dans l'admin.
 * Questions DATA-DRIVEN (INTAKE_GROUPS) : faciles à remplacer.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinBeta } from "@/app/beta/actions";

type Q =
  | { id: string; type: "short" | "textarea"; label: string; required?: boolean; placeholder?: string }
  | { id: string; type: "radio" | "checkbox"; label: string; required?: boolean; options: string[] };

const INTAKE_GROUPS: { title: string; questions: Q[] }[] = [
  {
    title: "Un peu de contexte",
    questions: [
      { id: "i1", type: "radio", label: "Quel est ton âge ?", options: ["Moins de 20 ans", "21-30 ans", "31-40 ans", "41-50 ans", "Plus de 50 ans"] },
      { id: "i2", type: "short", label: "Ta profession ?", placeholder: "ex : étudiante, infirmière..." },
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

const INTAKE_LABELS: Record<string, string> = {};
INTAKE_GROUPS.forEach((g) => g.questions.forEach((q) => (INTAKE_LABELS[q.id] = q.label)));

const ALL_QUESTIONS = INTAKE_GROUPS.flatMap((g) => g.questions);

export function BetaIntakeWizard({ source }: { source?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

  function submit() {
    setError(null);
    for (const q of ALL_QUESTIONS) {
      if (q.required && !(answers[q.id] ?? "").trim()) {
        setError("Merci de répondre aux questions obligatoires.");
        return;
      }
    }
    const intake: Record<string, { q: string; a: string }> = {};
    for (const [id, a] of Object.entries(answers)) {
      const val = (a ?? "").trim();
      if (val && INTAKE_LABELS[id]) intake[id] = { q: INTAKE_LABELS[id], a: val };
    }
    startTransition(async () => {
      const res = await joinBeta({ firstName, lastName, email, consent, source: source ?? null, intake });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/beta/merci");
    });
  }

  function goToStep2() {
    setError(null);
    if (!email.includes("@")) {
      setError("Merci d'indiquer un email valide.");
      return;
    }
    if (!consent) {
      setError("Merci d'accepter d'être contacté pour rejoindre la bêta.");
      return;
    }
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      {/* Progression : deux traits fins */}
      <div className="mb-8 flex items-center gap-2">
        <span className="h-[3px] flex-1 rounded-full bg-[#111111]" />
        <span className={`h-[3px] flex-1 rounded-full transition-colors ${step === 1 ? "bg-[#111111]" : "bg-[#E5E5E0]"}`} />
        <span className="ml-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#9CA3AF]">
          {step + 1} / 2
        </span>
      </div>

      {step === 0 ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-[15px] font-semibold text-[#111111]">Tes informations</h2>
            <p className="mt-1 text-[13px] leading-5 text-[#9CA3AF]">
              Pour te prévenir dès l'ouverture et t'envoyer ton accès.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prénom" value={firstName} onChange={setFirstName} autoComplete="given-name" />
            <Field label="Nom" value={lastName} onChange={setLastName} autoComplete="family-name" />
          </div>
          <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
          <label className="flex cursor-pointer items-start gap-3 pt-1">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D1D5DB] accent-[#111111]"
            />
            <span className="text-[12px] leading-5 text-[#6B7280]">
              J'accepte que mon adresse email soit utilisée pour être contacté afin de tester
              l'application Cosme Check (accès, retours et relances), conformément à la{" "}
              <a href="/confidentialite" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="font-medium text-[#111111] underline underline-offset-2">
                politique de confidentialité
              </a>
              .
            </span>
          </label>
        </div>
      ) : (
        <div className="space-y-10">
          {INTAKE_GROUPS.map((group) => (
            <div key={group.title} className="space-y-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
                {group.title}
              </p>
              {group.questions.map((q) => (
                <div key={q.id}>
                  <p className="mb-2.5 text-[14px] font-medium leading-5 text-[#111111]">
                    {q.label}
                    {q.required && <span className="text-[#111111]"> *</span>}
                  </p>
                  {q.type === "radio" && (
                    <div className="flex flex-col gap-2">
                      {q.options.map((opt) => (
                        <OptionButton key={opt} label={opt} selected={answers[q.id] === opt} onClick={() => setAnswer(q.id, answers[q.id] === opt ? "" : opt)} />
                      ))}
                    </div>
                  )}
                  {q.type === "checkbox" && (
                    <div className="flex flex-col gap-2">
                      {q.options.map((opt) => (
                        <OptionButton key={opt} label={opt} selected={(answers[q.id] ?? "").split(" · ").includes(opt)} multi onClick={() => toggleCheckbox(q.id, opt)} />
                      ))}
                    </div>
                  )}
                  {q.type === "short" && (
                    <input
                      type="text"
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      maxLength={2000}
                      placeholder={q.placeholder}
                      className="w-full border-0 border-b border-[#E5E5E0] bg-transparent px-0 py-2 text-[15px] text-[#111111] placeholder:text-[#C4C4BE] focus:border-[#111111] focus:outline-none"
                    />
                  )}
                  {q.type === "textarea" && (
                    <textarea
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      rows={2}
                      maxLength={2000}
                      placeholder="Ta réponse..."
                      className="w-full resize-none border-0 border-b border-[#E5E5E0] bg-transparent px-0 py-2 text-[15px] leading-6 text-[#111111] placeholder:text-[#C4C4BE] focus:border-[#111111] focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 text-[13px] font-medium text-[#B91C1C]">
          {error}
        </p>
      )}

      <div className="mt-9 flex items-center gap-4">
        {step === 1 && (
          <button
            type="button"
            onClick={() => { setError(null); setStep(0); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={pending}
            className="text-[14px] font-medium text-[#6B7280] transition hover:text-[#111111] disabled:opacity-50"
          >
            Retour
          </button>
        )}
        <button
          type="button"
          onClick={step === 0 ? goToStep2 : submit}
          disabled={pending || (step === 0 && !consent)}
          className="ml-auto inline-flex h-[52px] items-center justify-center rounded-full bg-[#111111] px-8 text-[15px] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Envoi..." : step === 0 ? "Continuer" : "Rejoindre la bêta"}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-[#6B7280]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full border-0 border-b border-[#E5E5E0] bg-transparent px-0 py-2 text-[15px] text-[#111111] focus:border-[#111111] focus:outline-none"
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
      className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] transition"
      style={selected ? { borderColor: "#111111", background: "#111111", color: "#fff" } : { borderColor: "#E5E5E0", background: "#fff", color: "#111111" }}
    >
      <span
        className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center border ${multi ? "rounded" : "rounded-full"}`}
        style={{ borderColor: selected ? "#fff" : "#D1D5DB" }}
      >
        {selected && <span className={`bg-white ${multi ? "h-[8px] w-[8px] rounded-[1px]" : "h-[7px] w-[7px] rounded-full"}`} />}
      </span>
      {label}
    </button>
  );
}
