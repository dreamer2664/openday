"""Offline maintainer build: Windows LAN + optional read-only Internet PNG QR.
Go >=1.24, vendored QR dependency, CGO off. Not native Windows execution QA.
  python scripts/build_service.py --go /path/to/go --native /tmp/casardi-service
"""
from __future__ import annotations
import argparse,hashlib,json,os,platform,struct,subprocess
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
SERVICE=ROOT/'service'
OUTPUT=ROOT/'AVVIA_CARTOLINA_WINDOWS.exe'

def source_digest(root=ROOT):
 paths=sorted(p for p in (root/'service').rglob('*') if p.is_file() and '__pycache__' not in p.parts)
 digest=hashlib.sha256()
 for p in paths:digest.update(p.relative_to(root).as_posix().encode()+b'\0'+p.read_bytes())
 return len(paths),digest.hexdigest()

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--go',default=os.environ.get('GO','go'))
 parser.add_argument('--native',type=Path)
 args=parser.parse_args()
 version=subprocess.check_output([args.go,'version'],text=True).strip()
 env={**os.environ,'CGO_ENABLED':'0','GOTOOLCHAIN':'local','GOPROXY':'off','GOSUMDB':'off'}
 common=[args.go,'build','-mod=vendor','-buildvcs=false','-trimpath']
 subprocess.run(common+['-ldflags=-s -w -H=windowsgui -buildid=','-o',str(OUTPUT),'.'],cwd=SERVICE,env={**env,'GOOS':'windows','GOARCH':'amd64'},check=True)
 if args.native:
  args.native.parent.mkdir(parents=True,exist_ok=True)
  subprocess.run(common+['-ldflags=-s -w -buildid=','-o',str(args.native.resolve()),'.'],cwd=SERVICE,env={**env,'GOOS':platform.system().lower(),'GOARCH':'amd64'},check=True)
 raw=OUTPUT.read_bytes();pe=struct.unpack_from('<I',raw,0x3c)[0]
 assert raw[:2]==b'MZ' and raw[pe:pe+4]==b'PE\0\0' and struct.unpack_from('<H',raw,pe+4)[0]==0x8664
 assert struct.unpack_from('<H',raw,pe+24+68)[0]==2,'Expected Windows GUI subsystem'
 n,digest=source_digest()
 report={'result':'PASS','bridge_revision':'qr-internet-1','creator_revision':'3.3.1','built_at_workspace_utc':datetime.now(timezone.utc).isoformat(),'compiler':version,'build_host':platform.system()+' '+platform.machine(),'target':'windows/amd64, GUI subsystem, CGO_ENABLED=0','file':OUTPUT.name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'source_files':n,'source_sha256':digest,'dependency':'Vendored github.com/skip2/go-qrcode (MIT)','source_network':'Disabled: GOPROXY=off and GOSUMDB=off; verified Go toolchain preinstalled.','cloudflared':'Official 2026.11.2, not bundled; first opt-in downloads a pinned artifact with size/SHA256 verification.','runtime':'No Python/Go/Node runtime; keep paired full HTML beside EXE.','native_windows_execution':'NOT TESTED','windows_job_object_native':'NOT TESTED; cross-compiled kill-on-close ownership implementation','code_signing':'Unsigned; no signing certificate supplied.'}
 if args.native:report['linux_qa_binary_sha256']=hashlib.sha256(args.native.read_bytes()).hexdigest()
 (ROOT/'docs/test-results/qr-internet-windows-build.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
