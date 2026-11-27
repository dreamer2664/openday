"""Measure actual native sprite changes and catch duplicate/inert options.

This complements (does NOT replace) UI interaction tests. A reference context
uncovers the relevant part. Separate outfit contexts measure occlusion, report
zero-pixel alternatives and verify they would be disabled by the UI contract.
Tiny, real facial differences are not advertised as new character anatomies.
"""
from pathlib import Path
import hashlib
import itertools
import json
import sys
import time
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from app.catalogue import CHOICES,COLOR_FIELDS,normalise_character
from app.character import default_spec,render,COMPATIBILITY
from app.control_effects import apply_field,assess,visible_diff,values_for
from app.imgutil import to_pil


def digest(c):
    return hashlib.sha256(bytes(v for p in c.buf for v in (p if p[3] else (0,0,0,0)))).hexdigest()


def reference(field):
    s=default_spec()
    if field in ('face','eye_shape','eyes','brows','nose','mouth','expression'):
        s.update(hair='rasati',hat='none',glasses='none',beard='none',expression='neutra')
    if field in ('top','top_color','inner_color'):
        s.update(build='medio',top='cyber_jacket',held='none',pose='rilassata')
    if field in ('bottom','bottom_color','belt_color'):
        s.update(top='tshirt',shoes='sandali',bottom='cargo')
    if field in ('shoes','shoes_color'):
        s.update(top='tshirt',bottom='shorts')
    if field=='hat_color':s['hat']='berretto'
    if field=='accessory_color':s['accessory']='zaino'
    return normalise_character(s)


