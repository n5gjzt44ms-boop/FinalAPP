// Schemas hydrauliques (lots 3 et 4) : symboles ISO 1219-1, coupes ISO 128.
// Chaque entree de D porte le nom du fichier dans illustrations/.
'use strict'
const S=require('./symboles')
const {N,ROUGE,BLEU,BLEU2,GRIS,HUILE,PALE,pl,ln,ci,re,pa,tx,fl,flArc,axe,croix,cote,rep,page,H,H2,HX}=S
const ISO='Symboles ISO 1219-1'
const D={}

// Accumulateur a vessie en coupe. Dessine couche : la position de montage est une question.
;(function(){
  let c=pa(S.dRR(190,165,520,170,85)+' '+S.dRR(206,181,488,138,69),{f:H,eo:1})
  c+=pa(S.dRR(206,181,488,138,69),{f:HUILE,w:2})
  c+=pa(S.dRR(216,196,372,108,54),{f:'#fff',w:5})
  // valve de gaz a gauche, clapet d'huile et orifice a droite
  c+=re(150,238,62,24,{f:'#fff'})+re(136,231,16,38,{f:GRIS})
  c+=re(692,224,66,52,{f:'#fff'})+ln(692,240,758,240,{w:1.4})+ln(692,260,758,260,{w:1.4})
  c+=ln(646,250,700,250,{w:4})+ln(646,222,646,278,{w:8})+S.ressort(652,250,692,250,{n:3,h:9})
  c+=axe(100,250,800,250)
  c+=tx(402,238,'vessie remplie de gaz',{s:21})
  c+=rep(166,238,166,128,'valve de gaz',{a:'m'})
  c+=rep(430,173,430,128,'enveloppe en acier',{a:'m'})
  c+=rep(646,224,690,128,'clapet d’huile',{a:'m'})
  c+=rep(330,304,330,376,'vessie (élastomère)',{a:'m'})
  c+=rep(612,300,560,376,'huile',{a:'m'})
  c+=rep(740,276,740,376,'orifice d’huile',{a:'m'})
  c+=tx(450,440,'Vue couchée : la position de montage n’est pas montrée.',{s:19,c:BLEU})
  D.e12_accumulateur=page(900,470,'Accumulateur à vessie, vue en coupe',c,'Coupe : hachures ISO 128','Accumulateur à vessie en coupe : enveloppe, vessie, valve de gaz, clapet d huile')
})()

// Deux valves d'equilibrage : 3 orifices (CBCG) et 4 orifices (CWGA)
;(function(){
  let c=''
  const a=S.equilibrage(215,255),b=S.equilibrage(660,255,{vent:1})
  ;[a,b].forEach(function(v){
    c+=v.s+ln(v.p1[0],v.p1[1]-30,v.p1[0],v.p1[1])+ln(v.p2[0],v.p2[1],v.p2[0],v.p2[1]+30)+S.pilote([[v.p3[0]-30,v.p3[1]],v.p3])
    c+=tx(v.p1[0]+14,v.p1[1]-10,'1',{b:1,a:'s'})+tx(v.p2[0]+14,v.p2[1]+26,'2',{b:1,a:'s'})+tx(v.p3[0]-38,v.p3[1]+8,'3',{b:1,a:'e'})
  })
  c+=S.pilote([b.p4,[b.p4[0]+26,b.p4[1]]])+tx(b.p4[0]+32,b.p4[1]+8,'4',{b:1,a:'s'})
  c+=tx((a.g+a.d)/2,425,'CBCG : 3 orifices',{b:1})+tx((b.g+b.d)/2,425,'CWGA : 4 orifices',{b:1})
  c+=tx(450,470,'1 : charge — 2 : distributeur, puis retour au réservoir — 3 : pilotage',{s:19})
  c+=tx(450,500,'Trait continu : conduite de travail. Trait interrompu : pilotage ou drain.',{s:18,c:BLEU})
  D.e12_contrepression=page(900,540,'Valves d’équilibrage à 3 et à 4 orifices',c,ISO,'Symboles de deux valves d équilibrage, à trois et à quatre orifices')
})()

