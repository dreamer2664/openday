/* Temporary, local-only Android/Arena diagnostics. No fixes, no network,
 * no visitor name/PNG/token recorded, no storage and no automatic recovery. */
(()=>{
 'use strict';
 const editor=window.__CasardiDiagEditor,wrap=document.querySelector('.preview-wrap');
 if(!editor||!wrap)return;
 const box=document.createElement('section');box.id='casardi-diag-a1';box.style.cssText='margin:12px 0 20px;padding:12px;border:2px solid #e9b863;background:#11182a;color:#f8edda;font:11px/1.6 ui-monospace,monospace;overflow-wrap:anywhere';
 const title=document.createElement('strong');title.textContent='DIAGNOSTICA ANDROID · A1 — non è una nuova correzione';
 const note=document.createElement('p');note.textContent='Quando il personaggio non si muove più, fai uno screenshot di queste righe insieme alla cartolina. Non premere Ricomincia.';note.style.cssText='font:11px/1.6 ui-monospace,monospace;margin:8px 0';
 const readout=document.createElement('pre');readout.id='diag-a1-state';readout.style.cssText='white-space:pre-wrap;font:11px/1.7 ui-monospace,monospace;margin:8px 0;color:#b6f3d4;user-select:text;-webkit-user-select:text';
 const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Dettagli da copiare, solo se richiesti';
 const area=document.createElement('textarea');area.readOnly=true;area.setAttribute('aria-label','Dati tecnici locali del trascinamento');area.style.cssText='width:100%;height:160px;background:#070d1a;color:#e8f5e4;border:1px solid #7a87a4;padding:8px;font:10px/1.5 monospace;user-select:text;-webkit-user-select:text';details.append(summary,area);box.append(title,note,readout,details);wrap.after(box);
 const welcome=document.querySelector('.welcome-copy .eyebrow');if(welcome)welcome.textContent='PROVA TECNICA ANDROID · DIAG A1';
 const mark=document.querySelector('.wordmark small');if(mark)mark.textContent+=' · DIAG A1';
 let seq=0,last=null,event='nessun evento',focus='nessuno';const trace=[],errors=[];let pointerMoves=0,touchMoves=0;
 const target=e=>e.target?.closest?.('[data-drag]')?.dataset.drag||e.target?.id||e.target?.tagName||'window';
 const state=()=>{const s=editor.diagnosticState();return{...s,exportDisabled:document.querySelector('#export').disabled,loading:!document.querySelector('#preview-loading').hidden,focused:document.hasFocus(),hidden:document.hidden,viewport:[innerWidth,innerHeight,visualViewport?.scale??1],scroll:[Math.round(scrollX),Math.round(scrollY)]};};
 const push=o=>{trace.push(o);if(trace.length>32)trace.shift();};
 const xy=e=>e.touches?.[0]?{x:Math.round(e.touches[0].clientX),y:Math.round(e.touches[0].clientY)}:{x:Math.round(e.clientX||0),y:Math.round(e.clientY||0)};
 function refresh(){
  const s=state(),a=s.actor;
  if(last)last.current=s;
  readout.textContent='A1 · '+(last?'TENTATIVO PERSONAGGIO '+last.n:'Nessun gesto ricevuto sul personaggio')+'\n'+(last?'Puntatore '+last.id+' · movimenti '+last.moves+' · rilascio '+(last.up?'sì':'no')+' · spostamento dito '+last.dx+', '+last.dy+' px':'')+'\nEditor: '+(s.busy?'ESPORTAZIONE':s.rendering?'ATTESA ANTEPRIMA':s.drag?'GESTO IN CORSO':'LIBERO')+' · foto pronta '+(!s.loading?'sì':'no')+'\nPosizione: '+(a?Math.round(a.x)+', '+Math.round(a.y):'non pronta')+' · ultimo evento '+event+'\nFocus: '+focus+' · errori '+errors.length;
  if(details.open)area.value=JSON.stringify({test:'ANDROID-ARENA-A1',build:'3.3.1 + diagnostics only',embedded:self!==top,pointerEvents:typeof PointerEvent!=='undefined',pointerMoves,touchMoves,last,state:s,trace,errors},null,2);
 }
 for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture','touchstart','touchmove','touchend','touchcancel','focusin','focusout','blur','focus','contextmenu'])window.addEventListener(type,e=>{
  const key=target(e),p=xy(e);event=type+' / '+key;
  if(type==='pointerdown'&&key==='actor'){last={n:++seq,id:e.pointerId,start:p,dx:0,dy:0,moves:0,up:false,before:state()};push({type,key,id:e.pointerId,p,state:state()});}
  else if(type==='pointermove'){pointerMoves++;if(last&&last.id===e.pointerId&&!last.up){last.moves++;last.dx=p.x-last.start.x;last.dy=p.y-last.start.y;}}
  else if(type==='touchmove')touchMoves++;
  else{push({type,key,id:e.pointerId,p,state:state()});if(last&&last.id===e.pointerId&&['pointerup','pointercancel'].includes(type)){last.up=true;last.end=type;}}
  if(type==='focusin')focus=key;
  setTimeout(refresh,0);
 },{capture:true,passive:true});
 window.addEventListener('error',e=>{errors.push(String(e.message).slice(0,180));refresh();});
 window.addEventListener('unhandledrejection',e=>{errors.push(String(e.reason?.message||e.reason).slice(0,180));refresh();});
 details.addEventListener('toggle',refresh);
 setInterval(()=>{if(wrap.getClientRects().length)refresh();},300);
 refresh();
})();
