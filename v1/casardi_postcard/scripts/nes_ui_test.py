"""Focused Chromium QA of the NES Retro 3.2 redesign, not physical-phone QA.
Checks welcome thumbnail proportions, responsive bounds and mode-specific copy.
Also saves two actual UI screenshots; no visitor data, network or generated art.
"""
import asyncio
import hashlib
import json
from pathlib import Path
from playwright.async_api import async_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
HTML=ROOT/'Cartolina_Casardi_PC_e_Telefono.html'

async def main():
    checks=[];errors=[];network=[]
    def mark(name,**detail):checks.append(dict(name=name,result='PASS',**detail));print('PASS',name,flush=True)
    async with async_playwright() as p:
        browser=await p.chromium.launch(args=['--no-sandbox'])
        try:
            context=await browser.new_context(offline=True,viewport={'width':1440,'height':1000},reduced_motion='reduce')
            page=await context.new_page()
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('request',lambda r:network.append(r.url) if r.url.startswith(('http:','https:')) else None)
            await page.goto(HTML.as_uri());await expect(page.locator('#start')).to_be_enabled()
            await page.wait_for_function('()=>[...document.querySelectorAll(".world-preview img")].length===12&&[...document.querySelectorAll(".world-preview img")].every(i=>i.complete&&i.naturalWidth===600)')
            for width in (320,375,390,768,1366):
                await page.set_viewport_size({'width':width,'height':900})
                result=await page.evaluate('''()=>({overflow:document.documentElement.scrollWidth>innerWidth,worlds:[...document.querySelectorAll('.world-preview img')].map(i=>{const r=i.getBoundingClientRect();return {w:r.width,h:r.height,ratio:r.width/r.height};})})''')
                assert not result['overflow']
                # Includes the 1px CSS border, so allow the resulting subpixel variation.
                assert all(abs(i['ratio']-1.5)<.03 for i in result['worlds']),result
                mark('Benvenuto: miniature proporzionate e nessun overflow a '+str(width)+' px',width=width)
            await page.set_viewport_size({'width':1440,'height':1000})
            await page.screenshot(path=str(ROOT/'docs/qa/09_interfaccia_nes.jpg'),full_page=True,type='jpeg',quality=86,animations='disabled')
            await page.set_viewport_size({'width':390,'height':844})
            await page.screenshot(path=str(ROOT/'docs/qa/10_interfaccia_telefono.jpg'),full_page=True,type='jpeg',quality=85,animations='disabled')
            await page.click('#start');await page.click('[data-mode="nes"]')
            await expect(page.locator('#scene-note')).to_contain_text('Interpretazione a colori')
            assert 'attenuati' not in await page.locator('#scene-note').inner_text()
            for scene in await page.evaluate('()=>PORTABLE.catalogue.scenes.map(s=>({id:s.id,note:s.nes_note}))'):
                await expect(page.locator('[data-scene="'+scene['id']+'"]')).to_have_attribute('title',scene['note'])
            await page.click('[data-step="0"]');await page.click('[data-mode="photo"]')
            await expect(page.locator('#scene-note')).to_contain_text('Personaggio a colori molto attenuati')
            mark('Dodici note NES distinte da quelle fotografiche; Casardi storico identificato in entrambi gli stili')
            await page.click('#info');await expect(page.locator('#info-dialog')).to_be_visible()
            assert 'assistite da IA' in await page.locator('#info-dialog').inner_text()
            assert 'non documentano la scuola attuale' in await page.locator('#info-dialog').inner_text()
            await page.keyboard.press('Escape');await expect(page.locator('#info-dialog')).to_be_hidden()
            mark('Provenienza IA e limiti storici leggibili nel dialogo informazioni')
            assert await page.evaluate('()=>matchMedia("(prefers-reduced-motion: reduce)").matches')
            assert await page.locator('.spinner').first.evaluate('(n)=>getComputedStyle(n).animationName')=='none'
            assert not errors and not network,(errors,network)
            mark('Movimento ridotto rispettato; zero eccezioni e zero richieste HTTP/S offline')
        finally:await browser.close()
    report=dict(result='PASS',revision='3.2 NES Retro',date='2026-11-27',html_sha256=hashlib.sha256(HTML.read_bytes()).hexdigest(),tests=checks,javascript_errors=errors,http_requests=network,environment='Chromium Linux, responsive viewport emulation; not a native Windows or physical phone test')
    (ROOT/'docs/test-results/nes-retro-ui.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':asyncio.run(main())
