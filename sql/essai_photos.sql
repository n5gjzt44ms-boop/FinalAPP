-- ProgMeca — Retirer les photos de l'examen d'essai
-- Chaque aspirant peut supprimer uniquement ses propres photos d'essai (nom commençant
-- par essai_). Les photos des vrais examens restent impossibles à supprimer pour lui.
-- Supabase > SQL Editor > Run. Sans risque, rejouable.
DROP POLICY IF EXISTS "essai_suppression_aspirant" ON storage.objects;
CREATE POLICY "essai_suppression_aspirant" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'ressources'
  AND (storage.foldername(name))[1] = 'reponses-libres'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND storage.filename(name) LIKE 'essai\_%'
);

-- Vérification : une ligne doit apparaître
SELECT policyname, cmd FROM pg_policies WHERE policyname = 'essai_suppression_aspirant';
