-- ============================================================
-- 0012 — RPC dédiée pour compter les ingrédients par lettre
-- ============================================================
-- Sans cette RPC, l'index /glossaire fait 27 appels Supabase en parallèle
-- (un par lettre) qui chacun renvoie la liste COMPLÈTE des ingrédients de
-- cette lettre, juste pour afficher un compteur. ~1 Mo de payload pour
-- rendre 27 nombres. Cette RPC remplace ça par une seule requête qui
-- renvoie un dictionnaire JSON { "A": 1285, "B": 700, ... "0": 154 }.
-- ============================================================
CREATE OR REPLACE FUNCTION public.cosme_check_letter_counts()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, cosme_check
AS $$
  WITH grouped AS (
    SELECT
      CASE
        WHEN slug ~ '^[0-9]' THEN '0'
        ELSE UPPER(LEFT(slug, 1))
      END AS letter,
      COUNT(*) AS count
    FROM cosme_check.ingredients
    WHERE slug IS NOT NULL
    GROUP BY 1
  )
  SELECT COALESCE(jsonb_object_agg(letter, count), '{}'::jsonb)
  FROM grouped;
$$;

GRANT EXECUTE ON FUNCTION public.cosme_check_letter_counts() TO anon, authenticated;

COMMENT ON FUNCTION public.cosme_check_letter_counts() IS
  'Retourne un dictionnaire { "A": 1285, ... } des comptes d''ingrédients '
  'par première lettre du slug. Remplace 27 appels by_letter pour la page index.';
