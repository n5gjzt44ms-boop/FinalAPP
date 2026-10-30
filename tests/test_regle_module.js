// Regle unique de validation d'un module (statutTheorie) : verification sans navigateur.
const fs=require('fs'),path=require('path')
const c=fs.readFileSync(process.env.FICHIER||path.join(__dirname,'..','index.html'),'utf8')
const extraire=(nom)=>{const i=c.indexOf('function '+nom+'(');let d=0;const j=c.indexOf('{',i);for(let k=j;k<c.length;k++){if(c[k]==='{')d++;else if(c[k]==='}'){d--;if(!d)return c.slice(i,k+1)}}}
eval('function examensRequis(){return 4};'+extraire('examensValidesDistincts')+';'+extraire('statutTheorie')+';global.S=statutTheorie')
const ex=(id,mod,val)=>({quiz_id:id,valide:val,quiz:{mode_examen:true,module_id:mod}})
const exo=(id,mod,val)=>({quiz_id:id,valide:val,quiz:{mode_examen:false,module_id:mod}})
const cas=[
 ['1 examen réussi',{},[ex('e1',2,true)],2,null],
 ['1 examen + 10 exercices réussis',{},[ex('e1',2,true),...Array.from({length:10},(_,i)=>exo('x'+i,2,true))],2,null],
 ['même examen 4 fois (rattrapages)',{},[ex('e1',2,true),ex('e1',2,true),ex('e1',2,true),ex('e1',2,true)],2,null],
 ['4 examens distincts réussis',{},[ex('e1',2,true),ex('e2',2,true),ex('e3',2,true),ex('e4',2,true)],2,'examens'],
 ['acquis hors plateforme',{modules_valides:[3]},[ex('s1',3,true)],3,'acquis'],
 ['3 réussis + 1 raté',{},[ex('e1',2,true),ex('e2',2,true),ex('e3',2,true),ex('e4',2,false)],2,null],
]
let ko=0
for(const [n,p,t,m,attendu] of cas){const s=S(p,t,m);const ok=s===attendu;if(!ok)ko++;console.log((ok?'ok    ':'ÉCHEC ')+n.padEnd(36)+' → '+String(s))}
process.exit(ko?1:0)
