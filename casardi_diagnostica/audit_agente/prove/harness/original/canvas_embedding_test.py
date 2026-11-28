"""Pristine released HTML, nested opaque-origin srcdoc, no injected script/diagnostics.
No readiness waits *during* a gesture. Waiting between gestures isolates event
recovery and outfit/hit geometry; separate timing probe does not wait between.
"""
import asyncio,hashlib,json,time,traceback
from pathlib import Path
from playwright.async_api import async_playwright,expect
C=Path('/home/user/.cache/casardi-rootcause');R=C/'casardi_postcard'
async def main():
 out=[];errors=[];requests=[];failure=None;start=time.time();attempts=0
 async with async_playwright() as pw:
  b=await pw.chromium.launch(args=['--no-sandbox'])
  try:
   for nested in [False,True]:
    for mode in ['photo','nes']:
     ctx=await b.new_context(**pw.devices['Pixel 7']);p=await ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.on('request',lambda r:requests.append(r.url) if r.frame.parent_frame else None)
     await p.goto('http://127.0.0.1:8092/?exp=1&nested='+('1' if nested else '0'));f=p.frames[-1]
     # A fresh inner srcdoc can be created after the first parent navigation.
     for _ in range(5):
      try:await expect(f.locator('#start')).to_be_enabled(timeout=1000);break
      except AssertionError:f=p.frames[-1]
     await expect(f.locator('#start')).to_be_enabled(timeout=60000)
     assert await f.evaluate('()=>self!==top&&location.origin==="null"')
     await f.locator('#start').tap();await f.locator('[data-mode='+mode+']').tap();await f.locator('[data-scene=casardi]').tap();await f.locator('#next').tap()
     # Actual preset/UI changes, not a state API inserted into the page.
     cdp=await ctx.new_cdp_session(p)
     async def send(t,x=None,y=None,id=0):return await cdp.send('Input.dispatchTouchEvent',dict(type=t,touchPoints=[] if x is None else [dict(id=id,x=x,y=y,radiusX=9,radiusY=8,force=.7)]))
     async def ready():await expect(f.locator('#export')).to_be_enabled(timeout=60000)
     async def drag(dx,dy,case):
      nonlocal attempts
      n=f.locator('[data-drag=actor]');await n.scroll_into_view_if_needed();bb=await n.bounding_box();x=bb['x']+bb['width']/2;y=bb['y']+bb['height']/2;before=await n.get_attribute('style');attempts+=1
      await send('touchStart',x,y)
      for i in range(1,7):await send('touchMove',x+dx*i/6,y+dy*i/6)
      mid=await n.get_attribute('style');ghost=await f.locator('.composition-ghost').is_visible();await send('touchEnd');await ready();after=await n.get_attribute('style')
      assert before!=mid,(nested,mode,case,'no visual movement during gesture',bb,before,after)
      assert before!=after,(nested,mode,case,'movement not committed',bb,before,after)
      assert ghost,(nested,mode,case,'actor image not moving')
      return dict(case=case,width=bb['width'],height=bb['height'],moved_live=before!=mid,committed=before!=after)
     for preset in range(4):
      await f.locator('.preset-grid button').nth(preset).tap()
      await f.locator('#next').tap();await f.locator('#next').tap();await ready()
      for size in [100,65,135]:
       detail=f.locator('.editor-section').first
       if not await detail.evaluate('n=>n.open'):await detail.locator('summary').tap()
       # Keyboard change is a native control operation, preserving event semantics.
       sl=f.locator('#actor-scale');await sl.focus();await p.keyboard.press('Home');
       for _ in range((size-65)//35):await p.keyboard.press('ArrowRight')
       await ready();row=dict(nested=nested,mode=mode,preset=preset,size=size,gestures=[])
       for i in range(4):
        if i%2==0:await p.locator('#outside').tap()
        else:
         w=f.locator('.preview-wrap');await w.scroll_into_view_if_needed();box=await w.bounding_box();await send('touchStart',box['x']+box['width']*.04,box['y']+box['height']*.1);await send('touchEnd')
        row['gestures'].append(await drag(12 if i%2==0 else -12,-4 if i%2==0 else 4,'deselect-'+('outer' if i%2==0 else 'background')))
       # Real compositor lifecycle freeze/resume; no synthetic blur event.
       await cdp.send('Page.setWebLifecycleState',{'state':'frozen'});await cdp.send('Page.setWebLifecycleState',{'state':'active'})
       row['gestures'].append(await drag(10,-3,'after-page-freeze-resume'))
       # Focus outside and back with a second tab, without editing handlers.
       other=await ctx.new_page();await other.goto('about:blank');await other.bring_to_front();await p.bring_to_front();await other.close()
       row['gestures'].append(await drag(-10,3,'after-other-tab'))
       out.append(row);print('PASS',nested,mode,preset,size,flush=True)
      if preset<3:await f.locator('#edit').tap();await f.locator('[data-tab=body]').tap()
     await ctx.close()
  except Exception:
   failure=traceback.format_exc();print(failure,flush=True)
  finally:await b.close()
 report=dict(result='FAIL' if failure else 'PASS',date='2026-11-27',seconds=round(time.time()-start,2),html_sha256=hashlib.sha256((C/'canvas-experiment/canvas-preview.html').read_bytes()).hexdigest(),pristine_html=False,uninstrumented_experiment_html=True,injected_page_scripts=False,conditions=out,gesture_attempts=attempts,errors=errors,child_frame_network_requests=requests,failure=failure,scope='Linux Chromium Pixel 7 emulation; one/two opaque-origin sandbox allow-scripts srcdoc levels; four actual preset choices, three native actor sizes, no stickers. Does not reproduce a physical Android/Arena session.')
 C.joinpath('canvas-embedding-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('DONE',report['result'],attempts,errors,flush=True)
 if failure:raise RuntimeError(failure)
asyncio.run(main())
