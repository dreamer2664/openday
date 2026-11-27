"""Render real 3000×2000 postcard examples with the revised LPC sci-fi art.

All 24 scene/style combinations are rendered. One photographic HD PNG plus twelve NES HD PNGs are retained; all 24 have
1200px attributed previews. Other photographic HD examples can be regenerated.
This is not a set of screenshots and uses no commercial-game assets.
"""
from pathlib import Path
from PIL import Image
import argparse
import json
import sys
import time
sys.path.insert(0,str(Path(__file__).resolve().parent.parent))
from app.postcard import compose
from app.character import default_spec,PRESETS
from app.credits import png_bytes,credit_for,credit_text
from app.catalogue import normalise_job

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'renders'

def ch(preset='urbano',**kw):
    s=default_spec();s.update(next(p['character'] for p in PRESETS if p['id']==preset));s.update(kw);return s

JOBS={
 'A_casardi_foto_gatto':dict(mode='photo',scene='casardi',name='Giulia',character=ch(hair='corti',held='tablet',pose='libro'),companion=dict(animal='gatto',variant='soriano',pose='seduto')),
 'B_casardi_nes_cane':dict(mode='nes',scene='casardi',name='Marco',character=ch('neon',pose='rilassata'),companion=dict(animal='cane',variant='cucciolo',pose='seduto')),
 'C_pantheon_foto_volpe':dict(mode='photo',scene='pantheon',name='Chiara',character=ch('pilota',glasses='tondi',pose='rilassata'),companion=dict(animal='volpe',variant='rossa',pose='seduto')),
 'D_pantheon_nes_gufo':dict(mode='nes',scene='pantheon',name='',character=ch('esplorazione',held='libro',pose='libro',expression='curiosa'),companion=dict(animal='gufo',variant='comune',pose='posato')),
 'E_foro_foto_nessuno':dict(mode='photo',scene='foro',name='Antonio',character=ch('esplorazione',accessory='none',pose='rilassata'),companion=None),
 'F_foro_nes_tartaruga':dict(mode='nes',scene='foro',name='Sara',character=ch(hair='trecce',hair_color='biondo',top_color='blu',pose='aperta',expression='sorriso'),companion=dict(animal='tartaruga',variant='verde',pose='cammina')),
 'G_epidauro_foto_coniglio':dict(mode='photo',scene='epidauro',name='Elena',character=ch('esplorazione',hair='ondulati',hair_color='ramato',pose='movimento'),companion=dict(animal='coniglio',variant='grigio',pose='in_piedi')),
 'H_epidauro_nes_corvo':dict(mode='nes',scene='epidauro',name='Davide',character=ch('neon',hat='cuffie',hair='cresta',hair_color='ciano',expression='sorpresa'),companion=dict(animal='corvo',variant='nero',pose='ali')),
 'I_biblioteca_foto_drago':dict(mode='photo',scene='biblioteca',name='Beatrice',character=ch(hair='ricci',hair_color='rosso',top_color='bianco',inner_color='magenta',held='libro',pose='libro'),companion=dict(animal='drago',variant='smeraldo',pose='seduto')),
 'J_biblioteca_nes_gatto':dict(mode='nes',scene='biblioteca',name='',character=ch('pilota',hair='rasati',hair_color='nero',skin='bruna',beard='barba',top='trench',top_color='nero',held='pergamena',pose='libro'),companion=dict(animal='gatto',variant='bianco',pose='in_piedi')),
 'K_paestum_foto_cane':dict(mode='photo',scene='paestum',name='Luca',character=ch('esplorazione',hair='corti',hair_color='biondo',top_color='navy',inner_color='ciano',pose='aperta',expression='entusiasta'),companion=dict(animal='cane',variant='bianco',pose='in_piedi')),
 'L_paestum_nes_coniglio':dict(mode='nes',scene='paestum',name='Noemi',character=ch(hair='caschetto',hair_color='platino',skin='ebano',top_color='bordeaux',inner_color='senape',held='oloproiettore',pose='libro',expression='curiosa'),companion=dict(animal='coniglio',variant='marrone',pose='seduto')),
 'M_colosseo_foto_volpe':dict(mode='photo',scene='colosseo',name='Sofia',character=ch('pilota',pose='rilassata',expression='neutra'),companion=dict(animal='volpe',variant='rossa',pose='seduto')),
 'N_colosseo_nes_volpe':dict(mode='nes',scene='colosseo',name='Sofia',character=ch('pilota',pose='rilassata',expression='neutra'),companion=dict(animal='volpe',variant='rossa',pose='seduto')),
 'O_acropoli_foto_gufo':dict(mode='photo',scene='acropoli',name='Sofia',character=ch('esplorazione',pose='rilassata',expression='neutra'),companion=dict(animal='gufo',variant='comune',pose='posato')),
 'P_acropoli_nes_gufo':dict(mode='nes',scene='acropoli',name='Sofia',character=ch('esplorazione',pose='rilassata',expression='neutra'),companion=dict(animal='gufo',variant='comune',pose='posato')),
 'Q_pompei_foto_gatto':dict(mode='photo',scene='pompei',name='Sofia',character=ch('urbano',pose='rilassata',expression='neutra'),companion=dict(animal='gatto',variant='soriano',pose='in_piedi')),
 'R_pompei_nes_gatto':dict(mode='nes',scene='pompei',name='Sofia',character=ch('urbano',pose='rilassata',expression='neutra'),companion=dict(animal='gatto',variant='soriano',pose='in_piedi')),
 'S_taormina_foto_coniglio':dict(mode='photo',scene='taormina',name='Sofia',character=ch('neon',pose='rilassata',expression='neutra'),companion=dict(animal='coniglio',variant='grigio',pose='seduto')),
 'T_taormina_nes_coniglio':dict(mode='nes',scene='taormina',name='Sofia',character=ch('neon',pose='rilassata',expression='neutra'),companion=dict(animal='coniglio',variant='grigio',pose='seduto')),
 'U_casteldelmonte_foto_cane':dict(mode='photo',scene='casteldelmonte',name='Sofia',character=ch('pilota',pose='rilassata',expression='neutra'),companion=dict(animal='cane',variant='cucciolo',pose='seduto')),
 'V_casteldelmonte_nes_cane':dict(mode='nes',scene='casteldelmonte',name='Sofia',character=ch('pilota',pose='rilassata',expression='neutra'),companion=dict(animal='cane',variant='cucciolo',pose='seduto')),
 'W_castellobarletta_foto_drago':dict(mode='photo',scene='castellobarletta',name='Sofia',character=ch('esplorazione',pose='rilassata',expression='neutra'),companion=dict(animal='drago',variant='smeraldo',pose='seduto')),
 'X_castellobarletta_nes_drago':dict(mode='nes',scene='castellobarletta',name='Sofia',character=ch('esplorazione',pose='rilassata',expression='neutra'),companion=dict(animal='drago',variant='smeraldo',pose='seduto')),
}


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('jobs',nargs='*');parser.add_argument('--all-hd',action='store_true');args=parser.parse_args()
    OUT.mkdir(exist_ok=True);selected=args.jobs or list(JOBS);keep=set('ABDFHJL N P R T V X'.replace(' ',''));meta={}
    if (OUT/'_jobs.json').exists():meta=json.loads((OUT/'_jobs.json').read_text())
    for key in selected:
        job=normalise_job(JOBS[key]);started=time.perf_counter();im=compose(job,3000);path=OUT/(key+'.png');hd=args.all_hd or key[0] in keep
        if hd:path.write_bytes(png_bytes(im,job))
        else:path.unlink(missing_ok=True)
        small=im.resize((1200,800),Image.Resampling.NEAREST if job["mode"]=="nes" else Image.Resampling.LANCZOS);jpg=OUT/(key+'.jpg');small.save(jpg,quality=82,optimize=True,comment=credit_text(credit_for(job)).encode())
        meta[key]=dict(job=job,file='renders/'+path.name if hd else None,jpg='renders/'+jpg.name,seconds=round(time.perf_counter()-started,2),size=[3000,2000])
        print(key,meta[key]['seconds'],'HD PNG' if hd else 'HD rendered; attributed JPG kept',flush=True)
    (OUT/'_jobs.json').write_text(json.dumps(meta,ensure_ascii=False,indent=1)+'\n')

if __name__=='__main__':main()
