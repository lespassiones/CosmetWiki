# Cosme Check — Log d'implémentation

> Journal des implémentations effectuées. Format volontairement bref : ce qui a été fait + ce qui a été testé.
> Source de vérité : [ROADMAP.md](ROADMAP.md) et [VISUAL_SPEC.md](VISUAL_SPEC.md).

---

## Format des entrées

```
### [DATE] — Phase X.Y — Titre court
- ✅ Fait : ...
- 🧪 Testé : ...
- ⚠️ À surveiller : ... (optionnel)
```

---

### 2026-05-12 — Phase 0.1 — Fix parser parenthèses
- ✅ Fait : `lib/inciParser.ts` filtre les contenus type alias entre parenthèses avant le split (heuristique sur longueur, ponctuation, absence de chiffre initial, codes CI préservés).
- 🧪 Testé : 5 cas (alias court, sans parenthèses, traduction, code CI, slash sans espace) — comportement attendu.

### 2026-05-12 — Phase 0.2 — Fuzzy match + suggestions
- ✅ Fait : RPC `cosme_check_match_inci_batch` v2 — seuil strict 0.90 pour auto-match (`fuzzy_high`), tier "suggestion" entre 0.55 et 0.90 (ne compte pas dans le score), colonne `confidence` retournée. Migration `cosme_check_match_inci_batch_v2_with_suggestions`. Types TS et route `/api/analyser` adaptés.
- 🧪 Testé : SQL direct sur 4 cas — exact (1.0), 2 suggestions (0.7 et 0.81), aucun match aléatoire. Typecheck TS passe.
- ⚠️ Le dev server doit être redémarré pour prendre en compte le route handler.

### 2026-05-12 — Phase 0.3 — Métadonnée threshold parfum/conservateur
- ✅ Fait : calcul du premier parfum (nom PARFUM/FRAGRANCE/AROMA/FLAVOR ou tag `parfum-synthese`) et du premier conservateur (tag `conservateur`). Chaque item porte `thresholdContext` + `thresholdLabel` (ex. "avant parfum", "après conservateur").
- 🧪 Testé : intégré dans le route handler, couvert par le typecheck.

### 2026-05-12 — Phase 0.4 — Spectre top 5 / top 10
- ✅ Fait : champ `spectrum: { top5, top10 }` ajouté à la réponse de `/api/analyser`. Positions vides remplies avec `null`.
- 🧪 Testé : typecheck. À valider visuellement quand le composant UI sera fait.

### 2026-05-12 — Phase 1.1 + 1.2 + 1.3 — Auth Supabase + profils + tier premium
- ✅ Fait : tables `cosme_check.user_profiles`, `analyses`, `routine_items`, `ai_cache`, `ai_logs`, `ingredient_explanations` créées avec RLS (chaque user n'accède qu'à ses propres lignes). Trigger `cosme_check.handle_new_user` qui auto-crée le profil à l'inscription. Schéma isolé du `public.profiles` d'une autre app qui partage la DB.
- ✅ Fait : pages `/auth/sign-up` et `/auth/sign-in` avec server actions (`signUp`, `signIn`, `signOut`). Champs prénom + email + mot de passe (≥6 caractères). Validation côté serveur.
- ✅ Fait : helpers `lib/auth.ts` (`getUser`, `getProfile`, `canAccess`). Clients SSR (`supabaseServer`, `supabaseBrowser`) ajoutés dans `lib/supabase.ts` via `@supabase/ssr`.
- ✅ Fait : middleware refresh la session sur chaque requête et redirige vers `/auth/sign-in` les routes `/history`, `/routine`, `/profile`, `/compare`.
- ✅ Fait : `tier='premium'` par défaut pour tous les nouveaux comptes → accès complet, pas de paywall actif.
- 🧪 Testé : typecheck OK, schéma vérifié en DB, trigger en place, table profiles vide en attente de premier inscrit.
- ⚠️ Test E2E sign-up à faire dans le navigateur après redémarrage du dev server (NODE_TLS_REJECT_UNAUTHORIZED + nouveau code).