// Valve d'equilibrage sur un verin de fleche
;(function(){
  let c=''
  const v=S.verinV(120,120,{h:160,tige:60}),e=S.equilibrage(430,370),d=S.distributeur43(359,510)
  c+=re(96,34,108,26,{f:GRIS})+tx(214,54,'charge',{a:'s'})+v.s+tx(110,206,'vérin',{a:'e'})+tx(110,232,'de flèche',{a:'e'})
  c+=e.s+d.s
  c+=pl([v.fond,[430,v.fond[1]],e.p1])                       // fond du verin vers l'orifice 1
  c+=pl([e.p2,d.A])                                           // orifice 2 vers le distributeur
  c+=pl([d.B,[d.B[0],484],[840,484],[840,v.tige[1]],v.tige]) // cote tige
  c+=S.pilote([e.p3,[270,e.p3[1]],[270,v.tige[1]]])+S.noeud(270,v.tige[1])
  c+=ln(d.P[0],d.P[1],d.P[0],d.P[1]+30)+ln(d.T[0],d.T[1],d.T[0],d.T[1]+30)
  c+=tx(444,278,'1',{b:1,a:'s'})+tx(418,478,'2',{b:1,a:'e'})+tx(312,374,'3',{b:1,a:'e'})
  c+=tx(418,504,'A',{a:'e',s:19})+tx(468,504,'B',{a:'s',s:19})+tx(418,596,'P',{a:'e',s:19})+tx(468,596,'T',{a:'s',s:19})
  c+=tx(604,330,'valve',{a:'s'})+tx(604,356,'d’équilibrage',{a:'s'})+tx(578,546,'distributeur',{a:'s'})
  c='<g transform="translate(0,44)">'+c+'</g>'
  D.e12_equilibrage=page(900,690,'Valve d’équilibrage sur un vérin de flèche',c,ISO,'Circuit : vérin de flèche, valve d équilibrage à trois orifices, distributeur')
})()

// Vis de reglage d'une cartouche : vue exterieure et symbole
;(function(){
  let c=axe(170,74,170,474)
  c+=re(158,104,24,46,{f:PALE})                                                           // vis
  c+=re(142,150,56,22,{f:PALE})+ln(156,150,156,172,{w:1.4})+ln(184,150,184,172,{w:1.4})   // contre-ecrou
  c+=re(116,172,108,62,{f:PALE})+ln(143,172,143,234,{w:1.4})+ln(197,172,197,234,{w:1.4}) // six pans
  c+=re(108,234,124,12,{f:PALE})
  c+=re(126,246,88,50,{f:PALE})+ln(133,246,133,296,{w:1.2})+ln(207,246,207,296,{w:1.2}) // filetage
  c+=re(134,296,72,58,{f:PALE})+re(134,300,72,7,{f:N,w:1})+ci(170,330,7,{f:'#fff',w:2})
  c+=re(142,354,56,54,{f:PALE})+re(142,358,56,7,{f:N,w:1})+ci(170,386,7,{f:'#fff',w:2})
  c+=re(150,408,40,36,{f:PALE})+re(150,412,40,7,{f:N,w:1})
  c+=flArc(170,104,36,205,335,{c:ROUGE})+tx(222,88,'sens horaire : ?',{a:'s',c:ROUGE,b:1})
  c+=rep(180,128,262,138,'vis de réglage')+rep(196,161,262,172,'contre-écrou')+rep(222,204,262,206,'corps de la cartouche')
  c+=rep(206,330,262,330,'3',{b:1})+rep(198,386,262,386,'2',{b:1})+tx(170,470,'1',{b:1})
  const e=S.equilibrage(700,300)
  c+=e.s+ln(e.p1[0],e.p1[1]-26,e.p1[0],e.p1[1])+ln(e.p2[0],e.p2[1],e.p2[0],e.p2[1]+26)+S.pilote([[e.p3[0]-26,e.p3[1]],e.p3])
  c+=tx(e.p1[0]+14,e.p1[1]-8,'1',{b:1,a:'s'})+tx(e.p2[0]+14,e.p2[1]+24,'2',{b:1,a:'s'})+tx(e.p3[0]-10,e.p3[1]-10,'3',{b:1,a:'e'})
  c+=tx(725,446,'flèche oblique : ressort réglable',{s:19})
  c+=tx(450,500,'Que devient le réglage ? Que devient la charge ?',{c:BLEU})
  D.e12_reglage=page(900,530,'Vis de réglage d’une cartouche',c,ISO,'Cartouche vue de l extérieur avec sa vis de réglage, et symbole de la valve')
})()

