-- 20260710_beta_credits_grant.sql
-- ============================================================================
-- Programme BÊTA — 50 crédits NON renouvelables offerts aux bêta testeurs.
--
-- On enrichit le trigger de création de compte handle_new_user() : si l'email
-- du nouveau compte est inscrit au programme bêta (cosme_check.beta_testers,
-- email en minuscules), on crée UNE fois un grant de 50 crédits
-- (grant_type='beta', expires_at NULL = non expirant, non renouvelable). La
-- consommation dépense l'allocation du palier d'abord, puis les grants FIFO :
-- le bonus bêta est donc utilisé en dernier. S'ils s'abonnent plus tard, ils
-- basculent sur les 100 crédits/mois du palier premium (inchangé).
--
-- ⚠️ Le corps ci-dessous REPREND À L'IDENTIQUE le trigger live (vérifié via
-- pg_get_functiondef) et n'AJOUTE que le bloc bêta, enveloppé dans un
-- EXCEPTION WHEN OTHERS pour ne jamais faire échouer une inscription.
--
-- Fin de bêta : révoquer/supprimer ces bonus (grant_type='beta') si besoin.
-- ============================================================================

CREATE OR REPLACE FUNCTION cosme_check.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'cosme_check', 'public'
AS $function$
DECLARE v_open BOOLEAN; v_tier TEXT;
BEGIN
  SELECT signups_open, signup_default_tier INTO v_open, v_tier FROM cosme_check.app_config WHERE id = 1;
  IF v_open IS FALSE THEN
    RAISE EXCEPTION 'signups_closed' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO cosme_check.user_profiles (id, first_name, tier)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), COALESCE(v_tier, 'free'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO cosme_check.user_credits (user_id, day, used, daily_limit)
  VALUES (NEW.id, CURRENT_DATE, 0, 5)
  ON CONFLICT (user_id, day) DO NOTHING;

  -- Bonus bêta testeur (best-effort : ne doit jamais bloquer l'inscription).
  BEGIN
    IF NEW.email IS NOT NULL AND EXISTS (
      SELECT 1 FROM cosme_check.beta_testers b WHERE b.email = lower(NEW.email)
    ) THEN
      INSERT INTO cosme_check.credit_grants (user_id, amount, remaining, note, created_by, grant_type)
      SELECT NEW.id, 50, 50, 'Bonus bêta testeur', 'signup_trigger', 'beta'
      WHERE NOT EXISTS (
        SELECT 1 FROM cosme_check.credit_grants g
        WHERE g.user_id = NEW.id AND g.grant_type = 'beta'
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$function$;
