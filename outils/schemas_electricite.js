// Schemas d'electricite (lots 3 et 4) : symboles IEC 60617, vues et coupes ISO 128, cotes ISO 129.
'use strict'
const S=require('./symboles')
const {N,ROUGE,BLEU,GRIS,HUILE,PALE,pl,ln,ci,re,pa,tx,fl,axe,croix,cote,rep,page,H,H2,HX}=S
const IEC='Symboles IEC 60617'
const D={}

// Cible normalisee : face du detecteur, cible de face et de cote
;(function(){
  let c=ci(190,250,72,{f:PALE})+ci(190,250,58,{w:1.6})+croix(190,250,92)
  c+=cote(118,250,262,250,'Ø 18',{dec:108})+tx(190,136,'face active du détecteur',{s:20})
  c+=re(440,170,160,160,{f:PALE})+croix(520,250,90)+tx(520,136,'cible vue de face',{s:20})
  c+=cote(440,330,600,330,'côté a = ?',{dec:48,ct:ROUGE,b:1})
  c+=re(720,170,12,160,{f:GRIS})+rep(726,170,726,136,'e = ?',{a:'m',ct:ROUGE,b:1})+tx(726,366,'vue de côté',{s:20})
  c+=tx(190,424,'Sn = 8 mm',{c:BLEU,b:1})+tx(610,440,'Cible carrée : côté, épaisseur, matière ?',{c:ROUGE,s:20})
  D.e14_cible=page(900,490,'Cible normalisée de mesure',c,'Vues ISO 128, cotes ISO 129','Face du détecteur de 18 mm et cible carrée dont on cherche le côté et l épaisseur')
})()

// Connecteur pres d'un echappement, lave au jet
;(function(){
  let c=re(70,104,470,44,{f:GRIS})+pa('M 540 104 A 9 22 0 0 1 540 148 A 9 22 0 0 1 540 104 Z',{f:'#fff'})+axe(50,126,580,126)
  c+=tx(300,92,'échappement',{s:20})+tx(700,134,'140 °C',{c:ROUGE,b:1,s:28})
  ;[330,420,510].forEach(function(x){c+=pa('M '+x+' 160 q 9 12 0 24 q -9 12 0 24',{c:ROUGE,w:2.2})+S.pt(x,224,Math.PI/2,{c:ROUGE,t:12})})
  // faisceau : capteur, connecteur, calculateur
  const t=S.transmetteur(120,310,{m:64}),k=S.connecteur(420,310)
  c+=t.s+S.fil([t.d,k.g])+k.s+S.fil([[432,310],[720,310]])+fl(720,310,800,310,{w:2.6})
  c+=ci(416,310,44,{d:'c',c:ROUGE,w:2})+tx(416,392,'connecteur : lequel ?',{c:ROUGE,b:1})
  c+=tx(120,372,'capteur',{s:20})+tx(700,292,'vers le calculateur',{s:20})
  // jet de lavage
  c+=pl([[690,420],[730,404],[742,432],[702,448]],{z:1,f:PALE})
  ;[[470,338],[484,352],[462,356],[498,340]].forEach(function(q){c+=ln(688,430,q[0],q[1],{c:BLEU,w:2})})
  c+=tx(760,444,'lavage au jet',{a:'s',c:BLEU,s:20})
  D.e14_engin=page(900,500,'Connecteur près d’un échappement',c,IEC,'Faisceau avec un connecteur posé près d un échappement à 140 °C et lavé au jet')
})()

// Fil dans le joint arriere du connecteur, en coupe
;(function(){
  let c=re(380,150,400,42,{f:H})+re(380,308,400,42,{f:H})+S.cassure(780,150,192)+S.cassure(780,308,350)
  c+=re(380,192,120,116,{f:HX})
  c+=re(600,230,62,40,{f:'#fff',w:2.4})+re(662,238,100,24,{f:'#fff',w:2.4})
  c+=re(110,236,470,28,{f:HUILE,c:BLEU,w:2.4})+re(580,243,36,14,{f:GRIS,w:2})
  c+=axe(70,250,830,250)
  c+=fl(150,196,150,236,{t:12,w:1.6})+fl(150,304,150,264,{t:12,w:1.6})+tx(164,206,'isolant Ø 1,9 mm',{a:'s',s:20})
  c+=rep(440,236,440,120,'Ø accepté par le joint : ?',{a:'m',ct:ROUGE,b:1})
  c+=rep(420,296,330,392,'joint arrière (silicone)',{a:'m'})+rep(700,330,700,392,'boîtier',{a:'m'})+rep(690,238,720,120,'contact serti',{a:'m'})
  c+=tx(270,296,'fil',{s:20})
  D.e14_joint=page(900,440,'Fil dans le joint arrière',c,'Coupe ISO 128','Coupe : fil de 1,9 mm dans le joint arrière en silicone d un connecteur')
})()

