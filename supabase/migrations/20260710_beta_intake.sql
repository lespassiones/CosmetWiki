-- 20260710_beta_intake.sql
-- ============================================================================
-- Programme BÊTA - questionnaire AVANT (persona / validation).
-- Rempli sur /beta AVANT d'obtenir l'accès. Stocké en jsonb (souple : les
-- questions ne sont pas figées) et consultable par testeur dans l'admin.
-- ============================================================================

alter table cosme_check.beta_testers
  add column if not exists intake jsonb;
