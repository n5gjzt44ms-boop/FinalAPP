// Schemas de transmissions (lots 3 et 4) : courroies et chaines.
// Dessin ISO 128 (axes en trait mixte, coupes hachurees, cotes ISO 129), roues dentees en
// representation conventionnelle (cercle primitif en trait mixte), schema cinematique ISO 3952.
'use strict'
const S=require('./symboles')
const {N,ROUGE,BLEU,GRIS,HUILE,PALE,pl,ln,ci,re,pa,tx,fl,axe,croix,cote,rep,page,H,H2,HS,HX}=S
const ISO='Dessin ISO 128'
const CHAINE='22 6 5 6'   // chaine : trait mixte fort
const D={}

// Alignement des poulies : vue de dessus, regle sur les faces
;(function(){
  let c=axe(210,96,210,416)+axe(660,96,660,416)
  c+=re(198,112,24,120,{f:'#fff',w:2.4})+re(648,98,24,120,{f:'#fff',w:2.4})
  c+=re(120,230,180,40,{f:PALE})+re(600,216,120,40,{f:PALE})
  c+=pl([[120,243],[720,229],[720,243],[120,257]],{z:1,f:GRIS,w:2})
  c+=re(96,270,684,12,{f:'#fff'})
  c+=ln(724,256,816,256,{w:1.4})+ln(784,270,816,270,{w:1.4})
  c+=fl(804,222,804,256,{c:ROUGE,t:12,w:1.6})+fl(804,304,804,270,{c:ROUGE,t:12,w:1.6})+tx(804,210,'écart ?',{c:ROUGE,b:1})
  c+=cote(210,416,660,416,'entraxe C = 1 500 mm')
  c+=rep(500,278,520,330,'règle',{a:'m'})+rep(430,244,430,180,'courroie',{a:'m'})+tx(120,216,'poulie',{a:'s',s:20})+tx(676,306,'poulie',{a:'s',s:20})
  D.e11_alignement=page(900,460,'Alignement des poulies, vue de dessus',c,ISO,'Deux poulies vues de dessus, une règle posée sur leurs faces, écart à mesurer')
})()

// Arbre moteur plie apres le remontage des courroies
;(function(){
  let c=axe(60,250,800,250)
  c+=re(90,160,240,180,{f:PALE,rx:8})+re(110,340,50,16,{f:GRIS})+re(260,340,50,16,{f:GRIS})+tx(210,254,'M',{s:40,b:1})+tx(210,290,'3 ~',{s:22})
  c+=re(330,214,24,72,{f:'#fff'})
  c+=re(354,238,280,24,{d:'mm',w:1.4})+re(540,170,80,160,{d:'mm',w:1.4})
  c+='<g transform="rotate(7 354 250)">'+re(354,238,290,24,{f:'#fff'})
    +pl([[540,170],[548,170],[560,196],[572,170],[588,170],[600,196],[612,170],[620,170],[620,238],[540,238]],{z:1,f:H})
    +pl([[540,330],[548,330],[560,304],[572,330],[588,330],[600,304],[612,330],[620,330],[620,262],[540,262]],{z:1,f:H})
    +ln(354,250,700,250,{d:'m',w:1.5,c:ROUGE})+'</g>'
  c+=fl(572,376,572,440,{c:ROUGE,w:3.2,t:16})+tx(592,420,'tension des courroies : ?',{a:'s',c:ROUGE,b:1})
  c+=rep(342,214,342,130,'palier',{a:'m'})+rep(640,206,720,150,'poulie (en coupe)')+rep(470,278,420,400,'arbre plié',{a:'m',c:ROUGE})
  c+=tx(210,146,'moteur',{s:20})+tx(450,470,'Trait mixte à deux tirets : position d’origine',{s:18,c:BLEU})
  D.e11_arbre=page(900,490,'Arbre moteur plié après remontage',c,ISO,'Moteur dont l arbre a plié sous la tension des courroies, poulie en coupe')
})()

