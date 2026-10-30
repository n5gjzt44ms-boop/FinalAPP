# ProgMéca — mémoire du projet

Ce fichier est lu au début de chaque session. Il ne garde que ce qui sert pour la suite.
En fin de session, le mettre à jour avec la commande `/fin-de-session`.
**Dépôt public : aucune donnée personnelle ici** (noms d'aspirants, e-mails, notes, exports).

## En bref
- Suivi de la formation théorique des aspirants mécaniciens des Compagnons du Devoir.
- Un seul fichier : `index.html` (HTML + CSS + JS, environ 7 000 lignes), sans étape de compilation. Données : Supabase (Postgres, connexion, stockage `ressources`).
- En ligne sur GitHub Pages : https://n5gjzt44ms-boop.github.io/FinalAPP/ (dépôt `n5gjzt44ms-boop/FinalAPP`, branche `main`). Mettre en ligne = pousser `index.html` sur `main`.
- Propriétaire : Benoît, gâcheur superviseur. Il écrit des messages courts, souvent depuis son téléphone. Répondre en français, court, et expliquer après avoir corrigé.
- 4 modules : 1 Thermique & Mécanique · 2 Hydraulique · 3 Conception & Construction · 4 Électrique & Automatisme.
- Rôles : aspirant, apprenti, admin (= gâcheur ; les superviseurs sont dans `ADMINS_SUPERVISEURS`), ancien, compagnon.

## Règles métier (fermes)
1. Jamais de note chiffrée côté aspirant pour un examen : seulement « Validé », « Non validé » ou « En attente ».
2. Aucune correction affichée pendant un examen. Toute copie d'examen passe par un gâcheur (`note_admin` vide = à corriger). Seuil : `SEUIL = 14` sur 20.
3. Un module est validé par 4 examens distincts réussis (valeur fixe, `examensRequis()`), ou à la main via `profils.modules_valides` (« acquis hors plateforme »). Une seule règle dans le code : `statutTheorie()` et `examensValidesDistincts()`. Cela valide la théorie seulement ; la pratique se juge hors plateforme.
4. Un examen est un quiz avec `mode_examen` et un créneau (`date_debut`, `date_fin`). Il n'est visible que s'il est publié (`actif`) et non archivé (`archive`). Il est réservé aux mécaniciens inscrits au module (`module_inscrit`, sans `sans_module`).
5. Rattrapage = une ligne dans `rattrapages` avec `date_limite` (jusqu'à 23h59 ce jour-là). Il lève le créneau. L'aspirant a la même durée que le créneau, comptée à partir du moment où il commence (`calculerFinExamen`). Usage unique. Possible même si une copie existe : l'ancienne reste jusqu'à l'envoi de la nouvelle, puis sa note est archivée (`historique_tentatives`) et la copie supprimée.
6. Absent = inscrit au module (mécanicien, sans `sans_module`, module non acquis) qui n'a pas de copie alors que le créneau a commencé.
7. Carnet de bord : une ligne `carnet_bord` seulement quand les 4 examens sont validés.
8. QCM à choix multiples : barème partiel `pointsMulti` (bonnes cases moins mauvaises, divisé par le nombre de bonnes).

## Façon de travailler
- À chaque livraison, incrémenter `VERSION_APP` (format `AAAA.MM.JJ-HHMM`). Elle s'affiche en haut de l'appli et sert à la mise à jour automatique des téléphones.
- Tester avant de pousser : `npm test` (voir « Tests »). Pour chaque bug corrigé, ajouter un scénario.
- SQL : Benoît autorise Claude à exécuter le SQL rejouable via le connecteur Supabase ; toute suppression de copies, notes ou fichiers reste à lui demander. Fichier autonome et rejouable (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`), rangé dans `sql/`, vérification à la fin.
- Code : commentaires en français sans accents (style existant). Interface en français ; on tutoie les aspirants (« Pays »).
- Design : police Inter, fond crème `#EDECE9`, cartes arrondies, ombres douces. Couleurs par variables CSS (`--r` rouge, `--v` vert, `--amber`, `--b` bleu). Mode sombre : `body.dark`.

## Plan du code (`index.html`)
- Démarrage et navigation : `initApp()`, `nav(page)`, `rafraichirPage()` (toutes les 90 s), `PAGES_ADMIN`.
- Mise à jour automatique : `versionEnLigne()`, `miseAJourAvantExamen()` (avant tout examen ; l'examen se rouvre seul après), `verifierMiseAJour()` (au retour dans l'appli et toutes les 10 min).
- Accueil aspirant : `loadDashboard()` puis `afficherExamensAccueil()`. Carte en haut de l'accueil : examen du jour avec compte à rebours, examen en cours, rattrapage ouvert, copie à reprendre.
- Accueil gâcheur : `loadDashboardAdmin()`. À faire (copies, absents, aspirants sans module), examens du jour avec bouton « Publier », prochains examens, rattrapages, raccourcis.
- Examen d'essai : `commencerEssai()`, `finEssai()`, `carteEssaiAccueil()`. Questions dans le code (`questionsEssai()`), `quiz.essai=true`, aucune écriture en base. Fait ou masqué : `localStorage` (`pm_essai_fait`, `pm_essai_masque`).
- Passage d'un quiz : `ouvrirModule()` et `renderEval()`, puis `commencer(qid)`, `showQ()`, `valider()`, `suivant()`, `terminer()`. `terminer()` envoie la copie avec deux replis, puis archive l'ancienne copie et retire le rattrapage.
- Reprise après un rechargement (appareil photo, PDF) : `sauverCopieEnCours()` et `reprendreCopie()` (`localStorage` `pm_copie_en_cours`, valable 12 h).
- Pièces jointes (schéma fait à la main) : `uploaderFichierLibre()`, `reduireImage()` (1600 px, JPEG 0,72), `envoyerAuStockage()`. Si le dépôt échoue, l'image est gardée dans la copie. `piecesJointes()` lit aussi l'ancien format (un objet unique).
- Corrections : `chargerCorrections()` et `afficherCorrections()` (vues : à corriger, toutes, absents), `ouvrirCorrectionAdmin()`, `validerCorrection()`, `supprimerCopie()`, `creerCopieManquante()` (copie papier vide).
  - `ouvrirCorrectionAdmin()` affiche les réponses, les pièces jointes, les réponses orphelines, une case « note finale imposée », ainsi que la durée et la version de la copie.
  - Rattrapages : `redonnerAcces()`, `ouvrirRattrapage()`, `insererRattrapage()`, `demanderDateLimite()`, `rattrapageTous()`.
- Aspirants et carnet : `loadAspirants()`, `voirCarnetDe()`, `chargerCarnet()`.
- Éditeur de quiz : `editerQuiz()` et `eqSave`. Les questions sont modifiées en place : leurs identifiants ne changent pas.
- Utilitaires : `echapAttr()`, `_escC()`, `heureFr()`, `dureeFr()`, `rattrapageActif()`, `calculerScore20()`, `pointsMulti()`.

## Base Supabase (état attendu)
- `profils` : role, module_inscrit (entier), modules_valides (int[]), sans_module, metier ('mecanicien', 'electrotechnicien', 'outilleur'), module_gacheur…
- `quiz` : module_id, mode_examen, actif, archive, date_debut, date_fin, total_points.
- `questions` : quiz_id, ordre, enonce, type_question ('qcm', 'multi', 'libre'), options (jsonb), bonne_reponse, bonnes_reponses (int[]), points, reponse_type (réponse attendue), image_url, medias (jsonb).
- `tentatives` (les copies) :
  - réponses et notes : reponses (jsonb `{id_question: indice | [indices] | texte}`), score (sur 20), valide, note_admin, notes_libres (jsonb), resultats_par_competence ;
  - fichiers_libres (jsonb `{id_question: [{type, nom, path ou image}]}`) ;
  - suivi : completed_at, version_app, commence_le.
- `rattrapages` : quiz_id, aspirant_id, date_limite, created_at.
- Autres : `historique_tentatives`, `carnet_bord` (unique par aspirant et module), `ressources`, `annonces`, `messages`, `periodes_inscription`…
- Stockage `ressources`, privé (liens signés ; les `img[data-img]` sont chargées automatiquement). Dossiers : `reponses-libres/<uid>/` et `rendus/<devoir>/<uid>/`.

Règles de sécurité en place (fichiers dans `sql/`) :
- `tentatives` :
  - création : soi-même ou un gâcheur ;
  - modification : soi-même ou un gâcheur. Le déclencheur `verrou_tentative` empêche un aspirant de changer score, valide, reponses ou note ;
  - suppression : un gâcheur ; un aspirant pour un exercice, ou pour un examen dont le rattrapage est ouvert ;
  - le déclencheur `trg_copie_vide_rattrapage` refuse une copie vide pendant un rattrapage (sauf pour un gâcheur).
- `rattrapages` : lecture et suppression par l'aspirant concerné ou un gâcheur ; création par un gâcheur.
- Stockage : lecture pour tous les comptes connectés ; dépôt pour les gâcheurs, et pour chaque aspirant dans ses propres dossiers.

Requête pour vérifier l'état réel (à coller dans le SQL Editor ; 10 lignes attendues) :
```sql
SELECT 'colonne' AS quoi, table_name || '.' || column_name AS nom
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'rattrapages' AND column_name = 'date_limite')
    OR (table_name = 'tentatives' AND column_name IN ('version_app','commence_le')))
UNION ALL
SELECT 'règle', tablename || ' : ' || policyname FROM pg_policies
WHERE policyname IN ('depot_reponses_aspirants','historique_ecriture_admin',
                     'tentatives_depot','tentatives_suppression','tentatives_modification')
UNION ALL
SELECT 'déclencheur', tgname FROM pg_trigger
WHERE tgname IN ('trg_copie_vide_rattrapage','trg_verrou_tentative');
```

## Pièges connus
- Ne jamais recréer les questions d'un quiz. Leurs identifiants changeraient et les réponses des copies déjà rendues deviendraient orphelines (score recalculé faux). Les anciennes copies orphelines ne peuvent pas être rattachées sans sauvegarde ; leur note enregistrée fait foi.
- iPhone : une appli laissée en arrière-plan garde l'ancien code pendant des jours. D'où la mise à jour automatique, qui ne marche que si `VERSION_APP` augmente.
- Hors créneau, le minuteur d'un examen doit utiliser `G.finExamen`. Sinon la copie part vide au bout d'une seconde (bug corrigé le 28/10).
- Les règles de sécurité Supabase peuvent refuser une écriture sans renvoyer d'erreur (0 ligne touchée). Ajouter `.select('id')` aux `update` et `delete`, et vérifier le résultat.
- Pas de texte libre dans les `onclick` écrits dans le HTML (les apostrophes cassent le code) : passer un identifiant et relire les données.
- Comparer les modules avec `Number()` (`module_inscrit` contre `module_id`).
- `input type=file` : il doit couvrir toute la zone cliquable. Éviter `display:none`, capricieux sur iPhone.
- `GUIDES` est recopié dans 3 blocs `<script>` (deux sont ignorés car ils ont un `src`) : modifier les trois.

## Tests
- Faux Supabase en mémoire : `tests/stub.js` (un gâcheur, quelques aspirants, quiz et copies). Scénarios Playwright : `tests/e2e_*.js`. Règle des modules : `tests/test_regle_module.js`.
- Installation (une fois) : `npm install`, puis `npx playwright install chromium`. Ensuite `npm test`. `npm run test:long` ajoute le rattrapage de 65 s, `npm run test:detail` affiche toutes les sorties.
- Chaque scénario affiche ce qu'il voit et finit par « ERREURS JS : aucune ». Lire la sortie, pas seulement « OK ».

## État actuel (30/10/2026)
- En ligne : v2026.10.30-1407.
- `sql/anti_doublons.sql` (index `uniq_tentative_envoi`) : exécuté le 30/10.
- `sql/essai_photos.sql` : pas encore exécuté. Sans cette règle, les photos de l'examen d'essai restent dans le stockage (`essai_*`) ; l'essai fonctionne quand même.
- Stockage : aucune règle de suppression sauf celle de l'essai. `remove()` ne fait donc rien, même pour un gâcheur (fichiers de ressources supprimées encore stockés).
- SQL : la requête de vérification renvoie les 10 lignes attendues (30/10).
- Quelques copies de rattrapage parties vides (ancien bug, ou téléphone resté sur une ancienne version). Leur accès est encore ouvert : les aspirants doivent repasser l'examen avec la version à jour.
- Copies aux réponses orphelines (quiz modifiés après l'examen : soudage, Partie 1 électrique, Moteur) : seule la note enregistrée compte.
- Examens électriques Parties 2, 3 et 4 (30/11, 04/01, 25/01) : encore privés au 27/10. Les publier avant leur date ; l'accueil gâcheur le signale.
- Direction artistique à revoir. Demander à Benoît ce qui le gêne (couleurs, lisibilité, allure générale), puis proposer 2 ou 3 pistes sur une page avant de toucher au site.

## Journal
- 27/10 : toutes les copies sont de nouveau visibles. Plus de faux « validé » après un seul examen. La correction affiche les réponses multiples, les réponses orphelines et une note finale imposée. L'éditeur garde les identifiants des questions. Rattrapages avec date limite. Nouveaux boutons « Redonner l'accès », suppression de copie et copie papier.
- 28/10 : rattrapage envoyé vide au bout d'une seconde (le minuteur visait la fin du créneau) : corrigé. Photos de schéma refusées par le stockage : elles sont maintenant réduites et gardées dans la copie si besoin. Examen du jour sur l'accueil aspirant, nouvel accueil gâcheur, barre du bas Copies et Aspirants.
- 29/10 : mise à jour automatique avant chaque examen. Version et heure de début enregistrées dans chaque copie (badge « Envoyée X s après le début »). La base refuse les copies vides pendant un rattrapage. Questionnaire des Anciens réparé (il plantait à l'ouverture).
- 30/10 : passage à Claude Code. Ajout de ce fichier, des tests (`tests/`) et des SQL (`sql/`) dans le dépôt.
- 30/10 (v2026.10.30-1226) : copie terminée sans réseau gardée sur le téléphone et renvoyée seule au retour du réseau (une seule fois). Reprises automatiques sur réseau faible. Une note n'est plus effacée sans être archivée (rattrapage, déblocage, suppression de copie). Un quiz qui a des copies est archivé au lieu d'être supprimé. Dépôts de fichiers : les échecs sont signalés. Scénario `e2e_envoi.js`.
- 30/10 (v2026.10.30-1332) : si la base refuse une copie en doublon (même heure de début), la copie déjà arrivée compte : rien n'est renvoyé ni effacé. Ajout de `sql/anti_doublons.sql` et du scénario `e2e_depots.js` (doublon, dépôts en échec, quiz avec copies archivé).
- 30/10 (v2026.10.30-1407) : examen d'essai sur l'accueil aspirant et dans les raccourcis gâcheur : mêmes écrans qu'un examen, vérification de l'envoi, de la photo et de la version, sans copie ni note. Scénario `e2e_essai.js`.
