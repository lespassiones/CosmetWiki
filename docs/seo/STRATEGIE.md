# Cosme Check : stratégie d'acquisition par le contenu et les magasins

Écrit le 19/10/2026. Jumeau de `C:\Projet\Memory Pilot\STRATEGIE-SEO-MEMORYPILOT.md` et de `C:\Projet\Reveal Chat\STRATEGIE-SEO-3-MOIS.md` : même mécanique (un robot qui publie un article par jour, mesure tout et apprend), autre sujet, autre point de départ, **en français seulement**. Le robot relit la section « Les prévisions » chaque matin pour se situer (section « Prévision recalée » de son rapport).

---

## 1. Le point de départ (mesuré le 19/10/2026, 28 derniers jours, du 21/09 au 18/10)

| Mesure | Valeur | Source |
|---|---|---|
| Premiers téléchargements iOS | 5 (1 sur les 7 derniers jours) ; France 3, Nouvelle-Zélande 1, Allemagne 1 | rapports de ventes App Store Connect |
| Installations de l'app, iOS et Android | 82 (11 sur les 7 derniers jours) | PostHog, événement `Application Installed` de l'app |
| Inscriptions dans l'app | 16 (`signup`), 43 onboardings terminés | PostHog |
| Achats et abonnements | 0 sur la période dans les rapports Apple ; 3 comptes premium au total | App Store Connect, Supabase (`tier = premium`) |
| Comptes | 147 au total, 15 nouveaux sur 30 jours (8 sur 7 jours) | Supabase (`cosme_check.user_profiles`) |
| Usage | 102 scans sur la période (68 sur 7 jours), 478 217 produits actifs dans la base | Supabase |
| Google | 15 clics, 927 affichages ; « cosmetic check » position 8,9 ; « meilleure crème hydratante visage » 231 affichages en position 68 | Search Console (propriété `https://www.cosme-check.com/`, lisible par le robot depuis le 19/10) |
| Bing | 23 clics, 1 200 affichages, 502 requêtes sur trois mois, beaucoup de traîne sur des ingrédients précis | Bing Webmaster Tools |
| Site | 255 pages vues, dont 12 sur le blog ; 1 visite venue d'une IA (ChatGPT) | PostHog, site |
| Blog | 12 articles, aucun appel à télécharger mesuré avant ce jour | migration du 19/10 |

**Le diagnostic tient en une phrase : presque personne ne lit le blog, et l'app s'installe surtout sans lui.** 12 pages vues de blog en 28 jours, pour 82 installations : le blog n'est pas encore une source. Mais Google le montre déjà sur de vraies requêtes (« meilleure crème hydratante visage », « analyse ingrédients cosmétiques ») sans qu'on clique, et Bing envoie de la traîne sur les fiches ingrédients : la demande existe, il faut des pages qui la prennent.

## 2. Ce qui est en place (19/10/2026)

| Chantier | État |
|---|---|
| **Blog prêt pour un article par jour** | un fichier par article (`contenu/articles/`), registre documenté (`contenu/articles.ts`), page en trois colonnes (sommaire, article, « à lire ensuite »), cinq appels à télécharger, FAQ en données structurées, flux RSS (`/blog/flux.xml`), plan du site à jour. Les douze articles existants migrés sans changer d'adresse. |
| **Campagnes jusqu'aux magasins** | chaque appel mène à `/dl?c=<slug>&m=blog&e=<emplacement>` : App Store avec `pt` et `ct` (compté dans App Store Connect), Google Play avec `referrer` (`utm_source`, `utm_medium=blog`, `utm_campaign`, `utm_content`). |
| **Mesure** | PostHog (projet 221637, UE) **sans cookie** tant que le visiteur n'a pas consenti : vues par article, sections lues (`section_atteinte`), clics par emplacement (`cta_clic`), sources dont les IA. Le « Cookieless server hash mode » du projet est actif. |
| **Le robot** | `/article-du-jour`, chaque matin à **6 h**, Opus 5.5 en effort xhigh, doctrine `docs/seo/ROBOT.md`. Verrou Chrome partagé avec RevealChat (7 h) et MemoryPilot (8 h). |

## 3. La ligne éditoriale

« Le Journal Cosme Check » parle de **cosmétique, d'ingrédients et de soin de la peau**, en français facile (un ado de 15 ans comprend tout), avec Cosme Check en bonus. Mélange sur dix articles : **3 buzz et célébrités** (produits viraux, actualité, routines et marques de stars, toujours sourcées, décryptées par la composition), **3 ingrédients et compositions**, **2 routines et types de peau**, **1 comparatif honnête**, **1 Cosme Check pratique**.

Chaque article cherche à faire télécharger l'app (cinq emplacements, plus un geste naturel dans le texte), et cite un ingrédient en liant sa fiche `/i/<slug>` : ces fiches attirent déjà de la traîne sur Bing (« sodium olivamphoacetate », « peg-2 cocamide toxicity », « limite sel d'aluminium dans déodorants »).

⚠️ Les fiches ingrédients sont servies en `noindex` depuis le 20/07/2026 (`lib/seoConfig.ts`, `INDEX_INGREDIENTS = false`, décision produit : être connu pour la compatibilité, pas comme annuaire INCI). Bing envoie pourtant encore du trafic dessus. Le robot les lie pour le lecteur ; rouvrir leur indexation est une décision produit, hors de son périmètre (voir les risques).

