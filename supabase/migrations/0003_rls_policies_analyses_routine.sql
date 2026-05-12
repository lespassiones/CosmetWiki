-- 0003 — Row-Level Security policies for cosme_check.analyses and
-- cosme_check.routine_items.
--
-- Both tables had RLS enabled but only an opaque catch-all policy that, in
-- practice, did not let the authenticated role insert anything (every save
-- was silently denied and swallowed by the API's try/catch). We add
-- explicit per-operation policies — SELECT / INSERT / UPDATE / DELETE — all
-- gated on `auth.uid() = user_id` so each user only ever sees or mutates
-- their own rows.
--
-- This unblocks: history page, "dernière analyse" on the dashboard, routine
-- builder, exposure metrics, and the skin advisor (which reads the user's
-- routine alongside the skin profile).

-- analyses ---------------------------------------------------------------

DROP POLICY IF EXISTS "user reads own analyses" ON cosme_check.analyses;
CREATE POLICY "user reads own analyses"
  ON cosme_check.analyses
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user inserts own analyses" ON cosme_check.analyses;
CREATE POLICY "user inserts own analyses"
  ON cosme_check.analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user updates own analyses" ON cosme_check.analyses;
CREATE POLICY "user updates own analyses"
  ON cosme_check.analyses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user deletes own analyses" ON cosme_check.analyses;
CREATE POLICY "user deletes own analyses"
  ON cosme_check.analyses
  FOR DELETE
  USING (auth.uid() = user_id);

-- routine_items ----------------------------------------------------------

DROP POLICY IF EXISTS "user reads own routine items" ON cosme_check.routine_items;
CREATE POLICY "user reads own routine items"
  ON cosme_check.routine_items
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user inserts own routine items" ON cosme_check.routine_items;
CREATE POLICY "user inserts own routine items"
  ON cosme_check.routine_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user updates own routine items" ON cosme_check.routine_items;
CREATE POLICY "user updates own routine items"
  ON cosme_check.routine_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user deletes own routine items" ON cosme_check.routine_items;
CREATE POLICY "user deletes own routine items"
  ON cosme_check.routine_items
  FOR DELETE
  USING (auth.uid() = user_id);
