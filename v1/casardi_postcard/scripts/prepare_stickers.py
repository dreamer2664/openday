"""Maintainer import of seven original AI-assisted pixel stickers and an authentic school logo.
Masters are optional build-time inputs, never needed at runtime. No school logo is generated.
"""
from pathlib import Path
import argparse,hashlib,json
from PIL import Image,ImageDraw,ImageFont,PngImagePlugin
ROOT=Path(__file__).resolve().parent.parent
LABELS={'alloro':'Corona d’alloro','pegaso':'Pegaso alato','lira':'Lira classica','libro':'Libro aperto','teatro':'Maschere teatrali','capitello':'Capitello ionico','astrolabio':'Rosa dei venti','logo_casardi':'Logo ufficiale Casardi'}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--masters',type=Path,required=True);p.add_argument('--official',type=Path,required=True);p.add_argument('--source-pdf',type=Path,required=True);args=p.parse_args()
 out=ROOT/'assets/stickers';out.mkdir(exist_ok=True);records={}
 for sid,label in LABELS.items():
  if sid=='logo_casardi':continue
  path=args.masters/(sid+'.png');im=Image.open(path).convert('RGBA');px=im.load()
  for y in range(im.height):
   for x in range(im.width):
    r,g,b,a=px[x,y]
    if r>140 and b>130 and g<min(r,b)*.68:px[x,y]=(0,0,0,0)
  im=im.crop(im.getbbox());im.thumbnail((88,88),Image.Resampling.NEAREST)
  c=Image.new('RGBA',(96,96));c.alpha_composite(im,((96-im.width)//2,(96-im.height)//2));c=c.quantize(colors=64,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).convert('RGBA')
  meta=PngImagePlugin.PngInfo();meta.add_itxt('Title',label);meta.add_itxt('Description','Sticker originale assistito da IA, rifinito su griglia nativa 96 × 96. Nessun logo o asset commerciale.');meta.add_itxt('Copyright','CC0 1.0 nella misura dei diritti disponibili; nessuna esclusiva sugli elementi generati automaticamente.')
  dst=out/(sid+'.png');c.save(dst,optimize=True,pnginfo=meta)
  records[sid]=dict(label=label,paths={'photo':str(dst.relative_to(ROOT)),'nes':str(dst.relative_to(ROOT))},sha256={'photo':sha(dst),'nes':sha(dst)},size=list(c.size),origin='Original AI-assisted sticker; pixel-grid finishing and magenta-key removal',license='CC0 1.0, to the extent rights are available',license_url='https://creativecommons.org/publicdomain/zero/1.0/',master_sha256=sha(path),rotation=True)
 # Preserve the real source image rather than trace, invent or recolour the mark.
 src=args.official;logo=Image.open(src).convert('RGB');dst=out/'logo_casardi.png'
 meta=PngImagePlugin.PngInfo();meta.add_itxt('Title',LABELS['logo_casardi']);meta.add_itxt('Source','https://www.liceocasardi.edu.it/wp-content/uploads/2025/12/POF-26-27-Liceo-Casardi-Brochure.pdf');meta.add_itxt('Copyright','Liceo Alfredo Casardi, Barletta. CC BY 4.0 secondo note legali del sito, salvo diritti distinti. Nessun diritto di marchio o approvazione implicita.');meta.add_itxt('Description','Immagine estratta dalla brochure ufficiale 2026/27, pagina 1. Versione fotografica: nessun ridisegno o ricolorazione, sfondo bianco conservato. Il Pegaso/alloro/capitello coincide con l’intestazione scolastica del novembre 2026. Non è lo stemma della Repubblica.')
 logo.save(dst,optimize=True,pnginfo=meta)
 small=logo.copy();small.thumbnail((96,96),Image.Resampling.NEAREST);small=small.quantize(colors=64,dither=Image.Dither.NONE);n=out/'logo_casardi-nes.png';small.save(n,optimize=True,pnginfo=meta)
 records['logo_casardi']=dict(label=LABELS['logo_casardi'],paths={'photo':str(dst.relative_to(ROOT)),'nes':str(n.relative_to(ROOT))},sha256={'photo':sha(dst),'nes':sha(n)},size=list(logo.size),origin='Embedded image extracted from first page of official school brochure, not recreated',source_pdf='https://www.liceocasardi.edu.it/wp-content/uploads/2025/12/POF-26-27-Liceo-Casardi-Brochure.pdf',source_pdf_sha256=sha(args.source_pdf),extracted_source_sha256=sha(src),corroboration='https://www.liceocasardi.edu.it/wp-content/uploads/2026/11/2_ATTO_DINDIRIZZO_2025_28_integrazione.docx.pdf.pades-2.pdf',license='CC BY 4.0 under the school site legal notice; trademark and third-party rights reserved',license_url='https://creativecommons.org/licenses/by/4.0/',legal_notice='https://www.liceocasardi.edu.it/note-legali/',attribution='Liceo Classico – Scienze Umane – Musicale Alfredo Casardi, Barletta; brochure ufficiale 2026/27, pagina 1. Estrazione e ridimensionamento; versione NES ridotta su griglia. Nessuna approvazione dell’istituto implicita.',rotation=False)
 manifest=dict(version='3.3',date='2026-11-27',disclosure='Seven original AI-assisted pixel stickers; the official school logo is authentic and NOT AI-generated. Empty selection by default.',stickers=records)
 (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 sheet=Image.new('RGB',(960,530),'#101426');d=ImageDraw.Draw(sheet);font=ImageFont.truetype(str(ROOT/'assets/fonts/EBGaramond.ttf'),19)
 for i,(sid,v) in enumerate(records.items()):
  im=Image.open(ROOT/v['paths']['photo']).convert('RGBA');im.thumbnail((174,206),Image.Resampling.NEAREST);x=i%4*240+(240-im.width)//2;y=i//4*265+15;sheet.paste(im,(x,y),im);d.text((i%4*240+17,i//4*265+230),v['label'],fill='#f5edda',font=font)
 sheet.save(ROOT/'docs/qa/14_sticker.jpg',quality=86,optimize=True)
 print('Prepared',len(records),'stickers. Real school logo preserved, seven originals disclosed.')
if __name__=='__main__':main()
