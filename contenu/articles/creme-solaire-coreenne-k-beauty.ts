import type { Article } from "@/contenu/articles";

/**
 * Migré le 19/10/2026 depuis `app/blog/creme-solaire-coreenne-k-beauty/page.tsx`
 * (page écrite à la main), sans changer l'adresse ni la date. Le texte passe
 * au tutoiement, comme le reste du site. Le format de ce fichier est décrit
 * en tête de `contenu/articles.ts`.
 *
 * Mis au niveau le 05/11/2026 par le robot éditorial : chiffres et avis sans
 * source retirés (« 6 à 12 mois », « 3 à 5 ans », « protection souvent
 * meilleure », « top des ventes »), une erreur corrigée (l'octocrylène présenté
 * comme un filtre américain), sources (règlements 1223/2009 et 2022/1176,
 * FDA), six notes de la base, `h2` en questions, liens internes.
 * `titre` et `titreSeo` inchangés pour isoler l'effet.
 */
const article: Article = {
  slug: "creme-solaire-coreenne-k-beauty",
  titre: "Crèmes solaires coréennes (K-Beauty) : pourquoi elles cartonnent et comment bien choisir",
  titreSeo: "Crème solaire coréenne : pourquoi elle cartonne",
  resume:
    "Beauty of Joseon, Round Lab, Anua, COSRX : les SPF coréens explosent en France. Avantages, filtres face à l'Europe et précautions avant d'acheter.",
  chapo:
    "Les crèmes solaires coréennes plaisent pour leur texture : légères, sans film blanc, faciles à porter sous le maquillage. Beaucoup utilisent les mêmes filtres récents que l'Europe. Mais ++« coréen » ne garantit rien++ : dans notre base, les notes des solaires coréens vont de 1,16 à 16,32 sur 20.",
  publieLe: "2026-05-11",
  modifieLe: "2026-11-05",
  minutes: 5,
  theme: "crème solaire coréenne",
  motsCles: [
    "K-Beauty SPF",
    "Beauty of Joseon Relief Sun",
    "SPF coréen France",
    "filtres UV coréens",
    "SPF asiatique non gras",
    "meilleur SPF coréen",
  ],
  categorie: "Marques",
  couverture: {
    src: "/image/blog/k-beauty/hero.webp",
    alt: "Une jeune femme pose le bout des doigts sur sa joue dans un appartement baigné de soleil, une ville en arrière-plan.",
    largeur: 1915,
    hauteur: 821,
    credit: "Cosme Check",
    licence: "illustration générée par IA pour Cosme Check",
  },
  blocs: [
    { type: "h2", texte: "Pourquoi les crèmes solaires coréennes sont-elles si populaires ?" },
    {
      type: "p",
      texte:
        "D'abord pour la sensation. En Corée, la crème solaire se met tous les jours, comme une crème hydratante : les marques soignent donc la texture. On trouve des fluides, des gels, des sticks, souvent sans le film blanc des vieux écrans. Beaucoup ajoutent des actifs de soin, comme la [niacinamide](/blog/niacinamide) (la vitamine B3) ou la centella.",
    },
    {
      type: "p",
      texte:
        "Le SPF, c'est l'indice de protection contre les UVB, les rayons qui donnent les coups de soleil. Les solaires coréens affichent aussi un indice **PA**, de PA+ à PA++++, pour les UVA, les rayons qui vieillissent la peau en profondeur. Plus il y a de « + », plus la protection UVA est forte.",
    },

    { type: "h2", texte: "Les filtres coréens sont-ils autorisés en Europe ?" },
    {
      type: "p",
      texte:
        "Un filtre, c'est l'ingrédient qui arrête les UV. L'Europe tient une liste fermée des filtres permis, à l'annexe VI du [règlement (CE) 1223/2009](https://eur-lex.europa.eu/eli/reg/2009/1223/oj). Beaucoup de solaires coréens récents utilisent des filtres de cette liste, comme le [Tinosorb S](/i/bis-ethylhexyloxyphenol-methoxyphenyl-triazine) ou l'[Uvinul A Plus](/i/diethylamino-hydroxybenzoyl-hexyl-benzoate), qui protègent bien des UVA.",
    },
    {
      type: "p",
      texte:
        "Aux États-Unis, la crème solaire est un médicament en vente libre, et la liste des filtres permis par la [FDA](https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun) est plus courte que la liste européenne. C'est pour ça que certaines marques vendent une « version US » avec d'autres filtres. ==Avant d'acheter en ligne, compare la liste INCI== (la liste officielle des ingrédients, du plus dosé au moins dosé) avec celle du produit que tu vises.",
    },
    {
      type: "encadre",
      ton: "violet",
      titre: "À retenir",
      texte:
        "Un produit vendu dans un magasin de l'Union européenne doit respecter la liste européenne. Un produit commandé sur un site étranger, pas forcément : c'est à toi de lire sa liste.",
    },

    { type: "h2", texte: "Quelle crème solaire coréenne choisir ?" },
    {
      type: "p",
      texte:
        "Le pays ne dit rien : ce sont les filtres qui comptent. Six solaires coréens connus, relevés dans notre base, avec ce qui pèse le plus sur leur note.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Ce qui pèse sur la note", "Note Cosme Check"],
      lignes: [
        ["Round Lab, Baby Mild Sun Cushion.", "filtres minéraux ([oxyde de zinc](/i/zinc-oxide), [dioxyde de titane](/i/titanium-dioxide)).", "16,32 sur 20."],
        ["Beauty of Joseon, Relief Sun Riz + Probiotiques SPF 50+.", "filtres récents, sans parfum.", "8 sur 20."],
        ["Anua, Silky Moisture Sun Cream SPF 50.", "filtres récents, sans parfum.", "7,97 sur 20."],
        ["Round Lab, Birch Juice Moisturizing Sunscreen SPF 50+.", "filtres récents, sans parfum.", "7,9 sur 20."],
        ["Innisfree, Daily UV Defense Sunscreen SPF 36.", "[homosalate](/i/homosalate) et parfum.", "3,59 sur 20."],
        ["COSRX, Aloe Soothing Sun Cream SPF 50+.", "[octinoxate](/i/ethylhexyl-methoxycinnamate), parfum et alcool.", "1,16 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 05/11/2026.",
    },
    {
      type: "p",
      texte:
        "Le cushion minéral de Round Lab est le seul en vert. Les trois stars de TikTok se tiennent autour de 8, loin devant les formules à l'homosalate ou à l'octinoxate, des filtres plus anciens. L'Europe a d'ailleurs réduit la dose permise d'homosalate dans les soins visage à 7,34 % ([règlement (UE) 2022/1176](https://eur-lex.europa.eu/eli/reg/2022/1176/oj)).",
    },
    {
      type: "cta",
      texte:
        "**Ta crème solaire coréenne est-elle dans le bon camp ?** Scanne-la avec Cosme Check : tu vois ses filtres, leur couleur et sa note en dix secondes.",
    },

    { type: "h2", texte: "Que vérifier avant d'acheter une crème solaire coréenne ?" },
    {
      type: "liste",
      style: "alertes",
      items: [
        "**La version.** Une même marque peut vendre des formules différentes selon le pays : compare la liste du produit reçu avec celle de la fiche.",
        "**La date.** Sur les sites qui expédient depuis l'Asie, regarde la date de péremption et le petit pot ouvert (la durée d'utilisation après ouverture). Une crème solaire trop vieille protège moins bien.",
        "**Le parfum.** Certains solaires en contiennent beaucoup : à éviter si ta peau réagit vite.",
        "**La quantité.** Le SPF affiché est mesuré avec une couche épaisse. Une noisette ne suffit pas : relis [les 7 erreurs du SPF](/blog/spf-50-visage-7-erreurs).",
      ],
    },
    {
      type: "p",
      texte:
        "Sous la chaleur humide de La Réunion ou des Antilles, une texture fluide se supporte mieux, mais elle s'en va vite avec la sueur : remets-en toutes les deux heures dehors. En hiver, à Québec comme à Lille, un fluide léger se glisse facilement sous la crème de jour, dans l'ordre de notre [routine skincare](/blog/routine-skincare).",
    },

    { type: "h2", texte: "Coréen, européen ou minéral : que retenir ?" },
    {
      type: "liste",
      style: "coches",
      items: [
        "Les solaires coréens sont appréciés pour leur texture, pas parce qu'ils seraient plus sûrs.",
        "Beaucoup utilisent les mêmes filtres récents que l'Europe ; d'autres gardent des filtres plus anciens.",
        "Lis les filtres plutôt que le pays : notre guide des [perturbateurs endocriniens](/blog/perturbateurs-endocriniens-cosmetiques-2026) donne le statut européen de chacun.",
        "Si ta peau réagit fort à une crème solaire, demande conseil à ton pharmacien ou à un dermatologue.",
      ],
    },
    {
      type: "p",
      texte:
        "Le meilleur pour la fin : dans notre tableau, la note la plus haute ne revient pas à une star de TikTok, mais à un cushion pour bébé aux filtres minéraux. ++La crème solaire la plus virale n'est pas forcément la mieux composée.++ Et la mieux composée ne sert à rien si tu n'en mets pas assez.",
    },
  ],
  faq: [
    {
      question: "Pourquoi les crèmes solaires coréennes sont-elles si populaires ?",
      reponse:
        "Pour leur texture d'abord : légère, non grasse, sans fini blanc, agréable à porter tous les jours. Beaucoup jouent aussi les hybrides entre soin hydratant et crème solaire, avec des actifs comme la niacinamide. Leur note dépend de leurs filtres : dans notre base, elle va de 1,16 à 16,32 sur 20.",
    },
    {
      question: "Les crèmes solaires coréennes sont-elles autorisées en Europe ?",
      reponse:
        "Beaucoup utilisent des filtres de la liste européenne, comme le Tinosorb S ou l'Uvinul A Plus (annexe VI du règlement cosmétique). Un produit vendu en magasin dans l'Union européenne doit respecter cette liste. Commandé sur un site étranger, il peut contenir d'autres filtres : compare sa liste INCI avant d'acheter.",
    },
    {
      question: "Que veut dire PA++++ sur une crème solaire coréenne ?",
      reponse:
        "La notation PA mesure la protection contre les UVA. SPF 50+ PA++++ est le maximum réglementaire en Corée : en dessous, la crème protège moins bien des UVA. Avant d'acheter, vérifie aussi que tu prends la version « Korean / Global » et non une « US version » aux filtres différents.",
    },
  ],
  notes: [
    { produit: "Round Lab, Baby Mild Sun Cushion (16 g)", ean: "8809962541031", note: 16.32, releveeLe: "2026-11-05" },
    { produit: "Beauty of Joseon, Relief Sun Riz + Probiotiques SPF 50+ PA++++", ean: "8809968132387", note: 8, releveeLe: "2026-11-05" },
    { produit: "Anua, Silky Moisture Sun Cream SPF 50 (50 ml)", ean: "8809640737275", note: 7.97, releveeLe: "2026-11-05" },
    { produit: "Round Lab, Birch Juice Moisturizing Sunscreen SPF 50+ PA++++ (50 ml)", ean: "8809782551418", note: 7.9, releveeLe: "2026-11-05" },
    { produit: "Innisfree, Daily UV Defense Sunscreen SPF 36 (50 ml)", ean: "8809843685984", note: 3.59, releveeLe: "2026-11-05" },
    { produit: "COSRX, Aloe Soothing Sun Cream SPF 50+", ean: "8809416470191", note: 1.16, releveeLe: "2026-11-05" },
  ],
};

export default article;
