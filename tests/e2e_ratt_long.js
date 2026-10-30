// Scénario réel : examen terminé hier, rattrapage ouvert, l'aspirant repasse.
const {chromium}=require('playwright');const fs=require('fs')
;(async()=>{
 const path=require('path'),os=require('os')
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const SP=fs.mkdtempSync(path.join(os.tmpdir(),'progmeca-'))  // captures et fichiers temporaires
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}})
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept())
 await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8'),contentType:'application/javascript'})
   if(u.startsWith('file:')) return r.continue()
   return r.fulfill({body:'',contentType:'application/javascript'})})
 await pg.goto('file://'+FICHIER);await pg.waitForTimeout(2200)
 console.log('version testée :',await pg.evaluate(()=>VERSION_APP))
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))
 await pg.evaluate(()=>{
   const q=__DB.quiz.find(x=>x.id==='qM') // Moteur, module 1 : Gabin (a3) a déjà une copie t3
   q.date_debut='2026-10-27T18:00:00Z';q.date_fin='2026-10-27T20:00:00Z'
   __DB.questions.push({id:'m1',quiz_id:'qM',ordre:1,enonce:'Cylindrée ?',type_question:'qcm',options:['a','b','c'],bonne_reponse:0,points:2},{id:'m2',quiz_id:'qM',ordre:2,enonce:'Explique',type_question:'libre',options:[],points:4})
   __DB.rattrapages=[{quiz_id:'qM',aspirant_id:'a3',date_limite:'2026-11-10T22:59:00Z'}]
   const orig=db.from.bind(db);window.__ins=[];db.from=function(t){const qq=orig(t);const ins=qq.insert;qq.insert=function(v){if(t==='tentatives')window.__ins.push({quand:Date.now(),nb:Object.keys(v.reponses||{}).length});return ins.apply(qq,arguments)};return qq}
   G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a3')
 })
 // 1) Depuis la page du module : bouton « Repasser »
 await pg.evaluate(async()=>{document.body.insertAdjacentHTML('beforeend','<div id="o-eval-test" style="display:none"></div>')})
 await pg.evaluate(async()=>{await ouvrirModule(1)});await pg.waitForTimeout(1500)
 const bouton=await pg.evaluate(()=>{const b=[...document.querySelectorAll('#o-eval button')].find(x=>/Repasser|Rattrapage/.test(x.innerText));return b?b.innerText.trim():null})
 console.log('bouton sur la page du module :',bouton)
 await pg.evaluate(()=>{const b=[...document.querySelectorAll('#o-eval button')].find(x=>/Repasser|Rattrapage/.test(x.innerText));b&&b.click()})
 await pg.waitForTimeout(1500)
 console.log('après clic → page',await pg.evaluate(()=>localStorage.getItem('pm_page')),'| minuteur',await pg.evaluate(()=>document.getElementById('q-timer').textContent))
 console.log('attente 65 s sans rien faire…')
 await pg.waitForTimeout(65000)
 console.log('après 65 s → page',await pg.evaluate(()=>localStorage.getItem('pm_page')),'| copies envoyées',await pg.evaluate(()=>window.__ins.length),'| minuteur',await pg.evaluate(()=>document.getElementById('q-timer').textContent))
 // 2) Rechargement de la page (appareil photo) puis reprise
 await pg.evaluate(()=>{choisir(0);valider()});await pg.waitForTimeout(300)
 await pg.evaluate(()=>{sauverCopieEnCours()})
 const sauv=await pg.evaluate(()=>JSON.parse(localStorage.getItem('pm_copie_en_cours')))
 console.log('sauvegarde locale : fin de l examen enregistrée =',sauv.finExamen?new Date(sauv.finExamen).toLocaleTimeString('fr-FR'):null)
 await pg.reload();await pg.waitForTimeout(2500)
 await pg.evaluate(()=>{G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a3');__DB.rattrapages=[{quiz_id:'qM',aspirant_id:'a3',date_limite:'2026-11-10T22:59:00Z'}];const q=__DB.quiz.find(x=>x.id==='qM');q.date_debut='2026-10-27T18:00:00Z';q.date_fin='2026-10-27T20:00:00Z';__DB.questions.push({id:'m1',quiz_id:'qM',ordre:1,enonce:'Cylindrée ?',type_question:'qcm',options:['a','b','c'],bonne_reponse:0,points:2},{id:'m2',quiz_id:'qM',ordre:2,enonce:'Explique',type_question:'libre',options:[],points:4})
   const orig=db.from.bind(db);window.__ins=[];db.from=function(t){const qq=orig(t);const ins=qq.insert;qq.insert=function(v){if(t==='tentatives')window.__ins.push({nb:Object.keys(v.reponses||{}).length});return ins.apply(qq,arguments)};return qq}})
 await pg.evaluate(async()=>{document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove());await reprendreCopie()});await pg.waitForTimeout(8000)
 console.log('reprise → page',await pg.evaluate(()=>localStorage.getItem('pm_page')),'| copies envoyées',await pg.evaluate(()=>window.__ins.length),'| minuteur',await pg.evaluate(()=>document.getElementById('q-timer').textContent),'| réponses',await pg.evaluate(()=>JSON.stringify(G.reponses)))
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()})()
