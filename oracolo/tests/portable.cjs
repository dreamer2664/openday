/* Verifica un progetto anche dopo l'estrazione dello ZIP.
 * node tests/portable.cjs [cartella-del-progetto]
 * Il server temporaneo usa una porta libera e viene chiuso al termine. */
const {chromium} = require('playwright');
const {spawn} = require('node:child_process');
const {once} = require('node:events');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const root = path.resolve(process.argv[2] || path.join(__dirname,'..'));
const reportFile = process.env.PORTABLE_REPORT || path.join(root,'tests/portable-results.json');
const results = [];
const errors = [];
let browser;
let server;

function temporaryServer() {
  return new Promise((resolve,reject) => {
    server = spawn(process.env.PYTHON || 'python3', [path.join(root,'serve.py'),'--port','0'], {cwd:root, stdio:['ignore','pipe','pipe']});
    let output = '';
    const timeout = setTimeout(()=>reject(new Error('Server non pronto entro 15 secondi')),15000);
    server.stdout.on('data', data => {
      output += data.toString();
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) { clearTimeout(timeout); resolve(match[0]+'/'); }
    });
    server.stderr.on('data', data=>{output+=data.toString();});
    server.once('error', error=>{clearTimeout(timeout);reject(error);});
    server.once('exit', code=>{clearTimeout(timeout);if(code) reject(new Error(output));});
  });
}
async function test(name, callback) {
  try { await callback(); results.push({test:name,status:'PASS'}); console.log('PASS',name); }
  catch(error) { results.push({test:name,status:'FAIL',error:error.message}); throw error; }
}
function watch(page) {
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',msg=>{if(msg.type()==='error') errors.push(msg.text());});
}
async function cycle(page) {
  await page.locator('#domanda').fill('Dovrei provarci?');
  await page.locator('#btnConsult').click();
  await page.waitForFunction(()=>document.querySelector('#cabinet').dataset.state==='answered');
  assert.ok((await page.locator('#responseText').textContent()).length>10);
  await page.locator('#btnAgain').click();
  assert.equal(await page.locator('#domanda').inputValue(),'');
}
(async()=>{
  browser=await chromium.launch({headless:true});
  await test('Apertura diretta di index.html offline, font inclusi e ciclo completo', async()=>{
    const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
    await context.setOffline(true);
    const page=await context.newPage(); watch(page);
    await page.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'load'});
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.evaluate(()=>document.fonts.check('12px "Press Start 2P"')),true);
    assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(16, 25, 37)');
    await cycle(page);
    assert.equal(await page.locator('#offlineStatus').textContent(),'100% LOCALE');
    const home = await page.locator('.wordmark').evaluate(link=>link.href);
    assert.ok(home.endsWith('/index.html'), 'Il logo deve aprire il file, non la cartella');
    await context.close();
  });
  await test('Server incluso: avvio su porta libera e risorse relative', async()=>{
    const url=await temporaryServer();
    const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(); watch(page);
    await page.goto(url,{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);
    await cycle(page);
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
    const caches=await page.evaluate(()=>window.caches.keys());
    assert.ok(caches.some(name=>name.startsWith('delfi-arcade-')));
    await context.setOffline(true);
    await page.reload({waitUntil:'load'});
    await cycle(page);
    await context.close();
  });
  await test('Nessun errore JavaScript o risorsa mancante',async()=>assert.deepEqual(errors,[]));
  console.log(`\n${results.length}/${results.length} test di portabilità superati.`);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  fs.writeFileSync(reportFile,JSON.stringify({suite:'portability',browser:browser?browser.version():null,results,errors},null,2));
  if(browser) await browser.close();
  if(server && server.exitCode===null) {server.kill();await once(server,'exit');}
});
