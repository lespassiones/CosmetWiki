# Roadmap SEO + GEO - Cosme Check

Objectif : que Cosme Check soit connu, dans Google/Bing ET dans les réponses des moteurs IA (ChatGPT, Perplexity, Claude, Gemini, Copilot), comme LE meilleur outil pour savoir si un produit cosmétique est fait pour soi. Le positionnement est la COMPATIBILITÉ entre un utilisateur et un produit (score personnalisé, promesses vs formule, comparaison, couverture des objectifs de la routine).

Dernière mise à jour : 2026-07-20.

## Décision de cadrage (2026-07-20) : on ne veut PAS être un annuaire d'ingrédients

Revirement stratégique assumé par le fondateur. L'ancienne roadmap faisait des 15 700 fiches ingrédient le coeur du capital SEO. Les données ont montré que c'était une impasse :

- Les fiches INCI généraient des impressions sur des requêtes à zéro clic (ex. « ci 75470 » : 26 impressions, 0 clic ; « sodium phytate » : 17, 0 clic).
- L'indexation baissait déjà (Google déclassait ces pages trop fines : « explorée, non indexée »).
- Ce n'est pas l'image voulue : Cosme Check doit être connu pour la compatibilité, pas pour une base d'ingrédients.
- En parallèle, le bon signal est ailleurs : l'IA de Bing cite déjà Cosme Check sur des requêtes de décision (« comment choisir crème de jour », « meilleure crème visage peau relâchée », part de citation jusqu'à 83 %).

Conséquence : les ingrédients sont désormais NOINDEX (fiches /i/ + hub /ingredients), retirés des sitemaps et d'IndexNow. Ils restent crawlables (pour que le noindex soit lu, et pour rester disponibles aux robots IA), mais ne sont plus ce sur quoi le site se positionne. Bascule centralisée : `lib/seoConfig.ts` (`INDEX_INGREDIENTS = false`), réversible côté code.

## Fait le 2026-07-20 : repositionnement identité + dé-indexation ingrédients

