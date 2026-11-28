"""Derive contact ownership from EXISTING timing traces. This is a new
analysis, NOT a rerun of browser gestures or a physical Android reproduction.
"""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json
C=Path('/home/user/.cache/casardi-rootcause');results={}
for name in ['timing-probe.json','canvas-timing-probe.json']:
 raw=(C/name).read_bytes();j=json.loads(raw);rows=[];lost=[]
 for case in j['results']:
  for t in case['trials']:
   downs=[i for i,e in enumerate(t['trace']) if e['t']=='pointerdown'];assert downs
   down=t['trace'][downs[-1]];sequence=[e for e in t['trace'][downs[-1]:] if e.get('id')==down['id']]
   moves=[e for e in sequence if e['t']=='pointermove'];ready_moves=[e for e in moves if not e['rendering'] and not e['loading']]
   moved=t['second_before']['model']!=t['second_after']['model']
   row=dict(mode=case['mode'],cpu_rate=case['cpu_rate'],trial=t['i'],pointer_id=down['id'],second_pointerdown_target=down['target'],model_changed=moved,second_pointerdown_loading=down['loading'],second_pointerdown_rendering=down['rendering'],pointermoves=len(moves),pointermoves_observed_after_ready=len(ready_moves),pointermove_targets_after_ready=[e['target'] for e in ready_moves],final_state=t['final'])
   rows.append(row)
   if not moved:
    assert down['target']=='preview-loading' and down['loading'] and down['rendering'],row
    assert ready_moves and all(e['target']=='preview-loading' and e.get('drag') is None for e in ready_moves),row
    ups=[e for e in sequence if e['t']=='pointerup'];loss=[e for e in sequence if e['t']=='lostpointercapture'];assert len(ups)==len(loss)==1
    assert ups[0]['target']==loss[0]['target']=='preview-loading' and not ups[0]['rendering'] and not ups[0]['loading']
    lost.append(dict(**row,sequence=sequence,minimum_contact_time_observed_ineffective_after_ready_ms=round(ups[0]['at']-ready_moves[0]['at'],3),capture_loss_observed_only_at_end=True))
 assert len(rows)==36 and not j['errors']
 results[name]=dict(input_sha256=hashlib.sha256(raw).hexdigest(),second_contact_attempts=len(rows),model_unchanged_contacts=len(lost),lost_contacts_with_movements_targeting_hidden_overlay_after_ready=len(lost),total_pointermoves_targeting_hidden_overlay_after_ready=sum(x['pointermoves_observed_after_ready'] for x in lost),lost_contacts=lost)
assert results['timing-probe.json']['model_unchanged_contacts']==7
assert results['canvas-timing-probe.json']['model_unchanged_contacts']==0
report=dict(result='PASS',analysed_at_workspace_utc=datetime.now(timezone.utc).isoformat(),scope='Reanalysis of stored minimally instrumented Linux Chromium touch traces, not new gestures. Event target/flag/model observation; no conclusion about the original physical-device failure.',finding='Seven second contacts began on visible preview-loading. Even after it was hidden and rendering false, 26 subsequent pointermoves still targeted preview-loading with drag unset. Pointerup and lostpointercapture arrived there at contact end. Thus finishing the preview does not rescue a contact that began on the blocker.',causal_boundary='Demonstrated readiness/target-ownership failure for the WHOLE affected contact; not a permanent deadlock across new contacts. Does not identify the source of the user-described blue square.',results=results)
assert results['timing-probe.json']['total_pointermoves_targeting_hidden_overlay_after_ready']==26
(C/'timing-contact-ownership.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='results'},indent=2))
