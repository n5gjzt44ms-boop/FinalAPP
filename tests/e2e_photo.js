const {chromium}=require('playwright');const fs=require('fs')
;(async()=>{
 const path=require('path'),os=require('os')
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const SP=fs.mkdtempSync(path.join(os.tmpdir(),'progmeca-'))  // captures et fichiers temporaires
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}})
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{console.log('DIALOG',d.type(),':',d.message().slice(0,90).replace(/\n/g,' '));d.accept()})
 await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8'),contentType:'application/javascript'})
   if(u.startsWith('file:')||u.startsWith('blob:')||u.startsWith('data:')) return r.continue()
   return r.fulfill({body:'',contentType:'application/javascript'})})
 await pg.goto('file://'+FICHIER);await pg.waitForTimeout(2200)
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))
 // Grande photo simulée (4000x3000) générée dans le navigateur
 const b64=await pg.evaluate(()=>{const c=document.createElement('canvas');c.width=4000;c.height=3000;const x=c.getContext('2d');x.fillStyle='#eee';x.fillRect(0,0,4000,3000);for(let i=0;i<4000;i+=7){x.fillStyle='hsl('+(i%360)+',60%,50%)';x.fillRect(i,(i*13)%3000,6,400)};return c.toDataURL('image/jpeg',0.95).split(',')[1]})
 const buf=Buffer.from(b64,'base64');console.log('photo d origine :',(buf.length/1024/1024).toFixed(2),'Mo')
 // Aspirant Paul (module 2) avec rattrapage sur l examen qH
 await pg.evaluate(async()=>{G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a2');__DB.rattrapages=[{quiz_id:'qH',aspirant_id:'a2',date_limite:'2030-01-01T00:00:00Z'}]
   const orig=db.from.bind(db);window.__ins=[];db.from=function(t){const q=orig(t);const ins=q.insert;q.insert=function(v){window.__ins.push({t:t,v:JSON.parse(JSON.stringify(v))});return ins.apply(q,arguments)};return q}
   await commencer('qH')})
 await pg.waitForTimeout(500)
 await pg.evaluate(()=>{G.etape=2;showQ()});await pg.waitForTimeout(200)
 console.log('question affichée :',await pg.evaluate(()=>G.questions[G.etape].enonce+' / type '+G.questions[G.etape].type_question))
 await pg.fill('#rep-libre','Pompe à engrenages');await pg.waitForTimeout(900)
 console.log('brouillon gardé :',await pg.evaluate(()=>JSON.stringify(G.reponses)))
 // 1) stockage OK
 await pg.setInputFiles('#fichier-libre',{name:'IMG_0042.HEIC.jpg',mimeType:'image/jpeg',buffer:buf})
 await pg.waitForTimeout(2500)
 console.log('pièce 1 :',await pg.evaluate(()=>JSON.stringify(piecesJointes(G.fichiersLibres[G.questions[G.etape].id]).map(p=>({t:p.type,etat:p.etat,path:!!p.path,image:!!p.image,taille:p.taille})))))
 // 2) stockage refusé (droits) → photo gardée dans la copie
 await pg.evaluate(()=>{const st=db.storage.from;db.storage.from=function(){const o=st.apply(this,arguments);o.upload=async()=>({error:{message:'new row violates row-level security policy'}});return o}})
 await pg.setInputFiles('#fichier-libre',{name:'schema2.jpg',mimeType:'image/jpeg',buffer:buf})
 await pg.waitForTimeout(3000)
 console.log('pièce 2 :',await pg.evaluate(()=>JSON.stringify(piecesJointes(G.fichiersLibres[G.questions[G.etape].id]).map(p=>({t:p.type,etat:p.etat,path:!!p.path,ko:p.image?Math.round(p.image.length/1024):0})))))
 console.log('liste à l écran :',await pg.evaluate(()=>document.getElementById('pj-liste').innerText.replace(/\n+/g,' | ')))
 await pg.screenshot({path:SP+'/photo_aspirant.png'})
 // Sauvegarde locale
 console.log('sauvegarde locale (Ko) :',await pg.evaluate(()=>Math.round((localStorage.getItem('pm_copie_en_cours')||'').length/1024)))
 // Terminer
 await pg.evaluate(()=>{valider()});await pg.waitForTimeout(300)
 await pg.evaluate(()=>terminer());await pg.waitForTimeout(3000)
 const ins=await pg.evaluate(()=>window.__ins.filter(x=>x.t==='tentatives').map(x=>({reponses:x.v.reponses,fl:Object.fromEntries(Object.entries(x.v.fichiers_libres||{}).map(([k,v])=>[k,v.map(p=>({type:p.type,path:!!p.path,image:p.image?Math.round(p.image.length/1024)+'Ko':null}))]))})))
 console.log('copie envoyée :',JSON.stringify(ins))
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()})()
