// Schemas de soudure, de pliage et de rechargement (lots 3 et 4).
// Coupes hachurees ISO 128, cotes ISO 129, symboles de soudure ISO 2553.
// Hachures rouges ou bleues : metal depose. Trait mixte a deux tirets : contour d'origine.
'use strict'
const S=require('./symboles')
const {N,ROUGE,BLEU,GRIS,PALE,pl,ln,ci,re,pa,tx,fl,axe,cote,rep,page,H,H2,HS,HR,HB}=S
const ISO='Coupe ISO 128, symbole ISO 2553'
const D={}

// Thermometre de contact pose en (x,y)
function thermo(x,y){return re(x-24,y-74,48,28,{f:'#fff',w:2.4,rx:4})+tx(x,y-53,'°C',{s:18,b:1})+ln(x,y-46,x,y-7,{w:2.6})+ci(x,y-5,5,{f:N,w:0.5})}
// Tole pliee en V : sommet exterieur (cx,cy), demi-angle a (degres), longueur d'aile L, epaisseur t
function pli(cx,cy,ad,L,t,o){const a=ad*Math.PI/180,si=Math.sin(a),co=Math.cos(a)
  const O1=[cx-L*si,cy-L*co],O2=[cx+L*si,cy-L*co]
  return pl([O1,[cx,cy],O2,[O2[0]-t*co,O2[1]-t*si],[cx,cy-t/si],[O1[0]+t*co,O1[1]-t*si]],o)
}
// Dent de godet vue de cote
const DENT=[[110,180],[430,200],[560,250],[560,270],[430,320],[110,340]]

// Energie de soudage : torche MAG, cordon, grandeurs
;(function(){
  let c=re(120,300,660,60,{f:H})+pa('M 186 300 Q 196 282 220 282 L 432 282 Q 452 284 458 300 Z',{f:HR})
  c+='<g transform="rotate(20 470 290)">'+re(448,150,44,90,{f:PALE,rx:6})+pl([[452,240],[462,262],[478,262],[488,240]],{z:1,f:PALE})+ln(470,262,470,286,{w:2.4})+'</g>'
  c+=fl(520,394,700,394,{c:BLEU,w:2.6})+tx(610,424,'v (mm/min)',{c:BLEU})
  c+=tx(640,150,'U (V)',{a:'s'})+tx(640,182,'I (A)',{a:'s'})+tx(640,214,'rendement k',{a:'s'})+tx(556,112,'torche MAG',{a:'s',s:20})
  c+=tx(190,160,'Q = ?',{c:ROUGE,b:1,s:34})
  c+=S.soudure(330,280,150,226,{type:'recharge',L:120,droite:1})
  c+=tx(160,394,'tôle',{a:'s',s:20})+rep(240,290,150,268,'cordon')
  D.e13_energie=page(900,474,'Énergie de soudage au MAG',c,ISO,'Torche MAG déposant un cordon sur une tôle : tension, intensité, vitesse, rendement')
})()

// Fissure dans un pli, cote interieur
;(function(){
  let c=pa('M 223.8 108.6 L 407.6 292.4 A 60 60 0 0 0 492.4 292.4 L 676.2 108.6 L 657.8 90.2 L 474 274 A 34 34 0 0 1 426 274 L 242.2 90.2 Z',{f:H})
  c+=S.fissure(450,284,0,19)
  c+=rep(436,280,450,170,'côté intérieur (compression)',{a:'m'})+rep(450,311,450,372,'côté extérieur (traction)',{a:'m'})
  c+=rep(452,296,640,300,'fissure',{c:ROUGE})
  D.e13_fissure=page(900,430,'Fissure dans un pli',c,'Coupe ISO 128','Tôle pliée en coupe, avec une fissure du côté intérieur du pli')
})()