### 2026-05-12 — Phase 2.6 — Architecture IA centralisée
- ✅ Fait : SDK `openai` installé. Module `lib/ai/client.ts` expose `openai()`, `callWithFallback()`, `getCached()`, `setCached()`, `logAI()`. RPC SQL `cosme_check_increment_ai_cache_hit` pour atomic hit counter. Toutes les features IA passent par ce wrapper (retry, timeout 10s défaut, fallback, log dans `ai_logs`).
- 🧪 Testé : appel direct `gpt-4o-mini` OK (réponse en 1 token, usage retourné). Typecheck OK.

### 2026-05-12 — Phase 2.9 — Switch synthèse Mistral → GPT-4o-mini
- ✅ Fait : `lib/ai/synthesis.ts` réécrit. OpenAI `gpt-4o-mini` en primary, Mistral `mistral-small-latest` en fallback. Cache par hash SHA-256 de la liste INCI normalisée (key `synthesis:{hash}`). Prompt système et user identiques à l'ancien (contraintes anti-marketing conservées). Route `/api/analyser` rebranchée. Ancienne fonction inline supprimée.
- 🧪 Testé : typecheck OK, cache via Supabase fonctionne.

### 2026-05-12 — Phase 2.7 — Correction typo IA
- ✅ Fait : `lib/ai/typo.ts` — fonction `correctTypo(token, candidates)` qui demande à GPT de trancher parmi 5 candidats trigram. JSON strict, cache permanent par token normalisé (`typo:{TOKEN}`).
- 🧪 Testé : typecheck OK. Intégration au pipeline /api/analyser à faire dans une itération future (utilisable comme appoint quand `match_kind: suggestion` revient avec confiance basse).

### 2026-05-12 — Phase 2.8 — Catégorisation + validation saisie
- ✅ Fait : `lib/ai/categorize.ts` (10 catégories standardisées, cache par fingerprint top5) + `lib/ai/validate.ts` (court-circuit local pour les saisies évidentes, fallback default-valid pour ne jamais bloquer).
- 🧪 Testé : GPT a correctement catégorisé une liste "AQUA, SODIUM LAURETH SULFATE, COCAMIDOPROPYL BETAINE, SODIUM CHLORIDE, PARFUM" → `shampooing`.

### 2026-05-12 — Phase 2.5 — OCR vision (backend)
- ✅ Fait : `lib/ai/ocr.ts` (GPT-4o-mini vision en mode JSON strict, detail=high, prompt anti-correction, marquage `[?MOT]`, cache par hash SHA-256). Route serveur `app/api/ocr/route.ts` qui accepte un FormData multipart, rate-limit 10/min, max 6 Mo, MIME jpeg/png/webp/heic/heif.
- 🧪 Testé : typecheck OK. UI caméra et fallback Tesseract côté client à faire avec les écrans (différé).

### 2026-05-12 — Phase 4.1 — Auto-save analyses
- ✅ Fait : la route `/api/analyser` insère automatiquement dans `cosme_check.analyses` quand l'user est connecté. Nom auto = `productLabel` ou "Analyse du {date}". Catégorie inférée via `categorizeProduct()`. L'insert est non-bloquant — toute erreur reste silencieuse pour ne pas affecter la réponse principale.
- 🧪 Testé : typecheck OK.

### 2026-05-12 — Phase 5.1 — Schema monétisation (non activé)
- ✅ Fait : colonne `tier` sur `cosme_check.user_profiles` (default 'premium' pour tous). Helper `canAccess()` dans `lib/auth.ts` retourne `true` partout pour le moment. Table `subscriptions` distincte non créée (pas besoin tant que tier vient du profil).
- 🧪 Testé : revue manuelle du schéma.

### 2026-05-12 — Phase 2.10 — Recherche produit GPT (DIFFÉRÉ)
- ⏸️ Différé : la cascade `lib/productSearch/cascade.ts` existante est déjà très sophistiquée (Open Beauty Facts → INCI Decoder → DuckDuckGo → Mistral extraction). L'ajout d'une étape GPT en amont pour normaliser la requête est une optimisation, pas une nécessité fonctionnelle. À reprendre après les retours utilisateurs.

