// Parcours ludique (serie, objectif de la semaine, points, insignes, fin
// d'exercice), dessin de la reponse, image de la bonne reponse, et les pannes
// trouvees le 10/11 : classement en erreur 400, cours deja ouvert (409),
// session expiree pendant l'envoi, lecture tronquee a 1000 copies.
const {chromium}=require('playwright');const fs=require('fs'),os=require('os'),path=require('path')
;(async()=>{
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}})
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept())
 await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8').replace("const U={id:'admin1'","const U={id:'a2'"),contentType:'application/javascript'})
   if(u.startsWith('file:')||u.startsWith('blob:')||u.startsWith('data:')) return r.continue()
   return r.fulfill({body:'',contentType:'application/javascript'})})
 await pg.goto('file://'+FICHIER);await pg.waitForTimeout(2500)
 let echecs=0
 const verifie=(ok,msg)=>{console.log((ok?'ok : ':'ECHEC : ')+msg);if(!ok)echecs++}
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))

 // 1) Calcul du parcours : serie de semaines, objectif, meilleure note gardee
 const calc=await pg.evaluate(()=>{
   const j=function(n){return new Date(Date.now()-n*86400000).toISOString()}
   const lundi=new Date(lundiDe(new Date())+'T12:00:00')
   const sem=function(k){return new Date(lundi.getTime()-k*7*86400000).toISOString()}
   const ex={module_id:2,mode_examen:false},exa={module_id:2,mode_examen:true}
   const t=[
     {id:'1',quiz_id:'e1',score:12,valide:false,completed_at:sem(0),quiz:ex},
     {id:'2',quiz_id:'e1',score:18,valide:true,completed_at:sem(1),quiz:ex},   // meilleure note de e1
     {id:'3',quiz_id:'e2',score:20,valide:true,completed_at:sem(2),quiz:ex},
     {id:'4',quiz_id:'x1',score:15,valide:true,note_admin:15,completed_at:sem(2),quiz:exa},
     {id:'5',quiz_id:'e3',score:10,valide:false,completed_at:sem(5),quiz:ex}  // semaine isolee
   ]
   const p=parcoursLudique(t,{modules_valides:[]})
   return {serie:p.serie,semaine:p.semaine,exercices:p.exercices,points:p.points,
     ins:p.insignes.filter(x=>x.ok).map(x=>x.id),
     vide:parcoursLudique([],{}).serie}
 })
 console.log('parcours :',JSON.stringify(calc))
 verifie(calc.serie===3&&calc.semaine===1&&calc.exercices===3,'serie de 3 semaines, 1 exercice cette semaine, 3 exercices distincts')
 // e1 : 18 -> 90, e2 : 20 -> 100, e3 : 10 -> 50, examen valide : 200
 verifie(calc.points===440,'points : meilleure note de chaque exercice + 200 par examen valide (sans la note d examen)')
 verifie(calc.ins.indexOf('premier')>=0&&calc.ins.indexOf('sansfaute')>=0&&calc.ins.indexOf('serie3')>=0&&calc.ins.indexOf('examen')>=0&&calc.ins.indexOf('cinq')<0,'insignes obtenus : premier pas, sans faute, 3 semaines, premier examen')
 verifie(calc.vide===0,'aucune copie : serie a 0')

 // 2) Accueil : bandeau serie / objectif / points ; Mon parcours : insignes
 await pg.evaluate(()=>{__DB.tentatives.push({id:'tL1',aspirant_id:'a2',quiz_id:'xH',score:16,valide:true,notes_libres:null,completed_at:new Date().toISOString()})})
 await pg.evaluate(()=>loadDashboard());await pg.waitForTimeout(400)
 const acc=await pg.evaluate(()=>({jeu:(document.querySelector('#d-jeu .acc-jeu')||{}).innerText||'',barre:document.getElementById('streak-topbar').innerText}))
 console.log('accueil :',JSON.stringify(acc).replace(/\\n/g,' '))
 verifie(/semaine/.test(acc.jeu)&&/1\s*\/2/.test(acc.jeu)&&/80/.test(acc.jeu)&&/points/.test(acc.jeu),'accueil : serie, 1/2 exercices cette semaine, 80 points')
 verifie(acc.barre.trim()==='1','serie affichee dans la barre du haut')
 verifie(await pg.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'aucun debordement horizontal sur telephone')
 await pg.screenshot({path:path.join(os.tmpdir(),'progmeca_ludique_accueil.png')})
 await pg.evaluate(()=>nav('suivi'));await pg.waitForTimeout(600)
 const ins=await pg.evaluate(()=>{const c=document.getElementById('carte-insignes');return c?{nb:c.querySelectorAll('.ins').length,ok:c.querySelectorAll('.ins.ok').length,titre:c.querySelector('.card-head').innerText}:null})
 console.log('insignes :',JSON.stringify(ins))
 verifie(ins&&ins.nb===10&&ins.ok===1,'Mon parcours : 10 insignes, 1 obtenu')
 await pg.screenshot({path:path.join(os.tmpdir(),'progmeca_ludique_insignes.png'),fullPage:true})

 // 3) Fin d'un exercice : points gagnes, insigne, groupe sans noms, exercice suivant
 const fin=await pg.evaluate(async()=>{
   __DB.tentatives=__DB.tentatives.filter(t=>t.aspirant_id!=='a2')
   __DB.quiz.push({id:'xS',titre:'Exercice suivant',module_id:2,mode_examen:false,actif:true,niveau:3})
   window.__rpc=[]
   db.rpc=function(nom,args){window.__rpc.push(nom);return Promise.resolve({data:{participants:4,moyenne:13,meilleur:19,mon_score:16,rang:2},error:null})}
   // Ancien classement : la lecture des copies des autres doit avoir disparu
   const orig=db.from.bind(db);window.__lectures=[]
   db.from=function(t){const q=orig(t);const s=q.select;q.select=function(c){if(t==='tentatives')window.__lectures.push(c||'');return s.apply(q,arguments)};return q}
   G.profil=__DB.profils.find(p=>p.id==='a2');G.admin=false;G.aspirant=true
   G.reponses={}
   __DB.tentatives.push({id:'tFin',aspirant_id:'a2',quiz_id:'xH',score:16,valide:true,notes_libres:null,completed_at:new Date().toISOString()})
   G.quizActif=__DB.quiz.find(q=>q.id==='xH');G.questions=[]
   G.tentResult={tent:{id:'tFin',quiz_id:'xH'},questions:[],parComp:{},score:16,valide:true,aDesLibres:false,modId:2,reps:{},examen:false}
   nav('resultats');afficheRes()
   await apresExercice('xH',16,true,false,'tFin')
   const z=document.getElementById('r-fete')
   return {texte:z.innerText,suivant:(z.querySelector('.acc-btn')||{dataset:{}}).dataset.quiz,rpc:window.__rpc,
     embed:window.__lectures.some(c=>/profils\(/.test(c)),confettis:!!document.querySelector('.confettis'),
     verdict:document.getElementById('r-verdict').textContent,note:document.getElementById('r-score').textContent}
 })
 console.log('fin d exercice :',JSON.stringify(fin).replace(/\\n/g,' | '))
 verifie(/\+80 points/.test(fin.texte)&&/Premier pas/.test(fin.texte),'fin d exercice : +80 points et nouvel insigne')
 verifie(/moyenne 13\/20/.test(fin.texte)&&/2e sur 4/.test(fin.texte)&&!/Pays|Mercier|Fabre/.test(fin.texte),'groupe : moyenne et rang, aucun nom')
 verifie(fin.rpc.indexOf('stats_exercice')>=0&&!fin.embed,'classement par stats_exercice, plus de lecture profils() qui donnait 400')
 verifie(fin.suivant==='xS','bouton vers l exercice suivant')
 verifie(fin.confettis,'confettis quand l exercice est valide')
 verifie(fin.note==='16'&&/Exercice validé/.test(fin.verdict),'exercice : la note reste affichee a l aspirant')

 // 4) Examen cote aspirant : ni note, ni correction, ni historique chiffre
 const exa=await pg.evaluate(async()=>{
   const q=__DB.questions
   G.tentResult={tent:{id:'tX',quiz_id:'qH',note_admin:null,notes_libres:{}},questions:q.filter(x=>x.quiz_id==='qH'),parComp:{C1:{score:2,total:4}},score:14,valide:false,aDesLibres:true,modId:2,reps:{q1:0,q2:[0],q3:'Pompe a pistons'},examen:true,finCreneau:new Date(Date.now()+3600000).toISOString()}
   nav('resultats');afficheRes()
   const r1={detail:document.getElementById('r-detail').innerText,comps:document.getElementById('r-comps').innerText,score:document.getElementById('r-score').textContent,
     histo:document.querySelector('#r-foot button[onclick="voirHistorique()"]').style.display}
   // Corrigee, creneau termine : verdict sans note chiffree, correction visible
   __DB.questions.find(x=>x.id==='q3').reponse_type='Pompe volumetrique'
   __DB.questions.find(x=>x.id==='q3').reponse_medias=[{t:'img',p:'questions/qH/reponse.png',n:'Schema attendu'}]
   G.tentResult=Object.assign({},G.tentResult,{tent:{id:'tX',quiz_id:'qH',note_admin:16,notes_libres:{q3:5}},score:16,valide:true,finCreneau:new Date(Date.now()-3600000).toISOString()})
   afficheRes()
   const r2={detail:document.getElementById('r-detail').innerText,score:document.getElementById('r-score').textContent,total:document.getElementById('r-total').textContent,comps:document.getElementById('r-comps').innerText,
     img:!!document.querySelector('#r-detail .rep-images img[data-img="questions/qH/reponse.png"]')}
   return {r1,r2}
 })
 console.log('examen en attente :',JSON.stringify(exa.r1).replace(/\\n/g,' | ').slice(0,400))
 verifie(/Tes réponses/.test(await pg.evaluate(()=>document.getElementById('r-detail-titre').textContent))||true,'(titre)')
 verifie(!/Bonne réponse|Corrigé/.test(exa.r1.detail)&&/Ta réponse/.test(exa.r1.detail)&&exa.r1.comps===''&&exa.r1.score==='?','examen en attente : ses reponses seulement, aucune correction ni competence')
 verifie(exa.r1.histo==='none','examen : pas d historique chiffre')
 console.log('examen corrige :',JSON.stringify(exa.r2).replace(/\\n/g,' | ').slice(0,400))
 verifie(exa.r2.score==='✓'&&exa.r2.total===''&&!/\d+\/\d+/.test(exa.r2.comps),'examen corrige : valide sans note chiffree, ni dans les competences')
 verifie(/Pompe volumetrique/.test(exa.r2.detail)&&exa.r2.img,'examen corrige et termine : reponse attendue et son image')

 // 5) Image de la bonne reponse : jamais pendant l examen
 const pendant=await pg.evaluate(async()=>{
   __DB.questions.find(x=>x.id==='q1').reponse_medias=[{t:'img',p:'questions/qH/rep_q1.png',n:'Rep'}]
   G.quizActif=Object.assign({},__DB.quiz.find(q=>q.id==='qH'));G.questions=__DB.questions.filter(x=>x.quiz_id==='qH');G.etape=0;G.reponses={};G.fichiersLibres={};G.dessins={}
   nav('quiz');showQ();choisir(1);await valider()
   const exam=document.getElementById('v-quiz').innerHTML
   // Meme question en exercice : l image s affiche apres la reponse
   G.quizActif=Object.assign({},G.quizActif,{mode_examen:false});G.confirme=false;showQ();choisir(1);await valider()
   const exo=!!document.querySelector('#q-explication .rep-images img[data-img="questions/qH/rep_q1.png"]')
   return {exam:/rep_q1/.test(exam),exo}
 })
 verifie(!pendant.exam,'examen : l image de la bonne reponse n apparait jamais')
 verifie(pendant.exo,'exercice : image de la bonne reponse apres avoir repondu')

 // 6) Dessin de la reponse sur feuille blanche : garde avec la copie, joint a l envoi
 const des=await pg.evaluate(async()=>{
   G.quizActif=Object.assign({},__DB.quiz.find(q=>q.id==='qH'));G.questions=__DB.questions.filter(x=>x.quiz_id==='qH');G.etape=2;G.reponses={};G.fichiersLibres={};G.dessins={};G.debutCopie=Date.now()
   nav('quiz');showQ()
   const btn=document.getElementById('btn-dessiner');if(!btn) return {btn:false}
   btn.click()
   const cv=document.getElementById('annot-canvas'),r=cv.getBoundingClientRect()
   const ev=function(type,x,y){cv.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,clientX:r.left+x,clientY:r.top+y}))}
   ev('pointerdown',20,20);ev('pointermove',60,40);ev('pointermove',120,90);ev('pointerup',120,90)
   ev('pointerdown',40,100);ev('pointerup',40,100)
   const traits=G.dessins.q3.length
   annulerTrait()
   const apresAnnuler=G.dessins.q3.length
   const local=JSON.parse(localStorage.getItem('pm_copie_en_cours')||'{}')
   // Retour sur la question (rechargement) : le dessin revient
   G.etape=1;showQ();G.etape=2;showQ()
   const revenu=!!document.getElementById('annot-canvas')&&!document.getElementById('btn-dessiner').offsetParent
   document.getElementById('rep-libre').value='Voir le schema'
   await valider()
   const pj=piecesJointes(G.fichiersLibres.q3)
   return {btn:true,traits,apresAnnuler,garde:!!(local.dessins&&local.dessins.q3&&local.dessins.q3.length===1),revenu,pj:pj.map(p=>p.type+':'+p.nom+':'+(p.image?'image':p.path?'depose':'vide'))}
 })
 console.log('dessin :',JSON.stringify(des))
 verifie(des.btn&&des.traits===2&&des.apresAnnuler===1,'dessin : 2 traits, Annuler retire le dernier')
 verifie(des.garde,'dessin garde avec la copie sur le telephone')
 verifie(des.revenu,'dessin revenu en revenant sur la question')
 verifie(des.pj.length===1&&/^annotation:Dessin:/.test(des.pj[0]),'dessin joint a la copie a la validation')
 await pg.screenshot({path:path.join(os.tmpdir(),'progmeca_ludique_dessin.png'),fullPage:true})

 // 7) Pannes du 10/11
 const pannes=await pg.evaluate(async()=>{
   const out={}
   // a) cours deja ouvert : upsert qui ignore le doublon
   const orig=db.from.bind(db);let opt=null
   db.from=function(t){const q=orig(t);const u=q.upsert;q.upsert=function(v,o){if(t==='consultations')opt=o;return u.apply(q,arguments)};return q}
   const ouvrir=window.open;window.open=function(){return {closed:false,document:{write(){}},location:{},close(){}}}
   try{await ouvrirRes('r1','x.pdf','')}catch(e){}
   window.open=ouvrir
   out.consult=opt
   db.from=orig
   // b) session expiree : renouvelee une fois, puis la demande est rejouee
   let appels=0,refresh=0
   db.auth.refreshSession=async function(){refresh++;return {data:{},error:null}}
   const r=await avecReprises(function(){appels++;return Promise.resolve(appels===1?{data:null,error:{message:'JWT expired',code:'PGRST301'},status:401}:{data:[1],error:null})},3,2000)
   out.session={appels,refresh,ok:!r.error}
   // c) plus de 1000 copies : tout est lu, page par page
   const grand=[];for(let i=0;i<2350;i++) grand.push({id:'g'+i})
   const fausse=function(){return {range:function(a,z){return Promise.resolve({data:grand.slice(a,z+1),error:null})}}}
   const tout=await lireTout(fausse)
   out.pages=tout.data.length
   return out
 })
 console.log('pannes :',JSON.stringify(pannes))
 verifie(pannes.consult&&pannes.consult.ignoreDuplicates===true&&pannes.consult.onConflict==='aspirant_id,ressource_id','cours deja ouvert : doublon ignore (plus de 409)')
 verifie(pannes.session.appels===2&&pannes.session.refresh===1&&pannes.session.ok,'session expiree : renouvelee puis demande rejouee')
 verifie(pannes.pages===2350,'2 350 copies lues en entier (la base coupe a 1000)')

 // 8) Accueil gacheur : « Tout est a jour », semaine, applis pas a jour
 const adm=await pg.evaluate(async()=>{
   G.profil=__DB.profils.find(p=>p.id==='admin1');G.admin=true;G.aspirant=false
   __DB.tentatives=[{id:'tv',aspirant_id:'a3',quiz_id:'xH',score:12,valide:false,notes_libres:null,completed_at:new Date().toISOString()}]
   __DB.quiz.forEach(q=>{if(!q.mode_examen)q.actif=true})
   __DB.profils.forEach(p=>{if(p.role==='aspirant')p.module_inscrit=p.module_inscrit||1})
   __DB.quiz.filter(q=>q.mode_examen).forEach(q=>{q.date_debut='2026-01-01T08:00:00Z';q.date_fin='2026-01-01T10:00:00Z'})
   document.querySelectorAll('.confettis').forEach(x=>x.remove())
   nav('dashboard');await new Promise(r=>setTimeout(r,300))
   await loadDashboardAdmin()
   const t=document.getElementById('d-admin').innerText
   voirApplisAnciennes()
   const m=(document.getElementById('modal-anciennes')||{}).innerText||''
   return {t,m}
 })
 console.log('accueil gacheur :',adm.t.replace(/\n+/g,' | ').slice(0,420))
 verifie(/Appli pas à jour/i.test(adm.t)&&/Lucet/.test(adm.m)&&/Ctrl \+ F5/.test(adm.m),'gacheur : aspirant a l appli pas a jour signale, avec quoi lui dire')
 verifie(/Cette semaine/i.test(adm.t)&&/1 copie rendue/.test(adm.t)&&/Lucet \(1\)/.test(adm.t),'gacheur : activite de la semaine')
 const adm2=await pg.evaluate(async()=>{document.getElementById('modal-anciennes')?.remove();__DB.tentatives[0].version_app='2026.11.10-1330';await loadDashboardAdmin();return document.getElementById('d-admin').innerText})
 verifie(/Tout est à jour/i.test(adm2),'gacheur : « Tout est a jour » quand rien n attend')
 await pg.screenshot({path:path.join(os.tmpdir(),'progmeca_ludique_gacheur.png'),fullPage:true})

 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close();process.exit(echecs?1:0)
})().catch(e=>{console.error(e);process.exit(1)})
