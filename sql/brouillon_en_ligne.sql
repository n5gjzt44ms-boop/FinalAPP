-- ProgMeca — Copie en cours sauvegardée aussi en ligne
-- Une ligne par personne : la copie qu'elle est en train de passer (sans les photos
-- gardées dans la copie) et un relevé technique au démarrage de l'application.
-- Si le téléphone perd sa mémoire à la fermeture, la copie revient depuis cette table.
-- Chacun ne voit et ne modifie que sa propre ligne.
-- Supabase > SQL Editor > Run. Sans risque, rejouable.
CREATE TABLE IF NOT EXISTS copies_brouillon (
  aspirant_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  quand bigint,
  etat text,
  diag jsonb,
  maj_le timestamptz DEFAULT now()
);
ALTER TABLE copies_brouillon ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brouillon_lecture" ON copies_brouillon;
CREATE POLICY "brouillon_lecture" ON copies_brouillon FOR SELECT TO authenticated
USING (aspirant_id = auth.uid());
DROP POLICY IF EXISTS "brouillon_creation" ON copies_brouillon;
CREATE POLICY "brouillon_creation" ON copies_brouillon FOR INSERT TO authenticated
WITH CHECK (aspirant_id = auth.uid());
DROP POLICY IF EXISTS "brouillon_modification" ON copies_brouillon;
CREATE POLICY "brouillon_modification" ON copies_brouillon FOR UPDATE TO authenticated
USING (aspirant_id = auth.uid()) WITH CHECK (aspirant_id = auth.uid());
NOTIFY pgrst, 'reload schema';

-- Vérification : trois règles doivent apparaître
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'copies_brouillon' ORDER BY cmd;
