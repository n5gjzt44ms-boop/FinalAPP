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
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))
 await pg.evaluate(async()=>{G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a2');__DB.rattrapages=[{quiz_id:'qH',aspirant_id:'a2',date_limite:'2030-01-01T00:00:00Z'}]
   const orig=db.from.bind(db);window.__ins=0;db.from=function(t){const q=orig(t);const ins=q.insert;q.insert=function(v){if(t==='tentatives')window.__ins++;return ins.apply(q,arguments)};return q}
   await commencer('qH')})
 await pg.waitForTimeout(5000)
 console.log('RATTRAPAGE après 5 s → page :',await pg.evaluate(()=>localStorage.getItem('pm_page')),'| copies envoyées :',await pg.evaluate(()=>window.__ins),'| minuteur :',await pg.evaluate(()=>document.getElementById('q-timer').textContent))
 // Examen dans son créneau : fin du créneau conservée
 await pg.evaluate(async()=>{arreterTimer();const n=Date.now();const q=__DB.quiz.find(x=>x.id==='qH');q.date_debut=new Date(n-3600e3).toISOString();q.date_fin=new Date(n+600e3).toISOString();__DB.rattrapages=[];await commencer('qH')})
 await pg.waitForTimeout(1500)
 console.log('CRÉNEAU EN COURS → minuteur :',await pg.evaluate(()=>document.getElementById('q-timer').textContent),'(≈ 10 min attendu)')
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()})()
