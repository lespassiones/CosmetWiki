"use client";

import { useState, useTransition } from "react";
import { submitBetaFeedback } from "@/app/beta/actions";

export function BetaFeedbackForm({ token }: { token: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [recommend, setRecommend] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-6 text-center">
        <p className="text-[15px] font-semibold text-emerald-800">Merci pour ton retour ! 💛</p>
        <p className="mt-1 text-[13px] text-emerald-700">Ça nous aide énormément à améliorer Cosme Check.</p>
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const r = await submitBetaFeedback(fd);
          if (!r.ok) {
            setError(r.error);
            return;
          }
          setDone(true);
        });
      }}
      className="space-y-6"
    >
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="rating_overall" value={rating ?? ""} />
      <input type="hidden" name="recommend" value={recommend ?? ""} />

      {/* Note globale /5 */}
      <div>
        <span className="mb-2 block text-xs font-medium text-[#6B7280]">Ta note globale</span>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-pressed={rating === n}
              className="flex h-11 flex-1 items-center justify-center rounded-xl border-[1.5px] text-[15px] font-semibold transition"
              style={
                rating != null && n <= rating
                  ? { backgroundColor: "#111111", borderColor: "#111111", color: "#fff" }
                  : { backgroundColor: "#fff", borderColor: "#E5E5E0", color: "#111111" }
              }
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <Textarea name="liked" label="Ce qui t'a plu" placeholder="Ce que tu as aimé, ce qui marche bien…" />
      <Textarea name="bugs" label="Bugs / soucis rencontrés" placeholder="Un bug, un truc bizarre, un plantage…" />
      <Textarea name="missing" label="Ce qui manque / à améliorer" placeholder="Une fonction qui te manque, une idée…" />

      {/* Recommandation /10 */}
      <div>
        <span className="mb-2 block text-xs font-medium text-[#6B7280]">
          Recommanderais-tu Cosme Check ? (0 = jamais, 10 = à fond)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRecommend(n)}
              aria-pressed={recommend === n}
              className="h-9 w-9 rounded-lg border-[1.5px] text-[13px] font-semibold transition"
              style={
                recommend === n
                  ? { backgroundColor: "#111111", borderColor: "#111111", color: "#fff" }
                  : { backgroundColor: "#fff", borderColor: "#E5E5E0", color: "#111111" }
              }
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-[#E11D48]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[#111111] py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Envoyer mon retour"}
      </button>
    </form>
  );
}

function Textarea({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#6B7280]">{label}</span>
      <textarea
        name={name}
        rows={3}
        maxLength={2000}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border-[1.5px] border-[#E5E5E0] bg-white px-4 py-3 text-[15px] text-[#111111] placeholder:text-[#9CA3AF] focus:border-[#111111] focus:outline-none"
      />
    </label>
  );
}
