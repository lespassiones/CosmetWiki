# QA Ingrédients & Produits — Cosme Check

Tu es un expert en qualité de données cosmétiques et en SQL Supabase. Tu vas réaliser un audit de cohérence complet sur les tables `cosme_check.ingredients` et `cosme_check.product_inci_cache`.

**Stack DB** : PostgreSQL via Supabase MCP (`execute_sql`). Schema principal : `cosme_check`.

---

## Instructions d'exécution

Lance les 6 audits dans l'ordre. Pour chaque problème trouvé, produis :
- **SQL utilisé** : la requête exacte
- **Résultat** : nombre de lignes + exemples (max 10 lignes)
- **Sévérité** : 🔴 Bloquant / 🟡 Dégradé / 🟢 Cosmétique
- **Action recommandée** : SQL de correction ou procédure manuelle

---

## AUDIT 1 — Complétude des ingrédients (`ingredients`)

### 1.1 — Champs critiques manquants

```sql
SELECT
  COUNT(*) FILTER (WHERE color_rating IS NULL OR color_rating = '') AS sans_notation,
  COUNT(*) FILTER (WHERE functions IS NULL OR functions = '[]'::jsonb) AS sans_fonctions,
  COUNT(*) FILTER (WHERE tags IS NULL OR tags = '{}') AS sans_tags,
  COUNT(*) FILTER (WHERE description IS NULL OR description = '') AS sans_description,
  COUNT(*) FILTER (WHERE translations IS NULL OR translations = '{}'::jsonb) AS sans_traductions,
  COUNT(*) FILTER (WHERE origin IS NULL OR origin = '') AS sans_origine,
  COUNT(*) FILTER (WHERE details_scraped = false) AS details_non_scrapes,
  COUNT(*) AS total
FROM cosme_check.ingredients;
```

### 1.2 — Ingrédients sans notation ET très répandus (impact élevé)

```sql
SELECT id, name, slug, prevalence_pct, details_scraped
FROM cosme_check.ingredients
WHERE (color_rating IS NULL OR color_rating = '')
  AND prevalence_pct IS NOT NULL
ORDER BY prevalence_pct DESC
LIMIT 20;
```

### 1.3 — Ingrédients sans fonctions ET très répandus

```sql
SELECT id, name, slug, prevalence_pct, color_rating
FROM cosme_check.ingredients
WHERE (functions IS NULL OR functions = '[]'::jsonb)
  AND prevalence_pct IS NOT NULL
ORDER BY prevalence_pct DESC
LIMIT 20;
```

### 1.4 — Ingrédients sans traduction française

```sql
SELECT id, name, slug, prevalence_pct
FROM cosme_check.ingredients
WHERE translations IS NULL
   OR translations->>'fr' IS NULL
   OR translations->>'fr' = ''
ORDER BY prevalence_pct DESC NULLS LAST
LIMIT 20;
```

### 1.5 — `details_scraped = false` avec forte prévalence (scraping incomplet)

```sql
SELECT id, name, slug, prevalence_pct, color_rating
FROM cosme_check.ingredients
WHERE details_scraped = false
  AND prevalence_pct > 5
ORDER BY prevalence_pct DESC;
```

---

## AUDIT 2 — Cohérence des valeurs (`ingredients`)

### 2.1 — Valeurs invalides dans `color_rating`

```sql
SELECT color_rating, COUNT(*) AS nb
FROM cosme_check.ingredients
GROUP BY color_rating
ORDER BY nb DESC;
-- Valeurs valides uniquement : 'Vert', 'Jaune', 'Orange', 'Rouge'
-- Tout autre valeur (NULL, vide, typo) est un bug.
```

### 2.2 — Doublons sur `slug`

```sql
SELECT slug, COUNT(*) AS nb, array_agg(id) AS ids, array_agg(name) AS names
FROM cosme_check.ingredients
GROUP BY slug
HAVING COUNT(*) > 1
ORDER BY nb DESC;
```

### 2.3 — Doublons sur `inci_id`

```sql
SELECT inci_id, COUNT(*) AS nb, array_agg(id) AS ids, array_agg(name) AS names
FROM cosme_check.ingredients
WHERE inci_id IS NOT NULL
GROUP BY inci_id
HAVING COUNT(*) > 1
ORDER BY nb DESC;
```

### 2.4 — Doublons sur `name` (même nom INCI, entrées différentes)

