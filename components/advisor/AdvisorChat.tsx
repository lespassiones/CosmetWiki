"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  parseRecoBlock,
  stripRecoBlock,
  buildRecoBlock,
  type RecoCriteria,
} from "@/lib/advisor/recoBlock";
import type { AdvisorProduct } from "@/app/api/advisor/recommendations/route";
import { apiFetch } from "@/lib/clientApi";
import { scoreColor } from "@/lib/essentiel/engine";

// ─── sessionStorage keys (mirror ScanSheet / AlternativesCarousel) ───────────
const PENDING_INCI_KEY = "cw:pendingInci";
const PENDING_SOURCE_KEY = "cw:pendingProductSource";

type RecoRelaxation = {
  keptLabels: string[];
  droppedLabels: string[];
  products: AdvisorProduct[];
};

/** Message tel que renvoyé par l'historique (API conversations). */
export type StoredMessage = {
  role: "user" | "assistant";
  content: string;
  products?: unknown;
  reco_criteria?: unknown;
};

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  time?: string;
  /** Message d'accueil : exclu de l'historique envoyé à l'API. */
  uiOnly?: boolean;
  /** Une recommandation produit a été demandée pour ce message. */
  recoTried?: boolean;
  /** Recherche des produits en cours. */
  recoLoading?: boolean;
  /** Produits recommandés à afficher en carrousel sous la bulle. */
  products?: AdvisorProduct[];
  /** Critères de la reco (pour reconstruire le bloc aux tours suivants). */
  recoCriteria?: RecoCriteria | null;
  /** Raison d'un carrousel vide : 'restrictions' (tout filtré) ou 'none' (rien trouvé). */
  recoEmptyReason?: "restrictions" | "none" | null;
  /** Compromis proposé quand aucune reco ne coche TOUTES les contraintes ad-hoc. */
  recoRelaxation?: RecoRelaxation | null;
};

const SUGGESTED_PROMPTS = [
  "Que penses-tu de ma routine ?",
  "Conseille-moi une crème adaptée à ma peau",
  "Quels ingrédients éviter selon mon profil ?",
  "Comment ajuster ma routine pour l'hiver ?",
];

function getTime() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Construit l'historique envoyé à l'API : retire les messages purement UI et
 * RECONSTRUIT le bloc RECO sur les réponses assistant passées (à partir de
 * `recoCriteria`). CRITIQUE multi-tours : sans ça l'IA voit son propre
 * historique SANS bloc, imite ce schéma et arrête d'émettre le bloc.
 */
function buildApiMessages(history: ChatMsg[], newUserText: string) {
  const past = history
    .filter((m) => !m.uiOnly)
    .map((m) => ({
      role: m.role,
      content:
        m.role === "assistant" && m.recoCriteria
          ? `${m.content}\n${buildRecoBlock(m.recoCriteria)}`
          : m.content,
    }));
  return [...past, { role: "user" as const, content: newUserText }];
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

// ─── Score tone → colour mapping (mirror analyse AlternativesCarousel) ───────
const TONE: Record<string, { text: string; dot: string }> = {
  green:  { text: "text-emerald-700", dot: "bg-emerald-500" },
  amber:  { text: "text-amber-700",   dot: "bg-amber-500"   },
  orange: { text: "text-orange-600",  dot: "bg-orange-500"  },
  rose:   { text: "text-rose-600",    dot: "bg-rose-500"    },
};

function ProductPlaceholderIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8 text-rose-300"
    >
      <path d="M9 2h6v3a2 2 0 0 0 .6 1.4L17 7.8A4 4 0 0 1 18 10.6V19a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-8.4a4 4 0 0 1 1-2.8l1.4-1.4A2 2 0 0 0 9 5z" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function ProductCard({
  product,
  onSelect,
}: {
  product: AdvisorProduct;
  onSelect: (p: AdvisorProduct) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  // Couleur dérivée du SCORE (source unique), jamais du score_tone stocké.
  const tone = TONE[scoreColor(product.score) ?? "rose"] ?? TONE.rose;
  const showImage = product.image_url && !imgFailed;
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="shrink-0 w-[132px] snap-start flex flex-col rounded-2xl bg-white ring-1 ring-[#F3F4F6] shadow-sm p-2.5 text-left transition-all hover:shadow-md hover:ring-rose-200 active:scale-[0.97]"
    >
      <div className="h-[76px] w-full rounded-xl overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50 mb-2 flex items-center justify-center">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url!}
            alt=""
            className="h-full w-full object-contain"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <ProductPlaceholderIcon />
        )}
      </div>
      {product.brand ? (
        <p className="text-[9px] font-semibold uppercase tracking-wider text-pink-500/80 truncate w-full mb-0.5">
          {product.brand}
        </p>
      ) : null}
      <p className="text-[11.5px] font-medium text-ink leading-snug line-clamp-2 flex-1 mb-1.5">
        {product.name ?? product.ean}
      </p>
      {product.score_label ? (
        <div className={`flex items-center gap-1 text-[10.5px] font-semibold ${tone.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${tone.dot}`} aria-hidden />
          <span className="truncate">{product.score_label}</span>
        </div>
      ) : null}
    </button>
  );
}

