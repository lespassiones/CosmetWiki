"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  BRAND_PRODUCT_TYPES,
  BRAND_ZONES,
  LIMITS,
  countInciIngredients,
  validateBrandSubmission,
} from "@/lib/brands/submission";

/**
 * Formulaire de l'espace marques : une fiche = un produit.
 * Peu de champs obligatoires (marque, e-mail, nom, code-barres, contenance,
 * zone, ingrédients). La marque et l'e-mail restent remplis pour le produit
 * suivant (navigateur uniquement).
 */

type FieldError = { field?: string; message: string } | null;

const BRAND_STORAGE_KEY = "cc:marques:contact";
const KEPT_FIELDS = ["brand", "contactEmail", "contactName"] as const;
const MAX_SIDE = 1600;

/** Réduit une photo (1600 px max, JPEG) : 4 à 8 Mo deviennent ~300 Ko. */
async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    return (await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86))) ?? file;
  } catch {
    return file;
  }
}

const inputCls =
  "w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-[#9CA3AF] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]";

export function BrandProductForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<FieldError>(null);
  const [sent, setSent] = useState<string[]>([]);
  const [inci, setInci] = useState("");
  const [noEan, setNoEan] = useState(false);
  const [productType, setProductType] = useState("");
  const [photos, setPhotos] = useState<{ front?: File; inci?: File }>({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(BRAND_STORAGE_KEY) ?? "{}") as Record<string, string>;
      for (const k of KEPT_FIELDS) {
        const el = formRef.current?.elements.namedItem(k) as HTMLInputElement | null;
        if (el && saved[k] && !el.value) el.value = saved[k];
      }
    } catch {
      /* stockage indisponible : rien de grave */
    }
  }, []);

  function focusField(field?: string) {
    if (!field) return;
    const el = formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  }

  function resetForNextProduct() {
    const form = formRef.current;
    if (!form) return;
    const keep = Object.fromEntries(
      KEPT_FIELDS.map((k) => [k, (form.elements.namedItem(k) as HTMLInputElement | null)?.value ?? ""]),
    );
    form.reset();
    for (const k of KEPT_FIELDS) {
      const el = form.elements.namedItem(k) as HTMLInputElement | null;
      if (el) el.value = keep[k];
    }
    setInci("");
    setNoEan(false);
    setProductType("");
    setPhotos({});
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);

    const check = validateBrandSubmission({
      ...Object.fromEntries(
        [
          "brand",
          "contactName",
          "contactEmail",
          "productName",
          "ean",
          "noEan",
          "volume",
          "productType",
          "productTypeOther",
          "inci",
          "properties",
          "madeIn",
          "productUrl",
          "certify",
        ].map((k) => [k, fd.get(k) ?? undefined]),
      ),
      zones: fd.getAll("zones"),
    });
    if (!check.ok) {
      setError({ field: check.field, message: check.error });
      focusField(check.field);
      return;
    }

    startTransition(async () => {
      try {
        fd.delete("photo_front");
        fd.delete("photo_inci");
        if (photos.front) fd.set("photo_front", await compressImage(photos.front), "face.jpg");
        if (photos.inci) fd.set("photo_inci", await compressImage(photos.inci), "ingredients.jpg");

        const r = await fetch("/api/marques", { method: "POST", body: fd });
        const j = (await r.json().catch(() => ({}))) as { error?: string; field?: string };
        if (!r.ok) {
          setError({ field: j.field, message: j.error ?? "L'envoi a échoué. Réessayez dans un instant." });
          focusField(j.field);
          return;
        }
        try {
          localStorage.setItem(
            BRAND_STORAGE_KEY,
            JSON.stringify(Object.fromEntries(KEPT_FIELDS.map((k) => [k, String(fd.get(k) ?? "")]))),
          );
        } catch {
          /* ignore */
        }
        setSent((p) => [...p, check.data.productName]);
        resetForNextProduct();
        document.getElementById("marques-formulaire")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {
        setError({ message: "Erreur réseau. Vérifiez votre connexion." });
      }
    });
  }

  const inciCount = countInciIngredients(inci);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_8px_24px_-12px_rgba(17,17,17,0.08)] ring-1 ring-black/[0.05] sm:p-10">
      {sent.length > 0 ? (
        <div className="mb-8 rounded-2xl bg-[#F0FDF4] p-5 ring-1 ring-[#BBF7D0]">
          <p className="text-[16px] font-semibold text-[#166534]">
            {sent.length === 1 ? "Produit envoyé, merci !" : `${sent.length} produits envoyés, merci !`}
          </p>
          <p className="mt-1 text-[14px] text-[#166534]">
            Nous le vérifions et vous écrivons dès qu&apos;il est référencé. Un autre produit ? Remplissez simplement la
            fiche ci-dessous.
          </p>
        </div>
      ) : null}

      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-9">
        <Block title="Votre marque">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marque" name="brand" required maxLength={LIMITS.brand} error={error} />
            <Field label="E-mail" name="contactEmail" type="email" required maxLength={LIMITS.contactEmail} placeholder="vous@marque.fr" autoComplete="email" error={error} />
            <Field label="Votre nom" name="contactName" maxLength={LIMITS.contactName} autoComplete="name" error={error} />
          </div>
        </Block>

        <Block title="Le produit">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nom du produit" name="productName" required maxLength={LIMITS.productName} error={error} />
            </div>
            <div>
              <Field label="Code-barres (EAN)" name="ean" required={!noEan} disabled={noEan} inputMode="numeric" maxLength={20} placeholder="3760..." error={error} />
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink-muted">
                <input type="checkbox" name="noEan" checked={noEan} onChange={(e) => setNoEan(e.target.checked)} className="h-4 w-4 accent-[#F43F5E]" />
                Sans code-barres
              </label>
            </div>
            <Field label="Contenance" name="volume" required maxLength={LIMITS.volume} placeholder="50 ml" error={error} />
            <label className="block">
              <Label text="Type de produit" />
              <select name="productType" value={productType} onChange={(e) => setProductType(e.target.value)} className={inputCls}>
                <option value="">Choisir</option>
                {BRAND_PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            {productType === "Autre" ? (
              <Field label="Lequel ?" name="productTypeOther" maxLength={LIMITS.productType} error={error} />
            ) : (
              <Field label="Fabriqué en" name="madeIn" maxLength={LIMITS.madeIn} placeholder="France" error={error} />
            )}
          </div>

          <fieldset className="mt-5">
            <legend>
              <Label text="Pour" required />
            </legend>
            <div className="flex flex-wrap gap-2">
              {BRAND_ZONES.map((z) => (
                <label key={z} className="cursor-pointer">
                  <input type="checkbox" name="zones" value={z} className="peer sr-only" />
                  <span className="inline-flex select-none items-center rounded-full border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13.5px] font-medium text-[#374151] transition hover:border-[#D1D5DB] peer-checked:border-[#F43F5E] peer-checked:bg-[#FFF1F2] peer-checked:text-[#BE123C] peer-focus-visible:ring-2 peer-focus-visible:ring-[#F43F5E]/40">
                    {z}
                  </span>
                </label>
              ))}
            </div>
            <ErrorText name="zones" error={error} />
          </fieldset>
        </Block>

        <Block title="Composition">
          <label className="block">
            <div className="flex items-baseline justify-between">
              <Label text="Liste des ingrédients (INCI)" required />
              <span className="text-[12px] tabular-nums text-ink-subtle">
                {inciCount} ingrédient{inciCount > 1 ? "s" : ""}
              </span>
            </div>
            <textarea
              name="inci"
              rows={5}
              maxLength={LIMITS.inci}
              value={inci}
              onChange={(e) => setInci(e.target.value)}
              placeholder="AQUA, GLYCERIN, ..."
              className={`${inputCls} resize-y font-mono text-[13px] leading-relaxed`}
            />
            <ErrorText name="inci" error={error} />
          </label>
          <label className="mt-4 block">
            <Label text="Ce que promet le produit" />
            <textarea
              name="properties"
              rows={3}
              maxLength={LIMITS.properties}
              placeholder="Hydrate 24 h, peaux sensibles, sans parfum..."
              className={`${inputCls} resize-y`}
            />
          </label>
          {productType === "Autre" ? (
            <div className="mt-4">
              <Field label="Fabriqué en" name="madeIn" maxLength={LIMITS.madeIn} placeholder="France" error={error} />
            </div>
          ) : null}
          <div className="mt-4">
            <Field label="Lien vers la page du produit" name="productUrl" maxLength={LIMITS.url} inputMode="url" placeholder="https://" error={error} />
          </div>
        </Block>

        <Block title="Photos" optional>
          <div className="grid grid-cols-2 gap-4">
            <PhotoInput label="Face" file={photos.front} onChange={(f) => setPhotos((p) => ({ ...p, front: f }))} />
            <PhotoInput label="Ingrédients" file={photos.inci} onChange={(f) => setPhotos((p) => ({ ...p, inci: f }))} />
          </div>
        </Block>

        <div className="space-y-4 border-t border-black/[0.06] pt-7">
          <label className="flex cursor-pointer items-start gap-3 text-[14px] text-ink-muted">
            <input type="checkbox" name="certify" className="mt-0.5 h-4 w-4 shrink-0 accent-[#F43F5E]" />
            <span>Je représente cette marque et ces informations sont exactes.</span>
          </label>
          <ErrorText name="certify" error={error} />

          {/* Pot de miel : invisible, rempli seulement par les robots. */}
          <input type="text" name="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" className="pointer-events-none absolute h-0 w-0 opacity-0" />

          {error && !error.field ? (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
              {error.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-[#F43F5E] py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(244,63,94,0.45)] transition hover:bg-[#E11D48] disabled:opacity-60"
          >
            {pending ? "Envoi…" : "Envoyer le produit"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Block({ title, optional, children }: { title: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-4 text-[17px] font-bold tracking-tight text-ink">
        {title}
        {optional ? <span className="ml-2 text-[13px] font-normal text-ink-subtle">facultatif</span> : null}
      </h3>
      {children}
    </section>
  );
}

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <span className="mb-1.5 block text-[13px] font-medium text-ink-muted">
      {text}
      {required ? <span className="text-[#F43F5E]"> *</span> : null}
    </span>
  );
}

function ErrorText({ name, error }: { name: string; error: FieldError }) {
  if (!error || error.field !== name) return null;
  return (
    <p role="alert" className="mt-1.5 text-[13px] font-medium text-rose-600">
      {error.message}
    </p>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  maxLength,
  disabled,
  inputMode,
  autoComplete,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  error: FieldError;
}) {
  const invalid = error?.field === name;
  return (
    <label className="block">
      <Label text={label} required={required} />
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        className={`${inputCls} disabled:bg-[#F9FAFB] disabled:text-ink-subtle ${invalid ? "border-rose-400" : ""}`}
      />
      <ErrorText name={name} error={error} />
    </label>
  );
}

function PhotoInput({ label, file, onChange }: { label: string; file?: File; onChange: (f: File | undefined) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div>
      <label className="group block cursor-pointer">
        <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-[#FAFAFA] transition group-hover:border-[#F43F5E]/50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-[13px] text-ink-muted">
              <PlusIcon className="h-5 w-5" />
              {label}
            </span>
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? undefined)}
        />
      </label>
      {file ? (
        <button type="button" onClick={() => onChange(undefined)} className="mt-1.5 text-[12px] text-ink-muted underline hover:text-ink">
          Retirer
        </button>
      ) : null}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