// Meme detecteur, cibles de metaux differents
;(function(){
  let c=''
  ;['acier doux','inox','laiton','aluminium','cuivre'].forEach(function(m,i){const x=110+170*i
    c+=S.detecteur(x,150,{m:60}).s+re(x-52,310,104,16,{f:GRIS})+cote(x,180,x,310,'?',{ct:ROUGE,b:1,s:28,h:1})+tx(x,360,m,{b:1})
  })
  c+=tx(450,96,'détecteur inductif standard',{s:20})+tx(450,416,'Portée sur chaque métal : quel facteur de correction ?',{c:BLEU})
  D.e14_metaux=page(900,450,'Même détecteur, métaux différents',c,IEC,'Un détecteur inductif face à cinq cibles : acier doux, inox, laiton, aluminium, cuivre')
})()

// Portee d'un detecteur inductif : echelle en millimetres
;(function(){
  let c=axe(40,220,790,220)+ln(56,220,110,220,{w:7})
  c+=re(110,180,190,80,{f:PALE})+ln(110,189,300,189,{w:1.2})+ln(110,251,300,251,{w:1.2})
  c+=re(160,168,26,104,{f:'#fff'})+re(196,168,26,104,{f:'#fff'})+re(300,184,10,72,{f:BLEU,c:BLEU,w:1})
  c+=tx(205,146,'détecteur',{s:20})
  c+=re(630,150,14,140,{f:GRIS})+tx(637,136,'cible',{s:20})+fl(760,190,662,190,{w:2.4})+tx(716,176,'approche',{s:18})
  c+=ln(310,262,310,350,{d:'c',w:1.6})+ln(630,292,630,350,{d:'c',c:ROUGE,w:1.8})
  c+=ln(310,350,726,350,{w:2.4})
  for(let i=0;i<=10;i++){const x=310+40*i;c+=ln(x,350,x,i%2?359:366,{w:2});if(i%2===0) c+=tx(x,390,String(i),{s:20})}
  c+=tx(770,390,'mm',{s:19})+tx(644,330,'Sn = 8 mm',{a:'s',c:ROUGE,b:1})
  c+=S.detecteur(826,112,{m:52}).s+tx(826,168,'symbole',{s:18})
  c+=tx(450,446,'Sr, Su, Sa : quelles plages ?',{c:BLEU})
  D.e14_portee=page(900,480,'Portée d’un détecteur inductif',c,'Vue ISO 128, symbole IEC 60617','Détecteur inductif, cible à 8 mm et échelle graduée de 0 à 10 mm')
})()

// Montage d'un connecteur DT : contacts, boitier, verrou secondaire
;(function(){
  let c=axe(40,250,860,250)
  ;[215,285].forEach(function(y){c+=ln(60,y,180,y,{w:6})+re(180,y-8,34,16,{f:GRIS,w:2})+re(214,y-6,62,12,{f:'#fff',w:2})+fl(288,y,334,y,{w:2.4})})
  c+=re(350,170,240,160,{f:PALE,rx:10})+re(350,182,34,136,{f:HX,w:2})+re(430,156,76,14,{f:PALE})
  ;[203,227,273,297].forEach(function(y){c+=ln(384,y,570,y,{d:'c',w:1.6})})
  c+=re(690,196,40,108,{f:GRIS})+re(658,208,32,14,{f:GRIS})+re(658,278,32,14,{f:GRIS})+fl(648,250,600,250,{w:2.4})
  c+=rep(200,207,170,128,'contacts sertis',{a:'m'})+rep(540,172,560,118,'boîtier',{a:'m'})
  c+=rep(366,316,330,396,'joint arrière',{a:'m'})+rep(710,304,690,396,'verrou secondaire (wedgelock)',{a:'m'})
  c+=tx(450,450,'Dans quel ordre, et comment ?',{c:BLEU})
  D.e14_verrou=page(900,480,'Monter un connecteur DT',c,'Vue éclatée, axes ISO 128','Vue éclatée : contacts sertis, boîtier avec joint arrière, verrou secondaire')
})()

