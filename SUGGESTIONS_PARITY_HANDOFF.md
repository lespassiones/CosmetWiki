# Passation — Parité "Suggestions intelligentes" web ↔ mobile

> À traiter en session **Opus**. Préférences: jamais de tiret cadratin (—), ne JAMAIS rebuild l'APK soi-même (s'arrêter à `tsc` propre + résumé).

## Où sont les apps

- **App WEB** (le site, c'est CE repo) : `D:\MesApps\deploy\CosmetWiki`
  - Next.js 15, déployé sur Vercel, même base Supabase que le mobile.
  - Dev local : `http://localhost:3000`. Page concernée : `/routine/suggestions`.
- **App MOBILE** (la référence "qui marche bien") : `d:\MesApps\deploy\CosmeCheck-App`
  - Expo / React Native. Tourne sur l'émulateur Pixel 7 Pro.
- Project Supabase : `rogesnduejmqpxolhbif`.

## Contexte / état actuel

La feature "Suggestions intelligentes" (routine) propose, pour chaque produit pénalisant, un remplaçant mieux noté de la même catégorie qui respecte les restrictions + le profil. Le **mobile montre 5 suggestions dans un deck feuilletable**. Le **web n'en montre que 2** (et dans un format à corriger).

Déjà fait cette session (web) :
- `lib/routine/atRisk.ts` réécrit : sélection = `capped < 13 OU viole une restriction`, tri par sévérité, top 8. Prend `opts = { restrictions, families }`.
- `app/routine/suggestions/page.tsx` + `app/routine/page.tsx` : chargent `loadIngredientFamilies()` et passent `{ restrictions, families }`.
- `app/api/routine/catalog-suggestions/route.ts` : plafond items 5 → 8.
- `lib/routine/suggestionsCache.ts` : clé bumpée `v3 → v4`.
- `components/routine/SuggestionsPageClient.tsx` : passé en deck HORIZONTAL (à RE-VERTICALISER, voir tâche 1).

## Les 3 tâches

### 1. Web en VERTICAL (annuler le deck horizontal)
Fichier : `components/routine/SuggestionsPageClient.tsx`.
- J'ai ajouté un carrousel horizontal (state `current`, `scrollRef`, `onScroll`, compteur "X / N · glisse horizontalement", pagination par points). **Le user veut finalement du vertical.**
- Revenir à la liste verticale : `<ul className="space-y-4">` avec une `<SuggestionCard>` par `<li>`. Retirer `current`/`scrollRef`/`onScroll`, le compteur et les dots.

### 2. Critère "orange et/ou rouge" → mérite une suggestion
Fichier : `lib/routine/atRisk.ts`.
- Aujourd'hui : `isAtRisk = capped < 13 || restrictedCount > 0`.
- Élargir : `|| cOrange >= 1 || cRouge >= 1`. Le user dit que TOUTE sa routine a au moins un ingrédient orange/rouge et doit donc avoir une suggestion.
- Garder le tri par sévérité + top 8.

### 3. LE VRAI ÉCART : web montre 2, mobile 5
La page routine compte déjà "5 produits à optimiser", mais seulement 2 produisent une alternative côté web. Pour 3 produits, `pickBestAlternative` renvoie `null` (aucune alternative VERTE + meilleure trouvée dans la catégorie résolue). Le mobile en trouve 5.

Cause probable : la **résolution de catégorie** et le **re-routage IA** sont plus robustes côté mobile. Quand la 1ère catégorie ne donne rien (ou que `validate-suggestions` juge la paire illogique), le mobile **re-classe** via le type produit renvoyé par le LLM (`cosme_check_classify_product_category`) et **réessaie** `buildSuggestions` sur la nouvelle catégorie. Le web ne réessaie pas sur "catégorie vide".

À faire :
- Comparer la résolution de catégorie + le re-essai entre :
  - MOBILE : `app/(tabs)/routine.tsx` (fn `openSuggestions`), `lib/routine/buildSuggestions.ts`, `lib/routine/optimize.ts`, `supabase/functions/validate-suggestions/index.ts`.
  - WEB : `app/api/routine/catalog-suggestions/route.ts` (fns `resolveCategory`, `fetchAlternatives`, `pickBestAlternative` dans `lib/routine/suggestions.ts`, et l'étape `validateSuggestions`).
- Aligner le web : si une catégorie résolue renvoie 0 alternative verte, re-classer via `cosme_check_classify_product_category` (ou le `product_type` du LLM de validation) et réessayer, comme mobile.
- Vérifier que le web passe bien le **contexte profil/peau** à la validation IA (mobile envoie `skinContext` / `skinContextSummary(skin)` à `validate-suggestions`).
- DEBUG concret : pour les 3 produits qui échouent (ex. "Dove Deodorant Dry Serum", "Self-tan Sunny Serum Body", "Maquillage Highlighter Mermaid"), logguer la `resolvedCategory` côté route web et vérifier ce que renvoie `cosme_check_alternatives_by_category_exact` pour cette catégorie (via Supabase MCP `execute_sql`). On verra si c'est la catégorie qui est mauvaise/vide, ou s'il n'existe simplement aucune alternative verte (auquel cas décider quoi afficher).

Tout doit continuer à respecter restrictions + profil (déjà câblé via `readUserRestrictions` + `lib/restrictions/check.ts` tag-based).

## Logique métier de référence (ne pas casser)
- Score affiché = score PLAFONNÉ (`colorCapScore` : ≥1 rouge ou ≥3 orange → ≤8.9 ; ≥1 orange → ≤12.9).
- Alternative retenue = VERTE (`capped >= 13`, `GREEN_MIN`) ET strictement meilleure (`> productCapped + 0.5`, `MIN_IMPROVEMENT`).
- Détection restriction = par TAG (`item.tags[]` ↔ `ingredient_families.tag_slug`), via `lib/restrictions/check.ts` (web) — identique au backend et au mobile.

## Vérification
- Web : `cd D:\MesApps\deploy\CosmetWiki ; npx tsc --noEmit` (0 nouvelle erreur ; erreurs pré-existantes connues : `app/privacy/page.tsx`, `components/nav/AppShell.tsx`).
- Mobile : `cd d:\MesApps\deploy\CosmeCheck-App ; npx tsc --noEmit ; npx jest --config jest.config.js --no-coverage`.
- Effet web au reload du dev server (pas de build). NE PAS rebuild l'APK.
