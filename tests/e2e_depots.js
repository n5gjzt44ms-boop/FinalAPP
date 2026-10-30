// Doublon refuse par la base, depots en echec, suppression d'un quiz avec copies
const {chromium}=require('playwright');const fs=require('fs')
;(async()=>{
 const path=require('path')
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}})
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept())
 await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8'),contentType:'application/javascript'})
   if(u.startsWith('file:')||u.startsWith('blob:')||u.startsWith('data:')) return r.continue()
   return r.fulfill({body:'',contentType:'application/javascript'})})
 await pg.goto('file://'+FICHIER);await pg.waitForTimeout(2200)
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))
 const verifie=(ok,msg)=>{console.log((ok?'ok : ':'ECHEC : ')+msg);if(!ok)throw new Error(msg)}
 // Ecritures refusees a la demande : chaque test choisit la table concernee
 await pg.evaluate(()=>{
   const orig=db.from.bind(db);window.__refus={};window.__ecrit=[]
   db.from=function(t){const q=orig(t);['insert','update','delete'].forEach(m=>{const o=q[m];q[m]=function(v){
     window.__ecrit.push({t,m,v})
     if(window.__refus[t]){const c={select(){return c},eq(){return c},single(){return c},then(res){res({data:null,error:{message:window.__refus[t]}})}};return c}
     // Comme la vraie base : une ecriture sur les rendus renvoie la ligne ecrite
     if(t==='rendus'){const c={select(){return c},eq(){return c},then(res){res({data:[{id:'rendu1'}],error:null})}};return c}
     return o.apply(q,arguments)}});return q}
   window.__stock=null
   const st=db.storage.from;db.storage.from=function(){const o=st.apply(this,arguments);const up=o.upload;o.upload=async function(){return window.__stock?{error:{message:window.__stock}}:up.apply(o,arguments)};return o}
 })
 // 1) La base refuse le doublon : la copie deja arrivee compte, rien n'est efface
 const r1=await pg.evaluate(async()=>{G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a2');__DB.rattrapages=[{quiz_id:'qH',aspirant_id:'a2',date_limite:'2030-01-01T00:00:00Z'}]
   await commencer('qH')
   const f=db.from;let essais=0
   db.from=function(t){const q=f(t);if(t!=='tentatives')return q;const ins=q.insert;q.insert=function(){essais++
     __DB.tentatives.push({id:'tDup',aspirant_id:'a2',quiz_id:'qH',score:0,reponses:{},commence_le:new Date(G.debutCopie).toISOString()})
     const c={select(){return c},single(){return c},then(res){res({data:null,error:{code:'23505',message:'duplicate key value'}})}};return c};return q}
   G.reponses[G.questions[0].id]=1;await terminer();db.from=f
   return {essais,attente:!!G.aEnvoyer,local:localStorage.getItem('pm_copie_en_cours'),garde:__DB.tentatives.some(x=>x.id==='tDup'),supp:window.__ecrit.filter(x=>x.t==='tentatives'&&x.m==='delete').length}})
 console.log('doublon :',JSON.stringify(r1))
 verifie(r1.essais===1&&!r1.attente&&!r1.local&&r1.garde&&r1.supp===0,'doublon traite comme copie deja envoyee')
 // 2) Devoir : fichier refuse par le stockage
 const r2=await pg.evaluate(async()=>{G.admin=true;G.profil=__DB.profils.find(p=>p.id==='admin1');window.__ecrit=[];window.__stock='refus du stockage'
   const el=document.createElement('div');el.id='rendu-status-d1';document.body.appendChild(el)
   await deposerRendu('d1',{files:[new File(['x'],'rapport.pdf',{type:'application/pdf'})]})
   window.__stock=null
   return {statut:el.textContent,ecrit:window.__ecrit.filter(x=>x.t==='rendus').length}})
 console.log('devoir, stockage refuse :',JSON.stringify(r2))
 verifie(r2.statut.includes('Échec')&&r2.ecrit===0,'depot en echec annonce, rien enregistre')
 // 3) Devoir : fichier parti mais fiche refusee par la base
 const r3=await pg.evaluate(async()=>{window.__refus={rendus:'refus de la base'}
   await deposerRendu('d1',{files:[new File(['x'],'rapport.pdf',{type:'application/pdf'})]})
   window.__refus={}
   return document.getElementById('rendu-status-d1').textContent})
 console.log('devoir, base refuse :',r3)
 verifie(r3.includes('non enregistré'),'fiche refusee annoncee')
 // 4) Devoir : tout va bien
 const r4=await pg.evaluate(async()=>{await deposerRendu('d1',{files:[new File(['x'],'rapport.pdf',{type:'application/pdf'})]});return document.getElementById('rendu-status-d1').textContent})
 console.log('devoir, tout va bien :',r4)
 verifie(r4.includes('déposé'),'depot reussi annonce')
 // 5) Ressource : fiche refusee, pas de faux "publiee"
 await pg.setInputFiles('#up-fichier',{name:'cours.pdf',mimeType:'application/pdf',buffer:Buffer.from('x')})
 const r5=await pg.evaluate(async()=>{document.getElementById('up-titre').value='Cours';window.__refus={ressources:'refus de la base'}
   await uploadRes();window.__refus={}
   return document.getElementById('toast').textContent})
 console.log('ressource refusee :',r5)
 verifie(r5.includes('NON publiée'),'ressource refusee annoncee')
 // 6) Quiz avec copies : archive, aucune copie effacee
 const r6=await pg.evaluate(async()=>{window.__ecrit=[];await delQuiz('qM')
   return {suppr:window.__ecrit.filter(x=>x.m==='delete').length,archive:window.__ecrit.filter(x=>x.t==='quiz'&&x.m==='update'&&x.v.archive===true).length,toast:document.getElementById('toast').textContent}})
 console.log('quiz avec copies :',JSON.stringify(r6))
 verifie(r6.suppr===0&&r6.archive===1,'quiz archive, copies conservees')
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()})()