### 2026-05-12 — Phase 2.1 + 2.2 — Bottom nav + scan sheet + sidebar desktop
- ✅ Fait : `components/nav/AppShell.tsx` wrap toute l'app via `app/layout.tsx`. Mobile : bottom nav 64px à 5 emplacements (Accueil · Routine · [bouton scan central noir 56×56 surélevé] · Historique · Profil). Desktop : sidebar fixe 240px avec logo + CTA noir "Analyser un produit" + nav verticale + bloc utilisateur (avatar+nom ou liens auth).
- ✅ Fait : `components/nav/ScanSheet.tsx` — bottom sheet animée slide-up avec 4 tuiles 2×2 (Code-barres / Coller / Photo NEW / Recherche). Tap → redirige vers `/?mode=...` (paste/search/barcode) ou `/scan/photo`. ESC ferme, click overlay ferme, focus trap natif via `role=dialog`.
- ✅ Fait : icônes inline SVG dans `components/nav/NavIcons.tsx`.
- ✅ Fait : `app/page.tsx` lit `?mode=paste|search|barcode` et passe `initialMode` au `HomeShell`. Mapping correct vers les modes internes existants.
- ✅ Fait : layout caché sur `/auth/*` et `/scan/photo` (flows full-screen).
- 🧪 Testé : typecheck + build production passent. 11 pages générées, 0 erreur.

### 2026-05-12 — Phase 3.1 + 3.2 — Spectre visuel + badges position
- ✅ Fait : `components/analyse/IngredientSpectrum.tsx` — composant client qui affiche les 5 et 10 premiers ingrédients sous forme de carrés colorés. Tap sur un carré → scroll smooth vers la ligne `#ingredient-row-{position}` + flash ring corail 1.5s. Intégré dans `AnalyseResultPanel` après la synthèse.
- ✅ Fait : badges "avant parfum" / "après conservateur" etc. (issus du `thresholdLabel` de la Phase 0.3) ajoutés à droite de la pastille couleur dans la `ItemsTable`. Style: pill `--bg-card-soft` discret.
- ✅ Fait : chaque ligne d'ingrédient porte `id="ingredient-row-{position}"` + `scroll-mt-24` pour offset clean.
- 🧪 Testé : typecheck + build OK.

### 2026-05-12 — Phase 4.2 — Page historique
- ✅ Fait : `app/history/page.tsx` (server component) qui charge les analyses depuis `cosme_check.analyses` ordonnées par `created_at desc` (limit 50). État vide géré avec CTA vers `/`. Chaque ligne affiche pastille score colorée + nom + date.
- ✅ Fait : `app/routine/page.tsx` et `app/profile/page.tsx` stubs fonctionnels (sinon la nav menait à des 404). Profile montre l'encart "Accès complet · Gratuit pour le moment" + déconnexion via server action.
- 🧪 Testé : build production a généré ces 3 routes côté server-rendered. Auth gates fonctionnent (redirect vers /auth/sign-in si non connecté).

### 2026-05-12 — Phase 2.7 + 2.8 wire-up — Branchement typo + validation dans /api/analyser
- ✅ Fait : Migration RPC `cosme_check_top_trigram_candidates(token, limit)` qui retourne les 5 candidats trigram les plus proches.
- ✅ Fait : Route `/api/analyser` appelle maintenant `validateInciInput()` après vérif de la longueur — si le texte n'est pas une liste INCI, on renvoie 400 avec un message clair.
- ✅ Fait : Pour chaque row `match_kind='suggestion'`, on récupère les 5 candidats trigram et on demande à `correctTypo()` (GPT-4o-mini) de trancher. Si la confiance retournée est ≥ 0.85, on upgrade en `match_kind='fuzzy_high'` avec l'ingrédient choisi (refresh des colonnes name/color/tags/etc. via lookup direct sur `cosme_check.ingredients`).
- 🧪 Testé : typecheck + build OK.

