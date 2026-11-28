"""Build a uniquely named diagnostic copy, NOT a new fix/release.
No interaction logic is changed. Baseline is the released standalone 3.3.1.
"""
from pathlib import Path
import hashlib,json
HERE=Path(__file__).resolve().parent
HOME=HERE.parent
BASE=HOME/'Cartolina_Casardi_PC_e_Telefono.html'
OUT=HOME/'Cartolina_Casardi_DIAGNOSTICA_ANDROID_A1.html'
BASE_HASH='8b247a2cd86bd0485f352190590371e83150aa3feb99b2cb5c59fc517d9a09ea'

def main():
 raw=BASE.read_bytes();assert hashlib.sha256(raw).hexdigest()==BASE_HASH
 s=raw.decode()
 old='async setPreview(data){';assert s.count(old)==1
 s=s.replace(old,"diagnosticState(){return {busy,rendering,metaReady:!!meta,drag:drag?{kind:drag.kind,id:drag.id,moved:drag.moved}:null,actor:meta?{x:meta.actor.x,y:meta.actor.y}:null,modelActor:get().actor?{x:get().actor.x,y:get().actor.y}:null};},\n   "+old)
 old='const editor=CasardiEditor.mount({';assert s.count(old)==1;s=s.replace(old,'const editor=window.__CasardiDiagEditor=CasardiEditor.mount({')
 js=(HERE/'diagnostics-a1.js').read_text();assert '</script' not in js.lower()
 assert s.count('</body>')==1;s=s.replace('</body>','<script>\n'+js+'\n</script>\n</body>')
 OUT.write_text(s)
 proof=dict(test='ANDROID-ARENA-A1',purpose='Read-only instrumentation for user-device diagnosis, not a bugfix or production release',baseline_sha256=BASE_HASH,diagnostic_sha256=hashlib.sha256(OUT.read_bytes()).hexdigest(),diagnostic_file=OUT.name,bytes=OUT.stat().st_size,network='No added requests',storage='RAM only; no visitor name, PNG or transfer token recorded',changes='Expose read-only editor readiness and geometry; add passive event trace and on-screen local diagnostic panel; unique filename to distinguish viewer cache.')
 (HERE/'diagnostic-build.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof,indent=2))
if __name__=='__main__':main()
