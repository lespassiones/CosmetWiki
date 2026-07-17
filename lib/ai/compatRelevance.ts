/**
 * lib/ai/compatRelevance.ts — GATING DÉTERMINISTE de la compatibilité (port web
 * de supabase/functions/personal-insights/relevance.ts). Décide AVANT tout appel
 * IA / débit si le produit relève d'un axe du profil (peau/cheveux) et si cet
 * axe est renseigné :
 *   - "product_only"        → hors profil (dentifrice, déo…). Jamais bloqué.
 *   - "personal"            → axe renseigné → score personnalisé.
 *   - "profile_incomplete"  → axe vide → renvoie compléter la section manquante.
 * Pur et autonome (aucune dépendance) → testable.
 */

export type ProfileAxis = "skin" | "hair" | "none";

export type SkinProfileLike = {
  skinTypeFace?: string;
  otherSkinTypeFace?: string;
  skinTypeBody?: string;
  otherSkinTypeBody?: string;
  concerns?: readonly string[];
  hairConcerns?: readonly string[];
  otherConcerns?: string;
  otherHair?: string;
  otherHairConcerns?: string;
  allergiesFreeform?: string;
  goals?: readonly string[];
  otherGoals?: string;
  otherGoalsFace?: string;
  otherGoalsBody?: string;
  otherGoalsHair?: string;
  otherGoalsRoutine?: string;
};

const HAIR_GOAL_SET = new Set<string>([
  "cheveux_brillants",
  "renforcer_cheveux",
  "definir_boucles",
  "cuir_chevelu_sain",
  "reduire_chute",
]);

const HAIR_RE =
  /(shampo|apres[- ]?shampo|après[- ]?shampo|capillaire|cheveu|coiffant|coiffage|revitalisant|conditionn|d[ée]m[êe]l|masque cheveux|soin cheveux|laque|gel coiffant|mousse coiffante|coloration|teinture|balayage|cuir chevelu|antipellicul|anti[- ]?pellicul|pellicul)/i;

const NONE_RE =
  /(dentifrice|brosse[- ]?[àa][- ]?dents|bain de bouche|bucco|dentaire|fil dentaire|d[ée]odorant|anti[- ]?transpirant|accessoire|coton|lingette|éponge|eponge|parfum|eau de toilette|eau de parfum|bougie|maison|m[ée]nage|hygi[èe]ne intime|rasage|compl[ée]ment|v[ée]t[ée]rinaire)/i;

const SKIN_RE =
  /(visage|corps|peau|cr[èe]me|s[ée]rum|lait|gommage|masque|nettoyant|d[ée]maquillant|tonique|lotion|contour|solaire|soleil|spf|hydratant|baume|gel douche|douche|mains?|pieds?|anti[- ]?[âa]ge|fond de teint|bb[- ]?cr[èe]me|correcteur|blush|teint|exfoliant|s[ée]bum|acn[ée])/i;

/** TABLE de mapping par SLUG (cartographie réelle du catalogue, juil 2026). */
const SLUG_AXIS: Record<string, ProfileAxis> = {
  "hygiene-du-corps/produit-de-bain": "skin",
  "hygiene-du-corps/savon": "skin",
  "hygiene-du-corps/gel-douche": "skin",
  "hygiene-du-corps/deodorant": "none",
  "hygiene-du-corps/hygiene-intime": "none",
  "hygiene-du-corps/papier-toilette-humide": "none",
  "hygiene-du-corps/anti-poux": "hair",
  "maquillage/fond-de-teint-et-poudre": "skin",
  "maquillage/demaquillant": "skin",
  "maquillage/fixateur-de-maquillage": "skin",
  "maquillage/maquillage-a-levres": "none",
  "maquillage/maquillage-des-yeux": "none",
  "maquillage/accessoires-de-maquillage": "none",
  "maquillage/coffret-de-maquillage": "none",
  "maquillage/palette-de-maquillage": "none",
  "maquillage/paillettes": "none",
  "maquillage/encre-et-peinture-corporelle": "none",
  "maquillage/maquillage-de-fete": "none",
  "maquillage/tatouages-ephemeres": "none",
  "rasage-et-epilation/mousse-et-gel-de-rasage": "skin",
  "rasage-et-epilation/apres-rasage": "skin",
  "rasage-et-epilation/huile-de-rasage": "skin",
  "rasage-et-epilation/epilation-et-cire": "skin",
  "rasage-et-epilation/soin-de-la-barbe": "none",
  "rasage-et-epilation/lames-de-rasoir": "none",
  "rasage-et-epilation/rasoir-corps": "none",
  "rasage-et-epilation/rasoir-barbe": "none",
  "bien-etre/massage": "skin",
  "bien-etre/huile-essentielle": "none",
  "bien-etre/sommeil-et-produit-de-relaxation": "none",
  "soin-du-corps-et-visage": "skin",
  "produit-solaire": "skin",
  "coiffure": "hair",
  "parfum": "none",
  "hygiene-dentaire": "none",
  "manucure-et-pedicure": "none",
  "soin-et-hygiene-bebe": "none",
  "sante": "none",
  "bien-etre": "none",
  "hygiene-du-corps": "skin",
  "maquillage": "skin",
  "rasage-et-epilation": "skin",
};

