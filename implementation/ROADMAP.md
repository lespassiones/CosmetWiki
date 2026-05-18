# Cosme Check - Roadmap d'implémentation

> Document de référence pour toutes les évolutions à venir, classées par phase et par priorité.
> **Aucun code ici** - uniquement des spécifications fonctionnelles et techniques.
> Chaque tâche indique : objectif, détails d'implémentation, fichiers/zones impactés, critères d'acceptation.

---

## Légende

- 🔴 **Critique** - bloque la qualité ou la confiance utilisateur
- 🟠 **Important** - fort impact UX/produit
- 🟡 **Souhaitable** - améliore l'expérience sans être bloquant
- ⚪ **Futur** - à activer plus tard / après retours utilisateurs

---

# PHASE 0 - Fiabilité backend (silencieuse)

> **Objectif** : éliminer les défauts de parsing et de matching qui sapent la crédibilité de l'analyse.
> **Aucune UI modifiée** dans cette phase. Tout le travail est sur le pipeline d'analyse.

## 0.1 🔴 Fix parser parenthèses (Aqua / Water / Eau → 1 ingrédient)

**Problème actuel**
Le parser INCI traite `Aqua (Water / Eau)` comme 3 ingrédients distincts (Aqua, Water, Eau) au lieu d'une seule entrée dont le contenu entre parenthèses est une précision/traduction.

**Implémentation**
- Étape 1 : avant la tokenisation par virgule, retirer le contenu entre parenthèses si celui-ci ne contient pas de virgule terminale, OU le conserver uniquement comme métadonnée d'affichage.
- Règle : `INCI_NAME (alias1 / alias2)` → token principal `INCI_NAME`, aliases ignorés pour le matching mais retournés comme `original_input` pour l'affichage.
- Cas particulier : si l'utilisateur a réellement saisi `Aqua, Water, Eau` (3 entrées séparées par virgules), garder le comportement actuel (3 tokens) - la déduplication est gérée plus loin par déduplication sur `inci_id`.

**Fichier impacté**
- `lib/inciParser.ts` - fonction `parseInciList`

**Critère d'acceptation**
- Coller `Aqua (Water / Eau), Glycerin` → 2 ingrédients reconnus (Aqua + Glycerin), pas 4.
- Coller `Aqua, Water, Eau` → 1 ingrédient reconnu après déduplication (les 3 pointent vers le même `inci_id`).

---

## 0.2 🔴 Tuning fuzzy match + suggestion "Vouliez-vous dire"

**Problème actuel**
Le fuzzy match peut soit générer des faux positifs (matche un ingrédient inexistant à un proche orthographique) soit ne rien trouver. C'est exactement le défaut d'INCI Beauty qu'on veut éviter.

**Implémentation**
- Activer l'extension PostgreSQL `pg_trgm` sur Supabase.
- Modifier `cosme_check_match_inci_batch` (fonction Postgres) pour ajouter une étape :
  1. Exact match → si trouvé, OK.
  2. Sinon, alias match → si trouvé, OK.
  3. Sinon, trigram similarity sur le nom INCI avec seuil **≥ 0,75**.
     - Si **≥ 0,90** : match auto avec `match_kind: "fuzzy_high"`.
     - Entre **0,75 et 0,90** : retourner `match_kind: "suggestion"` avec un champ `suggested_name` + `confidence`, **sans** affecter `inci_id` automatiquement.
     - Sous **0,75** : non reconnu (`match_kind: null`).
- Côté API `/api/analyser` : renvoyer la suggestion dans la réponse pour que l'UI puisse afficher "Vouliez-vous dire X ?".

**Fichiers impactés**
- Migration Supabase : nouvelle migration `add_trigram_fuzzy_matching.sql`
- `app/api/analyser/route.ts` - type `MatchRow` enrichi avec `suggested_name`, `confidence`
- Frontend : composant qui affiche un badge "Suggestion : X ?" sur les rows ambigus

**Critère d'acceptation**
- `Behentrimomium` (faute frappe) → suggère "Behentrimonium" avec confidence > 0,85.
- `XyzAleatoire123` → non reconnu, **aucune** suggestion forcée.
- `Glycerine` (synonyme proche) → match alias direct, pas fuzzy.

---

## 0.3 🟠 Métadonnée "avant/après parfum/conservateur"

**Objectif**
Différenciateur UX : montrer à l'utilisateur si un ingrédient apparaît avant ou après le 1er parfum / 1er conservateur dans la liste (proxy de concentration sous 1 %).

**Implémentation**
- Dans la réponse de `/api/analyser`, après l'analyse :
  - Trouver `firstFragrancePosition` : index du 1er ingrédient avec tag `parfum-synthese` OU dont le nom INCI est `PARFUM` / `FRAGRANCE`.
  - Trouver `firstPreservativePosition` : index du 1er ingrédient avec tag `conservateur`.
  - Pour chaque ingrédient à partir de la position min(firstFragrancePosition, firstPreservativePosition) :
    - flag `positionContext: "before_threshold" | "after_threshold"`.
- Si aucun parfum ni conservateur dans la liste : champ vide.

**Fichier impacté**
- `app/api/analyser/route.ts` - enrichissement de chaque `item` retourné

**Critère d'acceptation**
- Liste `[A, B, Parfum, C, D]` → A, B = `before_threshold`, C, D = `after_threshold`.
- API renvoie le `thresholdLabel` correspondant ("avant parfum" / "après parfum" / "avant conservateur" / "après conservateur").

---

## 0.4 🟠 Spectre top 5 / top 10 - données

**Objectif**
Fournir au frontend la structure pour afficher le spectre visuel des 5 et 10 premiers ingrédients.

**Implémentation**
- Pas de nouveau calcul lourd : juste exposer un champ `spectrum` dans la réponse :
  ```
  spectrum: {
    top5: [ColorRating | null, ...],  // 5 entrées
    top10: [ColorRating | null, ...]  // 10 entrées
  }
  ```
