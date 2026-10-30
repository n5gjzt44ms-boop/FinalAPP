-- ═══════════════════════════════════════════════════════════════
-- ProgMeca — Metier de chaque inscrit
-- A executer dans Supabase : SQL Editor > New query > Run
-- Sans risque, rejouable.
--
-- Seuls les mecaniciens suivent les modules et passent les examens.
-- Les electrotechniciens et mecaniciens outilleurs ont acces aux
-- cours et ressources (culture metier, suivi de postulants).
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profils ADD COLUMN IF NOT EXISTS metier TEXT DEFAULT 'mecanicien';

-- Les comptes existants sont consideres mecaniciens
UPDATE profils SET metier = 'mecanicien' WHERE metier IS NULL;

NOTIFY pgrst, 'reload schema';

-- VERIFICATION
SELECT metier, COUNT(*) AS nb
FROM profils GROUP BY metier ORDER BY nb DESC;
