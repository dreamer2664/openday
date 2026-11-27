"""Real 300-second HTTP expiry test, no simulated clock or physical phone.
Run against the separate QA service at :8084 with CASARDI_TTL=300.
"""
import base64
import hashlib
import io
import json
import os
from pathlib import Path
import re
import time
import urllib.error
import urllib.request
from PIL import Image
import zxingcpp

ROOT=Path(__file__).resolve().parent.parent
BASE=os.environ.get('SERVICE_EXPIRY_URL','http://127.0.0.1:8084').rstrip('/')

def main():
    html=(ROOT/'Cartolina_Casardi_PC_e_Telefono.html').read_bytes();served_html=urllib.request.urlopen(BASE+'/telefono').read();assert served_html==html,'Restart the QA service with the current HTML before the real-clock test.'
    tested_html_sha256=hashlib.sha256(html).hexdigest()
    page=urllib.request.urlopen(BASE+'/').read().decode();cfg=json.loads(re.search(r'<script type="application/json" id="local-service-config">(.*?)</script>',page,re.S)[1])
    data=(ROOT/'renders/B_casardi_nes_cane.png').read_bytes();headers={'Content-Type':'image/png','X-Casardi-Key':cfg['key'],'X-Casardi-Generation':str(cfg['generation']),'Origin':BASE}
    t=time.monotonic();res=json.load(urllib.request.urlopen(urllib.request.Request(BASE+'/bridge/export',data=data,headers=headers,method='POST')))
    transfer=res['transfer'];assert res['ttl_seconds']==300
    qr=Image.open(io.BytesIO(base64.b64decode(transfer['qr'].split(',')[1]))).convert('RGB');assert zxingcpp.read_barcode(qr).text==transfer['url']
    download=urllib.request.urlopen(transfer['url']+'/file').read();assert data==download
    print('PASS: vero PNG identico scaricato via URL decodificato dal QR; attesa naturale di 300 secondi.',flush=True)
    wait=max(0,(transfer['expires_at']-time.time()*1000)/1000)+1.4;time.sleep(wait)
    statuses=[]
    for suffix in ('','/file','/image'):
        try:status=urllib.request.urlopen(transfer['url']+suffix).status
        except urllib.error.HTTPError as e:status=e.code;e.close()
        assert status==410,(suffix,status);statuses.append(dict(route=suffix or 'landing',status=status))
    state=json.load(urllib.request.urlopen(urllib.request.Request(BASE+'/bridge/state',headers={'X-Casardi-Key':cfg['key']})))
    assert state['transfer'] is None
    report=dict(result='PASS',date='2026-11-27',clock='Real server wall clock, no time travel',configured_ttl_seconds=300,
                observed_after_seconds=round(time.monotonic()-t,2),decoded_qr='PASS',download_identical_sha256=hashlib.sha256(data).hexdigest(),
                expired_routes=statuses,service_transfer_removed=True,storage='Memory only; no PNG is written by the Go service',
                environment='Linux build of the same Go source; QA loopback HTTP, not Windows-native or a physical school phone',
                html_sha256=tested_html_sha256,served_html_matches='PASS',
                go_source_sha256=json.loads((ROOT/'docs/test-results/windows-build.json').read_text())['source_sha256'])
    (ROOT/'docs/test-results/go-real-expiry.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2),flush=True)

if __name__=='__main__':main()
