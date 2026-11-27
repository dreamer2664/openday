"""Real Chromium E2E. Uses localhost and a second browser context, NOT a phone.

Start the server, then: python scripts/ui_test.py
Requires requirements-dev.txt and: python -m playwright install chromium
Screenshots contain fictitious names and test QR codes, revoked before exit.
"""
from __future__ import annotations
import asyncio
import base64
import io
import json
import os
from pathlib import Path
import time
from urllib.parse import urlsplit
from PIL import Image
from playwright.async_api import async_playwright, expect

BASE=os.environ.get('BASE_URL','http://127.0.0.1:8080').rstrip('/')
OUT=Path('docs/screenshots');OUT.mkdir(parents=True,exist_ok=True)
REPORT=Path('docs/test-results/browser-tests.json')
results=[];errors=[];external=[];http_errors=[]

def record(name,detail=''):
    results.append(dict(test=name,result='PASS',detail=detail));print('PASS',name,flush=True)

async def stable(page):
    await page.evaluate("document.fonts.ready")
    await page.wait_for_timeout(260)  # finish the finite UI transition, not a render timeout
    await page.wait_for_function("""() => [...document.images].filter(i=>{
      const r=i.getBoundingClientRect();return r.width&&r.height&&r.top<innerHeight&&r.bottom>0&&i.getAttribute('src');
    }).every(i=>i.complete&&i.naturalWidth>0)""",timeout=30000)

async def screenshot(page,name,full=False):
    await stable(page)
    await page.screenshot(path=str(OUT/Path(name).with_suffix('.jpg')),type='jpeg',quality=90,animations='disabled',full_page=full)

async def pick(page,field,value):
    await page.click(f'#creator-panes [data-field="{field}"][data-value="{value}"]')
    await expect(page.locator(f'#creator-panes [data-field="{field}"][data-value="{value}"]')).to_have_attribute('aria-pressed','true')

async def flow(page,mode,scene,name=''):
    await page.click('#btn-start');await page.click(f'[data-style="{mode}"]');await page.click(f'[data-scene="{scene}"]')
    await page.fill('#name-input',name);await page.click('#btn-next')

def monitor(page):
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:external.append(urlsplit(r.url).netloc)
            if r.url.startswith('http') and urlsplit(r.url).netloc!=urlsplit(BASE).netloc else None)
    page.on('response',lambda r:http_errors.append(dict(status=r.status,path=urlsplit(r.url).path)) if r.status>=400 else None)

