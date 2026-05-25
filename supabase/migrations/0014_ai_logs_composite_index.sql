-- 0014 — Composite index on ai_logs(user_id, feature, created_at).
--
-- The advisor/chat route counts daily messages with:
--   WHERE user_id = $1 AND feature = 'synthesis' AND created_at >= $today
--
-- The existing ai_logs_user_id_idx (user_id only) forces Postgres to
-- re-filter on feature + created_at after the index scan. The composite
-- index covers the full predicate in order — avoids heap fetches for the
-- count query.
--
-- NOTE: Supabase CLI runs migrations inside a transaction, so CONCURRENTLY
-- cannot be used here. If the table is already large (>500k rows) on a live
-- DB, run this manually outside a transaction via the SQL editor:
--
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS ai_logs_user_feature_date_idx
--     ON cosme_check.ai_logs (user_id, feature, created_at DESC);
-- ============================================================================

CREATE INDEX IF NOT EXISTS ai_logs_user_feature_date_idx
  ON cosme_check.ai_logs (user_id, feature, created_at DESC);
