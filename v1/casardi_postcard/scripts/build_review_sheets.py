"""Rebuild compact composition evidence from the actual delivered Pillow renders.
No generation or alternate/promotional art: only renders/[A-X]_*.jpg and the
actual Foro source composition. The sheet is not an HD export or aesthetic test.
"""
from pathlib import Path
import json
import sys
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))


def main():
    jobs=json.loads((ROOT/'renders/_jobs.json').read_text())
    sheet=Image.new('RGB',(1800,3440),'#101426');draw=ImageDraw.Draw(sheet)
    font=ImageFont.truetype(str(ROOT/'assets/fonts/EBGaramond.ttf'),20)
    for i,(name,entry) in enumerate(sorted(jobs.items())):
        with Image.open(ROOT/entry['jpg']) as source:
            resampling=Image.Resampling.NEAREST if entry['job']['mode']=='nes' else Image.Resampling.LANCZOS
            im=source.convert('RGB').resize((600,400),resampling)
        x=i%3*600;y=i//3*430;sheet.paste(im,(x,y));draw.text((x+12,y+403),name,font=font,fill='#f6efd9')
    assert len(jobs)==24
    out=ROOT/'docs/qa';out.mkdir(exist_ok=True)
    sheet.save(out/'05_cartoline.jpg',quality=82,optimize=True,comment=b'Actual Pillow compositions; 3.2 Dodici luoghi. Full source credits: SOURCES_AND_LICENSES.md and renders/_jobs.json.')
    from app.postcard import compose
    from app.credits import credit_for,credit_text
    job=jobs['E_foro_foto_nessuno']['job']
    with compose(job,3000) as full:
        # Real pixels surrounding the avatar support, no compositing or retouch.
        detail=full.convert('RGB').crop((1950,1330,2800,1950)).resize((1275,930),Image.Resampling.NEAREST)
        comment=credit_text(credit_for(job)).encode('utf-8')
    detail.save(out/'06_appoggio_foro.jpg',quality=89,optimize=True,comment=comment)
    print('Rebuilt 05: 24 delivered compositions; 06: actual Foro support crop.')

if __name__=='__main__':main()
