import type { Metadata } from "next";
import Image from "next/image";
import { PublicHeader } from "@/components/PublicHeader";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { FeaturesNav, type NavItem } from "@/components/features/FeaturesNav";
import { SITE_URL } from "@/lib/siteUrl";

const TITLE = "Fonctionnalités";
const DESCRIPTION =
  "Découvre tous les outils Cosme Check pour mieux comprendre tes produits : analyse INCI (photo, scan, liste, recherche, lien), analyse de promesses marketing, recherche de produits par mots-clés, routine, recommandations personnalisées, comparaison, coach IA.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "fonctionnalités Cosme Check",
    "analyse INCI",
    "scan cosmétique",
    "analyse promesse marketing cosmétique",
    "routine beauté",
    "comparateur cosmétiques",
    "recherche produit cosmétique",
    "recommandations cosmétiques personnalisées",
    "coach IA beauté",
  ],
  alternates: { canonical: "/fonctionnalites" },
  openGraph: {
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
    url: "/fonctionnalites",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
  },
};

const NAV: NavItem[] = [
  { id: "inci", number: "01", label: "Analyse des produits" },
  { id: "promesses", number: "02", label: "Promesses vs Formule" },
  { id: "recherche-produits", number: "03", label: "Recherche produits par mots-clés" },
  { id: "routine", number: "04", label: "Ma routine" },
  { id: "recommandations", number: "05", label: "Recommandations personnalisées" },
  { id: "comparer", number: "06", label: "Comparer 2 produits" },
  { id: "advisor", number: "07", label: "Beauty Advisor" },
];

type Benefit = { title: string; body: string };
type Section = {
  id: string;
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  pullQuote?: string;
  useCases?: string[];
  benefits: Benefit[];
  trust?: { title: string; body: string };
  /** Mots/expressions à surligner dans la description et les cas d'usage. */
  keywords?: string[];
};

/** Échappe les caractères regex spéciaux d'un littéral. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Surligne dans `text` chaque occurrence (insensible à la casse) des termes
 * de `keywords` avec un fond pastel rose. Les mots-clés les plus longs sont
 * testés en premier pour éviter qu'un sous-mot ne capture un terme plus large.
 */
function highlight(text: string, keywords?: string[]): React.ReactNode {
  if (!keywords || keywords.length === 0) return text;
  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${sorted.map(escapeRegex).join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    const isMatch = sorted.some((k) => k.toLowerCase() === part.toLowerCase());
    if (!isMatch) return part;
    return (
      <mark
        key={i}
        className="rounded-[3px] bg-emerald-100/80 px-[3px] py-px text-ink"
      >
        {part}
      </mark>
    );
  });
}

