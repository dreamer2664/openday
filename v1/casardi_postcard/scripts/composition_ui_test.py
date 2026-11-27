"""Real optional-editor interactions and downloaded pixel proofs in Chromium.
Mouse + CDP touch events are emulation, not physical-device acceptance.
"""
from __future__ import annotations
import asyncio,base64,hashlib,io,json,sys,tempfile,time,traceback
from pathlib import Path
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from app.catalogue import normalise_job
from app.postcard import compose
from app.credits import png_bytes
HTML=ROOT/'Cartolina_Casardi_PC_e_Telefono.html'
OUT=ROOT/'docs/test-results/composition-ui-tests.json'

async def main():
 started=time.perf_counter();tests=[];errors=[];external=[];exports=[];examples=[]
 def mark(name,**details):tests.append(dict(name=name,result='PASS',**details));print('PASS',name,flush=True)
 def verify(raw,decorated=False):
  with Image.open(io.BytesIO(raw)) as im:
   assert im.size==(3000,2000) and im.mode in ('RGB','RGBA') and im.getextrema()[0][0]>=0
   assert im.convert('RGBA').getchannel('A').getextrema()==(255,255)
   assert im.info['Source'] and 'PERSONAGGIO MODULARE LPC' in im.info['Description'] and abs(im.info['dpi'][0]-300)<.01
   assert ('DECORAZIONI FACOLTATIVE' in im.info['Description'])==decorated
   if decorated:assert 'POF-26-27' in im.info['Description'] and 'CC BY 4.0' in im.info['Description']
  return dict(dimensions=[3000,2000],sha256=hashlib.sha256(raw).hexdigest(),bytes=len(raw))
 async def inspect(page):return await page.evaluate('()=>JSON.parse(JSON.stringify(window.compositionTestLast))')
 async def instrument(page):
  await page.evaluate('''()=>{const original=CasardiRender.compose;CasardiRender.compose=async function(raw,width,options){const c=await original.call(this,raw,width,options);window.compositionTestLast={job:JSON.parse(JSON.stringify(raw)),meta:c.editor?.meta??null,width};return c;};}''')
 async def enter(page,mode,server=False):
  await page.click('#btn-start' if server else '#start');await page.click(('[data-style="' if server else '[data-mode="')+mode+'"]');await page.click('[data-scene="paestum"]');await page.fill('#name-input' if server else '#nickname','Arianna');next_button='#btn-next' if server else '#next';await page.click(next_button);await page.click(next_button);await page.click('[data-animal="gatto"]');await page.click(next_button);await expect(page.locator('#btn-export' if server else '#export')).to_be_enabled(timeout=60000)
 async def download(page,tmp,name,server=False):
  if server:
   async with page.expect_response(lambda r:r.url.endswith('/api/export')) as response:await page.click('#btn-export')
   data=await(await response.value).json();await expect(page.locator('#result')).to_be_visible();r=await page.context.request.get('http://127.0.0.1:8080'+data['file_url']);assert r.status==200;return await r.body()
  await page.click('#export');await expect(page.locator('#result')).to_be_visible(timeout=60000)
  async with page.expect_download() as event:await page.click('#save')
  item=await event.value;path=tmp/name;await item.save_as(str(path));raw=path.read_bytes();await item.delete();path.unlink();return raw
 async def drag(page,key,dx,dy,touch=False):
  element=page.locator('[data-drag="'+str(key)+'"]');await element.scroll_into_view_if_needed();b=await element.bounding_box();x=b['x']+b['width']/2;y=b['y']+b['height']/2
  if touch:
   cdp=await page.context.new_cdp_session(page);await cdp.send('Input.dispatchTouchEvent',dict(type='touchStart',touchPoints=[dict(x=x,y=y,id=0)]))
   for i in range(1,9):await cdp.send('Input.dispatchTouchEvent',dict(type='touchMove',touchPoints=[dict(x=x+dx*i/8,y=y+dy*i/8,id=0)]))
   await cdp.send('Input.dispatchTouchEvent',dict(type='touchEnd',touchPoints=[]));await cdp.detach()
  else:
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,steps=10);await page.mouse.up()
 async with async_playwright() as p:
  browser=await p.chromium.launch(args=['--no-sandbox'])
  try:
   with tempfile.TemporaryDirectory() as td:
    tmp=Path(td)
    for mode in ('photo','nes'):
     ctx=await browser.new_context(offline=True,accept_downloads=True,viewport=dict(width=1440,height=1000));page=await ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:external.append(r.url) if r.url.startswith(('http:','https:')) else None)
     await page.goto(HTML.as_uri());await expect(page.locator('#start')).to_be_enabled();await instrument(page);await enter(page,mode)
     first=await inspect(page);assert first['job']['composition']==dict(actor=None,plaque=dict(theme='originale',ornament='none',position='scene',track='none'),stickers=[]);assert await page.locator('.card-sticker').count()==0;assert await page.locator('.sticker-choice[aria-pressed=true]').count()==0
     raw0=await download(page,tmp,mode+'-default.png');verify(raw0);mark(mode+': cartolina iniziale senza sticker né aggiunte obbligatorie')
     await page.locator('.preview-wrap').scroll_into_view_if_needed();await drag(page,'actor',100,-38);await expect(page.locator('#export')).to_be_enabled(timeout=60000);moved=await inspect(page);assert moved['job']['composition']['actor'] is not None;assert moved['meta']['actor']['x']>first['meta']['actor']['x']+45;assert moved['meta']['actor']['y']<first['meta']['actor']['y']-10
     raw1=await download(page,tmp,mode+'-moved.png');v=verify(raw1)
     a=np.asarray(Image.open(io.BytesIO(raw0)).convert('RGB'));b=np.asarray(Image.open(io.BytesIO(raw1)).convert('RGB'));changed=int(np.any(a!=b,axis=2).sum());assert changed>20000,changed
     exports.append(dict(mode=mode,edition='standalone',operation='character mouse drag',changed_export_pixels=changed,**v));mark(mode+': trascinamento mouse modifica realmente il PNG scaricato e sposta anche il companion',changed_pixels=changed)
     await page.locator('.preview-wrap').scroll_into_view_if_needed();await page.locator('[data-drag=actor]').focus();await page.keyboard.press('Shift+ArrowLeft');await expect(page.locator('#export')).to_be_enabled(timeout=60000);keyboard=await inspect(page);assert abs(keyboard['meta']['actor']['x']-moved['meta']['actor']['x']+10)<1
     mark(mode+': frecce con Maiusc spostano il personaggio di dieci unità native')
     await page.locator('.editor-section').nth(0).locator('summary').click();await page.locator('#actor-scale').focus();await page.keyboard.press('End');await expect(page.locator('#export')).to_be_enabled(timeout=60000);sized=await inspect(page);assert sized['job']['composition']['actor']['scale']==135 and sized['meta']['character']['h']>keyboard['meta']['character']['h'];raw_big=await download(page,tmp,mode+'-actor-size.png');verify(raw_big);difference=int(np.any(np.asarray(Image.open(io.BytesIO(raw1)).convert('RGB'))!=np.asarray(Image.open(io.BytesIO(raw_big)).convert('RGB')),axis=2).sum());assert difference>20000;mark(mode+': taglia del personaggio realmente diversa nel PNG, a passi interi',changed_pixels=difference);await page.locator('#actor-scale').focus();await page.keyboard.press('ArrowLeft');await expect(page.locator('#export')).to_be_enabled(timeout=60000)
     await page.click('[data-add-sticker="alloro"]');await page.click('[data-add-sticker="pegaso"]');await expect(page.locator('.card-sticker')).to_have_count(2);await drag(page,1,-100,35);await expect(page.locator('.composition-ghost')).to_be_hidden();await page.locator('[data-drag="1"]').focus();await page.keyboard.press('Delete');await expect(page.locator('.card-sticker')).to_have_count(1);await page.get_by_role('button',name='↶ Annulla',exact=True).click();await expect(page.locator('.card-sticker')).to_have_count(2)
     mark(mode+': sticker trascinabile, rimozione da tastiera e annullamento reale')
     for sid in ('lira','libro','teatro','logo_casardi'):await page.click('[data-add-sticker="'+sid+'"]')
     await expect(page.locator('.card-sticker')).to_have_count(6);await page.click('[data-add-sticker="capitello"]');await expect(page.locator('.card-sticker')).to_have_count(6);await expect(page.locator('#toast')).to_contain_text('fino a sei')
     await page.click('[data-add-sticker="logo_casardi"]');await expect(page.locator('[aria-label="Inclinazione dello sticker"]')).to_be_disabled();mark(mode+': massimo sei sticker e logo istituzionale non inclinabile')
     # Keep two coherent decals, exercising removal from the real UI.
     for sid in ('lira','libro','teatro','logo_casardi'):
      await page.click('[data-add-sticker="'+sid+'"]');await page.get_by_role('button',name='Rimuovi sticker',exact=True).click()
     await page.locator('.editor-section').nth(2).locator('summary').click()
     for key,value in dict(theme='notte' if mode=='nes' else 'avorio',ornament='logo_casardi',track='classico',position='top-left').items():await page.select_option('[data-plaque="'+key+'"]',value)
     await expect(page.locator('#export')).to_be_enabled(timeout=60000);decorated=await inspect(page);assert decorated['job']['composition']['plaque']['track']=='classico';assert len(decorated['job']['composition']['stickers'])==2
     await page.click('#prev');await page.click('#next');await expect(page.locator('#export')).to_be_enabled(timeout=60000);again=await inspect(page);assert again['job']['composition']==decorated['job']['composition'];mark(mode+': simbolo ufficiale, finitura e percorso opzionali conservati tornando indietro')
     raw2=await download(page,tmp,mode+'-decorated.png');v=verify(raw2,True)
     # Actual keyboard operation of native range controls, followed by a real PNG download.
     await page.click('[data-add-sticker="alloro"]');await page.locator('[aria-label="Dimensione dello sticker"]').focus();await page.keyboard.press('End');await page.locator('[aria-label="Inclinazione dello sticker"]').focus();await page.keyboard.press('End');raw_size=await download(page,tmp,mode+'-size-rotation.png');verify(raw_size,True);size_job=(await inspect(page))['job'];assert size_job['composition']['stickers'][0]['size']==132 and size_job['composition']['stickers'][0]['rotation']==30
     difference=int(np.any(np.asarray(Image.open(io.BytesIO(raw2)).convert('RGB'))!=np.asarray(Image.open(io.BytesIO(raw_size)).convert('RGB')),axis=2).sum());assert difference>1000;mark(mode+': dimensione e inclinazione cambiano i pixel del PNG con i veri controlli a cursore',changed_pixels=difference)
     # Revert each cursor edit using the real history, not internal state injection.
     await page.get_by_role('button',name='↶ Annulla',exact=True).click();await expect(page.locator('#export')).to_be_enabled(timeout=60000);await page.get_by_role('button',name='↶ Annulla',exact=True).click();await expect(page.locator('#export')).to_be_enabled(timeout=60000);assert (await inspect(page))['job']['composition']==decorated['job']['composition']
     # Independent recomposition from the exact job captured at the public render entry.
     result=await page.evaluate('''async j=>{const c=await CasardiRender.compose(j,3000),b=await CasardiRender.pngBlob(c,j);CasardiRender.dispose(c);const bytes=new Uint8Array(await b.arrayBuffer());let out='';for(let i=0;i<bytes.length;i+=32768)out+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(out);}''',decorated['job']);assert base64.b64decode(result)==raw2
     mark(mode+': PNG decorato ricomposto dagli asset, identico byte per byte al download UI; logo attribuito')
     path=ROOT/'renders'/('Z_33_cartolina_'+mode+'_decorata.png');path.write_bytes(raw2);examples.append(dict(path=str(path.relative_to(ROOT)),job=decorated['job'],**v));exports.append(dict(mode=mode,edition='standalone',operation='optional nameplate and stickers',**v))
     await page.locator('.preview-wrap').scroll_into_view_if_needed();await page.screenshot(path=str(ROOT/'docs/qa'/('15_editor_desktop_'+mode+'.jpg')),type='jpeg',quality=85,full_page=True)
     await page.get_by_role('button',name='Ripristina composizione',exact=True).click();await expect(page.locator('#export')).to_be_enabled(timeout=60000);cleared=await inspect(page);assert cleared['job']['composition']==first['job']['composition'];assert cleared['job']['character']==first['job']['character'] and cleared['job']['name']=='Arianna' and cleared['job']['companion']==first['job']['companion'];await page.click('#reset');await expect(page.locator('#welcome')).to_be_visible();assert await page.locator('#nickname').input_value()=='';mark(mode+': ripristino delle sole decorazioni e reset del visitatore senza residui')
     await ctx.close()
    # Touch drag, responsive scroll and genuinely offline editing on a phone viewport.
    for width in (320,390,768):
     ctx=await browser.new_context(offline=True,is_mobile=True,has_touch=True,viewport=dict(width=width,height=900),accept_downloads=True);page=await ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:external.append(r.url) if r.url.startswith(('http:','https:')) else None);await page.goto(HTML.as_uri());await expect(page.locator('#start')).to_be_enabled();await instrument(page);await enter(page,'nes');before=await inspect(page);await drag(page,'actor',-32,-13,touch=True);await expect(page.locator('#export')).to_be_enabled(timeout=60000);after=await inspect(page);assert after['meta']['actor']['x']<before['meta']['actor']['x']-15
     await page.click('[data-add-sticker="alloro"]');await drag(page,0,-30,30,touch=True);assert await page.evaluate('()=>document.documentElement.scrollWidth<=innerWidth');assert await page.locator('[data-drag=actor]').evaluate('(e)=>getComputedStyle(e).touchAction')=='none';assert await page.locator('.editor-help').evaluate('(e)=>getComputedStyle(e).touchAction')!='none'
     if width==390:
      await page.locator('.preview-wrap').scroll_into_view_if_needed();await page.screenshot(path=str(ROOT/'docs/qa/16_editor_touch_390.jpg'),type='jpeg',quality=87,full_page=True)
     mark('Touch emulato '+str(width)+' px: personaggio e sticker si muovono; nessun overflow orizzontale; lo scroll fuori dagli elementi resta libero',physical_device=False);await ctx.close()
    # Python/Pillow UI uses the same gesture editor with its own local preview layers.
    for mode in ('photo','nes'):
     ctx=await browser.new_context(accept_downloads=True,viewport=dict(width=1280,height=1000));page=await ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));await page.goto('http://127.0.0.1:8080');await expect(page.locator('#btn-start')).to_be_enabled(timeout=60000);await enter(page,mode,True);raw0=await download(page,tmp,'server0.png',True);verify(raw0)
     await page.locator('.preview-wrap').scroll_into_view_if_needed();await drag(page,'actor',95,-25);await expect(page.locator('#btn-export')).to_be_enabled(timeout=60000);await page.click('[data-add-sticker="alloro"]');await page.locator('.editor-section').nth(2).locator('summary').click();await page.select_option('[data-plaque=ornament]','logo_casardi');await page.select_option('[data-plaque=track]','musicale');await expect(page.locator('#btn-export')).to_be_enabled(timeout=60000);raw1=await download(page,tmp,'server1.png',True);v=verify(raw1,True);difference=int(np.any(np.asarray(Image.open(io.BytesIO(raw0)).convert('RGB'))!=np.asarray(Image.open(io.BytesIO(raw1)).convert('RGB')),axis=2).sum());assert difference>20000;exports.append(dict(edition='python',mode=mode,operation='drag and optional decorations',changed_export_pixels=difference,**v));mark('Pillow '+mode+': trascinamento reale, logo e percorso nella cartolina HD scaricata',changed_pixels=difference);await page.click('#btn-reset');await ctx.close()
    assert not errors,errors;assert not external,external;mark('File autonomo: zero HTTP anche per sticker e logo; nessun errore JavaScript in tutte le prove')
   (ROOT/'renders/composition-33-examples.json').write_text(json.dumps(examples,ensure_ascii=False,indent=2)+'\n')
  except Exception:
   tests.append(dict(name='Interrupted optional-editor verification',result='FAIL',error=traceback.format_exc()));raise
  finally:
   await browser.close();OUT.write_text(json.dumps(dict(result='PASS' if tests and all(t['result']=='PASS' for t in tests) else 'FAIL',date='2026-11-27',seconds=round(time.perf_counter()-started,2),html_sha256=hashlib.sha256(HTML.read_bytes()).hexdigest(),tests=tests,exports=exports,javascript_errors=errors,standalone_http_requests=external,physical_phone='NOT TESTED',native_windows='NOT TESTED',school_wifi='NOT TESTED',method='Real UI mouse events, keyboard and CDP touch emulation; PNG downloads decoded and compared. No image of the editor is exported. Synthetic demo name only.'),ensure_ascii=False,indent=2)+'\n')
 print('DONE',len(tests),'optional-editor checks;',len(exports),'downloaded export proofs')
if __name__=='__main__':asyncio.run(main())
