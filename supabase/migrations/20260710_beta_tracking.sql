-- 20260710_beta_tracking.sql
-- ============================================================================
-- Programme BÊTA — Lot 2 : tracking d'état + relances automatiques par CRON.
--
-- États d'un testeur (recoupés par le CRON /api/beta/cron) :
--   invited_at          → invitation envoyée (Lot 1)
--   clicked_at          → a cliqué le lien de l'email (/beta/go?token=…)
--   account_created_at  → compte app trouvé pour son email (auth.users)
--   tested_at           → ≥ 1 activité (analyse, scan, routine, advisor)
--   status feedback_recu→ formulaire rempli
--
-- Relances (gérées par le CRON, compteurs ci-dessous) :
--   A. pas de compte  → template « relance pas testé » : J+2 après invitation,
--      puis une dernière 3 jours plus tard (max 2).
--   B. compte créé, pas de retour → template « demande de retour » : J+2 après
--      création du compte, relance +3 j, dernière +5 j (max 3 envois).
--   Merci : envoyé immédiatement à la soumission du formulaire (thanked_at).
-- ============================================================================

alter table cosme_check.beta_testers
  add column if not exists clicked_at           timestamptz,
  add column if not exists account_created_at   timestamptz,
  add column if not exists tested_at            timestamptz,
  add column if not exists no_test_relances     smallint not null default 0,
  add column if not exists no_test_last_at      timestamptz,
  add column if not exists feedback_asks        smallint not null default 0,
  add column if not exists feedback_ask_last_at timestamptz,
  add column if not exists thanked_at           timestamptz;

-- Le nouveau formulaire (4 étapes, questions 1..20) stocke ses réponses en
-- jsonb ; les anciennes colonnes (rating_overall, liked…) restent pour compat.
alter table cosme_check.beta_feedback
  add column if not exists answers jsonb;

-- Une seule ligne de feedback par testeur : les étapes du wizard fusionnent
-- leurs réponses dans la même ligne (upsert).
create unique index if not exists beta_feedback_tester_unique
  on cosme_check.beta_feedback (beta_tester_id);

-- ----------------------------------------------------------------------------
-- RPC de synchronisation : recoupe beta_testers avec auth.users (compte créé)
-- et l'activité app (a testé). SECURITY DEFINER car auth.users n'est pas
-- accessible au client PostgREST. Réservée au service_role.
-- ----------------------------------------------------------------------------
create or replace function public.cosme_check_beta_sync_states()
returns jsonb
language plpgsql
security definer
set search_path to 'cosme_check', 'public'
as $$
declare
  v_accounts int;
  v_tested int;
begin
  update cosme_check.beta_testers t
  set account_created_at = u.created_at, updated_at = now()
  from auth.users u
  where t.account_created_at is null
    and lower(u.email) = t.email;
  get diagnostics v_accounts = row_count;

  update cosme_check.beta_testers t
  set tested_at = now(), updated_at = now()
  from auth.users u
  where t.tested_at is null
    and lower(u.email) = t.email
    and (
      exists (select 1 from cosme_check.analyses a where a.user_id = u.id)
      or exists (select 1 from cosme_check.scan_events s where s.user_id = u.id)
      or exists (select 1 from cosme_check.routine_items r where r.user_id = u.id)
      or exists (select 1 from cosme_check.advisor_conversations c where c.user_id = u.id)
    );
  get diagnostics v_tested = row_count;

  return jsonb_build_object('accounts_linked', v_accounts, 'tested_marked', v_tested);
end;
$$;

revoke execute on function public.cosme_check_beta_sync_states() from public;
revoke execute on function public.cosme_check_beta_sync_states() from anon;
revoke execute on function public.cosme_check_beta_sync_states() from authenticated;
