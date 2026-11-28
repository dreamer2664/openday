"""Controlled experiment, not a released fix and not Android-device proof.
Remove PNG encode/decode from the standalone preview, preserve asset renderer,
and permit new actor gestures while a previous actor-only preview is pending.
The baseline files/root deliveries are never overwritten.
"""
from pathlib import Path
import hashlib,json,difflib,subprocess
C=Path('/home/user/.cache/casardi-rootcause');R=C/'casardi_postcard';O=C/'canvas-experiment';O.mkdir(exist_ok=True)
BASE='8b247a2cd86bd0485f352190590371e83150aa3feb99b2cb5c59fc517d9a09ea'
def change(s,a,b):
 assert s.count(a)==1,(a[:100],s.count(a));return s.replace(a,b)
editor=(R/'browser/layout-editor.js').read_text()
editor=change(editor,"const overlay=el('div',{class:'composition-overlay','aria-label':'Elementi della cartolina'}),ghost=el('img',{class:'composition-ghost',alt:'',draggable:'false'});ghost.hidden=true;overlay.append(ghost);wrap.append(overlay);wrap.classList.add('editable-card');", """const overlay=el('div',{class:'composition-overlay','aria-label':'Elementi della cartolina'});
  let ghost=el(cfg.canvasPreview?'canvas':'img',{class:'composition-ghost',alt:'',draggable:'false'}),cleanLayer=cfg.canvasPreview?el('canvas',{class:'composition-clean','aria-hidden':'true'}):null;
  ghost.hidden=true;if(cleanLayer){cleanLayer.hidden=true;overlay.append(cleanLayer);}overlay.append(ghost);wrap.append(overlay);wrap.classList.add('editable-card');""")
editor=change(editor,"function showGhost(delta){if(!urls)return;image.src=urls.clean;ghost.src=urls.ghost;ghost.hidden=false;rect(ghost,{...meta.ghost,x:meta.ghost.x+delta.x,y:meta.ghost.y+delta.y});}", """function showGhost(delta){if(!urls)return;if(cfg.canvasPreview){cleanLayer.hidden=false;image.style.visibility='hidden';ghost.hidden=false;}else if(ghost.hidden){image.src=urls.clean;ghost.src=urls.ghost;ghost.hidden=false;}rect(ghost,{...meta.ghost,x:meta.ghost.x+delta.x,y:meta.ghost.y+delta.y});}""")
editor=change(editor,"function restoreImage(){ghost.hidden=true;if(urls){image.src=urls.main;delete urls.pendingDelta;}}", """function restoreImage(){ghost.hidden=true;if(cfg.canvasPreview){cleanLayer.hidden=true;image.style.visibility='';}if(urls){if(!cfg.canvasPreview)image.src=urls.main;delete urls.pendingDelta;}}
  function restoreBefore(d){if(cfg.canvasPreview&&d.priorDelta){urls.pendingDelta=d.priorDelta;showGhost(d.priorDelta);return true;}restoreImage();return false;}""")
editor=change(editor,"e.preventDefault();target.focus({preventScroll:true});const key=target.dataset.drag;", "e.preventDefault();cfg.onInteractionStart?.();target.focus({preventScroll:true});const key=target.dataset.drag;")
editor=change(editor,"const c=get();drag={kind:key,id:e.pointerId,target,start:position(e),before:copy(c),origin:key==='actor'?{x:meta.actor.x,y:meta.actor.y}:{x:geom(c.stickers[Number(key)]).cx,y:geom(c.stickers[Number(key)]).cy},delta:{x:0,y:0},moved:false,captured:false};", """const c=get(),priorDelta=cfg.canvasPreview&&urls?.pendingDelta?{...urls.pendingDelta}:null,delta=priorDelta||{x:0,y:0};drag={kind:key,id:e.pointerId,target,start:position(e),before:copy(c),priorDelta,origin:key==='actor'?{x:meta.actor.x+delta.x,y:meta.actor.y+delta.y}:{x:geom(c.stickers[Number(key)]).cx,y:geom(c.stickers[Number(key)]).cy},delta:{...delta},moved:false,captured:false};""")
editor=change(editor,"if(cancel){cfg.onChange(d.before,{render:false,reason:'cancel'});restoreImage();}\n   else if(d.moved){push(d.before);if(d.kind==='actor'){urls.pendingDelta=d.delta;rendering=true;cfg.onChange(copy(get()),{render:true,reason:'actor'});}}\n   else restoreImage();draw();controls();", """if(cancel){const pending=restoreBefore(d);cfg.onChange(d.before,{render:pending&&!quiet,reason:pending?'settle':'cancel'});}
   else if(d.moved){push(d.before);if(d.kind==='actor'){urls.pendingDelta=d.delta;if(!cfg.canvasPreview)rendering=true;cfg.onChange(copy(get()),{render:true,reason:'actor'});}else if(cfg.canvasPreview&&d.priorDelta)cfg.onChange(copy(get()),{render:true,reason:'settle'});}
   else {const pending=restoreBefore(d);if(pending)cfg.onChange(copy(get()),{render:true,reason:'settle'});}draw();controls();""")
