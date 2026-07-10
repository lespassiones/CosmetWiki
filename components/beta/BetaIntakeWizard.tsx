"use client";

/**
 * Questionnaire d'inscription bêta (page /beta), AVANT d'obtenir l'accès.
 * Le composant pilote TOUTE la mise en page :
 *   - Étape 1 : split-screen. Gauche = branding (logo, accroche, aperçu app),
 *     droite = identité (prénom, nom, email, consentement RGPD).
 *   - Étape 2 : colonne centrée, SANS branding ni image (juste les questions).
 * Tout est collecté côté client puis envoyé EN UNE FOIS via joinBeta (le testeur
 * n'existe pas avant la soumission). Réponses stockées en jsonb, chacune avec
 * son intitulé pour un affichage auto-décrit dans l'admin.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinBeta } from "@/app/beta/actions";

type Q =
  | { id: string; type: "short" | "textarea"; label: string; required?: boolean; placeholder?: string }
  | { id: string; type: "radio" | "checkbox"; label: string; required?: boolean; options: string[] };

const INTAKE_QUESTIONS: Q[] = [
  {
    id: "i1",
    type: "textarea",
    required: true,
    label:
      "Raconte-moi la dernière fois où tu as acheté un cosmétique pour répondre à un besoin particulier de ta peau ou de tes cheveux, et où ça n'a pas marché. Qu'est-ce qu'il s'est passé ?",
  },
  {
    id: "i2",
    type: "textarea",
    required: true,
    label: "Avant de l'acheter, qu'est-ce que tu avais fait pour essayer d'être sûr(e) que ce produit te conviendrait ?",
  },
  {
    id: "i3",
    type: "textarea",
    required: true,
    label:
      "Avec le recul, pourquoi penses-tu que tu t'es trompé(e) dans ton choix ? Qu'est-ce qui t'a manqué au moment de l'achat ?",
  },
  {
    id: "i4",
    type: "textarea",
    required: true,
    label: "Si tu pouvais revenir en arrière, qu'est-ce qui t'aurait permis de choisir le bon produit du premier coup ?",
  },
  {
    id: "i5",
    type: "textarea",
    required: true,
    label:
      "Combien de fois as-tu vécu une telle expérience, et combien ça t'a coûté : en argent ? en temps ? en frustration ou en stress ?",
  },
];

const INTAKE_LABELS: Record<string, string> = {};
INTAKE_QUESTIONS.forEach((q) => (INTAKE_LABELS[q.id] = q.label));

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

  function submit() {
    setError(null);
    for (const q of INTAKE_QUESTIONS) {
      if (q.required && !(answers[q.id] ?? "").trim()) {
        setError("Merci de répondre à toutes les questions.");
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

  // ─── Bloc formulaire (progression + contenu de l'étape + nav), commun aux
  //     deux mises en page. ────────────────────────────────────────────────
  const form = (
    <div className="w-full">
      <div className="mb-8 flex items-center gap-2">
        <span className="h-[3px] flex-1 rounded-full bg-[#111111]" />
        <span className={`h-[3px] flex-1 rounded-full transition-colors ${step === 1 ? "bg-[#111111]" : "bg-[#E5E5E0]"}`} />
        <span className="ml-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#9CA3AF]">{step + 1} / 2</span>
      </div>

      {step === 0 ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-[15px] font-semibold text-[#111111]">Tes informations</h2>
            <p className="mt-1 text-[13px] leading-5 text-[#9CA3AF]">Pour te prévenir dès l'ouverture et t'envoyer ton accès.</p>
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
        <div className="space-y-8">
          <div>
            <h2 className="text-[15px] font-semibold text-[#111111]">Ton expérience</h2>
            <p className="mt-1 text-[13px] leading-5 text-[#9CA3AF]">Réponds librement, il n'y a pas de mauvaise réponse.</p>
          </div>
          {INTAKE_QUESTIONS.map((q) => (
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
                  rows={3}
                  maxLength={2000}
                  placeholder="Ta réponse..."
                  className="w-full resize-none border-0 border-b border-[#E5E5E0] bg-transparent px-0 py-2 text-[15px] leading-6 text-[#111111] placeholder:text-[#C4C4BE] focus:border-[#111111] focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p role="alert" className="mt-6 text-[13px] font-medium text-[#B91C1C]">{error}</p>}

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

  // ─── Étape 2 : colonne centrée, sans branding ni image. ───────────────────
  if (step === 1) {
    return (
      <main className="min-h-svh bg-white">
        <div className="mx-auto max-w-xl px-5 py-14 sm:px-8">{form}</div>
      </main>
    );
  }

  // ─── Étape 1 : split-screen avec branding à gauche. ───────────────────────
  return (
    <main className="min-h-svh bg-white lg:grid lg:grid-cols-2">
      <section className="relative flex flex-col justify-center overflow-hidden bg-[#FAFAF7] px-6 pt-14 sm:px-10 lg:px-16 lg:py-16">
        <div className="mx-auto w-full max-w-[440px] lg:mx-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image/logo-cc-dots.png" alt="Cosme Check" className="mb-9 h-[28px] w-auto" />
          <h1 className="text-[34px] font-bold leading-[1.04] tracking-tight text-[#111111] sm:text-[44px]">
            Deviens
            <br />
            bêta testeur.
          </h1>
          <p className="mt-5 max-w-[27rem] text-[16px] leading-relaxed text-[#6B7280]">
            Teste Cosme Check en avant-première et aide-nous à le rendre meilleur. En échange de tes
            réponses, tu reçois <strong className="font-semibold text-[#111111]">50 crédits offerts</strong> pour
            tester gratuitement.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/image/landing2/newhero.webp"
          alt="Aperçu de l'application Cosme Check"
          className="mx-auto mt-9 w-[190px] lg:mt-6 lg:w-[360px] lg:self-center"
        />
      </section>

      <section className="flex items-center justify-center bg-white px-5 py-14 sm:px-10">
        <div className="w-full max-w-md">{form}</div>
      </section>
    </main>
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
