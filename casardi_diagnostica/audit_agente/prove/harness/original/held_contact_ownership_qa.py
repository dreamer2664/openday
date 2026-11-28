"""Natural rapid reselect control: hold the SECOND touch past preview readiness.
No compose/decode delays, errors, capture loss or app-state edits are injected.
Only passive pointer-event tracing is attached; application source/handlers are
unchanged (A1 already has diagnostics). Linux emulation is not physical Android.
"""
import asyncio,hashlib,json,time,traceback
from datetime import datetime,timezone
from pathlib import Path
from playwright.async_api import async_playwright,expect
C=Path('/home/user/.cache/casardi-rootcause');H=Path('/home/user')
async def main():
 start=time.time();stamp=datetime.now(timezone.utc).isoformat();rows=[];errors=[];failure=None;actor_contacts=0;outside_taps=0
 async with async_playwright() as pw:
  try:
   for variant in ['production','A1','Canvas']:
    for mode in ['photo','nes']:
     browser=await pw.chromium.launch(args=['--no-sandbox','--disable-dev-shm-usage'])
     try:
      ctx=await browser.new_context(**pw.devices['Pixel 7']);p=await ctx.new_page();p.set_default_timeout(45000);p.on('pageerror',lambda e:errors.append(str(e)))
      query='&a1=1' if variant=='A1' else '&exp=1' if variant=='Canvas' else ''
      await p.goto('http://127.0.0.1:8092/?nested=1'+query);f=p.frames[-1]
      for _ in range(8):
       try:await expect(f.locator('#start')).to_be_enabled(timeout=1000);break
       except AssertionError:f=p.frames[-1]
      await expect(f.locator('#start')).to_be_enabled(timeout=60000)
      await f.locator('#start').tap();await f.locator('[data-mode='+mode+']').tap();await f.locator('[data-scene=pantheon]').tap();await f.locator('#next').tap();await f.locator('.preset-grid button').nth(0).tap();await f.locator('#next').tap();await f.locator('#next').tap()
      await expect(f.locator('#export')).to_be_enabled(timeout=60000)
      await f.evaluate("""()=>{window.ownershipTrace=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture'])window.addEventListener(type,e=>{ownershipTrace.push({type,id:e.pointerId,target:e.target.closest?.('[data-drag]')?.dataset.drag||e.target.id||e.target.tagName,loading:!document.querySelector('#preview-loading').hidden,at:performance.now()});if(ownershipTrace.length>150)ownershipTrace.shift();},{capture:true,passive:true});}""")
      cdp=await ctx.new_cdp_session(p);blocked=0;trials=[];max_trials=12 if variant=='production' else 8 if variant=='A1' else 4
      async def send(kind,x=None,y=None):await cdp.send('Input.dispatchTouchEvent',dict(type=kind,touchPoints=[] if x is None else [dict(id=0,x=x,y=y,radiusX=7,radiusY=7,force=.7)]))
      async def gesture(x,y,dx,dy):
       nonlocal actor_contacts
       actor_contacts+=1;await send('touchStart',x,y)
       for k in range(1,5):await send('touchMove',x+dx*k/4,y+dy*k/4)
       await send('touchEnd')
      for trial in range(max_trials):
       await expect(f.locator('#export')).to_be_enabled(timeout=60000);actor=f.locator('[data-drag=actor]');await actor.scroll_into_view_if_needed();b=await actor.bounding_box();x=b['x']+b['width']/2;y=b['y']+b['height']/2;sign=1 if trial%2==0 else -1
       first_before=await actor.get_attribute('style');await f.evaluate('()=>ownershipTrace=[]')
       await gesture(x,y,sign*12,-3)
       # No readiness/DOM checks between release, parent deselect and reselect.
       outside_taps+=1;await send('touchStart',25,20);await send('touchEnd')
       actor_contacts+=1;await send('touchStart',x+sign*12,y-3)
       await expect(f.locator('#preview-loading')).to_be_hidden(timeout=60000)
       await asyncio.sleep(.25) # Wait while keeping THIS SAME contact held.
       trace=await f.evaluate('()=>ownershipTrace');down=[e for e in trace if e['type']=='pointerdown'][-1];pid=down['id']
       own=await f.evaluate("""id=>{const loading=document.querySelector('#preview-loading'),actor=document.querySelector('[data-drag=actor]'),s=getComputedStyle(actor);return {pointer_id:id,hidden_overlay_has_capture:loading.hasPointerCapture(id),actor_has_capture:actor.hasPointerCapture(id),overlay_hidden:loading.hidden,export_enabled:!document.querySelector('#export').disabled,ghost_visible:!document.querySelector('.composition-ghost').hidden,focused:document.activeElement?.dataset.drag||document.activeElement?.id||document.activeElement?.tagName,focus_visible:actor.matches(':focus-visible'),outline:s.outline,background:s.backgroundColor};}""",pid)
       before_moves=await actor.get_attribute('style');assert first_before!=before_moves,(variant,mode,trial,'first drag did not commit')
       for k in range(1,7):await send('touchMove',x+sign*12-sign*10*k/6,y-3+2*k/6)
       after_moves=await actor.get_attribute('style');ghost=await f.locator('.composition-ghost').is_visible();trace=await f.evaluate('()=>ownershipTrace');sequence=[e for e in trace if e['id']==pid];is_blocked=down['target']=='preview-loading'
       item=dict(trial=trial,second_down=down,state_after_250ms_while_held=own,second_model_proxy_moved=before_moves!=after_moves,ghost_visible_after_moves=ghost,second_contact_sequence=sequence,second_started_on_loading=is_blocked)
       if is_blocked:
        assert own['overlay_hidden'] and own['export_enabled'] and own['hidden_overlay_has_capture'] and not own['actor_has_capture'],item
        assert before_moves==after_moves and not ghost,item
        moves=[e for e in sequence if e['type']=='pointermove'];assert len(moves)==6 and all(e['target']=='preview-loading' and not e['loading'] for e in moves),item
        blocked+=1
        # A screenshot is made only after the outcome has already been classified;
        # it cannot be what allowed the first preview to finish in this test.
        raw=await p.screenshot(type='png',scale='css');item['ready_but_stranded_screenshot_sha256']=hashlib.sha256(raw).hexdigest();(C/(f'held-contact-{variant}-{mode}-sample.png')).write_bytes(raw)
       else:
        assert down['target']=='actor' and before_moves!=after_moves and ghost,item
       await send('touchEnd');await expect(f.locator('#export')).to_be_enabled(timeout=60000)
       # Verify recovery after a fresh actual contact; not just a cleared flag.
       b=await actor.bounding_box();x2=b['x']+b['width']/2;y2=b['y']+b['height']/2;before=await actor.get_attribute('style');await gesture(x2,y2,-sign*12,1);await expect(f.locator('#export')).to_be_enabled(timeout=60000);assert before!=await actor.get_attribute('style')
       item['fresh_third_contact_committed_movement']=True;trials.append(item)
       if variant!='Canvas' and blocked>=2:break
      if variant=='Canvas':assert blocked==0
      rows.append(dict(variant=variant,mode=mode,trials=trials,naturally_stranded_second_contacts=blocked));print(variant,mode,len(trials),'trials;',blocked,'second contacts captured by hidden blocker after readiness',flush=True)
      await ctx.close()
     finally:await browser.close()
   assert not errors,errors
  except Exception:failure=traceback.format_exc();print(failure,flush=True)
 report=dict(result='FAIL' if failure else 'PASS',started_at_workspace_utc=stamp,finished_at_workspace_utc=datetime.now(timezone.utc).isoformat(),seconds=round(time.time()-start,2),scope='Natural fast drag -> parent deselect -> second touch held >250ms after loading overlay hides. Same preset chosen in production/A1/Canvas, photo/NES, two nested opaque srcdoc. Passive POINTER-only tracing added, source/handlers unchanged; no fault injection. Linux Chromium touch emulation, not physical Android/Arena. Recovery verified with a fresh third contact.',source_sha256={k:hashlib.sha256(p.read_bytes()).hexdigest() for k,p in {'production':H/'Cartolina_Casardi_PC_e_Telefono.html','A1':H/'Cartolina_Casardi_DIAGNOSTICA_ANDROID_A1.html','Canvas':C/'canvas-experiment/canvas-preview.html'}.items()},actor_contacts_attempted=actor_contacts,parent_deselect_taps=outside_taps,rows=rows,errors=errors,failure=failure)
 (C/'held-contact-ownership-results.json').write_text(json.dumps(report,indent=2));print('DONE',report['result'],actor_contacts,'actor contacts',flush=True)
 if failure:raise RuntimeError(failure)
if __name__=='__main__':asyncio.run(main())