- Si moins de 5 ou 10 ingrédients, remplir avec `null` les positions manquantes.

**Fichier impacté**
- `app/api/analyser/route.ts`

**Critère d'acceptation**
- Une analyse à 13 ingrédients renvoie `spectrum.top5` (5 valeurs) et `spectrum.top10` (10 valeurs).
- Une analyse à 3 ingrédients renvoie `spectrum.top5` = [Vert, Jaune, Orange, null, null].

---

# PHASE 1 - Authentification

> **Objectif** : permettre à un utilisateur de créer un compte pour persister son historique et sa routine.

## 1.1 🔴 Sign up / Sign in / Sign out avec Supabase Auth

**Décisions actées**
- Confirmation email **désactivée** sur Supabase (déjà fait par l'utilisateur).
- Champs sign up : Prénom, Email, Mot de passe.
- Magic link **non prioritaire** pour V1 (futur).
- Mode invité (guest) **toléré** : l'utilisateur peut analyser sans compte, mais ne peut pas sauvegarder.

**Implémentation**
- Pages : `/auth/sign-in`, `/auth/sign-up`, `/auth/sign-out` (server actions).
- Stockage du `firstName` dans la table Supabase `profiles` (clé étrangère vers `auth.users.id`).
- Provider React (`AuthProvider`) qui expose `user`, `profile`, `signIn`, `signUp`, `signOut`, `loading`.
- Middleware Next : protéger les routes `/history`, `/routine`, `/profile` (redirige vers `/auth/sign-in` si non connecté).
- Cookie Supabase géré via `@supabase/ssr` (Next App Router).

**Fichiers impactés**
- Nouveau : `app/auth/sign-in/page.tsx`, `app/auth/sign-up/page.tsx`
- Nouveau : `lib/auth.ts` (helpers serveur), `components/AuthProvider.tsx`
- `middleware.ts` (mise à jour)
- `lib/supabase.ts` (ajout d'un client SSR)

**Critère d'acceptation**
- Création de compte en < 5 secondes, redirection auto vers `/` après sign up.
- Sign out vide le cookie et redirige vers `/`.
- L'utilisateur invité peut analyser, voit un push doux "Crée un compte pour sauvegarder" en bas du résultat.

---

## 1.2 🟠 Table `profiles` + schema initial

**Schema Supabase**
```
profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  first_name      text not null,
  created_at      timestamptz default now(),
  tier            text not null default 'premium',  -- voir 1.3
  preferences     jsonb default '{}'::jsonb
)
```
- Trigger `on_auth_user_created` qui insère automatiquement la ligne dans `profiles`.
- RLS : `select` et `update` autorisés uniquement à `auth.uid() = id`.

**Fichier impacté**
- Migration : `create_profiles_table.sql`

---

## 1.3 🔴 Accès complet pour tous les comptes (pas de paywall actif)

**Décision**
Tant qu'on n'est pas en phase de monétisation, **tous les utilisateurs créés ont `tier = 'premium'`** et accèdent à toutes les fonctionnalités.

**Implémentation**
- Colonne `tier` dans `profiles` avec valeur par défaut `'premium'`.
- Helper `canAccess(feature, user)` qui retourne `true` partout aujourd'hui, prêt à être restreint demain.
- Aucune UI de "passer Premium" visible pour le moment, **sauf** sur la page Profil où on affiche un encart informatif :
  > "Accès complet · Gratuit pendant la phase de lancement"
- Schéma `subscriptions` préparé mais **non utilisé** (voir Phase 5).

**Critère d'acceptation**
- Tout compte créé peut : analyser sans limite, sauvegarder, comparer, accéder à la routine, OCR.

---

# PHASE 2 - Refonte du design

> **Objectif** : moderniser la navigation et unifier les modes d'entrée d'analyse.

## 2.1 🔴 Nav bar bas + bouton scan central (mobile)

**Spécification**
- **5 emplacements** dans la nav bar bas (sticky, white, top shadow) :
  1. 🏠 Accueil
  2. 📚 Routine (icône "stack of layers")
  3. ● **Bouton circulaire central**, surélevé, fond noir #111111, icône caméra blanche, ombre douce. C'est le **CTA principal**.
  4. 🕒 Historique
  5. 👤 Profil
- Icônes inactives : grises (#6B7280). Icône active : noire + libellé en gras.
- Le bouton central **ne navigue pas vers une page** - il **ouvre une bottom sheet**.
- Hauteur de la nav : 64px. Le bouton central déborde de 12px au-dessus.

**Sur desktop** (> 1024px)
- La nav bar bas est **masquée**.
- Header haut avec liens : Accueil · Routine · Historique + bouton noir "Analyser un produit" à droite (déclenche le menu déroulant des 4 modes) + avatar.

**Fichiers impactés**
- Nouveau : `components/BottomNav.tsx`, `components/DesktopHeader.tsx`
- Mise à jour : `app/layout.tsx` pour intégrer la nav adaptative
- Suppression : icône caméra dans le champ de recherche actuel (déplacée vers le bouton central)

**Critère d'acceptation**
- Sur mobile, la nav est visible sur toutes les pages sauf : OCR camera fullscreen, sign-up/sign-in (optionnel).
- Sur desktop, le menu déroulant "Analyser un produit" fonctionne au clic et au survol.

---

## 2.2 🔴 Bottom sheet scan - 4 options

**Spécification**
- Modale plein-bas (50–65 % de la hauteur écran), fond blanc, coins haut arrondis 20px, drag handle gris au sommet.
- Titre centré : "Comment veux-tu analyser ?"
- **Grille 2×2** de 4 tuiles carrées :

| Position | Icône | Titre | Sous-titre |
|---|---|---|---|
| haut-gauche | 📷 code-barres | **Code-barres** | "Scan rapide en magasin" |
| haut-droite | 📋 clipboard | **Coller la composition** | "Liste INCI texte" |
| bas-gauche | 📸 caméra (badge NEW corail) | **Photo de la composition** | "OCR automatique" |
| bas-droite | 🔎 loupe | **Rechercher un produit** | "Par nom ou marque" |

- Tap sur une tuile → navigation vers la flow correspondante + fermeture sheet.
- Tap sur l'overlay sombre ou drag down → fermeture.
- Lien discret "Annuler" en bas du sheet.

**Fichier impacté**
- Nouveau : `components/ScanSheet.tsx`
- État global (Zustand ou contexte) pour `isScanSheetOpen`

**Critère d'acceptation**
- Animation slide-up < 250ms, sans jank.
- Accessibilité clavier : Esc ferme la sheet, focus trap actif.

---

## 2.3 🔴 Refonte page Accueil (sans doublon avec scan)

**Problème résolu**
La home actuelle propose déjà les 3 modes (Liste INCI / Nom de produit / Scanner) dans des tabs. Avec le bouton scan central, c'est un doublon. La home devient un **dashboard**.

**Nouveau contenu de la home (ordre vertical, mobile)**

1. **Header** : logo (bécher + "Cosmet" noir + "Wiki" corail) + bouton menu/avatar à droite.
2. **Greeting** : "Bonjour {Prénom} 👋" ou "Bienvenue 👋" si invité.
3. **Tagline brand slim** : "Décrypte tes cosmétiques en 3 secondes." (taille réduite vs actuel, "en 3 secondes." souligné corail).
4. **Carte "Reprendre la dernière analyse"** : vignette + nom produit + score + lien "Voir →".
   - État vide : "Aucune analyse pour le moment. Lance-toi via le bouton scan !"
5. **Carte "Ta routine"** : mini-gauge + "{N} produits" + lien "Voir →".
   - État vide : "Crée ta routine pour suivre ton exposition cumulée."
6. **"Astuce du jour"** : encart fond rose pâle (#FFF1F2), icône ampoule, texte pédagogique rotatif sur 7 jours. Liste initiale de tips :
   - "Les 5 premiers ingrédients représentent environ 75 % de la formule."
   - "L'ordre INCI = ordre décroissant de concentration jusqu'à ~1 %."
   - "Le mot 'parfum' peut cacher des dizaines de molécules non déclarées."
   - "Un actif placé après le conservateur est souvent à concentration < 1 %."
   - "L'aqua en 1ère position = formule à base d'eau."
   - "Les allergènes parfumants UE sont 26 composés à déclarer si > 0,001 %."
   - "Une note basse ne veut pas dire 'dangereux' : c'est une grille de tolérance."
7. **"Catégories populaires"** : grille 3×2 de chip-cards avec emoji + label.
   - 🧴 Crème visage, 🧼 Shampooing, ☀️ Solaire, 💄 Maquillage, 🧴 Corps, 👶 Bébé.
   - Tap sur une catégorie → page de recherche produits filtrée (futur).
8. **"Ingrédients tendance cette semaine"** : liste de 4–5 lignes avec pastille couleur + nom INCI + traduction FR.
9. **Légende** Vert/Jaune/Orange/Rouge en petit, juste avant la nav bar.

**Sur desktop** : layout 2 colonnes (60/40) avec les mêmes blocs réorganisés en grille.

**Fichiers impactés**
- `app/page.tsx` (refonte complète du contenu)
- Nouveaux composants : `LastAnalysisCard`, `RoutineSnapshotCard`, `DailyTipCard`, `CategoryChips`, `TrendingIngredients`

**Critère d'acceptation**
- Aucun élément de la home ne duplique une action déjà accessible via le bouton scan.
- Les cartes "Dernière analyse" et "Ta routine" gèrent proprement l'état vide.

---

## 2.4 🟠 Pattern "Voir plus de détails" (mobile uniquement)

**Spécification**
- Sur mobile uniquement, les sections suivantes de la page résultat sont **collapsées par défaut** :
  - **Synthèse** : 2–3 lignes visibles + "Voir la synthèse complète →"
  - **Liste d'ingrédients** : top 5 visibles + "Voir les {N} ingrédients →"
  - **Observations** : déjà OK (existant)
- Lien "Voir plus" : texte corail #F43F5E, flèche `→`, sans soulignement.
- Au tap : déroule la section avec animation, et le lien devient "Replier ↑".
- **Sur desktop** (> 1024px) : tout affiché, **aucun collapse**.

**Fichiers impactés**
- `components/AnalysisResult.tsx` ou équivalent
- Hook `useIsMobile()` (basé sur breakpoint Tailwind)

**Critère d'acceptation**
- Sur viewport ≤ 1024px : 3 sections collapsées au chargement.
- Sur viewport > 1024px : tout déplié.

---

## 2.5 🟠 OCR de la composition - GPT-4o-mini Vision + fallback Tesseract.js

**Décision actée**
GPT-4o-mini Vision est utilisé en **primaire** (meilleure robustesse sur photos floues, textes courbés, polices décoratives, multilingue). Tesseract.js est gardé en **fallback** uniquement (réseau down, quota OpenAI, latence > 10 s).

**Spécification**
- Flow :
  1. User clique sur "Photo de la composition" dans la scan sheet.
  2. Écran caméra plein écran avec cadre de visée (corners only) + grille 4×4 d'aide.
  3. User capture → upload de l'image vers `/api/ocr` (serveur).
  4. Serveur appelle **gpt-4o-mini** en mode JSON structuré :
     - Prompt système : "Tu es un OCR spécialisé compositions INCI cosmétiques. Extrais UNIQUEMENT la liste d'ingrédients telle qu'imprimée sur l'emballage, séparée par virgules. Marque chaque mot dont tu n'es pas sûr à 100 % avec `[?MOT]`. Ne corrige RIEN, ne traduis RIEN. Si tu ne vois pas de liste INCI, réponds `{found: false}`."
     - `response_format: { type: "json_object" }` pour garantir le JSON.
     - `detail: "high"` sur l'image pour maximiser la lecture du texte fin.
  5. Si OpenAI échoue (5xx, timeout > 10 s, rate limit) → fallback **Tesseract.js** côté client.
  6. Écran de **review** : texte détecté éditable, mots marqués `[?...]` surlignés en jaune avec suggestions.
- L'utilisateur peut toujours corriger le texte avant de lancer l'analyse INCI.

**Cache**
- Hash SHA-256 de l'image → résultat OCR en DB. Évite de re-analyser une photo identique.

**Coût estimé**
- Une image en `detail: high` = ~5000 tokens input + ~500 tokens output ≈ **0,001 € par scan**.
- Avec cache : ~0,0002 € moyen.

**Fichiers impactés**
- Nouveau : `app/scan/photo/page.tsx`
- Nouveau : `app/api/ocr/route.ts` (server, appelle GPT-4o-mini vision)
- Nouveau : `lib/ocr-fallback.ts` (Tesseract worker côté client, déclenché en cas d'échec serveur)
- Nouveau : table Supabase `ocr_cache (image_hash, result_text, created_at)`

**Critère d'acceptation**
- 98 % des photos passent par GPT-4o-mini avec succès.
- En cas de panne réseau ou quota, Tesseract prend le relais de façon transparente (l'utilisateur voit juste un loader un peu plus long).
- Aucune image envoyée à OpenAI n'est stockée par OpenAI (option `store: false`).

---

## 2.6 🔴 Stratégie IA globale (architecture commune)

**Objectif**
Centraliser tous les appels IA dans une seule lib, avec retry, fallback, cache et observabilité.

**Architecture**
- `lib/ai/client.ts` - wrapper autour de l'OpenAI SDK avec :
  - Retry exponentiel (3 tentatives, 200ms → 800ms → 3200ms)
  - Timeout configurable (défaut 10 s)
  - Logging des erreurs vers une table `ai_logs` Supabase
  - Fonction `callWithFallback(primary, fallback, args)` qui essaie OpenAI puis bascule sur le fallback fourni
- `lib/ai/synthesis.ts` - génération de synthèse (GPT-4o-mini primary, Mistral fallback)
- `lib/ai/ocr.ts` - OCR image (GPT-4o-mini Vision primary, Tesseract fallback)
- `lib/ai/typo.ts` - correction d'ingrédient (GPT-4o-mini primary, pg_trgm seul fallback)
- `lib/ai/categorize.ts` - catégorisation produit
- `lib/ai/validate.ts` - détection de saisie farfelue avant analyse

**Cache commun**
Table Supabase `ai_cache`:
```
ai_cache (
  cache_key text primary key,    -- 'synthesis:hash' ou 'ocr:hash' ou 'typo:token'
  result    jsonb not null,
  created_at timestamptz default now(),
  hits      int default 0
)
```
- Tout appel IA passe par `getCachedOrCompute(key, computeFn)`.
- Sauf pour les opérations explicitement non-cachables (skin advisor par exemple).

**Observabilité minimale**
Table `ai_logs`:
```
ai_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),
  feature     text not null,           -- 'synthesis' | 'ocr' | 'typo' | ...
  provider    text not null,           -- 'openai' | 'mistral' | 'tesseract'
  status      text not null,           -- 'success' | 'fallback' | 'error'
  tokens_in   int,
  tokens_out  int,
  duration_ms int,
  created_at  timestamptz default now()
)
```
→ permet de monitorer le coût quotidien, le taux de fallback et la latence par feature.

**Choix du modèle par défaut**
- Texte : `gpt-4o-mini`
- Vision : `gpt-4o-mini` (même modèle, supporte les images)
- Température : 0.3 pour OCR et typo (déterministe), 0.55 pour synthèse (variété)
- `response_format: { type: "json_object" }` pour toutes les sorties structurées

**Variables d'environnement requises**
```
OPENAI_API_KEY=sk-proj-...
MISTRAL_API_KEY=...            # déjà présent, devient fallback
```

**Critère d'acceptation**
- Tous les appels IA de l'app passent par `lib/ai/*`, jamais en direct.
- En coupant la clé OpenAI, l'app continue de fonctionner (fallback Mistral/Tesseract).
- La table `ai_logs` montre le taux de succès, le taux de fallback et la latence par feature.

---

## 2.7 🟠 Correction intelligente d'ingrédient (typo correction GPT)

**Objectif**
Réduire les faux négatifs sans introduire de faux positifs : quand pg_trgm est ambigu, demander à GPT-4o-mini de trancher avec contexte.

**Flow**
1. Exact match → OK, pas d'IA.
2. Alias match → OK, pas d'IA.
3. Trigram similarity ≥ 0.90 → match auto, pas d'IA.
4. Trigram similarity entre 0.55 et 0.90 → **appel GPT-4o-mini** :
   - Input : le token saisi + top 5 candidats INCI les plus proches (avec leur fonction principale).
   - Sortie JSON : `{ match_inci_id, confidence, reasoning }` ou `{ match_inci_id: null }`.
   - Confidence > 0.85 → match auto, marqué `match_kind: "ai_corrected"`.
   - Confidence entre 0.6 et 0.85 → suggestion ("Vouliez-vous dire X ?"), pas de match auto.
   - Sinon → non reconnu.
5. Trigram < 0.55 → non reconnu, pas d'IA (évite les appels inutiles).

**Cache**
- `ai_cache` keyed by `typo:{token_normalized}`. Une faute corrigée une fois ne re-consomme plus.

**Critère d'acceptation**
- `behentrimomium` → reconnu comme Behentrimonium avec un badge "✨ corrigé par IA".
- `xyzaleatoire` → non reconnu, aucune suggestion forcée.
- Sur un dataset de 100 fautes courantes connues, ≥ 90 % de bonnes corrections.

---

## 2.8 🟡 Catégorisation produit + détection de saisie farfelue

**Catégorisation**
- Après analyse, GPT-4o-mini reçoit les 5 premiers ingrédients + 3 alertes principales et retourne une catégorie standardisée :
  - `crème_visage` / `crème_corps` / `shampooing` / `après_shampooing` / `solaire` / `maquillage` / `nettoyant_visage` / `déodorant` / `parfum` / `autre`
- Stocké dans `analyses.category` pour faciliter le filtrage de l'historique et les comparaisons pertinentes.

**Détection de saisie farfelue**
- AVANT de lancer le pipeline complet, GPT-4o-mini reçoit le texte saisi (max 200 caractères) et retourne `{ valid: true|false, reason }`.
- Évite de gaspiller des analyses sur du texte qui n'est pas une liste INCI.
- Si invalide : affichage d'un message "Ceci ne ressemble pas à une liste INCI. Vérifie ta saisie."

**Coût**
- Appels de ~100 tokens chacun, environ **0,00002 €** par appel. Négligeable.

---

## 2.9 🟠 Synthèse rédactionnelle - switch Mistral → GPT-4o-mini

**Objectif**
Améliorer la qualité de la prose française et la fidélité aux contraintes du prompt (interdictions de langage marketing, structure en 2 blocs).

**Décision**
- Bascule du provider primaire : **Mistral → GPT-4o-mini**.
- Mistral devient le **fallback** : si OpenAI répond en erreur 5xx, timeout > 10 s ou rate limit, on bascule sur `mistral-small-latest` sans changement de prompt.
- Le prompt système existant (déjà très contraint dans `app/api/analyser/route.ts`) est conservé tel quel.

**Pourquoi**
- GPT-4o-mini suit plus strictement les instructions négatives ("INTERDITS : 'rassurant', 'idéal'…").
- Meilleure cohérence sur la structure imposée (paragraphe + ligne vide + puces).
- Coût comparable (~0,0008 € par synthèse).

**Cache**
- Hash SHA-256 de la liste INCI normalisée (lowercased, dédupliquée, triée) → clé `synthesis:{hash}`.
- Hit rate attendu : ~60 % après 1 mois (beaucoup d'utilisateurs analysent les mêmes produits).
- Invalidation : aucune (la composition d'un produit ne change pas).

**Fichiers impactés**
- `lib/ai/synthesis.ts` (nouveau, factorise le code actuellement dans `app/api/analyser/route.ts`)
- `app/api/analyser/route.ts` (devient un simple appel à `generateSynthesis()`)

**Critère d'acceptation**
- A/B test sur 20 analyses : la synthèse GPT-4o-mini respecte mieux les contraintes (zéro mot marketing interdit) que Mistral dans ≥ 90 % des cas.
- En coupant la clé OpenAI, la synthèse Mistral se déclenche sans erreur visible côté UI.

---

## 2.10 🟠 Recherche de produit avec correction GPT

**Objectif**
Quand l'utilisateur tape un nom de produit imparfait ("effaclar duo", "loccitane karité", "creme nivea bleu"), on veut retomber sur le bon produit en base.

**Flow**
1. L'utilisateur tape sa requête dans le champ "Rechercher un produit".
2. Recherche full-text Postgres directe sur `products.name` et `products.brand` (rapide, gratuite).
3. Si **0 résultat** ou **score de pertinence faible** : appel GPT-4o-mini :
   - Input : "L'utilisateur cherche : `{query}`. Voici 10 marques + produits de notre base les plus proches : [liste]. Quel produit recherche-t-il le plus probablement ? Réponds en JSON `{brand, product_name, confidence}` ou `{found: false}` si aucun ne correspond."
   - Sortie : si confidence > 0.7, on relance la recherche full-text avec la version normalisée.
4. Si toujours rien : afficher "Aucun produit trouvé. Veux-tu coller la composition à la place ?"

**Cache**
- Clé `productsearch:{query_normalized}` → résultat normalisé. Une faute corrigée une fois ne re-consomme plus.

**Fichiers impactés**
- `app/api/product-search/route.ts` (existant, à enrichir)
- `lib/ai/product-search.ts` (nouveau)

**Critère d'acceptation**
- "effaclar duo" → trouve "La Roche-Posay Effaclar Duo+".
- "creme nivea bleue" → trouve "Nivea Crème" (le pot bleu).
- "asdfgh" → "Aucun produit trouvé" sans gaspiller un appel GPT (filtré par longueur min / présence d'au moins 3 caractères alphanumériques).

---

# PHASE 3 - Résultat enrichi

## 3.1 🟠 Affichage du Spectre top 5 / top 10

**Spécification**
- Sous le bloc "Note globale", ajouter une carte "Spectre" contenant deux rows :
  - Row 1 : "Top 5" - 5 carrés colorés en ligne (24×24px, gap 6px), chacun étiqueté 1·2·3·4·5 en dessous.
  - Row 2 : "Top 10" - 10 carrés plus petits (16×16px, gap 4px).
- Couleurs : Vert #10B981, Jaune #F59E0B, Orange #FB923C, Rouge #EF4444, Gris (#E5E7EB) pour position vide ou inconnue.
- **Tap sur un carré** → scroll smooth jusqu'à la row de l'ingrédient correspondant dans la liste + flash background pendant 1 sec.
- Petit texte d'aide en dessous : "Touche un carré pour voir l'ingrédient correspondant."

**Fichier impacté**
- Nouveau composant : `components/IngredientSpectrum.tsx`
- `components/AnalysisResult.tsx` pour l'intégrer

**Critère d'acceptation**
- Une analyse à 3 ingrédients affiche le top 5 avec 2 cases grises et le top 10 avec 7 cases grises.
- Le tap scrolle correctement même sur la version mobile en collapsé.

---

## 3.2 🟠 Badge "avant/après parfum/conservateur"

**Spécification**
- Sur chaque ligne d'ingrédient de la liste détaillée, à droite (avant le chevron) :
  - Badge gris pâle (#F3F4F6, texte #6B7280) avec libellé :
    - "avant parfum"
    - "après parfum"
    - "avant conservateur"
    - "après conservateur"
  - Si l'ingrédient est lui-même un parfum/conservateur : pas de badge.
- Sur la page **détail d'un ingrédient**, afficher la même info dans une card "Position dans la formule" :
  > "Position 3 sur 13 · avant le 1er conservateur"

**Fichier impacté**
- `components/IngredientRow.tsx`
- `app/ingredient/[slug]/page.tsx` (ou page de détail existante)

**Critère d'acceptation**
- Le badge est visible sur mobile dès qu'on déroule la liste complète.
- Sur desktop, le badge apparaît dans la colonne dédiée du tableau.

---

# PHASE 4 - Historique par utilisateur

## 4.1 🔴 Sauvegarde des analyses

**Schema Supabase**
```
analyses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text,                   -- nullable, généré auto si absent
  product_label text,                   -- ex. "La Roche-Posay Effaclar Duo+"
  input_text    text not null,          -- la liste INCI saisie
  result_json   jsonb not null,         -- snapshot complet de la réponse API
  score         numeric(4,2),
  created_at    timestamptz default now()
)
```
- RLS : `select`, `insert`, `update`, `delete` autorisés uniquement à `auth.uid() = user_id`.
- Index : `(user_id, created_at desc)`.

**Implémentation**
- Après chaque analyse réussie d'un user connecté, **insert automatique** dans `analyses`.
- Nommage auto : `product_label` si présent, sinon "Analyse du {DD MMM YYYY}".
- Pour un guest, on stocke localement en `localStorage` (max 5 analyses), avec un bandeau "Crée un compte pour sauvegarder plus".

**Fichier impacté**
- `app/api/analyser/route.ts` (insert post-analyse si user connecté)
- Nouveau : `lib/history.ts`

---

## 4.2 🟠 Page Historique

**Spécification**
- Mobile : liste de cards verticale.
- Desktop : tableau avec colonnes ☐ · Score · Nom · Date · Alertes · ⋯.
- Filtres en haut : "Tous" · "Cette semaine" · "Ce mois" · "Renommés".
- Recherche full-text sur `name` et `product_label`.
- Chaque carte / row affiche :
  - Pastille de score colorée
  - Nom (éditable inline via icône crayon)
  - Sous-titre : "{N} ingrédients · {N} alertes"
  - Menu ⋯ : Renommer / Dupliquer / Supprimer / Comparer
- Tap sur une analyse → ouvre le résultat (rejoue la page d'analyse à partir du `result_json` stocké).

**Fichiers impactés**
- Nouveau : `app/history/page.tsx`, `components/HistoryList.tsx`, `components/HistoryRow.tsx`

**Critère d'acceptation**
- Renommer en ligne sauvegarde sans navigation.
- La suppression demande confirmation (sheet ou dialog).

---

## 4.3 🟡 Comparer 2 analyses

**Spécification (V2 light)**
- Depuis l'historique : sélectionner 2 analyses → bouton "Comparer" devient actif.
- Page `/compare?ids=...` :
  - Mobile : deux colonnes 50/50 compactes (KPIs + gauge + tags présents).
  - Desktop : deux colonnes pleines + 3e colonne "Différences clés" (bullet list générée).
- Génération "Différences clés" :
  - Diff sur counts Vert/Jaune/Orange/Rouge
  - Tags présents dans A et absents dans B (et inverse)
  - Score delta

**Fichiers impactés**
- Nouveau : `app/compare/page.tsx`, `components/CompareView.tsx`
- Helper : `lib/compareAnalyses.ts`

**Priorité** : 🟡 - peut attendre la V2 si charge importante.

---

# PHASE 5 - Architecture monétisation (préparée, non activée)

> **Objectif** : poser les fondations DB et hooks pour pouvoir activer un paywall plus tard sans réécrire l'app.
> **Aucune limitation utilisateur visible** dans cette phase.

## 5.1 ⚪ Schema `subscriptions` + helper de gating

**Schema Supabase**
```
subscriptions (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  tier           text not null default 'premium',     -- 'free' | 'premium'
  status         text not null default 'active',      -- 'active' | 'canceled' | 'expired'
  stripe_customer_id text,
  current_period_end timestamptz,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
)

usage_counters (
  user_id        uuid not null references auth.users(id) on delete cascade,
  period_start   date not null,                       -- premier jour du mois
  analyses_count int not null default 0,
  primary key (user_id, period_start)
)
```

**Helper**
- `canAccess(feature: string, user)` : aujourd'hui retourne toujours `true`. Demain, retournera `false` pour `feature === 'photo-ocr'` si `tier === 'free'` et `analyses_count >= 5`.

**Activation paywall - déclenché plus tard**
- Hook UI "Limite atteinte" sur l'écran de scan / d'analyse.
- Page `/premium` avec tableau comparatif.
- Intégration Stripe (Checkout + webhook → update `subscriptions.status`).

**Fichiers impactés (aujourd'hui)**
- Migration : `create_subscriptions_table.sql`
- Nouveau : `lib/access.ts` (avec `canAccess` qui retourne `true` partout)

**Priorité** : ⚪ - l'infra est créée, mais le paywall n'est **pas activé** tant que `tier === 'premium'` par défaut.

---

## 5.2 ⚪ Stratégie tarifaire (à valider plus tard)

**Recommandation actuelle (à challenger après tests utilisateurs)**
- **Gratuit** : 5 analyses INCI / mois · code-barres et recherche illimités · 1 produit en routine.
- **Premium 1,99 €/mois** ou **14,99 €/an** : analyses illimitées · OCR photo · routine illimitée · historique illimité · comparaisons.
- Trial de 14 jours offert au sign up.

**Justification**
- InciBeauty Premium = 1,30 €/mois. On se positionne légèrement au-dessus parce qu'on offre **copier-coller, OCR, routine cumulée et comparaison** qu'ils n'ont pas.
- Ne pas démarrer la monétisation avant **50 à 200 utilisateurs actifs** pour avoir un signal de rétention.

**Priorité** : ⚪ - décision marché, pas dev.

---

# PHASE 6 - Fonctionnalités V2 (après retours users)

## 6.1 🟡 Onglet Routine - analyse cumulée

**Spécification**
- Page `/routine` :
  - Top : "Exposition cumulée" sous forme de gauge circulaire (note pondérée par fréquence d'usage).
  - Chips d'alerte : "Allergènes parfumants dans X produits", "Conservateurs cumulés : N".
  - Bar chart horizontal des tags les plus présents (cumul tous produits confondus).
  - Liste des produits avec sélecteur de fréquence (Quotidien · Hebdo · Mensuel).
  - Carte "Simulation" : "Si tu retires les 2 produits les plus pénalisants → Nouvelle exposition : X".

**Schema**
```
routine_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid not null references analyses(id) on delete cascade,
  frequency   text not null default 'daily',   -- 'daily' | 'weekly' | 'monthly'
  added_at    timestamptz default now()
)
```

**Calcul de l'exposition cumulée** : à définir précisément.
- Idée v1 : moyenne pondérée des scores des produits, ajustée par fréquence (poids quotidien × 1, hebdo × 0,3, mensuel × 0,07).
- Idée v1bis : somme des tags pénalisants pondérés par fréquence, normalisée sur 20.

**Priorité** : 🟡 - gros effort, attendre signal utilisateur.

---

## 6.2 🟡 Intégration Open Beauty Facts

**Objectif**
Augmenter massivement la base de données produits (~50 k via OBF vs base INCI Beauty actuelle).

**Implémentation**
- Script ETL nocturne : récupère les produits OBF par lots via leur API JSON (`https://world.openbeautyfacts.org/api/v2/`).
- Mapping vers la table `products` interne.
- Déduplication par code-barres EAN.
- Pour les compositions INCI : si OBF a `ingredients_text`, on l'utilise tel quel ; on l'analyse via le pipeline INCI à la première consultation et on cache le résultat.

**Fichier**
- Nouveau : `scripts/etl-openbeautyfacts.ts`

**Priorité** : 🟡

---

## 6.3 🟡 Compteur dédié des 26 allergènes parfumants UE

**Spécification**
- Liste hardcodée des 26 allergènes UE (Limonene, Linalool, Citronellol, Geraniol, Eugenol, Coumarin, Citral, Benzyl alcohol, Benzyl salicylate, Cinnamal, Cinnamyl alcohol, Hydroxycitronellal, Isoeugenol, Amyl cinnamal, Hexyl cinnamal, Methyl 2-octynoate, Benzyl benzoate, Benzyl cinnamate, Farnesol, Anise alcohol, alpha-Isomethyl ionone, Lyral, Lilial, Evernia prunastri extract, Evernia furfuracea extract, Hexylcinnamaldehyde).
- Dans la réponse d'analyse, champ `eu_fragrance_allergens` avec la liste détectée.
- UI : encart spécifique dans la section Observations "X allergènes parfumants UE détectés sur 26 listés" avec liste détaillée au "voir plus".

**Fichier impacté**
- `lib/euAllergens.ts` (nouvelle constante)
- `app/api/analyser/route.ts` (détection)

**Priorité** : 🟡

---

## 6.4 ⚪ Skin advisor - chatbot IA ciblé

**Statut** : flou, à clarifier avec l'utilisateur.
**Hypothèse** : page dédiée où l'utilisateur décrit sa peau / ses besoins, GPT-4o-mini répond en s'appuyant sur la base ingrédients pour suggérer des ingrédients à privilégier/éviter.

**Garde-fous**
- Rate limit par utilisateur (max 10 messages / jour pour éviter abus IA).
- Cache désactivé (chaque conversation est unique).
- Prompt système strict : pas de conseil médical, pas de diagnostic, pas de recommandation de marque.

**Priorité** : ⚪ - V3, gros effort UX + risque réglementaire (conseil santé).

---

## 6.5 🟡 Explication d'ingrédient à la demande

**Objectif**
Sur la page détail d'un ingrédient, proposer un bouton "Expliquer simplement" qui génère une explication vulgarisée de 2-3 phrases.

**Contenu généré**
- À quoi sert cet ingrédient ?
- Pourquoi cette note (vert/jaune/orange/rouge) ?
- S'il est orange/rouge : quelles alternatives connues existent ?

**Flow**
1. Tap sur "Expliquer simplement".
2. Vérifie d'abord en DB : table `ingredient_explanations (inci_id, explanation_text, created_at)`.
3. Si présent → affichage immédiat (zéro coût IA).
4. Sinon → appel GPT-4o-mini avec : nom INCI + fonction + tags + color_rating → 2-3 phrases.
5. Sauvegarde permanente en DB (une seule génération à vie par ingrédient).

**Pourquoi cache permanent**
- ~20 000 ingrédients en base, chaque ingrédient explicable une seule fois → coût total max ~16 € pour TOUS les utilisateurs à vie.
- Une fois généré, l'explication est figée et servie sans IA.

**Fichiers impactés**
- Nouveau : `app/api/ingredient-explanation/route.ts`
- Nouveau : table `ingredient_explanations`
- `app/ingredient/[slug]/page.tsx` (bouton + affichage)

**Critère d'acceptation**
- Le 1er user qui demande une explication déclenche un appel GPT (~1 s).
- Les users suivants voient l'explication instantanément.

---

## 6.6 🟡 Suggestions de routine intelligentes

**Objectif**
À partir de la routine de l'utilisateur, proposer des optimisations concrètes : "Si tu remplaces ce produit par un sans allergène parfumant, ton exposition cumulée passe de 14.2 à 16.8."

**Flow**
1. Sur la page Routine, bouton "Suggestions IA pour ma routine".
2. Le serveur envoie à GPT-4o-mini :
   - Liste des produits actuels + leurs scores + leurs tags pénalisants principaux.
   - Demande : "Identifie les 2 produits les plus pénalisants et explique en 1 phrase pourquoi. Suggère pour chacun le type de remplacement à chercher (ex : 'shampooing sans sulfates ni parfum')."
3. Affichage : 2 cards "Suggestion" + bouton "Chercher un remplacement" qui ouvre la recherche pré-filtrée.

**Pas de recommandation de marque par l'IA**
- L'IA suggère un **profil d'ingrédients à chercher**, pas un produit spécifique.
- La recherche du remplacement utilise notre base de produits avec filtres (sans sulfate, sans parfum, etc.).
- Évite tout risque de recommandation biaisée ou de placement de produit involontaire.

**Cache**
- Clé `routinetips:{hash_routine}`. Si la routine ne change pas, on ne re-consomme pas.

**Critère d'acceptation**
- Une routine de 4 produits avec 2 pénalisants → 2 suggestions concrètes en < 3 s.
- Les suggestions sont basées uniquement sur les tags présents dans les analyses, jamais sur des opinions inventées.

**Priorité** : 🟡 - dépend de la stabilité de la Phase 6.1 (Routine).

---

# Synthèse par phase

| Phase | Contenu | Effort estimé | Priorité globale |
|---|---|---|---|
| 0 | Parser + fuzzy + métadonnées analyse | 2–3 jours | 🔴 |
| 1 | Auth + profils + accès complet | 2–3 jours | 🔴 |
| 2 | Nav bar + scan sheet + Home + "Voir plus" + lib/ai centralisée + OCR GPT + typo IA + catégorisation + synthèse GPT + recherche produit GPT | 8–11 jours | 🔴 |
| 3 | Spectre top 5/10 + badges position | 2 jours | 🟠 |
| 4 | Historique + comparaison | 3–4 jours | 🟠 |
| 5 | Schéma monétisation (sans activation) | 1 jour | ⚪ |
| 6 | Routine cumulée + OBF + 26 allergènes UE + skin advisor + explication ingrédient à la demande + suggestions routine intelligentes | À planifier | 🟡 / ⚪ |

---

# Décisions techniques actées

- **Pas de paywall actif** : tous les comptes ont `tier = 'premium'`. L'architecture est posée, l'activation est repoussée.
- **DA = noir + corail pink + cream**, jamais vert-dominant. Le corail (#F43F5E) est utilisé sparingly (logo "Wiki", hero underline, "Voir plus" links).
- **Pattern "Voir plus de détails"** appliqué uniquement sur mobile, jamais sur desktop.
- **IA primaire = OpenAI `gpt-4o-mini`** pour TOUTES les tâches (synthèse, OCR vision, correction de fautes, catégorisation, validation de saisie, recherche produit, explication ingrédient, suggestions routine). Un seul modèle, un seul SDK.

**Tableau de fallback (référence rapide)**

| Tâche | Primaire | Fallback | Déclencheur du fallback |
|---|---|---|---|
| Synthèse rédactionnelle | gpt-4o-mini | mistral-small-latest | Erreur réseau / rate limit / 5xx OpenAI |
| Correction de fautes (ingrédient) | gpt-4o-mini | pg_trgm (seuil 0.75, sans suggestion forte) | Idem |
| OCR image | gpt-4o-mini (vision) | Tesseract.js (local) | Idem OU > 10 s de latence |
| Recherche nom de produit | gpt-4o-mini (normalisation) | recherche full-text Postgres seule | Idem |
| Catégorisation produit | gpt-4o-mini | catégorie `autre` par défaut | Idem |
| Validation saisie | gpt-4o-mini | passage direct (no-op) | Idem |
| Explication ingrédient | gpt-4o-mini | fallback texte "Explication non disponible" | Idem |
| Suggestions routine | gpt-4o-mini | bouton désactivé temporairement | Idem |

→ Mistral n'est utilisé QUE pour la synthèse, et uniquement si OpenAI down. Tesseract est utilisé QUE pour l'OCR, et uniquement si l'analyse GPT échoue (réseau ou >10 s).
- **Cache IA systématique** via table `ai_cache` indexée par hash de l'input. Évite de recalculer une synthèse ou un OCR identique. Réduction de coût ~75 % après 1 mois d'usage.
- **Observabilité IA** via table `ai_logs` (feature, provider, status, tokens, durée). Permet de monitorer le coût et le taux de fallback.
- **Scan sheet à 4 options** (pas 2 ou 3) : chaque option couvre un cas d'usage distinct.
- **Mode invité** : autorisé sans compte, avec push doux vers le sign up dès la 2e analyse.
- **Score globale conservé** : c'est l'élément le plus consulté par les utilisateurs. On le fiabilise (phase 0), on ne le supprime pas.

# Coût IA estimé par utilisateur

Hypothèse : utilisateur actif moyen = 10 analyses / mois, dont 3 via OCR photo.

| Feature | Appels/mois | Coût unitaire | Coût mensuel |
|---|---|---|---|
| Synthèse (avec cache 60 % hit rate) | 4 | ~0,0008 € | 0,003 € |
| OCR vision (cache 40 %) | 1,8 | ~0,001 € | 0,002 € |
| Correction typo (cache 80 %) | 0,5 | ~0,00005 € | <0,001 € |
| Catégorisation (cache 90 %) | 1 | ~0,00002 € | <0,001 € |
| Validation saisie | 10 | ~0,00002 € | <0,001 € |
| **Total estimé** | | | **~0,006 € / user / mois** |

→ À 1 000 utilisateurs actifs : ~6 €/mois. Très soutenable même sans paywall.

---

# Hors-périmètre actuel

- Notifications push.
- Mode hors-ligne complet (au-delà de Tesseract local).
- Versions natives iOS/Android (le PWA mobile suffit pour V1).
- Programme d'affiliation marques.
- Partage social (au-delà du bouton "Partager" qui ouvre le menu OS natif).
