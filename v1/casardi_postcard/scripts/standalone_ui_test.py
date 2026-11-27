"""Actual Chromium tests: file:// offline, full touch creator, Canvas PNGs.
Run with the local server on :8080 for the final /telefono test.
No physical phone, Safari/Firefox or school Wi-Fi is claimed.
"""
from __future__ import annotations
import asyncio
import base64
import hashlib
import io
import json
from pathlib import Path
import tempfile
import time
import traceback
import urllib.request
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from playwright.async_api import async_playwright,expect

ROOT=Path(__file__).resolve().parent.parent
HTML=ROOT/'Cartolina_Casardi_PC_e_Telefono.html'
SHOTS=ROOT/'docs/screenshots-standalone'
OUT=ROOT/'docs/test-results/standalone-browser-tests.json'

async def main():
 started=time.perf_counter();tests=[];exports=[];errors=[];network=[];contact=[]
 SHOTS.mkdir(exist_ok=True)
 def mark(name,**detail):tests.append(dict(name=name,result='PASS',**detail));print('PASS',name,flush=True)
 async def shot(page,name):
  await page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
  await page.screenshot(path=str(SHOTS/name),type='jpeg',quality=83,animations='disabled',scale='css')
 def observe(page):
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  page.on('request',lambda r:network.append((r.method,r.url)) if r.url.startswith(('http:','https:')) else None)
 async def download(page,selector,path):
  async with page.expect_download() as d:await page.locator(selector).click()
  item=await d.value;await item.save_as(str(path));return item.suggested_filename
 def verify(path):
  raw=path.read_bytes()
  with Image.open(io.BytesIO(raw)) as integrity:integrity.verify()
  with Image.open(io.BytesIO(raw)) as im:
   assert im.size==(3000,2000) and im.format=='PNG'
   assert 'LICEO ALFREDO CASARDI' in im.info['Title']
   assert 'PERSONAGGIO MODULARE LPC' in im.info['Description'] and 'CC BY-SA 4.0' in im.info['Copyright']
   assert im.info.get('Source') and im.info.get('Author') and im.info.get('Description') and im.info.get('Copyright')
   assert abs(im.info['dpi'][0]-300)<.01
   assert im.convert('RGBA').getchannel('A').getextrema()==(255,255)
   result=dict(bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest(),dimensions=list(im.size))
   return result
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=['--no-sandbox'])
  try:
   with tempfile.TemporaryDirectory() as td:
    td=Path(td);ctx=await browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True,offline=True)
    page=await ctx.new_page();observe(page)
    await page.goto(HTML.as_uri(),wait_until='load');await expect(page.locator('#start')).to_be_enabled()
    assert not network;await shot(page,'01_file_unico_benvenuto.jpg');mark('File autonomo aperto con file:// e rete disattivata',bytes=HTML.stat().st_size)
    await page.click('#start');await expect(page.locator('#next')).to_be_disabled();await page.click('[data-mode="photo"]')
    assert await page.locator('#scene-grid button').count()==6;await page.click('[data-scene="paestum"]');await page.fill('#nickname','Èlisa');await page.click('#next');mark('Percorso guidato, due stili, sei luoghi e nome facoltativo')
    await page.click('#info');await expect(page.locator('#info-dialog')).to_be_visible();assert await page.locator('#studio').evaluate('(e)=>e.inert');await page.keyboard.press('Tab');assert await page.evaluate('()=>!!document.activeElement.closest("#info-dialog")');await page.keyboard.press('Escape');await expect(page.locator('#info-dialog')).to_be_hidden();mark('Dialogo informazioni, focus confinato, Esc e ritorno al controllo')
    assert await page.locator('#tabs button').count()==9;assert await page.locator('[data-field="build"]').count()==3
    for tab in ['body','face','hair','expression','top','bottom','shoes','extras','pose']:
     await page.click('[data-tab="'+tab+'"]');assert await page.locator('#creator-panes button').count()>0
    mark('Tutte e nove le categorie del creatore sono attive')
    await page.click('[data-tab="body"]');assert await page.locator('.preset-grid button').count()==4
    await page.locator('.preset-grid button').nth(3).click();await page.click('[data-tab="top"]');await expect(page.locator('[data-field="top"][data-value="cappotto"]')).to_be_enabled();await page.click('[data-tab="body"]');await page.locator('.preset-grid button').first.click();await page.click('[data-tab="top"]');await expect(page.locator('[data-field="top"][data-value="cappotto"]')).to_be_disabled();mark('Quattro look modificabili e capi disattivati senza variante LPC compatibile')
    await page.click('[data-tab="hair"]');await page.click('[data-field="hair"][data-value="trecce"]');await page.click('[data-field="hair_color"][data-value="ramato"]')
    await page.click('[data-tab="top"]');await page.click('[data-field="top"][data-value="cyber_jacket"]');assert await page.locator('[data-field="inner_color"]').count()>0
    await page.click('[data-tab="extras"]');await page.click('[data-field="held"][data-value="cetra"]');await page.click('[data-tab="pose"]');await expect(page.locator('[data-field="pose"][data-value="libro"]')).to_have_attribute('aria-pressed','true')
    await page.click('[data-field="pose"][data-value="aperta"]');await page.click('[data-tab="extras"]');await expect(page.locator('[data-field="held"][data-value="none"]')).to_have_attribute('aria-pressed','true');mark('Personalizzazione e compatibilità oggetti / pose / strati della giacca')
    await page.click('[data-tab="hair"]');await shot(page,'02_file_unico_creatore_pc.jpg');await page.click('[data-step="2"]');await expect(page.locator('#nickname')).to_have_value('Èlisa');await page.click('#next');await page.click('[data-tab="hair"]');await expect(page.locator('[data-field="hair"][data-value="trecce"]')).to_have_attribute('aria-pressed','true');mark('Indietro conserva nome, acconciatura e abbigliamento')
    await page.click('#next')
    for kind in ['gatto','cane','volpe','gufo','coniglio','corvo','tartaruga','drago']:
     await page.click('[data-animal="'+kind+'"]');await expect(page.locator('#live-animal')).to_be_visible();assert await page.locator('[data-comp-field="pose"]').count()==2
     await page.locator('[data-comp-field="variant"]').last.click();await page.locator('[data-comp-field="pose"]').last.click()
    await page.click('[data-animal="none"]');await expect(page.locator('#live-animal')).to_be_hidden();await page.click('[data-animal="coniglio"]');mark('Otto companion, mantelli, due pose ciascuno e opzione nessuno')
    await page.click('#next');await expect(page.locator('#export')).to_be_enabled(timeout=60000);assert await page.locator('#final-preview').evaluate('(e)=>e.naturalWidth')==1200
    await shot(page,'03_file_unico_anteprima_foto.jpg');mark('Anteprima fotografica reale 1200 × 800')
    await page.click('#export');await page.wait_for_selector('#result:not([hidden])',timeout=90000);path=td/'ui-photo.png';filename=await download(page,'#save',path);v=verify(path);mark('PNG HD scaricato davvero dal pulsante desktop',filename=filename,**v)
    credits=td/'crediti.txt';await download(page,'#save-credits',credits);assert 'Norbert Nagel' in credits.read_text() and 'CC BY-SA 3.0' in credits.read_text();assert await page.locator('#open-image').get_attribute('href')==await page.locator('#save').get_attribute('href');mark('Crediti TXT e collegamento al medesimo PNG per il fallback immagine')
    await page.click('#reset');await expect(page.locator('#welcome')).to_be_visible();assert not await page.locator('#save').get_attribute('href');assert not await page.locator('#save-image').get_attribute('src');await page.click('#start');await page.click('[data-mode="photo"]');await page.click('[data-scene="casardi"]');await expect(page.locator('#nickname')).to_have_value('');await page.click('#next');await page.click('#next');await page.click('#next');await expect(page.locator('#export')).to_be_enabled(timeout=60000);mark('Reset ripulisce nickname, scelte e URL del PNG in memoria')
    await page.evaluate('()=>{document.querySelector("#export").click();document.querySelector("#prev").click();}')
    await expect(page.locator('[data-pane="5"]')).to_be_visible();await expect(page.locator('#toast')).to_contain_text('Attendi');await page.click('#reset');await page.wait_for_timeout(450);await expect(page.locator('#result')).to_be_hidden();mark('Navigazione bloccata durante export e reset annulla il lavoro senza riapparizione')
    await page.click('#start');await page.click('[data-mode="nes"]');await page.click('[data-scene="casardi"]');await page.click('#next');await page.click('#next');await page.click('#next');await expect(page.locator('#export')).to_be_enabled()
    await page.evaluate('()=>{window.__toBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(cb){setTimeout(()=>cb(null),0);};}')
    await page.click('#export');await expect(page.locator('#toast')).to_have_class('toast error');await expect(page.locator('#export')).to_be_enabled();await page.evaluate('()=>{HTMLCanvasElement.prototype.toBlob=window.__toBlob;delete window.__toBlob;}');await page.click('#export');await page.wait_for_selector('#result:not([hidden])');mark('Errore PNG simulato, messaggio italiano e recupero con nuovo tentativo')
    for width,height in [(320,740),(375,812),(390,844),(768,1024),(1366,768)]:
     await page.set_viewport_size({'width':width,'height':height});sizes=await page.evaluate('()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth})');assert sizes['scroll']<=sizes['inner'],sizes
    await page.set_viewport_size({'width':1440,'height':1000});mark('Nessun overflow orizzontale a 320, 375, 390, 768 e 1366 px')
    jobs=json.loads((ROOT/'renders/_jobs.json').read_text())
    for name,item in jobs.items():
     j=item['job'];st=time.perf_counter()
     info=await page.evaluate('''async job=>{const c=await CasardiRender.compose(job,3000);const blob=await CasardiRender.pngBlob(c,job);const old=document.querySelector('#qa-download');if(old){URL.revokeObjectURL(old.href);old.remove();}const a=document.createElement('a');a.id='qa-download';a.style.cssText='position:fixed;top:8px;left:8px;z-index:9999;padding:15px;background:white;color:black';a.textContent='Download prova';a.href=URL.createObjectURL(blob);a.download='prova.png';document.body.append(a);return{width:c.width,height:c.height};}''',j)
     file=td/(name+'.png');await download(page,'#qa-download',file);v=verify(file);assert info=={'width':3000,'height':2000}
     with Image.open(file) as im:
      small=im.convert('RGB').resize((600,400),Image.Resampling.LANCZOS);contact.append((name,small))
      if j['mode']=='nes':
       uri=await page.evaluate('async job=>(await CasardiRender.compose(job,600)).toDataURL()',j)
       native=Image.open(io.BytesIO(base64.b64decode(uri.split(',')[1]))).convert('RGBA');assert np.array_equal(np.asarray(im),np.asarray(native.resize((3000,2000),Image.Resampling.NEAREST)))
     exports.append(dict(scene=j['scene'],mode=j['mode'],result='PASS',seconds=round(time.perf_counter()-st,2),**v))
    await page.evaluate('()=>{const a=document.querySelector("#qa-download");URL.revokeObjectURL(a.href);a.remove();}')
    mark('Tutte le 12 combinazioni stile / luogo esportate dal renderer browser',exports=len(exports))
    mark('Sei scene NES: PNG HD identici pixel per pixel alla griglia 600 × 400 ingrandita ×5')
    assert not network;mark('Zero richieste HTTP/S durante l’intera sessione file:// offline')
    await ctx.close()
    # A genuinely separate touch-enabled browser context, still not hardware.
    mobile=await browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,accept_downloads=True,offline=True)
    phone=await mobile.new_page();observe(phone);await phone.goto(HTML.as_uri());await expect(phone.locator('#start')).to_be_enabled();await phone.tap('#start');await phone.tap('[data-mode="nes"]');await phone.tap('[data-scene="epidauro"]');await phone.fill('#nickname','Nicolò');await phone.tap('#next');await phone.tap('[data-tab="hair"]');await phone.tap('[data-field="hair"][data-value="trecce"]')
    await shot(phone,'04_telefono_creatore_touch.jpg');await phone.tap('#next');await phone.tap('[data-animal="drago"]');await phone.locator('[data-comp-field="pose"]').last.tap();await phone.tap('#next');await expect(phone.locator('#export')).to_be_enabled();await shot(phone,'05_telefono_anteprima_nes.jpg');await phone.tap('#export');await phone.wait_for_selector('#result:not([hidden])');await phone.wait_for_timeout(450);path=td/'phone-nes.png';await download(phone,'#save',path);v=verify(path);await shot(phone,'06_telefono_salvataggio.jpg');mark('Flusso completo touch emulato: nome, capelli, drago e PNG sul telefono',viewport=[390,844],**v)
    await phone.set_viewport_size({'width':844,'height':390});assert await phone.evaluate('()=>document.documentElement.scrollWidth<=innerWidth');await phone.tap('#reset');await expect(phone.locator('#welcome')).to_be_visible();mark('Orientamento landscape e nuova cartolina nel contesto touch')
    await mobile.close()
    # The HTTP route solves local-file-preview restrictions on mobile OSes.
    served=await browser.new_context(viewport={'width':375,'height':812},is_mobile=True,has_touch=True,accept_downloads=True)
    webphone=await served.new_page();observe(webphone);before=len(network)
    response=await webphone.goto('http://127.0.0.1:8083/telefono');assert response.status==200
    assert 'no-store' in response.headers['cache-control'] and 'set-cookie' not in response.headers
    await expect(webphone.locator('#start')).to_be_enabled();await served.set_offline(True)
    await webphone.tap('#start');await webphone.tap('[data-mode="photo"]');await webphone.tap('[data-scene="biblioteca"]');await webphone.tap('#next');await webphone.tap('#next');await webphone.tap('[data-animal="gufo"]');await webphone.tap('#next');await expect(webphone.locator('#export')).to_be_enabled(timeout=60000);await webphone.tap('#export');await webphone.wait_for_selector('#result:not([hidden])',timeout=90000);path=td/'http-phone.png';await download(webphone,'#save',path);v=verify(path)
    assert len(network)==before+1,network[before:];mark('Versione /telefono completa: caricata via HTTP, poi offline fino al PNG',http_requests_after_initial_html=0,**v)
    await served.close()
    assert not errors,errors
    mark('Nessuna eccezione JavaScript o violazione CSP in tutti i contesti')
    # Compact evidence, no extra multi-megabyte HD copies in the package.
    sheet=Image.new('RGB',(1800,1720),'#f5f1e9');d=ImageDraw.Draw(sheet);font=ImageFont.truetype(str(ROOT/'assets/fonts/EBGaramond.ttf'),20)
    for i,(name,im) in enumerate(contact):
     x=i%3*600;y=i//3*430;sheet.paste(im,(x,y));d.text((x+12,y+403),name,font=font,fill='#172b35')
    sheet.save(ROOT/'docs/qa/07_browser_12_cartoline.jpg',quality=85,optimize=True)
  except Exception:
   tests.append(dict(name='Interrupted verification',result='FAIL',error=traceback.format_exc()))
   raise
  finally:
   await browser.close()
   report=dict(date='2026-11-27',browser='Chromium via Playwright',html_sha256=hashlib.sha256(HTML.read_bytes()).hexdigest(),seconds=round(time.perf_counter()-started,2),tests=tests,exports=exports,js_errors=errors,http_requests=[{'method':m,'url':u} for m,u in network],physical_phone='NOT TESTED',safari_firefox='NOT TESTED',school_wifi='NOT TESTED',note='Touch and mobile viewport are emulated, not a physical device. All filenames/names used are synthetic.')
   OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 if not all(t['result']=='PASS' for t in tests):raise RuntimeError('Failed tests')
 print('DONE',len(tests),'tests;',len(exports),'HD combinations;',round(time.perf_counter()-started,2),'seconds')

if __name__=='__main__':asyncio.run(main())
