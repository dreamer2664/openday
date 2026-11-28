"""Read-only, streaming comparison of every shipped ZIP member with extracted
production, plus root HTML/A1 identity. No source edit, package or publication.
"""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,zipfile,time
H=Path('/home/user');C=H/'.cache/casardi-rootcause';R=C/'casardi_postcard'
def digest(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def main():
 start=time.time();stamp=datetime.now(timezone.utc).isoformat();archive=H/'Cartolina_Casardi_Windows_LPC_QR_2026-27.zip';count=0;assets=0
 assert digest(archive)=='9fb4a649948ded763cb3436d3b82b12f58f196f8429e65abbd8dfe18bdf5a12f'
 with zipfile.ZipFile(archive) as z:
  prefix=next(n[:-len('browser/app.js')] for n in z.namelist() if n.endswith('/browser/app.js'))
  for name in z.namelist():
   if name.endswith('/'):continue
   assert name.startswith(prefix),name
   relative=Path(name[len(prefix):]);assert not relative.is_absolute() and '..' not in relative.parts,name
   with z.open(name) as a,(R/relative).open('rb') as b:
    while True:
     x=a.read(1024*1024);y=b.read(1024*1024);assert x==y,name
     if not x:break
   count+=1;assets+=str(relative).startswith('assets/')
  assert z.testzip() is None
 assert count==717 and assets==473
 production=digest(H/'Cartolina_Casardi_PC_e_Telefono.html');a1=digest(H/'Cartolina_Casardi_DIAGNOSTICA_ANDROID_A1.html');experiment=digest(C/'canvas-experiment/canvas-preview.html')
 assert production==digest(R/'Cartolina_Casardi_PC_e_Telefono.html')=='8b247a2cd86bd0485f352190590371e83150aa3feb99b2cb5c59fc517d9a09ea'
 assert a1=='2806e32423451c4ef7eeb5d37260b645a5ba06a11dba14474c99c5e6447e8992'
 assert experiment=='a01ca4759b499979e8a9b0591f6b4a007fb11654d874053e0444be3c7b33245e'
 report=dict(result='PASS',started_at_workspace_utc=stamp,finished_at_workspace_utc=datetime.now(timezone.utc).isoformat(),seconds=round(time.time()-start,2),method='Streaming exact byte comparison for every member, plus ZIP CRC test and SHA256 of root deliverables.',entire_archive_files_byte_equal=count,asset_files_unchanged=assets,zip_crc_pass=True,zip_sha256=digest(archive),production_html_sha256=production,diagnostic_a1_sha256=a1,prototype_sha256=experiment,source_or_asset_mutations=False,release_or_publication=False)
 (C/'whole-release-integrity.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
if __name__=='__main__':main()
