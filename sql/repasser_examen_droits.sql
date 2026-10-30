-- ProgMeca — « Redonner l'accès » à un examen déjà rendu
-- Quand l'aspirant rend sa nouvelle copie, l'ancienne (vide ou buguée)
-- doit être retirée. Jusqu'ici la base interdisait à un aspirant de supprimer
-- une copie d'examen : il se retrouvait avec deux copies.
-- Désormais : il peut retirer SA copie d'examen UNIQUEMENT si un gâcheur
-- lui a redonné l'accès à cet examen. Rien d'autre ne change.
-- Supabase > SQL Editor > Run. Sans risque, rejouable.

DROP POLICY IF EXISTS "tentatives_suppression" ON tentatives;
CREATE POLICY "tentatives_suppression" ON tentatives FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profils WHERE id = auth.uid() AND role = 'admin')
  OR (
    aspirant_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM quiz WHERE quiz.id = tentatives.quiz_id AND quiz.mode_examen = FALSE)
      OR EXISTS (SELECT 1 FROM rattrapages r
                  WHERE r.quiz_id = tentatives.quiz_id AND r.aspirant_id = auth.uid())
    )
  )
);

-- L'aspirant doit pouvoir lire et retirer son propre rattrapage
DROP POLICY IF EXISTS "rattrapages_lecture_own" ON rattrapages;
CREATE POLICY "rattrapages_lecture_own" ON rattrapages FOR SELECT TO authenticated
USING (aspirant_id = auth.uid() OR EXISTS (SELECT 1 FROM profils WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "rattrapages_suppression_own" ON rattrapages;
CREATE POLICY "rattrapages_suppression_own" ON rattrapages FOR DELETE TO authenticated
USING (aspirant_id = auth.uid() OR EXISTS (SELECT 1 FROM profils WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "rattrapages_ecriture_admin" ON rattrapages;
CREATE POLICY "rattrapages_ecriture_admin" ON rattrapages FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profils WHERE id = auth.uid() AND role = 'admin'));
NOTIFY pgrst, 'reload schema';

-- Vérification
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('tentatives','rattrapages') ORDER BY tablename, cmd;
