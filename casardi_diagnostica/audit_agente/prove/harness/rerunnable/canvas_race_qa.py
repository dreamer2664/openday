"""Controlled readiness/ownership regression for a NON-RELEASED experiment.
Injected delayed/rejected renders are controls, not the user's reproduction.
Each moved object is checked live and after commit; actual HD files are read.
"""
import asyncio,hashlib,io,json,tempfile,time,traceback
from datetime import datetime as _audit_datetime, timezone as _audit_timezone
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright,expect
C=Path('/home/user/.cache/casardi-rootcause');HTML=C/'canvas-experiment/canvas-preview.html'
async def main():
 start=time.time();checks=[];errors=[];http=[];exports=[];attempts=0;failure=None
 def mark(name,**kw):checks.append(dict(name=name,result='PASS',**kw));print('PASS',name,flush=True)
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(args=['--no-sandbox'])
  try:
   for mode in ['photo','nes']:
    for touch in [True,False]:
     label=mode+('/touch' if touch else '/mouse');ctx=await browser.new_context(offline=True,has_touch=touch,is_mobile=touch,viewport=dict(width=390 if touch else 1280,height=1000),accept_downloads=True)
     p=await ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.on('request',lambda r:http.append(r.url) if r.url.startswith(('http:','https:')) else None);await p.goto(HTML.as_uri());await expect(p.locator('#start')).to_be_enabled()
     await p.locator('#start').click();await p.locator('[data-mode='+mode+']').click();await p.locator('[data-scene=casardi]').click();await p.locator('#next').click();await p.locator('#next').click();await p.locator('[data-animal=gatto]').click();await p.locator('#next').click()
     async def ready():await expect(p.locator('#export')).to_be_enabled(timeout=60000)
     await ready();cdp=await ctx.new_cdp_session(p)
     await p.evaluate("""()=>{
      window.qa={calls:0,pending:[],next:null,job:null,mutations:0,encodes:0,decodes:0,pointer:null};
      const old=CasardiRender.compose;CasardiRender.compose=async function(...a){qa.job=JSON.parse(JSON.stringify(a[0]));const id=++qa.calls;if(a[2]?.editor&&qa.next){const how=qa.next;qa.next=null;if(how==='hold')await new Promise(resolve=>qa.pending.push({id,resolve}));else if(how==='error')throw new Error('QA controlled preview error');}return old.apply(this,a);};
      const encode=HTMLCanvasElement.prototype.toDataURL;HTMLCanvasElement.prototype.toDataURL=function(...a){qa.encodes++;return encode.apply(this,a);};
      const decode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(...a){qa.decodes++;if(this.id==='final-preview')throw new Error('QA final preview must not decode an IMG');return decode.apply(this,a);};
      new MutationObserver(list=>{qa.mutations+=list.filter(m=>m.attributeName==='src'&&(m.target.id==='final-preview'||m.target.classList.contains('composition-ghost')||m.target.classList.contains('composition-clean'))).length;}).observe(document.querySelector('.preview-wrap'),{attributes:true,subtree:true,attributeFilter:['src']});
      window.addEventListener('pointerdown',e=>{if(e.target.closest?.('[data-drag]'))qa.pointer=e.pointerId;},true);
     }""")
     async def geom(key='actor'):return await p.locator('[data-drag="'+str(key)+'"]').get_attribute('style')
     async def point(key):
      n=p.locator('[data-drag="'+str(key)+'"]');await n.scroll_into_view_if_needed()
      xy=await n.evaluate("""n=>{const r=n.getBoundingClientRect();for(const fy of [.5,.25,.75,.1,.9])for(const fx of [.5,.25,.75,.1,.9]){const x=r.x+r.width*fx,y=r.y+r.height*fy;if(x>2&&y>2&&x<innerWidth-2&&y<innerHeight-2&&document.elementFromPoint(x,y)?.closest('[data-drag]')===n)return{x,y};}return null;}""")
      assert xy,('No unobstructed point',label,key);return xy['x'],xy['y']
     async def send(t,x=None,y=None):await cdp.send('Input.dispatchTouchEvent',dict(type=t,touchPoints=[] if x is None else [dict(id=0,x=x,y=y,radiusX=4,radiusY=4)]))
     async def begin(dx=14,dy=-4,key='actor'):
      nonlocal attempts
      x,y=await point(key);before=await geom(key);attempts+=1
      if touch:
       await send('touchStart',x,y)
       for i in range(1,5):await send('touchMove',x+dx*i/4,y+dy*i/4)
      else:await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+dx,y+dy,steps=4)
      assert before!=await geom(key),(label,key,'gesture failed to move live');return before
     async def release():
      if touch:await send('touchEnd')
      else:await p.mouse.up()
     async def drag(dx=14,dy=-4,key='actor',wait=True):
      before=await begin(dx,dy,key);await release()
      if wait:await ready()
      assert before!=await geom(key),(label,key,'no committed move');return await geom(key)
     async def undo():await p.get_by_role('button',name='↶ Annulla',exact=True).click();await ready()
     async def hold_next():await p.evaluate("()=>qa.next='hold'");return await p.evaluate('()=>qa.pending.length')
     async def release_hold(i):await p.evaluate('(i)=>qa.pending[i].resolve()',i)
     async def two_frames():await p.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
     async def cancel():
      if touch:await send('touchCancel')
      else:await p.keyboard.press('Escape');await p.mouse.up()
     # Natural gestures were covered separately; here the old renderer is
     # explicitly suspended so overlap cannot disappear because a machine is fast.
     original=await geom();a=await hold_next();await drag(14,-4,wait=False);b=await hold_next();second=await drag(-9,3,wait=False)
     assert await p.locator('#export').is_disabled();await release_hold(a);await two_frames();assert await geom()==second and await p.locator('#export').is_disabled()
     await drag(8,-3);last=await geom();await release_hold(b);await two_frames();assert await geom()==last
     await undo();await undo();await undo();assert await geom()==original;mark(label+': three actor gestures while old previews pending; late completion discarded; undo exact',fault_injection=True)
     a=await hold_next();first=await drag(13,-4,wait=False);x,y=await point('actor')
     if touch:await send('touchStart',x,y);await send('touchEnd')
     else:await p.mouse.click(x,y)
     await ready();assert await geom()==first;await release_hold(a);await two_frames();assert await geom()==first;await undo();assert await geom()==original;mark(label+': stationary tap during pending preview settles instead of stranding export',fault_injection=True)
     a=await hold_next();first=await drag(13,-4,wait=False);await begin(-8,2);await cancel();await ready();assert await geom()==first;await release_hold(a);await two_frames();await undo();assert await geom()==original;mark(label+': cancel rolls back only second in-flight gesture, retains first edit/history',fault_injection=True)
     # Six optional stickers are an unrelated regression, not the reported cause.
     for sid in ['alloro','pegaso','lira','libro','teatro','logo_casardi']:await p.locator('[data-add-sticker='+sid+']').click()
     a=await hold_next();first=await drag(11,-3,wait=False);sticker=await drag(-10,5,'0');await release_hold(a);await two_frames();assert await geom()==first and await geom('0')==sticker;await undo();await undo();assert await geom()==original;mark(label+': sticker gesture during actor preview retains both edits, settles, undo exact',fault_injection=True)
     # Standard cancellation paths still work with already committed layers.
     for kind in ['capture-loss','cancel','blur','pagehide','escape']:
      before=await geom();await begin(13,-4)
      if kind=='capture-loss':
       await p.locator('[data-drag=actor]').evaluate('n=>n.releasePointerCapture(qa.pointer)')
       if touch:await send('touchMove',3,3)
       else:await p.mouse.move(3,3)
      elif kind=='cancel':
       await cancel()
      elif kind=='blur':await p.evaluate("()=>window.dispatchEvent(new Event('blur'))")
      elif kind=='pagehide':await p.evaluate("()=>window.dispatchEvent(new Event('pagehide'))")
      elif kind=='escape':await p.keyboard.press('Escape')
      if kind!='cancel':await release()
      assert await geom()==before,(label,kind,'rollback failed')
      await drag();await undo();assert await geom()==before
     mark(label+': five capture/lifecycle cancellations, then real movement and exact undo',fault_injection=True)
     await p.evaluate("()=>qa.next='error'");await drag(13,-4,wait=False);await expect(p.locator('#toast')).to_be_visible();await drag(-8,2);await undo();await undo();assert await geom()==original;mark(label+': current render error leaves actor usable, visible pending position and history intact',fault_injection=True)
     # Dismiss the deliberately injected error with the real close button;
     # the test must not try to click Export through its error toast.
     await p.locator('#toast button').click()
     # Repeated ready-to-ready gestures with all six decorations, after faults.
     for i in range(12):await drag(8 if i%2==0 else -8,-3 if i%2==0 else 3)
     counters=await p.evaluate('()=>({encodes:qa.encodes,decodes:qa.decodes,srcMutations:qa.mutations})');assert counters==dict(encodes=0,decodes=0,srcMutations=0),counters;mark(label+': 12 touch/mouse stress edits; no preview PNG encode, image decode or src mutation',counters=counters)
     # Save an actual 3000x2000 PNG and compare it byte-for-byte with a second
     # independent asset recomposition of the exact job, never a screenshot.
     await p.locator('#export').evaluate("n=>n.scrollIntoView({block:'center',behavior:'instant'})");await two_frames()
     await p.locator('#export').click();await expect(p.locator('#result')).to_be_visible(timeout=60000)
     job=await p.evaluate('()=>qa.job');assert len(job['composition']['stickers'])==6 and job['companion']['animal']=='gatto'
     with tempfile.TemporaryDirectory(dir=C) as td:
      async with p.expect_download() as ev:await p.locator('#save').click()
      dl=await ev.value;dest=Path(td)/'test.png';await dl.save_as(str(dest));raw=dest.read_bytes();await dl.delete()
     with Image.open(io.BytesIO(raw)) as im:
      assert im.size==(3000,2000) and im.convert('RGBA').getchannel('A').getextrema()==(255,255)
      assert im.info['Source'] and 'DECORAZIONI FACOLTATIVE' in im.info['Description']
     digest=await p.evaluate("""async j=>{const c=await CasardiRender.compose(j,3000),blob=await CasardiRender.pngBlob(c,j);CasardiRender.dispose(c);return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('');}""",job)
     assert digest==hashlib.sha256(raw).hexdigest();exports.append(dict(case=label,bytes=len(raw),sha256=digest,independent_asset_recomposition_identical=True));mark(label+': real HD download after races/stress, byte-identical independent asset recomposition')
     # Return to editor, then reset from inside an active pending gesture using
     # programmatic button activation (no outside pointerdown to cancel it first).
     await p.locator('.preview-wrap').scroll_into_view_if_needed();a=await hold_next();await drag(8,-3,wait=False);await begin(-6,2);await p.locator('#reset').evaluate('n=>n.click()');await release();await release_hold(a);await two_frames();await expect(p.locator('#welcome')).to_be_visible();assert await p.locator('[data-drag]').count()==0
     assert await p.locator('#final-preview').evaluate('n=>n.width===1&&n.height===1');mark(label+': visitor reset during held gesture cannot resurrect old canvas or hit boxes',fault_injection=True)
     await ctx.close()
   assert not errors,errors;assert not http,http
  except Exception:failure=traceback.format_exc();print(failure,flush=True)
  finally:await browser.close()
 report=dict(result='FAIL' if failure else 'PASS',date=_audit_datetime.now(_audit_timezone.utc).date().isoformat(),purpose='QA for a non-production experiment; controlled failures are not the physical user trigger',html_sha256=hashlib.sha256(HTML.read_bytes()).hexdigest(),seconds=round(time.time()-start,2),checks=checks,gesture_attempts=attempts,exports=exports,errors=errors,http_requests=http,failure=failure)
 C.joinpath('canvas-race-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('DONE',report['result'],len(checks),'checks',attempts,'gestures',len(exports),'HD files',flush=True)
 if failure:raise RuntimeError(failure)
asyncio.run(main())