// Boucle 4-20 mA a deux fils
;(function(){
  const s=S.sourceDC(130,270),t=S.transmetteur(420,160),r=S.resistance(700,270)
  let c=s.s+t.s+r.s+S.fil([s.plus,[130,160],t.g])+S.fil([t.d,[700,160],r.a])+S.fil([r.b,[700,380],[130,380],s.moins])
  c+=fl(540,140,640,140,{c:ROUGE,w:2.6})+tx(590,124,'I = 4 … 20 mA',{c:ROUGE,b:1})
  c+=tx(96,278,'UB',{a:'e',b:1})+tx(420,106,'capteur à 2 fils',{s:20})
  c+=tx(724,264,'R : charge',{a:'s'})+tx(724,290,'(entrée + câbles)',{a:'s',s:19})
  c+=tx(450,440,'Le même courant alimente le capteur et porte la mesure.',{s:19,c:BLEU})
  D.e18_boucle=page(900,480,'Boucle 4-20 mA à deux fils',c,IEC,'Schéma : alimentation continue, capteur à deux fils, résistance de charge en série')
})()

// Cablage d'un capteur a deux fils : ou vont les fils ?
;(function(){
  const t=S.transmetteur(150,250,{m:80})
  let c=t.s+tx(150,328,'capteur',{s:20})+S.fil([[190,228],[398,228]])+S.fil([[190,272],[398,272]])+S.borne(404,228)+S.borne(404,272)
  c+=tx(294,214,'BN (brun)',{s:19})+tx(294,300,'WH (blanc)',{s:19})
  c+=tx(444,240,'?',{c:ROUGE,b:1,s:32})+tx(444,284,'?',{c:ROUGE,b:1,s:32})
  c+=S.enveloppe(580,110,270,300)
  ;[['L+ (+24 V)',160],['M (0 V)',230],['AI (entrée analogique)',300],['blindage',370]].forEach(function(b){c+=S.borne(580,b[1])+tx(600,b[1]+7,b[0],{a:'s',s:20})})
  c+=tx(715,440,'alimentation et automate',{s:19})
  D.e18_cablage=page(900,490,'Câblage d’un capteur à deux fils',c,IEC,'Capteur à deux fils, brun et blanc, et bornes de l alimentation et de l automate')
})()

// Capteur de pression en coupe
;(function(){
  let c=re(268,84,64,50,{f:PALE})+ln(268,96,332,96,{w:1.2})+ln(268,122,332,122,{w:1.2})
  c+=pa('M240 134H360V284H240Z M254 148H346V284H254Z',{f:H,eo:1})
  c+=re(274,172,52,76,{f:'#fff',w:2})+ln(284,192,316,192,{w:1.4})+ln(284,210,316,210,{w:1.4})+ln(284,228,316,228,{w:1.4})
  c+=pa('M214 284H386V332H214Z M254 284H346V302H308V332H292V302H254Z',{f:H2,eo:1})
  c+=pa('M268 332H332V444H268Z M292 332H308V444H292Z',{f:H,eo:1})
  c+=re(292,420,6,24,{f:N,w:0.5})+re(302,420,6,24,{f:N,w:0.5})
  c+=ln(254,302,346,302,{c:ROUGE,w:4})+axe(300,66,300,540)
  c+=fl(300,530,300,456,{c:BLEU,w:3.2,t:16})+tx(318,516,'huile sous pression',{a:'s',c:BLEU,s:20})
  c+=rep(326,108,470,104,'connecteur')+rep(322,210,470,196,'électronique')+rep(340,302,470,270,'membrane et cellule de mesure')
  c+=rep(380,316,470,336,'six-pans')+rep(326,390,470,394,'raccord fileté')+rep(306,432,470,446,'étranglement')
  c+=rep(246,220,160,220,'boîtier')
  D.e18_capteur=page(900,560,'Capteur de pression en coupe',c,'Coupe ISO 128','Coupe d un capteur de pression : connecteur, électronique, membrane, raccord fileté, étranglement')
})()

// Connecteur M12 a 4 broches, vue de face
;(function(){
  const cx=450,cy=250
  let c=ci(cx,cy,118,{f:PALE})+pa('M '+(cx+106)+' '+cy+' A 106 106 0 1 1 '+cx+' '+(cy-106),{w:1.4})+ci(cx,cy,92,{f:'#fff'})+croix(cx,cy,140)
  c+=re(cx-10,cy-93,20,18,{f:N,w:1})
  ;[[1,42,-42],[2,-42,-42],[3,-42,42],[4,42,42]].forEach(function(b){c+=ci(cx+b[1],cy+b[2],17,{f:'#fff'})+tx(cx+b[1],cy+b[2]+8,String(b[0]),{b:1})})
  c+=rep(cx+8,cy-86,650,150,'détrompeur')+rep(cx+84,cy+70,650,350,'filetage M12')
  c+=tx(cx,422,'Vue de face du connecteur du capteur, côté broches',{s:19})+tx(cx,448,'Disposition à vérifier sur la fiche du capteur',{s:17,c:BLEU})
  D.e18_m12=page(900,480,'Connecteur M12 à 4 broches',c,'Vue ISO 128','Connecteur M12 vu de face : quatre broches numérotées et détrompeur')
})()

