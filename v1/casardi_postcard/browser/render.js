/* Browser composition. MIT code; modular LPC artwork has per-asset licenses.
 * No fetch, import, CDN, interpreter, screen capture or server API is used.
 * Photo assets are licensed source photographs, not screenshots of the app.
 */
globalThis.CasardiRender=(()=>{
 'use strict';
 const S=CasardiSprites,round=x=>{const f=Math.floor(x),d=x-f;return d<.5?f:d>.5?f+1:f%2===0?f:f+1;};
 const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
 const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const context=c=>c.getContext('2d',{willReadFrequently:true});
 // Canvas backing stores are native memory, not part of the small JS heap.
 // Dispose consumed outputs explicitly; do not wait for mobile-browser GC.
 const dispose=c=>{if(c){c.width=1;c.height=1;}};
 const check=signal=>{if(signal?.aborted)throw new DOMException('Composizione annullata','AbortError');};
 const fontsReady=()=>Promise.all(['Cinzel','Garamond','Pixel'].map(f=>document.fonts.load('40px "'+f+'"')));
 const ratios={gatto:.30,cane:.40,volpe:.36,gufo:.34,coniglio:.32,corvo:.30,tartaruga:.10,drago:.34};
 const cleanName=v=>Array.from(String(v||'').normalize('NFC').replace(/[\p{C}]/gu,'').trim().replace(/\s+/gu,' ')).slice(0,28).join('');
 function normalize(raw={}){
  const c={...S.default_spec()},choices=PORTABLE.catalogue.choices;
  for(const [key,values] of Object.entries(choices))if(values.includes(raw[key]))c[key]=raw[key];
  for(const [key,table] of Object.entries(PORTABLE.colorFields))if(table.includes(raw[key]))c[key]=raw[key];
  Object.assign(c,S.compatible(c));
  if(c.held!=='none')c.pose='libro';else if(c.pose==='libro')c.held='libro';
  if(raw.blink===true)c.blink=true;
  return c;
 }
 // Actual composited-pixel effects for the CURRENT outfit, not icon previews.
 function applyField(raw,field,value){
  const s={...normalize(raw),[field]:value};
  if(field==='held')s.pose=value==='none'?'rilassata':'libro';
  if(field==='pose'){if(value!=='libro')s.held='none';else if(s.held==='none')s.held='libro';}
  if(field==='accessory'){const colors=value==='collana'?PORTABLE.catalogue.colors.metal:PORTABLE.catalogue.colors.fabric;if(!colors.some(c=>c.id===s.accessory_color))s.accessory_color=colors[0].id;}
  return normalize(s);
 }
 function revealFor(s,field){
  let changes={};
  if(['eyes','eye_shape','brows','nose'].includes(field)){
   changes={glasses:'none',expression:'neutra'};
   if(field==='brows')Object.assign(changes,{hair:'rasati',hat:'none'});
   if(field==='nose')changes.beard='none';
  }else if(field==='mouth'){changes={beard:'none',expression:'neutra'};if(s.accessory==='sciarpa')changes.accessory='none';}
  else if(['hair','hair_color'].includes(field)){changes={hat:'none'};if(field==='hair_color'&&s.hair==='calvo')changes.hair='corti';}
  else if(['bottom','bottom_color','belt_color'].includes(field)){changes={top:'cyber_jacket'};if(field==='belt_color'&&['gonna','gonna_lunga'].includes(s.bottom))changes.bottom='cargo';}
  else if(['shoes','shoes_color'].includes(field))changes={top:'cyber_jacket',bottom:'chino'};
  else if(field==='inner_color')changes={top:'cyber_jacket',held:'none',pose:'rilassata'};
  return Object.fromEntries(Object.entries(changes).filter(([k,v])=>s[k]!==v));
 }
 let effectCache={key:null,base:null,fields:{}};
 function controlEffects(raw,field,values){
  const spec=normalize(raw),key=JSON.stringify(spec);
  if(key!==effectCache.key)effectCache={key,base:S.render(spec),fields:{}};
  if(effectCache.fields[field])return effectCache.fields[field];
  const pixels={},allowed=PORTABLE.catalogue.compatibility?.[field]||{};
  for(const value of values){
   if(allowed[value]&&!allowed[value].includes(spec.build)){pixels[value]=null;continue;}
   const after=S.render(applyField(spec,field,value));let count=0;
   after.buf.forEach((p,i)=>{const b=effectCache.base.buf[i];if((p[3]||b[3])&&p.some((v,k)=>v!==b[k]))count++;});pixels[value]=count;
  }
  return effectCache.fields[field]={pixels,reveal:revealFor(spec,field)};
 }
 function faceDetail(raw){const c=canvas(28,28);context(c).drawImage(spriteCanvas(S.render(normalize(raw))),18,8,28,28,0,0,28,28);return c.toDataURL();}
 function spriteCanvas(p){
  const c=canvas(p.w,p.h),x=context(c),data=x.createImageData(p.w,p.h);
  for(let i=0,j=0;i<p.buf.length;i++,j+=4)data.data.set(p.buf[i],j);
  x.putImageData(data,0,0);return c;
 }
 function cropSprite(p){
  const b=p.bounds(),x=Math.max(0,b[0]-1),y=Math.max(0,b[1]-1),w=Math.min(p.w,b[2]+2)-x,h=Math.min(p.h,b[3]+1)-y;
  const c=canvas(w,h);context(c).drawImage(spriteCanvas(p),x,y,w,h,0,0,w,h);if(p.w===64&&p.h===64)c.anchorX=32-x;return c;
 }
 const character=(spec,mode)=>cropSprite(S.render(normalize(spec),mode));
 const animal=(spec,mode)=>cropSprite(S.draw_animal(spec.animal,spec.variant,spec.pose,mode));
 const faceFields=['hair','face','beard','hat','glasses','expression','eye_shape','brows','nose','mouth'];
 const iconCache=new Map();
 function characterIcon(mode,field,value){
  const key=mode+'/'+field+'/'+value;if(iconCache.has(key))return iconCache.get(key);
  const raw={...S.default_spec(),[field]:value};const allowed=PORTABLE.catalogue.compatibility?.[field]?.[value];if(allowed)raw.build=allowed[0];
  if(['face','eye_shape','eyes','brows','nose','mouth'].includes(field)){raw.hair='rasati';raw.expression='neutra';}
  const p=S.render(normalize(raw),mode);let c;
  if(faceFields.includes(field)){c=canvas(31,28);context(c).drawImage(spriteCanvas(p),17,8,31,28,0,0,31,28);}else c=cropSprite(p);
  const uri=c.toDataURL();iconCache.set(key,uri);return uri;
 }
 function animalIcon(mode,a){return animal({animal:a.id,variant:a.variants[0].id,pose:a.poses[0]},mode).toDataURL();}
 const refHeights={};
 function referenceHeight(kind){
  if(refHeights[kind])return refHeights[kind];
  const a=PORTABLE.catalogue.animals.find(x=>x.id===kind);
  return refHeights[kind]=Math.max(...a.poses.map(p=>animal({animal:kind,variant:a.variants[0].id,pose:p},'photo').height));
 }
 let imageCache={key:null,promise:null},backgroundCache=null;
 function imageFor(scene,mode){
  const key=scene+'/'+mode;if(imageCache.key===key)return imageCache.promise;
  const promise=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Non riesco a leggere lo sfondo incorporato. Scarica di nuovo il file HTML completo.'));image.src=PORTABLE.images[scene][mode];});
  imageCache={key,promise};return promise;
 }
 async function photoBackground(scene,width,signal,progress){
  const key=scene+'/'+width;if(backgroundCache?.key===key){backgroundCache.c.users++;return backgroundCache.c;}
  const source=await imageFor(scene,'photo');check(signal);
  const cfg=PORTABLE.photo[scene],height=round(width*2/3),c=canvas(width,height),x=context(c);
  let completed=false;try{
  let [x0,y0,x1,y1]=cfg.crop.map((v,i)=>Math.trunc(v*(i%2===0?source.naturalWidth:source.naturalHeight)));
  let sw=x1-x0,sh=y1-y0;
  if(sw/sh>1.5){const nw=Math.trunc(sh*1.5);x0+=Math.floor((sw-nw)/2);sw=nw;}
  else{const nh=Math.trunc(sw/1.5);y0+=Math.trunc((sh-nh)*(cfg.crop_anchor_y??.5));sh=nh;}
  x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(source,x0,y0,sw,sh,0,0,width,height);
  const tint=cfg.ambient.tint,strength=cfg.ambient.strength*.5,nx2=new Float64Array(width);
  for(let xx=0;xx<width;xx++)nx2[xx]=((xx-width/2)/(width/2))**2;
  let seed=7;
  const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
  for(let y=0;y<height;y+=64){
   check(signal);const rows=Math.min(64,height-y),im=x.getImageData(0,y,width,rows),d=im.data;
   for(let yy=0,i=0;yy<rows;yy++){
    const ny2=((y+yy-height/2)/(height/2))**2;
    for(let xx=0;xx<width;xx++,i+=4){
     let r=127.5+(d[i]-127.5)*1.06,g=127.5+(d[i+1]-127.5)*1.06,b=127.5+(d[i+2]-127.5)*1.06;
     const lum=(r+g+b)/3;
     r=r*(1-strength)+(lum+(tint[0]-128)*.55)*strength;
     g=g*(1-strength)+(lum+(tint[1]-128)*.55)*strength;
     b=b*(1-strength)+(lum+(tint[2]-128)*.55)*strength;
     const gray=(r+g+b)/3,mask=Math.max(0,1-cfg.vignette*Math.pow(Math.sqrt(nx2[xx]+ny2)/1.414,2.1)*1.6);
     const noise=cfg.grain>0?(random()+random()+random()-1.5)*2*255*cfg.grain:0;
     d[i]=Math.max(0,Math.min(255,Math.trunc((gray+(r-gray)*.90)*mask+noise)));
     d[i+1]=Math.max(0,Math.min(255,Math.trunc((gray+(g-gray)*.90)*mask+noise)));
     d[i+2]=Math.max(0,Math.min(255,Math.trunc((gray+(b-gray)*.90)*mask+noise)));
    }
   }
   x.putImageData(im,0,y);if(progress)progress(.12+.39*(y+rows)/height);await pause();
  }
  check(signal);const previous=backgroundCache?.c;c.users=1;backgroundCache={key,c};if(previous&&!previous.users)dispose(previous);completed=true;return c;
  }finally{if(!completed)dispose(c);}
 }
 function harmonise(c,cfg){
  const x=context(c),im=x.getImageData(0,0,c.width,c.height),d=im.data,amb=cfg.ambient.tint,mean=(amb[0]+amb[1]+amb[2])/3,st=cfg.ambient.strength,ws=.10+cfg.light.strength*.08;
  for(let i=0;i<d.length;i+=4){
   const lum=(d[i]+d[i+1]+d[i+2])/765,shade=Math.max(0,Math.min(1,1-lum*1.6)),hi=Math.max(0,Math.min(1,(lum-.55)*1.8)),rgb=[];
   for(let k=0;k<3;k++){let v=d[i+k]*(1-st)+d[i+k]*(amb[k]/Math.max(1,mean))*st;v+=(amb[k]-v)*shade*.035;v+=(cfg.light.warm[k]-v)*hi*ws;rgb.push(v);}
   const gray=(rgb[0]+rgb[1]+rgb[2])/3;for(let k=0;k<3;k++)d[i+k]=Math.max(0,Math.min(255,Math.trunc(gray+(rgb[k]-gray)*(cfg.sprite_desat??1))));
  }
  x.putImageData(im,0,0);return c;
 }
 function flipped(c){const out=canvas(c.width,c.height),x=context(out);x.translate(c.width,0);x.scale(-1,1);x.drawImage(c,0,0);return out;}
 function shadow(x,s,cx,ground,scale,light){
  cx+=(s.width/2-(s.anchorX??s.width/2))*scale;
  const w=s.width*scale,h=s.height*scale,unit=Math.max(1,h/100),im=context(s).getImageData(0,0,s.width,s.height).data;
  let a=s.width,b=-1;
  for(let yy=Math.max(0,s.height-Math.ceil(s.height*.08));yy<s.height;yy++)for(let xx=0;xx<s.width;xx++)if(im[(yy*s.width+xx)*4+3]){a=Math.min(a,xx);b=Math.max(b,xx);}
  const footW=b>=a?(b-a+1)*scale:w*.5,footCX=b>=a?cx-w/2+(a+b+1)/2*scale:cx;
  x.save();x.filter='blur('+Math.max(1,unit*.4)+'px)';x.fillStyle='rgba(20,19,23,.57)';x.beginPath();x.ellipse(footCX,ground,Math.max(8,footW*.95)/2,Math.max(3,unit*1.15),0,0,Math.PI*2);x.fill();x.restore();
  const dx=Math.trunc(-light.dx*h*.26),depth=Math.max(4,Math.trunc(h*Math.max(.018,(light.dy??.2)*.15))),blur=Math.max(1,unit*.55),pad=Math.ceil(blur*3+4),base=pad+Math.max(0,-dx);
  const cast=canvas(Math.ceil(w+Math.abs(dx)+pad*2),Math.ceil(depth+pad*2)),cx2=context(cast),t=canvas(s.width,s.height),tx=context(t);
  tx.drawImage(s,0,0);tx.globalCompositeOperation='source-in';tx.fillStyle='rgb(23,21,26)';tx.fillRect(0,0,s.width,s.height);
  cx2.setTransform(1,0,-dx/h,-depth/h,base+dx,pad+depth);cx2.imageSmoothingEnabled=false;cx2.drawImage(t,0,0,w,h);cx2.resetTransform();
  const fade=cx2.createLinearGradient(0,pad,0,pad+depth);fade.addColorStop(0,'rgba(0,0,0,1)');fade.addColorStop(1,'rgba(0,0,0,0)');cx2.globalCompositeOperation='destination-in';cx2.fillStyle=fade;cx2.fillRect(0,0,cast.width,cast.height);
  x.save();x.globalAlpha=.35*light.strength;x.filter='blur('+blur+'px)';x.drawImage(cast,Math.trunc(cx-w/2-base),Math.trunc(ground-pad-unit*.5));x.restore();dispose(cast);dispose(t);
 }
 function putSprite(x,s,cx,ground,scale){
  const w=s.width*scale,h=s.height*scale,xx=round(cx-(s.anchorX??s.width/2)*scale),yy=round(ground-h);
  x.save();x.imageSmoothingEnabled=false;x.drawImage(s,xx,yy,w,h);x.restore();return[xx,yy,w,h];
 }
 function pixelShadow(x,cx,gy,w){const center=round(cx+w*.025),rx=Math.max(1,round(w*.375));x.save();x.fillStyle='rgba(21,26,27,.35)';for(let y=gy-1;y<gy+3;y++){const t=1-((y+.5-(gy+1))/2)**2;if(t<=0)continue;const dx=rx*Math.sqrt(t),a=Math.ceil(center-dx-.5),b=Math.floor(center+dx-.5);x.fillRect(a,y,b-a+1,1);}x.restore();}
 function grass(x,bg,cx,gy,sw,unit){
  let seed=19;const rand=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  x.save();x.beginPath();for(let i=0;i<36;i++){const xx=Math.trunc(cx+(rand()-.5)*.92*sw),yy=Math.trunc(gy+(-1+rand()*5)*unit),h=Math.max(1,Math.trunc((4+rand()*7)*unit)),w=Math.max(1,Math.trunc((1+rand()*3)*unit));x.moveTo(xx-w,yy);x.lineTo(xx+1,yy-h);x.lineTo(xx+w,yy);x.closePath();}x.clip();x.globalAlpha=.86;x.drawImage(bg,0,0);x.restore();
 }
 function frame(x,w,h,scale,mode){
  const px=v=>round(v*scale),nes=mode==='nes',m1=px(nes?40:54),m2=px(nes?52:70),w1=Math.max(nes?2:1,px(nes?6:2)),w2=Math.max(1,px(nes?3:1));
  const edge=(m,t,c)=>{x.fillStyle=c;x.fillRect(m,m,w-2*m,t);x.fillRect(m,h-m-t,w-2*m,t);x.fillRect(m,m,t,h-2*m);x.fillRect(w-m-t,m,t,h-2*m);};
  x.save();edge(m1,w1,nes?'rgba(16,14,20,.824)':'rgba(246,240,226,.431)');edge(m2,w2,nes?'rgba(16,14,20,.47)':'rgba(246,240,226,.216)');x.restore();
 }
 function nesTexts(card,job,zone){
  const layer=canvas(card.width,card.height),x=context(layer);
  const rows=[['LICEO ALFREDO CASARDI',8,'#f5f0d8',12],['OPEN DAY 2026/27',7,'#cbd7e4',11],['BARLETTA',6,'#79dcc2',10]];
  if(cleanName(job.name))rows.push([cleanName(job.name),8,'#f1c675',12]);
  for(const r of rows){x.font=r[1]+'px "Pixel"';while(r[1]>6&&x.measureText(r[0]).width>202){r[1]--;x.font=r[1]+'px "Pixel"';}}
  const w=Math.ceil(Math.max(...rows.map(r=>{x.font=r[1]+'px "Pixel"';return x.measureText(r[0]).width;})))+18,h=rows.reduce((s,r)=>s+r[3],0)+12;
  const bx=zone==='top-right'?card.width-18-w:18,by=18;
  x.fillStyle='#090e1d';x.fillRect(bx+4,by+4,w,h);x.fillStyle='#45516c';x.fillRect(bx+1,by,w-2,h);x.fillRect(bx,by+1,w,h-2);x.fillStyle='#151b32';x.fillRect(bx+2,by+2,w-4,h-4);
  x.fillStyle='#f1c675';for(const xx of [bx+2,bx+w-8])for(const yy of [by+2,by+h-3])x.fillRect(xx,yy,6,1);
  let yy=by+6;for(const r of rows){x.font=r[1]+'px "Pixel"';x.fillStyle=r[2];x.textBaseline='top';x.fillText(r[0],bx+9,yy);yy+=r[3];}
  const im=x.getImageData(0,0,layer.width,layer.height);for(let i=3;i<im.data.length;i+=4)im.data[i]=im.data[i]>=112?255:0;x.putImageData(im,0,0);context(card).drawImage(layer,0,0);dispose(layer);
 }
 function texts(card,job,zone){
  if(job.mode==='nes'){nesTexts(card,job,zone);return;}
  const w=card.width,h=card.height,x=context(card),scale=w/3000,px=v=>round(v*scale),nes=job.mode==='nes';
  const layer=nes?canvas(w,h):card,tx=nes?context(layer):x;
  const dark=nes&&['biblioteca','foro'].includes(job.scene),family=nes?'Pixel':'Cinzel';
  let ink=dark?'#2c241c':nes?'#faf8f0':'#fcf9f2',mute=dark?'#433121':nes?'#dee2d6':'#f5eee0',accent=dark?'#6c4220':nes?'#f0ce78':'#ceb06c';
  const school={text:'LICEO ALFREDO CASARDI',size:px(nes?50:74),family,tracking:px(nes?4:9)},event={text:'OPEN DAY 2026/27',size:px(nes?34:56),family:nes?'Pixel':'Garamond',tracking:px(nes?3:7)},city={text:'BARLETTA',size:px(nes?30:44),family,tracking:px(nes?3:11)},name={text:cleanName(job.name),size:px(nes?38:66),family:nes?'Pixel':'Garamond',tracking:px(3)};
  const font=row=>(!nes&&job.scene==='foro'?'600 ':'')+row.size+'px "'+row.family+'", Georgia, serif';
  const width=row=>{tx.font=font(row);return Array.from(row.text).reduce((sum,ch)=>sum+tx.measureText(ch).width,0)+row.tracking*Math.max(0,Array.from(row.text).length-1);};
  while(name.text&&width(name)>Math.max(width(school),w*.42)&&name.size>px(28))name.size--;
  const bw=Math.max(width(school),width(event),width(city),name.text?width(name):0),gap=px(18),bh=px(74)+px(56)+px(44)+gap*3+(name.text?px(80):0),m=px(nes?110:150);
  let bx=m,by=m;
  if(['top-right','right'].includes(zone))bx=w-m-bw;
  if(zone==='top-center')bx=(w-bw)/2;
  if(zone==='right')by=Math.trunc(h*.13);if(zone==='left')by=Math.trunc(h*.14);if(zone==='bottom-left')by=h-m-bh;
  let shadowColor=dark?'#2c241c':'rgba(18,18,22,.745)',sx=dark?0:px(2),sy=sx;
  if(!nes){
   const probe=canvas(64,24),p=context(probe);p.drawImage(card,bx,by,Math.min(bw,w-bx),Math.min(bh,h-by),0,0,64,24);const data=p.getImageData(0,0,64,24).data;let lum=0;for(let i=0;i<data.length;i+=4)lum+=data[i]*.299+data[i+1]*.587+data[i+2]*.114;lum/=64*24;
   if(lum>143){ink='#1d272d';mute='#293135';accent='#6f4f1e';shadowColor='rgba(250,246,234,.51)';sx=sy=px(1);}
   else{if(job.scene==='foro')accent='#f4e0b5';x.save();x.translate(bx+bw*.36,by+bh*.42);x.scale(Math.max(1,bw*.9),Math.max(1,bh*1.3));const g=x.createRadialGradient(0,0,0,0,0,1.7),a=(job.scene==='foro'?100:32)/255;g.addColorStop(0,'rgba(13,16,21,'+a+')');g.addColorStop(.5/1.7,'rgba(13,16,21,'+(a*.61)+')');g.addColorStop(1/1.7,'rgba(13,16,21,'+(a*.135)+')');g.addColorStop(1,'rgba(13,16,21,0)');x.fillStyle=g;x.fillRect(-2,-2,4,4);x.restore();}
  }
  const draw=(row,yy,color)=>{tx.save();tx.font=font(row);tx.textBaseline='top';tx.textAlign='left';tx.fillStyle=color;tx.strokeStyle=shadowColor;tx.lineWidth=nes?0:Math.max(1,px(2))*2;tx.lineJoin='round';let xx=bx;for(const ch of Array.from(row.text)){tx.fillStyle=shadowColor;tx.fillText(ch,round(xx+sx),round(yy+sy));if(!nes)tx.strokeText(ch,xx,yy);tx.fillStyle=color;tx.fillText(ch,nes?round(xx):xx,yy);xx+=tx.measureText(ch).width+row.tracking;}tx.restore();};
  tx.fillStyle=accent;tx.fillRect(round(bx),by+px(6),px(90),Math.max(1,px(3)));
  let y=by;draw(school,y,ink);y+=px(74)+gap;draw(event,y,mute);y+=px(56)+gap;draw(city,y,accent);if(name.text){y+=px(44)+gap;draw(name,y,ink);}
  if(nes){const im=tx.getImageData(0,0,w,h),d=im.data;for(let i=3;i<d.length;i+=4)d[i]=d[i]>=112?255:0;tx.putImageData(im,0,0);x.drawImage(layer,0,0);}
 }
 async function compose(raw,width=3000,{signal,onProgress}={}){
  check(signal);const job={...raw,name:cleanName(raw.name),character:normalize(raw.character)},nes=job.mode==='nes',nativeWidth=nes?600:width,nativeHeight=round(nativeWidth*2/3),scale=nativeWidth/3000;
  await fontsReady();check(signal);onProgress?.(.04);await pause();
  const card=canvas(nativeWidth,nativeHeight),x=context(card);x.imageSmoothingEnabled=!nes;
  const cfg=PORTABLE.photo[job.scene],lay=nes?PORTABLE.nes[job.scene]:cfg;
  let bg=null,returned=false;try{
  bg=nes?await imageFor(job.scene,'nes'):await photoBackground(job.scene,width,signal,onProgress);check(signal);x.drawImage(bg,0,0,nativeWidth,nativeHeight);
  onProgress?.(.56);await pause();check(signal);
  let s=character(job.character,job.mode);if(!nes)s=harmonise(s,cfg);
  const gy=lay.ground_y*(nes?1:scale),cx=lay.char.x*(nes?1:scale),ch=lay.char.h*(nes?1:scale),cs=nes?Math.max(1,round(ch/s.height)):Math.max(1,round(lay.char.h/s.height))*scale;
  if(nes)pixelShadow(x,cx,gy,s.width*cs);else shadow(x,s,cx,gy,cs,cfg.light);
  const pos=putSprite(x,s,cx,gy,cs);let companionPos=null;
  if(job.companion){
   let a=animal(job.companion,job.mode);if(!nes){a=harmonise(a,cfg);if(cfg.companion.flip)a=flipped(a);}
   const ax=(nes?lay.comp.x:cfg.companion.x*scale),ah=pos[3]*(ratios[job.companion.animal]??.32)*a.height/referenceHeight(job.companion.animal),asc=nes?Math.max(1,round(ah/a.height)):Math.max(1,round(ah/scale/a.height))*scale;
   if(nes)pixelShadow(x,ax,gy,a.width*asc);else shadow(x,a,ax,gy,asc,cfg.light);companionPos=putSprite(x,a,ax,gy,asc);
  }
  if(!nes&&cfg.occluders.includes('grass')){grass(x,bg,cx,gy,ch*.5,scale);if(companionPos)grass(x,bg,companionPos[0]+companionPos[2]/2,gy,companionPos[2],scale);}
  onProgress?.(.75);await pause();check(signal);frame(x,nativeWidth,nativeHeight,scale,job.mode);texts(card,job,lay.text_zone);check(signal);
  let out=card;
  if(nes&&width!==600){out=canvas(width,round(width*2/3));const ox=context(out);ox.imageSmoothingEnabled=false;ox.drawImage(card,0,0,out.width,out.height);dispose(card);}
  onProgress?.(.86);returned=true;return out;
  }finally{
   if(!returned)dispose(card);
   if(!nes&&bg){bg.users--;if(bg!==backgroundCache?.c&&!bg.users)dispose(bg);}
  }
 }
 function credit(job){
  const m=PORTABLE.metadata[job.scene],nes=job.mode==='nes',author=m.artist==='Unknown authorUnknown author'?'Autore non identificato (archivio storico)':m.artist;
  const changes=nes?'Nuova illustrazione pixel art assistita da IA, ricostruita dal riferimento architettonico autorizzato; rifinitura a 600 × 400 e palette di 64 colori; aggiunta di sprite e testi. Nessuna generazione a runtime.':'Fonte incorporata JPEG ottimizzata (lato massimo 3000 px, qualità 86); ritaglio, finitura cromatica, ombre; aggiunta di sprite e testi. Composizione locale Canvas.';
  const text='CARTOLINA OPEN DAY 2026/27 — LICEO ALFREDO CASARDI — BARLETTA\n\n'+(nes?'Ricostruzione pixel art':'Fotografia')+': '+m.title.slice(5)+'\nAutore della fotografia di riferimento: '+author+'\nFonte: '+m.page+'\nOriginale: '+m.url+'\nLicenza della fotografia di riferimento: '+m.lic+'\n'+m.licurl+'\nLicenza della composizione derivata: CC BY-SA 4.0 — https://creativecommons.org/licenses/by-sa/4.0/\nModifiche: '+changes+'\n'+S.credit(job.character)+'\nCompanion originali Casardi: CC0 1.0. Nessun endorsement dei fotografi o degli autori LPC. Le parti originali mantengono le loro licenze.\nFont: Cinzel, EB Garamond, Press Start 2P — SIL Open Font License 1.1; sottoinsiemi Unicode U+0000–U+052F in WOFF; il derivato di Press Start 2P è rinominato Casardi Pixel.\nConserva questi crediti quando ridistribuisci il file.\n';
  return{author,text,source:m.page,copyright:'CC BY-SA 4.0 — https://creativecommons.org/licenses/by-sa/4.0/'};
 }
 const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
 function chunk(type,body){const out=new Uint8Array(body.length+12),dv=new DataView(out.buffer),enc=new TextEncoder();dv.setUint32(0,body.length);out.set(enc.encode(type),4);out.set(body,8);let crc=0xffffffff;for(let i=4;i<body.length+8;i++)crc=crcTable[(crc^out[i])&255]^(crc>>>8);dv.setUint32(body.length+8,(crc^0xffffffff)>>>0);return out;}
 async function pngBlob(c,job,signal){
  check(signal);const b=await new Promise((resolve,reject)=>c.toBlob(blob=>blob?resolve(blob):reject(new Error('Il browser non ha memoria sufficiente per il PNG. Chiudi altre schede e riprova.')),'image/png'));check(signal);
  const raw=new Uint8Array(await b.arrayBuffer()),view=new DataView(raw.buffer),enc=new TextEncoder(),cr=credit(job),fields={Title:'LICEO ALFREDO CASARDI — OPEN DAY 2026/27 — BARLETTA',Author:cr.author,Source:cr.source,Copyright:cr.copyright,Description:cr.text,Software:'Casardi Postcard Studio 3.2 Dodici luoghi · Canvas locale'};
  const parts=[raw.subarray(0,33)];
  for(const [key,text]of Object.entries(fields))parts.push(chunk('iTXt',enc.encode(key+'\0\0\0\0\0'+text)));
  const dpi=new Uint8Array(9),dv=new DataView(dpi.buffer);dv.setUint32(0,11811);dv.setUint32(4,11811);dpi[8]=1;parts.push(chunk('pHYs',dpi));
  for(let p=33;p<raw.length;){const size=view.getUint32(p),type=String.fromCharCode(...raw.subarray(p+4,p+8));if(type!=='pHYs')parts.push(raw.subarray(p,p+size+12));p+=size+12;}
  check(signal);return new Blob(parts,{type:'image/png'});
 }
 function clear(){imageCache={key:null,promise:null};const old=backgroundCache?.c;backgroundCache=null;if(old&&!old.users)dispose(old);}
 return{dispose,normalize,applyField,controlEffects,revealFor,faceDetail,cleanName,character,animal,characterIcon,animalIcon,compose,pngBlob,credit,fontsReady,clear,round};
})();
