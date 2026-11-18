// Reecrit les schemas normes dans illustrations/ a partir des descriptions de outils/schemas_*.js
// Usage : node outils/generer_schemas.js [dossier de sortie] [debut du nom]
// Un schema ne doit jamais donner la reponse d'une question : relire les questions liees avant de modifier.
'use strict'
const fs=require('fs'),path=require('path')
const dos=process.argv[2]||path.join(__dirname,'..','illustrations'),filtre=process.argv[3]||''
let n=0
;['schemas_hydraulique','schemas_electricite','schemas_transmissions','schemas_soudure'].forEach(function(f){
  if(!fs.existsSync(path.join(__dirname,f+'.js'))) return
  const D=require('./'+f)
  Object.keys(D).forEach(function(k){
    if(filtre&&!k.startsWith(filtre)) return
    fs.writeFileSync(path.join(dos,k+'.svg'),D[k]);n++
  })
})
console.log(n+' schemas ecrits dans '+dos)
