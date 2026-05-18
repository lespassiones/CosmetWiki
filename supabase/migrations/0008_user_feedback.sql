-- 0008 — Retours utilisateurs : avis (rating 1-5) + messages de la page contact.
--
-- Une seule table `user_feedback` car les deux flux ressemblent fortement à du
-- "feedback non sollicité côté user" et iront dans la même page admin
-- (Retours). On distingue par la colonne `kind`.
--
--   - kind='feedback' : auth requis, rating obligatoire, user_id non nul.
--                       trigger_source = 'first_promesse' ou 'fifth_promesse'.
--                       Unique par (user_id, trigger_source) — un user ne
--                       peut pas spammer.
--   - kind='contact'  : auth optionnel, user_id nullable. first_name + email
--                       + subject + message obligatoires.
-- ============================================================================

-- ─── table ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cosme_check.user_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL CHECK (kind IN ('feedback', 'contact')),
  -- feedback only
  rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
  trigger_source  TEXT,
  -- contact only
  contact_first_name TEXT,
  contact_email      TEXT,
  contact_subject    TEXT,
  -- both
  message         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- shape constraints per kind
  CONSTRAINT feedback_has_rating    CHECK (kind <> 'feedback' OR rating IS NOT NULL),
  CONSTRAINT feedback_has_user      CHECK (kind <> 'feedback' OR user_id IS NOT NULL),
  CONSTRAINT feedback_has_trigger   CHECK (kind <> 'feedback' OR trigger_source IS NOT NULL),
  CONSTRAINT contact_has_email      CHECK (kind <> 'contact'  OR contact_email IS NOT NULL),
  CONSTRAINT contact_has_first_name CHECK (kind <> 'contact'  OR contact_first_name IS NOT NULL),
  CONSTRAINT contact_has_subject    CHECK (kind <> 'contact'  OR contact_subject IS NOT NULL),
  CONSTRAINT contact_has_message    CHECK (kind <> 'contact'  OR message IS NOT NULL)
);

-- One feedback per user per trigger source (NULL-safe via partial unique).
CREATE UNIQUE INDEX IF NOT EXISTS user_feedback_unique_trigger
  ON cosme_check.user_feedback (user_id, trigger_source)
  WHERE kind = 'feedback';

CREATE INDEX IF NOT EXISTS user_feedback_created_at_idx
  ON cosme_check.user_feedback (created_at DESC);

CREATE INDEX IF NOT EXISTS user_feedback_kind_idx
  ON cosme_check.user_feedback (kind);

-- ─── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE cosme_check.user_feedback ENABLE ROW LEVEL SECURITY;

-- Signed-in users : insert their own feedback rows.
DROP POLICY IF EXISTS "users insert own feedback" ON cosme_check.user_feedback;
CREATE POLICY "users insert own feedback" ON cosme_check.user_feedback
  FOR INSERT TO authenticated
  WITH CHECK (kind = 'feedback' AND user_id = (SELECT auth.uid()));

-- Signed-in users : read their own feedback rows (lets the popup know it has
-- already been submitted).
DROP POLICY IF EXISTS "users read own feedback" ON cosme_check.user_feedback;
CREATE POLICY "users read own feedback" ON cosme_check.user_feedback
  FOR SELECT TO authenticated
  USING (kind = 'feedback' AND user_id = (SELECT auth.uid()));

-- Contact messages are routed through a service-role API (no direct INSERT
-- from anon clients), so no RLS policy is added for that path. The dashboard
-- reads everything via service_role too.

-- ============================================================================
-- RPC: get_feedback_status — returns whether the user has already submitted
-- a feedback + how many coherence_analyses (promesses) they own. Drives the
-- popup armed/disarmed state in the client.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cosme_check_get_feedback_status()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = cosme_check, public AS $$
DECLARE
  v_user UUID := (SELECT auth.uid());
  v_submitted BOOLEAN;
  v_promesse_count INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM cosme_check.user_feedback
    WHERE user_id = v_user AND kind = 'feedback'
  ) INTO v_submitted;

  SELECT COUNT(*)::int INTO v_promesse_count
  FROM cosme_check.coherence_analyses
  WHERE user_id = v_user;

  RETURN jsonb_build_object(
    'ok', true,
    'submitted', v_submitted,
    'promesseCount', v_promesse_count
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.cosme_check_get_feedback_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cosme_check_get_feedback_status() TO authenticated;

-- ============================================================================
-- RPC: submit_feedback — insert with idempotent semantics. If the user has
-- already submitted for this trigger_source, returns ok=true with
-- already_submitted=true rather than throwing on the unique index. Cheaper
-- than catching duplicate-key exceptions in the API layer.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cosme_check_submit_feedback(
  p_rating         INTEGER,
  p_message        TEXT,
  p_trigger_source TEXT
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = cosme_check, public AS $$
DECLARE
  v_user UUID := (SELECT auth.uid());
  v_id UUID;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_rating');
  END IF;
  IF p_trigger_source IS NULL OR p_trigger_source NOT IN ('first_promesse', 'fifth_promesse') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_trigger');
  END IF;

  INSERT INTO cosme_check.user_feedback (user_id, kind, rating, message, trigger_source)
  VALUES (v_user, 'feedback', p_rating, NULLIF(BTRIM(p_message), ''), p_trigger_source)
  ON CONFLICT (user_id, trigger_source) WHERE kind = 'feedback' DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_submitted', true);
  END IF;
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.cosme_check_submit_feedback(integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cosme_check_submit_feedback(integer, text, text) TO authenticated;
