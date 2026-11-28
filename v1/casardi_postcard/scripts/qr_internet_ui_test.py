"""Real Chromium desktop + separate emulated phone through real Cloudflare.
No physical Windows/phone/school-network claim. All test tokens are revoked.
"""
from pathlib import Path
import argparse,asyncio,hashlib,io,json,os,re,signal,subprocess,tempfile,time,traceback,sys
from PIL import Image
from playwright.async_api import async_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from scripts.build_service import source_digest
OUT=ROOT/'docs/test-results/qr-internet-browser.json'
SHOTS=ROOT/'docs/screenshots-qr-internet'

async def main(binary):
 started=time.monotonic();checks=[];errors=[];offline_network=[];proc=None;headers=None
 report={'result':'FAIL','checks':checks,'javascript_errors':errors,'native_windows':'NOT TESTED','physical_phone_4g_school_network':'NOT TESTED'}
 base='http://127.0.0.1:8098';SHOTS.mkdir(exist_ok=True)
 def mark(name,**extra):checks.append({'name':name,'result':'PASS',**extra});print('PASS',name,flush=True)
 env={**os.environ,'CASARDI_PORT':'8098','CASARDI_NO_BROWSER':'1','CASARDI_HTML':str(ROOT/'Cartolina_Casardi_PC_e_Telefono.html')}
 for k in ['CASARDI_TRUST_PREVIEW','CASARDI_QA_LAN_IP']:env.pop(k,None)
 proc=subprocess.Popen([str(binary)],env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 async def create(page,mode):
  await page.click('#start');await page.click('[data-mode="'+mode+'"]');await page.click('[data-scene="casardi"]');await page.fill('#nickname','Nicolò');await page.click('#next');await page.click('#next');await page.click('#next');await expect(page.locator('#export')).to_be_enabled(timeout=60000)
 async def save(page,path,selector='#save'):
  async with page.expect_download(timeout=45000) as e:await page.locator(selector).click()
  d=await e.value;await d.save_as(str(path));return path.read_bytes()
 def pngcheck(data):
  with Image.open(io.BytesIO(data)) as im:
   assert im.size==(3000,2000) and 'LICEO ALFREDO CASARDI' in im.info['Title'] and 'CC BY-SA 4.0' in im.info['Copyright'];im.verify()
 try:
  async with async_playwright() as p:
   browser=await p.chromium.launch(args=['--no-sandbox'])
   try:
    with tempfile.TemporaryDirectory() as td:
     td=Path(td)
     offline=await browser.new_context(offline=True,accept_downloads=True)
     fp=await offline.new_page();fp.on('pageerror',lambda e:errors.append(str(e)));fp.on('request',lambda r:offline_network.append(r.url) if r.url.startswith(('http:','https:')) else None)
     await fp.goto((ROOT/'Cartolina_Casardi_PC_e_Telefono.html').as_uri());await expect(fp.locator('#start')).to_be_enabled();await fp.click('#welcome-info');await expect(fp.locator('#service-controls')).to_be_hidden();await fp.click('#close-info')
     await create(fp,'nes');await fp.click('#export');await expect(fp.locator('#result')).to_be_visible(timeout=90000);raw=await save(fp,td/'offline.png');pngcheck(raw);assert not offline_network
     mark('Standalone file:// still creates a licensed 3000x2000 PNG completely offline; no Internet controls or HTTP requests')
     await offline.close()
     pc=await browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True)
     page=await pc.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
     # Read the 25 MB owner response with APIRequest (not Chromium's
     # bounded inspector cache), then fulfil exactly that navigation once.
     response=await pc.request.get(base+'/');owner_html=await response.body();cfg=json.loads(re.search(rb'id="local-service-config">(.*?)</script>',owner_html,re.S)[1]);headers={'X-Casardi-Key':cfg['key'],'Origin':base}
     await page.route(base+'/',lambda route:route.fulfill(response=response,body=owner_html),times=1)
     await page.goto(base)
     await expect(page.locator('#start')).to_be_enabled();await page.click('#welcome-info');await expect(page.locator('#internet-start')).to_be_visible()
     page.once('dialog',lambda d:d.dismiss());await page.click('#internet-start');await expect(page.locator('#internet-status')).to_contain_text('disattivato')
     mark('Visible Internet option; cancelling consent does not start any tunnel')
     page.once('dialog',lambda d:d.accept());await page.click('#internet-start');await expect(page.locator('#internet-status')).to_contain_text('QR Internet attivo',timeout=180000)
     await expect(page.locator('#internet-stop')).to_be_visible();await page.screenshot(path=str(SHOTS/'01_info_qr_internet.jpg'),type='jpeg',quality=80)
     await page.click('#close-info');mark('Internet enabled by the actual UI, official helper started and real public HTTPS verified')
     await create(page,'nes')
     async with page.expect_response(lambda r:r.url.endswith('/bridge/export') and r.request.method=='POST') as event:await page.click('#export')
     rr=await event.value;assert rr.status==201;data=await rr.json();await expect(page.locator('#transfer-qr')).to_be_visible()
     url=await page.locator('#transfer-link').get_attribute('href');assert url==data['transfer']['url'] and url.startswith('https://') and '.trycloudflare.com/download/' in url
     await expect(page.locator('#transfer-status')).to_contain_text('4G/5G');await expect(page.locator('#result-privacy')).to_contain_text('Cloudflare');raw=await save(page,td/'pc.png');pngcheck(raw)
     mark('Final PNG QR uses the HTTPS public download, labels cross-network use and discloses Cloudflare transit',bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest())
     phone_ctx=await browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,accept_downloads=True)
     phone=await phone_ctx.new_page();phone.on('pageerror',lambda e:errors.append(str(e)));response=await phone.goto(url);assert response.status==200;await expect(phone.locator('img')).to_be_visible()
     phone_raw=await save(phone,td/'phone.png','a[download]');assert phone_raw==raw
     assert await phone.evaluate('()=>document.documentElement.scrollWidth<=innerWidth')
     await phone.screenshot(path=str(SHOTS/'02_telefono_download_https.jpg'),type='jpeg',quality=80,full_page=True)
     mark('Separate touch browser opens real public URL and downloads byte-identical PNG; no shared cookies or local network URL')
     async with page.expect_response(lambda r:r.url.endswith('/bridge/reset') and r.request.method=='POST') as event:await page.click('#new')
     assert (await event.value).status==200;revoked=await phone.goto(url);assert revoked.status==410;await expect(phone.locator('h1')).to_contain_text('non è più valido')
     await expect(page.locator('#transfer-code')).to_be_hidden();mark('Actual New postcard button revokes previous public QR and clears its image')
     await create(page,'photo')
     async with page.expect_response(lambda r:r.url.endswith('/bridge/export') and r.request.method=='POST') as event:await page.click('#export')
     assert (await event.value).status==201;await expect(page.locator('#transfer-code')).to_be_visible()
     children=subprocess.check_output(['ps','-o','pid=','--ppid',str(proc.pid)],text=True).split();assert len(children)==1,children
     os.kill(int(children[0]),signal.SIGKILL)
     await expect(page.locator('#transfer-code')).to_be_hidden(timeout=15000);await expect(page.locator('#transfer-status')).to_contain_text('tunnel si e chiuso',timeout=15000)
     await expect(page.locator('#save')).to_have_attribute('href',re.compile('blob:.*'));pngcheck(await save(page,td/'after-interruption.png'))
     mark('Real helper termination hides invalid public QR, shows an error, and preserves full local PNG download')
     # Hold a genuine older GET response across a newer Stop action. The
     # monotonic server state_seq must prevent it from restoring an old mode.
     hit=asyncio.Event();release=asyncio.Event()
     async def delayed(route):
      old=await route.fetch();body=await old.body();hit.set();await release.wait();await route.fulfill(status=old.status,headers=old.headers,body=body)
     await page.route('**/bridge/state',delayed);await asyncio.wait_for(hit.wait(),10)
     await page.click('#info');await page.click('#internet-stop');await expect(page.locator('#internet-status')).to_contain_text('disattivato');release.set();await page.wait_for_timeout(700)
     await expect(page.locator('#internet-status')).to_contain_text('disattivato');await expect(page.locator('#internet-start')).to_be_enabled();await page.unroute('**/bridge/state')
     mark('Delayed pre-stop state response cannot restore a stale Internet mode or QR')
     await page.click('#close-info');await page.click('#new');await expect(page.locator('#welcome')).to_be_visible()
     assert not errors,errors;assert not await pc.cookies();assert await page.evaluate('()=>localStorage.length===0&&sessionStorage.length===0')
     mark('No JavaScript exceptions, cookies, localStorage or sessionStorage; test images/tokens reset')
     await phone_ctx.close();await pc.close()
    report['result']='PASS'
   finally:
    if headers:
     try:await browser.contexts[0].request.post(base+'/bridge/stop',headers=headers,timeout=3000)
     except Exception:pass
    await browser.close()
 except Exception as e:
  scrub=lambda text:re.sub(r'(/download/)[A-Za-z0-9_-]{32}',r'\1REVOKED_TEST_TOKEN',text)
  report['error']=scrub(str(e));report['traceback']=scrub(traceback.format_exc());print('BROWSER TEST FAILED:',report['error'],flush=True)
 finally:
  if headers:
   import requests
   try:requests.post(base+'/bridge/stop',headers=headers,timeout=5)
   except requests.RequestException:pass
  try:proc.wait(timeout=10)
  except subprocess.TimeoutExpired:proc.terminate();proc.wait(timeout=5)
  _,err=proc.communicate();report['service_exit']=proc.returncode;report['service_stderr']=err.decode(errors='replace')[-1000:]
  report['seconds']=round(time.monotonic()-started,2);report['html_sha256']=hashlib.sha256((ROOT/'Cartolina_Casardi_PC_e_Telefono.html').read_bytes()).hexdigest();report['go_source_files'],report['go_source_sha256']=source_digest()
  OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('BROWSER RESULT',report['result'],len(checks),'checks',report['seconds'],'seconds',flush=True)
 return 0 if report['result']=='PASS' else 1
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--binary',type=Path,required=True);raise SystemExit(asyncio.run(main(parser.parse_args().binary.resolve())))