// Controle de la tension au milieu du brin
;(function(){
  const x1=190,y1=290,r1=80,x2=700,y2=290,r2=60,h=S.tangentes(x1,y1,r1,x2,y2,r2)[0]
  const mx=(h[0][0]+h[1][0])/2,my=(h[0][1]+h[1][1])/2,f=30
  let c=S.poulie(x1,y1,r1-4)+S.poulie(x2,y2,r2-4)+S.lien(x1,y1,r1,x2,y2,r2,{w:7,ph:[mx,my+f]})
  c+=ln(h[0][0],h[0][1],h[1][0],h[1][1],{d:'mm',w:1.4})
  c+=fl(mx,my-74,mx,my+f-5,{c:ROUGE,w:3.2,t:16})+tx(mx+14,my-50,'force lue : ?',{a:'s',c:ROUGE,b:1})
  c+=ln(mx+8,my+f,mx+108,my+f,{w:1.4})+cote(mx+96,my+1,mx+96,my+f,'')+rep(mx+96,my+f/2,mx+60,my+f+58,'flèche : ?',{a:'m',ct:ROUGE,b:1})
  c+=cote(h[0][0],h[0][1],h[1][0],h[1][1],'longueur du brin',{dec:-104})
  c+=tx(450,450,'On enfonce la courroie au milieu du brin et on lit la force.',{c:BLEU,s:19})
  D.e11_fleche=page(900,480,'Contrôle de la tension au milieu du brin',c,ISO,'Courroie enfoncée au milieu du brin : flèche et force à lire')
})()

// Longueur de courroie a commander
;(function(){
  const x1=240,y1=270,r1=100,x2=650,y2=270,r2=44
  let c=S.poulie(x1,y1,r1-4)+S.poulie(x2,y2,r2-4)+S.lien(x1,y1,r1,x2,y2,r2,{w:7})
  c+=cote(x1,y1+r1,x1,y1-r1,'D = 315',{dec:-(r1+44)})+cote(x2,y2-r2,x2,y2+r2,'d = 140',{dec:-(r2+50)})
  c+=cote(x1,y1,x2,y2,'C = 600',{dec:150})
  c+=tx(445,150,'L = ?',{c:ROUGE,b:1,s:28})+S.typeLien(540,184,'V')
  c+=tx(450,466,'D et d : diamètres primitifs, en millimètres',{s:19,c:BLEU})
  D.e11_longueur=page(900,490,'Longueur de courroie à commander',c,'Dessin ISO 128, cotes ISO 129','Deux poulies de 315 et 140 mm, entraxe 600 mm : longueur de courroie à calculer')
})()

// Courroie synchrone : diametre primitif
;(function(){
  const x1=230,y1=270,p1=86,x2=650,y2=270,p2=56
  let c=S.roue(x1,y1,p1)+S.roue(x2,y2,p2)+S.lien(x1,y1,p1+10,x2,y2,p2+10,{w:6})
  c+=S.typeLien(440,158,'cran')+tx(470,166,'pas : 8 mm',{a:'s',s:20})
  c+=rep(x1-p1*0.707,y1-p1*0.707,120,130,'Ø primitif : ?',{a:'m',ct:ROUGE,b:1})
  c+=tx(x1+74,y1+p1+42,'34 dents',{a:'s'})+tx(x2+p2+26,y2+60,'22 dents',{a:'s'})
  c+=cote(x1,y1,x2,y2,'C = 400 mm',{dec:170})
  c+=tx(450,480,'Trait mixte : cercle primitif',{s:18,c:BLEU})
  D.e11_synchrone=page(900,500,'Transmission par courroie synchrone',c,ISO,'Deux poulies crantées de 34 et 22 dents, courroie au pas de 8 mm')
})()

// Transmission par courroies trapezoidales : schema cinematique
;(function(){
  const m=S.moteurE(120,180,{r:34}),p=S.pompe(790,420,{r:34})
  let c=axe(60,180,560,180)+axe(290,420,860,420)
  c+=m.s+ln(154,180,430,180,{w:6})+ln(360,420,756,420,{w:6})+p.s+ln(790,386,790,356)+ln(790,454,790,484)
  c+=S.palier(550,420)+S.palier(680,420)
  c+=re(404,180,52,240,{f:GRIS,w:2})+ln(417,180,417,420,{w:1.4})+ln(430,180,430,420,{w:1.4})+ln(443,180,443,420,{w:1.4})
  c+=re(396,140,68,80,{f:'#fff'})+re(396,330,68,180,{f:'#fff'})+re(386,400,88,40,{f:PALE,w:2.4})
  c+=S.enveloppe(350,110,160,430)
  c+=S.typeLien(290,300,'V')+ln(306,300,404,300,{w:1.4})+tx(290,338,'× 4',{s:20})
  c+=tx(120,244,'moteur',{s:20})+tx(790,516,'pompe de lavage',{s:20})
  c+=rep(464,160,560,130,'poulie motrice')+rep(464,490,560,516,'poulie menée')+rep(474,410,560,366,'moyeu conique')
  c+=rep(510,250,590,250,'carter')+rep(550,436,604,474,'paliers')+ln(680,436,672,462,{w:1.4})+ci(680,436,3,{f:N,w:0.5})
  D.e11_transmission=page(900,570,'Transmission par courroies trapézoïdales',c,'Schéma cinématique ISO 3952','Schéma cinématique : moteur, poulie motrice, quatre courroies, poulie menée sur moyeu conique, paliers, pompe')
})()

