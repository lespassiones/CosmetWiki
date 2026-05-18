-- 0009 — Sitemap : RPC retournant les slugs en JSONB array.
--
-- Le PostgREST API plafonne par défaut les réponses à `db.max_rows = 1000`,
-- peu importe le LIMIT interne d'une fonction. La RPC existante
-- `cosme_check_list_active_slugs` retourne 1000 slugs côté API (alors qu'elle
-- en lit ~15 700 côté Postgres), ce qui tronque le sitemap.
--
-- Astuce : si la RPC retourne UN SEUL row (un tableau JSONB), le cap
-- `db.max_rows` ne s'applique pas — il porte sur le NOMBRE de rows, pas leur
-- taille. On obtient donc tous les slugs en une seule réponse JSON.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cosme_check_list_active_slugs_json()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, cosme_check
AS $$
  SELECT COALESCE(jsonb_agg(slug ORDER BY id), '[]'::jsonb)
  FROM cosme_check.ingredients
  WHERE slug IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.cosme_check_list_active_slugs_json() TO anon, authenticated;

COMMENT ON FUNCTION public.cosme_check_list_active_slugs_json() IS
  'Retourne tous les slugs d''ingrédient actifs sous forme de tableau JSONB. '
  'Contourne le cap db.max_rows = 1000 de PostgREST en renvoyant un seul row. '
  'Utilisé par app/sitemap.ts pour énumérer toutes les pages /i/[slug].';
