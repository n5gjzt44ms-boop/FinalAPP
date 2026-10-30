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
 await pg.evaluate(()=>{const px='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='
   __DB.tentatives.push({id:'tn',aspirant_id:'a2',quiz_id:'qH',score:0,valide:false,note_admin:null,notes_libres:{},reponses:{q1:1,q3:''},fichiers_libres:{q3:[{type:'photo',nom:'schema.jpg',path:'reponses-libres/a2/1_schema.jpg'},{type:'photo',nom:'schema2.jpg',image:px},{type:'fichier',nom:'calcul.pdf',path:'reponses-libres/a2/2_calcul.pdf'}]}})
   __DB.tentatives.push({id:'to',aspirant_id:'a3',quiz_id:'qH',score:0,valide:false,note_admin:null,notes_libres:{},reponses:{q3:'texte'},fichiers_libres:{q3:{nom:'Schéma annoté',image:px,annotation:true}}})})
 for(const id of ['tn','to']){
   await pg.evaluate(id=>ouvrirCorrectionAdmin(id),id);await pg.waitForTimeout(900)
   const r=await pg.evaluate(()=>{const m=document.getElementById('modal-correction');const t=m.innerText;const i=t.indexOf('Type de pompe');return {imgs:m.querySelectorAll('img').length,txt:t.slice(i,i+260).replace(/\n+/g,' | ')}})
   console.log(id,'→',r.imgs,'image(s) |',r.txt)
   await pg.evaluate(()=>document.getElementById('modal-correction').remove())
 }
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()})()
