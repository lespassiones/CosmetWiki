# Audit Performance Vercel + Bundle — Cosme Check

Tu es un expert en performance web Next.js 15 / Vercel. Tu vas réaliser un audit de performance complet sur **Cosme Check** en combinant l'analyse statique du code et les données live Vercel.

**Stack** : Next.js 15 App Router, React 19, Supabase, OpenAI/Mistral, Tailwind CSS, TypeScript, Vercel.

---

## Instructions d'exécution

Lance les 4 audits dans l'ordre. Pour chaque point identifié, produis :
- **Constat** : ce que tu observes (avec fichier + ligne si possible)
- **Impact** : combien de ms / Ko perdus estimés
- **Fix** : action concrète, code si pertinent
- **Priorité** : 🔴 Critique / 🟡 Moyen / 🟢 Mineur

---

## AUDIT 1 — Logs & Métriques Vercel Live

Utilise le MCP Vercel pour collecter les données réelles.

**Étape 1 — Récupérer le projet**
- Appelle `list_projects` pour trouver le projet Cosme Check
- Appelle `get_project` pour voir la config (framework, node version, regions)

**Étape 2 — Dernier déploiement**
- Appelle `list_deployments` (limit 3) pour récupérer le dernier déploiement prod
- Appelle `get_deployment` sur ce déploiement : note le `buildDuration`, `createdAt`, `readyAt`
- Appelle `get_deployment_build_logs` : cherche les warnings de bundle size ("> 500 KB"), les chunks lourds, les erreurs de tree-shaking

**Étape 3 — Runtime logs sur les routes critiques**
- Appelle `get_runtime_logs` en filtrant sur les routes suivantes (une par une si nécessaire) :
  - `/api/analyser` — la plus lourde (OCR + OpenAI)
  - `/api/advisor/chat` — streaming AI
  - `/api/ocr` — Tesseract.js
  - `/api/product-search` — cascade de recherche
  - `/api/synthesis` — synthèse IA
- Pour chaque route, note : durée p50 / p95, taux d'erreur, cold starts visibles (durée > 3s au premier hit)

**Ce que tu cherches dans les logs :**
1. Routes avec durée > 5 000ms régulièrement
2. Erreurs 504 (timeout Vercel 10s dépassé)
3. Fonctions avec memory usage > 512 MB
4. Cold starts fréquents (pattern : première requête lente, suivantes rapides)
5. Erreurs OpenAI 429 (rate limit) ou 503

---

## AUDIT 2 — Bundle Size & Code Splitting

Analyse statique des pages et composants clients.

**Lis ces fichiers** :
- `next.config.ts` — config actuelle (optimizePackageImports, compress, images)
- `app/layout.tsx` — providers wrappés, fonts, scripts tiers chargés globalement
- `app/page.tsx` — la home : server ou client ? imports lourds ?
- `app/analyse/page.tsx` — page principale : `"use client"` justifié ?
- `app/advisor/page.tsx` — page advisor
- `app/compare/page.tsx` — page comparaison

**Vérifie dans chaque page :**

1. **`"use client"` inutiles** : une page avec `"use client"` mais sans state/event handler devrait être un Server Component. Lis le contenu et vérifie.

2. **Imports lourds côté client** : cherche les imports de `tesseract.js`, `@zxing/browser`, `@zxing/library` dans des fichiers `"use client"`. Ces libs (~2-3 MB) doivent être chargées via `dynamic(() => import(...), { ssr: false })`.

3. **Dynamic imports manquants** : liste les composants lourds importés statiquement qui pourraient bénéficier d'un `dynamic()`. Cherche dans `components/` les fichiers > 100 lignes importés dans des pages sans `dynamic()`.

4. **Third-party scripts** : y a-t-il des `<Script>` sans `strategy="lazyOnload"` ou `strategy="afterInteractive"` ?

5. **Fonts** : dans `app/layout.tsx`, les fonts Google sont-elles chargées avec `display: 'swap'` ?

---

## AUDIT 3 — Waterfalls & Requêtes Serveur

Analyse des patterns de fetch dans les Server Components et routes API critiques.

**Lis ces fichiers** :
- `app/history/page.tsx`
- `app/compare/page.tsx`
- `app/routine/page.tsx`
- `app/api/analyser/route.ts`
- `app/api/product-search/route.ts`
- `app/api/synthesis/route.ts`
- `lib/productSearch/cascade.ts` (si existe)
- `lib/productSearch/cache.ts` (si existe)

