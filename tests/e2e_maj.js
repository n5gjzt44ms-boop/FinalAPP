const {chromium}=require('playwright');const fs=require('fs')
;(async()=>{
 const path=require('path'),os=require('os')
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const SP=fs.mkdtempSync(path.join(os.tmpdir(),'progmeca-'))  // captures et fichiers temporaires
 // Deux versions servies : l'actuelle, et une « nouvelle » publiee pendant le test
 fs.mkdirSync(path.join(SP,'srv'),{recursive:true})
 const source=fs.readFileSync(FICHIER,'utf8')
 fs.writeFileSync(path.join(SP,'srv','index.html'),source)
 fs.writeFileSync(path.join(SP,'srv','nouvelle.html'),source.replace(/const VERSION_APP = '[^']+'/,"const VERSION_APP = '2999.12.31-2359'"))
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}})
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept())
 let nouvelleEnLigne=false
 await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8'),contentType:'application/javascript'})
   if(u.startsWith('https://app.test/')){
     const f=(nouvelleEnLigne||u.includes('maj='))?'nouvelle.html':'index.html'
     if(u.includes('verif=')) console.log('  vérification de version →',nouvelleEnLigne?'nouvelle en ligne':'même version')
     return r.fulfill({body:fs.readFileSync(SP+'/srv/'+f,'utf8'),contentType:'text/html'})
   }
   return r.fulfill({body:'',contentType:'application/javascript'})})
 await pg.goto('https://app.test/FinalAPP/');await pg.waitForTimeout(2500)
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))
 console.log('version chargée :',await pg.evaluate(()=>VERSION_APP))
 // pas de nouvelle version : l'examen démarre normalement
 await pg.evaluate(()=>{const q=__DB.quiz.find(x=>x.id==='qH');q.date_debut=new Date(Date.now()-3600e3).toISOString();q.date_fin=new Date(Date.now()+3600e3).toISOString()})
 await pg.evaluate(()=>commencer('qH'));await pg.waitForTimeout(1500)
 console.log('sans mise à jour → page',await pg.evaluate(()=>localStorage.getItem('pm_page')))
 await pg.evaluate(()=>{arreterTimer();nav('dashboard')});await pg.waitForTimeout(500)
 // une nouvelle version est publiée : au clic, mise à jour puis l'examen s'ouvre seul
 nouvelleEnLigne=true
 await pg.evaluate(()=>commencer('qH'))
 await pg.waitForTimeout(5000)
 console.log('après mise à jour → version',await pg.evaluate(()=>VERSION_APP),'| adresse',await pg.evaluate(()=>location.search),'| page',await pg.evaluate(()=>localStorage.getItem('pm_page')))
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()})()
