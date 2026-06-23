"use client";

import { useEffect, useState } from "react";

type ConversationSummary = {
  id: string;
  title: string | null;
  updated_at: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (conversationId: string) => void;
  /** Id de la conversation active (mis en évidence dans la liste). */
  activeId?: string | null;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function AdvisorHistorySheet({ open, onClose, onSelect, activeId }: Props) {
  const [rows, setRows] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/advisor/conversations")
      .then((r) => (r.ok ? r.json() : { conversations: [] }))
      .then((d: { conversations: ConversationSummary[] }) => setRows(d.conversations ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  async function handleDelete(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    try {
      await fetch(`/api/advisor/conversations/${id}`, { method: "DELETE" });
    } catch {
      /* non-blocking */
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-label="Mes conversations"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden />

      <div
        className="relative z-10 w-full sm:max-w-md max-h-[80dvh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl animate-[fadeIn_180ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-black/10" />
        </div>

        <div className="flex items-center justify-between px-5 pt-3 pb-3 sm:pt-5 border-b border-[#F3F4F6]">
          <h2 className="text-[15px] font-bold text-ink">Mes conversations</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-black/[0.06] text-ink-subtle hover:bg-black/[0.10] transition"
            aria-label="Fermer"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-[13px] text-[#6B7280] py-10">
              Aucune conversation pour le moment.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className={`flex items-center rounded-2xl border transition ${
                    r.id === activeId
                      ? "border-rose-200 bg-rose-50/60"
                      : "border-[#F3F4F6] bg-white hover:bg-black/[0.02]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(r.id)}
                    className="flex-1 flex items-center gap-3 px-3.5 py-3 text-left min-w-0"
                  >
                    <ChatIcon />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-medium text-ink truncate">
                        {r.title ?? "Conversation"}
                      </span>
                      <span className="block text-[11px] text-[#9CA3AF] mt-0.5">
                        {formatDate(r.updated_at)}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="p-3 text-[#9CA3AF] hover:text-rose-500 transition shrink-0"
                    aria-label="Supprimer la conversation"
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
