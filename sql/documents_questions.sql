-- Exercices : le document a consulter est mis en face de la question, et la
-- source n'est plus ecrite dans l'explication (demande de Benoit, 09/11/2026).
-- Les aspirants ont deja les documents au debut de l'exercice (quiz.cours_lies).
-- Rejouable : les sources sont archivees avant d'etre retirees, un document deja
-- present n'est pas ajoute deux fois. Les examens ne sont pas touches.

-- 1) Archive des sources retirees des explications (consultable par SQL)
CREATE TABLE IF NOT EXISTS public.questions_sources (
  question_id uuid PRIMARY KEY,
  source      text NOT NULL,
  archive_le  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.questions_sources ENABLE ROW LEVEL SECURITY;

INSERT INTO public.questions_sources (question_id, source)
SELECT x.id, substring(x.reponse_type from 'Sources?\s*:\s*([^\n]*)$')
FROM public.questions x JOIN public.quiz q ON q.id = x.quiz_id
WHERE NOT coalesce(q.mode_examen, false)
  AND x.reponse_type ~ 'Sources?\s*:\s*[^\n]*$'
ON CONFLICT (question_id) DO NOTHING;

-- 2) Document a consulter, en tete des medias de la question (type "lien" :
--    bouton qui ouvre le document dans un onglet separe)
WITH docs(rang, qid, url, nom) AS (VALUES
  (1,'166de0bb-cf58-4db8-98af-6c74bd8ee20c'::uuid,'https://help.bdsbearing.com/hubfs/Knowledge%20Base/Gates/Gates%20Industrial%20Belt%20and%20Drive%20Preventative%20Maintenance.pdf','Gates : guide de maintenance des courroies (E2/20087), pages 4 et 5'),
  (1,'3212c9b4-0981-4402-83e2-823abf10cc68','https://help.bdsbearing.com/hubfs/Knowledge%20Base/Gates/Gates%20Industrial%20Belt%20and%20Drive%20Preventative%20Maintenance.pdf','Gates : guide de maintenance des courroies (E2/20087), page 7'),
  (1,'1043f5c2-c125-45e8-9209-e5cbe72eb055','https://tsubaki.ca/wp-content/uploads/installation-and-maintenance-manual-tsubaki-canada.pdf','Tsubaki : manuel des chaînes à rouleaux (TCLI&M06), pages 5 et 31'),
  (1,'7ae4de78-5a14-49a5-a837-5f0824a4c6bd','https://hydraulicsonline.com/wp-content/uploads/2022/07/Hydac-Standard-Bladder-Accumulators.pdf','HYDAC : catalogue des accumulateurs à vessie (3.201), pages 31 et 35'),
  (1,'22c02b3c-3e45-413b-920f-1d6dabb0143d','https://wojanis.com/customer/docs/skudocs/cbcglkn.pdf','Sun Hydraulics : fiche CBCG-LKN'),
  (2,'22c02b3c-3e45-413b-920f-1d6dabb0143d','https://wojanis.com/customer/docs/skudocs/cwgalhv.pdf','Sun Hydraulics : fiche CWGA-LHV'),
  (1,'8361628f-755c-43ab-af1e-31c6532905fe','https://shop.tech-con.ro/media/catalog/product/pdf/ghp.pdf','Marzocchi : catalogue des pompes GHP, page 24'),
  (1,'02d4e7fc-3c16-4e30-89aa-96c311e18c20','https://www.ssab.com/-/media/41dab0f44e084de1ad187e617bf38f79.ashx','SSAB : Welding of Hardox, page 9'),
  (1,'557f2fb7-9af5-4798-9b20-df7d7f86efaf','https://www.ssab.com/-/media/41dab0f44e084de1ad187e617bf38f79.ashx','SSAB : Welding of Hardox, pages 18 et 20'),
  (1,'e03c519c-f721-4cd9-b63b-a9a66a8f0e3f','https://www.ssab.com/-/media/41dab0f44e084de1ad187e617bf38f79.ashx','SSAB : Welding of Hardox, page 21'),
  (1,'d73e9d83-7d00-48c8-ab2f-5d433e069733','https://www.ssab.com/-/media/314fa452afc143c3b898a959599a050e.ashx','SSAB : Bending Hardox, page 8'),
  (1,'b9b91296-c46a-4b52-bf7d-06b8a110eb41','https://bester.rapidwelding.com/files/Lincoln%20Hardfacing%20Consumables%20Guide.pdf','Lincoln Electric : guide du rechargement dur (C7.710), page 50'),
  (1,'e1180504-6ad8-428a-be9b-cfa1cb191fa0','https://www.turck.us/static/media/downloads/Operating_Distance_Considerations.pdf','Turck : portée des détecteurs inductifs, page 2'),
  (1,'a5ac4fd4-1d44-4cd3-b608-4caae2483cad','https://www.electronshik.ru/pdf/d/Deutsch_DT_DTM_DTP.pdf','TE : catalogue DEUTSCH DT, page 6 du fichier'),
  (1,'8473951b-1a6c-47d3-b1b0-cf1b1b340a25','https://www.electronshik.ru/pdf/d/Deutsch_DT_DTM_DTP.pdf','TE : catalogue DEUTSCH DT, page 8 du fichier'),
  (1,'481d8763-ef91-46dc-979b-43b5d8a898e0','https://www.skf.com/binaries/pub12/Images/0901d1968024f02a-140-710_BIMG_July_2019_tcm_12-114679.pdf','SKF : guide de montage des roulements (140-710), pages 12 et 54'),
  (1,'42ef7ece-3eb3-40be-9f71-c3d787facd06','https://www.skf.com/binaries/pub12/Images/0901d1968024f02a-140-710_BIMG_July_2019_tcm_12-114679.pdf','SKF : guide de montage des roulements (140-710), page 109'),
  (1,'4929cf42-c527-4c23-b530-540648299724','https://www.skf.com/binaries/pub12/Images/0901d1968024f02a-140-710_BIMG_July_2019_tcm_12-114679.pdf','SKF : guide de montage des roulements (140-710), page 56'),
  (1,'d372796f-c829-4810-a9e1-17b5002b9b73','https://www.skf.com/binaries/pub12/Images/0901d1968024f02a-140-710_BIMG_July_2019_tcm_12-114679.pdf','SKF : guide de montage des roulements (140-710), pages 57 et 83'),
  (1,'a625df77-452a-495a-988a-f21ca0593379','https://www.skf.com/binaries/pub12/Images/0901d1968024f02a-140-710_BIMG_July_2019_tcm_12-114679.pdf','SKF : guide de montage des roulements (140-710), page 59'),
  (1,'9eb744ad-3264-4f14-a435-62d6fa9ba737','https://www.boschrexroth.com/media/9b6523cf-a84c-41b2-be9b-57971922b894','Bosch Rexroth : fiche RE 92711 (pompe A10VSO), page 11'),
  (1,'e393ee9c-c5cb-4fba-bdce-58abeaceb9a9','https://www.boschrexroth.com/media/9b6523cf-a84c-41b2-be9b-57971922b894','Bosch Rexroth : fiche RE 92711 (pompe A10VSO), page 14'),
  (1,'f4dd485e-152c-4159-ae92-9571230114fc','https://www.hobartbrothers.com/wp-content/uploads/2026/01/Aluminum_Welding_Guide.pdf','Hobart : guide du soudage de l''aluminium, pages 8 et 9'),
  (1,'847776be-412f-4aa1-90db-758ac3100ab1','https://bester.rapidwelding.com/files/92182520L0.pdf','ESAB : fiche de l''électrode OK 92.18, page 2'),
  (1,'fe43b0a1-5096-4e5a-9c26-c1ed170fc561','https://assets.danfoss.com/documents/182616/BC152886484710en-001908.pdf','Danfoss : contrôleurs PLUS+1 MC0XX-0XX, page 30')
)
UPDATE public.questions x
SET medias = (SELECT jsonb_agg(jsonb_build_object('t','lien','p',d.url,'n',d.nom) ORDER BY d.rang)
              FROM docs d WHERE d.qid = x.id)
             || coalesce(x.medias, '[]'::jsonb)
