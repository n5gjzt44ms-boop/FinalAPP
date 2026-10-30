-- ═══════════════════════════════════════════════════════════════
-- ProgMeca — Corrige de reference attache a un examen
-- A executer dans Supabase : SQL Editor > New query > Run
-- Sans risque, rejouable.
--
-- Permet d'attacher un document de correction detaillee (Word, PDF,
-- image) a chaque examen. Visible des gacheurs uniquement, il reste
-- attache meme apres archivage : les formateurs des annees suivantes
-- savent ce qui etait attendu.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE quiz ADD COLUMN IF NOT EXISTS corrige_path TEXT;
ALTER TABLE quiz ADD COLUMN IF NOT EXISTS corrige_nom TEXT;

NOTIFY pgrst, 'reload schema';

-- VERIFICATION : les 2 colonnes doivent apparaitre
SELECT column_name FROM information_schema.columns
WHERE table_name = 'quiz' AND column_name IN ('corrige_path','corrige_nom')
ORDER BY column_name;