Les cinq grappes du premier mois :

1. Lire une liste INCI (« inci » 1 k à 10 k par mois, concurrence faible) ;
2. Les crèmes visage par type de peau (« crème visage » 1 k à 10 k ; l'article « meilleures crèmes hydratantes » est déjà vu par Google) ;
3. Routines (« routine skincare » 1 k à 10 k) et type de peau ;
4. Buzz et célébrités : la crème ou la marque dont on parle cette semaine, composition lue ;
5. Cosmétique bio et étiquettes « clean » (« cosmetique bio » 1 k à 10 k).

Volumes mesurés le 19/10/2026 en France seule, toutes langues : à remesurer sur les cinq zones en French (`VOLUMES.md`).

**Les garde-fous qui comptent le plus** : aucune allégation thérapeutique, aucun alarmisme non sourcé, aucune note de produit qui ne vienne pas de la base, et les célébrités traitées seulement sur ce qu'elles ont montré elles-mêmes. Le vérificateur les bloque.

## 4. Les prévisions

Trois fourchettes (basse, médiane, haute). Hypothèses : un article par jour sans interruption, un domaine jeune face à des magazines beauté et des sites santé très installés, un public français seulement (dix à cent fois plus petit que l'anglais sur les mêmes sujets), un visiteur du blog sur cent qui installe, et un buzz qui prend de temps en temps (une star, un produit viral) et fait un pic.

### Google (clics par mois vers le blog)

| Horizon | Basse | Médiane | Haute |
|---|---|---|---|
| 1 mois | 20 | 80 | 250 |
| 3 mois | 250 | 1 000 | 4 000 |
| 6 mois | 1 200 | 5 000 | 18 000 |
| 12 mois | 5 000 | 18 000 | 60 000 |

Point de départ : 15 clics sur 28 jours, presque tous sur la page d'accueil.

### Installations par mois, toutes sources (iOS et Android)

| Horizon | Venues du blog (médiane) | Autres sources (médiane) | Total (basse · médiane · haute) |
|---|---|---|---|
| 1 mois | 1 | 85 | 70 · 86 · 120 |
| 3 mois | 10 | 95 | 80 · 105 · 180 |
| 6 mois | 50 | 110 | 110 · 160 · 350 |
| 12 mois | 180 | 130 | 180 · 310 · 800 |

Point de départ : 82 installations sur 28 jours (PostHog, `Application Installed`), dont 5 premiers téléchargements iOS dans les rapports d'Apple : l'essentiel vient d'Android. Le blog ne prend le relais qu'à partir du quatrième mois ; avant, ce qui compte est que chaque page publiée tienne ses promesses et que la mesure par emplacement dise où placer les appels.

### Abonnements

Trois comptes premium sur 147 aujourd'hui : l'échantillon est trop petit pour un taux. En hypothèse de travail, 2 à 4 % des installations s'abonnent : **4 à 12 nouveaux abonnés par mois à douze mois** en médiane. Le chiffre d'affaires se lira dans les rapports de ventes (le robot les relève chaque matin) : aucun prix n'est écrit ici, ils vivent chez les magasins.

## 5. Les risques, et comment on les tient

| Risque | Parade |
|---|---|
| Une allégation santé ou un ingrédient diabolisé à tort | Vérificateur bloquant (allégations, alarmisme sans source officielle), doctrine « quand consulter » |
| Une célébrité mal citée (produit supposé, rumeur, photo) | Garde-fous durs de la doctrine, article « Célébrités » bloqué sans deux sources, jamais de photo de star |
| Une note de produit fausse publiée | Une note ne s'écrit qu'avec son relevé (code-barres, date), comparé à la base par le vérificateur |
| Un comparatif qui dénigre une marque | Doctrine : ce que chaque produit fait bien est dit ; jamais de marque d'autrui dans un titre de façon trompeuse |
| Lecteurs qui lisent sans installer | Mesure par emplacement d'appel ; le robot déplace et réécrit les appels qui ne convertissent pas |
| Marché français seul, plus petit | Viser la traîne (ingrédients précis, produits nommés) et le buzz, où la concurrence française lit rarement la composition |
| Les fiches ingrédients en `noindex` alors que Bing les visite | Décision produit à reprendre par l'humain : le robot les lie, ne change pas `lib/seoConfig.ts` |
| Les trois robots dans le même Chrome | Verrou `C:\Projet\.robot-chrome.lock`, une heure d'écart (6 h, 7 h, 8 h) |
| Les illustrations des douze premiers articles | Origine déduite (générées par IA pour Cosme Check), pas prouvée : toute image d'origine incertaine se remplace par une photo libre (`seo:photo`) |

## 6. À relire

- **Le 02/11/2026** : premiers chiffres PostHog par emplacement d'appel, premières positions Google des nouveaux articles, volume de pages vues après le passage sans cookie.
- **Le 16/11/2026** : effet des FAQ sur les impressions de requêtes en question ; part du buzz dans les vues du blog.
- **Chaque premier dimanche du mois** : le robot recale ces fourchettes sur les vrais chiffres.
