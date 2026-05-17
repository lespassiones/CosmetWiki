-- 0007 — pg_cron TTL automatique sur les tables UNLOGGED de 0006.
--
-- Sans cleanup, idempotency / rate_limits / error_log / ai_logs grossissent
-- à l'infini. Cette migration active pg_cron (gratuit sur Supabase) et
-- schedule 4 jobs pour purger les vieilles entrées.
--
-- Schedules (UTC) :
--   - rate_limits   : */15 * * * *  (toutes les 15 min, garde ~1h)
--   - idempotency   : 0 * * * *     (toutes les heures, garde 24h)
--   - ai_logs       : 0 3 * * *     (3h UTC, garde 30j)
--   - error_log     : 5 3 * * *     (3h05 UTC, garde 14j)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE OR REPLACE FUNCTION cosme_check.cleanup_ai_logs()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path = cosme_check, public AS $$
DECLARE v_deleted integer;
BEGIN
  DELETE FROM cosme_check.ai_logs WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END $$;

CREATE OR REPLACE FUNCTION cosme_check.cleanup_error_log()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path = cosme_check, public AS $$
DECLARE v_deleted integer;
BEGIN
  DELETE FROM cosme_check.error_log WHERE created_at < NOW() - INTERVAL '14 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END $$;

-- Schedule jobs (idempotent: unschedule first if it already exists).

SELECT cron.unschedule('cosme_check_cleanup_rate_limits')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cosme_check_cleanup_rate_limits');
SELECT cron.schedule(
  'cosme_check_cleanup_rate_limits',
  '*/15 * * * *',
  $$SELECT cosme_check.cleanup_rate_limits();$$
);

SELECT cron.unschedule('cosme_check_cleanup_idempotency')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cosme_check_cleanup_idempotency');
SELECT cron.schedule(
  'cosme_check_cleanup_idempotency',
  '0 * * * *',
  $$SELECT cosme_check.cleanup_idempotency();$$
);

SELECT cron.unschedule('cosme_check_cleanup_ai_logs')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cosme_check_cleanup_ai_logs');
SELECT cron.schedule(
  'cosme_check_cleanup_ai_logs',
  '0 3 * * *',
  $$SELECT cosme_check.cleanup_ai_logs();$$
);

SELECT cron.unschedule('cosme_check_cleanup_error_log')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cosme_check_cleanup_error_log');
SELECT cron.schedule(
  'cosme_check_cleanup_error_log',
  '5 3 * * *',
  $$SELECT cosme_check.cleanup_error_log();$$
);