function ProductCarousel({
  products,
  loading,
  emptyReason,
  onSelect,
}: {
  products: AdvisorProduct[];
  loading: boolean;
  emptyReason: "restrictions" | "none" | null | undefined;
  onSelect: (p: AdvisorProduct) => void;
}) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden pt-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[132px] h-[160px] rounded-2xl bg-black/[0.05] animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p className="text-[12px] text-[#6B7280] pt-1">
        {emptyReason === "restrictions"
          ? "Des produits correspondaient, mais aucun ne respecte tes restrictions actuelles. Assouplis-les dans ton profil pour voir des suggestions."
          : "Je n'ai pas trouvé de produit qui colle vraiment à ce besoin. Précise un peu et je recherche autrement."}
      </p>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto snap-x pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {products.map((p) => (
        <ProductCard key={p.ean} product={p} onSelect={onSelect} />
      ))}
    </div>
  );
}

type AdvisorChatProps = {
  firstName: string;
  /** Conversation existante à reprendre (sinon nouvelle conversation). */
  conversationId?: string | null;
  /** Messages d'une conversation chargée depuis l'historique. */
  initialMessages?: StoredMessage[] | null;
  /** Notifie le parent quand une conversation est créée (1er message). */
  onConversationCreated?: (id: string) => void;
};

function greeting(firstName: string): ChatMsg {
  return {
    role: "assistant",
    content: `Salut ${firstName}\nJe suis là pour t'aider avec ta routine ou tes ingrédients.\n\n**Que souhaites-tu savoir ?**`,
    time: getTime(),
    uiOnly: true,
  };
}

/** Convertit un message stocké (API) en message d'affichage. */
function fromStored(m: StoredMessage): ChatMsg {
  const products = Array.isArray(m.products) ? (m.products as AdvisorProduct[]) : undefined;
  const recoCriteria = (m.reco_criteria ?? null) as RecoCriteria | null;
  return {
    role: m.role,
    content: m.content,
    products,
    recoCriteria,
    recoTried: (products !== undefined && products.length > 0) || !!recoCriteria,
  };
}

