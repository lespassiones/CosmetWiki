"use client";

/**
 * Formulaire de retour bêta en 4 ÉTAPES (reconstruction du Google Form).
 * Chaque « Suivant » sauvegarde les réponses de l'étape (jsonb fusionné côté
 * serveur) pour ne rien perdre en cas d'abandon. La dernière étape marque le
 * retour reçu → merci automatique + arrêt des relances pour ce testeur.
 *
 * Les captures d'écran (optionnelles) sont servies depuis
 * /public/beta-captures/qN.webp — un fichier absent masque simplement l'image.
 */

import { useState, useTransition } from "react";
import { saveBetaFeedback } from "@/app/beta/actions";

type Question = {
  id: string;
  label: string;
  type: "radio" | "textarea";
  options?: string[];
  required?: boolean;
  /** Capture d'écran illustrant la question (dans /public/beta-captures/). */
  image?: string;
  placeholder?: string;
  /** N'afficher la question que si une autre réponse a cette valeur. */
  showIf?: { id: string; value: string };
};

type Step = { title: string; questions: Question[] };

const STEPS: Step[] = [
  {
    title: "Parle-nous de toi",
    questions: [
      { id: "q1", label: "Tu es :", type: "radio", options: ["Une femme", "Un homme", "Ne souhaite pas préciser"] },
      {
        id: "q2",
        label: "Quel est ton âge ?",
        type: "radio",
        options: ["Moins de 20 ans", "Entre 21 et 30 ans", "Entre 31 et 40 ans", "Entre 41 et 50 ans", "Plus de 50 ans"],
      },
      {
        id: "q3",
        label:
          "As-tu des problématiques ou des besoins particuliers, des restrictions en matière de produits cosmétiques ou des objectifs en lien avec l'état de ta peau ou de tes cheveux ?",
        type: "radio",
        options: ["NON", "OUI"],
        required: true,
      },
      {
        id: "q4",
        label: "Peux-tu préciser ?",
        type: "textarea",
        placeholder: "Allergies, peau sensible, objectifs…",
        showIf: { id: "q3", value: "OUI" },
      },
    ],
  },
  {
    title: "Tes premiers pas",
    questions: [
      {
        id: "q5",
        label:
          "Qu'as-tu pensé de l'onboarding (création de ton profil avec ton type de peau, de cheveux, ton besoin, tes objectifs…) ?",
        type: "textarea",
        required: true,
      },
      { id: "q6", label: "As-tu pu créer un compte facilement ?", type: "textarea", required: true },
      {
        id: "q7",
        label: "As-tu renseigné la session « RESTRICTIONS » ?",
        type: "textarea",
        required: true,
        image: "/beta-captures/q7.webp",
      },
      {
        id: "q8",
        label:
          "Les fonctionnalités, telles qu'elles sont présentées à l'accueil, ont-elles facilité ton expérience ?",
        type: "textarea",
        required: true,
        image: "/beta-captures/q8.webp",
      },
    ],
  },
  {
    title: "Les analyses",
    questions: [
      {
        id: "q9",
        label:
          "Quel mode d'analyse as-tu le plus utilisé ou était le plus pratique pour toi ? As-tu rencontré des difficultés ? Si oui, explique-nous.",
        type: "textarea",
        required: true,
        image: "/beta-captures/q9.webp",
      },
      {
        id: "q10",
        label: "Quel est ton avis sur les résultats des analyses tels qu'ils sont présentés (forme et fond) ?",
        type: "textarea",
        required: true,
        image: "/beta-captures/q10.webp",
      },
      {
        id: "q11",
        label: "Que penses-tu des alternatives proposées ?",
        type: "textarea",
        required: true,
        image: "/beta-captures/q11.webp",
      },
      {
        id: "q12",
        label: "Qu'as-tu pensé de la fonctionnalité dédiée à l'analyse des promesses ?",
        type: "textarea",
        required: true,
        image: "/beta-captures/q12.webp",
      },
      {
        id: "q13",
        label:
          "Que penses-tu de la possibilité, après l'analyse d'un produit, de pouvoir analyser la « PROMESSE » et d'ajouter le produit à « TA ROUTINE » ?",
        type: "textarea",
        required: true,
        image: "/beta-captures/q13.webp",
      },
    ],
  },
  {
    title: "Pour finir",
    questions: [
      {
        id: "q14",
        label:
          "Quel est ton avis sur la fonctionnalité « MA ROUTINE », ton exposition cumulée et les suggestions intelligentes ?",
        type: "textarea",
        required: true,
        image: "/beta-captures/q14.webp",
      },
      {
        id: "q15",
        label:
          "Que penses-tu de la possibilité de comparer 2 produits selon ton profil (session historique) et de pouvoir ajouter des produits en favoris ?",
        type: "textarea",
        required: true,
        image: "/beta-captures/q15.webp",
      },
      {
        id: "q16",
        label:
          "Quel est ton avis sur la possibilité de bénéficier des conseils personnalisés du « BEAUTY ADVISOR » et de pouvoir également retrouver l'historique de tes conversations ?",
        type: "textarea",
        required: true,
        image: "/beta-captures/q16.webp",
      },
      { id: "q17", label: "As-tu rencontré des difficultés ? Si oui, lesquelles ?", type: "textarea", required: true },
      { id: "q18", label: "As-tu des recommandations à nous faire ? Si oui, lesquelles ?", type: "textarea", required: true },
      {
        id: "q19",
        label: "As-tu des questions ? Nous te lisons et c'est avec plaisir que nous prendrons le soin de te répondre.",
        type: "textarea",
        required: true,
      },
      {
        id: "q20",
        label: "Souhaites-tu ajouter quelque chose avant de clôturer ce formulaire ?",
        type: "textarea",
      },
    ],
  },
];

