"""Persist only small audit evidence. Never package uploads, credentials,
production assets, browser/toolchain, or duplicate generated HTML. Existing raw
reports/scripts remain unchanged; provenance annotations are derived copies.
"""
from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,zipfile,re,ast
C=Path('/home/user/.cache/casardi-rootcause');R=C/'casardi_postcard';D=Path('/home/user/casardi_diagnostica/audit_agente');D.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest();utc=lambda epoch:datetime.fromtimestamp(epoch,timezone.utc).isoformat();payload={};manifest=[];dates=[];adaptations=[]
def put(path,data):
 assert path not in payload,path
 if isinstance(data,str):data=data.encode()
 payload[path]=data
# First check the aggregates that the report relies on, before writing evidence.
for n in ['pristine-embedding-results.json','canvas-embedding-results.json','canvas-race-qa.json','native-embedding-edges.json','canvas-pixel-results.json','canvas-resource-results.json','kiosk-ownership-results.json','whole-release-integrity.json','held-contact-ownership-results.json','timing-contact-ownership.json']:
 j=json.loads((C/n).read_text());assert j['result']=='PASS',(n,j.get('failure'))
 assert not j.get('errors'),(n,j.get('errors'))
assert json.loads((C/'whole-release-integrity.json').read_text())['entire_archive_files_byte_equal']==717
visual=json.loads((C/'compositor-adjudication.json').read_text());assert visual['result']=='PARTIAL' and visual['full_run_result']=='FAIL' and visual['completed_headless_submatrix']['held_contacts_with_visual_assertions']==72
held=json.loads((C/'held-contact-ownership-results.json').read_text());assert sum(len(r['trials']) for r in held['rows'])==25 and sum(r['naturally_stranded_second_contacts'] for r in held['rows'])==8 and held['actor_contacts_attempted']==75
assert all(t['fresh_third_contact_committed_movement'] for r in held['rows'] for t in r['trials'])
classified={}
for name in ['timing-probe.json','canvas-timing-probe.json']:
 j=json.loads((C/name).read_text());rows=[]
 for case in j['results']:
  for t in case['trials']:
   down=[e for e in t['trace'] if e['t']=='pointerdown'][-1]
   moved=t['second_before']['model']!=t['second_after']['model']
   rows.append(dict(mode=case['mode'],cpu_rate=case['cpu_rate'],trial=t['i'],second_target=down['target'],second_model_moved=moved))
 assert len(rows)==36 and not j['errors']
 classified[name]=dict(trials=36,second_gestures_without_model_movement=sum(not r['second_model_moved'] for r in rows),rows=rows)
assert classified['timing-probe.json']['second_gestures_without_model_movement']==7
assert classified['canvas-timing-probe.json']['second_gestures_without_model_movement']==0
put('timing-classification.json',json.dumps(classified,indent=2))
inv=json.loads((C/'source-check.json').read_text())['inventory'];coverage=[]
for item in inv:
 p=R/item['path'];assert sha(p.read_bytes())==item['sha256']
 coverage.append({**item,'review':'Complete source review; generated font constant additionally regenerated/decoded, not counted as logic coverage.','dynamic_coverage':'Not implied by reading or syntax check. See individual executed test reports.'})
for p in sorted((R/'service/vendor').rglob('*.go')):
 coverage.append(dict(path=str(p.relative_to(R)),bytes=p.stat().st_size,lines=len(p.read_text().splitlines()),sha256=sha(p.read_bytes()),review='Complete implementation/data-table review; table equivalence checks recorded separately.',dynamic_coverage='Service tests exercise QR generation; not a complete upstream-library test suite.'))
support=[]
for s in ['start.sh','start.cmd','requirements.txt','requirements-lock.txt','requirements-dev.txt','service/go.mod','service/go.sum','service/vendor/modules.txt']:
 p=R/s;support.append(dict(path=s,bytes=p.stat().st_size,lines=len(p.read_text().splitlines()),sha256=sha(p.read_bytes()),review='Read; shell launcher additionally bash -n. Windows launcher not executed natively.'))