const SECTIONS: Section[] = [
  {
    id: "inci",
    number: "01",
    eyebrow: "Le cœur de l'application",
    title: "Analyse des produits",
    description:
      "Décrypte la composition complète d'un produit, ingrédient par ingrédient. Lance l'analyse comme tu veux : photo de l'étiquette, scan caméra en direct, liste INCI collée, recherche par nom de produit ou simple lien. Chaque ligne reçoit ensuite une couleur (vert, jaune, orange, rouge) qui résume sa pénalité selon des données scientifiques publiques, dans un système clair et indépendant.",
    keywords: [
      "photo de l'étiquette",
      "scan caméra",
      "liste INCI collée",
      "recherche par nom de produit",
      "lien",
      "vert, jaune, orange, rouge",
      "INCI",
      "demi-camembert",
      "indépendant",
    ],
    useCases: [
      "Tu scannes ton sérum préféré à la caméra. Le verdict visuel apparaît en trois secondes.",
      "Tu hésites en magasin : tu sors ton téléphone, tu filmes le produit en rayon, tu sais.",
      "Tu reçois une crème en cadeau. Tu colles l'INCI ou tu colles le lien produit, le demi-camembert s'affiche.",
    ],
    benefits: [
      {
        title: "Cinq façons de lancer l'analyse",
        body: "Photo de l'étiquette, scan caméra en direct, liste INCI collée, recherche par nom de produit ou simple lien : tu choisis le mode qui t'arrange, le résultat est identique. Aucun compte à créer pour essayer.",
      },
      {
        title: "Répartition visuelle par couleur",
        body: "Un graphique en demi-camembert affiche en un coup d'œil combien d'ingrédients sont sûrs, à surveiller, ou à éviter.",
      },
      {
        title: "Analyse de chaque ingrédient",
        body: "Rôle, bienfaits, risques, fonctions et présence réglementaire pour chaque ligne de la formule.",
      },
      {
        title: "Points forts et points d'attention",
        body: "Les actifs marquants et les ingrédients potentiellement irritants sont mis en évidence séparément.",
      },
      {
        title: "Compatible avec toutes les formes",
        body: "Crèmes, sérums, shampoings, parfums, déodorants, soins corps : tout ce qui présente une étiquette lisible peut être analysé, même sous un angle imparfait.",
      },
      {
        title: "Transparence totale",
        body: "Aucune marque ne paie pour modifier un résultat. Nos sources sont publiques, citables et vérifiables.",
      },
    ],
    trust: {
      title: "Une analyse fiable et indépendante.",
      body: "Cosme Check est 100 % indépendant. Nos évaluations ne sont influencées par aucune marque, aucun annonceur, aucun partenariat commercial.",
    },
  },
  {
    id: "promesses",
    number: "02",
    eyebrow: "Fonctionnalité phare",
    title: "Promesses vs Formule",
    description:
      "Colle la description marketing d'un produit (« anti-rides 7 jours », « 100 % naturel », « hydratation 24h ») et Cosme Check te dit instantanément ce qui est tenu par la formule réelle, et ce qui relève du marketing pur. Aucune autre application francophone ne pousse l'analyse aussi loin.",
    keywords: [
      "anti-rides 7 jours",
      "100 % naturel",
      "hydratation 24h",
      "hypoallergénique",
      "rétinol",
      "allergènes",
    ],
    pullQuote:
      "Le marketing dit ce qu'il veut. La formule dit la vérité. On compare les deux, sans complaisance.",
    useCases: [
      "Tu lis « 100 % naturel ». On t'indique les ingrédients synthétiques cachés derrière l'INCI.",
      "Tu vois « anti-rides 7 jours ». On confirme la présence (ou l'absence) du rétinol dans la formule.",
      "Tu vois « hypoallergénique ». On vérifie chacun des 26 allergènes obligatoirement déclarés.",
    ],
    benefits: [
      {
        title: "Détection des promesses tenues",
        body: "Pour chaque claim marketing, on identifie l'ingrédient qui le justifie, ou son absence dans la formule.",
      },
      {
        title: "Identification des claims marketing pur",
        body: "Les promesses sans fondement réel sont signalées, avec l'explication précise de la contradiction.",
      },
      {
        title: "Bilan de cohérence",
        body: "Un résumé visuel global pour savoir si l'argumentaire de la marque est honnête, ambigu, ou faux.",
      },
      {
        title: "Recommandations sans complaisance",
        body: "On te dit clairement si la formule mérite ses promesses, sans détour, sans partenariat, sans complaisance.",
      },
    ],
  },
  {
    id: "recherche-produits",
    number: "03",
    eyebrow: "Trouve avant d'analyser",
    title: "Recherche produits par mots-clés",
    description:
      "Tape un nom de produit, une marque ou quelques mots-clés et retrouve-le directement dans notre catalogue, sans scanner ni coller la moindre liste. Tu accèdes à sa composition déjà décryptée en un instant, même sans le flacon sous la main.",
    keywords: [
      "nom de produit",
      "marque",
      "mots-clés",
      "catalogue",
      "composition déjà décryptée",
    ],
    useCases: [
      "Tu as repéré un sérum sur les réseaux. Tu tapes son nom, tu lis sa composition avant même de l'acheter.",
      "Tu ne te souviens plus de la référence exacte : quelques mots-clés suffisent à la retrouver.",
      "Tu compares deux marques de crème : tu les cherches l'une après l'autre, sans aucune étiquette en main.",
    ],
    benefits: [
      {
        title: "Recherche par nom ou marque",
        body: "Tape ce dont tu te souviens (un nom, une marque, un type de produit) et la recherche remonte les correspondances les plus proches.",
      },
      {
        title: "Résultats déjà analysés",
        body: "Les produits du catalogue s'affichent avec leur composition décryptée et leur répartition couleur, prêts à lire.",
      },
      {
        title: "Tolérante aux approximations",
        body: "Faute de frappe, nom partiel, formulation grand public : la recherche comprend quand même ce que tu vises.",
      },
      {
        title: "Aucun produit en main requis",
        body: "Pas besoin du flacon ni du code-barres : tu te renseignes depuis ton canapé, avant l'achat.",
      },
    ],
  },
  {
    id: "routine",
    number: "04",
    eyebrow: "Au quotidien",
    title: "Ma routine",
    description:
      "Compose ta routine (nettoyant, sérum, crème, soin de nuit) et observe la répartition colorée de l'ensemble. Idéal pour identifier le maillon faible d'une routine et ajuster ses choix de façon raisonnée plutôt qu'au coup par coup.",
    keywords: [
      "répartition colorée",
      "maillon faible",
      "raisonnée",
    ],
    useCases: [
      "Tu construis ta routine du soir. Le résultat t'indique si elle tient la route.",
      "Tu remplaces ta crème. L'analyse se met à jour sans aucune validation manuelle.",
      "Tu sépares visage, corps et cheveux pour une vision claire de chaque routine.",
    ],
    benefits: [
      {
        title: "Vue globale de la routine",
        body: "Le demi-camembert combine tous les produits pour donner l'image complète, sans avoir à les analyser un par un.",
      },
      {
        title: "Détection du maillon faible",
        body: "On t'indique précisément quel produit tire la routine vers le rouge, celui qu'il faudrait remplacer en priorité.",
      },
      {
        title: "Suivi des changements",
        body: "Ajoute, retire ou remplace un produit : l'analyse se recalcule instantanément, sans rien à valider.",
      },
      {
        title: "Routines séparées",
        body: "Plusieurs routines en parallèle (visage, corps, cheveux) sans risque de les confondre.",
      },
    ],
  },
  {
    id: "recommandations",
    number: "05",
    eyebrow: "Pensé pour toi",
    title: "Recommandations personnalisées",
    description:
      "À partir de ton profil (type de peau, objectifs, problèmes ciblés, ingrédients que tu évites) et de ta routine, Cosme Check repère tes produits les plus pénalisants et te propose, pour chacun, un remplaçant mieux noté de la même catégorie : toujours plus propre, jamais un produit moyen, et adapté à ce que tu recherches.",
    keywords: [
      "ton profil",
      "objectifs",
      "problèmes ciblés",
      "ta routine",
      "remplaçant mieux noté",
      "même catégorie",
    ],
    pullQuote:
      "Pas la peine de chercher mieux à l'aveugle : on part de TES produits et on ne te propose qu'une formule réellement plus propre.",
    useCases: [
      "Ton déodorant tire ta routine vers l'orange : on te suggère une alternative verte du même type.",
      "Tu évites un ingrédient précis : aucune suggestion ne le contiendra, jamais.",
      "Tu gardes une alternative en favori et tu compares les deux compositions côte à côte.",
    ],
    benefits: [
      {
        title: "Basé sur ton profil et ta routine",
        body: "Type de peau, objectifs, problèmes ciblés, ingrédients que tu évites, produits que tu utilises vraiment : tes recommandations partent de qui tu es, pas d'un profil moyen ni d'un classement sponsorisé.",
      },
      {
        title: "Toujours une formule plus propre",
        body: "Une alternative n'est proposée que si elle est nettement mieux notée. Jamais un produit jaune ou moyen présenté comme un progrès.",
      },
      {
        title: "Respecte tes restrictions",
        body: "Les ingrédients et familles que tu as exclus sont automatiquement écartés : on ne te recommandera rien que tu évites.",
      },
      {
        title: "Même catégorie, vrai remplaçant",
        body: "Un shampoing est remplacé par un shampoing, un déo par un déo. La suggestion a du sens, jamais une comparaison absurde.",
      },
    ],
  },
  {
    id: "comparer",
    number: "06",
    eyebrow: "Pour choisir",
    title: "Comparer 2 produits",
    description:
      "Tu hésites entre deux sérums, deux crèmes ou deux nettoyants ? Mets-les côte à côte. Cosme Check t'aide à voir lequel a la composition la plus solide selon tes critères, sans biais ni recommandation commerciale.",
    keywords: [
      "côte à côte",
      "composition la plus solide",
      "sans biais",
    ],
    useCases: [
      "Deux sérums vitamine C en main. On te dit lequel a la formule la plus solide.",
      "Choix entre marque connue et marque jeune. On regarde la composition réelle.",
      "Avant un achat important, une comparaison neutre en trente secondes chrono.",
    ],
    benefits: [
      {
        title: "Verdict couleur immédiat",
        body: "Deux barres segmentées vert / jaune / orange / rouge s'affichent côte à côte. Le rapport de force se lit en une seconde, sans interpréter le moindre graphique.",
      },
      {
        title: "Différences soulignées",
        body: "Ingrédients présents chez l'un et absents chez l'autre, irritants potentiels, actifs marquants : tout est explicité.",
      },
      {
        title: "Synthèse écrite",
        body: "Un paragraphe lisible résume pourquoi un produit l'emporte sur l'autre, en langage clair.",
      },
    ],
  },
  {
    id: "advisor",
    number: "07",
    eyebrow: "Conseiller personnel",
    title: "Beauty Advisor",
    description:
      "Notre coach IA spécialisé en cosmétique répond à tes questions selon ton type de peau, ta routine actuelle et tes contraintes. Pas un chatbot générique entraîné sur du marketing, mais un vrai compagnon beauté, branché sur notre base d'ingrédients.",
    keywords: [
      "ton type de peau",
      "ta routine actuelle",
      "vrai compagnon beauté",
    ],
    useCases: [
      "« Mon sérum contient du rétinol. Je peux l'utiliser tous les soirs ? »",
      "« Je viens d'apprendre que je suis enceinte. Quels actifs éviter immédiatement ? »",
      "« Cette routine est-elle adaptée à ma peau mixte tendance grasse ? »",
    ],
    benefits: [
      {
        title: "Connaît ton profil",
        body: "Type de peau, sensibilités, routine actuelle, contraintes : l'advisor adapte chacune de ses réponses à toi.",
      },
      {
        title: "Questions illimitées",
        body: "Demande l'avis sur un produit, une routine, une marque, un ingrédient, autant de fois que nécessaire.",
      },
      {
        title: "Sources vérifiables",
        body: "Quand on cite un avis scientifique ou un règlement, on indique d'où ça vient. Pas de prétention sans preuve.",
      },
      {
        title: "Toujours disponible",
        body: "Pas de rendez-vous, pas de file d'attente. Une réponse claire au moment précis où tu en as besoin.",
      },
    ],
  },
];

function buildJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: "Cosme Check",
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web, iOS, Android",
        url: SITE_URL,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        featureList: NAV.map((it) => it.label).join(", "),
        inLanguage: "fr",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Fonctionnalités",
            item: `${SITE_URL}/fonctionnalites`,
          },
        ],
      },
    ],
  };
}

export default function FonctionnalitesPage() {
  const jsonLd = buildJsonLd();
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e"),
        }}
      />
      <BackgroundGlow />
      <PublicHeader />

      <main className="flex-1 pb-24">
        {/* ───────── Hero full-bleed ───────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <Image
            src="/image/landing/foctionnalite.webp"
            alt=""
            fill
            sizes="100vw"
            className="absolute inset-0 -z-10 object-cover"
            priority
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-b from-white/55 via-white/40 to-white/85"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 -z-10 h-px bg-black/[0.06]"
          />
          <div className="mx-auto max-w-6xl px-5 pb-16 pt-20 sm:px-8 sm:pb-24 sm:pt-24">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
              Fonctionnalités
            </p>
            <h1 className="mt-2 text-balance text-4xl font-bold tracking-tight text-ink drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)] sm:text-5xl lg:text-6xl">
              Toutes les fonctionnalités
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:text-[16px]">
              Découvre tous les outils Cosme Check pour mieux comprendre tes
              produits. De l&apos;analyse de la promesse marketing au coach IA
              personnel.
            </p>
          </div>
        </section>

        {/* ───────── Sidebar + sections ───────────────────────────────── */}
        <div className="mx-auto mt-14 w-full max-w-6xl px-5 sm:px-8 sm:mt-16">
          <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-16">
            <aside>
              <FeaturesNav items={NAV} />
            </aside>

            <div className="flex flex-col gap-20 lg:gap-24">
              {SECTIONS.map((s) => (
                <FeatureSection key={s.id} section={s} />
              ))}
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}

