// Lance tous les scenarios de test.
//   node tests/lancer.js            tous les scenarios rapides
//   node tests/lancer.js --long     + le rattrapage de 65 s
//   node tests/lancer.js --detail   affiche la sortie de chaque scenario
// Autre fichier a tester : FICHIER=/chemin/vers/index.html node tests/lancer.js
const {spawnSync,execSync}=require('child_process'),fs=require('fs'),path=require('path')
const long=process.argv.includes('--long'),detail=process.argv.includes('--detail')
let racineGlobale='';try{racineGlobale=execSync('npm root -g',{stdio:['ignore','pipe','ignore']}).toString().trim()}catch(e){}
const env=Object.assign({},process.env,{NODE_PATH:[path.join(__dirname,'..','node_modules'),racineGlobale,process.env.NODE_PATH||''].filter(Boolean).join(path.delimiter)})
const fichiers=fs.readdirSync(__dirname).filter(f=>/^(e2e_|test_).*\.js$/.test(f)).filter(f=>long||f!=='e2e_ratt_long.js').sort()
let ko=0
for(const f of fichiers){
  const r=spawnSync(process.execPath,[path.join(__dirname,f)],{env,encoding:'utf8',timeout:240000})
  const sortie=(r.stdout||'')+(r.stderr||'')
  const ok=r.status===0&&(f.startsWith('test_')||/erreurs js : aucune/i.test(sortie))
  if(!ok) ko++
  console.log((ok?'OK    ':'ÉCHEC ')+f)
  if(!ok||detail) console.log(sortie.trim().split('\n').map(l=>'       '+l).join('\n'))
}
console.log(ko?'\n'+ko+' scénario(s) en échec':'\nTous les scénarios passent')
process.exit(ko?1:0)
