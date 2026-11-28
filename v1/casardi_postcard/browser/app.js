/* Complete local creator for desktop and touch phones. Original project code. */
(()=>{
 'use strict';
 const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s)),R=CasardiRender,O=PORTABLE.catalogue;
 const state={mode:'photo',styleChosen:false,scene:'casardi',name:'',character:{...O.defaults.character},companion:null,composition:CasardiEditor.defaults(),tab:'body',step:0,highest:0,epoch:0,visited:false,ready:false,file:null,busy:false};
 const labels={
  build:{minuto:'Minuta',snello:'Snella',medio:'Media',atletico:'Atletica',robusto:'Robusta'},face:{ovale:'Ovale',tondo:'Tondo',squadrato:'Squadrato',affusolato:'Affusolato'},eye_shape:{classici:'Classici',mandorla:'A mandorla',tondi:'Tondi'},brows:{naturali:'Naturali',folte:'Folte',sottili:'Sottili'},nose:{piccolo:'Piccolo',largo:'Largo',aquilino:'Aquilino'},mouth:{sottili:'Sottili',piene:'Piene'},
  hair:{corti:'Corti',caschetto:'Caschetto',ricci:'Ricci',lunghi:'Lunghi',coda:'Coda',crocchia:'Crocchia',trecce:'Trecce',ondulati:'Ondulati',calvo:'Raso',cresta:'Cresta'},beard:{none:'Nessuna',baffi:'Baffi',barba:'Barba',barba_lunga:'Barba lunga'},top:{tshirt:'T-shirt',camicia:'Camicia',felpa:'Felpa',maglione:'Maglione',giacca:'Giacca',tunica:'Tunica',giubbotto:'Giubbotto'},bottom:{jeans:'Jeans',chino:'Chino',shorts:'Pantaloncini',gonna:'Gonna',gonna_lunga:'Gonna lunga',tuta:'Tuta'},shoes:{sneakers:'Sneakers',stivaletti:'Stivaletti',mocassini:'Mocassini',sandali:'Sandali',scarpe_sport:'Scarpe sportive'},hat:{none:'Nessuno',corona_alloro:'Corona d’alloro',berretto:'Berretto',cappello:'Cappello',cuffie:'Cuffie'},glasses:{none:'Nessuno',tondi:'Tondi',sole:'Da sole',spessi:'Spessi'},accessory:{none:'Nessuno',collana:'Collana',sciarpa:'Sciarpa',zaino:'Zaino',tracolla:'Tracolla'},held:{none:'Niente',libro:'Libro',pergamena:'Pergamena',cetra:'Cetra'},pose:{rilassata:'Rilassata',saluto:'Saluto',fianchi:'Mani sui fianchi',libro:'Con il libro'},expression:{neutra:'Neutra',sorriso:'Sorriso',entusiasta:'Entusiasta',seria:'Seria',curiosa:'Curiosa',sorpresa:'Sorpresa'},animalPose:{seduto:'Seduto',in_piedi:'In piedi',accovacciato:'Accovacciato',posato:'Posato',ali:'Ali aperte',cammina:'In cammino',ritirata:'Nel guscio'}
 };
 for(const[k,v]of Object.entries(O.labels||{}))labels[k]={...labels[k],...v};
 const faceFields=['hair','face','beard','hat','glasses','expression','eye_shape','brows','nose','mouth'];
 const titles=['Stile','Luogo','Nome','Personaggio','Companion','Anteprima'];
 const notes=['Scegli uno stile per iniziare.','Dodici luoghi, lo stesso stile.','Il nome è facoltativo.','Le scelte coperte sono spiegate, non simulate.','Anche nessun animale va benissimo.','PNG locale · Nessun caricamento online.'];
 let previewController=null,exportController=null,previewURL=null,fileURL=null,creditsURL=null,liveOpen=null,liveClosed=null,liveTicket=0,toastTimer=null;
 const release=u=>{if(u)URL.revokeObjectURL(u);};
 function el(tag,attrs={},...children){const n=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')n.className=v;else if(k.startsWith('on'))n.addEventListener(k.slice(2),v);else if(v!==null&&v!==undefined)n.setAttribute(k,v);}for(const c of children)if(c!==null&&c!==undefined)n.append(c.nodeType?c:document.createTextNode(String(c)));return n;}
 function notice(text,error=false){clearTimeout(toastTimer);$('#toast span').textContent=text;$('#toast').classList.toggle('error',error);$('#toast').hidden=false;if(!error)toastTimer=setTimeout(()=>$('#toast').hidden=true,8000);}
 $('#toast button').addEventListener('click',()=>$('#toast').hidden=true);
 function selected(n,yes){n.classList.toggle('selected',yes);n.setAttribute('aria-pressed',String(yes));}
 function job(){return{mode:state.mode,scene:state.scene,name:R.cleanName(state.name),character:{...state.character},companion:state.companion?{...state.companion}:null,composition:CasardiComposition.normalize(state.composition)};}
 function discardFile(invalidate=true){
  if(invalidate)CasardiBridge.clear();
  release(fileURL);release(creditsURL);fileURL=creditsURL=null;state.file=null;$('#result').hidden=true;$('#save').removeAttribute('href');$('#open-image').removeAttribute('href');$('#save-credits').removeAttribute('href');$('#save-image').removeAttribute('src');$('#share').hidden=true;
 }
 function changed(){discardFile();}
 function live(){
  ++liveTicket;liveOpen=R.character(state.character,state.mode).toDataURL();liveClosed=R.character({...state.character,blink:true},state.mode).toDataURL();$('#live-character').src=liveOpen;
  const a=state.companion;if(a){const c=R.animal(a,state.mode);$('#live-animal').src=c.toDataURL();$('#live-animal').hidden=false;const ratios={gatto:.30,cane:.40,volpe:.36,gufo:.34,coniglio:.32,corvo:.30,tartaruga:.10,drago:.34};$('#live-animal').style.height=(75*ratios[a.animal])+'%';}else{$('#live-animal').hidden=true;$('#live-animal').removeAttribute('src');}
 }
 function mode(){document.body.classList.toggle('nes',state.mode==='nes');$('#live-stage').style.backgroundImage='url("'+PORTABLE.thumbs[state.scene][state.mode]+'")';$('#live-place').textContent=O.scenes.find(s=>s.id===state.scene).label;$('#live-mode').textContent=state.mode==='nes'?'PIXEL ART NES':'FOTOGRAFICA';$$('[data-mode]').forEach(b=>selected(b,state.styleChosen&&b.dataset.mode===state.mode));}
 setInterval(()=>{if(!state.ready||!state.visited||$('#studio').hidden||!$('#blink').checked||matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden)return;const ticket=liveTicket;$('#live-character').src=liveClosed;setTimeout(()=>{if(ticket===liveTicket)$('#live-character').src=liveOpen;},130);},4700);
 $('#blink').addEventListener('change',()=>{if(liveOpen)$('#live-character').src=liveOpen;});
 function sceneNote(s){return state.mode==='nes'?s.nes_note:s.note;}
 function scenes(){
  const grid=$('#scene-grid');grid.replaceChildren();for(const s of O.scenes){const b=el('button',{class:'choice scene-choice','data-scene':s.id,onclick:()=>{changed();state.scene=s.id;mode();scenes();show(2);}},el('img',{src:PORTABLE.thumbs[s.id][state.mode],alt:'',class:state.mode==='nes'?'pixel':''}),el('span',{class:'choice-copy'},el('strong',{},s.label),el('span',{},s.place)));b.title=sceneNote(s);selected(b,state.scene===s.id);grid.append(b);}$('#scene-note').textContent=sceneNote(O.scenes.find(s=>s.id===state.scene));
 }
 function bottomColors(){const c=O.colors;if(!['cargo','jeans','chino','shorts','tuta'].includes(state.character.bottom))return c.fabric;const seen=new Set();return[...c.denim,...c.fabric].filter(x=>{if(seen.has(x.id))return false;seen.add(x.id);return true;});}
 function setCharacter(field,value){
  const before={...state.character};state.character=R.applyField(state.character,field,value);
  if(field==='bottom'&&!bottomColors().some(c=>c.id===state.character.bottom_color))state.character.bottom_color=bottomColors()[0].id;
  if(field==='build'&&(before.top!==state.character.top||before.bottom!==state.character.bottom))notice('Aggiornati i capi senza variante per questa corporatura. Le scelte compatibili sono rimaste invariate.');
  changed();live();creator();$('#creator-panes [data-field="'+field+'"][data-value="'+value+'"]')?.focus({preventScroll:true});
 }
 function revealControls(field,changes){
  state.character=R.normalize({...state.character,...changes});changed();live();creator();
  notice('Strati aggiornati per mostrare il dettaglio: '+Object.entries(changes).map(([k,v])=>labels[k]?.[v]||v).join(', ')+'.');
 }
 const group=(title,...children)=>el('section',{class:'group'},el('h3',{},title),...children);
 function effectGroup(title,field,list,effects){
  const wrapper=group(title,list);wrapper.dataset.controlField=field;let hidden=0;
  for(const button of list.querySelectorAll('button')){
   const value=button.dataset.value,n=effects.pixels[value];button.dataset.pixelChange=n===null?'incompatible':String(n);
   if(n===null){button.disabled=true;button.title='Nessun livello disegnato per questa corporatura.';}
   else if(value!==state.character[field]&&n===0){button.disabled=true;button.title='Coperto dagli strati attuali: nessuna differenza visibile.';hidden++;}
  }
  if(hidden){const note=el('p',{class:'control-effect-note'},'Le alternative attenuate sono coperte dagli strati attuali: non cambierebbero i pixel visibili.');
   if(Object.keys(effects.reveal).length)note.append(' ',el('button',{class:'text-button reveal-control','data-reveal-field':field,onclick:()=>revealControls(field,effects.reveal)},'Scopri questo dettaglio →'));
   wrapper.append(note);
  }return wrapper;
 }
 function options(title,field){const list=el('div',{class:'options'}),values=O.choices[field];for(const value of values){const b=el('button',{class:'option'+(faceFields.includes(field)?' face-option':''),'data-field':field,'data-value':value,onclick:()=>setCharacter(field,value)},el('img',{src:R.characterIcon(state.mode,field,value),alt:'',loading:'lazy'}),el('span',{},labels[field]?.[value]||value));selected(b,state.character[field]===value);list.append(b);}return effectGroup(title,field,list,R.controlEffects(state.character,field,values));}
 function swatches(title,field,colors){const list=el('div',{class:'swatches'});for(const c of colors){const b=el('button',{class:'swatch',style:'background:'+c.hex,title:c.label,'aria-label':c.label,'data-field':field,'data-value':c.id,onclick:()=>setCharacter(field,c.id)});selected(b,state.character[field]===c.id);list.append(b);}return effectGroup(title,field,list,R.controlEffects(state.character,field,colors.map(c=>c.id)));}
 function creator(){
  const p=$('#creator-panes'),c=state.character,co=O.colors;p.replaceChildren();const add=(...children)=>p.append(...children);
  if(state.tab==='body'){const presets=el('div',{class:'preset-grid'});for(const preset of O.presets){const pic=R.character({...O.defaults.character,...preset.character},state.mode).toDataURL();presets.append(el('button',{onclick:()=>{state.character=R.normalize({...O.defaults.character,...preset.character});changed();live();creator();}},el('img',{src:pic,alt:''}),el('strong',{},preset.label)));}add(group('Parti da un look, poi cambialo',presets),options('Corporatura','build'),swatches('Tonalità della pelle','skin',co.skin),el('p',{class:'compatibility-note'},'Tre basi LPC realmente differenti. I capi privi di un livello compatibile sono disattivati.'));}
  if(['face','hair','expression'].includes(state.tab))add(el('div',{class:'face-detail'},el('img',{id:'face-detail-image',src:R.faceDetail(c),alt:'Ingrandimento dei pixel effettivi del viso'}),el('p',{},el('strong',{},'Il viso, da vicino.'),el('span',{},'Pixel nativi ingranditi: occhi, naso, labbra ed espressioni sono piccoli dettagli del disegno. Le coperture restano visibili anche qui.'))));
  if(state.tab==='face')add(options('Forma del viso','face'),options('Forma degli occhi','eye_shape'),swatches('Colore degli occhi','eyes',co.eyes),options('Sopracciglia','brows'),options('Naso','nose'),options('Labbra','mouth'));
  if(state.tab==='hair')add(options('Acconciatura','hair'),swatches('Capelli, barba e sopracciglia','hair_color',co.hair),options('Barba e baffi','beard'));
  if(state.tab==='expression')add(options('Espressione','expression'));
  if(state.tab==='top'){add(options('Capo di sopra','top'),swatches('Colore del capo','top_color',co.fabric));if(['cyber_jacket','field_suit','tech_vest','cappotto','trench'].includes(c.top))add(swatches('Accenti e parti tecniche','inner_color',co.fabric));}
  if(state.tab==='bottom')add(options('Capo di sotto','bottom'),swatches('Tessuto e colore','bottom_color',bottomColors()),swatches('Cintura','belt_color',co.leather));
  if(state.tab==='shoes')add(options('Calzature','shoes'),swatches('Colore delle scarpe','shoes_color',co.leather));
  if(state.tab==='extras'){add(options('Copricapo','hat'));if(['cuffie','berretto','bandana','cappuccio'].includes(c.hat))add(swatches('Colore del copricapo','hat_color',co.fabric));add(options('Occhiali','glasses'),options('Accessorio','accessory'));if(c.accessory!=='none')add(swatches('Colore dell’accessorio','accessory_color',c.accessory==='collana'?co.metal:co.fabric));add(options('Oggetto in mano','held'),el('p',{class:'hint'},'Un oggetto richiede la posa con le mani davanti. Se scegli un’altra posa, l’oggetto viene riposto.'));}
  if(state.tab==='pose')add(options('Posa','pose'));
  $$('#tabs button').forEach(b=>{b.classList.toggle('active',b.dataset.tab===state.tab);b.setAttribute('aria-pressed',String(b.dataset.tab===state.tab));});
 }
 $$('#tabs button').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;creator();b.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest',inline:'nearest'});}));
 function animals(){
  const grid=$('#animal-grid');grid.replaceChildren();const none=el('button',{class:'choice animal-choice','data-animal':'none',onclick:()=>{changed();state.companion=null;animals();companionOptions();live();}},el('span',{class:'animal-picture none-picture','aria-hidden':'true'},'—'),el('strong',{},'Nessuno'));selected(none,!state.companion);grid.append(none);
  for(const a of O.animals){const b=el('button',{class:'choice animal-choice','data-animal':a.id,onclick:()=>{changed();state.companion={animal:a.id,variant:a.variants[0].id,pose:a.poses[0]};animals();companionOptions();live();}},el('span',{class:'animal-picture'},el('img',{src:R.animalIcon(state.mode,a),alt:''})),el('strong',{},a.label));selected(b,state.companion?.animal===a.id);grid.append(b);}
 }
 function companionOptions(){
  const box=$('#companion-options');box.replaceChildren();box.hidden=!state.companion;if(!state.companion)return;
  const a=O.animals.find(v=>v.id===state.companion.animal);
  for(const [title,key,values]of [['Mantello','variant',a.variants],['Posa','pose',a.poses.map(v=>({id:v,label:labels.animalPose[v]}))]]){
   const list=el('div',{class:'variant-options'});for(const v of values){const b=el('button',{class:'option','data-comp-field':key,'data-value':v.id,onclick:()=>{changed();state.companion[key]=v.id;companionOptions();live();$('#companion-options [data-comp-field="'+key+'"][data-value="'+v.id+'"]').focus({preventScroll:true});}},v.hex?el('span',{class:'color-dot',style:'background:'+v.hex}):null,v.label);selected(b,state.companion[key]===v.id);list.append(b);}box.append(group(title,list));
  }
 }
 const editor=CasardiEditor.mount({root:$('#composition-panel'),wrap:$('.preview-wrap'),image:$('#final-preview'),stickers:O.stickers,getComposition:()=>state.composition,getMode:()=>state.mode,imageFor:id=>PORTABLE.stickerImages[id][state.mode],notify:notice,onChange:(composition,{render})=>{if(state.busy)return;state.composition=composition;changed();if(render){$('#export').disabled=true;preview();}}});
 async function preview(){
  editor.setRendering();previewController?.abort();const ctl=previewController=new AbortController(),epoch=state.epoch;$('#preview-loading').hidden=false;$('#export').disabled=true;
  let c=null;try{c=await R.compose(job(),matchMedia('(max-width: 760px)').matches?900:1200,{signal:ctl.signal,editor:true});if(epoch!==state.epoch||ctl.signal.aborted)return;const data={image:c.toDataURL('image/png'),clean:c.editor.clean.toDataURL('image/png'),ghost:c.editor.ghost.toDataURL('image/png'),meta:c.editor.meta};const image=$('#final-preview');image.src=data.image;await image.decode();if(epoch!==state.epoch||ctl.signal.aborted)return;await editor.setPreview(data);$('#export').disabled=false;}
  catch(e){if(previewController===ctl&&epoch===state.epoch&&!ctl.signal.aborted){editor.failed();notice(e.name==='AbortError'?'Anteprima interrotta. Puoi continuare a modificare la composizione o tornare indietro e riprovare.':e.message||'Anteprima non riuscita. Riprova o chiudi altre schede per liberare memoria.',true);}}
  finally{R.dispose(c);if(previewController===ctl&&epoch===state.epoch){editor.setRendering(false);$('#preview-loading').hidden=true;}}
 }
 function show(n){
  if(!state.ready)return;if(state.busy){notice('Attendi il PNG oppure usa Ricomincia per annullare.');return;}if(n>0&&!state.styleChosen)return;if(n>state.highest+1)return;
  state.step=Math.max(0,Math.min(5,n));state.highest=Math.max(state.highest,state.step);document.body.dataset.step=state.step;
  $$('.pane').forEach(p=>p.hidden=Number(p.dataset.pane)!==state.step);
  $$('.steps button').forEach(b=>{const i=Number(b.dataset.step);b.disabled=i>state.highest+1||i>0&&!state.styleChosen;b.classList.toggle('current',i===state.step);b.classList.toggle('done',i<state.step);if(i===state.step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  $('#step-kicker').textContent='PASSAGGIO '+(state.step+1)+' DI 6 · '+titles[state.step].toLocaleUpperCase('it');$('#prev').disabled=state.step===0;$('#next').hidden=state.step===5;$('#next').disabled=state.step===0&&!state.styleChosen;$('#navigation-note').textContent=notes[state.step];
  if(state.step===3)creator();if(state.step===5){if(!state.file)preview();}else{previewController?.abort();}
  window.scrollTo({top:0,behavior:'instant'});$('#main-content').focus({preventScroll:true});
 }
 $('#start').addEventListener('click',()=>{if(!state.ready)return;state.visited=true;$('#welcome').hidden=true;$('#studio').hidden=false;show(state.step);});
 $('#brand-home').addEventListener('click',e=>{e.preventDefault();if(state.busy){notice('Attendi il PNG oppure usa Ricomincia per annullare.');return;}previewController?.abort();$('#studio').hidden=true;$('#welcome').hidden=false;$('#start').firstChild.textContent='Continua ';window.scrollTo({top:0,behavior:'instant'});});
 $$('.steps button').forEach(b=>b.addEventListener('click',()=>show(Number(b.dataset.step))));$('#prev').addEventListener('click',()=>show(state.step-1));$('#next').addEventListener('click',()=>show(state.step+1));$('#edit').addEventListener('click',()=>show(3));
 $$('[data-mode]').forEach(b=>b.addEventListener('click',()=>{changed();state.mode=b.dataset.mode;state.styleChosen=true;mode();scenes();animals();live();show(1);}));
 $('#nickname').addEventListener('input',e=>{state.name=R.cleanName(e.target.value);if(Array.from(e.target.value).length>28)e.target.value=state.name;changed();});
 $('#export').addEventListener('click',async()=>{
  if(state.busy)return;editor.setBusy(true);state.busy=true;const epoch=state.epoch,ctl=exportController=new AbortController(),data=job();discardFile();$('#export').disabled=true;$('#export').textContent='Composizione HD…';$('#export-progress').hidden=false;$('#progress').value=0;
  let c=null;try{
   c=await R.compose(data,3000,{signal:ctl.signal,onProgress:v=>$('#progress').value=v});const blob=await R.pngBlob(c,data,ctl.signal);R.dispose(c);c=null;if(epoch!==state.epoch||ctl.signal.aborted)return;
   const filename='cartolina-casardi-'+data.scene+'-'+(data.mode==='nes'?'pixel':'foto')+'.png';state.file=new File([blob],filename,{type:'image/png'});fileURL=URL.createObjectURL(blob);creditsURL=URL.createObjectURL(new Blob([R.credit(data).text],{type:'text/plain;charset=utf-8'}));
   $('#save').href=fileURL;$('#save').download=filename;$('#open-image').href=fileURL;$('#save-image').src=fileURL;$('#save-credits').href=creditsURL;$('#file-details').textContent='PNG · 3000 × 2000 px · '+(blob.size/1048576).toLocaleString('it-IT',{maximumFractionDigits:1})+' MB · Crediti inclusi nei metadati';
   let canShare=false;try{canShare=!!navigator.share&&!!navigator.canShare?.({files:[state.file]});}catch(_){}$('#share').hidden=!canShare;
   $('#progress').value=1;$('#result').hidden=false;CasardiBridge.publish(state.file);$('#result').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }catch(e){if(e.name!=='AbortError'&&epoch===state.epoch)notice(e.message||'Non riesco a generare il PNG. Chiudi altre schede e riprova.',true);}
  finally{R.dispose(c);if(epoch===state.epoch){state.busy=false;editor.setBusy(false);$('#export').disabled=false;$('#export').innerHTML='Genera PNG 3000 × 2000 <span aria-hidden="true">↓</span>';$('#export-progress').hidden=true;}}
 });
 $('#share').addEventListener('click',async()=>{if(!state.file)return;try{await navigator.share({files:[state.file],title:'Cartolina Casardi · Open Day 2026/27'});}catch(e){if(e.name!=='AbortError')notice('Condivisione non disponibile. Usa Scarica PNG oppure Apri l’immagine.',true);}});
 function reset(){
  ++state.epoch;previewController?.abort();exportController?.abort();state.busy=false;discardFile(false);CasardiBridge.clear(true);release(previewURL);previewURL=null;editor.reset();R.clear();
  Object.assign(state,{mode:'photo',styleChosen:false,scene:'casardi',name:'',character:{...O.defaults.character},companion:null,composition:CasardiEditor.defaults(),tab:'body',step:0,highest:0,visited:false});++liveTicket;
  $('#nickname').value='';$('#final-preview').removeAttribute('src');$('#export-progress').hidden=true;$('#progress').value=0;$('#export').disabled=true;$('#export').innerHTML='Genera PNG 3000 × 2000 <span aria-hidden="true">↓</span>';$('#studio').hidden=true;$('#welcome').hidden=false;$('#start').firstChild.textContent='Inizia ';$('#toast').hidden=true;mode();scenes();animals();companionOptions();live();window.scrollTo({top:0,behavior:'instant'});$('#start').focus({preventScroll:true});
 }
 ['#reset','#new'].forEach(s=>$(s).addEventListener('click',reset));
 let modalFocus=null,oldOverflow='';
 function openInfo(){modalFocus=document.activeElement;$('#info-dialog').hidden=false;$('#welcome').inert=true;$('#studio').inert=true;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';$('#info-dialog .dialog').focus();}
 function closeInfo(){$('#info-dialog').hidden=true;$('#welcome').inert=false;$('#studio').inert=false;document.body.style.overflow=oldOverflow;modalFocus?.focus({preventScroll:true});}
 ['#info','#welcome-info'].forEach(s=>$(s).addEventListener('click',openInfo));$('#close-info').addEventListener('click',closeInfo);
 document.addEventListener('keydown',e=>{
  if(!$('#info-dialog').hidden){if(e.key==='Escape'){e.preventDefault();closeInfo();return;}if(e.key==='Tab'){const items=$$('#info-dialog button,#info-dialog a,#info-dialog summary').filter(n=>n.getClientRects().length&&!n.disabled);if(e.shiftKey&&(document.activeElement===items[0]||document.activeElement===$('#info-dialog .dialog'))){e.preventDefault();items.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0].focus();}}return;}
  if(e.altKey&&!$('#studio').hidden){if(e.key==='ArrowRight'){e.preventDefault();show(state.step+1);}if(e.key==='ArrowLeft'){e.preventDefault();show(state.step-1);}}
 });
 function worldStrip(){
  const box=$('#world-strip'),short={casardi:'Casardi · Barletta',pantheon:'Pantheon · Roma',foro:'Arco di Tito · Roma',epidauro:'Teatro di Epidauro',biblioteca:'Malatestiana · Cesena',paestum:'Hera II · Paestum'};
  for(const s of O.scenes)box.append(el('figure',{class:'world-preview'},el('img',{src:PORTABLE.thumbs[s.id].nes,alt:short[s.id]||s.label,width:600,height:400}),el('figcaption',{},short[s.id]||s.label)));
 }
 function credits(){
  const box=$('#credits-list');for(const s of O.scenes){const m=PORTABLE.metadata[s.id];box.append(el('div',{class:'credit-entry'},el('strong',{},s.label),el('p',{},m.artist==='Unknown authorUnknown author'?'Autore non identificato · Archivio storico':m.artist,' · ',m.date,' · ',m.lic),el('p',{},el('a',{href:m.page,target:'_blank',rel:'noopener noreferrer'},'Pagina sorgente'),' · ',el('a',{href:m.licurl,target:'_blank',rel:'noopener noreferrer'},'Licenza')),el('p',{},s.note)));}
  $('#lpc-credits').textContent=PORTABLE.lpcCredits;
  const licenses=$('#license-texts');for(const[name,text]of Object.entries(PORTABLE.licenses))licenses.append(el('details',{class:'license-entry'},el('summary',{},name),el('pre',{},text)));
 }
 async function boot(){
  try{
   if(!HTMLCanvasElement.prototype.toBlob||!window.TextEncoder||!window.Blob||!window.File)throw new Error('Questo browser non dispone delle funzioni necessarie. Apri il file completo in una versione recente di Chrome, Edge, Firefox o Safari.');
   $('#sample-photo').src=$('#style-photo').src=PORTABLE.examples.photo;$('#sample-nes').src=$('#style-nes').src=PORTABLE.examples.nes;mode();scenes();animals();companionOptions();live();credits();worldStrip();await R.fontsReady();
   CasardiBridge.init();state.ready=true;$('#start').disabled=false;$('#start').innerHTML='Inizia <span aria-hidden="true">→</span>';
  }catch(e){$('#boot-error').textContent=(e.message||'Preparazione non riuscita.')+' Se stai visualizzando un allegato, scaricalo e aprilo in un browser, non nell’anteprima dell’app File.';$('#boot-error').hidden=false;$('#start').textContent='Browser non disponibile';}
 }
 boot();
})();
