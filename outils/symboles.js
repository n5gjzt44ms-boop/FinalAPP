// Bibliotheque de symboles normes pour les schemas de ProgMeca (SVG ecrit a la main).
//   Hydraulique : ISO 1219-1      Electricite : IEC 60617
//   Transmissions : ISO 3952      Soudure : ISO 2553      Dessin de piece : ISO 128 / ISO 129
// Chaque fonction renvoie du texte SVG. Les composants renvoient un objet
// { s: le dessin, ... : les points de raccordement }.
// Les symboles sont dessines dans chaque fichier (pas de <use> externe : les
// schemas sont affiches dans des <img>).
'use strict'
const N='#141414',ROUGE='#C13B3A',BLEU='#185FA5',BLEU2='#124A80',GRIS='#D6D6D2',CREME='#E8E4DA',HUILE='#DCE8F3',PALE='#F4F2EC'
const EP=3.2,FIN=1.8
const V={h:[0,-1],b:[0,1],d:[1,0],g:[-1,0]}
const a1=n=>Math.round(n*10)/10
const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
// Types de trait ISO 128 : p = interrompu (pilotage, drain, arete cachee), m = mixte fin (axe),
// mm = mixte a deux tirets (contour d'origine, piece voisine)
const TIRETS={p:'11 7',c:'7 5',m:'24 5 4 5',mm:'24 5 4 5 4 5'}
function att(o){o=o||{}
  let s=' stroke="'+(o.c||N)+'" stroke-width="'+(o.w||EP)+'" fill="'+(o.f||'none')+'"'
  if(o.d) s+=' stroke-dasharray="'+(TIRETS[o.d]||o.d)+'"'
  if(o.op) s+=' opacity="'+o.op+'"'
  if(o.eo) s+=' fill-rule="evenodd"'
  return s
}
function pl(p,o){o=o||{};return '<poly'+(o.z?'gon':'line')+' points="'+p.map(q=>a1(q[0])+','+a1(q[1])).join(' ')+'"'+att(o)+' stroke-linejoin="round"'+(o.d?'':' stroke-linecap="round"')+'/>'}
function ln(x1,y1,x2,y2,o){return pl([[x1,y1],[x2,y2]],o)}
function ci(cx,cy,r,o){return '<circle cx="'+a1(cx)+'" cy="'+a1(cy)+'" r="'+a1(r)+'"'+att(o)+'/>'}
function re(x,y,w,h,o){o=o||{};return '<rect x="'+a1(x)+'" y="'+a1(y)+'" width="'+a1(w)+'" height="'+a1(h)+'"'+(o.rx?' rx="'+o.rx+'"':'')+att(o)+'/>'}
function pa(d,o){return '<path d="'+d+'"'+att(o)+' stroke-linejoin="round" stroke-linecap="round"/>'}
function tx(x,y,t,o){o=o||{}
  return '<text x="'+a1(x)+'" y="'+a1(y)+'" font-size="'+(o.s||22)+'" text-anchor="'+({s:'start',e:'end'}[o.a]||'middle')+'" fill="'+(o.c||N)+'"'
    +(o.b?' font-weight="700"':'')+(o.i?' font-style="italic"':'')+(o.rot?' transform="rotate('+o.rot+' '+a1(x)+' '+a1(y)+')"':'')+'>'+esc(t)+'</text>'
}
// Pointe de fleche pleine, sommet en (x,y), dirigee selon l'angle
function pt(x,y,ang,o){o=o||{};const t=o.t||14,l=t*0.36,c=Math.cos(ang),s=Math.sin(ang)
  return pl([[x,y],[x-t*c+l*s,y-t*s-l*c],[x-t*c-l*s,y-t*s+l*c]],{z:1,f:o.c||N,c:o.c||N,w:0.5})
}
function fl(x1,y1,x2,y2,o){o=o||{};const ang=Math.atan2(y2-y1,x2-x1),t=o.t||14,k=t*0.7
  let s=ln(o.deux?x1+Math.cos(ang)*k:x1,o.deux?y1+Math.sin(ang)*k:y1,x2-Math.cos(ang)*k,y2-Math.sin(ang)*k,{c:o.c,w:o.w||2.4,d:o.d})+pt(x2,y2,ang,o)
  if(o.deux) s+=pt(x1,y1,ang+Math.PI,o)
  return s
}
// Fleche courbe (sens de rotation) : arc de centre (cx,cy), de a1 a a2 en degres (sens horaire si a2>a1)
function flArc(cx,cy,r,d1,d2,o){o=o||{};const A=d=>d*Math.PI/180,x1=cx+r*Math.cos(A(d1)),y1=cy+r*Math.sin(A(d1)),x2=cx+r*Math.cos(A(d2)),y2=cy+r*Math.sin(A(d2))
  const horaire=d2>d1,grand=Math.abs(d2-d1)>180?1:0
  return pa('M '+a1(x1)+' '+a1(y1)+' A '+r+' '+r+' 0 '+grand+' '+(horaire?1:0)+' '+a1(x2)+' '+a1(y2),{c:o.c,w:o.w||2.4})
    +pt(x2+ (horaire?-1:1)*Math.sin(A(d2))*-3,y2+(horaire?1:-1)*Math.cos(A(d2))*3,A(d2)+(horaire?1:-1)*Math.PI/2,{c:o.c,t:o.t||13})
}
// Axe (trait mixte fin) et croix d'axes d'un cercle
function axe(x1,y1,x2,y2,o){o=o||{};return ln(x1,y1,x2,y2,{d:'m',w:o.w||1.5,c:o.c||N})}
function croix(cx,cy,r){return axe(cx-r,cy,cx+r,cy)+axe(cx,cy-r,cx,cy+r)}
// Cote ISO 129 : ligne de cote entre A et B, decalee de dec (perpendiculairement), lignes d'attache.
// o.h : texte d'une cote verticale ecrit a l'horizontale, a gauche de la ligne
function cote(xa,ya,xb,yb,t,o){o=o||{}
  const L=Math.hypot(xb-xa,yb-ya),ux=(xb-xa)/L,uy=(yb-ya)/L,nx=-uy,ny=ux,d=o.dec||0,c=o.c||N
  const x1=xa+nx*d,y1=ya+ny*d,x2=xb+nx*d,y2=yb+ny*d,sg=d<0?-1:1
  let s=''
  if(d){s+=ln(xa+nx*sg*4,ya+ny*sg*4,x1+nx*sg*8,y1+ny*sg*8,{w:1.4,c:c})+ln(xb+nx*sg*4,yb+ny*sg*4,x2+nx*sg*8,y2+ny*sg*8,{w:1.4,c:c})}
  s+=fl(x1,y1,x2,y2,{deux:1,c:c,w:1.6,t:o.t||13})
  const mx=(x1+x2)/2,my=(y1+y2)/2,vert=Math.abs(uy)>Math.abs(ux),ct=o.ct||c
  if(t) s+=vert?(o.h?tx(mx-12+(o.tx||0),my+7+(o.ty||0),t,{s:o.s||20,c:ct,a:'e',b:o.b}):tx(mx-9+(o.tx||0),my+(o.ty||0),t,{s:o.s||20,c:ct,rot:-90,b:o.b})):tx(mx+(o.tx||0),my-9+(o.ty||0),t,{s:o.s||20,c:ct,b:o.b})
  return s
}
// Repere : trait fin entre un point de la piece et un texte
// o.a : 'm' texte centre au bout du trait (au-dessus ou au-dessous), sinon a gauche ou a droite
function rep(x1,y1,x2,y2,t,o){o=o||{};const g=x2<x1,c=o.c||N,ct=o.ct||c
  const s=ln(x1,y1,x2,y2,{w:1.4,c:c})+ci(x1,y1,3,{f:c,c:c,w:0.5})
  if(o.a==='m') return s+tx(x2,y2<y1?y2-8:y2+22,t,{s:o.s||20,c:ct,b:o.b})
  return s+tx(x2+(g?-7:7),y2+7,t,{a:g?'e':'s',s:o.s||20,c:ct,b:o.b})
}
// Chemin d'un rectangle arrondi (pour les coupes a paroi : deux chemins et remplissage pair-impair)
function dRR(x,y,w,h,r){return 'M '+a1(x+r)+' '+a1(y)+' H '+a1(x+w-r)+' A '+r+' '+r+' 0 0 1 '+a1(x+w)+' '+a1(y+r)+' V '+a1(y+h-r)+' A '+r+' '+r+' 0 0 1 '+a1(x+w-r)+' '+a1(y+h)+' H '+a1(x+r)+' A '+r+' '+r+' 0 0 1 '+a1(x)+' '+a1(y+h-r)+' V '+a1(y+r)+' A '+r+' '+r+' 0 0 1 '+a1(x+r)+' '+a1(y)+' Z'}
// Fissure : petit trait brise rouge de (x,y) dans la direction (dx,dy)
function fissure(x,y,dx,dy,o){o=o||{};const n=o.n||4,L=Math.hypot(dx,dy),nx=-dy/L,ny=dx/L,p=[[x,y]]
  for(let i=1;i<=n;i++) p.push([x+dx*i/n+nx*(i%2?4:-4)*(i<n?1:0),y+dy*i/n+ny*(i%2?4:-4)*(i<n?1:0)])
  return pl(p,{c:ROUGE,w:o.w||2.6})
}
// Trait de cassure (piece interrompue) : petite ondulation
function cassure(x,y1,y2){const m=(y1+y2)/2;return pa('M '+x+' '+y1+' Q '+(x-9)+' '+((y1+m)/2)+' '+x+' '+m+' Q '+(x+9)+' '+((m+y2)/2)+' '+x+' '+y2,{w:1.6})}
const DEFS='<defs>'
  +'<pattern id="h" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#fff"/><line x1="0" y1="0" x2="0" y2="10" stroke="#141414" stroke-width="1.5"/></pattern>'
  +'<pattern id="h2" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="10" height="10" fill="#fff"/><line x1="0" y1="0" x2="0" y2="10" stroke="#141414" stroke-width="1.5"/></pattern>'
  +'<pattern id="hs" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><line x1="0" y1="0" x2="0" y2="6" stroke="#141414" stroke-width="1.2"/></pattern>'
  +'<pattern id="hx" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#E8E4DA"/><path d="M0 0V9M0 0H9" stroke="#141414" stroke-width="1.2"/></pattern>'
  +'<pattern id="hr" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="7" height="7" fill="#F6DCDC"/><line x1="0" y1="0" x2="0" y2="7" stroke="#C13B3A" stroke-width="1.5"/></pattern>'
  +'<pattern id="hb" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="7" height="7" fill="#DCE8F3"/><line x1="0" y1="0" x2="0" y2="7" stroke="#185FA5" stroke-width="1.5"/></pattern>'
  +'</defs>'
