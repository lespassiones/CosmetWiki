"use client";

import { useRef, useState } from "react";
import { GLASS_CARD } from "@/lib/ui/glass";

type Props = {
  ean: string | null;
  productLabel: string | null;
  imageUrl: string | null;
  brand: string | null;
  catalogCategory: string | null;
  onOpenScoreExpl: () => void;
};

type ActiveForm = null | "feedback" | "photo";

async function compressToWebP(file: File, maxWidth = 1000, quality = 0.4): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas unavailable")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/webp",
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
    img.src = url;
  });
}

export function ToolsSection({ ean, productLabel, imageUrl, brand, catalogCategory, onOpenScoreExpl }: Props) {
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);

  function toggle(form: Exclude<ActiveForm, null>) {
    setActiveForm((prev) => (prev === form ? null : form));
  }

  return (
    <div className={`${GLASS_CARD} px-5 py-4`}>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle mb-3">
        Outils
      </h2>

      <div className="divide-y divide-black/[0.06]">
        {/* Signaler une information incorrecte */}
        <ToolRow
          label="Signaler une information incorrecte"
          hint="Nom, marque ou composition"
          icon={<FlagIcon />}
          active={activeForm === "feedback"}
          onClick={() => toggle("feedback")}
        >
          {activeForm === "feedback" ? (
            <FeedbackForm
              ean={ean}
              productLabel={productLabel}
              onDone={() => setActiveForm(null)}
            />
          ) : null}
        </ToolRow>

        {/* Ajouter une photo — uniquement si le produit n'a pas d'image */}
        {!imageUrl ? (
          <ToolRow
            label="Ajouter une photo de ce produit"
            hint="Aide les autres à le reconnaître"
            icon={<CameraIcon />}
            active={activeForm === "photo"}
            onClick={() => toggle("photo")}
          >
            {activeForm === "photo" ? (
              <PhotoUploadForm
                ean={ean}
                brand={brand}
                name={productLabel}
                category={catalogCategory}
                onDone={() => setActiveForm(null)}
              />
            ) : null}
          </ToolRow>
        ) : null}

        {/* Comment cette note est calculée */}
        <ToolRow
          label="Comment cette note est calculée ?"
          hint={null}
          icon={<ChevronRightIcon />}
          active={false}
          onClick={onOpenScoreExpl}
        />
      </div>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function ToolRow({
  label,
  hint,
  icon,
  active,
  onClick,
  children,
}: {
  label: string;
  hint: string | null;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 py-3.5 text-left"
      >
        <div className="flex-1 min-w-0">
          <span className="block text-[13px] font-medium text-ink leading-snug">{label}</span>
          {hint ? <span className="block text-[11px] text-ink-subtle mt-0.5">{hint}</span> : null}
        </div>
        <span className={`shrink-0 text-ink-subtle transition-transform ${active ? "rotate-90" : ""}`}>
          {icon}
        </span>
      </button>
      {children}
    </div>
  );
}

// ─── Feedback Form ────────────────────────────────────────────────────────────

function FeedbackForm({
  ean,
  productLabel,
  onDone,
}: {
  ean: string | null;
  productLabel: string | null;
  onDone: () => void;
}) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit() {
    if (!text.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/tools/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_ean: ean,
          product_name: productLabel,
          message: text.trim(),
        }),
      });
      if (!res.ok) throw new Error("http");
      setStatus("sent");
      setTimeout(onDone, 2000);
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="text-[13px] text-emerald-600 pb-3">
        Merci, ton signalement a bien été transmis.
      </p>
    );
  }

  return (
    <div className="pb-3 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Décris l'erreur (ex. : composition incorrecte, mauvaise marque…)"
        rows={3}
        maxLength={2000}
        className="w-full rounded-xl border border-black/[0.10] bg-white/80 px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle/60 resize-none focus:outline-none focus:ring-1 focus:ring-sky-400"
        disabled={status === "sending"}
      />
      {status === "error" ? (
        <p className="text-[12px] text-rose-600">Une erreur s'est produite, réessaie.</p>
      ) : null}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg px-3 py-1.5 text-[12px] text-ink-subtle hover:bg-black/[0.05] transition"
          disabled={status === "sending"}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || status === "sending"}
          className="rounded-lg bg-ink px-3 py-1.5 text-[12px] text-white disabled:opacity-40 hover:bg-ink/90 transition"
        >
          {status === "sending" ? "Envoi…" : "Envoyer"}
        </button>
      </div>
    </div>
  );
}

