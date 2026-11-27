"""Real Chromium appearance-level UI regression for the corrected creator.
File:// offline + an optional Python HTTP UI. Not Android hardware testing.
"""
import asyncio
import hashlib
import json
from pathlib import Path
import sys
import time
from playwright.async_api import async_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from app.character import default_spec
from app.control_effects import assess
from app.catalogue import CHOICES,COLOR_FIELDS


async def main():
    started=time.perf_counter();checks=[];errors=[];network=[];actions=0;blocked=0
    def mark(name,**info):checks.append(dict(name=name,result='PASS',**info));print('PASS',name,flush=True)
    async with async_playwright() as p:
        browser=await p.chromium.launch(args=['--no-sandbox'])
        try:
            ctx=await browser.new_context(offline=True,viewport={'width':1440,'height':1000},reduced_motion='reduce')
            page=await ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('request',lambda r:network.append(r.url) if r.url.startswith(('http:','https:')) else None)
            await page.goto((ROOT/'Cartolina_Casardi_PC_e_Telefono.html').as_uri());await expect(page.locator('#start')).to_be_enabled()
            await page.click('#start');await page.click('[data-mode="nes"]');assert await page.locator('#scene-grid [data-scene]').count()==12
            await page.click('[data-scene="castellobarletta"]');await page.click('#next')
            await page.locator('.preset-grid button').nth(2).click();await page.click('[data-tab="face"]')
            await expect(page.locator('[data-field="eye_shape"][data-value="mandorla"]')).to_be_disabled()
            await expect(page.locator('[data-reveal-field="eye_shape"]')).to_be_visible()
            await page.click('[data-reveal-field="eye_shape"]');await expect(page.locator('[data-field="eye_shape"][data-value="mandorla"]')).to_be_enabled()
            before=await page.locator('#live-character').get_attribute('src');await page.click('[data-field="eye_shape"][data-value="mandorla"]')
            assert before!=await page.locator('#live-character').get_attribute('src')
            assert await page.locator('#face-detail-image').evaluate('(i)=>i.complete&&i.naturalWidth===28&&getComputedStyle(i).imageRendering==="pixelated"')
            mark('Visore: forma occhi realmente bloccata, azione esplicita di scopertura e zoom dei pixel effettivi')
            await page.click('[data-tab="body"]');await page.locator('.preset-grid button').first.click()
            category_actions={}
            for tab in ('body','face','hair','expression','top','bottom','shoes','extras','pose'):
                before_actions=actions
                await page.click('[data-tab="'+tab+'"]')
                fields=await page.locator('#creator-panes [data-control-field]').evaluate_all('(g)=>g.map(n=>n.dataset.controlField)')
                for field in fields:
                    values=await page.locator('#creator-panes [data-field="'+field+'"]').evaluate_all('(b)=>b.map(n=>n.dataset.value)')
                    for value in values:
                        b=page.locator('#creator-panes [data-field="'+field+'"][data-value="'+value+'"]')
                        if not await b.count():continue
                        n=await b.get_attribute('data-pixel-change');selected=await b.get_attribute('aria-pressed')=='true'
                        if await b.is_disabled():assert n in ('0','incompatible'),(field,value,n);blocked+=1;continue
                        if selected:continue
                        assert int(n)>0,(field,value,n)
                        before=await page.locator('#live-character').get_attribute('src');await b.click()
                        assert before!=await page.locator('#live-character').get_attribute('src'),(field,value,n)
                        await expect(page.locator('#creator-panes [data-field="'+field+'"][data-value="'+value+'"]')).to_have_attribute('aria-pressed','true');actions+=1
                category_actions[tab]=actions-before_actions
            assert len(category_actions)==9 and all(n>0 for n in category_actions.values()),category_actions
            mark('Nove categorie: ogni alternativa abilitata provata cambia davvero il PNG dello sprite',actual_clicks=actions,per_category=category_actions,covered_or_incompatible_alternatives_checked=blocked)
            # Exact Python/JavaScript counts, including unsupported and covered states.
            comparisons=0
            for extra in ({},{'hat':'cappuccio'},{'expression':'sorriso'},{'glasses':'visore'},{'build':'medio','top':'cappotto'}):
                spec={**default_spec(),**extra};fields=['hair','hair_color','eye_shape','eyes','brows','mouth','bottom','bottom_color','belt_color','pose']
                expected=assess(spec,fields)
                got=await page.evaluate('''({spec,fields})=>Object.fromEntries(fields.map(f=>[f,CasardiRender.controlEffects(spec,f,PORTABLE.catalogue.choices[f]||PORTABLE.colorFields[f])]))''',dict(spec=spec,fields=fields))
                assert got==expected,(extra,got,expected);comparisons+=sum(len(v['pixels']) for v in got.values())
            mark('Parità esatta degli effetti e delle azioni di scopertura tra renderer Python e browser',option_comparisons=comparisons)
            # Explicit targeted regressions, with a fresh default look.
            await page.click('[data-tab="body"]');await page.locator('.preset-grid button').first.click();await page.click('[data-tab="extras"]');await page.click('[data-field="hat"][data-value="cappuccio"]')
            await page.click('[data-tab="hair"]');await expect(page.locator('[data-field="hair"][data-value="trecce"]')).to_be_disabled();await page.click('[data-reveal-field="hair"]');await page.click('[data-field="hair"][data-value="trecce"]');mark('Cappuccio: acconciature nascoste spiegate e realmente modificabili dopo la rimozione esplicita')
            await page.click('[data-tab="expression"]');await page.click('[data-field="expression"][data-value="sorriso"]');await page.click('[data-tab="face"]');await expect(page.locator('[data-field="eyes"][data-value="verdi"]')).to_be_disabled();await page.click('[data-reveal-field="eyes"]');await page.click('[data-field="eyes"][data-value="verdi"]');mark('Espressione a occhi chiusi: colori inattivi dichiarati e recupero esplicito, nessun cambio fittizio')
            await page.click('[data-tab="extras"]');await page.click('[data-field="hat"][data-value="cuffie"]');await page.click('[data-field="hat_color"][data-value="rosso"]');before=await page.locator('#live-character').get_attribute('src');await page.click('[data-field="hat_color"][data-value="azzurro"]');assert before!=await page.locator('#live-character').get_attribute('src');mark('Colore cuffie applicato realmente anche dall’interfaccia')
            await page.click('[data-tab="face"]');await page.screenshot(path=str(ROOT/'docs/qa/12_zoom_volto_pc.jpg'),type='jpeg',quality=82)
            await page.set_viewport_size({'width':390,'height':844});await page.locator('#face-detail-image').scroll_into_view_if_needed();await page.screenshot(path=str(ROOT/'docs/qa/13_zoom_volto_telefono.jpg'),type='jpeg',quality=82)
            assert await page.evaluate('()=>document.documentElement.scrollWidth<=innerWidth');mark('Zoom del viso leggibile e nessun overflow nel viewport telefono da 390 px')
            assert not errors and not network,(errors,network);mark('File autonomo: zero eccezioni JavaScript e zero richieste HTTP/S')
            await ctx.close()
            # Optional Python UI uses the same measured-effects backend, not guessed masks.
            web=await browser.new_context(viewport={'width':1440,'height':1000});pg=await web.new_page();pg.on('pageerror',lambda e:errors.append(str(e)))
            await pg.goto('http://127.0.0.1:8080');await expect(pg.locator('#btn-start')).to_be_enabled();await pg.click('#btn-start');await pg.click('[data-style="nes"]');await pg.click('[data-scene="castellobarletta"]');await pg.click('#btn-next');await pg.click('[data-tab="extras"]');await pg.click('[data-field="hat"][data-value="cappuccio"]');await pg.click('[data-tab="hair"]')
            await expect(pg.locator('[data-field="hair"][data-value="trecce"]')).to_be_disabled();await pg.click('[data-reveal-field="hair"]');await expect(pg.locator('[data-field="hair"][data-value="trecce"]')).to_be_enabled()
            await pg.click('[data-tab="face"]');await expect(pg.locator('#face-detail-image')).to_have_attribute('src',__import__('re').compile('data:image/png;base64,'))
            mark('Edizione Python: coperture misurate dal renderer, disattivazione, scopertura e zoom del viso reali via HTTP')
            await web.close()
        finally:await browser.close()
    assert not errors,errors
    report=dict(result='PASS',date='2026-11-27',revision='3.2',tests=checks,actual_ui_alternative_clicks=actions,html_sha256=hashlib.sha256((ROOT/'Cartolina_Casardi_PC_e_Telefono.html').read_bytes()).hexdigest(),javascript_errors=errors,standalone_http_requests=network,seconds=round(time.perf_counter()-started,2),environment='Chromium Linux, file:// offline and loopback HTTP; 390px responsive emulation, not a physical Android/iOS phone.')
    (ROOT/'docs/test-results/control-ui-tests.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':asyncio.run(main())
