-- ============================================================================
-- Migration : compteur de vues des articles du blog (cosme-check.com/blog)
--
-- Objet : afficher sur chaque article, et dans les cartes de la liste, le
--   vrai nombre de vues (« 👁 N vues »), sur le modèle de Test Civique
--   (`testciviquefrance/supabase/article-views.sql`), sans multiplicateur ni
--   valeur de départ : le chiffre affiché est celui de la table, tel quel.
--
-- Ce qui est stocké : un total par slug, rien d'autre. Ni adresse IP, ni
--   identifiant, ni date de visite : la table ne permet de reconnaître
--   personne.
--
-- Sécurité :
--   - RLS active, lecture publique, aucune politique d'écriture : ni anon ni
--     authenticated ne peuvent insérer, modifier ou supprimer une ligne ;
--   - la seule écriture passe par `public.cosme_check_increment_article_view`,
--     SECURITY DEFINER, qui n'accepte qu'un slug bien formé
--     (`[a-z0-9]` et tirets simples, 80 caractères au plus) et n'ajoute
--     jamais que 1 ;
--   - la lecture du site passe par `public.cosme_check_article_views`, comme
--     toutes les RPC `cosme_check_*` (le schéma `cosme_check` n'est pas exposé
--     à PostgREST), plafonnée à 200 slugs par appel.
--
-- Côté site : `components/blog/VuesArticle.tsx` et `lib/vuesArticles.ts`
--   (une vue par article et par session, après affichage, jamais pour un
--   robot connu ni hors du domaine de production).
--
-- Additive et idempotente : IF NOT EXISTS, CREATE OR REPLACE, DROP POLICY IF
--   EXISTS. Appliquée en production le 23/10/2026.
-- ============================================================================

CREATE TABLE IF NOT EXISTS cosme_check.article_views (
  slug       text        PRIMARY KEY
                         CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 80),
  views      bigint      NOT NULL DEFAULT 0 CHECK (views >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE cosme_check.article_views
  IS 'Vues réelles par article du blog (slug). Écriture uniquement via public.cosme_check_increment_article_view.';

ALTER TABLE cosme_check.article_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "article_views lecture publique" ON cosme_check.article_views;
CREATE POLICY "article_views lecture publique"
  ON cosme_check.article_views
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Aucune écriture directe, même si une politique venait à être ajoutée.
REVOKE ALL ON cosme_check.article_views FROM anon, authenticated, public;
GRANT SELECT ON cosme_check.article_views TO anon, authenticated;
GRANT ALL ON cosme_check.article_views TO service_role;

-- ----------------------------------------------------------------------------
-- Incrément : +1, jamais plus, sur un slug bien formé. Renvoie le nouveau total.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cosme_check_increment_article_view(p_slug text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cosme_check
AS $$
DECLARE
  v_views bigint;
BEGIN
  IF p_slug IS NULL
     OR char_length(p_slug) > 80
     OR p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'slug invalide' USING ERRCODE = '22023';
  END IF;

  INSERT INTO cosme_check.article_views AS v (slug, views)
  VALUES (p_slug, 1)
  ON CONFLICT (slug) DO UPDATE
    SET views = v.views + 1,
        updated_at = now()
  RETURNING v.views INTO v_views;

  RETURN v_views;
END;
$$;

REVOKE ALL ON FUNCTION public.cosme_check_increment_article_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cosme_check_increment_article_view(text) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.cosme_check_increment_article_view(text)
  IS 'Ajoute 1 vue à un article du blog (slug [a-z0-9-], 80 caractères au plus) et renvoie le total. Seule écriture possible sur cosme_check.article_views.';

-- ----------------------------------------------------------------------------
-- Lecture : les totaux d'une liste de slugs (200 au plus). Un slug jamais vu
-- n'a pas de ligne : le site l'affiche à 0.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cosme_check_article_views(p_slugs text[])
RETURNS TABLE (slug text, views bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, cosme_check
AS $$
  SELECT v.slug, v.views
  FROM cosme_check.article_views v
  WHERE v.slug = ANY (p_slugs[1:200]);
$$;

REVOKE ALL ON FUNCTION public.cosme_check_article_views(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cosme_check_article_views(text[]) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.cosme_check_article_views(text[])
  IS 'Vues des articles du blog pour une liste de slugs (200 au plus).';
