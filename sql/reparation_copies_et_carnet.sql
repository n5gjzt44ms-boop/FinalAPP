-- ═══════════════════════════════════════════════════════════════
-- ProgMeca — Copies d'examen et carnets : verification et reparation
-- Supabase > SQL Editor. Lance les blocs UN PAR UN, dans l'ordre.
-- (Supabase n'affiche que le resultat de la derniere requete.)
-- ═══════════════════════════════════════════════════════════════


-- ── 1. LA LISTE DE REFERENCE : toutes les copies d'examen, nom par nom ──
-- C'est ce que l'application doit afficher dans « Toutes les copies ».
SELECT q.titre                                   AS examen,
       COALESCE(p.nom,'(compte inconnu)')        AS nom,
       p.prenom, p.role, p.module_inscrit,
       to_char(t.completed_at AT TIME ZONE 'Europe/Paris','DD/MM HH24:MI') AS rendue_le,
       CASE WHEN t.note_admin IS NULL THEN 'A CORRIGER' ELSE 'corrigee' END AS statut,
       t.note_admin, t.valide,
       jsonb_typeof(t.reponses) AS reponses_presentes
FROM tentatives t
JOIN quiz q      ON q.id = t.quiz_id
LEFT JOIN profils p ON p.id = t.aspirant_id
WHERE q.mode_examen = TRUE
ORDER BY q.titre, p.nom;


-- ── 2. Les droits de correction : la regle UPDATE sur les copies ──
-- Si aucune ligne n'autorise les gacheurs, tes corrections ne sont pas
-- enregistrees (l'application l'affiche maintenant clairement).
SELECT policyname, cmd, qual::text AS condition
FROM pg_policies
WHERE tablename = 'tentatives'
ORDER BY cmd, policyname;


-- ── 3. Carnets faux : module inscrit au carnet SANS 4 examens valides ──
-- et sans validation « acquis hors plateforme ».
SELECT p.nom, p.prenom, cb.module_id,
       (SELECT COUNT(DISTINCT t.quiz_id) FROM tentatives t
          JOIN quiz q ON q.id = t.quiz_id
         WHERE t.aspirant_id = cb.aspirant_id AND t.valide = TRUE
           AND q.mode_examen = TRUE AND q.module_id = cb.module_id) AS examens_valides
FROM carnet_bord cb
LEFT JOIN profils p ON p.id = cb.aspirant_id
WHERE (SELECT COUNT(DISTINCT t.quiz_id) FROM tentatives t
          JOIN quiz q ON q.id = t.quiz_id
         WHERE t.aspirant_id = cb.aspirant_id AND t.valide = TRUE
           AND q.mode_examen = TRUE AND q.module_id = cb.module_id) < 4
  AND NOT (cb.module_id = ANY(COALESCE(p.modules_valides,'{}')))
ORDER BY p.nom;


-- ── 4. REPARATION : retirer ces lignes de carnet creees a tort ──
-- Ne supprime aucune copie, aucune note : seulement les lignes du
-- carnet qui affichaient « validé » apres un seul examen.
DELETE FROM carnet_bord cb
USING profils p
WHERE p.id = cb.aspirant_id
  AND (SELECT COUNT(DISTINCT t.quiz_id) FROM tentatives t
         JOIN quiz q ON q.id = t.quiz_id
        WHERE t.aspirant_id = cb.aspirant_id AND t.valide = TRUE
          AND q.mode_examen = TRUE AND q.module_id = cb.module_id) < 4
  AND NOT (cb.module_id = ANY(COALESCE(p.modules_valides,'{}')));


-- ── 5. Droits de correction pour les gacheurs (si le bloc 2 montre ──
--       qu'aucune regle UPDATE ne les autorise)
DROP POLICY IF EXISTS "tentatives_modification" ON tentatives;
CREATE POLICY "tentatives_modification" ON tentatives
FOR UPDATE TO authenticated
USING (aspirant_id = auth.uid() OR EXISTS (SELECT 1 FROM profils WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (aspirant_id = auth.uid() OR EXISTS (SELECT 1 FROM profils WHERE id = auth.uid() AND role = 'admin'));
NOTIFY pgrst, 'reload schema';


-- ── 6. Les examens a venir : sont-ils publies ? ──
-- Un examen en prive (actif = false) est INVISIBLE pour les aspirants.
SELECT titre, module_id, actif AS publie,
       to_char(date_debut AT TIME ZONE 'Europe/Paris','DD/MM/YYYY HH24:MI') AS debut_paris,
       to_char(date_fin   AT TIME ZONE 'Europe/Paris','DD/MM/YYYY HH24:MI') AS fin_paris
FROM quiz
WHERE mode_examen = TRUE AND date_fin >= NOW()
ORDER BY date_debut;
