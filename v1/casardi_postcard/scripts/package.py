"""Build/verify the 3.3.1 drag-recovery optional-composition Windows + LPC + finished-PNG-QR distribution.

python scripts/package.py --candidate   # before independent extracted smoke
python scripts/package.py               # final, requires current runtime smoke
Output: ../Cartolina_Casardi_Windows_LPC_QR_2026-27.zip + SHA-256 sidecar.
Visitor files and caches are never included. No Windows-native QA is implied.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import zipfile
from PIL import Image,ImageFont
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from scripts.runtime_fingerprint import HTML,EXE,runtime_fingerprint
from scripts.build_service import source_digest
OUTPUT=ROOT.parent/'Cartolina_Casardi_Windows_LPC_QR_2026-27.zip'
MANIFEST=ROOT/'MANIFEST.sha256'
AUDIT=ROOT/'docs/test-results/package-audit.json'
OMIT={'__pycache__','.venv','.git','node_modules','.cache','.pytest_cache','build','dist','out','target','.arena'}


def sha(data):return hashlib.sha256(data).hexdigest()
def report(name):return json.loads((ROOT/'docs/test-results'/name).read_text())
def passed(items):return all(x.get('result',x.get('status'))=='PASS' for x in items)


def files():
    result=[]
    for p in ROOT.rglob('*'):
        if not p.is_file():continue
        rel=p.relative_to(ROOT)
        if any(part in OMIT for part in rel.parts) or p.suffix in ('.pyc','.part','.zip'):continue
        if p.name in ('.DS_Store','Thumbs.db'):continue
        if rel.parts[0]=='var' and rel.as_posix()!='var/README.md':continue
        result.append(p)
    return sorted(result)


def check(candidate=False):
    for name in ('README.md','SOURCES_AND_LICENSES.md','ASSET_MATRIX.md','TEST_REPORT.md','LICENSE',HTML,EXE,
                 'requirements.txt','requirements-lock.txt','requirements-dev.txt','start.sh','start.cmd',
                 'service/go.mod','service/go.sum','service/vendor/modules.txt',
                 'docs/GUIDA_OPERATORE.md','docs/GUIDA_RAPIDA.html','docs/GUIDA_RAPIDA.pdf',
                 'docs/GUIDA_FILE_UNICO_E_TELEFONO.md','docs/SCENE_COMPOSITION.md',
                 'assets/characters/CREDITI_LPC.txt','assets/licenses/OGA-BY-3.0.txt','assets/licenses/CC-BY-SA-2.5.txt','assets/nes/manifest.json','assets/nes/LEGGIMI.md',
                 'assets/licenses/dependencies/Go-BSD-3-Clause.txt','assets/licenses/dependencies/skip2-go-qrcode-MIT.txt'):
        assert (ROOT/name).is_file(),name
    for name in (EXE,'start.sh'):assert (ROOT/name).stat().st_mode&0o111==0o111,'Executable mode lost: '+name
    for directory in ('var/exports','var/qa_exports'):
        assert not list((ROOT/directory).glob('*.png')) and not list((ROOT/directory).glob('*.part')),'Clear synthetic or visitor exports before packaging.'
    assert not (ROOT/'var/ultima_cartolina.png').exists()
    metadata=json.loads((ROOT/'assets/photos/photo_metadata.json').read_text());assert len(metadata)==12
    for sid,m in metadata.items():
        p=ROOT/'assets/photos'/sid/'source.jpg';assert sha(p.read_bytes())==m['local_sha256']
        with Image.open(p) as im:im.verify()
        with Image.open(ROOT/'assets/nes'/(sid+'.png')) as im:assert im.size==(600,400)
    nes_manifest=json.loads((ROOT/'assets/nes/manifest.json').read_text())
    art=report('nes-art-audit.json');assert art['result']=='PASS' and art['canonical_files']==12 and art['retained_3_1_backgrounds_unchanged']==6
    retained=nes_manifest['retained_from_3_1'];assert len(retained)==6
    assert all(nes_manifest['scenes'][sid]['sha256']==digest for sid,digest in retained.items())
    assert art['manifest_sha256']==sha((ROOT/'assets/nes/manifest.json').read_bytes())
    assert set(nes_manifest['scenes'])=={x['scene'] for x in art['scenes']}
    for item in art['scenes']:
        record=nes_manifest['scenes'][item['scene']]
        assert item['result']=='PASS' and item['sha256']==record['sha256']==sha((ROOT/record['path']).read_bytes())
        with Image.open(ROOT/record['path']) as im:
            assert im.size==(600,400) and len(im.convert('RGB').getcolors(1000000))<=64
            assert im.convert('RGBA').getchannel('A').getextrema()==(255,255)
            assert 'assistita da IA' in im.info['Description']
    for name in ('Cinzel.ttf','EBGaramond.ttf','PressStart2P-Regular.ttf'):

        p=ROOT/'assets/fonts'/name;ImageFont.truetype(str(p),18)
        assert p.read_bytes()==(ROOT/'web/static/fonts'/name).read_bytes()
    pngs=sorted((ROOT/'renders').glob('[A-X]_*.png'));jpgs=sorted((ROOT/'renders').glob('[A-X]_*.jpg'))
    assert len(pngs)==13 and len(jpgs)==24,(len(pngs),len(jpgs))
    for p in pngs:
        with Image.open(p) as im:
            assert im.size==(3000,2000) and im.format=='PNG'
            assert 'LICEO ALFREDO CASARDI' in im.info.get('Title','')
            assert 'PERSONAGGIO MODULARE LPC' in im.info.get('Description','') and 'CC BY-SA 4.0' in im.info.get('Copyright','')
            assert im.info.get('Source');im.verify()
    for p in jpgs:
        with Image.open(p) as im:assert im.size==(1200,800) and im.info.get('comment');im.verify()
    shot_counts={}
    for directory,n in (('screenshots-service',7),('screenshots-standalone',6),('screenshots',16)):
        shots=list((ROOT/'docs'/directory).glob('*.jpg'));assert len(shots)==n
        for p in shots:
            with Image.open(p) as im:im.verify()
        shot_counts[directory]=n
    unit=(ROOT/'docs/test-results/unit-tests.txt').read_text()
    unit_count=int(re.search(r'Ran (\d+) tests',unit)[1])
    assert unit_count>=76 and unit.strip().endswith('OK') and 'ResourceWarning' not in unit
    asset=report('asset-audit.json');assert asset['result']=='PASS' and asset['total']==7716 and asset['boundary_touches']==0
    assert (asset['licensed_parts'],asset['source_pngs_sha256_verified'],asset['definitions_sha256_verified'],asset['pose_atlases_sha256_verified'])==(56,255,56,85)
    layout=report('layout-audit.json');assert layout['cases']==12096 and layout['outside_inner_frame']==layout['foot_span_overlaps']==0
    for filename,count in (('browser-tests.json',16),('hd-http-regression.json',24)):
        data=report(filename);assert len(data['tests'])==count and passed(data['tests']),filename
    html_hash=sha((ROOT/HTML).read_bytes());built=report('standalone-build.json');browser=report('standalone-browser-tests.json')
    assert built['sha256']==browser['html_sha256']==html_hash
    assert len(browser['tests'])==22 and passed(browser['tests']) and not browser['js_errors']
    assert len(browser['exports'])==24 and passed(browser['exports'])
    effects=report('control-effects-audit.json');assert effects['result']=='PASS' and effects['comparisons']==3250 and not effects['failures']
    assert effects['zero_pixel_alternatives_measured']==563
    for name,digest in effects['sources'].items():assert sha((ROOT/name).read_bytes())==digest,name
    controls=report('control-ui-tests.json');assert controls['result']=='PASS' and controls['html_sha256']==html_hash
    assert len(controls['tests'])==9 and passed(controls['tests']) and not controls['javascript_errors'] and not controls['standalone_http_requests']
    actual=next(t for t in controls['tests'] if 'per_category' in t)
    assert set(actual['per_category'])=={'body','face','hair','expression','top','bottom','shoes','extras','pose'}
    assert all(n>0 for n in actual['per_category'].values()) and sum(actual['per_category'].values())==controls['actual_ui_alternative_clicks']
    assert not (ROOT/'docs/qa/07_browser_12_cartoline.jpg').exists()
    retro=report('nes-retro-ui.json');assert retro['result']=='PASS' and retro['html_sha256']==html_hash
    assert len(retro['tests'])==8 and passed(retro['tests']) and not retro['javascript_errors'] and not retro['http_requests']
    parity=report('browser-sprite-audit.json');assert parity['result']=='PASS' and parity['comparisons']==938 and parity['mismatches']==0
    for name,digest in parity['source'].items():assert sha((ROOT/name).read_bytes())==digest,name
    windows=report('windows-build.json');assert windows['result']=='PASS' and windows['sha256']==sha((ROOT/EXE).read_bytes())
    assert (windows['source_files'],windows['source_sha256'])==source_digest()
    gotests=(ROOT/'docs/test-results/go-service-tests.txt').read_text()
    assert len(re.findall(r'^--- PASS: Test',gotests,re.M))==26 and not re.search(r'^FAIL|--- FAIL',gotests,re.M) and '\nPASS\n' in gotests
    service=report('go-service-browser.json');assert service['result']=='PASS' and service['html_sha256']==html_hash
    assert len(service['tests'])==15 and passed(service['tests']) and not service['javascript_errors'] and not service['external_hosts']
    expiry=report('go-real-expiry.json');assert expiry['result']=='PASS' and expiry['configured_ttl_seconds']==300 and expiry['observed_after_seconds']>=300 and expiry['served_html_matches']=='PASS'
    assert len(expiry['expired_routes'])==3 and all(x['status']==410 for x in expiry['expired_routes']) and expiry['service_transfer_removed']
    # This revision was retested with the exact final HTML and Go source.
    assert expiry['go_source_sha256']==windows['source_sha256'] and expiry['html_sha256']==html_hash
    launch=report('go-launch-lifecycle.json');assert launch['result']=='PASS' and len(launch['tests'])==7 and passed(launch['tests'])
    assert launch['go_source_sha256']==windows['source_sha256'] and launch['html_sha256']==html_hash
    if not candidate:
        smoke=report('package-smoke.json');n,digest=runtime_fingerprint()
        assert smoke['result']=='PASS' and (smoke['runtime_files_equal'],smoke['runtime_sha256'])==(n,digest),'Current independently extracted-copy smoke is required.'
        assert smoke['standalone_html_sha256']==html_hash and smoke['windows_exe_sha256']==windows['sha256']
        assert len(smoke['checks'])==2 and passed(smoke['checks']) and len(smoke['standalone_file_only_offline'])==2 and passed(smoke['standalone_file_only_offline'])
        assert smoke['phone_creator_http']==smoke['reset_and_memory_cleanup']==smoke['no_directory_browsing']=='PASS'
    recovery=report('drag-recovery-tests.json');assert recovery['result']=='PASS' and recovery['html_sha256']==html_hash
    assert len(recovery['checks'])==72 and passed(recovery['checks']) and len(recovery['exports'])==6
    assert sum(t.get('verified_drags',0) for t in recovery['checks'])==240
    assert recovery['baseline']['released_html_sha256']=='e8e28940e478a985e2b5113606045b4eac8677c58c27055a8392b719605a392a'
    assert recovery['baseline']['actor_frozen'] and recovery['baseline']['sticker_frozen']
    assert not recovery['javascript_errors'] and not recovery['standalone_http_requests']
    for name,digest in recovery['sources'].items():assert sha((ROOT/name).read_bytes())==digest,name
    assets=report('unchanged-assets-3.3.1.json');assert assets['result']=='PASS' and assets['asset_files_byte_identical']==473
    for name,digest in assets['all_asset_sha256'].items():assert sha((ROOT/name).read_bytes())==digest,name
    assert (ROOT/'docs/BUG_TRASCINAMENTO_3.3.1.md').is_file()
    optional=report('composition-ui-tests.json');assert optional['result']=='PASS' and optional['html_sha256']==html_hash
    assert len(optional['tests'])==26 and passed(optional['tests']) and len(optional['exports'])==6
    assert not optional['javascript_errors'] and not optional['standalone_http_requests']
    editing=report('composition-audit.json');assert editing['result']=='PASS'
    assert (editing['actor'],editing['stickers'],editing['normalization'])==(3240,324,745)
    assert editing['geometry_mismatches']==editing['validation_mismatches']==editing['manual_group_outside_frame']==0
    for name,digest in editing['source'].items():assert sha((ROOT/name).read_bytes())==digest,name
    for name in ('layout-editor.js','layout-editor.css'):assert (ROOT/'browser'/name).read_bytes()==(ROOT/'web/static'/name).read_bytes()
    stickers=json.loads((ROOT/'assets/stickers/manifest.json').read_text())['stickers'];assert len(stickers)==8
    for sid,record in stickers.items():
        for mode,path in record['paths'].items():assert sha((ROOT/path).read_bytes())==record['sha256'][mode]
    examples=json.loads((ROOT/'renders/composition-33-examples.json').read_text());assert len(examples)==2
    for entry in examples:
        data=(ROOT/entry['path']).read_bytes();assert sha(data)==entry['sha256']
        with Image.open(ROOT/entry['path']) as im:
            assert im.size==(3000,2000) and 'DECORAZIONI FACOLTATIVE' in im.info['Description'] and 'POF-26-27' in im.info['Description']
    for path in ('docs/COMPOSIZIONE_E_STICKER.md','docs/FONTI_LOGO.md','assets/stickers/FONTE_LOGO_E_LICENZA.txt','assets/licenses/CC-BY-4.0.txt'):assert (ROOT/path).is_file()
    for directory in ('app','scripts','tests'):
        for p in (ROOT/directory).glob('*.py'):compile(p.read_text(),str(p),'exec')
    node='Not installed; not a runtime requirement'
    try:
        for p in list((ROOT/'browser').glob('*.js'))+[ROOT/'web/static/app.js',ROOT/'web/static/mobile.js']:
            subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
        node='PASS'
    except FileNotFoundError:pass
    assert (ROOT/'docs/GUIDA_RAPIDA.pdf').read_bytes().startswith(b'%PDF-')
    return dict(drag_recovery_checks=72,consecutive_verified_stress_drags=240,original_freeze_reproduced=True,assets_unchanged_from_3_3=473,optional_composition_checks=26,manual_layout_cases=3240,sticker_layout_cases=324,composition_validation_cases=745,optional_stickers=8,decorated_hd_examples=2,photo_sources=12,nes_backgrounds=12,retained_3_1_backgrounds_unchanged=6,lpc_parts=56,source_lpc_pngs=255,hd_png_examples=13,jpg_examples=24,
                screenshots=shot_counts,unit_tests=unit_count,nes_art_integrity='PASS: twelve canonical 600x400 paintings, at most 64 colours each',nes_redesign_checks=8,control_pixel_comparisons=3250,zero_pixel_alternatives_explicitly_reported=563,actual_control_ui_clicks=controls['actual_ui_alternative_clicks'],
                layout_cases=12096,all_standalone_hd_exports=24,all_python_http_hd_exports=24,go_top_level_race_tests=26,service_browser_checks=15,standalone_browser_checks=22,
                independently_extracted_copy='PENDING: candidate only' if candidate else 'PASS',
                real_backend_expiry='PASS, 300 actual seconds',native_service_stop='PASS on Linux; not native Windows',
                source_syntax='PASS',javascript_syntax=node,no_visitor_files='PASS',png_dimensions_and_attribution='PASS',
                windows_native='NOT TESTED',physical_phone_school_wifi='NOT TESTED')


def build(candidate=False):
    checks=check(candidate)
    data=dict(result='CANDIDATE' if candidate else 'PASS',date='2026-11-27',revision='3.3.1: shared drag interruption/capture-loss recovery and preview ownership; all 473 assets unchanged from 3.3; retained twelve places / LPC / offline HD / Windows LAN PNG QR',
              archive=OUTPUT.name,preflight=checks,archive_crc='Verified after writing',manifest_sha256='Verified against every included ZIP member',
              excluded='All var files except README, visitor PNGs, caches, virtualenvs, toolchains and QA Linux binaries.',
              windows_native='NOT TESTED; only cross-compilation and same-source Linux checks',physical_phone='NOT TESTED — required on school LAN')
    AUDIT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    listing=[p for p in files() if p!=MANIFEST]
    MANIFEST.write_text(''.join(f'{sha(p.read_bytes())}  {p.relative_to(ROOT).as_posix()}\n' for p in listing))
    listing=files()
    with zipfile.ZipFile(OUTPUT,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in listing:z.write(p,Path(ROOT.name)/p.relative_to(ROOT))
    with zipfile.ZipFile(OUTPUT) as z:
        assert z.testzip() is None,'Corrupt ZIP member'
        names=z.namelist();assert len(names)==len(set(names))==len(listing)
        for name in (EXE,'start.sh'):assert (z.getinfo(ROOT.name+'/'+name).external_attr>>16)&0o111==0o111,'ZIP executable mode: '+name
        assert all(n.startswith(ROOT.name+'/') and '/..' not in n for n in names)
        assert not any('/var/' in n and not n.endswith('/var/README.md') for n in names)
        for line in MANIFEST.read_text().splitlines():
            digest,relative=line.split('  ',1);assert sha(z.read(ROOT.name+'/'+relative))==digest,relative
    digest=sha(OUTPUT.read_bytes());OUTPUT.with_suffix('.zip.sha256').write_text(digest+'  '+OUTPUT.name+'\n')
    print(json.dumps(dict(result='CANDIDATE' if candidate else 'PASS',archive=str(OUTPUT),files=len(listing),bytes=OUTPUT.stat().st_size,sha256=digest,checks=checks),ensure_ascii=False,indent=2))


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--candidate',action='store_true',help='Before extracted-copy smoke; NOT final delivery.')
    build(parser.parse_args().candidate)
