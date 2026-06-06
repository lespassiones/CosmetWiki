-- ============================================================================
-- Migration : cosme_check_register_scanned_barcode
-- Objet     : enregistrer un code-barres inconnu dans le catalogue en mode
--             "à compléter" (sans INCI). Permet de tracer les EAN scannés
--             par les utilisateurs avant que la base soit enrichie.
--
-- Comportement :
--   - INSERT avec name = ean (stub) pour satisfaire la contrainte NOT NULL.
--   - ON CONFLICT (ean) DO NOTHING → idempotent, un 2e scan ne réécrit rien.
--   - INCI null → produit masqué (count_total < 5 / ingredients_text vide),
--     ne remonte jamais dans les résultats de recherche ni le browse.
--
-- Consommateurs : routes/Edge Functions `product-by-barcode` (web + mobile),
--   étape finale quand OBF + OPF + cascade + lookup catalog ne trouvent rien.
--
-- Sécurité : SECURITY DEFINER. Grant anon/authenticated pour cohérence avec
--   l'app mobile (service-role bypass RLS côté serveur de toute façon).
--
-- Idempotente : CREATE OR REPLACE FUNCTION.
-- NB : version identique à CosmeCheck-App/supabase/migrations/
--      20260606000000_register_scanned_barcode_rpc.sql (même base Supabase).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cosme_check_register_scanned_barcode(
  p_ean text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cosme_check
AS $$
BEGIN
  INSERT INTO cosme_check.catalog (ean, name)
  VALUES (p_ean, p_ean)
  ON CONFLICT (ean) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cosme_check_register_scanned_barcode(text) TO authenticated, anon;

COMMENT ON FUNCTION public.cosme_check_register_scanned_barcode(text)
  IS 'Enregistre un code-barres scanné mais inconnu dans le catalogue (stub sans INCI). Idempotent. Utilisé par product-by-barcode (web + mobile).';
