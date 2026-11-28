"""Controlled ownership test of optional Python kiosk controller, not portable
Android reproduction. Real Flask routes are fulfilled in-process into Chromium.
Only editor diagnostics and held decode promises are injected. No release files
are changed. A late old decode error must not mutate a newer preview's state.
"""
import asyncio,json,time,traceback,hashlib,sys,os,tempfile
from pathlib import Path
from urllib.parse import urlsplit
C=Path('/home/user/.cache/casardi-rootcause');R=C/'casardi_postcard';sys.path.insert(0,str(R))
os.environ['POSTCARD_EXPORT_DIR']=str(C/'kiosk-qa-empty-store')
from app import server
from playwright.async_api import async_playwright,expect
source=(R/'web/static/app.js').read_text()
old="    }catch(e){if(e.name!=='AbortError'){editor.failed();notify(e.message,true);}}\n    finally{if(seq===previewSeq&&epoch===state.epoch)$('#preview-loading').hidden=true;}"
new="    }catch(e){if(seq===previewSeq&&epoch===state.epoch&&!ctl.signal.aborted&&e.name!=='AbortError'){editor.failed();notify(e.message,true);}}\n    finally{if(seq===previewSeq&&epoch===state.epoch){editor.setRendering(false);$('#preview-loading').hidden=true;}}"
assert source.count(old)==1
patched=source.replace(old,new)
(C/'kiosk-ownership-candidate.js').write_text(patched)
import difflib
(C/'kiosk-ownership-candidate.patch').write_text(''.join(difflib.unified_diff(source.splitlines(True),patched.splitlines(True),fromfile='a/web/static/app.js',tofile='b/web/static/app.js')))
wrap="""\n(()=>{const original=CasardiEditor.mount;window.qa={rendering:false,failed:0,holds:[]};CasardiEditor.mount=function(cfg){const e=original(cfg),set=e.setRendering,fail=e.failed,preview=e.setPreview;e.setRendering=function(v=true){qa.rendering=v;return set.call(e,v)};e.failed=function(){qa.failed++;qa.rendering=false;return fail.call(e)};e.setPreview=async function(d){const out=await preview.call(e,d);qa.rendering=false;return out};return e;};})();\n"""
async def main():
 reports=[];errors=[];failure=None;start=time.time()
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(args=['--no-sandbox'])
  try:
   for candidate in [False,True]:
    client=server.app.test_client();ctx=await browser.new_context(viewport=dict(width=1280,height=1000),reduced_motion='reduce');p=await ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
    async def route_handler(route):
     req=route.request;u=urlsplit(req.url);path=u.path+('?' +u.query if u.query else '')
     if u.path=='/static/app.js':return await route.fulfill(status=200,body=patched if candidate else source,content_type='application/javascript')
     if u.path=='/static/layout-editor.js':return await route.fulfill(status=200,body=(R/'web/static/layout-editor.js').read_text()+wrap,content_type='application/javascript')
     response=client.open(path,method=req.method,data=req.post_data_buffer,headers={k:v for k,v in req.headers.items() if k.lower() not in ['host','cookie','content-length']})
     try:raw=response.get_data();headers={k:v for k,v in response.headers.items() if k.lower() not in ['content-length','set-cookie']};status=response.status_code
     finally:response.close()
     await route.fulfill(status=status,body=raw,headers=headers)
    await p.route('**/*',route_handler);await p.goto('http://kiosk.invalid/');await expect(p.locator('#btn-start')).to_be_enabled(timeout=60000)
    await p.locator('#btn-start').click();await p.locator('[data-style=nes]').click();await p.locator('[data-scene=casardi]').click();await p.locator('#btn-next').click();await p.locator('#btn-next').click();await p.locator('#btn-next').click();await expect(p.locator('#btn-export')).to_be_enabled(timeout=60000)
    await p.evaluate("""()=>{qa.decode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(){if(this.id!=='final-preview')return qa.decode.call(this);const src=this.src;return new Promise((resolve,reject)=>{qa.holds.push({resolve,reject,src});document.body.dataset.qaHolds=qa.holds.length;});};}""")
    # Native keyboard changes actor once; native undo starts a newer request.
    await p.locator('[data-drag=actor]').focus();await p.keyboard.press('ArrowRight');await expect(p.locator('body')).to_have_attribute('data-qa-holds','1',timeout=60000)
    await p.get_by_role('button',name='↶ Annulla',exact=True).click();await expect(p.locator('body')).to_have_attribute('data-qa-holds','2',timeout=60000)
    await p.evaluate("()=>qa.holds[0].reject(new DOMException('Controlled stale decode error','EncodingError'))")
    await p.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
    state=await p.evaluate("()=>({rendering:qa.rendering,failed_calls:qa.failed,loading:!document.querySelector('#preview-loading').hidden,status:!document.querySelector('#status').hidden,latest_src_retained:document.querySelector('#final-preview').src===qa.holds[1].src})")
    if candidate:assert state==dict(rendering=True,failed_calls=0,loading=True,status=False,latest_src_retained=True),state
    else:assert not state['rendering'] and state['failed_calls']==1 and state['loading'] and state['status'],state
    reports.append(dict(candidate=candidate,observed=state,result='PASS',meaning='Stale-error isolation verified' if candidate else 'Ownership defect reproduced under controlled stale-decode rejection'))
    await p.evaluate('()=>{qa.holds[1].resolve();HTMLImageElement.prototype.decode=qa.decode;}');await expect(p.locator('#btn-export')).to_be_enabled(timeout=60000)
    await ctx.close();print('PASS candidate',candidate,state,flush=True)
   assert not errors,errors
  except Exception:failure=traceback.format_exc();print(failure,flush=True)
  finally:await browser.close();server.store.close()
 report=dict(result='FAIL' if failure else 'PASS',date='2026-11-27',seconds=round(time.time()-start,2),scope='Optional HTTP/Pillow kiosk only. Deliberate stale image.decode error, not physical Android trigger or portable/Arena reproduction.',source_sha256=hashlib.sha256(source.encode()).hexdigest(),checks=reports,errors=errors,failure=failure)
 (C/'kiosk-ownership-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 if failure:raise RuntimeError(failure)
asyncio.run(main())
