"use client";

import { Fragment, useEffect, useRef, useState } from "react";

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  time?: string;
  uiOnly?: boolean;
};

type ProductRec = {
  ean: string;
  product_label: string | null;
  brand: string | null;
  score: number;
  score_label: string;
  score_tone: string;
};

const SUGGESTED_PROMPTS = [
  "Que penses-tu de ma routine ?",
  "Quels ingrédients prioriser pour ma peau ?",
  "Quels ingrédients éviter selon mon profil ?",
  "Comment ajuster ma routine pour l'hiver ?",
];

const PRODUCT_KEYWORDS = [
  "produit", "recommande", "recommander", "suggère", "suggérer", "conseil",
  "acheter", "meilleur", "alternative", "remplacer", "remplace", "shampoing",
  "crème", "sérum", "nettoyant", "masque", "lotion", "baume", "huile", "gel",
];

function looksLikeProductQuestion(text: string): boolean {
  const lower = text.toLowerCase();
  return PRODUCT_KEYWORDS.some((kw) => lower.includes(kw));
}

function getTime() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\*\*([^*]+?)\*\*|__([^_]+?)__|_([^_]+?)_|\*([^*]+?)\*|`([^`]+?)`/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) nodes.push(text.slice(lastIdx, m.index));
    if (m[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b-${i}`} className="font-semibold">{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      nodes.push(<u key={`${keyPrefix}-u-${i}`}>{m[2]}</u>);
    } else if (m[3] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i-${i}`} className="italic">{m[3]}</em>);
    } else if (m[4] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i2-${i}`} className="italic">{m[4]}</em>);
    } else if (m[5] !== undefined) {
      nodes.push(
        <code key={`${keyPrefix}-c-${i}`} className="rounded bg-black/[0.06] px-1 py-0.5 text-[12.5px] font-mono">
          {m[5]}
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
    const bullet = line.match(/^\s*[-*•,]\s+(.*)$/);
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

const TONE_BADGE: Record<string, { bg: string; text: string }> = {
  green:  { bg: "bg-emerald-100", text: "text-emerald-700" },
  amber:  { bg: "bg-green-100",   text: "text-green-700" },
  orange: { bg: "bg-amber-100",   text: "text-amber-700" },
  rose:   { bg: "bg-rose-100",    text: "text-rose-700" },
};

function ProductRecCard({ rec }: { rec: ProductRec }) {
  const badge = TONE_BADGE[rec.score_tone] ?? TONE_BADGE.orange;
  return (
    <a
      href={`/?ean=${encodeURIComponent(rec.ean)}`}
      className="shrink-0 snap-start w-44 rounded-2xl bg-white border border-[#F3F4F6] p-3 flex flex-col gap-1.5 hover:shadow-md transition"
    >
      <div className="text-[12px] font-medium text-[#111111] line-clamp-2 leading-snug">
        {rec.product_label ?? rec.ean}
      </div>
      {rec.brand ? (
        <div className="text-[10px] text-[#6B7280] truncate">{rec.brand}</div>
      ) : null}
      <span className={`mt-auto self-start inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text}`}>
        {rec.score_label}
      </span>
    </a>
  );
}

export function AdvisorChat({ firstName }: { firstName: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: `Salut ${firstName}\nJe suis là pour t'aider avec ta routine ou tes ingrédients.\n\n**Que souhaites-tu savoir ?**`,
      time: getTime(),
      uiOnly: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [productRecs, setProductRecs] = useState<ProductRec[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load last conversation on mount.
  useEffect(() => {
    fetch("/api/advisor/history")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { conversationId: string | null; messages: { role: "user" | "assistant"; content: string }[] } | null) => {
        if (d?.conversationId && d.messages.length > 0) {
          setConversationId(d.conversationId);
          setMessages((prev) => [
            prev[0],
            ...d.messages.map((m) => ({ role: m.role, content: m.content })),
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function fetchProductRecs(query: string) {
    try {
      const r = await fetch(`/api/catalog-search?q=${encodeURIComponent(query.slice(0, 80))}`);
      if (!r.ok) return;
      const d = (await r.json()) as { products: ProductRec[] };
      const top = (d.products ?? []).slice(0, 6);
      if (top.length > 0) setProductRecs(top);
    } catch {
      // non-blocking
    }
  }

  async function persistMessages(userMsg: ChatMsg, assistantMsg: ChatMsg) {
    try {
      const r = await fetch("/api/advisor/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: [
            { role: userMsg.role, content: userMsg.content },
            { role: assistantMsg.role, content: assistantMsg.content },
          ],
        }),
      });
      if (r.ok) {
        const d = (await r.json()) as { conversationId?: string };
        if (d.conversationId && !conversationId) setConversationId(d.conversationId);
      }
    } catch {
      // non-blocking
    }
  }

  async function send(rawText: string) {
    const text = rawText.trim();
    if (!text || streaming) return;
    setError(null);
    setProductRecs(null);
    setStreaming(true);

    const userMsg: ChatMsg = { role: "user", content: text, time: getTime() };
    const apiMessages = [...messages.filter((m) => !m.uiOnly), userMsg];
    const assistantPlaceholder: ChatMsg = { role: "assistant", content: "", time: getTime() };
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setInput("");

    let finalContent = "";

    try {
      const r = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `Erreur ${r.status}`);
        setMessages((prev) => prev.slice(0, -1));
        setStreaming(false);
        return;
      }
      const reader = r.body?.getReader();
      if (!reader) {
        setError("Pas de réponse.");
        setMessages((prev) => prev.slice(0, -1));
        setStreaming(false);
        return;
      }
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        finalContent = buffer;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: buffer, time: getTime() };
          return copy;
        });
      }

      // Persist exchange in background.
      const finalAssistantMsg: ChatMsg = { role: "assistant", content: finalContent };
      persistMessages(userMsg, finalAssistantMsg);

      // Fetch product recommendations if the question is about products.
      if (looksLikeProductQuestion(text)) {
        fetchProductRecs(text);
      }
    } catch {
      setError("Connexion interrompue.");
    } finally {
      setStreaming(false);
    }
  }

  const showSuggestions = messages.filter((m) => !m.uiOnly).length === 0 && !loadingHistory;

  return (
    <div className="flex flex-col overflow-hidden h-[min(calc(100dvh-19rem),640px)] lg:h-[min(70vh,640px)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 py-4 space-y-4">
        {loadingHistory ? (
          <div className="flex justify-center py-6">
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-sm mb-1.5">
                    ✨
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 text-[12px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#111111] text-white whitespace-pre-wrap rounded-br-sm"
                      : "bg-white shadow-sm border border-[#F3F4F6] text-[#111111] rounded-bl-sm"
                  }`}
                >
                  {m.role === "assistant" ? (
                    m.content ? (
                      <MarkdownMessage content={m.content} />
                    ) : (
                      streaming && i === messages.length - 1 ? (
                        <span className="flex gap-1 items-center py-0.5">
                          <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                      ) : ""
                    )
                  ) : (
                    m.content
                  )}
                </div>
                {m.time && (
                  <span className="text-[10px] text-[#9CA3AF] mt-1 px-1">
                    {m.time}
                    {m.role === "user" && (
                      <span className="ml-1 text-rose-400">✓✓</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          ))
        )}

        {/* Product recommendation cards — shown after streaming finishes */}
        {!streaming && productRecs && productRecs.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#6B7280] mb-2 px-1">
              Produits du catalogue
            </p>
            <div className="flex gap-2 overflow-x-auto snap-x pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {productRecs.map((rec) => (
                <ProductRecCard key={rec.ean} rec={rec} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-50 text-rose-700 text-[13px] px-3 py-2">{error}</div>
        )}
      </div>

      {showSuggestions && (
        <div className="border-t border-[#F3F4F6] px-0 py-3">
          <p className="text-[10px] uppercase tracking-wide text-[#6B7280] mb-2">Suggestions</p>
          <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => send(p)}
                disabled={streaming}
                className="shrink-0 snap-start whitespace-nowrap px-3 py-2 text-[12px] font-medium border-2 border-[#111111] rounded-xl bg-white text-[#111111] active:bg-[#111111] active:text-white transition-colors disabled:opacity-50"
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
        className="border-t border-[#F3F4F6] pt-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={streaming ? "Génération en cours…" : "Pose ta question…"}
          disabled={streaming}
          maxLength={500}
          className="flex-1 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#FDA4AF]"
        />
        <button
          type="submit"
          disabled={streaming || input.trim().length === 0}
          aria-label="Envoyer"
          className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500 text-white disabled:opacity-40 shrink-0"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="m22 2-11 11M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
