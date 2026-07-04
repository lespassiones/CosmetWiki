# Cosme Check - État du projet

> **Dernière mise à jour :** 2026-05-08
> **Stack imposée :** Next.js + Supabase (free tier) + Vercel (free tier)
> **Contraintes fortes :** zéro service payant, light mode uniquement, base Supabase partagée → schéma isolé `cosme_check`

---

## 1. Vision

**Cosme Check** est une application qui décode les cosmétiques pour une beauté consciente :

- **Page d'accueil minimaliste** : une barre de recherche, c'est tout.
- **Autocomplétion ultra-rapide** : on tape "MEA", la liste filtre en temps réel.
- **Fiche ingrédient riche** : description, classification couleur (vert/jaune/orange/rouge), N° CAS, fonctions, prévalence dans les cosmétiques, **produits réels qui en contiennent** (avec images).
- **Source des données** : base d'ingrédients propriétaire (15 722 ingrédients indexés).
- **Aucune connexion utilisateur requise** - consultation publique.

---

## 2. Ce qui a été fait ✅

### 2.1 Constitution de la base initiale (phase 1)

L'index initial a été constitué et extrait pour chaque ingrédient :

- Nom INCI (ex : `ACID BLUE 74 ALUMINUM LAKE`)
- Couleur de classification (`Vert`, `Jaune`, `Orange`, `Rouge`)
- Lettre d'index
- Traduction (souvent vide à ce stade)

**Résultat :** **15 722 ingrédients uniques** dont :

| Couleur | Nombre |
|---|---|
| Vert | 11 069 |
| Jaune | 1 458 |
| Orange | 2 801 |
| Rouge | 394 |

### 2.2 Génération de fichiers de référence

