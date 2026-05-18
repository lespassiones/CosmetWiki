-- 0013_user_profile_first_name_from_oauth.sql
-- ============================================================================
-- Fixes Google OAuth sign-ups landing in user_profiles.first_name = 'Utilisateur'.
-- Google supplies `name` / `full_name` (e.g. "Stela BIENDOU") and `given_name`,
-- but never `first_name`, so the old trigger always fell through to the default.
--
-- Changes:
--   (A) Add helpers to derive a clean first name from raw_user_meta_data or email.
--   (B) Replace handle_new_user() with the richer derivation. New Google sign-ups
--       land with a real first name from now on.
--   (C) Backfill existing profiles still stuck on 'Utilisateur'.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- (A) Helpers
-- ---------------------------------------------------------------------------

-- "STELA" → "Stela", "will" → "Will"
CREATE OR REPLACE FUNCTION cosme_check.capitalise_token(token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN token IS NULL OR length(token) = 0 THEN ''
    ELSE upper(substring(token, 1, 1)) || lower(substring(token, 2))
  END;
$$;

-- "will biendou" → "Will", "Stela BIENDOU" → "Stela"
CREATE OR REPLACE FUNCTION cosme_check.first_word_capitalised(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT cosme_check.capitalise_token(
    (regexp_split_to_array(coalesce(trim(value), ''), '\s+'))[1]
  );
$$;

-- "stela.biendou@gmail.com" → "Stela", "manno42@x.com" → "Manno",
-- "stelabiendou@gmail.com" → "Stelabiendou"
CREATE OR REPLACE FUNCTION cosme_check.derive_first_name_from_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT cosme_check.capitalise_token(
    regexp_replace(
      (regexp_split_to_array(split_part(coalesce(email, ''), '@', 1), '[._\-+]'))[1],
      '\d+$', ''
    )
  );
$$;

-- Mirrors the TS deriveFirstName() in lib/auth.ts. Priority:
--   1. raw_user_meta_data.first_name (email/password sign-up)
--   2. raw_user_meta_data.given_name (Google preferred field)
--   3. first word of raw_user_meta_data.name (Google display name)
--   4. first word of raw_user_meta_data.full_name
--   5. capitalised local part of the email
--   6. 'Utilisateur' as last resort
CREATE OR REPLACE FUNCTION cosme_check.derive_first_name(meta jsonb, email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(cosme_check.capitalise_token(NULLIF(trim(coalesce(meta->>'first_name', '')), '')), ''),
    NULLIF(cosme_check.capitalise_token(NULLIF(trim(coalesce(meta->>'given_name', '')), '')), ''),
    NULLIF(cosme_check.first_word_capitalised(meta->>'name'), ''),
    NULLIF(cosme_check.first_word_capitalised(meta->>'full_name'), ''),
    NULLIF(cosme_check.derive_first_name_from_email(email), ''),
    'Utilisateur'
  );
$$;

-- ---------------------------------------------------------------------------
-- (B) New sign-ups: enrich the trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION cosme_check.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'cosme_check', 'public'
AS $function$
BEGIN
  INSERT INTO cosme_check.user_profiles (id, first_name)
  VALUES (
    NEW.id,
    cosme_check.derive_first_name(NEW.raw_user_meta_data, NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- (C) Existing accounts: one-shot backfill
-- Only overwrite rows that are still on the legacy default and where we have a
-- better derivation - we never replace a real name with another real name.
-- ---------------------------------------------------------------------------

UPDATE cosme_check.user_profiles p
SET first_name = src.derived,
    updated_at = now()
FROM (
  SELECT u.id,
         cosme_check.derive_first_name(u.raw_user_meta_data, u.email) AS derived
  FROM auth.users u
) src
WHERE p.id = src.id
  AND src.derived <> 'Utilisateur'
  AND (p.first_name IS NULL OR btrim(p.first_name) = '' OR p.first_name = 'Utilisateur');