export function categoryToAxis(category: string | null | undefined): ProfileAxis {
  if (!category) return "none";
  const c = category.toLowerCase().trim();
  if (c.includes("/")) {
    const segs = c.split("/");
    const l2 = `${segs[0]}/${segs[1] ?? ""}`;
    if (l2 in SLUG_AXIS) return SLUG_AXIS[l2];
    if (segs[0] in SLUG_AXIS) return SLUG_AXIS[segs[0]];
  } else if (c in SLUG_AXIS) {
    return SLUG_AXIS[c];
  }
  if (HAIR_RE.test(c)) return "hair";
  if (NONE_RE.test(c)) return "none";
  if (SKIN_RE.test(c)) return "skin";
  return "none";
}

function hairFilled(skin: SkinProfileLike): boolean {
  return (skin.hairConcerns?.length ?? 0) > 0
    || Boolean(skin.otherHair)
    || Boolean(skin.otherHairConcerns)
    || Boolean(skin.otherGoalsHair)
    || (skin.goals?.some((g) => HAIR_GOAL_SET.has(g)) ?? false);
}

function skinFilled(skin: SkinProfileLike): boolean {
  return Boolean(skin.skinTypeFace)
    || Boolean(skin.otherSkinTypeFace)
    || Boolean(skin.skinTypeBody)
    || Boolean(skin.otherSkinTypeBody)
    || (skin.concerns?.length ?? 0) > 0
    || Boolean(skin.otherConcerns)
    || Boolean(skin.allergiesFreeform)
    || Boolean(skin.otherGoalsFace)
    || Boolean(skin.otherGoalsBody)
    || Boolean(skin.otherGoalsRoutine)
    || (skin.goals?.some((g) => !HAIR_GOAL_SET.has(g)) ?? false);
}

export function axisFilled(axis: ProfileAxis, skin: SkinProfileLike): boolean {
  if (axis === "none") return true;
  if (axis === "hair") return hairFilled(skin);
  return skinFilled(skin);
}

/**
 * Le profil contient-il LA MOINDRE donnée (peau OU cheveux) ? Décide du mode
 * product_only : TOUT produit est personnalisé dès que le profil est rempli
 * (décision user, juil 2026) — un déodorant à la niacinamide sert « tes
 * boutons ». Seul un profil VIDE → score = qualité.
 */
export function profileHasData(skin: SkinProfileLike): boolean {
  return skinFilled(skin) || hairFilled(skin);
}

// ── Filets déterministes « against » (campagne E2E juil 2026) ────────────────
// Le LLM ignore parfois deux cas critiques : l'alcool asséchant sur peau
// sèche/sensible, et l'allergie texte libre à un ingrédient présent.

export type ForcedAgainst = { name: string; need: string };

const DRYING_ALCOHOL_RE = /^(sd\s+)?alcohol(\s+denat\.?)?(\s+\d+-?\w*)?$/i;

// Allergènes de parfum (UE) — sur peau sensible/réactive, à écarter MÊME sans allergie déclarée.
const FRAGRANCE_ALLERGENS = [
  "parfum", "fragrance", "limonene", "linalool", "citronellol", "geraniol", "citral",
  "coumarin", "eugenol", "cinnamal", "hexyl cinnamal", "benzyl salicylate", "benzyl benzoate",
  "alpha-isomethyl ionone", "hydroxycitronellal", "isoeugenol", "farnesol", "amyl cinnamal",
  "cinnamyl alcohol", "anise alcohol", "butylphenyl methylpropional", "evernia",
];
// Corps gras comédogènes — sur peau grasse/acnéique, aggravent boutons/points noirs.
const COMEDOGENIC = [
  "cocos nucifera", "coconut oil", "theobroma cacao", "cocoa butter", "isopropyl myristate",
  "isopropyl palmitate", "myristyl myristate", "triticum vulgare germ", "wheat germ",
  "linum usitatissimum", "linseed", "laureth-4", "oleth-3", "lanolin", "butyl stearate",
  "decyl oleate", "cetyl acetate",
];
const SULFATES = [
  "sodium lauryl sulfate", "sodium laureth sulfate", "ammonium lauryl sulfate", "ammonium laureth sulfate",
];

