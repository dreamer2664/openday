"""Read-only static inventory/integration checks; no production edits/build/publish."""
from pathlib import Path
import ast,hashlib,json,subprocess,sys,time,re
C=Path('/home/user/.cache/casardi-rootcause');R=C/'casardi_postcard';sys.path.insert(0,str(R))
from scripts.sprite_to_js import generate
start=time.time();inventory=[];checks=[];failures=[]
for top in ('app','browser','web','scripts','tests','service'):
 for p in sorted((R/top).rglob('*')):
  if not p.is_file() or p.suffix not in ('.py','.js','.go','.css','.html') or any(x in p.parts for x in ('vendor','__pycache__')):continue
  raw=p.read_bytes();s=raw.decode();item=dict(path=str(p.relative_to(R)),lines=len(s.splitlines()),bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest())
  if p.suffix=='.py':ast.parse(s,filename=item['path']);item['syntax']='Python AST PASS'
  elif p.suffix=='.js':subprocess.run(['node','--check',str(p)],capture_output=True,text=True,check=True);item['syntax']='node --check PASS'
  inventory.append(item)
html=(R/'Cartolina_Casardi_PC_e_Telefono.html').read_text()
for p in ['browser/sprites.js','browser/composition.js','browser/render.js','browser/layout-editor.js','browser/bridge.js','browser/app.js']:
 code=(R/p).read_text();n=html.count(code);assert n==1,(p,n);checks.append(dict(name='Exact source included once in released HTML',source=p,result='PASS'))
assert generate(R)==(R/'browser/sprites.js').read_text();checks.append(dict(name='All generated sprite code exactly regenerates from original Python and browser helpers',result='PASS'))
for name in ('layout-editor.js','layout-editor.css'):
 assert (R/'browser'/name).read_bytes()==(R/'web/static'/name).read_bytes();checks.append(dict(name='Shared browser/kiosk '+name+' byte equality',result='PASS'))
# A1 differences reverse to byte-identical production, including all handlers.
a1=(Path('/home/user')/'Cartolina_Casardi_DIAGNOSTICA_ANDROID_A1.html').read_text()
a1=a1.replace("diagnosticState(){return {busy,rendering,metaReady:!!meta,drag:drag?{kind:drag.kind,id:drag.id,moved:drag.moved}:null,actor:meta?{x:meta.actor.x,y:meta.actor.y}:null,modelActor:get().actor?{x:get().actor.x,y:get().actor.y}:null};},\n   ",'').replace('const editor=window.__CasardiDiagEditor=CasardiEditor.mount({','const editor=CasardiEditor.mount({')
diag=(Path('/home/user/casardi_diagnostica')/'diagnostics-a1.js').read_text();a1=a1.replace('<script>\n'+diag+'\n</script>\n</body>','</body>');assert a1==html
checks.append(dict(name='A1 minus documented read-only diagnostics equals production exactly; no alternate touch/drag logic',result='PASS'))
# Counts in project documentation are not used as present proof of test execution.
report=dict(date='2026-11-27',result='PASS',seconds=round(time.time()-start,2),scope='Static syntax, all non-vendor code/template/style inventory and exact build integration. Does not claim every line is dynamically covered or manually reviewed.',checks=checks,inventory=inventory,counts=dict(files=len(inventory),lines=sum(p['lines'] for p in inventory),python=sum(p['path'].endswith('.py') for p in inventory),javascript=sum(p['path'].endswith('.js') for p in inventory)),production_html_sha256=hashlib.sha256((R/'Cartolina_Casardi_PC_e_Telefono.html').read_bytes()).hexdigest())
C.joinpath('source-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='inventory'},ensure_ascii=False,indent=2))