```sql
SELECT UPPER(TRIM(name)) AS name_norm, COUNT(*) AS nb, array_agg(id) AS ids, array_agg(slug) AS slugs
FROM cosme_check.ingredients
GROUP BY UPPER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY nb DESC;
```

### 2.5 — Contradictions tags vs color_rating

Les ingrédients tagués "cmr" devraient être au minimum "Orange". Ceux tagués "paraben" ou "allergene-reglemente" devraient être "Orange" ou "Rouge".

```sql
-- CMR tagués "Vert" ou "Jaune" : contradiction réglementaire
SELECT id, name, slug, color_rating, tags
FROM cosme_check.ingredients
WHERE 'cmr' = ANY(tags)
  AND color_rating IN ('Vert', 'Jaune')
ORDER BY name;
```

```sql
-- Parabènes tagués "Vert" (devrait être au moins "Orange")
SELECT id, name, slug, color_rating, tags
FROM cosme_check.ingredients
WHERE 'paraben' = ANY(tags)
  AND color_rating = 'Vert'
ORDER BY name;
```

```sql
-- Allergènes réglementés tagués "Vert"
SELECT id, name, slug, color_rating, tags
FROM cosme_check.ingredients
WHERE 'allergene-reglemente' = ANY(tags)
  AND color_rating = 'Vert'
ORDER BY name;
```

### 2.6 — Tags manquants par pattern de nom (couverture des regex de migration 0010)

```sql
-- Parabènes non tagués (nom contient "paraben" mais pas dans tags)
SELECT id, name, slug, color_rating, tags
FROM cosme_check.ingredients
WHERE UPPER(name) LIKE '%PARABEN%'
  AND NOT ('paraben' = ANY(COALESCE(tags, '{}')));
```

```sql
-- Sulfates non tagués
SELECT id, name, slug, color_rating, tags
FROM cosme_check.ingredients
WHERE UPPER(name) LIKE '%SULFATE%'
  AND NOT ('sulfate' = ANY(COALESCE(tags, '{}')));
```

```sql
-- Silicones non tagués (terminaisons typiques : -one, -ane, -oxane)
SELECT id, name, slug, color_rating, tags
FROM cosme_check.ingredients
WHERE (UPPER(name) LIKE '%DIMETHICONE%'
   OR UPPER(name) LIKE '%CYCLOMETHICONE%'
   OR UPPER(name) LIKE '%SILOXANE%'
   OR UPPER(name) LIKE '%SILICONE%')
  AND NOT ('silicone' = ANY(COALESCE(tags, '{}')));
```

```sql
-- PEG/PPG (éthoxylés/propoxylés) non tagués
SELECT id, name, slug, color_rating, tags
FROM cosme_check.ingredients
WHERE (UPPER(name) LIKE 'PEG-%'
   OR UPPER(name) LIKE 'PPG-%'
   OR UPPER(name) LIKE '%ETHOXYLAT%'
   OR UPPER(name) LIKE '%-ETH-%')
  AND NOT ('ethoxyle' = ANY(COALESCE(tags, '{}')))
  AND NOT ('propoxyle' = ANY(COALESCE(tags, '{}')));
```

```sql
-- Filtres UV non tagués
SELECT id, name, slug, color_rating, tags
FROM cosme_check.ingredients
WHERE (UPPER(name) LIKE '%BENZOPHENONE%'
   OR UPPER(name) LIKE '%OCTINOXATE%'
   OR UPPER(name) LIKE '%AVOBENZONE%'
   OR UPPER(name) LIKE '%OXYBENZONE%'
   OR UPPER(name) LIKE '%OCTYL METHOXYCINNAMATE%'
   OR UPPER(name) LIKE '%TINOSORB%')
  AND NOT ('filtre-uv' = ANY(COALESCE(tags, '{}')));
```

---

## AUDIT 3 — Qualité des produits (`product_inci_cache`)

### 3.1 — Vue d'ensemble de la qualité

```sql
SELECT
  COUNT(*) AS total_produits,
  COUNT(*) FILTER (WHERE ingredients_text IS NULL OR TRIM(ingredients_text) = '') AS sans_liste_inci,
  COUNT(*) FILTER (WHERE LENGTH(ingredients_text) < 20) AS liste_trop_courte,
  COUNT(*) FILTER (WHERE confidence < 0.5) AS faible_confiance,
  COUNT(*) FILTER (WHERE confidence >= 0.8) AS haute_confiance,
  COUNT(*) FILTER (WHERE votes_wrong > votes_correct AND votes_correct + votes_wrong > 0) AS plus_de_votes_negatifs,
  COUNT(*) FILTER (WHERE brand IS NULL OR TRIM(brand) = '') AS sans_marque,
  COUNT(*) FILTER (WHERE product_name IS NULL OR TRIM(product_name) = '') AS sans_nom,
  COUNT(*) FILTER (WHERE source_url IS NULL OR source_url = '') AS sans_url_source,
  ROUND(AVG(confidence)::numeric, 3) AS confiance_moyenne
FROM cosme_check.product_inci_cache;
```

