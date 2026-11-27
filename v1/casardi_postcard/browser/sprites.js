// Generated helpers/animals/equipment from Python + independent LPC assembler.
globalThis.CasardiSprites=(()=>{
/* Python-compatible helpers and hard-edged rasteriser for the shared sprites.
 * Original project code, MIT; sprite artwork CC0. No third-party interpreter.
 */
const pyTruth=v=>v!==null&&v!==undefined&&v!==false&&v!==0&&v!==''&&(!(Array.isArray(v)||typeof v==='object')||Object.keys(v).length>0);
const pyAnd=(a,b)=>pyTruth(a)?b():a,pyOr=(a,b)=>pyTruth(a)?a:b();
const pyEq=(a,b)=>Array.isArray(a)&&Array.isArray(b)?a.length===b.length&&a.every((v,i)=>pyEq(v,b[i])):a===b;
const pyKey=k=>Array.isArray(k)?'~'+JSON.stringify(k):k;
const pyGet=(o,k)=>o[Array.isArray(o)&&typeof k==='number'&&k<0?o.length+k:pyKey(k)];
const pySet=(o,k,v)=>(o[pyKey(k)]=v);
const pyDGet=(o,k,d=null)=>Object.prototype.hasOwnProperty.call(o,pyKey(k))?o[pyKey(k)]:d;
const pySetDefault=(o,k,d)=>Object.prototype.hasOwnProperty.call(o,pyKey(k))?o[pyKey(k)]:(o[pyKey(k)]=d);
const pyItems=o=>Object.entries(o).map(([k,v])=>[k.startsWith('~[')?JSON.parse(k.slice(1)):k,v]);
const pyIter=o=>typeof o==='string'||Array.isArray(o)||ArrayBuffer.isView(o)?o:Object.keys(o);
const pyIn=(v,o)=>Array.isArray(o)?o.some(x=>pyEq(x,v)):typeof o==='string'?o.includes(v):Object.prototype.hasOwnProperty.call(o,pyKey(v));
const pyMul=(a,b)=>typeof a==='string'?a.repeat(Math.max(0,Math.trunc(b))):typeof b==='string'?b.repeat(Math.max(0,Math.trunc(a))):a*b;
const pyMod=(a,b)=>((a%b)+b)%b;
const pyRound=x=>{const f=Math.floor(x),d=x-f;return d<.5?f:d>.5?f+1:(f%2===0?f:f+1);};
const pyRadians=d=>d*Math.PI/180;
const pyDict=(o={})=>({...o});
const pyEnumerate=o=>Array.from(pyIter(o),(v,i)=>[i,v]);
const pyAny=o=>Array.from(pyIter(o)).some(pyTruth);
function pyRange(a,b,step=1){if(b===undefined){b=a;a=0;}const r=[];for(let i=a;step>0?i<b:i>b;i+=step)r.push(i);return r;}
const __rampCache=new Map();
function ramp(base){
 const key=JSON.stringify(base);if(__rampCache.has(key))return __rampCache.get(key);
 const rgb=typeof base==='string'?[1,3,5].map(i=>parseInt(base.slice(i,i+2),16)):base.slice(0,3);
 const mix=(a,b,t)=>a.map((v,i)=>pyRound(v+(b[i]-v)*t));
 const shadow=[58,48,74],light=[255,246,226];
 const out=[mix(mix(rgb,[0,0,0],.42),shadow,.42),mix(mix(rgb,shadow,.30),[0,0,0],.10),rgb,mix(rgb,light,.30),mix(rgb,light,.58)].map(c=>[...c,255]);
 __rampCache.set(key,out);return out;
}
const DENIM_COLORS=PORTABLE.palette.denim,EYE_COLORS=PORTABLE.palette.eyes,FABRIC_COLORS=PORTABLE.palette.fabric,HAIR_COLORS=PORTABLE.palette.hair,LEATHER_COLORS=PORTABLE.palette.leather,METAL_COLORS=PORTABLE.palette.metal,SKIN_TONES=PORTABLE.palette.skin;
class PixelCanvas {
 constructor(w,h,fill=[0,0,0,0]){this.w=w;this.h=h;this.buf=Array(w*h).fill(fill);}
 inside(x,y){return x>=0&&x<this.w&&y>=0&&y<this.h;}
 get(x,y){return this.inside(x,y)?this.buf[y*this.w+x]:[0,0,0,0];}
 set(x,y,c){x=Math.trunc(x);y=Math.trunc(y);if(this.inside(x,y))this.buf[y*this.w+x]=c;}
 alpha(x,y){return this.inside(x,y)?this.buf[y*this.w+x][3]:0;}
 rect(x0,y0,x1,y1,c){[x0,x1]=[Math.trunc(x0),Math.trunc(x1)].sort((a,b)=>a-b);[y0,y1]=[Math.trunc(y0),Math.trunc(y1)].sort((a,b)=>a-b);for(let y=Math.max(0,y0);y<=Math.min(this.h-1,y1);y++)for(let x=Math.max(0,x0);x<=Math.min(this.w-1,x1);x++)this.buf[y*this.w+x]=c;}
 hline(x0,x1,y,c,width=1){this.rect(x0,y,x1,y+width-1,c);}
 vline(x,y0,y1,c,width=1){this.rect(x,y0,x+width-1,y1,c);}
 ellipse(cx,cy,rx,ry,c){if(rx<=0||ry<=0)return;for(let y=Math.max(0,Math.floor(cy-ry));y<=Math.min(this.h-1,Math.ceil(cy+ry));y++){const t=1-((y+.5-cy)/ry)**2;if(t<=0)continue;const dx=rx*Math.sqrt(t),x0=Math.max(0,Math.ceil(cx-dx-.5)),x1=Math.min(this.w-1,Math.floor(cx+dx-.5));for(let x=x0;x<=x1;x++)this.buf[y*this.w+x]=c;}}
 circle(cx,cy,r,c){this.ellipse(cx,cy,r,r,c);}
 poly(pts,c){if(pts.length<3)return;const y0=Math.max(0,Math.floor(Math.min(...pts.map(p=>p[1])))),y1=Math.min(this.h-1,Math.ceil(Math.max(...pts.map(p=>p[1]))));for(let y=y0;y<=y1;y++){const fy=y+.5,xs=[];for(let i=0;i<pts.length;i++){const [ax,ay]=pts[i],[bx,by]=pts[(i+1)%pts.length];if((ay<=fy&&fy<by)||(by<=fy&&fy<ay))xs.push(ax+(fy-ay)*(bx-ax)/(by-ay));}xs.sort((a,b)=>a-b);for(let j=0;j+1<xs.length;j+=2){const a=Math.max(0,Math.ceil(xs[j]-.5)),b=Math.min(this.w-1,Math.floor(xs[j+1]-.5));for(let x=a;x<=b;x++)this.buf[y*this.w+x]=c;}}}
 line(x0,y0,x1,y1,c,width=1){x0=pyRound(x0);y0=pyRound(y0);x1=pyRound(x1);y1=pyRound(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,off=Math.floor(width/2);let err=dx+dy;while(true){if(width<=1)this.set(x0,y0,c);else this.rect(x0-off,y0-off,x0-off+width-1,y0-off+width-1,c);if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}}}
 thick_curve(pts,c,width=2){for(let i=0;i<pts.length-1;i++)this.line(...pts[i],...pts[i+1],c,width);}
 outline_all(color){const add=[],w=this.w,h=this.h,b=this.buf;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(b[i][3])continue;if((x>0&&b[i-1][3])||(x<w-1&&b[i+1][3])||(y>0&&b[i-w][3])||(y<h-1&&b[i+w][3]))add.push(i);}for(const i of add)b[i]=color;}
 blit(other,ox,oy){for(let y=0;y<other.h;y++)for(let x=0;x<other.w;x++){const c=other.buf[y*other.w+x];if(c[3]&&this.inside(ox+x,oy+y))this.buf[(oy+y)*this.w+ox+x]=c;}}
 bounds(){let x0=this.w,y0=this.h,x1=-1,y1=-1;for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++)if(this.buf[y*this.w+x][3]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}return x1<0?[0,0,0,0]:[x0,y0,x1,y1];}
}


