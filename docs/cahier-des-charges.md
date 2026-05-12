# Cosme Check — Cahier des charges technique (v2)

> Version révisée pour respecter la contrainte **« zéro service payant »**.
> Stack imposée : **Next.js + Supabase free tier + Vercel free tier**.

---

## 1. Vision produit

Un moteur de recherche d'ingrédients cosmétiques type Google :

- **Page d'accueil épurée** avec une seule barre de recherche.
- **Autocomplétion** ultra-rapide tolérante aux fautes (fuzzy).
- **Fiche détaillée** par ingrédient avec données structurées et liste de produits qui en contiennent (avec images).
- **Aucun login requis**, consultation publique uniquement.

**Inspiration UX :** INCI Beauty pour le contenu, Google et Perplexity pour la simplicité d'entrée.

**Public :** consommateurs cosmétiques, formulateurs, marques en veille.

---

## 2. Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| **Framework web** | Next.js 15 (App Router, RSC) + TypeScript | SSR pour SEO, ISR pour mise en cache des fiches, free sur Vercel |
| **Hébergement** | Vercel **free tier** | Déploiement zero-config, CDN edge mondial, 100 GB bandwidth gratuit |
| **Base de données** | Supabase **free tier**, PostgreSQL 15+ | Schéma isolé `cosme_check` dans une base déjà partagée avec une autre app |
| **Stockage images** | Supabase Storage (free, 1 GB) | Optimisation WebP agressive pour rester sous le quota |
| **Recherche** | PostgreSQL natif : `pg_trgm` + `tsvector` + `ts_rank` | Pas besoin d'Algolia/Meilisearch — Postgres gère 15k lignes en <50ms |
| **Cache** | Vercel Edge Cache + ISR (revalidate 24 h) | Réduit drastiquement les hits Supabase |
| **Anti-bot** | Middleware Next.js (in-memory rate limit) + hCaptcha free + honeypots | 100 % gratuit, pas de Cloudflare |
| **CSS** | Tailwind CSS | JIT en prod = classes hashées (bonus anti-scraping) |
| **Scraping** | Python + `requests` + `BeautifulSoup` | Déjà en place dans `scripts/` |
| **CI/CD** | GitHub Actions (free tier 2000 min/mois) ou simple `git push` | Vercel détecte les pushs |

### Services explicitement exclus

| Service | Raison du refus |
|---|---|
| ❌ Cloudflare (et Turnstile) | Refus utilisateur |
| ❌ Algolia / Meilisearch SaaS | Payants (free tier insuffisant) |
| ❌ Upstash Redis | Free tier mais inutile : on utilisera in-memory ou la table Postgres |
| ❌ Sentry / Datadog | Payants |
| ❌ AWS / GCP | Trop complexe et payant à terme |

---

## 3. Modèle de données — schéma `cosme_check`

> ⚠️ **Important :** la base Supabase est partagée avec une autre application. Toutes les tables Cosme Check vivent dans un **schéma PostgreSQL dédié `cosme_check`**. Le schéma `public` est intouchable.

### 3.1 Création du schéma et extensions

```sql
-- À exécuter une seule fois, par un compte ayant les droits owner
CREATE SCHEMA IF NOT EXISTS cosme_check;

-- Extensions nécessaires (souvent déjà actives sur Supabase)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Donner accès au rôle anon en lecture seule, et authenticated/service_role en lecture (et service_role en écriture)
GRANT USAGE ON SCHEMA cosme_check TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA cosme_check
  GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA cosme_check
  GRANT ALL ON TABLES TO service_role;
```

### 3.2 Tables

