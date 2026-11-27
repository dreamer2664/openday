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