function capsule(c,x0,y0,x1,y1,w,col,dark=null,light=null,caps=true) {
let cols,dx,dy,half,i,j,kx,ky,ln,nx,ny,off,px,py,steps,t,v;
[dx,dy] = [(x1-x0),(y1-y0)];
ln = Math.max(1e-06,Math.hypot(dx,dy));
[nx,ny] = [((-dy)/ln),(dx/ln)];
half = ((w-1)/2.0);
steps = (Math.trunc(pyMul(ln,2))+3);
cols = ({});
for (const __item1 of pyIter(pyRange((steps+1)))) {
i = __item1;
t = (i/steps);
[px,py] = [(x0+pyMul(dx,t)),(y0+pyMul(dy,t))];
for (const __item2 of pyIter(pyRange(w))) {
j = __item2;
off = ((-half)+j);
pySet(cols,[pyRound((px+pyMul(nx,off))),pyRound((py+pyMul(ny,off)))],col);
}
}
if (pyTruth(caps)) {
c.ellipse(x0,y0,(half+0.25),(half+0.25),col);
c.ellipse(x1,y1,(half+0.25),(half+0.25),col);
}
for (const __item3 of pyIter(pyItems(cols))) {
[[kx,ky],v] = __item3;
c.set(kx,ky,v);
}
if (pyTruth(((dark!==null)))) {
for (const __item4 of pyIter(pyRange((steps+1)))) {
i = __item4;
t = (i/steps);
[px,py] = [(x0+pyMul(dx,t)),(y0+pyMul(dy,t))];
c.set(pyRound((px+pyMul(nx,half))),pyRound((py+pyMul(ny,half))),dark);
}
}
if (pyTruth(((light!==null)))) {
for (const __item5 of pyIter(pyRange((steps+1)))) {
i = __item5;
t = (i/steps);
[px,py] = [(x0+pyMul(dx,t)),(y0+pyMul(dy,t))];
c.set(pyRound((px-pyMul(nx,half))),pyRound((py-pyMul(ny,half))),light);
}
}
}
function hand(c,x,y,skin,r=2.3) {
c.ellipse(x,y,r,pyMul(r,1.1),pyGet(skin,2));
c.rect((x+0.4),(y+pyMul(r,0.5)),(x+pyMul(r,0.9)),(y+pyMul(r,1.0)),pyGet(skin,1));
c.set(Math.trunc((x-pyMul(r,0.6))),Math.trunc((y-pyMul(r,0.6))),pyGet(skin,3));
}
let ANIMALS,CX,GROUND,H,W;


[W,H] = [74,100];
[CX,GROUND] = [37,97];


