"""Optional maintenance tool; runtime never downloads assets.

python scripts/fetch_photos.py --check
python scripts/fetch_photos.py --download  # network, only exact approved originals

The included manifest is the source of truth. A remote original whose SHA-256
has changed is NOT silently substituted; research its provenance first.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import sys
import urllib.request
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parent))
from wm import UA
ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/'assets/photos/photo_metadata.json'

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    group=parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--check',action='store_true');group.add_argument('--download',action='store_true')
    args=parser.parse_args();metadata=json.loads(MANIFEST.read_text(encoding='utf-8'))
    for key,item in metadata.items():
        path=ROOT/'assets/photos'/key/'source.jpg'
        if args.download:
            with urllib.request.urlopen(urllib.request.Request(item['url'],headers=UA),timeout=120) as response:
                raw=response.read()
            if hashlib.sha256(raw).hexdigest()!=item['original_sha256']:
                raise SystemExit(f'{key}: originale cambiato; nessun file sostituito per questa scena. Ricontrollare fonte/licenza.')
            path.parent.mkdir(parents=True,exist_ok=True)
            if key=='casardi':path.write_bytes(raw)
            else:
                with Image.open(io.BytesIO(raw)) as original:
                    img=original.convert('RGB');img.thumbnail((3600,3600),Image.Resampling.LANCZOS)
                    img.save(path,'JPEG',quality=93,subsampling=0,optimize=True)
            item['local_sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
            with Image.open(path) as img:item['local_size']=list(img.size)
        digest=hashlib.sha256(path.read_bytes()).hexdigest()
        if digest!=item['local_sha256']:raise SystemExit(f'{key}: hash locale diverso dal manifest; controllare la sostituzione.')
        with Image.open(path) as img:img.verify()
        print(f'OK {key}: file locale integro; {item["lic"]}')
    if args.download:MANIFEST.write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if __name__=='__main__':main()
