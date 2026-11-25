// Inscription d'un gacheur par lien d'invitation (?admin=...) : l'appli
// transmet le lien a la base, qui seule decide du role (sql/securite_roles.sql).
// Sans lien, aucun jeton n'est envoye. Lien refuse : message clair.
const {chromium}=require('playwright');const fs=require('fs'),path=require('path')
;(async()=>{
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}})
 const errs=[],dialogues=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{dialogues.push(d.message());d.accept()})
 await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8'),contentType:'application/javascript'})
   if(u.startsWith('file:')||u.startsWith('blob:')||u.startsWith('data:')) return r.continue()
   return r.fulfill({body:'',contentType:'application/javascript'})})
 await pg.goto('file://'+FICHIER+'?admin=jeton-test-123');await pg.waitForTimeout(2200)
 let echecs=0
 const verifie=(ok,msg)=>{console.log((ok?'ok : ':'ECHEC : ')+msg);if(!ok)echecs++}
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))

 const remplir=`document.getElementById('f-register').classList.remove('hidden');
   document.getElementById('r-email').value='nouveau@exemple.fr';document.getElementById('r-pwd').value='motdepasse1';
   document.getElementById('r-prenom').value='Jean';document.getElementById('r-nom').value='Test'`

 // 1) Lien d'invitation + choix gacheur : le jeton part avec l'inscription
 const r1=await pg.evaluate(async(remplir)=>{
   eval(remplir)
   const zj=document.getElementById('f-choix-jeune');if(zj)zj.classList.add('hidden')
   document.querySelector('input[name="r-role-special"][value="admin"]').checked=true;setRoleSpecial('admin')
   db.auth.signUp=async function(o){window.__inscription=o;return {error:null}}
   db.auth.signInWithPassword=async function(){return {error:{message:'confirmation par e-mail'}}}
   await register()
   return window.__inscription.options.data
 },remplir)
 console.log('inscription avec lien :',JSON.stringify(r1))
 verifie(r1.role==='admin'&&r1.admin_token==='jeton-test-123','avec le lien : role demande et jeton transmis a la base')

 // 2) Sans choix gacheur : aucun jeton envoye
 const r2=await pg.evaluate(async(remplir)=>{
   eval(remplir)
   document.querySelector('input[name="r-role-special"][value="ancien"]').checked=true;setRoleSpecial('ancien')
   await register()
   return window.__inscription.options.data
 },remplir)
 console.log('inscription ancien :',JSON.stringify(r2))
 verifie(r2.role==='ancien'&&!('admin_token' in r2),'ancien : aucun jeton envoye')

 // 3) Lien refuse par la base (profil cree en aspirant) : message clair, pas de faux gacheur
 const r3=await pg.evaluate(async(remplir)=>{
   eval(remplir)
   document.querySelector('input[name="r-role-special"][value="admin"]').checked=true;setRoleSpecial('admin')
   window.__maj=[]
   db.auth.signInWithPassword=async function(){return {error:null}}
   db.auth.getUser=async function(){return {data:{user:{id:'a4',email:'nouveau@exemple.fr'}}}}
   const orig=db.from.bind(db)
   db.from=function(t){const q=orig(t);const u=q.update;q.update=function(v){if(t==='profils')window.__maj.push(v);return u.apply(q,arguments)};return q}
   window.initApp=async function(){}
   await register()
   db.from=orig
   return {maj:window.__maj}
 },remplir)
 console.log('lien refuse :',JSON.stringify(r3),'| dialogues :',JSON.stringify(dialogues))
 verifie(dialogues.some(d=>/plus valable/.test(d)),'lien refuse : message « lien plus valable »')
 verifie(!r3.maj.some(v=>v.role==='admin'),'l appli ne tente plus de se donner le role gacheur')

 // 4) Creation du lien par un gacheur : refus de la base signale, pas de lien affiche
 const r4=await pg.evaluate(async()=>{
   const lr=document.getElementById('lien-result');if(lr)lr.classList.add('hidden')
   const orig=db.from.bind(db)
   db.from=function(t){const q=orig(t);if(t==='admin_tokens'){q.insert=function(){return Promise.resolve({data:null,error:{message:'refus de test'}})}};return q}
   db.auth.getUser=async function(){return {data:{user:{id:'admin1'}}}}
   await genLienAdmin()
   db.from=orig
   const t=[...document.querySelectorAll('.toast,#toast,[class*="toast"]')].map(x=>x.innerText).join(' ')
   return {affiche:!!(lr&&!lr.classList.contains('hidden')&&lr.style.display!=='none'),toast:t}
 })
 console.log('lien non cree :',JSON.stringify(r4))
 verifie(!r4.affiche&&/Lien non créé/.test(r4.toast),'creation du lien refusee : message et aucun lien affiche')

 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close();process.exit(echecs?1:0)
})().catch(e=>{console.error(e);process.exit(1)})
