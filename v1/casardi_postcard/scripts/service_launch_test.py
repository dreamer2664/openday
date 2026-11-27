"""Real Linux process/launcher checks of the exact Go Windows service source.

Prepare a throwaway directory with the native build and HTML beside it; start
that native binary on :8085 with CASARDI_PORT=8085 CASARDI_NO_BROWSER=1 and NO
CASARDI_HTML / TRUST_PREVIEW override. Then run:
  python scripts/service_launch_test.py --binary /path/to/native/casardi-service
The test intentionally STOPS that service through its real browser button.
Not a native-Windows, browser-association, firewall or physical-phone test.
"""
from __future__ import annotations
import argparse
import asyncio
import hashlib
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import subprocess
import threading
import time
import urllib.error
import urllib.request
from playwright.async_api import async_playwright,expect

ROOT=Path(__file__).resolve().parent.parent
BASE='http://127.0.0.1:8085'


def request(path,method='GET',body=None,headers=None):
    req=urllib.request.Request(BASE+path,data=body,headers=headers or {},method=method)
    try:
        with urllib.request.urlopen(req,timeout=5) as r:return r.status,r.read(),dict(r.headers)
    except urllib.error.HTTPError as e:
        with e:return e.code,e.read(),dict(e.headers)


async def main(binary):
    start=time.perf_counter();checks=[]
    def mark(name):checks.append(dict(name=name,result='PASS'));print('PASS',name,flush=True)
    _,raw,h=request('/');cfg=json.loads(re.search(rb'id="local-service-config">(.*?)</script>',raw,re.S)[1]);key={'X-Casardi-Key':cfg['key']}
    assert "frame-ancestors 'self'" in h['Content-Security-Policy'] and 'Set-Cookie' not in h
    assert request('/telefono')[1]==(ROOT/'Cartolina_Casardi_PC_e_Telefono.html').read_bytes()
    assert request('/bridge/state',headers={**key,'Host':'hostile.example'})[0]==403
    assert request('/bridge/reset','POST',headers={**key,'Origin':'http://hostile.example'})[0]==403
    assert request('/bridge/state',headers={'X-Casardi-Key':'invalid'})[0]==403
    mark('Standard security configuration: no preview exception, wrong key/host/origin rejected')
    data=(ROOT/'renders/B_casardi_nes_cane.png').read_bytes()
    def upload(generation):
        status,body,_=request('/bridge/export','POST',data,{**key,'Content-Type':'image/png','X-Casardi-Generation':str(generation),'Origin':BASE})
        assert status==201;return json.loads(body)
    state=upload(cfg['generation']);assert state['transfer']['bytes']==len(data)
    if not state['networks']:assert state['transfer']['url']==state['transfer']['qr']==''
    mark('Actual PNG accepted; a missing private LAN does not invent a reachable QR')
    env={**os.environ,'CASARDI_PORT':'8085','CASARDI_NO_BROWSER':'1'}
    for name in ('CASARDI_HTML','CASARDI_TRUST_PREVIEW','CASARDI_QA_LAN_IP'):env.pop(name,None)
    run=subprocess.run([str(binary)],cwd='/',env=env,capture_output=True,timeout=8)
    assert run.returncode==0 and not run.stderr
    after=json.loads(request('/bridge/state',headers=key)[1]);assert after['generation']==state['generation'] and after['transfer'] is not None
    mark('Second launch reuses the running instance and returns without opening a headless browser')
    class OtherApp(BaseHTTPRequestHandler):
        def do_GET(self):
            raw=b'{"app":"different-test-program"}';self.send_response(200);self.end_headers();self.wfile.write(raw)
        def log_message(self,*args):pass
    other=ThreadingHTTPServer(('0.0.0.0',0),OtherApp);thread=threading.Thread(target=other.serve_forever,daemon=True);thread.start()
    try:
        run=subprocess.run([str(binary)],cwd='/',env={**env,'CASARDI_PORT':str(other.server_port)},capture_output=True,timeout=8)
        assert b'porte locali sono occupate' in run.stderr
    finally:other.shutdown();other.server_close();thread.join(timeout=2)
    assert json.loads(request('/bridge/state',headers=key)[1])['transfer'] is not None
    mark('Unrelated occupied port gives an Italian error without clearing the active service')
    run=subprocess.run([str(binary)],cwd='/',env={**env,'CASARDI_HTML':str(binary.parent/'missing-test.html')},capture_output=True,timeout=8)
    assert b'Non trovo Cartolina_Casardi_PC_e_Telefono.html' in run.stderr
    mark('Missing adjacent HTML gives an explicit restore/extract message')
    for route in ('/assets/','/service/main.go','/var/','/Cartolina_Casardi_PC_e_Telefono.html'):
        assert request(route)[0]==404
    mark('No source-file serving or directory browsing')
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--no-sandbox'])
        try:
            page=await b.new_page();await page.goto(BASE);await expect(page.locator('#start')).to_be_enabled()
            state=json.loads(request('/bridge/state',headers=key)[1]);upload(state['generation'])
            await page.click('#welcome-info');await expect(page.locator('#service-stop')).to_be_visible()
            page.on('dialog',lambda d:d.accept())
            async with page.expect_response(lambda r:r.url.endswith('/bridge/stop') and r.request.method=='POST') as event:await page.click('#service-stop')
            assert (await event.value).status==200;await expect(page.locator('#service-stop')).to_have_text('Servizio arrestato')
            await asyncio.sleep(.6)
            try:request('/health')
            except (urllib.error.URLError,ConnectionError,TimeoutError):pass
            else:raise AssertionError('The stopped process is still accepting HTTP requests')
            mark('Real browser Stop button confirmed; active service closes its listening socket')
        finally:await b.close()
    report=dict(result='PASS',date='2026-11-27',seconds=round(time.perf_counter()-start,2),tests=checks,
                configuration='Production defaults, no TRUST_PREVIEW and no CASARDI_HTML override; native Linux binary reads HTML beside itself from a different working directory.',
                html_sha256=hashlib.sha256((ROOT/'Cartolina_Casardi_PC_e_Telefono.html').read_bytes()).hexdigest(),
                go_source_sha256=json.loads((ROOT/'docs/test-results/windows-build.json').read_text())['source_sha256'],
                windows_native='NOT TESTED; platform browser launch, Windows firewall and MessageBox require the real PC')
    (ROOT/'docs/test-results/go-launch-lifecycle.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--binary',type=Path,required=True)
    asyncio.run(main(parser.parse_args().binary.resolve()))
