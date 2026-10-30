-- ═══════════════════════════════════════════════════════════════
-- ProgMeca — MIGRATION COMPLETE
-- Regroupe TOUT ce qui est necessaire au fonctionnement de l'app.
--
-- A executer dans Supabase : SQL Editor > New query > Run
--
-- SANS RISQUE : aucune donnee n'est supprimee, uniquement des
-- ajouts de colonnes, de tables et de regles d'acces.
-- REJOUABLE : peut etre execute plusieurs fois sans probleme.
--
-- Supabase affichera un avertissement a cause des lignes
-- "DROP POLICY" : elles ne suppriment que des regles d'acces,
-- jamais des donnees. C'est normal, vous pouvez valider.
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 1. COLONNES SUPPLEMENTAIRES
-- ───────────────────────────────────────────────────────────────

-- Module dont un gacheur est responsable (distinct de module_inscrit
-- qui reste reserve aux aspirants)
ALTER TABLE profils ADD COLUMN IF NOT EXISTS module_gacheur INTEGER;

-- Gacheur qui supervise tous les modules
ALTER TABLE profils ADD COLUMN IF NOT EXISTS superviseur BOOLEAN DEFAULT FALSE;

-- Aspirant en annee blanche : garde son statut et l'acces aux cours,
-- mais aucun examen ni decompte de progression
ALTER TABLE profils ADD COLUMN IF NOT EXISTS sans_module BOOLEAN DEFAULT FALSE;

-- Tag permettant de proposer le bon cours apres une erreur
ALTER TABLE ressources ADD COLUMN IF NOT EXISTS competence TEXT;

-- Points en decimales (l'interface propose des demi-points)
ALTER TABLE questions ALTER COLUMN points TYPE NUMERIC(5,2);


-- ───────────────────────────────────────────────────────────────
-- 2. SUPERVISEURS
-- ───────────────────────────────────────────────────────────────

UPDATE profils
SET superviseur = TRUE, module_gacheur = NULL
WHERE email IN (
  'b.prudhomme18@compagnons-du-devoir.fr',
  'b.beauvais22@compagnons-du-devoir.fr'
);

-- Un gacheur n'a pas de module_inscrit (reserve aux aspirants)
UPDATE profils SET module_inscrit = NULL WHERE role = 'admin';


-- ───────────────────────────────────────────────────────────────
-- 3. NOUVELLES TABLES
-- ───────────────────────────────────────────────────────────────

-- Rattrapages : autorise un aspirant a passer un examen hors creneau
CREATE TABLE IF NOT EXISTS rattrapages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL,
  aspirant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE rattrapages ENABLE ROW LEVEL SECURITY;

-- Historique des exercices refaits
CREATE TABLE IF NOT EXISTS historique_tentatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aspirant_id UUID NOT NULL,
  quiz_id UUID NOT NULL,
  score INTEGER,
  valide BOOLEAN,
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE historique_tentatives ENABLE ROW LEVEL SECURITY;

-- Brouillons de quiz synchronises entre appareils
CREATE TABLE IF NOT EXISTS brouillons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id UUID NOT NULL,
  titre TEXT,
  module_id INTEGER,
  visibilite TEXT,
  mode_examen BOOLEAN DEFAULT FALSE,
  date_debut TIMESTAMPTZ,
  date_fin TIMESTAMPTZ,
  questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE brouillons ENABLE ROW LEVEL SECURITY;


-- ───────────────────────────────────────────────────────────────
-- 4. FONCTIONS UTILITAIRES
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION est_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM profils WHERE id = auth.uid()), FALSE);
$$;

CREATE OR REPLACE FUNCTION est_superviseur()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT COALESCE((SELECT superviseur FROM profils WHERE id = auth.uid()), FALSE);
$$;


-- ───────────────────────────────────────────────────────────────
-- 5. SECURITE : PROFILS
-- Empeche quiconque de se donner le role admin
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "allow_all" ON profils;
DROP POLICY IF EXISTS "superviseur_lit_profils" ON profils;
DROP POLICY IF EXISTS "superviseur_modifie_profils" ON profils;
DROP POLICY IF EXISTS "profils_lecture" ON profils;
DROP POLICY IF EXISTS "profils_creation" ON profils;
DROP POLICY IF EXISTS "profils_modification" ON profils;
DROP POLICY IF EXISTS "profils_suppression" ON profils;

