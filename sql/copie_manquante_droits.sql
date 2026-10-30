-- ProgMeca — Autoriser les gacheurs a creer une copie au nom d'un aspirant
-- (bouton « copie manquante » : saisie des points d'apres la feuille)
-- Supabase > SQL Editor > Run. Sans risque, rejouable.
-- Les aspirants gardent la meme regle : ils ne deposent QUE leur propre copie.
DROP POLICY IF EXISTS "tentatives_depot" ON tentatives;
CREATE POLICY "tentatives_depot" ON tentatives FOR INSERT TO authenticated
WITH CHECK (
  aspirant_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profils WHERE id = auth.uid() AND role = 'admin')
);
NOTIFY pgrst, 'reload schema';

-- Verification : la regle INSERT doit mentionner role = 'admin'
SELECT policyname, cmd, with_check::text AS condition
FROM pg_policies WHERE tablename = 'tentatives' AND cmd = 'INSERT';