### 3.2 — Produits avec liste INCI suspecte (trop courte ou vide)

```sql
SELECT id, brand, product_name, source, confidence,
       LENGTH(ingredients_text) AS longueur,
       LEFT(ingredients_text, 100) AS apercu_inci
FROM cosme_check.product_inci_cache
WHERE ingredients_text IS NULL
   OR LENGTH(TRIM(ingredients_text)) < 30
ORDER BY confidence DESC
LIMIT 20;
```

### 3.3 — Produits à faible confiance issus de sources IA (potentiellement halluchinés)

```sql
SELECT id, brand, product_name, source, confidence, votes_correct, votes_wrong,
       LEFT(ingredients_text, 150) AS apercu_inci
FROM cosme_check.product_inci_cache
WHERE source IN ('duckduckgo+mistral', 'openai', 'mistral', 'web-search')
  AND confidence < 0.6
ORDER BY confidence ASC
LIMIT 20;
```

### 3.4 — Produits avec plus de votes négatifs que positifs

```sql
SELECT id, brand, product_name, source, confidence,
       votes_correct, votes_wrong,
       LEFT(ingredients_text, 150) AS apercu_inci
FROM cosme_check.product_inci_cache
WHERE votes_wrong > votes_correct
  AND (votes_correct + votes_wrong) >= 2
ORDER BY votes_wrong DESC;
```

### 3.5 — Doublons de produits (même marque + nom, entrées différentes)

```sql
SELECT
  LOWER(TRIM(brand)) AS brand_norm,
  LOWER(TRIM(product_name)) AS name_norm,
  COUNT(*) AS nb,
  array_agg(id) AS ids,
  array_agg(source) AS sources,
  array_agg(confidence) AS confidences
FROM cosme_check.product_inci_cache
WHERE brand IS NOT NULL AND product_name IS NOT NULL
GROUP BY LOWER(TRIM(brand)), LOWER(TRIM(product_name))
HAVING COUNT(*) > 1
ORDER BY nb DESC
LIMIT 20;
```

### 3.6 — Répartition par source (cartographie de l'origine des données)

```sql
SELECT
  source,
  COUNT(*) AS nb_produits,
  ROUND(AVG(confidence)::numeric, 3) AS confiance_moy,
  ROUND(MIN(confidence)::numeric, 3) AS confiance_min,
  COUNT(*) FILTER (WHERE confidence >= 0.8) AS haute_confiance,
  COUNT(*) FILTER (WHERE confidence < 0.5) AS faible_confiance
FROM cosme_check.product_inci_cache
GROUP BY source
ORDER BY nb_produits DESC;
```

---

## AUDIT 4 — Cohérence des listes INCI dans les produits

### 4.1 — Ingrédients dans les listes produits qui n'existent pas en catalogue

Cette requête extrait les tokens INCI des produits et vérifie leur présence dans `ingredients`.

```sql
WITH inci_tokens AS (
  SELECT
    p.id AS product_id,
    p.brand,
    p.product_name,
    TRIM(UPPER(token)) AS token
  FROM cosme_check.product_inci_cache p,
  LATERAL unnest(
    string_to_array(
      regexp_replace(p.ingredients_text, E'[\\n\\r]+', ', ', 'g'),
      ','
    )
  ) AS token
  WHERE p.ingredients_text IS NOT NULL
    AND LENGTH(p.ingredients_text) > 10
),
unknown_tokens AS (
  SELECT t.token, COUNT(DISTINCT t.product_id) AS nb_produits
  FROM inci_tokens t
  WHERE LENGTH(TRIM(t.token)) > 2
    AND NOT EXISTS (
      SELECT 1 FROM cosme_check.ingredients i
      WHERE UPPER(TRIM(i.name)) = t.token
    )
  GROUP BY t.token
  HAVING COUNT(DISTINCT t.product_id) >= 3
)
SELECT token, nb_produits
FROM unknown_tokens
ORDER BY nb_produits DESC
LIMIT 30;
-- Ces tokens sont présents dans ≥3 produits mais absents du catalogue d'ingrédients.
-- Ce sont des candidats à ajouter ou des alias à mapper.
```

