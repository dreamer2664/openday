/* Collaudo dell'HTML Deluxe autonomo, offline e in iframe isolato.
 * Richiede solo le dipendenze di test: playwright e axe-core.
 * node tests/deluxe.cjs [percorso/Oracolo-di-Delfi-Deluxe.html] */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {pathToFileURL}=require('node:url');
const project=path.resolve(__dirname,'..');
const original=path.resolve(process.argv[2]||path.join(project,'../Oracolo-di-Delfi-Deluxe.html'));
const renders=path.join(project,'renders/deluxe');
const results=[],errors=[],network=[];
let browser;
fs.mkdirSync(renders,{recursive:true});
async function test(name,action){
 const began=Date.now();
 try{const detail=await action();results.push({test:name,status:'PASS',durationMs:Date.now()-began,...(detail?{detail}:{})});console.log('PASS',name);}
 catch(error){results.push({test:name,status:'FAIL',error:error.message});throw error;}
}
function watch(page){
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(/^https?:/i.test(r.url()))network.push(r.url());});
 page.on('requestfailed',r=>errors.push('Risorsa: '+r.url().slice(0,180)));
}
async function phase(frame,state){await frame.waitForFunction(s=>document.querySelector('#cabinet').dataset.state===s,state);}
async function reset(frame){await frame.locator('#btnAgain').click();await phase(frame,'ask');assert.equal(await frame.locator('#domanda').inputValue(),'');}
async function ask(frame,text){await frame.locator('#domanda').fill(text);await frame.locator('#btnConsult').click();}
async function shot(page,name,fullPage=true){await page.screenshot({path:path.join(renders,name),fullPage});}
async function audit(page){
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const data=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
 const violations=data.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
 assert.deepEqual(violations,[]);return{checks:data.passes.length,violations:0};
}
(async()=>{
 const isolated=fs.mkdtempSync(path.join(os.tmpdir(),'delfi-deluxe-'));
 const copy=path.join(isolated,'gioco.html');fs.copyFileSync(original,copy);
 assert.deepEqual(fs.readdirSync(isolated),['gioco.html']);
 const fileURL=pathToFileURL(copy).href;
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.setOffline(true);
 const page=await context.newPage();watch(page);

 await test('Apertura del solo HTML offline: immagini, font, sprite 120 × 160 e nessun autoplay',async()=>{
  await page.goto(fileURL,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('#cabinet').getAttribute('data-state'),'ask');
  assert.equal(await page.locator('#pythiaCanvas').getAttribute('width'),'120');
  assert.equal(await page.locator('#pythiaCanvas').getAttribute('height'),'160');
  assert.equal(await page.locator('script[src],link[rel="stylesheet"]').count(),0);
  assert.ok(await page.locator('img').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth>0)));
  assert.ok(await page.evaluate(()=>document.fonts.check('12px "Press Start 2P"')&&document.fonts.check('12px "VT323"')));
  const sound=await page.evaluate(()=>OracoloAudio.diagnostics());
  assert.equal(sound.contextState,'uninitialized');assert.equal(sound.musicEnabled,false);assert.equal(sound.effectsEnabled,false);
  await shot(page,'01-iniziale.png');
  const box=await page.locator('.pythia-zone').boundingBox();
  await page.screenshot({path:path.join(renders,'02-pizia-dettaglio.png'),clip:{x:box.x,y:box.y-5,width:box.width,height:box.height+24}});
 });

 await test('Musica indipendente dagli effetti; partitura originale di 16 battute a 78 BPM',async()=>{
  await page.locator('#btnMusic').click();
  await page.waitForFunction(()=>OracoloAudio.diagnostics().scheduledSteps>=4);
  const sound=await page.evaluate(()=>({state:OracoloAudio.diagnostics(),track:OracoloAudio.track}));
  assert.equal(sound.state.musicEnabled,true);assert.equal(sound.state.effectsEnabled,false);
  assert.equal(sound.state.contextState,'running');assert.ok(sound.state.activeMusicVoices>0);
  assert.equal(sound.track.bpm,78);assert.equal(sound.track.bars,16);
  assert.ok(sound.track.loopSeconds>49&&sound.track.loopSeconds<50);
  await page.locator('#btnSound').click();assert.equal(await page.locator('#soundState').textContent(),'ON');
  return sound.track;
 });

 await test('Mixer: volume via tastiera, chiusura con Esc e pannello accessibile',async()=>{
  await page.locator('#audioSettings summary').click();
  await page.locator('#volumeRange').focus();await page.locator('#volumeRange').press('Home');
  assert.equal(await page.evaluate(()=>OracoloAudio.volume),0);
  await page.locator('#volumeRange').press('ArrowRight');
  assert.equal(await page.locator('#volumeValue').textContent(),'1%');
  await page.locator('#volumeRange').press('End');
  assert.equal(await page.evaluate(()=>OracoloAudio.volume),1);
  await page.locator('#volumeRange').evaluate(el=>{el.value='45';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await shot(page,'06-musica-e-volume.png');
  const result=await audit(page);
  await page.locator('#volumeRange').press('Escape');
  assert.equal(await page.locator('#audioSettings').evaluate(el=>el.open),false);
  return result;
 });

 await test('Campo vuoto, contatore e limite di 140 caratteri',async()=>{
  await page.locator('#btnConsult').click();assert.ok(await page.locator('#emptyWarn').isVisible());
  await page.locator('#domanda').fill('   ');await page.locator('#btnConsult').click();
  assert.equal(await page.locator('#cabinet').getAttribute('data-state'),'ask');
  await page.locator('#domanda').fill('a'.repeat(200));assert.equal((await page.locator('#domanda').inputValue()).length,140);
  assert.equal(await page.locator('#charCount').textContent(),'140 / 140');
  await page.locator('#domanda').fill('Dovrei provarci?');
 });

 await test('Attesa, doppio invio bloccato e musica attenuata durante la consultazione',async()=>{
  await page.evaluate(()=>{
   window.trace=[];window.picks=[];
   const original=OracoloMotore.estrai;
   OracoloMotore.estrai=()=>{const value=original();window.picks.push(value);return value;};
   const record=()=>window.trace.push({time:performance.now(),state:document.querySelector('#cabinet').dataset.state,mouth:document.querySelector('#pythiaCanvas').dataset.mouth,eyes:document.querySelector('#pythiaCanvas').dataset.eyes,text:document.querySelector('#responseText').textContent,height:document.querySelector('#oraclePanel').getBoundingClientRect().height});
   new MutationObserver(record).observe(document.querySelector('#pythiaCanvas'),{attributes:true});
   new MutationObserver(record).observe(document.querySelector('#cabinet'),{attributes:true});record();
  });
  await page.locator('#btnConsult').click();await phase(page,'consulting');
  await page.locator('#btnConsult').dispatchEvent('click');
  assert.equal(await page.evaluate(()=>window.picks.length),1);
  assert.equal(await page.locator('#pythiaCanvas').getAttribute('data-eyes'),'closed');
  assert.ok(await page.locator('#btnConsult').isDisabled());
  assert.equal(await page.evaluate(()=>OracoloAudio.diagnostics().ducked),true);
  await shot(page,'03-consultazione.png');
 });

 await test('Tre bocche sincronizzate, ritorno idle, reset disponibile e layout stabile',async()=>{
  await page.waitForFunction(()=>document.querySelector('#cabinet').dataset.state==='speaking'&&document.querySelector('#responseText').textContent.length>=10&&document.querySelector('#pythiaCanvas').dataset.mouth==='2');
  await shot(page,'04-responso-parlato.png');
  await phase(page,'answered');
  const trace=await page.evaluate(()=>window.trace);
  const speech=trace.filter(t=>t.state==='speaking');
  assert.deepEqual([...new Set(speech.map(t=>t.mouth))].sort(),['0','1','2']);
  for(const point of speech)if(/[\s.,!?:;]$/.test(point.text))assert.equal(point.mouth,'0');
  const wait=speech[0].time-trace.find(t=>t.state==='consulting').time;
  assert.ok(wait>=1200&&wait<=2100);
  assert.equal(await page.locator('#responseText').textContent(),await page.evaluate(()=>window.picks[0]));
  assert.equal(await page.locator('#pythia').getAttribute('data-pose'),'idle');
  assert.equal(await page.locator('#pythiaCanvas').getAttribute('data-mouth'),'0');
  assert.equal(await page.evaluate(()=>OracoloAudio.diagnostics().ducked),false);
  const heights=trace.map(t=>t.height);assert.ok(Math.max(...heights)-Math.min(...heights)<2);
  await shot(page,'05-responso-completo.png');
  return{waitMs:Math.round(wait),mouthFrames:['0','1','2']};
 });

 await test('Otto nuove consultazioni complete con musica attiva, senza ripetizioni ravvicinate',async()=>{
  const answers=[await page.locator('#responseText').textContent()];
  for(let i=0;i<8;i++){
   await reset(page);assert.equal(await page.locator('#responseText').textContent(),'');
   await ask(page,`Andrà bene il mio progetto ${i+1}?`);await phase(page,'answered');
   const answer=await page.locator('#responseText').textContent();assert.ok(!answers.slice(-8).includes(answer));answers.push(answer);
   const audio=await page.evaluate(()=>OracoloAudio.diagnostics());assert.equal(audio.transportRunning,true);assert.ok(audio.activeMusicVoices<35);
  }
  return{cycles:answers.length,unique:new Set(answers).size};
 });

 await test('Protezione locale e testo letterale, senza responsi casuali per le emergenze',async()=>{
  await reset(page);const count=await page.evaluate(()=>window.picks.length);
  await ask(page,'Devo chiamare il 112?');await phase(page,'safety');
  assert.match(await page.locator('#responseText').textContent(),/persona competente/);
  assert.equal(await page.evaluate(()=>window.picks.length),count);
  assert.equal(await page.evaluate(()=>OracoloAudio.diagnostics().ducked),true);
  await shot(page,'10-nota-importante.png');
  await reset(page);
  await page.locator('#domanda').fill('<b>Dovrei provarci?</b>');await page.locator('#domanda').press('Enter');await phase(page,'answered');
  assert.equal(await page.locator('#questionEcho2 b').count(),0);
  assert.equal(await page.locator('#questionEcho2').textContent(),'<b>Dovrei provarci?</b>');
  await reset(page);
 });

 await test('Rendering stereo PCM della soundtrack intera e degli effetti: segnale finito, udibile e senza clipping',async()=>{
  const output=await page.evaluate(async()=>{
   const stats={};
   for(const [kind,duration] of [['music',52],['effects',8]]){
    const buffer=await OracoloAudio.renderPreview(duration,kind);
    let peak=0,sum=0,nonfinite=0;
    for(let c=0;c<buffer.numberOfChannels;c++){
     const samples=buffer.getChannelData(c);
     for(let i=0;i<samples.length;i++){if(!Number.isFinite(samples[i]))nonfinite++;peak=Math.max(peak,Math.abs(samples[i]));sum+=samples[i]*samples[i];}
    }
    stats[kind]={seconds:buffer.duration,peak,rms:Math.sqrt(sum/(buffer.length*buffer.numberOfChannels)),nonfinite,channels:buffer.numberOfChannels,sampleRate:buffer.sampleRate};
   }
   return stats;
  });
  for(const sound of Object.values(output)){assert.equal(sound.nonfinite,0);assert.equal(sound.channels,2);assert.ok(sound.rms>.003);assert.ok(sound.peak<.8);assert.ok(sound.peak/.45<1,'Margine anche al volume massimo');}
  return output;
 });

 await test('La riproduzione reale supera un giro completo senza accumulare voci',async()=>{
  await page.waitForFunction(()=>OracoloAudio.diagnostics().scheduledSteps>=270,null,{timeout:65000});
  const state=await page.evaluate(()=>OracoloAudio.diagnostics());
  assert.equal(state.transportRunning,true);assert.ok(state.activeMusicVoices>0&&state.activeMusicVoices<35);
  return{scheduledSteps:state.scheduledSteps,activeMusicVoices:state.activeMusicVoices};
 });

 await test('Pausa su scheda nascosta e ripresa senza doppio trasporto',async()=>{
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(()=>OracoloAudio.diagnostics().transportRunning),false);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>OracoloAudio.diagnostics().transportRunning);
  assert.ok((await page.evaluate(()=>OracoloAudio.diagnostics().activeMusicVoices))<35);
 });

 await test('Musica OFF indipendente dagli effetti; spegnimento completo e riattivazioni rapide senza perdite',async()=>{
  await page.locator('#btnMusic').click();await page.waitForTimeout(400);
  let sound=await page.evaluate(()=>OracoloAudio.diagnostics());
  assert.equal(sound.musicEnabled,false);assert.equal(sound.effectsEnabled,true);assert.equal(sound.transportRunning,false);assert.equal(sound.activeMusicVoices,0);
  await page.locator('#btnSound').click();await page.waitForTimeout(800);
  sound=await page.evaluate(()=>OracoloAudio.diagnostics());
  assert.equal(sound.activeEffectVoices,0);assert.equal(sound.contextState,'suspended');
  for(let i=0;i<3;i++){await page.locator('#btnMusic').click();await page.locator('#btnMusic').click();}
  await page.waitForTimeout(800);sound=await page.evaluate(()=>OracoloAudio.diagnostics());
  assert.equal(sound.musicEnabled,false);assert.equal(sound.transportRunning,false);assert.equal(sound.activeMusicVoices,0);
  await page.locator('#btnMusic').click();await page.waitForTimeout(400);
  assert.equal(await page.evaluate(()=>OracoloAudio.diagnostics().contextState),'running');
  await page.locator('#btnMusic').click();
 });

 await test('Audit automatico di accessibilità del gioco',()=>audit(page));
 await context.close();

 await test('Mobile touch: controlli audio, volume, consultazione e reset',async()=>{
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await mobileContext.setOffline(true);
  const mobile=await mobileContext.newPage();watch(mobile);await mobile.goto(fileURL,{waitUntil:'load'});await mobile.evaluate(()=>document.fonts.ready);
  await shot(mobile,'07-mobile-iniziale.png');
  await mobile.locator('#btnMusic').tap();assert.equal(await mobile.locator('#btnMusic').getAttribute('aria-pressed'),'true');
  await mobile.locator('#audioSettings summary').tap();
  const range=await mobile.locator('#volumeRange').boundingBox();await mobile.touchscreen.tap(range.x+range.width*.7,range.y+range.height/2);
  assert.ok((await mobile.evaluate(()=>OracoloAudio.volume))>.55);
  const popover=await mobile.locator('.audio-popover').boundingBox();assert.ok(popover.x>=0&&popover.x+popover.width<=390);
  await shot(mobile,'08-mobile-mixer.png');
  await mobile.locator('#domanda').fill('Dovrei seguire la mia curiosità?');await mobile.locator('#btnConsult').tap();await phase(mobile,'consulting');
  await mobile.waitForTimeout(650);const pizia=await mobile.locator('#pythia').boundingBox();assert.ok(pizia.y>=0&&pizia.y+pizia.height<=844);
  await phase(mobile,'answered');await shot(mobile,'09-mobile-responso.png',false);
  assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await mobile.locator('#btnAgain').tap();assert.equal(await mobile.locator('#domanda').inputValue(),'');
  await mobileContext.close();
 });

 await test('Lettura in iframe isolato: nessun server, permesso form o origine condivisa richiesti',async()=>{
  const embedContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});await embedContext.setOffline(true);
  const outer=await embedContext.newPage();watch(outer);
  await outer.setContent('<html><body style="margin:0"><iframe name="deluxe" sandbox="allow-scripts" style="width:100%;height:100vh;border:0" title="Oracolo"></iframe></body></html>');
  await outer.locator('iframe').evaluate((frame,html)=>{frame.srcdoc=html;},fs.readFileSync(copy,'utf8'));
  await outer.frameLocator('iframe').locator('#domanda').waitFor({state:'visible'});
  const frame=outer.frames().find(f=>f.name()==='deluxe');
  await frame.evaluate(()=>document.fonts.ready);
  await frame.locator('#btnMusic').click();await frame.waitForFunction(()=>OracoloAudio.musicEnabled);assert.equal(await frame.locator('#btnMusic').getAttribute('aria-pressed'),'true');
  await ask(frame,'È il momento giusto?');await phase(frame,'answered');
  await frame.locator('.wordmark').click();assert.equal(frame.url(),'about:srcdoc');
  await reset(frame);await shot(outer,'11-viewer-isolato.png');
  await embedContext.close();
 });

 await test('Responsive, mixer e domande lunghe da 320 a 1920 pixel',async()=>{
  for(const [width,height] of [[320,740],[375,812],[640,900],[641,900],[700,900],[768,1024],[1024,768],[1280,800],[1920,1080]]){
   const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});await ctx.setOffline(true);
   const p=await ctx.newPage();watch(p);await p.goto(fileURL,{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow a ${width}px`);
   const toolbar=await p.locator('.utility-controls').boundingBox();assert.ok(toolbar.x>=0&&toolbar.x+toolbar.width<=width);
   await p.locator('#audioSettings summary').click();const popup=await p.locator('.audio-popover').boundingBox();
   assert.ok(popup.x>=0&&popup.x+popup.width<=width+1,`Mixer fuori schermo a ${width}px`);
   await ask(p,'Un nuovo cammino mi aspetta? '.repeat(7));await phase(p,'answered');
   assert.ok((await p.locator('#questionEcho2').textContent()).length<=140);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await reset(p);await ask(p,'Devo prendere questi farmaci?');await phase(p,'safety');
   const panel=await p.locator('#oraclePanel').boundingBox(),button=await p.locator('#btnAgain').boundingBox();
   assert.ok(button.x>=panel.x&&button.x+button.width<=panel.x+panel.width+1);
   await ctx.close();
  }
 });

 await test('Nessuna richiesta esterna, errore di script o risorsa mancante',async()=>{
  assert.deepEqual(network,[]);assert.deepEqual(errors,[]);
 });
 console.log(`\n${results.length}/${results.length} gruppi Deluxe superati.`);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
 fs.writeFileSync(path.join(project,'tests/deluxe-results.json'),JSON.stringify({file:path.basename(original),browser:browser?browser.version():null,results,errors,externalRequests:network},null,2));
 if(browser)await browser.close();
});
