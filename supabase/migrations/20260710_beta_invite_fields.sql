-- 20260710_beta_invite_fields.sql
-- ============================================================================
-- Programme BÊTA — Lot 1. Ajoute le nom de famille (personnalisation des emails)
-- et l'horodatage d'invitation. L'invitation n'est plus envoyée à l'inscription
-- mais lors du « lancement » manuel (bouton admin) : le batch d'invitation ne
-- traite que les inscrits dont invited_at IS NULL.
-- ============================================================================

alter table cosme_check.beta_testers
  add column if not exists last_name  text,
  add column if not exists invited_at timestamptz;
