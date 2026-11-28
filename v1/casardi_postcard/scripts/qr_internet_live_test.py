"""Agent QA of the actual optional Cloudflare Quick Tunnel, not a fake tunnel.
Run with --binary /path/to/native/service. Linux same-source QA is not native
Windows, school-network or physical 4G/5G testing. Stops every process it starts.
"""
from pathlib import Path
import argparse,base64,hashlib,io,json,os,re,subprocess,time,traceback
import requests
from PIL import Image
import numpy as np
import cv2
ROOT=Path(__file__).resolve().parent.parent
import sys
sys.path.insert(0,str(ROOT))
from scripts.build_service import source_digest
OUT=ROOT/'docs/test-results/qr-internet-live.json'

def main(binary):
 start=time.monotonic();report={'result':'FAIL','platform':'Linux same-source binary + real Cloudflare public HTTPS','checks':[],'physical_windows':'NOT TESTED','physical_4g_5g_school_network':'NOT TESTED'}
 env={**os.environ,'CASARDI_PORT':'8097','CASARDI_NO_BROWSER':'1','CASARDI_HTML':str(ROOT/'Cartolina_Casardi_PC_e_Telefono.html')}
 for k in ['CASARDI_TRUST_PREVIEW','CASARDI_QA_LAN_IP']:env.pop(k,None)
 proc=subprocess.Popen([str(binary)],cwd=binary.parent,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 base='http://127.0.0.1:8097';headers=None;public=None
 session=requests.Session();session.headers['User-Agent']='Casardi-QR-Internet-QA/1'
 def mark(name,**extra):
  report['checks'].append({'name':name,'result':'PASS',**extra});print('PASS',name,flush=True)
 try:
  for _ in range(60):
   try:r=session.get(base+'/health',timeout=1);r.raise_for_status();break
   except requests.RequestException:time.sleep(.25)
  else:raise RuntimeError('Native QA service did not start')
  page=session.get(base+'/',timeout=10);page.raise_for_status()
  cfg=json.loads(re.search(r'id="local-service-config">(.*?)</script>',page.text,re.S)[1]);headers={'X-Casardi-Key':cfg['key'],'Origin':base}
  assert cfg['internet']['status']=='off'
  mark('Internet is disabled until explicitly requested')
  r=session.post(base+'/bridge/internet',json={'action':'start'},headers=headers,timeout=10);r.raise_for_status()
  last=None;deadline=time.monotonic()+215
  while time.monotonic()<deadline:
   state=session.get(base+'/bridge/state',headers=headers,timeout=10).json();phase=state['internet']['status']
   if phase!=last:print('Cloudflare state:',phase,flush=True);last=phase
   if phase=='error':raise RuntimeError(state['internet']['message'])
   if phase=='ready':public=state['internet']['url'];break
   time.sleep(1)
  else:raise RuntimeError('Actual public tunnel startup timed out')
  assert public.startswith('https://') and public.endswith('.trycloudflare.com')
  report['public_hostname']=public.split('//',1)[1]
  mark('Official pinned helper downloaded/verified; actual public HTTPS origin self-check passed')
  png=(ROOT/'renders/B_casardi_nes_cane.png').read_bytes()
  r=session.post(base+'/bridge/export',data=png,headers={**headers,'Content-Type':'image/png','X-Casardi-Generation':str(state['generation'])},timeout=25);r.raise_for_status();transfer=r.json()['transfer']
  qr=Image.open(io.BytesIO(base64.b64decode(transfer['qr'].split(',',1)[1]))).convert('RGB')
  decoded,_,_=cv2.QRCodeDetector().detectAndDecode(np.asarray(qr))
  assert decoded==transfer['url'] and decoded.startswith(public+'/download/')
  mark('QR independently decoded to the real public download URL, not the creator')
  for path in ['/','/telefono','/health','/bridge/state','/bridge/reset','/bridge/stop','/bridge/internet','/service/main.go']:
   rr=session.get(public+path,timeout=25)
   assert rr.status_code==404,(path,rr.status_code)
   assert cfg['key'] not in rr.text
  mark('Actual public tunnel exposes no root, creator, admin API, source or owner key')
  forged=session.get(public+'/bridge/state',headers={'CF-Connecting-IP':'127.0.0.1','X-Forwarded-For':'127.0.0.1'},timeout=25)
  assert forged.status_code in (403,404),forged.status_code
  mark('Forged loopback proxy headers denied by edge or dedicated listener',http_status=forged.status_code)
  landing=session.get(decoded,timeout=25);landing.raise_for_status();assert 'Cloudflare' in landing.text
  for suffix in ['/image','/file']:
   rr=session.get(decoded+suffix,timeout=30);rr.raise_for_status();assert rr.content==png
   assert 'no-store' in rr.headers['Cache-Control'] and 'noindex' in rr.headers['X-Robots-Tag']
  mark('Original 3000x2000 PNG downloaded byte-exact through real Cloudflare HTTPS',png_bytes=len(png),sha256=hashlib.sha256(png).hexdigest())
  assert session.post(decoded+'/file',data=b'x',timeout=20).status_code==405
  mark('Public writes rejected')
  rr=session.post(base+'/bridge/reset',headers=headers,timeout=10);rr.raise_for_status()
  for suffix in ['','/image','/file']:assert session.get(decoded+suffix,timeout=20).status_code==410
  mark('New postcard/reset revokes all three public download routes immediately')
  rr=session.post(base+'/bridge/internet',json={'action':'stop'},headers=headers,timeout=10);rr.raise_for_status();assert rr.json()['internet']['status']=='off'
  mark('Disabling Internet explicitly restores LAN mode')
  report['result']='PASS'
 except Exception as e:
  report['error']=str(e);report['traceback']=traceback.format_exc();print('LIVE TEST FAILED:',str(e),flush=True)
 finally:
  if headers:
   try:session.post(base+'/bridge/stop',headers=headers,timeout=5)
   except requests.RequestException:pass
  try:proc.wait(timeout=12)
  except subprocess.TimeoutExpired:proc.terminate();proc.wait(timeout=5)
  stdout,stderr=proc.communicate();report['service_exit']=proc.returncode
  report['service_stderr']=stderr.decode(errors='replace')[-3000:]
  report['seconds']=round(time.monotonic()-start,2)
  report['html_sha256']=hashlib.sha256((ROOT/'Cartolina_Casardi_PC_e_Telefono.html').read_bytes()).hexdigest()
  report['go_source_files'],report['go_source_sha256']=source_digest()
  OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
  print(json.dumps({k:v for k,v in report.items() if k not in ['checks','traceback']},ensure_ascii=False,indent=2),flush=True)
 return 0 if report['result']=='PASS' else 1
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--binary',required=True,type=Path);raise SystemExit(main(p.parse_args().binary.resolve()))
