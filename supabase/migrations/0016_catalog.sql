-- ============================================================
-- 0016 : catalogue produits indexé pour la recherche
-- ============================================================
-- Peuplé par 61_upload_catalog.py depuis SQLite (products + product_analyses).
-- Remplace l'appel OBF en production : on lit ici en premier, OBF en fallback.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS cosme_check.catalog (
  ean              TEXT    PRIMARY KEY,
  brand            TEXT,
  name             TEXT    NOT NULL,
  category         TEXT,
  image_url        TEXT,
  source_url       TEXT,
  score            REAL    NOT NULL,
  score_label      TEXT    NOT NULL,
  score_tone       TEXT    NOT NULL,
  count_total      INT,
  ingredients_text TEXT
);

-- Index trigram sur brand + name — meilleur que ILIKE brut pour les requêtes
-- partielles du type "cerm" → "crème", "roch" → "La Roche-Posay".
CREATE INDEX IF NOT EXISTS catalog_search_trgm
  ON cosme_check.catalog
  USING GIN ((COALESCE(brand, '') || ' ' || name) gin_trgm_ops);

-- Index score décroissant — ORDER BY score DESC sur les résultats.
CREATE INDEX IF NOT EXISTS catalog_score_idx
  ON cosme_check.catalog (score DESC);

ALTER TABLE cosme_check.catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_select"
  ON cosme_check.catalog FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── RPC : recherche catalog ──────────────────────────────────────────────────
-- Retourne les candidats triés par pertinence (similarité trigram + score).
-- Callable anon — pas d'auth requise pour la recherche.
CREATE OR REPLACE FUNCTION cosme_check_search_catalog(
  p_query TEXT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  ean              TEXT,
  brand            TEXT,
  name             TEXT,
  category         TEXT,
  image_url        TEXT,
  source_url       TEXT,
  score            REAL,
  score_label      TEXT,
  score_tone       TEXT,
  count_total      INT,
  ingredients_text TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = cosme_check, public
AS $$
  SELECT
    c.ean, c.brand, c.name, c.category,
    c.image_url, c.source_url,
    c.score, c.score_label, c.score_tone,
    c.count_total, c.ingredients_text
  FROM cosme_check.catalog c
  WHERE
    (COALESCE(c.brand, '') || ' ' || c.name)
      ILIKE '%' || p_query || '%'
  ORDER BY
    word_similarity(p_query, COALESCE(c.brand, '') || ' ' || c.name) DESC,
    c.score DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION cosme_check_search_catalog(TEXT, INT)
  TO anon, authenticated;