### 4.2 — Produits avec des ingrédients en doublon dans leur liste

```sql
WITH product_tokens AS (
  SELECT
    p.id,
    p.brand,
    p.product_name,
    TRIM(UPPER(token)) AS token,
    COUNT(*) AS occurrences
  FROM cosme_check.product_inci_cache p,
  LATERAL unnest(
    string_to_array(
      regexp_replace(p.ingredients_text, E'[\\n\\r]+', ', ', 'g'),
      ','
    )
  ) AS token
  WHERE p.ingredients_text IS NOT NULL
  GROUP BY p.id, p.brand, p.product_name, TRIM(UPPER(token))
  HAVING COUNT(*) > 1
    AND LENGTH(TRIM(token)) > 2
)
SELECT id, brand, product_name, token, occurrences
FROM product_tokens
ORDER BY occurrences DESC
LIMIT 20;
```

### 4.3 — Produits avec moins de 3 ingrédients (liste probablement tronquée)

```sql
WITH token_counts AS (
  SELECT
    p.id,
    p.brand,
    p.product_name,
    p.source,
    p.confidence,
    COUNT(token) AS nb_ingredients,
    p.ingredients_text
  FROM cosme_check.product_inci_cache p,
  LATERAL unnest(
    string_to_array(
      regexp_replace(p.ingredients_text, E'[\\n\\r]+', ', ', 'g'),
      ','
    )
  ) AS token
  WHERE p.ingredients_text IS NOT NULL
    AND LENGTH(p.ingredients_text) > 5
  GROUP BY p.id, p.brand, p.product_name, p.source, p.confidence, p.ingredients_text
)
SELECT id, brand, product_name, source, confidence, nb_ingredients, ingredients_text
FROM token_counts
WHERE nb_ingredients < 3
ORDER BY nb_ingredients ASC
LIMIT 20;
```

### 4.4 — Produits sans AQUA/WATER comme premier ingrédient (pour les émulsions)

La plupart des crèmes, sérums, lotions ont l'eau en premier. Son absence peut indiquer une liste tronquée ou mal parsée — surtout si la source est IA.

```sql
SELECT id, brand, product_name, source, confidence,
       TRIM(SPLIT_PART(ingredients_text, ',', 1)) AS premier_ingredient,
       LEFT(ingredients_text, 120) AS apercu
FROM cosme_check.product_inci_cache
WHERE source IN ('duckduckgo+mistral', 'openai', 'mistral')
  AND UPPER(TRIM(SPLIT_PART(ingredients_text, ',', 1))) NOT IN ('AQUA', 'WATER', 'EAU')
  AND ingredients_text IS NOT NULL
  AND LENGTH(ingredients_text) > 30
LIMIT 20;
-- NB : certains produits anhydres (huiles, baumes, poudres) n'ont légitimement pas d'eau.
-- Filtre sur sources IA seulement, plus à risque d'hallucination.
```

---

## AUDIT 5 — Couverture du catalogue (ingrédients manquants importants)

### 5.1 — Volume du catalogue et taux de complétion

```sql
SELECT
  COUNT(*) AS total_ingredients,
  COUNT(*) FILTER (WHERE details_scraped = true) AS scrapes_complets,
  COUNT(*) FILTER (WHERE color_rating IS NOT NULL AND color_rating != '') AS avec_notation,
  COUNT(*) FILTER (WHERE functions IS NOT NULL AND functions != '[]'::jsonb) AS avec_fonctions,
  COUNT(*) FILTER (WHERE tags IS NOT NULL AND array_length(tags, 1) > 0) AS avec_tags,
  COUNT(*) FILTER (WHERE prevalence_pct IS NOT NULL) AS avec_prevalence,
  COUNT(*) FILTER (WHERE cas_number IS NOT NULL) AS avec_cas,
  ROUND(100.0 * COUNT(*) FILTER (WHERE color_rating IS NOT NULL AND color_rating != '') / COUNT(*)::numeric, 1) AS pct_notes,
  ROUND(100.0 * COUNT(*) FILTER (WHERE details_scraped = true) / COUNT(*)::numeric, 1) AS pct_scrapes
FROM cosme_check.ingredients;
```

### 5.2 — Distribution des notations