```sql
-- ====================================
-- Table : ingredients
-- ====================================
CREATE TABLE cosme_check.ingredients (
  id              BIGSERIAL PRIMARY KEY,
  inci_id         INTEGER UNIQUE NOT NULL,         -- id incibeauty (ex: 20312)
  slug            TEXT UNIQUE NOT NULL,            -- "acid-blue-74-aluminum-lake"
  name            TEXT NOT NULL,                   -- "ACID BLUE 74 ALUMINUM LAKE"
  cas_number      TEXT,                            -- "16521-38-3"
  einecs_number   TEXT,                            -- "240-589-3"
  classification  TEXT[],                          -- ["Sel d'Aluminium", "Réglementé"]
  color_rating    TEXT NOT NULL CHECK (color_rating IN ('Vert','Jaune','Orange','Rouge')),
  origin          TEXT,                            -- "Synthétique"
  description     TEXT,                            -- "Pénalité moyenne dans toutes les catégories"
  functions       JSONB,                           -- [{name, description}]
  prevalence_pct  NUMERIC(6,3),                    -- ex: 0.020
  category_breakdown JSONB,                        -- {"Coloration capillaire": 0.66, ...}
  regulated_zones TEXT[],                          -- ["Europe", "Royaume-Uni"]
  translations    JSONB,                           -- {"en": "Blue hair dye", ...}
  source_url      TEXT NOT NULL,
  details_scraped BOOLEAN DEFAULT FALSE,           -- TRUE quand la fiche détaillée a été scrapée
  scraped_at      TIMESTAMPTZ DEFAULT NOW(),
  search_vector   TSVECTOR
);

-- Index pour la recherche full-text
CREATE INDEX ingredients_search_idx
  ON cosme_check.ingredients USING GIN(search_vector);

-- Index trigram pour la recherche fuzzy par nom
CREATE INDEX ingredients_name_trgm_idx
  ON cosme_check.ingredients USING GIN(name gin_trgm_ops);

-- Index sur la couleur pour les filtres
CREATE INDEX ingredients_color_idx
  ON cosme_check.ingredients(color_rating);

-- Index sur le CAS pour la recherche par numéro CAS
CREATE INDEX ingredients_cas_idx
  ON cosme_check.ingredients(cas_number)
  WHERE cas_number IS NOT NULL;

-- Trigger pour maintenir search_vector
CREATE OR REPLACE FUNCTION cosme_check.ingredients_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.cas_number, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.einecs_number, '')), 'B') ||
    setweight(to_tsvector('simple',
      coalesce(NEW.translations::text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ingredients_search_update
  BEFORE INSERT OR UPDATE ON cosme_check.ingredients
  FOR EACH ROW EXECUTE FUNCTION cosme_check.ingredients_search_trigger();

-- ====================================
-- Table : products
-- ====================================
CREATE TABLE cosme_check.products (
  id              BIGSERIAL PRIMARY KEY,
  inci_product_id TEXT UNIQUE,                     -- id incibeauty produit
  brand           TEXT NOT NULL,
  name            TEXT NOT NULL,
  volume          TEXT,                            -- "170 ml"
  score           NUMERIC(4,2),                    -- 5.90 sur 20
  image_path      TEXT,                            -- chemin dans Supabase Storage : /products/{id}.webp
  source_url      TEXT,
  scraped_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX products_brand_idx ON cosme_check.products(brand);

-- ====================================
-- Table de jonction : products ↔ ingredients
-- ====================================
CREATE TABLE cosme_check.product_ingredients (
  product_id    BIGINT NOT NULL REFERENCES cosme_check.products(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES cosme_check.ingredients(id) ON DELETE CASCADE,
  position      INTEGER,                           -- ordre dans la composition (1 = principal)
  PRIMARY KEY (product_id, ingredient_id)
);

CREATE INDEX product_ingredients_ingredient_idx
  ON cosme_check.product_ingredients(ingredient_id);

-- ====================================
-- Table : recherche - log anonyme (pour débugger les requêtes vides)
-- ====================================
CREATE TABLE cosme_check.search_log (
  id          BIGSERIAL PRIMARY KEY,
  query       TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  ip_hash     TEXT,                                -- SHA256 de l'IP, jamais l'IP claire
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX search_log_query_idx ON cosme_check.search_log(query);
CREATE INDEX search_log_created_idx ON cosme_check.search_log(created_at);

-- ====================================
-- Row Level Security : lecture publique, écriture interdite côté client
-- ====================================
ALTER TABLE cosme_check.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosme_check.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosme_check.product_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON cosme_check.ingredients
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public read" ON cosme_check.products
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public read" ON cosme_check.product_ingredients
  FOR SELECT TO anon, authenticated USING (true);

-- search_log : pas accessible aux anon
ALTER TABLE cosme_check.search_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service only" ON cosme_check.search_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### 3.3 Fonction RPC pour la recherche

```sql
CREATE OR REPLACE FUNCTION cosme_check.search_ingredients(
  q TEXT,
  result_limit INTEGER DEFAULT 8
)
RETURNS TABLE (
  id BIGINT, slug TEXT, name TEXT, color_rating TEXT,
  cas_number TEXT, translation_fr TEXT, rank REAL
)
LANGUAGE sql STABLE AS $$
  SELECT
    i.id, i.slug, i.name, i.color_rating, i.cas_number,
    coalesce(i.translations->>'fr', '')::TEXT AS translation_fr,
    GREATEST(
      similarity(i.name, q),
      ts_rank(i.search_vector, plainto_tsquery('simple', unaccent(q)))
    ) AS rank
  FROM cosme_check.ingredients i
  WHERE
    i.search_vector @@ plainto_tsquery('simple', unaccent(q))
    OR i.name ILIKE q || '%'
    OR i.name % q
    OR i.cas_number = q
  ORDER BY rank DESC, i.name ASC
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION cosme_check.search_ingredients(TEXT, INTEGER) TO anon, authenticated;
```

---

## 4. Pipeline de scraping (indépendant du site)

> Tous les scripts vivent dans `scripts/`. Ils sont **autonomes**, exécutés à la main ou via cron, et poussent dans Supabase via la connexion DB directe (pas le SDK).

### 4.1 Phase 1 — index alphabétique ✅ DÉJÀ FAIT

Voir [scripts/scrape_incibeauty.py](../scripts/scrape_incibeauty.py). Output : [data/ingredients_raw.json](../data/ingredients_raw.json) — 15 722 ingrédients.

### 4.2 Phase 2 — détail des fiches ingrédient (à écrire)

`scripts/scrape_ingredient_details.py`

Pour chaque ingrédient de `ingredients_raw.json` :

1. GET `source_url`
2. Parser la page pour extraire :
   - N° CAS, N° EINECS/ELINCS
   - Origine (Synthétique / Végétale / Minérale / etc.)
   - Classification (tags)
   - Description et niveau de pénalité
   - Fonctions INCI (avec descriptions)
   - Statistiques de prévalence (% global + ventilation par catégorie)
   - Zones réglementées
   - Traductions multilingues (extraire dans un dict `{"en": ..., "de": ...}`)
   - **URLs des produits qui en contiennent** (jusqu'à 20)
3. UPSERT dans `cosme_check.ingredients` (set `details_scraped = TRUE`)
4. Sauvegarder les URLs produits dans une queue (fichier JSON ou table dédiée) pour la phase 3

**Politesse :** délai aléatoire 0,5–1,5 s, pool de 6 workers max, retry exponentiel, checkpoint tous les 100 ingrédients.

**Estimation :** 15 722 × 1 s ≈ **4 h** sur une connexion correcte.

### 4.3 Phase 3 — détail des produits

`scripts/scrape_products.py`

Pour chaque URL produit collectée :

1. GET la page produit
2. Extraire : marque, nom, volume, score INCI, URL image
3. UPSERT dans `cosme_check.products`
4. Récupérer la composition complète (liste ordonnée d'ingrédients)
5. INSERT dans `cosme_check.product_ingredients` (avec `position`)

**Stratégie de déduplication :** un même produit peut apparaître sur les fiches de plusieurs ingrédients → on déduplique par `inci_product_id`.

**Estimation :** ~50 000 produits uniques × 1 s ≈ **14 h** (à découper en plusieurs sessions).

### 4.4 Phase 4 — téléchargement des images

`scripts/download_images.py`

Pour chaque `image_url` non encore traité :

1. GET l'image originale
2. Conversion **WebP qualité 75, max 400 px de large** via Pillow
3. Upload dans Supabase Storage : `products/{product_id}.webp`
4. Update `cosme_check.products.image_path`

**Optimisation cible :** 50 000 × 18 KB = ~900 MB → on tient dans le 1 GB du free tier.

**Si on dépasse :** réduire à 10 produits par ingrédient les plus pertinents (les mieux notés).

---

## 5. Application Next.js

### 5.1 Arborescence prévue (à créer en phase C)

```
web/
├── app/
│   ├── layout.tsx              ← layout global, light mode forcé
│   ├── page.tsx                ← page d'accueil (barre de recherche)
│   ├── i/
│   │   └── [slug]/
│   │       └── page.tsx        ← fiche ingrédient (ISR 24h)
│   ├── api/
│   │   └── search/route.ts     ← endpoint autocomplete (rate limited)
│   └── robots.txt/route.ts     ← robots.txt strict
├── components/
│   ├── SearchBar.tsx           ← input + dropdown autocomplete
│   ├── IngredientCard.tsx
│   ├── ProductGrid.tsx
│   └── ColorBadge.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts           ← client server (service_role)
│   │   └── client.ts           ← client browser (anon)
│   ├── ratelimit.ts            ← rate limiting in-memory
│   └── hcaptcha.ts             ← vérification captcha
├── middleware.ts               ← rate limit + bot detection
├── tailwind.config.ts
├── next.config.ts              ← image optimization, headers de sécurité
├── package.json
└── tsconfig.json
```

### 5.2 UX et design

**Charte (light mode strict) :**
- Fond : `#FAFAFA`
- Surfaces : blanc pur `#FFFFFF` avec `box-shadow: 0 1px 3px rgba(0,0,0,0.05)`
- Texte principal : `#1F2937`
- Texte secondaire : `#6B7280`
- Vert : `#22C55E` / fond pâle `#DCFCE7`
- Jaune : `#EAB308` / fond pâle `#FEF9C3`
- Orange : `#F97316` / fond pâle `#FFEDD5`
- Rouge : `#EF4444` / fond pâle `#FEE2E2`
- Police : `Inter` (free, Google Fonts)

