// Coupure reseau pendant l'envoi d'une copie : rien ne doit se perdre
const {chromium}=require('playwright');const fs=require('fs')
;(async()=>{
 const path=require('path')
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}})
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept())
 await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8'),contentType:'application/javascript'})
   if(u.startsWith('file:')||u.startsWith('blob:')||u.startsWith('data:')) return r.continue()
   return r.fulfill({body:'',contentType:'application/javascript'})})
 await pg.goto('file://'+FICHIER);await pg.waitForTimeout(2200)
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))
 await pg.evaluate(async()=>{G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a2');__DB.rattrapages=[{quiz_id:'qH',aspirant_id:'a2',date_limite:'2030-01-01T00:00:00Z'}]
   const orig=db.from.bind(db);window.__panne=true;window.__ins=[]
   db.from=function(t){const q=orig(t);const ins=q.insert;q.insert=function(v){
     if(t==='tentatives'&&window.__panne){const c={select(){return c},single(){return c},then(res){res({data:null,error:{message:'Failed to fetch'}})}};return c}
     if(t==='tentatives')window.__ins.push(v);return ins.apply(q,arguments)};return q}
   await commencer('qH')})
 await pg.waitForTimeout(500)
 await pg.evaluate(()=>{G.reponses[G.questions[0].id]=1;terminer()})
 await pg.waitForTimeout(6000)
 const a=await pg.evaluate(()=>({attente:G.aEnvoyer,local:JSON.parse(localStorage.getItem('pm_copie_en_cours')||'{}').aEnvoyer,ecran:document.getElementById('r-detail').innerText.includes('pas encore partie')}))
 console.log('pendant la panne :',JSON.stringify(a))
 if(!a.attente||!a.local||!a.ecran) throw new Error('copie non conservee pendant la panne')
 // Le reseau revient : la copie repart seule, une seule fois
 await pg.evaluate(()=>{window.__panne=false;window.dispatchEvent(new Event('online'))})
 await pg.waitForTimeout(2000)
 const c=await pg.evaluate(()=>({envois:window.__ins.length,attente:G.aEnvoyer,local:localStorage.getItem('pm_copie_en_cours')}))
 console.log('apres le retour du reseau :',JSON.stringify(c))
 if(c.envois!==1||c.attente||c.local) throw new Error('copie non renvoyee')
 // Second appel (fin du minuteur) : ignore
 await pg.evaluate(()=>terminer());await pg.waitForTimeout(500)
 if(await pg.evaluate(()=>window.__ins.length)!==1) throw new Error('copie envoyee deux fois')
 // Reprise sans reseau : la copie locale ne doit pas etre effacee
 await pg.evaluate(async()=>{localStorage.setItem('pm_copie_en_cours',JSON.stringify({quizId:'qH',reponses:{q1:1},quand:Date.now()}))
   const orig=db.from;db.from=function(){const c={select(){return c},eq(){return c},order(){return c},single(){return c},then(res){res({data:null,error:{message:'Failed to fetch'}})}};return c}
   miseAJourAvantExamen=async()=>false
   await reprendreCopie();db.from=orig})
 const garde=await pg.evaluate(()=>!!localStorage.getItem('pm_copie_en_cours'))
 console.log('copie gardee apres reprise sans reseau :',garde)
 if(!garde) throw new Error('copie effacee par une panne reseau')
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()})()