// Courroie trapezoidale dans sa gorge, en coupe
;(function(){
  let c=pl([[250,200],[360,200],[410,380],[490,380],[540,200],[650,200],[650,420],[250,420]],{z:1,f:H})
  c+=pl([[354.4,180],[545.6,180],[503.9,330],[396.1,330]],{z:1,f:HX})
  for(let x=386;x<=514;x+=16) c+=ci(x,214,5,{f:N,w:0.5})
  c+=axe(450,140,450,450)
  c+=rep(500,182,650,140,'dessus')+rep(526,250,690,260,'flancs')
  c+=rep(450,328,690,330,'dessous')+rep(300,400,190,452,'gorge de la poulie',{a:'m'})+rep(402,214,300,160,'câbles de traction',{a:'m'})
  c+=tx(620,480,'Quel symptôme, quelle cause ?',{c:BLEU})
  D.e11_usure=page(900,510,'Courroie trapézoïdale dans sa gorge',c,'Coupe ISO 128','Coupe d une courroie trapézoïdale dans la gorge de la poulie : dessus, flancs, dessous')
})()

// Controles avant de poser la chaine : regle sur les pignons, niveau sur l'arbre
;(function(){
  let c=tx(450,88,'Vue de dessus',{b:1,s:20})+axe(220,104,220,300)+axe(650,104,650,300)
  c+=re(208,114,24,150,{f:'#fff',w:2.4})+re(638,104,24,150,{f:'#fff',w:2.4})
  c+=re(150,176,140,20,{f:PALE})+re(600,162,100,20,{f:PALE})+ln(220,186,650,172,{d:CHAINE,w:3})
  c+=re(110,196,670,10,{f:'#fff'})
  c+=ln(704,182,822,182,{w:1.4})+ln(784,196,822,196,{w:1.4})
  c+=fl(810,150,810,182,{c:ROUGE,t:12,w:1.6})+fl(810,228,810,196,{c:ROUGE,t:12,w:1.6})+tx(810,138,'écart ?',{c:ROUGE,b:1})
  c+=cote(220,300,650,300,'entraxe')+rep(420,202,420,236,'règle',{a:'m'})+tx(142,190,'pignon',{a:'e',s:19})+tx(708,160,'pignon',{a:'s',s:19})
  c+=tx(450,356,'Vue de face : niveau posé sur l’arbre',{b:1,s:20})
  c+=pl([[170,478],[730,446],[730,470],[170,502]],{z:1,f:PALE})
  c+='<g transform="rotate(-3.27 450 462)">'+re(350,438,200,24,{f:'#fff'})+re(430,444,40,12,{f:HUILE,w:1.6})+ci(446,450,4,{f:'#fff',w:1.4})+'</g>'
  c+=ln(170,478,830,478,{d:'mm',w:1.4})+ln(734,446,830,446,{w:1.4})+cote(812,478,812,446,'h ?',{ct:ROUGE,b:1,h:1})
  c+=cote(170,502,730,470,'longueur L',{dec:40})+tx(300,440,'niveau',{s:19})
  D.e15_alignement=page(900,590,'Contrôles avant de poser la chaîne',c,ISO,'Règle posée sur les deux pignons vus de dessus, et niveau posé sur l arbre')
})()

// Articulation de la chaine : coupes
;(function(){
  let c=ci(190,290,56,{f:HS})+ci(190,290,36,{f:H2})+ci(190,290,22,{f:H})+croix(190,290,78)
  c+=rep(226,255,270,170,'rouleau',{a:'m'})+rep(164,278,96,170,'douille',{a:'m'})+rep(190,302,150,412,'axe',{a:'m'})
  c+=re(470,276,260,28,{f:H})+re(510,262,180,14,{f:H2})+re(510,304,180,14,{f:H2})
  c+=re(530,240,140,22,{f:HS})+re(530,318,140,22,{f:HS})
  ;[510,674].forEach(function(x){c+=re(x,196,16,66,{f:H})+re(x,318,16,66,{f:H})})
  ;[484,700].forEach(function(x){c+=re(x,196,16,80,{f:H2})+re(x,304,16,80,{f:H2})})
  c+=axe(440,290,770,290)+axe(600,176,600,404)
  c+=rep(492,204,440,140,'plaque extérieure',{a:'m'})+rep(682,204,730,140,'plaque intérieure',{a:'m'})
  c+=rep(724,284,790,240,'axe')+rep(560,330,500,430,'rouleau',{a:'m'})+rep(640,311,650,430,'douille',{a:'m'})
  c+=tx(190,490,'coupe en travers',{s:19})+tx(600,490,'coupe le long de l’axe',{s:19})
  D.e15_axe=page(900,520,'Articulation de la chaîne',c,'Coupes ISO 128','Coupes d une articulation de chaîne : axe, douille, rouleau, plaques intérieures et extérieures')
})()

