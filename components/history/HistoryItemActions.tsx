"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameAnalysis, deleteAnalysis } from "@/app/history/actions";

export function HistoryItemActions({
  id,
  currentName,
  onOpenChange,
}: {
  id: string;
  currentName: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!editing) setName(currentName);
  }, [currentName, editing]);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || editing) return;
    function onOutside(e: MouseEvent | TouchEvent) {
      if (wrapperRef.current?.contains(e.target as Node)) return;
      toggle(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  function toggle(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  function save() {
    const newName = name.trim();
    if (!newName || newName === currentName) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const r = await renameAnalysis(id, newName);
      if (r.ok) {
        setEditing(false);
        toggle(false);
        router.refresh();
      }
    });
  }

  function remove() {
    if (!confirm("Supprimer définitivement cette analyse ?")) return;
    startTransition(async () => {
      await deleteAnalysis(id);
    });
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => toggle(!open)}
        aria-label="Plus d'actions"
        className="neu-sm rounded-full h-9 w-9 inline-flex items-center justify-center text-[#6B7280] hover:text-[#111111] transition"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>

      {open && (
        <div
          className="neu-menu absolute right-0 bottom-full mb-1 z-[70] w-64 p-2"
        >
          {editing ? (
            <div className="p-2">
              <label className="block text-[11px] text-[#6B7280] mb-1">Nouveau nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={200}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#111111]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                  if (e.key === "Escape") setEditing(false);
                }}
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={pending}
                  className="neu-btn-primary rounded-full flex-1 text-xs py-2 disabled:opacity-50"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setName(currentName);
                    setEditing(false);
                  }}
                  className="neu-btn rounded-full px-3 text-xs"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[#F3F4F6] flex items-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
                Renommer
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#E11D48] hover:bg-rose-50 flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
                Supprimer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