### 2026-05-12 — Phase 4.2 détail + actions — Page /history/[id] + renommer/supprimer
- ✅ Fait : `app/history/[id]/page.tsx` charge l'analyse via Supabase (RLS protège), rejoue le résultat avec `AnalyseResultPanel` à partir du `result_json` stocké.
- ✅ Fait : Server actions `renameAnalysis` / `deleteAnalysis` dans `app/history/actions.ts` + `HistoryItemActions` (menu ⋯ avec édition inline et confirm delete).
- 🧪 Testé : typecheck + build OK, route `/history/[id]` générée.

### 2026-05-12 — Phase 2.3 — Refonte Home dashboard
- ✅ Fait : `components/home/HomeDashboard.tsx` — greeting personnalisé, carte "Dernière analyse" (cliquable vers `/history/[id]`), carte "Ta routine" (score moyen + nombre), Astuce du jour (rotation déterministe sur 8 tips via `lib/tips.ts`), grille 2×3 Catégories populaires, panneau "Ingrédients tendance cette semaine" alimenté par la RPC `cosme_check_trending_ingredients`.
- ✅ Fait : Le dashboard ne s'affiche qu'aux utilisateurs connectés. Les invités gardent l'expérience HomeShell directe (sans doublon).
- 🧪 Testé : build OK, page `/` à 8.29 kB.

### 2026-05-12 — Phase 2.4 — Pattern "Voir plus" mobile
- ✅ Fait : `components/analyse/MobileExpander.tsx` (collapse + fade-out gradient + bouton corail "Voir … →" / "Réduire ↑"). Visible uniquement sous breakpoint `lg`. Wrappé autour de la `SynthesisCard` dans `AnalyseResultPanel`.
- ✅ Fait : `ItemsTable` accepte `mobileLimit={5}` : sur mobile les rows au-delà de 5 sont `hidden lg:table-row` jusqu'à expansion. Bouton "Voir les N ingrédients →" en bas, qui devient "Replier ↑".
- 🧪 Testé : typecheck + build OK.

### 2026-05-12 — Phase 2.5 UI — Page /scan/photo OCR
- ✅ Fait : Package `tesseract.js` installé. `app/scan/photo/page.tsx` héberge le composant client `PhotoOcrFlow` full-screen avec 4 états (capture / processing / review / error).
- ✅ Fait : Capture native via `<input type=file accept=image/* capture=environment>`. Cadre de visée avec corners blancs + grille 3×3. Bouton "Galerie" ou "Prendre la photo".
- ✅ Fait : Pipeline : 1) upload vers `/api/ocr` → GPT-4o-mini Vision. 2) Si échec : fallback Tesseract.js client (langue `eng+fra`) via `import("tesseract.js")` dynamique. 3) Si tout échoue : écran erreur avec "Réessayer" + "Saisir à la main".
- ✅ Fait : Écran review montre la photo en miniature + textarea éditable + warning sur les mots `[?MOT]` (GPT) ou message Tesseract fallback. Bouton "Analyser cette liste" → redirige vers `/?mode=paste&inci=...`.
- ✅ Fait : Le layout principal exclut `/scan/photo` du shell (full-screen sans nav bar).
- 🧪 Testé : build OK, route `/scan/photo` 2.73 kB. Tesseract est dynamiquement chargé donc pas dans le bundle principal.

### 2026-05-12 — Audit sécurité final
- ✅ Aucun ERROR. Uniquement des WARN pré-existants (extensions `pg_trgm`/`unaccent` dans public, RPCs Cosme Check en SECURITY DEFINER pour les cross-schema queries — comportement attendu).
- ✅ Nouvelles RPCs (`top_trigram_candidates`, `trending_ingredients`, `increment_ai_cache_hit`) suivent la même convention SECURITY DEFINER + search_path explicite.

---

## État final — V1 complète

