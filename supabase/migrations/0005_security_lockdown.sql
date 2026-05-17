-- 0005 — Phase 0 Security Lockdown
--
-- Rattrapage de dette technique avant de scaler (250k produits roadmap).
-- Aucun impact UX, mais ferme des trous de securite reels et prepare la perf.
-- Toutes les operations sont idempotentes (DROP IF EXISTS / IF NOT EXISTS).
--
-- Applique sur remote en 8 chunks separes pour pouvoir tester apres chaque etape :
--   - security_lockdown_a_revoke_admin_rpcs
--   - security_lockdown_b_drop_handle_new_user_vestige
--   - security_lockdown_c_rls_ai_tables
--   - security_lockdown_d_dedupe_rls_policies
--   - security_lockdown_e_rls_initplan_optimization
--   - security_lockdown_f_missing_indexes
--   - security_lockdown_g_drop_unused_indexes
--   - security_lockdown_h_lock_storage_bucket
--
-- Ce fichier consolide tout pour les futurs `supabase db reset` / env locaux.
-- ============================================================================

-- ============================================================================
-- (A) Revoke EXECUTE on admin RPCs from anon/authenticated.
--     Only service_role can call them (used by scripts/scrape_ingredient_details.py
--     and lib/productSearch/cache.ts via supabaseService()).
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.cosme_check_upsert_ingredients(jsonb)    FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cosme_check_upsert_products(jsonb)       FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cosme_check_set_product_cache(text, text, text, text, text, text, numeric) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cosme_check_pending_ingredients(integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cosme_check_pending_by_slugs(text[])     FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.cosme_check_upsert_ingredients(jsonb)    TO service_role;
GRANT EXECUTE ON FUNCTION public.cosme_check_upsert_products(jsonb)       TO service_role;
GRANT EXECUTE ON FUNCTION public.cosme_check_set_product_cache(text, text, text, text, text, text, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.cosme_check_pending_ingredients(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cosme_check_pending_by_slugs(text[])     TO service_role;

-- ============================================================================
-- (B) Drop the scanar-era vestige (public.handle_new_user + its trigger).
--     The active signup path remains on_auth_user_created_cosmetwiki -> cosme_check.handle_new_user.
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================================
-- (C) Enable RLS on AI tables. All access goes through supabaseService()
--     so service_role bypasses RLS automatically. ai_logs has a read-own
--     policy for future user/admin transparency.
-- ============================================================================

ALTER TABLE cosme_check.ai_cache                ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosme_check.ai_logs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosme_check.ingredient_explanations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user reads own ai logs" ON cosme_check.ai_logs;
CREATE POLICY "user reads own ai logs" ON cosme_check.ai_logs
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- (D) Remove catch-all "ALL" policies that duplicate per-action policies
--     (advisor: multiple_permissive_policies).
-- ============================================================================

DROP POLICY IF EXISTS "user crud own analyses" ON cosme_check.analyses;
DROP POLICY IF EXISTS "user crud own routine"  ON cosme_check.routine_items;

-- ============================================================================
-- (E) Wrap auth.uid() in (SELECT auth.uid()) so Postgres caches the result
--     once per query instead of re-evaluating per row.
--     Postgres has no ALTER POLICY for qual/with_check, so we DROP and recreate.
-- ============================================================================

-- public.profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

-- public.searches
DROP POLICY IF EXISTS "Users can view own searches" ON public.searches;
CREATE POLICY "Users can view own searches" ON public.searches
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own searches" ON public.searches;
CREATE POLICY "Users can create own searches" ON public.searches
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own searches" ON public.searches;
CREATE POLICY "Users can delete own searches" ON public.searches
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- public.transcriptions
DROP POLICY IF EXISTS "Users can view own transcriptions" ON public.transcriptions;
CREATE POLICY "Users can view own transcriptions" ON public.transcriptions
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own transcriptions" ON public.transcriptions;
CREATE POLICY "Users can create own transcriptions" ON public.transcriptions
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own transcriptions" ON public.transcriptions;
CREATE POLICY "Users can delete own transcriptions" ON public.transcriptions
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- cosme_check.user_profiles
DROP POLICY IF EXISTS "user reads own profile" ON cosme_check.user_profiles;
CREATE POLICY "user reads own profile" ON cosme_check.user_profiles
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "user updates own profile" ON cosme_check.user_profiles;
CREATE POLICY "user updates own profile" ON cosme_check.user_profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- cosme_check.analyses
DROP POLICY IF EXISTS "user reads own analyses" ON cosme_check.analyses;
CREATE POLICY "user reads own analyses" ON cosme_check.analyses
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user inserts own analyses" ON cosme_check.analyses;
CREATE POLICY "user inserts own analyses" ON cosme_check.analyses
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user updates own analyses" ON cosme_check.analyses;
CREATE POLICY "user updates own analyses" ON cosme_check.analyses
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user deletes own analyses" ON cosme_check.analyses;
CREATE POLICY "user deletes own analyses" ON cosme_check.analyses
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- cosme_check.routine_items
DROP POLICY IF EXISTS "user reads own routine items" ON cosme_check.routine_items;
CREATE POLICY "user reads own routine items" ON cosme_check.routine_items
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user inserts own routine items" ON cosme_check.routine_items;
CREATE POLICY "user inserts own routine items" ON cosme_check.routine_items
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user updates own routine items" ON cosme_check.routine_items;
CREATE POLICY "user updates own routine items" ON cosme_check.routine_items
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user deletes own routine items" ON cosme_check.routine_items;
CREATE POLICY "user deletes own routine items" ON cosme_check.routine_items
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- cosme_check.coherence_analyses
DROP POLICY IF EXISTS "users select own coherence" ON cosme_check.coherence_analyses;
CREATE POLICY "users select own coherence" ON cosme_check.coherence_analyses
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "users insert own coherence" ON cosme_check.coherence_analyses;
CREATE POLICY "users insert own coherence" ON cosme_check.coherence_analyses
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "users update own coherence" ON cosme_check.coherence_analyses;
CREATE POLICY "users update own coherence" ON cosme_check.coherence_analyses
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "users delete own coherence" ON cosme_check.coherence_analyses;
CREATE POLICY "users delete own coherence" ON cosme_check.coherence_analyses
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- (F) Add missing indexes.
--     FK covering indexes flagged by advisor + GIN for fuzzy/jsonb search.
--     products.inci_hash from original plan is skipped (column does not exist yet).
-- ============================================================================

CREATE INDEX IF NOT EXISTS ai_logs_user_id_idx
  ON cosme_check.ai_logs (user_id);

CREATE INDEX IF NOT EXISTS routine_items_analysis_id_idx
  ON cosme_check.routine_items (analysis_id);

CREATE INDEX IF NOT EXISTS ingredient_aliases_inci_id_idx
  ON cosme_check.ingredient_aliases (inci_id);

CREATE INDEX IF NOT EXISTS products_brand_trgm_idx
  ON cosme_check.products USING gin (brand gin_trgm_ops);

CREATE INDEX IF NOT EXISTS analyses_result_json_gin
  ON cosme_check.analyses USING gin (result_json jsonb_path_ops);

-- ============================================================================
-- (G) Drop unused indexes.
-- ============================================================================

-- Duplicate of UNIQUE constraint daily_picks_order_index_key.
DROP INDEX IF EXISTS cosme_check.daily_picks_order_idx;

-- search_log is empty; both indexes never used.
DROP INDEX IF EXISTS cosme_check.search_log_query_idx;
DROP INDEX IF EXISTS cosme_check.search_log_created_idx;

-- ============================================================================
-- (H) Lock down storage bucket cosmetwiki-products.
--     Object access via /storage/v1/object/public/... still works because
--     bucket.public = true. Removing this policy stops anon/auth from
--     listing files via the Storage API.
-- ============================================================================

DROP POLICY IF EXISTS "cosmetwiki_products_public_read" ON storage.objects;

-- ============================================================================
-- ACTION MANUELLE RESTANTE (UI Supabase, ne peut pas etre SQL) :
--
--   Dashboard > Authentication > Providers > Email > "Leaked password
--   protection" -> Enable. Bloque les mots de passe compromis (HaveIBeenPwned).
-- ============================================================================
