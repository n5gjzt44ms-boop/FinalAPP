-- Bonnes reponses des examens : etape 1, a passer AVANT ou AVEC la mise en ligne
-- de la v2026.11.25 (demande de Benoit, 25/11/2026). Sans effet visible.
--
-- Probleme : tout compte connecte pouvait lire par l'API les bonnes reponses
-- des examens (table questions), y compris avant et pendant l'examen, et
-- pouvait envoyer lui-meme une copie d'examen deja « validee » (la note
-- etait calculee sur le telephone et recopiee telle quelle).
--
-- 1) La note d'une copie envoyee par un aspirant est calculee par la base
--    (meme bareme que l'appli : pointsMulti pour les choix multiples, note sur
--    20 arrondie, validee a partir de 14 seulement pour un exercice sans
--    question libre). Un examen part toujours « a corriger ».
-- 2) Vue questions_eleve : les questions SANS les bonnes reponses, pour les
--    aspirants (examen visible a partir de son debut, ou en rattrapage).
-- 3) Fonction corrige_quiz : les bonnes reponses d'un examen, seulement pour
--    un gacheur, ou pour l'aspirant dont la copie est corrigee et le creneau fini.
--
-- L'etape 2 (sql/reponses_cachees_2_fermeture.sql) ferme ensuite la table
-- questions aux non-gacheurs pour les examens. Rejouable.
--
-- AVANT de l'executer pour de bon : verifier dans une transaction annulee que
-- le declencheur redonne la note deja enregistree sur les vraies copies
-- (un declencheur en erreur empecherait TOUTE copie de partir).

-- 1) Note calculee par la base
CREATE OR REPLACE FUNCTION public.noter_copie()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q       record;
  pts     numeric;
  gagne   numeric;
  score   numeric := 0;
  total   numeric := 0;
  rep     jsonb;
  bonnes  int[];
  justes  int;
  fausses int;
  libres  boolean := false;
  examen  boolean := false;
  comp    jsonb := '{}'::jsonb;
  sur20   int;
BEGIN
  -- Copie creee par un gacheur (copie papier, correction) : laissee telle quelle
  IF est_admin() THEN
    RETURN NEW;
  END IF;
  SELECT coalesce(z.mode_examen, false) INTO examen FROM quiz z WHERE z.id = NEW.quiz_id;
  examen := coalesce(examen, false);   -- quiz introuvable : SELECT INTO donne NULL
  FOR q IN
    SELECT x.id, x.type_question, x.bonne_reponse, to_jsonb(x.bonnes_reponses) AS bonnes, x.points, x.competence
    FROM questions x WHERE x.quiz_id = NEW.quiz_id
  LOOP
    pts := coalesce(nullif(q.points, 0), 2);
    total := total + pts;
    IF q.type_question = 'libre' THEN
      libres := true;
      CONTINUE;
    END IF;
    rep := coalesce(NEW.reponses, '{}'::jsonb) -> (q.id::text);
    gagne := 0;
    IF q.type_question = 'multi' THEN
      SELECT coalesce(array_agg(e::int), '{}') INTO bonnes
      FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(q.bonnes) = 'array' THEN q.bonnes ELSE '[]'::jsonb END) e
      WHERE e ~ '^-?[0-9]+$';
      IF array_length(bonnes, 1) > 0 AND jsonb_typeof(rep) = 'array' THEN
        SELECT count(*) FILTER (WHERE r::int = ANY (bonnes)), count(*) FILTER (WHERE NOT (r::int = ANY (bonnes)))
        INTO justes, fausses
        FROM jsonb_array_elements_text(rep) r WHERE r ~ '^-?[0-9]+$';
        gagne := round(greatest(0, (justes - fausses)::numeric / array_length(bonnes, 1)) * pts * 100) / 100;
      END IF;
    ELSIF jsonb_typeof(rep) = 'number' AND (rep #>> '{}')::numeric = q.bonne_reponse THEN
      gagne := pts;
    END IF;
    score := score + gagne;
    IF coalesce(q.competence, '') <> '' THEN
      comp := jsonb_set(comp, ARRAY[q.competence], jsonb_build_object(
        'score', coalesce((comp -> q.competence ->> 'score')::numeric, 0) + gagne,
        'total', coalesce((comp -> q.competence ->> 'total')::numeric, 0) + pts));
    END IF;
  END LOOP;
  sur20 := CASE WHEN total > 0 THEN round(score / total * 20) ELSE 0 END;
  NEW.score := sur20;
  NEW.total_points := 20;
  NEW.valide := NOT (libres OR examen) AND sur20 >= 14;
  NEW.resultats_par_competence := comp;
  NEW.notes_libres := CASE WHEN libres OR examen THEN '{}'::jsonb ELSE NULL END;
  NEW.note_admin := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_noter_copie ON public.tentatives;
CREATE TRIGGER trg_noter_copie
  BEFORE INSERT ON public.tentatives
  FOR EACH ROW EXECUTE FUNCTION public.noter_copie();

-- 2) Questions sans les bonnes reponses
CREATE OR REPLACE VIEW public.questions_eleve WITH (security_invoker = false) AS
SELECT x.id, x.quiz_id, x.ordre, x.enonce, x.type_question, x.options, x.points,
       x.competence, x.image_url, x.medias, x.media_url
