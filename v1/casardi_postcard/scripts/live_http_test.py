"""Live HTTP regression, plus REAL 300-second expiry in two phases.

In a separate terminal start a test-only server (not the visitor kiosk):
 POSTCARD_PORT=8081 POSTCARD_TTL_SECONDS=300 POSTCARD_LAN_IP=127.0.0.1 \
 POSTCARD_EXPORT_DIR="$PWD/var/qa_exports" python -m app.server

 python scripts/live_http_test.py prepare
 # Work on something else for at least five minutes, leaving that server on.
 python scripts/live_http_test.py finalize

State is outside the deliverable in the OS temp directory and deleted at the end.
Never use this on an active stand: the collision/race tests intentionally reset
synthetic sessions. No physical phone is used. Uses Python's standard library.
"""
from __future__ import annotations
import concurrent.futures
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from PIL import Image

ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:8081').rstrip('/')
EXPORTS=Path(os.environ.get('TEST_EXPORT_DIR',ROOT/'var/qa_exports'))
STATE=Path(tempfile.gettempdir())/'casardi-live-http-state.json'
REPORT=ROOT/'docs/test-results/live-http-tests.json'
TESTS=[]

def record(test,detail=''):
    TESTS.append(dict(test=test,result='PASS',detail=detail));print('PASS',test,flush=True)

def request(method,path,data=None,headers=None):
    h=dict(headers or {})
    body=None
    if data is not None:
        body=json.dumps(data,ensure_ascii=False).encode();h['Content-Type']='application/json'
    req=urllib.request.Request(BASE+path,data=body,headers=h,method=method)
    try:
        with urllib.request.urlopen(req,timeout=120) as r:return r.status,r.read(),dict(r.headers)
    except urllib.error.HTTPError as e:return e.code,e.read(),dict(e.headers)

class Client:
    def __init__(self):
        status,data,_=request('GET','/');assert status==200
        self.cap=re.search(rb'name="kiosk-csrf" content="([^"]+)"',data)[1].decode()
        self.generation=0
    def post(self,path,body=None):
        status,body,headers=request('POST',path,{} if body is None else body,
            {'X-Kiosk-CSRF':self.cap,'X-Kiosk-Generation':str(self.generation)})
        return status,json.loads(body),headers
    def reset(self):
        status,data,_=self.post('/api/reset');assert status==200
        self.generation=data['generation']
    def export(self,mode='nes',**kwargs):
        status,data,_=self.post('/api/export',dict(mode=mode,scene='paestum',name='Prova sintetica',**kwargs))
        assert status==200,(status,data.get('error'))
        return data

