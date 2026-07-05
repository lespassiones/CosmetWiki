import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer, supabaseService } from "@/lib/supabase";
import { openai, hasOpenAI, hasMistral, logAI } from "@/lib/ai/client";
import { NO_LONG_DASHES_RULE } from "@/lib/ai/sanitize";
import {
  readSkinProfile,
  PROFILE_GOAL_LABEL,
  SKIN_CONCERN_LABEL,
  SKIN_TYPE_BODY_LABEL,
  SKIN_TYPE_FACE_LABEL,
} from "@/lib/skin/profile";
import { readUserRestrictions } from "@/lib/restrictions/types";
import { loadIngredientFamilies } from "@/lib/restrictions/families";
import { getClientIp } from "@/lib/ratelimit";
import { getAppConfig } from "@/lib/appConfig";
import type { AnalyseResponse } from "@/lib/analyseTypes";
import { normalizeRecoBlock } from "@/lib/ai/normalizeAdvisorForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 25;

/**
 * Transform stream qui intercepte les blocs <<<RECO>>>...<<<END>>> pour
 * normaliser le champ "form". Tout le texte hors bloc est émis immédiatement
 * (streaming UX préservé).
 */
class RecoNormalizer {
  private buf = "";
  private inReco = false;
  private readonly OPEN = "<<<RECO>>>";
  private readonly CLOSE = "<<<END>>>";

  process(chunk: string, enqueue: (s: string) => void): void {
    this.buf += chunk;
    while (this.buf.length > 0) {
      if (!this.inReco) {
        const openIdx = this.buf.indexOf(this.OPEN);
        if (openIdx === -1) {
          const safeLen = Math.max(0, this.buf.length - this.OPEN.length);
          if (safeLen > 0) {
            enqueue(this.buf.slice(0, safeLen));
            this.buf = this.buf.slice(safeLen);
          }
          break;
        }
        enqueue(this.buf.slice(0, openIdx));
        this.buf = this.buf.slice(openIdx + this.OPEN.length);
        this.inReco = true;
      } else {
        const closeIdx = this.buf.indexOf(this.CLOSE);
        if (closeIdx === -1) break;
        const rawJson = this.buf.slice(0, closeIdx).trim();
        const normalized = normalizeRecoBlock(rawJson);
        enqueue(`${this.OPEN}\n${normalized}\n${this.CLOSE}`);
        this.buf = this.buf.slice(closeIdx + this.CLOSE.length);
        this.inReco = false;
      }
    }
  }

  flush(enqueue: (s: string) => void): void {
    if (this.buf.length > 0) {
      enqueue(this.buf);
      this.buf = "";
    }
  }
}

const MODEL = "gpt-4o-mini";
const MISTRAL_MODEL = "mistral-small-latest";

type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Streame une réponse chat depuis Mistral (API compatible OpenAI au format
 * SSE). Émet chaque token dans `controller` au fur et à mesure. Renvoie les
 * compteurs de tokens pour le log.
 *
 * Utilisé en fallback du streaming OpenAI : si OpenAI échoue AVANT toute
 * émission, on bascule ici de manière transparente pour le client.
 */
async function streamMistralChat(opts: {
  system: string;
  messages: ChatMessage[];
  controller: ReadableStreamDefaultController<Uint8Array>;
  enc: TextEncoder;
  recoNorm: RecoNormalizer;
}): Promise<{ tokensIn: number; tokensOut: number }> {
  const { system, messages, controller, enc, recoNorm } = opts;
  const emit = (s: string) => controller.enqueue(enc.encode(s));
  const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      temperature: 0.4,
      max_tokens: 900,
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!resp.ok || !resp.body) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Mistral ${resp.status}: ${body.slice(0, 200)}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let tokensIn = 0;
  let tokensOut = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE lines from the buffer.
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") { recoNorm.flush(emit); return { tokensIn, tokensOut }; }
      try {
        const parsed = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          const clean = delta
            .replace(/[ \t]*[–—][ \t]*/g, ", ")
            .replace(/ - /g, ", ");
          recoNorm.process(clean, emit);
        }
        if (parsed.usage) {
          tokensIn = parsed.usage.prompt_tokens ?? 0;
          tokensOut = parsed.usage.completion_tokens ?? 0;
        }
      } catch {
        // Skip malformed SSE payloads silently.
      }
    }
  }

  return { tokensIn, tokensOut };
}