ANIMALS = ({["gatto"]:({["label"]:"Gatto",["variants"]:[["soriano","Soriano","#c98b4b"],["nero","Nero","#2f2b33"],["bianco","Bianco","#e5dfd2"],["grigio","Grigio tigrato","#8b8f96"]],["poses"]:["seduto","in_piedi"]}),["cane"]:({["label"]:"Cane",["variants"]:[["cucciolo","Cucciolo caramello","#b8793f"],["nero","Nero focato","#3a3330"],["bianco","Bianco","#e2dbcc"]],["poses"]:["seduto","in_piedi"]}),["volpe"]:({["label"]:"Volpe",["variants"]:[["rossa","Rossa","#c05a2a"],["argento","Argentata","#7c8290"]],["poses"]:["seduto","accovacciato"]}),["gufo"]:({["label"]:"Gufo",["variants"]:[["comune","Comune","#8a6a45"],["neve","Nevato","#d9d3c4"]],["poses"]:["posato","ali"]}),["coniglio"]:({["label"]:"Coniglio",["variants"]:[["grigio","Grigio","#a8a29a"],["bianco","Bianco","#e6e1d6"],["marrone","Marrone","#8b6a4c"]],["poses"]:["seduto","in_piedi"]}),["corvo"]:({["label"]:"Corvo",["variants"]:[["nero","Nero","#2b2b38"],["blu","Blu notte","#2f3f5e"]],["poses"]:["posato","ali"]}),["tartaruga"]:({["label"]:"Tartaruga",["variants"]:[["verde","Verde","#5d7a3a"],["marrone","Terracotta","#8a6a3a"]],["poses"]:["cammina","ritirata"]}),["drago"]:({["label"]:"Piccolo drago",["variants"]:[["smeraldo","Smeraldo","#3f7a52"],["rubino","Rubino","#8a3a4a"],["ambra","Ambra","#b0823a"]],["poses"]:["seduto","ali"]})});
function _pal(variant_hex) {
return ramp(variant_hex);
}
function _eyes(c,x,y,scale=1.0,kind="round") {
if (pyTruth((pyEq(kind,"round")))) {
c.rect((x-1),(y-1),(x+1),(y+1),[250,246,240,255]);
c.rect(x,(y-1),(x+1),(y+1),[32,26,32,255]);
c.set(Math.trunc((x+1)),Math.trunc((y-1)),[255,255,255,255]);
} else {
if (pyTruth((pyEq(kind,"bird")))) {
c.rect((x-1),y,(x+1),(y+1),[246,238,210,255]);
c.set(Math.trunc(x),Math.trunc(y),[26,22,26,255]);
} else {
if (pyTruth((pyEq(kind,"lazy")))) {
c.hline(Math.trunc((x-1)),Math.trunc((x+1)),Math.trunc(y),[40,32,36,255]);
}
}
}
}
function draw_animal(kind,variant="",pose="",style="photo") {
let H1,H2,L1,L2,M,_lab,base,c,dark,fur,hexv,hx,i,info,k,markings,paint,px,tan,x,xx,yy;
c = new PixelCanvas(W,H);
info = pyDGet(ANIMALS,kind,pyGet(ANIMALS,"gatto"));
variant = pyOr(variant,()=>pyGet(pyGet(pyGet(info,"variants"),0),0));
hexv = pyGet(pyGet(pyGet(info,"variants"),0),2);
for (const __item6 of pyIter(pyGet(info,"variants"))) {
[k,_lab,hx] = __item6;
if (pyTruth((pyEq(k,variant)))) {
hexv = hx;
}
}
pose = pyOr(pose,()=>pyGet(pyGet(info,"poses"),0));
[L2,L1,M,H1,H2] = _pal(hexv);
dark = (pyTruth((!pyEq(style,"nes")))?[44,36,40,255]:[16,14,20,255]);
base = (GROUND-1);
if (pyTruth((pyEq(kind,"gatto")))) {
_cat(c,pose,L2,L1,M,H1,H2,base);
} else {
if (pyTruth((pyEq(kind,"cane")))) {
_dog(c,pose,L2,L1,M,H1,H2,base);
} else {
if (pyTruth((pyEq(kind,"volpe")))) {
_fox(c,pose,L2,L1,M,H1,H2,base);
} else {
if (pyTruth((pyEq(kind,"gufo")))) {
_owl(c,pose,L2,L1,M,H1,H2,base);
} else {
if (pyTruth((pyEq(kind,"coniglio")))) {
_rabbit(c,pose,L2,L1,M,H1,H2,base);
} else {
if (pyTruth((pyEq(kind,"corvo")))) {
_crow(c,pose,L2,L1,M,H1,H2,base);
} else {
if (pyTruth((pyEq(kind,"tartaruga")))) {
_turtle(c,pose,L2,L1,M,H1,H2,base);
} else {
if (pyTruth((pyEq(kind,"drago")))) {
_dragon(c,pose,L2,L1,M,H1,H2,base);
}
}
}
}
}
}
}
}
markings = new PixelCanvas(W,H);
if (pyTruth(pyAnd((pyEq(kind,"gatto")),()=>(pyIn(variant,["soriano","grigio"]))))) {
x = (CX-1);
if (pyTruth((pyEq(pose,"seduto")))) {
for (const __item7 of pyIter([[(x-8),(base-13)],[(x-4),(base-16)],[(x+1),(base-20)],[(x+4),(base-28)]])) {
[xx,yy] = __item7;
markings.line(xx,yy,(xx+2),(yy+3),L1,1);
}
} else {
for (const __item8 of pyIter([(x-6),(x-1),(x+4)])) {
xx = __item8;
markings.line(xx,(base-14),(xx+1),(base-8),L1,1);
}
}
}
if (pyTruth(pyAnd((pyEq(kind,"cane")),()=>(pyEq(variant,"nero"))))) {
tan = ramp("#ac744b");
if (pyTruth((pyEq(pose,"seduto")))) {
markings.rect(38,91,43,95,pyGet(tan,2));
markings.rect(44,79,49,83,pyGet(tan,2));
markings.hline(41,43,76,pyGet(tan,3));
} else {
for (const __item9 of pyIter([27,31,36,39])) {
xx = __item9;
markings.rect(xx,92,(xx+1),96,pyGet(tan,2));
}
markings.rect(44,76,49,80,pyGet(tan,2));
}
}
fur = [L2,L1,M,H1,H2];
for (const __item10 of pyIter(pyEnumerate(markings.buf))) {
[i,paint] = __item10;
if (pyTruth(pyAnd(pyGet(paint,3),()=>(pyIn(pyGet(c.buf,i),fur))))) {
pySet(c.buf,i,paint);
}
}
c.outline_all(dark);
if (pyTruth((pyEq(style,"nes")))) {
function q(v) {
v = Math.min(255,Math.max(0,Math.trunc((pyMul((v-128),1.2)+132))));
return Math.min(255,Math.max(0,(pyMul(Math.trunc(pyRound((v/42.5))),42)+21)));
}
for (const __item11 of pyIter(pyEnumerate(c.buf))) {
[i,px] = __item11;
if (pyTruth(pyGet(px,3))) {
pySet(c.buf,i,[q(pyGet(px,0)),q(pyGet(px,1)),q(pyGet(px,2)),pyGet(px,3)]);
}
}
}
return c;
}
function _cat(c,pose,L2,L1,M,H1,H2,base) {
let dx,hx,hy,pink,ruff,x;
x = (CX-1);
pink = [208,146,148,255];
ruff = [236,226,212,255];
if (pyTruth((pyEq(pose,"seduto")))) {
c.thick_curve([[(x-11),(base-2)],[(x-2),(base-2)],[(x+6),(base-4)]],M,2);
c.thick_curve([[(x-11),(base-2)],[(x-4),(base-2)]],H1,1);
c.ellipse((x-5),(base-8),7.5,7.0,M);
c.ellipse((x-6),(base-9),5.0,4.6,H1);
c.ellipse((x+2),(base-13),6.5,10.0,M);
c.ellipse((x+3),(base-13),4.6,8.4,H1);
c.ellipse((x+3),(base-9),3.6,5.4,ruff);
for (const __item12 of pyIter([1.0,5.0])) {
dx = __item12;
c.rect((x+dx),(base-11),((x+dx)+1.6),(base-2),M);
c.rect((x+dx),(base-11),((x+dx)+0.6),(base-2),H1);
c.ellipse(((x+dx)+0.8),(base-2.2),2.0,1.5,M);
}
[hx,hy] = [(x+6.0),(base-25.0)];
c.ellipse(hx,hy,5.6,4.9,M);
c.ellipse((hx-0.8),(hy-1.0),4.0,3.0,H1);
c.poly([[(hx-5.0),(hy-2.6)],[(hx-3.6),(hy-7.4)],[(hx-1.0),(hy-3.6)]],M);
c.poly([[(hx+0.6),(hy-3.8)],[(hx+3.6),(hy-7.2)],[(hx+4.6),(hy-2.4)]],M);
c.poly([[(hx-4.0),(hy-3.6)],[(hx-3.4),(hy-6.0)],[(hx-1.8),(hy-4.0)]],pink);
c.poly([[(hx+1.4),(hy-4.2)],[(hx+3.4),(hy-6.0)],[(hx+3.8),(hy-3.4)]],pink);
c.ellipse((hx+2.4),(hy+1.6),2.8,2.0,ruff);
_eyes(c,Math.trunc((hx+1.0)),Math.trunc((hy-0.2)));
c.set(Math.trunc((hx+4)),Math.trunc((hy+1)),pink);
c.set(Math.trunc((hx+4)),Math.trunc((hy+2)),[86,62,60,255]);
} else {
c.ellipse(x,(base-9),9.0,4.8,M);
c.ellipse((x-1),(base-10),7.0,3.4,H1);
c.ellipse((x+4),(base-8),4.0,3.0,ruff);
for (const __item13 of pyIter([(-7),(-3),2,6])) {
dx = __item13;
c.rect((x+dx),(base-6),((x+dx)+1.6),(base-1),M);
c.rect((x+dx),(base-6),((x+dx)+0.6),(base-1),H1);
c.ellipse(((x+dx)+0.8),(base-1.4),1.8,1.2,M);
}
c.thick_curve([[(x-8),(base-11)],[(x-13),(base-15)],[(x-13),(base-19)]],M,2);
c.thick_curve([[(x-13),(base-15)],[(x-13),(base-19)]],H1,1);
[hx,hy] = [(x+8.0),(base-14.0)];
c.ellipse(hx,hy,4.8,4.2,M);
c.ellipse((hx-0.8),(hy-0.8),3.2,2.6,H1);
c.poly([[(hx-4.0),(hy-2.4)],[(hx-2.6),(hy-6.6)],[(hx-0.4),(hy-3.4)]],M);
c.poly([[(hx+0.8),(hy-3.4)],[(hx+3.4),(hy-6.4)],[(hx+4.2),(hy-2.2)]],M);
c.poly([[(hx-3.2),(hy-3.2)],[(hx-2.6),(hy-5.4)],[(hx-1.2),(hy-3.6)]],pink);
c.poly([[(hx+1.6),(hy-3.6)],[(hx+3.2),(hy-5.4)],[(hx+3.6),(hy-3.2)]],pink);
_eyes(c,Math.trunc((hx+0.8)),Math.trunc((hy-0.4)));
c.set(Math.trunc((hx+4)),Math.trunc((hy+1)),pink);
c.hline(Math.trunc((hx+1)),Math.trunc((hx+4)),Math.trunc((hy+2)),[86,62,60,255]);
}
}
function _dog(c,pose,L2,L1,M,H1,H2,base) {
let dx,hx,hy,x;
x = (CX-3);
if (pyTruth((pyEq(pose,"seduto")))) {
c.ellipse(x,(base-8),9.0,7.5,M);
c.ellipse((x-2),(base-9),7.0,6.0,H1);
c.rect((x+5),(base-9),(x+9),(base-1),M);
c.rect((x+7),(base-9),(x+9),(base-1),L1);
c.ellipse((x+6),(base-2),3.2,1.8,M);
c.ellipse((x+9),(base-2),3.0,1.7,M);
c.thick_curve([[(x-7),(base-4)],[(x-11),(base-9)],[(x-10),(base-13)]],M,2);
[hx,hy] = [(x+7.5),(base-17.0)];
c.ellipse(hx,hy,6.0,5.2,M);
c.ellipse((hx-1.0),(hy-1.2),4.0,3.2,H1);
c.ellipse((hx+4.4),(hy+1.4),3.2,2.6,M);
c.ellipse((hx+5.4),(hy+0.6),2.2,1.6,H1);
c.ellipse((hx-4.2),(hy+1.4),2.6,4.4,L1);
c.ellipse((hx+2.0),(hy-4.6),2.2,2.0,L1);
_eyes(c,Math.trunc((hx+1.6)),Math.trunc((hy-0.4)));
c.rect((hx+6.4),(hy+1.6),(hx+8.4),(hy+2.6),[34,30,34,255]);
c.set(Math.trunc((hx+7.4)),Math.trunc((hy+1.4)),[240,236,230,255]);
c.hline(Math.trunc((hx+5)),Math.trunc((hx+8)),Math.trunc((hy+4)),[140,68,68,255]);
} else {
c.ellipse(x,(base-11),9.0,4.6,M);
c.ellipse((x-1),(base-12),7.4,3.4,H1);
for (const __item14 of pyIter([(-6),(-2),3,6])) {
dx = __item14;
c.rect((x+dx),(base-8),((x+dx)+1),(base-1),M);
c.rect(((x+dx)-0.6),(base-2),((x+dx)+1.8),(base-1),L1);
}
c.thick_curve([[(x-8),(base-13)],[(x-12),(base-17)],[(x-11),(base-20)]],M,2);
[hx,hy] = [(x+8.0),(base-16.0)];
c.ellipse(hx,hy,5.4,4.6,M);
c.ellipse((hx+3.6),(hy+1.6),3.0,2.4,M);
c.ellipse((hx-4.0),(hy+1.0),2.4,4.0,L1);
_eyes(c,Math.trunc((hx+1.4)),Math.trunc((hy-0.6)));
c.rect((hx+5.4),(hy+1.6),(hx+7.2),(hy+2.6),[34,30,34,255]);
}
}
function _fox(c,pose,L2,L1,M,H1,H2,base) {
let cream,hx,hy,x;
cream = [238,226,206,255];
x = (CX-2);
if (pyTruth((pyEq(pose,"accovacciato")))) {
c.ellipse(x,(base-5),10.0,5.2,M);
c.ellipse((x-1),(base-6),8.0,3.6,H1);
c.ellipse((x+6),(base-4),4.0,2.6,cream);
c.thick_curve([[(x-9),(base-6)],[(x-14),(base-8)],[(x-15),(base-11)]],M,3);
c.thick_curve([[(x-14),(base-8)],[(x-15),(base-11)]],cream,2);
[hx,hy] = [(x+6.0),(base-9.0)];
c.ellipse(hx,hy,4.6,4.0,M);
c.poly([[(hx-3.6),(hy-2.4)],[(hx-2.4),(hy-7.0)],[(hx-0.2),(hy-3.2)]],M);
c.poly([[(hx+0.8),(hy-3.4)],[(hx+3.4),(hy-6.6)],[(hx+4.0),(hy-2.2)]],M);
c.ellipse((hx+3.0),(hy+1.6),3.0,2.0,cream);
_eyes(c,Math.trunc((hx+0.6)),Math.trunc(hy));
c.rect((hx+5.0),(hy+1.0),(hx+6.0),(hy+1.6),[34,30,34,255]);
} else {
c.ellipse(x,(base-8),8.0,6.4,M);
c.ellipse((x-1),(base-9),6.4,5.0,H1);
c.ellipse((x+3),(base-6),5.0,4.4,cream);
c.rect((x+4),(base-6),(x+7),(base-1),M);
c.ellipse((x+5),(base-2),2.6,1.6,[44,36,40,255]);
c.thick_curve([[(x-7),(base-10)],[(x-12),(base-12)],[(x-14),(base-16)],[(x-12),(base-18)]],M,3);
c.thick_curve([[(x-12),(base-12)],[(x-14),(base-16)],[(x-12),(base-18)]],cream,2);
[hx,hy] = [(x+5.0),(base-15.0)];
c.ellipse(hx,hy,5.0,4.2,M);
c.poly([[(hx-4.0),(hy-2.6)],[(hx-2.8),(hy-7.4)],[(hx-0.4),(hy-3.4)]],M);
c.poly([[(hx+1.0),(hy-3.6)],[(hx+3.8),(hy-7.0)],[(hx+4.4),(hy-2.4)]],M);
c.poly([[(hx-3.2),(hy-3.4)],[(hx-2.6),(hy-6.0)],[(hx-1.4),(hy-3.8)]],[206,140,132,255]);
c.poly([[(hx+2.0),(hy-3.8)],[(hx+3.4),(hy-5.8)],[(hx+3.8),(hy-3.4)]],[206,140,132,255]);
c.ellipse((hx+3.4),(hy+1.8),3.2,2.2,cream);
_eyes(c,Math.trunc((hx+0.8)),Math.trunc(hy));
c.rect((hx+5.6),(hy+1.2),(hx+6.8),(hy+1.8),[34,30,34,255]);
c.rect((x+4),(base-3),(x+7),(base-1),[56,44,48,255]);
}
}
function _owl(c,pose,L2,L1,M,H1,H2,base) {
let belly,ex,side,x,xx,y;
x = CX;
belly = [232,220,198,255];
if (pyTruth((pyEq(pose,"ali")))) {
c.poly([[(x-9),(base-14)],[(x-16),(base-6)],[(x-8),(base-4)]],L1);
c.poly([[(x+9),(base-14)],[(x+16),(base-6)],[(x+8),(base-4)]],L1);
}
c.ellipse(x,(base-10),9.0,9.4,M);
c.ellipse(x,(base-8),6.4,7.0,belly);
for (const __item15 of pyIter(pyRange(Math.trunc((base-14)),Math.trunc((base-2)),2))) {
y = __item15;
for (const __item16 of pyIter(pyRange(Math.trunc((x-5)),Math.trunc((x+6)),2))) {
xx = __item16;
c.set((xx+pyMod(y,2)),y,L1);
}
}
c.ellipse(x,(base-19),8.0,6.4,M);
c.poly([[(x-7.4),(base-22)],[(x-6.0),(base-27.4)],[(x-3.2),(base-23)]],M);
c.poly([[(x+3.2),(base-23)],[(x+6.0),(base-27.4)],[(x+7.4),(base-22)]],M);
for (const __item17 of pyIter([(-1),1])) {
side = __item17;
ex = (x+pyMul(side,3.4));
c.ellipse(ex,(base-20),3.2,3.0,[248,244,232,255]);
c.ellipse(ex,(base-20),1.6,1.6,[32,26,30,255]);
c.set(Math.trunc((ex+0.4)),Math.trunc((base-21)),[255,255,255,255]);
(pyTruth(false)?c.ellipse(ex,(base-20.2),3.4,3.2,[0,0,0,0]):null);
}
c.poly([[(x-1.4),(base-18)],[(x+1.4),(base-18)],[x,(base-15.4)]],[218,160,62,255]);
c.hline(Math.trunc((x-3)),Math.trunc((x+3)),Math.trunc((base-25)),L1);
for (const __item18 of pyIter([(-1),1])) {
side = __item18;
c.poly([[(x+pyMul(side,3)),(base-1)],[(x+pyMul(side,6)),(base-1)],[(x+pyMul(side,6.4)),(base-2)]],[218,160,62,255]);
}
}
function _rabbit(c,pose,L2,L1,M,H1,H2,base) {
let hx,hy,side,x;
x = (CX-1);
if (pyTruth((pyEq(pose,"in_piedi")))) {
c.ellipse(x,(base-8),6.4,7.4,M);
c.ellipse((x-0.6),(base-9),4.8,5.6,H1);
c.ellipse((x-4.4),(base-3),3.6,2.4,M);
c.ellipse((x+4.0),(base-3),3.2,2.2,M);
c.ellipse((x+4.6),(base-6),2.6,3.2,M);
[hx,hy] = [(x+1.0),(base-16.0)];
c.ellipse(hx,hy,4.8,4.4,M);
for (const __item19 of pyIter([(-1),1])) {
side = __item19;
c.ellipse((hx+pyMul(side,2.2)),(hy-6.4),1.7,5.2,M);
c.ellipse((hx+pyMul(side,2.2)),(hy-6.4),0.9,3.8,[212,158,158,255]);
}
_eyes(c,Math.trunc((hx+0.6)),Math.trunc((hy-0.4)));
c.set(Math.trunc((hx+3.4)),Math.trunc((hy+1.4)),[212,138,140,255]);
c.hline(Math.trunc((hx+2)),Math.trunc((hx+4)),Math.trunc((hy+2.4)),[240,236,230,255]);
} else {
c.ellipse(x,(base-6),7.4,5.6,M);
c.ellipse((x-0.8),(base-7),5.6,4.2,H1);
c.ellipse((x-5.0),(base-2),3.0,1.8,M);
[hx,hy] = [(x+5.0),(base-10.0)];
c.ellipse(hx,hy,4.4,4.0,M);
c.ellipse((hx+2.6),(hy+1.2),2.4,1.8,H1);
for (const __item20 of pyIter([(-1),1])) {
side = __item20;
c.ellipse(((hx+pyMul(side,1.8))-0.4),(hy-5.8),1.6,4.6,M);
c.ellipse(((hx+pyMul(side,1.8))-0.4),(hy-5.8),0.8,3.2,[212,158,158,255]);
}
_eyes(c,Math.trunc((hx+1.0)),Math.trunc((hy-0.6)));
c.set(Math.trunc((hx+3.6)),Math.trunc((hy+1.2)),[212,138,140,255]);
c.ellipse((x-7.4),(base-5),2.2,2.0,H1);
}
}
function _crow(c,pose,L2,L1,M,H1,H2,base) {
let beak,side,x;
x = CX;
beak = [226,176,66,255];
if (pyTruth((pyEq(pose,"ali")))) {
c.poly([[(x-6),(base-14)],[(x-18),(base-20)],[(x-12),(base-6)],[(x-4),(base-8)]],L1);
c.poly([[(x+4),(base-13)],[(x+15),(base-18)],[(x+10),(base-5)]],H1);
}
c.ellipse(x,(base-11),5.6,7.4,M);
c.ellipse((x-0.6),(base-12),3.6,5.2,H1);
c.poly([[(x-5),(base-6)],[(x-9),(base-1)],[(x-1),(base-2)]],L1);
c.ellipse((x+1),(base-19),4.0,3.8,M);
c.poly([[(x+4.2),(base-19.6)],[(x+9.4),(base-18.2)],[(x+4.2),(base-17)]],beak);
c.poly([[(x+4.2),(base-19.6)],[(x+9.4),(base-18.2)],[(x+4.2),(base-18.6)]],[186,138,48,255]);
_eyes(c,Math.trunc((x+2.6)),Math.trunc((base-20)),undefined,"bird");
for (const __item21 of pyIter([(-1),1])) {
side = __item21;
c.rect(((x+pyMul(side,1.6))-0.5),(base-2),((x+pyMul(side,1.6))+0.5),(base-1),beak);
}
}
function _turtle(c,pose,L2,L1,M,H1,H2,base) {
let i,rim,side,skin,skin_l,x;
x = CX;
rim = ramp("#a88b52");
skin = [156,146,104,255];
skin_l = [176,166,122,255];
if (pyTruth((pyEq(pose,"ritirata")))) {
c.ellipse(x,(base-7),11.5,6.8,M);
c.ellipse(x,(base-8),9.6,5.2,H1);
for (const __item22 of pyIter(pyRange((-2),3))) {
i = __item22;
c.ellipse((x+pyMul(i,3.6)),(base-8),1.8,1.5,L1);
c.ellipse((x+pyMul(i,3.6)),(base-8.4),1.0,0.8,M);
}
c.hline(Math.trunc((x-10)),Math.trunc((x+10)),Math.trunc((base-3)),pyGet(rim,1));
c.ellipse(x,(base-7),6.0,2.6,L2);
return null;
}
for (const __item23 of pyIter([(-1),1])) {
side = __item23;
c.ellipse((x+pyMul(side,8.4)),(base-3),3.6,2.8,skin);
c.rect(((x+pyMul(side,8.4))-1),(base-3),((x+pyMul(side,8.4))+1),(base-1),skin);
}
c.ellipse((x-13.4),(base-3),2.6,2.0,skin);
c.ellipse(x,(base-7),10.0,6.2,pyGet(rim,2));
c.ellipse(x,(base-8),8.6,5.0,M);
c.ellipse((x-1),(base-9),6.6,3.4,H1);
for (const __item24 of pyIter(pyRange((-2),3))) {
i = __item24;
c.ellipse((x+pyMul(i,3.2)),(base-8.6),1.9,1.6,L1);
c.ellipse((x+pyMul(i,3.2)),(base-9.0),1.0,0.8,M);
}
c.rect((x+8),(base-7),(x+11),(base-4),skin);
c.ellipse((x+12.6),(base-8),3.6,2.9,skin_l);
c.ellipse((x+11.6),(base-9),2.4,1.8,skin);
_eyes(c,Math.trunc((x+13.6)),Math.trunc((base-8.6)),undefined,"lazy");
c.set(Math.trunc((x+15.4)),Math.trunc((base-7.4)),[100,92,68,255]);
c.hline(Math.trunc((x+10)),Math.trunc((x+14)),Math.trunc((base-5.4)),[132,122,88,255]);
}
function _dragon(c,pose,L2,L1,M,H1,H2,base) {
let belly,dx,horn,hx,hy,i,wing,x;
x = (CX-2);
wing = ramp("#c2a06a");
belly = [234,216,172,255];
horn = [224,214,186,255];
c.thick_curve([[(x-5),(base-5)],[(x-11),(base-7)],[(x-15),(base-10)],[(x-16),(base-13)]],M,3);
c.poly([[(x-19),(base-15)],[(x-14),(base-13)],[(x-16),(base-10)]],[206,130,96,255]);
if (pyTruth((pyEq(pose,"ali")))) {
c.poly([[(x-2),(base-15)],[(x-9),(base-26)],[(x-14),(base-20)],[(x-12),(base-11)],[(x-4),(base-10)]],pyGet(wing,2));
c.poly([[(x-3),(base-15)],[(x-8),(base-23)],[(x-10),(base-15)]],pyGet(wing,3));
c.thick_curve([[(x-2),(base-15)],[(x-12),(base-11)]],pyGet(wing,1),1);
}
c.ellipse(x,(base-8),7.6,7.0,M);
c.ellipse((x+1.6),(base-7.6),5.0,5.2,belly);
c.ellipse((x-3.4),(base-5),4.4,4.2,L1);
for (const __item25 of pyIter([(-3.6),2.6])) {
dx = __item25;
c.ellipse((x+dx),(base-2.2),3.4,2.2,M);
c.rect(((x+dx)-2),(base-2),((x+dx)+2),(base-1),[146,122,84,255]);
for (const __item26 of pyIter(pyRange(3))) {
i = __item26;
c.set(Math.trunc((((x+dx)-2)+pyMul(i,2))),Math.trunc((base-1)),horn);
}
}
c.rect((x+4),(base-8),(x+6),(base-3),M);
c.rect((x+5),(base-8),(x+6),(base-3),L1);
c.rect((x+3),(base-15),(x+7),(base-9),M);
[hx,hy] = [(x+6.0),(base-17.0)];
c.ellipse(hx,hy,5.0,4.4,M);
c.ellipse((hx+0.6),(hy-0.6),3.2,2.8,H1);
c.poly([[(hx+3.2),(hy-0.4)],[(hx+8.2),(hy+1.2)],[(hx+8.4),(hy+3.4)],[(hx+3.6),(hy+2.6)]],M);
c.poly([[(hx+5.0),(hy+1.6)],[(hx+8.2),(hy+2.4)],[(hx+5.2),(hy+3.0)]],belly);
c.poly([[(hx-2.4),(hy-3.4)],[(hx-3.6),(hy-8.0)],[(hx+0.4),(hy-4.2)]],horn);
c.poly([[(hx+2.8),(hy-3.6)],[(hx+4.0),(hy-7.6)],[(hx+5.0),(hy-3.0)]],horn);
_eyes(c,Math.trunc((hx+2.4)),Math.trunc((hy-0.6)));
c.set(Math.trunc((hx+7.6)),Math.trunc((hy+1.6)),[58,46,48,255]);
for (const __item27 of pyIter(pyRange(3))) {
i = __item27;
c.poly([[((x-3.4)+pyMul(i,3.0)),(base-14.6)],[((x-2.0)+pyMul(i,3.0)),(base-18.0)],[((x-0.6)+pyMul(i,3.0)),(base-14.2)]],horn);
}
c.poly([[(hx-3.0),(hy+1.0)],[(hx-6.0),(hy+3.0)],[(hx-2.4),(hy+3.4)]],[206,130,96,255]);
}
function default_animal(kind="gatto") {
let info;
info = pyGet(ANIMALS,kind);
return ({["animal"]:kind,["variant"]:pyGet(pyGet(pyGet(info,"variants"),0),0),["pose"]:pyGet(pyGet(info,"poses"),0)});
}

