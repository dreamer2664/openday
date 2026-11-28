"""Actual native image loading during real touch gestures, no injected failures."""
import asyncio,json,time
from pathlib import Path
from playwright.async_api import async_playwright,expect
C=Path('/home/user/.cache/casardi-rootcause')
async def main():
 out=[];errors=[];start=time.time()
 async with async_playwright() as pw:
  b=await pw.chromium.launch(args=['--no-sandbox'])
  try:
   for rate in [1,4,8]:
    ctx=await b.new_context(**pw.devices['Pixel 7']);p=await ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)));await p.goto('http://127.0.0.1:8092/');f=p.frames[-1];
    try:await expect(f.locator('#start')).to_be_enabled(timeout=1000)
    except AssertionError:f=p.frames[-1];await expect(f.locator('#start')).to_be_enabled()
    await f.locator('#start').tap();await f.locator('[data-mode=photo]').tap();await f.locator('[data-scene=pantheon]').tap()
    for _ in range(3):await f.locator('#next').tap()
    await expect(f.locator('#export')).to_be_enabled();n=f.locator('[data-drag=actor]');await n.scroll_into_view_if_needed();cdp=await ctx.new_cdp_session(p);await cdp.send('Emulation.setCPUThrottlingRate',{'rate':rate})
    await f.evaluate("""()=>{window.loads=[];window.moves=[];window.mutations=[];const main=document.querySelector('#final-preview'),ghost=document.querySelector('.composition-ghost');window.addEventListener('load',e=>{if(e.target===main||e.target===ghost)loads.push({at:performance.now(),which:e.target===main?'main':'ghost',complete:e.target.complete});},true);new MutationObserver(list=>{for(const m of list)mutations.push({at:performance.now(),which:m.target===main?'main':'ghost',attr:m.attributeName,complete:m.target.complete});}).observe(document.querySelector('.preview-wrap'),{subtree:true,attributes:true,attributeFilter:['src']});window.addEventListener('pointermove',e=>{moves.push({at:performance.now(),id:e.pointerId,mainComplete:main.complete,ghostComplete:ghost.complete,ghostHidden:ghost.hidden,mainCurrent:!!main.currentSrc,ghostCurrent:!!ghost.currentSrc});},true);} """)
    async def send(t,x=None,y=None):await cdp.send('Input.dispatchTouchEvent',dict(type=t,touchPoints=[] if x is None else [dict(id=0,x=x,y=y,radiusX=9,radiusY=9)]))
    rows=[]
    for i in range(3):
     await expect(f.locator('#export')).to_be_enabled();await p.locator('#outside').tap();bb=await n.bounding_box();x=bb['x']+bb['width']/2;y=bb['y']+bb['height']/2;await f.evaluate('()=>{loads=[];moves=[];mutations=[]}');await send('touchStart',x,y)
     for j in range(1,31):await send('touchMove',x+(15 if i%2==0 else -15)*j/30,y-3*j/30)
     # Read native readiness while the actor gesture remains held.
     held=await f.evaluate('()=>({loads,moves,mutations})');await send('touchEnd');await expect(f.locator('#export')).to_be_enabled();done=await f.evaluate('()=>({loads,moves,mutations})');rows.append(dict(held=held,done=done))
    out.append(dict(cpu_rate=rate,trials=rows));print(rate,[(len(t['held']['loads']),len(t['held']['mutations']),sum(not m['ghostComplete'] for m in t['held']['moves'])) for t in rows],flush=True);await ctx.close()
  finally:await b.close()
 C.joinpath('image-probe.json').write_text(json.dumps(dict(results=out,errors=errors,seconds=time.time()-start),indent=2));print('DONE',errors,flush=True)
asyncio.run(main())