def prepare():
    assert not STATE.exists(),'Finalize the previous real-time test or remove its temporary state intentionally.'
    status,body,_=request('GET','/api/options');assert status==200 and json.loads(body)['ttl_seconds']==300
    a,b=Client(),Client();a.reset();b.reset()
    assert request('POST','/api/reset',{})[0]==403
    record('live_capability_protection_no_cookies_required')
    for invalid in ({'mode':[]},{'scene':'../app'},{'character':{'hair':'no'}},{'companion':{'animal':'gatto','pose':[]}}):
        assert a.post('/api/export',invalid)[0]==400
    record('live_invalid_payloads_no_server_crash')
    # Real worker is composing a photo while another request resets its owner.
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        pending=pool.submit(a.post,'/api/export',dict(mode='photo',scene='epidauro',name='Segreto di prova'))
        time.sleep(.15)  # allow the photo request to enter its real worker
        busy=False
        until=time.monotonic()+15
        while time.monotonic()<until:
            status,_,_=b.post('/api/preview',{'mode':'nes'})
            if status==429:busy=True;break
            if pending.done():break
        assert busy,'Could not observe renderer busy; repeat on an idle machine.'
        status,data,_=request('POST','/api/sprite',{}, {'X-Kiosk-CSRF':b.cap})
        assert status==200 and data.startswith(b'\x89PNG')
        a.reset()
        status,data,_=pending.result(timeout=90)
        assert status==409,data
    assert not list(EXPORTS.glob('*.png'))
    record('real_threaded_inflight_reset_cancels_export_and_no_orphan')
    record('busy_composite_keeps_sprite_api_responsive')
    # One owner's reset must not revoke another visitor context's file.
    first=a.export();second=b.export()
    a.reset()
    assert request('GET',first['file_url'])[0] in (404,410)
    assert request('GET',second['file_url'])[0]==200
    record('separate_context_reset_is_scoped_and_revokes_immediately')
    # A second application process must fail to bind WITHOUT deleting the card.
    path=EXPORTS/(second['token']+'.png');digest=hashlib.sha256(path.read_bytes()).hexdigest()
    env=dict(os.environ,POSTCARD_PORT='8081',POSTCARD_TTL_SECONDS='300',
        POSTCARD_EXPORT_DIR=str(EXPORTS),POSTCARD_LAN_IP='127.0.0.1')
    run=subprocess.run([sys.executable,'-m','app.server'],cwd=ROOT,env=env,
        stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=30)
    assert run.returncode!=0 and b'Porta 8081 occupata' in run.stdout
    assert path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest()==digest
    assert request('GET',second['file_url'])[0]==200
    record('occupied_port_rejected_without_erasing_running_instance_files')
    for var,value,word in [('POSTCARD_TTL_SECONDS','60','300'),('POSTCARD_PORT','abc','intero'),('POSTCARD_LAN_IP','not-an-ip','Indirizzo LAN non valido')]:
        invalid_env={**env,var:value}
        run=subprocess.run([sys.executable,'-m','app.server'],cwd=ROOT,env=invalid_env,
            stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=30)
        assert run.returncode!=0 and word.encode() in run.stdout and b'Traceback' not in run.stdout
    record('bad_environment_values_have_clear_italian_errors')
    for route in ['/var/exports/','/var/qa_exports/','/assets/','/static/../../app/server.py','/download/not-a-token']:
        assert request('GET',route)[0]==404
    record('live_no_directory_browsing_or_path_traversal')
    status,raw,_=request('GET','/api/diagnostics');diag=json.loads(raw)
    assert status==200 and diag['listening'] and diag['warnings']
    record('loopback_only_configuration_warns_but_pc_download_works')
    # Leave a fresh card to expire naturally, without reset or controlled clock.
    card=b.export();start=time.time()
    status,raw,headers=request('GET',card['file_url']);assert status==200
    with Image.open(io.BytesIO(raw)) as im:assert im.size==(3000,2000) and im.info.get('Copyright')
    assert 'no-store' in headers.get('Cache-Control','')
    assert request('GET','/download/'+card['token']+'/preview.jpg')[0]==200
    assert request('GET','/download/'+card['token']+'/crediti.txt')[0]==200
    record('live_hd_png_metadata_preview_credits_and_no_store')
    STATE.write_text(json.dumps(dict(start=start,token=card['token'],file_url=card['file_url'],tests=TESTS)))
    try:STATE.chmod(0o600)
    except OSError:pass
    print('Prepared. Run finalize after at least 305 real seconds; do not reset the test server.',flush=True)

def finalize():
    data=json.loads(STATE.read_text());elapsed=time.time()-data['start']
    assert elapsed>=305,f'Only {elapsed:.1f} real seconds elapsed; run finalize again after 305 seconds.'
    TESTS.extend(data['tests'])
    token=data['token']
    # Check disk BEFORE making another HTTP read: verifies background cleaner.
    assert not (EXPORTS/(token+'.png')).exists()
    assert not list(EXPORTS.glob('*.part'))
    record('real_300_second_ttl_background_cleaner_removed_file',f'{elapsed:.1f} seconds of actual wall time elapsed; no clock changes')
    for suffix in ('','/file.png','/preview.jpg','/crediti.txt'):
        assert request('GET','/download/'+token+suffix)[0] in (404,410)
    record('all_expired_download_routes_refuse_access_over_live_http')
    assert not list(EXPORTS.glob('*.png'))
    report=dict(date='2026-11-27',transport='Waitress + HTTP over local loopback',
        ttl_seconds=300,real_elapsed_seconds=round(elapsed,2),tests=TESTS,
        physical_phone='NOT TESTED; must be checked on the school Wi-Fi')
    REPORT.parent.mkdir(parents=True,exist_ok=True);REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    STATE.unlink()

if __name__=='__main__':
    if len(sys.argv)!=2 or sys.argv[1] not in ('prepare','finalize'):
        raise SystemExit('Usage: python scripts/live_http_test.py prepare|finalize')
    (prepare if sys.argv[1]=='prepare' else finalize)()
