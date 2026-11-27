"""Build the ONE self-contained, responsive HTML for both PC and phones.

Usage (maintainers only): python scripts/build_standalone.py
End users only open the generated HTML. No installation/build/runtime network.
The server edition remains separate; /telefono serves this same complete file.
"""
from __future__ import annotations
import base64
import hashlib
import io
import shutil
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from PIL import Image
from fontTools import subset
from fontTools.ttLib import TTFont
from app.catalogue import public_catalogue,COLORS,COLOR_FIELDS
from app.credits import photo_metadata
from app.postcard import photo_background
from app.scenes import PHOTO_SCENES,NES_SCENES
from scripts.sprite_to_js import generate
from scripts.lpc_bundle import bundle

OUTPUT=ROOT/'Cartolina_Casardi_PC_e_Telefono.html'

def sha(data):return hashlib.sha256(data).hexdigest()
def uri(data,mime):return 'data:'+mime+';base64,'+base64.b64encode(data).decode('ascii')
def photo_bytes(path):
    with Image.open(path) as im:
        im=im.convert('RGB');im.thumbnail((3000,3000),Image.Resampling.LANCZOS)
        buf=io.BytesIO();im.save(buf,'JPEG',quality=86,optimize=True,subsampling=2)
        return buf.getvalue(),im.size

def font_bytes(path,rename=None):
    font=TTFont(path,recalcTimestamp=False)
    opts=subset.Options();opts.layout_features=['*'];opts.name_IDs=['*'];opts.name_legacy=True
    sub=subset.Subsetter(options=opts);sub.populate(unicodes=range(0x0530));sub.subset(font)
    if rename:
        # Press Start 2P has a Reserved Font Name. This modified subset is
        # renamed internally; originals and their complete OFL remain intact.
        names={1:rename,2:'Regular',3:'CasardiPixel-2026',4:rename,6:rename.replace(' ',''),16:rename,17:'Regular',18:rename}
        for rec in font['name'].names:
            if rec.nameID in names:rec.string=names[rec.nameID].encode(rec.getEncoding())
        for key,value in names.items():font['name'].setName(value,key,3,1,0x409)
    font.flavor='woff';buf=io.BytesIO();font.save(buf);return buf.getvalue()

