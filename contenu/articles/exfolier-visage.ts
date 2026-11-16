import type { Article } from "@/contenu/articles";

/**
 * Publié le 16/11/2026 par le robot éditorial (`docs/seo/ROBOT.md`). Famille
 * « routines » (`eau-micellaire-ou-huile-demaquillante` sortait de la fenêtre
 * des dix derniers). Volumes : « exfoliant visage », « exfolier visage »,
 * « exfoliation du visage », « gommage visage » 1 k à 10 k chacune
 * (15/11/2026, Planificateur, `docs/seo/VOLUMES.md`). Les premiers résultats
 * sont Aroma-Zone, des parfumeries, des sites de régime : des fréquences sans
 * source, aucune liste lue. Les chiffres viennent de `cosme_check.catalog`
 * (fiches actives de la rubrique « gommage visage », relevé du 16/11/2026 :
 * listes découpées sur les virgules qui ne sont pas suivies d'un chiffre).
 * « Grains » = poudres de noyaux, de coques, de graines ou de son, pierre
 * ponce, perlite, sucre, sel, esters de jojoba, cellulose, polyéthylène.
 * « Acides » = glycolique, lactique, mandélique, salicylique, lactobionique,
 * gluconolactone, salicylate de bétaïne. « Enzymes » = papaïne, bromélaïne,
 * protéases. Les notes citées sont déclarées dans `notes`.
 */