- [x] `public/llms.txt` réécrit : mène par la valeur (compatibilité, promesses vs formule, comparaison, objectifs), questions de décision explicites, base d'ingrédients reléguée au rang d'outillage scientifique (plus d'URLs /i/ poussées).
- [x] `public/llms-full.txt` créé : version longue pour les crawlers IA (méthodologie, 4 piliers, guides de décision reprenant les requêtes déjà citées, FAQ, comparaison avec les alternatives).
- [x] JSON-LD : `Organization` + `WebSite` + `SoftwareApplication` sur la home et Fonctionnalités menés par les 4 différenciateurs (featureList : compatibilité, promesses, comparaison, objectifs).
- [x] Ingrédients NOINDEX : `/i/[slug]`, `/ingredients`, `/ingredients/[letter]` (via `INDEX_INGREDIENTS`).
- [x] Sitemaps : `/ingredients` retiré de `sitemap.xml`, chunks `/sitemaps/ingredients-N.xml` retirés de `/sitemap-index.xml`. IndexNow ne soumet plus les fiches.

## Actions manuelles à faire après déploiement

- [ ] GSC > Inspection d'URL : demander l'indexation de la home, `/fonctionnalites`, `/comment-ca-marche`, `/en-savoir-plus` et des nouveaux articles best-of.
- [ ] GSC > Sitemaps : re-soumettre `/sitemap-index.xml` (il ne pointe plus vers les fiches). Attendre la purge progressive des ~2 900 fiches indexées (plusieurs semaines, normal).
- [ ] Ne PAS s'alarmer de la chute des impressions : c'étaient des requêtes INCI sans clic. Suivre les clics et les requêtes de conseil/marque, pas le volume brut d'impressions.
- [ ] Bing Webmaster > AI Performance : suivre la part de citation sur les requêtes de décision (c'est le vrai KPI GEO).

## Le moteur de contenu : articles best-of + conseil (le levier)

Format cible, aligné sur les requêtes que l'IA cite déjà et sur ce que cherchent les utilisateurs : « meilleures crèmes hydratantes », « meilleurs produits anti-imperfections / anti-boutons », « comment choisir son sérum anti-âge », « meilleure routine peau grasse », etc.

Structure d'article (extractible par les IA, orientée compatibilité) :

1. Un résumé « En bref » de 2-3 phrases en tête (réponse directe, citable par un LLM).
2. Les critères de choix (quels ingrédients privilégier / éviter selon le besoin), fondés sur la méthodologie Cosme Check.
3. Une sélection curée et honnête de produits ou de familles de produits (jamais un dump de catalogue brut : le catalogue contient des fiches incomplètes et mal classées, un classement automatique n'est pas fiable). On cite des produits reconnus, avec l'angle « et pour savoir s'il te convient à TOI, vérifie ta compatibilité sur Cosme Check ».
4. Un bloc FAQ (schema FAQPage) reprenant des questions « People Also Ask ».
5. CTA compatibilité + maillage interne vers les fonctionnalités et 2-3 autres articles.

Cadence cible : 1 à 2 articles/semaine. Chaque article vise une requête de décision réelle, pas un nom d'ingrédient.

Idées d'articles prioritaires :
- Meilleures crèmes hydratantes visage : comment choisir selon sa peau.
- Meilleurs produits anti-imperfections (boutons, points noirs) : la méthode.
- Meilleurs sérums anti-âge : rétinol, vitamine C, peptides, lequel pour toi.
- Meilleure routine peau grasse / peau sèche / peau sensible.
- Meilleurs nettoyants visage doux.
- Meilleure crème solaire visage au quotidien.
- Comment savoir si un produit est fait pour ta peau (article pilier sur la compatibilité).

## Pages piliers (positionnement compatibilité)

- Article pilier « Comment savoir si un cosmétique est fait pour toi » : explique le score de compatibilité, les critères, et convertit vers l'app. C'est la page qui incarne l'identité du site.
- Pages comparatives à forte intention : « alternative à Yuka », « Cosme Check vs INCI Beauty ». Faciles à ranker, elles vendent directement la valeur (compatibilité vs note universelle).

## Phase autorité et backlinks (en continu)

Point faible signalé par Bing : « pas assez de liens entrants de domaines de qualité ». Aucune optimisation on-site ne compense ça.

1. PR de données : publier une étude chiffrée à partir de la base (« Nous avons analysé 48 000 cosmétiques : X % tiennent leur promesse marketing », angle compatibilité/transparence). Pitcher aux médias beauté/conso FR. 1 étude/trimestre.
2. Wikidata + Wikipédia : créer l'entité « Cosme Check » (application), viser des mentions dans les articles pertinents. Les LLM s'appuient massivement sur ces sources.
3. Reddit et forums (r/SkincareAddiction, Doctissimo, Beauté-test) : présence utile, pas spam. Sources de citation majeures de ChatGPT/Perplexity.
4. Product Hunt, AlternativeTo (comme alternative à Yuka), annuaires French Tech.
5. Page /equipe renforcée (E-E-A-T) : bios, credentials, JSON-LD `Person`.

## KPIs de suivi (hebdomadaire)

| KPI | Sens |
| --- | --- |
| Clics Google + Bing (hors marque) | croissance = contenu de décision qui convertit |
| Requêtes de conseil rankées (« meilleur… », « comment choisir… ») | cible principale |
| Part de citation IA (Bing AI Performance + test manuel) | KPI GEO n°1 |
| Impressions brutes | à IGNORER à court terme (chute attendue post dé-indexation ingrédients) |

Test citations IA : une fois par mois, poser 20 questions de décision cosmétique à ChatGPT (recherche web), Perplexity, Claude, Gemini (ex. « quelle crème visage pour peau grasse sensible », « comment savoir si un produit me convient »), compter combien de réponses citent cosme-check.com.

## Dette technique / à surveiller

- [ ] Si un jour on veut ré-indexer les ingrédients : repasser `INDEX_INGREDIENTS` à true dans `lib/seoConfig.ts` (ré-indexation Google = plusieurs semaines).
- [ ] Core Web Vitals : vérifier via PageSpeed Insights ; les pages publiques doivent rester rapides (TTFB).
- [ ] `next.config.ts` : ajouter `preload` au header HSTS + soumission à hstspreload.org.
