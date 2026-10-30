const {chromium}=require('playwright');const fs=require('fs')
;(async()=>{
 const path=require('path'),os=require('os')
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const SP=fs.mkdtempSync(path.join(os.tmpdir(),'progmeca-'))  // captures et fichiers temporaires
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}})
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{console.log('  DIALOG:',d.message().slice(0,95).replace(/\n/g,' '));d.accept()})
 await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8'),contentType:'application/javascript'})
   if(u.startsWith('file:')) return r.continue()
   return r.fulfill({body:'',contentType:'application/javascript'})})
 await pg.goto('file://'+FICHIER);await pg.waitForTimeout(2200)
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))
 const prep=async(mode)=>pg.evaluate((mode)=>{
   G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a2')
   const q=__DB.quiz.find(x=>x.id==='qH');q.date_debut=new Date(Date.now()-3600e3).toISOString();q.date_fin=new Date(Date.now()+3600e3).toISOString()
   if(!window.__origFrom) window.__origFrom=db.from.bind(db)
   window.__ins=[]
   db.from=function(t){const qq=window.__origFrom(t);const ins=qq.insert;qq.insert=function(v){
     if(t==='tentatives'){window.__ins.push(Object.keys(v).sort().join(','))
       if(mode==='colonnes'&&v.version_app){const fake={select(){return fake},single(){return fake},then(res){return Promise.resolve({data:null,error:{message:"Could not find the 'version_app' column of 'tentatives' in the schema cache"}}).then(res)}};return fake}
       if(mode==='vide'){const fake={select(){return fake},single(){return fake},then(res){return Promise.resolve({data:null,error:{message:'Copie vide refusée : rattrapage en cours, recharge l application'}}).then(res)}};return fake}
     }
     return ins.apply(qq,arguments)};return qq}
 },mode)
 // 1) base à jour : version et heure de début envoyées
 await prep('ok');await pg.evaluate(()=>commencer('qH'));await pg.waitForTimeout(600)
 await pg.evaluate(()=>{choisir(1);valider()});await pg.evaluate(()=>terminer());await pg.waitForTimeout(1500)
 console.log('1) champs envoyés :',await pg.evaluate(()=>window.__ins))
 // 2) colonnes absentes : renvoi automatique sans elles
 await prep('colonnes');await pg.evaluate(()=>commencer('qH'));await pg.waitForTimeout(600)
 await pg.evaluate(()=>{choisir(1);valider()});await pg.evaluate(()=>terminer());await pg.waitForTimeout(1500)
 console.log('2) envois :',await pg.evaluate(()=>window.__ins.length),'| 2e envoi contient version_app ?',await pg.evaluate(()=>/version_app/.test(window.__ins[1]||'')),'| page',await pg.evaluate(()=>localStorage.getItem('pm_page')))
 // 3) copie vide refusée par la base
 await prep('vide');await pg.evaluate(()=>commencer('qH'));await pg.waitForTimeout(600)
 await pg.evaluate(()=>terminer());await pg.waitForTimeout(1500)
 console.log('3) envois :',await pg.evaluate(()=>window.__ins.length),'| page',await pg.evaluate(()=>localStorage.getItem('pm_page')))
 // 4) côté gâcheur : durée, version, badge
 await pg.evaluate(()=>{db.from=window.__origFrom;G.admin=true;G.profil=__DB.profils[0];const n=Date.now()
   __DB.tentatives.push({id:'tv',aspirant_id:'a2',quiz_id:'qH',score:0,valide:false,note_admin:null,notes_libres:{},reponses:{},completed_at:new Date(n).toISOString(),commence_le:new Date(n-2000).toISOString(),version_app:'2026.10.28-0450'})
   __DB.tentatives.push({id:'tw',aspirant_id:'a3',quiz_id:'qH',score:12,valide:false,note_admin:null,notes_libres:{},reponses:{q1:1},completed_at:new Date(n).toISOString(),commence_le:new Date(n-5940000).toISOString(),version_app:'2026.10.29-1045'})})
 await pg.evaluate(()=>{nav('corrections')});await pg.waitForTimeout(800);await pg.evaluate(()=>{_corrVue='toutes';afficherCorrections()});await pg.waitForTimeout(300)
 console.log('4) badges liste :',await pg.evaluate(()=>(document.getElementById('corr-body').innerText.match(/Envoyée[^\n]*/g)||[]).join(' / ')))
 for(const id of ['tv','tw']){await pg.evaluate(id=>ouvrirCorrectionAdmin(id),id);await pg.waitForTimeout(500)
   console.log('   fenêtre',id,':',await pg.evaluate(()=>{const t=document.getElementById('modal-correction').innerText;return (t.match(/Commencée[^\n]*/)||['—'])[0]}))
   await pg.evaluate(()=>document.getElementById('modal-correction').remove())}
 // 5) questionnaire Ancien
 await pg.evaluate(()=>{try{afficherQuestionnaireAncien()}catch(e){window.__errAnc=e.message}})
 console.log('5) questionnaire Ancien affiché :',await pg.evaluate(()=>!!document.getElementById('modal-questionnaire-ancien')),'| erreur :',await pg.evaluate(()=>window.__errAnc||'aucune'))
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()})()
