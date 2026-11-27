"""Check a genuinely extracted ZIP and its own LAN service, not the source tree.

Maintainer procedure (Linux QA, installed Go/Playwright, NOT native Windows):
  1. python scripts/package.py --candidate
  2. Extract ZIP outside this source tree.
  3. In the EXTRACTED service/: go build -mod=vendor -trimpath -o ../casardi-service .
  4. Start that extracted native binary on :8082 with CASARDI_PORT=8082,
     CASARDI_NO_BROWSER=1, CASARDI_TRUST_PREVIEW=1, CASARDI_QA_LAN_IP=127.0.0.1.
     No CASARDI_HTML override: it reads the HTML beside the binary.
  5. python scripts/package_smoke.py --copy /extracted/casardi_postcard
  6. Stop the extracted test service; python scripts/package.py (final).

Compares every runtime file incl. Windows EXE; independently opens the HTML
ALONE with file:// and network disabled, renders both actual 3000x2000 PNGs,
uploads them to the extracted Go service, decodes real QRs and downloads the
identical bytes. The Windows EXE is compared, not executed in Linux.
"""
from __future__ import annotations
import argparse
import asyncio
import base64
import hashlib
import io
import json
from pathlib import Path
import re
import shutil
import sys
import tempfile
import time
import urllib.error
import urllib.request
from PIL import Image
import zxingcpp
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from scripts.runtime_fingerprint import HTML,EXE,runtime_files,runtime_fingerprint


def sha(data):return hashlib.sha256(data).hexdigest()


async def isolated_html(source):
    from playwright.async_api import async_playwright,expect
    result=[];pngs=[];errors=[];network=[]
    with tempfile.TemporaryDirectory() as td:
        td=Path(td);only=td/'cartolina.html';shutil.copyfile(source,only);assert len(list(td.iterdir()))==1
        async with async_playwright() as p:
            browser=await p.chromium.launch(args=['--no-sandbox'])
            try:
                ctx=await browser.new_context(offline=True,accept_downloads=True)
                page=await ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('request',lambda r:network.append(r.url) if r.url.startswith(('http:','https:')) else None)
                await page.goto(only.as_uri());await expect(page.locator('#start')).to_be_enabled()
                for mode in ('photo','nes'):
                    await page.evaluate('''async mode=>{const j={mode,scene:'casardi',name:'Prova isolata',character:{...PORTABLE.catalogue.defaults.character},companion:null};const c=await CasardiRender.compose(j,3000);const b=await CasardiRender.pngBlob(c,j);const old=document.querySelector('#smoke-download');if(old){URL.revokeObjectURL(old.href);old.remove();}const a=document.createElement('a');a.id='smoke-download';a.textContent='Scarica prova';a.style.cssText='position:fixed;top:10px;left:10px;z-index:9999;padding:20px;background:white;color:black';a.download='prova.png';a.href=URL.createObjectURL(b);document.body.append(a);}''',mode)
                    async with page.expect_download() as d:await page.click('#smoke-download')
                    png=td/(mode+'.png');await(await d.value).save_as(str(png));raw=png.read_bytes()
                    with Image.open(io.BytesIO(raw)) as image:
                        assert image.format=='PNG' and image.size==(3000,2000) and image.info.get('Source')
                        assert 'PERSONAGGIO MODULARE LPC' in image.info.get('Description','');image.verify()
                    result.append(dict(mode=mode,result='PASS',dimensions=[3000,2000],sha256=sha(raw)));pngs.append(raw)
                assert not errors and not network,(errors,network)
            finally:await browser.close()
    return result,pngs


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--copy',type=Path,required=True)
    parser.add_argument('--url',default='http://127.0.0.1:8082');args=parser.parse_args();copied=args.copy.resolve();base=args.url.rstrip('/')
    assert copied!=ROOT,'Use a separately extracted ZIP, not the source tree.'
    paths=runtime_files(ROOT)
    for p in paths:assert p.read_bytes()==(copied/p.relative_to(ROOT)).read_bytes(),p.relative_to(ROOT)
    count,digest=runtime_fingerprint();assert (count,digest)==runtime_fingerprint(copied)
    standalone,pngs=asyncio.run(isolated_html(copied/HTML))
    def req(path,method='GET',body=None,headers=None):
        request=urllib.request.Request(base+path,data=body,headers=headers or {},method=method)
        try:
            with urllib.request.urlopen(request,timeout=30) as r:return r.status,r.read(),dict(r.headers)
        except urllib.error.HTTPError as e:
            with e:return e.code,e.read(),dict(e.headers)
    status,raw,headers=req('/');assert status==200 and 'no-store' in headers.get('Cache-Control','')
    cfg=json.loads(re.search(rb'id="local-service-config">(.*?)</script>',raw,re.S)[1]);key={'X-Casardi-Key':cfg['key']}
    assert json.loads(req('/health')[1])['app']=='casardi-postcard-lan-3'
    status,raw,h=req('/telefono');assert status==200 and raw==(copied/HTML).read_bytes() and 'Set-Cookie' not in h
    assert 'no-store' in h['Cache-Control'] and b'local-service-config">{' not in raw
    checks=[];previous=None;last_path=None
    try:
        for item,raw in zip(standalone,pngs):
            start=time.perf_counter()
            status,body,_=req('/bridge/export','POST',raw,{**key,'X-Casardi-Generation':str(cfg['generation']),'Content-Type':'image/png','Origin':base})
            assert status==201;state=json.loads(body);t=state['transfer']
            im=Image.open(io.BytesIO(base64.b64decode(t['qr'].split(',')[1]))).convert('RGB');decoded=zxingcpp.read_barcode(im)
            assert decoded and decoded.text==t['url'] and t['url'].startswith(base+'/download/')
            path=t['url'][len(base):];last_path=path
            if previous:assert req(previous+'/file')[0]==410
            assert req(path)[0]==200
            for action in ('/file','/image'):
                status,data,h=req(path+action);assert status==200 and data==raw and 'no-store' in h['Cache-Control']
            checks.append(dict(mode=item['mode'],result='PASS',dimensions=[3000,2000],png_sha256=sha(raw),qr_independently_decoded=True,download_identical_bytes=True,seconds=round(time.perf_counter()-start,2)))
            previous=path
    finally:
        assert req('/bridge/reset','POST',headers=key)[0]==200
    assert last_path and req(last_path+'/file')[0]==410
    assert json.loads(req('/bridge/state',headers=key)[1])['transfer'] is None
    for path in ('/assets/','/var/','/service/main.go','/README.md'):assert req(path)[0]==404
    assert not list((copied/'var/exports').glob('*.png'))
    report=dict(result='PASS',date='2026-11-27',procedure='ZIP extracted outside source tree; its own Go native service built from extracted vendored sources; standalone HTML copied alone and opened file:// with browser network disabled.',
                runtime_files_equal=count,runtime_sha256=digest,windows_exe_sha256=sha((copied/EXE).read_bytes()),
                standalone_html_sha256=sha((copied/HTML).read_bytes()),standalone_file_only_offline=standalone,
                phone_creator_http='PASS',checks=checks,reset_and_memory_cleanup='PASS',no_directory_browsing='PASS',
                environment='Linux + Chromium and loopback QA-only LAN; not clean Windows, a physical phone or the school network.')
    (ROOT/'docs/test-results/package-smoke.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
