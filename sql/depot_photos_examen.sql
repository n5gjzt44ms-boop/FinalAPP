-- ProgMeca — Autoriser les aspirants à déposer la photo de leur schéma
-- Jusqu'ici, seuls les gâcheurs pouvaient déposer un fichier dans le stockage :
-- la photo d'un schéma fait à la main était refusée pendant l'examen.
-- Chaque aspirant peut désormais déposer UNIQUEMENT dans son propre dossier :
--   reponses-libres/<son identifiant>/...   (réponses d'examen)
--   rendus/<devoir>/<son identifiant>/...   (devoirs à rendre)
-- Supabase > SQL Editor > Run. Sans risque, rejouable.

DROP POLICY IF EXISTS "depot_reponses_aspirants" ON storage.objects;
CREATE POLICY "depot_reponses_aspirants" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ressources'
  AND (
    ((storage.foldername(name))[1] = 'reponses-libres' AND (storage.foldername(name))[2] = auth.uid()::text)
    OR ((storage.foldername(name))[1] = 'rendus' AND (storage.foldername(name))[3] = auth.uid()::text)
  )
);

-- Vérification : la règle « depot_reponses_aspirants » doit apparaître,
-- et la dernière ligne montre la taille maximale acceptée par le stockage.
SELECT 'regle' AS quoi, policyname AS nom, cmd AS detail
FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
UNION ALL
SELECT 'stockage', id, 'taille max = ' || COALESCE((file_size_limit/1024/1024)::text || ' Mo', 'pas de limite')
FROM storage.buckets WHERE id = 'ressources';
