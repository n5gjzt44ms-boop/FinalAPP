-- ═══════════════════════════════════════════════════════════════
-- ProgMeca - Aspirants en "annee blanche"
-- A executer dans Supabase : SQL Editor > New query > Run
-- Rejouable sans risque.
-- ═══════════════════════════════════════════════════════════════

-- 1. Marque "ne valide pas de module cette annee"
--    L'aspirant garde son statut et l'acces aux cours/exercices,
--    mais aucun examen ni compteur ne lui est propose.
ALTER TABLE profils ADD COLUMN IF NOT EXISTS sans_module BOOLEAN DEFAULT FALSE;


-- 2. Permettre a TOUS les gacheurs (pas seulement aux superviseurs)
--    de modifier la fiche d'un aspirant ou d'un apprenti.
--    Sans cela, seul un superviseur pourrait cocher l'annee blanche.
DROP POLICY IF EXISTS "profils_modification" ON profils;

CREATE POLICY "profils_modification"
ON profils FOR UPDATE TO authenticated
USING (
  id = auth.uid()
  OR est_superviseur()
  OR (est_admin() AND role IN ('aspirant','apprenti'))
)
WITH CHECK (
  id = auth.uid()
  OR est_superviseur()
  OR (est_admin() AND role IN ('aspirant','apprenti'))
);

-- Rappel : le declencheur trg_verrou_role reste actif.
-- Un gacheur ne peut donc pas promouvoir quelqu'un admin :
-- seuls les superviseurs changent les roles.


-- VERIFICATION
SELECT column_name FROM information_schema.columns
WHERE table_name='profils' AND column_name='sans_module';