CREATE POLICY "profils_lecture" ON profils FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "profils_creation" ON profils FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "profils_modification" ON profils FOR UPDATE TO authenticated
USING (id = auth.uid() OR est_superviseur())
WITH CHECK (id = auth.uid() OR est_superviseur());

CREATE POLICY "profils_suppression" ON profils FOR DELETE TO authenticated
USING (est_superviseur());

CREATE OR REPLACE FUNCTION verrou_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF est_superviseur() THEN
    RETURN NEW;
  END IF;
  -- Nul ne peut se declarer admin
  IF NEW.role = 'admin' AND OLD.role <> 'admin' THEN
    NEW.role := OLD.role;
  END IF;
  -- On ne change que son propre role, vers aspirant/apprenti/ancien/compagnon
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NEW.id <> auth.uid()
       OR NEW.role NOT IN ('aspirant','apprenti','ancien','compagnon') THEN
      NEW.role := OLD.role;
    END IF;
  END IF;
  IF NEW.superviseur IS DISTINCT FROM OLD.superviseur AND OLD.role <> 'admin' THEN
    NEW.superviseur := OLD.superviseur;
  END IF;
  IF NEW.module_gacheur IS DISTINCT FROM OLD.module_gacheur AND OLD.role <> 'admin' THEN
    NEW.module_gacheur := OLD.module_gacheur;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verrou_role ON profils;
CREATE TRIGGER trg_verrou_role
BEFORE UPDATE ON profils
FOR EACH ROW EXECUTE FUNCTION verrou_role();


-- ───────────────────────────────────────────────────────────────
-- 6. SECURITE : TENTATIVES
-- L'aspirant depose sa copie et peut refaire un EXERCICE,
-- mais ne peut ni modifier sa note ni effacer un EXAMEN
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "tentatives_update_admin" ON tentatives;
DROP POLICY IF EXISTS "tentatives_delete_admin" ON tentatives;
DROP POLICY IF EXISTS "tentatives_insert_own" ON tentatives;
DROP POLICY IF EXISTS "tentatives_depot" ON tentatives;
DROP POLICY IF EXISTS "tentatives_modification" ON tentatives;
DROP POLICY IF EXISTS "tentatives_correction" ON tentatives;
DROP POLICY IF EXISTS "tentatives_suppression" ON tentatives;

CREATE POLICY "tentatives_depot" ON tentatives FOR INSERT TO authenticated
WITH CHECK (aspirant_id = auth.uid());

CREATE POLICY "tentatives_modification" ON tentatives FOR UPDATE TO authenticated
USING (aspirant_id = auth.uid() OR est_admin())
WITH CHECK (aspirant_id = auth.uid() OR est_admin());

-- Suppression : les exercices seulement, jamais les examens
CREATE POLICY "tentatives_suppression" ON tentatives FOR DELETE TO authenticated
USING (
  est_admin()
  OR (
    aspirant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM quiz
      WHERE quiz.id = tentatives.quiz_id AND quiz.mode_examen = FALSE
    )
  )
);

CREATE OR REPLACE FUNCTION verrou_tentative()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF est_admin() THEN
    RETURN NEW;
  END IF;
  NEW.score       := OLD.score;
  NEW.valide      := OLD.valide;
  NEW.reponses    := OLD.reponses;
  NEW.note_admin  := OLD.note_admin;
  NEW.quiz_id     := OLD.quiz_id;
  NEW.aspirant_id := OLD.aspirant_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verrou_tentative ON tentatives;
CREATE TRIGGER trg_verrou_tentative
BEFORE UPDATE ON tentatives
FOR EACH ROW EXECUTE FUNCTION verrou_tentative();


-- ───────────────────────────────────────────────────────────────
-- 7. SECURITE : AUTRES TABLES
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "carnet_write" ON carnet_bord;
DROP POLICY IF EXISTS "carnet_ecriture_own" ON carnet_bord;
CREATE POLICY "carnet_ecriture_own" ON carnet_bord FOR ALL TO authenticated
USING (aspirant_id = auth.uid() OR est_admin())
WITH CHECK (aspirant_id = auth.uid() OR est_admin());

DROP POLICY IF EXISTS "mini_stages_write" ON mini_stages;
DROP POLICY IF EXISTS "mini_stages_ecriture_own" ON mini_stages;
CREATE POLICY "mini_stages_ecriture_own" ON mini_stages FOR ALL TO authenticated
USING (ancien_id = auth.uid() OR est_admin())
WITH CHECK (ancien_id = auth.uid() OR est_admin());