assert len(coverage)==93 and sum(i['lines'] for i in coverage)==16661 and len(support)==8 and sum(i['lines'] for i in support)==71
ledger=dict(recorded_at_workspace_utc=datetime.now(timezone.utc).isoformat(),scope='Package source/template/style inventory, including copied/generated code and vendored QR. Not a formal correctness proof or dynamic line coverage.',source_files=len(coverage),physical_source_lines=sum(i['lines'] for i in coverage),support_files=len(support),physical_support_lines=sum(i['lines'] for i in support),source_review=coverage,support_review=support,excluded='Externally installed package/browser/OS implementation, native Windows execution and all possible physical-device sessions. Large generated embedded data validated by source integration/hash and separate font/asset checks.')
ledger['additional_support_review']=json.loads((C/'support-review.json').read_text())
put('review-coverage.json',json.dumps(ledger,indent=2))
log=(C/'go-unit-audit.log').read_text();passed=re.findall(r'^--- PASS: (Test\S+)',log,re.M);assert len(passed)==26 and not re.search(r'WARNING: DATA RACE|--- FAIL|^FAIL',log,re.M)
put('go-unit-audit-summary.json',json.dumps(dict(result='PASS',command="GOTOOLCHAIN=local GOPROXY=off GOSUMDB=off GOMAXPROCS=2 GOFLAGS='-p=1' GOCACHE=$C/go-cache $C/toolchain/go/bin/go test -race -count=1 -mod=vendor -v ./...",tests_passed=passed,elapsed_go_test_seconds=float(re.search(r'^ok\s+casardi.local/postcard-service\s+([\d.]+)s',log,re.M)[1]),log_sha256=sha(log.encode()),log_written_at_workspace_utc=utc((C/'go-unit-audit.log').stat().st_mtime),platform='Linux Go tests, not native Windows'),indent=2))
for p in sorted(C.glob('*.json')):
 raw=p.read_bytes();j=json.loads(raw);meta=dict(original_sha256=sha(raw),report_file_written_at_workspace_utc=utc(p.stat().st_mtime),execution_time_caveat='Filesystem write time on the workspace clock, not the user local date or an independently recorded execution start. Annotation is not a rerun.')
 put('reports/original/'+p.name,raw)
 if isinstance(j,dict):
  j=dict(j)
  if j.get('date')=='2026-11-27':
   meta['original_hardcoded_date']=j['date'];meta['date_meaning']='Static calendar label, not an execution timestamp. Preserved without silently replacing it with the workspace filesystem date. Workspace-clock timestamps are separately qualified.'
  if p.name=='canvas-resource-first-incomplete-tracking.json':meta['adjudication']='Initial counter omitted parser-created main Canvas; undercounts area. Retained for provenance; use corrected canvas-resource-results.json, actually rerun.'
  if p.name=='canvas-race-qa-first-harness-failure.json':meta['adjudication']='Initial QA deliberately persistent injected toast/footer intercepted Export; preserved FAIL. Corrected harness actually rerun; see canvas-race-qa.json.'
  if p.name=='compositor-gesture-first-crash.json':meta['adjudication']='First smoke passed three photo visual checks, then the next test document crashed. Cause not established. Retained FAIL; later direct HTTP serving and per-condition browser isolation were actually rerun, not a physical-device root-cause finding.'
  if p.name=='compositor-gesture-smoke-results.json':meta['adjudication']='Actually executed PASS smoke: production only, preset zero, two styles, six headless visual checks; not the full four-preset/three-variant/two-engine scope in its generic scope string.'
  if p.name=='compositor-gesture-results.json':meta['adjudication']='Full run FAIL preserved: 72/72 completed headless visual assertions succeeded; headed SwiftShader page crashed during setup before any gesture. See separate PARTIAL adjudication; no GPU/device PASS inferred.'
  j['_audit_provenance']=meta;put('reports/annotated/'+p.name,json.dumps(j,indent=2,ensure_ascii=False))
 dates.append({'file':p.name,**meta})
