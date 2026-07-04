-- ============================================================
-- Backfill missing tags on cosme_check.ingredients
-- ------------------------------------------------------------
-- Three families were under-tagged in the initial seed data,
-- which caused the analyser to report false negatives like "Composés
-- propoxylés absents" or "Ammoniums quaternaires absents" even on formulas
-- that contained obvious offenders (e.g. GUAR HYDROXYPROPYLTRIMONIUM
-- CHLORIDE was tagged with neither). This migration pattern-matches names
-- against the documented INCI suffixes for each family and appends the
-- missing tag in place.
--
-- Audit before migration:
--   ammonium-quaternaire : 177 tagged / 312 candidates by name suffix
--   propoxyle             :   0 tagged / 240 candidates by name (PPG-N)
--   ethoxyle              : 803 tagged / ~826 candidates by name (PEG-N, *eth-N)
--
-- Idempotent: skips rows that already carry the tag.
-- ============================================================

-- 1. ammonium-quaternaire
-- Pattern: INCI suffixes -trimonium, -dimonium, -alkonium, plus Polyquaternium-N.
-- Excludes TRIAMMONIUM CITRATE (a tri-ammonium SALT, not a quaternary ammonium).
UPDATE cosme_check.ingredients
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), 'ammonium-quaternaire')
WHERE (
    name ~* '(trimonium|dimonium|alkonium)'
    OR name ~* 'polyquaternium-?[0-9]'
  )
  AND name !~* '^triammonium\s+citrate$'
  AND NOT ('ammonium-quaternaire' = ANY(COALESCE(tags, ARRAY[]::text[])));

-- 2. propoxyle
-- Pattern: any PPG-N prefix in the name (PPG = polypropylene glycol = chain of
-- propylene oxide units, the propoxylation marker in INCI nomenclature).
UPDATE cosme_check.ingredients
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), 'propoxyle')
WHERE name ~* '(^|[^a-z])ppg-?[0-9]'
  AND NOT ('propoxyle' = ANY(COALESCE(tags, ARRAY[]::text[])));

-- 3. ethoxyle - complete the existing coverage with the obvious cases that
-- were missed (PEG-N prefixes and the -eth-N suffixes for ethoxylated alkyl
-- ethers: Laureth, Ceteareth, Steareth, Oleth, Trideceth, Deceth, etc.).
UPDATE cosme_check.ingredients
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), 'ethoxyle')
WHERE (
    name ~* '(^|[^a-z])peg-?[0-9]'
    OR name ~* '(laureth|ceteareth|steareth|oleth|trideceth|deceth|isoceteth|isolaureth|myreth|beheneth|coceth|isosteareth|nonoxynol|octoxynol)-?[0-9]'
  )
  AND NOT ('ethoxyle' = ANY(COALESCE(tags, ARRAY[]::text[])));
