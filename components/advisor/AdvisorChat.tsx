"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RecoCriteria } from "@/lib/advisor/recoBlock";
import type { AdvisorProduct } from "@/app/api/advisor/recommendations/route";
import { apiFetch } from "@/lib/clientApi";
import { scoreColor } from "@/lib/essentiel/engine";

/** Pool de ~50 phrases de chargement (ordre mélangé à chaque envoi), affichées
 *  pendant l'attente de l'agent. Twin du mobile lib/advisor/agentClient. */
const ADVISOR_LOADING_STEPS = [
  "Je lis ta demande…",
  "Je cerne ton besoin…",
  "Je fouille le catalogue…",
  "Je cherche de vrais produits notés…",
  "Je compare les compositions…",
  "Je vérifie les ingrédients…",
  "J’écarte les formules douteuses…",
  "Je garde le meilleur pour ta peau…",
  "Je vérifie les compositions…",
  "Je traque les bons actifs…",
  "J’analyse les étiquettes…",
  "Je fais le tri dans les INCI…",
  "Je repère les pépites…",
  "Je vérifie la douceur des formules…",
  "Je croise avec ton profil…",
  "Je respecte tes restrictions…",
  "Je chasse le superflu…",
  "Je sélectionne les valeurs sûres…",
  "Je pèse le pour et le contre…",
  "Je vérifie les notes…",
  "Je décrypte les listes d’ingrédients…",
  "Je cherche ce qui te convient vraiment…",
  "Je mets de côté les irritants…",
  "Je compare les scores…",
  "Je regarde ce qui est vraiment clean…",
  "Je peaufine ma sélection…",
  "Je vérifie deux fois…",
  "Je m’assure que c’est adapté…",
  "Je fais parler la composition…",
  "J’affine les résultats…",
  "Je cherche la perle rare…",
  "Je vérifie l’absence d’allergènes…",
  "Je passe les formules au crible…",
  "Je garde seulement le pertinent…",
  "Je consulte les meilleures références…",
  "Je vérifie que ça colle à ton besoin…",
  "Je prépare mes recommandations…",
  "Je rassemble mes trouvailles…",
  "Je vérifie une dernière chose…",
  "Je finalise ma réponse…",
  "Je réfléchis à la meilleure option…",
  "Je fais le point sur les actifs utiles…",
  "Je vérifie les concentrations…",
  "Je compare marque par marque…",
  "Je cherche le juste équilibre…",
  "Je vérifie la tolérance des formules…",
  "Je mets ta peau au centre…",
  "Je trie par qualité…",
  "Je boucle ma sélection…",
  "Presque prêt…",
];
const ADVISOR_LOADING_COLORS = ["#F43F5E", "#8B5CF6", "#0EA5A4", "#3B82F6", "#F59E0B", "#EC4899"];
function makeLoadingSequence(): string[] {
  const arr = [...ADVISOR_LOADING_STEPS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function advisorLoadingColor(tick: number): string {
  const n = ADVISOR_LOADING_COLORS.length;
  return ADVISOR_LOADING_COLORS[((tick % n) + n) % n];
}

/** Produit renvoyé par l'agent (superset d'AdvisorProduct : category/count_total en plus). */
type AgentProduct = AdvisorProduct & { category?: string | null; count_total?: number | null };

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
  /** Intention produit décidée par l'agent : 'offer' → bouton « Explorer quelques
   *  pistes » quand aucun produit affiché ; 'none' → aucun bouton. */
  productOffer?: "none" | "offer";
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

/**
 * Message envoyé à l'agent quand l'utilisateur tape le bouton « Montre-moi des
 * recommandations » (affiché sous une réponse SANS produits). Il n'apparaît pas
 * comme bulle : seul le carrousel du message concerné se remplit. Twin mobile.
 */
const RECO_REQUEST_PROMPT = "Montre-moi des produits recommandés adaptés à ma demande.";

function getTime() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Historique envoyé à l'agent : plain {role, content}, sans les messages
 * purement UI (accueil). L'agent ne parse pas de bloc technique : le contenu
 * visible suffit (le serveur tronque aux 12 derniers tours).
 */
function buildApiMessages(history: ChatMsg[], newUserText: string) {
  const past = history
    .filter((m) => !m.uiOnly)
    .map((m) => ({ role: m.role, content: m.content }));
  return [...past, { role: "user" as const, content: newUserText }];
}

/** Réponse finale de l'agent (identique en mode bloquant et streaming). */
type AgentReply = {
  reply?: string;
  products?: AgentProduct[];
  followup?: string | null;
  /** Intention produit décidée par l'agent : pilote le bouton « Explorer quelques pistes ». */
  product_offer?: "none" | "offer";
};

/**
 * Consomme un flux SSE de l'agent : appelle `onStatus(label)` sur chaque événement
 * de progression, et renvoie le `result` final (ou null si le flux s'est coupé
 * sans résultat exploitable → le caller retombe alors sur le mode bloquant).
 */
async function consumeAdvisorStream(
  body: ReadableStream<Uint8Array>,
  onStatus: (label: string) => void,
): Promise<AgentReply | null> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: AgentReply | null = null;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, sep).trim();
        buffer = buffer.slice(sep + 2);
        if (!frame.startsWith("data:")) continue;
        const json = frame.slice(5).trim();
        if (!json) continue;
        let evt: { type?: string; label?: string } & AgentReply;
        try {
          evt = JSON.parse(json);
        } catch {
          continue;
        }
        if (evt.type === "status" && evt.label) onStatus(evt.label);
        else if (evt.type === "result") {
          result = {
            reply: evt.reply,
            products: evt.products,
            followup: evt.followup,
            product_offer: evt.product_offer,
          };
        }
        // evt.type === "error" → on laisse result à null (fallback bloquant).
      }
    }
  } catch {
    return result;
  }
  return result;
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
  // Statut de progression RÉEL remonté par le flux (« Je cherche… », « J'analyse
  // N produits… »). Quand renseigné, il remplace la phrase rotative.
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bouton « Montre-moi des recommandations » : une seule requête à la fois.
  const [recoRequesting, setRecoRequesting] = useState(false);
  // Tick pour faire tourner les messages de chargement pendant l'attente.
  const [loadingTick, setLoadingTick] = useState(0);
  // Ordre aléatoire des phrases de chargement, régénéré à chaque envoi.
  const loadingSeqRef = useRef<string[]>(ADVISOR_LOADING_STEPS.slice());
  // Id de la conversation courante (créée à la volée au 1er message).
  const convIdRef = useRef<string | null>(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Messages de chargement rotatifs : intervalle ALÉATOIRE (1,4 s à 3,2 s) pour
  // un rythme naturel, pas mécanique.
  useEffect(() => {
    if (!streaming) return;
    setLoadingTick(0);
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      const delay = 1400 + Math.random() * 1800;
      id = setTimeout(() => {
        setLoadingTick((t) => t + 1);
        tick();
      }, delay);
    };
    tick();
    return () => clearTimeout(id);
  }, [streaming]);

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
    // Nouvel ordre aléatoire des phrases de chargement pour cet envoi (fallback
    // si le flux ne remonte pas de statut réel).
    loadingSeqRef.current = makeLoadingSequence();
    setLiveStatus(null);
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

    try {
      // Agent : réponse JSON en UN appel (texte + produits DÉJÀ vérifiés côté
      // serveur). Plus de streaming ni de bloc technique à parser, plus de 2ᵉ
      // appel /recommendations : les cartes sont celles que l'agent a validées.
      // EAN déjà affichés → l'agent les exclut pour que « montre-m'en d'autres »
      // renvoie de NOUVEAUX produits (pas les mêmes).
      const seenEans = Array.from(
        new Set(
          messages.flatMap((m) => (m.products ?? []).map((p) => p.ean)).filter(Boolean),
        ),
      );

      const failRequest = (msg: string) => {
        setError(msg);
        setMessages((prev) => prev.slice(0, -1));
        setStreaming(false);
        setLiveStatus(null);
      };

      // 1) STREAMING d'abord : événements de progression réels pendant la phase
      // outils. Le `result` final est IDENTIQUE au mode bloquant.
      let data: AgentReply | null = null;
      try {
        const r = await apiFetch("/api/advisor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, seen_eans: seenEans, stream: true }),
        });
        if (!r.ok) {
          // apiFetch gère déjà la modale « Crédits épuisés » sur 429 no_credits.
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          failRequest(j.error ?? `Erreur ${r.status}`);
          return;
        }
        const ct = r.headers.get("content-type") ?? "";
        if (ct.includes("text/event-stream") && r.body) {
          data = await consumeAdvisorStream(r.body, (label) => setLiveStatus(label));
        } else {
          // Le proxy/edge a répondu en bloc (streaming indispo) : on lit le JSON.
          data = (await r.json().catch(() => null)) as AgentReply | null;
        }
      } catch {
        data = null; // coupure réseau → fallback bloquant ci-dessous
      }

      // 2) FALLBACK BLOQUANT : si le flux n'a rien donné (runtime sans flux ou
      // coupure), on rejoue en mode bloquant (mêmes données).
      if (!data) {
        const r = await apiFetch("/api/advisor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, seen_eans: seenEans }),
        });
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          failRequest(j.error ?? `Erreur ${r.status}`);
          return;
        }
        data = (await r.json().catch(() => null)) as AgentReply | null;
      }

      setLiveStatus(null);
      if (!data) {
        failRequest("Pas de réponse.");
        return;
      }

      finalContent = (data.reply ?? "").trim() || "Je n'ai pas pu générer de réponse cette fois-ci.";
      finalProducts = Array.isArray(data.products) ? (data.products as AdvisorProduct[]) : [];
      // Mémorise l'intention produit (pilote le bouton). Posée avant le typewriter :
      // les updates de contenu la préservent (spread ...last).
      updateLastAssistant({ productOffer: data.product_offer === "offer" ? "offer" : "none" });

      // Effet « streaming » côté client : 1) le texte se dévoile en machine à
      // écrire (~1,2 s max), 2) PUIS les cartes produit apparaissent.
      const steps = Math.min(finalContent.length, 46);
      const chunk = Math.max(1, Math.ceil(finalContent.length / steps));
      for (let i = chunk; i < finalContent.length; i += chunk) {
        updateLastAssistant({ content: finalContent.slice(0, i) });
        await new Promise((r) => setTimeout(r, 26));
      }
      updateLastAssistant({ content: finalContent });

      if (finalProducts.length > 0) {
        await new Promise((r) => setTimeout(r, 180));
        updateLastAssistant({
          products: finalProducts,
          recoTried: true,
          recoLoading: false,
          recoEmptyReason: null,
          recoRelaxation: null,
          recoCriteria: null,
        });
      }

      // Persiste l'échange (avec produits vérifiés) en arrière-plan.
      persistMessages(userMsg, {
        role: "assistant",
        content: finalContent,
        products: finalProducts,
        recoCriteria: null,
      });
    } catch {
      setError("Connexion interrompue.");
    } finally {
      setStreaming(false);
      setLiveStatus(null);
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

  /**
   * Bouton « Montre-moi des recommandations » (sous la dernière réponse sans
   * produits) : relance l'agent avec l'historique + une demande de reco
   * explicite. Le texte de la bulle ne change pas ; seul le carrousel du
   * message se remplit (skeleton pendant la recherche). Twin mobile.
   */
  async function requestReco(index: number) {
    if (streaming || recoRequesting) return;
    setRecoRequesting(true);
    setError(null);
    setMessages((prev) =>
      prev.map((m, i) => (i === index ? { ...m, recoTried: true, recoLoading: true } : m)),
    );
    const resetButton = () =>
      setMessages((prev) =>
        prev.map((m, i) => (i === index ? { ...m, recoTried: false, recoLoading: false } : m)),
      );
    try {
      const apiMessages = messages
        .slice(0, index + 1)
        .filter((m) => !m.uiOnly)
        .map((m) => ({ role: m.role, content: m.content }));
      const seenEans = Array.from(
        new Set(messages.flatMap((m) => (m.products ?? []).map((p) => p.ean)).filter(Boolean)),
      );
      const r = await apiFetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...apiMessages, { role: "user", content: RECO_REQUEST_PROMPT }],
          seen_eans: seenEans,
        }),
      });
      if (!r.ok) {
        // apiFetch gère déjà la modale « Crédits épuisés » sur 429 no_credits.
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `Erreur ${r.status}`);
        resetButton();
        return;
      }
      const data = (await r.json().catch(() => null)) as { products?: AgentProduct[] } | null;
      const products = Array.isArray(data?.products) ? (data?.products as AdvisorProduct[]) : [];
      setMessages((prev) =>
        prev.map((m, i) =>
          i === index
            ? { ...m, recoLoading: false, products, recoEmptyReason: products.length === 0 ? "none" : null }
            : m,
        ),
      );
    } catch {
      setError("Connexion interrompue.");
      resetButton();
    } finally {
      setRecoRequesting(false);
    }
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
                        <span className="flex gap-2 items-center py-0.5">
                          <span className="flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:300ms]" />
                          </span>
                          <span
                            className="text-[12.5px] font-medium advisor-shimmer"
                            style={{
                              backgroundImage: `linear-gradient(100deg, ${advisorLoadingColor(loadingTick)} 0%, ${advisorLoadingColor(loadingTick)} 42%, #ffffff 50%, ${advisorLoadingColor(loadingTick)} 58%, ${advisorLoadingColor(loadingTick)} 100%)`,
                            }}
                          >
                            {liveStatus ?? loadingSeqRef.current[loadingTick % loadingSeqRef.current.length]}
                          </span>
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

              {/* Bouton « Montre-moi des recommandations » : uniquement sous la
                  DERNIÈRE réponse de l'assistant quand aucune reco n'a été faite. */}
              {m.role === "assistant" &&
              m.productOffer === "offer" &&
              !m.recoTried &&
              !m.uiOnly &&
              m.content &&
              i === messages.length - 1 &&
              !streaming ? (
                <div className="pl-9">
                  <button
                    type="button"
                    onClick={() => requestReco(i)}
                    disabled={recoRequesting}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-[12px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    <span aria-hidden>✨</span>
                    Explorer quelques pistes
                  </button>
                </div>
              ) : null}

              {/* Carrousel produits sous la réponse assistant */}
              {m.role === "assistant" && m.recoTried ? (
                <div className="pl-9">
                  <p className="text-[10px] uppercase tracking-wide text-[#6B7280] mb-2 px-0.5">
                    Quelques pistes à considérer
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
