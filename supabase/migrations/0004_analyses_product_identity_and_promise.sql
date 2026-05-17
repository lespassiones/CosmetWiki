-- 0004 — Product identity + promise fields on cosme_check.analyses.
--
-- Phase 1 ("OCR enrichi") extracts brand + product type from the front photo
-- and we want to persist them alongside the existing `product_label`.
--
-- Phase 4 / 5 ("Récupération de la promesse") runs a web search to fetch the
-- marketing description of the product and stores it here so the
-- coherence wizard can pre-fill the description step without re-fetching.
--
-- All columns are nullable — older rows pre-dating this migration simply have
-- NULL for the new fields, and the analyser API only fills them when it has
-- real data (no defaulting to empty strings).

ALTER TABLE cosme_check.analyses
  ADD COLUMN IF NOT EXISTS brand              TEXT,
  ADD COLUMN IF NOT EXISTS product_type       TEXT,
  ADD COLUMN IF NOT EXISTS product_description TEXT,
  ADD COLUMN IF NOT EXISTS promise_source_url TEXT;

-- Index on brand for future "show me all my CeraVe analyses" use cases. Cheap
-- because most rows will have brand NULL for a while.
CREATE INDEX IF NOT EXISTS analyses_brand_idx
  ON cosme_check.analyses (user_id, brand)
  WHERE brand IS NOT NULL;
