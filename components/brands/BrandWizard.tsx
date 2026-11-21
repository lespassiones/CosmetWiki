"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BRAND_PRODUCT_TYPES,
  BRAND_ZONES,
  LIMITS,
  MAX_PRODUCTS_PER_BATCH,
  MAX_PRODUCTS_PER_REQUEST,
  countInciIngredients,
  normalizeEan,
  validateBrandContact,
  validateBrandSubmission,
} from "@/lib/brands/submission";

/**
 * Espace marques en 3 étapes :
 *   1. Votre marque  (une seule fois)
 *   2. Vos produits  (tableau : ajouter, dupliquer, modifier, supprimer)
 *   3. Envoyé
 * « Ajouter » reprend le type, la fabrication et les zones du dernier produit ;
 * « Dupliquer » copie tout (photos comprises) sauf le code-barres. Une photo
 * partagée n'est envoyée qu'une fois. Brouillon gardé dans le navigateur
 * (sans les photos) pour ne rien perdre en cas de rechargement.
 */

type Photo = { key: string; file: File; url: string };
type Contact = { brand: string; contactEmail: string; contactName: string };
type Product = {
  id: string;
  productName: string;
  ean: string;
  noEan: boolean;
  volume: string;
  productType: string;
  productTypeOther: string;
  madeIn: string;
  zones: string[];
  inci: string;
  properties: string;
  productUrl: string;
  photoFront?: Photo;
  photoInci?: Photo;
};
type Err = { field?: string; message: string } | null;
type Step = "brand" | "products" | "done";

const DRAFT_KEY = "cc:marques:brouillon:v1";
const CHUNK_BYTES = 3_500_000;
const MAX_SIDE = 1600;

const rid = () => Math.random().toString(36).slice(2, 10);

const emptyProduct = (): Product => ({
  id: rid(),
  productName: "",
  ean: "",
  noEan: false,
  volume: "",
  productType: "",
  productTypeOther: "",
  madeIn: "",
  zones: [],
  inci: "",
  properties: "",
  productUrl: "",
});

async function toPhoto(file: File): Promise<Photo> {
  const key = rid();
  let out: File = file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
      if (blob) out = new File([blob], `${key}.jpg`, { type: "image/jpeg" });
    }
    bitmap.close?.();
  } catch {
    /* photo envoyée telle quelle */
  }
  return { key, file: out, url: URL.createObjectURL(out) };
}

function validateProduct(p: Product, c: Contact) {
  return validateBrandSubmission({
    ...c,
    ...p,
    noEan: p.noEan ? "on" : undefined,
    certify: "on",
  });
}

const inputCls =
  "w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-[#9CA3AF] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] disabled:bg-[#F9FAFB]";