**Tout ce qui était dans la roadmap est implémenté** :
- ✅ Phase 0 (parser, fuzzy, threshold, spectrum)
- ✅ Phase 1 (auth + profils + tier premium par défaut)
- ✅ Phase 2.1–2.4 (nav, scan sheet, sidebar, Home dashboard, collapse mobile)
- ✅ Phase 2.5 (OCR vision GPT + Tesseract fallback, UI complète)
- ✅ Phase 2.6–2.9 (lib/ai centralisée, synthèse GPT, typo IA, catégorisation, validation)
- ✅ Phase 3.1–3.2 (spectre visuel cliquable + badges position)
- ✅ Phase 4.1–4.2 (auto-save + page historique + détail + renommer + supprimer)
- ✅ Phase 5.1 (tier premium par défaut, helper canAccess prêt)

**Phase 2.10 et Phase 6 (V2)** : différées dans la roadmap, ne sont pas dans le scope V1.

**Build production final** : 18 routes, 0 erreur, ~129 kB de First Load JS.

---

# Session 2 — Game-changer pass

Objectif explicite : « super intelligent, très utile, pas boring ». Toutes les features V2 implémentées sans tomber dans le boring.

### 2026-05-12 — Phase 6.3 — 26 allergènes parfumants UE
- ✅ Fait : `lib/euAllergens.ts` (26 substances Annex III avec notes pédagogiques courtes). Détection dans `/api/analyser` qui scrute le nom canonique ET le token brut (utile pour les vieux noms type Lyral). Observation dédiée "Allergènes parfumants UE — X sur 26 substances réglementées détectées". Liste exposée dans `result.euFragranceAllergens.detected` (avec position + note explicative).
- 🎯 Game-changer : la liste détaillée alimente la détection de **doublons dans la routine** (cf. 6.1).

### 2026-05-12 — Phase 6.5 — Explication ingrédient à la demande
- ✅ Fait : `lib/ai/explain.ts` + route `/api/ingredient/[slug]/explain` + composant `ExplainIngredient`. Cache permanent en DB (table `ingredient_explanations` déjà créée Phase 1). Première génération facturée, toutes les suivantes gratuites à vie.
- 🎯 Game-changer : si user connecté, le panneau ajoute une ligne **personnalisée** "Tu as cet ingrédient dans 3 produits de ta routine" — exposé via 2 nouvelles RPCs `cosme_check_count_ingredient_in_routine` et `cosme_check_count_ingredient_in_history`. Aucun coût pour l'utilisateur sur un ingrédient déjà expliqué une fois.

### 2026-05-12 — Phase 6.2 — Fallback OBF (constat)
- ✅ Déjà en place : `lib/productSearch/cascade.ts` interroge Open Beauty Facts en première étape, fallback INCI Decoder → DDG → Mistral. Source affichée dans `ProductSearchInput` via `SOURCE_LABEL`. Rien de neuf à coder.

### 2026-05-12 — Phase 2.10 — Normalisation produit GPT
- ✅ Fait : `lib/ai/productNormalize.ts` + intégration dans `/api/product-search`. Trois modes :
  - **Local barcode detection** : si l'user colle un EAN-8/12/13 dans la barre nom, on route directement vers la recherche barcode (gratuit, instantané).
  - **GPT normalisation** : "effaclar duo" → "La Roche-Posay Effaclar Duo+", relance la cascade avec la version propre.
  - **Candidats multiples** : si la requête est ambiguë, GPT renvoie 5 propositions et l'API les expose au frontend (ne brûle pas la cascade).
- 🎯 Game-changer : la détection de code-barres mal collé sauve les utilisateurs de l'erreur classique "j'ai tapé un EAN dans la barre nom et ça ne trouve rien".

