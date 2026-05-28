-- ============================================================
-- 20260529 : stockage persistant des produits découverts
-- ============================================================
-- Jusqu'ici, les produits trouvés via le web (cascade, web search,
-- scan code-barres) n'atterrissaient que dans product_inci_cache
-- (table volatile, potentiellement purgeable). Ce patch :
--
--  1. Rend les colonnes score nullable dans catalog → on peut insérer
--     un produit découvert AVANT qu'une analyse complète soit faite.
--     score = NULL = "non encore analysé".
--  2. Crée la RPC cosme_check_upsert_catalog_product (SECURITY DEFINER,
--     service_role) pour upsert atomique avec logique de merge :
--     - Ne jamais écraser une donnée existante par NULL
--     - Ne mettre à jour le score que si la valeur entrante est non-NULL
--       (i.e. une vraie analyse, pas une simple découverte)
--
-- Impact sur les RPCs existantes :
--   - cosme_check_search_catalog : ORDER BY score DESC → NULLs LAST (ok)
--   - cosme_check_browse_subcategory : WHERE count_total >= 5 → les
--     nouveaux produits sans count_total n'apparaissent pas dans le
--     browse tant qu'ils n'ont pas été analysés (comportement voulu).
-- ============================================================

-- 1. Rendre les colonnes score nullable
ALTER TABLE cosme_check.catalog
  ALTER COLUMN score       DROP NOT NULL,
  ALTER COLUMN score_label DROP NOT NULL,
  ALTER COLUMN score_tone  DROP NOT NULL;

-- 2. RPC upsert persistant
-- Note: ON CONFLICT DO UPDATE ne protège pas le INSERT initial contre les
-- contraintes NOT NULL (name NOT NULL). Solution : IF EXISTS → UPDATE,
-- ELSIF name fourni → INSERT, sinon no-op.
CREATE OR REPLACE FUNCTION cosme_check_upsert_catalog_product(
  p_ean              TEXT,
  p_brand            TEXT    DEFAULT NULL,
  p_name             TEXT    DEFAULT NULL,
  p_ingredients_text TEXT    DEFAULT NULL,
  p_source_url       TEXT    DEFAULT NULL,
  p_category         TEXT    DEFAULT NULL,
  p_score            REAL    DEFAULT NULL,
  p_score_label      TEXT    DEFAULT NULL,
  p_score_tone       TEXT    DEFAULT NULL,
  p_count_total      INT     DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cosme_check, public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM cosme_check.catalog WHERE ean = p_ean) THEN
    -- Ligne existante : mettre à jour uniquement les champs non-NULL entrants.
    UPDATE cosme_check.catalog SET
      brand            = COALESCE(p_brand,            brand),
      name             = COALESCE(p_name,             name),
      ingredients_text = COALESCE(p_ingredients_text, ingredients_text),
      source_url       = COALESCE(p_source_url,       source_url),
      category         = COALESCE(p_category,         category),
      count_total      = COALESCE(p_count_total,      count_total),
      score       = CASE WHEN p_score IS NOT NULL THEN p_score       ELSE score       END,
      score_label = CASE WHEN p_score IS NOT NULL THEN p_score_label ELSE score_label END,
      score_tone  = CASE WHEN p_score IS NOT NULL THEN p_score_tone  ELSE score_tone  END
    WHERE ean = p_ean;
  ELSIF p_name IS NOT NULL THEN
    -- Nouvelle ligne : INSERT seulement si le champ obligatoire name est fourni.
    INSERT INTO cosme_check.catalog
      (ean, brand, name, ingredients_text, source_url, category,
       score, score_label, score_tone, count_total)
    VALUES
      (p_ean, p_brand, p_name, p_ingredients_text, p_source_url, p_category,
       p_score, p_score_label, p_score_tone, p_count_total);
  END IF;
  -- Si la ligne n'existe pas ET p_name est NULL : no-op.
END;
$$;

GRANT EXECUTE ON FUNCTION cosme_check_upsert_catalog_product(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, REAL, TEXT, TEXT, INT)
  TO service_role;