// Conduites de la pompe : aspiration, refoulement, retour
;(function(){
  let c=''
  const r1=S.reservoir(220,490,{w:150,h:50}),f=S.filtre(220,430,{t:24}),p=S.pompe(220,300),m=S.moteurE(356,300),v=S.mano(118,372)
  const d=S.distributeur43(429,110),r2=S.reservoir(d.T[0],490,{w:110,h:50})
  c+=r1.s+ln(220,524,220,454)+f.s+ln(220,406,220,334)+p.s+m.s+S.arbre(254,300,326,300)+S.accoupl(290,300)
  c+=ln(220,372,140,372)+S.noeud(220,372)+v.s
  c+=pl([p.out,[220,200],[d.P[0],200],d.P])+d.s+r2.s+pl([d.T,[d.T[0],524]])
  c+=ln(d.A[0],d.A[1],d.A[0],d.A[1]-28)+ln(d.B[0],d.B[1],d.B[0],d.B[1]-28)
  c+=tx(d.A[0]-8,90,'A',{a:'e',s:19})+tx(d.B[0]+8,90,'B',{a:'s',s:19})+tx(d.P[0]-10,190,'P',{a:'e',s:19})+tx(d.T[0]+10,190,'T',{a:'s',s:19})
  c+=tx(640,146,'distributeur',{a:'s'})+tx(360,188,'refoulement',{c:ROUGE})
  c+=rep(220,350,270,400,'aspiration : Ø intérieur d',{c:BLEU})+tx(118,420,'vacuomètre',{s:19})
  c+=tx(250,444,'crépine',{a:'s',s:19})+tx(220,566,'réservoir',{s:19})+tx(d.T[0]+14,360,'retour',{a:'s',c:BLEU})
  c+=tx(356,352,'moteur',{s:19})+tx(178,292,'pompe',{a:'e',s:19})
  D.e16_conduites=page(900,600,'Conduites de la pompe',c,ISO,'Circuit : réservoir, crépine, vacuomètre, pompe, distributeur, retour')
})()

// Deux facons d'entrainer la pompe
;(function(){
  let c=ln(450,80,450,470,{w:1.4,c:'#999'})
  c+=tx(225,98,'Accouplement élastique',{b:1})+tx(675,98,'Poulie et courroie',{b:1})
  // a gauche : moteur, accouplement, pompe sur le meme axe
  const m=S.moteurE(90,250),p=S.pompe(350,250)
  c+=axe(40,250,410,250)+m.s+p.s+S.arbre(120,250,316,250)+S.accoupl(218,250,{h:20})
  c+=ln(350,216,350,186)+ln(350,284,350,314)
  c+=tx(90,310,'moteur',{s:19})+tx(350,346,'pompe',{s:19})+rep(218,232,218,176,'accouplement',{a:'m'})
  c+=tx(225,420,'arbres alignés',{s:19,c:BLEU})
  // a droite : schema cinematique, poulies vues sur la tranche
  const p2=S.pompe(540,190,{r:30}),m2=S.moteurE(540,390)
  c+=axe(490,190,790,190)+axe(490,390,790,390)
  c+=p2.s+ln(540,160,540,134)+ln(540,220,540,246)+m2.s
  c+=ln(570,190,716,190,{w:5})+ln(570,390,716,390,{w:5})
  c+=re(697,190,26,200,{f:GRIS,w:2})+re(692,150,36,80,{f:'#fff'})+re(692,330,36,120,{f:'#fff'})
  c+=S.typeLien(668,290,'V')+tx(540,268,'pompe',{s:19})+tx(540,448,'moteur',{s:19})
  c+=fl(760,190,760,268,{c:ROUGE,w:3.2,t:16})+tx(774,222,'F',{a:'s',c:ROUGE,b:1,s:24})
  c+=tx(675,480,'F : effort radial sur l’arbre de la pompe',{s:19,c:ROUGE})
  D.e16_entrainement=page(900,530,'Deux façons d’entraîner la pompe',c,'Symboles ISO 1219-1 et ISO 3952','Pompe entraînée par accouplement élastique ou par poulie et courroie')
})()

