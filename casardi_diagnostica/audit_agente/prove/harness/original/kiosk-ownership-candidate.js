/* Local-only kiosk controller. No analytics, CDN, persistent visitor data or build step. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const STEPS = ['style','scene','name','character','companion','preview'];
  const csrf = $('meta[name="kiosk-csrf"]').content;
  const state = { options:null, generation:0, epoch:0, step:0, highest:0, mode:'photo',
    styleChosen:false, scene:'casardi', name:'', character:{}, companion:null,
    composition:CasardiEditor.defaults(), tab:'body', exported:null, countdown:null, ready:false };
  const LABELS = {
    build:{minuto:'Minuta',snello:'Snella',medio:'Media',atletico:'Atletica',robusto:'Robusta'},
    face:{ovale:'Ovale',tondo:'Tondo',squadrato:'Squadrato',affusolato:'Affusolato'},
    eye_shape:{classici:'Classici',mandorla:'A mandorla',tondi:'Tondi'},
    brows:{naturali:'Naturali',folte:'Folte',sottili:'Sottili'},
    nose:{piccolo:'Piccolo',largo:'Largo',aquilino:'Aquilino'},mouth:{sottili:'Sottili',piene:'Piene'},
    hair:{corti:'Corti',caschetto:'Caschetto',ricci:'Ricci',lunghi:'Lunghi',coda:'Coda',crocchia:'Crocchia',trecce:'Trecce',ondulati:'Ondulati',calvo:'Raso',cresta:'Cresta'},
    beard:{none:'Nessuna',baffi:'Baffi',barba:'Barba',barba_lunga:'Barba lunga'},
    top:{tshirt:'T-shirt',camicia:'Camicia',felpa:'Felpa',maglione:'Maglione',giacca:'Giacca',tunica:'Tunica',giubbotto:'Giubbotto'},
    bottom:{jeans:'Jeans',chino:'Chino',shorts:'Pantaloncini',gonna:'Gonna',gonna_lunga:'Gonna lunga',tuta:'Tuta'},
    shoes:{sneakers:'Sneakers',stivaletti:'Stivaletti',mocassini:'Mocassini',sandali:'Sandali',scarpe_sport:'Scarpe sportive'},
    hat:{none:'Nessuno',corona_alloro:'Corona d’alloro',berretto:'Berretto',cappello:'Cappello',cuffie:'Cuffie'},
    glasses:{none:'Nessuno',tondi:'Tondi',sole:'Da sole',spessi:'Spessi'},
    accessory:{none:'Nessuno',collana:'Collana',sciarpa:'Sciarpa',zaino:'Zaino',tracolla:'Tracolla'},
    held:{none:'Niente',libro:'Libro',pergamena:'Pergamena',cetra:'Cetra'},
    pose:{rilassata:'Rilassata',saluto:'Saluto',fianchi:'Mani sui fianchi',libro:'Con il libro'},
    expression:{neutra:'Neutra',sorriso:'Sorriso',entusiasta:'Entusiasta',seria:'Seria',curiosa:'Curiosa',sorpresa:'Sorpresa'},
    animalPose:{seduto:'Seduto',in_piedi:'In piedi',accovacciato:'Accovacciato',posato:'Posato',ali:'Ali aperte',cammina:'In cammino',ritirata:'Nel guscio'},
  };
  const FACE_FIELDS = ['hair','face','beard','hat','glasses','expression','eye_shape','brows','nose','mouth'];
  function node(tag, attrs={}, ...children) {
    const n=document.createElement(tag);
    for(const [k,v] of Object.entries(attrs)) {
      if(k==='class') n.className=v;
      else if(k.startsWith('on')) n.addEventListener(k.slice(2),v);
      else if(v!==null && v!==undefined) n.setAttribute(k,v);
    }
    for(const c of children) if(c!==null && c!==undefined) n.append(c.nodeType?c:document.createTextNode(c));
    return n;
  }
  let toastTimer;
  function notify(message,error=false) {
    clearTimeout(toastTimer);
    $('#status span').textContent=message; $('#status').classList.toggle('error',error); $('#status').hidden=false;
    if(!error) toastTimer=setTimeout(()=>$('#status').hidden=true,8000);
  }
  $('#status button').addEventListener('click',()=>$('#status').hidden=true);
  class ApiError extends Error { constructor(message,status){ super(message);this.status=status; } }
  async function api(path,body,signal) {
    let res,timedOut=false;
    const controller=new AbortController(),relay=()=>controller.abort();
    if(signal){if(signal.aborted)controller.abort();else signal.addEventListener('abort',relay,{once:true});}
    const timer=setTimeout(()=>{timedOut=true;controller.abort();},path==='/api/export'?120000:30000);
    try {
      res=await fetch(path,{method:body===undefined?'GET':'POST',signal:controller.signal,
        headers:body===undefined?{}:{'Content-Type':'application/json','X-Kiosk-CSRF':csrf,'X-Kiosk-Generation':String(state.generation)},
        body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
    } catch(e) {
      if(timedOut)throw new ApiError('Il server impiega troppo tempo. Riprova; se persiste, avvisa l’operatore.',0);
      if(e.name==='AbortError') throw e;
      throw new ApiError('Il server locale non risponde. Controlla che sia avviato e riprova.',0);
    } finally {
      clearTimeout(timer);if(signal)signal.removeEventListener('abort',relay);
    }
    if(!res.ok) {
      let message='Operazione non riuscita. Riprova.';
      try { message=(await res.json()).error||message; } catch(_) {}
      throw new ApiError(message,res.status);
    }
    return res;
  }
  const json=async(...args)=>(await api(...args)).json();
  const debounce=(fn,ms)=>{let t;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),ms);};};
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function payload(){return {mode:state.mode,scene:state.scene,name:state.name,
    character:{...state.character},companion:state.companion?{...state.companion}:null,composition:JSON.parse(JSON.stringify(state.composition))};}
  function changed() {
    clearInterval(state.countdown);state.exported=null;$('#result').hidden=true;
  }
  function select(n,yes){n.classList.toggle('selected',yes);n.setAttribute('aria-pressed',String(yes));}

  // ---- live sprite (last request wins, object URLs are explicitly released)
  let spriteSeq=0, compSeq=0, spriteAbort, compAbort;
  let openURL=null, closedURL=null, companionURL=null, previewURL=null;
  function release(url){if(url) URL.revokeObjectURL(url);}
  async function updateSprite(){
    if(!state.ready) return;
    const seq=++spriteSeq, epoch=state.epoch;
    if(spriteAbort) spriteAbort.abort();spriteAbort=new AbortController();
    try {
      const data={mode:state.mode,character:{...state.character},scale:5};
      const b=await (await api('/api/sprite',data,spriteAbort.signal)).blob();
      if(seq!==spriteSeq||epoch!==state.epoch) return;
      const u=URL.createObjectURL(b);const old=openURL;openURL=u;
      $('#live-char').src=u;release(old);release(closedURL);closedURL=null;
      if($('#idle-toggle').checked&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
        const bb=await (await api('/api/sprite',{...data,character:{...data.character,blink:true}},spriteAbort.signal)).blob();
        if(seq===spriteSeq&&epoch===state.epoch) closedURL=URL.createObjectURL(bb);
      }
    } catch(e){if(e.name!=='AbortError'&&seq===spriteSeq) notify(e.message,true);}
  }
  const refreshSprite=debounce(updateSprite,70);
  const refreshCompanion=debounce(async()=>{
    const seq=++compSeq,epoch=state.epoch;
    if(compAbort) compAbort.abort();compAbort=new AbortController();
    if(!state.companion){$('#live-comp').hidden=true;release(companionURL);companionURL=null;return;}
    try {
      const b=await (await api('/api/companion',{mode:state.mode,companion:state.companion},compAbort.signal)).blob();
      if(seq!==compSeq||epoch!==state.epoch||!state.companion) return;
      const u=URL.createObjectURL(b);release(companionURL);companionURL=u;
      $('#live-comp').src=u;$('#live-comp').hidden=false;
      const ratio={gatto:.30,cane:.40,volpe:.36,gufo:.34,coniglio:.32,corvo:.30,tartaruga:.10,drago:.34}[state.companion.animal];
      $('#live-comp').style.height=`${62*ratio}%`;
    }catch(e){if(e.name!=='AbortError') notify(e.message,true);}
  },70);
  setInterval(()=>{
    if(!$('#idle-toggle').checked||!closedURL||!openURL||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const oldEpoch=state.epoch,u=openURL;$('#live-char').src=closedURL;
    setTimeout(()=>{if(oldEpoch===state.epoch&&u===openURL) $('#live-char').src=openURL;},130);
  },4700);
  $('#idle-toggle').addEventListener('change',()=>{if(openURL) $('#live-char').src=openURL;if($('#idle-toggle').checked) refreshSprite();});

  function applyMode(){
    document.body.classList.toggle('mode-photo',state.mode==='photo');
    document.body.classList.toggle('mode-nes',state.mode==='nes');
    $('#live-stage').classList.toggle('pixel',state.mode==='nes');
    const scene=state.options.scenes.find(s=>s.id===state.scene);
    $('#live-stage').style.backgroundImage=`url("${scene.thumbs[state.mode]}")`;
    $$('[data-style]').forEach(b=>select(b,state.styleChosen&&b.dataset.style===state.mode));
  }
  function showStep(n){
    if(!state.ready)return;
    if(exporting&&exportEpoch===state.epoch){notify('Attendi la composizione HD. Per annullare usa Nuovo visitatore.');return;}
    if(n>0&&!state.styleChosen)return;
    state.step=Math.max(0,Math.min(5,n));state.highest=Math.max(state.highest,state.step);
    const id=STEPS[state.step];
    $$('.pane').forEach(p=>p.classList.toggle('active',p.dataset.pane===id));
    $$('.step').forEach((b,i)=>{
      b.classList.toggle('active',i===state.step);b.classList.toggle('done',i<state.step);
      b.disabled=i>state.highest+1||(!state.styleChosen&&i>0);
      if(i===state.step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');
    });
    $('#btn-prev').disabled=state.step===0;
    $('#btn-next').hidden=state.step===5;
    $('#btn-next').disabled=state.step===0&&!state.styleChosen;
    $('#footer-note').textContent={style:'Lo stile vale per tutte le ambientazioni.',scene:'Ogni luogo: fotografia autentica e ricostruzione pixel art.',name:'Il nome è facoltativo.',character:'Scegli i dettagli. La composizione completa è in Anteprima.',companion:'Il companion è facoltativo.',preview:'PNG 3000 × 2000 · Collegamento temporaneo sulla rete locale.'}[id];
    $('#panel').scrollTop=0;
    if(id==='character')renderCreator();
    if(id==='preview')loadPreview();
    else { if(previewAbort)previewAbort.abort(); clearInterval(state.countdown); }
  }
  $('#btn-start').addEventListener('click',()=>{
    $('#screen-welcome').classList.remove('active');$('#screen-studio').classList.add('active');showStep(0);
  });
  $('#btn-next').addEventListener('click',()=>showStep(state.step+1));
  $('#btn-prev').addEventListener('click',()=>showStep(state.step-1));
  $$('.step').forEach(b=>b.addEventListener('click',()=>showStep(STEPS.indexOf(b.dataset.step))));
  $$('[data-style]').forEach(b=>b.addEventListener('click',()=>{
    changed();state.mode=b.dataset.style;state.styleChosen=true;applyMode();buildScenes();buildAnimals();
    refreshSprite();refreshCompanion();if(state.step===0)showStep(1);
  }));
  function buildScenes(){
    const grid=$('#scene-grid');grid.replaceChildren();
    for(const scene of state.options.scenes){
      const c=node('button',{class:'choice','data-scene':scene.id,'aria-label':scene.label,onclick:()=>{
        changed();state.scene=scene.id;applyMode();buildScenes();if(state.step===1)showStep(2);
      }},node('img',{class:'choice-art'+(state.mode==='nes'?' pixel':''),src:scene.thumbs[state.mode],alt:''}),
        node('span',{class:'tag'},scene.place),node('h3',{},scene.label));
      c.title=state.mode==='nes'?scene.nes_note:scene.note;select(c,scene.id===state.scene);grid.append(c);
    }
  }
  $('#name-input').addEventListener('input',e=>{state.name=e.target.value;changed();});

  // ---- creator; every icon is rendered from the same actual sprite engine
  function setCharacter(field,value){
    state.character[field]=value;
    if(field==='held') state.character.pose=value==='none'?'rilassata':'libro';
    if(field==='pose'&&value==='libro'&&state.character.held==='none') state.character.held='libro';
    if(field==='pose'&&value!=='libro') state.character.held='none';
    if(field==='accessory'){
      const col=value==='collana'?state.options.colors.metal:state.options.colors.fabric;
      if(!col.some(c=>c.id===state.character.accessory_color)) state.character.accessory_color=col[0].id;
    }
    if(field==='bottom'){
      const cols=bottomColors();
      if(!cols.some(c=>c.id===state.character.bottom_color))state.character.bottom_color=cols[0].id;
    }
    for(const[fieldName,table]of Object.entries(state.options.compatibility||{})){const allowed=table[state.character[fieldName]];if(allowed&&!allowed.includes(state.character.build))state.character[fieldName]=fieldName==='top'?'cyber_jacket':'gonna';}
    // Covered facial options stay stored; uncovering is an explicit action.
    changed();refreshSprite();renderCreator();
    const target=$(`#creator-panes [data-field="${field}"][data-value="${value}"]`);
    if(target)target.focus({preventScroll:true});
  }
  const group=(title,...children)=>node('div',{class:'group'},node('h4',{},title),...children);
  function choices(title,field){
    const list=node('div',{class:'chips'});
    for(const value of state.options.choices[field]){
      const face=FACE_FIELDS.includes(field);
      const button=node('button',{class:'chip visual'+(face?' face-icon':''),'data-field':field,'data-value':value,
        onclick:()=>setCharacter(field,value)},
        node('img',{src:`/icons/${state.mode}/${field}/${value}.png?v=${state.options.asset_revision}`,alt:'',loading:'lazy'}),
        node('span',{},(LABELS[field]||{})[value]||value));
      const allowed=state.options.compatibility?.[field]?.[value];if(allowed&&!allowed.includes(state.character.build)){button.disabled=true;button.title='Disponibile per la corporatura '+LABELS.build[allowed[0]];}
      select(button,state.character[field]===value);list.append(button);
    }
    const g=group(title,list);g.dataset.controlField=field;return g;
  }
  function swatches(title,field,list){
    const box=node('div',{class:'swatches roomy'});
    for(const c of list){
      const b=node('button',{class:'swatch',title:c.label,'aria-label':c.label,'data-field':field,'data-value':c.id,
        style:`background:${c.hex}`,onclick:()=>setCharacter(field,c.id)});
      select(b,state.character[field]===c.id);box.append(b);
    }
    const g=group(title,box);g.dataset.controlField=field;return g;
  }
  function bottomColors(){
    const c=state.options.colors;
    if(!['cargo','jeans','chino','shorts','tuta'].includes(state.character.bottom))return c.fabric;
    const ids=new Set();return [...c.denim,...c.fabric].filter(x=>{if(ids.has(x.id))return false;ids.add(x.id);return true;});
  }
  let effectsSequence=0;
  async function updateControlEffects(){
    const ticket=++effectsSequence,epoch=state.epoch,fields=$$('#creator-panes [data-control-field]').map(n=>n.dataset.controlField);
    try{
      const result=await json('/api/control-effects',{character:{...state.character},fields});
      if(ticket!==effectsSequence||epoch!==state.epoch)return;
      const image=$('#face-detail-image');if(image)image.src=result.face;
      for(const group of $$('#creator-panes [data-control-field]')){
        const field=group.dataset.controlField,effect=result.effects[field];let hidden=0;
        for(const b of group.querySelectorAll('button[data-value]')){
          const value=b.dataset.value,count=effect.pixels[value];b.dataset.pixelChange=count===null?'incompatible':String(count);
          if(count===null){b.disabled=true;b.title='Nessun livello disegnato per questa corporatura.';}
          else if(value!==state.character[field]&&count===0){b.disabled=true;b.title='Coperto dagli strati attuali: nessuna differenza visibile.';hidden++;}
        }
        if(hidden){const n=node('p',{class:'control-effect-note'},'Le alternative attenuate sono coperte dagli strati attuali: non cambierebbero i pixel visibili.');
          if(Object.keys(effect.reveal).length)n.append(node('button',{class:'text-button reveal-control','data-reveal-field':field,onclick:()=>{Object.assign(state.character,effect.reveal);changed();refreshSprite();renderCreator();notify('Strati aggiornati per rendere visibile il dettaglio.');}},'Scopri questo dettaglio →'));
          group.append(n);
        }
      }
    }catch(e){if(ticket===effectsSequence&&epoch===state.epoch)notify('Verifica delle coperture non disponibile. Riprova questa categoria.',true);}
  }
  function renderCreator(){
    const pane=$('#creator-panes'),c=state.character,co=state.options.colors;
    pane.replaceChildren();const add=(...kids)=>pane.append(...kids);
    if(state.tab==='body')add(choices('Corporatura','build'),swatches('Tonalità della pelle','skin',co.skin));
    if(['face','hair','expression'].includes(state.tab))add(node('div',{class:'face-detail'},node('img',{id:'face-detail-image',alt:'Pixel effettivi del viso ingranditi'}),node('p',{},node('strong',{},'Il viso, da vicino.'),node('span',{},'Pixel nativi ingranditi. Le coperture restano visibili: usa Scopri questo dettaglio per rimuoverle.'))));
    if(state.tab==='face')add(choices('Forma del viso','face'),choices('Occhi','eye_shape'),swatches('Colore degli occhi','eyes',co.eyes),choices('Sopracciglia','brows'),choices('Naso','nose'),choices('Labbra','mouth'));
    if(state.tab==='hair')add(choices('Acconciatura','hair'),swatches('Capelli, barba e sopracciglia','hair_color',co.hair),choices('Barba e baffi','beard'));
    if(state.tab==='expression')add(choices('Espressione','expression'));
    if(state.tab==='top'){
      add(choices('Capo di sopra','top'),swatches('Colore del capo','top_color',co.fabric));
      if(['cyber_jacket','field_suit','tech_vest','cappotto','trench'].includes(c.top))add(swatches('Accenti e parti tecniche','inner_color',co.fabric));
    }
    if(state.tab==='bottom')add(choices('Capo di sotto','bottom'),swatches('Tessuto e colore','bottom_color',bottomColors()),swatches('Cintura','belt_color',co.leather));
    if(state.tab==='shoes')add(choices('Calzature','shoes'),swatches('Colore delle scarpe','shoes_color',co.leather));
    if(state.tab==='extras'){
      add(choices('Copricapo','hat'));
      if(c.hat!=='none'&&c.hat!=='corona_alloro')add(swatches('Colore del copricapo','hat_color',co.fabric));
      add(choices('Occhiali','glasses'),choices('Accessorio','accessory'));
      if(c.accessory!=='none')add(swatches('Colore dell’accessorio','accessory_color',c.accessory==='collana'?co.metal:co.fabric));
      add(choices('Oggetto in mano','held'),node('p',{class:'hint'},'Gli oggetti usano la posa con le mani davanti. Scegliendo un’altra posa l’oggetto viene riposto.'));
    }
    if(state.tab==='pose')add(choices('Posa','pose'));
    $$('#creator-tabs button').forEach(b=>{b.classList.toggle('active',b.dataset.tab===state.tab);b.setAttribute('aria-pressed',String(b.dataset.tab===state.tab));});
    updateControlEffects();
  }
  $$('#creator-tabs button').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;renderCreator();}));

  // ---- optional original animal sprites
  function buildAnimals(){
    const grid=$('#animal-grid');grid.replaceChildren();
    const none=node('button',{class:'choice','data-animal':'none',onclick:()=>{
      changed();state.companion=null;buildAnimals();companionOptions();refreshCompanion();
    }},node('div',{class:'choice-icon none-symbol','aria-hidden':'true'},'—'),node('h3',{},'Nessun companion'));
    select(none,!state.companion);grid.append(none);
    for(const a of state.options.animals){
      const b=node('button',{class:'choice','data-animal':a.id,onclick:()=>{
        changed();state.companion={animal:a.id,variant:a.variants[0].id,pose:a.poses[0]};
        buildAnimals();companionOptions();refreshCompanion();$('#companion-options').scrollIntoView({block:'nearest',behavior:'smooth'});
      }},node('div',{class:'choice-icon'},node('img',{src:`/icons/${state.mode}/animal/${a.id}.png?v=${state.options.asset_revision}`,alt:''})),node('h3',{},a.label));
      select(b,!!state.companion&&state.companion.animal===a.id);grid.append(b);
    }
  }
  function companionOptions(){
    const box=$('#companion-options');box.replaceChildren();box.hidden=!state.companion;
    if(!state.companion)return;
    const a=state.options.animals.find(x=>x.id===state.companion.animal);
    for(const [title,key,values] of [['Mantello','variant',a.variants],['Posa','pose',a.poses.map(p=>({id:p,label:LABELS.animalPose[p]}))]]){
      const row=node('div',{class:'chips'});
      for(const v of values){
        const b=node('button',{class:'chip','data-comp-field':key,'data-value':v.id,onclick:()=>{
          changed();state.companion[key]=v.id;companionOptions();refreshCompanion();
        }},v.hex?node('span',{class:'color-dot',style:`background:${v.hex}`}):null,v.label);
        select(b,state.companion[key]===v.id);row.append(b);
      }
      box.append(group(title,row));
    }
  }

  let editor=null;
  // ---- true postcard preview and HD export
  let previewSeq=0,previewAbort,exporting=false,exportEpoch=-1;
  async function loadPreview(){
    editor.setRendering();
    const seq=++previewSeq,epoch=state.epoch;
    if(previewAbort)previewAbort.abort();const ctl=previewAbort=new AbortController();
    $('#preview-loading').hidden=false;$('#btn-export').disabled=true;$('#result').hidden=true;
    try{
      let response;
      for(let attempt=0;attempt<6;attempt++){
        try{response=await api('/api/editor-preview',payload(),ctl.signal);break;}
        catch(e){if(e.status===429&&attempt<5){await sleep(500);continue;}throw e;}
      }
      const data=await response.json();
      if(seq!==previewSeq||epoch!==state.epoch)return;
      $('#final-preview').src=data.image;
      await $('#final-preview').decode();
      if(seq===previewSeq&&epoch===state.epoch){await editor.setPreview(data);$('#btn-export').disabled=false;}
    }catch(e){if(seq===previewSeq&&epoch===state.epoch&&!ctl.signal.aborted&&e.name!=='AbortError'){editor.failed();notify(e.message,true);}}
    finally{if(seq===previewSeq&&epoch===state.epoch){editor.setRendering(false);$('#preview-loading').hidden=true;}}
  }
  $('#btn-back-edit').addEventListener('click',()=>showStep(3));
  $('#btn-export').addEventListener('click',async()=>{
    if(exporting)return;exporting=true;editor.setBusy(true);const epoch=state.epoch;exportEpoch=epoch;
    const btn=$('#btn-export');btn.disabled=true;btn.textContent='Composizione HD…';$('#result').hidden=true;
    try{
      const data=await json('/api/export',payload());
      if(epoch!==state.epoch)return;
      state.exported=data;
      $('#qr-img').src=data.qr;await $('#qr-img').decode();
      $('#result-url').textContent=data.url;$('#btn-save-pc').href=data.file_url;
      $('#btn-save-credits').href=data.credits_url;$('#btn-save-credits').download='crediti-cartolina.txt';
      $('#result').hidden=false;$('#qr-fallback').hidden=!!data.qr;
      countdown(data.expires_at);$('#result').scrollIntoView({behavior:'smooth',block:'nearest'});
    }catch(e){if(epoch===state.epoch)notify(e.message,true);}
    finally{exporting=false;if(epoch===state.epoch){editor.setBusy(false);btn.disabled=false;btn.textContent='Genera PNG e QR code';}}
  });
  function countdown(expires){
    clearInterval(state.countdown);
    const update=()=>{
      const left=Math.max(0,expires-Math.floor(Date.now()/1000));
      $('#countdown').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;
      if(left<=0){clearInterval(state.countdown);resetAll('Collegamento scaduto: cartolina eliminata. Lo studio è pronto per il prossimo visitatore.');}
    };
    update();state.countdown=setInterval(update,1000);
  }

  // ---- reset also cancels exports in flight (server-side generation check)
  function clearUI(){
    state.epoch++;state.ready=false;state.highest=0;state.step=0;state.mode='photo';state.styleChosen=false;
    state.scene='casardi';state.name='';state.character={...state.options.defaults.character};state.companion=null;state.composition=CasardiEditor.defaults();editor?.reset();state.tab='body';state.exported=null;
    clearInterval(state.countdown);spriteSeq++;compSeq++;previewSeq++;
    if(spriteAbort)spriteAbort.abort();if(compAbort)compAbort.abort();if(previewAbort)previewAbort.abort();
    [openURL,closedURL,companionURL,previewURL].forEach(release);openURL=closedURL=companionURL=previewURL=null;
    ['#live-char','#live-comp','#final-preview','#qr-img'].forEach(s=>$(s).removeAttribute('src'));
    $('#live-comp').hidden=true;$('#result').hidden=true;$('#name-input').value='';$('#result-url').textContent='';
    $('#btn-save-pc').removeAttribute('href');$('#btn-save-credits').removeAttribute('href');
    $('#btn-export').textContent='Genera PNG e QR code';$('#btn-export').disabled=true;
    $('#modal-info').hidden=true;$('#screen-studio').inert=false;$('#screen-studio').classList.remove('active');$('#screen-welcome').classList.add('active');
    $('#status').hidden=true;$('#btn-start').disabled=true;$('#btn-start').textContent='Pulizia della sessione…';
    applyMode();buildScenes();buildAnimals();companionOptions();
  }
  let resetting=false;
  async function resetAll(message){
    if(resetting)return;resetting=true;clearUI();
    try{
      const data=await json('/api/reset',{});state.generation=data.generation;
      state.ready=true;$('#btn-start').disabled=false;$('#btn-start').textContent='Inizia';
      $('#boot-error').hidden=true;$('#btn-retry').hidden=true;refreshSprite();
      if(message)notify(message);
    }catch(e){
      $('#boot-error').textContent='Schermata pulita, ma cancellazione sul server non confermata. Ripristina la connessione e riprova il reset.';
      $('#boot-error').hidden=false;$('#btn-retry').hidden=false;$('#btn-retry').textContent='Riprova il reset';
    }finally{resetting=false;}
  }
  $('#btn-reset').addEventListener('click',()=>resetAll());$('#btn-new').addEventListener('click',()=>resetAll());

  // ---- operator diagnostics and real source credits
  let modalFocus=null;
  async function diagnostics(){
    $('#diag').textContent='Lettura…';
    try{
      const d=await json('/api/diagnostics');
      $('#diag').textContent=[`Indirizzo LAN: ${d.lan_ip}`,`Porta: ${d.port}`,`Indirizzo per il telefono: ${d.base_url}`,
        `Server raggiungibile da questo PC: ${d.listening?'sì':'no'}`,
        `Cartoline temporanee attive: ${d.active_cards.length}`,`Scadenza: ${d.ttl_seconds} secondi`,
        `Cartella temporanea: ${d.export_dir}`,`Fotografie locali: ${Object.values(d.photos).every(Boolean)?'tutte presenti':'file mancanti'}`,
        '',...d.warnings,'La prova interna NON verifica il firewall né l’isolamento fra dispositivi Wi-Fi.',
        'Se il telefono non apre il link: controllare la porta TCP nel firewall e chiedere al responsabile IT una rete con comunicazione fra client. Non modificare autonomamente le policy della scuola.',
        'Il collegamento non funziona dalla rete mobile o da fuori rete. «Salva sul PC» resta disponibile.'].join('\n');
      $('#network-qr').src=d.network_test_qr;
      $('#phone-creator-qr').src=d.phone_creator_qr;
      $('#phone-creator-link').href=d.phone_creator_url;
      $('#phone-creator-link').textContent=d.phone_creator_url;
      const credits=await json('/api/credits');const box=$('#credits-list');box.replaceChildren();
      for(const [sid,c] of Object.entries(credits))box.append(node('p',{},node('strong',{},state.options.scenes.find(s=>s.id===sid).label+' — '),
        c.author+' · ',node('a',{href:c.source,target:'_blank',rel:'noopener noreferrer'},'Fonte'), ' · ',
        node('a',{href:c.photo_license_url,target:'_blank',rel:'noopener noreferrer'},c.photo_license)));
    }catch(e){$('#diag').textContent=e.message;}
  }
  $('#btn-info').addEventListener('click',()=>{modalFocus=document.activeElement;$('#screen-studio').inert=true;$('#modal-info').hidden=false;$('#modal-info .modal-box').focus();diagnostics();});
  function closeModal(){$('#modal-info').hidden=true;$('#screen-studio').inert=false;if(modalFocus)modalFocus.focus();}
  $('#btn-info-close').addEventListener('click',closeModal);$('#btn-diag-refresh').addEventListener('click',diagnostics);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!$('#modal-info').hidden){closeModal();return;}
    if(!$('#modal-info').hidden&&e.key==='Tab'){
      const items=$$('#modal-info button, #modal-info a, #modal-info summary').filter(n=>n.getClientRects().length&&!n.disabled);
      if(e.shiftKey&&(document.activeElement===items[0]||document.activeElement===$('#modal-info .modal-box'))){e.preventDefault();items.at(-1).focus();}
      else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0].focus();}
      return;
    }
    // Never steal text-editing arrows. Keyboard navigation is Alt + arrows.
    if(e.altKey&&$('#screen-studio').classList.contains('active')&&$('#modal-info').hidden){
      if(e.key==='ArrowRight'){e.preventDefault();showStep(state.step+1);}
      if(e.key==='ArrowLeft'){e.preventDefault();showStep(state.step-1);}
    }
  });
  async function boot(){
    $('#btn-retry').hidden=true;
    try{
      state.options=await json('/api/options');if(!editor)editor=CasardiEditor.mount({root:$('#composition-panel'),wrap:$('.preview-wrap'),image:$('#final-preview'),stickers:state.options.stickers,getComposition:()=>state.composition,getMode:()=>state.mode,imageFor:id=>'/stickers/'+id+'.png?mode='+state.mode,notify:notify,onChange:(composition,{render})=>{if(exporting)return;state.composition=composition;changed();if(render){$('#btn-export').disabled=true;loadPreview();}}});for(const[k,v]of Object.entries(state.options.labels||{}))LABELS[k]={...LABELS[k],...v};await resetAll();
    }catch(e){
      $('#boot-error').textContent=e.message;$('#boot-error').hidden=false;$('#btn-retry').hidden=false;
      $('#btn-start').textContent='Server non disponibile';$('#btn-retry').textContent='Riprova la connessione';
    }
  }
  $('#btn-retry').addEventListener('click',boot);
  boot();
})();
