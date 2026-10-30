-- ═══════════════════════════════════════════════════════════════
-- ProgMeca — Modules valides manuellement
-- A executer dans Supabase : SQL Editor > New query > Run
-- Sans risque, rejouable.
--
-- Permet de marquer un module comme acquis autrement que par les
-- examens de la plateforme : diplome, equivalence, session
-- anterieure a la mise en service de la plateforme.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profils ADD COLUMN IF NOT EXISTS modules_valides INTEGER[] DEFAULT '{}';

NOTIFY pgrst, 'reload schema';

-- VERIFICATION : la colonne doit apparaitre
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profils' AND column_name = 'modules_valides';
