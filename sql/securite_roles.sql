-- Securite des roles et des lectures (demande de Benoit, 25/11/2026)
--
-- 1) Inscription : seul un role eleve est accepte (aspirant, apprenti, ancien,
--    compagnon). « admin » seulement avec un lien d'invitation valide
--    (admin_tokens : non utilise, non expire), qui est alors consomme.
--    Avant : le role envoye par le navigateur etait recopie tel quel, et le
--    lien d'invitation n'etait jamais verifie.
-- 2) Personne ne peut creer son profil par l'API avec un role gacheur ou superviseur.
-- 3) Seul un superviseur peut donner ou retirer « superviseur ».
-- 4) Rattrapages : chacun ne voit que les siens (les gacheurs voient tout).
-- 5) Quiz : lisibles seulement une fois connecte.
-- 6) Fonctions : fermees aux visiteurs non connectes, chemin de recherche fixe.
--
-- Les coordonnees (profils) restent visibles par tous les comptes connectes :
-- les aspirants doivent pouvoir se contacter (choix de Benoit, 25/11). Elles ne
-- sont pas visibles sans connexion (deja le cas).
-- Aucune donnee n'est modifiee. Rejouable.

-- 1) Inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  demande    text := lower(coalesce(new.raw_user_meta_data->>'role', ''));
  jeton      text := nullif(new.raw_user_meta_data->>'admin_token', '');
  role_final text := 'aspirant';
BEGIN
  IF demande IN ('aspirant', 'apprenti', 'ancien', 'compagnon') THEN
    role_final := demande;
  ELSIF demande = 'admin' AND jeton IS NOT NULL THEN
    -- Lien d'invitation : valable une fois, avant sa date d'expiration
    UPDATE admin_tokens SET used_by = new.id, used_at = now()
    WHERE token = jeton AND used_by IS NULL AND expires_at > now();
    IF FOUND THEN role_final := 'admin'; END IF;
  END IF;
  INSERT INTO profils (id, email, role, prenom, nom, promo)
  VALUES (
    new.id,
    new.email,
    role_final,
    coalesce(new.raw_user_meta_data->>'prenom', ''),
    coalesce(new.raw_user_meta_data->>'nom', ''),
    coalesce(new.raw_user_meta_data->>'promo', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 2) Creation d'un profil par l'API (session ouverte) : jamais gacheur ni superviseur.
--    L'inscription (handle_new_user, sans session) et les superviseurs ne sont pas limites.
CREATE OR REPLACE FUNCTION public.verrou_creation_profil()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR est_superviseur() THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS NULL OR NEW.role NOT IN ('aspirant', 'apprenti', 'ancien', 'compagnon') THEN
    NEW.role := 'aspirant';
  END IF;
  NEW.superviseur := false;
  NEW.module_gacheur := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verrou_creation_profil ON public.profils;
CREATE TRIGGER trg_verrou_creation_profil
  BEFORE INSERT ON public.profils
  FOR EACH ROW EXECUTE FUNCTION public.verrou_creation_profil();

-- 3) Modification d'un profil : seul un superviseur change les roles d'autrui,
--    nomme un gacheur ou un superviseur
CREATE OR REPLACE FUNCTION public.verrou_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
       OR NEW.role NOT IN ('aspirant', 'apprenti', 'ancien', 'compagnon') THEN
      NEW.role := OLD.role;
    END IF;
  END IF;
  -- Superviseur : seulement par un superviseur (avant, tout gacheur le pouvait)
  IF NEW.superviseur IS DISTINCT FROM OLD.superviseur THEN
    NEW.superviseur := OLD.superviseur;
  END IF;
  IF NEW.module_gacheur IS DISTINCT FROM OLD.module_gacheur AND OLD.role <> 'admin' THEN
    NEW.module_gacheur := OLD.module_gacheur;
  END IF;
  RETURN NEW;
END;
$$;