function FeatureSection({ section }: { section: Section }) {
  const {
    id,
    number,
    eyebrow,
    title,
    description,
    pullQuote,
    useCases,
    benefits,
    trust,
    keywords,
  } = section;
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-center gap-4">
        <span className="font-mono text-[36px] font-semibold leading-none tabular-nums text-[#F43F5E] sm:text-[44px]">
          {number}
        </span>
        <span aria-hidden className="h-px w-12 bg-rose-300" />
        <p className="text-[14px] font-semibold uppercase tracking-[0.2em] text-[#F43F5E] sm:text-[15px]">
          {eyebrow}
        </p>
      </div>

      <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-muted sm:text-[16px]">
        {highlight(description, keywords)}
      </p>

      {/* Pull quote : uniquement la fonctionnalité phare en bénéficie. */}
      {pullQuote ? (
        <blockquote className="mt-8 border-l-2 border-ink/30 pl-5">
          <p className="max-w-2xl text-balance text-[18px] font-medium italic leading-snug text-ink sm:text-[20px]">
            « {pullQuote} »
          </p>
        </blockquote>
      ) : null}

      {/* En pratique : cas d'usage concrets en liste à puces sobres. */}
      {useCases && useCases.length > 0 ? (
        <div className="mt-8 rounded-2xl bg-black/[0.02] p-5 ring-1 ring-black/[0.04] sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
            En pratique
          </p>
          <ul className="mt-3 space-y-2.5">
            {useCases.map((u, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-ink/45"
                />
                <span className="max-w-2xl text-[14px] leading-relaxed text-ink">
                  {highlight(u, keywords)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-10 border-t border-black/[0.08] pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
          Ce que tu obtiens
        </p>
        <ul className="mt-6 space-y-6">
          {benefits.map((b, i) => (
            <li key={b.title} className="flex gap-5">
              <span
                aria-hidden
                className="pt-[3px] font-mono text-[11px] font-semibold tabular-nums text-[#F43F5E]"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-ink">{b.title}</p>
                <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
                  {b.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {trust ? (
        <aside className="mt-10 border-l-2 border-ink/20 pl-5">
          <p className="text-[15px] font-semibold italic text-ink">
            {trust.title}
          </p>
          <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-ink-muted">
            {trust.body}
          </p>
        </aside>
      ) : null}
    </section>
  );
}
