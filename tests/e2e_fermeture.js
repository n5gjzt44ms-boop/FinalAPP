// Application fermee de force (navigateur tue, comme un telephone qui ferme l'appli) :
// la copie doit revenir, meme juste apres la derniere reponse.
const {chromium}=require('playwright');const fs=require('fs'),os=require('os'),path=require('path')
const {execSync}=require('child_process')
function tuer(dir){
  const nom=path.basename(dir)
  if(process.platform==='win32') execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name='chrome.exe' OR Name='headless_shell.exe' OR Name='chrome-headless-shell.exe'\\" | Where-Object { $_.CommandLine -like '*${nom}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`,{stdio:'ignore'})
  else{try{execSync(`pkill -9 -f ${nom}`,{stdio:'ignore'})}catch(e){}}
}
;(async()=>{
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pmfermeture-'))
 const errs=[]
 const ouvrir=async()=>{
   const c=await chromium.launchPersistentContext(dir,{headless:true,viewport:{width:390,height:844}})
   await c.route('**/*',r=>{const u=r.request().url()
     if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8').replace("const U={id:'admin1'","const U={id:'a2'"),contentType:'application/javascript'})
     if(u.startsWith('file:')||u.startsWith('blob:')||u.startsWith('data:')) return r.continue()
     return r.fulfill({body:'',contentType:'application/javascript'})})
   const p=c.pages()[0]||await c.newPage()
   p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept())
   await p.goto('file://'+FICHIER);await p.waitForTimeout(2500)
   return {c,p}
 }
 let echecs=0
 const verifie=(ok,msg)=>{console.log((ok?'ok : ':'ECHEC : ')+msg);if(!ok)echecs++}
 const fermer=async c=>{tuer(dir);await new Promise(r=>setTimeout(r,1500));try{await c.close()}catch(e){}}
 // 1) Reponse donnee, appli tuee aussitot
 let {c,p}=await ouvrir()
 await p.evaluate(async()=>{document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove());await commencerEssai();choisir(1);await valider();suivant();choisirMulti(2)})
 await p.waitForTimeout(100)
 await fermer(c)
 ;({c,p}=await ouvrir())
 const r1=await p.evaluate(()=>({modal:(document.getElementById('modal-reprise')||{}).innerText||null,local:!!localStorage.getItem('pm_copie_en_cours')}))
 console.log('apres fermeture forcee :',JSON.stringify(r1).slice(0,150))
 verifie(!!r1.modal&&/2 réponses/.test(r1.modal),'copie retrouvee avec ses 2 reponses')
 const r2=await p.evaluate(async()=>{await reprendreCopie();return {vue:document.getElementById('v-quiz').classList.contains('on'),etape:G.etape,rep:G.reponses.essai2}})
 console.log('reprise :',JSON.stringify(r2))
 verifie(r2.vue&&r2.etape===1&&Array.isArray(r2.rep)&&r2.rep[0]===2,'reprise a la 2e question, reponse cochee')
 // 2) Copie abandonnee, appli tuee aussitot : elle ne doit pas revenir
 await p.evaluate(()=>{arreterTimer();effacerCopieEnCours();G.quizActif=null});await p.waitForTimeout(100)
 await fermer(c)
 ;({c,p}=await ouvrir())
 const r3=await p.evaluate(()=>({modal:!!document.getElementById('modal-reprise'),local:localStorage.getItem('pm_copie_en_cours')}))
 console.log('apres abandon :',JSON.stringify(r3))
 verifie(!r3.modal&&!r3.local,'copie abandonnee ou envoyee : ne revient pas')
 // 3) Telephone qui a tout perdu : la copie revient depuis la ligne
 const r4=await p.evaluate(async()=>{
   const etat=JSON.stringify({quizId:'essai',uid:'a2',titre:"Examen d'essai",reponses:{essai1:0},fichiersLibres:{},etape:1,quand:Date.now()})
   __DB.copies_brouillon=[{aspirant_id:'a2',quand:Date.now()+5,etat}]
   localStorage.removeItem('pm_copie_en_cours')
   const res=await restaurerCopieEnLigne();await proposerRepriseCopie()
   const avant=(document.getElementById('modal-reprise')||{}).innerText||null
   document.getElementById('modal-reprise')?.remove();await reprendreCopie()
   return {res,avant,etape:G.etape,rep:G.reponses.essai1}})
 console.log('depuis la ligne :',JSON.stringify(r4).slice(0,170))
 verifie(r4.res==='restauree depuis la ligne'&&/1 réponse/.test(r4.avant||'')&&r4.etape===1&&r4.rep===0,'copie restauree depuis la ligne')
 // 4) Copie effacee en ligne (envoyee sur un autre appareil) : elle ne revient pas
 const r5=await p.evaluate(async()=>{arreterTimer();localStorage.setItem('pm_copie_en_cours',JSON.stringify({quizId:'essai',quand:Date.now()-1000}));__DB.copies_brouillon=[{aspirant_id:'a2',quand:Date.now(),etat:null}];return {res:await restaurerCopieEnLigne(),local:localStorage.getItem('pm_copie_en_cours')}})
 console.log('effacee en ligne :',JSON.stringify(r5))
 verifie(r5.res==='effacee en ligne'&&!r5.local,'copie effacee en ligne : ne revient pas')
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await c.close();try{fs.rmSync(dir,{recursive:true,force:true})}catch(e){}
 process.exit(echecs?1:0)
})().catch(e=>{console.error(e);process.exit(1)})