// Preparer et pointer un assemblage
;(function(){
  let c=tx(230,100,'Coupe',{b:1,s:20})+re(90,330,300,44,{f:H})+re(206,150,44,170,{f:H2})
  c+=pl([[206,330],[178,330],[206,302]],{z:1,f:HR})
  c+=rep(228,325,300,274,'écartement : ?',{ct:ROUGE,b:1})+rep(192,318,104,256,'point de pointage',{a:'m'})
  c+=S.soudure(252,328,290,186,{type:'angle',L:120})
  c+=tx(680,100,'Vue de face',{b:1,s:20})+re(500,330,360,44,{f:PALE})+re(520,150,320,170,{f:'#fff'})+re(500,150,20,180,{f:PALE})
  c+=re(600,314,220,16,{f:HR,rx:6,w:2})
  c+=ln(600,282,600,312,{w:1.4})+cote(520,290,600,290,'?',{ct:ROUGE,b:1,s:26})
  c+=rep(510,200,470,136,'angle',{a:'m'})+rep(720,318,736,250,'cordon')
  c+=tx(680,404,'Début du cordon : distance à l’angle ?',{c:ROUGE,s:19})
  D.e13_joint=page(900,456,'Préparer et pointer un assemblage',c,ISO,'Assemblage en T : écartement entre les tôles, point de pointage, début du cordon près d un angle')
})()

// Ou placer la ligne de pliage : sens de laminage et marquage
;(function(){
  let c=re(150,120,600,270,{f:PALE})+re(560,290,150,50,{f:'#fff',w:2})+tx(635,313,'MARQUAGE',{s:19,b:1})
  c+=fl(430,176,650,176,{c:BLEU,w:2.6})+tx(430,158,'sens de laminage',{a:'s',c:BLEU,s:20})
  c+=ln(330,96,330,414,{d:'m',w:2.6})+tx(330,88,'ligne A',{b:1})
  c+=ln(126,328,774,328,{d:'m',w:2.6})+tx(784,335,'ligne B',{a:'s',b:1})
  c+=tx(450,452,'Ligne A ou ligne B : laquelle choisir pour le pli ?',{c:BLEU})
  D.e13_laminage=page(900,480,'Où placer la ligne de pliage ?',c,'Vue de dessus ISO 128','Tôle vue de dessus : sens de laminage, marquage frappé, deux lignes de pliage possibles')
})()

// Soudure en plusieurs passes dans un chanfrein en V
;(function(){
  let c=pl([[120,260],[400,260],[440,340],[120,340]],{z:1,f:H})+pl([[500,260],[780,260],[780,340],[460,340]],{z:1,f:H2})
  c+=pl([[440,340],[460,340],[472,316],[428,316]],{z:1,f:HR})+pl([[428,316],[472,316],[485,290],[415,290]],{z:1,f:HB})
  c+=pa('M 415 290 L 450 290 L 450 252 Q 420 246 398 260 Z',{f:HR})+pa('M 450 290 L 485 290 L 502 260 Q 480 246 450 252 Z',{f:HB})
  ;[[450,328,1],[450,303,2],[430,273,3],[470,273,4]].forEach(function(q){c+=ci(q[0],q[1],10,{f:'#fff',w:1.4})+tx(q[0],q[1]+6,String(q[2]),{s:16,b:1})})
  c+=re(428,112,44,70,{f:PALE,rx:5})+pl([[432,182],[440,204],[460,204],[468,182]],{z:1,f:PALE})+ln(450,204,450,244,{w:2.4})+tx(450,100,'buse',{s:20})
  c+=rep(480,268,600,196,'T entre passes : ?',{ct:ROUGE,c:ROUGE,b:1})
  c+=S.soudure(398,256,150,186,{type:'V',L:150,droite:1})
  c+=tx(200,374,'tôle',{s:20})+tx(450,424,'Gaz, débit et température entre passes à respecter',{c:BLEU,s:20})
  D.e13_passes=page(900,474,'Soudure en plusieurs passes',c,ISO,'Chanfrein en V rempli en quatre passes numérotées, buse au-dessus')
})()

