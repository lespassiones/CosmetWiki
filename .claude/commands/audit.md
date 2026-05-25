# Audit complet Cosme Check

Tu es un expert en performance web, sécurité et architecture backend. Tu vas réaliser un audit complet de l'application **Cosme Check** (Next.js 15 + Supabase + Vercel + OpenAI).

**Stack de référence** : Next.js 15 App Router, React 19, Supabase PostgreSQL, Vercel Edge, OpenAI/Mistral, Tailwind CSS, TypeScript.

---

## Instructions d'exécution

Lance les 5 audits dans l'ordre ci-dessous. Pour chaque section, lis les fichiers concernés, analyse le code, puis produis un rapport structuré avec :
- **Constat** : ce que tu observes
- **Risque** : impact si non corrigé
- **Fix recommandé** : action concrète avec exemple de code si pertinent
- **Score** : 🟢 OK / 🟡 Attention / 🔴 Critique

À la fin, génère un **tableau de synthèse global** et une **liste des 5 actions prioritaires**.

---

## AUDIT 1 — Performance & Vitesse

**Objectif** : identifier les goulots qui ralentissent le rendu et augmentent le TTFB.

Lis et analyse :
- `next.config.ts` — headers, compression, image optimization, bundle splitting
- `app/layout.tsx` — fonts, scripts tiers, providers wrappés inutilement
- Tous les fichiers `app/**/page.tsx` — identifier les pages avec `"use client"` inutile (devrait être server component), les fetches sans cache (`cache: 'no-store'` inutile), les waterfalls (await séquentiels au lieu de Promise.all)
- `components/` — composants lourds chargés sans `dynamic()` + `loading: lazy`, images sans `priority` sur le LCP, `useEffect` qui fetche au lieu de server component
- `lib/ai/client.ts` et routes `/api/analyser`, `/api/advisor/chat` — streaming activé ? timeout configuré ?

**Vérifie spécifiquement** :
1. Y a-t-il des `await` séquentiels dans les pages serveur qui pourraient être parallélisés avec `Promise.all()` ?
2. Les `"use client"` sont-ils justifiés ou des server components suffiraient ?
3. Les images ont-elles `width`/`height` définis pour éviter le CLS ?
4. Y a-t-il des bundles tiers importés côté client qui pourraient être server-side ?
5. Le middleware auth fait-il des appels Supabase évitables sur les routes statiques ?

---

## AUDIT 2 — Charge & Scalabilité (scénario 1 000 utilisateurs simultanés)

**Objectif** : simuler 1 000 users actifs et identifier les points de rupture.

Lis et analyse :
- `lib/apiGate.ts` — le rate limiter tient-il sous charge ? in-memory ou Postgres ?
- `lib/ratelimit.ts` — buckets in-memory : que se passe-t-il avec plusieurs instances Vercel ?
- `middleware.ts` — coût du middleware sur chaque requête (auth refresh, bot detection)
- `app/api/analyser/route.ts`, `app/api/advisor/chat/route.ts` — concurrence vers OpenAI, retry logic, timeout
- `lib/idempotency.ts` — la table idempotency est-elle indexée ? TTL cleanup automatique ?
- `lib/productSearch/cache.ts` — cache hit ratio : si 1 000 users cherchent le même produit en même temps, combien de calls Supabase ?
- `app/api/*/route.ts` (toutes les routes) — connection pooling Supabase : combien de clients créés ? réutilisation ?

**Calcule ou estime** :
1. **Connections Supabase max** : combien de `supabaseServer()` instanciés par requête ? Avec 1 000 req/s, est-ce dans les limites du plan ?
2. **Coût OpenAI** : si 1 000 users lancent une analyse simultanément, quel est le débit max vers OpenAI ? Y a-t-il une file d'attente ?
3. **Rate limiter Postgres** : le RPC `cosme_check_check_rate_limit` est appelé à chaque requête gated — quel est le coût en ms à 1 000 req/s ?
4. **Vercel serverless cold starts** : les fonctions sont-elles optimisées pour démarrage rapide ? Imports lourds au top-level ?
5. **Memory leaks** : y a-t-il des `setInterval` ou listeners non nettoyés dans les route handlers ?

---

## AUDIT 3 — Requêtes Base de Données

**Objectif** : identifier les requêtes lentes, les N+1, et les absences d'index.

Lis et analyse :
- Tous les fichiers `app/api/**/route.ts` et `app/**/actions.ts` — extraire toutes les requêtes Supabase
- `lib/productSearch/cascade.ts` — combien de requêtes BD pour un seul produit non caché ?
- `app/history/page.tsx` et `app/routine/page.tsx` — les selects chargent-ils plus de colonnes que nécessaire ?
- `app/advisor/page.tsx` et `app/api/advisor/chat/route.ts` — combien de round-trips BD par message ?

