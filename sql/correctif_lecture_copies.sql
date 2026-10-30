-- ═══════════════════════════════════════════════════════════════
-- ProgMeca — Les gacheurs doivent voir TOUTES les copies
-- A executer dans Supabase : SQL Editor > New query > Run
--
-- Les copies existent en base (visibles ici), mais l'application
-- ne les affiche pas : la regle de lecture limite probablement
-- chaque utilisateur a ses propres copies.
-- ═══════════════════════════════════════════════════════════════

-- 1. DIAGNOSTIC : quelles regles de lecture existent ?
SELECT policyname, cmd, qual::text AS condition
FROM pg_policies
WHERE tablename = 'tentatives'
ORDER BY cmd, policyname;


-- ═══════════════════════════════════════════════════════════════
-- 2. CORRECTIF — a executer apres avoir lu le diagnostic ci-dessus
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "tentatives_select_own" ON tentatives;
DROP POLICY IF EXISTS "tentatives_select_admin" ON tentatives;
DROP POLICY IF EXISTS "tentatives_lecture" ON tentatives;

-- Chacun voit ses propres copies ; les gacheurs voient toutes les copies
CREATE POLICY "tentatives_lecture"
ON tentatives FOR SELECT TO authenticated
USING (
  aspirant_id = auth.uid()
  OR est_admin()
  OR EXISTS (SELECT 1 FROM profils
             WHERE id = auth.uid()
               AND role IN ('admin','ancien','compagnon'))
);

NOTIFY pgrst, 'reload schema';


-- 3. VERIFICATION : doit renvoyer le nombre total de copies
SELECT COUNT(*) AS copies_totales FROM tentatives;