```sql
SELECT
  COALESCE(color_rating, '(NULL)') AS notation,
  COUNT(*) AS nb,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER ()::numeric, 1) AS pct
FROM cosme_check.ingredients
GROUP BY color_rating
ORDER BY nb DESC;
```

### 5.3 — Distribution des tags (popularité de chaque tag)

```sql
SELECT
  tag,
  COUNT(*) AS nb_ingredients
FROM cosme_check.ingredients, LATERAL unnest(tags) AS tag
GROUP BY tag
ORDER BY nb_ingredients DESC;
```

### 5.4 — Ingrédients qui apparaissent dans les listes produits mais absents du catalogue (top 50)

```sql
WITH all_tokens AS (
  SELECT TRIM(UPPER(token)) AS token
  FROM cosme_check.product_inci_cache,
  LATERAL unnest(
    string_to_array(
      regexp_replace(ingredients_text, E'[\\n\\r]+', ', ', 'g'),
      ','
    )
  ) AS token
  WHERE ingredients_text IS NOT NULL
    AND LENGTH(ingredients_text) > 10
)
SELECT
  token,
  COUNT(*) AS nb_occurrences
FROM all_tokens
WHERE LENGTH(TRIM(token)) > 2
  AND NOT EXISTS (
    SELECT 1 FROM cosme_check.ingredients i
    WHERE UPPER(TRIM(i.name)) = token
  )
GROUP BY token
ORDER BY nb_occurrences DESC
LIMIT 50;
```

---

## AUDIT 6 — Vieillissement du cache produits

### 6.1 — Produits non mis à jour depuis longtemps

```sql
SELECT
  COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '6 months') AS plus_de_6_mois,
  COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '1 year') AS plus_d_un_an,
  COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '2 years') AS plus_de_2_ans,
  MIN(updated_at) AS plus_ancienne_entree,
  MAX(updated_at) AS plus_recente_entree,
  COUNT(*) AS total
FROM cosme_check.product_inci_cache;
```

### 6.2 — Produits anciens à faible confiance (prioritaires pour re-scraping)

```sql
SELECT id, brand, product_name, source, confidence,
       updated_at,
       NOW() - updated_at AS age,
       LEFT(ingredients_text, 100) AS apercu_inci
FROM cosme_check.product_inci_cache
WHERE confidence < 0.7
  AND updated_at < NOW() - INTERVAL '6 months'
ORDER BY confidence ASC, updated_at ASC
LIMIT 20;
```

### 6.3 — Produits non validés par la communauté (0 votes, source IA)

```sql
SELECT id, brand, product_name, source, confidence, created_at
FROM cosme_check.product_inci_cache
WHERE (votes_correct + votes_wrong) = 0
  AND source IN ('duckduckgo+mistral', 'openai', 'mistral', 'web-search')
  AND confidence < 0.75
ORDER BY confidence ASC
LIMIT 20;
```

---

## RAPPORT FINAL

Génère les 4 sections suivantes :

### 1. Tableau de synthèse global

| Dimension | Score | Nb problèmes critiques | Nb problèmes mineurs |
|-----------|-------|------------------------|----------------------|
| Complétude ingrédients (champs manquants) | 🟢/🟡/🔴 | X | X |
| Cohérence ingrédients (valeurs invalides, doublons, tags) | 🟢/🟡/🔴 | X | X |
| Qualité produits (cache INCI) | 🟢/🟡/🔴 | X | X |
| Cohérence listes INCI vs catalogue | 🟢/🟡/🔴 | X | X |
| Couverture du catalogue | 🟢/🟡/🔴 | X | X |
| Fraîcheur du cache produits | 🟢/🟡/🔴 | X | X |

### 2. Top 5 actions prioritaires avant release

Pour chaque action :
- La table et les IDs concernés
- Le SQL de correction exact (UPDATE, DELETE, INSERT) — avec un `BEGIN; ... ROLLBACK;` si destructif
- L'impact utilisateur si non corrigé

### 3. Ingrédients manquants à ajouter en priorité

Liste les 10 ingrédients les plus fréquents dans les listes produits qui sont absents du catalogue. Ce sont les plus susceptibles d'apparaître dans les analyses utilisateur avec une correspondance manquante.

### 4. Produits à supprimer ou re-scraper

Liste les produits du cache qui combinent : faible confiance + source IA + ancienneté > 6 mois + votes négatifs. Ce sont les données les plus susceptibles de tromper les utilisateurs.
