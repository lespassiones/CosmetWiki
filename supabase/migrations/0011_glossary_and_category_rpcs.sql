-- ===========================================================================
-- 0011 — RPC glossaire & catégories
-- ===========================================================================
-- Deux RPC retournent un JSONB array (1 ligne) pour contourner le cap
-- PostgREST db.max_rows = 1000, comme la RPC du sitemap.
-- ===========================================================================

-- Glossaire alphabétique : ingrédients commençant par une lettre donnée.
-- p_letter accepte 'A'..'Z' ou '0' pour les ingrédients commençant par un
-- chiffre. Comparaison case-insensitive.
CREATE OR REPLACE FUNCTION public.cosme_check_list_ingredients_by_letter(
  p_letter TEXT
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, cosme_check
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'slug', slug,
        'name', name,
        'color_rating', color_rating,
        'prevalence_pct', prevalence_pct
      )
      ORDER BY name
    ),
    '[]'::jsonb
  )
  FROM cosme_check.ingredients
  WHERE slug IS NOT NULL
    AND (
      -- Si p_letter = '0', on liste tout ce qui commence par un chiffre.
      (p_letter = '0' AND slug ~ '^[0-9]')
      OR
      -- Sinon : comparaison case-insensitive sur la première lettre.
      (p_letter <> '0' AND UPPER(LEFT(slug, 1)) = UPPER(p_letter))
    );
$$;

GRANT EXECUTE ON FUNCTION public.cosme_check_list_ingredients_by_letter(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.cosme_check_list_ingredients_by_letter(TEXT) IS
  'Retourne les ingrédients actifs commençant par une lettre donnée, sous forme '
  'de tableau JSONB (1 ligne). Utilisé par /glossaire/[lettre].';

-- ===========================================================================
-- Catégories : ingrédients possédant un tag donné (silicone, paraben,
-- conservateur, filtre-uv, etc.). Le tag est stocké dans la colonne
-- `tags TEXT[]` de cosme_check.ingredients.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.cosme_check_list_ingredients_by_tag(
  p_tag TEXT
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, cosme_check
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'slug', slug,
        'name', name,
        'color_rating', color_rating,
        'prevalence_pct', prevalence_pct
      )
      ORDER BY prevalence_pct DESC NULLS LAST, name
    ),
    '[]'::jsonb
  )
  FROM cosme_check.ingredients
  WHERE slug IS NOT NULL
    AND tags IS NOT NULL
    AND p_tag = ANY(tags);
$$;

GRANT EXECUTE ON FUNCTION public.cosme_check_list_ingredients_by_tag(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.cosme_check_list_ingredients_by_tag(TEXT) IS
  'Retourne les ingrédients actifs portant un tag donné (silicone, paraben, '
  'conservateur, filtre-uv...), triés par prévalence décroissante. '
  'Utilisé par /ingredients/[category].';