**Page d'accueil :**

```
                                                    [À propos]

                          🌿 Cosme Check

         ┌────────────────────────────────────────────────┐
         │ 🔍  Cherchez un ingrédient (ex: Glycerin)      │
         └────────────────────────────────────────────────┘

           Suggestions :  Glycerin   Phenoxyethanol   Parfum

                                                    fait avec ❤
```

**Page fiche ingrédient :**

```
[← retour]                                    [🔍 nouvelle recherche]

🟠  PHENOXYETHANOL                       N° CAS : 122-99-6
─────────────────────────────────────────────────────────
⚠ Pénalité moyenne dans toutes les catégories

┌─ Classification ──────┐  ┌─ Réglementation ──────┐
│ Conservateur · Alcool │  │ 🇪🇺 Europe  🇬🇧 RU      │
└───────────────────────┘  └────────────────────────┘

📊 Présent dans 23,4 % des cosmétiques
   ▓▓▓▓▓▓▓▓░░░ Soins du visage (45 %)
   ▓▓▓▓▓░░░░░░ Maquillage (28 %)

🔬 Fonctions
   • Conservateur — limite la prolifération bactérienne
   • Stabilisateur

📦 Produits qui en contiennent (10)
   [grille 5x2 d'images produits avec marque + nom + score]

🌐 Autres langues : Phenoxyäthanol, ফিনক্সিইথানল...
```

