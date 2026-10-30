-- ═══════════════════════════════════════════════════════════════
-- ProgMeca — Archivage des examens
-- A executer dans Supabase : SQL Editor > New query > Run
-- Sans risque, rejouable.
--
-- Permet de retirer un examen de la circulation sans le supprimer,
-- puis de le reutiliser plusieurs annees plus tard.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE quiz ADD COLUMN IF NOT EXISTS archive BOOLEAN DEFAULT FALSE;

-- Les quiz existants ne sont pas archives
UPDATE quiz SET archive = FALSE WHERE archive IS NULL;

NOTIFY pgrst, 'reload schema';

-- VERIFICATION : la colonne doit apparaitre
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'quiz' AND column_name = 'archive';
