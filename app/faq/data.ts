export type FaqCategory =
  | "Composition"
  | "Score & couleurs"
  | "Ingrédients"
  | "Compte & abonnement"
  | "Confidentialité";

export type FaqDot = "vert" | "jaune" | "orange" | "rose";

export type FaqItem = {
  id: string;
  category: FaqCategory;
  dot: FaqDot;
  question: string;
  answer: string;
  learnMore?: { href: string; label?: string };
};

export const FAQ_CATEGORIES: FaqCategory[] = [
  "Composition",
  "Score & couleurs",
  "Ingrédients",
  "Compte & abonnement",
  "Confidentialité",
];

export const FAQ_ITEMS: FaqItem[] = [
  // ── Composition ──────────────────────────────────────────────────────────
  {
    id: "scan-fonctionnement",
    category: "Composition",
    dot: "vert",
    question: "Comment fonctionne le scan d'un produit ?",
    answer:
      "Tu prends en photo la liste INCI (la liste d'ingrédients au dos du produit) ou tu scannes le code-barres. Cosme Check lit la composition, identifie chaque ingrédient dans notre base de plus de 40 000 références, puis t'affiche un score global et le détail ingrédient par ingrédient en quelques secondes.",
    learnMore: { href: "/comment-ca-marche" },
  },
  {
    id: "types-produits",
    category: "Composition",
    dot: "vert",
    question: "Cosme Check analyse-t-il tous les types de cosmétiques ?",
    answer:
      "Oui : soins du visage, soins du corps, maquillage, parfums, produits capillaires, hygiène intime, déodorants, solaires, produits pour bébé. Tout ce qui possède une liste INCI réglementaire peut être analysé.",
  },
  {
    id: "ocr-fiabilite",
    category: "Composition",
    dot: "jaune",
    question: "La photo de l'étiquette est-elle toujours bien reconnue ?",
    answer:
      "Notre OCR (reconnaissance de texte) est optimisé pour les listes INCI, mais une photo nette, bien cadrée et sans reflet donne toujours un meilleur résultat. Si le scan échoue, tu peux coller la liste INCI manuellement ou rechercher le produit par son nom.",
  },
  {
    id: "produit-non-reconnu",
    category: "Composition",
    dot: "orange",
    question: "Pourquoi certains produits ne sont-ils pas reconnus ?",
    answer:
      "Notre base s'enrichit chaque semaine, mais les nouveautés ou les références confidentielles peuvent manquer à l'appel. Dans ce cas, le scan de la liste INCI fonctionne quand même : on analyse les ingrédients, même si le produit n'est pas encore référencé.",
  },
  {
    id: "ordre-ingredients",
    category: "Composition",
    dot: "vert",
    question: "Les ingrédients sont-ils classés par ordre d'importance ?",
    answer:
      "Oui. La réglementation européenne impose aux marques de lister les ingrédients par ordre décroissant de concentration, jusqu'à 1 %. En dessous, l'ordre est libre. Cosme Check respecte cet ordre et le prend en compte dans le calcul du score.",
  },
  {
    id: "ajout-manuel",
    category: "Composition",
    dot: "vert",
    question: "Comment ajouter manuellement la composition d'un produit ?",
    answer:
      "Depuis l'accueil, choisis l'option « Coller la liste INCI ». Tu peux copier-coller la liste depuis le site de la marque, un blog ou une photo. L'analyse se lance immédiatement.",
  },

  // ── Score & couleurs ─────────────────────────────────────────────────────
  {
    id: "signification-couleurs",
    category: "Score & couleurs",
    dot: "jaune",
    question: "Que signifient les couleurs du score ?",
    answer:
      "Les couleurs t'aident à comprendre en un coup d'œil l'impact potentiel d'un produit sur ta santé. Vert = excellent, Jaune = bon, Orange = à surveiller, Rouge = à éviter. Notre méthode s'appuie sur des données scientifiques et des évaluations d'experts indépendants.",
    learnMore: { href: "/comment-ca-marche", label: "En savoir plus" },
  },
  {
    id: "calcul-score",
    category: "Score & couleurs",
    dot: "jaune",
    question: "Comment le score global est-il calculé ?",
    answer:
      "Le score combine plusieurs critères : la note individuelle de chaque ingrédient (vert/jaune/orange/rouge), sa position dans la liste INCI (donc sa concentration), et la présence ou non d'ingrédients sensibles (allergènes, perturbateurs endocriniens suspectés, etc.). Plus la couleur d'un ingrédient est rouge, plus la pénalité est forte.",
  },
  {
    id: "produit-naturel-mauvais-score",
    category: "Score & couleurs",
    dot: "orange",
    question: "Pourquoi mon produit « naturel » obtient-il un mauvais score ?",
    answer:
      "« Naturel » n'est pas un terme réglementé : un produit peut contenir 99 % d'eau et 1 % d'extrait végétal et s'afficher comme tel. Cosme Check ne juge pas le marketing, mais la composition. Certains ingrédients naturels (huiles essentielles, allergènes) peuvent aussi être pénalisés selon leur impact réel.",
  },
  {
    id: "ingredient-rouge",
    category: "Score & couleurs",
    dot: "orange",
    question: "Un produit avec un ingrédient rouge est-il forcément à éviter ?",
    answer:
      "Pas systématiquement. Tout dépend de la concentration, de la zone d'application (visage, corps, rincé ou non), et de ta sensibilité personnelle. Le rouge est un signal d'alerte : à toi de décider en fonction de ton contexte. Cosme Check t'aide à voir, pas à interdire.",
  },
  {
    id: "professionnel-sante",
    category: "Score & couleurs",
    dot: "orange",
    question: "Cosme Check remplace-t-il l'avis d'un professionnel de santé ?",
    answer:
      "Non. Cosme Check est un outil d'information et de transparence, pas un avis médical. En cas de doute, d'allergie connue, de grossesse ou de problème de peau, l'avis d'un dermatologue ou d'un pharmacien reste indispensable.",
  },
  {
    id: "confiance-resultats",
    category: "Score & couleurs",
    dot: "vert",
    question: "Puis-je faire confiance aux résultats de Cosme Check ?",
    answer:
      "Notre méthode s'appuie sur des sources publiques et reconnues : règlement européen CE 1223/2009, avis du Comité scientifique européen (SCCS), base de l'ECHA, publications du CIR, et travaux d'experts en cosmétologie. Chaque évaluation peut être discutée et nous mettons à jour la base dès qu'une nouvelle donnée scientifique est publiée.",
  },

  // ── Ingrédients ──────────────────────────────────────────────────────────
  {
    id: "selection-ingredients",
    category: "Ingrédients",
    dot: "rose",
    question: "Comment sont sélectionnés les ingrédients évalués ?",
    answer:
      "Nous évaluons l'ensemble des ingrédients listés au CosIng (l'inventaire officiel européen des ingrédients cosmétiques), soit plus de 40 000 références. Chaque ingrédient est classé selon les avis scientifiques disponibles et son profil de risque.",
  },
  {
    id: "sources-scientifiques",
    category: "Ingrédients",
    dot: "rose",
    question: "Sur quelles sources scientifiques vous appuyez-vous ?",
    answer:
      "ECHA (Agence européenne des produits chimiques), SCCS (Comité scientifique européen pour la sécurité des consommateurs), CIR (Cosmetic Ingredient Review), CosIng, publications PubMed, ANSM. Nos évaluations sont mises à jour à chaque nouvelle publication officielle.",
  },
  {
    id: "perturbateurs-endocriniens",
    category: "Ingrédients",
    dot: "rose",
    question: "Qu'est-ce qu'un perturbateur endocrinien ?",
    answer:
      "C'est une substance qui peut interférer avec le système hormonal. En cosmétique, certains conservateurs, filtres UV ou parfums sont suspectés d'agir comme tels. Cosme Check signale les ingrédients identifiés comme suspectés par les autorités sanitaires européennes.",
  },
  {
    id: "parabens-dangereux",
    category: "Ingrédients",
    dot: "rose",
    question: "Les parabens sont-ils vraiment dangereux ?",
    answer:
      "Tous les parabens ne se valent pas. Les parabens à chaîne courte (methylparaben, ethylparaben) restent autorisés et considérés comme sûrs aux concentrations actuelles. Les chaînes plus longues (propylparaben, butylparaben) sont plus controversées et utilisées avec prudence.",
  },
  {
    id: "silicones-reputation",
    category: "Ingrédients",
    dot: "rose",
    question: "Pourquoi les silicones ont-ils mauvaise réputation ?",
    answer:
      "Les silicones sont sans risque pour la santé : ils sont inertes. La controverse vient surtout de leur impact environnemental (peu biodégradables) et de leur effet « occlusif » sur le cuir chevelu ou la peau, qui peut gêner certaines routines.",
  },
  {
    id: "conservateurs",
    category: "Ingrédients",
    dot: "rose",
    question: "Tous les conservateurs sont-ils nocifs ?",
    answer:
      "Non, et même : ils sont indispensables. Sans conservateur, un cosmétique se contaminerait en quelques jours. Le tout est de choisir des conservateurs dont la sécurité est documentée. Certains posent question (méthylisothiazolinone), d'autres font consensus (acide benzoïque, sorbate de potassium).",
  },
  {
    id: "huiles-essentielles",
    category: "Ingrédients",
    dot: "rose",
    question: "Les huiles essentielles sont-elles toujours saines ?",
    answer:
      "Naturelles, oui - inoffensives, non. Beaucoup contiennent des composés allergisants réglementés (linalool, limonene, géraniol…) que la loi européenne oblige à déclarer. Cosme Check pénalise les huiles essentielles à fort potentiel allergisant, surtout dans les produits sans rinçage.",
  },

  // ── Compte & abonnement ──────────────────────────────────────────────────
  {
    id: "gratuite",
    category: "Compte & abonnement",
    dot: "jaune",
    question: "L'application est-elle gratuite ?",
    answer:
      "Oui, l'essentiel est gratuit : scanner un produit, voir son score, consulter le détail des ingrédients. Une formule premium débloque l'historique illimité, l'analyse de routine complète, le coach IA et la comparaison avancée.",
    learnMore: { href: "/offre", label: "Voir les offres" },
  },
  {
    id: "offre-premium",
    category: "Compte & abonnement",
    dot: "jaune",
    question: "Que comprend l'offre premium ?",
    answer:
      "Analyses illimitées, sauvegarde de tous tes scans, routine personnalisée évaluée globalement, conseils IA selon ton type de peau, comparaison de produits avancée, et accès prioritaire aux nouvelles fonctionnalités.",
  },
  {
    id: "credits",
    category: "Compte & abonnement",
    dot: "jaune",
    question: "Comment fonctionnent les crédits ?",
    answer:
      "Les crédits sont utilisés pour certaines actions premium ponctuelles (analyse approfondie, suggestions IA, OCR avancé). Le compte gratuit en reçoit chaque mois ; l'offre premium en inclut un volume bien plus large.",
  },
  {
    id: "annulation",
    category: "Compte & abonnement",
    dot: "jaune",
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer:
      "Oui, sans engagement. Tu peux résilier ton abonnement quand tu veux depuis ton profil. Tu gardes l'accès aux fonctionnalités premium jusqu'à la fin de la période déjà payée.",
  },
  {
    id: "sans-compte",
    category: "Compte & abonnement",
    dot: "vert",
    question: "Puis-je utiliser Cosme Check sans créer de compte ?",
    answer:
      "Oui, tu peux scanner et consulter des fiches sans compte. Créer un compte gratuit te permet de sauvegarder ton historique, retrouver tes produits, et bâtir ta routine personnalisée.",
  },

  // ── Confidentialité ──────────────────────────────────────────────────────
  {
    id: "donnees-confidentielles",
    category: "Confidentialité",
    dot: "orange",
    question: "Mes données sont-elles confidentielles ?",
    answer:
      "Oui. Tes scans, ton historique et ta routine te sont strictement personnels. Personne d'autre - y compris notre équipe - n'a accès à ton compte sans ton autorisation explicite. Les données sont hébergées en Europe, chiffrées au repos et en transit.",
    learnMore: { href: "/confidentialite", label: "Politique de confidentialité" },
  },
  {
    id: "vente-donnees",
    category: "Confidentialité",
    dot: "orange",
    question: "Cosme Check vend-il mes données à des tiers ?",
    answer:
      "Non. Nous ne vendons, ne louons et ne partageons pas tes données personnelles avec des annonceurs ou des marques. Notre modèle économique repose uniquement sur l'abonnement premium volontaire.",
  },
  {
    id: "stockage-photos",
    category: "Confidentialité",
    dot: "orange",
    question: "Où sont stockées mes photos de produits ?",
    answer:
      "Les photos sont traitées par notre OCR puis supprimées dans la foulée. Seul le texte de la liste INCI reconnu est conservé, et uniquement si tu choisis de sauvegarder le scan dans ton historique.",
  },
  {
    id: "suppression-compte",
    category: "Confidentialité",
    dot: "rose",
    question: "Comment supprimer mon compte et mes données ?",
    answer:
      "Depuis ton profil, tu peux demander la suppression définitive de ton compte. Toutes tes données associées (historique, routine, photos) sont effacées sous 30 jours, conformément au RGPD.",
  },
  {
    id: "rgpd",
    category: "Confidentialité",
    dot: "vert",
    question: "L'application respecte-t-elle le RGPD ?",
    answer:
      "Oui. Cosme Check est conforme au Règlement général sur la protection des données. Tu disposes d'un droit d'accès, de rectification, d'effacement et de portabilité de tes données, exerçable depuis ton compte ou en nous contactant directement.",
    learnMore: { href: "/confidentialite" },
  },
];
