-- ProgMeca — Date limite des rattrapages
-- Supabase > SQL Editor > Run. Sans risque, rejouable.
ALTER TABLE rattrapages ADD COLUMN IF NOT EXISTS date_limite TIMESTAMPTZ;
NOTIFY pgrst, 'reload schema';

-- Rattrapages deja ouverts sans limite (a rouvrir avec une date depuis l'application)
SELECT q.titre, p.prenom, p.nom, r.created_at, r.date_limite
FROM rattrapages r
LEFT JOIN quiz q ON q.id = r.quiz_id
LEFT JOIN profils p ON p.id = r.aspirant_id
ORDER BY q.titre, p.nom;
