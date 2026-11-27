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
