-- ============================================================
-- 20260528 : caches d'analyse partagés (INCI hash + cohérence)
-- ============================================================
-- Objectif : qu'un produit ou une analyse de promesse calculé(e)
-- par un user soit instantanément réutilisé par les autres, sans
-- appel IA et sans débit de crédit.
--
-- Deux caches :
--   1. inci_analyses_cache   → analyse INCI (score + items) clé par
--      sha256(normalized(ingredients_text)). Complémentaire à
--      product_analyses (clé EAN) pour couvrir les produits trouvés
--      via recherche web sans EAN fiable.
--   2. coherence_cache       → analyse de promesse partagée, clé
--      composite (inci_hash, description_hash).
--
-- coherence_analyses (per-user) reste inchangée : c'est l'historique
-- personnel de chaque user. Le cache partagé est une couche additionnelle.

-- ─── Cache 1 : analyses INCI par hash ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cosme_check.inci_analyses_cache (
  inci_hash    TEXT        PRIMARY KEY,
  result_json  JSONB       NOT NULL,
  score        REAL        NOT NULL,
  score_label  TEXT        NOT NULL,
  score_tone   TEXT        NOT NULL,
  algo_version TEXT        NOT NULL DEFAULT 'v1.1',
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cosme_check.inci_analyses_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inci_analyses_cache_select" ON cosme_check.inci_analyses_cache;
CREATE POLICY "inci_analyses_cache_select"
  ON cosme_check.inci_analyses_cache FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION cosme_check_get_inci_analysis(p_inci_hash TEXT)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = cosme_check, public
AS $$
  SELECT result_json
  FROM cosme_check.inci_analyses_cache
  WHERE inci_hash = p_inci_hash
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION cosme_check_get_inci_analysis(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION cosme_check_upsert_inci_analysis(
  p_inci_hash    TEXT,
  p_result_json  JSONB,
  p_score        REAL,
  p_score_label  TEXT,
  p_score_tone   TEXT,
  p_algo_version TEXT DEFAULT 'v1.1'
)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
SET search_path = cosme_check, public
AS $$
  INSERT INTO cosme_check.inci_analyses_cache
    (inci_hash, result_json, score, score_label, score_tone, algo_version, computed_at, updated_at)
  VALUES
    (p_inci_hash, p_result_json, p_score, p_score_label, p_score_tone, p_algo_version, NOW(), NOW())
  ON CONFLICT (inci_hash) DO UPDATE SET
    result_json  = EXCLUDED.result_json,
    score        = EXCLUDED.score,
    score_label  = EXCLUDED.score_label,
    score_tone   = EXCLUDED.score_tone,
    algo_version = EXCLUDED.algo_version,
    updated_at   = NOW();
$$;

GRANT EXECUTE ON FUNCTION cosme_check_upsert_inci_analysis(TEXT, JSONB, REAL, TEXT, TEXT, TEXT)
  TO authenticated;


-- ─── Cache 2 : analyses de promesse partagées ────────────────────────────────
CREATE TABLE IF NOT EXISTS cosme_check.coherence_cache (
  inci_hash        TEXT        NOT NULL,
  description_hash TEXT        NOT NULL,
  result_json      JSONB       NOT NULL,
  product_type     TEXT,
  algo_version     TEXT        NOT NULL DEFAULT 'v1.0',
  computed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (inci_hash, description_hash)
);

ALTER TABLE cosme_check.coherence_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coherence_cache_select" ON cosme_check.coherence_cache;
CREATE POLICY "coherence_cache_select"
  ON cosme_check.coherence_cache FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION cosme_check_get_coherence_cache(
  p_inci_hash        TEXT,
  p_description_hash TEXT
)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = cosme_check, public
AS $$
  SELECT result_json
  FROM cosme_check.coherence_cache
  WHERE inci_hash = p_inci_hash
    AND description_hash = p_description_hash
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION cosme_check_get_coherence_cache(TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION cosme_check_upsert_coherence_cache(
  p_inci_hash        TEXT,
  p_description_hash TEXT,
  p_result_json      JSONB,
  p_product_type     TEXT,
  p_algo_version     TEXT DEFAULT 'v1.0'
)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
SET search_path = cosme_check, public
AS $$
  INSERT INTO cosme_check.coherence_cache
    (inci_hash, description_hash, result_json, product_type, algo_version, computed_at, updated_at)
  VALUES
    (p_inci_hash, p_description_hash, p_result_json, p_product_type, p_algo_version, NOW(), NOW())
  ON CONFLICT (inci_hash, description_hash) DO UPDATE SET
    result_json  = EXCLUDED.result_json,
    product_type = EXCLUDED.product_type,
    algo_version = EXCLUDED.algo_version,
    updated_at   = NOW();
$$;

GRANT EXECUTE ON FUNCTION cosme_check_upsert_coherence_cache(TEXT, TEXT, JSONB, TEXT, TEXT)
  TO authenticated;