### 5.3 Recherche & autocomplete

- Composant `SearchBar` côté client avec **debounce 150 ms**.
- Appelle une **Server Action** (pas une API route) → pas d'endpoint REST exposé publiquement.
- Server Action : appelle la fonction RPC `cosme_check.search_ingredients(query)`.
- Résultat caché 60 s côté Vercel (Vary sur la query).
- Fuzzy matching tolère les fautes de frappe.
- Recherche aussi par **N° CAS** (ex : taper "122-99-6" → trouve Phenoxyethanol).
- Recherche aussi par **traduction FR** (ex : "phénoxyéthanol" trouve "PHENOXYETHANOL").

### 5.4 Page fiche : ISR 24 h

- `export const revalidate = 86400` (24 h)
- `generateStaticParams` génère les 100 fiches les plus consultées au build → instant load.
- Les autres fiches sont générées on-demand lors du premier hit, puis cachées.
- Bénéfice quota : ~95 % des requêtes servies depuis le cache Vercel, pas Supabase.

---

## 6. Sécurité — uniquement gratuit

### 6.1 Rate limiting (middleware Next.js)

```ts
// lib/ratelimit.ts
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, max = 30, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }
  if (bucket.count >= max) return { ok: false, retryAfter: bucket.resetAt - now };
  bucket.count++;
  return { ok: true, remaining: max - bucket.count };
}
```

