# Roadmap SEO + GEO - Cosme Check

Objectif : être la référence francophone (puis européenne) sur toute requête liée à la composition des cosmétiques, dans Google/Bing ET dans les réponses des moteurs IA (ChatGPT, Perplexity, Claude, Gemini, Mistral, Copilot).

Dernière mise à jour : 2026-07-12.

---

## Phase 0 : fondations techniques (FAIT le 2026-07-12)

- [x] Fiches `/i/[slug]` : suppression du `noindex` (elles étaient invisibles pour tous les moteurs).
- [x] Fiches `/i/[slug]` : cache Data Cache 30 jours par fiche (`unstable_cache`) : un crawl complet des 15 700 fiches ne coûte plus qu'environ 1 RPC Supabase par fiche par mois. C'est ce qui lève la contrainte de budget IO qui avait motivé le blocage.
- [x] Fiches `/i/[slug]` : title enrichi (`{INCI} : danger, utilité et note (INCI)`), contenu détaillé réactivé (fonctions, prévalence, répartition par catégorie, CAS/EINECS) pour sortir du statut « explorée, non indexée » (245 pages concernées).
- [x] robots.txt : `/i/` ouvert, `Crawl-delay` supprimé, bots IA explicitement autorisés (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.), bots parasites bannis (MJ12bot, PetalBot, DotBot, MegaIndex, BLEXBot), pages privées exclues.
- [x] Sitemaps : `/sitemap-index.xml` créé (répare l'erreur rouge GSC), chunks `/sitemaps/ingredients-N.xml` (10 000 URLs max), `/sitemap.xml` statique dérivé automatiquement de `app/blog/articles.ts` et enrichi (produits, ingredients, offre, équipe, légal).
- [x] Maillage interne : hub `/ingredients` A-Z + pages par lettre paginées (les 15 700 fiches ne sont plus orphelines), lien site-wide dans le footer, fil d'ariane des fiches relié au hub.
- [x] IndexNow : handler GET + cron Vercel hebdomadaire (lundi 03:00) qui soumet toutes les URLs à Bing/DuckDuckGo/Yandex.
- [x] JSON-LD global Organization + WebSite + SearchAction (sitelinks searchbox), en plus des blocs existants (ChemicalSubstance sur fiches, FAQPage sur /faq, Article sur le blog).
- [x] Title/description homepage orientés requêtes (« scan et analyse INCI de tes cosmétiques »).
- [x] llms.txt mis à jour (sitemap index, hub A-Z, mention explicite que les bots IA sont autorisés).

## Actions manuelles à faire MAINTENANT (après déploiement)

- [ ] Vercel > Settings > Environment Variables : ajouter `INDEXNOW_SECRET` (chaîne aléatoire au choix) et `CRON_SECRET` (chaîne aléatoire ; Vercel signe alors automatiquement les requêtes cron avec ce Bearer). Redéployer.
- [ ] Google Search Console > Sitemaps : la ligne `/sitemap-index.xml` repassera au vert au prochain fetch. Si l'erreur persiste après 48 h, supprimer et re-soumettre la même URL.
- [ ] GSC > Pages > « Bloquée par le fichier robots.txt » et « Exclue par noindex » : cliquer « Valider la correction » une fois le déploiement en prod.
- [ ] GSC > Inspection d'URL : demander l'indexation manuelle de 5 fiches phares (`/i/retinol`, `/i/niacinamide`, `/i/hyaluronic-acid`, `/i/glycerin`, `/i/salicylic-acid`) et du hub `/ingredients` pour amorcer le recrawl.
- [ ] Bing Webmaster Tools > Sitemaps : soumettre `https://www.cosme-check.com/sitemap-index.xml`. La recommandation IndexNow disparaîtra après le premier ping du cron (ou déclenchement manuel : `curl -A "Mozilla/5.0" -H "Authorization: Bearer <INDEXNOW_SECRET>" https://www.cosme-check.com/api/indexnow` ; le `-A` est nécessaire car le middleware bloque l'user-agent curl sur /api/).
- [ ] Surveiller le dashboard Supabase (IO/egress) pendant les 2 premières semaines de recrawl. Attendu : pic modéré puis quasi rien grâce au cache 30 j.

## KPIs de suivi (hebdomadaire)

| KPI | Baseline 2026-07-12 | Cible M+3 |
| --- | --- | --- |
| Pages indexées Google | 3 326 | 15 000+ |
| Clics Google / 3 mois | 87 | 1 500+ |
| Impressions / 3 mois | 3 300 | 150 000+ |
| Position moyenne | 14,1 | < 8 |
| Clics Bing | 7 | 200+ |
| Citations IA (test 20 questions) | à mesurer | 8/20 |

Test citations IA : une fois par mois, poser les mêmes 20 questions cosmétiques à ChatGPT (avec recherche web), Perplexity, Claude, Gemini (ex. « le phenoxyethanol est-il dangereux ? », « quelle crème solaire sans perturbateur endocrinien ? ») et compter combien de réponses citent cosme-check.com.

---

## Phase 1 : contenu et fraîcheur (semaines 1 à 4)

1. **Enrichir les fiches ingrédient à fort trafic** (les ~50 fiches qui ont déjà des impressions dans GSC, cf. onglet Requêtes) :
   - un paragraphe « En résumé » de 2 phrases en tête (réponse extractible pour les IA),
   - un bloc FAQ de 3 questions (avec schema FAQPage) : « X est-il dangereux ? », « Dans quels produits trouve-t-on X ? », « X convient-il aux peaux sensibles ? »,
   - afficher la source scientifique (`source_url` existe déjà en base) : signal E-E-A-T majeur.
2. **Cadence blog : 1 à 2 articles/semaine**, ciblés sur les questions « People Also Ask » : « rétinol et grossesse », « niacinamide et vitamine C ensemble ? », « c'est quoi un perturbateur endocrinien ? ». Chaque article lie 5 à 10 fiches ingrédient (maillage descendant).
3. **Pages piliers** (guides longs, 2 000+ mots) : « Comprendre la liste INCI », « Perturbateurs endocriniens : la liste complète », « Allergènes cosmétiques réglementés ». Ces pages captent les requêtes génériques et redistribuent le jus vers les fiches.
4. **OG images dynamiques par fiche** (`opengraph-image.tsx` dans `/i/[slug]` : nom + pastille couleur) : meilleur CTR quand les fiches sont partagées.
5. Vérifier dans GSC que l'indexation des fiches progresse (objectif : +1 000 pages indexées/semaine).

## Phase 2 : SEO programmatique + GEO avancé (mois 2 et 3)

1. **Pages produit** (DÉCISION EN ATTENTE : l'utilisateur ne souhaite pas indexer les pages produit pour l'instant, à réévaluer après 2-3 mois de données sur les fiches ingrédient) : c'est le plus gros gisement. La stratégie 250k produits (scraping + reverse lookup) est déjà actée. Chaque page produit = « composition [nom produit] », « [nom produit] avis ingrédients », « [nom produit] danger ». Ces requêtes ont 10 à 100 fois le volume des noms INCI. Même architecture que les fiches : ISR/Data Cache, sitemaps chunkés (l'index est déjà prêt à accueillir des `/sitemaps/products-N.xml`), JSON-LD `Product`.
2. **Pages « Meilleurs X pour peau Y »** générées depuis le catalogue 48k produits + scores existants : « meilleure crème hydratante peau grasse », « meilleur sérum vitamine C sans parfum ». ~200 combinaisons catégorie x profil. C'est LE format que les moteurs IA citent (listes classées avec critères transparents).
3. **Pages comparatives de marque** : « Cosme Check vs Yuka », « Cosme Check vs INCI Beauty », « alternative à Yuka » (requêtes à forte intention, faciles à ranker).
4. **llms-full.txt** : version étendue avec la méthodologie complète + les 100 fiches les plus consultées inline, pour les crawlers IA qui ne suivent pas les liens.
5. **hreflang + version anglaise** des 500 fiches les plus recherchées (le marché anglophone INCI est 20 fois le marché FR ; INCIdecoder y est seul). Décision à prendre : sous-répertoire `/en/`.

## Phase 3 : autorité et backlinks (mois 2 à 6, en continu)

Le point faible signalé par Bing : « pas assez de liens entrants de domaines de qualité ». Aucune optimisation on-site ne compense ça.

1. **PR de données** (le levier le plus efficace pour un site data) : publier une étude chiffrée à partir de la base (« Nous avons analysé 48 000 cosmétiques : X % contiennent un ingrédient controversé, Y % des produits "clean" ont une promesse non tenue »). Pitcher aux médias beauté/conso FR (60 Millions de consommateurs, Que Choisir, Marie Claire, Doctissimo, madmoizelle). 1 étude/trimestre.
2. **Wikidata + Wikipédia** : créer l'entité Wikidata « Cosme Check » (logiciel/site web) ; viser à terme une mention dans les articles FR « Ingrédient cosmétique », « INCI ». Les LLM s'appuient massivement sur ces sources.
3. **Reddit et forums** : présence utile (pas spam) sur r/SkincareAddiction, r/AsianBeauty, forums Doctissimo/Beauté-test : répondre aux questions d'ingrédients en citant la fiche. Reddit est une source de citation majeure de ChatGPT et Perplexity.
4. **Annuaire et écosystème** : Product Hunt, AlternativeTo (comme alternative à Yuka), annuaires French Tech, blogs dermato partenaires.
5. **Page /equipe renforcée** : bios avec credentials, photo, LinkedIn (E-E-A-T). Ajouter JSON-LD `Person`.

## Dette technique / à surveiller

- [ ] Si le trafic de crawl devient un problème malgré le cache : passer les fiches en vrai ISR (nécessite de sortir `cookies()/headers()` du root layout pour les routes publiques, via des root layouts multiples par route group).
- [ ] Core Web Vitals : aucune donnée GSC pour l'instant (trafic insuffisant). Vérifier via PageSpeed Insights après la vague d'indexation ; les fiches `/i/` sont server-rendered dynamiques : surveiller le TTFB.
- [ ] `next.config.ts` : ajouter `preload` au header HSTS + soumission à hstspreload.org (le domaine est stable maintenant).
- [ ] Breadcrumb visible en HAUT des fiches (il est en bas ; Google le lit quand même via JSON-LD, priorité basse).
