-- ═══════════════════════════════════════════════════════════════
-- ProgMeca — Plusieurs pieces jointes par question
-- A executer dans Supabase : SQL Editor > New query > Run
-- Sans risque, rejouable.
--
-- Permet d'attacher plusieurs photos et/ou PDF a une meme question
-- (schemas, plans, documentation technique).
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE questions ADD COLUMN IF NOT EXISTS medias JSONB DEFAULT '[]'::jsonb;

-- Reprendre les images deja attachees via image_url
UPDATE questions
SET medias = jsonb_build_array(jsonb_build_object('t','img','p',image_url,'n','Image'))
WHERE image_url IS NOT NULL
  AND (medias IS NULL OR medias = '[]'::jsonb);

NOTIFY pgrst, 'reload schema';

-- VERIFICATION
SELECT COUNT(*) AS questions_avec_media
FROM questions WHERE medias IS NOT NULL AND medias <> '[]'::jsonb;