function equipment_color(table,key,fallback) {
let _label,hx,ident;
for (const __item28 of pyIter(table)) {
[ident,_label,hx] = __item28;
if (pyTruth((pyEq(ident,key)))) {
return ramp(hx);
}
}
return ramp(fallback);
}
function plate(c,x,y,w,h,dark,mid,light) {
c.poly([[(x+1),y],[((x+w)-1),y],[(x+w),(y+1)],[(x+w),((y+h)-1)],[((x+w)-1),(y+h)],[(x+1),(y+h)],[x,((y+h)-1)],[x,(y+1)]],dark);
c.rect((x+1),(y+1),((x+w)-1),((y+h)-1),mid);
c.hline((x+1),((x+w)-2),(y+1),light);
c.vline((x+1),(y+1),((y+h)-2),light);
}
function paint_equipment(c,s,stage,pose) {
let ac,acc,ad,ah,al,am,anchor,base,bc,bd,bh,bl,bm,deep,hat,hc,hd,held,hh,hl,hm,ink,left_cuff,light,mc,md,mh,ml,mm,right_cuff,sd,sh,shadow,shine,shoulder_y,sk,sl,sm,top,xx,yy;
ink = [14,20,30,255];
[deep,shadow,base,light,shine] = equipment_color(FABRIC_COLORS,pyGet(s,"inner_color"),"#4bcabb");
[ad,am,ac,al,ah] = equipment_color(FABRIC_COLORS,pyGet(s,"accessory_color"),"#8b9aa5");
[bd,bm,bc,bl,bh] = equipment_color(LEATHER_COLORS,pyGet(s,"belt_color"),"#232b36");
[md,mm,mc,ml,mh] = equipment_color(METAL_COLORS,"argento","#a4b4c1");
[sd,sm,sk,sl,sh] = equipment_color(SKIN_TONES,pyGet(s,"skin"),"#eec4a4");
top = pyGet(s,"top");
acc = pyGet(s,"accessory");
if (pyTruth((pyEq(acc,"collana")))) {
[ad,am,ac,al,ah] = equipment_color(METAL_COLORS,pyGet(s,"accessory_color"),"#b9bcc2");
}
if (pyTruth((pyEq(stage,"back")))) {
if (pyTruth((pyIn(acc,["zaino","exopack"])))) {
plate(c,22,34,20,17,ink,am,al);
if (pyTruth((pyEq(acc,"exopack")))) {
plate(c,40,34,5,14,ink,[39,54,67,255],[91,116,131,255]);
c.vline(43,26,34,ink);
c.set(43,25,light);
c.set(44,25,shine);
c.vline(43,37,40,light);
c.vline(43,43,46,base);
}
}
if (pyTruth((pyEq(acc,"tracolla")))) {
plate(c,40,43,7,8,ink,am,al);
}
return null;
}
shoulder_y = 35;
[left_cuff,right_cuff] = pyGet([[[20,44],[42,44]],[[21,44],[47,40]],[[17,33],[45,33]],[[26,39],[36,39]]],pose);
if (pyTruth((pyIn(top,["cyber_jacket","field_suit","tech_vest"])))) {
if (pyTruth((!pyEq(pose,3)))) {
c.poly([[29,36],[35,36],[36,40],[35,45],[28,45],[28,40]],ink);
c.rect(30,37,34,44,shadow);
c.vline(31,38,44,base);
c.set(33,38,light);
}
if (pyTruth((pyEq(top,"cyber_jacket")))) {
c.line(27,36,29,39,[116,132,145,255]);
c.line(37,36,35,39,[67,83,101,255]);
c.line(27,37,27,42,ink);
c.line(36,39,36,45,ink);
c.vline(37,41,43,base);
c.hline(23,26,36,light);
c.hline(38,41,36,base);
c.hline(24,26,37,shadow);
c.hline(38,40,37,shadow);
c.rect(24,41,26,42,ink);
c.hline(24,25,41,light);
c.set(35,44,mc);
c.set(36,44,ml);
} else {
if (pyTruth((pyEq(top,"field_suit")))) {
c.poly([[26,36],[29,38],[35,38],[38,36],[39,41],[36,44],[27,44],[24,41]],ink);
c.poly([[27,37],[30,39],[34,39],[37,37],[37,41],[35,42],[28,42],[26,41]],[67,83,99,255]);
c.line(27,38,30,40,[125,148,156,255]);
c.line(34,40,36,38,[96,119,133,255]);
c.hline(29,34,42,base);
c.hline(30,33,43,light);
plate(c,22,35,5,3,ink,[62,80,95,255],[119,142,155,255]);
plate(c,38,35,4,3,ink,[47,64,82,255],[91,115,132,255]);
c.hline(23,26,36,light);
c.hline(39,41,36,base);
} else {
c.poly([[26,35],[29,37],[34,37],[37,35],[39,38],[38,46],[25,46],[24,38]],ink);
c.poly([[27,36],[29,39],[34,39],[36,36],[37,39],[36,45],[27,45],[26,39]],[54,66,81,255]);
c.vline(31,39,44,[119,137,144,255]);
c.vline(32,39,44,ink);
plate(c,26,40,4,3,ink,[83,99,111,255],[130,149,157,255]);
plate(c,34,40,3,3,ink,[67,84,103,255],[107,133,145,255]);
c.hline(26,29,37,light);
c.set(35,38,shine);
}
}
for (const __item29 of pyIter([left_cuff,right_cuff])) {
anchor = __item29;
[xx,yy] = anchor;
if (pyTruth(c.alpha(xx,yy))) {
c.hline(xx,(xx+2),yy,ink);
c.hline(xx,(xx+2),(yy-1),base);
c.set(xx,(yy-1),light);
}
}
if (pyTruth((!pyEq(pose,3)))) {
c.vline(33,40,44,ink);
}
}
if (pyTruth((pyIn(top,["cappotto","trench"])))) {
c.hline(24,27,35,light);
c.hline(37,40,35,base);
c.line(29,37,31,41,ink);
c.vline(32,42,48,ink);
c.rect(35,39,38,40,ink);
c.hline(35,37,39,light);
c.set(29,47,mc);
c.set(29,50,mc);
}
if (pyTruth(pyAnd((pyIn(pyGet(s,"bottom"),["cargo","jeans","chino","shorts"])),()=>(!pyIn(top,["cappotto","trench"]))))) {
c.hline(26,37,47,bd);
c.hline(27,36,46,bc);
c.rect(30,46,33,47,ink);
c.hline(31,32,46,ml);
}
if (pyTruth(pyAnd((pyEq(pyGet(s,"bottom"),"cargo")),()=>(!pyIn(top,["cappotto","trench"]))))) {
for (const __item30 of pyIter([25,36])) {
xx = __item30;
plate(c,xx,49,3,4,ink,[43,59,76,255],[88,106,117,255]);
c.hline((xx+1),(xx+2),50,base);
}
for (const __item31 of pyIter([26,35])) {
xx = __item31;
c.rect(xx,54,(xx+2),55,ink);
c.hline(xx,(xx+2),54,[84,100,114,255]);
}
}
if (pyTruth((pyEq(pyGet(s,"shoes"),"tech_boots")))) {
for (const __item32 of pyIter([25,35])) {
xx = __item32;
c.hline(xx,(xx+3),57,ink);
c.hline(xx,(xx+3),56,base);
c.hline(xx,(xx+3),60,[83,105,120,255]);
c.set((xx+1),58,[138,155,160,255]);
}
}
if (pyTruth((pyIn(acc,["zaino","exopack"])))) {
c.line(25,35,27,44,ink,2);
c.line(37,35,36,44,ink,2);
c.line(25,35,27,43,ac);
c.line(37,35,36,43,al);
c.set(27,42,ml);
c.set(36,42,mc);
} else {
if (pyTruth((pyEq(acc,"tracolla")))) {
c.line(24,35,40,47,ink,3);
c.line(24,35,40,47,ac);
c.set(36,44,ml);
} else {
if (pyTruth((pyEq(acc,"collana")))) {
c.line(28,36,31,39,al);
c.line(35,36,32,39,ac);
c.set(31,40,ac);
c.set(32,40,ah);
}
}
}
if (pyTruth(pyAnd(!pyTruth(pyDGet(s,"blink")),()=>(!pyIn(pyGet(s,"expression"),["sorriso","entusiasta"]))))) {
if (pyTruth((pyEq(pyGet(s,"eye_shape"),"mandorla")))) {
c.hline(26,28,28,ink);
c.hline(35,37,28,ink);
} else {
if (pyTruth((pyEq(pyGet(s,"eye_shape"),"tondi")))) {
c.set(27,27,[250,239,216,255]);
c.set(36,27,[250,239,216,255]);
c.set(27,28,ink);
c.set(36,28,ink);
}
}
}
if (pyTruth(pyAnd((pyEq(pyGet(s,"mouth"),"piene")),()=>pyAnd((pyEq(pyGet(s,"beard"),"none")),()=>(pyIn(pyGet(s,"expression"),["neutra","seria","curiosa"])))))) {
c.hline(31,33,33,[141,71,70,255]);
c.set(32,34,[196,118,105,255]);
}
hat = pyGet(s,"hat");
if (pyTruth((pyEq(hat,"cuffie")))) {
[hd,hm,hc,hl,hh] = equipment_color(FABRIC_COLORS,pyGet(s,"hat_color"),"#263143");
c.line(22,24,24,17,ink,2);
c.line(24,17,39,17,ink,2);
c.line(39,17,41,24,ink,2);
c.hline(25,38,16,hl);
plate(c,20,25,4,7,ink,hm,hl);
plate(c,40,25,4,7,ink,hc,hh);
c.vline(21,27,29,light);
c.vline(42,27,29,base);
} else {
if (pyTruth((pyEq(hat,"berretto")))) {
[hd,hm,hc,hl,hh] = equipment_color(FABRIC_COLORS,pyGet(s,"hat_color"),"#263143");
c.poly([[22,22],[24,17],[28,15],[36,15],[40,18],[42,23],[39,25],[24,25]],ink);
c.poly([[23,21],[26,17],[35,16],[39,19],[40,22],[26,22]],hc);
c.hline(26,36,17,hl);
c.hline(22,40,23,hm);
c.hline(27,42,24,ink);
c.hline(28,41,23,hc);
c.set(35,19,light);
} else {
if (pyTruth((pyEq(hat,"corona_alloro")))) {
for (const __item33 of pyIter([[23,21],[24,19],[26,18],[28,18],[35,18],[37,18],[39,19],[40,21]])) {
[xx,yy] = __item33;
c.line(xx,yy,(xx+1),(yy+1),[51,74,39,255]);
c.set(xx,yy,[139,161,80,255]);
}
}
}
}
if (pyTruth((pyEq(pyGet(s,"glasses"),"visore")))) {
c.hline(23,40,27,ink);
c.hline(24,39,30,ink);
c.rect(24,28,39,29,shadow);
c.hline(25,31,28,light);
c.hline(34,38,28,base);
c.set(25,29,shine);
c.set(32,28,ink);
c.rect(40,27,42,29,[59,76,92,255]);
c.set(41,27,light);
}
held = pyGet(s,"held");
if (pyTruth((!pyEq(held,"none")))) {
if (pyTruth((pyEq(held,"libro")))) {
c.poly([[25,38],[30,37],[32,39],[34,37],[39,38],[39,46],[34,45],[32,46],[30,45],[25,46]],ink);
c.poly([[26,39],[30,38],[31,40],[31,45],[27,44],[26,45]],[234,218,179,255]);
c.poly([[33,40],[35,38],[38,39],[38,45],[34,44],[33,45]],[205,186,148,255]);
c.vline(32,39,45,[100,65,55,255]);
c.hline(27,29,40,[160,145,119,255]);
c.hline(34,36,41,[145,132,108,255]);
} else {
if (pyTruth((pyEq(held,"tablet")))) {
plate(c,26,37,12,9,ink,[53,71,89,255],[134,156,166,255]);
c.rect(28,39,36,43,[21,46,59,255]);
c.hline(29,34,40,light);
c.hline(29,32,42,base);
c.set(37,42,mc);
} else {
if (pyTruth((pyEq(held,"pergamena")))) {
c.rect(26,38,38,45,ink);
c.rect(27,39,37,44,[224,201,153,255]);
c.hline(28,35,40,[146,123,87,255]);
c.hline(28,34,42,[171,143,105,255]);
c.rect(25,38,27,39,[245,226,184,255]);
c.rect(37,44,39,45,[245,226,184,255]);
} else {
if (pyTruth((pyEq(held,"cetra")))) {
c.poly([[26,36],[29,35],[29,39],[35,39],[35,35],[38,36],[38,45],[35,47],[29,47],[26,45]],ink);
c.line(27,37,28,44,[185,132,58,255],2);
c.line(37,37,36,44,[232,184,91,255],2);
c.hline(28,36,36,[242,202,120,255]);
c.hline(28,36,44,[184,135,62,255],2);
for (const __item34 of pyIter([30,32,34])) {
xx = __item34;
c.vline(xx,37,44,[239,211,160,255]);
}
} else {
plate(c,26,42,12,4,ink,[47,68,87,255],[97,127,145,255]);
c.hline(28,36,42,light);
c.hline(29,35,40,base);
c.poly([[32,32],[36,36],[32,40],[28,36]],shadow);
c.line(32,32,36,36,shine);
c.line(36,36,32,40,base);
c.line(32,40,28,36,base);
c.line(28,36,32,32,light);
c.set(32,35,shine);
c.set(31,36,light);
}
}
}
}
c.set(25,42,sk);
c.set(25,43,sl);
c.set(39,42,sk);
c.set(39,43,sl);
}
}
function native_over(top,bottom) {
let a,b,n;
a = pyGet(top,3);
b = pyGet(bottom,3);
if (pyTruth((pyEq(a,255)))) {
return top;
}
if (pyTruth((pyEq(a,0)))) {
return bottom;
}
n = (pyMul(a,255)+pyMul(b,(255-a)));
return [Math.floor(((pyMul(pyMul(pyGet(top,0),a),255)+pyMul(pyMul(pyGet(bottom,0),b),(255-a)))+Math.floor(n/2))/n),Math.floor(((pyMul(pyMul(pyGet(top,1),a),255)+pyMul(pyMul(pyGet(bottom,1),b),(255-a)))+Math.floor(n/2))/n),Math.floor(((pyMul(pyMul(pyGet(top,2),a),255)+pyMul(pyMul(pyGet(bottom,2),b),(255-a)))+Math.floor(n/2))/n),Math.floor((n+127)/255)];
}
/* Independent MIT renderer for the pinned, licensed LPC pose atlases.
 * No generator code / game runtime / CDN. Indexed pixels decode synchronously.
 * Palettes preserve the artists' six-shade ramps; equipment geometry is shared.
 */