def main():
    start=time.perf_counter();checks=[];comparisons=0;failures=[];strips=[]
    for field in [*CHOICES,*COLOR_FIELDS]:
        s=reference(field);values=values_for(field)
        if field=='accessory_color':values=[v for v in values if v not in ('oro','argento','bronzo','rame')]
        groups={};base=render(s);changes=[]
        for value in values:
            n=apply_field(s,field,value)
            allowed=COMPATIBILITY.get(field,{}).get(value)
            if allowed and s['build'] not in allowed:continue
            c=render(n);groups.setdefault(digest(c),[]).append(value)
            changes.append(dict(value=value,changed_native_pixels=visible_diff(base,c)));comparisons+=1
        duplicates=[v for v in groups.values() if len(v)>1]
        if duplicates:failures.append(dict(field=field,duplicates=duplicates))
        checks.append(dict(field=field,result='FAIL' if duplicates else 'PASS',values=len(changes),minimum_nonzero_change=min((v['changed_native_pixels'] for v in changes if v['changed_native_pixels']),default=0),reference={k:s[k] for k in ('build','top','bottom','hair','hat','expression','accessory')},changes=changes,duplicate_groups=duplicates))
    # The UI offers metal colours only on the necklace, not on fabric bags.
    for acc,values in [('collana',['oro','argento','bronzo','rame'])]:
        hashes=[digest(render(apply_field({**default_spec(),'accessory':acc},'accessory_color',v))) for v in values]
        assert len(set(hashes))==len(values);comparisons+=len(values)
    contexts=[];zero=0
    outfits=[{},dict(hat='cappuccio'),dict(hat='berretto'),dict(expression='sorriso'),dict(expression='entusiasta'),dict(glasses='visore'),dict(glasses='sole'),dict(hair='calvo'),dict(beard='barba_lunga'),dict(build='medio',top='cappotto'),dict(build='medio',top='trench'),dict(bottom='gonna_lunga'),dict(held='libro',pose='libro')]
    for i,patch in enumerate(outfits):
        s=normalise_character({**default_spec(),**patch});fieldsets=[list(CHOICES)[j:j+12] for j in range(0,len(CHOICES),12)]+[list(COLOR_FIELDS)]
        blocked={};tested=0
        for fields in fieldsets:
            for field,r in assess(s,fields).items():
                unavailable=[v for v,n in r['pixels'].items() if n==0 and v!=s[field]]
                if unavailable:blocked[field]=dict(values=unavailable,reveal=r['reveal']);zero+=len(unavailable)
                tested+=len(r['pixels']);comparisons+=len(r['pixels'])
        contexts.append(dict(context=i,patch=patch,options_measured=tested,zero_pixel_alternatives=blocked))
    # Shared hats each have an actually effective colour; no fake headphones control.
    hat_checks=[]
    for hat in ('cuffie','berretto','bandana','cappuccio'):
        s={**default_spec(),'hat':hat};hashes=[digest(render(apply_field(s,'hat_color',v))) for v in values_for('hat_color')]
        assert len(set(hashes))==len(hashes),hat;comparisons+=len(hashes);hat_checks.append(dict(hat=hat,colours=len(hashes),result='PASS'))
    # Direct, legible side-by-side actual-pixel evidence, no promotional redraw.
    cases=[('PANTALONI / SHORTS',dict(top='tshirt',bottom='jeans',shoes='sandali'),dict(top='tshirt',bottom='shorts',shoes='sandali')),
           ('DENIM / BLU NOTTE',dict(bottom_color='jeans-scuro'),dict(bottom_color='navy')),
           ('OCCHI CLASSICI / TONDI',dict(hair='rasati',eye_shape='classici'),dict(hair='rasati',eye_shape='tondi')),
           ('LABBRA SOTTILI / PIENE',dict(hair='rasati',mouth='sottili'),dict(hair='rasati',mouth='piene')),
           ('CUFFIE ROSSE / AZZURRE',dict(hat='cuffie',hat_color='rosso'),dict(hat='cuffie',hat_color='azzurro')),
           ('CINTURA CUOIO / BLU',dict(top='tshirt',belt_color='cuoio'),dict(top='tshirt',belt_color='blu'))]
    sheet=Image.new('RGB',(1200,1260),'#131b2f');d=ImageDraw.Draw(sheet);font=ImageFont.truetype(str(ROOT/'assets/fonts/EBGaramond.ttf'),20)
    for i,(label,left,right) in enumerate(cases):
        x=i%3*400;y=i//3*630;d.text((x+12,y+10),label,font=font,fill='#ffe0a4')
        for k,patch in enumerate((left,right)):
            c=render({**default_spec(),**patch});im=to_pil(c);im=im.crop((18,8,46,36)) if i in (2,3) else im
            scale=6 if i in (2,3) else 3;im=im.resize((im.width*scale,im.height*scale),Image.Resampling.NEAREST)
            sheet.paste(im,(x+k*200+4,y+60),im)
        d.text((x+12,y+275),'Differenze: '+str(visible_diff(render({**default_spec(),**left}),render({**default_spec(),**right})))+' pixel nativi',font=font,fill='#d6deeb')
    sheet=sheet.crop((0,0,1200,970));sheet.save(ROOT/'docs/qa/11_controlli_effettivi.png',optimize=True)
    report=dict(result='FAIL' if failures else 'PASS',date='2026-11-27',revision='3.2',comparisons=comparisons,reference_fields=checks,hat_colours=hat_checks,outfit_contexts=contexts,zero_pixel_alternatives_measured=zero,failures=failures,seconds=round(time.perf_counter()-start,2),method='Actual composited 64×64 RGBA comparison; transparent RGB ignored; pairwise unique visible reference-context results; occluded alternatives explicitly reported, not counted as successful visual changes.',limitations='Pixel differences establish a real effect, not perceptual equality or artistic quality. Face details change only a few native pixels; UI includes a nearest-neighbour close-up. UI interaction coverage is separate.',sources={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'app/character.py',ROOT/'app/cyber_layers.py',ROOT/'app/control_effects.py',ROOT/'assets/characters/lpc/manifest.json']})
    (ROOT/'docs/test-results/control-effects-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ('reference_fields','outfit_contexts','sources')},ensure_ascii=False,indent=2));assert not failures,failures

if __name__=='__main__':main()