editor=change(editor,"async setPreview(data){if(drag)end(true);meta=data.meta;urls={main:data.image,clean:data.clean,ghost:data.ghost};image.src=data.image;rendering=false;ghost.hidden=true;draw();controls();},", """async setPreview(data){if(drag)end(true);meta=data.meta;urls={main:data.image,clean:data.clean,ghost:data.ghost};image.src=data.image;rendering=false;ghost.hidden=true;draw();controls();},
   setCanvasPreview(card){
    if(!cfg.canvasPreview||drag)return false;
    const parts=card.editor;if(!parts?.clean||!parts?.ghost)throw new Error('Livelli Canvas dell’anteprima mancanti.');
    // Synchronous commit: all pixels already exist. No image.src/decode barrier.
    image.width=card.width;image.height=card.height;image.getContext('2d').drawImage(card,0,0);
    const oldClean=cleanLayer,oldGhost=ghost;cleanLayer=parts.clean;ghost=parts.ghost;
    cleanLayer.className='composition-clean';cleanLayer.setAttribute('aria-hidden','true');cleanLayer.hidden=true;
    ghost.className='composition-ghost';ghost.setAttribute('aria-hidden','true');ghost.hidden=true;
    oldClean.replaceWith(cleanLayer);oldGhost.replaceWith(ghost);cfg.dispose(oldClean);cfg.dispose(oldGhost);
    meta=parts.meta;urls={canvas:true};delete card.editor;image.style.visibility='';rendering=false;draw();controls();return true;
   },""")
