-- ProgMeca — Une même copie ne peut pas arriver deux fois
-- Si le réseau coupe juste après l'envoi, le téléphone renvoie la copie sans savoir
-- que la première est arrivée. Même aspirant, même quiz, même heure de début = même copie :
-- la base refuse la seconde. Les rattrapages et les exercices refaits ont une autre heure
-- de début : ils ne sont pas concernés. Les anciennes copies (sans heure de début) non plus.
-- Mettre en ligne l'application d'abord, puis Supabase > SQL Editor > Run. Sans risque, rejouable.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tentative_envoi
ON tentatives (aspirant_id, quiz_id, commence_le)
WHERE commence_le IS NOT NULL;

-- Vérification : une ligne doit apparaître
SELECT indexname FROM pg_indexes WHERE indexname = 'uniq_tentative_envoi';