**Analyse chaque requête trouvée et vérifie** :
1. **SELECT *** vs colonnes explicites : y a-t-il des `.select("*")` sur des tables larges ?
2. **N+1 queries** : y a-t-il des boucles qui font un appel BD par itération ?
3. **Index manquants** : les colonnes filtrées dans les `.eq()`, `.ilike()`, `.match()` ont-elles un index probable ? (analyses.user_id, routine_items.user_id, idempotency.key, etc.)
4. **Pagination** : les listes (historique, routine) sont-elles limitées avec `.limit()` ou `.range()` ? Que se passe-t-il avec 10 000 analyses ?
5. **RPC batch vs boucle** : y a-t-il des endroits où plusieurs RPCs pourraient être remplacés par un seul batch RPC ?
6. **Transactions manquantes** : y a-t-il des opérations multi-tables sans transaction (risque d'état incohérent) ?

---

## AUDIT 4 — Sécurité

**Objectif** : identifier les vulnérabilités OWASP Top 10 et les failles spécifiques à ce stack.

Lis et analyse :
- `middleware.ts` — couverture des routes protégées, bypass possible
- `lib/apiGate.ts` — validation user, extraction IP (X-Forwarded-For spoofable ?)
- Tous les `app/api/**/route.ts` — validation des inputs (Zod ? ou raw `req.json()` ?)
- `app/**/actions.ts` — Server Actions : validation, auth check, CSRF
- `next.config.ts` — security headers complets ? CSP configuré ?
- `lib/supabase.ts` — séparation anon key / service role key correcte ?
- Cherche les patterns dangereux : `eval(`, template literals avec input user, `dangerouslySetInnerHTML`

**Vérifie spécifiquement** :
1. **Injection** : les inputs utilisateur passés aux RPCs Supabase sont-ils sanitizés ? Les queries `.ilike()` avec input user sont-elles sécurisées contre les injections regex/SQL ?
2. **IDOR (Insecure Direct Object Reference)** : les routes `/api/history/[id]`, `/api/promesses/[id]` vérifient-elles que l'item appartient à l'utilisateur connecté, ou font-elles confiance au RLS seul ?
3. **Exposition de secrets** : y a-t-il des `NEXT_PUBLIC_` qui exposent des clés qui ne devraient pas l'être ? Des `console.log` avec des données sensibles ?
4. **Rate limiting bypassable** : l'IP est extraite comment ? Peut-on spoofer `X-Forwarded-For` pour contourner le rate limit ?
5. **Server Actions CSRF** : les actions dans `actions.ts` vérifient-elles l'origine ? Next.js 15 protège-t-il automatiquement ?
6. **Content-Security-Policy** : configuré dans `next.config.ts` ? Quel niveau ?
7. **Dépendances vulnérables** : liste les dépendances avec des versions potentiellement vulnérables (Tesseract.js, ZXing, etc.)
8. **OpenAI prompt injection** : les inputs utilisateur sont-ils inclus dans les prompts système sans sanitisation ? Risque de jailbreak / extraction de données ?

---

## AUDIT 5 — Résilience & Observabilité

**Objectif** : l'app survit-elle à une panne partielle ? Peut-on diagnostiquer les problèmes en prod ?

Lis et analyse :
- `app/api/*/route.ts` — gestion d'erreurs : try/catch partout ? Fallbacks si OpenAI down ? Si Supabase down ?
- `middleware.ts` — le timeout de 1.5s sur l'auth refresh est-il suffisant ? Que se passe-t-il si Supabase est down ?
- `lib/productSearch/cascade.ts` — si OpenBeautyFacts est down, le fallback fonctionne-t-il ?
- `app/api/health/route.ts` — le healthcheck teste-t-il vraiment les dépendances critiques (Supabase, OpenAI) ?
- Cherche les `console.error`, `console.log` — sont-ils suffisants pour le debug prod ? Y a-t-il un service de monitoring (Sentry, Datadog) ?

**Vérifie** :
1. **Circuit breaker** : si OpenAI répond en 30s au lieu de 3s, l'utilisateur attend-il ? Y a-t-il un timeout avec message d'erreur propre ?
2. **Retry logic** : les appels OpenAI ont-ils un retry avec backoff exponentiel en cas d'erreur 429/500 ?
3. **Graceful degradation** : si le rate limiter Postgres est down, l'app bloque-t-elle toutes les requêtes ou passe-t-elle en mode permissif ?
4. **Logging structuré** : les erreurs sont-elles loggées avec suffisamment de contexte (userId, route, payload size) pour débugger en prod ?
5. **Alerting** : y a-t-il des mécanismes pour être alerté si le taux d'erreur monte (5xx rate, crédit épuisé en masse, etc.) ?

---

## RAPPORT FINAL

Une fois les 5 audits terminés, génère :

### Tableau de synthèse

| Catégorie | Score | Nb problèmes critiques | Nb problèmes mineurs |
|-----------|-------|----------------------|---------------------|
| Performance & Vitesse | 🟢/🟡/🔴 | X | X |
| Charge (1000 users) | 🟢/🟡/🔴 | X | X |
| Requêtes BD | 🟢/🟡/🔴 | X | X |
| Sécurité | 🟢/🟡/🔴 | X | X |
| Résilience | 🟢/🟡/🔴 | X | X |

### Top 5 actions prioritaires

Liste les 5 corrections les plus impactantes, classées par urgence, avec :
- Le fichier exact à modifier
- La ligne ou la fonction concernée
- Le fix en 1-3 lignes de code si possible

### Estimation capacité max actuelle

Donne une estimation honnête : combien d'utilisateurs simultanés l'app peut-elle absorber aujourd'hui sans dégradation notable ? Quel est le premier point de rupture ?