// Hachures : 'url(#h)' metal coupe (45 degres), h2 piece voisine (sens inverse), hs fines,
// hx croisees (elastomere, plastique), hr metal depose (soudure), hb second depot
const H='url(#h)',H2='url(#h2)',HS='url(#hs)',HX='url(#hx)',HR='url(#hr)',HB='url(#hb)'
function page(w,h,titre,corps,norme,alt){
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(alt||titre).replace(/"/g,'&quot;')+'">\n'
    +'<rect width="'+w+'" height="'+h+'" fill="#FFFFFF"/>\n'+DEFS+'\n<g font-family="Arial,Helvetica,sans-serif">\n'
    +tx(w/2,42,titre,{s:30,b:1,c:BLEU2})+'\n'+corps+'\n'
    +(norme?tx(w-14,h-12,norme,{s:15,a:'e',c:'#6B6B6B'}):'')+'\n</g>\n</svg>\n'
}

// ─── HYDRAULIQUE ISO 1219-1 ──────────────────────────────────────────────
// Conduite de travail : trait continu. Pilotage et drain : trait interrompu. Croisement relie : point.
function noeud(x,y){return ci(x,y,5,{f:N,w:0.5})}
function tuyau(p,o){return pl(p,o)}
function pilote(p,o){o=o||{};return pl(p,{d:'p',w:o.w||2.2,c:o.c})}
function enveloppe(x,y,w,h){return re(x,y,w,h,{d:'m',w:1.8})}
// Pompe a cylindree fixe, un sens de debit : cercle, triangle plein pointe vers la sortie
function pompe(cx,cy,o){o=o||{};const r=o.r||34,v=V[o.out||'h'],px=-v[1],py=v[0]
  const s=ci(cx,cy,r,{f:'#fff'})+pl([[cx+v[0]*r,cy+v[1]*r],[cx+v[0]*r*0.42+px*r*0.36,cy+v[1]*r*0.42+py*r*0.36],[cx+v[0]*r*0.42-px*r*0.36,cy+v[1]*r*0.42-py*r*0.36]],{z:1,f:N,w:1})
  return {s:s,r:r,out:[cx+v[0]*r,cy+v[1]*r],in:[cx-v[0]*r,cy-v[1]*r],g:[cx-r,cy],d:[cx+r,cy],h:[cx,cy-r],b:[cx,cy+r]}
}
// Moteur electrique : cercle marque M
function moteurE(cx,cy,o){o=o||{};const r=o.r||30
  return {s:ci(cx,cy,r,{f:'#fff'})+tx(cx,cy+9,'M',{s:26,b:1}),r:r,g:[cx-r,cy],d:[cx+r,cy],h:[cx,cy-r],b:[cx,cy+r]}
}
// Arbre d'entrainement : deux traits paralleles
function arbre(x1,y1,x2,y2,o){o=o||{};const L=Math.hypot(x2-x1,y2-y1),nx=-(y2-y1)/L*4,ny=(x2-x1)/L*4
  return ln(x1+nx,y1+ny,x2+nx,y2+ny,{w:2.2})+ln(x1-nx,y1-ny,x2-nx,y2-ny,{w:2.2})
}
// Accouplement d'arbres : deux plateaux face a face
function accoupl(cx,cy,o){o=o||{};const h=o.h||16
  return o.vertical?ln(cx-h,cy-5,cx+h,cy-5)+ln(cx-h,cy+5,cx+h,cy+5):ln(cx-5,cy-h,cx-5,cy+h)+ln(cx+5,cy-h,cx+5,cy+h)
}
// Reservoir a l'air libre : U ouvert en haut. Une conduite qui plonge s'arrete pres du fond.
function reservoir(cx,y,o){o=o||{};const w=o.w||110,h=o.h||46
  return {s:pl([[cx-w/2,y],[cx-w/2,y+h],[cx+w/2,y+h],[cx+w/2,y]]),haut:y,fond:y+h,w:w}
}
// Filtre ou crepine : losange, trait interrompu en travers de l'ecoulement
function filtre(cx,cy,o){o=o||{};const s=o.t||28,vert=o.vertical!==false
  return {s:pl([[cx,cy-s],[cx+s,cy],[cx,cy+s],[cx-s,cy]],{z:1,f:'#fff'})+(vert?ln(cx-s,cy,cx+s,cy,{d:'c',w:2.2}):ln(cx,cy-s,cx,cy+s,{d:'c',w:2.2})),
    h:[cx,cy-s],b:[cx,cy+s],g:[cx-s,cy],d:[cx+s,cy]}
}
// Manometre ou vacuometre : cercle et aiguille oblique
function mano(cx,cy,o){o=o||{};const r=o.r||22
  return {s:ci(cx,cy,r,{f:'#fff'})+fl(cx-r*0.6,cy+r*0.6,cx+r*0.7,cy-r*0.7,{t:11,w:2}),r:r,b:[cx,cy+r],h:[cx,cy-r],g:[cx-r,cy],d:[cx+r,cy]}
}
// Ressort en zigzag ; regl : fleche oblique (reglable)
function ressort(x1,y1,x2,y2,o){o=o||{}
  const n=o.n||4,h=o.h||11,L=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/L,uy=(y2-y1)/L,nx=-uy,ny=ux,p=[[x1,y1]]
  for(let i=0;i<n*2;i++){const t=(i+0.5)/(n*2)*L,k=i%2?h:-h;p.push([x1+ux*t+nx*k,y1+uy*t+ny*k])}
  p.push([x2,y2])
  let s=pl(p,{w:2.4})
  if(o.regl){const mx=(x1+x2)/2,my=(y1+y2)/2,a=L*0.42,b=h+17
    s+=fl(mx-ux*a+nx*b,my-uy*a+ny*b,mx+ux*a-nx*b,my+uy*a-ny*b,{t:12,w:2})}
  return s
}
// Clapet anti-retour : bille sur son siege. dir = sens du passage libre (h, b, d, g).
function clapet(cx,cy,dir,o){o=o||{};const r=o.r||10,v=V[dir],px=-v[1],py=v[0]
  const ax=cx-v[0]*r*1.75,ay=cy-v[1]*r*1.75,co=0.821,si=0.571
  let s=ci(cx,cy,r,{f:'#fff',w:2.4})
  ;[1,-1].forEach(function(k){s+=ln(ax+r*0.5*(v[0]*co+k*px*si),ay+r*0.5*(v[1]*co+k*py*si),ax+r*2.15*(v[0]*co+k*px*si),ay+r*2.15*(v[1]*co+k*py*si),{w:2.4})})
  const am=[cx-v[0]*r*2.4,cy-v[1]*r*2.4],av=[cx+v[0]*r*2.4,cy+v[1]*r*2.4]
  s+=ln(am[0],am[1],cx-v[0]*r,cy-v[1]*r)+ln(cx+v[0]*r,cy+v[1]*r,av[0],av[1])
  return {s:s,am:am,av:av}
}
// Limiteur de pression a action directe (normalement ferme) : carre, fleche decalee,
// ressort reglable d'un cote, pilotage interne pris sur l'entree de l'autre cote.
// Entree en haut, sortie en bas (vers le reservoir).
function limiteur(cx,cy,o){o=o||{};const m=o.m||56,x=cx-m/2,y=cy-m/2,k=m*0.2
  let s=re(x,y,m,m,{f:'#fff'})+fl(cx+k,y+8,cx+k,y+m-8,{t:12,w:2.4})
  s+=ln(cx,y-18,cx,y)+ln(cx,y+m,cx,y+m+18)
  s+=ressort(x+m,cy,x+m+46,cy,{regl:o.regl!==false})
  s+=pilote([[cx,y-10],[x-16,y-10],[x-16,cy],[x,cy]])
  return {s:s,in:[cx,y-18],out:[cx,y+m+18],m:m}
}
// Distributeur 4/3 a centre ferme, ressorts de centrage, commande par levier ou electro-aimants.
// x,y : coin haut gauche. Orifices A B en haut et P T en bas de la case du milieu.
function distributeur43(x,y,o){o=o||{};const m=o.m||56,q1=m*0.27,q3=m*0.73
  let s=re(x,y,m,m,{f:'#fff'})+re(x+m,y,m,m,{f:'#fff'})+re(x+2*m,y,m,m,{f:'#fff'})
  s+=fl(x+q1,y+m-6,x+q1,y+6,{t:11,w:2.2})+fl(x+q3,y+6,x+q3,y+m-6,{t:11,w:2.2})
  ;[[x+m+q1,y,1],[x+m+q3,y,1],[x+m+q1,y+m,-1],[x+m+q3,y+m,-1]].forEach(function(p){
    s+=ln(p[0],p[1],p[0],p[1]+p[2]*m*0.26,{w:2.4})+ln(p[0]-8,p[1]+p[2]*m*0.26,p[0]+8,p[1]+p[2]*m*0.26,{w:2.4})})
  s+=fl(x+2*m+q1,y+m-6,x+2*m+q3,y+6,{t:11,w:2.2})+fl(x+2*m+q1,y+6,x+2*m+q3,y+m-6,{t:11,w:2.2})
  s+=ressort(x-34,y+m*0.72,x,y+m*0.72,{n:3,h:8})+ressort(x+3*m,y+m*0.72,x+3*m+34,y+m*0.72,{n:3,h:8})
  if(o.cmd==='elec'){
    s+=re(x-30,y+m*0.1,30,m*0.42,{f:'#fff',w:2.4})+ln(x-30,y+m*0.52,x-8,y+m*0.1,{w:2})
    s+=re(x+3*m,y+m*0.1,30,m*0.42,{f:'#fff',w:2.4})+ln(x+3*m+8,y+m*0.52,x+3*m+30,y+m*0.1,{w:2})
  } else {
    s+=ln(x,y+m*0.3,x-22,y+m*0.3,{w:2.4})+ln(x-22,y+m*0.3,x-44,y+m*0.3-26,{w:2.6})+ci(x-46,y+m*0.3-29,5,{f:N,w:0.5})+ln(x-22,y+m*0.14,x-22,y+m*0.46,{w:2.4})
  }
  return {s:s,A:[x+m+q1,y],B:[x+m+q3,y],P:[x+m+q1,y+m],T:[x+m+q3,y+m],m:m}
}
// Verin double effet, tige vers le haut. x,y : coin haut gauche du corps.
function verinV(x,y,o){o=o||{};const w=o.w||60,h=o.h||160,yp=y+h*(o.pos||0.45),t=o.tige||70
  let s=re(x,y,w,h,{f:'#fff'})+re(x,yp-6,w,12,{f:N,w:1})
  s+=re(x+w/2-7,y-t,14,yp-6-(y-t),{f:'#fff',w:2.4})
  return {s:s,fond:[x+w,y+h-16],tige:[x+w,y+16],bout:[x+w/2,y-t],w:w,h:h}
}
// Verin double effet horizontal, tige vers la droite
function verinH(x,y,o){o=o||{};const w=o.w||190,h=o.h||56,xp=x+w*(o.pos||0.4),t=o.tige||80
  let s=re(x,y,w,h,{f:'#fff'})+re(xp-6,y,12,h,{f:N,w:1})+re(xp+6,y+h/2-7,x+w+t-xp-6,14,{f:'#fff',w:2.4})
  return {s:s,fond:[x+18,y+h],tige:[x+w-18,y+h],bout:[x+w+t,y+h/2]}
}
// Valve d'equilibrage (cartouche) : element de limitation normalement ferme entre 1 (charge, en haut)
// et 2 (distributeur, en bas), pilote par 1 (interne) et par 3 (externe), ressort reglable,
// clapet anti-retour en derivation. vent : chambre du ressort reliee a l'orifice 4.
function equilibrage(cx,cy,o){o=o||{};const m=o.m||60,x=cx-m/2,y=cy-m/2,k=m*0.2,xr=x+m+50,xb=xr+34
  let s=re(x,y,m,m,{f:'#fff'})+fl(cx+k,y+8,cx+k,y+m-8,{t:12,w:2.4})
  s+=ln(cx,y-56,cx,y)+ln(cx,y+m,cx,y+m+56)
  s+=ressort(x+m,cy,xr,cy,{regl:1})
  s+=pilote([[cx,y-16],[x-22,y-16],[x-22,cy-13],[x,cy-13]])
  s+=pilote([[x-78,cy+13],[x,cy+13]])
  const c=clapet(xb,cy,'h',{r:10})
  s+=pl([[cx,y-36],[xb,y-36],c.av])+pl([[cx,y+m+36],[xb,y+m+36],c.am])+c.s+noeud(cx,y-36)+noeud(cx,y+m+36)+noeud(cx,y-16)
  const r={p1:[cx,y-56],p2:[cx,y+m+56],p3:[x-78,cy+13],g:x-78,d:xb+44,haut:y-56,bas:y+m+56}
  if(o.vent){s+=pilote([[xr,cy],[xr,cy+36],[xr+78,cy+36]]);r.p4=[xr+78,cy+36];r.d=xr+78}
  r.s=s+enveloppe(r.g,r.haut,r.d-r.g,r.bas-r.haut)
  return r
}
// Accumulateur hydropneumatique a vessie : enveloppe oblongue, vessie accrochee en haut,
// triangle vide = gaz. Orifice d'huile en bas.
function accumulateur(cx,cy,o){o=o||{};const w=o.w||56,h=o.h||110,x=cx-w/2,y=cy-h/2
  let s=re(x,y,w,h,{rx:w/2,f:'#fff'})
  s+=pa('M '+a1(cx-w*0.3)+' '+a1(y+10)+' C '+a1(cx-w*0.42)+' '+a1(cy+h*0.2)+' '+a1(cx+w*0.42)+' '+a1(cy+h*0.2)+' '+a1(cx+w*0.3)+' '+a1(y+10),{w:2.2})
  s+=pl([[cx,y+16],[cx-9,y+32],[cx+9,y+32]],{z:1,f:'#fff',w:2})
  s+=ln(cx,y+h,cx,y+h+20)
  return {s:s,huile:[cx,y+h+20],haut:[cx,y]}
}

// ─── ELECTRICITE IEC 60617 ───────────────────────────────────────────────
function fil(p,o){o=o||{};return pl(p,{w:o.w||2.6,c:o.c,d:o.d})}
function borne(x,y){return ci(x,y,5,{f:'#fff',w:2.2})}
function jonction(x,y){return ci(x,y,4.5,{f:N,w:0.5})}
// Source de tension continue : trait long fin (+), trait court epais (-). Verticale, + en haut.
function sourceDC(cx,cy,o){o=o||{}
  const s=ln(cx-22,cy-7,cx+22,cy-7,{w:2.6})+ln(cx-11,cy+7,cx+11,cy+7,{w:6})+fil([[cx,cy-34],[cx,cy-7]])+fil([[cx,cy+7],[cx,cy+34]])
    +tx(cx+30,cy-12,'+',{s:24,b:1})+tx(cx+30,cy+24,'−',{s:24,b:1})
  return {s:s,plus:[cx,cy-34],moins:[cx,cy+34]}
}
// Resistance : rectangle
function resistance(cx,cy,o){o=o||{};const L=o.L||64,l=22
  return o.horizontal?{s:re(cx-L/2,cy-l/2,L,l,{f:'#fff',w:2.6}),a:[cx-L/2,cy],b:[cx+L/2,cy]}
    :{s:re(cx-l/2,cy-L/2,l,L,{f:'#fff',w:2.6}),a:[cx,cy-L/2],b:[cx,cy+L/2]}
}
// Appareil de mesure : cercle et unite mesuree
function appareil(cx,cy,u,o){o=o||{};const r=o.r||28
  return {s:ci(cx,cy,r,{f:'#fff',w:2.6})+tx(cx,cy+8,u,{s:o.s||22,b:1}),r:r,g:[cx-r,cy],d:[cx+r,cy],h:[cx,cy-r],b:[cx,cy+r]}
}
// Fusible : rectangle traverse par le conducteur
function fusible(cx,cy,o){o=o||{}
  return o.horizontal?{s:re(cx-24,cy-9,48,18,{f:'#fff',w:2.4})+ln(cx-24,cy,cx+24,cy,{w:2}),a:[cx-24,cy],b:[cx+24,cy]}
    :{s:re(cx-9,cy-24,18,48,{f:'#fff',w:2.4})+ln(cx,cy-24,cx,cy+24,{w:2}),a:[cx,cy-24],b:[cx,cy+24]}
}
// Masse (chassis)
function masse(x,y){return ln(x-18,y,x+18,y,{w:2.6})+ln(x-18,y,x-26,y+12,{w:2})+ln(x-6,y,x-14,y+12,{w:2})+ln(x+6,y,x-2,y+12,{w:2})+ln(x+18,y,x+10,y+12,{w:2})}
// Convertisseur de mesure (transmetteur) : carre coupe par une diagonale,
// grandeur mesuree en haut a gauche, signal de sortie en bas a droite
function transmetteur(cx,cy,o){o=o||{};const m=o.m||70,x=cx-m/2,y=cy-m/2
  return {s:re(x,y,m,m,{f:'#fff',w:2.8})+ln(x,y+m,x+m,y,{w:2})+tx(x+m*0.28,y+m*0.42,o.entree||'p',{s:24,i:1,b:1})+tx(x+m*0.72,y+m*0.84,o.sortie||'I',{s:24,i:1,b:1}),
    m:m,g:[x,cy],d:[x+m,cy],h:[cx,y],b:[cx,y+m]}
}
// Detecteur de proximite : carre contenant un losange (symbole de proximite)
function detecteur(cx,cy,o){o=o||{};const m=o.m||70,x=cx-m/2,y=cy-m/2,k=m*0.27
  return {s:re(x,y,m,m,{f:'#fff',w:2.8})+pl([[cx-k,cy],[cx,cy-k],[cx+k,cy],[cx,cy+k]],{z:1,w:2.4}),m:m,g:[x,cy],d:[x+m,cy],h:[cx,y],b:[cx,y+m]}
}
// Connecteur : contact male (broche pleine) dans un contact femelle (arc)
function connecteur(cx,cy,o){o=o||{}
  return {s:re(cx-22,cy-4,22,8,{f:N,w:0.5})+pa('M '+a1(cx+9)+' '+a1(cy-12)+' A 12 12 0 0 0 '+a1(cx+9)+' '+a1(cy+12),{w:2.6}),g:[cx-22,cy],d:[cx-3,cy]}
}

// ─── TRANSMISSIONS ISO 3952 et dessin ISO 128 ────────────────────────────
// Points de tangence exterieure de deux cercles : renvoie [[haut1,haut2],[bas1,bas2]]
function tangentes(x1,y1,r1,x2,y2,r2){
  const d=Math.hypot(x2-x1,y2-y1),th=Math.atan2(y2-y1,x2-x1),ph=Math.acos((r1-r2)/d)
  const p=function(a){return [[x1+r1*Math.cos(a),y1+r1*Math.sin(a)],[x2+r2*Math.cos(a),y2+r2*Math.sin(a)]]}
  return [p(th-ph),p(th+ph)]
}
// Lien souple (courroie ou chaine) ferme autour de deux roues
// o.ph : point de passage du brin haut (courroie enfoncee) ; o.fb : fleche du brin bas (brin mou)
function lien(x1,y1,r1,x2,y2,r2,o){o=o||{}
  const t=tangentes(x1,y1,r1,x2,y2,r2),h=t[0],b=t[1]
  const bas=o.fb?' Q '+a1((b[0][0]+b[1][0])/2)+' '+a1((b[0][1]+b[1][1])/2+2*o.fb)+' '+a1(b[0][0])+' '+a1(b[0][1]):' L '+a1(b[0][0])+' '+a1(b[0][1])
  return pa('M '+a1(h[0][0])+' '+a1(h[0][1])+(o.ph?' L '+a1(o.ph[0])+' '+a1(o.ph[1]):'')+' L '+a1(h[1][0])+' '+a1(h[1][1])+' A '+r2+' '+r2+' 0 '+(r2>r1?1:0)+' 1 '+a1(b[1][0])+' '+a1(b[1][1])
    +bas+' A '+r1+' '+r1+' 0 '+(r1>=r2?1:0)+' 1 '+a1(h[0][0])+' '+a1(h[0][1])+' Z',o)
}
// Poulie vue de face : jante, moyeu, arbre et axes
function poulie(cx,cy,r,o){o=o||{}
  return ci(cx,cy,r,{f:o.f||PALE})+ci(cx,cy,r*0.86,{w:1.4})+ci(cx,cy,Math.max(10,r*0.22),{f:'#fff',w:2.4})+croix(cx,cy,r+14)
}
// Roue dentee (pignon de chaine, poulie crantee) : cercle de tete en trait fort,
// cercle primitif en trait mixte fin (convention ISO 2203), moyeu
function roue(cx,cy,rp,o){o=o||{};const ht=o.ht||7
  return ci(cx,cy,rp+ht,{f:o.f||PALE})+ci(cx,cy,rp,{d:'m',w:1.5})+ci(cx,cy,rp-ht,{w:1.2})+ci(cx,cy,Math.max(9,rp*0.2),{f:'#fff',w:2.4})+croix(cx,cy,rp+ht+14)
}
// Palier a roulement, symbole cinematique : arbre horizontal passant en (cx,cy)
function palier(cx,cy,o){o=o||{};const e=o.e||16
  return o.vertical?ln(cx-e,cy-10,cx-e,cy+10,{w:2.6})+ln(cx+e,cy-10,cx+e,cy+10,{w:2.6})+ci(cx-e/2-1,cy,5,{w:2})+ci(cx+e/2+1,cy,5,{w:2})
    :ln(cx-10,cy-e,cx+10,cy-e,{w:2.6})+ln(cx-10,cy+e,cx+10,cy+e,{w:2.6})+ci(cx,cy-e/2-1,5,{w:2})+ci(cx,cy+e/2+1,5,{w:2})
}
// Signe du type de lien, a poser au-dessus du brin : 'V' trapezoidale, 'cran' synchrone, 'chaine' a rouleaux
function typeLien(x,y,type){
  if(type==='V') return pl([[x-12,y-9],[x+12,y-9],[x+6,y+9],[x-6,y+9]],{z:1,f:'#fff',w:2.2})
  if(type==='cran') return pl([[x-18,y+6],[x-18,y-6],[x+18,y-6],[x+18,y+6],[x+10,y+6],[x+10,y],[x+2,y],[x+2,y+6],[x-6,y+6],[x-6,y],[x-12,y],[x-12,y+6]],{z:1,f:'#fff',w:2})
  return ci(x-10,y,5,{f:'#fff',w:2})+ci(x+10,y,5,{f:'#fff',w:2})+ln(x-5,y-4,x+5,y-4,{w:2})+ln(x-5,y+4,x+5,y+4,{w:2})
}

// ─── SOUDURE ISO 2553 ────────────────────────────────────────────────────
// Symbole de soudure : fleche vers le joint (xj,yj), ligne de repere a partir de (x,y) vers la droite,
// ligne d'identification interrompue, symbole elementaire, cotes avant et apres.
// type : 'angle' (triangle), 'V', 'I', 'recharge' (surfacage : deux demi-cercles)
// o.droite : la fleche part du bout droit de la ligne de repere
function soudure(xj,yj,x,y,o){o=o||{};const L=o.L||150,cx=x+L*0.42
  let s=fl(o.droite?x+L:x,y,xj,yj,{t:13,w:1.8})+ln(x,y,x+L,y,{w:1.8})
  if(o.ident!==false) s+=ln(x,y+9,x+L,y+9,{d:'c',w:1.4})
  if(o.type==='angle') s+=pl([[cx-13,y],[cx-13,y-24],[cx+13,y]],{z:1,f:'#fff',w:2.2})
  else if(o.type==='V') s+=pl([[cx-14,y-24],[cx,y],[cx+14,y-24]],{w:2.2})
  else if(o.type==='I') s+=ln(cx-5,y,cx-5,y-24,{w:2.2})+ln(cx+5,y,cx+5,y-24,{w:2.2})
  else if(o.type==='recharge') s+=pa('M '+a1(cx-22)+' '+y+' A 11 11 0 0 1 '+a1(cx)+' '+y+' A 11 11 0 0 1 '+a1(cx+22)+' '+y,{w:2.2})
  if(o.avant) s+=tx(cx-(o.type==='recharge'?30:20),y-6,o.avant,{a:'e',s:19,c:o.c})
  if(o.apres) s+=tx(cx+(o.type==='recharge'?30:20),y-6,o.apres,{a:'s',s:19,c:o.c})
  if(o.queue) s+=ln(x+L,y,x+L+14,y-14,{w:1.8})+ln(x+L,y,x+L+14,y+14,{w:1.8})+tx(x+L+20,y+7,o.queue,{a:'s',s:19,c:o.c})
  return s
}

module.exports={N,ROUGE,BLEU,BLEU2,GRIS,CREME,HUILE,PALE,EP,FIN,V,a1,pl,ln,ci,re,pa,tx,pt,fl,flArc,axe,croix,cote,rep,dRR,fissure,cassure,page,H,H2,HS,HX,HR,HB,
  noeud,tuyau,pilote,enveloppe,pompe,moteurE,arbre,accoupl,reservoir,filtre,mano,ressort,clapet,limiteur,distributeur43,verinV,verinH,equilibrage,accumulateur,
  fil,borne,jonction,sourceDC,resistance,appareil,fusible,masse,transmetteur,detecteur,connecteur,
  tangentes,lien,poulie,roue,palier,typeLien,soudure}
