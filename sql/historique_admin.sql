-- ProgMeca — Garder la note d'une copie supprimée par un gâcheur
-- Quand tu supprimes une copie, l'application range d'abord sa note dans
-- l'historique. La base ne l'autorisait qu'à l'aspirant lui-même :
-- sans ce correctif, la copie est bien supprimée mais la note n'est pas archivée.
-- Supabase > SQL Editor > Run. Sans risque, rejouable.
DROP POLICY IF EXISTS "historique_ecriture_admin" ON historique_tentatives;
CREATE POLICY "historique_ecriture_admin" ON historique_tentatives FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profils WHERE id = auth.uid() AND role = 'admin'));
NOTIFY pgrst, 'reload schema';

-- Vérification : deux lignes INSERT doivent apparaître
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'historique_tentatives' ORDER BY cmd;
