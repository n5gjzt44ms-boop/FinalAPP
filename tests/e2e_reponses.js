// Bonnes reponses des examens cachees aux aspirants : l'appli lit les examens
// dans la vue questions_eleve (sans les reponses), les exercices dans la table,
// et l'ecran de resultat n'affiche le corrige d'un examen que si la base le donne.
const {chromium}=require('playwright');const fs=require('fs'),path=require('path')
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
 // Espion : quelles tables l'appli lit
 await pg.evaluate(()=>{
   window.__lus=[];const orig=db.from.bind(db);window.__fromOrig=orig
   db.from=function(t){window.__lus.push(t);return orig(t)}
   G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a2')
   const q=__DB.quiz.find(x=>x.id==='qH');q.date_debut=new Date(Date.now()-600000).toISOString();q.date_fin=new Date(Date.now()+3600000).toISOString()
   __DB.tentatives=__DB.tentatives.filter(t=>t.aspirant_id!=='a2')
 })

 // 1) Examen : questions lues dans la vue, sans aucune bonne reponse
 const r1=await pg.evaluate(async()=>{
   window.__lus=[]
   await commencer('qH');await new Promise(r=>setTimeout(r,400))
   return {lus:window.__lus.filter(t=>/questions/.test(t)),nb:G.questions.length,
     reponses:G.questions.some(q=>'bonne_reponse' in q||'bonnes_reponses' in q||'reponse_type' in q)}
 })
 console.log('examen :',JSON.stringify(r1))
 verifie(r1.lus.indexOf('questions_eleve')>=0&&r1.lus.indexOf('questions')<0,'examen : lu dans la vue questions_eleve, jamais dans la table')
 verifie(r1.nb===4&&!r1.reponses,'examen : 4 questions, aucune bonne reponse sur le telephone')

 // 2) Envoi de la copie d'examen : relu dans la vue, copie partie, aucune correction
 const r2=await pg.evaluate(async()=>{
   window.__lus=[];window.__ins=[]
   const orig=window.__fromOrig
   // Comme la vraie base : l'envoi renvoie la copie creee (note_admin vide)
   db.from=function(t){window.__lus.push(t);const q=orig(t);const ins=q.insert;q.insert=function(v){
     if(t!=='tentatives') return ins.apply(q,arguments)
     window.__ins.push(v);const c={select(){return c},single(){return c},then(res){res({data:Object.assign({id:'tNouv',note_admin:null},v),error:null})}};return c};return q}
   G.reponses={q1:1,q2:[0,2],q3:'Pompe a pistons'}
   await terminer();await new Promise(r=>setTimeout(r,600))
   return {lus:window.__lus.filter(t=>/questions/.test(t)),envois:window.__ins.length,
     detail:document.getElementById('r-detail').innerText,verdict:document.getElementById('r-verdict').textContent}
 })
 console.log('envoi :',JSON.stringify(r2).replace(/\\n/g,' | ').slice(0,420))
 verifie(r2.lus.indexOf('questions_eleve')>=0&&r2.lus.indexOf('questions')<0&&r2.envois>=1,'envoi : copie partie, questions relues dans la vue')
 verifie(/attente/i.test(r2.verdict)&&!/Bonne réponse/.test(r2.detail),'envoi : « en attente », aucune bonne reponse affichee')

 // 3) Exercice : lu dans la table (la bonne reponse s'affiche apres chaque question)
 const r3=await pg.evaluate(async()=>{
   db.from=function(t){window.__lus.push(t);return window.__fromOrig(t)}
   __DB.questions.push({id:'qx1',quiz_id:'xH',ordre:1,enonce:'Filtre ?',type_question:'qcm',options:['a','b'],bonne_reponse:1,points:2})
   window.__lus=[]
   await commencer('xH');await new Promise(r=>setTimeout(r,400))
   return {lus:window.__lus.filter(t=>/questions/.test(t)),bonne:G.questions[0]&&G.questions[0].bonne_reponse}
 })
 console.log('exercice :',JSON.stringify(r3))
 verifie(r3.lus.indexOf('questions')>=0&&r3.lus.indexOf('questions_eleve')<0&&r3.bonne===1,'exercice : lu dans la table, comme avant')

 // 4) Resultat d'un examen corrige et termine : corrige donne par la base
 const r4=await pg.evaluate(async()=>{
   const q=__DB.quiz.find(x=>x.id==='qH');q.date_fin=new Date(Date.now()-3600000).toISOString()
   __DB.tentatives.push({id:'tC',aspirant_id:'a2',quiz_id:'qH',score:15,valide:true,note_admin:15,notes_libres:{q3:4},completed_at:new Date().toISOString(),reponses:{q1:1,q2:[0,2],q3:'Pompe'}})
   await voirRes('tC');await new Promise(r=>setTimeout(r,300))
   const avec=document.getElementById('r-detail').innerText
   // La base refuse le corrige (droit pas encore acquis) : rien d'affiche
   const rpc=db.rpc;db.rpc=function(){return Promise.resolve({data:[],error:null})}
   await voirRes('tC');await new Promise(r=>setTimeout(r,300))
   const sans=document.getElementById('r-detail').innerText
   db.rpc=rpc
   return {avec,sans}
 })
 console.log('corrige donne :',r4.avec.replace(/\n+/g,' | ').slice(0,200))
 console.log('corrige refuse :',r4.sans.replace(/\n+/g,' | ').slice(0,200))
 verifie(/Bonne réponse/.test(r4.avec),'examen corrige et termine : corrige affiche quand la base le donne')
 verifie(!/Bonne réponse/.test(r4.sans)&&/correction s'affichera/.test(r4.sans),'corrige refuse par la base : seulement ses reponses')

 // 5) Vue absente (base pas encore mise a jour) : repli sur la table, rien ne casse
 const r5=await pg.evaluate(async()=>{
   db.from=function(t){
     if(t==='questions_eleve'){const c={select(){return c},eq(){return c},order(){return c},then(res){res({data:null,error:{message:'relation "public.questions_eleve" does not exist'}})}};return c}
     return window.__fromOrig(t)}
   const r=await lireQuestions('qH',true)
   return {nb:(r.data||[]).length,erreur:!!r.error}
 })
 console.log('vue absente :',JSON.stringify(r5))
 verifie(r5.nb===4&&!r5.erreur,'vue absente : repli sur la table')

 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close();process.exit(echecs?1:0)
})().catch(e=>{console.error(e);process.exit(1)})
