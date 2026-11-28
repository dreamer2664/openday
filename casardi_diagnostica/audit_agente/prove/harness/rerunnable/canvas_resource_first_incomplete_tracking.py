"""Canvas resource lifetime probe, isolated non-release HTML. WeakRefs and CDP
forced GC are diagnostic instrumentation; these figures are not Android memory
limits or measurements from the user's device. No source files are modified.
"""
import asyncio,json,time,traceback
from pathlib import Path
from datetime import datetime,timezone
from playwright.async_api import async_playwright,expect
C=Path('/home/user/.cache/casardi-rootcause');HTML=C/'canvas-experiment/canvas-preview.html'
async def main():
 started=datetime.now(timezone.utc);start=time.time();rows=[];errors=[];failure=None
 async with async_playwright() as pw:
  b=await pw.chromium.launch(args=['--no-sandbox'])
  try:
   for mode in ['photo','nes']:
    ctx=await b.new_context(offline=True,has_touch=True,is_mobile=True,viewport=dict(width=390,height=1000));p=await ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
    await p.add_init_script("""(()=>{window.qaCanvases=[];const create=Document.prototype.createElement;Document.prototype.createElement=function(...a){const n=create.apply(this,a);if(String(a[0]).toLowerCase()==='canvas')qaCanvases.push(new WeakRef(n));return n;};})();""")
    await p.goto(HTML.as_uri());await expect(p.locator('#start')).to_be_enabled();await p.locator('#start').tap();await p.locator('[data-mode='+mode+']').tap();await p.locator('[data-scene=casardi]').tap();await p.locator('#next').tap();await p.locator('#next').tap();await p.locator('#next').tap();await expect(p.locator('#export')).to_be_enabled(timeout=60000);cdp=await ctx.new_cdp_session(p)
    async def measure():
     await cdp.send('HeapProfiler.collectGarbage');
     return await p.evaluate("""()=>{const alive=qaCanvases.map(r=>r.deref()).filter(Boolean),large=alive.filter(c=>c.width*c.height>16);return{canvas_allocations:qaCanvases.length,live_canvases:alive.length,live_pixel_area:large.reduce((s,c)=>s+c.width*c.height,0),large_canvases:large.map(c=>({width:c.width,height:c.height,id:c.id,class:c.className,connected:c.isConnected})),dom_canvases:document.querySelectorAll('canvas').length,dom_hit_buttons:document.querySelectorAll('[data-drag]').length};}""")
    before=await measure()
    async def send(kind,x=None,y=None):await cdp.send('Input.dispatchTouchEvent',dict(type=kind,touchPoints=[] if x is None else [dict(id=0,x=x,y=y)]))
    for i in range(60):
     n=p.locator('[data-drag=actor]');await n.scroll_into_view_if_needed();bb=await n.bounding_box();x=bb['x']+bb['width']/2;y=bb['y']+bb['height']/2;old=await n.get_attribute('style');s=1 if i%2==0 else -1
     await send('touchStart',x,y)
     for j in range(1,5):await send('touchMove',x+12*s*j/4,y-3*s*j/4)
     await send('touchEnd');await expect(p.locator('#export')).to_be_enabled(timeout=60000);assert old!=await n.get_attribute('style'),(mode,i)
    after=await measure();assert after['dom_canvases']==3 and after['dom_hit_buttons']==1,after
    assert after['live_pixel_area']==before['live_pixel_area'] and len(after['large_canvases'])==len(before['large_canvases']),{'before':before,'after':after}
    # A reset during a real held contact must dispose all retained preview layers.
    bb=await p.locator('[data-drag=actor]').bounding_box();await send('touchStart',bb['x']+bb['width']/2,bb['y']+bb['height']/2);await p.locator('#reset').evaluate('n=>n.click()');await send('touchEnd');await expect(p.locator('#welcome')).to_be_visible();reset=await measure()
    assert reset['live_pixel_area']==0 and reset['dom_hit_buttons']==0,reset
    row=dict(mode=mode,verified_drags=60,before=before,after=after,reset=reset,result='PASS');rows.append(row);print('PASS',mode,'60 verified drags, retained canvas area',before['live_pixel_area'],'->',after['live_pixel_area'],'reset',reset['live_pixel_area'],flush=True);await ctx.close()
   assert not errors,errors
  except Exception:failure=traceback.format_exc();print(failure,flush=True)
  finally:await b.close()
 report=dict(result='FAIL' if failure else 'PASS',started_at_workspace_utc=started.isoformat(),finished_at_workspace_utc=datetime.now(timezone.utc).isoformat(),seconds=round(time.time()-start,2),scope='Diagnostic WeakRef/forced-GC observation in Linux Chromium, 120 real CDP gesture edits. Retained Canvas backing-store area and DOM topology, NOT total process/native image memory or a physical Android limit.',rows=rows,errors=errors,failure=failure)
 (C/'canvas-resource-results.json').write_text(json.dumps(report,indent=2))
 if failure:raise RuntimeError(failure)
asyncio.run(main())
