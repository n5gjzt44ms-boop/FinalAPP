-- ProgMeca — Rattacher chaque exercice à ses cours
-- cours_lies : liste de {"r": id d'une ressource} ou {"u": adresse, "n": nom} pour un document de fabricant.
-- Affichée avant de commencer un exercice. Modifiable dans Quiz et examens (bouton Cours à réviser).
-- Supabase > SQL Editor > Run. Sans risque, rejouable.
ALTER TABLE quiz ADD COLUMN IF NOT EXISTS cours_lies jsonb DEFAULT '[]'::jsonb;
NOTIFY pgrst, 'reload schema';

-- Vérification : une ligne doit apparaître
SELECT column_name FROM information_schema.columns WHERE table_name = 'quiz' AND column_name = 'cours_lies';