export function BrandWizard() {
  const [step, setStep] = useState<Step>("brand");
  const [contact, setContact] = useState<Contact>({ brand: "", contactEmail: "", contactName: "" });
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<{ product: Product; isNew: boolean; note?: string } | null>(null);
  const [error, setError] = useState<Err>(null);
  const [certify, setCertify] = useState(false);
  const [sending, setSending] = useState<{ done: number; total: number } | null>(null);
  const [sentNames, setSentNames] = useState<string[]>([]);
  const batch = useRef<{ id: string; sentIds: Set<string>; sentKeys: Set<string> } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  // Brouillon : restauration puis sauvegarde (sans les photos).
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as { contact?: Contact; products?: Product[] } | null;
      if (d?.contact) setContact(d.contact);
      if (d?.products?.length) {
        setProducts(d.products.map((p) => ({ ...p, photoFront: undefined, photoInci: undefined })));
        if (d.contact && validateBrandContact(d.contact).ok) setStep("products");
      }
    } catch {
      /* ignore */
    }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      const plain = products.map(({ photoFront: _f, photoInci: _i, ...rest }) => rest);
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ contact, products: plain }));
    } catch {
      /* ignore */
    }
  }, [contact, products]);

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goProducts() {
    const r = validateBrandContact(contact);
    if (!r.ok) return setError({ field: r.field, message: r.error });
    setError(null);
    setStep("products");
    scrollTop();
    if (products.length === 0) openNew();
  }

  function openNew() {
    const last = products[products.length - 1];
    const p = emptyProduct();
    if (last) {
      Object.assign(p, {
        productType: last.productType,
        productTypeOther: last.productTypeOther,
        madeIn: last.madeIn,
        zones: [...last.zones],
      });
    }
    setError(null);
    setEditing({
      product: p,
      isNew: true,
      note: last ? "Type, fabrication et zones repris du produit précédent." : undefined,
    });
  }

  function duplicate(p: Product) {
    setError(null);
    setEditing({
      product: { ...p, id: rid(), ean: "", noEan: false },
      isNew: true,
      note: `Copie de « ${p.productName} » (photos comprises). Changez le nom, le code-barres et ce qui diffère.`,
    });
  }

  function saveProduct(p: Product) {
    const r = validateProduct(p, contact);
    if (!r.ok) return setError({ field: r.field, message: r.error });
    const ean = p.noEan ? "" : normalizeEan(p.ean);
    if (ean && products.some((o) => o.id !== p.id && !o.noEan && normalizeEan(o.ean) === ean)) {
      return setError({ field: "ean", message: "Ce code-barres est déjà dans votre liste." });
    }
    setProducts((list) => {
      const i = list.findIndex((o) => o.id === p.id);
      if (i === -1) return [...list, p];
      const next = [...list];
      next[i] = p;
      return next;
    });
    setEditing(null);
    setError(null);
  }

  async function sendAll() {
    if (!certify) return setError({ field: "certify", message: "Cochez la case pour confirmer." });
    if (products.length === 0) return;
    for (const p of products) {
      const r = validateProduct(p, contact);
      if (!r.ok) {
        setEditing({ product: p, isNew: false });
        return setError({ field: r.field, message: r.error });
      }
    }
    setError(null);
    batch.current ??= { id: crypto.randomUUID(), sentIds: new Set(), sentKeys: new Set() };
    const b = batch.current;
    const pending = products.filter((p) => !b.sentIds.has(p.id));

    // Paquets : 10 produits et ~3,5 Mo de nouvelles photos au plus.
    const chunks: { items: Product[]; files: Photo[] }[] = [];
    let cur: { items: Product[]; files: Photo[]; bytes: number } = { items: [], files: [], bytes: 0 };
    const planned = new Set(b.sentKeys);
    for (const p of pending) {
      const fresh = [p.photoFront, p.photoInci].filter((x): x is Photo => !!x && !planned.has(x.key));
      const uniq = fresh.filter((x, i) => fresh.findIndex((y) => y.key === x.key) === i);
      const bytes = uniq.reduce((s, x) => s + x.file.size, 0);
      if (cur.items.length && (cur.items.length >= MAX_PRODUCTS_PER_REQUEST || cur.bytes + bytes > CHUNK_BYTES)) {
        chunks.push(cur);
        cur = { items: [], files: [], bytes: 0 };
      }
      cur.items.push(p);
      cur.files.push(...uniq);
      cur.bytes += bytes;
      uniq.forEach((x) => planned.add(x.key));
    }
    chunks.push(cur);

    setSending({ done: products.length - pending.length, total: products.length });
    for (const [ci, chunk] of chunks.entries()) {
      const fd = new FormData();
      fd.set("brand", contact.brand);
      fd.set("contactEmail", contact.contactEmail);
      fd.set("contactName", contact.contactName);
      fd.set("certify", "on");
      fd.set("batchId", b.id);
      if (ci === chunks.length - 1) fd.set("final", "1");
      fd.set(
        "products",
        JSON.stringify(
          chunk.items.map(({ photoFront, photoInci, id: _id, noEan, ...rest }) => ({
            ...rest,
            noEan: noEan ? "on" : "",
            photoFront: photoFront?.key,
            photoInci: photoInci?.key,
          })),
        ),
      );
      for (const f of chunk.files) fd.set(`file_${f.key}`, f.file, f.file.name);
      let res: Response;
      try {
        res = await fetch("/api/marques", { method: "POST", body: fd });
      } catch {
        setSending(null);
        return setError({ message: "Erreur réseau. Vérifiez votre connexion puis réessayez : rien ne sera envoyé deux fois." });
      }
      const j = (await res.json().catch(() => ({}))) as { error?: string; field?: string; index?: number };
      if (!res.ok) {
        setSending(null);
        const bad = typeof j.index === "number" ? chunk.items[j.index] : undefined;
        if (bad) setEditing({ product: bad, isNew: false });
        return setError({ field: j.field, message: j.error ?? "L'envoi a échoué. Réessayez dans un instant." });
      }
      chunk.items.forEach((p) => b.sentIds.add(p.id));
      chunk.files.forEach((f) => b.sentKeys.add(f.key));
      setSending((s) => (s ? { ...s, done: s.done + chunk.items.length } : s));
    }

    setSentNames(products.map((p) => p.productName));
    setProducts([]);
    setCertify(false);
    setSending(null);
    batch.current = null;
    setStep("done");
    scrollTop();
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      <Stepper step={step} />

      {step === "brand" ? (
        <Card>
          <h3 className="text-[19px] font-bold text-ink">Votre marque</h3>
          <p className="mt-1 text-[14px] text-ink-muted">À remplir une seule fois, pour tous vos produits.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <TextField label="Marque" required value={contact.brand} maxLength={LIMITS.brand} name="brand" error={error}
              onChange={(v) => setContact({ ...contact, brand: v })} />
            <TextField label="E-mail" required type="email" value={contact.contactEmail} maxLength={LIMITS.contactEmail}
              name="contactEmail" placeholder="vous@marque.fr" error={error} onChange={(v) => setContact({ ...contact, contactEmail: v })} />
            <TextField label="Votre nom" value={contact.contactName} maxLength={LIMITS.contactName} name="contactName" error={error}
              onChange={(v) => setContact({ ...contact, contactName: v })} />
          </div>
          <PrimaryButton className="mt-8" onClick={goProducts}>
            Continuer
          </PrimaryButton>
        </Card>
      ) : null}

      {step === "products" ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FAFAFA] px-4 py-3 ring-1 ring-black/[0.04]">
            <p className="text-[14px] text-ink-muted">
              <span className="font-semibold text-ink">{contact.brand}</span> · {contact.contactEmail}
            </p>
            <button type="button" onClick={() => setStep("brand")} className="text-[13px] font-medium text-[#E11D48] underline">
              Modifier
            </button>
          </div>

          <div className="mt-6 flex items-baseline justify-between">
            <h3 className="text-[19px] font-bold text-ink">Vos produits</h3>
            <span className="text-[13px] text-ink-subtle">{products.length} / {MAX_PRODUCTS_PER_BATCH}</span>
          </div>

          {products.length > 0 ? (
            <ul className="mt-4 divide-y divide-black/[0.06] overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
              {products.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 bg-white px-4 py-3 sm:flex-nowrap">
                  <Thumb photo={p.photoFront} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-ink">{p.productName}</p>
                    <p className="truncate text-[13px] text-ink-subtle">
                      {[p.noEan ? "Sans code-barres" : p.ean, p.volume, p.productType === "Autre" ? p.productTypeOther : p.productType]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex w-full gap-1 sm:w-auto">
                    <RowButton onClick={() => setEditing({ product: p, isNew: false })}>Modifier</RowButton>
                    <RowButton onClick={() => duplicate(p)} disabled={products.length >= MAX_PRODUCTS_PER_BATCH}>
                      Dupliquer
                    </RowButton>
                    <RowButton danger onClick={() => setProducts((l) => l.filter((o) => o.id !== p.id))}>
                      Supprimer
                    </RowButton>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {products.length < MAX_PRODUCTS_PER_BATCH ? (
            <button
              type="button"
              onClick={openNew}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#F43F5E]/40 bg-[#FFF8F9] py-5 text-[15px] font-semibold text-[#E11D48] transition hover:border-[#F43F5E] hover:bg-[#FFF1F2]"
            >
              <PlusIcon className="h-5 w-5" />
              {products.length ? "Ajouter un autre produit" : "Ajouter un produit"}
            </button>
          ) : null}

          {products.length > 0 ? (
            <div className="mt-8 space-y-4 border-t border-black/[0.06] pt-6">
              <label className="flex cursor-pointer items-start gap-3 text-[14px] text-ink-muted">
                <input type="checkbox" checked={certify} onChange={(e) => setCertify(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#F43F5E]" />
                <span>Je représente cette marque et ces informations sont exactes.</span>
              </label>
              {error && !editing ? <ErrorBox message={error.message} /> : null}
              <PrimaryButton onClick={sendAll} disabled={!!sending}>
                {sending
                  ? `Envoi… ${sending.done}/${sending.total}`
                  : products.length > 1
                    ? `Envoyer mes ${products.length} produits`
                    : "Envoyer mon produit"}
              </PrimaryButton>
            </div>
          ) : null}
        </Card>
      ) : null}

      {step === "done" ? (
        <Card>
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
            <CheckIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-[20px] font-bold text-ink">
            {sentNames.length > 1 ? `${sentNames.length} produits envoyés, merci !` : "Produit envoyé, merci !"}
          </h3>
          <p className="mt-2 text-[15px] text-ink-muted">
            Vous avez reçu une confirmation par e-mail. Nous vérifions chaque produit et vous écrivons dès qu&apos;il est
            référencé, avec sa note et votre badge.
          </p>
          <ul className="mt-4 list-disc pl-5 text-[14px] text-ink-muted">
            {sentNames.map((n, i) => (
              <li key={`${n}-${i}`}>{n}</li>
            ))}
          </ul>
          <PrimaryButton
            className="mt-6"
            onClick={() => {
              setStep("products");
              openNew();
            }}
          >
            Envoyer d&apos;autres produits
          </PrimaryButton>
        </Card>
      ) : null}

      {editing ? (
        <ProductEditor
          key={editing.product.id}
          initial={editing.product}
          note={editing.note}
          isNew={editing.isNew}
          error={error}
          onCancel={() => {
            setEditing(null);
            setError(null);
          }}
          onSave={saveProduct}
        />
      ) : null}
    </div>
  );
}

// ─── Fenêtre d'un produit ───────────────────────────────────────────────────

function ProductEditor({
  initial,
  note,
  isNew,
  error,
  onCancel,
  onSave,
}: {
  initial: Product;
  note?: string;
  isNew: boolean;
  error: Err;
  onCancel: () => void;
  onSave: (p: Product) => void;
}) {
  const [p, setP] = useState<Product>(initial);
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((o) => ({ ...o, [k]: v }));
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  useEffect(() => {
    if (!error?.field) return;
    const el = panelRef.current?.querySelector<HTMLElement>(`[data-field="${error.field}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  const inciCount = countInciIngredients(p.inci);

  // Portail sur <body> : la page est un contexte d'empilement isolé (classe
  // `isolate`), sans portail le pied de page passerait par-dessus la fenêtre.
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={panelRef} role="dialog" aria-modal="true" className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <h3 className="text-[18px] font-bold text-ink">{isNew ? "Nouveau produit" : "Modifier le produit"}</h3>
          <button type="button" onClick={onCancel} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-full text-ink-muted hover:bg-black/[0.05]">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {note ? <p className="rounded-xl bg-[#F0F9FF] px-4 py-2.5 text-[13.5px] text-[#075985]">{note}</p> : null}

          <TextField label="Nom du produit" required name="productName" value={p.productName} maxLength={LIMITS.productName}
            error={error} onChange={(v) => set("productName", v)} autoFocus={isNew && !initial.productName} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <TextField label="Code-barres (EAN)" required={!p.noEan} name="ean" value={p.ean} disabled={p.noEan}
                inputMode="numeric" maxLength={20} placeholder="3760..." error={error} onChange={(v) => set("ean", v)}
                autoFocus={isNew && !!initial.productName} />
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink-muted">
                <input type="checkbox" checked={p.noEan} onChange={(e) => set("noEan", e.target.checked)} className="h-4 w-4 accent-[#F43F5E]" />
                Sans code-barres
              </label>
            </div>
            <TextField label="Contenance" required name="volume" value={p.volume} maxLength={LIMITS.volume} placeholder="50 ml"
              error={error} onChange={(v) => set("volume", v)} />
            <label className="block" data-field="productType">
              <Label text="Type de produit" />
              <select value={p.productType} onChange={(e) => set("productType", e.target.value)} className={inputCls}>
                <option value="">Choisir</option>
                {BRAND_PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            {p.productType === "Autre" ? (
              <TextField label="Lequel ?" name="productTypeOther" value={p.productTypeOther} maxLength={LIMITS.productType}
                error={error} onChange={(v) => set("productTypeOther", v)} />
            ) : (
              <TextField label="Fabriqué en" name="madeIn" value={p.madeIn} maxLength={LIMITS.madeIn} placeholder="France"
                error={error} onChange={(v) => set("madeIn", v)} />
            )}
            {p.productType === "Autre" ? (
              <TextField label="Fabriqué en" name="madeIn" value={p.madeIn} maxLength={LIMITS.madeIn} placeholder="France"
                error={error} onChange={(v) => set("madeIn", v)} />
            ) : null}
          </div>

          <fieldset data-field="zones">
            <legend>
              <Label text="Pour" required />
            </legend>
            <div className="flex flex-wrap gap-2">
              {BRAND_ZONES.map((z) => {
                const on = p.zones.includes(z);
                return (
                  <button
                    key={z}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("zones", on ? p.zones.filter((x) => x !== z) : [...p.zones, z])}
                    className={`rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition ${
                      on ? "border-[#F43F5E] bg-[#FFF1F2] text-[#BE123C]" : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D1D5DB]"
                    }`}
                  >
                    {z}
                  </button>
                );
              })}
            </div>
            <ErrorText name="zones" error={error} />
          </fieldset>

          <label className="block" data-field="inci">
            <div className="flex items-baseline justify-between">
              <Label text="Liste des ingrédients (INCI)" required />
              <span className="text-[12px] tabular-nums text-ink-subtle">
                {inciCount} ingrédient{inciCount > 1 ? "s" : ""}
              </span>
            </div>
            <textarea value={p.inci} onChange={(e) => set("inci", e.target.value)} rows={5} maxLength={LIMITS.inci}
              placeholder="AQUA, GLYCERIN, ..." className={`${inputCls} resize-y font-mono text-[13px] leading-relaxed`} />
            <ErrorText name="inci" error={error} />
          </label>

          <label className="block" data-field="properties">
            <Label text="Ce que promet le produit" />
            <textarea value={p.properties} onChange={(e) => set("properties", e.target.value)} rows={3} maxLength={LIMITS.properties}
              placeholder="Hydrate 24 h, peaux sensibles, sans parfum..." className={`${inputCls} resize-y`} />
          </label>

          <TextField label="Lien vers la page du produit" name="productUrl" value={p.productUrl} maxLength={LIMITS.url}
            inputMode="url" placeholder="https://" error={error} onChange={(v) => set("productUrl", v)} />

          <div>
            <Label text="Photos (facultatives)" />
            <div className="grid grid-cols-2 gap-4">
              <PhotoInput label="Face" photo={p.photoFront} onChange={(ph) => set("photoFront", ph)} />
              <PhotoInput label="Ingrédients" photo={p.photoInci} onChange={(ph) => set("photoInci", ph)} />
            </div>
          </div>

          {error && !error.field ? <ErrorBox message={error.message} /> : null}
        </div>

        <div className="flex gap-3 border-t border-black/[0.06] px-6 py-4">
          <button type="button" onClick={onCancel} className="flex-1 rounded-full py-3 text-[15px] font-semibold text-ink ring-1 ring-black/[0.1] hover:bg-black/[0.03]">
            Annuler
          </button>
          <button type="button" onClick={() => onSave(p)} className="flex-[2] rounded-full bg-[#F43F5E] py-3 text-[15px] font-semibold text-white transition hover:bg-[#E11D48]">
            Enregistrer le produit
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Petits composants ──────────────────────────────────────────────────────

const STEPS: { key: Step; label: string }[] = [
  { key: "brand", label: "Votre marque" },
  { key: "products", label: "Vos produits" },
  { key: "done", label: "Envoyé" },
];

function Stepper({ step }: { step: Step }) {
  const at = STEPS.findIndex((s) => s.key === step);
  return (
    <ol className="mb-6 flex items-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex flex-1 items-center gap-2 sm:gap-3">
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[14px] font-bold ${
              i < at ? "bg-[#16A34A] text-white" : i === at ? "bg-[#F43F5E] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"
            }`}
          >
            {i < at ? <CheckIcon className="h-4 w-4" /> : i + 1}
          </span>
          <span className={`text-[13.5px] font-semibold sm:text-[14px] ${i === at ? "text-ink" : "text-ink-subtle"}`}>{s.label}</span>
          {i < STEPS.length - 1 ? <span className="hidden h-px flex-1 bg-[#E5E7EB] sm:block" /> : null}
        </li>
      ))}
    </ol>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_8px_24px_-12px_rgba(17,17,17,0.08)] ring-1 ring-black/[0.05] sm:p-9">
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, className = "" }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-full bg-[#F43F5E] py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(244,63,94,0.45)] transition hover:bg-[#E11D48] disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

function RowButton({ children, onClick, danger, disabled }: { children: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-full px-3 py-1.5 text-[13px] font-medium transition disabled:opacity-40 sm:flex-none ${
        danger ? "text-rose-600 hover:bg-rose-50" : "text-ink ring-1 ring-black/[0.08] hover:bg-black/[0.03]"
      }`}
    >
      {children}
    </button>
  );
}

function Thumb({ photo }: { photo?: Photo }) {
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo.url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-black/[0.06]" />
  ) : (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#F3F4F6] text-[#9CA3AF]">
      <BottleIcon className="h-5 w-5" />
    </span>
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

function ErrorText({ name, error }: { name: string; error: Err }) {
  if (!error || error.field !== name) return null;
  return (
    <p role="alert" className="mt-1.5 text-[13px] font-medium text-rose-600">
      {error.message}
    </p>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
      {message}
    </p>
  );
}

function TextField({
  label,
  name,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  maxLength,
  disabled,
  inputMode,
  autoFocus,
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoFocus?: boolean;
  error: Err;
}) {
  const invalid = error?.field === name;
  return (
    <label className="block" data-field={name}>
      <Label text={label} required={required} />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        inputMode={inputMode}
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        className={`${inputCls} ${invalid ? "border-rose-400" : ""}`}
      />
      <ErrorText name={name} error={error} />
    </label>
  );
}

function PhotoInput({ label, photo, onChange }: { label: string; photo?: Photo; onChange: (p: Photo | undefined) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <label className="group block cursor-pointer">
        <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-[#FAFAFA] transition group-hover:border-[#F43F5E]/50">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.url} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-[13px] text-ink-muted">
              <PlusIcon className="h-5 w-5" />
              {busy ? "…" : label}
            </span>
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            onChange(await toPhoto(f));
            setBusy(false);
          }}
        />
      </label>
      {photo ? (
        <button type="button" onClick={() => onChange(undefined)} className="mt-1.5 text-[12px] text-ink-muted underline hover:text-ink">
          Retirer
        </button>
      ) : null}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function BottleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M10 2h4v3h-4zM9 5h6l1 3v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8z" />
    </svg>
  );
}