// Pliage en V sur presse plieuse : poincon, tole, matrice
;(function(){
  let c=pa('M 400 100 H 500 V 200 L 479 228 A 30 30 0 0 1 421 228 L 400 200 Z',{f:H2})
  c+=re(180,250,540,26,{f:HS})
  c+=pa('M 250 276 H 336 Q 350 276 357 286 L 450 380 L 543 286 Q 550 276 564 276 H 650 V 440 H 250 Z',{f:H})
  c+=axe(450,80,450,452)
  c+=rep(470,243,600,170,'rayon du poinçon Rp : ?',{ct:ROUGE,b:1})+rep(551,283,664,340,'rayon d’arête Rd : ?',{ct:ROUGE,b:1})
  c+=cote(350,440,550,440,'ouverture W : ?',{dec:52,ct:ROUGE,b:1})
  c+=fl(748,216,748,250,{t:12,w:1.6})+fl(748,310,748,276,{t:12,w:1.6})+ln(724,250,760,250,{w:1.4})+ln(724,276,760,276,{w:1.4})+tx(764,270,'t',{a:'s',i:1,b:1,s:24})
  c+=tx(384,150,'poinçon',{a:'e',s:20})+tx(236,400,'matrice',{a:'e',s:20})+tx(184,240,'tôle',{a:'s',s:20})
  D.e13_pliage=page(900,540,'Pliage en V sur presse plieuse',c,'Coupe ISO 128, cotes ISO 129','Coupe d un pliage en V : poinçon, tôle, matrice, avec les rayons et l ouverture à trouver')
})()

// Prechauffer avant de souder : zones a chauffer, mesure
;(function(){
  let c=pl([[110,250],[410,250],[440,330],[110,330]],{z:1,f:H})+pl([[490,250],[790,250],[790,330],[460,330]],{z:1,f:H2})
  c+=re(270,250,140,80,{f:ROUGE,c:ROUGE,w:0.5,op:0.25})+re(490,250,140,80,{f:ROUGE,c:ROUGE,w:0.5,op:0.25})
  c+=cote(270,330,410,330,'? mm',{dec:42,ct:ROUGE,b:1})+cote(490,330,630,330,'? mm',{dec:42,ct:ROUGE,b:1})
  c+=thermo(570,250)+tx(604,206,'thermomètre de contact',{a:'s',s:19})
  c+=S.soudure(446,252,150,180,{type:'V',L:150,droite:1})
  c+=tx(190,236,'tôle',{s:20})+tx(450,434,'Où mesurer, et après combien de temps ?',{c:BLEU})
  D.e13_prechauffage=page(900,484,'Préchauffer avant de souder',c,ISO,'Deux tôles chanfreinées en coupe, zones à préchauffer de chaque côté du joint, thermomètre de contact')
})()

// Retour elastique apres pliage
;(function(){
  let c=pli(230,360,45,190,16,{z:1,f:H})+tx(230,410,'sous charge',{s:20})
  c+=pli(650,360,45,190,16,{z:1,d:'mm',w:1.6})+pli(650,360,57,190,16,{z:1,f:H})+tx(650,410,'après déchargement',{s:20})
  c+=pa('M 795 215 A 205 205 0 0 1 822 248.4',{c:ROUGE,w:2.6})+S.pt(823,250,1.0,{c:ROUGE,t:12})+tx(800,190,'retour : ?',{c:ROUGE,b:1})
  c+=tx(450,444,'Trait mixte à deux tirets : position sous charge',{s:18,c:BLEU})
  D.e13_retour=page(900,470,'Retour élastique après pliage',c,'Coupe ISO 128','Tôle pliée sous charge, puis après déchargement : le pli s ouvre')
})()

