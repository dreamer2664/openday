"""Read-only generated font and vendored QR data integrity checks.
No builds, source writes or release publication. Independent Python QR tables
are a cross-implementation check, not a proof of every upstream function.
"""
from pathlib import Path
from datetime import datetime,timezone
import re,json,hashlib,base64,io,sys
import qrcode.base as base
import qrcode.util as util
from fontTools.ttLib import TTFont
C=Path('/home/user/.cache/casardi-rootcause');R=C/'casardi_postcard';V=R/'service/vendor/github.com/skip2/go-qrcode'
sys.path.insert(0,str(R));from scripts.build_standalone import font_bytes
raw=base64.b64decode(re.search(r'const phoneFontData = "([A-Za-z0-9+/=]+)"',(R/'service/phone_font.go').read_text())[1],validate=True)
assert raw==font_bytes(R/'assets/fonts/PressStart2P-Regular.ttf','Casardi Pixel')
assert base64.b64encode(raw).decode() in (R/'Cartolina_Casardi_PC_e_Telefono.html').read_text()
font=TTFont(io.BytesIO(raw));names=[r.toUnicode() for r in font['name'].names if r.nameID in [1,4,6]];assert all('Casardi' in n for n in names)
f=dict(result='PASS',executed_at_workspace_utc=datetime.now(timezone.utc).isoformat(),generated_font_bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest(),generator_byte_equal=True,embedded_in_production_html=True,internal_names=names,glyph_count=len(font.getGlyphOrder()),unicode_points=len(font.getBestCmap()))
(C/'font-integrity.json').write_text(json.dumps(f,indent=2))
text=(V/'version.go').read_text()
rows=re.findall(r'\{\s*(\d+),\s*(Low|Medium|High|Highest),\s*(dataEncoderType\w+),\s*\[\]block\{(.*?)\}\s*,\s*(\d+),\s*\}',text,re.S);assert len(rows)==160
levels=['Low','Medium','High','Highest']
for i,(version,level,encoder,blocks,remainder) in enumerate(rows):
 assert int(version)==i//4+1 and level==levels[i%4]
 assert tuple(map(int,re.findall(r'\b\d+\b',blocks)))==base.RS_BLOCK_TABLE[i]
 assert encoder==('dataEncoderType1To9' if int(version)<=9 else 'dataEncoderType10To26' if int(version)<=26 else 'dataEncoderType27To40')
gf=re.sub(r'/\*.*?\*/','',(V/'reedsolomon/gf2_8.go').read_text(),flags=re.S)
exp=list(map(int,re.findall(r'-?\d+',re.search(r'gfExpTable = \[256\]gfElement\{(.*?)\}',gf,re.S)[1])));logs=list(map(int,re.findall(r'-?\d+',re.search(r'gfLogTable = \[256\]int\{(.*?)\}',gf,re.S)[1])));assert len(exp)==len(logs)==256
expected=[1]
for _ in range(255):
 t=expected[-1]<<1;expected.append(t^0x11d if t&0x100 else t)
assert exp==expected and logs[0]==-1
for i,x in enumerate(exp[:255]):assert logs[x]==i
formats=[int(n,16) for n in re.findall(r'\{(0x[0-9a-f]+), 0x[0-9a-f]+\}',text)];assert len(formats)==32
for i,f in enumerate(formats):assert f==util.BCH_type_info(i)
verblock=re.search(r'versionBitSequence = \[\]uint32\{(.*?)\}',text,re.S)[1];versions=[int(n,16) for n in re.findall(r'0x[0-9a-f]+',verblock)];assert len(versions)==41
for n in range(7,41):assert versions[n]==util.BCH_type_number(n)
align=re.search(r'alignmentPatternCenter = \[\]\[\]int\{(.*?)\n\t\}',(V/'regular_symbol.go').read_text(),re.S)[1];align=re.sub(r'//[^\n]*','',align);align=[[int(n) for n in re.findall(r'\d+',s)] for s in re.findall(r'\{(.*?)\}',align)];assert align[1:]==util.PATTERN_POSITION_TABLE
sources=[dict(path=str(p.relative_to(R)),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),lines=len(p.read_text().splitlines())) for p in sorted(V.rglob('*.go'))]
r=dict(result='PASS',executed_at_workspace_utc=datetime.now(timezone.utc).isoformat(),scope='All nine vendored Go sources read; QR tables independently checked against Python qrcode tables/BCH routines and a polynomial-generated GF(256) field. No claim that every upstream function was dynamically covered.',qr_versions_checked=160,format_sequences_checked=32,version_sequences_checked=34,alignment_tables_checked=40,gf_exp_entries_checked=256,gf_log_entries_checked=256,sources=sources)
(C/'vendor-data-integrity.json').write_text(json.dumps(r,indent=2));print('PASS generated phone font and all independent QR data-table checks')
