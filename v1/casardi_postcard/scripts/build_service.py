"""Maintainer-only offline Go build of the Windows double-click LAN bridge.

  python scripts/build_service.py --go /path/to/go --native /tmp/casardi-service

Go >=1.24, vendored module, CGO disabled. Opening the supplied EXE does not
require Go, Python or these commands. Cross-compiling is NOT native Windows QA.
The EXE reads the complete HTML beside itself; visitor PNGs stay only in RAM.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess

ROOT=Path(__file__).resolve().parent.parent
SERVICE=ROOT/'service'
OUTPUT=ROOT/'AVVIA_CARTOLINA_WINDOWS.exe'


def source_digest(root=ROOT):
    paths=sorted(p for p in (root/'service').rglob('*') if p.is_file())
    digest=hashlib.sha256()
    for p in paths:digest.update(p.relative_to(root).as_posix().encode()+b'\0'+p.read_bytes())
    return len(paths),digest.hexdigest()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--go',default=os.environ.get('GO','go'))
    parser.add_argument('--native',type=Path,help='Optional native QA binary outside the delivery tree.')
    args=parser.parse_args()
    version=subprocess.check_output([args.go,'version'],text=True).strip()
    env={**os.environ,'CGO_ENABLED':'0','GOTOOLCHAIN':'local','GOPROXY':'off','GOSUMDB':'off'}
    common=[args.go,'build','-mod=vendor','-buildvcs=false','-trimpath']
    subprocess.run(common+['-ldflags=-s -w -H=windowsgui -buildid=','-o',str(OUTPUT),'.'],
                   cwd=SERVICE,env={**env,'GOOS':'windows','GOARCH':'amd64'},check=True)
    if args.native:
        args.native.parent.mkdir(parents=True,exist_ok=True)
        subprocess.run(common+['-ldflags=-s -w -buildid=','-o',str(args.native.resolve()),'.'],
                       cwd=SERVICE,env=env,check=True)
    raw=OUTPUT.read_bytes();assert raw[:2]==b'MZ'
    n,digest=source_digest()
    report=dict(result='PASS',date='2026-11-27',compiler=version,build_host=platform.system()+' '+platform.machine(),
                target='windows/amd64, GUI subsystem, CGO_ENABLED=0',file=OUTPUT.name,bytes=len(raw),
                sha256=hashlib.sha256(raw).hexdigest(),source_files=n,source_sha256=digest,
                dependency='Vendored github.com/skip2/go-qrcode v0.0.0-20200617195104-da1b6568686e (MIT)',
                source_network='Disabled for build (GOPROXY=off, GOSUMDB=off); Go toolchain preinstalled.',
                runtime='No Go/Python installation. Keep Cartolina_Casardi_PC_e_Telefono.html beside the EXE.',
                native_windows_execution='NOT TESTED',code_signing='Unsigned; no commercial signing certificate supplied.')
    (ROOT/'docs/test-results/windows-build.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
