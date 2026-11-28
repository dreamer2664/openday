"""Regression for the shared actor/sticker drag freeze fixed in 3.3.1.

Real Chromium mouse/CDP touch input. Explicit fault injection models lost
capture, window lifecycle and preview decode failures; these are not claims
about a physical phone. Optional --baseline points to the unchanged 3.3 HTML
and must reproduce the original freeze before the corrected app is tested.
Needs the optional Python edition running on :8080. No visitor data is used.
"""
from __future__ import annotations
import argparse,asyncio,hashlib,io,json,tempfile,time,traceback
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
HTML=ROOT/'Cartolina_Casardi_PC_e_Telefono.html'
OUT=ROOT/'docs/test-results/drag-recovery-tests.json'
TRACE="""(()=>{window.recoveryTrace=[];for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>{const key=e.target.closest?.('[data-drag]')?.dataset.drag;window.recoveryTrace.push({type,id:e.pointerId,key:key??null,buttons:e.buttons});if(window.recoveryTrace.length>40)window.recoveryTrace.shift();if(type==='pointerdown'&&key!==undefined)window.recoveryPointer=e.pointerId;},true);})();"""
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

async def main(args):
 start=time.perf_counter();checks=[];errors=[];network=[];exports=[];baseline=None;gesture_count=0;failure_details=None
 def mark(name,**details):checks.append(dict(name=name,result='PASS',**details));print('PASS',name,flush=True)
 async def enter(browser,mode='nes',touch=False,server=False,path=HTML):
  ctx=await browser.new_context(offline=not server,has_touch=touch,is_mobile=touch,viewport=dict(width=390 if touch else 1440,height=1000),accept_downloads=True)
  p=await ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
  if not server:p.on('request',lambda r:network.append(r.url) if r.url.startswith(('http:','https:')) else None)
  await p.add_init_script(TRACE);await p.goto('http://127.0.0.1:8080' if server else path.as_uri());await expect(p.locator('#btn-start' if server else '#start')).to_be_enabled(timeout=60000)
  if not server:
   await p.evaluate("""()=>{const original=CasardiRender.compose;CasardiRender.compose=async function(raw,width,options){window.recoveryJob=JSON.parse(JSON.stringify(raw));const c=await original.call(this,raw,width,options);window.recoveryMeta=c.editor?.meta;return c;};}""")
  await p.click('#btn-start' if server else '#start');await p.click(('[data-style=' if server else '[data-mode=')+mode+']');await p.click('[data-scene=paestum]')
  await p.click('#btn-next' if server else '#next');await p.click('#btn-next' if server else '#next');await p.click('[data-animal=gatto]');await p.click('#btn-next' if server else '#next');await ready(p,server)
  return ctx,p,await ctx.new_cdp_session(p)
 async def ready(p,server=False):await expect(p.locator('#btn-export' if server else '#export')).to_be_enabled(timeout=60000)
 async def point(p,key):
  n=p.locator('[data-drag="'+str(key)+'"]');await n.scroll_into_view_if_needed()
  xy=await n.evaluate("""n=>{const r=n.getBoundingClientRect(),others=[...document.querySelectorAll('.card-sticker')].filter(o=>o!==n).map(o=>{const b=o.getBoundingClientRect(),w=Math.max(44,b.width),h=Math.max(44,b.height);return{x:b.x+b.width/2-w/2,y:b.y+b.height/2-h/2,w,h};});let best=null;for(const fy of [.5,.25,.75,.1,.9,.35,.65])for(const fx of [.5,.25,.75,.1,.9,.35,.65]){const x=Math.round(r.x+r.width*fx),y=Math.round(r.y+r.height*fy);if(x<=2||y<=2||x>=innerWidth-2||y>=innerHeight-2||document.elementFromPoint(x,y)?.closest('[data-drag]')!==n)continue;const score=Math.min(x-r.x,r.right-x,y-r.y,r.bottom-y,...others.map(b=>Math.hypot(Math.max(b.x-x,0,x-b.x-b.w),Math.max(b.y-y,0,y-b.y-b.h))));if(!best||score>best.score)best={x,y,score};}return best;}""")
  assert xy,('No uncovered hit point',key);return xy['x'],xy['y']
 async def geom(p,key):return await p.locator('[data-drag="'+str(key)+'"]').evaluate('(n)=>[n.style.left,n.style.top,n.style.width,n.style.height,n.style.transform]')
 async def all_geom(p):return await p.locator('[data-drag]').evaluate_all('(ns)=>ns.map(n=>[n.dataset.drag,n.style.left,n.style.top,n.style.width,n.style.height,n.style.transform])')
 async def send(cdp,kind,x=None,y=None):await cdp.send('Input.dispatchTouchEvent',dict(type=kind,touchPoints=[] if x is None else [dict(x=x,y=y,id=0)]))
 async def begin(p,cdp,key,dx,dy,touch=False):
  nonlocal gesture_count
  gesture_count+=1;x,y=await point(p,key)
  if touch:
   await send(cdp,'touchStart',x,y)
   assert await p.evaluate("()=>recoveryTrace.filter(e=>e.type==='pointerdown').at(-1)?.key")==str(key),('Touch retargeted to adjacent sticker',key,x,y)
   for i in range(1,4):await send(cdp,'touchMove',x+dx*i/3,y+dy*i/3)
  else:
   await p.mouse.move(x,y);await p.mouse.down()
   assert await p.evaluate("()=>recoveryTrace.filter(e=>e.type==='pointerdown').at(-1)?.key")==str(key),('Wrong mouse target',key,x,y)
   await p.mouse.move(x+dx,y+dy,steps=3)
  return x+dx,y+dy
 async def release(p,cdp,touch=False):
  if touch:await send(cdp,'touchEnd')
  else:await p.mouse.up()
 async def drag(p,cdp,key,dx,dy,touch=False,server=False,wait=True):
  before=await geom(p,key);await begin(p,cdp,key,dx,dy,touch);await release(p,cdp,touch)
  if wait:await ready(p,server)
  return before!=await geom(p,key)
 async def undo(p,server=False):
  await p.get_by_role('button',name='↶ Annulla',exact=True).click();await ready(p,server)
 async def add(p):
  for sid in ('alloro','pegaso'):await p.click('[data-add-sticker='+sid+']')
 async def interruption(p,cdp,key,kind,touch=False):
  before=await all_geom(p);await begin(p,cdp,key,17,-5,touch)
  assert before!=await all_geom(p),(kind,'gesture did not start')
  if kind=='capture-loss':
   await p.locator('[data-drag="'+str(key)+'"]').evaluate('(n)=>n.releasePointerCapture(window.recoveryPointer)')
   if touch:await send(cdp,'touchMove',3,3)
   else:await p.mouse.move(3,3,steps=2)
  elif kind=='cancel':
   if touch:await send(cdp,'touchCancel')
   else:await p.evaluate("()=>window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:window.recoveryPointer,pointerType:'mouse',bubbles:true}))")
  elif kind=='blur':await p.evaluate("()=>window.dispatchEvent(new Event('blur'))")
  elif kind=='hidden':await p.evaluate("""()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;}""")
  elif kind=='escape':await p.keyboard.press('Escape')
  elif kind=='pagehide':await p.evaluate("()=>window.dispatchEvent(new Event('pagehide'))")
  if not(touch and kind=='cancel'):await release(p,cdp,touch)
  await expect(p.locator('.composition-ghost')).to_be_hidden();assert before==await all_geom(p),(kind,'interrupted edit was not rolled back')
  return before
 async def prove_recovery(p,cdp,touch=False,server=False):
  old=await all_geom(p)
  assert await drag(p,cdp,'actor',17,-5,touch,server),'actor remains blocked'
  assert await drag(p,cdp,'0',-15,6,touch,server),'sticker remains blocked'
  await undo(p,server);await undo(p,server)
  assert await all_geom(p)==old,'Canceled gesture polluted undo history / lost earlier edits'
 async def export(p,td,tag,server=False):
  if server:
   async with p.expect_response(lambda r:r.url.endswith('/api/export')) as res:await p.click('#btn-export')
   data=await(await res.value).json();await expect(p.locator('#result')).to_be_visible(timeout=60000);response=await p.context.request.get('http://127.0.0.1:8080'+data['file_url']);assert response.status==200;raw=await response.body()
  else:
   await p.click('#export');await expect(p.locator('#result')).to_be_visible(timeout=60000)
   async with p.expect_download() as event:await p.click('#save')
   dl=await event.value;path=td/(tag+'.png');await dl.save_as(str(path));raw=path.read_bytes();await dl.delete();path.unlink()
  with Image.open(io.BytesIO(raw)) as im:
   assert im.size==(3000,2000) and im.info['Source'] and 'DECORAZIONI FACOLTATIVE' in im.info['Description'];assert im.convert('RGBA').getchannel('A').getextrema()==(255,255)
  proof=dict(edition='python' if server else 'standalone',case=tag,sha256=hashlib.sha256(raw).hexdigest(),bytes=len(raw),dimensions=[3000,2000])
  if not server:
   job=await p.evaluate('()=>recoveryJob');assert len(job['composition']['stickers'])==6 and job['composition']['actor'] is not None
   digest=await p.evaluate("""async j=>{const c=await CasardiRender.compose(j,3000),b=await CasardiRender.pngBlob(c,j);CasardiRender.dispose(c);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await b.arrayBuffer()))).map(v=>v.toString(16).padStart(2,'0')).join('');}""",job)
   assert digest==proof['sha256'];proof['independent_asset_recomposition_identical']=True
  exports.append(proof)
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(args=['--no-sandbox'])
  try:
   if args.baseline:
    assert sha(args.baseline)=='e8e28940e478a985e2b5113606045b4eac8677c58c27055a8392b719605a392a','Not the released 3.3 baseline'
    ctx,p,cdp=await enter(browser,touch=True,path=args.baseline);await add(p)
    await begin(p,cdp,'actor',-18,-5,True);await p.locator('[data-drag=actor]').evaluate('(n)=>n.releasePointerCapture(window.recoveryPointer)');await send(cdp,'touchMove',3,3);await send(cdp,'touchEnd')
    frozen_actor=not await drag(p,cdp,'actor',20,-5,True);frozen_sticker=not await drag(p,cdp,'0',-20,5,True)
    assert frozen_actor and frozen_sticker,'Expected original defect did not reproduce'
    baseline=dict(released_html_sha256=sha(args.baseline),actor_frozen=frozen_actor,sticker_frozen=frozen_sticker,loading_visible=await p.locator('#preview-loading').is_visible(),export_disabled=await p.locator('#export').is_disabled(),trace=await p.evaluate('()=>recoveryTrace'),method='Real CDP touch events; explicit releasePointerCapture followed by real touch end outside the postcard. Controlled interruption, not a claim of the exact user gesture.')
    mark('Released 3.3: interrupted gesture reproduces total actor + sticker drag freeze',expected_defect_reproduced=True);await ctx.close()
   with tempfile.TemporaryDirectory() as td:
    td=Path(td)
    for mode in ('photo','nes'):
     for touch in (False,True):
      label=mode+'/'+('touch-emulated' if touch else 'mouse')
      if args.only and args.only!=label:continue
      ctx,p,cdp=await enter(browser,mode,touch)
      assert await drag(p,cdp,'actor',16,-6,touch);await add(p)
      for key in ('actor','0'):
       for kind in ('capture-loss','cancel','blur','hidden','pagehide','escape'):
        await interruption(p,cdp,key,kind,touch);await prove_recovery(p,cdp,touch)
        mark(label+': '+key+' / '+kind+' cancels one gesture; actor + sticker work again; undo retains earlier edits',fault_injection=True)
      # Capture may throw (unsupported/temporarily unavailable): global release
      # outside the overlay must still finish, rather than abandoning the drag.
      await p.evaluate("()=>{window.recoveryCapture=Element.prototype.setPointerCapture;Element.prototype.setPointerCapture=function(){throw new DOMException('QA capture unavailable','NotFoundError');};}")
      before=await geom(p,'0');await begin(p,cdp,'0',-15,4,touch)
      if touch:await send(cdp,'touchMove',4,4)
      else:await p.mouse.move(4,4,steps=3)
      await release(p,cdp,touch);await p.evaluate('()=>Element.prototype.setPointerCapture=window.recoveryCapture');assert before!=await geom(p,'0');await prove_recovery(p,cdp,touch);await undo(p)
      mark(label+': failed capture + real outside release does not strand the editor',fault_injection=True)
      for sid in ('lira','libro','teatro','logo_casardi'):await p.click('[data-add-sticker='+sid+']')
      for i in range(30):
       sign=1 if i%2==0 else -1
       assert await drag(p,cdp,'actor',6*sign,-3*sign,touch),(label,'actor stress iteration',i)
       assert await drag(p,cdp,str(i%2),-8*sign,4*sign,touch)
      mark(label+': 60 consecutive verified actor/sticker drags with six stickers, no visitor reset',verified_drags=60)
      # Invalid or superseded preview errors must not leave rendering=true.
      if not touch:
       await p.evaluate("""()=>{const original=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(){if(this.id==='final-preview'){HTMLImageElement.prototype.decode=original;return Promise.reject(new DOMException('QA decode interruption','AbortError'));}return original.call(this);};}""")
       await p.locator('[data-drag=actor]').focus();await p.keyboard.press('Shift+ArrowRight');await expect(p.locator('#preview-loading')).to_be_hidden(timeout=60000);await expect(p.locator('#toast')).to_be_visible()
       assert await drag(p,cdp,'actor',15,-5);assert await drag(p,cdp,'0',-10,4)
       mark(label+': unexpected active-preview decode AbortError releases lock; real subsequent drag + render succeeds',fault_injection=True)
       # Hold two overlapping renders; reject the obsolete one while the latest
       # is pending. Only the current request may touch editor readiness.
       section=p.locator('.editor-section').nth(2)
       if not await section.evaluate('(n)=>n.open'):await section.locator('summary').click()
       await p.evaluate("""()=>{const original=CasardiRender.compose;let n=0;window.recoveryOldPreview=null;window.recoveryNewPreview=null;CasardiRender.compose=async function(...a){if(a[2]?.editor){window.recoveryRenderCalls=++n;if(n===1)return await new Promise((resolve,reject)=>window.recoveryOldPreview=()=>reject(new Error('QA obsolete preview')));if(n===2)await new Promise(r=>window.recoveryNewPreview=r);}return original.apply(this,a);};window.recoveryRestoreCompose=()=>CasardiRender.compose=original;}""")
       await p.select_option('[data-plaque=theme]','avorio');await p.select_option('[data-plaque=theme]','notte');assert await p.evaluate('()=>!!recoveryOldPreview&&!!recoveryNewPreview')
       await p.evaluate('()=>recoveryOldPreview()');await p.evaluate('()=>new Promise(r=>requestAnimationFrame(r))');before=await all_geom(p);await p.locator('[data-drag=actor]').focus();await p.keyboard.press('ArrowRight');assert await p.evaluate('()=>recoveryRenderCalls')==2;assert before==await all_geom(p);assert await p.locator('#export').is_disabled()
       await p.evaluate('()=>recoveryNewPreview()');await ready(p);await p.evaluate('()=>recoveryRestoreCompose()');assert await drag(p,cdp,'actor',15,-5);assert await drag(p,cdp,'0',-10,4)
       assert 'QA obsolete preview' not in await p.locator('#toast').inner_text()
       mark(label+': obsolete preview error cannot unlock/corrupt the newer preview; subsequent drags work',fault_injection=True)
      await export(p,td,label.replace('/','-'));mark(label+': real HD download after stress and recovery; identical to independent asset recomposition')
      await p.click('#reset');await expect(p.locator('#welcome')).to_be_visible();await ctx.close()
    for mode in (() if args.only else ('photo','nes')):
     ctx,p,cdp=await enter(browser,mode,server=True);await add(p)
     for key in ('actor','0'):
      await interruption(p,cdp,key,'capture-loss');await prove_recovery(p,cdp,server=True)
      mark('Python '+mode+': '+key+' capture-loss recovery, both object types movable and undo intact',fault_injection=True)
     assert await drag(p,cdp,'actor',20,-7,server=True);assert await drag(p,cdp,'0',-20,7,server=True);await export(p,td,'python-'+mode,True);mark('Python '+mode+': actual decorated 3000×2000 PNG after interrupted gestures')
     await p.click('#btn-reset');await ctx.close()
    assert not errors,errors;assert not network,network;mark('All recovery cases: zero uncaught JavaScript errors; standalone makes zero HTTP requests')
  except Exception:
   try:failure_details=await p.evaluate("()=>({trace:recoveryTrace,job:window.recoveryJob,meta:window.recoveryMeta,hidden:document.hidden,focused:document.hasFocus(),loadingHidden:document.querySelector('#preview-loading').hidden,exportDisabled:document.querySelector('#export')?.disabled,geometry:[...document.querySelectorAll('[data-drag]')].map(n=>({key:n.dataset.drag,style:n.getAttribute('style')}))})")
   except Exception:pass
   checks.append(dict(name='Interrupted drag-recovery regression',result='FAIL',error=traceback.format_exc()));raise
  finally:
   await browser.close()
   report=dict(result='PASS' if checks and all(t['result']=='PASS' for t in checks) else 'FAIL',date='2026-11-27',revision='3.3.1',seconds=round(time.perf_counter()-start,2),html_sha256=sha(HTML),baseline=baseline,checks=checks,failure_details=failure_details,complete_suite=not bool(args.only),gesture_starts_attempted=gesture_count,exports=exports,javascript_errors=errors,standalone_http_requests=network,sources={p:sha(ROOT/p) for p in ('browser/layout-editor.js','browser/app.js','web/static/app.js')},environment='Linux Chromium; real mouse/CDP touch. Capture-loss and window lifecycle/preview errors explicitly injected. Not native Windows, Safari/Firefox, physical phone or school LAN.',user_exact_trigger='Unknown: browser/device and the original interrupted gesture were not provided. Controlled reproduction proves a matching failure mode, not that no other cause exists.')
   (OUT.with_name('drag-recovery-probe.json') if args.only else OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print('DONE',len(checks),'drag-recovery checks;',gesture_count,'gesture attempts;',len(exports),'HD downloads',flush=True)

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--baseline',type=Path);parser.add_argument('--only',choices=['photo/mouse','photo/touch-emulated','nes/mouse','nes/touch-emulated']);asyncio.run(main(parser.parse_args()))