// Transmission par chaine : entraxe, pas, nombre de dents
;(function(){
  const x1=220,y1=280,p1=46,x2=650,y2=280,p2=90
  let c=S.roue(x1,y1,p1)+S.roue(x2,y2,p2)+S.lien(x1,y1,p1,x2,y2,p2,{d:CHAINE,w:3.4})
  c+=S.typeLien(420,176,'chaine')+tx(448,184,'pas p',{a:'s',s:20})+S.flArc(x1,y1,p1+28,190,260)
  c+=tx(x1,y1+p1+56,'pignon menant',{s:20})+tx(x1,y1+p1+82,'Z dents',{s:20})+tx(x2,y2+p2+50,'roue menée',{s:20})
  c+=cote(x1,y1,x2,y2,'entraxe C',{dec:-160})
  c+=tx(450,470,'Trait mixte : cercle primitif et chaîne',{s:18,c:BLEU})
  D.e15_entraxe=page(900,490,'Transmission par chaîne',c,ISO,'Pignon menant et roue menée reliés par une chaîne : entraxe, pas, nombre de dents')
})()

// Fleche du brin mou
;(function(){
  const x1=200,x2=700,y=230,r=60
  let c=S.roue(x1,y,r)+S.roue(x2,y,r)+S.lien(x1,y,r,x2,y,r,{d:CHAINE,w:3.4,fb:26})
  c+=ln(x1,y+r,x2,y+r,{d:'mm',w:1.4})
  ;[[x1,y+r],[x2,y+r],[450,y+r],[450,y+r+26]].forEach(function(q){c+=ci(q[0],q[1],5,{f:N,w:0.5})})
  c+=tx(x1-12,y+r+30,'A',{b:1,a:'e'})+tx(x2+12,y+r+30,'B',{b:1,a:'s'})+tx(462,y+r-8,'S',{a:'s',s:20})+tx(462,y+r+48,'S’',{a:'s',s:20})
  c+=fl(420,y+r-30,420,y+r,{c:ROUGE,t:12,w:1.6})+fl(420,y+r+56,420,y+r+26,{c:ROUGE,t:12,w:1.6})+tx(408,y+r+54,'flèche SS’ : ?',{a:'e',c:ROUGE,b:1})
  c+=cote(x1,y+r,x2,y+r,'portée AB',{dec:120})
  c+=tx(450,y-r-16,'brin tendu',{s:20})+tx(600,y+r+44,'brin mou',{s:20})+tx(x1,y-r-34,'pignon menant',{s:19})+tx(x2,y-r-34,'pignon mené',{s:19})
  D.e15_fleche=page(900,450,'Flèche du brin mou',c,ISO,'Chaîne entre deux pignons : brin tendu en haut, brin mou en bas, flèche à régler')
})()

// Lubrification en carter : profondeur d'immersion
;(function(){
  const x1=270,x2=630,y=250,r=62,niv=296
  let c=pa(S.dRR(100,104,700,330,24)+' '+S.dRR(114,118,672,302,14),{f:H,eo:1})
  c+=re(116,niv,668,122,{f:HUILE,c:HUILE,w:1})+ln(116,niv,784,niv,{c:BLEU,w:2})
  c+=pl([[744,niv],[733,niv-17],[755,niv-17]],{z:1,c:BLEU,w:1.8,f:'#fff'})
  c+=S.roue(x1,y,r)+S.roue(x2,y,r)+S.lien(x1,y,r,x2,y,r,{d:CHAINE,w:3.4})
  c+=ln(436,y+r+9,500,y+r+9,{w:1.4})+fl(450,niv-32,450,niv,{c:ROUGE,t:12,w:1.6})+fl(450,y+r+42,450,y+r+9,{c:ROUGE,t:12,w:1.6})+tx(466,y+r+38,'h ?',{a:'s',c:ROUGE,b:1})
  c+=tx(x1,y-r-22,'pignon menant',{s:19})+tx(x2,y-r-22,'pignon mené',{s:19})+tx(200,396,'bain d’huile',{c:BLEU,s:20})+tx(744,niv-26,'niveau',{c:BLEU,s:18})
  c+=tx(450,92,'carter étanche, en coupe',{s:19})
  D.e15_lubrification=page(900,470,'Lubrification en carter',c,'Coupe ISO 128','Chaîne dans un carter : le brin du bas trempe dans le bain d huile, profondeur à trouver')
})()

