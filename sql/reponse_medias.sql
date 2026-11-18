-- Image(s) jointe(s) a la bonne reponse d'une question (demande de Benoit, 10/11/2026).
-- Exemple : on demande de dessiner un schema, le gacheur joint le schema attendu.
-- Colonne separee de questions.medias : les anciennes versions de l'application
-- affichent tout ce qui est dans medias AVEC la question. Une image de corrige
-- rangee la serait donc montree pendant l'examen.
-- Format : [{"t":"img","p":"chemin dans le stockage ou adresse","n":"nom"}]
-- Rejouable.

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS reponse_medias jsonb;

COMMENT ON COLUMN public.questions.reponse_medias IS
  'Images de la bonne reponse : affichees a la correction, a la relecture et dans le corrige, jamais pendant un examen';

-- Verification : 1 ligne attendue
SELECT table_name || '.' || column_name AS colonne, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'reponse_medias';
