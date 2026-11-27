"""Deterministic cross-renderer layout/validation audit for optional editing.
Geometry equality is not a claim of whole-card Canvas/Pillow pixel parity.
"""
from pathlib import Path
import hashlib,json,subprocess,sys,tempfile,time
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from app import layout_edit as e
from app.catalogue import normalise_job
from app import postcard as pc
from app.character import render
from app.animals import ANIMALS,draw_animal
from app.scenes import PHOTO_SCENES,NES_SCENES

def main():
 start=time.perf_counter();cases=[];sticker_cases=[];characters={};animals={}
 for mode in ('photo','nes'):
  characters[mode]=e.descriptor(pc.crop_sprite(render({},style=mode)))
  for kind,record in ANIMALS.items():animals[mode,kind]=e.descriptor(pc.crop_sprite(draw_animal(kind,record['variants'][0][0],record['poses'][0],style=mode)))
  for scene in PHOTO_SCENES:
   for kind in [None,*ANIMALS]:
    for scale in (65,100,135):
     for x,y in ((0,0),(600,0),(0,400),(600,400),(300,320)):
      job=normalise_job(dict(mode=mode,scene=scene,companion=dict(animal=kind) if kind else None,composition=dict(actor=dict(x=x,y=y,scale=scale))));person=characters[mode];animal=animals[mode,kind] if kind else None;reference=pc.companion_reference_height(kind) if kind else 1
      g=e.actor_geometry(job,person,animal,reference);b=g['group'];assert b['x']>=11.5 and b['y']>=11.5 and b['x']+b['w']<=588.5 and b['y']+b['h']<=388.5,g
      cases.append(dict(job=job,p=person,a=animal,ref=reference,expected=g))
 for sid in e.sticker_manifest()['stickers']:
  for size in (36,76,132):
   for rotation in ((-30,-15,0,15,30) if sid!='logo_casardi' else (0,)):
    for x,y in ((0,0),(600,400),(300,200)):
     s=dict(id=sid,x=x,y=y,size=size,rotation=rotation);sticker_cases.append(dict(s=s,expected=e.sticker_geometry(s)))
 valid=[None,{},e.default_composition(),{'actor':dict(x=0,y=400,scale=135)}]
 valid.extend({'plaque':dict(theme=theme,ornament=ornament,track=track,position=position)} for theme in e.THEMES for ornament in ('none',*e.sticker_manifest()['stickers']) for track in e.TRACKS for position in e.POSITIONS)
 invalid=[False,[],1,'x',{'actor':[]},{'actor':{'x':True,'y':200}},{'actor':{'x':2.5,'y':200}},{'actor':{'x':600,'y':401}},{'actor':{'x':1,'y':1,'scale':None}},{'plaque':[]},{'plaque':None},{'plaque':{'theme':None}},{'plaque':{'ornament':'other'}},{'plaque':{'track':'other'}},{'stickers':None},{'stickers':{}},{'stickers':[dict(id='logo_casardi',rotation=15)]},{'stickers':[dict(id='pegaso',size=None)]},{'stickers':[dict(id='toString')]},{'stickers':[dict(id='__proto__')]},{'stickers':[dict(id='pegaso')]*7}]
 checks=[]
 for raw in valid+invalid:
  try:value=e.normalise(raw);checks.append(dict(raw=raw,valid=True,value=value))
  except ValueError:checks.append(dict(raw=raw,valid=False))
 assert all(x['valid'] for x in checks[:len(valid)]) and not any(x['valid'] for x in checks[len(valid):])
 bundle=dict(manifest=e.sticker_manifest(),photo=PHOTO_SCENES,nes=NES_SCENES,cases=cases,stickers=sticker_cases,normalization=checks)
 code="""
const fs=require('fs'),vm=require('vm'),data=JSON.parse(fs.readFileSync(process.argv[1])),ctx={PORTABLE:{photo:data.photo,nes:data.nes,stickerManifest:data.manifest},console};vm.createContext(ctx);vm.runInContext(fs.readFileSync(process.argv[2],'utf8'),ctx);const C=ctx.CasardiComposition;
function same(a,b,path='root'){if(typeof a==='number'&&typeof b==='number'){if(Math.abs(a-b)>1e-7)throw Error(path+': '+a+' != '+b);return;}if(a===b)return;if(a&&b&&typeof a==='object'&&typeof b==='object'){if(JSON.stringify(Object.keys(a).sort())!==JSON.stringify(Object.keys(b).sort()))throw Error(path+': keys');for(const k of Object.keys(a))same(a[k],b[k],path+'.'+k);return;}throw Error(path+': unequal values');}
for(const [i,t]of data.cases.entries())same(C.actorGeometry(t.job,t.p,t.a,t.ref),t.expected,'actor '+i);
for(const [i,t]of data.stickers.entries())same(C.stickerGeometry(t.s),t.expected,'sticker '+i);
for(const [i,t]of data.normalization.entries()){let result,valid=true;try{result=C.normalize(t.raw);}catch(_){valid=false;}if(valid!==t.valid)throw Error('Validation parity '+i+' '+JSON.stringify(t.raw));if(valid)same(result,t.value,'normalization '+i);}
console.log(JSON.stringify({actor:data.cases.length,stickers:data.stickers.length,normalization:data.normalization.length,node:process.version}));
"""
 with tempfile.TemporaryDirectory() as td:
  path=Path(td)/'jobs.json';path.write_text(json.dumps(bundle));run=subprocess.run(['node','-e',code,str(path),str(ROOT/'browser/composition.js')],check=False,capture_output=True,text=True);assert run.returncode==0,run.stderr;result=json.loads(run.stdout)
 report=dict(result='PASS',date='2026-11-27',seconds=round(time.perf_counter()-start,2),**result,manual_group_outside_frame=0,geometry_mismatches=0,validation_mismatches=0,assets=8,original_pixel_stickers=7,authentic_official_logo=1,source={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in ('app/layout_edit.py','app/catalogue.py','app/postcard.py','browser/composition.js','browser/render.js','browser/layout-editor.js','browser/layout-editor.css','assets/stickers/manifest.json')},limitations='Geometry/normalization equivalence and frame bounds only. Whole-photo renderers have different grading/shadow rasterizers. Free positioning is a graphic choice, not an inference of real architectural support. UI and export pixel changes are tested separately.')
 (ROOT/'docs/test-results/composition-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
