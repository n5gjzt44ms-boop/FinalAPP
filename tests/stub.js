(function(){
const U={id:'admin1',email:'b.prudhomme18@compagnons-du-devoir.fr'}
const DB={
 profils:[
  {id:'admin1',prenom:'Benoit',nom:'Prudhomme',role:'admin',superviseur:true,email:U.email,ville_sedentaire:'Lyon',telephone:'06',profil_complet:true,module_gacheur:null},
  {id:'a1',prenom:'Enzo',nom:'Mercier',role:'aspirant',module_inscrit:2,email:'e@x.fr',metier:'mecanicien',modules_valides:[3]},
  {id:'a2',prenom:'Paul',nom:'Fabre',role:'aspirant',module_inscrit:2,email:'p@x.fr',metier:'mecanicien'},
  {id:'a3',prenom:'Gabin',nom:'Lucet',role:'aspirant',module_inscrit:1,email:'g@x.fr',metier:'mecanicien'},
  {id:'a4',prenom:'Noah',nom:'Sauvage',role:'aspirant',module_inscrit:null,email:'n@x.fr'},
 ],
 quiz:[
  {id:'qH',titre:'Examen 1 - Maintenance',module_id:2,mode_examen:true,actif:true,date_debut:'2026-10-26T19:00:00Z',date_fin:'2026-10-26T21:00:00Z',niveau:1},
  {id:'qM',titre:'Moteur',module_id:1,mode_examen:true,actif:true,date_debut:'2026-10-26T19:00:00Z',date_fin:'2026-10-26T21:00:00Z',niveau:1},
  {id:'xH',titre:'Exercice filtration',module_id:2,mode_examen:false,actif:true,niveau:2},
 ],
 tentatives:[
  {id:'t1',aspirant_id:'a1',quiz_id:'qH',score:16,valide:true,note_admin:16,notes_libres:{},completed_at:'2026-10-26T20:30:00Z',reponses:{q1:1,q2:[0,2],q3:'Pompe <b>volumétrique</b>',zzorph:[1,3]}},
  {id:'t2',aspirant_id:'a1',quiz_id:'xH',score:12,valide:false,note_admin:null,notes_libres:null,completed_at:'2026-10-20T10:00:00Z',reponses:{}},
  {id:'t3',aspirant_id:'a3',quiz_id:'qM',score:0,valide:false,note_admin:null,notes_libres:{},completed_at:'2026-10-26T20:40:00Z',reponses:{}},
 ],
 questions:[{id:'q1',quiz_id:'qH',ordre:1,enonce:'Pression ?',type_question:'qcm',options:['1 bar','2 bar','3 bar'],bonne_reponse:1,points:2},{id:'q2',quiz_id:'qH',ordre:2,enonce:'Fluides ?',type_question:'multi',options:['Huile','Air','Eau','Sable','Gaz'],bonnes_reponses:[0,2,4],points:3},{id:'q3',quiz_id:'qH',ordre:3,enonce:'Type de pompe ?',type_question:'libre',options:[],points:5},{id:'q4',quiz_id:'qH',ordre:4,enonce:'Oubliée ?',type_question:'qcm',options:['a','b'],bonne_reponse:0,points:2}],
 carnet_bord:[{aspirant_id:'a1',module_id:2,valide_at:'2026-10-26T21:00:00Z'}],
 rattrapages:[],annonces:[],messages:[],ressources:[{id:'r1',titre:'Cours Mercier filtration',module_id:2,type:'pdf',storage_path:'x.pdf'}],
 periodes_inscription:[],inscriptions:[],mini_stages:[],dossiers:[],brouillons:[],historique_tentatives:[]
}
window.__DB=DB
function Q(t){this.t=t;this.f=[];this.one=false;this.headc=false}
const P=Q.prototype
;['order','limit','range','gte','lte','or','not','ilike','upsert','update','delete','insert','neq','contains'].forEach(m=>P[m]=function(){
  if(m==='ilike'){const [col,pat]=arguments;const s=pat.replace(/%/g,'').toLowerCase();this.f.push(r=>String(r[col]||'').toLowerCase().includes(s))}
  if(m==='or'&&/ilike/.test(arguments[0])){const s=(arguments[0].match(/%([^%]+)%/)||[])[1]||'';this.f.push(r=>((r.prenom||'')+' '+(r.nom||'')).toLowerCase().includes(s.toLowerCase()))}
  return this})
P.select=function(a,o){if(o&&o.head)this.headc=true;return this}
P.eq=function(k,v){this.f.push(r=>r[k]===v);return this}
P.in=function(k,v){this.f.push(r=>v.indexOf(r[k])>=0);return this}
P.is=function(k,v){this.f.push(r=>r[k]===v||(v===null&&r[k]===undefined));return this}
P.single=function(){this.one=true;return this};P.maybeSingle=P.single
P.then=function(res,rej){
  let rows=(DB[this.t]||[]).filter(r=>this.f.every(f=>f(r)))
  if(this.t==='tentatives') rows=rows.map(r=>Object.assign({},r,{quiz:DB.quiz.find(q=>q.id===r.quiz_id)||null}))
  const out=this.one?{data:rows[0]||null,error:null}:{data:rows,error:null,count:rows.length}
  return Promise.resolve(out).then(res,rej)}
const db={from:t=>new Q(t),
 auth:{getSession:async()=>({data:{session:{user:U}}}),getUser:async()=>({data:{user:U}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({})},
 storage:{from:()=>({createSignedUrl:async()=>({data:{signedUrl:'about:blank'}}),upload:async()=>({}),remove:async()=>({})})}}
window.supabase={createClient:()=>db}
})()
