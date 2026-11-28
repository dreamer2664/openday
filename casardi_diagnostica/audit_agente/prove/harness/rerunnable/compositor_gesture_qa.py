"""NON-RELEASE visual check of real held CDP touch gestures.
Unlike DOM-only drag tests this compares actual browser screenshots with an
independently laid-out static clean+ghost reference at current and old positions.
The same existing renderer's layer pixels are used, NOT an independent renderer.
Original/A1/Canvas sources are unchanged. Linux software GPU is not Android.
"""
import asyncio,argparse,base64,hashlib,io,json,math,time,traceback
from datetime import datetime,timezone
from pathlib import Path
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright,expect
C=Path('/home/user/.cache/casardi-rootcause');H=Path('/home/user')
sha=lambda b:hashlib.sha256(b).hexdigest()
def array(raw):
 with Image.open(io.BytesIO(raw)) as im:return np.asarray(im.convert('RGB'),dtype=np.int16)
def at(bb,delta):return {**bb,'x':bb['x']+delta[0],'y':bb['y']+delta[1]}
async def main(smoke=False):
 started=time.time();stamp=datetime.now(timezone.utc).isoformat();rows=[];errors=[];engines=[];failure=None;contacts=0
 name='compositor-gesture-smoke' if smoke else 'compositor-gesture'
 captures=C/(name+'-captures');captures.mkdir(exist_ok=True)
 source_sha256={k:sha(p.read_bytes()) for k,p in {'production':H/'Cartolina_Casardi_PC_e_Telefono.html','A1':H/'Cartolina_Casardi_DIAGNOSTICA_ANDROID_A1.html','Canvas':C/'canvas-experiment/canvas-preview.html'}.items()}
 async with async_playwright() as pw:
  try:
   for engine in (['headless-shell'] if smoke else ['headless-shell','headed-swiftshader']):
    opt=dict(headless=engine=='headless-shell',args=['--no-sandbox','--disable-dev-shm-usage'])
    if engine=='headed-swiftshader':opt.update(channel='chromium',args=opt['args']+['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    browser=await pw.chromium.launch(**opt)
    try:
     session=await browser.new_browser_cdp_session();info=await session.send('SystemInfo.getInfo');engines.append(dict(label=engine,browser_version=browser.version,devices=info['gpu']['devices'],feature_status=info['gpu']['featureStatus'],aux_attributes=info['gpu'].get('auxAttributes',{})))
     for variant in (['production'] if smoke else ['production','A1','Canvas']):
      for mode in ['photo','nes']:
       for preset in ([0] if smoke else [0,1,2,3]):
        label=f'{engine}/{variant}/{mode}/preset{preset}';samples=[]
        # Bound browser-native caches/process retention between heavy 24 MB
        # documents. A previous route-fulfilled smoke crashed on document two;
        # its cause was not established and that FAIL is preserved separately.
        if rows:
         await browser.close();browser=await pw.chromium.launch(**opt)
        ctx=await browser.new_context(**pw.devices['Pixel 7']);p=await ctx.new_page();p.set_default_timeout(45000);p.on('pageerror',lambda e:errors.append(str(e)))
        # Exact byte content served directly, avoiding large route-fulfill IPC
        # buffers. No injected listeners/state APIs; only existing A1 diagnostics.
        query='&a1=1' if variant=='A1' else '&exp=1' if variant=='Canvas' else ''
        await p.goto('http://127.0.0.1:8092/?nested=1'+query);f=p.frames[-1]
        for _ in range(8):
         try:await expect(f.locator('#start')).to_be_enabled(timeout=1000);break
         except AssertionError:f=p.frames[-1]
        await expect(f.locator('#start')).to_be_enabled(timeout=60000)
        await f.locator('#start').tap();await f.locator('[data-mode='+mode+']').tap();await f.locator('[data-scene=pantheon]').tap();await f.locator('#next').tap();await f.locator('.preset-grid button').nth(preset).tap();await f.locator('#next').tap();await f.locator('#next').tap()
        cdp=await ctx.new_cdp_session(p)
        async def ready():await expect(f.locator('#export')).to_be_enabled(timeout=60000)
        async def send(kind,x=None,y=None):await cdp.send('Input.dispatchTouchEvent',dict(type=kind,touchPoints=[] if x is None else [dict(id=0,x=x,y=y,radiusX=7,radiusY=7,force=.7)]))
        async def reveal():
         await f.locator('.preview-wrap').evaluate("n=>n.scrollIntoView({block:'center',behavior:'instant'})")
         await f.locator('[data-drag=actor]').scroll_into_view_if_needed()
        for gesture in range(3):
         await ready();await reveal();actor=f.locator('[data-drag=actor]')
         if gesture==1:
          # A genuine inner background tap, with hit target explicitly checked.
          local=await f.locator('.preview-wrap').evaluate("""n=>{const r=n.getBoundingClientRect();for(const fy of [.1,.2,.8])for(const fx of [.9,.1,.7]){const x=r.x+r.width*fx,y=r.y+r.height*fy,t=document.elementFromPoint(x,y);if(t?.id==='final-preview')return {x:x-r.x,y:y-r.y,target:t.id};}return null;}""")
          assert local,('no inner background point',label)
          wb=await f.locator('.preview-wrap').bounding_box();await send('touchStart',wb['x']+local['x'],wb['y']+local['y']);await send('touchEnd')
         elif gesture==2:await p.locator('#outside').tap()
         before=await actor.bounding_box();x=before['x']+before['width']/2;y=before['y']+before['height']/2
         delta=[(22,-8),(-18,7),(21,-6)][gesture];contacts+=1
         await send('touchStart',x,y)
         if gesture==1:await asyncio.sleep(.7)
         for k in range(1,7):await send('touchMove',x+delta[0]*k/6,y+delta[1]*k/6)
         # Capture first. Reads/encodes used to construct the reference occur
         # afterwards, so they cannot make this already captured frame ready.
         actual=await p.screenshot(type='png',scale='device',animations='allow')
         live=await actor.bounding_box();ghost=f.locator('.composition-ghost');assert await ghost.is_visible(),(label,'ghost absent')
         assert abs(live['x']-before['x'])+abs(live['y']-before['y'])>8,(label,'no DOM move')
         gb=await ghost.bounding_box();oldgb=at(gb,(before['x']-live['x'],before['y']-live['y']))
         css=await actor.evaluate("n=>{const s=getComputedStyle(n);return {background:s.backgroundColor,outline:s.outline,outlineOffset:s.outlineOffset};}")
         if variant=='Canvas':
          bg=f.locator('.composition-clean');bgsrc=await bg.evaluate("n=>n.toDataURL('image/png')");ghsrc=await ghost.evaluate("n=>n.toDataURL('image/png')")
         else:bg=f.locator('#final-preview');bgsrc=await bg.get_attribute('src');ghsrc=await ghost.get_attribute('src')
         bgb=await bg.bounding_box();rendering=await bg.evaluate('n=>getComputedStyle(n).imageRendering')
         assert bgsrc.startswith('data:image/png;base64,') and ghsrc.startswith('data:image/png;base64,')
         with Image.open(io.BytesIO(base64.b64decode(ghsrc.split(',')[1]))) as im:
          opaque_pixels=int(np.count_nonzero(np.asarray(im.convert('RGBA'))[:,:,3]==255))
         assert opaque_pixels>1000,(label,'empty ghost',opaque_pixels)
         assert await f.locator('[data-drag]').count()==1,(label,'unexpected sticker nodes')
         samples.append(dict(gesture=gesture,before=before,live=live,gb=gb,oldgb=oldgb,bgb=bgb,css=css,bgsrc=bgsrc,ghsrc=ghsrc,actual=actual,image_rendering=rendering,opaque_ghost_pixels=opaque_pixels))
         await send('touchEnd');await ready();after=await actor.bounding_box();assert abs(after['x']-before['x'])+abs(after['y']-before['y'])>8,(label,'commit did not move')
        await ctx.close()
        # References have no application script/event handlers. They are built
        # only AFTER the test page is closed, avoiding focus changes mid-gesture.
        refctx=await browser.new_context(**pw.devices['Pixel 7']);ref=await refctx.new_page()
        for sample in samples:
         await ref.set_content('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:#0a1022}#clip{position:absolute;overflow:hidden}img,#hit{position:absolute;display:block;max-width:none;margin:0;padding:0;border:0;box-sizing:border-box}#bg{object-fit:contain}#ghost{object-fit:fill;image-rendering:pixelated}</style><div id="clip"><img id="bg"><img id="ghost"><div id="hit"></div></div>')
         await ref.evaluate("""async s=>{
          const b=s.bgb,c=document.querySelector('#clip');Object.assign(c.style,{left:b.x+'px',top:b.y+'px',width:b.width+'px',height:b.height+'px'});
          const rect=(n,r)=>Object.assign(n.style,{left:(r.x-b.x)+'px',top:(r.y-b.y)+'px',width:r.width+'px',height:r.height+'px'});
          const bg=document.querySelector('#bg'),gh=document.querySelector('#ghost');rect(bg,b);rect(gh,s.gb);bg.style.imageRendering=s.image_rendering;bg.src=s.bgsrc;gh.src=s.ghsrc;
          const hit=document.querySelector('#hit');rect(hit,s.live);Object.assign(hit.style,s.css);
          await Promise.all([bg.decode(),gh.decode()]);
         }""",{k:v for k,v in sample.items() if k!='actual'})
         correct=await ref.screenshot(type='png',scale='device')
         await ref.evaluate("s=>{const n=document.querySelector('#ghost');n.style.left=(s.oldgb.x-s.bgb.x)+'px';n.style.top=(s.oldgb.y-s.bgb.y)+'px';}",{k:sample[k] for k in ['oldgb','bgb']})
         stationary=await ref.screenshot(type='png',scale='device')
         a,n,o=map(array,[sample['actual'],correct,stationary]);assert a.shape==n.shape==o.shape
         b=sample['bgb'];dpr=a.shape[1]/pw.devices['Pixel 7']['viewport']['width']
         clip=np.zeros(a.shape[:2],bool);left=max(0,math.ceil((b['x']+2)*dpr));right=min(a.shape[1],math.floor((b['x']+b['width']-2)*dpr));top=max(0,math.ceil((b['y']+2)*dpr));bottom=min(a.shape[0],math.floor((b['y']+b['height']-2)*dpr));clip[top:bottom,left:right]=True
         signal=np.max(np.abs(n-o),axis=2)>24;mask=signal&clip
         count=int(np.count_nonzero(mask));assert count>400,(label,'movement signal too small',count)
         moving_error=float(np.abs(a-n)[mask].mean());stationary_error=float(np.abs(a-o)[mask].mean());agreement=float(np.mean(np.max(np.abs(a-n),axis=2)[mask]<=24))
         row=dict(case=label,gesture=sample['gesture'],actual_sha256=sha(sample['actual']),correct_reference_sha256=sha(correct),stationary_reference_sha256=sha(stationary),movement_signal_pixels=count,mean_rgb_error_moving_reference=moving_error,mean_rgb_error_stationary_reference=stationary_error,fraction_within_24_of_moving_reference=agreement,actual_dom_delta=[sample['live']['x']-sample['before']['x'],sample['live']['y']-sample['before']['y']],opaque_ghost_pixels=sample['opaque_ghost_pixels'])
         # Conservative visual threshold, not exact-pixel equality. Record all
         # values, including anti-aliasing/layout differences, for adjudication.
         row['visual_movement_verified']=moving_error<12 and moving_error<stationary_error*.25 and agreement>.9
         rows.append(row)
         if not row['visual_movement_verified'] or (preset==0 and sample['gesture']==2):
          # Store a bounded preview crop, not full HTML or redundant assets.
          stem=label.replace('/','-')+f'-gesture{sample["gesture"]}'
          for suffix,raw in [('actual',sample['actual']),('moving-ref',correct),('stationary-ref',stationary)]:
           with Image.open(io.BytesIO(raw)) as im:im.crop((left,top,right,bottom)).save(captures/(stem+'-'+suffix+'.png'))
         assert row['visual_movement_verified'],row
        await refctx.close();print('PASS',label,'three held gestures, including inner/outer deselect',flush=True)
    finally:await browser.close()
   assert not errors,errors
  except Exception:failure=traceback.format_exc();print(failure,flush=True)
 report=dict(result='FAIL' if failure else 'PASS',started_at_workspace_utc=stamp,finished_at_workspace_utc=datetime.now(timezone.utc).isoformat(),seconds=round(time.time()-started,2),scope='Actual composited browser screenshots during held genuine CDP touch; pristine production/A1/nonrelease Canvas, same four chosen presets, two styles, nested opaque srcdoc. Software Linux rendering, NOT physical Android/Arena or original unknown outfit. Static reference layout uses the same renderer layer pixels; not an independent renderer. Screenshot/DOM observation can affect scheduling. Ready-to-ready, not the rapid-loading interception test.',smoke=smoke,source_sha256=source_sha256,contacts_attempted=contacts,visual_movement_checks=len(rows),engines=engines,rows=rows,errors=errors,failure=failure)
 (C/(name+'-results.json')).write_text(json.dumps(report,indent=2));print('DONE',report['result'],contacts,'contacts',len(rows),'visual checks',flush=True)
 if failure:raise RuntimeError(failure)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--smoke',action='store_true');args=parser.parse_args();asyncio.run(main(args.smoke))