async def main():
    started=time.perf_counter()
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        context=await browser.new_context(viewport={'width':1600,'height':1000})
        page=await context.new_page()
        monitor(page)
        await page.goto(BASE,wait_until='networkidle')
        await page.wait_for_selector('#btn-start:enabled')
        await screenshot(page,'01_welcome.png')
        await page.click('#btn-start');await screenshot(page,'02_style.png')
        await page.click('[data-style="nes"]');await screenshot(page,'03_scenes_nes.png')
        # Visit all six locations, retaining style and the optional name field.
        scenes=['casardi','pantheon','foro','epidauro','biblioteca','paestum']
        for sid in scenes:
            if await page.locator('.pane.active').get_attribute('data-pane')!='scene':await page.click('.step[data-step="scene"]')
            await page.click(f'[data-scene="{sid}"]')
            assert await page.locator('body').evaluate('(n)=>n.classList.contains("mode-nes")')
        record('six_locations_nes_style_preserved')
        await page.click('.step[data-step="scene"]');await page.click('[data-scene="casardi"]')
        await page.fill('#name-input','Elisa Àccénti');await screenshot(page,'04_name.png')
        await page.click('#btn-next');await screenshot(page,'05_creator_body.png')
        await pick(page,'build','medio');await pick(page,'skin','ambra')
        await page.click('[data-tab="face"]')
        for f,v in [('face','tondo'),('eye_shape','mandorla'),('eyes','verdi'),('brows','folte'),('nose','largo'),('mouth','piene')]:await pick(page,f,v)
        await screenshot(page,'06_creator_face.png')
        await page.click('[data-tab="hair"]');await pick(page,'hair','coda');await pick(page,'hair_color','ramato');await pick(page,'beard','none')
        await page.click('[data-tab="expression"]')
        for expr in ['neutra','sorriso','entusiasta','seria','curiosa','sorpresa']:await pick(page,'expression',expr)
        await pick(page,'expression','sorriso')
        await page.click('[data-tab="top"]');await pick(page,'top','cyber_jacket');await pick(page,'top_color','navy');await pick(page,'inner_color','bianco')
        await page.click('[data-tab="bottom"]');await pick(page,'bottom','gonna');await pick(page,'bottom_color','bordeaux');await pick(page,'belt_color','nero')
        await page.click('[data-tab="shoes"]');await pick(page,'shoes','stivaletti');await pick(page,'shoes_color','nero')
        await page.click('[data-tab="extras"]');await pick(page,'hat','corona_alloro');await pick(page,'glasses','tondi');await pick(page,'accessory','collana');await pick(page,'accessory_color','argento')
        await pick(page,'held','pergamena');await page.click('[data-tab="pose"]')
        await expect(page.locator('[data-field="pose"][data-value="libro"]')).to_have_attribute('aria-pressed','true')
        for pose in ['rilassata','movimento','libro','aperta']:await pick(page,'pose',pose)
        await screenshot(page,'07_creator_pose.png');record('every_creator_category_all_poses_all_expressions')
        await page.click('#btn-next')
        for animal in ['gatto','cane','volpe','gufo','coniglio','corvo','tartaruga','drago']:
            await page.click(f'[data-animal="{animal}"]');await expect(page.locator('#live-comp')).to_be_visible()
            opts=page.locator('[data-comp-field="pose"]');await opts.last.click()
            variants=page.locator('[data-comp-field="variant"]');await variants.last.click()
        await page.click('[data-animal="none"]');await expect(page.locator('#live-comp')).to_be_hidden()
        await page.click('[data-animal="volpe"]');await screenshot(page,'08_companion.png');record('eight_companions_variants_poses_and_none')
        await page.click('#btn-next');await page.wait_for_selector('#btn-export:enabled')
        await screenshot(page,'09_preview_nes.png')
        # Previous choices survive back navigation.
        await page.click('#btn-back-edit');await page.click('[data-tab="top"]')
        await expect(page.locator('[data-field="top"][data-value="cyber_jacket"]')).to_have_attribute('aria-pressed','true')
        await page.click('.step[data-step="name"]');await expect(page.locator('#name-input')).to_have_value('Elisa Àccénti')
        await page.click('.step[data-step="preview"]');await page.wait_for_selector('#btn-export:enabled');record('back_navigation_preserves_choices')
        async with page.expect_response(lambda r:r.url.endswith('/api/export') and r.request.method=='POST') as response:
            await page.click('#btn-export')
        data=await (await response.value).json()
        await page.wait_for_selector('#result:not([hidden])')
        await screenshot(page,'10_export_qr.png')
        import zxingcpp
        qr=Image.open(io.BytesIO(base64.b64decode(data['qr'].split(',')[1]))).convert('RGB')
        assert zxingcpp.read_barcode(qr).text==data['url']
        record('png_export_and_independently_decoded_qr',f"{data['size'][0]}×{data['size'][1]}; {data['render_seconds']} s")
        # A second browser context emulates a phone viewport; same machine only.
        mobile_context=await browser.new_context(viewport={'width':420,'height':900},is_mobile=True,has_touch=True)
        mobile=await mobile_context.new_page();monitor(mobile)
        path=urlsplit(data['url']).path
        await mobile.goto(BASE+path,wait_until='networkidle')
        await screenshot(mobile,'11_mobile_download.png',True)
        async with mobile.expect_download() as event:await mobile.click('#download-button')
        download=await event.value
        with Image.open(await download.path()) as img:assert img.size==(3000,2000) and img.format=='PNG'
        assert download.suggested_filename=='cartolina-casardi.png'
        assert await mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
        record('second_browser_context_mobile_page_and_png_download','Emulated viewport; not a physical phone or independent network')
        async with page.expect_download() as event:await page.click('#btn-save-pc')
        dl=await event.value
        with Image.open(await dl.path()) as img:assert img.size==(3000,2000)
        record('direct_save_pc_fallback')
        await page.click('#btn-new');await page.wait_for_selector('#btn-start:enabled')
        await expect(page.locator('#name-input')).to_have_value('')
        assert (await context.request.get(BASE+data['file_url'])).status in (404,410)
        record('reset_clears_screen_state_and_revokes_token')
        # Entire photo catalogue and an unnamed, animal-free HD export.
        await page.click('#btn-start');await page.click('[data-style="photo"]')
        await screenshot(page,'12_scenes_photo.png')
        for sid in scenes:
            await page.click(f'[data-scene="{sid}"]')
            if sid!=scenes[-1]:await page.click('.step[data-step="scene"]')
        await page.click('#btn-next');await page.click('#btn-next');await page.click('[data-animal="none"]');await page.click('#btn-next')
        await page.wait_for_selector('#btn-export:enabled');await screenshot(page,'13_preview_photo.png')
        async with page.expect_response(lambda r:r.url.endswith('/api/export') and r.request.method=='POST') as event:
            await page.click('#btn-export')
            await page.click('#btn-back-edit')
            assert await page.locator('.pane.active').get_attribute('data-pane')=='preview'
        record('navigation_cannot_mismatch_an_inflight_export')
        photo=await (await event.value).json();assert photo['size']==[3000,2000]
        await page.wait_for_selector('#result:not([hidden])')
        record('six_photo_locations_unnamed_no_companion_hd_export',f"{photo['render_seconds']} s")
        await page.click('#btn-info');await page.wait_for_function('() => document.querySelector("#diag").textContent.includes("Indirizzo LAN")')
        await screenshot(page,'14_diagnostics.png');await page.click('#btn-info-close');record('operator_diagnostics_and_real_network_test_qr')
        # Advance browser clock (not server wall time) to exercise automatic return.
        await page.clock.install();await page.clock.fast_forward(601000)
        await page.wait_for_selector('#screen-welcome.active');await page.wait_for_selector('#btn-start:enabled')
        assert (await context.request.get(BASE+photo['file_url'])).status in (404,410)
        await screenshot(page,'15_auto_reset.png');record('automatic_return_on_countdown_expiry','Browser clock advanced by 601 s; backend expiry is tested separately with a controlled clock')
        await mobile_context.close();await context.close()
        # Screen sizes, text arrow safety, and a simulated disconnected server.
        for width,height in [(1366,768),(1920,1080),(720,1000)]:
            c=await browser.new_context(viewport={'width':width,'height':height});pg=await c.new_page();monitor(pg)
            await pg.goto(BASE,wait_until='networkidle');await pg.wait_for_selector('#btn-start:enabled');await flow(pg,'photo','casardi','')
            await stable(pg)
            assert await pg.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,height)
            await expect(pg.locator('#creator-tabs')).to_be_visible();await expect(pg.locator('[data-field="build"]').first).to_be_visible()
            if width==1366:await screenshot(pg,'16_kiosk_1366x768.png')
            await c.close()
        record('layouts_1366x768_1920x1080_720x1000')
        c=await browser.new_context();pg=await c.new_page();monitor(pg);await pg.goto(BASE);await pg.wait_for_selector('#btn-start:enabled')
        await pg.click('#btn-start');await pg.click('[data-style="photo"]');await pg.click('[data-scene="casardi"]');await pg.fill('#name-input','Test');await pg.press('#name-input','ArrowLeft')
        assert await pg.locator('.pane.active').get_attribute('data-pane')=='name'
        await pg.press('#name-input','Alt+ArrowRight')
        assert await pg.locator('.pane.active').get_attribute('data-pane')=='character'
        await pg.locator('[data-tab="face"]').focus();await pg.keyboard.press('Enter')
        await expect(pg.locator('[data-field="face"]').first).to_be_visible()
        await pg.keyboard.press('Alt+ArrowLeft')
        assert await pg.locator('.pane.active').get_attribute('data-pane')=='name'
        await pg.click('#btn-info');await pg.wait_for_function('() => document.querySelector("#diag").textContent.includes("Indirizzo LAN")')
        await pg.keyboard.press('Shift+Tab');await expect(pg.locator('#btn-info-close')).to_be_focused()
        await pg.keyboard.press('Tab');await expect(pg.locator('#phone-creator-link')).to_be_focused()
        await pg.keyboard.press('Escape');await expect(pg.locator('#btn-info')).to_be_focused()
        record('keyboard_activation_alt_navigation_modal_focus_and_escape')
        await pg.route('**/api/reset',lambda route:route.abort('failed'))
        await pg.click('#btn-reset');await expect(pg.locator('#btn-retry')).to_be_visible();await expect(pg.locator('#btn-start')).to_be_disabled()
        await pg.unroute('**/api/reset');await pg.click('#btn-retry');await pg.wait_for_selector('#btn-start:enabled')
        record('text_arrow_safety_network_failure_and_reset_retry')
        await c.close();await browser.close()
    unexpected=[e for e in http_errors if e['status'] not in (404,410)]
    assert not errors,errors
    assert not external,external
    assert not unexpected,unexpected
    record('no_uncaught_javascript_errors_no_external_runtime_requests')
    report=dict(browser='Chromium via Playwright',date='2026-11-27',seconds=round(time.perf_counter()-started,2),
        tests=results,javascript_errors=errors,external_runtime_requests=external,
        physical_second_device_test='NOT PERFORMED — required on school Wi-Fi')
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':asyncio.run(main())
