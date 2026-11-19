// Question a plusieurs schemas, une reponse par schema (demande du 19/11) :
// - aspirant : chaque schema est suivi de sa propre case ; les reponses forment un seul texte
//   « Schéma A : ... » (lu par toutes les versions), reprises au retour sur la question ;
//   une ancienne reponse sans libelles revient dans la premiere case ; aucune reponse attendue affichee ;
// - correction : chaque schema avec la reponse de l'aspirant et la reponse attendue ;
// - relecture : reponse attendue par schema, alerte si une manque ;
// - editeur : case a cocher, ancien format « A = ... · B = ... » repris, image retiree sans decaler ;
// - Creer un quiz : meme chose, noms generiques renommes Schéma A, B... ;
// - import Word : legendes « Schéma A, B... » -> une reponse par schema d'office.
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
 const CAP=process.env.CAPTURES,cap=async n=>{if(CAP) await pg.screenshot({path:CAP+'/'+n+'.png',fullPage:true})}
 let ko=0;const verifie=(c,m)=>{console.log((c?'ok':'KO')+' : '+m);if(!c)ko++}
 const ATTENDU='Schéma A : Pression constante\nSchéma B : Load Sensing\nSchéma C : Régulation de puissance'

 // 0. Fonctions de decoupage
 const d0=await pg.evaluate(()=>{const l=['Schéma A','Schéma B','Schéma C']
   return {parts:decouperParSchema('Schéma A : x\nsuite de x\nSchéma C : z',l).parts,
     assemble:assemblerParSchema(l,['x','','z'],''),
     vide:assemblerParSchema(l,['','',''],''),
     vieux:attenduParSchema({medias:[{t:'img',p:'a',n:'Schéma A',rep:1},{t:'img',p:'b',n:'Schéma B',rep:1}],reponse_type:'A = Pression Constante · B = Commande à distance'}).parts}})
 verifie(JSON.stringify(d0.parts)===JSON.stringify(['x\nsuite de x','','z']),'découpage : réponse sur plusieurs lignes, case vide')
 verifie(d0.assemble==='Schéma A : x\nSchéma C : z'&&d0.vide==='','assemblage : cases vides omises, rien si tout est vide')
 verifie(JSON.stringify(d0.vieux)===JSON.stringify(['Pression Constante','Commande à distance']),'ancien format « A = … · B = … » relu')

 // 1. Aspirant : exercice avec 3 schemas et un document
 await pg.evaluate(async(att)=>{
   __DB.quiz.push({id:'xS',titre:'Régulations de pompe',module_id:2,mode_examen:false,actif:true,niveau:30})
   __DB.questions.push({id:'s1',quiz_id:'xS',ordre:1,enonce:'Pour chaque schéma, indique le type de régulation.',type_question:'libre',options:[],points:4,reponse_type:att,
     medias:[{t:'lien',p:'https://example.com/cours.pdf',n:'Cours régulations'},{t:'img',p:'questions/xS/a.png',n:'Schéma A',rep:1},{t:'img',p:'questions/xS/b.png',n:'Schéma B',rep:1},{t:'img',p:'questions/xS/c.png',n:'Schéma C',rep:1}]})
   G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a2')
   await commencer('xS',true)},ATTENDU)
 await pg.waitForTimeout(600)
 const vue=await pg.evaluate(()=>({blocs:document.querySelectorAll('#q-opts .schema-rep').length,cases:document.querySelectorAll('#q-opts textarea[id^="rep-schema-"]').length,
   titres:[...document.querySelectorAll('#q-opts .schema-rep > div')].map(d=>d.innerText).join(', '),
   imagesBranchees:[...document.querySelectorAll('#q-opts img[data-schema]')].filter(i=>i.dataset.src||i.src||i.getAttribute('data-img')||true).length,
   grandeCaseCachee:getComputedStyle(document.getElementById('rep-libre')).display==='none',
   docEnHaut:[...document.querySelectorAll('#q-image-wrap button')].some(x=>x.innerText.includes('Cours régulations')),
   imagesEnHaut:document.querySelectorAll('#q-image-wrap img').length,
   zoneDessin:getComputedStyle(document.getElementById('zone-annot')).display,
   attenduVisible:document.body.innerText.includes('Pression constante')||document.body.innerText.includes('Load Sensing')}))
 console.log('aspirant :',JSON.stringify(vue))
 verifie(vue.blocs===3&&vue.cases===3&&vue.titres==='Schéma A, Schéma B, Schéma C','3 schémas, chacun avec son titre et sa case')
 verifie(vue.grandeCaseCachee&&vue.docEnHaut&&vue.imagesEnHaut===0,'document gardé en haut, schémas seulement plus bas, case unique cachée')
 verifie(vue.zoneDessin==='none','pas de dessin sur la première photo à la place des cases')
 verifie(!vue.attenduVisible,'aucune réponse attendue affichée pendant la question')
 await cap('1_aspirant')
 await pg.fill('#rep-schema-0','Pression constante');await pg.fill('#rep-schema-2','Puissance\navec limitation');await pg.waitForTimeout(900)
 const g1=await pg.evaluate(()=>G.reponses.s1)
 console.log('réponse gardée :',JSON.stringify(g1))
 verifie(g1==='Schéma A : Pression constante\nSchéma C : Puissance\navec limitation','réponses rassemblées en un texte « Schéma A : … », gardé avant de valider')
 await pg.evaluate(()=>showQ());await pg.waitForTimeout(300)
 verifie(await pg.evaluate(()=>[0,1,2].map(j=>document.getElementById('rep-schema-'+j).value).join('|'))==='Pression constante||Puissance\navec limitation','retour sur la question : chaque réponse revient dans sa case')
 await pg.evaluate(()=>{G.reponses.s1='écrit sur un vieux téléphone';showQ()});await pg.waitForTimeout(200)
 verifie(await pg.evaluate(()=>document.getElementById('rep-schema-0').value)==='écrit sur un vieux téléphone','ancienne réponse sans libellés : revient dans la première case')
 await pg.evaluate(()=>{document.getElementById('rep-schema-0').value='Pression constante';document.getElementById('rep-schema-1').value='LS';saisieSchema();valider()});await pg.waitForTimeout(300)
 verifie(await pg.evaluate(()=>G.reponses.s1)==='Schéma A : Pression constante\nSchéma B : LS','Valider garde les réponses par schéma')

 // 2. Correction par un gacheur
 await pg.evaluate(async()=>{document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove())
   __DB.tentatives.push({id:'tS',quiz_id:'xS',aspirant_id:'a2',reponses:{s1:'Schéma A : Pression constante\nSchéma C : Puissance'},score:0,valide:false,notes_libres:{},note_admin:null,completed_at:new Date().toISOString()})
   G.admin=true;G.profil=__DB.profils[0];await ouvrirCorrectionAdmin('tS')})
 await pg.waitForTimeout(700)
 await cap('2_correction')
 const corr=await pg.evaluate(()=>{const z=document.querySelector('.par-schema');return z?{lignes:z.querySelectorAll('img[data-img]').length,texte:z.innerText.replace(/\n+/g,' | ')}:null})
 console.log('correction :',JSON.stringify(corr))
 verifie(corr&&corr.lignes===3,'correction : les 3 schémas avec leur image')
 verifie(corr&&/Schéma A \| Réponse : Pression constante \| Attendu : Pression constante/.test(corr.texte)&&/Schéma B \| Réponse : — \| Attendu : Load Sensing/.test(corr.texte)&&/Schéma C \| Réponse : Puissance \| Attendu : Régulation de puissance/.test(corr.texte),'correction : réponse et attendu en face de chaque schéma')
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))

 // 3. Relecture
 await pg.evaluate(()=>{__DB.questions.push({id:'s2',quiz_id:'xS',ordre:2,enonce:'Deux schémas.',type_question:'libre',options:[],points:2,reponse_type:'Schéma A : Accumulateur',medias:[{t:'img',p:'x1.png',n:'Schéma A',rep:1},{t:'img',p:'x2.png',n:'Schéma B',rep:1}]});previsualiserQuiz('xS')})
 await pg.waitForTimeout(600)
 const rel=await pg.evaluate(()=>document.getElementById('modal-previsu').innerText.replace(/\n+/g,' | '))
 verifie(/Une réponse par schéma/.test(rel)&&/Schéma B \| Attendu : Load Sensing/.test(rel),'relecture : réponse attendue par schéma')
 verifie(/réponse attendue manquante pour un schéma/.test(rel),'relecture : alerte si un schéma n a pas de réponse attendue')
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))

 // 4. Editeur : la question 11 telle qu'importee du Word
 await pg.evaluate(()=>{
   __DB.quiz.push({id:'qR',titre:'Évaluation hydraulique',module_id:2,mode_examen:true,actif:false,date_debut:'2026-11-30T19:00:00Z',date_fin:'2026-11-30T21:00:00Z'})
   __DB.questions.push({id:'r11',quiz_id:'qR',ordre:10,enonce:'Pour chacun des 4 schémas ci-dessous, indiquez à quel type de régulation il correspond.',type_question:'libre',options:[],points:2,
     reponse_type:'A = Pression Constante · B = Commande à distance · C = Load Sensing · D = Régulation de puissance',
     medias:[{t:'img',p:'qR/9.png',n:'Schéma A'},{t:'img',p:'qR/10.png',n:'Schéma B'},{t:'img',p:'qR/11.png',n:'Schéma C'},{t:'img',p:'qR/12.png',n:'Schéma D'}]})
   window.__majQ=[];const f=db.from.bind(db)
   db.from=function(t){const o=f(t);if(t==='questions'){const up=o.update;o.update=function(v){window.__majQ.push(JSON.parse(JSON.stringify(v)));return up.apply(this,arguments)}};return o}
   editerQuiz('qR')})
 await pg.waitForSelector('#modal-edit-quiz',{timeout:5000});await pg.waitForTimeout(300)
 verifie(await pg.evaluate(()=>!!document.getElementById('eq-parsch-0')&&!document.getElementById('eq-parsch-0').checked),'éditeur : case « une réponse par schéma » proposée, pas cochée')
 await pg.evaluate(()=>{const c=document.getElementById('eq-parsch-0');c.checked=true;c.onchange()});await pg.waitForTimeout(300)
 const ed=await pg.evaluate(()=>({vals:[0,1,2,3].map(j=>(document.getElementById('eq-sch-0-'+j)||{}).value),cache:getComputedStyle(document.getElementById('eq-ex-0')).display==='none',ex:document.getElementById('eq-ex-0').value}))
 console.log('éditeur :',JSON.stringify(ed))
 verifie(ed.vals.join('|')==='Pression Constante|Commande à distance|Load Sensing|Régulation de puissance','éditeur : la réponse « A = … · B = … » se répartit sur les 4 schémas')
 verifie(ed.cache&&ed.ex.split('\n').length===4&&ed.ex.startsWith('Schéma A : Pression Constante'),'éditeur : une ligne par schéma dans le corrigé')
 await pg.evaluate(()=>{const i=document.getElementById('eq-sch-0-1');i.value='Pression constante commandée à distance';i.oninput()
   const z=document.getElementById('eq-img-zone-0');z.querySelectorAll('button')[2].click()});await pg.waitForTimeout(300)
 await cap('3_editeur')
 const ed2=await pg.evaluate(()=>[0,1,2,3].map(j=>{const e=document.getElementById('eq-sch-0-'+j);return e?e.previousSibling.textContent+'='+e.value:null}).filter(Boolean).join(' | '))
 console.log('après retrait du schéma C :',ed2)
 verifie(ed2==='Schéma A=Pression Constante | Schéma B=Pression constante commandée à distance | Schéma D=Régulation de puissance','image retirée : chaque réponse reste en face de son schéma')
 await pg.evaluate(()=>eqSave('qR'));await pg.waitForTimeout(900)
 const sv=await pg.evaluate(()=>__majQ.find(x=>x.enonce&&x.enonce.startsWith('Pour chacun'))||null)
 console.log('enregistré :',JSON.stringify(sv&&{reponse_type:sv.reponse_type,medias:sv.medias}))
 verifie(sv&&sv.medias.length===3&&sv.medias.every(m=>m.rep===1)&&sv.reponse_type==='Schéma A : Pression Constante\nSchéma B : Pression constante commandée à distance\nSchéma D : Régulation de puissance','enregistrement : schémas marqués et une ligne par schéma')
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))

 // 5. Creer un quiz : noms generiques -> Schéma A, B, C
 await pg.evaluate(()=>{nav('quiz-admin');mqQuestions=[{type:'libre',enonce:'Identifie chaque symbole.',options:['','','',''],bonne:0,competence:'',reponse_type:'',points:2,imageUrl:'',
   medias:[{t:'img',p:'n/1.png',n:'photo1.png'},{t:'img',p:'n/2.png',n:'Image'},{t:'img',p:'n/3.png',n:'IMG_2044.JPG'}]}];renderQuestions()})
 await pg.waitForTimeout(300)
 verifie(await pg.evaluate(()=>!!document.getElementById('mq-parsch-0')),'Créer un quiz : case proposée pour une question libre avec images')
 await pg.evaluate(()=>basculerParSchemaCreation(0,true));await pg.waitForTimeout(200)
 verifie(await pg.evaluate(()=>mqQuestions[0].medias.map(m=>m.n+(m.rep?'*':'')).join(','))==='Schéma A*,Schéma B*,Schéma C*'&&await pg.evaluate(()=>!!document.getElementById('mq-sch-0-2')),'Créer un quiz : images renommées Schéma A, B, C avec une case chacune')
 await pg.evaluate(()=>{majAttenduSchemaCreation(0,0,'Pompe fixe');majAttenduSchemaCreation(0,1,'Moteur 2 sens');retirerMediaQuestion(0,0)})
 verifie(await pg.evaluate(()=>mqQuestions[0].reponse_type)==='Schéma B : Moteur 2 sens','Créer un quiz : image retirée, la réponse du schéma B reste au schéma B')

 // 6. Import Word : legendes Schéma A, B -> une reponse par schema d'office
 const imp=await pg.evaluate(async()=>{
   const q={type:'libre',enonce:'Régulations',options:['','','',''],bonne:0,competence:'',reponse_type:'A = Pression constante · B = Load Sensing',points:2,imageUrl:'',medias:[],
     _images:[{nom:'image9.png',octets:new Uint8Array([137,80,78,71]),legende:'Schéma A'},{nom:'image10.png',octets:new Uint8Array([137,80,78,71]),legende:'Schéma B'}]}
   const q2={type:'libre',enonce:'Une photo',options:['','','',''],bonne:0,competence:'',reponse_type:'Pompe',points:2,imageUrl:'',medias:[],_images:[{nom:'image1.png',octets:new Uint8Array([137,80,78,71]),legende:''}]}
   await deposerImagesImport([q,q2]);return {m:q.medias.map(m=>m.n+(m.rep?'*':'')).join(','),r:q.reponse_type,m2:q2.medias.map(m=>m.n+(m.rep?'*':'')).join(',')}})
 console.log('import :',JSON.stringify(imp))
 verifie(imp.m==='Schéma A*,Schéma B*'&&imp.r==='Schéma A : Pression constante\nSchéma B : Load Sensing','import Word : schémas légendés A, B → une réponse par schéma, corrigé réparti')
 verifie(imp.m2==='Image','import Word : une simple photo reste une photo')

 console.log(ko?ko+' vérification(s) en échec':'toutes les vérifications passent')
 console.log('ERREURS JS :',errs.length?errs:(ko?['vérifications en échec']:'aucune'))
 await b.close();process.exit(ko?1:0)})()
