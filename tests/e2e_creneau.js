// Creneau horaire d'un examen (bug du 19/11) :
// - Creer un quiz : choisir Examen affiche bien Debut et Fin, l'heure saisie est enregistree telle quelle ;
// - editeur : le creneau s'affiche en heure de France (avant : en UTC, 1 h de moins) et
//   un enregistrement sans rien toucher ne le decale plus ;
// - examen sans creneau, ou fin avant le debut : refuse avec un message ;
// - refus silencieux de la base : signale ;
// - reprise d'un brouillon : heure de France, bon type, creneau visible seulement pour un examen.
const {chromium}=require('playwright');const fs=require('fs')
;(async()=>{
 const path=require('path')
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const b=await chromium.launch()
 const ctx=await b.newContext({viewport:{width:390,height:844},timezoneId:'Europe/Paris',locale:'fr-FR'})
 const pg=await ctx.newPage()
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept())
 await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8'),contentType:'application/javascript'})
   if(u.startsWith('file:')) return r.continue()
   return r.fulfill({body:'',contentType:'application/javascript'})})
 await pg.goto('file://'+FICHIER);await pg.waitForTimeout(2200)
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))
 let ko=0;const verifie=(c,m)=>{console.log((c?'ok':'KO')+' : '+m);if(!c)ko++}
 // Ce que l'appli envoie a la base pour la table quiz (le faux Supabase ne modifie rien)
 await pg.evaluate(()=>{
   window.__ins=[];window.__maj=[];window.__refus=false
   __DB.quiz.push({id:'qC',titre:'Examen hydraulique',module_id:2,mode_examen:true,actif:false,archive:false,
     date_debut:'2026-11-30T19:00:00Z',date_fin:'2026-11-30T21:00:00Z',total_points:2})
   __DB.questions.push({id:'c1',quiz_id:'qC',ordre:1,enonce:'Pression ?',type_question:'multi',options:['1','2','3','4'],bonnes_reponses:[1],bonne_reponse:1,points:2})
   const f=db.from.bind(db)
   db.from=function(t){const o=f(t);if(t!=='quiz')return o
     const ins=o.insert;o.insert=function(v){window.__ins.push(JSON.parse(JSON.stringify(v)));return ins.apply(this,arguments)}
     const up=o.update;o.update=function(v){o._maj=v;window.__maj.push(JSON.parse(JSON.stringify(v)));return up.apply(this,arguments)}
     const th=o.then;o.then=function(res,rej){
       if(o._maj&&window.__refus) return Promise.resolve({data:[],error:null}).then(res,rej)
       return th.call(this,res,rej)}
     return o}
   G.admin=true;G.profil=__DB.profils[0]
 })
 const toast=()=>pg.evaluate(()=>(document.getElementById('toast')||{}).innerText||'')
 const visible=sel=>pg.evaluate(s=>{const e=document.querySelector(s);return !!e&&getComputedStyle(e).display!=='none'},sel)

 // 1. Creer un quiz
 await pg.evaluate(()=>nav('quiz-admin'));await pg.waitForTimeout(700)
 verifie(!(await visible('#mq-creneau-wrap')),'exercice : pas de créneau')
 await pg.selectOption('#mq-mode-type','examen');await pg.waitForTimeout(200)
 verifie(await visible('#mq-creneau-wrap'),'Examen choisi : Début et Fin apparaissent')
 await pg.fill('#mq-titre','Examen de décembre')
 await pg.fill('#mq-debut','2026-12-07T20:00');await pg.fill('#mq-fin','2026-12-07T22:00')
 await pg.evaluate(()=>{mqQuestions=[{type:'qcm',enonce:'Q1',options:['a','b','c','d'],bonne:0,competence:'',reponse_type:'',points:2,imageUrl:''}];renderQuestions()})
 await pg.evaluate(()=>pubQuizManuel());await pg.waitForTimeout(900)
 const ins=await pg.evaluate(()=>__ins.find(x=>x&&x.titre==='Examen de décembre')||null)
 console.log('créé :',JSON.stringify(ins&&{mode_examen:ins.mode_examen,date_debut:ins.date_debut,date_fin:ins.date_fin}))
 verifie(ins&&ins.mode_examen===true,'quiz créé en examen')
 verifie(ins&&ins.date_debut==='2026-12-07T19:00:00.000Z'&&ins.date_fin==='2026-12-07T21:00:00.000Z','20 h – 22 h saisis = 20 h – 22 h heure de France')
 verifie(!(await visible('#mq-creneau-wrap'))&&await pg.evaluate(()=>$('mq-mode-type').value)==='entrainement','après création : retour à un exercice sans créneau')
 // Examen sans creneau : refuse
 await pg.selectOption('#mq-mode-type','examen');await pg.fill('#mq-titre','Sans créneau')
 await pg.evaluate(()=>{mqQuestions=[{type:'qcm',enonce:'Q1',options:['a','b','c','d'],bonne:0,competence:'',reponse_type:'',points:2,imageUrl:''}];renderQuestions()})
 const avant=await pg.evaluate(()=>__ins.length)
 await pg.evaluate(()=>pubQuizManuel());await pg.waitForTimeout(400)
 verifie(await pg.evaluate(n=>__ins.length===n,avant)&&/créneau/i.test(await toast()),'création sans créneau refusée : '+await toast())

 // 2. Editeur
 await pg.evaluate(()=>editerQuiz('qC'));await pg.waitForSelector('#modal-edit-quiz',{timeout:5000});await pg.waitForTimeout(300)
 const champs=await pg.evaluate(()=>[$('eq-date-debut').value,$('eq-date-fin').value])
 console.log('éditeur affiche :',champs.join(' → '))
 verifie(champs[0]==='2026-11-30T20:00'&&champs[1]==='2026-11-30T22:00','éditeur : 20 h – 22 h (heure de France), pas 19 h – 21 h')
 await pg.evaluate(()=>{__maj.length=0;eqSave('qC')});await pg.waitForTimeout(900)
 const m1=await pg.evaluate(()=>__maj.find(x=>'date_debut' in x)||null)
 console.log('enregistré :',JSON.stringify(m1&&{date_debut:m1.date_debut,date_fin:m1.date_fin}),'|',await toast())
 verifie(m1&&m1.date_debut==='2026-11-30T19:00:00.000Z'&&m1.date_fin==='2026-11-30T21:00:00.000Z','enregistrer sans rien toucher ne décale plus le créneau')
 verifie(/mis à jour/i.test(await toast()),'message de succès')
 // Creneau vide, puis a l'envers : refuse, rien n'est envoye
 for(const [deb,fin,nom] of [['','','sans créneau'],['2026-11-30T22:00','2026-11-30T20:00','fin avant le début']]){
   await pg.evaluate(()=>document.querySelectorAll('#modal-edit-quiz').forEach(m=>m.remove()))
   await pg.evaluate(()=>editerQuiz('qC'));await pg.waitForSelector('#modal-edit-quiz',{timeout:5000});await pg.waitForTimeout(300)
   await pg.evaluate(([d,f])=>{$('eq-date-debut').value=d;$('eq-date-fin').value=f;__maj.length=0;eqSave('qC')},[deb,fin]);await pg.waitForTimeout(500)
   const t=await toast()
   verifie(await pg.evaluate(()=>__maj.length===0)&&/créneau/i.test(t)&&await pg.evaluate(()=>!!document.getElementById('modal-edit-quiz'))&&await pg.evaluate(()=>!document.getElementById('eq-save-btn').disabled),'éditeur, '+nom+' : refusé, fenêtre gardée ('+t+')')
 }
 // Passage en exercice : le creneau est retire sans message d'erreur
 await pg.evaluate(()=>{$('eq-mode').value='exercice';eqToggleDates();__maj.length=0;eqSave('qC')});await pg.waitForTimeout(800)
 const m2=await pg.evaluate(()=>__maj.find(x=>'date_debut' in x)||null)
 verifie(m2&&m2.mode_examen===false&&m2.date_debut===null,'passage en exercice : créneau retiré')
 // Refus silencieux de la base
 await pg.evaluate(()=>{__refus=true;editerQuiz('qC')});await pg.waitForSelector('#modal-edit-quiz',{timeout:5000});await pg.waitForTimeout(300)
 await pg.evaluate(()=>eqSave('qC'));await pg.waitForTimeout(800)
 verifie(/refusés par la base/i.test(await toast()),'refus de la base signalé : '+await toast())
 await pg.evaluate(()=>{__refus=false;document.querySelectorAll('#modal-edit-quiz').forEach(m=>m.remove())})

 // 3. Reprise d'un brouillon
 // (reprendreBrouillon recharge la liste, vide dans le faux Supabase : on la redonne a chaque fois)
 await pg.evaluate(()=>{window.__brouillons=[
   {id:'bE',titre:'Brouillon examen',module_id:2,visibilite:'prive',mode_examen:true,date_debut:'2026-12-14T19:30:00Z',date_fin:'2026-12-14T21:30:00Z',questions:[]},
   {id:'bX',titre:'Brouillon exercice',module_id:2,visibilite:'prive',mode_examen:false,date_debut:null,date_fin:null,questions:[]}]})
 await pg.evaluate(()=>{_brouillonsListe=__brouillons.slice();reprendreBrouillon('bE')});await pg.waitForTimeout(300)
 const br=await pg.evaluate(()=>[$('mq-mode-type').value,$('mq-debut').value,$('mq-fin').value])
 console.log('brouillon examen :',br.join(' | '))
 verifie(br[0]==='examen'&&br[1]==='2026-12-14T20:30'&&br[2]==='2026-12-14T22:30'&&await visible('#mq-creneau-wrap'),'brouillon d examen : 20 h 30 – 22 h 30, créneau visible')
 await pg.evaluate(()=>{_brouillonsListe=__brouillons.slice();reprendreBrouillon('bX')});await pg.waitForTimeout(300)
 verifie(await pg.evaluate(()=>$('mq-mode-type').value)==='entrainement'&&!(await visible('#mq-creneau-wrap')),'brouillon d exercice : type Exercice, pas de créneau')
 await pg.evaluate(()=>{_brouillonsListe=__brouillons.slice();reprendreBrouillon('bE')});await pg.waitForTimeout(200)
 await pg.evaluate(()=>nouveauBrouillon());await pg.waitForTimeout(200)
 verifie(await pg.evaluate(()=>$('mq-mode-type').value==='entrainement'&&$('mq-debut').value==='')&&!(await visible('#mq-creneau-wrap')),'nouveau quiz : exercice, créneau vide')

 console.log(ko?ko+' vérification(s) en échec':'toutes les vérifications passent')
 console.log('ERREURS JS :',errs.length?errs:(ko?['vérifications en échec']:'aucune'))
 await b.close();process.exit(ko?1:0)})()