-- 4) Rattrapages : la regle « tout le monde lit tout » annulait celle qui
--    limitait chacun aux siens. Restent : rattrapages_lecture_own (soi-meme ou gacheur).
DROP POLICY IF EXISTS lecture_rattrapages ON public.rattrapages;

-- 5) Quiz : plus de lecture sans connexion
DROP POLICY IF EXISTS quiz_select_all ON public.quiz;
CREATE POLICY quiz_select_all ON public.quiz
  FOR SELECT TO authenticated USING (true);

-- 6) Fonctions : fermees aux visiteurs non connectes
ALTER FUNCTION public.est_admin() SET search_path = public;
ALTER FUNCTION public.est_superviseur() SET search_path = public;
ALTER FUNCTION public.verrou_tentative() SET search_path = public;
ALTER FUNCTION public.refuser_copie_vide_rattrapage() SET search_path = public;
ALTER FUNCTION public.touch_brouillon() SET search_path = public;

REVOKE EXECUTE ON FUNCTION
  public.est_admin(), public.est_superviseur(), public.stats_exercice(uuid),
  public.handle_new_user(), public.verrou_creation_profil(), public.verrou_role(),
  public.verrou_tentative(), public.refuser_copie_vide_rattrapage(), public.touch_brouillon()
FROM PUBLIC, anon;
-- Les regles de lecture appellent est_admin() et est_superviseur() pour les comptes connectes
GRANT EXECUTE ON FUNCTION public.est_admin(), public.est_superviseur(), public.stats_exercice(uuid)
TO authenticated, service_role;
-- Fonctions de declencheur : jamais appelees directement (les declencheurs
-- fonctionnent sans ce droit, verifie le 25/11)
REVOKE EXECUTE ON FUNCTION public.handle_new_user(), public.verrou_creation_profil(), public.verrou_role(),
  public.verrou_tentative(), public.refuser_copie_vide_rattrapage(), public.touch_brouillon()
FROM authenticated;

-- Verification : 10 lignes attendues, toutes a « ok »
SELECT 'inscription verifie le role' AS controle,
       CASE WHEN pg_get_functiondef('public.handle_new_user'::regproc) LIKE '%admin_tokens%' THEN 'ok' ELSE 'NON' END AS etat
UNION ALL SELECT 'declencheur creation de profil',
       CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_verrou_creation_profil') THEN 'ok' ELSE 'NON' END
UNION ALL SELECT 'superviseur reserve aux superviseurs',
       CASE WHEN pg_get_functiondef('public.verrou_role'::regproc) NOT LIKE '%superviseur IS DISTINCT FROM OLD.superviseur AND%' THEN 'ok' ELSE 'NON' END
UNION ALL SELECT 'rattrapages : plus de lecture pour tous',
       CASE WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rattrapages' AND policyname = 'lecture_rattrapages') THEN 'ok' ELSE 'NON' END
UNION ALL SELECT 'rattrapages : lecture des siens',
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rattrapages' AND policyname = 'rattrapages_lecture_own') THEN 'ok' ELSE 'NON' END
UNION ALL SELECT 'quiz : connecte seulement',
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz' AND policyname = 'quiz_select_all' AND roles = '{authenticated}') THEN 'ok' ELSE 'NON' END
UNION ALL SELECT 'profils : connecte seulement (coordonnees entre membres)',
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profils' AND policyname = 'profils_lecture' AND roles = '{authenticated}') THEN 'ok' ELSE 'NON' END
UNION ALL SELECT 'est_admin ferme aux visiteurs',
       CASE WHEN NOT has_function_privilege('anon', 'public.est_admin()', 'EXECUTE') THEN 'ok' ELSE 'NON' END
UNION ALL SELECT 'est_admin ouvert aux connectes',
       CASE WHEN has_function_privilege('authenticated', 'public.est_admin()', 'EXECUTE') THEN 'ok' ELSE 'NON' END
UNION ALL SELECT 'stats_exercice fermee aux visiteurs',
       CASE WHEN NOT has_function_privilege('anon', 'public.stats_exercice(uuid)', 'EXECUTE') THEN 'ok' ELSE 'NON' END;
