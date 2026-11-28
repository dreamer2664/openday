/* Mouse, touch and keyboard postcard editor. UI only: no storage or network.
 * Renderer supplies authentic preview layers and canonical 600×400 geometry.
 * Export always recomposes the original assets, never this DOM or a screenshot.
 */
globalThis.CasardiEditor=(()=>{
 'use strict';
 const defaults=()=>({actor:null,plaque:{theme:'originale',ornament:'none',position:'scene',track:'none'},stickers:[]});
 const copy=o=>JSON.parse(JSON.stringify(o)),clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
 function mount(cfg){
  const {root,wrap,image}=cfg,records=Object.fromEntries(cfg.stickers.map(s=>[s.id,s]));
  let meta=null,urls=null,active='actor',drag=null,busy=false,rendering=false,history=[];
  const nodes=new Map(),get=()=>cfg.getComposition()||defaults();
  const el=(tag,attrs={},...kids)=>{const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')e.className=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v);}for(const kid of kids)if(kid!==null)e.append(kid.nodeType?kid:document.createTextNode(String(kid)));return e;};
  const overlay=el('div',{class:'composition-overlay','aria-label':'Elementi della cartolina'}),ghost=el('img',{class:'composition-ghost',alt:'',draggable:'false'});ghost.hidden=true;overlay.append(ghost);wrap.append(overlay);wrap.classList.add('editable-card');
  const status=el('p',{class:'editor-status',role:'status','aria-live':'polite'},'Nessuna decorazione selezionata. Tutto facoltativo.');
  const undo=el('button',{type:'button',class:'editor-small',onclick:()=>{if(!history.length||busy)return;const before=history.pop();active='actor';cfg.onChange(before,{render:true,reason:'undo'});draw();controls();}},'↶ Annulla'),clear=el('button',{type:'button',class:'editor-small',onclick:()=>{if(busy)return;change(defaults(),true,'clear');active='actor';draw();controls();}},'Ripristina composizione');
  const fieldset=el('fieldset',{class:'editor-fields'});root.classList.add('composition-panel');root.append(el('div',{class:'editor-heading'},el('div',{},el('p',{class:'editor-kicker'},'ULTIMI TOCCHI · FACOLTATIVI'),el('h3',{},'Falla ancora più tua.')),el('div',{class:'editor-history'},undo,clear)),el('p',{class:'editor-help'},'Trascina il personaggio con il mouse o con un dito. Il companion lo segue. Puoi anche selezionare un elemento e usare le frecce; Maiusc + freccia lo sposta più velocemente.'),fieldset,status);
  const scale=el('input',{id:'actor-scale',type:'range',min:65,max:135,step:35,value:100,'aria-label':'Dimensione del personaggio'}),scaleOut=el('output',{'for':'actor-scale'},'Medio');
  const resetActor=el('button',{type:'button',class:'editor-small',onclick:()=>{const c=copy(get());c.actor=null;active='actor';change(c,true,'recommended');}},'Posizione consigliata');
  const actorBox=el('details',{class:'editor-section'} ,el('summary',{},'Personaggio · dimensione e posizione'),el('p',{class:'editor-note'},'Spostamento libero dentro la cornice. Ombre e appoggio si ricalcolano al rilascio. Tre taglie nitide, a passi di pixel interi: nessuno zoom sfocato.'),el('label',{class:'editor-range'},el('span',{},'Dimensione',scaleOut),scale),resetActor);
  const sizeLabel=v=>Number(v)<85?'Piccolo':Number(v)>115?'Grande':'Medio';scale.addEventListener('input',()=>{scaleOut.value=sizeLabel(scale.value);scale.setAttribute('aria-valuetext',sizeLabel(scale.value));});scale.addEventListener('change',()=>{if(!meta)return;const c=copy(get());c.actor={x:Math.round(meta.actor.x),y:Math.round(meta.actor.y),scale:Number(scale.value)};active='actor';change(c,true,'scale');});
  const picker=el('div',{class:'sticker-picker'}),selectedTools=el('div',{class:'sticker-tools'}),count=el('span',{class:'editor-count'},'0 / 6');
  const stickersBox=el('details',{class:'editor-section',open:''},el('summary',{},'Sticker sulla cartolina ',count),el('p',{class:'editor-note'},'Scegline fino a sei, poi trascinali dove preferisci. Tocca uno sticker per cambiarne dimensione, inclinazione e livello. Nessuno viene aggiunto automaticamente.'),picker,selectedTools);
  for(const r of cfg.stickers){const b=el('button',{type:'button',class:'sticker-choice','data-add-sticker':r.id,'aria-pressed':'false',onclick:()=>{
   if(busy)return;const c=copy(get()),found=c.stickers.findIndex(s=>s.id===r.id);
   if(found>=0){active=found;draw();controls();overlay.querySelector('[data-drag="'+found+'"]')?.focus({preventScroll:true});return;}
   if(c.stickers.length>=6){cfg.notify('Puoi usare fino a sei sticker. Rimuovine uno prima di aggiungerne un altro.');return;}
   const slots=[[510,80],[88,302],[500,302],[310,68],[310,318],[95,165]],slot=slots[c.stickers.length];c.stickers.push({id:r.id,x:slot[0],y:slot[1],size:r.id==='logo_casardi'?88:76,rotation:0});active=c.stickers.length-1;change(c,false,'add');
  }},el('img',{src:cfg.imageFor(r.id),alt:'',draggable:'false'}),el('span',{},r.label));picker.append(b);}
  const plaque=el('details',{class:'editor-section'},el('summary',{},'Targhetta · stile, simbolo e percorso'),el('p',{class:'editor-note'},'Il testo istituzionale resta invariato. Aggiungi solo ciò che desideri; anche il percorso è facoltativo.'));
  const selects={};
  const choices={theme:['Finitura',[['originale','Originale · nessuna modifica'],['notte','Notte e oro'],['avorio','Avorio e inchiostro'],['pergamena','Pergamena classica']]],ornament:['Simbolo accanto al testo',[['none','Nessun simbolo'],...cfg.stickers.map(r=>[r.id,r.label])]],track:['Il mio percorso',[['none','Non indicare il percorso'],['classico','Liceo Classico'],['scienze_umane','Scienze Umane'],['musicale','Liceo Musicale']]],position:['Posizione della targhetta',[['scene','Consigliata per il luogo'],['top-left','In alto a sinistra'],['top-right','In alto a destra'],['bottom-left','In basso a sinistra'],['bottom-right','In basso a destra']]]};
  const selectGrid=el('div',{class:'plaque-options'});
  for(const[key,[label,items]]of Object.entries(choices)){const sel=selects[key]=el('select',{'data-plaque':key,'aria-label':label});for(const[value,title]of items)sel.append(el('option',{value},title));sel.addEventListener('change',()=>{const c=copy(get());c.plaque[key]=sel.value;change(c,true,'plaque');});selectGrid.append(el('label',{},el('span',{},label),sel));}
  plaque.append(selectGrid);fieldset.append(actorBox,stickersBox,plaque,el('p',{class:'editor-provenance'},'Il logo ufficiale è ripreso dalla brochure Casardi 2026/27, non generato. Gli altri sette sticker sono illustrazioni originali assistite da IA. Fonti e crediti accompagnano il PNG. Il logo mantiene colori, proporzioni e orientamento originali; in stile NES è ridotto su griglia.'));
  function push(before){history.push(copy(before));if(history.length>25)history.shift();}
  function change(next,render,reason){if(busy)return;push(get());cfg.onChange(copy(next),{render,reason});draw();controls();}
  function geom(s){const r=records[s.id],factor=s.size/Math.max(...r.size),w=r.size[0]*factor,h=r.size[1]*factor,t=s.rotation*Math.PI/180,bw=Math.abs(w*Math.cos(t))+Math.abs(h*Math.sin(t)),bh=Math.abs(w*Math.sin(t))+Math.abs(h*Math.cos(t));return{w,h,cx:clamp(s.x,10+bw/2,590-bw/2),cy:clamp(s.y,10+bh/2,390-bh/2)};}
  function rect(node,g){node.style.left=(g.x/6)+'%';node.style.top=(g.y/4)+'%';node.style.width=(g.w/6)+'%';node.style.height=(g.h/4)+'%';}
  function controls(){const c=get();undo.disabled=busy||!history.length;count.textContent=c.stickers.length+' / 6';scale.value=c.actor?.scale??100;scaleOut.value=sizeLabel(scale.value);scale.setAttribute('aria-valuetext',sizeLabel(scale.value));for(const[k,s]of Object.entries(selects))s.value=c.plaque[k];
   for(const b of picker.children){const yes=c.stickers.some(s=>s.id===b.dataset.addSticker);b.setAttribute('aria-pressed',String(yes));b.classList.toggle('selected',yes);}
   selectedTools.replaceChildren();
   if(typeof active==='number'&&c.stickers[active]){
    const i=active,s=c.stickers[i],size=el('input',{type:'range',min:36,max:132,step:4,value:s.size,'aria-label':'Dimensione dello sticker'}),angle=el('input',{type:'range',min:-30,max:30,step:5,value:s.rotation,'aria-label':'Inclinazione dello sticker'}),sz=el('output',{},s.size+' px'),ang=el('output',{},s.rotation+'°');
    size.addEventListener('input',()=>{const n=copy(get());n.stickers[i].size=Number(size.value);sz.value=size.value+' px';cfg.onChange(n,{render:false,reason:'sticker-size'});draw();});size.addEventListener('pointerdown',()=>push(get()));size.addEventListener('keydown',e=>{if(e.key.startsWith('Arrow')||['Home','End','PageUp','PageDown'].includes(e.key))push(get());});
    angle.disabled=s.id==='logo_casardi';angle.addEventListener('input',()=>{const n=copy(get());n.stickers[i].rotation=Number(angle.value);ang.value=angle.value+'°';cfg.onChange(n,{render:false,reason:'sticker-rotation'});draw();});angle.addEventListener('pointerdown',()=>push(get()));angle.addEventListener('keydown',e=>{if(e.key.startsWith('Arrow')||['Home','End','PageUp','PageDown'].includes(e.key))push(get());});
    selectedTools.append(el('p',{class:'selected-sticker-title'},records[s.id].label),el('label',{class:'editor-range'},el('span',{},'Dimensione',sz),size),el('label',{class:'editor-range'},el('span',{},'Inclinazione',ang),angle),el('div',{class:'editor-inline'},el('button',{type:'button',class:'editor-small',onclick:()=>{const n=copy(get());const item=n.stickers.splice(i,1)[0];n.stickers.push(item);active=n.stickers.length-1;change(n,false,'raise');}},'Porta davanti'),el('button',{type:'button',class:'editor-small',onclick:()=>{const n=copy(get());n.stickers.splice(i,1);active='actor';change(n,false,'remove');}},'Rimuovi sticker')));
    if(s.id==='logo_casardi')selectedTools.append(el('p',{class:'editor-note'},'Logo istituzionale: proporzioni e orientamento bloccati. Il fondo bianco della fonte è conservato.'));
   }else selectedTools.append(el('p',{class:'editor-note'},'Seleziona uno sticker dalla cartolina o dalla raccolta per modificarlo.'));
   status.textContent=c.stickers.length?c.stickers.length+' sticker sulla cartolina · tutto resta modificabile prima del PNG.':'Nessuno sticker sulla cartolina. Puoi lasciare tutto così.';
  }
  function draw(){
   if(!meta)return;const c=get(),wanted=new Set(['actor',...c.stickers.map((_,i)=>String(i))]);
   for(const[key,n]of nodes)if(!wanted.has(key)){n.remove();nodes.delete(key);}
   for(const key of wanted){let n=nodes.get(key);if(!n){n=el('button',{type:'button',class:key==='actor'?'card-hit':'card-sticker','data-drag':key});if(key==='actor')n.append(el('span',{class:'move-tag','aria-hidden':'true'},'↔ Personaggio'));else n.append(el('img',{alt:'',draggable:'false'}));overlay.append(n);nodes.set(key,n);}
    const selected=(key==='actor'&&active==='actor')||String(active)===key;n.classList.toggle('selected',selected);n.disabled=busy;n.setAttribute('aria-pressed',String(selected));
    if(key==='actor'){const delta=drag?.kind==='actor'?drag.delta:urls?.pendingDelta||{x:0,y:0};rect(n,{...meta.character,x:meta.character.x+delta.x,y:meta.character.y+delta.y});n.setAttribute('aria-label','Personaggio e companion: trascina oppure usa le frecce per spostarli');}
    else{const i=Number(key),s=c.stickers[i],g=geom(s);n.querySelector('img').src=cfg.imageFor(s.id);n.querySelector('img').style.imageRendering=s.id==='logo_casardi'&&cfg.getMode()==='photo'?'auto':'pixelated';rect(n,{x:g.cx-g.w/2,y:g.cy-g.h/2,w:g.w,h:g.h});n.style.transform='rotate('+s.rotation+'deg)';n.setAttribute('aria-label',records[s.id].label+': trascina o usa le frecce; Canc per rimuovere');n.style.zIndex=String(i+2);}
   }
  }
  function actorPoint(x,y){const rel={left:meta.group.x-meta.actor.x,right:meta.group.x+meta.group.w-meta.actor.x,top:meta.group.y-meta.actor.y};return{x:Math.round(clamp(x,12-rel.left,588-rel.right)),y:Math.round(clamp(y,12-rel.top,388)),scale:get().actor?.scale??100};}
  function showGhost(delta){if(!urls)return;image.src=urls.clean;ghost.src=urls.ghost;ghost.hidden=false;rect(ghost,{...meta.ghost,x:meta.ghost.x+delta.x,y:meta.ghost.y+delta.y});}
  function restoreImage(){ghost.hidden=true;if(urls){image.src=urls.main;delete urls.pendingDelta;}}
  function position(e){const r=image.getBoundingClientRect();return{x:(e.clientX-r.left)*600/r.width,y:(e.clientY-r.top)*400/r.height};}
  overlay.addEventListener('pointerdown',e=>{
   const target=e.target.closest('[data-drag]');if(!target||busy||rendering||!meta||drag||e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();target.focus({preventScroll:true});const key=target.dataset.drag;active=key==='actor'?'actor':Number(key);const c=get();drag={kind:key,id:e.pointerId,target,start:position(e),before:copy(c),origin:key==='actor'?{x:meta.actor.x,y:meta.actor.y}:{x:geom(c.stickers[Number(key)]).cx,y:geom(c.stickers[Number(key)]).cy},delta:{x:0,y:0},moved:false,captured:false};try{target.setPointerCapture(e.pointerId);drag.captured=true;}catch(_){}if(key==='actor')showGhost(drag.delta);draw();controls();
  });
  // Listen on the window as well as using pointer capture: a release outside
  // the postcard must always settle the gesture, even if capture is unavailable.
  window.addEventListener('pointermove',e=>{
   if(!drag||e.pointerId!==drag.id)return;if(e.buttons===0&&e.pointerType!=='touch'){end(true);return;}if(e.cancelable)e.preventDefault();const p=position(e),dx=p.x-drag.start.x,dy=p.y-drag.start.y;if(Math.abs(dx)+Math.abs(dy)<1&&!drag.moved)return;drag.moved=true;const c=copy(get());
   if(drag.kind==='actor'){c.actor=actorPoint(drag.origin.x+dx,drag.origin.y+dy);drag.delta={x:c.actor.x-meta.actor.x,y:c.actor.y-meta.actor.y};showGhost(drag.delta);}
   else{const s=c.stickers[Number(drag.kind)];if(!s){end(true);return;}s.x=Math.round(clamp(drag.origin.x+dx,0,600));s.y=Math.round(clamp(drag.origin.y+dy,0,400));const g=geom(s);s.x=Math.round(g.cx);s.y=Math.round(g.cy);}
   cfg.onChange(c,{render:false,reason:'drag'});draw();
  },{capture:true,passive:false});
  function end(cancel=false){if(!drag)return;const d=drag;drag=null;try{d.target.releasePointerCapture(d.id);}catch(_){}
   if(cancel){cfg.onChange(d.before,{render:false,reason:'cancel'});restoreImage();}
   else if(d.moved){push(d.before);if(d.kind==='actor'){urls.pendingDelta=d.delta;rendering=true;cfg.onChange(copy(get()),{render:true,reason:'actor'});}}
   else restoreImage();draw();controls();
  }
  // Every termination path is idempotent. In 3.3 only up/cancel on the
  // overlay cleared `drag`: lost capture left it permanently occupied, thereby
  // rejecting all subsequent actor AND sticker drags. Cancel only this gesture;
  // previous edits/history stay intact, with no visitor reset or watchdog timer.
  window.addEventListener('pointerup',e=>{if(drag?.id===e.pointerId)end();},true);
  window.addEventListener('pointercancel',e=>{if(drag?.id===e.pointerId)end(true);},true);
  document.addEventListener('lostpointercapture',e=>{if(drag?.id===e.pointerId)end(true);},true);
  window.addEventListener('blur',()=>end(true));
  window.addEventListener('pagehide',()=>end(true));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)end(true);});
  window.addEventListener('pointerdown',e=>{
   if(drag&&(e.pointerId===drag.id||!drag.target.isConnected||!overlay.contains(e.target)||(drag.captured&&!drag.target.hasPointerCapture(drag.id))))end(true);
  },true);
  window.addEventListener('keydown',e=>{
   if(drag&&!['Shift','Control','Alt','Meta'].includes(e.key)){end(true);if(e.key==='Escape')e.preventDefault();}
  },true);
  overlay.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&drag){e.preventDefault();end(true);return;}const target=e.target.closest('[data-drag]');if(!target||busy||rendering||!meta)return;const key=target.dataset.drag,step=e.shiftKey?10:2,delta={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[e.key];active=key==='actor'?'actor':Number(key);
   if((e.key==='Delete'||e.key==='Backspace')&&key!=='actor'){e.preventDefault();const c=copy(get());c.stickers.splice(Number(key),1);active='actor';change(c,false,'remove');return;}
   if(!delta){if(e.key==='Enter'||e.key===' '){e.preventDefault();controls();draw();}return;}e.preventDefault();const c=copy(get());
   if(key==='actor'){c.actor=actorPoint((c.actor?.x??meta.actor.x)+delta[0],(c.actor?.y??meta.actor.y)+delta[1]);change(c,true,'actor-keyboard');}
   else{const s=c.stickers[Number(key)];s.x=Math.round(clamp(s.x+delta[0],0,600));s.y=Math.round(clamp(s.y+delta[1],0,400));change(c,false,'sticker-keyboard');}
  });
  controls();
  return{
   async setPreview(data){if(drag)end(true);meta=data.meta;urls={main:data.image,clean:data.clean,ghost:data.ghost};image.src=data.image;rendering=false;ghost.hidden=true;draw();controls();},
   setRendering(value=true){if(value&&drag)end(true);rendering=value;},
   setBusy(value){if(value&&drag)end(true);busy=value;fieldset.disabled=value;root.classList.toggle('editor-busy',value);undo.disabled=value||!history.length;clear.disabled=value;draw();},
   failed(){rendering=false;restoreImage();draw();},
   reset(){if(drag)end(true);meta=null;urls=null;history=[];active='actor';ghost.hidden=true;ghost.removeAttribute('src');for(const n of nodes.values())n.remove();nodes.clear();rendering=false;busy=false;fieldset.disabled=false;controls();},
   refresh(){draw();controls();}
  };
 }
 return{mount,defaults};
})();
