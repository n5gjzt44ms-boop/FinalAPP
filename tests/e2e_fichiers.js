// Examen : l'aspirant repond avec un fichier de tout format (Word, SolidWorks,
// PDF...), un fichier trop lourd est refuse avec un message clair, et le
// gacheur voit les fichiers a la correction. Exercice : document du fabricant
// a consulter en face de la question (media "lien").
const {chromium}=require('playwright');const fs=require('fs')
;(async()=>{
 const path=require('path')
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}})
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{console.log('DIALOG',d.type(),':',d.message().slice(0,80).replace(/\n/g,' '));d.accept()})
 await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8'),contentType:'application/javascript'})
   if(u.startsWith('file:')||u.startsWith('blob:')||u.startsWith('data:')) return r.continue()
   return r.fulfill({body:'',contentType:'application/javascript'})})
 await pg.goto('file://'+FICHIER);await pg.waitForTimeout(2200)
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))
 // Aspirant Paul (module 2), rattrapage ouvert sur l'examen qH ; depots notes
 await pg.evaluate(async()=>{G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a2');__DB.rattrapages=[{quiz_id:'qH',aspirant_id:'a2',date_limite:'2030-01-01T00:00:00Z'}]
   window.__depots=[];const st=db.storage.from;db.storage.from=function(){const o=st.apply(this,arguments);o.upload=async(p,corps,opt)=>{window.__depots.push({p:p,type:opt&&opt.contentType,taille:corps&&corps.size});return {}};return o}
   const orig=db.from.bind(db);window.__ins=[];db.from=function(t){const q=orig(t);const ins=q.insert;q.insert=function(v){window.__ins.push({t:t,v:JSON.parse(JSON.stringify(v))});return ins.apply(q,arguments)};return q}
   await commencer('qH')})
 await pg.waitForTimeout(500)
 await pg.evaluate(()=>{G.etape=2;showQ()});await pg.waitForTimeout(200)
 console.log('question :',await pg.evaluate(()=>G.questions[G.etape].type_question),'| filtre de formats :',await pg.evaluate(()=>document.getElementById('fichier-libre').getAttribute('accept')||'aucun'),'| aide :',await pg.evaluate(()=>(document.getElementById('q-opts').innerText.match(/Tous les fichiers[^\n]*/)||['absente'])[0]))
 await pg.fill('#rep-libre','Voir mes fichiers')
 await pg.setInputFiles('#fichier-libre',[
   {name:'Support palier.SLDPRT',mimeType:'',buffer:Buffer.alloc(30000,7)},
   {name:'Compte rendu.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:Buffer.alloc(12000,3)},
   {name:'Circuit.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 essai')}])
 await pg.waitForTimeout(1500)
 console.log('pièces :',await pg.evaluate(()=>JSON.stringify(piecesJointes(G.fichiersLibres[G.questions[G.etape].id]).map(p=>p.nom+' '+p.type+' '+p.etat+(p.path?' déposé':'')))))
 console.log('dépôts :',await pg.evaluate(()=>__depots.map(d=>d.p.split('_').slice(-1)[0]+' ('+d.type+')').join(', ')))
 // Fichier trop lourd (limite abaissee a 1 Mo pour le test)
 await pg.evaluate(()=>{TAILLE_MAX_PJ_MO=1})
 await pg.setInputFiles('#fichier-libre',{name:'Assemblage.SLDASM',mimeType:'',buffer:Buffer.alloc(1600000,1)})
 await pg.waitForTimeout(800)
 console.log('trop lourd :',await pg.evaluate(()=>{const l=piecesJointes(G.fichiersLibres[G.questions[G.etape].id]);const p=l[l.length-1];return p.nom+' → '+p.etat+' : '+p.erreur}),'| déposé quand même :',await pg.evaluate(()=>__depots.some(d=>/Assemblage/.test(d.p))))
 await pg.evaluate(()=>{const qid=G.questions[G.etape].id;G.fichiersLibres[qid]=piecesJointes(G.fichiersLibres[qid]).filter(p=>p.etat!=='erreur');afficherPiecesJointes(qid)})
 await pg.evaluate(()=>{valider()});await pg.waitForTimeout(300)
 await pg.evaluate(()=>terminer());await pg.waitForTimeout(2500)
 const copie=await pg.evaluate(()=>{const x=window.__ins.filter(i=>i.t==='tentatives').pop();return x?x.v:null})
 console.log('copie envoyée, fichiers :',copie?JSON.stringify(Object.values(copie.fichiers_libres||{}).flat().map(p=>p.nom+' '+p.type+(p.path?' (chemin)':''))):'aucune copie')
 // Correction : le gacheur voit et telecharge chaque fichier
 await pg.evaluate(async(c)=>{c.id='tF';c.completed_at=new Date().toISOString();__DB.tentatives.push(c);G.admin=true;G.profil=__DB.profils[0];document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove());await ouvrirCorrectionAdmin('tF')},copie)
 await pg.waitForTimeout(800)
 console.log('correction :',await pg.evaluate(()=>{const t=document.body.innerText;return ['Support palier.SLDPRT','Compte rendu.docx','Circuit.pdf'].map(n=>n+(t.includes(n)?' visible':' ABSENT')).join(' | ')}),'| boutons télécharger :',await pg.evaluate(()=>document.querySelectorAll('[onclick^="telechargerSujet"]').length))
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))
 // Exercice : document du fabricant en face de la question
 await pg.evaluate(async()=>{
   __DB.quiz.push({id:'xL',titre:'Accumulateur',module_id:2,mode_examen:false,actif:true,niveau:9})
   __DB.questions.push({id:'l1',quiz_id:'xL',ordre:1,enonce:'Lis la précharge dans la notice.',type_question:'qcm',options:['10 bar','90 % de p0'],bonne_reponse:0,points:2,medias:[{t:'lien',p:'https://example.com/notice.pdf',n:'Notice HYDAC 3.201, page 4'}]})
   G.admin=false;G.profil=__DB.profils.find(p=>p.id==='a2');window.__ouverts=[];window.open=function(u){window.__ouverts.push(u);return null}
   await commencer('xL',true)})
 await pg.waitForTimeout(600)
 const bt=await pg.evaluate(()=>{const x=[...document.querySelectorAll('#q-image-wrap button')].find(b=>b.innerText.includes('HYDAC'));if(!x)return 'absent';x.click();return x.innerText.replace(/\s+/g,' ').trim()})
 console.log('document en face :',bt,'| ouvert :',await pg.evaluate(()=>__ouverts.join(',')),'| image cassée :',await pg.evaluate(()=>document.querySelectorAll('#q-image-wrap img').length))
 await pg.evaluate(()=>{G.admin=true;G.profil=__DB.profils[0];previsualiserQuiz('xL')});await pg.waitForTimeout(500)
 console.log('relecture :',await pg.evaluate(()=>{const a=document.querySelector('#modal-previsu a[href*="notice"]');return a?a.innerText.trim()+' → '+a.getAttribute('href'):'lien absent'}))
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()})()