def main():
    for name in ('layout-editor.js','layout-editor.css'):shutil.copyfile(ROOT/'browser'/name,ROOT/'web/static'/name)
    sprites=generate(ROOT);(ROOT/'browser/sprites.js').write_text(sprites,encoding='utf-8')
    lpc,lpc_credits=bundle()
    cat=public_catalogue(600,'browser-3.3')
    for item in cat['scenes']:item.pop('thumbs',None)
    data=dict(version='3.3',lpc=lpc,lpcCredits=lpc_credits,date='2026-11-27',catalogue=cat,palette=COLORS,
              colorFields={k:list(dict.fromkeys(c[0] for c in v)) for k,v in COLOR_FIELDS.items()},
              photo=PHOTO_SCENES,nes=NES_SCENES,nesArt=json.loads((ROOT/'assets/nes/manifest.json').read_text()),metadata=photo_metadata(),images={},thumbs={},examples={},licenses={})
    report=dict(date='2026-11-27',file=OUTPUT.name,editions='One responsive standalone HTML: full desktop and touch-phone creator.',
                renderer='Independent JavaScript + Canvas; artist-drawn LPC indexed atlases + translated original equipment/animals; no Python runtime.',
                photos={},fonts={},nes_art='Twelve AI-assisted architectural paintings, native 600x400, 64 colours each; canonical PNG hashes and references in assets/nes/manifest.json.',runtime_network='None',visitor_storage='Memory of the open page only; no project persistence.',
                qr='AVVIA_CARTOLINA_WINDOWS.exe serves this full HTML and hosts its actual finished PNG via temporary LAN URL. Raw standalone HTML exports locally without hosting other devices.',lpc_commit=lpc['commit'],lpc_parts=len(lpc['parts']),lpc_pose_atlases=len(lpc['atlases']))
    data['stickerManifest']=json.loads((ROOT/'assets/stickers/manifest.json').read_text())
    data['stickerImages']={sid:{mode:uri((ROOT/record['paths'][mode]).read_bytes(),'image/png') for mode in ('photo','nes')} for sid,record in data['stickerManifest']['stickers'].items()}
    data['licenses']['Logo Casardi — fonte e ambito del riuso']=(ROOT/'assets/stickers/FONTE_LOGO_E_LICENZA.txt').read_text()
    report['stickers']={sid:record['sha256'] for sid,record in data['stickerManifest']['stickers'].items()}
    for sid,cfg in PHOTO_SCENES.items():
        source=ROOT/cfg['photo'];raw,size=photo_bytes(source);nes=(ROOT/'assets/nes'/(sid+'.png')).read_bytes()
        data['images'][sid]={'photo':uri(raw,'image/jpeg'),'nes':uri(nes,'image/png')}
        thumb=photo_background(sid,420)[0];b=io.BytesIO();thumb.save(b,'JPEG',quality=82,optimize=True)
        data['thumbs'][sid]={'photo':uri(b.getvalue(),'image/jpeg'),'nes':uri(nes,'image/png')}
        report['photos'][sid]=dict(source_sha256=sha(source.read_bytes()),embedded_sha256=sha(raw),
            embedded_bytes=len(raw),embedded_dimensions=size,processing='JPEG quality 86, 4:2:0, max side 3000; no upscaling of the embedded source; Canvas crops/scales/grades at rendering time.')
    for mode,path in [('photo','web/static/examples/style-photo.jpg'),('nes','web/static/examples/style-nes.png')]:
        data['examples'][mode]=uri((ROOT/path).read_bytes(),'image/jpeg' if mode=='photo' else 'image/png')
    font_css=[]
    for family,filename,rename in [('Cinzel','Cinzel.ttf',None),('Garamond','EBGaramond.ttf',None),('Pixel','PressStart2P-Regular.ttf','Casardi Pixel')]:
        p=ROOT/'assets/fonts'/filename;raw=font_bytes(p,rename)
        font_css.append('@font-face{font-family:"'+family+'";src:url("'+uri(raw,'font/woff')+'") format("woff");font-style:normal;font-weight:100 900;font-display:swap;}')
        report['fonts'][filename]=dict(source_sha256=sha(p.read_bytes()),embedded_sha256=sha(raw),bytes=len(raw),
            processing='WOFF1 subset U+0000–U+052F; layout features and copyright/license preserved.',internal_name=rename or 'Original family name; no Reserved Font Name declared in its OFL notice.')
    for p in sorted((ROOT/'assets/licenses').glob('*.txt')):data['licenses'][p.stem]=p.read_text(encoding='utf-8')
    for p in sorted((ROOT/'assets/fonts').glob('OFL-*.txt')):data['licenses'][p.stem]=p.read_text(encoding='utf-8')
    data['licenses']['MIT — codice originale']=(ROOT/'LICENSE').read_text(encoding='utf-8')
    css=(ROOT/'browser/interface.css').read_text(encoding='utf-8').replace('/*__FONTS__*/','\n'.join(font_css))+'\n'+(ROOT/'browser/layout-editor.css').read_text()
    template=(ROOT/'browser/interface.html').read_text(encoding='utf-8')
    bootstrap="const PORTABLE=JSON.parse(document.getElementById('embedded-data').textContent);document.getElementById('embedded-data').remove();\n"
    fields={'/*__CSS__*/':css,'/*__DATA__*/':json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/'),
            '/*__SPRITES__*/':bootstrap+sprites,'/*__RENDER__*/':(ROOT/'browser/composition.js').read_text()+'\n'+(ROOT/'browser/render.js').read_text(encoding='utf-8')+'\n'+(ROOT/'browser/layout-editor.js').read_text(),
            '/*__BRIDGE__*/':(ROOT/'browser/bridge.js').read_text(encoding='utf-8'),
            '/*__APP__*/':(ROOT/'browser/app.js').read_text(encoding='utf-8')}
    for marker,value in fields.items():
        assert template.count(marker)==1,marker
        template=template.replace(marker,value)
    assert '/*__' not in template
    OUTPUT.write_text(template,encoding='utf-8')
    report.update(bytes=OUTPUT.stat().st_size,sha256=sha(OUTPUT.read_bytes()))
    (ROOT/'docs/test-results/standalone-build.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k not in ('photos','fonts')},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