FROM public.questions x
JOIN public.quiz z ON z.id = x.quiz_id
WHERE auth.uid() IS NOT NULL
  AND (
       public.est_admin()
    OR (NOT coalesce(z.mode_examen, false) AND z.actif)
    -- Examen : a partir de son debut (10 min de marge pour l'heure des telephones)
    OR (z.mode_examen AND z.actif AND (z.date_debut IS NULL OR z.date_debut <= now() + interval '10 minutes'))
    OR EXISTS (SELECT 1 FROM public.rattrapages r WHERE r.quiz_id = z.id AND r.aspirant_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.tentatives t WHERE t.quiz_id = z.id AND t.aspirant_id = auth.uid())
  );

REVOKE ALL ON public.questions_eleve FROM PUBLIC, anon;
GRANT SELECT ON public.questions_eleve TO authenticated;

-- 3) Bonnes reponses, une fois le droit acquis
CREATE OR REPLACE FUNCTION public.corrige_quiz(p_quiz uuid)
RETURNS TABLE (id uuid, bonne_reponse integer, bonnes_reponses jsonb, reponse_type text, reponse_medias jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT x.id, x.bonne_reponse, to_jsonb(x.bonnes_reponses), x.reponse_type, x.reponse_medias
  FROM questions x
  JOIN quiz z ON z.id = x.quiz_id
  WHERE x.quiz_id = p_quiz
    AND auth.uid() IS NOT NULL
    AND (
         est_admin()
      OR NOT coalesce(z.mode_examen, false)
      OR ((z.date_fin IS NULL OR z.date_fin < now())
          AND EXISTS (SELECT 1 FROM tentatives t
                      WHERE t.quiz_id = z.id AND t.aspirant_id = auth.uid() AND t.note_admin IS NOT NULL))
    )
$$;

REVOKE EXECUTE ON FUNCTION public.corrige_quiz(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.corrige_quiz(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.noter_copie() FROM PUBLIC, anon, authenticated;

-- Verification : 4 lignes attendues, toutes a « ok »
SELECT 'declencheur de note' AS controle,
       CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_noter_copie') THEN 'ok' ELSE 'NON' END AS etat
UNION ALL SELECT 'vue sans reponses',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'questions_eleve')
             AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions_eleve'
                             AND column_name IN ('bonne_reponse', 'bonnes_reponses', 'reponse_type', 'reponse_medias', 'justification', 'reponse_libre'))
            THEN 'ok' ELSE 'NON' END
UNION ALL SELECT 'vue fermee aux visiteurs',
       CASE WHEN NOT has_table_privilege('anon', 'public.questions_eleve', 'SELECT') THEN 'ok' ELSE 'NON' END
UNION ALL SELECT 'corrige_quiz fermee aux visiteurs',
       CASE WHEN NOT has_function_privilege('anon', 'public.corrige_quiz(uuid)', 'EXECUTE') THEN 'ok' ELSE 'NON' END;
