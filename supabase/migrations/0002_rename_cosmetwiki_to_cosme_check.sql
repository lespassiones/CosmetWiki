-- =====================================================================
-- 0002 — Rebrand: cosmetwiki → cosme_check (Cosme Check)
-- =====================================================================
-- This migration renames:
--   * the schema           cosmetwiki        → cosme_check
--   * the 18 public RPCs   public.cosmetwiki_* → public.cosme_check_*
--   * every function body & SET search_path setting that still references
--     the old schema name (since ALTER SCHEMA only moves objects, it does
--     NOT rewrite SQL text inside function bodies or search_path config).
--
-- The rename happens atomically inside a single transaction; grants follow
-- the function/schema by OID so they are preserved automatically.
--
-- Storage bucket `cosmetwiki-products` is intentionally NOT renamed — it
-- would require moving every uploaded file. The bucket name is internal
-- and never user-visible.
--
-- After applying: open the Supabase dashboard and update
--   Project Settings → API → Exposed schemas
-- replacing `cosmetwiki` with `cosme_check`.
-- =====================================================================

BEGIN;

-- 1. Rename the schema. All contained objects (tables, indexes, sequences,
--    triggers, policies, internal functions, views) move atomically.
ALTER SCHEMA cosmetwiki RENAME TO cosme_check;

-- 2. Rewrite every function whose body or search_path still mentions the
--    old schema name. Two replacements suffice:
--      * `cosmetwiki.`  → `cosme_check.`   (qualified table refs)
--      * `'cosmetwiki'` → `'cosme_check'`  (search_path string literals)
DO $migrate_internal$
DECLARE
  fn   RECORD;
  body TEXT;
BEGIN
  FOR fn IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'cosme_check'
      AND pg_get_functiondef(p.oid) ILIKE '%cosmetwiki%'
  LOOP
    body := pg_get_functiondef(fn.oid);
    body := replace(body, 'cosmetwiki.', 'cosme_check.');
    body := replace(body, '''cosmetwiki''', '''cosme_check''');
    EXECUTE body;
  END LOOP;
END
$migrate_internal$;

-- 3. For each public.cosmetwiki_* RPC: rewrite body + search_path, then
--    rename the function. CREATE OR REPLACE preserves grants; ALTER FUNCTION
--    RENAME keeps the OID so grants survive the rename too.
DO $migrate_public$
DECLARE
  fn       RECORD;
  body     TEXT;
  new_name TEXT;
BEGIN
  FOR fn IN
    SELECT
      p.oid,
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname ~ '^cosmetwiki_'
  LOOP
    body := pg_get_functiondef(fn.oid);
    body := replace(body, 'cosmetwiki.', 'cosme_check.');
    body := replace(body, '''cosmetwiki''', '''cosme_check''');
    EXECUTE body;

    new_name := 'cosme_check_' || substring(fn.proname FROM 12); -- strip 'cosmetwiki_'
    EXECUTE format(
      'ALTER FUNCTION public.%I(%s) RENAME TO %I',
      fn.proname,
      fn.args,
      new_name
    );
  END LOOP;
END
$migrate_public$;

COMMIT;

-- =====================================================================
-- Sanity checks (run manually after applying):
--
--   SELECT schema_name FROM information_schema.schemata
--   WHERE schema_name IN ('cosmetwiki', 'cosme_check');
--   -- expect: cosme_check only
--
--   SELECT n.nspname, p.proname
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE p.proname LIKE '%cosmetwiki%' OR n.nspname = 'cosmetwiki';
--   -- expect: 0 rows
--
--   SELECT n.nspname, p.proname
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE p.proname LIKE 'cosme_check_%';
--   -- expect: 18 functions in public
-- =====================================================================
