"""Import selected revised pixel backgrounds from their AI-assisted work masters.

The delivered assets/nes/<scene>.png are the canonical editable native sources.
No generative model, photograph filter or network request runs in the app.
Optional maintainer re-import: python scripts/import_nes_art.py --masters DIR
Work masters are not runtime dependencies. Source/reference hashes and honest
AI-assisted provenance are recorded in assets/nes/manifest.json.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import sys
import numpy as np
from PIL import Image,ImageDraw,ImageOps
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from app.credits import png_bytes

NOTES={
 'casardi':('Facciata razionalista asimmetrica, avancorpo lapideo, due piani di finestre alte, prospetto laterale e piazzale pavimentato.','Upper-left golden light; quiet sky above the real asymmetrical rationalist school, detailed limestone/stucco, teal windows, paved empty forecourt.'),
 'pantheon':('Parete curva, colonne corinzie, edicole, cornici, parte della cupola e pavimento a intarsi; non il portico esterno.','Curved Pantheon interior, Corinthian columns, alternating aedicules, coloured marble inlays, warm indirect light, empty foreground floor.'),
 'foro':('Arco di Tito a un fornice, attico, capitelli, intradosso e Via Sacra; pini a ombrello e olivo. Nessuna falsa iscrizione.','Single Arch of Titus, correctly observed attic and relief frieze, Via Sacra paving, umbrella pine and olive, open central foreground.'),
 'epidauro':('Vista dal piano dell’orchestra: cavea semicircolare, file di sedute, scale radiali, diazoma e crinale alberato.','Theatre of Epidaurus from orchestra level, elliptical curved stone seating and radial aisles, wooded ridge, empty sandy orchestra.'),
 'biblioteca':('Aula del Nuti: corridoio centrale, tre navate, volte a crociera, tiranti, colonne, plutei e rosone di fondo.','Real Aula del Nuti, symmetrical aisle, groin vaults, iron tie rods, historic chained-book lecterns, terracotta floor and amber lateral light.'),
 'paestum':('Hera II: sei colonne doriche sulla fronte, colonnato laterale, trabeazione, timpano superstite e gradini.','Hera II at Paestum in the reference three-quarter view, six stocky Doric front columns, long side colonnade, worn limestone, open grassy forecourt.'),
 'colosseo':('Colosseo a tre ordini di arcate e attico, anello esterno superstite a sinistra e profilo interrotto; crepuscolo e piazzale.', 'Real Colosseum exterior at blue hour, descending broken outer ring, amber-lit Roman arcades, broad stone forecourt.'),
 'acropoli':('Fronte orientale e colonnato laterale del Partenone, stilobate e trabeazione lacunosa; rocce dell’Acropoli.', 'East Parthenon three-quarter view, Doric peristyle, damaged roof and pediment, honey marble and open limestone path.'),
 'pompei':('Foro di Pompei: colonnato e trabeazione frammentaria, basi in laterizio, selciato e profilo del Vesuvio.', 'Fragmentary Pompeii Forum colonnade receding from left, Roman paving, russet low walls and hazy Vesuvius.'),
 'taormina':('Cavea curva con scale radiali, orchestra, resti della scena in laterizio e rilievi di Taormina; terrazza anteriore illustrativa.', 'Ancient theatre from upper cavea, radial stairs and curved stone seating, brick stage remains, Sicilian rocky hills and safe empty visitor terrace.'),
 'casteldelmonte':('Massa ottagonale, torri angolari ottagonali, portale con timpano e bifore; macchia mediterranea e sentiero.', 'Federician octagonal Castel del Monte with octagonal corner towers, flat tops, real Gothic windows and entrance portal, limestone approach path.'),
 'castellobarletta':('Volumi massicci e bastionati, cortine lapidee, fossato asciutto, piccolo ponte di ingresso e piazzale anteriore.', 'Real Renaissance Barletta fortress with broad limestone volumes and angular bastions, dry green moat and paved empty forecourt.'),
}

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--masters',type=Path,required=True);p.add_argument('--scenes',nargs='+',choices=list(NOTES),help='Only import these scenes; retain other canonical PNGs byte-for-byte.');args=p.parse_args()
 metadata=json.loads((ROOT/'assets/photos/photo_metadata.json').read_text())
 out=ROOT/'assets/nes';out.mkdir(exist_ok=True);old=out/'manifest.json';prior=json.loads(old.read_text()) if old.exists() else {};records=prior.get('scenes',{})
 for sid in (args.scenes or list(NOTES)):
  landmarks,brief=NOTES[sid]
  source=args.masters/(sid+'-master.png');raw=source.read_bytes()
  with Image.open(source) as master:
   size=list(master.size)
   im=ImageOps.fit(master.convert('RGB'),(600,400),method=Image.Resampling.LANCZOS,centering=(.5,.5))
  if sid=='foro':
   # The model's pseudo-inscription is not allowed to become invented lettering.
   # Redraw only the recessed panel with stone-colour clusters, keeping its rim.
   d=ImageDraw.Draw(im);d.rectangle((227,61,351,98),fill='#d9b987')
   d.line((228,62,350,62),fill='#c2a273',width=1)
   rng=np.random.default_rng(2711)
   colors=['#d0b17e','#e4c994','#ceb17c','#d8bb8c']
   for _ in range(53):
    x=int(rng.integers(229,348));y=int(rng.integers(65,96));w=int(rng.integers(1,5))
    d.rectangle((x,y,min(349,x+w),y+int(rng.integers(0,2))),fill=colors[int(rng.integers(0,len(colors)))])
  indexed=im.quantize(colors=64,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
  job=dict(mode='nes',scene=sid);path=out/(sid+'.png');path.write_bytes(png_bytes(indexed,job))
  m=metadata[sid]
  records[sid]=dict(path=path.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
    dimensions=[600,400],palette_colors=len(indexed.getcolors()),alpha='Opaque; no photographic layer',
    reference_photo=m['page'],reference_local_sha256=m['local_sha256'],reference_license=m['lic'],reference_license_url=m['licurl'],
    reference_author=('Autore non identificato (archivio storico)' if sid=='casardi' else m['artist']),landmarks=landmarks,generation_brief=brief,
    work_master_sha256=hashlib.sha256(raw).hexdigest(),work_master_dimensions=size,
    creation='AI-assisted architectural repaint using the licensed reference photograph; new illustrated pixels, not a quantized source photo. Art direction and native pixel/palette finishing in this project.',
    finishing='Centre-crop to 3:2; native 600x400; 64-colour median-cut palette without diffusion dither; no runtime scaling filter.' + (' Foro: pseudo-inscription removed and stone panel repainted.' if sid=='foro' else ''),
    license='CC BY-SA 4.0 adaptation; preserve rights and attribution of the reference photograph. No claim of exclusive copyright over AI-generated elements.')
  print(sid,indexed.size,len(indexed.getcolors()),path.stat().st_size,flush=True)
 manifest=dict(retained_from_3_1=prior.get('retained_from_3_1',{}),version='3.2 Dodici luoghi',date='2026-11-27',native_grid=[600,400],export_scale=5,
  disclosure='Twelve AI-assisted pixel-art illustrations, not handwritten drawings and not documentary photographs. Licensed architectural references retained; no commercial-game assets. Not an emulation of original NES hardware palette/tile limits.',
  runtime='Only these local native PNGs; no generation, Internet, external models, master files or source photographs needed to draw the NES background.',
  palette='At most 64 colours per background; the independently licensed LPC characters retain their own palettes.',scenes=records)
 (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':main()