WHERE x.id IN (SELECT qid FROM docs)
  AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(x.medias,'[]'::jsonb)) e WHERE e->>'t' = 'lien');

-- 3) La source sort de l'explication (elle reste dans questions_sources)
UPDATE public.questions x
SET reponse_type = btrim(regexp_replace(x.reponse_type, '\s*Sources?\s*:\s*[^\n]*$', ''))
FROM public.quiz q
WHERE q.id = x.quiz_id
  AND NOT coalesce(q.mode_examen, false)
  AND x.reponse_type ~ 'Sources?\s*:\s*[^\n]*$'
  AND EXISTS (SELECT 1 FROM public.questions_sources s WHERE s.question_id = x.id);

-- Verification : 0 explication d'exercice avec une source, 25 documents en face
-- de 24 questions, sources archivees
SELECT
  (SELECT count(*) FROM public.questions x JOIN public.quiz q ON q.id = x.quiz_id
    WHERE NOT coalesce(q.mode_examen,false) AND x.reponse_type ~ 'Sources?\s*:') AS explications_avec_source,
  (SELECT count(*) FROM public.questions x, jsonb_array_elements(coalesce(x.medias,'[]'::jsonb)) e
    WHERE e->>'t' = 'lien') AS documents_en_face,
  (SELECT count(*) FROM public.questions_sources) AS sources_archivees;
