-- Question 11 de l'examen « Évaluation : Identifier les composants hydrauliques » (30/11/2026) :
-- une reponse par schema (demande de Benoit, 19/11/2026).
-- Les 4 images (Schéma A a D) sont marquees rep:1 : l'aspirant repond sous chacune.
-- La reponse attendue passe de « A = ... · B = ... » a une ligne par schema.
-- La question est modifiee sur place (meme identifiant) : rien n'est recree ni supprime.
-- Rejouable : relancer donne le meme resultat.

UPDATE public.questions q
SET medias = (
      SELECT jsonb_agg(CASE WHEN e.m->>'t' = 'img' THEN e.m || '{"rep":1}'::jsonb ELSE e.m END ORDER BY e.ord)
      FROM jsonb_array_elements(q.medias) WITH ORDINALITY AS e(m, ord)
    ),
    reponse_type = E'Schéma A : Pression Constante\nSchéma B : Commande à distance\nSchéma C : Load Sensing\nSchéma D : Régulation de puissance'
WHERE q.id = 'f770540e-b959-4359-9b03-6bfadaa3ddef'
  AND q.quiz_id = 'd30dc263-deea-447d-ac22-f1ea761771ad'
  AND jsonb_typeof(q.medias) = 'array';

-- Verification : 1 ligne, 4 schemas marques, 4 lignes de reponse attendue
SELECT q.id,
       (SELECT count(*) FROM jsonb_array_elements(q.medias) m WHERE m->>'rep' = '1') AS schemas_marques,
       array_length(string_to_array(q.reponse_type, E'\n'), 1) AS lignes_attendues,
       q.reponse_type
FROM public.questions q
WHERE q.id = 'f770540e-b959-4359-9b03-6bfadaa3ddef';
