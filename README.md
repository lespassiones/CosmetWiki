# Cosme Check

Application qui décode les cosmétiques : composition, promesses marketing, ingrédients clefs. **15 722 ingrédients** indexés, classés par tolérance (vert / jaune / orange / rouge), avec autocomplete fuzzy et fiches détaillées.

> **Stack** : Next.js 15 + React 19 + Tailwind CSS 3 + Supabase free tier.
> **Aucun service payant.** Light mode strict.

## Démarrage rapide

```bash
npm install
npm run dev
```

Le site démarre sur http://localhost:3000. L'application est immédiatement opérationnelle sur les 15 722 ingrédients déjà chargés dans Supabase.

## Variables d'environnement

Le fichier `.env` contient les identifiants Supabase :

| Clé | Rôle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de l'API Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique (lecture seule via RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé secrète, **côté serveur uniquement**. Utilisée par les scripts Python |

## Architecture

```
Cosme Check/
├── app/                              ← Next.js App Router
│   ├── layout.tsx                    ← layout global, light mode forcé
│   ├── page.tsx                      ← page d'accueil (SearchBar centrée)
│   ├── globals.css
│   ├── about/page.tsx                ← page "À propos"
│   ├── search/page.tsx               ← liste de résultats étendue
│   ├── i/[slug]/page.tsx             ← fiche ingrédient (ISR 24h)
│   ├── api/search/route.ts           ← endpoint autocomplete (rate limited)
│   ├── robots.txt/route.ts           ← robots.txt strict
│   └── not-found.tsx                 ← 404 stylée
├── components/
│   ├── SearchBar.tsx                 ← input + dropdown avec debounce 150ms
│   ├── ColorBadge.tsx                ← badge de classification
│   └── Logo.tsx
├── lib/
│   ├── supabase.ts                   ← clients (anon, service) + types TS
│   ├── ratelimit.ts                  ← rate-limit in-memory + blacklist
│   └── colors.ts                     ← palette + classes Tailwind par rating
├── middleware.ts                     ← filtre UA + bot traps
├── scripts/                          ← pipeline Python (indépendant du site)
│   └── (scripts ETL internes)
├── data/
│   └── reference/
└── docs/cahier-des-charges.md        ← spec complète
```

## Pipeline de données

Le scraping est **séparé** du site. Quatre phases :

1. **Phase 1 - index alphabétique** ✅ (15 722 ingrédients en JSON).
2. **Phase 2 - chargement Supabase** ✅ (table `cosme_check.ingredients` peuplée).
3. **Phase 3 - enrichissement détaillé** ⏳ (CAS, fonctions, prévalence, produits scrapés progressivement).
4. **Phase 4 - auto-hébergement images** ✅ activé : chaque image produit est convertie en WebP (≈ 4-15 KB) et uploadée dans le bucket Supabase Storage `cosmetwiki-products`. Le site **n'a plus aucune dépendance** externe pour ses ressources.

**Performances mesurées (enrichissement détaillé) :**
- ~1.65 s/ingrédient avec téléchargement+conversion+upload d'images (4 workers, délai poli 0.5-1.5 s)
- ~0.6 s/ingrédient sans images (`--no-images`)
- Reprise automatique via le flag `details_scraped` en BDD
- ~4.5 KB par image WebP (max 360 px de large, qualité 72)

**Estimation pour les 15 622 ingrédients restants :**
- Avec images : ~7 h
- Sans images : ~2 h 30
- Storage estimé : 75 000 images × 4.5 KB ≈ **~330 MB** (1 GB free tier ✅)

## Schéma Supabase

Toutes les données vivent dans le schéma isolé **`cosme_check`** (la base est partagée avec une autre app, le schéma `public` n'est pas touché).

| Table | Rôle |
|---|---|
| `cosme_check.ingredients` | 15 722 ingrédients INCI, full-text + trigram |
| `cosme_check.products` | produits scrapés (avec `image_url` en hotlink) |
| `cosme_check.product_ingredients` | jonction produits ↔ ingrédients |
| `cosme_check.search_log` | log anonyme des recherches (service_role only) |

Le client web ne tape pas directement les tables : il appelle des **fonctions RPC** définies dans `public` en `SECURITY DEFINER` :

| RPC | Rôle | Accès |
|---|---|---|
| `cosme_check_search(q, result_limit)` | autocomplete fuzzy (trigram + tsvector) | anon |
| `cosme_check_get_ingredient(slug)` | fiche complète | anon |
| `cosme_check_products_for_ingredient(id, limit)` | produits associés | anon |
| `cosme_check_popular_suggestions(limit)` | suggestions home | anon |
| `cosme_check_pending_ingredients(limit)` | liste à enrichir | service_role only |
| `cosme_check_upsert_ingredients(rows)` | upsert batch ingrédients | service_role only |
| `cosme_check_upsert_products(rows)` | upsert batch produits + composition | service_role only |

## Sécurité

| Couche | Implémentation |
|---|---|
| **RLS** | toutes les tables ont `ENABLE ROW LEVEL SECURITY`, policy `SELECT` pour anon, écriture service_role uniquement |
| **Rate limit** | 30 req/min/IP en mémoire, sur `/api/search` (`lib/ratelimit.ts`) |
| **Honeypot** | champ `email_confirm` masqué dans la SearchBar → IP blacklistée 24 h si rempli |
| **Bot traps** | URLs piégées (`/admin-bot-trap`, `/wp-admin`, `/wp-login.php`) → 404 + log |
| **UA filter** | middleware bloque `curl`, `python-requests`, `GPTBot`, `ClaudeBot`, etc. sur `/api/` |
| **robots.txt** | Googlebot/Bingbot/DuckDuckBot autorisés, IA scrapers (`GPTBot`, `ClaudeBot`, `CCBot`, `Bytespider`) bannis |
| **Headers** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimale |
| **ISR** | fiches mises en cache 24 h côté Vercel → ~95 % des hits ne tapent pas Supabase |

> hCaptcha n'est **pas activé** dans cette première version pour ne pas bloquer le démarrage. Pour l'ajouter plus tard : créer un compte gratuit sur hcaptcha.com, ajouter `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` et `HCAPTCHA_SECRET_KEY` au `.env`, intégrer dans `SearchBar`.

## UX & design

- **Light mode strict** (`prefers-color-scheme: dark` est ignoré).
- Police **Inter** (Google Fonts).
- Palette par rating : vert / jaune / orange / rouge avec versions `soft` et `ink`.
- Animations subtiles (`fade-in`, `slide-down`).
- Responsive mobile-first.
- Recherche fuzzy : trouve `glycerin` en tapant `glicerine`, `glycérol`, `56-81-5` (CAS).

## Quotas & limites

| Quota | Free tier | Estimation | Marge |
|---|---|---|---|
| Supabase DB | 500 MB | ~80 MB après enrichissement complet | ✅ x6 |
| Supabase Bandwidth | 5 GB/mois | dépend du trafic ; ISR aide | ⚠️ surveiller |
| Vercel Bandwidth | 100 GB/mois | ~10 GB pour 100 visites/jour | ✅ |
| Storage Supabase | 1 GB | ~330 MB une fois toutes les images téléchargées (75 000 × ~4.5 KB WebP) | ✅ marge x3 |

## Scripts npm

| Commande | Effet |
|---|---|
| `npm run dev` | dev server sur http://localhost:3000 |
| `npm run build` | build de production |
| `npm run start` | serve le build |

## État du projet

Voir [PROJECT_STATUS.md](PROJECT_STATUS.md) pour la roadmap complète et l'historique des décisions.
