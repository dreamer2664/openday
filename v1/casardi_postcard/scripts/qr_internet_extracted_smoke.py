"""Independent extraction, manifest verification and same-source process smoke.
Verifies the candidate ZIP, compiles its extracted Go sources for this Linux QA
host, reads HTML beside that binary from another cwd, and stops it. Not Windows
execution. The final repackage must retain this exact runtime fingerprint.
"""
from pathlib import Path,PurePosixPath
import argparse,hashlib,json,os,re,struct,subprocess,sys,tempfile,time,zipfile
from urllib.parse import urlsplit
import requests
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from scripts.runtime_fingerprint import runtime_fingerprint,HTML,EXE

def main(go,archive):
 begin=time.monotonic();checks=[]
 def mark(name):checks.append({'name':name,'result':'PASS'});print('PASS',name,flush=True)
 with tempfile.TemporaryDirectory(prefix='casardi-qr-extracted-',dir=ROOT.parent) as td:
  td=Path(td)
  with zipfile.ZipFile(archive) as z:
   names=z.namelist();assert len(names)==len(set(names))
   for n in names:
    pp=PurePosixPath(n);assert not pp.is_absolute() and '..' not in pp.parts and pp.parts[0]=='casardi_postcard'
   assert z.testzip() is None
   for line in z.read('casardi_postcard/MANIFEST.sha256').decode().splitlines():
    digest,name=line.split('  ',1);assert hashlib.sha256(z.read('casardi_postcard/'+name)).hexdigest()==digest,name
   manifest_lines=len(z.read('casardi_postcard/MANIFEST.sha256').decode().splitlines());assert manifest_lines==len(names)-1
   z.extractall(td)
  root=td/'casardi_postcard';n,digest=runtime_fingerprint(root);expected=runtime_fingerprint(ROOT);assert (n,digest)==expected
  mark('Every ZIP member CRC and SHA256 verified; extracted runtime byte-identical to tested delivery')
  raw=(root/EXE).read_bytes();pe=struct.unpack_from('<I',raw,0x3c)[0]
  assert raw[:2]==b'MZ' and raw[pe:pe+4]==b'PE\0\0' and struct.unpack_from('<H',raw,pe+4)[0]==0x8664 and struct.unpack_from('<H',raw,pe+24+68)[0]==2
  mark('Packaged Windows executable is PE x64 GUI and equals the reported build')
  native=root/'casardi-qa-native'
  env={k:v for k,v in os.environ.items() if not k.startswith('CASARDI_')}
  buildenv={**env,'CGO_ENABLED':'0','GOTOOLCHAIN':'local','GOPROXY':'off','GOSUMDB':'off','GOOS':'linux','GOARCH':'amd64'}
  subprocess.run([str(go),'build','-mod=vendor','-buildvcs=false','-trimpath','-ldflags=-s -w -buildid=','-o',str(native),'.'],cwd=root/'service',env=buildenv,check=True,capture_output=True)
  mark('Extracted Go sources compile offline with the vendored dependency')
  proc=subprocess.Popen([str(native)],cwd='/',env={**env,'CASARDI_PORT':'8099','CASARDI_NO_BROWSER':'1'},stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  base='http://127.0.0.1:8099';headers=None
  try:
   for _ in range(60):
    try:health=requests.get(base+'/health',timeout=1);health.raise_for_status();break
    except requests.RequestException:time.sleep(.15)
   else:raise AssertionError('Extracted service did not start')
   assert health.json()['bridge_revision']=='qr-internet-1'
   home=requests.get(base+'/',timeout=10);home.raise_for_status();cfg=json.loads(re.search(r'id="local-service-config">(.*?)</script>',home.text,re.S)[1]);headers={'X-Casardi-Key':cfg['key'],'Origin':base}
   assert cfg['internet']['status']=='off' and cfg['transfer_mode']=='lan'
   phone=requests.get(base+'/telefono',timeout=10);phone.raise_for_status();assert phone.content==(root/HTML).read_bytes()
   mark('Native extracted service reads adjacent packaged HTML from a different cwd; Internet is opt-in')
   png=(root/'renders/B_casardi_nes_cane.png').read_bytes()
   r=requests.post(base+'/bridge/export',data=png,headers={**headers,'Content-Type':'image/png','X-Casardi-Generation':str(cfg['generation'])},timeout=20);r.raise_for_status();state=r.json();assert state['transfer']['bytes']==len(png)
   url=state['transfer']['url']
   if url:
    path=urlsplit(url).path;r=requests.get(base+path+'/file',timeout=10);r.raise_for_status();assert r.content==png
   else:assert not state['networks'],'No fake LAN QR allowed'
   r=requests.post(base+'/bridge/reset',headers=headers,timeout=10);r.raise_for_status();assert r.json()['transfer'] is None
   for path in ['/service/main.go','/assets/','/var/']:assert requests.get(base+path,timeout=5).status_code==404
   mark('Extracted runtime accepts real HD PNG, revokes on reset and does not expose source/files')
  finally:
   if headers:
    try:requests.post(base+'/bridge/stop',headers=headers,timeout=5)
    except requests.RequestException:pass
   try:proc.wait(timeout=8)
   except subprocess.TimeoutExpired:proc.terminate();proc.wait(timeout=5)
   _,stderr=proc.communicate();assert proc.returncode==0 and not stderr,(proc.returncode,stderr[-500:])
  try:requests.get(base+'/health',timeout=1)
  except requests.RequestException:pass
  else:raise AssertionError('Extracted service remained alive after Stop')
  mark('Stop closes the extracted service; no background process left')
  result={'result':'PASS','checks':checks,'seconds':round(time.monotonic()-begin,2),'candidate_archive_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'candidate_archive_members':len(names),'manifest_verified_entries':manifest_lines,'runtime_files':n,'runtime_sha256':digest,'html_sha256':hashlib.sha256((root/HTML).read_bytes()).hexdigest(),'windows_exe_sha256':hashlib.sha256(raw).hexdigest(),'native_windows_execution':'NOT TESTED','public_4g_hardware':'NOT TESTED; real public tunnel/browser checks are separate','candidate_vs_final':'Final ZIP may add this documentation report, but package preflight requires this same byte-exact runtime.'}
  (ROOT/'docs/test-results/qr-internet-extracted-smoke.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,indent=2),flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--go',required=True,type=Path);p.add_argument('--archive',required=True,type=Path);a=p.parse_args();main(a.go.resolve(),a.archive.resolve())
