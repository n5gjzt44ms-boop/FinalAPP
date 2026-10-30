const {chromium}=require('playwright');const fs=require('fs')
;(async()=>{
 const path=require('path'),os=require('os')
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const SP=fs.mkdtempSync(path.join(os.tmpdir(),'progmeca-'))  // captures et fichiers temporaires
 const b=await chromium.launch();const pg=await b.newPage()
 const errs=[];pg.on('pageerror',e=>errs.push(e.message))
 let rep=[];pg.on('dialog',d=>{d.type()==='prompt'?d.accept(rep.shift()):d.accept()})
 await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8'),contentType:'application/javascript'})
   if(u.startsWith('file:')) return r.continue()
   return r.fulfill({body:'',contentType:'application/javascript'})})
 await pg.goto('file://'+FICHIER);await pg.waitForTimeout(2000)
 for(const s of ['10/11','10/11/2026','10/11/26','10 11','10.11']){rep=[s];const r=await pg.evaluate(()=>demanderDateLimite(1));console.log(s.padEnd(11),'→',r&&new Date(r).toLocaleString('fr-FR',{timeZone:'Europe/Paris'}))}
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()})()
