-- ═══════════════════════════════════════════════════════════════
-- ProgMeca — Rattrapages : suivi des copies et protection contre les copies vides
-- Supabase > SQL Editor > colle tout le fichier > Run. Sans risque, rejouable.
-- ═══════════════════════════════════════════════════════════════

-- 1. Suivi : pour chaque copie, la version de l'application qui l'a envoyée
--    et l'heure à laquelle l'aspirant a commencé. Tu verras la durée dans
--    la correction, et un badge rouge si une copie part en quelques secondes.
ALTER TABLE tentatives ADD COLUMN IF NOT EXISTS version_app TEXT;
ALTER TABLE tentatives ADD COLUMN IF NOT EXISTS commence_le TIMESTAMPTZ;

-- 2. Filet de sécurité : pendant un rattrapage, une copie SANS AUCUNE réponse
--    est refusée. C'est exactement ce qu'envoient les anciennes versions
--    restées en mémoire sur certains téléphones : la copie existante et le
--    rattrapage restent alors intacts, l'aspirant n'a qu'à rouvrir l'application.
--    Les gâcheurs ne sont pas concernés (copies papier créées à la main).
CREATE OR REPLACE FUNCTION refuser_copie_vide_rattrapage()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM profils WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN NEW;
  END IF;
  IF (jsonb_typeof(NEW.reponses) IS DISTINCT FROM 'object' OR NEW.reponses = '{}'::jsonb)
     AND EXISTS (SELECT 1 FROM quiz q WHERE q.id = NEW.quiz_id AND q.mode_examen = TRUE)
     AND EXISTS (SELECT 1 FROM rattrapages r WHERE r.quiz_id = NEW.quiz_id AND r.aspirant_id = NEW.aspirant_id)
  THEN
    RAISE EXCEPTION 'Copie vide refusée : rattrapage en cours, ferme et rouvre l application';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_copie_vide_rattrapage ON tentatives;
CREATE TRIGGER trg_copie_vide_rattrapage
BEFORE INSERT ON tentatives
FOR EACH ROW EXECUTE FUNCTION refuser_copie_vide_rattrapage();

NOTIFY pgrst, 'reload schema';

-- 3. Vérification : toutes les copies rendues APRÈS la fin de leur créneau
--    (donc en rattrapage). Colonne « correctif » : « après » = rendue après la
--    mise en ligne du correctif (28/10 à 9h14). Une copie « après » avec
--    0 réponse vient d'un téléphone resté sur une ancienne version.
SELECT q.titre AS examen,
       p.prenom || ' ' || p.nom AS aspirant,
       to_char(t.completed_at AT TIME ZONE 'Europe/Paris', 'DD/MM HH24:MI') AS rendue_le,
       CASE WHEN t.completed_at >= '2026-10-28 09:14:00+01' THEN 'après' ELSE 'avant' END AS correctif,
       COALESCE((SELECT COUNT(*) FROM jsonb_object_keys(
         CASE WHEN jsonb_typeof(t.reponses) = 'object' THEN t.reponses ELSE '{}'::jsonb END)), 0) AS reponses,
       (SELECT COUNT(*) FROM questions WHERE quiz_id = t.quiz_id) AS questions,
       EXISTS (SELECT 1 FROM rattrapages r WHERE r.quiz_id = t.quiz_id AND r.aspirant_id = t.aspirant_id) AS acces_encore_ouvert
FROM tentatives t
JOIN quiz q ON q.id = t.quiz_id
LEFT JOIN profils p ON p.id = t.aspirant_id
WHERE q.mode_examen = TRUE
  AND q.date_fin IS NOT NULL
  AND t.completed_at > q.date_fin
ORDER BY t.completed_at DESC;
