// Quitter en plein examen : la copie revient telle quelle. Photo prise en direct : elle ne se perd pas.
const {chromium}=require('playwright');const fs=require('fs')
;(async()=>{
 const path=require('path')
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}})
 const errs=[],dialogues=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{dialogues.push(d.message());d.accept()})
 await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8'),contentType:'application/javascript'})
   if(u.startsWith('file:')||u.startsWith('blob:')||u.startsWith('data:')) return r.continue()
   return r.fulfill({body:'',contentType:'application/javascript'})})
 let echecs=0
 const verifie=(ok,msg)=>{console.log((ok?'ok : ':'ECHEC : ')+msg);if(!ok)echecs++}
 const charge=async()=>{await pg.goto('file://'+FICHIER);await pg.waitForTimeout(2200)}
 const aspirant=()=>pg.evaluate(()=>{document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove());G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a2');__DB.rattrapages=[{quiz_id:'qH',aspirant_id:'a2',date_limite:'2030-01-01T00:00:00Z'}]})
 await charge();await aspirant()
 // 1) Essai : on quitte a la 2e question, on revient par le bouton
 const r1=await pg.evaluate(async()=>{await commencerEssai();choisir(1);await valider();suivant();choisirMulti(2);sauverCopieEnCours();nav('dashboard');await commencerEssai();return {etape:G.etape,rep1:G.reponses.essai1}})
 console.log('essai repris :',JSON.stringify(r1))
 verifie(r1.etape===1&&r1.rep1===1,'essai repris a la meme question, reponses gardees')
 await pg.evaluate(()=>{localStorage.removeItem('pm_copie_en_cours');G.quizActif=null})
 // 2) Vrai examen : le bouton Commencer reprend la copie du telephone
 const r2=await pg.evaluate(async()=>{await commencer('qH');choisir(1);await valider();suivant();sauverCopieEnCours();nav('dashboard');await commencer('qH');return {etape:G.etape,rep:G.reponses.q1,quiz:G.quizActif&&G.quizActif.id}})
 console.log('examen repris :',JSON.stringify(r2))
 verifie(r2.etape===1&&r2.rep===1,'examen repris via Commencer, reponses gardees')
 // 3) Reponse selectionnee mais pas encore validee : retrouvee apres retour
 const r3=await pg.evaluate(async()=>{localStorage.removeItem('pm_copie_en_cours');await commencer('qH');choisir(1);sauverCopieEnCours();nav('dashboard');await reprendreCopie();const o=document.getElementById('o1');return {sel:!!(o&&o.classList.contains('sel')),valider:document.getElementById('btn-valider').disabled}})
 console.log('choix non valide :',JSON.stringify(r3))
 verifie(r3.sel&&!r3.valider,'reponse selectionnee retrouvee apres le retour')
 // 4) Un exercice lance pendant un examen en cours n'ecrase pas la copie
 const r4=await pg.evaluate(async()=>{sauverCopieEnCours();await commencer('xH');return JSON.parse(localStorage.getItem('pm_copie_en_cours')||'{}').quizId})
 console.log('copie apres lancement d un exercice :',r4)
 verifie(r4==='qH','exercice refuse tant qu un examen est en cours')
 // 5) Telephone qui recharge la page pendant la photo : reprise seule, avec explication
 await pg.evaluate(async()=>{localStorage.removeItem('pm_copie_en_cours');G.admin=true;G.profil=__DB.profils.find(p=>p.id==='admin1');await commencerEssai();choisir(0);await valider();suivant();choisirMulti(0);await valider();suivant();document.getElementById('rep-libre').value='Mon texte';avantChoixFichier()})
 dialogues.length=0
 await charge();await pg.waitForTimeout(1200)
 const r5=await pg.evaluate(()=>({quiz:document.getElementById('v-quiz').classList.contains('on'),etape:G.etape,texte:(document.getElementById('rep-libre')||{}).value,modal:!!document.getElementById('modal-reprise')}))
 console.log('apres rechargement photo :',JSON.stringify(r5),'|',dialogues.join(' / ').slice(0,80))
 verifie(r5.quiz&&r5.etape===2&&r5.texte==='Mon texte'&&!r5.modal,'copie rouverte seule a la question de la photo')
 verifie(dialogues.some(d=>/photo/i.test(d)),'message expliquant que la photo est a refaire')
 // 6) Deux boutons : appareil photo direct, et galerie
 const r6=await pg.evaluate(()=>{const c=document.getElementById('fichier-camera'),g=document.getElementById('fichier-libre');return {camera:!!c&&c.getAttribute('capture')==='environment'&&c.accept==='image/*'&&!c.multiple,galerie:!!g&&g.multiple&&!g.hasAttribute('capture')}})
 console.log('boutons :',JSON.stringify(r6))
 verifie(r6.camera&&r6.galerie,'bouton appareil photo et bouton galerie distincts')
 // 7) Photo en direct sans type ni extension (certains Android), puis fichier encore en ecriture
 const jpeg=await pg.evaluate(()=>{const c=document.createElement('canvas');c.width=200;c.height=100;c.getContext('2d').fillRect(0,0,50,50);return c.toDataURL('image/jpeg').split(',')[1]})
 await pg.evaluate(()=>{const st=db.storage.from;window.__depots=[];db.storage.from=function(){const o=st.apply(this,arguments);o.upload=async function(p,bl){window.__depots.push({p,t:bl&&bl.type,s:bl&&bl.size});return {}};return o}})
 await pg.setInputFiles('#fichier-camera',{name:'1000012345',mimeType:'',buffer:Buffer.from(jpeg,'base64')})
 await pg.waitForTimeout(1500)
 const r7=await pg.evaluate(()=>({pj:piecesJointes(G.fichiersLibres.essai3).map(p=>({t:p.type,e:p.etat,path:!!p.path})),depots:window.__depots,attente:localStorage.getItem('pm_attente_fichier')}))
 console.log('photo directe :',JSON.stringify(r7))
 verifie(r7.pj.length===1&&r7.pj[0].t==='photo'&&r7.pj[0].path&&r7.depots[0].s>0,'photo sans type reconnue et deposee')
 verifie(!r7.attente,'attente de photo levee apres reception')
 // 8) Lecture du fichier : echec passager (photo en cours d'ecriture) puis reussite
 const r8=await pg.evaluate(async()=>{let n=0;const vrai=new File([new Uint8Array([255,216,255,1,2,3])],'p.jpg',{type:'image/jpeg'});const faux={name:'p.jpg',type:'image/jpeg',size:6,arrayBuffer:async()=>{n++;if(n<2)throw new Error('fichier change');return vrai.arrayBuffer()}};const c=await copierEnMemoire(faux);return {n,taille:c.size,type:c.type,fichier:c instanceof File}})
 console.log('lecture avec echec passager :',JSON.stringify(r8))
 verifie(r8.n===2&&r8.taille===6&&r8.fichier,'lecture retentee quand le fichier n est pas encore pret')
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()
 process.exit(echecs?1:0)})().catch(e=>{console.error(e);process.exit(1)})
