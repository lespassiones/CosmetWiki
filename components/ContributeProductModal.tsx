"use client";

/**
 * ContributeProductModal — « Ajouter ce produit » après un scan d'un produit
 * ABSENT du catalogue (web). Twin de ContributeProductSheet (mobile) : 2 photos
 * (DEVANT + LISTE D'INGRÉDIENTS) + nom facultatif, keyées par le code-barres
 * scanné. Envoie à /api/tools/photo-submission (table catalog_photo_submissions,
 * status pending). Rien n'est publié ici : un admin valide + OCR + score + publie.
 */
import { useEffect, useRef, useState } from "react";

async function compressToWebP(file: File, maxWidth: number, quality: number): Promise<Blob> {
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
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/webp", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
    img.src = url;
  });
}

type Phase = "form" | "sending" | "done" | "error";

export function ContributeProductModal({ ean, open, onClose }: { ean: string; open: boolean; onClose: () => void }) {
  const [front, setFront] = useState<File | null>(null);
  const [ing, setIng] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<Phase>("form");

  if (!open) return null;

  function close() {
    setFront(null); setIng(null); setName(""); setPhase("form");
    onClose();
  }

  async function send() {
    if (!front || !ing) return;
    setPhase("sending");
    try {
      const fd = new FormData();
      fd.append("ean", ean);
      fd.append("name", name.trim());
      fd.append("brand", "");
      fd.append("category", "");
      const frontBlob = await compressToWebP(front, 1000, 0.5);
      const ingBlob = await compressToWebP(ing, 1600, 0.6);
      fd.append("photo1", new File([frontBlob], "front.webp", { type: "image/webp" }));
      fd.append("photo2", new File([ingBlob], "ingredients.webp", { type: "image/webp" }));
      const r = await fetch("/api/tools/photo-submission", { method: "POST", body: fd });
      setPhase(r.ok ? "done" : "error");
    } catch {
      setPhase("error");
    }
  }

  const canSend = !!front && !!ing && phase !== "sending";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={close}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-[#1F2937]">Ajouter ce produit</h2>
          <button type="button" onClick={close} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-[#1F2937]">✕</button>
        </div>

        {phase === "done" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl">✓</div>
            <p className="text-[16px] font-semibold text-[#1F2937]">Merci pour ta contribution 🙌</p>
            <p className="text-[14px] leading-relaxed text-[#6B7280]">
              On vérifie tes photos, on lit la composition et on ajoute le produit très vite.
            </p>
            <button type="button" onClick={close} className="mt-2 w-full rounded-full bg-[#F43F5E] py-3 text-[15px] font-semibold text-white hover:bg-[#E11D48]">
              Terminé
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] leading-relaxed text-[#6B7280]">
              Ce produit n'est pas encore dans notre base. Aide-nous à l'ajouter avec 2 photos — on
              lira la composition pour le noter.
            </p>

            <PhotoField label="1. Le devant du produit" hint="Le produit en main, bien cadré." file={front} onPick={setFront} />
            <PhotoField label="2. La liste des ingrédients (au dos)" hint="Cadre bien la liste « Ingredients / INCI », nette et lisible." file={ing} onPick={setIng} />

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#6B7280]">Nom du produit (facultatif)</label>
              <input
                type="text"
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex. Crème hydratante visage"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] text-[#1F2937] outline-none focus:border-rose-300"
              />
            </div>

            {phase === "error" ? (
              <p className="text-[13px] font-medium text-[#DC2626]">L'envoi a échoué. Vérifie ta connexion et réessaie.</p>
            ) : null}

            <button
              type="button"
              disabled={!canSend}
              onClick={send}
              className="w-full rounded-full bg-[#F43F5E] py-3 text-[15px] font-semibold text-white transition hover:bg-[#E11D48] disabled:bg-gray-300"
            >
              {phase === "sending" ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoField({ label, hint, file, onPick }: { label: string; hint: string; file: File | null; onPick: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50"
        aria-label={label}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl text-gray-400">📷</span>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-[#1F2937]">{label}</p>
        <p className="text-[12.5px] leading-snug text-[#6B7280]">{hint}</p>
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-1 text-[13px] font-semibold text-[#8B5CF6]">
          {file ? "Remplacer" : "Prendre / choisir une photo"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }}
      />
    </div>
  );
}
