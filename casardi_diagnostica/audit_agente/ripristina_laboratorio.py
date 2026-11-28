"""Restore audit harnesses/cache from existing verified artifacts, not production.
Run with --verify-only to inspect archive identity without extracting anything.
This does not install dependencies, run QA, publish, or edit root deliverables.
"""
from pathlib import Path
import argparse,hashlib,zipfile,json,shutil
HERE=Path(__file__).resolve().parent;HOME=HERE.parent.parent
CACHE=HOME/'.cache/casardi-rootcause'
EXPECTED='9fb4a649948ded763cb3436d3b82b12f58f196f8429e65abbd8dfe18bdf5a12f'
def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--verify-only',action='store_true');args=ap.parse_args()
 production=HOME/'Cartolina_Casardi_Windows_LPC_QR_2026-27.zip';assert hashlib.sha256(production.read_bytes()).hexdigest()==EXPECTED,'Production archive identity mismatch'
 with zipfile.ZipFile(HERE/'prove_audit.zip') as z:
  entries=json.loads(z.read('MANIFEST.json'))['entries']
  for item in entries:assert hashlib.sha256(z.read(item['path'])).hexdigest()==item['sha256'],item['path']
  if args.verify_only:print('PASS production ZIP identity and',len(entries),'audit archive entries; no extraction');return
  CACHE.mkdir(parents=True,exist_ok=True)
  for name in z.namelist():
   if name.startswith('harness/rerunnable/') and not name.endswith('/'):
    rel=Path(name).relative_to('harness/rerunnable');assert '..' not in rel.parts and len(rel.parts)==1
    (CACHE/rel).write_bytes(z.read(name))
  # Input data for the Node geometry counterpart, not a visitor project.
  (CACHE/'geometry-envelope-input.json').write_bytes(z.read('reports/original/geometry-envelope-input.json'))
 with zipfile.ZipFile(production) as z:
  for item in z.infolist():
   rel=Path(item.filename);assert not rel.is_absolute() and '..' not in rel.parts
   if item.is_dir():continue
   dest=CACHE/rel;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(z.read(item))
   mode=(item.external_attr>>16)&0o777
   if mode:dest.chmod(mode)
 print('Audit harnesses and verified production extracted under',CACHE)
 print('No root production files changed. See README.md for dependencies and commands.')
if __name__=='__main__':main()