// Test a l'aimant sur une dent de godet
;(function(){
  let c=pl(DENT,{z:1,f:PALE})+axe(90,260,596,260)
  c+=pa('M 720 200 A 60 60 0 0 1 720 320 L 720 284 A 24 24 0 0 0 720 236 Z',{f:GRIS})+re(646,200,74,36,{f:GRIS})+re(646,284,74,36,{f:GRIS})
  c+=re(610,200,36,36,{f:ROUGE})+tx(628,226,'N',{c:'#fff',b:1,s:20})+re(610,284,36,36,{f:BLEU})+tx(628,310,'S',{c:'#fff',b:1,s:20})
  c+=tx(585,274,'?',{c:ROUGE,b:1,s:40})+tx(270,388,'dent de godet',{s:20})+tx(700,388,'aimant',{s:20})
  c+=tx(450,430,'L’aimant colle, ou ne colle pas ?',{c:BLEU})
  D.e17_aimant=page(900,450,'Test à l’aimant',c,'Vue ISO 128','Aimant approché d une dent de godet')
})()

// Disposition des cordons de rechargement sur une levre de godet
;(function(){
  let c=''
  ;['A','B','C'].forEach(function(n,k){const x=90+260*k
    c+=re(x,140,200,180,{f:PALE})+tx(x+100,126,n,{b:1,s:26})
    if(k!==1) for(let i=0;i<6;i++) c+=re(x+18+i*30,150,14,160,{f:HR,w:1.6})
    if(k!==0) for(let i=0;i<5;i++) c+=re(x+10,154+i*36,180,14,{f:HR,w:1.6})
  })
  c+=fl(120,372,780,372,{c:BLEU,w:3.2,t:16})+tx(450,406,'sens d’écoulement de la matière',{c:BLEU})
  c+=tx(450,440,'Hachures rouges : cordons de rechargement',{s:18,c:ROUGE})
  D.e17_cordons=page(900,460,'Cordons de rechargement sur une lèvre de godet',c,'Vue de dessus ISO 128','Trois dispositions de cordons : en travers, dans le sens de l écoulement, croisés')
})()

// Dent de godet usee : contour d'origine et usure
;(function(){
  let c=pl([[120,170],[450,192],[540,224],[566,260],[540,296],[450,328],[120,350]],{z:1,f:PALE})
  c+=pl([[450,192],[640,250],[640,270],[450,328]],{d:'mm',w:1.6})+axe(100,260,680,260)
  c+=cote(566,272,640,272,'25 mm',{dec:84})+tx(603,386,'usure',{s:19})
  c+=rep(620,244,700,176,'contour d’origine')+tx(290,240,'dent usée',{s:20})
  c+=tx(450,440,'Quelles couches, dans quel ordre, et jusqu’où ?',{c:BLEU})
  D.e17_couches=page(900,470,'Dent de godet usée',c,'Vue ISO 128, cotes ISO 129','Dent de godet usée de 25 mm, avec son contour d origine en trait mixte')
})()

// Couche anti-abrasion fissuree en travers
;(function(){
  let c=tx(450,96,'cordon vu de dessus',{s:19})+re(150,112,600,50,{rx:25,f:HR})
  c+=tx(450,236,'coupe le long du cordon',{s:19})+re(120,300,660,70,{f:H})+pa('M 150 300 Q 158 268 190 268 H 710 Q 742 268 750 300 Z',{f:HR})
  for(let x=210;x<=690;x+=60) c+=S.fissure(x,116,0,42)+S.fissure(x,270,0,30,{n:3})
  c+=tx(450,404,'dépôt aux carbures de chrome sur le métal de base',{s:19})+tx(450,440,'En rouge : fines fissures en travers du cordon',{c:ROUGE,s:19})
  D.e17_fissures=page(900,470,'Couche anti-abrasion après soudage',c,'Coupe ISO 128','Cordon de rechargement dur vu de dessus et en coupe, avec de fines fissures en travers')
})()

