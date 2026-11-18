-- Ou se situe un aspirant dans le groupe apres un EXERCICE : nombre de
-- participants, moyenne, meilleur score et son rang. Aucun nom, aucune copie.
-- Remplace l'ancien classement, qui lisait les copies des autres : la regle de
-- lecture des copies l'interdit a un aspirant, et la requete echouait (erreur 400).
-- Jamais pour un examen : la fonction ne renvoie rien (pas de note d'examen).
-- Rejouable.

CREATE OR REPLACE FUNCTION public.stats_exercice(p_quiz uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH exo AS (
    SELECT id FROM quiz WHERE id = p_quiz AND NOT COALESCE(mode_examen, false)
  ),
  meilleures AS (  -- la meilleure copie de chaque aspirant ou apprenti
    SELECT t.aspirant_id, max(COALESCE(t.note_admin, t.score)) AS score
    FROM tentatives t
    JOIN exo ON exo.id = t.quiz_id
    JOIN profils p ON p.id = t.aspirant_id AND p.role IN ('aspirant', 'apprenti')
    WHERE t.notes_libres IS NULL OR t.note_admin IS NOT NULL
    GROUP BY t.aspirant_id
  )
  SELECT CASE
    WHEN auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM exo) THEN NULL
    ELSE json_build_object(
      'participants', (SELECT count(*) FROM meilleures),
      'moyenne',      (SELECT round(avg(score)) FROM meilleures),
      'meilleur',     (SELECT max(score) FROM meilleures),
      'mon_score',    (SELECT score FROM meilleures WHERE aspirant_id = auth.uid()),
      'rang',         (SELECT 1 + count(*) FROM meilleures
                       WHERE score > (SELECT score FROM meilleures WHERE aspirant_id = auth.uid()))
    )
  END
$$;

REVOKE ALL ON FUNCTION public.stats_exercice(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stats_exercice(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.stats_exercice(uuid) TO authenticated;

-- Verification : 1 ligne attendue
SELECT p.proname AS fonction, p.prosecdef AS droits_du_proprietaire
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'stats_exercice';