// Montage du capteur sur la conduite
;(function(){
  let c=re(120,400,600,70,{f:HUILE,c:HUILE,w:1})+ln(120,400,720,400)+ln(120,470,720,470)+S.cassure(120,400,470)+S.cassure(720,400,470)+axe(96,435,744,435)
  c+=re(384,376,72,24,{f:PALE})+re(378,330,84,46,{f:PALE})+ln(399,330,399,376,{w:1.4})+ln(441,330,441,376,{w:1.4})
  c+=re(388,200,64,130,{f:PALE})+ci(452,296,7,{f:BLEU,c:BLEU,w:1})
  c+=re(398,150,44,50,{f:PALE})+ln(398,160,442,160,{w:1.2})+ln(398,190,442,190,{w:1.2})
  c+=ln(420,150,420,104,{w:7})+S.cassure(420,96,110)+axe(420,74,420,500)
  c+=rep(442,176,560,170,'connecteur')+rep(440,240,560,236,'boîtier')+rep(452,296,560,300,'filtre de mise à l’air')+rep(462,353,560,360,'six-pans')
  c+=tx(590,500,'conduite',{s:20})+tx(436,104,'câble : quel chemin ?',{a:'s',c:ROUGE,b:1})
  c+=tx(110,300,'Serrage : par où ?',{a:'s',c:ROUGE,b:1})+tx(110,330,'Quel couple ?',{a:'s',c:ROUGE,b:1})
  D.e18_montage=page(900,530,'Montage du capteur sur la conduite',c,'Vue ISO 128','Capteur de pression vissé sur une conduite : connecteur, boîtier, filtre de mise à l air, six-pans')
})()

// Ou placer le capteur : au-dessus ou au-dessous du point de prise
;(function(){
  const a=S.transmetteur(450,112,{m:64}),b=S.transmetteur(450,392,{m:64})
  let c=re(140,222,620,56,{f:HUILE,c:HUILE,w:1})+ln(140,222,760,222)+ln(140,278,760,278)+S.cassure(140,222,278)+S.cassure(760,222,278)+axe(116,250,784,250)
  c+=ln(450,222,450,144)+ln(450,278,450,360)+S.noeud(450,222)+S.noeud(450,278)+a.s+b.s
  c+=tx(516,122,'A',{b:1,s:32,a:'s'})+tx(516,402,'B',{b:1,s:32,a:'s'})
  c+=tx(240,243,'liquide',{c:BLEU,s:19})+rep(450,222,600,186,'point de prise')
  c+=tx(450,462,'Capteur au-dessus (A) ou au-dessous (B) du point de prise ?',{c:BLEU,s:20})
  D.e18_position=page(900,490,'Où placer le capteur ?',c,IEC,'Conduite de liquide avec un capteur possible au-dessus, A, ou au-dessous, B')
})()

// Controle du signal : multimetre en serie dans la boucle
;(function(){
  const s=S.sourceDC(110,270),t=S.transmetteur(300,160),a=S.appareil(500,160,'mA'),r=S.resistance(720,270)
  let c=s.s+t.s+a.s+r.s+S.fil([s.plus,[110,160],t.g])+S.fil([t.d,a.g])+S.fil([a.d,[720,160],r.a])+S.fil([r.b,[720,380],[110,380],s.moins])
  c+=S.enveloppe(664,214,112,112)
  c+=tx(500,110,'? mA',{c:ROUGE,b:1,s:26})+tx(500,218,'multimètre en série',{s:19})
  c+=tx(300,106,'capteur à 2 fils',{s:20})+tx(76,278,'UB',{a:'e',b:1})
  c+=tx(650,262,'entrée analogique',{a:'e',s:19})+tx(650,286,'de l’automate',{a:'e',s:19})
  D.e18_signal=page(900,440,'Contrôle du signal au multimètre',c,IEC,'Schéma : alimentation, capteur à deux fils, multimètre en série, entrée analogique de l automate')
})()

module.exports=D
