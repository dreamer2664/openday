"""Sequential full-HD HTTP exports across all 24 settings; not a load generator.

Run against an otherwise idle test kiosk: python scripts/stress_http_test.py
Each synthetic export replaces the preceding one and the session is reset.
Reports Linux RSS/HWM when /proc is available. No physical phone is used.
"""
from pathlib import Path
import io
import json
import os
import sys
import time
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
os.environ['TEST_BASE_URL']=os.environ.get('BASE_URL','http://127.0.0.1:8080')
from scripts.live_http_test import Client,request
from scripts.render_gallery import JOBS
from app.catalogue import normalise_job

def memory():
    for path in Path('/proc').glob('[0-9]*/cmdline'):
        try:
            cmd=path.read_bytes()
            if b'\x00-m\x00app.server\x00' not in cmd:continue
            text=(path.parent/'status').read_text()
            fields={line.split(':')[0]:line.split(':')[1].strip() for line in text.splitlines() if ':' in line}
            return dict(rss_kib=int(fields['VmRSS'].split()[0]),peak_kib=int(fields['VmHWM'].split()[0]))
        except (FileNotFoundError,PermissionError,KeyError):pass
    return None

if __name__=='__main__':
    c=Client();c.reset();results=[];initial=memory();start=time.perf_counter()
    try:
        for name,job in JOBS.items():
            t=time.perf_counter();status,data,_=c.post('/api/export',normalise_job(job));assert status==200,(status,data.get('error'))
            status,raw,_=request('GET',data['file_url']);assert status==200
            with Image.open(io.BytesIO(raw)) as img:
                assert img.format=='PNG' and img.size==(3000,2000) and 'Source' in img.info
                img.verify()
            assert request('GET','/download/'+data['token']+'/preview.jpg')[0]==200
            assert request('GET','/healthz')[0]==200
            count=len(json.loads(request('GET','/api/diagnostics')[1])['active_cards'])
            assert count==1,count
            results.append(dict(job=name,status='PASS',seconds=round(time.perf_counter()-t,2),bytes=len(raw),memory=memory()))
            print('PASS',name,results[-1]['seconds'],'s',flush=True)
    finally:c.reset()
    assert not json.loads(request('GET','/api/diagnostics')[1])['active_cards']
    final=memory()
    if final:assert final['rss_kib']<750*1024,'Unexpectedly high resident RAM after bounded rendering.'
    report=dict(date='2026-11-27',tests=results,total_seconds=round(time.perf_counter()-start,2),
        initial_memory=initial,final_memory=final,limit_note='Single local process, one composite at a time; not multi-client load certification.',
        cleanup='PASS: no active cards after final reset')
    (ROOT/'docs/test-results/hd-http-regression.json').write_text(json.dumps(report,indent=2)+'\n')