// Dent au manganese en cours de rechargement
;(function(){
  let c=pl(DENT,{z:1,f:PALE})+axe(90,260,596,260)+pl([[430,200],[560,250],[566,238],[436,188]],{z:1,f:HR})
  c+=ln(636,128,508,208,{w:5})+pl([[630,118],[700,76],[712,96],[642,138]],{z:1,f:GRIS})+tx(724,96,'électrode',{a:'s',s:20})
  c+=thermo(280,191)+tx(280,104,'T entre passes : ?',{c:ROUGE,b:1})
  c+=S.soudure(556,248,640,330,{type:'recharge',L:130})
  c+=tx(300,392,'dent de godet, acier à 12-14 % de manganèse',{s:19})
  D.e17_manganese=page(900,430,'Dent au manganèse en cours de rechargement',c,'Vue ISO 128, symbole ISO 2553','Dent de godet au manganèse rechargée à l électrode, thermomètre de contact sur la dent')
})()

// Prechauffage de la piece a recharger
;(function(){
  let c=re(200,260,440,130,{f:H})
  c+=pl([[90,150],[226,212],[220,226],[84,164]],{z:1,f:PALE})+pa('M 224 220 Q 262 224 284 256 Q 250 252 224 220 Z',{f:HR})
  c+=thermo(480,260)+tx(516,210,'thermomètre de contact',{a:'s',s:19})
  c+=cote(640,260,640,390,'épaisseur e',{dec:-56})
  c+=tx(120,136,'chalumeau',{s:20})+tx(420,428,'pièce à recharger, en coupe',{s:19})
  c+=tx(450,462,'Quelle température, et quand la contrôler ?',{c:BLEU})
  D.e17_prechauffage=page(900,490,'Préchauffage de la pièce',c,'Coupe ISO 128, cotes ISO 129','Pièce épaisse chauffée au chalumeau, thermomètre de contact, épaisseur e')
})()

// Coupe d'un rechargement : couches, zone affectee, fissures sous cordon
;(function(){
  let c=re(150,300,600,140,{f:H})+pa('M 222 300 Q 450 392 678 300',{d:'c',c:BLEU,w:2.4})
  c+=pa('M 250 300 Q 450 216 650 300 Z',{f:HB})+pa('M 232 300 Q 450 176 668 300 L 650 300 Q 450 216 250 300 Z',{f:HR})
  c+=S.fissure(380,306,8,22)+S.fissure(520,306,-8,22)
  c+=rep(470,249,620,176,'couche dure')+rep(420,282,280,176,'reconstitution',{a:'m'})+rep(730,400,790,254,'métal de base',{a:'m'})
  c+=rep(610,322,640,462,'zone affectée thermiquement',{a:'m',c:BLEU})+rep(384,320,260,462,'fissures sous cordon',{a:'m',c:ROUGE})
  D.e17_sous_cordon=page(900,520,'Coupe d’un rechargement',c,'Coupe ISO 128','Coupe d un rechargement : métal de base, reconstitution, couche dure, zone affectée, fissures sous cordon')
})()

// Lame de niveleuse dans le sable
;(function(){
  let c=pa('M 430 110 Q 330 230 400 356 L 420 346 Q 356 232 448 122 Z',{f:H})+pl([[396,350],[424,338],[444,392],[416,404]],{z:1,f:H2})
  c+=ln(120,404,800,404,{w:3.2})
  for(let x=140;x<=790;x+=28) c+=ln(x,404,x-12,418,{w:1.4})
  for(let i=0;i<46;i++){const x=452+(i*53%330),h=Math.max(8,74-(x-452)*0.22);c+=ci(x,398-(i*29%h),3.4,{f:GRIS,w:1})}
  c+=fl(770,300,520,300,{c:BLEU,w:2.6})+tx(645,284,'sable, terre',{c:BLEU,s:20})
  c+=rep(388,220,250,180,'lame de niveleuse')+rep(412,384,300,440,'arête d’usure',{a:'m'})
  c+=tx(640,456,'Usure dans le sable, sans gros chocs',{c:BLEU,s:19})
  D.e17_usure=page(900,500,'Lame de niveleuse',c,'Coupe ISO 128','Lame de niveleuse en coupe, qui pousse du sable')
})()

module.exports=D