editor=change(editor,"failed(){rendering=false;restoreImage();draw();},", "failed(){rendering=false;if(cfg.canvasPreview&&urls?.pendingDelta)showGhost(urls.pendingDelta);else restoreImage();draw();},")
editor=change(editor,"reset(){if(drag)end(true);meta=null;urls=null;history=[];active='actor';ghost.hidden=true;ghost.removeAttribute('src');", "reset(){if(drag)end(true);meta=null;urls=null;history=[];active='actor';ghost.hidden=true;ghost.removeAttribute('src');if(cfg.canvasPreview){cfg.dispose(cleanLayer);cfg.dispose(ghost);cleanLayer.hidden=true;image.style.visibility='';image.width=1;image.height=1;}")
editor=change(editor,'function end(cancel=false){','function end(cancel=false,quiet=false){')
editor=editor.replace('if(value&&drag)end(true);','if(value&&drag)end(true,true);').replace('reset(){if(drag)end(true);','reset(){if(drag)end(true,true);')
app=(R/'browser/app.js').read_text()
app=change(app,"let previewController=null,exportController=null,", "let previewController=null,previewInteractive=false,exportController=null,")
app=change(app,"const editor=CasardiEditor.mount({root:$('#composition-panel'),wrap:$('.preview-wrap'),image:$('#final-preview'),", "const editor=CasardiEditor.mount({root:$('#composition-panel'),wrap:$('.preview-wrap'),image:$('#final-preview'),canvasPreview:true,dispose:R.dispose,onInteractionStart:()=>{if(previewInteractive)stopPreview();},")
app=change(app,"onChange:(composition,{render})=>{if(state.busy)return;state.composition=composition;changed();if(render){$('#export').disabled=true;preview();}}", "onChange:(composition,{render,reason})=>{if(state.busy)return;state.composition=composition;changed();if(render){$('#export').disabled=true;preview({interactive:reason==='actor'||reason==='settle'});}}")
start=app.index(' async function preview(){');end=app.index(' function show(n){',start)
app=app[:start]+""" function stopPreview(){previewController?.abort();previewController=null;previewInteractive=false;editor.setRendering(false);$('#preview-loading').hidden=true;$('.preview-wrap').setAttribute('aria-busy','false');}
 async function preview({interactive=false}={}){
  previewController?.abort();previewInteractive=interactive;editor.setRendering(!interactive);
  const ctl=previewController=new AbortController(),epoch=state.epoch;$('#preview-loading').hidden=interactive;$('#export').disabled=true;$('.preview-wrap').setAttribute('aria-busy','true');
  let c=null;try{
   c=await R.compose(job(),matchMedia('(max-width: 760px)').matches?900:1200,{signal:ctl.signal,editor:true});
   if(previewController!==ctl||epoch!==state.epoch||ctl.signal.aborted)return;
   if(editor.setCanvasPreview(c))$('#export').disabled=false;
  }catch(e){if(previewController===ctl&&epoch===state.epoch&&!ctl.signal.aborted){editor.failed();notice(e.message||'Anteprima non riuscita. Riprova o chiudi altre schede per liberare memoria.',true);}}
  finally{R.dispose(c);if(previewController===ctl&&epoch===state.epoch){previewController=null;previewInteractive=false;editor.setRendering(false);$('#preview-loading').hidden=true;$('.preview-wrap').setAttribute('aria-busy','false');}}
 }
"""+app[end:]
# Navigation aborts cannot retain a dead controller/lock; cancellation affects
# only preview work, never visitor data or committed composition/history.
app=app.replace("}else{previewController?.abort();}","}else{stopPreview();}")
app=app.replace("previewController?.abort();$('#studio').hidden=true;","stopPreview();$('#studio').hidden=true;")
app=app.replace("++state.epoch;previewController?.abort();exportController?.abort();","++state.epoch;stopPreview();exportController?.abort();")
css=(R/'browser/layout-editor.css').read_text()+"\n.editable-card .composition-clean{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;z-index:-1}\n.editable-card .composition-clean[hidden]{display:none!important}\n"
template=(R/'browser/interface.html').read_text();template=change(template,'<img id="final-preview" alt="Anteprima completa della cartolina">','<canvas id="final-preview" role="img" aria-label="Anteprima completa della cartolina">Anteprima completa della cartolina</canvas>')
html=(R/'Cartolina_Casardi_PC_e_Telefono.html').read_text();assert hashlib.sha256(html.encode()).hexdigest()==BASE
files={'browser/layout-editor.js':editor,'browser/app.js':app,'browser/layout-editor.css':css,'browser/interface.html':template}
for name,new in files.items():
 old=(R/name).read_text()
 if name=='browser/interface.html':html=change(html,'<img id="final-preview" alt="Anteprima completa della cartolina">','<canvas id="final-preview" role="img" aria-label="Anteprima completa della cartolina">Anteprima completa della cartolina</canvas>')
 else:html=change(html,old,new)
 dest=O/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(new)
 if name.endswith('.js'):subprocess.run(['node','--check',str(dest)],check=True)
(O/'canvas-preview.html').write_text(html)
patch=''.join(''.join(difflib.unified_diff((R/p).read_text().splitlines(True),new.splitlines(True),fromfile='a/'+p,tofile='b/'+p)) for p,new in files.items());(O/'canvas-preview-experiment.patch').write_text(patch)
proof=dict(purpose='Controlled non-production experiment; no claim of physical Android root cause',baseline_sha256=BASE,experiment_sha256=hashlib.sha256(html.encode()).hexdigest(),changes=list(files),renderer_unchanged=True,embedded_data_unchanged=True,release_or_publication=False)
(O/'experiment-build.json').write_text(json.dumps(proof,indent=2));print(json.dumps(proof,indent=2))
