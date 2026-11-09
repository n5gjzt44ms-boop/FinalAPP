// Import d'un quiz Word : questions, reponses, images, propositions, legendes,
// transformation en QCM, puis enregistrement avec les images.
const {chromium}=require('playwright');const fs=require('fs'),zlib=require('zlib')
;(async()=>{
 const path=require('path'),os=require('os')
 const STUB=path.join(__dirname,'stub.js')
 const FICHIER=process.env.FICHIER||path.join(__dirname,'..','index.html')
 const SP=fs.mkdtempSync(path.join(os.tmpdir(),'progmeca-'))
 // ── Fabrication d'un petit .docx (zip) ──
 const crcT=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;crcT[n]=c>>>0}
 const crc=b=>{let c=0xFFFFFFFF;for(const x of b)c=crcT[(c^x)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
 function zip(fichiers){
   const parts=[],centre=[];let off=0
   for(const [nom,contenu,compresser] of fichiers){
     const brut=Buffer.isBuffer(contenu)?contenu:Buffer.from(contenu,'utf8')
     const data=compresser?zlib.deflateRawSync(brut):brut,n=Buffer.from(nom)
     const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50,0);h.writeUInt16LE(20,4);h.writeUInt16LE(compresser?8:0,8);h.writeUInt32LE(crc(brut),14);h.writeUInt32LE(data.length,18);h.writeUInt32LE(brut.length,22);h.writeUInt16LE(n.length,26)
     const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(compresser?8:0,10);c.writeUInt32LE(crc(brut),16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(brut.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE(off,42)
     parts.push(h,n,data);centre.push(c,n);off+=30+n.length+data.length
   }
   const cd=Buffer.concat(centre),e=Buffer.alloc(22);e.writeUInt32LE(0x06054b50,0);e.writeUInt16LE(fichiers.length,8);e.writeUInt16LE(fichiers.length,10);e.writeUInt32LE(cd.length,12);e.writeUInt32LE(off,16)
   return Buffer.concat(parts.concat([cd,e]))
 }
 const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;')
 const P=(t,o={})=>`<w:p><w:r><w:rPr>${o.g?'<w:b/>':''}${o.s?'<w:highlight w:val="yellow"/>':''}</w:rPr><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`
 let nImg=0;const IMG=()=>{nImg++;return `<w:p><w:r><w:drawing><wp:inline><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="rId${nImg}"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`}
 const corps=[P('Évaluation : composants',{g:1}),P('Session de test',{g:1}),P('1. Les pompes',{g:1}),
   P('Question 1.a Identifiez le composant ci-dessous :',{g:1}),IMG(),P('Réponse : Pompe à palettes'),
   P('Question 1.b Identifiez le composant ci-dessous :',{g:1}),IMG(),P('Reponse : Pompe à engrenages'),
   P('Question 1.c Quel est le nom de ce composant ?',{g:1}),IMG(),P('Réponse : Moteur orbital'),
   P('Question 1.d Identifiez le composant ci-dessous :',{g:1}),IMG(),P('Réponse : Accumulateur à vessie'),
   P('Question 2. Quel composant limite la pression ?',{g:1}),P('a) Réducteur de débit'),P('b) Limiteur de pression',{s:1}),P('c) Clapet anti-retour'),P('d) Filtre retour'),
   P('Question 3. Donnez une solution simple pour savoir si une pompe débite dans les deux sens.',{g:1}),P('Réponse : deux orifices de même diamètre.'),
   P('2. Les distributeurs',{g:1}),P('Pour chacun des distributeurs ci-dessous, précisez le type.'),
   P('Distributeur 1',{g:1}),IMG(),P('Réponse attendue : Distributeur 4/2'),
   P('Distributeur 2',{g:1}),IMG(),P('Réponse attendue : Distributeur 4/3'),
   P('Question 4. Pour chaque schéma, indiquez la régulation.',{g:1}),P('Réponses : A = Pression constante · B = Load Sensing'),P('Schéma A',{g:1}),IMG(),P('Schéma B',{g:1}),IMG(),
   P('Question 5. Réaliser le symbole de cette pompe :',{g:1}),IMG()].join('')
 const ns='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"'
 const docXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${ns}><w:body>${corps}</w:body></w:document>`
 let rels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64')
 const medias=[];for(let k=1;k<=nImg;k++){rels+=`<Relationship Id="rId${k}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${k}.png"/>`;medias.push(['word/media/image'+k+'.png',png,false])}
 rels+='</Relationships>'
 const DOCX=path.join(SP,'quiz_test.docx')
 fs.writeFileSync(DOCX,zip([['[Content_Types].xml','<?xml version="1.0"?><Types/>',true],['word/document.xml',docXml,true],['word/_rels/document.xml.rels',rels,true]].concat(medias)))
 // ── Scenario ──
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}})
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{console.log('DIALOG:',d.message().slice(0,90).replace(/\n/g,' '));d.accept()})
 await pg.route('**/*',r=>{const u=r.request().url()
   if(u.includes('supabase')) return r.fulfill({body:fs.readFileSync(STUB,'utf8'),contentType:'application/javascript'})
   if(u.startsWith('file:')) return r.continue()
   return r.fulfill({body:'',contentType:'application/javascript'})})
 await pg.goto('file://'+FICHIER);await pg.waitForTimeout(2200)
 await pg.evaluate(()=>document.querySelectorAll('[id^="modal-"]').forEach(m=>m.remove()))
 await pg.evaluate(()=>{G.admin=true;G.profil=__DB.profils[0];window.__envois=[]
   const st=db.storage.from;db.storage.from=function(n){const o=st(n);o.upload=async function(p){window.__envois.push(p);return {}};return o}
   const f=db.from.bind(db);db.from=function(t){const o=f(t);if(t==='questions'){const ins=o.insert;o.insert=function(l){window.__lignes=l;return ins.apply(this,arguments)}};return o}
   nav('quiz-admin')})
 await pg.waitForTimeout(700)
 await pg.setInputFiles('#mq-import input[type=file]',DOCX)
 await pg.waitForSelector('#modal-import-quiz',{timeout:15000})
 console.log('aperçu :',(await pg.evaluate(()=>document.getElementById('modal-import-quiz').innerText.split('\n').slice(0,4).join(' | '))))
 await pg.screenshot({path:SP+'/import_apercu.png'})
 const avant=await pg.evaluate(()=>_importEnCours.questions.map(q=>({t:q.type,e:q.enonce,r:q.reponse_type,o:q.options,b:q.bonne,i:(q._images||[]).map(x=>x.legende||'-'),s:q.competence})))
 avant.forEach((q,i)=>console.log('Q'+(i+1),q.t,'|',q.s,'|',q.e.slice(0,70),'|',(q.r||'').slice(0,40),'| images',q.i.join(',')))
 const echecs=[]
 const verif=(c,msg)=>{if(!c)echecs.push(msg)}
 verif(avant.length===10,'10 questions attendues, '+avant.length+' trouvées')
 verif(avant[0]&&avant[0].r==='Pompe à palettes'&&avant[0].i.length===1&&avant[0].s==='Les pompes','question 1 : réponse, image ou partie')
 verif(avant[1]&&avant[1].r==='Pompe à engrenages','question 2 : « Reponse » sans accent non lue')
 verif(avant[4]&&avant[4].t==='qcm'&&avant[4].o.length===4&&avant[4].b===1,'question à propositions : bonne réponse surlignée non lue')
 verif(avant[5]&&/^Donnez/.test(avant[5].e)&&avant[5].t==='libre','question 3 collée à la précédente')
 verif(avant[6]&&/Pour chacun des distributeurs/.test(avant[6].e)&&/Distributeur 1/.test(avant[6].e)&&avant[6].r==='Distributeur 4/2','distributeur 1 : consigne ou réponse')
 verif(avant[7]&&avant[7].r==='Distributeur 4/3','distributeur 2')
 verif(avant[8]&&avant[8].i.join(',')==='Schéma A,Schéma B'&&/Load Sensing/.test(avant[8].r)&&/^Pour chaque schéma/.test(avant[8].e),'schémas A et B : légendes, réponse ou consigne recollée')
 verif(avant[9]&&/^Réaliser le symbole/.test(avant[9].e)&&!avant[9].r&&avant[9].i.length===1,'question sans réponse (symbole à dessiner)')
 await pg.evaluate(()=>{const c=document.getElementById('imp-qcm');if(c)c.checked=true})
 await pg.evaluate(()=>validerImport());await pg.waitForTimeout(1500)
 const apres=await pg.evaluate(()=>mqQuestions.map(q=>({t:q.type,o:q.options,b:q.bonne,r:q.reponse_type,m:(q.medias||[]).length})))
 console.log('après import :',apres.length,'questions,',apres.filter(q=>q.t==='qcm').length,'QCM,',apres.reduce((a,q)=>a+q.m,0),'images, titre «',await pg.evaluate(()=>$('mq-titre').value),'»')
 const qcm1=apres[0]
 verif(qcm1&&qcm1.t==='qcm'&&qcm1.o.length===4&&qcm1.o[qcm1.b]==='Pompe à palettes'&&new Set(qcm1.o).size===4,'transformation en QCM de la question 1')
 verif(apres.filter(q=>q.t==='qcm').length===5,'5 QCM attendus après transformation (4 identifications + 1 à propositions)')
 verif(apres[5].t==='libre'&&apres[6].t==='libre'&&apres[8].t==='libre','une explication ou un distributeur doit rester libre')
 verif(await pg.evaluate(()=>__envois.length)===9,'9 images envoyées au stockage')
 verif(await pg.evaluate(()=>$('mq-titre').value)==='Évaluation : composants','titre du quiz repris du document')
 await pg.screenshot({path:SP+'/import_editeur.png'})
 await pg.evaluate(()=>pubQuizManuel());await pg.waitForTimeout(1200)
 const lignes=await pg.evaluate(()=>(window.__lignes||[]).map(l=>({t:l.type_question,m:(l.medias||[]).length,u:l.image_url||''})))
 console.log('envoyé en base :',lignes.length,'questions,',lignes.filter(l=>l.m).length,'avec images, exemple',(lignes.find(l=>l.u)||{}).u)
 verif(lignes.length===10&&lignes.filter(l=>l.m).length===8&&lignes.every(l=>!l.u||/^questions\/import-/.test(l.u)),'enregistrement : images non transmises')
 // Fichiers refuses
 await pg.evaluate(()=>{window.__toasts=[];const t=window.toast;window.toast=function(m,k){window.__toasts.push(m);return t(m,k)}})
 fs.writeFileSync(path.join(SP,'vieux.doc'),'x');fs.writeFileSync(path.join(SP,'autre.txt'),'x')
 await pg.setInputFiles('#mq-import input[type=file]',path.join(SP,'vieux.doc'));await pg.waitForTimeout(300)
 await pg.setInputFiles('#mq-import input[type=file]',path.join(SP,'autre.txt'));await pg.waitForTimeout(300)
 const msgs=await pg.evaluate(()=>__toasts)
 console.log('refus :',msgs.join(' / '))
 verif(msgs.some(m=>/\.docx/.test(m))&&msgs.some(m=>/Word \(\.docx\) ou PDF/.test(m)),'messages pour un .doc ou un autre fichier')
 if(echecs.length){console.log('ÉCHECS :',echecs);errs.push(...echecs)}
 console.log('ERREURS JS :',errs.length?errs:'aucune')
 await b.close()})()