Fichiers de référence générés à partir de la base initiale (Excel multi-feuilles + PDF imprimable, aujourd'hui archivés).

### 2.3 Analyse du fichier de veille concurrentielle

[data/reference/Prix concurrents.xlsx](data/reference/Prix concurrents.xlsx) - fichier existant fourni par l'utilisateur. Analyse réalisée :

- **Feuil1** : 50+ produits capillaires afro/textures bouclées (EVASHAIR, KALIA, OLAFRO, WAAM, MANGO BUTTERFULL, etc.) avec prix, volume, coût ramené à 200 mL, ingrédients problématiques.
- **Feuil2** : TCD basique (moyenne du coût/200 mL par type de produit).
- **Feuil3** : liste manuelle d'ingrédients orange/rouge à surveiller.
- **Feuil4** : liste alphabétique des ingrédients INCI avec hyperliens (inspiration directe pour le format hyperlink des Excel générés).

→ Conclusion : ce fichier est un **outil de veille concurrentielle** que l'utilisateur enrichit à la main. Hors périmètre direct de Cosme Check mais pourra plus tard servir de base pour une fonctionnalité "comparateur de produits".

### 2.4 Décisions de stack et de contraintes

Voir [docs/cahier-des-charges.md](docs/cahier-des-charges.md) pour le détail. Décisions clés :

- ✅ **Next.js 15** (App Router) hébergé sur **Vercel free tier**
- ✅ **Supabase free tier** (DB partagée avec une autre app → schéma PostgreSQL isolé `cosme_check`)
- ✅ **Stockage images** : Supabase Storage avec optimisation WebP agressive
- ✅ **Recherche** : full-text PostgreSQL natif (`pg_trgm` + `tsvector`) - pas d'Algolia
- ✅ **Anti-bot** : middleware Next.js + hCaptcha (free) + honeypots + robots.txt strict
- ❌ **Refusé** : Cloudflare, Algolia, tout SaaS payant

---

## 3. Ce qui reste à faire ⏳

### Phase A - Infrastructure base ✅ FAIT

- [x] **A.1** Identifiants Supabase dans `.env`.
- [x] **A.2** Schéma PostgreSQL isolé `cosme_check` créé (extensions `pg_trgm`, `unaccent` activées).
- [x] **A.3** Migrations SQL appliquées : tables `ingredients`, `products`, `product_ingredients`, `search_log` + index full-text + RPCs.
- [x] **A.4** Les 15 722 ingrédients chargés (15 s d'exécution, via `scripts/load_ingredients_to_supabase.py`).

### Phase B - Scraping détaillé ⏳ EN ATTENTE D'EXÉCUTION

> Le script est écrit et fonctionnel - il reste à le lancer pour enrichir les ingrédients.

- [x] **B.1** `scripts/scrape_ingredient_details.py` écrit (politesse, retry, parallélisme 4 workers, checkpoint via flag `details_scraped` en BDD, mode `--debug-url`).
- [x] **B.2** Extraction fusionnée (détails ingrédient + produits + composition) dans le même script.
- [x] **B.3** Images en **hotlink direct** vers la source d'origine (décision MVP : pas de Supabase Storage pour rester sous 1 GB).
- [x] **B.4** RPC `cosme_check_pending_ingredients` pour ne traiter que ce qui n'est pas encore scrapé.

**À exécuter par l'utilisateur :**
```bash
python scripts/scrape_ingredient_details.py --limit 200    # première vague
python scripts/scrape_ingredient_details.py                # tout (4-12h)
```

### Phase C - Site Next.js ✅ FAIT

- [x] **C.1** Next.js 15.5 + App Router + TypeScript à la racine.
- [x] **C.2** `@supabase/supabase-js` + Tailwind CSS 3.4.
- [x] **C.3** Page d'accueil `/` : logo, barre de recherche centrée, suggestions populaires, légende des couleurs, footer.
- [x] **C.4** Composant `SearchBar` : autocomplete avec debounce 150 ms, navigation clavier, highlight, honeypot, RPC `cosme_check_search`.
- [x] **C.5** Page `/i/[slug]` : hero gradient par couleur, description, fonctions INCI, classification, prévalence, breakdown par catégorie, grille de produits, traductions, ISR 24 h.
- [x] **C.6** Light mode strict (palette `#FAFAFA`, fond blanc pour les cartes, accents par rating).
- [x] **C.7** Page `/search` (résultats étendus), `/about`, `/robots.txt`, page 404 stylée.

### Phase D - Sécurité ✅ FAIT (sans hCaptcha pour l'instant)

- [x] **D.1** Rate limiting in-memory (`lib/ratelimit.ts`, 30 req/min/IP) sur `/api/search`.
- [ ] **D.2** hCaptcha - non activé, à brancher quand l'utilisateur aura les clés.
- [x] **D.3** Honeypot `email_confirm` dans `SearchBar` → blacklist 24 h.
- [x] **D.4** `robots.txt` strict (Googlebot/Bingbot/DuckDuckBot OK, IA scrapers bloqués).
- [x] **D.5** Tailwind JIT en production = classes hashées (anti-scraping passif).
- [x] **D.6** Headers HTTP (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`).
- [x] **D.7** Middleware filtre les User-Agents suspects sur `/api/` + traps `/admin-bot-trap`, `/wp-admin`, `/wp-login.php`.
- [x] **D.8** RLS activée sur toutes les tables, RPCs admin restreintes à `service_role`.

### Phase E - Déploiement ⏳ À FAIRE

- [ ] **E.1** Premier `git push` initial.
- [ ] **E.2** Connexion du repo à Vercel + import des 3 variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- [ ] **E.3** Déploiement de production.
- [ ] **E.4** Domaine custom (à choisir).
- [ ] **E.5** Vérification quotas Supabase + Vercel après 1 semaine.

---

## 4. Estimations volumes & quotas

| Ressource | Estimation | Free tier limite | OK ? |
|---|---|---|---|
| Lignes table `ingredients` | 15 722 | - | ✅ |
| Lignes table `products` | ~50 000 (20 × 15k / déduplication) | - | ✅ |
| **Taille DB** | ~80 MB | 500 MB Supabase | ✅ marge x6 |
| **Storage images** | ~50 000 × 18 KB ≈ **900 MB** | 1 GB Supabase | ⚠️ serré → optimiser ou limiter à 10 produits/ingrédient |
| **Bandwidth Supabase** | 5 GB/mois | 5 GB | ⚠️ surveillance requise → cache Vercel agressif |
| **Bandwidth Vercel** | < 100 GB/mois (estimation modeste) | 100 GB | ✅ |
| **Function invocations Vercel** | ISR cache 24 h sur fiches → < 100 k/mois | - | ✅ |

**Stratégies d'optimisation pour rester gratuit :**

1. **ISR (Incremental Static Regeneration)** sur toutes les fiches ingrédient : revalidation 24 h → la majorité des requêtes sont servies depuis le cache Vercel, pas depuis Supabase.
2. **Images servies via le CDN Vercel** (next/image) plutôt qu'en direct depuis Supabase Storage.
3. **Limiter à 10 produits affichés par ingrédient** (au lieu de 20) si on approche la limite storage.
4. **Conversion WebP qualité 75** pour les thumbnails produits (gain ~70 % vs JPEG).

---

## 5. Structure du repo

```
Cosme Check/
├── .env.example              ← variables d'environnement (template)
├── .gitignore
├── README.md
├── PROJECT_STATUS.md         ← ce fichier
├── docs/
│   ├── cahier-des-charges.md ← spec technique complète
│   └── decisions.md          ← (à venir) ADRs
├── data/                     ← données de référence
│   └── reference/
│       └── Prix concurrents.xlsx
├── scripts/                  ← pipeline ETL Python (indépendant du site)
│   └── (scripts internes)
└── (web/ - site Next.js, à venir en phase C)
```

---

## 6. Prochaine étape immédiate

Le MVP est en place. L'utilisateur peut lancer `npm run dev` et utiliser l'application dès maintenant.

Étapes optionnelles à enchaîner quand voulu :

1. **Enrichir les fiches** :
   ```bash
   python scripts/scrape_ingredient_details.py --limit 100   # tester sur 100
   python scripts/scrape_ingredient_details.py               # tout (4-12 h)
   ```
2. **Déployer sur Vercel** : `git push` + import du repo + ajout des 3 variables d'environnement.
3. **(Optionnel) hCaptcha** : créer un compte gratuit, ajouter les clés, brancher dans `SearchBar`.
