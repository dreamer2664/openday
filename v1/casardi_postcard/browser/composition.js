/* Optional composition, shared authoring units: 600×400. No runtime network. */
globalThis.CasardiComposition=(()=>{
 'use strict';
 const round=v=>{const f=Math.floor(v),d=v-f;return d<.5?f:d>.5?f+1:f%2===0?f:f+1;};
 const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
 const defaults=()=>({actor:null,plaque:{theme:'originale',ornament:'none',position:'scene',track:'none'},stickers:[]});
 const records=()=>PORTABLE.stickerManifest.stickers;
 const prop=(o,k,d)=>Object.hasOwn(o,k)?o[k]:d;
 const int=(v,l,h)=>{if(!Number.isInteger(v)||v<l||v>h)throw new Error('Valore della composizione non valido.');return v;};
 function normalize(raw){
  if(raw==null)return defaults();if(typeof raw!=='object'||Array.isArray(raw))throw new Error('Composizione non valida.');
  const c=defaults(),a=raw.actor,p=Object.hasOwn(raw,'plaque')?raw.plaque:{},items=Object.hasOwn(raw,'stickers')?raw.stickers:[];if(!p||typeof p!=='object'||Array.isArray(p))throw new Error('Targhetta non valida.');if(a!=null&&(typeof a!=='object'||Array.isArray(a)))throw new Error('Posizione del personaggio non valida.');
  if(a!=null)c.actor={x:int(a.x,0,600),y:int(a.y,0,400),scale:int(prop(a,'scale',100),65,135)};
  for(const [key,allowed]of Object.entries({track:['none','classico','scienze_umane','musicale'],theme:['originale','notte','avorio','pergamena'],position:['scene','top-left','top-right','bottom-left','bottom-right'],ornament:['none',...Object.keys(records())]})){
   const value=Object.hasOwn(p,key)?p[key]:c.plaque[key];if(!allowed.includes(value))throw new Error('Targhetta non valida.');c.plaque[key]=value;
  }
  if(!Array.isArray(items)||items.length>6)throw new Error('Puoi aggiungere al massimo sei sticker.');
  c.stickers=items.map(s=>{if(!s||typeof s.id!=='string'||!Object.hasOwn(records(),s.id))throw new Error('Sticker non valido.');const rotation=int(prop(s,'rotation',0),-30,30);if(s.id==='logo_casardi'&&rotation)throw new Error('Il logo ufficiale mantiene l’orientamento originale.');return{id:s.id,x:int(prop(s,'x',500),0,600),y:int(prop(s,'y',75),0,400),size:int(prop(s,'size',80),36,132),rotation};});return c;
 }
 const ratios={gatto:.30,cane:.40,volpe:.36,gufo:.34,coniglio:.32,corvo:.30,tartaruga:.10,drago:.34};
 function actorGeometry(job,p,a,reference=1){
  const nes=job.mode==='nes',lay=(nes?PORTABLE.nes:PORTABLE.photo)[job.scene],u=nes?1:.2,c=normalize(job.composition),actor=c.actor;
  const bx=lay.char.x*u,by=lay.ground_y*u,base=Math.max(1,round(lay.char.h/p.h))*u,zoom=(actor?.scale??100)/100,sc=Math.max(1,round(base*zoom/u))*u;
  let x=actor?.x??bx,y=actor?.y??by,left=-p.anchor*sc,right=(p.w-p.anchor)*sc,top=-p.h*sc,companion=null;
  if(a&&job.companion){const offset=((nes?lay.comp.x:lay.companion.x)*u-bx)*sc/base,asc=Math.max(1,round(p.h*sc*ratios[job.companion.animal]/reference/u))*u;companion={offset,scale:asc,w:a.w*asc,h:a.h*asc};left=Math.min(left,offset-companion.w/2);right=Math.max(right,offset+companion.w/2);top=Math.min(top,-companion.h);}
  if(actor){x=clamp(x,12-left,588-right);y=clamp(y,12-top,388);}if(nes){x=round(x);y=round(y);}
  const character={x:x-p.anchor*sc,y:y-p.h*sc,w:p.w*sc,h:p.h*sc,scale:sc,cx:x,ground:y};
  if(companion)Object.assign(companion,{cx:x+companion.offset,ground:y,x:x+companion.offset-companion.w/2,y:y-companion.h});
  return{actor:{x,y,scale:actor?.scale??100},character,companion,group:{x:x+left,y:y+top,w:right-left,h:-top},recommended:{x:bx,y:by},manual:actor!==null};
 }
 function stickerGeometry(item){
  const r=records()[item.id],ratio=item.size/Math.max(...r.size),w=r.size[0]*ratio,h=r.size[1]*ratio,t=item.rotation*Math.PI/180,rw=Math.abs(w*Math.cos(t))+Math.abs(h*Math.sin(t)),rh=Math.abs(w*Math.sin(t))+Math.abs(h*Math.cos(t)),cx=clamp(item.x,10+rw/2,590-rw/2),cy=clamp(item.y,10+rh/2,390-rh/2);
  return{id:item.id,cx,cy,w,h,x:cx-rw/2,y:cy-rh/2,box_w:rw,box_h:rh,rotation:item.rotation,size:item.size};
 }
 const imageCache=new Map();
 function image(id,mode){const key=id+'/'+mode;if(imageCache.has(key))return imageCache.get(key);const promise=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Sticker incorporato non leggibile. Ripristina il file completo.'));im.src=PORTABLE.stickerImages[id][mode];});imageCache.set(key,promise);return promise;}
 const customPlaque=job=>{const p=normalize(job.composition).plaque;return p.theme!=='originale'||p.ornament!=='none'||p.position!=='scene'||p.track!=='none';};
 async function drawPlaque(card,job,zone){
  const p=normalize(job.composition).plaque,nes=job.mode==='nes',k=card.width/600,x=card.getContext('2d'),orn=p.ornament==='none'?null:await image(p.ornament,job.mode);
  const theme=p.theme==='originale'?(nes?'notte':'avorio'):p.theme;
  const colors={notte:{bg:'#151b32',ink:'#f5efd9',accent:'#f1c675',edge:'#65718d'},avorio:{bg:'#faf6e8',ink:'#202d42',accent:'#916b2f',edge:'#b8aa83'},pergamena:{bg:'#ecdbb3',ink:'#342d29',accent:'#6e5030',edge:'#b29763'}}[theme];
  const family=nes?'Pixel':'Cinzel',rows=[{t:'LICEO ALFREDO CASARDI',s:nes?8:14.2,f:family,a:nes?12:20},{t:'OPEN DAY 2026/27',s:nes?7:10.4,f:nes?'Pixel':'Garamond',a:nes?11:16},{t:'BARLETTA',s:nes?6:9,f:family,a:nes?10:15}];if(p.track!=='none')rows.push({t:({classico:'LICEO CLASSICO',scienze_umane:'SCIENZE UMANE',musicale:'LICEO MUSICALE'})[p.track],s:nes?6:8.6,f:nes?'Pixel':'Cinzel',a:nes?10:14});if(job.name)rows.push({t:job.name,s:nes?8:12,f:nes?'Pixel':'Garamond',a:nes?12:18});
  x.save();x.scale(k,k);for(const r of rows){x.font=r.s+'px "'+r.f+'"';while(x.measureText(r.t).width>232&&r.s>(nes?6:8)){r.s-=nes?1:.2;x.font=r.s+'px "'+r.f+'"';}}
  const tw=Math.ceil(Math.max(...rows.map(r=>{x.font=r.s+'px "'+r.f+'"';return x.measureText(r.t).width;}))),w=tw+20+(orn?56:0),h=Math.max(rows.reduce((s,r)=>s+r.a,0)+16,orn?76:0);
  const pos=p.position==='scene'?(zone.includes('right')?'top-right':zone==='bottom-left'?'bottom-left':'top-left'):p.position,bx=pos.includes('right')?580-w:20,by=pos.includes('bottom')?380-h:20;
  x.fillStyle='#090e1d';x.fillRect(bx+3,by+3,w,h);x.fillStyle=colors.edge;x.fillRect(bx,by,w,h);x.fillStyle=colors.bg;x.fillRect(bx+2,by+2,w-4,h-4);x.fillStyle=colors.accent;
  for(const xx of [bx+5,bx+w-17])for(const yy of [by+5,by+h-6])x.fillRect(xx,yy,12,1);
  if(orn){const fit=Math.min(44/orn.naturalWidth,(h-16)/orn.naturalHeight);x.imageSmoothingEnabled=p.ornament==='logo_casardi'&&!nes;x.drawImage(orn,bx+9+(44-orn.naturalWidth*fit)/2,by+(h-orn.naturalHeight*fit)/2,orn.naturalWidth*fit,orn.naturalHeight*fit);}
  let yy=by+8;for(const r of rows){x.font=r.s+'px "'+r.f+'"';x.textBaseline='top';x.fillStyle=r.t==='BARLETTA'?colors.accent:colors.ink;x.fillText(r.t,bx+10+(orn?56:0),yy);yy+=r.a;}
  x.restore();return{x:bx,y:by,w,h};
 }
 async function drawStickers(card,job){
  const c=normalize(job.composition),k=card.width/600,x=card.getContext('2d');
  const loaded=await Promise.all(c.stickers.map(s=>image(s.id,job.mode)));
  for(let i=0;i<c.stickers.length;i++){const s=c.stickers[i],g=stickerGeometry(s);x.save();x.translate(g.cx*k,g.cy*k);x.rotate(g.rotation*Math.PI/180);x.imageSmoothingEnabled=s.id==='logo_casardi'&&job.mode!=='nes';x.drawImage(loaded[i],-g.w*k/2,-g.h*k/2,g.w*k,g.h*k);x.restore();}
 }
 function credit(job){const c=normalize(job.composition),ids=new Set(c.stickers.map(s=>s.id));if(c.plaque.ornament!=='none')ids.add(c.plaque.ornament);if(!ids.size)return'';return'\nDECORAZIONI FACOLTATIVE\n'+[...ids].sort().map(id=>{const r=records()[id];return r.label+': '+r.license+' — '+r.license_url+'\n'+(id==='logo_casardi'?r.attribution+'\n'+r.source_pdf+'\n'+r.legal_notice:'Sticker originale assistito da IA, rifinito su griglia 96×96. Non è un logo istituzionale; nessuna esclusiva sugli elementi automatici.');}).join('\n')+'\n';}
 return{round,clamp,defaults,normalize,actorGeometry,stickerGeometry,customPlaque,drawPlaque,drawStickers,credit};
})();
