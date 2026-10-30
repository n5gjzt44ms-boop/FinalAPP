const {chromium,webkit}=require('playwright');const fs=require('fs')
;(async()=>{
 const path=require('path'),os=require('os')
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const SP=fs.mkdtempSync(path.join(os.tmpdir(),'progmeca-'))  // captures et fichiers temporaires
 for(const [nom,moteur] of [['chromium',chromium],['webkit',webkit]]){
  let b;try{b=await moteur.launch()}catch(e){console.log(nom,': moteur indisponible');continue}
  const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:nom==='chromium'})
  const pg=await ctx.newPage()
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept())
  await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8'),contentType:'application/javascript'})
   if(u.startsWith('file:')) return r.continue()
   return r.fulfill({body:'',contentType:'application/javascript'})})
  await pg.goto('file://'+FICHIER);await pg.waitForTimeout(2200)
  await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))
  await pg.evaluate(async()=>{G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a2');__DB.rattrapages=[{quiz_id:'qH',aspirant_id:'a2',date_limite:'2030-01-01T00:00:00Z'}];await commencer('qH')})
  await pg.waitForTimeout(400);await pg.evaluate(()=>{G.etape=2;showQ()});await pg.waitForTimeout(200)
  const att=pg.waitForEvent('filechooser',{timeout:4000}).then(()=>true).catch(()=>false)
  await pg.tap('text=Ajouter une photo de ton schéma').catch(async()=>{await pg.click('text=Ajouter une photo de ton schéma')})
  console.log(nom,': sélecteur de fichier ouvert au toucher →',await att,'| erreurs JS :',errs.length?errs:'aucune')
  await b.close()
 }
})()
