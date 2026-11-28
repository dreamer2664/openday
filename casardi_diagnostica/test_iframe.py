"""Check diagnostic visibility and touch -> blur -> touch in an opaque srcdoc
iframe. Chromium Pixel 7 emulation, NOT the actual Arena Android container.
"""
import asyncio,hashlib,json,time
from pathlib import Path
from playwright.async_api import async_playwright,expect
HOME=Path('/home/user');HERE=Path(__file__).resolve().parent;CACHE=HOME/'.cache/casardi-332'
async def main():
 checks=[];errors=[];network=[];start=time.perf_counter()
 async with async_playwright() as p:
  browser=await p.chromium.launch(args=['--no-sandbox'])
  try:
   for mode in ['photo','nes']:
    ctx=await browser.new_context(**p.devices['Pixel 7'],offline=True);page=await ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:network.append(r.url) if r.url.startswith(('http:','https:')) else None)
    await page.goto((CACHE/'host-srcdoc.html').as_uri());f=page.frames[1];await expect(f.locator('#start')).to_be_enabled();assert await f.evaluate("()=>location.origin==='null'&&self!==top")
    await f.locator('#start').tap();await f.locator('[data-mode='+mode+']').tap();await f.locator('[data-scene=casardi]').tap()
    for _ in range(3):await f.locator('#next').tap()
    await expect(f.locator('#export')).to_be_enabled(timeout=60000);await expect(f.locator('#casardi-diag-a1')).to_contain_text('non è una nuova correzione')
    cdp=await ctx.new_cdp_session(page)
    async def drag(dx,dy):
     n=f.locator('[data-drag=actor]');await n.scroll_into_view_if_needed();r=await n.bounding_box();x=r['x']+r['width']/2;y=r['y']+r['height']/2;before=await n.get_attribute('style')
     await cdp.send('Input.dispatchTouchEvent',dict(type='touchStart',touchPoints=[dict(x=x,y=y,id=0)]))
     for i in range(1,9):await cdp.send('Input.dispatchTouchEvent',dict(type='touchMove',touchPoints=[dict(x=x+dx*i/8,y=y+dy*i/8,id=0)]))
     await cdp.send('Input.dispatchTouchEvent',dict(type='touchEnd',touchPoints=[]));await expect(f.locator('#export')).to_be_enabled(timeout=30000);return before!=await n.get_attribute('style')
    for i in range(8):
     if i%2:await page.locator('#outside').tap()
     else:await f.locator('.editor-help').tap()
     assert await drag(24 if i%2==0 else -24,-8 if i%2==0 else 8)
    await expect(f.locator('#diag-a1-state')).to_contain_text('TENTATIVO PERSONAGGIO 8');await expect(f.locator('#diag-a1-state')).to_contain_text('Editor: LIBERO');await expect(f.locator('#diag-a1-state')).to_contain_text('errori 0');checks.append(dict(mode=mode,test='srcdoc opaque-origin touch -> inside/outside blur -> touch, no stickers',verified_drags=8,result='PASS'))
    # Deliberately hold the readiness flag: the diagnostic must distinguish it
    # from missing touch events. This is a control, NOT a reproduced root cause.
    await f.evaluate('()=>__CasardiDiagEditor.setRendering(true)');assert not await drag(20,-5);await expect(f.locator('#diag-a1-state')).to_contain_text('ATTESA ANTEPRIMA');await expect(f.locator('#diag-a1-state')).to_contain_text('TENTATIVO PERSONAGGIO 9');await f.evaluate('()=>__CasardiDiagEditor.setRendering(false)');assert await drag(-20,5)
    checks.append(dict(mode=mode,test='injected readiness lock is visible; clearing the test-only lock restores drag',result='PASS',fault_injection=True))
    if mode=='nes':
     await f.locator('.preview-wrap').evaluate('(e)=>e.scrollIntoView({block:"start"})');await page.screenshot(path=str(HERE/'diagnostic-mobile-iframe.jpg'),type='jpeg',quality=80)
    await ctx.close()
   assert not errors and not network,(errors,network)
  finally:await browser.close()
 report=dict(result='PASS',date='2026-11-27',diagnostic_file_sha256=hashlib.sha256((HOME/'Cartolina_Casardi_DIAGNOSTICA_ANDROID_A1.html').read_bytes()).hexdigest(),seconds=round(time.perf_counter()-start,2),checks=checks,javascript_errors=errors,http_requests=network,scope='Linux Chromium Pixel 7 emulation in sandbox allow-scripts, srcdoc, opaque origin, offline; not actual Arena Android UI or physical phone.',reported_user_bug='NOT REPRODUCED in this generic iframe. Waiting for on-device diagnostics; do not call this a bugfix.')
 (HERE/'diagnostic-iframe-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,indent=2))
asyncio.run(main())
