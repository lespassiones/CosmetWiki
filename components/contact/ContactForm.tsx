"use client";

import { useState, useTransition } from "react";

type Status = "idle" | "sent" | "error";

const SUBJECTS = ["Question", "Bug", "Suggestion", "Partenariat"] as const;

export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [message, setMessage] = useState("");

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_8px_24px_-12px_rgba(17,17,17,0.08)] ring-1 ring-black/[0.05] sm:p-8">
      <h2 className="text-[20px] font-bold tracking-tight text-ink">
        Nous envoyer un message
      </h2>
      <p className="mt-1 text-[13px] text-ink-subtle">
        Tous les champs sont obligatoires.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          const payload = {
            firstName: String(fd.get("first_name") ?? ""),
            email: String(fd.get("email") ?? ""),
            subject: String(fd.get("subject") ?? ""),
            message: String(fd.get("message") ?? ""),
            // Honey-pot - bots fill this hidden field, real users never do.
            hp: String(fd.get("hp") ?? ""),
          };
          startTransition(async () => {
            try {
              const r = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              if (!r.ok) {
                const j = (await r.json().catch(() => ({}))) as { error?: string };
                setErrorMessage(j.error ?? "Échec de l'envoi. Réessaye dans un instant.");
                setStatus("error");
                return;
              }
              setStatus("sent");
              form.reset();
              setMessage("");
            } catch {
              setErrorMessage("Erreur réseau. Vérifie ta connexion.");
              setStatus("error");
            }
          });
        }}
        className="mt-5 space-y-4"
      >
        <Field label="Prénom" name="first_name" placeholder="Ton prénom" required />
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="ton@email.com"
          required
        />

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-ink-muted">
            Sujet
          </span>
          <select
            name="subject"
            required
            defaultValue=""
            className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
          >
            <option value="" disabled>
              Choisissez un sujet
            </option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-ink-muted">
            Message
          </span>
          <textarea
            name="message"
            required
            rows={5}
            maxLength={1000}
            placeholder="Décris ton message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full resize-y rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
          />
          <p className="mt-1 text-right text-[11px] text-ink-subtle">
            {message.length} / 1000
          </p>
        </label>

        {/* Honey-pot: visually hidden but submitted with the form. */}
        <input
          type="text"
          name="hp"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute h-0 w-0 opacity-0 pointer-events-none"
        />

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-gradient-to-br from-[#F43F5E] to-[#E11D48] py-3 text-[14px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(244,63,94,0.45),inset_0_1px_0_rgba(255,255,255,0.30)] transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Envoi…" : "Envoyer le message"}
        </button>

        {status === "sent" ? (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
            <CheckIcon className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700">
              Message envoyé ✓
            </p>
          </div>
        ) : null}

        {status === "error" ? (
          <div role="alert" className="mt-3 rounded-xl bg-rose-50 px-4 py-3 ring-1 ring-rose-100">
            <p className="text-sm font-medium text-rose-700">{errorMessage}</p>
          </div>
        ) : null}
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-ink-muted">
        {label}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-subtle focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
      />
    </label>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
