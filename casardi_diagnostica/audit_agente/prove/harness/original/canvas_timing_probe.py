"""Real CDP touch, no readiness wait between drag / outside tap / next drag.
Uses intact production renderer, only read-only state/trace instrumentation.
CPU slowdown is a browser test setting, not a production-device reproduction.
"""
import asyncio,html,json,time
from pathlib import Path
from playwright.async_api import async_playwright,expect
C=Path('/home/user/.cache/casardi-rootcause');R=C/'casardi_postcard'
source=(C/'canvas-experiment/canvas-preview.html').read_text()
source=source.replace('async setPreview(data){',"debug(){return {busy,rendering,drag:drag?{kind:drag.kind,id:drag.id,moved:drag.moved}:null,meta:meta?{actor:meta.actor,character:meta.character}:null,model:get().actor};},async setPreview(data){").replace('const editor=CasardiEditor.mount({','const editor=window.testEditor=CasardiEditor.mount({')
C.joinpath('canvas-timing-frame.html').write_text(source)
C.joinpath('canvas-timing-host.html').write_text('''<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#181920;color:#fff}button{padding:10px}iframe{display:block;width:100%;height:700px;border:0;}</style><button id="outside">Fuori dalla cartolina</button><iframe sandbox="allow-scripts" src="canvas-timing-frame.html"></iframe>''')
async def main():
 results=[];errors=[];start=time.time()
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(args=['--no-sandbox'])
  try:
   for mode,rate in [(m,r) for m in ['photo','nes'] for r in [1,4,8]]:
    ctx=await browser.new_context(**pw.devices['Pixel 7']);pg=await ctx.new_page();pg.on('pageerror',lambda e:errors.append(str(e)));await pg.goto((C/'canvas-timing-host.html').as_uri());f=pg.frames[1];await expect(f.locator('#start')).to_be_enabled(timeout=60000)
    await f.evaluate("""()=>{window.trace=[];for(const t of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])window.addEventListener(t,e=>{trace.push({t,at:performance.now(),id:e.pointerId,x:e.clientX,y:e.clientY,target:e.target.closest?.('[data-drag]')?.dataset.drag||e.target.id||e.target.tagName,rendering:testEditor.debug().rendering,drag:testEditor.debug().drag?.id,loading:!document.querySelector('#preview-loading').hidden});if(trace.length>80)trace.shift();},true);window.renderStats=[];const old=CasardiRender.compose;CasardiRender.compose=async function(...args){const now=performance.now();const c=await old.apply(this,args);renderStats.push({ms:performance.now()-now,job:args[0].composition});return c;};}""")
    await f.locator('#start').tap();await f.locator('[data-mode='+mode+']').tap();await f.locator('[data-scene=pantheon]').tap()
    for _ in range(3):await f.locator('#next').tap()
    await expect(f.locator('#export')).to_be_enabled(timeout=60000);actor=f.locator('[data-drag=actor]');await actor.scroll_into_view_if_needed();await f.evaluate("document.documentElement.style.scrollBehavior='auto'")
    cdp=await ctx.new_cdp_session(pg);await cdp.send('Emulation.setCPUThrottlingRate',{'rate':rate})
    async def send(t,x=None,y=None):return await cdp.send('Input.dispatchTouchEvent',dict(type=t,touchPoints=[] if x is None else [dict(id=0,x=x,y=y)]))
    async def gest(x,y,dx,dy):
     await send('touchStart',x,y)
     for i in range(1,5):await send('touchMove',x+dx*i/4,y+dy*i/4)
     await send('touchEnd')
    out=[]
    for i in range(6):
     await expect(f.locator('#export')).to_be_enabled(timeout=60000);bb=await actor.bounding_box();x=bb['x']+bb['width']/2;y=bb['y']+bb['height']/2;old=await actor.get_attribute('style');await gest(x,y,14,-3)
     # Outside tap immediately, without waiting for the first preview.
     await send('touchStart',200,20);await send('touchEnd')
     bb=await actor.bounding_box();x=bb['x']+bb['width']/2;y=bb['y']+bb['height']/2
     before=await f.evaluate('()=>testEditor.debug()');await gest(x,y,-14,3);after=await f.evaluate('()=>testEditor.debug()')
     await expect(f.locator('#export')).to_be_enabled(timeout=60000)
     out.append(dict(i=i,second_before=before,second_after=after,final=await f.evaluate('()=>testEditor.debug()'),trace=await f.evaluate('()=>trace.slice(-22)')))
    results.append(dict(mode=mode,cpu_rate=rate,trials=out,render_stats=await f.evaluate('()=>renderStats')));print(mode,rate,'rejected second starts',sum(1 for t in out if t['second_before']['rendering']),flush=True);await ctx.close()
  finally:await browser.close()
 C.joinpath('canvas-timing-probe.json').write_text(json.dumps(dict(results=results,errors=errors,seconds=time.time()-start),indent=2));print('DONE',len(results),errors,flush=True)
asyncio.run(main())
