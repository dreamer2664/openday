"""Isolated Canvas commit pixel/geometry equivalence, all 12 scenes/2 styles,
4 presets/3 sizes. Direct module calls: not physical gestures or a root-cause test.
The instrumented test file lives only in the audit cache, never in production.
"""
import asyncio,json,hashlib,time,traceback
from datetime import datetime as _audit_datetime, timezone as _audit_timezone
from pathlib import Path
from playwright.async_api import async_playwright,expect
C=Path('/home/user/.cache/casardi-rootcause');HTML=C/'canvas-experiment/canvas-preview.html'
async def main():
 source=HTML.read_text();needle='return{mount,defaults};\n})();';assert source.count(needle)==1
 inserted="window.qa={};const originalMount=mount;return{mount:cfg=>{qa.cfg=cfg;return qa.editor=originalMount(cfg);},defaults};\n})();"
 test=C/'canvas-pixel-test.html';test.write_text(source.replace(needle,inserted));rows=[];errors=[];failure=None;start=time.time()
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(args=['--no-sandbox'])
  try:
   for mode in ['photo','nes']:
    ctx=await browser.new_context(offline=True,viewport=dict(width=390,height=1000),has_touch=True,is_mobile=True);p=await ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
    await p.goto(test.as_uri());await expect(p.locator('#start')).to_be_enabled();await p.locator('#start').click();await p.locator('[data-mode='+mode+']').click();await p.locator('[data-scene=casardi]').click();await p.locator('#next').click();await p.locator('#next').click();await p.locator('#next').click();await expect(p.locator('#export')).to_be_enabled(timeout=60000)
    result=await p.evaluate("""async mode=>{
     const result=[];const pixels=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
     const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
     for(const scene of PORTABLE.catalogue.scenes)for(const [presetIndex,preset]of PORTABLE.catalogue.presets.entries())for(const size of [65,100,135]){
      const composition={actor:{x:300,y:340,scale:size},plaque:{theme:'originale',ornament:'none',position:'scene',track:'none'},stickers:[]};
      const job={mode,scene:scene.id,name:'',character:{...PORTABLE.catalogue.defaults.character,...preset.character},companion:null,composition};
      qa.cfg.onChange(composition,{render:false,reason:'pixel-qa'});
      const card=await CasardiRender.compose(job,900,{editor:true}),meta=JSON.parse(JSON.stringify(card.editor.meta)),main=pixels(card),clean=pixels(card.editor.clean),ghost=pixels(card.editor.ghost);
      try{
       if(!qa.editor.setCanvasPreview(card))throw Error('Commit rejected');
       const actual=document.querySelector('#final-preview'),cl=document.querySelector('.composition-clean'),gh=document.querySelector('.composition-ghost'),hit=document.querySelector('[data-drag=actor]');
       if(!same(main,pixels(actual))||!same(clean,pixels(cl))||!same(ghost,pixels(gh)))throw Error('RGBA mismatch '+scene.id+'/'+mode+'/'+presetIndex+'/'+size);
       const box=hit.getBoundingClientRect(),image=actual.getBoundingClientRect(),expected=meta.character;
       const error=Math.max(Math.abs((box.left-image.left)*600/image.width-expected.x),Math.abs((box.top-image.top)*400/image.height-expected.y),Math.abs(box.width*600/image.width-expected.w),Math.abs(box.height*400/image.height-expected.h));
       if(error>.15)throw Error('Hit rectangle/bitmap misalignment '+error);
       if(!cl.hidden||!gh.hidden||actual.style.visibility==='hidden')throw Error('Commit visibility');
       result.push({mode,scene:scene.id,preset:presetIndex,size,main_clean_ghost_rgba_exact:true,canonical_hit_error:error});
      }finally{CasardiRender.dispose(card);}
     }return result;
    }""",mode)
    rows.extend(result);print('PASS',mode,len(result),'canvas commits',flush=True);await ctx.close()
   assert len(rows)==288 and not errors
  except Exception:failure=traceback.format_exc();print(failure,flush=True)
  finally:await browser.close()
 report=dict(result='FAIL' if failure else 'PASS',date=_audit_datetime.now(_audit_timezone.utc).date().isoformat(),seconds=round(time.time()-start,2),html_sha256=hashlib.sha256(HTML.read_bytes()).hexdigest(),scope='Isolated module/Canvas commit equivalence: unmodified renderer output vs committed main/clean/ghost RGBA and DOM hit rectangle. Direct calls, not gesture/device/root-cause evidence.',cases=len(rows),maximum_canonical_hit_error=max((r['canonical_hit_error'] for r in rows),default=None),rows=rows,errors=errors,failure=failure)
 (C/'canvas-pixel-results.json').write_text(json.dumps(report,indent=2))
 if failure:raise RuntimeError(failure)
asyncio.run(main())
