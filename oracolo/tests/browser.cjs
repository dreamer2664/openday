/* Browser reale via Playwright. Il server dev'essere già attivo.
 * npm install --no-save playwright axe-core
 * npx playwright install chromium
 * node tests/browser.cjs
 * Facoltativi: BASE_URL, RENDERS_DIR, TEST_REPORT. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:8080/';
const renders = process.env.RENDERS_DIR || path.join(__dirname, '../renders');
const reportPath = process.env.TEST_REPORT || path.join(__dirname, 'browser-results.json');
const results = [];
const errors = [];
const network = [];
const snapshots = [];
fs.mkdirSync(renders, { recursive: true });
let browser;

async function test(name, fn) {
  const begin = Date.now();
  try {
    const detail = await fn();
    results.push({ test: name, status: 'PASS', durationMs: Date.now() - begin, ...(detail ? {detail} : {}) });
    console.log('PASS', name);
  } catch (error) {
    results.push({ test: name, status: 'FAIL', error: error.message });
    throw error;
  }
}
function watch(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => network.push(request.url()));
}
async function ready(page) {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
}
async function capture(page, filename, fullPage = true) {
  const meta = await page.evaluate(() => ({ phase: document.querySelector('#cabinet').dataset.state, mouth: document.querySelector('#pythiaCanvas').dataset.mouth, text: document.querySelector('#responseText').textContent, viewport: { width: innerWidth, height: innerHeight }, scrollY }));
  await page.screenshot({ path: path.join(renders, filename), fullPage });
  snapshots.push({ filename, ...meta });
}
async function waitPhase(page, phase) {
  await page.waitForFunction(expected => document.querySelector('#cabinet').dataset.state === expected, phase);
}
async function reset(page) {
  await page.locator('#btnAgain').click();
  await waitPhase(page, 'ask');
  assert.equal(await page.locator('#domanda').inputValue(), '');
}
async function consult(page, question) {
  await page.locator('#domanda').fill(question);
  await page.locator('#btnConsult').click();
}
async function noHorizontalOverflow(page) {
  const { viewport, width } = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
  assert.ok(width <= viewport + 1, `Overflow orizzontale: ${width} > ${viewport}`);
}
async function audit(page) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const result = await page.evaluate(() => axe.run(document, {runOnly: {type:'tag', values:['wcag2a','wcag2aa','wcag21aa']}}));
  const failures = result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) }));
  assert.deepEqual(failures, []);
  return { checks: result.passes.length, violations: failures.length };
}

(async () => {
  browser = await chromium.launch({headless: true});
  const desktop = await browser.newContext({ viewport: {width:1440,height:1000}, deviceScaleFactor:1 });
  const page = await desktop.newPage(); watch(page);
  await test('Apertura desktop, font locali, nessun overflow', async () => {
    await ready(page);
    assert.match(await page.title(), /Oracolo di Delfi/);
    assert.equal(await page.locator('#cabinet').getAttribute('data-state'), 'ask');
    assert.equal(await page.locator('#domanda').getAttribute('maxlength'), '140');
    assert.equal(await page.locator('#btnSound').getAttribute('aria-pressed'), 'false');
    await noHorizontalOverflow(page);
    await capture(page, '01-schermata-iniziale.png');
  });

  await test('Pizia idle: respiro, battito di ciglia e bocca chiusa', async () => {
    await page.waitForFunction(() => document.querySelector('#pythiaCanvas').dataset.eyes === 'closed');
    await page.waitForFunction(() => document.querySelector('#pythiaCanvas').dataset.eyes === 'open');
    const breath = await page.locator('#pythiaCanvas').getAttribute('data-breath');
    await page.waitForFunction(previous => document.querySelector('#pythiaCanvas').dataset.breath !== previous, breath);
    assert.equal(await page.locator('#pythiaCanvas').getAttribute('data-mouth'), '0');
    const idleBox = await page.locator('.pythia-zone').boundingBox();
    await page.screenshot({path:path.join(renders, '02-pizia-idle.png'), clip:{x:idleBox.x, y:idleBox.y-5, width:idleBox.width, height:idleBox.height+24}});
  });

  await test('Campo vuoto e soli spazi: avviso, focus e nessuna consultazione', async () => {
    await page.locator('#btnConsult').click();
    assert.ok(await page.locator('#emptyWarn').isVisible());
    assert.equal(await page.locator('#domanda').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'domanda');
    await page.locator('#domanda').fill('   ');
    await page.locator('#btnConsult').click();
    assert.equal(await page.locator('#cabinet').getAttribute('data-state'), 'ask');
    await capture(page, '08-campo-vuoto.png');
  });

  await test('Domanda acquisita; doppio clic bloccato; Pizia in concentrazione per 1–2 secondi', async () => {
    await page.locator('#domanda').fill('Dovrei provarci?');
    await page.evaluate(() => {
      window.qaTrace = [];
      window.qaAnswers = [];
      const original = OracoloMotore.estrai;
      OracoloMotore.estrai = function () { const answer = original(); window.qaAnswers.push(answer); return answer; };
      const record = () => window.qaTrace.push({time:performance.now(), state:document.querySelector('#cabinet').dataset.state, pose:document.querySelector('#pythia').dataset.pose, mouth:document.querySelector('#pythiaCanvas').dataset.mouth, eyes:document.querySelector('#pythiaCanvas').dataset.eyes, text:document.querySelector('#responseText').textContent, panelHeight:document.querySelector('#oraclePanel').getBoundingClientRect().height});
      new MutationObserver(record).observe(document.querySelector('#pythiaCanvas'), {attributes:true});
      new MutationObserver(record).observe(document.querySelector('#cabinet'), {attributes:true});
      record();
    });
    const button = await page.locator('#btnConsult').boundingBox();
    await page.mouse.dblclick(button.x+button.width/2, button.y+button.height/2, {delay:30});
    await waitPhase(page, 'consulting');
    assert.equal(await page.locator('#questionEcho').textContent(), 'Dovrei provarci?');
    assert.ok(await page.locator('#btnConsult').isDisabled());
    assert.equal(await page.locator('#pythia').getAttribute('data-pose'), 'waiting');
    assert.equal(await page.locator('#pythiaCanvas').getAttribute('data-eyes'), 'closed');
    await page.evaluate(() => { document.querySelector('#stateAsk').requestSubmit(); document.querySelector('#stateAsk').requestSubmit(); });
    assert.equal(await page.evaluate(() => window.qaAnswers.length), 1);
    await capture(page, '03-consultazione.png');
  });

  await test('Rivelazione progressiva sincronizzata con tre bocche; ritorno idle e pannello stabile', async () => {
    await page.waitForFunction(() => document.querySelector('#cabinet').dataset.state==='speaking' && document.querySelector('#responseText').textContent.length>=Math.floor(window.qaAnswers[0].length*.55) && document.querySelector('#pythiaCanvas').dataset.mouth!=='0');
    assert.ok(!(await page.locator('#btnAgain').isVisible()));
    await capture(page, '04-responso-parlato.png');
    await waitPhase(page, 'answered');
    const trace = await page.evaluate(() => window.qaTrace);
    const spoken = trace.filter(f=>f.state==='speaking');
    const waiting = trace.find(f=>f.state==='consulting');
    const first = spoken[0];
    const duration = first.time - waiting.time;
    assert.ok(duration>=1200 && duration<=2100, `Attesa: ${duration} ms`);
    assert.deepEqual([...new Set(spoken.map(f=>f.mouth))].sort(), ['0','1','2']);
    assert.ok(spoken.some(f=>f.text.length>2 && f.text.length<windowLength(trace)));
    for (const frame of spoken) if (/[\s.,!?;:]$/.test(frame.text)) assert.equal(frame.mouth, '0');
    assert.equal(await page.locator('#responseText').textContent(), await page.evaluate(()=>window.qaAnswers[0]));
    assert.equal(await page.locator('#pythia').getAttribute('data-pose'), 'idle');
    assert.equal(await page.locator('#pythiaCanvas').getAttribute('data-mouth'), '0');
    assert.ok(await page.locator('#btnAgain').isVisible());
    assert.equal(await page.evaluate(()=>document.activeElement.id), 'btnAgain');
    const heights = trace.map(f=>f.panelHeight);
    assert.ok(Math.max(...heights)-Math.min(...heights)<2, `Variazione pannello: ${Math.max(...heights)-Math.min(...heights)} px`);
    await capture(page, '05-responso-completo.png');
    return { waitMs: Math.round(duration), mouthFrames: ['0','1','2'], sampledFrames: spoken.length };
  });

  await test('Accessibilità automatica WCAG A/AA sul responso', () => audit(page));

  await test('Reset completo e dodici nuove consultazioni senza ricaricare né ripetere gli ultimi otto responsi', async () => {
    await page.emulateMedia({ reducedMotion:'reduce' });
    const answers = [await page.locator('#responseText').textContent()];
    for (let i=0;i<12;i++) {
      await reset(page);
      assert.equal(await page.locator('#responseText').textContent(), '');
      assert.equal(await page.locator('#questionEcho2').textContent(), '');
      assert.equal(await page.locator('#charCount').textContent(), '0 / 140');
      assert.ok(await page.locator('#btnConsult').isEnabled());
      await consult(page, `Andrà bene il mio progetto ${i+1}?`);
      await waitPhase(page, 'answered');
      const response = await page.locator('#responseText').textContent();
      assert.ok(!answers.slice(-8).includes(response));
      answers.push(response);
    }
    assert.equal(await page.evaluate(()=>performance.getEntriesByType('navigation').length), 1);
    return { cycles: 13, uniqueResponses: new Set(answers).size };
  });

  await test('Domande lunghe: taglio a 140, contatore, eco completa e reset', async () => {
    await reset(page);
    await page.locator('#domanda').fill('Dovrei '.repeat(45));
    const value = await page.locator('#domanda').inputValue();
    assert.equal(value.length, 140);
    assert.equal(await page.locator('#charCount').textContent(), '140 / 140');
    await page.locator('#btnConsult').click();
    await waitPhase(page, 'answered');
    assert.equal(await page.locator('#questionEcho2').textContent(), value.trim().replace(/\s+/g, ' '));
    await noHorizontalOverflow(page);
    await reset(page);
  });

  await test('Controllo locale: frase fissa, nessun sorteggio; reset ripristina il gioco', async () => {
    const count = await page.evaluate(()=>window.qaAnswers.length);
    await consult(page, 'Devo prendere altri farmaci?');
    await waitPhase(page, 'safety');
    assert.equal(await page.locator('#responseText').textContent(), await page.evaluate(()=>ORACOLO_SAFETY_RESPONSE));
    assert.equal(await page.evaluate(()=>window.qaAnswers.length), count);
    assert.ok(await page.locator('#safetyNote').isVisible());
    assert.equal(await page.locator('#pythiaCanvas').getAttribute('data-mouth'), '0');
    await capture(page, '09-domanda-delicata.png');
    await reset(page);
    assert.ok(!(await page.locator('#safetyNote').isVisible()));
    assert.equal(await page.locator('#answerLabel').textContent(), "L'ORACOLO HA PARLATO");
    await consult(page, 'Dovrei tagliarmi i capelli?');
    await waitPhase(page, 'answered');
    assert.equal(await page.evaluate(()=>window.qaAnswers.length), count+1);
  });

  await test('Invio da tastiera; testo trattato letteralmente, non come HTML', async () => {
    await reset(page);
    await page.locator('#domanda').fill('<b>Dovrei provarci?</b>');
    await page.locator('#domanda').press('Enter');
    await waitPhase(page, 'answered');
    assert.equal(await page.locator('#questionEcho2 b').count(), 0);
    assert.equal(await page.locator('#questionEcho2').textContent(), '<b>Dovrei provarci?</b>');
    await reset(page);
    await page.locator('#domanda').fill('Prima riga');
    await page.locator('#domanda').press('Shift+Enter');
    assert.match(await page.locator('#domanda').inputValue(), /\n/);
    assert.equal(await page.locator('#cabinet').getAttribute('data-state'), 'ask');
    await page.locator('#domanda').fill('');
  });

  await test('Audio facoltativo: attivazione Web Audio, oscillatori originali e silenziamento', async () => {
    await page.evaluate(() => {
      window.qaTones = 0; window.qaResumes = 0;
      const originalCreate = AudioContext.prototype.createOscillator;
      const originalResume = AudioContext.prototype.resume;
      AudioContext.prototype.createOscillator = function(...args) { window.qaTones++; return originalCreate.apply(this,args); };
      AudioContext.prototype.resume = function(...args) { window.qaResumes++; return originalResume.apply(this,args); };
    });
    await page.locator('#btnSound').click();
    assert.equal(await page.locator('#btnSound').getAttribute('aria-pressed'), 'true');
    assert.ok(await page.evaluate(()=>OracoloAudio.enabled));
    assert.ok((await page.evaluate(()=>window.qaTones))>=2);
    await consult(page, 'È il momento giusto?'); await waitPhase(page,'answered');
    const count = await page.evaluate(()=>window.qaTones);
    assert.ok(count>=7);
    await page.locator('#btnSound').click();
    assert.equal(await page.locator('#btnSound').getAttribute('aria-pressed'), 'false');
    assert.equal(await page.evaluate(()=>OracoloAudio.enabled), false);
    await reset(page);
    await consult(page, 'Posso continuare in silenzio?'); await waitPhase(page,'answered');
    assert.equal(await page.evaluate(()=>window.qaTones), count);
    return { oscillatorEvents: count, audioContextResumes: await page.evaluate(()=>window.qaResumes), physicalSpeakers: 'non verificati nel sandbox' };
  });

  await test('Comando schermo intero: entrata e uscita', async () => {
    assert.equal(await page.evaluate(()=>document.fullscreenEnabled), true);
    await page.locator('#btnFullscreen').click();
    await page.waitForFunction(()=>Boolean(document.fullscreenElement));
    await page.locator('#btnFullscreen').click();
    await page.waitForFunction(()=>!document.fullscreenElement);
  });

  await test('Offline: consultazione, ricaricamento dalla cache e nuova consultazione', async () => {
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
    await desktop.setOffline(true);
    await reset(page);
    await consult(page, 'Troverò quello che cerco?'); await waitPhase(page,'answered');
    assert.ok((await page.locator('#responseText').textContent()).length>10);
    await page.reload({waitUntil:'load'});
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('#cabinet').getAttribute('data-state'), 'ask');
    await consult(page, 'Posso consultare ancora senza rete?'); await waitPhase(page,'answered');
    assert.ok((await page.locator('#responseText').textContent()).length>10);
    await desktop.setOffline(false);
  });

  await test('Nessun dato della domanda in cookie, storage o richieste esterne', async () => {
    assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length), 0);
    assert.equal((await desktop.cookies()).length, 0);
    const unexpected = network.filter(url=>url.startsWith('http') && new URL(url).origin!==new URL(base).origin);
    assert.deepEqual(unexpected, []);
    assert.ok(network.every(url=>!url.includes('Dovrei') && !url.includes('farmaci')));
  });

  await test('Accessibilità automatica WCAG A/AA sul modulo iniziale', async () => {
    await reset(page);
    return await audit(page);
  });

  const mobileContext = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const mobile = await mobileContext.newPage(); watch(mobile);
  await test('Mobile touch 390 × 844: ciclo completo e Pizia visibile durante la consultazione', async () => {
    await ready(mobile);
    await noHorizontalOverflow(mobile);
    await capture(mobile, '06-mobile-iniziale.png');
    await mobile.locator('#domanda').fill('Dovrei seguire la mia curiosità?');
    await mobile.locator('#btnConsult').tap();
    await waitPhase(mobile, 'consulting');
    await mobile.waitForTimeout(650);
    const box = await mobile.locator('#pythia').boundingBox();
    assert.ok(box.y>=0 && box.y+box.height<=844, `Pizia fuori viewport: ${JSON.stringify(box)}`);
    await waitPhase(mobile, 'answered');
    await noHorizontalOverflow(mobile);
    await capture(mobile, '07-mobile-responso.png', false);
    await mobile.locator('#btnAgain').tap();
    assert.equal(await mobile.locator('#domanda').inputValue(), '');
  });

  await test('Mobile: domanda lunga e nota di sicurezza senza testo fuori dal pannello', async () => {
    await mobile.emulateMedia({reducedMotion:'reduce'});
    await consult(mobile, 'Un nuovo viaggio verso qualcosa che non conosco '.repeat(4));
    await waitPhase(mobile,'answered');
    await noHorizontalOverflow(mobile);
    assert.ok((await mobile.locator('#questionEcho2').textContent()).length<=140);
    await reset(mobile);
    await consult(mobile, 'Devo chiamare il 112?');
    await waitPhase(mobile,'safety');
    await noHorizontalOverflow(mobile);
    const panel = await mobile.locator('#oraclePanel').boundingBox();
    for (const selector of ['#responseBox','#safetyNote','#btnAgain']) {
      const box = await mobile.locator(selector).boundingBox();
      assert.ok(box.x>=panel.x && box.x+box.width<=panel.x+panel.width+1 && box.y+box.height<=panel.y+panel.height+1, selector);
    }
    await capture(mobile, '10-mobile-nota-importante.png');
  });

  await test('Layout responsive da 320 a 1920 pixel, inclusi i limiti 640/641 e 700', async () => {
    for (const [width,height] of [[320,740],[375,812],[640,900],[641,900],[700,900],[768,1024],[1024,768],[1280,800],[1920,1080]]) {
      const context = await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
      const responsive = await context.newPage(); watch(responsive);
      await ready(responsive); await noHorizontalOverflow(responsive);
      const button = await responsive.locator('#btnConsult').boundingBox();
      assert.ok(button.width>=200 && button.height>=44);
      const art = await responsive.locator('.sanctuary-art').boundingBox();
      const stage = await responsive.locator('.stage').boundingBox();
      assert.ok(art.x>=stage.x && art.x+art.width<=stage.x+stage.width, `Tempio fuori scena a ${width}px`);
      await consult(responsive, 'a'.repeat(140)); await waitPhase(responsive,'answered');
      await noHorizontalOverflow(responsive);
      const echo = await responsive.locator('#questionEcho2').boundingBox();
      const panel = await responsive.locator('#oraclePanel').boundingBox();
      assert.ok(echo.x>=panel.x && echo.x+echo.width<=panel.x+panel.width+1);
      await context.close();
    }
  });

  await test('Riduzione del movimento rispettata e nessun errore JavaScript', async () => {
    const reduced = await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    const reducedPage = await reduced.newPage(); watch(reducedPage); await ready(reducedPage);
    assert.equal(await reducedPage.locator('.flame').first().evaluate(el=>getComputedStyle(el).animationName), 'none');
    await consult(reducedPage, 'Dovrei provarci?'); await waitPhase(reducedPage,'answered');
    assert.equal(await reducedPage.locator('#pythiaCanvas').getAttribute('data-mouth'), '0');
    await reduced.close();
    assert.deepEqual(errors, []);
  });

  await desktop.close(); await mobileContext.close();
  console.log(`\n${results.length}/${results.length} gruppi di test browser superati.`);
})().catch(error=>{ console.error(error); process.exitCode=1; }).finally(async()=>{
  fs.writeFileSync(reportPath, JSON.stringify({suite:'browser',browser:browser?browser.version():null,url:base,results,errors,snapshots},null,2));
  if (browser) await browser.close();
});
function windowLength(trace) { return trace.findLast(frame=>frame.state==='answered').text.length; }
