"use client";

import { useEffect, useState } from "react";
import { AdvisorChat, type StoredMessage } from "@/components/advisor/AdvisorChat";
import { AdvisorHistorySheet } from "@/components/advisor/AdvisorHistorySheet";

type ActiveConv = {
  id: string | null;
  messages: StoredMessage[] | null;
  /** Force le remontage de AdvisorChat quand on change de conversation. */
  chatKey: number;
};

/**
 * Conteneur client du Beauty Advisor : gère la conversation active (reprise de
 * la plus récente au montage, nouvelle conversation, ouverture depuis
 * l'historique) et expose les deux actions en haut à droite (parité mobile :
 * « nouvelle conversation » + « historique »).
 */
export function AdvisorPanel({ firstName }: { firstName: string }) {
  const [active, setActive] = useState<ActiveConv>({ id: null, messages: null, chatKey: 0 });
  const [historyOpen, setHistoryOpen] = useState(false);

  // Reprend la conversation la plus récente au montage (comportement web
  // historique). Une nouvelle conversation se démarre via le bouton dédié.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/advisor/history")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { conversationId: string | null; messages: StoredMessage[] } | null) => {
        if (cancelled || !d?.conversationId || d.messages.length === 0) return;
        setActive((c) => ({ id: d.conversationId, messages: d.messages, chatKey: c.chatKey + 1 }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function startNewConversation() {
    setHistoryOpen(false);
    setActive((c) => ({ id: null, messages: null, chatKey: c.chatKey + 1 }));
  }

  async function openConversation(conversationId: string) {
    setHistoryOpen(false);
    try {
      const r = await fetch(`/api/advisor/conversations/${conversationId}`);
      const d = r.ok ? ((await r.json()) as { messages: StoredMessage[] }) : { messages: [] };
      setActive((c) => ({ id: conversationId, messages: d.messages ?? [], chatKey: c.chatKey + 1 }));
    } catch {
      setActive((c) => ({ id: conversationId, messages: [], chatKey: c.chatKey + 1 }));
    }
  }

  return (
    <>
      {/* Actions en haut à droite. Sur mobile, on les décale à GAUCHE du burger
          flottant (fixe à right-3, largeur 44px) pour ne pas passer dessous ;
          sur desktop le burger est masqué, on s'aligne avec le titre. */}
      <div className="absolute right-16 top-3 lg:right-8 lg:top-10 z-30 flex items-center gap-1.5">
        <button
          type="button"
          onClick={startNewConversation}
          aria-label="Nouvelle conversation"
          title="Nouvelle conversation"
          className="h-9 w-9 flex items-center justify-center rounded-full bg-white ring-1 ring-black/[0.06] text-ink shadow-sm hover:bg-black/[0.03] transition"
        >
          <NewChatIcon />
        </button>
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          aria-label="Historique des conversations"
          title="Historique des conversations"
          className="h-9 w-9 flex items-center justify-center rounded-full bg-white ring-1 ring-black/[0.06] text-ink shadow-sm hover:bg-black/[0.03] transition"
        >
          <HistoryIcon />
        </button>
      </div>

      <AdvisorChat
        key={active.chatKey}
        firstName={firstName}
        conversationId={active.id}
        initialMessages={active.messages}
        onConversationCreated={(id) => setActive((c) => ({ ...c, id }))}
      />

      <AdvisorHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={(id) => void openConversation(id)}
        activeId={active.id}
      />
    </>
  );
}

function NewChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  );
}