**Vérifie :**

1. **`await` séquentiels parallelisables** : cherche les patterns :
   ```ts
   const a = await fetchA();
   const b = await fetchB(); // indépendant de a → waterfall inutile
   ```
   Ces cas doivent devenir `const [a, b] = await Promise.all([fetchA(), fetchB()])`.

2. **Cache Next.js manquant** : les `fetch()` dans les Server Components ont-ils `{ next: { revalidate: N } }` ou `{ cache: 'force-cache' }` quand les données ne changent pas à chaque requête ?

3. **Supabase : SELECT * sur tables larges** : cherche `.select("*")` dans les routes API et pages. Les tables `analyses`, `products`, `ingredients` ont probablement beaucoup de colonnes — ne sélectionner que ce qui est affiché.

4. **N+1 queries** : y a-t-il des boucles `for` ou `.map()` avec un appel Supabase à l'intérieur ? C'est le problème N+1 classique.

5. **Route `/api/analyser`** : combien d'appels externes (OpenBeautyFacts, InciBeauty, OpenAI) sont faits séquentiellement ? Peuvent-ils être parallélisés ?

6. **Pagination absente** : les routes qui retournent des listes (history, routine, compare) ont-elles un `.limit()` ? Que retourne la requête si l'utilisateur a 500 analyses ?

---

## AUDIT 4 — Perf Perçue (UX)

Analyse des patterns qui dégradent la perception de vitesse même sans problème réseau.

**Lis ces fichiers** :
- `app/layout.tsx` — skeleton/loading global
- `app/analyse/page.tsx` et `components/` associés — états de loading pendant l'analyse OCR/IA
- `app/advisor/page.tsx` et `components/advisor/AdvisorChat.tsx` — streaming UI ?
- `app/history/page.tsx` — skeleton ou spinner ?
- `components/nav/` — le header est-il server ou client ?

**Vérifie :**

1. **Streaming AI** : dans `/api/advisor/chat/route.ts`, la réponse OpenAI est-elle streamée (`ReadableStream` / `streamText`) ou attendue entièrement avant envoi ? Le streaming divise le TTFB perçu par 5-10×.

2. **Suspense boundaries** : les pages avec fetch lent ont-elles un `<Suspense fallback={<Skeleton />}>` pour afficher du contenu immédiatement ?

3. **Loading states** : pendant l'analyse OCR+IA (qui peut durer 5-15s), l'utilisateur voit-il une progression ou un simple spinner qui donne l'impression que ça plante ?

4. **Images LCP** : sur la home (`app/page.tsx`), l'image above-the-fold principale a-t-elle `priority={true}` ? (Sans ça, Next.js la charge en lazy par défaut, ce qui détruit le LCP.)

5. **Fonts CLS** : `font-display: swap` est-il configuré ? Si non, le texte est invisible le temps que la font charge (FOIT), ou saute lors du chargement (CLS).

6. **Prefetch** : les liens vers les pages fréquentes (`/analyse`, `/history`) dans la nav utilisent-ils `<Link prefetch={true}>` ?

---

## RAPPORT FINAL

Génère les 3 sections suivantes :

### 1. Tableau de synthèse

| Dimension | Score | Problèmes critiques | Problèmes mineurs |
|-----------|-------|---------------------|-------------------|
| Logs Vercel (routes lentes, erreurs) | 🟢/🟡/🔴 | X | X |
| Bundle size & code splitting | 🟢/🟡/🔴 | X | X |
| Waterfalls & requêtes serveur | 🟢/🟡/🔴 | X | X |
| UX perçue (streaming, skeleton) | 🟢/🟡/🔴 | X | X |

### 2. Top 5 optimisations prioritaires

Pour chaque action :
- Le fichier exact à modifier (avec lien cliquable)
- La ligne ou fonction concernée
- Le fix en 1-5 lignes de code
- Le gain estimé (ms ou Ko)

### 3. Estimation des gains totaux

Si les 5 actions prioritaires sont appliquées, quelle est l'amélioration estimée sur :
- **TTFB** de la home
- **TTI** de la page `/analyse`
- **Durée p95** de `/api/analyser`
- **Bundle size** total (KB)
