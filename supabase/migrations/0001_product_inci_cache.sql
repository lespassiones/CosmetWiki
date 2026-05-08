-- ============================================================
-- CosmetWiki — product_inci_cache + RPCs for product search cascade
-- ------------------------------------------------------------
-- Stores INCI compositions resolved by the cascade
-- (Open Beauty Facts → INCIDecoder → DDG+Mistral) so that
-- subsequent queries for the same product don't hit external APIs.
-- ============================================================

CREATE TABLE IF NOT EXISTS cosmetwiki.product_inci_cache (
  id BIGSERIAL PRIMARY KEY,
  query_norm TEXT NOT NULL,
  brand TEXT,
  product_name TEXT,
  ingredients_text TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  confidence NUMERIC(3, 2),
  votes_correct INTEGER NOT NULL DEFAULT 0,
  votes_wrong INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS product_inci_cache_query_norm_idx
  ON cosmetwiki.product_inci_cache (query_norm);

CREATE INDEX IF NOT EXISTS product_inci_cache_updated_at_idx
  ON cosmetwiki.product_inci_cache (updated_at DESC);

-- RLS : public read, writes only via SECURITY DEFINER RPC
ALTER TABLE cosmetwiki.product_inci_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON cosmetwiki.product_inci_cache;
CREATE POLICY "public read" ON cosmetwiki.product_inci_cache
  FOR SELECT TO anon, authenticated USING (true);

-- ============================================================
-- RPC : cosmetwiki_get_product_cache
-- Public read by normalized query
-- ============================================================
CREATE OR REPLACE FUNCTION public.cosmetwiki_get_product_cache(p_query_norm TEXT)
RETURNS TABLE (
  query_norm TEXT,
  brand TEXT,
  product_name TEXT,
  ingredients_text TEXT,
  source TEXT,
  source_url TEXT,
  confidence NUMERIC,
  votes_correct INTEGER,
  votes_wrong INTEGER,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, cosmetwiki
AS $$
  SELECT
    c.query_norm,
    c.brand,
    c.product_name,
    c.ingredients_text,
    c.source,
    c.source_url,
    c.confidence,
    c.votes_correct,
    c.votes_wrong,
    c.updated_at
  FROM cosmetwiki.product_inci_cache c
  WHERE c.query_norm = p_query_norm
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.cosmetwiki_get_product_cache(TEXT) TO anon, authenticated;

-- ============================================================
-- RPC : cosmetwiki_set_product_cache
-- Service-role upsert
-- ============================================================
CREATE OR REPLACE FUNCTION public.cosmetwiki_set_product_cache(
  p_query_norm TEXT,
  p_brand TEXT,
  p_product_name TEXT,
  p_ingredients_text TEXT,
  p_source TEXT,
  p_source_url TEXT,
  p_confidence NUMERIC
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cosmetwiki
AS $$
DECLARE
  new_id BIGINT;
BEGIN
  IF p_query_norm IS NULL OR LENGTH(TRIM(p_query_norm)) = 0 THEN
    RAISE EXCEPTION 'query_norm cannot be empty';
  END IF;
  IF p_ingredients_text IS NULL OR LENGTH(TRIM(p_ingredients_text)) = 0 THEN
    RAISE EXCEPTION 'ingredients_text cannot be empty';
  END IF;

  INSERT INTO cosmetwiki.product_inci_cache (
    query_norm,
    brand,
    product_name,
    ingredients_text,
    source,
    source_url,
    confidence,
    updated_at
  ) VALUES (
    p_query_norm,
    p_brand,
    p_product_name,
    p_ingredients_text,
    p_source,
    p_source_url,
    p_confidence,
    NOW()
  )
  ON CONFLICT (query_norm) DO UPDATE SET
    brand = COALESCE(EXCLUDED.brand, cosmetwiki.product_inci_cache.brand),
    product_name = COALESCE(EXCLUDED.product_name, cosmetwiki.product_inci_cache.product_name),
    ingredients_text = EXCLUDED.ingredients_text,
    source = EXCLUDED.source,
    source_url = COALESCE(EXCLUDED.source_url, cosmetwiki.product_inci_cache.source_url),
    confidence = EXCLUDED.confidence,
    updated_at = NOW()
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cosmetwiki_set_product_cache(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cosmetwiki_set_product_cache(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) TO service_role;

-- ============================================================
-- RPC : cosmetwiki_vote_product_cache
-- Public vote on cache correctness (anti-vandalism via rate-limit at API level)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cosmetwiki_vote_product_cache(
  p_query_norm TEXT,
  p_correct BOOLEAN
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, cosmetwiki
AS $$
  UPDATE cosmetwiki.product_inci_cache
  SET
    votes_correct = votes_correct + (CASE WHEN p_correct THEN 1 ELSE 0 END),
    votes_wrong   = votes_wrong   + (CASE WHEN p_correct THEN 0 ELSE 1 END),
    updated_at = NOW()
  WHERE query_norm = p_query_norm;
$$;

GRANT EXECUTE ON FUNCTION public.cosmetwiki_vote_product_cache(TEXT, BOOLEAN) TO anon, authenticated;

-- ============================================================
-- RPC : cosmetwiki_list_active_slugs
-- Used by app/sitemap.ts to enumerate every ingredient page for SEO,
-- without needing to expose the `cosmetwiki` schema in PostgREST.
-- ============================================================
CREATE OR REPLACE FUNCTION public.cosmetwiki_list_active_slugs(p_limit INTEGER DEFAULT 50000)
RETURNS TABLE (slug TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, cosmetwiki
AS $$
  SELECT slug
  FROM cosmetwiki.ingredients
  WHERE slug IS NOT NULL
  ORDER BY id
  LIMIT GREATEST(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.cosmetwiki_list_active_slugs(INTEGER) TO anon, authenticated;
