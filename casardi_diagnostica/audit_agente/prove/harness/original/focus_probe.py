import asyncio,html,json,traceback
from pathlib import Path
from playwright.async_api import async_playwright,expect
H=Path('/home/user');C=H/'.cache/casardi-rootcause';R=C/'casardi_postcard'
base=(R/'Cartolina_Casardi_PC_e_Telefono.html').read_text()
base=base.replace('async setPreview(data){',"debug(){return {busy,rendering,drag:drag?{kind:drag.kind,id:drag.id,moved:drag.moved}:null,actor:meta?.actor,model:get().actor};},async setPreview(data){").replace('const editor=CasardiEditor.mount({','const editor=window.testEditor=CasardiEditor.mount({')
C.joinpath('frame.html').write_text(base)
C.joinpath('host.html').write_text('''<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#181920;color:#fff}button{padding:15px}iframe{display:block;width:100%;height:620px;border:0}</style><button id="outside">Fuori</button><iframe sandbox="allow-scripts" src="frame.html"></iframe><button id="other">Altro punto</button>''')
async def main():
 results=[];errors=[]
 async with async_playwright() as p:
  b=await p.chromium.launch(args=['--no-sandbox'])
  try:
   for mode in ['photo','nes']:
    ctx=await b.new_context(**p.devices['Pixel 7']);pg=await ctx.new_page();pg.on('pageerror',lambda e:errors.append(str(e)));await pg.goto((C/'host.html').as_uri());f=pg.frames[1];await expect(f.locator('#start')).to_be_enabled()
    await f.evaluate("""()=>{window.trace=[];for(const t of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture','dragstart','dragend','contextmenu','blur','focus','focusin','selectstart'])window.addEventListener(t,e=>{trace.push({t,id:e.pointerId,pt:e.pointerType,btn:e.buttons,target:e.target.closest?.('[data-drag]')?.dataset.drag||e.target.id||e.target.tagName,s:testEditor.debug()});if(trace.length>35)trace.shift();},true);} """)
    await f.locator('#start').tap();await f.locator('[data-mode='+mode+']').tap();await f.locator('[data-scene=casardi]').tap()
    for _ in range(3):await f.locator('#next').tap()
    await expect(f.locator('#export')).to_be_enabled(timeout=60000);cdp=await ctx.new_cdp_session(pg)
    async def touch(kind,x=None,y=None):await cdp.send('Input.dispatchTouchEvent',dict(type=kind,touchPoints=[] if x is None else [dict(x=x,y=y,id=0)]))
    async def actor(dx,dy):
     n=f.locator('[data-drag=actor]');await n.scroll_into_view_if_needed();bb=await n.bounding_box();x=bb['x']+bb['width']/2;y=bb['y']+bb['height']/2;old=await n.get_attribute('style');await touch('touchStart',x,y)
     for i in range(1,9):await touch('touchMove',x+dx*i/8,y+dy*i/8)
     await touch('touchEnd');await expect(f.locator('#export')).to_be_enabled(timeout=30000);return old!=await n.get_attribute('style')
    for i in range(36):
     which=['outside','background-tap','background-long-press','background-drag','background-long-drag','rapid-outside'][i%6]
     if which in ['outside','rapid-outside']:await pg.locator('#outside').tap()
     else:
      n=f.locator('.preview-wrap');await n.scroll_into_view_if_needed();bb=await n.bounding_box();x=bb['x']+bb['width']*.88;y=bb['y']+bb['height']*.30
      if 'long' in which:
       await cdp.send('Input.synthesizeTapGesture',dict(x=x,y=y,duration=1100,tapCount=1,gestureSourceType='touch'))
      else:await touch('touchStart',x,y)
      if 'drag' in which:
       if 'long' in which:await touch('touchStart',x,y)
       await touch('touchMove',x-30,y+12)
      if 'long' not in which or 'drag' in which:await touch('touchEnd')
     moved=await actor(18 if i%2==0 else -18,-6 if i%2==0 else 6)
     print(mode,i,which,moved,flush=True)
     if not moved:
      results.append(dict(mode=mode,i=i,case=which,state=await f.evaluate('()=>testEditor.debug()'),trace=await f.evaluate('()=>trace')));break
    else:results.append(dict(mode=mode,result='No freeze',trials=36,trace_tail=await f.evaluate('()=>trace.slice(-5)')))
    await ctx.close()
  finally:await b.close()
 C.joinpath('focus-probe.json').write_text(json.dumps(dict(results=results,errors=errors),indent=2));print(json.dumps(dict(results=results,errors=errors),indent=2)[-6000:])
asyncio.run(main())
