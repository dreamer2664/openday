"""Regenerate local style previews and all six original NES background PNGs."""
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent))
from app.postcard import compose,nes_background
from app.credits import png_bytes,credit_for,credit_text
from app.catalogue import normalise_job
from app.scenes import PHOTO_SCENES
from scripts.render_gallery import JOBS
ROOT=Path(__file__).resolve().parent.parent
if __name__=='__main__':
    output=ROOT/'web/static/examples';output.mkdir(parents=True,exist_ok=True)
    job=normalise_job({**JOBS['A_casardi_foto_gatto'],'name':''})
    compose(job,1200).save(output/'style-photo.jpg',quality=92,optimize=True,comment=credit_text(credit_for(job)).encode('utf-8'))
    job=normalise_job({**JOBS['B_casardi_nes_cane'],'name':''})
    (output/'style-nes.png').write_bytes(png_bytes(compose(job,1200),job))
    for sid in PHOTO_SCENES:
        job=dict(scene=sid,mode='nes')
        path=ROOT/'assets/nes'/(sid+'.png');path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(png_bytes(nes_background(sid,600),job))
    print('Two real style examples and six native NES backgrounds regenerated.')