> ⚠️ Limitation : in-memory ne tient pas entre instances Vercel multiples. Pour le free tier mono-région c'est suffisant. Si on dépasse, on pourra plus tard utiliser une **table Postgres** comme rate-limiter (toujours gratuit).

### 6.2 hCaptcha (gratuit, illimité pour usage non-commercial)

- Site key + secret key obtenus sur hcaptcha.com (compte gratuit).
- Composant invisible déclenché si suspicion (IP avec >20 req/min, User-Agent absent, etc.).
- Vérification serveur via `siteverify` API.

### 6.3 Honeypots

- Champ `<input name="email_confirm" tabindex="-1" style="position:absolute;left:-9999px">` dans le HTML.
- Si rempli au submit → l'IP est blacklistée 24 h en mémoire.
- Lien `<a href="/admin-bot-trap" rel="nofollow" style="display:none">` → toute IP qui le suit est blacklistée.

### 6.4 robots.txt strict

```
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: *
Disallow: /
```

### 6.5 Headers HTTP de sécurité (next.config.ts)

```ts
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' https://*.supabase.co data:; script-src 'self' 'unsafe-inline' https://js.hcaptcha.com; ..." }
]
```

### 6.6 Obfuscation HTML

- Tailwind JIT en production = classes hashées (`.x9d8a2`) → moins lisible pour un scraper.
- Pas de JSON-LD massif côté client (uniquement les microdata SEO essentielles).
- Pas d'API REST publique.

### 6.7 Images : URLs signées courtes

- Les images Supabase Storage sont accessibles uniquement via URLs signées (1 h de validité).
- Le composant `next/image` les régénère à chaque page render → pas de hotlink possible.

### 6.8 Watermark invisible (bonus)

- À chaque rendu de fiche : injecter un caractère Unicode invisible (`​`, `﻿`) pseudo-aléatoire dépendant de l'IP hashée.
- Si le contenu est retrouvé copié ailleurs → on peut tracer la fuite.

---

## 7. Estimation des quotas free tier

| Quota | Limite | Estimation usage | Marge |
|---|---|---|---|
| Supabase DB size | 500 MB | ~80 MB | ✅ x6 |
| Supabase Storage | 1 GB | ~900 MB (50k images WebP 18 KB) | ⚠️ serré |
| Supabase Bandwidth | 5 GB/mois | dépend du trafic, ISR aide | ⚠️ surveillance |
| Supabase Auth users | 50 000 MAU | 0 (pas d'auth) | ✅ |
| Supabase API requests | illimité (rate limited) | OK | ✅ |
| Vercel Bandwidth | 100 GB/mois | ~10 GB pour 100k visites | ✅ |
| Vercel Function invocations | 100 GB-Hr | ISR limite l'usage | ✅ |
| Vercel Build minutes | 6 000 min/mois | quelques minutes par push | ✅ |

**Si on s'approche du quota Supabase Storage** → réduire de 20 à 10 produits affichés par ingrédient ou augmenter compression WebP.

---

## 8. Roadmap phasée

| Phase | Durée | Output |
|---|---|---|
| **A — Infra** | 2 h | Schéma `cosme_check` créé, 15 722 lignes de base chargées |
| **B — Scraping** | 1 j dev + 18 h exécution | Toutes les fiches détaillées + produits + images |
| **C — Site Next.js** | 2 j | Page d'accueil + fiche ingrédient + autocomplete fonctionnels |
| **D — Sécurité** | ½ j | Rate limit + hCaptcha + honeypots + robots.txt |
| **E — Déploiement** | 2 h | Site en production sur Vercel |

**Total : ~5 jours de dev** pour un MVP complet.

---

## 9. Décisions à acter avec l'utilisateur

1. **Domaine custom ?** (cosme_check.com / cosme_check.fr / sous-domaine Vercel par défaut ?)
2. **Identifiants Supabase** : à coller dans `.env.local` quand prêt.
3. **Ordre des produits** sur les fiches ingrédient : par score décroissant ou par marque alphabétique ?
4. **Volume de produits par fiche** : 10 ou 20 ? Affecte le quota storage.
5. **Mentions légales** : qui est l'éditeur, contact, RGPD (sera à rédiger).
