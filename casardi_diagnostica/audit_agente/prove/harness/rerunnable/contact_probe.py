"""Physical-contact-size emulation: distinguish pointer hit testing from native focus.
Not a physical Android test. No event handler or hit box changes in target.
"""
import asyncio,json,time
from pathlib import Path
from playwright.async_api import async_playwright,expect
C=Path('/home/user/.cache/casardi-rootcause');R=C/'casardi_postcard'
async def main():
 out=[];errors=[];start=time.time()
 async with async_playwright() as pw:
  b=await pw.chromium.launch(args=['--no-sandbox'])
  try:
   ctx=await b.new_context(**pw.devices['Pixel 7']);p=await ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)));await p.goto((C/'host.html').as_uri());f=p.frames[1]
   await expect(f.locator('#start')).to_be_enabled();await f.locator('#start').tap();await f.locator('[data-mode=photo]').tap();await f.locator('[data-scene=casardi]').tap()
   for _ in range(3):await f.locator('#next').tap()
   await expect(f.locator('#export')).to_be_enabled();cdp=await ctx.new_cdp_session(p)
   await f.evaluate("""()=>{window.trace=[];for(const t of ['pointerdown','pointerup','pointercancel','click','focusin','contextmenu','dragstart'])window.addEventListener(t,e=>{trace.push({t,key:e.target.closest?.('[data-drag]')?.dataset.drag||e.target.id||e.target.tagName,x:e.clientX,y:e.clientY,ptr:e.pointerType,state:testEditor.debug()});if(trace.length>40)trace.shift();},true);}""")
   async def ev(t,x=None,y=None,r=10):await cdp.send('Input.dispatchTouchEvent',dict(type=t,touchPoints=[] if x is None else [dict(id=0,x=x,y=y,radiusX=r,radiusY=r,force=.7)]))
   for scale in [100,65,135]:
    await f.locator('.editor-section').first.locator('summary').tap() if not await f.locator('.editor-section').first.evaluate('n=>n.open') else None
    await f.locator('#actor-scale').evaluate('(n,v)=>{n.value=v;n.dispatchEvent(new Event("input",{bubbles:true}));n.dispatchEvent(new Event("change",{bubbles:true}));}',scale);await expect(f.locator('#export')).to_be_enabled()
    for radius in [1,8,16]:
     for point in ['center','left-inner','left-outer','right-inner','right-outer','top-inner','top-outer','bottom-inner','bottom-outer']:
      n=f.locator('[data-drag=actor]');await n.scroll_into_view_if_needed();bb=await n.bounding_box();x=bb['x']+bb['width']/2;y=bb['y']+bb['height']/2
      # Deselect outside the entire frame, as in the user scenario.
      await p.locator('#outside').tap();
      if 'left' in point:x=bb['x']+(-4 if 'outer' in point else 2)
      if 'right' in point:x=bb['x']+bb['width']+(4 if 'outer' in point else -2)
      if 'top' in point:y=bb['y']+(-4 if 'outer' in point else 2)
      if 'bottom' in point:y=bb['y']+bb['height']+(4 if 'outer' in point else -2)
      before=await f.evaluate('()=>{trace=[];return testEditor.debug()}');await ev('touchStart',x,y,radius)
      for i in range(1,5):await ev('touchMove',x+(16 if len(out)%2 else -16)*i/4,y-4*i/4,radius)
      await ev('touchEnd');await expect(f.locator('#preview-loading')).to_be_hidden(timeout=30000)
      after=await f.evaluate('()=>testEditor.debug()');tr=await f.evaluate('()=>trace');out.append(dict(scale=scale,radius=radius,point=point,bb=bb,before=before,after=after,moved=before['model']!=after['model'],trace=tr))
    print(scale,[(r['point'],r['radius'],r['moved'],r['trace'][0]['key']) for r in out[-27:]],flush=True)
   await ctx.close()
  finally:await b.close()
 C.joinpath('contact-probe.json').write_text(json.dumps(dict(results=out,errors=errors,seconds=time.time()-start),indent=2));print('DONE',len(out),errors,flush=True)
asyncio.run(main())
