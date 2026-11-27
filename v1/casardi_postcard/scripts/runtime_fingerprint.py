"""Fingerprint the distributed executable runtime for extracted-copy QA.
Documentation and scripts do not affect this fingerprint; the ZIP manifest
separately covers every included file. No visitor PNG or var cache is read.
"""
from pathlib import Path
import hashlib
ROOT=Path(__file__).resolve().parent.parent
HTML='Cartolina_Casardi_PC_e_Telefono.html'
EXE='AVVIA_CARTOLINA_WINDOWS.exe'

def runtime_files(root=ROOT):
    files=[]
    for directory in ('app','web','assets','browser','service'):
        files.extend(p for p in (root/directory).rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc')
    files.extend([root/HTML,root/EXE])
    return sorted(files)

def runtime_fingerprint(root=ROOT):
    paths=runtime_files(root);digest=hashlib.sha256()
    for p in paths:digest.update(p.relative_to(root).as_posix().encode()+b'\0'+p.read_bytes())
    return len(paths),digest.hexdigest()
