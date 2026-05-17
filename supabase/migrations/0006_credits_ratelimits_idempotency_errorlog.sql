-- 0006 — P0 : Credits + Rate Limit Postgres + Idempotency + Error Log
--
-- Ferme les 3 trous critiques avant de scaler a 1k-5k users :
--   1. Pas de plafond par user sur les routes AI => facture OpenAI/Mistral peut exploser
--   2. Rate-limit in-memory => casse sur Vercel multi-instance
--   3. Pas de visibilite sur les erreurs runtime (logs Vercel Hobby = 1h max)
--
-- Toutes les tables ephemeres (rate_limits, idempotency, error_log) sont UNLOGGED :
--   - 5-10x plus rapide a ecrire (pas de WAL)
--   - Perdues si crash Postgres (acceptable : juste un reset des compteurs)
--
-- ============================================================================

-- ─── user_credits ──────────────────────────────────────────────────────────
-- (user_id, day) avec used / daily_limit. 1 ligne par jour cree par le RPC.
-- day est en UTC (Supabase tourne en UTC) → reset a minuit UTC.
CREATE TABLE IF NOT EXISTS cosme_check.user_credits (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day         DATE NOT NULL DEFAULT CURRENT_DATE,
  used        INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL DEFAULT 100,
  PRIMARY KEY (user_id, day)
);
ALTER TABLE cosme_check.user_credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users read own credits" ON cosme_check.user_credits;
CREATE POLICY "users read own credits" ON cosme_check.user_credits
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- ─── rate_limits (UNLOGGED) ────────────────────────────────────────────────
CREATE UNLOGGED TABLE IF NOT EXISTS cosme_check.rate_limits (
  key          TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count        INTEGER NOT NULL DEFAULT 0
);

-- ─── idempotency cache (UNLOGGED, 24h TTL) ────────────────────────────────
CREATE UNLOGGED TABLE IF NOT EXISTS cosme_check.idempotency (
  key         TEXT PRIMARY KEY,
  response    JSONB NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 200,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idempotency_created_at_idx
  ON cosme_check.idempotency (created_at);

-- ─── error_log (UNLOGGED) ──────────────────────────────────────────────────
CREATE UNLOGGED TABLE IF NOT EXISTS cosme_check.error_log (
  id         BIGSERIAL PRIMARY KEY,
  route      TEXT,
  error      TEXT,
  stack      TEXT,
  user_id    UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS error_log_created_at_idx
  ON cosme_check.error_log (created_at DESC);

-- ============================================================================
-- RPC: consume_credit
-- Utilise auth.uid() (PAS un parametre p_user) pour eviter le spoofing IDOR.
-- Atomique en un UPDATE WHERE used < daily_limit RETURNING.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cosme_check_consume_credit(p_feature TEXT DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = cosme_check, public AS $$
DECLARE
  v_user UUID := (SELECT auth.uid());
  v_used INT;
  v_limit INT;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  INSERT INTO cosme_check.user_credits(user_id, day)
  VALUES (v_user, CURRENT_DATE) ON CONFLICT DO NOTHING;

  UPDATE cosme_check.user_credits
  SET used = used + 1
  WHERE user_id = v_user AND day = CURRENT_DATE AND used < daily_limit
  RETURNING used, daily_limit INTO v_used, v_limit;

  IF v_used IS NULL THEN
    SELECT used, daily_limit INTO v_used, v_limit
    FROM cosme_check.user_credits
    WHERE user_id = v_user AND day = CURRENT_DATE;
    RETURN jsonb_build_object('ok', false, 'used', v_used, 'limit', v_limit, 'remaining', 0);
  END IF;

  RETURN jsonb_build_object('ok', true, 'used', v_used, 'limit', v_limit, 'remaining', v_limit - v_used);
END $$;

REVOKE EXECUTE ON FUNCTION public.cosme_check_consume_credit(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cosme_check_consume_credit(text) TO authenticated;

-- ============================================================================
-- RPC: get_credits (read-only, pour la pastille UI)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cosme_check_get_credits()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = cosme_check, public AS $$
DECLARE
  v_user UUID := (SELECT auth.uid());
  v_used INT;
  v_limit INT;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  SELECT used, daily_limit INTO v_used, v_limit
  FROM cosme_check.user_credits
  WHERE user_id = v_user AND day = CURRENT_DATE;

  IF v_used IS NULL THEN
    v_used := 0;
    SELECT COALESCE(MAX(daily_limit), 100) INTO v_limit
    FROM cosme_check.user_credits WHERE user_id = v_user;
  END IF;

  RETURN jsonb_build_object('ok', true, 'used', v_used, 'limit', v_limit, 'remaining', v_limit - v_used);
END $$;

REVOKE EXECUTE ON FUNCTION public.cosme_check_get_credits() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cosme_check_get_credits() TO authenticated;

-- ============================================================================
-- RPC: check_rate_limit (atomic UPSERT, sliding window)
-- Appele cote serveur uniquement via service_role.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cosme_check_check_rate_limit(
  p_key        TEXT,
  p_max        INTEGER,
  p_window_sec INTEGER
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = cosme_check, public AS $$
DECLARE
  v_now   TIMESTAMPTZ := NOW();
  v_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  INSERT INTO cosme_check.rate_limits (key, window_start, count)
  VALUES (p_key, v_now, 1)
  ON CONFLICT (key) DO UPDATE
  SET
    window_start = CASE
      WHEN cosme_check.rate_limits.window_start + make_interval(secs => p_window_sec) < v_now
        THEN v_now
      ELSE cosme_check.rate_limits.window_start
    END,
    count = CASE
      WHEN cosme_check.rate_limits.window_start + make_interval(secs => p_window_sec) < v_now
        THEN 1
      ELSE cosme_check.rate_limits.count + 1
    END
  RETURNING window_start, count INTO v_start, v_count;

  IF v_count > p_max THEN
    RETURN jsonb_build_object(
      'ok', false,
      'remaining', 0,
      'retry_after_ms', GREATEST(0, EXTRACT(EPOCH FROM (v_start + make_interval(secs => p_window_sec) - v_now))::int * 1000)
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'remaining', p_max - v_count,
    'reset_at', v_start + make_interval(secs => p_window_sec)
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.cosme_check_check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cosme_check_check_rate_limit(text, integer, integer) TO service_role;

-- ============================================================================
-- RPC: log_error (service_role only — must never fail)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cosme_check_log_error(
  p_route TEXT,
  p_error TEXT,
  p_stack TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = cosme_check, public AS $$
BEGIN
  INSERT INTO cosme_check.error_log (route, error, stack, user_id)
  VALUES (p_route, p_error, p_stack, p_user_id);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

REVOKE EXECUTE ON FUNCTION public.cosme_check_log_error(text, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cosme_check_log_error(text, text, text, uuid) TO service_role;

-- ============================================================================
-- Cleanup helpers (a appeler manuellement ou via cron Supabase plus tard)
-- ============================================================================
CREATE OR REPLACE FUNCTION cosme_check.cleanup_idempotency()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path = cosme_check, public AS $$
DECLARE v_deleted integer;
BEGIN
  DELETE FROM cosme_check.idempotency WHERE created_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END $$;

CREATE OR REPLACE FUNCTION cosme_check.cleanup_rate_limits()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path = cosme_check, public AS $$
DECLARE v_deleted integer;
BEGIN
  DELETE FROM cosme_check.rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END $$;