put('date-provenance.json',json.dumps(dict(scope='Only current cache-audit artifacts. Historical production reports and previous A1 reports are not redated.',entries=dates),indent=2))
for p in sorted([*C.glob('*.py'),*C.glob('*.js')]):
 raw=p.read_bytes();put('harness/original/'+p.name,raw);s=raw.decode();changes=[]
 if p.suffix=='.py':
  new,n=re.subn(r"\bdate\s*=\s*(['\"])2026-11-27\1",'date=_audit_datetime.now(_audit_timezone.utc).date().isoformat()',s)
  if n:
   assert 'from pathlib import Path' in new,p.name
   new=new.replace('from pathlib import Path','from datetime import datetime as _audit_datetime, timezone as _audit_timezone\nfrom pathlib import Path',1);changes.append('Replace hardcoded date metadata with dynamic workspace UTC date; no test-logic change')
  if p.name=='canvas_embedding_test.py':new=new.replace('Pristine released HTML, nested opaque-origin srcdoc, no injected script/diagnostics.','Uninstrumented non-release Canvas experiment, nested opaque srcdoc; no diagnostic scripts.');changes.append('Clarify inherited docstring: experiment is not pristine production HTML')
  ast.parse(new,filename=p.name)
 else:
  new=s.replace("date:'2026-11-27'","date:new Date().toISOString().slice(0,10)")
  if new!=s:changes.append('Replace hardcoded date metadata with dynamic workspace UTC date')
 put('harness/rerunnable/'+p.name,new)
 if changes:adaptations.append(dict(file=p.name,changes=changes,original_sha256=sha(raw),adapted_sha256=sha(new.encode()),adaptation_only_not_rerun=True))
put('harness-adaptations.json',json.dumps(adaptations,indent=2))
for p in sorted(C.glob('*.log')):put('logs/'+p.name,p.read_bytes())
capture_entries=[]
for p in sorted((C/'compositor-gesture-captures').glob('headless-shell-production-*-preset0-gesture2-*.png')):
 raw=p.read_bytes();dest='screenshots/compositor/'+p.name;put(dest,raw);capture_entries.append(dict(path=dest,sha256=sha(raw),kind='Preview-area crop from a full-page device-scale screenshot or static reference. Full-page hashes in original result differ from these cropped-file hashes; case/gesture encoded in filename.'))
assert len(capture_entries)==6
for p in sorted(C.glob('held-contact-*-sample.png')):
 raw=p.read_bytes();dest='screenshots/held_contact/'+p.name;put(dest,raw);capture_entries.append(dict(path=dest,sha256=sha(raw),kind='Last observed stranded contact screenshot for this variant/style, CSS scale. Multiple earlier contact screenshot hashes remain in the trace report; only the last was saved under the sample filename.'))
put('capture-index.json',json.dumps(dict(scope='Representative lab screenshots only, not original user screenshots or all captured frames. No screenshots of the original physical device were supplied in this audit.',entries=capture_entries),indent=2))
for p in sorted((C/'canvas-experiment/browser').iterdir()):
 if p.is_file():put('experimental_non_release/canvas/browser/'+p.name,p.read_bytes())
for n in ['canvas-preview-experiment.patch','experiment-build.json']:put('experimental_non_release/canvas/'+n,(C/'canvas-experiment'/n).read_bytes())
for n in ['kiosk-ownership-candidate.js','kiosk-ownership-candidate.patch']:put('experimental_non_release/http/'+n,(C/n).read_bytes())
put('SCOPE.md','All source artifacts and patches are NON-RELEASE audit material. Original Android/Arena root cause remains unproven. Production is unchanged. No user testing requested. See the main report in /home/user/Analisi_blocco_Android_Arena.md.\n')
for name,data in sorted(payload.items()):manifest.append(dict(path=name,bytes=len(data),sha256=sha(data)))
put('MANIFEST.json',json.dumps(dict(created_at_workspace_utc=datetime.now(timezone.utc).isoformat(),production_commit='1b627eeb721826bf9b628753e81fa8c2b1088ad9',production_zip_sha256='9fb4a649948ded763cb3436d3b82b12f58f196f8429e65abbd8dfe18bdf5a12f',manifest_covers='Every archive member other than MANIFEST.json itself',entries=manifest),indent=2))
archive=D/'prove_audit.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name,data in sorted(payload.items()):z.writestr(name,data)
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
(D/'prove_audit.zip.sha256').write_text(sha(archive.read_bytes())+'  prove_audit.zip\n')
print(json.dumps(dict(archive=str(archive),bytes=archive.stat().st_size,members=len(payload),sha256=sha(archive.read_bytes()),coverage_files=len(coverage),coverage_lines=sum(i['lines'] for i in coverage),provenance_annotated_without_rerunning=True),indent=2))
