-- Classification table for the 48k product catalog.
-- Each product is assigned a top-level category and a granular subcategory.
-- method tracks how the classification was derived:
--   'obf'           → OBF category slug mapping (highest confidence)
--   'name'          → regex on brand+name
--   'inci'          → INCI ingredient heuristics
--   'gpt'           → GPT batch verification (final pass)
--   'manual'        → human correction

CREATE TABLE IF NOT EXISTS cosme_check.product_classifications (
  ean              TEXT        NOT NULL PRIMARY KEY
                               REFERENCES cosme_check.catalog(ean)
                               ON DELETE CASCADE,
  category         TEXT        NOT NULL,
  subcategory      TEXT        NOT NULL,
  method           TEXT        NOT NULL DEFAULT 'obf',
  confidence       FLOAT       NOT NULL DEFAULT 0.95,
  gpt_verified     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_classifications_category
  ON cosme_check.product_classifications(category);

CREATE INDEX IF NOT EXISTS idx_product_classifications_subcategory
  ON cosme_check.product_classifications(subcategory);

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION cosme_check.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_classifications_updated_at
  ON cosme_check.product_classifications;

CREATE TRIGGER trg_product_classifications_updated_at
  BEFORE UPDATE ON cosme_check.product_classifications
  FOR EACH ROW EXECUTE FUNCTION cosme_check.set_updated_at();

-- RLS: read-only for anon/authenticated, full access for service role
ALTER TABLE cosme_check.product_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read classifications"
  ON cosme_check.product_classifications
  FOR SELECT USING (true);

-- RPC: get subcategory counts for the browse UI
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
  GROUP BY pc.category, pc.subcategory
  ORDER BY pc.category, cnt DESC;
$$;

GRANT EXECUTE ON FUNCTION cosme_check_get_category_counts() TO anon, authenticated;

-- RPC: browse products in a subcategory (paginated, sorted by score desc)
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
  ORDER BY c.score DESC NULLS LAST, c.ean ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION cosme_check_browse_subcategory(TEXT, INT, INT) TO anon, authenticated;