const L=PORTABLE.lpc,atlasCache=new Map(),recolorCache=new Map();
const default_spec=()=>({...PORTABLE.catalogue.defaults.character});
function compatible(raw){const s={...raw};for(const[field,table]of Object.entries(L.compatibility)){const allowed=table[s[field]];if(allowed&&!allowed.includes(s.build))s[field]=field==='top'?'cyber_jacket':'gonna';}return s;}
const lpcRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
function targetPalette(material,color){let name=(L.maps[material]||L.maps.cloth)[color]||color;if(material==='body'&&color==='porcellana')name='porcelain';const pal=L.custom[material]?.[name]||L.palettes[material][name]||Object.values(L.palettes[material])[0];return pal.map(h=>[...lpcRGB(h),255]);}
function colorsFor(part,s){
 if(part==='body'||/^(head|face|nose)\//.test(part))return[['body',s.skin],['eye',s.eyes]];
 if(/^(hair|beard|brows)\//.test(part))return[['hair',s.hair_color]];
 if(/^(top|coat)\//.test(part))return[['cloth',s.top_color]];
 if(part.startsWith('bottom/'))return[['cloth',s.bottom_color]];
 if(part.startsWith('shoes/'))return[['cloth',s.shoes_color]];
 if(part.startsWith('hat/'))return[['cloth',s.hat_color]];
 if(part.startsWith('accessory/'))return[['cloth',s.accessory_color]];
 return[];
}
function getAtlas(id){
 if(atlasCache.has(id))return atlasCache.get(id);
 const src=L.atlases[id],bytes=Uint8Array.from(atob(src.r),c=>c.charCodeAt(0)),pixels=[];
 for(let i=0;i<bytes.length;i+=2)for(let n=0;n<bytes[i];n++)pixels.push(src.p[bytes[i+1]]);
 if(pixels.length!==16384)throw new Error('Atlante del personaggio incompleto.');
 atlasCache.set(id,pixels);return pixels;
}
function recolored(layer,pose,materials){
 const key=JSON.stringify([layer.id,pose,materials,layer.source_variant]);if(recolorCache.has(key))return recolorCache.get(key);
 const mapping=[];
 for(const[material,color]of materials){let base=L.bases[material];if(material==='cloth'&&L.palettes.cloth[layer.source_variant])base=layer.source_variant;const source=L.palettes[material][base].map(lpcRGB),dest=targetPalette(material,color);source.forEach((src,i)=>mapping.push([src,dest[i]]));}
 if(layer.id===L.trenchId){const dst=targetPalette('cloth',Object.fromEntries(materials).cloth||'nero');for(const[h,i]of[['#302732',0],['#5e5252',2],['#7e7068',3],['#867e7f',4]])mapping.push([lpcRGB(h),dst[i]]);}
 const src=getAtlas(layer.id),result=[];
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){let p=src[y*256+pose*64+x];if(p[3])for(const[a,b]of mapping)if(a.every((v,i)=>Math.abs(p[i]-v)<=1)){p=[b[0],b[1],b[2],p[3]];break;}result.push(p);}
 recolorCache.set(key,result);if(recolorCache.size>1024)recolorCache.delete(recolorCache.keys().next().value);return result;
}
function chosenParts(s){
 const frame=L.builds[s.build],headFrame=s.face==='ovale'?'female':'male',top=s.top,topPart=(['cappotto','trench'].includes(top)?'coat/':'top/')+(L.topBase[top]||top),bottom=s.bottom==='cargo'?'jeans':s.bottom,shoes=s.shoes==='tech_boots'?'stivaletti':s.shoes;
 const parts=[['body',frame],['head/'+L.faceParts[s.face],frame],[topPart,frame],['bottom/'+bottom,frame],['shoes/'+shoes,frame],['face/'+(s.blink?'closed':s.expression),headFrame]];
 if(s.brows!=='naturali')parts.push(['brows/'+s.brows,frame]);if(s.nose!=='piccolo')parts.push(['nose/'+s.nose,frame]);
 if(s.hair!=='calvo'&&!['cappuccio','berretto'].includes(s.hat))parts.push(['hair/'+s.hair,frame]);
 if(s.beard!=='none')parts.push(['beard/'+s.beard,frame]);
 if(['bandana','cappuccio'].includes(s.hat))parts.push(['hat/'+s.hat,frame]);
 if(['tondi','sole','spessi'].includes(s.glasses))parts.push(['glasses/'+s.glasses,frame]);
 if(s.accessory==='sciarpa')parts.push(['accessory/sciarpa',frame]);return parts;
}
function render(raw={},style='photo'){
 const s=compatible({...default_spec(),...raw});if(s.held!=='none')s.pose='libro';else if(s.pose==='libro')s.held='libro';const pose=L.poseIndex[s.pose];
 const c=new PixelCanvas(64,64);paint_equipment(c,s,'back',pose);
 const layers=[];for(const[part,frame]of chosenParts(s))for(const layer of L.parts[part].frames[frame])layers.push({z:layer.z,part,layer});layers.sort((a,b)=>a.z-b.z);
 for(const{part,layer}of layers){const pixels=recolored(layer,pose,colorsFor(part,s));for(let i=0;i<pixels.length;i++)if(pixels[i][3])c.buf[i]=pixels[i][3]===255?pixels[i]:native_over(pixels[i],c.buf[i]);}
 paint_equipment(c,s,'front',pose);for(let i=0;i<c.buf.length;i++){const p=c.buf[i];if(p[3]>0&&p[3]<255)c.buf[i]=p[3]>=128?[p[0],p[1],p[2],255]:[0,0,0,0];}return c;
}
function credit(raw={}){
 const s=compatible({...default_spec(),...raw}),keys=[...new Set(chosenParts(s).map(([part])=>part))];
 return 'PERSONAGGIO MODULARE LPC\nFonte: '+L.upstream+'\nRevisione: '+L.commit+'\n'+keys.map(k=>L.parts[k].creditText).join('\n')+'\nModifiche: selezione di quattro pose frontali, estrazione dei livelli, armonizzazione delle palette e composizione; equipaggiamento fantascientifico originale Casardi (CC0 1.0). Le licenze delle parti originali non sono sostituite. Nessun asset di Cyberpunk 2077 o ARK.\n';
}

return {render,draw_animal,default_spec,PixelCanvas,ramp,compatible,chosenParts,credit};
})();
