-- ============================================================
-- 20260609 : trier la recherche par score décroissant en premier
-- ============================================================
-- Alignement mobile/web : ORDER BY score DESC NULLS LAST, puis
-- word_similarity comme critère secondaire de pertinence textuelle.
-- Avant : word_similarity DESC, score DESC
--   → les meilleures correspondances textuelles remontaient en tête
--     même si leur score était mauvais.
-- Après : score DESC NULLS LAST, word_similarity DESC
--   → les meilleurs produits (meilleure formule) remontent en tête
--     parmi les résultats textuellement pertinents.
-- ============================================================

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
    AND c.count_total >= 5
  ORDER BY
    c.score DESC NULLS LAST,
    word_similarity(p_query, COALESCE(c.brand, '') || ' ' || c.name) DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION cosme_check_search_catalog(TEXT, INT)
  TO anon, authenticated;
