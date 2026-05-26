-- ============================================================
-- 0015 : pre-calculated INCI analyses keyed by EAN barcode
-- ============================================================
-- Populated by the Python ETL script 60_upload_supabase.py.
-- Updated in the background by /api/analyser after each live analysis
-- so the cache self-enriches with every scan of a new barcode.

CREATE TABLE IF NOT EXISTS cosme_check.product_analyses (
  ean           TEXT        PRIMARY KEY,
  result_json   JSONB       NOT NULL,
  score         REAL        NOT NULL,
  score_label   TEXT        NOT NULL,
  score_tone    TEXT        NOT NULL,
  algo_version  TEXT        NOT NULL DEFAULT 'v1.1',
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cosme_check.product_analyses ENABLE ROW LEVEL SECURITY;

-- Anon and authenticated users can read pre-computed analyses
CREATE POLICY "product_analyses_select"
  ON cosme_check.product_analyses FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service_role (upload script) or via the SECURITY DEFINER RPC below
-- can insert/update. No write policy for regular roles.

-- ── RPC : read ──────────────────────────────────────────────────────────────
-- Returns the full AnalyseResponse JSON for a given EAN, or NULL if not found.
-- Callable by anon (no auth required) so the route can check before charging credits.
CREATE OR REPLACE FUNCTION cosme_check_get_product_analysis(p_ean TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = cosme_check, public
AS $$
  SELECT result_json
  FROM   cosme_check.product_analyses
  WHERE  ean = p_ean
  LIMIT  1;
$$;

GRANT EXECUTE ON FUNCTION cosme_check_get_product_analysis(TEXT)
  TO anon, authenticated;

-- ── RPC : upsert ────────────────────────────────────────────────────────────
-- Called by /api/analyser (server-side, uses service_role key) to cache a
-- freshly-computed analysis so the next barcode scan of the same product is instant.
CREATE OR REPLACE FUNCTION cosme_check_upsert_product_analysis(
  p_ean          TEXT,
  p_result_json  JSONB,
  p_score        REAL,
  p_score_label  TEXT,
  p_score_tone   TEXT,
  p_algo_version TEXT DEFAULT 'v1.1'
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = cosme_check, public
AS $$
  INSERT INTO cosme_check.product_analyses
    (ean, result_json, score, score_label, score_tone, algo_version, computed_at, updated_at)
  VALUES
    (p_ean, p_result_json, p_score, p_score_label, p_score_tone, p_algo_version, NOW(), NOW())
  ON CONFLICT (ean) DO UPDATE SET
    result_json  = EXCLUDED.result_json,
    score        = EXCLUDED.score,
    score_label  = EXCLUDED.score_label,
    score_tone   = EXCLUDED.score_tone,
    algo_version = EXCLUDED.algo_version,
    updated_at   = NOW();
$$;

-- Authenticated users can upsert (route.ts background save after live analysis)
GRANT EXECUTE ON FUNCTION cosme_check_upsert_product_analysis(TEXT, JSONB, REAL, TEXT, TEXT, TEXT)
  TO authenticated;