// Proprete du circuit : pompe, filtre, appoint d'huile
;(function(){
  let c=''
  const r=S.reservoir(330,410,{w:260,h:70}),p=S.pompe(330,290),m=S.moteurE(196,290),f=S.filtre(520,180,{t:28,vertical:false})
  c+=r.s+ln(330,464,330,324)+p.s+m.s+S.arbre(226,290,296,290)+S.accoupl(261,290)
  c+=pl([p.out,[330,180],f.g])+f.s+fl(548,180,760,180,{w:3.2,t:16})
  c+=tx(520,238,'filtre βx',{s:20})+tx(770,186,'vers le',{a:'s',s:19})+tx(770,210,'circuit',{a:'s',s:19})
  c+=tx(640,160,'classe ISO 4406 : ?',{c:ROUGE,b:1})
  c+=tx(330,512,'réservoir',{s:19})+tx(376,298,'pompe',{a:'s',s:19})
  // bidon d'appoint
  c+=pl([[560,330],[640,330],[640,300],[668,300],[668,330],[700,330],[700,430],[560,430]],{z:1,f:PALE})+re(646,288,16,12,{f:N,w:1})
  c+=tx(630,392,'huile',{s:19})+tx(630,416,'neuve',{s:19})
  c+=fl(556,372,470,410,{d:'p',c:ROUGE})+tx(630,462,'appoint : ?',{c:ROUGE,b:1})
  D.e16_filtration=page(900,540,'Propreté du circuit',c,ISO,'Circuit : réservoir, pompe, filtre, et bidon d huile neuve pour l appoint')
})()

// Mise en service : pompe, limiteur de pression, manometre
;(function(){
  let c=''
  const r1=S.reservoir(220,450,{w:150,h:50}),p=S.pompe(220,330),m=S.moteurE(356,330),l=S.limiteur(540,300),v=S.mano(400,120)
  const r2=S.reservoir(540,450,{w:110,h:50})
  c+=r1.s+ln(220,484,220,364)+p.s+m.s+S.arbre(254,330,326,330)+S.accoupl(290,330)
  c+=pl([p.out,[220,190],[700,190]])+fl(700,190,780,190,{w:3.2,t:16})+tx(740,172,'vers le circuit',{s:19})
  c+=S.noeud(400,190)+ln(400,190,400,142)+v.s+S.noeud(540,190)+ln(540,190,l.in[0],l.in[1])+l.s+ln(l.out[0],l.out[1],540,484)+r2.s
  c+=tx(176,322,'pompe',{a:'e',s:19})+tx(176,346,'neuve',{a:'e',s:19})+tx(356,382,'moteur',{s:19})+tx(220,524,'réservoir',{s:19})
  c+=tx(640,300,'limiteur de pression :',{a:'s',c:ROUGE,b:1})+tx(640,328,'quel réglage ?',{a:'s',c:ROUGE,b:1})+tx(436,112,'manomètre',{a:'s',s:19})
  D.e16_installation=page(900,560,'Mise en service de la pompe',c,ISO,'Circuit : réservoir, pompe neuve, manomètre, limiteur de pression')
})()

