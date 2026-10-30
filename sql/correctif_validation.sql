-- ═══════════════════════════════════════════════════════════════
-- ProgMeca — CORRECTIF : validation des modules par les gacheurs
-- A executer dans Supabase : SQL Editor > New query > Run
-- Sans risque, rejouable.
--
-- Corrige deux points :
--  1. La colonne modules_valides doit exister
--  2. Les gacheurs doivent pouvoir modifier la fiche d'un aspirant
--     (jusqu'ici reserve aux superviseurs, d'ou la validation
--      qui echouait en silence)
-- ═══════════════════════════════════════════════════════════════

-- 1. Colonnes necessaires
ALTER TABLE profils ADD COLUMN IF NOT EXISTS modules_valides INTEGER[] DEFAULT '{}';
ALTER TABLE profils ADD COLUMN IF NOT EXISTS sans_module BOOLEAN DEFAULT FALSE;

-- 2. Un gacheur peut modifier les fiches (le declencheur empeche
--    toujours l'attribution du role admin par un non-superviseur)
DROP POLICY IF EXISTS "profils_modification" ON profils;
CREATE POLICY "profils_modification"
ON profils FOR UPDATE TO authenticated
USING (id = auth.uid() OR est_admin() OR est_superviseur())
WITH CHECK (id = auth.uid() OR est_admin() OR est_superviseur());

-- 3. Le carnet doit accepter une seule ligne par module et par aspirant
--    (necessaire a l'inscription automatique des modules valides)
CREATE UNIQUE INDEX IF NOT EXISTS carnet_unique_module
ON carnet_bord (aspirant_id, module_id);

NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION : les 2 colonnes doivent apparaitre
-- ═══════════════════════════════════════════════════════════════
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profils'
  AND column_name IN ('modules_valides','sans_module')
ORDER BY column_name;
