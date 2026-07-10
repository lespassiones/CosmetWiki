-- 20260710_beta_testers.sql
-- ============================================================================
-- Programme BÊTA - capture des bêta testeurs (page /beta) + leurs retours.
--
-- ÉPHÉMÈRE : quand la bêta se termine, tout se démonte proprement avec
--   DROP TABLE cosme_check.beta_feedback, cosme_check.beta_testers CASCADE;
--
-- Sécurité : les formulaires /beta et /beta/retour sont PUBLICS (aucune
-- session utilisateur). Les écritures/lectures passent donc par la clé
-- service-role côté serveur. On active RLS SANS aucune policy → anon et
-- authenticated n'ont strictement aucun accès à ces tables ; seul le
-- service-role (qui bypass RLS) peut y toucher.
-- ============================================================================

create table if not exists cosme_check.beta_testers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,          -- stocké en minuscules (normalisé côté code)
  first_name  text,
  consent     boolean not null default false, -- case RGPD obligatoire
  consent_at  timestamptz,
  status      text not null default 'inscrit', -- 'inscrit' | 'feedback_recu'
  token       uuid not null default gen_random_uuid() unique, -- lien de retour perso
  source      text,                            -- provenance éventuelle (utm, canal…)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists cosme_check.beta_feedback (
  id             uuid primary key default gen_random_uuid(),
  beta_tester_id uuid not null
    references cosme_check.beta_testers (id) on delete cascade,
  rating_overall smallint,   -- note globale 1..5
  liked          text,       -- ce qui a plu
  bugs           text,       -- bugs rencontrés
  missing        text,       -- ce qui manque
  recommend      smallint,   -- probabilité de recommander 0..10 (NPS-like)
  created_at     timestamptz not null default now()
);

create index if not exists beta_feedback_tester_idx
  on cosme_check.beta_feedback (beta_tester_id);

alter table cosme_check.beta_testers  enable row level security;
alter table cosme_check.beta_feedback enable row level security;
-- Pas de policy volontairement : accès réservé au service-role côté serveur.