// ─── Photo Upload Form ─────────────────────────────────────────────────────────

function PhotoUploadForm({
  ean,
  brand,
  name,
  category,
  onDone,
}: {
  ean: string | null;
  brand: string | null;
  name: string | null;
  category: string | null;
  onDone: () => void;
}) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, slot: 0 | 1) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotos((prev) => {
      const next = [...prev];
      next[slot] = file;
      return next;
    });
  }

  async function submit() {
    if (photos.length === 0 || !photos[0]) return;
    setStatus("uploading");
    try {
      const fd = new FormData();
      if (ean) fd.append("ean", ean);
      if (brand) fd.append("brand", brand);
      if (name) fd.append("name", name);
      if (category) fd.append("category", category);

      const compressed1 = await compressToWebP(photos[0]);
      fd.append("photo1", new File([compressed1], "photo1.webp", { type: "image/webp" }));

      if (photos[1]) {
        const compressed2 = await compressToWebP(photos[1]);
        fd.append("photo2", new File([compressed2], "photo2.webp", { type: "image/webp" }));
      }

      const res = await fetch("/api/tools/photo-submission", { method: "POST", body: fd });
      if (!res.ok) throw new Error("http");
      setStatus("done");
      setTimeout(onDone, 2500);
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="text-[13px] text-emerald-600 pb-3">
        Merci, ta photo sera vérifiée avant publication.
      </p>
    );
  }

  const photo1 = photos[0];
  const photo2 = photos[1];
  const canSubmit = !!photo1 && status !== "uploading";

  return (
    <div className="pb-3 space-y-3">
      {/* Photo 1 */}
      <div className="space-y-1">
        <span className="block text-[11px] text-ink-subtle">Photo 1 (obligatoire)</span>
        <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-dashed border-black/[0.12] bg-white/60 px-3 py-2.5 hover:bg-white/80 transition">
          <CameraIcon />
          <span className="text-[12px] text-ink-muted truncate">
            {photo1 ? photo1.name : "Choisir une photo"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => handleFile(e, 0)}
            disabled={status === "uploading"}
          />
        </label>
      </div>

      {/* Photo 2 (optionnelle, n'apparaît qu'une fois la 1re sélectionnée) */}
      {photo1 ? (
        <div className="space-y-1">
          <span className="block text-[11px] text-ink-subtle">Photo 2 (optionnelle)</span>
          <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-dashed border-black/[0.10] bg-white/50 px-3 py-2.5 hover:bg-white/70 transition">
            <CameraIcon />
            <span className="text-[12px] text-ink-muted truncate">
              {photo2 ? photo2.name : "Ajouter une deuxième photo"}
            </span>
            <input
              ref={input2Ref}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => handleFile(e, 1)}
              disabled={status === "uploading"}
            />
          </label>
        </div>
      ) : null}

      {status === "error" ? (
        <p className="text-[12px] text-rose-600">Une erreur s'est produite, réessaie.</p>
      ) : null}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg px-3 py-1.5 text-[12px] text-ink-subtle hover:bg-black/[0.05] transition"
          disabled={status === "uploading"}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="rounded-lg bg-ink px-3 py-1.5 text-[12px] text-white disabled:opacity-40 hover:bg-ink/90 transition"
        >
          {status === "uploading" ? "Envoi…" : "Envoyer"}
        </button>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
