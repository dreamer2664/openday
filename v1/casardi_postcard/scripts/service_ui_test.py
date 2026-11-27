"""Real Chromium/HTTP PNG handoff through the Go service (same Windows source).

Two independent browser contexts on Linux/loopback; NEVER a physical-phone or
native-Windows claim. QR codes independently decoded with zxing-cpp. Any test
PNG/token is revoked before exit. No active token is written into the report.
"""
from __future__ import annotations
import asyncio
import base64
import hashlib
import io
import json
import os
import re
from pathlib import Path
import tempfile
import time
from urllib.parse import urlsplit
from PIL import Image
import zxingcpp
from playwright.async_api import async_playwright,expect

ROOT=Path(__file__).resolve().parent.parent
BASE=os.environ.get('SERVICE_BASE_URL','http://127.0.0.1:8083').rstrip('/')
SHOTS=ROOT/'docs/screenshots-service'
OUT=ROOT/'docs/test-results/go-service-browser.json'

async def main():
 start=time.perf_counter();results=[];errors=[];external=[];SHOTS.mkdir(exist_ok=True)
 def mark(name,**detail):results.append(dict(name=name,result='PASS',**detail));print('PASS',name,flush=True)
 async def shot(page,name,full=False):
  await page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await page.screenshot(path=str(SHOTS/name),type='jpeg',quality=85,animations='disabled',full_page=full,scale='css')
 def observe(page):
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:external.append(urlsplit(r.url).netloc) if r.url.startswith(('http:','https:')) and urlsplit(r.url).netloc!=urlsplit(BASE).netloc else None)
 async def create(page,mode='nes',scene='casardi'):
  await page.click('#start');await page.click('[data-mode="'+mode+'"]');await page.click('[data-scene="'+scene+'"]');await page.fill('#nickname','Martina');await page.click('#next')
  await page.locator('.preset-grid button').nth(2).click();await page.click('[data-tab="hair"]');await page.click('[data-field="hair"][data-value="longhawk"]');await page.click('#next');await page.click('[data-animal="gatto"]');await page.click('#next');await expect(page.locator('#export')).to_be_enabled(timeout=60000)
  await page.click('[data-add-sticker=alloro]');section=page.locator('.editor-section').nth(2)
  if not await section.evaluate('(e)=>e.open'):await section.locator('summary').click()
  await page.select_option('[data-plaque=ornament]','logo_casardi');await page.select_option('[data-plaque=track]','classico');await expect(page.locator('#export')).to_be_enabled(timeout=60000)
 async def export(page):
  async with page.expect_response(lambda r:r.url.endswith('/bridge/export') and r.request.method=='POST') as event:await page.click('#export')
  response=await event.value;assert response.status==201,await response.text();d=await response.json();await expect(page.locator('#transfer-qr')).to_be_visible();return d
 def decode(data):
  im=Image.open(io.BytesIO(base64.b64decode(data.split(',')[1]))).convert('RGB');code=zxingcpp.read_barcode(im);assert code;return code.text
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=['--no-sandbox'])
  try:
   with tempfile.TemporaryDirectory() as td:
    td=Path(td);pc=await browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True);page=await pc.new_page();observe(page)
    response=await page.goto(BASE+'/');assert response.status==200 and 'no-store' in response.headers['cache-control'];await expect(page.locator('#start')).to_be_enabled();await expect(page.locator('.offline-badge')).to_contain_text('QR del PNG');assert not await page.locator('#local-service-config').count();await shot(page,'01_stand_benvenuto.jpg');mark('Avvio HTTP completo, configurazione riservata rimossa dal DOM e modalità QR attiva')
    await create(page);await shot(page,'02_stand_anteprima_pixel.jpg');d=await export(page);url=decode(await page.locator('#transfer-qr').get_attribute('src'));assert url==d['transfer']['url'] and '/download/' in url;assert not url.endswith('/telefono');await expect(page.locator('#transfer-time')).to_contain_text('Scade tra');await shot(page,'03_qr_png_pronto.jpg',True);mark('QR finale reale decodificato indipendentemente: contiene il download del PNG, non il creatore',ttl=d['ttl_seconds'])
    async with page.expect_download() as event:await page.click('#save')
    dl=await event.value;await dl.save_as(str(td/'pc.png'));raw=(td/'pc.png').read_bytes()
    with Image.open(io.BytesIO(raw)) as im:
     im.verify()
    with Image.open(io.BytesIO(raw)) as im:
     assert im.size==(3000,2000) and 'PERSONAGGIO MODULARE LPC' in im.info['Description'] and 'CC BY-SA 4.0' in im.info['Copyright'] and 'POF-26-27' in im.info['Description'] and 'DECORAZIONI FACOLTATIVE' in im.info['Description']
    mark('PNG decorato del PC, 3000×2000 e crediti LPC/foto/logo incorporati',bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest())
    phone_ctx=await browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,accept_downloads=True);phone=await phone_ctx.new_page();observe(phone)
    response=await phone.goto(url);assert response.status==200;await expect(phone.locator('img')).to_be_visible();await shot(phone,'04_telefono_download_png.jpg',True)
    async with phone.expect_download() as event:await phone.locator('a[download]').tap()
    phone_dl=await event.value;await phone_dl.save_as(str(td/'phone.png'));assert (td/'phone.png').read_bytes()==raw;assert phone_dl.suggested_filename=='Cartolina_Casardi.png';assert await phone.evaluate('()=>document.documentElement.scrollWidth<=innerWidth');mark('Secondo contesto touch: pagina aperta dall’URL QR e PNG scaricato byte per byte identico al PC',physical_phone=False)
    await page.click('#info');await expect(page.locator('#service-controls')).to_be_visible();creator=decode(await page.locator('#creator-qr').get_attribute('src'));assert creator.endswith('/telefono') and creator!=url;await shot(page,'05_rete_e_qr_creatore_distinto.jpg',True);await page.click('#close-info')
    creator_page=await phone_ctx.new_page();observe(creator_page);response=await creator_page.goto(creator);await expect(creator_page.locator('#start')).to_be_enabled();assert await creator_page.locator('#service-controls').is_hidden();assert (await phone_ctx.request.get(url+'/file')).status==200;mark('QR del creatore distinto e sua apertura non azzera né rivela la sessione PC')
    assert not await pc.cookies();assert await page.evaluate('()=>localStorage.length===0&&sessionStorage.length===0');mark('Nessun cookie, progetto persistente o storage del visitatore nel browser')
    # Changing an option revokes the exported PNG before the next export.
    await page.click('#edit');await page.click('[data-tab="top"]')
    async with page.expect_response(lambda r:r.url.endswith('/bridge/reset') and r.request.method=='POST') as event:await page.click('[data-field="top"][data-value="cyber_jacket"]')
    assert (await event.value).status==200;assert (await phone_ctx.request.get(url+'/file')).status==410;assert not await page.locator('#transfer-qr').get_attribute('src');mark('Modifica del personaggio: vecchio QR revocato subito e immagine del QR rimossa')
    await page.click('[data-step="5"]');await expect(page.locator('#export')).to_be_enabled();d2=await export(page);url2=decode(d2['transfer']['qr']);assert url2!=url;mark('Nuova esportazione: token diverso, precedente non riutilizzabile')
    # UI clock only: real server expiry is tested by service_expiry_test.py.
    await page.clock.install();await page.clock.fast_forward(601000);await expect(page.locator('#transfer-code')).to_be_hidden();await expect(page.locator('#transfer-status')).to_contain_text('QR scaduto');await expect(page.locator('#save')).to_have_attribute('href',re.compile(r'blob:.*'));mark('Scadenza dell’interfaccia nasconde il QR ma conserva il salvataggio sul PC',clock='Only browser clock advanced; backend real 300s test is separate')
    async with page.expect_response(lambda r:r.url.endswith('/bridge/export') and r.request.method=='POST') as event:await page.click('#transfer-retry')
    retry=await (await event.value).json();url3=decode(retry['transfer']['qr']);assert url3!=url2;await expect(page.locator('#transfer-code')).to_be_visible();mark('Rigenera QR riutilizza il PNG reale senza ricomporre la cartolina')
    async with page.expect_response(lambda r:r.url.endswith('/bridge/reset') and r.request.method=='POST') as event:await page.click('#new')
    assert (await event.value).status==200;await expect(page.locator('#welcome')).to_be_visible();assert (await phone_ctx.request.get(url3+'/file')).status==410;assert not await page.locator('#save').get_attribute('href');assert not await page.locator('#transfer-link').get_attribute('href');assert await page.locator('#nickname').input_value()=='';mark('Nuovo visitatore elimina token, PNG temporaneo, nome e scelte; link precedente HTTP 410')
    await phone.goto(url3);assert 'non è più valido' in await phone.locator('h1').inner_text();await shot(phone,'06_telefono_link_revocato.jpg',True);mark('Telefono: pagina italiana di collegamento revocato o scaduto')
    # A disconnected local bridge must not cost the user their original PNG.
    await create(page,'photo','casardi')
    await page.route('**/bridge/export',lambda route:route.abort('failed'));await page.click('#export');await expect(page.locator('#transfer-status')).to_contain_text('non risponde',timeout=90000);await expect(page.locator('#save')).to_have_attribute('href',re.compile(r'blob:.*'));await expect(page.locator('#transfer-code')).to_be_hidden();await shot(page,'07_errore_rete_con_salvataggio_pc.jpg',True);mark('Errore di rete simulato: QR non fittizio, messaggio chiaro e PNG sul PC ancora salvabile')
    await page.unroute('**/bridge/export');await page.click('#reset');await page.wait_for_timeout(250)
    # The full phone creator can finish after its initial HTTP request offline.
    await creator_page.context.set_offline(True);await creator_page.click('#start');await creator_page.click('[data-mode="nes"]');await creator_page.click('[data-scene="pantheon"]');await creator_page.click('#next');await creator_page.click('#next');await creator_page.click('#next');await expect(creator_page.locator('#export')).to_be_enabled();await creator_page.click('#export');await expect(creator_page.locator('#result')).to_be_visible();await expect(creator_page.locator('#transfer-local-only')).to_be_visible();mark('Creatore telefono completo e autonomo anche offline dopo il caricamento iniziale')
    await phone_ctx.set_offline(False);await page.click('#welcome-info');await page.click('#close-info');await expect(page.locator('#welcome')).to_be_visible()
    assert not errors,errors;assert not external,external;mark('Zero eccezioni JavaScript e nessuna richiesta a host esterni')
    await phone_ctx.close();await pc.close()
   report=dict(result='PASS',date='2026-11-27',seconds=round(time.perf_counter()-start,2),tests=results,html_sha256=hashlib.sha256((ROOT/'Cartolina_Casardi_PC_e_Telefono.html').read_bytes()).hexdigest(),
               environment='Linux Go build, Chromium desktop and separate emulated touch browser; QA-only loopback LAN address',physical_second_device='NOT TESTED — must be checked on school Wi-Fi',windows_native='NOT TESTED — PE x64 cross-compiled, business logic tested on Linux',javascript_errors=errors,external_hosts=external)
   OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('PASS',len(results),'service/browser checks',flush=True)
  finally:
   try:
    if not page.is_closed():
     await page.unroute_all(behavior='ignoreErrors');await page.evaluate('()=>CasardiBridge.clear(true)')
   except Exception:pass
   await browser.close()

if __name__=='__main__':asyncio.run(main())
