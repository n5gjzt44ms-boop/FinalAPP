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
 // Date dans 7 jours : une date fixe finit par etre passee, et l'appli la redemande alors sans fin
 const J7=new Date(Date.now()+7*864e5),pad=n=>String(n).padStart(2,'0'),jj=pad(J7.getDate()),mm=pad(J7.getMonth()+1)
 for(const s of [jj+'/'+mm,jj+'/'+mm+'/'+J7.getFullYear(),jj+'/'+mm+'/'+String(J7.getFullYear()).slice(2),jj+' '+mm,jj+'.'+mm]){rep=[s];const r=await pg.evaluate(()=>demanderDateLimite(1));console.log(s.padEnd(11),'→',r&&new Date(r).toLocaleString('fr-FR',{timeZone:'Europe/Paris'}))}
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()})()