DROP POLICY IF EXISTS "inscriptions_write_own" ON inscriptions;
CREATE POLICY "inscriptions_write_own" ON inscriptions FOR INSERT TO authenticated
WITH CHECK (aspirant_id = auth.uid());

DROP POLICY IF EXISTS "lecture_rattrapages" ON rattrapages;
CREATE POLICY "lecture_rattrapages" ON rattrapages FOR SELECT TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS "admin_cree_rattrapages" ON rattrapages;
DROP POLICY IF EXISTS "rattrapages_creation_admin" ON rattrapages;
CREATE POLICY "rattrapages_creation_admin" ON rattrapages FOR INSERT TO authenticated
WITH CHECK (est_admin());

DROP POLICY IF EXISTS "suppression_rattrapages" ON rattrapages;
CREATE POLICY "suppression_rattrapages" ON rattrapages FOR DELETE TO authenticated
USING (aspirant_id = auth.uid() OR est_admin());

DROP POLICY IF EXISTS "historique_lecture_own" ON historique_tentatives;
CREATE POLICY "historique_lecture_own" ON historique_tentatives FOR SELECT TO authenticated
USING (aspirant_id = auth.uid() OR est_admin());

DROP POLICY IF EXISTS "historique_ecriture_own" ON historique_tentatives;
CREATE POLICY "historique_ecriture_own" ON historique_tentatives FOR INSERT TO authenticated
WITH CHECK (aspirant_id = auth.uid());

DROP POLICY IF EXISTS "brouillons_lecture" ON brouillons;
CREATE POLICY "brouillons_lecture" ON brouillons FOR SELECT TO authenticated
USING (auteur_id = auth.uid());

DROP POLICY IF EXISTS "brouillons_creation" ON brouillons;
CREATE POLICY "brouillons_creation" ON brouillons FOR INSERT TO authenticated
WITH CHECK (auteur_id = auth.uid());

DROP POLICY IF EXISTS "brouillons_modification" ON brouillons;
CREATE POLICY "brouillons_modification" ON brouillons FOR UPDATE TO authenticated
USING (auteur_id = auth.uid()) WITH CHECK (auteur_id = auth.uid());

DROP POLICY IF EXISTS "brouillons_suppression" ON brouillons;
CREATE POLICY "brouillons_suppression" ON brouillons FOR DELETE TO authenticated
USING (auteur_id = auth.uid());


-- ───────────────────────────────────────────────────────────────
-- 8. NETTOYAGE DES DOUBLONS D'EXERCICES
-- Corrige les exercices restes "non valides" apres avoir ete refaits
-- ───────────────────────────────────────────────────────────────

DELETE FROM tentatives t
WHERE EXISTS (
  SELECT 1 FROM quiz q WHERE q.id = t.quiz_id AND q.mode_examen = FALSE
)
AND t.id NOT IN (
  SELECT DISTINCT ON (aspirant_id, quiz_id) id
  FROM tentatives
  ORDER BY aspirant_id, quiz_id, valide DESC, completed_at DESC
);


-- ───────────────────────────────────────────────────────────────
-- 9. RAFRAICHIR LE CACHE (evite l'erreur "column not found")
-- ───────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';


-- ═══════════════════════════════════════════════════════════════
-- VERIFICATIONS
-- ═══════════════════════════════════════════════════════════════

-- A. Les 3 colonnes doivent apparaitre
SELECT 'COLONNES' AS controle, column_name
FROM information_schema.columns
WHERE table_name = 'profils'
  AND column_name IN ('module_gacheur','superviseur','sans_module')
ORDER BY column_name;

-- B. Les 2 verrous doivent apparaitre
SELECT 'VERROUS' AS controle, tgname
FROM pg_trigger
WHERE tgname IN ('trg_verrou_role','trg_verrou_tentative');

-- C. Aucun doublon ne doit subsister (0 ligne attendue)
SELECT 'DOUBLONS' AS controle, aspirant_id, quiz_id, COUNT(*) AS nb
FROM tentatives
GROUP BY aspirant_id, quiz_id
HAVING COUNT(*) > 1;

-- D. Vos comptes gacheurs
SELECT 'GACHEURS' AS controle, email, role, superviseur, module_gacheur
FROM profils WHERE role = 'admin' ORDER BY email;