const ALLERGY_STOPWORDS = new Set([
  "allergie", "allergique", "allergies", "suis", "very", "tres", "très", "avec",
  "sans", "pour", "dans", "les", "des", "aux", "une", "mon", "mes", "est",
]);

function normalizeTxt(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

/** Contre-indications GARANTIES par le code (l'IA rate ces cas — prouvé E2E).
 *  Alcool×sèche/sensible, allergènes de parfum×sensible, comédogènes×acné,
 *  sulfates×cuir chevelu/sensible/sèche, allergie déclarée. Cap final: enforce. */
export function detectForcedAgainst(
  items: { name?: string | null; input?: string | null }[],
  skin: SkinProfileLike,
): ForcedAgainst[] {
  const out: ForcedAgainst[] = [];
  const nameOf = (i: { name?: string | null; input?: string | null }) => (i.name ?? i.input ?? "").trim();
  const push = (name: string, need: string) => {
    const nm = name.trim();
    if (!nm || out.some((o) => normalizeTxt(o.name) === normalizeTxt(nm))) return;
    out.push({ name: nm, need });
  };

  const face = (skin.skinTypeFace ?? "").toLowerCase();
  const body = (skin.skinTypeBody ?? "").toLowerCase();
  const concerns = (skin.concerns ?? []).map((c) => c.toLowerCase());
  const goals = (skin.goals ?? []).map((g) => g.toLowerCase());
  const hair = (skin.hairConcerns ?? []).map((h) => h.toLowerCase());

  const sensitive = face === "sensible" || body === "sensible"
    || concerns.some((c) => ["rougeurs", "sensibilite", "eczema", "rosacee", "couperose", "reactivite", "dermatite"].includes(c));
  const dry = face === "seche" || face === "tres_seche" || body === "seche" || body === "tres_seche" || concerns.includes("secheresse");
  const acneOily = face === "grasse" || body === "grasse"
    || concerns.some((c) => ["acne", "points_noirs", "imperfections", "boutons", "exces_sebum", "brillance"].includes(c))
    || goals.some((g) => ["attenuer_boutons", "reduire_imperfections", "matifier"].includes(g));
  const scalpSensitive = hair.some((h) => ["cuir_chevelu_sensible", "pellicules", "demangeaisons"].includes(h));

  if (sensitive || dry) {
    if (items.some((i) => DRYING_ALCOHOL_RE.test(nameOf(i)))) push("alcool", "ta peau sensible ou sèche");
  }
  if (sensitive) {
    for (const it of items) {
      const n = normalizeTxt(nameOf(it));
      if (n && FRAGRANCE_ALLERGENS.some((a) => n === normalizeTxt(a) || n.includes(normalizeTxt(a)))) push(nameOf(it), "ta peau sensible");
    }
  }
  if (acneOily) {
    for (const it of items) {
      const n = normalizeTxt(nameOf(it));
      if (n && COMEDOGENIC.some((k) => n.includes(normalizeTxt(k)))) push(nameOf(it), "ta peau grasse et tes imperfections");
    }
  }
  if (scalpSensitive || sensitive || dry) {
    for (const it of items) {
      const n = normalizeTxt(nameOf(it));
      if (n && SULFATES.some((k) => n.includes(normalizeTxt(k)))) {
        push(nameOf(it), scalpSensitive ? "ton cuir chevelu sensible" : sensitive ? "ta peau sensible" : "ta peau sèche");
      }
    }
  }
  const allergyText = normalizeTxt(skin.allergiesFreeform ?? "");
  if (allergyText) {
    const tokens = [...new Set(allergyText.split(/[^a-z]+/).filter((t) => t.length >= 4 && !ALLERGY_STOPWORDS.has(t)))];
    for (const item of items) {
      const n = normalizeTxt(nameOf(item));
      if (!n) continue;
      const tok = tokens.find((t) => n.includes(t) || t.includes(n));
      if (tok) {
        const idx = out.findIndex((o) => normalizeTxt(o.name) === n);
        if (idx >= 0) out[idx] = { name: nameOf(item), need: `ton allergie (${tok})` };
        else out.push({ name: nameOf(item), need: `ton allergie (${tok})` });
      }
    }
  }

  return out.slice(0, 10);
}

export type RelevanceVerdict =
  | { kind: "personal"; axis: "skin" | "hair" }
  | { kind: "product_only" }
  | { kind: "profile_incomplete"; missingSection: "skin" | "hair" };

export function relevanceVerdict(
  category: string | null | undefined,
  skin: SkinProfileLike,
): RelevanceVerdict {
  const axis = categoryToAxis(category);
  if (axis === "none") return { kind: "product_only" };
  if (axisFilled(axis, skin)) return { kind: "personal", axis };
  return { kind: "profile_incomplete", missingSection: axis };
}