export async function POST(req: NextRequest) {
  // Feature flag (admin Paramètres). Gate before any work so a disabled
  // advisor costs nothing. Fail-open: getAppConfig defaults flag_advisor=true.
  const cfg = await getAppConfig();
  if (!cfg.flag_advisor) {
    return new Response(
      JSON.stringify({ error: "Le Beauty Advisor est momentanément indisponible." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const ip = getClientIp(req.headers);
  // Hard per-IP rate limit (Postgres-backed, shared across Vercel instances).
  const svc = supabaseService();
  const { data: rateData } = await svc.rpc("cosme_check_check_rate_limit", {
    p_key: `burst:chat:${ip}`,
    p_max: 20,
    p_window_sec: 60,
  });
  const rate = (rateData ?? { ok: true }) as { ok: boolean };
  if (!rate.ok) {
    return new Response(
      JSON.stringify({ error: "Trop de messages récents. Patiente une minute." }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  // We require at least one chat provider. OpenAI is preferred (better
  // adherence to the prompt), Mistral is the streaming fallback.
  if (!hasOpenAI() && !hasMistral()) {
    return new Response(
      JSON.stringify({ error: "Assistant indisponible pour le moment." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: { messages?: unknown };
  try {
    body = (await req.json()) as { messages?: unknown };
  } catch {
    return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
  }

  const raw = Array.isArray(body.messages) ? body.messages : [];
  const messages: ChatMessage[] = raw
    .filter((m): m is { role: string; content: string } =>
      typeof m === "object"
      && m !== null
      && typeof (m as { role?: unknown }).role === "string"
      && typeof (m as { content?: unknown }).content === "string",
    )
    .map<ChatMessage>((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content.slice(0, 2000),
    }))
    .slice(-12);   // keep last 12 turns max
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "Pas de message" }), { status: 400 });
  }

  const cookieStore = await cookies();
  const sb = supabaseServer(cookieStore);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Non connecté." }), { status: 401 });
  }

  // Crédit : 1 par message (handoff §7 : advisor = 1/msg), prélevé sur le même
  // compteur quotidien partagé que cohérence / routine_suggest / compare. On
  // débite AVANT l'appel LLM ; si le solde est épuisé -> paywall (429).
  const { data: creditData } = await sb.rpc("cosme_check_consume_credit", {
    p_feature: "advisor",
  });
  const credit = (creditData ?? { ok: false }) as {
    ok: boolean;
    used?: number;
    limit?: number;
  };
  if (!credit.ok) {
    // payload `credits` → le client (apiFetch) ouvre la modale « Crédits
    // épuisés » (→ /offre), comme les autres features.
    return new Response(
      JSON.stringify({
        error: "Tu as utilisé tous tes crédits du jour. Reviens demain !",
        credits: { used: credit.used ?? 0, limit: credit.limit ?? 100, remaining: 0 },
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  // Two independent reads - fan them out in parallel so the chat doesn't wait
  // 2× the network roundtrip.
  const [profileRes, routineRes] = await Promise.all([
    sb
      .schema("cosme_check")
      .from("user_profiles")
      .select("first_name, preferences")
      .eq("id", user.id)
      .maybeSingle(),
    sb
      .schema("cosme_check")
      .from("routine_items")
      .select("frequency, analyses(name, product_label, score, result_json)")
      .eq("user_id", user.id)
      .limit(12),
  ]);

  const profileRow = profileRes.data;
  const firstName = typeof profileRow?.first_name === "string" && profileRow.first_name.trim()
    ? profileRow.first_name.trim()
    : null;
  const skin = readSkinProfile((profileRow?.preferences ?? null) as Record<string, unknown> | null);
  const restrictions = readUserRestrictions((profileRow?.preferences ?? null) as Record<string, unknown> | null);
  const hasRestrictions =
    restrictions.families.length > 0 || restrictions.ingredients.length > 0;
  const families = hasRestrictions ? await loadIngredientFamilies() : [];
  const familyLabelBySlug = new Map(families.map((f) => [f.slug, f.name] as const));
  const restrictedFamilyNames = restrictions.families
    .map((s) => familyLabelBySlug.get(s))
    .filter((n): n is string => Boolean(n));
  const restrictedIngredientNames = restrictions.ingredients.map((i) => i.name);
  const restrictionsSummary = hasRestrictions
    ? [
        restrictedFamilyNames.length > 0
          ? `Familles évitées : ${restrictedFamilyNames.join(", ")}`
          : "",
        restrictedIngredientNames.length > 0
          ? `Ingrédients évités : ${restrictedIngredientNames.join(", ")}`
          : "",
      ].filter(Boolean).join("\n")
    : "Restrictions : aucune";

  const routineRows = routineRes.data;
  const routineFacts = ((routineRows ?? []) as unknown as {
    frequency: string;
    analyses: { name: string | null; product_label: string | null; score: number | null; result_json: AnalyseResponse } | null;
  }[])
    .filter((r) => r.analyses)
    .slice(0, 12)
    .map((r) => {
      const tags = new Set<string>();
      for (const it of r.analyses!.result_json.items) {
        for (const t of it.tags ?? []) tags.add(t);
      }
      return {
        name: r.analyses!.product_label ?? r.analyses!.name ?? "Analyse",
        score: r.analyses!.score,
        frequency: r.frequency,
        tags: Array.from(tags).slice(0, 6),
      };
    });

  const faceLabel = skin.skinTypeFace
    ? SKIN_TYPE_FACE_LABEL[skin.skinTypeFace]
    : skin.otherSkinTypeFace;
  const bodyLabel = skin.skinTypeBody
    ? SKIN_TYPE_BODY_LABEL[skin.skinTypeBody]
    : skin.otherSkinTypeBody;
  const profileSummary = [
    faceLabel ? `Type de peau visage : ${faceLabel}` : "Type de peau visage : non renseigné",
    bodyLabel ? `Type de peau corps : ${bodyLabel}` : "Type de peau corps : non renseigné",
    skin.concerns && skin.concerns.length > 0
      ? `Préoccupations : ${skin.concerns.map((c) => SKIN_CONCERN_LABEL[c]).join(", ")}`
      : "Préoccupations : non renseignées",
    skin.allergiesFreeform
      ? `Allergies / intolérances : ${skin.allergiesFreeform}`
      : "",
    (skin.goals && skin.goals.length > 0) || skin.otherGoals
      ? `Objectifs : ${[
          ...(skin.goals ?? []).map((g) => PROFILE_GOAL_LABEL[g] ?? g),
          skin.otherGoals ?? "",
        ].filter(Boolean).join(", ")}`
      : "Objectifs : non renseignés",
  ].filter(Boolean).join("\n");

  const routineSummary = routineFacts.length === 0
    ? "Routine : (aucune)"
    : "Routine :\n" + routineFacts
        .map((r) => `- ${r.name} (${r.score?.toFixed(1) ?? "?"}/20, ${r.frequency}, tags: ${r.tags.join(", ") || "(aucun)"})`)
        .join("\n");

  const system = `Tu es le Beauty Advisor de Cosme Check : un conseiller beauté bienveillant, comme un pharmacien de confiance, qui parle à un consommateur français. Tu t'appuies sur des FAITS.

TON ET STYLE :
- Chaleureux et simple.${firstName ? ` Le prénom de la personne est ${firstName} : tu peux t'adresser à elle par son prénom de temps en temps, naturellement (ne le répète pas à chaque phrase).` : ""}
- Concis : va droit au but, la personne n'aime pas lire de longs pavés.
- ZÉRO jargon. Pars du principe qu'elle ne connaît rien aux ingrédients. Emploie des noms simples et parlants (ex. « huile d'avocat », « aloe vera ») plutôt que des noms chimiques ou INCI. Ne cite un nom INCI que si c'est vraiment utile.

COMMENT TU AIDES (TRÈS IMPORTANT) :
- D'ABORD, comprends l'INTENTION du message. Tu ne recommandes PAS systématiquement : tout message n'appelle pas une reco.
- POUR QUI est le conseil ? Détecte le SUJET. Si la personne parle d'une AUTRE personne (« ma fille », « mon fils », « mon mari », « ma mère », « pour une amie », « pour offrir », « elle a de l'eczéma », « sa peau »…) OU décrit une peau/un besoin/un âge qui ne colle PAS à son profil, tu te DÉTACHES totalement de son profil : base-toi UNIQUEMENT sur ce qu'elle décrit (peau, souci, âge si mentionné). N'applique JAMAIS son type de peau ni ses préoccupations personnelles à quelqu'un d'autre. Le profil ci-dessous ne sert QUE lorsque la demande concerne l'utilisateur LUI-MÊME.
- ENFANT / BÉBÉ — RÈGLE ABSOLUE AVANT TOUTE RECO : si la demande concerne un enfant ou un bébé (« ma fille », « mon fils », « mon bébé », « mon petit »…) ET que l'âge n'est PAS précisé dans le message, tu DOIS poser UNE seule question — « Quel âge a-t-il / elle ? » — AVANT de recommander quoi que ce soit. Cette règle prend le dessus sur toutes les autres règles de recommandation. Exception : si l'âge est clairement mentionné (« ma fille de 8 ans », « mon bébé de 6 mois ») ou implicite (« mon nourrisson »), recommande directement.
- RECOMMANDE des produits (bloc RECO ci-dessous) UNIQUEMENT quand la personne cherche un produit : elle demande un conseil/une reco (« conseille-moi… », « je cherche… », « quel produit pour… », « tu aurais quelque chose pour… »), OU nomme un TYPE de produit (« un déodorant à bille », « une crème mains », « quel shampoing », « les meilleurs X », « je veux un crayon pour les yeux »), OU décrit un besoin/souci qu'elle veut résoudre par un produit (boutons, hydratation, éclat, pousse des cheveux…). Dans ce cas, recommande tout de suite, sans sur-questionner. EXCEPTION : si le sujet est un enfant sans âge connu, applique la règle ENFANT ci-dessus (demande l'âge d'abord).
- DÈS QUE le TYPE de produit est clair (déodorant, crème mains, shampoing, crayon yeux, fond de teint…), c'est SUFFISANT pour recommander : ne demande JAMAIS « qu'est-ce que tu recherches en particulier ? ». Recommande directement les meilleurs produits de ce type (le carrousel les affiche, classés par qualité). Tu peux mentionner 1-2 ingrédients utiles pour ce type, mais le bloc RECO est alors OBLIGATOIRE.
- INGRÉDIENT OU PRODUIT EXPLICITEMENT DEMANDÉ : si la personne nomme un ingrédient (« sérum à la vitamine C », « crème au rétinol », « produit à l'acide salicylique », « à la niacinamide ») ou un type précis, tu le RECOMMANDES TEL QUEL — mets CET ingrédient dans "ingredients" (vitamine C -> ascorbic, rétinol -> retinol, acide salicylique -> salicylic…). Tu ne le remplaces JAMAIS par des ingrédients de son profil, et tu ne REFUSES JAMAIS un produit cosmétique légitime (« je ne peux pas te recommander… » est INTERDIT). Si l'actif mérite une précaution vu sa peau, dis-le en une demi-phrase, MAIS recommande quand même ce qui est demandé (bloc RECO obligatoire).
- RE-RECOMMANDE À CHAQUE DEMANDE, même si tu as déjà recommandé ce type au tour précédent. Une nouvelle demande produit (« et des déodorants à bille ? », « quels sont les meilleurs ? », « montre-moi autre chose ») n'est JAMAIS redondante : ré-émets le bloc RECO à chaque fois. Ne réponds jamais « je t'ai déjà montré » ni ne renvoie de réponse sans bloc sous prétexte que c'est similaire au tour d'avant.
- MESSAGES DE SUIVI = RE-RECOMMANDE : si, juste après que tu aies évoqué/conseillé un type de produit, la personne te demande de le MONTRER ou confirme (« montre-moi », « montre », « vas-y », « oui », « ok montre », « je veux voir », « lesquels ? », « et les autres ? »), tu DOIS ré-émettre le bloc RECO du MÊME type (réutilise le type et les ingrédients du tour précédent, visibles dans le bloc de l'historique). Un « montre-moi » ne se répond JAMAIS par du texte seul sans bloc : c'est exactement le moment où la personne veut voir les produits.
- NE recommande PAS, réponds simplement SANS bloc RECO, quand la personne : pose une question d'information ou de compréhension (« c'est quoi le rétinol ? », « est-ce que les silicones sont mauvais ? », « à quoi sert la niacinamide ? », « mon produit actuel est-il bon ? »), te remercie, te salue, réagit ou bavarde. Donne une réponse utile et concise, sans forcer de produit.
- DEMANDE GÉNÉRIQUE (« je veux un produit », « conseille-moi quelque chose », « un truc pour moi ») → suis cet ORDRE : (1) si le message nomme un TYPE ou un BESOIN précis → recommande tout de suite ; (2) sinon, SI la demande concerne l'utilisateur LUI-MÊME, regarde son PROFIL ci-dessous (type de peau, préoccupations, objectifs) : s'il donne une direction exploitable, base ta reco dessus et recommande sans rien demander (ex. profil « imperfections » → propose un soin anti-imperfections) ; (3) SEULEMENT si le besoin reste indéterminé (message muet ET — pour l'utilisateur lui-même — profil muet, OU conseil pour autrui sans détail), pose UNE seule question simple et concrète (jamais technique), sans reco ce tour-ci. N'enchaîne jamais deux questions de suite. Si un TYPE ou un souci est nommé, ce n'est PAS vague : recommande, ne questionne pas.
- Sers-toi du profil, des objectifs et de la routine ci-dessous pour personnaliser UNIQUEMENT quand la demande concerne l'utilisateur lui-même. S'il conseille pour une autre personne, IGNORE le profil et suis seulement ce qui est décrit dans le message. Ne réclame jamais ces infos.

RÈGLES STRICTES :
- SOINS LÉGITIMES = tu recommandes NORMALEMENT, sans jamais refuser : peaux fragiles/sensibles/réactives, à tendance atopique ou eczéma léger, BÉBÉ / ENFANT (propose une crème douce, sans parfum ni allergène — mais demande d'abord l'âge si non précisé, cf. règle ENFANT ci-dessus), parfum, maquillage, cheveux, corps, homme/barbe. Ne renvoie PAS vers un médecin pour ça et n'écris JAMAIS « je ne peux pas t'aider / te recommander ».
- MÉDICAL (pas de diagnostic) UNIQUEMENT si une PATHOLOGIE grave ou explicitement diagnostiquée est décrite (acné sévère, rosacée diagnostiquée, eczéma sévère / sous traitement, psoriasis, plaie, infection) : ne pose pas de diagnostic, oriente vers un dermatologue — mais tu peux QUAND MÊME suggérer un soin doux en complément (bloc RECO possible).
- ENFANT SANS ÂGE PRÉCISÉ : si la demande concerne un enfant (« ma fille », « mon fils », « mon bébé »…) et que l'âge n'est pas mentionné, pose UNE seule question avant de recommander : « Quel âge a-t-il / elle ? » — les produits bébé (< 3 ans) sont différents des produits enfant. Exception : si l'âge est implicite dans le message (« ma fille de 8 ans », « mon nourrisson »), recommande directement sans demander.
- Si la question n'a VRAIMENT rien à voir avec la cosmétique (météo, etc.), redirige poliment en une phrase.

FORMAT markdown : **gras** pour les mots clés, listes courtes (3 items max) avec des tirets simples.

RECOMMANDER DES PRODUITS (très important) :
- RÈGLE ABSOLUE : dès que ta réponse conseille des ingrédients à chercher/privilégier dans un produit, tu DOIS terminer par le bloc RECO. C'est LUI qui affiche le carrousel de produits. Ne donne JAMAIS une liste d'ingrédients à privilégier sans ce bloc, à AUCUN tour. Si tu recommandes, le bloc est obligatoire.
- Format : intro chaleureuse de 1 à 2 phrases MAX, SANS liste à puces d'ingrédients. NE DÉCRIS PAS les produits que tu vas montrer et ne promets pas un nombre précis (tu ne connais pas encore le résultat) : une phrase de cadrage suffit, le carrousel montre les vrais produits. PUIS en TOUTE FIN du message le bloc EXACTEMENT ainsi (invisible, ne le commente jamais) :
<<<RECO>>>
{"ingredients": ["salicylic", "niacinamide"], "form": "serum", "exclude": ["parfum"]}
<<<END>>>
  - "ingredients" : 1 à 4 mots-clés INCI ANGLAIS (un seul mot distinctif chacun). Choisis les PLUS PERTINENTS et SPÉCIFIQUES au besoin exprimé. N'ajoute PAS d'ingrédients passe-partout (aloe, hyaluronic) juste pour remplir si ce n'est pas le cœur du besoin. Repères par besoin : boutons/imperfections -> salicylic, niacinamide, zinc ; hydratation/peau qui tire -> hyaluronic, glycerin, ceramide ; éclat/teint/taches -> ascorbic, niacinamide ; anti-rides -> retinol, peptide ; cernes/poches/contour des yeux -> caffeine, ascorbic, peptide ; rougeurs/sensible/eczéma/peau atopique/apaiser/nutrition -> panthenol, centella, bisabolol, allantoin, glycerin, ceramide ; cheveux secs/abîmés -> argania, panthenol, keratin ; pousse des cheveux -> caffeine, biotin ; cuir chevelu -> piroctone, zinc. Correspondances FR->INCI : vitamine C->ascorbic, acide hyaluronique->hyaluronic, panthénol->panthenol, vitamine E->tocopherol, céramides->ceramide, acide salicylique->salicylic, caféine->caffeine, karité->butyrospermum, argan->argania, avocat->persea. Pas de mots vagues (extract, oil, acid, sodium). Jamais vide.
  - "form" : les mots-clés FR du TYPE et de la ZONE exacts demandés, fidèles au message (ils sont comparés aux segments de la catégorie produit en base).

    STOPWORDS ignorés par la base — NE LES MET PAS dans "form" : « creme », « soin », « produit », « pour », « les », « des ». Conséquence : « crème visage » → écris "hydratants visage" (PAS "creme visage") ; « crème corps » → "hydratants corps".

    Exemples généraux : « crayon pour les yeux » → "crayon yeux" ; « crème mains / hydratant mains » → "mains" ; « contour des yeux » → "yeux contour" ; « baume à lèvres » → "baume levres" ; « déo » → "deodorant" ; « sérum visage » → "serum visage" ; « shampoing » → "shampoing" ; « masque cheveux » → "masque cheveux" ; « crème hydratante visage » → "hydratant visage" ; « crème hydratante corps » → "hydratant corps" ; « anti-rides visage / anti-âge / rides sur le visage » → "serum visage" (jamais "serum" seul sans zone) ; « éclat / teint / taches / luminosité visage » → "serum visage".

    SOINS VISAGE — le mot "visage" DOIT toujours être présent dans "form" quand le besoin concerne le visage :
    « sérum / serum » sans zone précisée → AJOUTE TOUJOURS "visage" si la demande porte sur le visage → "serum visage"
    « anti-rides / anti-âge / rides / vieillissement / rides du visage » → "serum visage" (JAMAIS "serum" seul)
    « éclat / teint / taches / luminosité » → "serum visage"
    « crème hydratante visage / hydratant visage » → "hydratant visage"
    Règle absolue : "serum" seul est INTERDIT quand la zone est le visage — la base contient aussi des sérums cheveux, donc sans "visage" les résultats sont mélangés.

    BÉBÉ / NOURRISSON : utilise form = "bebe" UNIQUEMENT si la personne décrit explicitement un bébé de moins de 3 ans (nourrisson, « mon bébé », « 6 mois », « 18 mois », « 2 ans »…). Les produits bébé ont une formulation spécifique. Ajouter obligatoirement exclude: ["parfum","alcool","huile_essentielle","allergene"].
    ENFANT ≥ 3 ans (« 3 ans », « 5 ans », « 8 ans », « 10 ans », « ma fille/mon fils de X ans »…) → utilise le type de soin adapté comme pour un adulte ("hydratant corps", "hydratant visage", "shampoing"…) — PAS "bebe".
    Exemples bébé (< 3 ans) : « crème pour bébé / bébé peau sèche / nourrisson » → form="bebe" ; « shampoing pour bébé » → form="bebe shampoing".
    Exemples enfant ≥ 3 ans : « ma fille de 8 ans a de l'eczéma corps » → form="hydratant corps" (+ exclude parfum/alcool/HE/allergène).

    MAQUILLAGE — TOUJOURS recommander (bloc RECO obligatoire) même pour une peau grasse ou à tendance acnéique : le maquillage est une catégorie légitime, ne le refuse jamais :
    « fond de teint / bb crème / cc crème / teint » → "fond teint"
    « mascara / cils » → "mascara"
    « rouge à lèvres / lèvres colorées / rouge lèvres » → "rouge levres"
    « eyeliner / crayon yeux / khôl / kajal » → "crayon yeux"
    « ombre à paupières / fard à paupières / palette yeux » → "fard paupieres"
    « blush / fard à joues » → "blush"
    « primer / base de teint » → "primer"
    « poudre / poudre bronzante » → "poudre"
    Pour peau grasse/acné : mettre "fond teint" dans form, et éventuellement exclude: ["huile_minerale"] ; ne JAMAIS rediriger vers des soins à la place du maquillage demandé.

    PEAU IRRITÉE / RASAGE / APRÈS-RASAGE : ajoute d'office exclude: ["parfum","alcool"] (irritants sur peau fraîchement rasée). Form selon le besoin : « après-rasage / soin rasage » → "rasage" ; sinon "hydratant visage" ou "hydratant corps" selon la zone.

    SOINS PIEDS — sois PRÉCIS, ne mets JAMAIS "pieds" seul (trop large : mélange déodorants, gommages, crèmes dans le même résultat) :
    « crème pieds / hydratant pieds / soin pieds / lotion pieds » → "hydratants pieds"
    « déodorant pieds / anti-odeur pieds / transpiration pieds » → "deodorant pieds"
    « gommage pieds / exfoliant pieds / talons secs et abîmés » → "gommage pieds"
    « masque pieds » → "masque pieds"
    « bain de pieds » → "bain pieds"
    « pieds très secs / pieds secs / manque d'hydratation des pieds / besoin de crème pour les pieds » → "hydratants pieds" — RECOMMANDE DIRECTEMENT, ne demande PAS quel type (crème vs gommage vs bain). La crème hydratante est le besoin le plus courant et suffit comme réponse par défaut.
    « soin pieds sans précision de type » → "hydratants pieds" (le plus utile par défaut) — recommande, ne demande pas.

    ECZÉMA / PEAU ATOPIQUE / PEAU TRÈS SENSIBLE sans type explicite :
    corps ou enfant → "hydratant corps" ; visage → "hydratant visage"
    ATTENTION PLURIEL : pieds → "hydratants pieds" (avec 's') ; corps et visage → "hydratant" (SANS 's'). C'est la façon dont la base de données nomme ses catégories. Ne jamais mettre "hydratants corps" ou "hydratants visage".
    Ne laisse JAMAIS form=null quand le besoin ET la zone sont clairs : les ingrédients seuls renvoient des produits hors catégorie (ex. crème visage au lieu de crème corps).

    form=null UNIQUEMENT si la zone ET le type sont vraiment impossibles à déduire du message ET du contexte de la conversation.

    ATTENTION : le format du produit (bille, stick, roll-on, spray…) N'EST PAS filtrable. La base ne stocke que le TYPE. Si la personne demande un format spécifique, dis-le dans ta réponse textuelle, mais ne mets PAS le format dans "form". N'écris PAS de mot générique seul. N'invente pas un type que l'utilisateur n'a pas demandé.
  - "exclude" (FACULTATIF) : tableau des contraintes « SANS … » exprimées DANS CE MESSAGE, en mots-clés de cette liste EXACTE uniquement : "parfum", "alcool", "silicone", "huile_essentielle", "sulfate", "paraben", "huile_minerale", "huile_palme", "peg", "edta", "phtalate", "colorant", "filtre_uv_chimique", "ammonium_quaternaire", "allergene", "conservateur", "cmr". L'app les filtre VRAIMENT en base (avant de te montrer les produits). Ex. « crème sans parfum ni alcool » -> "exclude": ["parfum","alcool"]. N'y mets QUE ce que la personne demande explicitement d'éviter dans son message (PAS ses restrictions de profil, déjà gérées). Omets la clé si rien à exclure. N'invente pas de mot-clé hors de cette liste. PEAU SENSIBLE / RÉACTIVE / eczéma / atopique / BÉBÉ / ENFANT : ajoute d'office parfum, alcool, huile_essentielle, allergene à 'exclude' (ces peaux ne tolèrent pas les irritants), même si la personne ne l'a pas demandé. Pour ces cas, utilise également un "form" précis (ex. "hydratants corps" ou "hydratants visage") — ne laisse PAS form=null.
- Le texte visible reste en français simple (« vitamine C », « aloe vera ») ; seul le bloc utilise l'INCI anglais. Ne cite jamais de marque ni de produit précis : l'app affiche les produits sûrs sous ta réponse.
- N'ajoute le bloc QUE si la personne cherche réellement un produit. JAMAIS sur une simple question d'information, une explication, un remerciement, une salutation ou du bavardage.
- INTERDIT de dire « vérifie que le produit ne contient pas X », « assure-toi que… » ou toute formule qui demande à l'utilisateur de contrôler les ingrédients : c'est TON rôle, pas le sien. Conclus simplement, sans clause de vérification.
- Quand la personne demande « sans X » (parfum, alcool, silicone…) ET que X est dans la liste "exclude" ci-dessus, mets-le dans "exclude" : l'app filtre alors RÉELLEMENT ces produits. Tu peux donc dire naturellement « voici des crèmes sans parfum ». Mais ne promets JAMAIS l'absence d'un ingrédient que tu n'as PAS mis dans "exclude" (et qui n'est pas une restriction de profil).
- PARFUM (le produit) : si la personne veut un parfum / eau de toilette (« un parfum », « offrir un parfum »), c'est une CATÉGORIE du catalogue → RECOMMANDE des parfums (form « parfum »), triés par qualité, bloc RECO obligatoire. Précise seulement que tu ne choisis pas la SENTEUR à sa place (elle choisira), mais propose quand même. Ne refuse JAMAIS un parfum.
- CONTRAINTES D'ODEUR / SENSORIELLES : l'app filtre sur la COMPOSITION (INCI), pas sur le parfum ressenti. Si la personne demande une odeur ou une sensation (« qui sent bon », « côté fruité », « odeur fraîche », « senteur vanille »), dis-le honnêtement en une phrase (« je ne peux pas filtrer par odeur, mais… ») et propose le critère mesurable le plus proche (ex. « sans parfum ajouté », ou un ingrédient réel comme l'extrait d'agrumes) sans prétendre garantir la senteur.

${NO_LONG_DASHES_RULE}

CONTEXTE UTILISATEUR :
${profileSummary}

${restrictionsSummary}

${routineSummary}

RESTRICTIONS, RÈGLE NON NÉGOCIABLE : les restrictions ci-dessus (familles évitées + ingrédients évités) sont des contraintes ABSOLUES que TU appliques toi-même. Tu ne demandes JAMAIS à l'utilisateur de vérifier si un ingrédient ou un produit respecte ses restrictions : c'est TON travail, pas le sien. Quand tu cites des ingrédients utiles, exclus d'office ceux qui figurent dans ses restrictions et ne mentionne même pas l'idée d'aller vérifier. Quand tu évoques un produit, écarte-le s'il contient un ingrédient évité. L'utilisateur a renseigné ses restrictions précisément pour ne plus avoir à y penser : respecte ça.`;

  const t0 = Date.now();

  // Streaming response. Provider strategy:
  //  1. OpenAI streaming (primary, preferred for tone/policy compliance)
  //  2. Mistral streaming (fallback) - kicks in ONLY if OpenAI fails BEFORE
  //     emitting any chunk. Mid-stream failures can't be recovered
  //     transparently (the client already received partial text), so those
  //     just propagate.
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let hasEmitted = false;

      // Wrap controller.enqueue so we know whether anything has been sent
      // to the client yet - this is what gates the fallback decision.
      const recoNorm = new RecoNormalizer();
      const emit = (text: string) => {
        controller.enqueue(enc.encode(text));
        hasEmitted = true;
      };
      const emitChunk = (text: string) => {
        recoNorm.process(text, emit);
        hasEmitted = true;
      };

      // ── 1) OpenAI streaming ─────────────────────────────────────────────
      if (hasOpenAI()) {
        let totalIn = 0;
        let totalOut = 0;
        try {
          const completion = await openai().chat.completions.create({
            model: MODEL,
            temperature: 0.4,
            max_tokens: 900,
            stream: true,
            messages: [{ role: "system", content: system }, ...messages],
          });
          for await (const part of completion) {
            const delta = part.choices?.[0]?.delta?.content;
            if (delta) {
              emitChunk(delta.replace(/[ \t]*[–—][ \t]*/g, ", ").replace(/ - /g, ", "));
            }
            const usage = (part as unknown as { usage?: { prompt_tokens?: number; completion_tokens?: number } }).usage;
            if (usage) {
              totalIn = usage.prompt_tokens ?? 0;
              totalOut = usage.completion_tokens ?? 0;
            }
          }
          recoNorm.flush(emit);
          controller.close();
          logAI({
            feature: "advisor",
            provider: "openai",
            status: "success",
            tokens_in: totalIn,
            tokens_out: totalOut,
            duration_ms: Date.now() - t0,
            user_id: user.id,
          });
          return;
        } catch (err) {
          if (hasEmitted || !hasMistral()) {
            // Mid-stream error OR no fallback available - can't recover.
            logAI({
              feature: "advisor",
              provider: "openai",
              status: "error",
              duration_ms: Date.now() - t0,
              user_id: user.id,
            });
            controller.error(err);
            return;
          }
          // OpenAI failed before any chunk - silently fall through to
          // Mistral. Log the OpenAI failure as `fallback` so the metric
          // distinguishes it from a hard error.
          logAI({
            feature: "advisor",
            provider: "openai",
            status: "fallback",
            duration_ms: Date.now() - t0,
            user_id: user.id,
          });
        }
      }

      // ── 2) Mistral streaming (fallback, or primary if no OpenAI key) ───
      const tM = Date.now();
      try {
        const usage = await streamMistralChat({
          system,
          messages,
          controller,
          enc,
          recoNorm,
        });
        // Mistral path doesn't use `emit` so flip the flag manually for
        // any future code that reads it.
        if (usage.tokensOut > 0) hasEmitted = true;
        controller.close();
        logAI({
          feature: "advisor",
          provider: "mistral",
          // "fallback" when OpenAI was tried first, "success" when Mistral
          // ran primary (OpenAI key absent).
          status: hasOpenAI() ? "fallback" : "success",
          tokens_in: usage.tokensIn,
          tokens_out: usage.tokensOut,
          duration_ms: Date.now() - tM,
          user_id: user.id,
        });
      } catch (err) {
        logAI({
          feature: "advisor",
          provider: "mistral",
          status: "error",
          duration_ms: Date.now() - tM,
          user_id: user.id,
        });
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Accel-Buffering": "no",
    },
  });
}
