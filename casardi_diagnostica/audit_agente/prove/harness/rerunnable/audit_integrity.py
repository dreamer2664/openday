"""Read-only final identity checks; writes evidence only outside the release tree."""
from datetime import datetime as _audit_datetime, timezone as _audit_timezone
from pathlib import Path
import json,hashlib,zipfile,time
C=Path('/home/user/.cache/casardi-rootcause');R=C/'casardi_postcard';H=Path('/home/user')
start=time.time();sha=lambda b:hashlib.sha256(b).hexdigest()
inv=json.loads((C/'source-check.json').read_text())['inventory'];archive=H/'Cartolina_Casardi_Windows_LPC_QR_2026-27.zip'
assert sha(archive.read_bytes())=='9fb4a649948ded763cb3436d3b82b12f58f196f8429e65abbd8dfe18bdf5a12f'
with zipfile.ZipFile(archive) as z:
 prefix=next(n[:-len('browser/app.js')] for n in z.namelist() if n.endswith('/browser/app.js'))
 assert z.testzip() is None
 for item in inv:
  raw=(R/item['path']).read_bytes();assert sha(raw)==item['sha256']==sha(z.read(prefix+item['path'])),item['path']
 assets=[n for n in z.namelist() if n.startswith(prefix+'assets/') and not n.endswith('/')]
 for name in assets:assert z.read(name)==(R/name[len(prefix):]).read_bytes(),name
 assert len(assets)==473
 for name in ['Cartolina_Casardi_PC_e_Telefono.html','AVVIA_CARTOLINA_WINDOWS.exe','start.sh','start.cmd']:
  assert (R/name).read_bytes()==z.read(prefix+name)
 assert (H/'Cartolina_Casardi_PC_e_Telefono.html').read_bytes()==z.read(prefix+'Cartolina_Casardi_PC_e_Telefono.html')
 production=sha((H/'Cartolina_Casardi_PC_e_Telefono.html').read_bytes());assert production=='8b247a2cd86bd0485f352190590371e83150aa3feb99b2cb5c59fc517d9a09ea'
 diagnostic=sha((H/'Cartolina_Casardi_DIAGNOSTICA_ANDROID_A1.html').read_bytes());assert diagnostic=='2806e32423451c4ef7eeb5d37260b645a5ba06a11dba14474c99c5e6447e8992'
 prototype=(C/'canvas-experiment/canvas-preview.html').read_text();baseline=(R/'Cartolina_Casardi_PC_e_Telefono.html').read_text()
 import re
 assert re.search(r'<script id="embedded-data" type="application/json">(.*?)</script>',baseline,re.S)[1]==re.search(r'<script id="embedded-data" type="application/json">(.*?)</script>',prototype,re.S)[1]
 for p in ['browser/render.js','browser/composition.js','browser/sprites.js','browser/bridge.js']:assert prototype.count((R/p).read_text())==1
 report=dict(result='PASS',date=_audit_datetime.now(_audit_timezone.utc).date().isoformat(),source_files_unchanged=len(inv),asset_files_unchanged=len(assets),zip_members=len(z.namelist()),zip_crc_pass=True,production_html_sha256=production,diagnostic_a1_sha256=diagnostic,zip_sha256=sha(archive.read_bytes()),prototype_sha256=sha(prototype.encode()),prototype_renderer_composition_sprites_bridge_and_embedded_data_unchanged=True,release_or_publication=False,seconds=round(time.time()-start,2))
(C/'final-integrity.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