// Pompe a engrenages exterieurs : coupe et symbole
;(function(){
  // contour d'un pignon : z dents, rayon de pied rf, rayon de tete ra, dephasage
  function pignon(cx,cy,z,rf,ra,ph){const p=[]
    for(let i=0;i<z;i++){const a=ph+i*2*Math.PI/z,q=2*Math.PI/z
      ;[[rf,-0.25],[ra,-0.11],[ra,0.11],[rf,0.25]].forEach(function(k){p.push([cx+k[0]*Math.cos(a+k[1]*q),cy+k[0]*Math.sin(a+k[1]*q)])})}
    return pl(p,{z:1,f:PALE,w:2.4})
  }
  let c=re(210,110,240,348,{rx:26,f:H})
  c+=ci(330,222,74,{f:'#fff'})+ci(330,346,74,{f:'#fff'})
  c+=re(206,264,90,40,{f:'#fff',c:'#fff',w:1})+re(364,264,90,40,{f:'#fff',c:'#fff',w:1})
  c+=ln(210,264,270,264)+ln(210,304,270,304)+ln(390,264,450,264)+ln(390,304,450,304)
  c+=pignon(330,222,10,50,70,Math.PI/2)+pignon(330,346,10,50,70,-Math.PI/2+Math.PI/10)
  c+=ci(330,222,16,{f:GRIS})+ci(330,346,12,{f:GRIS})+croix(330,222,24)+croix(330,346,22)
  c+=flArc(330,222,34,200,330,{w:2.2})+flArc(330,346,34,160,30,{w:2.2})
  c+=fl(110,284,236,284,{c:BLEU,w:3.2,t:16})+tx(150,266,'aspiration',{c:BLEU})
  c+=fl(424,284,540,284,{c:ROUGE,w:3.2,t:16})+tx(500,266,'refoulement',{c:ROUGE,a:'s'})
  c+=rep(342,214,480,150,'arbre d’entraînement')+rep(330,414,480,440,'pignon mené')+rep(232,130,150,150,'corps')
  // symbole et grandeurs
  const p=S.pompe(730,260,{r:36})
  c+=p.s+ln(730,224,730,196)+ln(730,296,730,324)+S.arbre(766,260,840,260)+flArc(808,260,22,200,340,{w:2,t:11})
  c+=tx(730,356,'symbole',{s:19})
  c+=tx(640,416,'n : vitesse (tr/min)',{a:'s',s:20})+tx(640,446,'V : cylindrée (cm³/tr)',{a:'s',s:20})+tx(640,476,'Δp = p refoulement − p aspiration',{a:'s',s:17})
  D.e16_pompe=page(900,520,'Pompe à engrenages extérieurs',c,'Coupe ISO 128, symbole ISO 1219-1','Pompe à engrenages extérieurs en coupe et son symbole')
})()

// Pompe vue de face : de quel cote est l'aspiration ?
;(function(){
  let c=re(300,110,300,330,{rx:30,f:PALE})
  ;[[340,150],[560,150],[340,400],[560,400]].forEach(function(q){c+=ci(q[0],q[1],13,{f:'#fff',w:2.4})+croix(q[0],q[1],22)})
  c+=axe(450,90,450,460)+axe(280,200,620,200)+axe(280,330,620,330)
  c+=ci(450,200,30,{f:'#fff'})+re(444,166,12,12,{f:N,w:1})+ci(450,330,30,{d:'c',w:1.8})
  c+=ln(300,246,360,246,{d:'c',w:1.8})+ln(300,284,360,284,{d:'c',w:1.8})+ln(540,246,600,246,{d:'c',w:1.8})+ln(540,284,600,284,{d:'c',w:1.8})
  c+=re(410,392,80,34,{f:'#fff',w:2})+tx(450,417,'D',{b:1,s:24})
  c+=rep(470,184,640,140,'arbre (vers toi)')+rep(470,409,640,440,'repère de la plaque')
  c+=fl(196,265,292,265,{deux:1,c:BLEU})+fl(608,265,704,265,{deux:1,c:BLEU})
  c+=tx(150,256,'orifice 1',{b:1})+tx(150,284,'à gauche',{s:19})+tx(752,256,'orifice 2',{b:1})+tx(752,284,'à droite',{s:19})
  c+=tx(450,486,'De quel côté est l’aspiration ?',{c:ROUGE,b:1})
  D.e16_rotation=page(900,530,'Pompe vue de face, côté arbre',c,'Vue de face ISO 128','Pompe vue de face, arbre en haut, un orifice de chaque côté, repère D')
})()

module.exports=D
