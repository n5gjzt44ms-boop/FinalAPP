// Examen d'essai : meme parcours qu'un examen, mais rien n'est ecrit en base
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
 const photo=Buffer.from(await pg.evaluate(()=>{const c=document.createElement('canvas');c.width=300;c.height=200;c.getContext('2d').fillRect(0,0,100,100);return c.toDataURL('image/jpeg').split(',')[1]}),'base64')
 // Toute ecriture en base et tout depot sont notes
 await pg.evaluate(()=>{
   window.__ecrit=[];window.__depots=[];window.__retraits=[];window.__panne=false
   const orig=db.from.bind(db)
   db.from=function(t){const q=orig(t);['insert','update','delete','upsert'].forEach(m=>{const o=q[m];q[m]=function(){window.__ecrit.push(t+'.'+m);return o.apply(q,arguments)}})
     if(t==='quiz'){const s=q.select;q.select=function(){if(window.__panne){const c={limit(){return c},then(res){res({data:null,error:{message:'Failed to fetch'}})}};return c};return s.apply(q,arguments)}}
     return q}
   const st=db.storage.from;db.storage.from=function(){const o=st.apply(this,arguments)
     o.upload=async function(p){window.__depots.push(p);return {}}
     o.remove=async function(l){window.__retraits.push(...l);return {data:[]}}
     return o}
   G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a2')
 })
 // 1) La carte apparait sur l'accueil d'un aspirant inscrit
 const carte=await pg.evaluate(async()=>{await loadDashboard();return document.getElementById('d-rappel').innerText})
 console.log('accueil :',carte.replace(/\n+/g,' | ').slice(0,90))
 verifie(carte.includes("examen d'essai"),'carte visible sur l accueil')
 // 2) Parcours complet : QCM, choix multiple, texte et photo
 await pg.evaluate(()=>commencerEssai());await pg.waitForTimeout(300)
 verifie(await pg.evaluate(()=>document.getElementById('v-quiz').classList.contains('on')&&G.questions.length===3),'essai ouvert en vue examen')
 await pg.evaluate(()=>{choisir(0)});await pg.evaluate(()=>valider());await pg.waitForTimeout(100)
 console.log('apres QCM :',await pg.evaluate(()=>document.getElementById('q-opts').innerText.includes('Réponse enregistrée')))
 await pg.evaluate(()=>suivant());await pg.evaluate(()=>{choisirMulti(1)});await pg.evaluate(()=>valider());await pg.waitForTimeout(100)
 await pg.evaluate(()=>suivant());await pg.waitForTimeout(100)
 await pg.fill('#rep-libre','Mon croquis');await pg.setInputFiles('#fichier-libre',{name:'croquis.jpg',mimeType:'image/jpeg',buffer:photo})
 await pg.waitForTimeout(1200)
 // 3) Rechargement de la page (appareil photo sur iPhone) : l'essai reprend
 await pg.evaluate(()=>{sauverCopieEnCours()})
 await pg.reload();await pg.waitForTimeout(2200)
 await pg.evaluate(()=>{document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove())
   window.__ecrit=[];window.__depots=window.__depots||[];window.__retraits=[]
   const orig=db.from.bind(db);db.from=function(t){const q=orig(t);['insert','update','delete','upsert'].forEach(m=>{const o=q[m];q[m]=function(){window.__ecrit.push(t+'.'+m);return o.apply(q,arguments)}});return q}
   const st=db.storage.from;db.storage.from=function(){const o=st.apply(this,arguments);o.upload=async function(){return {}};o.remove=async function(l){window.__retraits.push(...l);return {data:[]}};return o}
   G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a2')})
 const repris=await pg.evaluate(async()=>{await reprendreCopie();return {essai:!!(G.quizActif&&G.quizActif.essai),rep:G.reponses.essai3||'',pj:piecesJointes(G.fichiersLibres.essai3).length,chemin:piecesJointes(G.fichiersLibres.essai3)[0].path}})
 console.log('reprise :',JSON.stringify(repris))
 verifie(repris.essai&&repris.pj===1&&repris.chemin.includes('/essai_'),'essai repris avec sa photo, nom marque essai_')
 // 4) Fin : aucune ecriture en base, photo retiree, resultat affiche
 await pg.evaluate(()=>valider());await pg.waitForTimeout(100)
 await pg.evaluate(()=>terminer());await pg.waitForTimeout(800)
 const fin=await pg.evaluate(()=>({ecrit:window.__ecrit,retraits:window.__retraits.length,verdict:document.getElementById('r-verdict').textContent,titre:document.getElementById('r-detail-titre').textContent,fait:!!localStorage.getItem('pm_essai_fait'),local:localStorage.getItem('pm_copie_en_cours')}))
 console.log('fin :',JSON.stringify(fin))
 verifie(fin.ecrit.length===0,'aucune ecriture en base')
 verifie(fin.retraits===1,'photo d essai retiree')
 verifie(fin.verdict==='Ton téléphone est prêt'&&fin.fait&&!fin.local,'resultat affiche, essai note comme fait')
 await pg.screenshot({path:path.join(require('os').tmpdir(),'progmeca_essai.png')})
 // 5) Second appel (fin du minuteur) : rien ne se passe
 await pg.evaluate(()=>terminer());await pg.waitForTimeout(200)
 verifie(await pg.evaluate(()=>window.__retraits.length)===1,'pas de second traitement')
 // 6) Sans photo : pas de faux "pret"
 await pg.evaluate(()=>localStorage.removeItem('pm_essai_fait'))
 await pg.evaluate(()=>commencerEssai());await pg.waitForTimeout(200)
 const sans=await pg.evaluate(async()=>{await terminer();return {verdict:document.getElementById('r-verdict').textContent,fait:!!localStorage.getItem('pm_essai_fait')}})
 console.log('sans photo :',JSON.stringify(sans))
 verifie(sans.verdict==='Encore un point à vérifier'&&!sans.fait,'sans photo, l essai n est pas valide')
 // 7) Un vrai examen en cours n'est jamais ecrase par l'essai
 const garde=await pg.evaluate(async()=>{localStorage.setItem('pm_copie_en_cours',JSON.stringify({quizId:'qH',reponses:{q1:1},quand:Date.now()}));G.quizActif=null;await commencerEssai();const x=JSON.parse(localStorage.getItem('pm_copie_en_cours')).quizId;localStorage.removeItem('pm_copie_en_cours');return x})
 verifie(garde==='qH','vrai examen en cours conserve')
 // 7 bis) Coupure reseau a l'envoi de l'essai : meme ecran qu'un vrai examen, puis reprise seule
 const coupe=await pg.evaluate(async()=>{await commencerEssai()
   const f=db.from;db.from=function(t){const q=f(t);if(t==='quiz'){q.select=function(){const c={limit(){return c},then(res){res({data:null,error:{message:'Failed to fetch'}})}};return c}};return q}
   await terminer();const r={attente:G.aEnvoyer,ecran:document.getElementById('r-detail').innerText.includes('pas encore partie'),local:JSON.parse(localStorage.getItem('pm_copie_en_cours')||'{}').aEnvoyer}
   db.from=f;window.dispatchEvent(new Event('online'));return r})
 console.log('coupure pendant l essai :',JSON.stringify(coupe))
 verifie(coupe.attente&&coupe.ecran&&coupe.local,'essai garde pendant la coupure')
 await pg.waitForTimeout(800)
 const apres=await pg.evaluate(()=>({attente:G.aEnvoyer,verdict:document.getElementById('r-verdict').textContent,local:localStorage.getItem('pm_copie_en_cours')}))
 console.log('retour du reseau :',JSON.stringify(apres))
 verifie(!apres.attente&&apres.verdict==='Encore un point à vérifier'&&!apres.local,'essai repart seul au retour du reseau')
 // 8) Un resultat de quiz normal retrouve son affichage
 const r8=await pg.evaluate(()=>{G.tentResult={tent:{note_admin:null},questions:[],parComp:{},score:0,valide:false,aDesLibres:true,modId:2,reps:{}};afficheRes();return {t:document.getElementById('r-detail-titre').textContent,f:document.getElementById('r-foot').style.display}})
 verifie(r8.t==='Détail des réponses'&&r8.f==='','affichage normal retabli apres un essai')
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()})()
