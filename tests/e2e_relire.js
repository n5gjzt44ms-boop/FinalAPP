// Exercices prives a relire sur l'accueil gacheur : liste, relecture avec
// reponses attendues, schemas et cours, publication depuis l'accueil.
const {chromium}=require('playwright');const fs=require('fs')
;(async()=>{
 const path=require('path'),os=require('os')
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const SP=fs.mkdtempSync(path.join(os.tmpdir(),'progmeca-'))
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}})
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{console.log('DIALOG:',d.message().slice(0,90).replace(/\n/g,' '));d.accept()})
 await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8'),contentType:'application/javascript'})
   if(u.startsWith('file:')) return r.continue()
   return r.fulfill({body:'',contentType:'application/javascript'})})
 await pg.goto('file://'+FICHIER);await pg.waitForTimeout(2200)
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))
 await pg.evaluate(()=>{
   __DB.quiz.push(
     {id:'xP1',titre:"Chaîne à rouleaux : l'allongement",module_id:1,niveau:31,mode_examen:false,actif:false,archive:false,created_at:'2026-11-09T06:30:00Z',cours_lies:[{u:'https://example.com/guide.pdf',n:'Guide du fabricant'}]},
     {id:'xP2',titre:'Capteur 4-20 mA',module_id:4,niveau:28,mode_examen:false,actif:false,created_at:'2026-11-09T06:31:00Z'},
     {id:'xA',titre:'Exercice archivé',module_id:4,niveau:22,mode_examen:false,actif:false,archive:true},
     {id:'qE',titre:'Examen privé',module_id:4,mode_examen:true,actif:false,date_debut:new Date(Date.now()+20*864e5).toISOString(),date_fin:new Date(Date.now()+20*864e5+7200e3).toISOString()})
   __DB.questions.push(
     {id:'p1',quiz_id:'xP1',ordre:1,enonce:"Quel allongement impose le remplacement d'une chaîne ?",type_question:'qcm',options:['0,5 %','1,5 %','5 %'],bonne_reponse:1,points:2,reponse_type:'Source : guide, page 12.',medias:[{t:'img',p:'https://example.com/illustrations/e15_chaine.svg',n:'Chaîne'},{t:'pdf',p:'questions/doc.pdf',n:'Fiche'}]},
     {id:'p2',quiz_id:'xP1',ordre:2,enonce:'Causes d’usure ?',type_question:'multi',options:['Manque de graisse','Désalignement','Couleur'],bonnes_reponses:[0,1],points:3},
     {id:'p3',quiz_id:'xP1',ordre:3,enonce:'Décris la mesure.',type_question:'libre',options:[],points:3,reponse_type:'Mesurer sur 10 maillons sous tension.'},
     {id:'p4',quiz_id:'xP2',ordre:1,enonce:'Calcule le signal.',type_question:'libre',options:[],points:4})
   // La base enregistre vraiment la publication (le faux Supabase ne modifie rien)
   const f=db.from.bind(db);window.__publies=[]
   db.from=function(t){const o=f(t);if(t!=='quiz')return o
     const up=o.update;o.update=function(v){o._maj=v;return up.apply(this,arguments)}
     const th=o.then;o.then=function(res,rej){
       if(o._maj){
         if(window.__refus) return Promise.resolve({data:[],error:null}).then(res,rej)
         const rows=__DB.quiz.filter(r=>o.f.every(fn=>fn(r)));rows.forEach(r=>Object.assign(r,o._maj));window.__publies.push(...rows.map(r=>r.id))}
       return th.call(this,res,rej)}
     return o}
 })
 await pg.evaluate(async()=>{G.admin=true;G.profil=__DB.profils[0];nav('dashboard');await loadDashboard()});await pg.waitForTimeout(600)
 const texte=()=>pg.evaluate(()=>document.getElementById('d-admin').innerText.replace(/\n+/g,' | '))
 const t0=await texte()
 console.log('À faire :',(t0.match(/Exercices à relire \| [^|]+\| \d+/)||['absent'])[0])
 console.log('Section :',(t0.match(/EXERCICES À RELIRE[^]*?(?=RACCOURCIS|RATTRAPAGES|$)/i)||['absente'])[0].slice(0,400))
 console.log('archivé affiché :',t0.includes('Exercice archivé'),'| examen privé dans la liste :',await pg.evaluate(()=>!!document.querySelector('#d-admin .adm-row[data-quiz="qE"]')))
 await pg.screenshot({path:SP+'/relire_accueil.png',fullPage:true})
 // Relecture de l'exercice 1 (titre avec apostrophe)
 await pg.evaluate(()=>document.querySelector('#d-admin .adm-row[data-quiz="xP1"]').click());await pg.waitForSelector('#modal-previsu',{timeout:5000});await pg.waitForTimeout(900)
 const m1=await pg.evaluate(()=>document.getElementById('modal-previsu').innerText.replace(/\n+/g,' | '))
 console.log('Relecture :',m1.slice(0,700))
 console.log('images :',await pg.evaluate(()=>document.querySelectorAll('#modal-previsu img[data-img]').length),'| bouton PDF :',await pg.evaluate(()=>[...document.querySelectorAll('#modal-previsu button')].some(x=>x.innerText.includes('Fiche'))),'| bonnes réponses en vert :',await pg.evaluate(()=>document.querySelectorAll('#modal-previsu .ti-circle-check').length))
 console.log('boutons :',await pg.evaluate(()=>[...document.querySelectorAll('#modal-previsu button')].map(x=>x.innerText.trim()).filter(Boolean).slice(-4).join(' · ')))
 await pg.screenshot({path:SP+'/relire_fenetre.png'})
 // Publier depuis la fenetre
 await pg.evaluate(()=>document.getElementById('previsu-publier').click());await pg.waitForTimeout(800)
 console.log('publiés :',await pg.evaluate(()=>__publies.join(',')),'| fenêtre fermée :',await pg.evaluate(()=>!document.getElementById('modal-previsu')),'| actif en base :',await pg.evaluate(()=>__DB.quiz.find(q=>q.id==='xP1').actif))
 console.log('Section après :',((await texte()).match(/EXERCICES À RELIRE · \d+/i)||['absente'])[0])
 // Refus silencieux de la base : signale, ne publie pas
 await pg.evaluate(()=>{window.__refus=true;document.querySelector('#d-admin .adm-row[data-quiz="xP2"] button').click()});await pg.waitForTimeout(600)
 console.log('refus → toast :',await pg.evaluate(()=>(document.getElementById('toast')||{}).innerText||''),'| fenêtre ouverte par erreur :',await pg.evaluate(()=>!!document.getElementById('modal-previsu')))
 // Publier depuis la ligne de l'accueil (sans ouvrir la relecture)
 await pg.evaluate(()=>{window.__refus=false;document.querySelector('#d-admin .adm-row[data-quiz="xP2"] button').click()});await pg.waitForTimeout(800)
 console.log('publiés :',await pg.evaluate(()=>__publies.join(',')),'| fenêtre ouverte par erreur :',await pg.evaluate(()=>!!document.getElementById('modal-previsu')),'| section restante :',(await texte()).includes('EXERCICES À RELIRE')||(await texte()).includes('Exercices à relire'))
 // Exercice deja publie et examen : pas de bouton Publier dans la relecture
 await pg.evaluate(()=>previsualiserQuiz('xH'));await pg.waitForTimeout(500)
 console.log('exercice publié → Publier :',await pg.evaluate(()=>!!document.getElementById('previsu-publier')),'| alerte sans cours :',await pg.evaluate(()=>document.getElementById('modal-previsu').innerText.includes('Aucun cours')))
 await pg.evaluate(()=>previsualiserQuiz('qH'));await pg.waitForTimeout(500)
 console.log('examen → Publier :',await pg.evaluate(()=>!!document.getElementById('previsu-publier')),'| Corrigé :',await pg.evaluate(()=>[...document.querySelectorAll('#modal-previsu button')].some(x=>x.innerText.includes('Corrigé'))),'| une seule fenêtre :',await pg.evaluate(()=>document.querySelectorAll('#modal-previsu').length))
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()})()