export function BetaFeedbackWizard({ token }: { token: string }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const visible = (q: Question): boolean =>
    !q.showIf || answers[q.showIf.id] === q.showIf.value;

  function missingRequired(): string | null {
    for (const q of step.questions) {
      if (q.required && visible(q) && !(answers[q.id] ?? "").trim()) {
        return q.id;
      }
    }
    return null;
  }

  function goNext() {
    setError(null);
    const missing = missingRequired();
    if (missing) {
      setError("Merci de répondre aux questions obligatoires avant de continuer.");
      return;
    }
    // Réponses de l'étape courante uniquement (le serveur fusionne). On joint
    // l'intitulé à chaque réponse ({ q, a }) pour l'affichage admin.
    const stepAnswers: Record<string, { q: string; a: string }> = {};
    for (const q of step.questions) {
      const v = (answers[q.id] ?? "").trim();
      if (v && visible(q)) stepAnswers[q.id] = { q: q.label, a: v };
    }
    startTransition(async () => {
      const res = await saveBetaFeedback({ token, answers: stepAnswers, final: isLast });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (isLast) {
        setDone(true);
        return;
      }
      setStepIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-6 text-center">
        <p className="text-[15px] font-semibold text-emerald-800">Merci pour ton retour ! 💛</p>
        <p className="mt-1 text-[13px] text-emerald-700">
          On t&apos;a envoyé un petit mot par email. Chaque réponse est lue avec attention.
        </p>
      </div>
    );
  }

  const progressPct = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div>
      {/* Progression */}
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
          Étape {stepIndex + 1} / {STEPS.length}
        </p>
        <p className="text-[12px] font-medium text-[#6B7280]">{step.title}</p>
      </div>
      <div className="mb-6 h-[5px] w-full overflow-hidden rounded-full bg-[#EDEDED]">
        <div
          className="h-full rounded-full bg-[#111111] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="space-y-7">
        {step.questions.filter(visible).map((q) => (
          <div key={q.id}>
            <p className="mb-2 text-[14px] font-medium leading-5 text-[#111111]">
              {q.label}
              {q.required && <span className="text-[#E11D48]"> *</span>}
            </p>

            {q.image && (
              <img
                src={q.image}
                alt=""
                className="mb-3 w-full max-w-[280px] rounded-2xl border border-[#EDEDED] mx-auto block"
                onError={(e) => {
                  // Capture pas encore fournie → on masque sans casser la page.
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}

            {q.type === "radio" ? (
              <div className="flex flex-col gap-2">
                {q.options!.map((opt) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setAnswers((a) => ({ ...a, [q.id]: selected ? "" : opt }))
                      }
                      aria-pressed={selected}
                      className="flex w-full items-center justify-between rounded-xl border-[1.5px] px-4 py-3 text-left text-[14px] transition"
                      style={
                        selected
                          ? { backgroundColor: "#111111", borderColor: "#111111", color: "#fff" }
                          : { backgroundColor: "#fff", borderColor: "#E5E5E0", color: "#111111" }
                      }
                    >
                      <span>{opt}</span>
                      <span
                        className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2"
                        style={{ borderColor: selected ? "#fff" : "#D1D5DB" }}
                      >
                        {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                rows={3}
                maxLength={2000}
                placeholder={q.placeholder ?? "Ta réponse…"}
                className="w-full resize-none rounded-xl border-[1.5px] border-[#E5E5E0] bg-white px-4 py-3 text-[14px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#111111] focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>

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
          onClick={goNext}
          disabled={pending}
          className="flex-1 rounded-xl bg-[#111111] py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : isLast ? "Envoyer mon retour" : "Suivant"}
        </button>
      </div>
    </div>
  );
}