// Maillons de fermeture : attache a agrafe, maillon coude
;(function(){
  let c=re(130,205,200,90,{rx:45,f:PALE})+ci(180,250,15,{f:'#fff'})+ci(280,250,15,{f:'#fff'})+croix(180,250,32)+croix(280,250,32)
  c+=pa('M 166 231 H 284 A 19 19 0 0 1 284 269 H 166',{c:ROUGE,w:5})
  c+=tx(230,340,'maillon d’attache',{s:20})+tx(230,366,'à agrafe',{s:20})+rep(284,231,330,170,'agrafe',{c:ROUGE})
  c+=axe(490,250,770,250)
  c+=pl([[520,224],[592,224],[630,204],[724,204]],{w:9})+pl([[520,276],[592,276],[630,296],[724,296]],{w:9})
  c+=re(532,230,46,40,{f:PALE,w:2.4})+re(676,190,16,120,{f:GRIS,w:2.4})+ci(684,318,4,{f:N,w:0.5})
  c+=tx(620,356,'maillon coudé',{s:20})+tx(620,382,'(vue de dessus)',{s:19})
  c+=tx(450,440,'Nombre impair de maillons : que préconise le fabricant ?',{c:BLEU})
  D.e15_maillons=page(900,470,'Maillons de fermeture',c,ISO,'Un maillon d attache à agrafe et un maillon coudé')
})()

// Mesure de l'allongement sur 10 maillons
;(function(){
  const y=250,p=66,x0=120
  let c=''
  for(let i=0;i<10;i++){const x=x0+p*i,e=i%2;c+=re(x-24,y-(e?21:27),p+48,e?42:54,{rx:e?21:27,f:e?'#fff':PALE,w:2.2})}
  for(let i=0;i<=10;i++){const x=x0+p*i;c+=ci(x,y,18,{f:'#fff',w:2.2})+ci(x,y,7,{f:GRIS,w:1.6})}
  c+=axe(70,y,830,y)
  c+=cote(x0+18,y,x0+10*p-18,y,'L1 : entre les rouleaux',{dec:-84})+cote(x0-18,y,x0+10*p+18,y,'L2 : par l’extérieur des rouleaux',{dec:90})
  c+=tx(450,406,'Mesure sur 10 maillons, chaîne légèrement tendue',{s:19,c:BLEU})+tx(450,440,'Quelle longueur L retenir ?',{c:ROUGE,b:1})
  D.e15_mesure=page(900,470,'Mesure de l’allongement',c,'Dessin ISO 128, cotes ISO 129','Chaîne à rouleaux : mesure L1 entre les rouleaux et L2 par l extérieur, sur 10 maillons')
})()

// Plaques de chaine fissurees
;(function(){
  let c=''
  ;[[250,'plaque extérieure',-1],[650,'plaque intérieure',1]].forEach(function(q){const cx=q[0],k=q[2]
    c+=re(cx-130,180,260,100,{rx:50,f:PALE})+ci(cx-80,230,22,{f:'#fff'})+ci(cx+80,230,22,{f:'#fff'})
    c+=axe(cx-150,230,cx+150,230)+axe(cx-80,162,cx-80,298)+axe(cx+80,162,cx+80,298)
    c+=S.fissure(cx+k*80+6,209,0,-28)+S.fissure(cx+k*80+6,251,0,28)+tx(cx,148,q[1],{s:20})
  })
  c+=fl(390,350,140,350,{w:2.4})+fl(510,350,760,350,{w:2.4})+tx(450,357,'traction',{s:20})
  c+=tx(450,410,'En rouge : fissures au bord des trous',{c:ROUGE,s:19})
  D.e15_plaques=page(900,440,'Plaques de chaîne',c,ISO,'Deux plaques de chaîne avec des fissures au bord des trous, en travers de la traction')
})()

module.exports=D