export function AdvisorChat({
  firstName,
  conversationId = null,
  initialMessages = null,
  onConversationCreated,
}: AdvisorChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMsg[]>(() =>
    initialMessages && initialMessages.length > 0
      ? [greeting(firstName), ...initialMessages.map(fromStored)]
      : [greeting(firstName)],
  );
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Id de la conversation courante (créée à la volée au 1er message).
  const convIdRef = useRef<string | null>(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function persistMessages(userMsg: ChatMsg, assistantMsg: ChatMsg) {
    try {
      const r = await fetch("/api/advisor/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convIdRef.current,
          messages: [
            { role: userMsg.role, content: userMsg.content },
            {
              role: assistantMsg.role,
              content: assistantMsg.content,
              products: assistantMsg.products ?? null,
              reco_criteria: assistantMsg.recoCriteria ?? null,
            },
          ],
        }),
      });
      if (r.ok) {
        const d = (await r.json()) as { conversationId?: string };
        if (d.conversationId && !convIdRef.current) {
          convIdRef.current = d.conversationId;
          onConversationCreated?.(d.conversationId);
        }
      }
    } catch {
      // non-blocking
    }
  }

  /** Clic sur une carte : on relance l'analyse du produit (comme l'analyse). */
  function handleSelect(p: AdvisorProduct) {
    if (!p.ingredients_text) return;
    try {
      sessionStorage.setItem(PENDING_INCI_KEY, p.ingredients_text);
      sessionStorage.setItem(
        PENDING_SOURCE_KEY,
        JSON.stringify({
          source: "catalog",
          sourceUrl: null,
          brand: p.brand ?? null,
          productName: p.name,
          ean: p.ean,
        }),
      );
    } catch {
      /* ignore storage errors */
    }
    router.push(`/analyse?inci=${encodeURIComponent(p.ingredients_text.slice(0, 6000))}`);
  }

  async function send(rawText: string) {
    const text = rawText.trim();
    if (!text || streaming) return;
    setError(null);
    setStreaming(true);

    const userMsg: ChatMsg = { role: "user", content: text, time: getTime() };
    const apiMessages = buildApiMessages(messages, text);
    const assistantPlaceholder: ChatMsg = { role: "assistant", content: "", time: getTime() };
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setInput("");

    // Patch la dernière bulle assistant (toujours en fin de liste pendant un tour).
    const updateLastAssistant = (patch: Partial<ChatMsg>) =>
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = { ...last, ...patch, role: "assistant", time: last?.time ?? getTime() };
        return copy;
      });

    let finalContent = "";
    let finalProducts: AdvisorProduct[] = [];
    let finalCriteria: RecoCriteria | null = null;

    try {
      const r = await apiFetch("/api/advisor/chat", {
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
        // On masque le bloc technique <<<RECO>>> dès qu'il commence à arriver.
        updateLastAssistant({ content: stripRecoBlock(buffer) });
      }

      const visible = stripRecoBlock(buffer).trim();
      finalContent = visible || "Je n'ai pas pu générer de réponse cette fois-ci.";
      updateLastAssistant({ content: finalContent });

      // Si l'advisor a émis un bloc RECO, on récupère les produits sûrs et on
      // les affiche en carrousel sous la réponse.
      const reco = parseRecoBlock(buffer);
      if (reco) {
        finalCriteria = reco;
        updateLastAssistant({ recoTried: true, recoLoading: true, recoCriteria: reco });
        try {
          const rec = await fetch("/api/advisor/recommendations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reco),
          });
          if (rec.ok) {
            const d = (await rec.json()) as {
              products: AdvisorProduct[];
              emptyReason: "restrictions" | "none" | null;
              relaxation: RecoRelaxation | null;
            };
            finalProducts = d.products ?? [];
            updateLastAssistant({
              products: finalProducts,
              recoLoading: false,
              recoEmptyReason: d.emptyReason ?? null,
              recoRelaxation: d.relaxation ?? null,
            });
          } else {
            updateLastAssistant({ products: [], recoLoading: false, recoEmptyReason: "none" });
          }
        } catch {
          updateLastAssistant({ products: [], recoLoading: false, recoEmptyReason: "none" });
        }
      }

      // Persiste l'échange (avec produits + critères) en arrière-plan.
      persistMessages(userMsg, {
        role: "assistant",
        content: finalContent,
        products: finalProducts,
        recoCriteria: finalCriteria,
      });
    } catch {
      setError("Connexion interrompue.");
    } finally {
      setStreaming(false);
    }
  }

  /** L'utilisateur accepte le compromis : on charge le set relâché. */
  function acceptRelaxation(index: number) {
    setMessages((prev) =>
      prev.map((mm, idx) =>
        idx === index && mm.recoRelaxation
          ? { ...mm, products: mm.recoRelaxation.products, recoEmptyReason: null, recoRelaxation: null }
          : mm,
      ),
    );
  }

  const showSuggestions = messages.filter((m) => !m.uiOnly).length === 0;

  return (
    <div className="flex flex-col overflow-hidden h-[min(calc(100dvh-19rem),640px)] lg:h-[min(70vh,640px)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 py-4 space-y-4">
        {messages.map((m, i) => (
            <Fragment key={i}>
              <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
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
                      ) : streaming && i === messages.length - 1 ? (
                        <span className="flex gap-1 items-center py-0.5">
                          <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                      ) : (
                        ""
                      )
                    ) : (
                      m.content
                    )}
                  </div>
                  {m.time && (
                    <span className="text-[10px] text-[#9CA3AF] mt-1 px-1">
                      {m.time}
                      {m.role === "user" && <span className="ml-1 text-rose-400">✓✓</span>}
                    </span>
                  )}
                </div>
              </div>

              {/* Carrousel produits sous la réponse assistant */}
              {m.role === "assistant" && m.recoTried ? (
                <div className="pl-9">
                  <p className="text-[10px] uppercase tracking-wide text-[#6B7280] mb-2 px-0.5">
                    Quelques produits sûrs pour toi
                  </p>
                  {m.recoRelaxation && !m.recoLoading && (m.products?.length ?? 0) === 0 ? (
                    <div className="rounded-2xl bg-white border border-[#F3F4F6] p-3 space-y-2.5">
                      <p className="text-[12px] text-[#374151] leading-relaxed">
                        {m.recoRelaxation.keptLabels.length > 0
                          ? `Aucun produit ne coche tout. J'en ai ${m.recoRelaxation.products.length} ${m.recoRelaxation.keptLabels.join(" et ")}, mais je ne peux pas garantir : ${m.recoRelaxation.droppedLabels.join(", ")}.`
                          : `Aucun produit ne respecte toutes ces contraintes dans notre base. J'ai ${m.recoRelaxation.products.length} produits du bon type (compatibles avec ton profil), mais je ne peux pas garantir : ${m.recoRelaxation.droppedLabels.join(", ")}.`}
                      </p>
                      <button
                        type="button"
                        onClick={() => acceptRelaxation(i)}
                        className="rounded-full bg-emerald-500 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-600 transition"
                      >
                        Voir ces {m.recoRelaxation.products.length} produits
                      </button>
                    </div>
                  ) : (
                    <ProductCarousel
                      products={m.products ?? []}
                      loading={!!m.recoLoading}
                      emptyReason={m.recoEmptyReason}
                      onSelect={handleSelect}
                    />
                  )}
                </div>
              ) : null}
            </Fragment>
          ))}

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
          className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-500 text-white disabled:opacity-40 shrink-0"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="m22 2-11 11M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
