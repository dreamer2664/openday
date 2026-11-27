"""Audit the twelve native paintings and make an honest art review sheet.
Hashes, dimensions, palette and export-grid checks do not judge beauty or certify
all historic details. The sheet is made from the actual canonical runtime PNGs.
"""
from pathlib import Path
import hashlib
import json
import sys
import time
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from app.nes_art import art_manifest,load_nes_art
from app.scenes import NES_SCENES,PHOTO_SCENES

def main():
    start=time.perf_counter();m=art_manifest();result=[]
    preserved=m.get('retained_from_3_1',{});assert len(preserved)==6
    assert all(m['scenes'][sid]['sha256']==digest for sid,digest in preserved.items())
    sheet=Image.new('RGB',(1800,1850),'#101426');d=ImageDraw.Draw(sheet)
    font=ImageFont.truetype(str(ROOT/'assets/fonts/PressStart2P-Regular.ttf'),10)
    sub=ImageFont.truetype(str(ROOT/'assets/fonts/EBGaramond.ttf'),19)
    labels={sid:cfg['label'].upper() for sid,cfg in PHOTO_SCENES.items()}
    for i,(sid,r) in enumerate(m['scenes'].items()):
        p=ROOT/r['path'];assert hashlib.sha256(p.read_bytes()).hexdigest()==r['sha256']
        with Image.open(p) as im:
            assert im.size==(600,400);colors=len(im.convert('RGB').getcolors(1000000));assert colors<=64
            assert im.convert('RGBA').getchannel('A').getextrema()==(255,255)
            assert 'assistita da IA' in im.info['Description']
        assert hashlib.sha256((ROOT/'assets/photos'/sid/'source.jpg').read_bytes()).hexdigest()==r['reference_local_sha256']
        native=load_nes_art(sid).convert('RGB');x=i%3*600;y=i//3*454
        sheet.paste(native,(x,y+36));d.text((x+13,y+13),labels[sid][:42],font=font,fill='#f6efd9')
        d.text((x+13,y+437),'600 × 400 nativi · 64 colori · riferimento autentico',font=sub,fill='#b4c2d3')
        result.append(dict(scene=sid,result='PASS',sha256=r['sha256'],dimensions=[600,400],colours=colors,opaque=True,licensed_reference_sha256_verified=True))
    d.text((13,1827),'Nuove illustrazioni assistite da IA e rifinite su griglia pixel. Nessuna generazione a runtime. Crediti e limiti in SOURCES_AND_LICENSES.md.',font=sub,fill='#82e4c4')
    out=ROOT/'docs/qa/08_nuovi_scenari_nes.jpg';sheet.save(out,quality=85,optimize=True)
    report=dict(result='PASS',date='2026-11-27',revision='3.2 Dodici luoghi',scenes=result,canonical_files=len(result),retained_3_1_backgrounds_unchanged=len(preserved),native_grid=[600,400],manifest_sha256=hashlib.sha256((ROOT/'assets/nes/manifest.json').read_bytes()).hexdigest(),
      original_procedural_backgrounds='Replaced, no fallback',new_art='AI-assisted architectural repaint; transparent disclosure in app, PNG metadata and manifest.',
      artifact='docs/qa/08_nuovi_scenari_nes.jpg',seconds=round(time.perf_counter()-start,2),
      limitations='File/metadata/palette integrity and native grid, not automated artistic or historical validation. Twelve delivered scenes visually reviewed during development; no user acceptance presumed.')
    (ROOT/'docs/test-results/nes-art-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
