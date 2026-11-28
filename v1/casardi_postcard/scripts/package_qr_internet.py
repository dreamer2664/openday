"""Package QR Internet 1 only after current QA; preserve historical reports.
--candidate builds before independently extracted smoke. Without that flag,
require the extracted runtime fingerprint. No toolchain/cloudflared is bundled.
"""
from __future__ import annotations
import argparse,hashlib,json,re,sys,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from scripts.build_service import source_digest
from scripts.runtime_fingerprint import runtime_fingerprint,HTML,EXE
OUTPUT=ROOT.parent/'Cartolina_Casardi_Windows_LPC_QR_2026-27.zip'
OMIT={'__pycache__','.venv','.git','node_modules','.cache','.pytest_cache','build','dist','out','target','.arena'}
def sha(raw):return hashlib.sha256(raw).hexdigest()
def report(name):return json.loads((ROOT/'docs/test-results'/name).read_text())
def files():
 out=[]
 for p in ROOT.rglob('*'):
  if not p.is_file():continue
  rel=p.relative_to(ROOT)
  if any(x in OMIT for x in rel.parts) or p.suffix in ['.pyc','.part','.zip']:continue
  if rel.parts[0]=='var' and rel.as_posix()!='var/README.md':continue
  if p.name in ['Thumbs.db','.DS_Store']:continue
  out.append(p)
 return sorted(out)
def check(candidate):
 html_sha=sha((ROOT/HTML).read_bytes());n,source_sha=source_digest()
 w=report('qr-internet-windows-build.json');assert w['result']=='PASS' and w['source_sha256']==source_sha and w['source_files']==n and w['sha256']==sha((ROOT/EXE).read_bytes())
 log=(ROOT/'docs/test-results/qr-internet-go-tests.txt').read_text();assert len(re.findall(r'^--- PASS: Test',log,re.M))==42 and not re.search(r'^FAIL|--- FAIL|DATA RACE',log,re.M) and '\nPASS\n' in log
 for name in ['qr-internet-browser.json','qr-internet-live.json']:
  j=report(name);assert j['result']=='PASS' and j['html_sha256']==html_sha and j['go_source_sha256']==source_sha,name
  assert len(j['checks'])>=9,name
 b=report('qr-internet-browser.json');assert b['javascript_errors']==[]
 integrity=report('qr-internet-integrity.json');assert integrity['result']=='PASS' and integrity['asset_files_byte_exact']==473 and integrity['embedded_data_byte_exact'] and integrity['renderer_and_drag_unchanged'] and integrity['html_sha256']==html_sha
 runtime_n,runtime_sha=runtime_fingerprint()
 if not candidate:
  smoke=report('qr-internet-extracted-smoke.json');assert smoke['result']=='PASS' and smoke['runtime_files']==runtime_n and smoke['runtime_sha256']==runtime_sha and smoke['html_sha256']==html_sha and smoke['windows_exe_sha256']==w['sha256']
 for p in files():
  assert p.name not in ['github_pat.txt','cloudflared-windows-amd64.exe','cloudflared-linux-amd64','casardi-service'],p
  assert not re.search(rb'\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})',p.read_bytes()),'Credential pattern found: '+str(p.relative_to(ROOT))
 assert not list((ROOT/'var').rglob('*.png')),'Visitor/test exports must be cleared'
 assert (ROOT/EXE).stat().st_mode&0o111 and (ROOT/'start.sh').stat().st_mode&0o111
 return {'result':'CANDIDATE' if candidate else 'PASS','bridge_revision':'qr-internet-1','creator_revision':'3.3.1','go_race_top_level_pass':42,'actual_public_tunnel_checks':len(report('qr-internet-live.json')['checks']),'browser_checks':len(b['checks']),'asset_files_byte_exact':473,'embedded_assets_and_rendering_unchanged':True,'runtime_files':runtime_n,'runtime_sha256':runtime_sha,'html_sha256':html_sha,'go_source_sha256':source_sha,'windows_exe_sha256':w['sha256'],'cloudflared_bundled':False,'credentials_bundled':False,'native_windows':'NOT TESTED','physical_phone_school_network':'NOT TESTED','android_arena_drag_fix_claimed':False,'extracted_smoke':'PENDING' if candidate else 'PASS','historical_reports':'Preserved; not represented as rerun results for changed runtime.'}
def main(candidate):
 audit=check(candidate)
 (ROOT/'docs/test-results/qr-internet-package.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
 manifest=ROOT/'MANIFEST.sha256'
 listing=[p for p in files() if p!=manifest]
 manifest.write_text(''.join(sha(p.read_bytes())+'  '+p.relative_to(ROOT).as_posix()+'\n' for p in listing))
 listing=files()
 with zipfile.ZipFile(OUTPUT,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for p in listing:z.write(p,ROOT.name+'/'+p.relative_to(ROOT).as_posix())
 with zipfile.ZipFile(OUTPUT) as z:
  assert z.testzip() is None
  assert len(z.namelist())==len(set(z.namelist()))==len(listing)
  for line in manifest.read_text().splitlines():
   digest,path=line.split('  ',1);assert sha(z.read(ROOT.name+'/'+path))==digest,path
 assert OUTPUT.stat().st_size<100*1024*1024,'GitHub single-blob limit'
 digest=sha(OUTPUT.read_bytes());OUTPUT.with_suffix('.zip.sha256').write_text(digest+'  '+OUTPUT.name+'\n')
 print(json.dumps({'status':audit['result'],'file':str(OUTPUT),'files':len(listing),'bytes':OUTPUT.stat().st_size,'sha256':digest},indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--candidate',action='store_true');main(p.parse_args().candidate)
