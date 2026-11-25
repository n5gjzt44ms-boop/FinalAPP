-- Bonnes reponses des examens : etape 2, a passer APRES la mise en ligne de la
-- v2026.11.25 (qui lit les examens dans la vue questions_eleve) et APRES
-- sql/reponses_cachees_1_preparation.sql. Pas pendant un examen.
--
-- La table questions n'est plus lisible par un non-gacheur pour les EXAMENS
-- (un aspirant passe par la vue questions_eleve, sans les bonnes reponses).
-- Les exercices restent lisibles en entier : l'appli montre la bonne reponse
-- juste apres chaque question.
-- Les anciennes versions de l'appli se mettent a jour seules avant un examen
-- (miseAJourAvantExamen, depuis le 29/10). Rejouable.

DROP POLICY IF EXISTS questions_select_all ON public.questions;
DROP POLICY IF EXISTS questions_lecture ON public.questions;
CREATE POLICY questions_lecture ON public.questions
  FOR SELECT TO authenticated
  USING (
    public.est_admin()
    OR NOT EXISTS (SELECT 1 FROM public.quiz z WHERE z.id = quiz_id AND coalesce(z.mode_examen, false))
  );

-- Verification : 2 lignes attendues, toutes a « ok »
SELECT 'questions : plus de lecture pour tous' AS controle,
       CASE WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'questions' AND policyname = 'questions_select_all') THEN 'ok' ELSE 'NON' END AS etat
UNION ALL SELECT 'questions : examens reserves aux gacheurs',
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'questions' AND policyname = 'questions_lecture' AND qual LIKE '%mode_examen%') THEN 'ok' ELSE 'NON' END;