const article: Article = {
  slug: "exfolier-visage",
  titre: "Exfolier son visage : tu le fais sans doute trop, et la note de ton gommage ne te le dira pas",
  titreSeo: "Exfolier son visage : à quelle fréquence ?",
  resume:
    "Gommage à grains, acides ou enzymes : comment exfolier son visage sans l'abîmer, à quel rythme, et ce qu'on a lu dans 3 072 gommages.",
  chapo:
    "Exfolier son visage, c'est décoller les cellules mortes de la surface, avec des grains ou avec des acides. Une à deux fois par semaine suffit pour commencer. ++Le vrai piège n'est pas le produit, c'est d'en cumuler trois sans le savoir.++",
  publieLe: "2026-11-16",
  modifieLe: "2026-11-16",
  minutes: 7,
  theme: "exfolier son visage",
  motsCles: [
    "exfolier visage",
    "exfoliant visage",
    "exfoliation du visage",
    "gommage visage",
    "gommage ou exfoliant",
    "exfoliant chimique",
    "AHA BHA",
    "routine exfoliation",
  ],
  categorie: "Routines",
  couverture: {
    src: "/image/blog/exfolier-visage.webp",
    alt: "Gros plan sur des bocaux en verre remplis d'un mélange granuleux de sucre roux, vu de dessus.",
    largeur: 1024,
    hauteur: 680,
    credit: "lovelihood, via Flickr",
    licence: "CC BY-SA 2.0",
    source: "https://www.flickr.com/photos/44258887@N04/6055133234",
  },
  blocs: [
    { type: "h2", texte: "Exfolier son visage, ça sert à quoi ?" },
    {
      type: "p",
      texte:
        "Exfolier, c'est aider les cellules mortes à quitter la surface de la peau. Elles partent seules, mais lentement, et un teint terne ou rugueux vient souvent de cette couche qui s'accumule. Une fois retirée, la peau paraît plus lisse et renvoie mieux la lumière.",
    },
    {
      type: "p",
      texte:
        "Ce n'est pas obligatoire. L'Académie américaine de dermatologie le dit sans détour : l'exfoliation ne convient pas à tout le monde, et mal faite, elle fait plus de mal que de bien ([AAD](https://www.aad.org/public/everyday-care/skin-care-secrets/routine/safely-exfoliate-at-home)). Si ta peau va bien sans, rien ne t'oblige à t'y mettre.",
    },

    { type: "h2", texte: "Gommage ou exfoliant : quelle différence ?" },
    {
      type: "p",
      texte:
        "Le **gommage** frotte : des grains roulent sur la peau et arrachent les cellules mortes. L'**exfoliant chimique** dissout : un acide relâche la « colle » qui tient ces cellules entre elles. Il existe une troisième voie, plus douce, les **enzymes** : des protéines tirées de la papaye (papaïne) ou de l'ananas (bromélaïne) qui grignotent les cellules mortes.",
    },
    {
      type: "p",
      texte:
        "Pour savoir lequel tu as, lis la liste INCI : c'est la liste officielle des ingrédients, du plus dosé au moins dosé. Les acides s'y rangent en trois familles. Les AHA et les BHA sont les plus connus. Les PHA (acides polyhydroxylés) sont de plus grosses molécules, qui entrent moins dans la peau et piquent donc moins.",
    },
    {
      type: "tableau",
      entetes: ["Méthode", "Ce qu'on lit dans la liste INCI", "Pour quelle peau"],
      lignes: [
        ["Grains (gommage).", "Pumice, Perlite, Prunus Armeniaca Seed Powder, Sucrose, Jojoba Esters, Cellulose.", "Peau grasse et épaisse, qui supporte la friction."],
        ["AHA (acides de fruits).", "Glycolic Acid, Lactic Acid, Mandelic Acid.", "Peau terne, sèche ou qui marque avec l'âge."],
        ["BHA.", "Salicylic Acid.", "Peau grasse, à points noirs."],
        ["PHA et enzymes.", "Gluconolactone, Papain, Bromelain.", "Peau sensible, ou pour débuter."],
      ],
      legende: "Les noms tels qu'ils s'écrivent sur l'emballage.",
    },
    {
      type: "p",
      texte:
        "Un AHA (acide alpha-hydroxylé) travaille à la surface : on t'explique tout dans notre article sur l'[acide glycolique](/blog/acide-glycolique). Un BHA (acide bêta-hydroxylé) se dissout dans le gras et entre dans les pores : c'est l'[acide salicylique](/blog/acide-salicylique). Les dermatologues conseillent aux peaux sèches, sensibles ou à boutons un exfoliant chimique doux plutôt que des grains, souvent trop irritants pour elles ([AAD](https://www.aad.org/public/everyday-care/skin-care-secrets/routine/safely-exfoliate-at-home)).",
    },

    { type: "h2", texte: "Qu'y a-t-il vraiment dans un gommage visage ?" },
    {
      type: "p",
      texte:
        "On a lu les ==3 072 gommages visage== de notre base. Plus d'un sur deux (1 666) contient des grains qu'on sait reconnaître : poudre de noyau, pierre ponce, sucre, sel, cellulose. 230 misent sur des enzymes. Et 686 placent un acide exfoliant dans leurs dix premiers ingrédients.",
    },
    {
      type: "p",
      texte:
        "Le chiffre qui compte, c'est celui-là : ++187 gommages font les deux à la fois++, des grains et un acide bien placé, dans le même tube. C'est une double exfoliation en un seul geste. Pour une peau grasse, ça peut aller. Pour une peau sensible, c'est souvent trop.",
    },
    {
      type: "p",
      texte:
        "Deux autres repères. Les trois quarts de ces gommages sont parfumés (2 248), alors que le parfum est un irritant fréquent sur une peau qu'on vient de frotter. Et 60 fiches listent encore du polyéthylène, un plastique en microbilles. L'Union européenne a interdit les microbilles qui servent à exfolier depuis octobre 2023 ([règlement (UE) 2023/2055](https://eur-lex.europa.eu/eli/reg/2023/2055/oj)) : ces fiches parlent sans doute d'anciennes formules.",
    },

    { type: "h2", texte: "Une bonne note veut-elle dire un produit doux ?" },
    {
      type: "p",
      texte:
        "Non, et c'est le piège. La note Cosme Check juge chaque ingrédient, pas la force du produit. Voici huit exfoliants connus, relevés dans notre base le 16/11/2026.",
    },
    {
      type: "tableau",
      entetes: ["Produit", "Méthode", "Note Cosme Check"],
      lignes: [
        ["Caudalie, Vinoperfect Mousse Micro-peeling Éclat.", "Acide mandélique (5e) et papaïne.", "16,25 sur 20."],
        ["Caudalie, Crème Exfoliante Désincrustante.", "Pierre ponce (4e).", "16,17 sur 20."],
        ["The Ordinary, AHA 30 % + BHA 2 % Peeling Solution.", "Acide glycolique en 1re place.", "16,14 sur 20."],
        ["Garnier, Exfoliant Visage à l'Abricot.", "Perlite et poudre de noyau d'abricot.", "16,12 sur 20."],
        ["Nivea, Derma Skin Clear Scrub.", "Cellulose, sel et acide salicylique.", "12,17 sur 20."],
        ["Paula's Choice, Skin Perfecting 2 % BHA Liquid Exfoliant.", "Acide salicylique (4e).", "11,44 sur 20."],
        ["Neutrogena, Blackhead Eliminating 2 % Salicylic Acid Face Scrub.", "Cellulose et acide salicylique.", "7,38 sur 20."],
        ["La Roche-Posay, Gommage Surfin Peaux Sensibles.", "Perlite et pierre ponce.", "7,06 sur 20."],
      ],
      legende: "Listes et notes relevées dans la base Cosme Check le 16/11/2026.",
    },
    {
      type: "p",
      texte:
        "Regarde la troisième ligne. Le peeling de The Ordinary met l'acide glycolique ==avant même l'eau==, et le nom annonce 30 % d'AHA. Ses ingrédients sont bien notés, d'où le 16,14. Mais en Europe, le comité scientifique jugeait l'acide glycolique sûr à 4 % au plus, pour un usage sans professionnel ([SCCNFP, 2004](https://ec.europa.eu/health/archive/ph_risk/committees/sccp/documents/out284_en.pdf)). Un produit aussi fort se manie avec la notice sous les yeux, et pas tous les soirs.",
    },
    {
      type: "p",
      texte:
        "À l'inverse, les deux notes les plus basses ne viennent pas de leurs grains, classés verts dans l'app. Elles viennent des émulsifiants et des autres ingrédients autour, classés orange, et d'un antioxydant classé rouge chez Neutrogena, le BHT. Pour lire une liste jusqu'au bout, suis notre [méthode en 5 étapes](/blog/analyse-composition-cosmetique).",
    },
    {
      type: "cta",
      texte:
        "**Ton gommage cache-t-il aussi un acide ?** Scanne-le avec Cosme Check : tu vois toute la liste, la place de chaque actif et sa couleur, en dix secondes.",
    },

    { type: "h2", texte: "Combien de fois par semaine exfolier son visage ?" },
    {
      type: "p",
      texte:
        "Une fois par semaine pour commencer, puis deux ou trois au plus si la peau suit. La règle des dermatologues est simple : ++plus l'exfoliation est forte, moins on la fait souvent++ ([AAD](https://www.aad.org/public/everyday-care/skin-care-secrets/routine/safely-exfoliate-at-home)). Et il faut compter tout ce qui exfolie, pas seulement le gommage.",
    },
    {
      type: "p",
      texte:
        "C'est là que beaucoup se trompent. Dans notre base, un soin anti-imperfections sur six (1 135 sur 7 294) place déjà un acide exfoliant dans ses cinq premiers ingrédients. Ajoute un tonique à l'acide, un gommage le week-end et du [rétinol](/blog/retinol) (un dérivé de la vitamine A qui accélère le renouvellement de la peau) : tu exfolies presque tous les jours sans l'avoir décidé.",
    },
    {
      type: "liste",
      style: "numeros",
      items: [
        "Fais la liste de tes produits et repère les acides dans les dix premiers ingrédients : Glycolic, Lactic, Mandelic, Salicylic Acid.",
        "Garde **une seule** méthode : des grains **ou** un acide, pas les deux le même soir.",
        "Exfolie le soir, sur une peau propre et sèche, et jamais le même soir que le rétinol.",
        "Pour un gommage, masse en petits cercles pendant 30 secondes environ, puis rince à l'eau tiède, pas chaude.",
        "Applique tout de suite une crème simple : la [glycérine](/blog/glycerine) ou l'[urée](/blog/creme-uree) font très bien l'affaire.",
        "Le matin, mets une crème solaire : les acides rendent la peau plus sensible au soleil ([FDA](https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids)). Les bons gestes sont dans [nos 7 erreurs](/blog/spf-50-visage-7-erreurs).",
      ],
    },

    { type: "h2", texte: "Comment savoir si tu exfolies trop ?" },
    {
      type: "p",
      texte:
        "La peau te le dit vite : elle tiraille, rougit, pique quand tu mets une crème qui ne piquait pas avant, ou devient brillante et tendue comme du papier. Dans ce cas, arrête tout ce qui exfolie pendant une à deux semaines et garde une routine minimale : un nettoyant doux, une crème, une crème solaire.",
    },
    {
      type: "liste",
      style: "alertes",
      items: [
        "Jamais sur une peau coupée, irritée ou qui a pris un coup de soleil.",
        "Peau foncée ou qui garde des marques brunes après un bouton : évite les grains et les acides forts. Une exfoliation trop forte peut laisser des taches plus foncées ([AAD](https://www.aad.org/public/everyday-care/skin-care-secrets/routine/safely-exfoliate-at-home)).",
        "Pas de recette maison au sucre ou au café sur le visage : les grains y sont irréguliers et coupants.",
        "Une rougeur qui dure, une brûlure ou des boutons qui se multiplient : parles-en à ton pharmacien ou à un dermatologue.",
      ],
    },
    {
      type: "encadre",
      ton: "emeraude",
      titre: "À retenir",
      texte:
        "Une exfoliation, c'est un soin de temps en temps, pas une habitude de chaque soir. Choisis une méthode, compte tous tes produits qui exfolient, et laisse à ta peau des soirs sans rien.",
    },

    { type: "h2", texte: "Quelle exfoliation choisir selon ta peau ?" },
    {
      type: "p",
      texte:
        "Pars de ton [type de peau](/blog/type-de-peau). Une peau grasse ou mixte supporte un BHA deux ou trois fois par semaine, ou un gommage fin. Une [peau sèche](/blog/peau-seche-visage) préfère un AHA doux, une fois par semaine. Une peau sensible commence par les PHA ou les enzymes, tous les dix à quinze jours.",
    },
    {
      type: "p",
      texte:
        "Et place l'exfoliation dans le bon ordre de ta [routine skincare](/blog/routine-skincare) : après le nettoyant, avant la crème. Le dernier geste est le plus simple. ++Les soirs sans exfoliant sont ceux où ta peau se répare++ : ne les remplis pas.",
    },
  ],
  faq: [
    {
      question: "Combien de fois par semaine faut-il exfolier son visage ?",
      reponse:
        "Une fois par semaine pour commencer, puis deux ou trois fois au plus si la peau ne tiraille pas et ne rougit pas. Une peau sensible s'en tient à une fois tous les dix à quinze jours. Compte tous les produits qui exfolient, tonique et sérum aux acides compris, pas seulement le gommage.",
    },
    {
      question: "Quelle est la différence entre un gommage et un exfoliant ?",
      reponse:
        "Le gommage frotte : des grains, comme la poudre de noyau ou la pierre ponce, arrachent les cellules mortes. L'exfoliant chimique les dissout grâce à un acide, AHA ou BHA, sans frotter. Les enzymes de la papaye ou de l'ananas forment une troisième voie, plus douce, utile aux peaux sensibles.",
    },
    {
      question: "Faut-il exfolier son visage le matin ou le soir ?",
      reponse:
        "Le soir, de préférence. La peau a la nuit pour se calmer, et les acides la rendent plus sensible au soleil. Évite le même soir que le rétinol. Le lendemain matin, applique une crème solaire, même en hiver et même par temps gris, car c'est là que la peau fraîchement exfoliée est la plus exposée.",
    },
    {
      question: "Comment savoir si on a trop exfolié sa peau ?",
      reponse:
        "La peau tiraille, rougit, pique au contact d'une crème habituelle, ou paraît brillante et tendue. Arrête alors tout ce qui exfolie pendant une à deux semaines et garde un nettoyant doux, une crème simple et une crème solaire. Si la rougeur dure ou brûle, demande conseil à ton pharmacien.",
    },
  ],
  notes: [
    {
      produit: "Caudalie, Vinoperfect Mousse Micro-peeling Éclat (100 ml)",
      ean: "3522930004318",
      note: 16.25,
      releveeLe: "2026-11-16",
    },
    {
      produit: "Caudalie, Crème Exfoliante Désincrustante (75 ml)",
      ean: "3522930004158",
      note: 16.17,
      releveeLe: "2026-11-16",
    },
    {
      produit: "The Ordinary, AHA 30 % + BHA 2 % Peeling Solution (30 ml)",
      ean: "0769915236194",
      note: 16.14,
      releveeLe: "2026-11-16",
    },
    {
      produit: "Garnier, Exfoliant Visage à l'Abricot",
      ean: "3600542232418",
      note: 16.12,
      releveeLe: "2026-11-16",
    },
    {
      produit: "Nivea, Derma Skin Clear Scrub (150 ml)",
      ean: "4005900972729",
      note: 12.17,
      releveeLe: "2026-11-16",
    },
    {
      produit: "Paula's Choice, Skin Perfecting 2 % BHA Liquid Exfoliant (118 ml)",
      ean: "0655439020046",
      note: 11.44,
      releveeLe: "2026-11-16",
    },
    {
      produit: "Neutrogena, Blackhead Eliminating 2 % Salicylic Acid Face Scrub (150 ml)",
      ean: "3574661498478",
      note: 7.38,
      releveeLe: "2026-11-16",
    },
    {
      produit: "La Roche-Posay, Gommage Surfin Peaux Sensibles (50 ml)",
      ean: "3337872411403",
      note: 7.06,
      releveeLe: "2026-11-16",
    },
  ],
};

export default article;