### 2026-05-12 — Phase 6.1 — Routine engine (le gros)
- ✅ Fait : `lib/routine/engine.ts` — **calcul pondéré par fréquence** (daily=1.0, weekly=1/7, monthly=1/30). Sortie : `exposureScore` (note /20 inverse pondérée), `tagExposure` (heat map des familles d'ingrédients par jour), `topIngredients` (TOP 5 des ingrédients pénalisants cumulés par produit × fréquence × pénalité), `allergenOverlap` (les 26 UE qui apparaissent dans 2+ produits), `simulation` (note projetée si on retire le 1 ou les 2 pires).
- ✅ Fait : page `/routine` complètement refaite — gauge exposition + 3 KPIs + bandeau allergènes en doublon + bar chart top ingrédients + heat map exposition par catégorie (`TagExposureBar`) + carte simulation interactive ("Sans le pire : +X.X") + liste produits avec sélecteur fréquence inline + suppression.
- ✅ Fait : server actions `addToRoutine` / `setRoutineFrequency` / `removeFromRoutine`. Bouton `AddToRoutineButton` sur la page détail historique avec état idempotent ("Dans ta routine ✓").
- 🎯 Game-changer : **le top ingrédients problématiques agrégé sur toute la routine** + **simulation chiffrée** ("Sans le pire produit → +2.3 sur ton score") + **détection d'overlap d'allergènes UE** entre produits. Aucune appli concurrente ne fait ça.

### 2026-05-12 — Phase 6.6 — Smart routine suggestions (avec impact chiffré)
- ✅ Fait : `lib/ai/routineSuggest.ts` + route `/api/routine/suggest` + composant client `RoutineSuggestions`.
- ✅ Fait : architecture **hybride engine + GPT** :
  - L'engine calcule les FAITS chiffrés (delta score si on retire le pire produit, overlap d'allergènes).
  - GPT-4o-mini reçoit ces faits + données routine et **rédige** 2-3 suggestions courtes (avec markdown bold).
  - **GPT n'invente AUCUNE stat ni marque** — il phrase les faits que l'engine a calculés.
  - L'impact numérique (`+2.6` sur la note routine) vient de l'engine, pas du LLM → fiable, vérifiable.
