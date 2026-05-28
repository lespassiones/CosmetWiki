-- ============================================================
-- 20260528 : masquer les produits du catalogue sous-enrichis
-- ============================================================
-- Les produits avec count_total < 5 ingrédients sont incomplets
-- (parsing INCI partiel lors du seed). On les cache au niveau des
-- RPC publiques le temps de les enrichir. Données conservées en
-- base : reverse possible en supprimant les WHERE c.count_total >= 5.
--
-- Comportement attendu côté app :
--   - recherche / autocomplete : ne renvoie plus les < 5
--   - browse par sous-catégorie : ne renvoie plus les < 5
--   - compteurs de catégorie : ne comptent plus les < 5
--   - si l'utilisateur tape un nom de produit < 5, miss en base
--     → fallback OpenAI web search prend le relais

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
    word_similarity(p_query, COALESCE(c.brand, '') || ' ' || c.name) DESC,
    c.score DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION cosme_check_search_catalog(TEXT, INT)
  TO anon, authenticated;


CREATE OR REPLACE FUNCTION cosme_check_browse_subcategory(
  p_subcategory TEXT,
  p_limit       INT DEFAULT 24,
  p_offset      INT DEFAULT 0
)
RETURNS TABLE (
  ean             TEXT,
  brand           TEXT,
  name            TEXT,
  image_url       TEXT,
  score           FLOAT,
  score_label     TEXT,
  score_tone      TEXT,
  ingredients_text TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    c.ean,
    c.brand,
    c.name,
    c.image_url,
    c.score,
    c.score_label,
    c.score_tone,
    c.ingredients_text
  FROM cosme_check.product_classifications pc
  JOIN cosme_check.catalog c ON c.ean = pc.ean
  WHERE pc.subcategory = p_subcategory
    AND c.count_total >= 5
  ORDER BY c.score DESC NULLS LAST, c.ean ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION cosme_check_browse_subcategory(TEXT, INT, INT)
  TO anon, authenticated;


CREATE OR REPLACE FUNCTION cosme_check_get_category_counts()
RETURNS TABLE (
  category    TEXT,
  subcategory TEXT,
  cnt         BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    pc.category,
    pc.subcategory,
    COUNT(*) AS cnt
  FROM cosme_check.product_classifications pc
  JOIN cosme_check.catalog c ON c.ean = pc.ean
  WHERE c.count_total >= 5
  GROUP BY pc.category, pc.subcategory
  ORDER BY pc.category, cnt DESC;
$$;

GRANT EXECUTE ON FUNCTION cosme_check_get_category_counts()
  TO anon, authenticated;
