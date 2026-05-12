"use client";

import { useState, useTransition } from "react";
import { saveSkinProfile } from "@/app/advisor/actions";
import {
  SKIN_CONCERN_LABEL,
  SKIN_CONCERNS,
  SKIN_TYPE_LABEL,
  SKIN_TYPES,
  type SkinConcern,
  type SkinProfile,
  type SkinType,
} from "@/lib/skin/profile";

export function AdvisorOnboarding({ initial }: { initial?: SkinProfile }) {
  const [skinType, setSkinType] = useState<SkinType | "">(initial?.skinType ?? "");
  const [concerns, setConcerns] = useState<Set<SkinConcern>>(new Set(initial?.concerns ?? []));
  const [allergies, setAllergies] = useState(initial?.allergiesFreeform ?? "");
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
    if (allergies.trim()) fd.set("allergies", allergies.trim());
    startTransition(async () => {
      const r = await saveSkinProfile(fd);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div className="space-y-7">
      {/* Question 1 — skin type */}
      <fieldset>
        <legend className="text-[14px] font-semibold text-[#111111] mb-3">
          1. Quel est ton type de peau ?
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SKIN_TYPES.map((t) => {
            const active = skinType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSkinType(t)}
                aria-pressed={active}
                className={`rounded-xl border px-4 py-3 text-sm font-medium text-left transition ${
                  active
                    ? "bg-[#111111] text-white border-[#111111]"
                    : "bg-white text-[#111111] border-[#E5E7EB] hover:border-[#111111]"
                }`}
              >
                {SKIN_TYPE_LABEL[t]}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Question 2 — concerns */}
      <fieldset>
        <legend className="text-[14px] font-semibold text-[#111111] mb-1">
          2. Sur quoi veux-tu te concentrer ?
        </legend>
        <p className="text-[12px] text-[#6B7280] mb-3">Plusieurs choix possibles.</p>
        <div className="flex flex-wrap gap-2">
          {SKIN_CONCERNS.map((c) => {
            const active = concerns.has(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleConcern(c)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${
                  active
                    ? "bg-[#F43F5E] text-white border-[#F43F5E]"
                    : "bg-white text-[#111111] border-[#E5E7EB] hover:border-[#111111]"
                }`}
              >
                {SKIN_CONCERN_LABEL[c]}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Question 3 — allergies (optional, free text) */}
      <fieldset>
        <legend className="text-[14px] font-semibold text-[#111111] mb-1">
          3. Allergies ou intolérances connues ? <span className="text-[#9CA3AF] font-normal">(facultatif)</span>
        </legend>
        <textarea
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Ex : alcool, parfum, certains conservateurs…"
          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none focus:border-[#111111]"
        />
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-[#E11D48] bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full rounded-xl bg-[#111111] text-white text-sm font-semibold py-3 hover:brightness-110 transition disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : "Enregistrer mon profil"}
      </button>
    </div>
  );
}