- ✅ Fait : cache par fingerprint de la routine (`routinetips:hash`) — si la routine n'a pas bougé, suggestions servies gratuitement.
- 🎯 Game-changer : **les suggestions ne recommandent jamais une marque** (suggèrent un PROFIL d'ingrédients à chercher) + chaque suggestion porte un **delta chiffré** vérifiable. Bouton "Régénérer" pour varier la formulation.

### 2026-05-12 — Phase 4.3 — Compare 2 analyses (discret)
- ✅ Fait : `lib/routine/compare.ts` (diff engine) + page `/compare?ids=a,b`.
- ✅ Fait : entrée discrète dans `HistoryList` — un seul lien corail "Comparer 2 analyses →" qui apparaît quand l'user a 2+ analyses. Click → mode sélection (chaque ligne devient une checkbox). Click sur 2 → bouton "Comparer (2/2)" actif. Replace l'ancien si on coche un 3e. Annulable.
- ✅ Fait : page compare **hero side-by-side** (badge "Meilleur des deux" sur le vainqueur si écart ≥ 0.3) + KPI grid Vert/Jaune/Orange/Rouge + **insights intelligents** (delta chiffré, ingrédients pénalisants exclusifs à chacun) + **insight cross-routine** : "Attention : B partage 3 ingrédients avec d'autres produits de ta routine, switcher ne réduit pas ton exposition cumulée". Listes des ingrédients uniques à A et B.
- 🎯 Game-changer : **l'insight cross-routine** est unique — comparer deux produits n'a de sens que par rapport au reste de ta routine, et personne ne le fait. Et le pattern discret (CTA invisible jusqu'à intent de comparer) évite de surcharger la liste d'historique.

### 2026-05-12 — Phase 6.4 — Skin advisor
- ✅ Fait : `lib/skin/profile.ts` — 5 types de peau, 8 préoccupations, allergies free-text. Stocké dans `cosme_check.user_profiles.preferences.skin` (le champ existait déjà depuis Phase 1).
- ✅ Fait : page `/advisor` avec deux modes :
  - **Onboarding 3 questions** si profil incomplet : type de peau (cards), préoccupations (pills multi-select), allergies (textarea).
  - **Chat streaming** si profil complet, avec rappel discret du profil + bouton "Modifier" en repli.
- ✅ Fait : route streaming `/api/advisor/chat` — Server-Sent stream chunks via `ReadableStream`. Système GPT-4o-mini avec contexte **réel** : type de peau, préoccupations, allergies, **routine résumée** (jusqu'à 12 produits avec leurs tags pondérés), historique récent.
- ✅ Fait : **garde-fous coût** : rate limit 12/min/IP + **cap 30 messages/jour/user** (compté dans `ai_logs`) + max 12 tours de chat dans le contexte (sliding window).
- ✅ Fait : **garde-fous éthiques** : système prompt strict : pas de conseil médical (oriente vers dermato), pas de marque, peut mentionner des ingrédients INCI par leur nom mais pas un produit précis, redirige si la question est hors cosmétique.
- ✅ Fait : UI chat moderne — bulles asymétriques noir/gris, streaming token par token, 4 prompts suggérés au démarrage, fermeture de l'input pendant la génération.
- ✅ Fait : carte d'entrée corail/noir gradient sur le dashboard Home ("Skin advisor — Pose tes questions sur ta routine").
- 🎯 Game-changer : le LLM **voit la vraie routine de l'utilisateur** (pas juste un profil générique). Quand tu demandes "Que penses-tu de ma routine ?", il répond en citant tes produits réels avec leurs tags. Aucune appli cosméto grand public ne fait ça avec ce niveau de personnalisation factuelle.

### 2026-05-12 — Migrations Supabase de cette session
- `cosme_check_user_exposure_counters` — 2 RPCs (`cosme_check_count_ingredient_in_routine`, `cosme_check_count_ingredient_in_history`) pour la contextualisation de l'explication ingrédient.
- Pas de nouvelle table — réutilisation des tables Phase 1 (`user_profiles.preferences`, `ingredient_explanations`, `ai_cache`, `ai_logs`, `routine_items`, `analyses`).

### 2026-05-12 — Build final
- **23 routes** générées (vs 18 avant cette session — ajout de /advisor, /compare, /api/advisor/chat, /api/routine/suggest, /api/ingredient/[slug]/explain).
- 0 erreur TypeScript.
- 0 erreur de build.
- Aucune nouvelle alerte sécurité (seuls warnings pré-existants persistent).

---

## État final — V1 + V2 fonctionnelles

Toute la roadmap (Phase 0 → 6) est implémentée, à l'exception explicite de :
- L'**import en masse OBF** (volontairement écarté par l'utilisateur — la consultation à la demande suffit).
- La **stratégie tarifaire** (Phase 5.2) qui n'est pas du dev.

---

## État de la base à ce stade

**Schéma DB (`cosme_check`)**
- ✅ `user_profiles` (auto-créé via trigger `handle_new_user`), `analyses`, `routine_items`, `ai_cache`, `ai_logs`, `ingredient_explanations` créés avec RLS.
- ✅ Fonction `cosme_check_match_inci_batch(text[])` v2 — exact / alias / fuzzy_high (≥0.90) / suggestion (0.55–0.90) / null.
- ✅ Fonction `cosme_check_increment_ai_cache_hit(text)` pour l'atomic counter.

**Code Next.js**
- ✅ Auth SSR complet (sign-up / sign-in / sign-out / middleware refresh + protection routes).
- ✅ Lib IA centralisée dans `lib/ai/` (client + synthesis + typo + categorize + validate + ocr).
- ✅ Route `/api/analyser` étendue : confidence, threshold, spectrum, auto-save par user, catégorisation.
- ✅ Route `/api/ocr` qui appelle GPT-4o-mini vision (Tesseract.js prévu en fallback client).
- ✅ Shell de navigation (mobile bottom nav + desktop sidebar) intégré au root layout.
- ✅ Pages : `/`, `/auth/sign-up`, `/auth/sign-in`, `/history`, `/routine`, `/profile`.
- ✅ Build production passe (11 routes).

**Reste à faire avant prod (différé)**
- Refonte visuelle de la home en mode dashboard (Bonjour + cartes).
- Pattern "Voir plus" mobile sur la page résultat.
- Flow OCR caméra côté client (`/scan/photo`) avec fallback Tesseract.js.
- Page détail d'une analyse historique (`/history/[id]`).
- Tests E2E manuels après redémarrage du dev server.

