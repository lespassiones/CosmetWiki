"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { GLASS_CARD, GLASS_PILL, GLASS_PILL_DARK } from "@/lib/ui/glass";

type ChatMsg = { role: "user" | "assistant"; content: string };

const SUGGESTED_PROMPTS = [
  "Que penses-tu de ma routine ?",
  "Quels ingrédients prioriser pour ma peau ?",
  "Quels ingrédients éviter selon mon profil ?",
  "Comment ajuster ma routine pour l'hiver ?",
];

/**
 * Minimal inline markdown renderer for assistant messages. Handles the cases
 * the model actually produces (bold, italic, bullet lists, line breaks). Not a
 * full CommonMark parser - that would be overkill for a chat bubble.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Match **bold**, *italic*, `code`, then plain text in between.
  const re = /\*\*([^*]+?)\*\*|\*([^*]+?)\*|`([^`]+?)`/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) nodes.push(text.slice(lastIdx, m.index));
    if (m[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b-${i}`} className="font-semibold">{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i-${i}`} className="italic">{m[2]}</em>);
    } else if (m[3] !== undefined) {
      nodes.push(
        <code key={`${keyPrefix}-c-${i}`} className="rounded bg-black/[0.06] px-1 py-0.5 text-[12.5px] font-mono">
          {m[3]}
        </code>,
      );
    }
    lastIdx = m.index + m[0].length;
    i++;
  }
  if (lastIdx < text.length) nodes.push(text.slice(lastIdx));
  return nodes;
}

function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuf: string[] = [];
  let key = 0;
  const flushList = () => {
    if (listBuf.length === 0) return;
    const items = listBuf;
    blocks.push(
      <ul key={`ul-${key++}`} className="list-disc pl-5 space-y-0.5 my-1">
        {items.map((it, idx) => (
          <li key={idx}>{renderInline(it, `li-${idx}`)}</li>
        ))}
      </ul>,
    );
    listBuf = [];
  };
  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx];
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      listBuf.push(bullet[1]);
      continue;
    }
    flushList();
    if (line.trim() === "") {
      blocks.push(<div key={`sp-${key++}`} className="h-2" aria-hidden />);
    } else {
      blocks.push(<p key={`p-${key++}`}>{renderInline(line, `p-${idx}`)}</p>);
    }
  }
  flushList();
  return (
    <div className="space-y-1">
      {blocks.map((b, i) => (
        <Fragment key={i}>{b}</Fragment>
      ))}
    </div>
  );
}

export function AdvisorChat({ firstName }: { firstName: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(rawText: string) {
    const text = rawText.trim();
    if (!text || streaming) return;
    setError(null);
    setStreaming(true);

    const userMsg: ChatMsg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");

    try {
      const r = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `Erreur ${r.status}`);
        setMessages(next);
        setStreaming(false);
        return;
      }
      const reader = r.body?.getReader();
      if (!reader) {
        setError("Pas de réponse.");
        setMessages(next);
        setStreaming(false);
        return;
      }
      const decoder = new TextDecoder();
      let buffer = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: buffer };
          return copy;
        });
      }
    } catch {
      setError("Connexion interrompue.");
    } finally {
      setStreaming(false);
    }
  }

  const showSuggestions = messages.length === 0;

  return (
    <div
      className={`${GLASS_CARD} flex flex-col overflow-hidden h-[min(calc(100dvh-19rem),640px)] lg:h-[min(70vh,640px)]`}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-[14px] text-[#6B7280] mb-4">
              Salut {firstName} 👋 - pose-moi une question sur ta routine ou tes ingrédients.
            </p>
            <p className="text-[11px] text-[#9CA3AF]">
              Je n&apos;invente rien, je ne recommande pas de marque, et je n&apos;émets aucun conseil médical.
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#111111] text-white whitespace-pre-wrap"
                    : "bg-[#F3F4F6] text-[#111111]"
                }`}
              >
                {m.role === "assistant" ? (
                  m.content ? (
                    <MarkdownMessage content={m.content} />
                  ) : (
                    streaming && i === messages.length - 1 ? "…" : ""
                  )
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))
        )}
        {error && (
          <div className="rounded-xl bg-rose-50 text-rose-700 text-[13px] px-3 py-2">{error}</div>
        )}
      </div>

      {showSuggestions && (
        <div className="border-t border-[#E5E7EB] bg-[#FAFAFA] px-5 py-3">
          <p className="text-[10px] uppercase tracking-wide text-[#6B7280] mb-2">Suggestions</p>
          {/* Horizontal carousel - single row, snap-scroll, hidden scrollbar.
              The negative-mx + same px bleeds the pills to the card edges so
              the user sees there's more to swipe. */}
          <div
            className="-mx-5 flex gap-2 overflow-x-auto snap-x snap-mandatory px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => send(p)}
                disabled={streaming}
                className={`${GLASS_PILL} shrink-0 snap-start whitespace-nowrap px-3 py-1.5 text-[12px] disabled:opacity-50`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-[#E5E7EB] bg-white p-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={streaming ? "Génération en cours…" : "Pose ta question…"}
          disabled={streaming}
          maxLength={500}
          className="flex-1 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#111111]"
        />
        <button
          type="submit"
          disabled={streaming || input.trim().length === 0}
          aria-label="Envoyer"
          className={`${GLASS_PILL_DARK} h-10 w-10 flex items-center justify-center disabled:opacity-40`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="m22 2-11 11M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
