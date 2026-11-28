"""Uninstrumented HTML. Native slider keys, long press, multitouch, cross-frame
release and CSS-scaled/narrow opaque frames. Not a physical Android/Arena test.
Only the external test host's layout is varied, not the child HTML/handlers.
"""
import asyncio,json,time,traceback,hashlib
from pathlib import Path
from playwright.async_api import async_playwright,expect
C=Path('/home/user/.cache/casardi-rootcause')
async def main():
 rows=[];errors=[];failure=None;attempts=0;started=time.time()
 async with async_playwright() as pw:
  b=await pw.chromium.launch(args=['--no-sandbox'])
  try:
   for experimental in [False,True]:
    for mode in ['photo','nes']:
     for layout in ['normal','narrow','scaled']:
      ctx=await b.new_context(**pw.devices['Pixel 7']);p=await ctx.new_page();p.set_default_timeout(45000);p.on('pageerror',lambda e:errors.append(str(e)))
      await p.goto('http://127.0.0.1:8092/?nested=1&exp='+str(int(experimental)))
      f=p.frames[-1]
      for _ in range(6):
       try:await expect(f.locator('#start')).to_be_enabled(timeout=1000);break
       except AssertionError:f=p.frames[-1]
      await expect(f.locator('#start')).to_be_enabled(timeout=60000)
      if layout=='narrow':await p.locator('#viewer').evaluate("n=>{n.style.width='280px';n.style.height='620px';n.style.margin='0 auto';}")
      elif layout=='scaled':await p.locator('#viewer').evaluate("n=>{n.style.width='740px';n.style.height='1300px';n.style.transform='scale(.5)';n.style.transformOrigin='0 0';}")
      await f.locator('#start').tap();await f.locator('[data-mode='+mode+']').tap();await f.locator('[data-scene=casardi]').tap();await f.locator('#next').tap();await f.locator('.preset-grid button').nth(3).tap();await f.locator('#next').tap();await f.locator('#next').tap()
      cdp=await ctx.new_cdp_session(p)
      async def ready():await expect(f.locator('#export')).to_be_enabled(timeout=60000)
      async def send(t,points=()):await cdp.send('Input.dispatchTouchEvent',dict(type=t,touchPoints=[dict(id=i,x=x,y=y,radiusX=9,radiusY=8,force=.7) for i,x,y in points]))
      async def center():
       n=f.locator('[data-drag=actor]');await n.scroll_into_view_if_needed();bb=await n.bounding_box();return n,bb,bb['x']+bb['width']/2,bb['y']+bb['height']/2
      async def drag(case,hold=0):
       nonlocal attempts
       await ready();n,bb,x,y=await center();before=await n.get_attribute('style');attempts+=1
       await send('touchStart',[(0,x,y)])
       if hold:await asyncio.sleep(hold)
       for k in range(1,7):await send('touchMove',[(0,x+12*k/6,y-4*k/6)])
       mid=await n.get_attribute('style');visible=await f.locator('.composition-ghost').is_visible();await send('touchEnd');await ready();after=await n.get_attribute('style')
       assert before!=mid and before!=after and visible,(experimental,mode,layout,case,before,mid,after)
       return dict(case=case,live_movement=True,committed=True,width=round(bb['width'],4))
      await ready();row=dict(experimental=experimental,mode=mode,layout=layout,controls=[],gestures=[])
      d=f.locator('.editor-section').first;await d.locator('summary').tap()
      for size in [65,100,135]:
       sl=f.locator('#actor-scale');await sl.focus();await p.keyboard.press('Home')
       for _ in range((size-65)//35):await p.keyboard.press('ArrowRight')
       await ready();value=await sl.input_value();label=await sl.get_attribute('aria-valuetext');assert value==str(size),(size,value)
       row['controls'].append(dict(requested=size,actual_native_value=value,label=label))
       await p.locator('#outside').tap();row['gestures'].append(await drag('after-outer-deselect-size-'+str(size)))
      row['gestures'].append(await drag('long-press-before-move',1.1))
      # The second finger is genuine CDP touch input, not synthetic PointerEvents.
      n,bb,x,y=await center();attempts+=1;await send('touchStart',[(0,x,y)]);await send('touchStart',[(0,x,y),(1,x+18,y+12)]);await send('touchMove',[(0,x+9,y-3),(1,x+22,y+14)]);await send('touchEnd');await ready()
      row['gestures'].append(await drag('after-native-two-finger-contact'))
      # Move the captured contact outside both sandbox frames into the host header.
      n,bb,x,y=await center();attempts+=1;await send('touchStart',[(0,x,y)]);await send('touchMove',[(0,x+6,y-2)]);await send('touchMove',[(0,190,22)]);await send('touchEnd');await ready()
      row['gestures'].append(await drag('after-cross-frame-release'))
      rows.append(row);print('PASS',experimental,mode,layout,flush=True);await ctx.close()
   assert not errors,errors
  except Exception:failure=traceback.format_exc();print(failure,flush=True)
  finally:await b.close()
 report=dict(result='FAIL' if failure else 'PASS',date='2026-11-27',seconds=round(time.time()-started,2),gesture_attempts=attempts,rows=rows,errors=errors,failure=failure,scope='Linux Chromium Pixel 7 emulation; actual CDP touch input, native range controls; nested opaque srcdoc, no scripts injected into child. Normal/narrow/parent-transform layouts, not the actual Arena host implementation or a physical phone.')
 (C/'native-embedding-edges.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 if failure:raise RuntimeError(failure)
asyncio.run(main())
