#!/usr/bin/env python3
"""Disegna SVG vettoriali originali con primitive esplicite; non usa modelli generativi."""
from __future__ import annotations
import json, hashlib, html, re, textwrap
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data/quizzes'; ASSET_ROOT=ROOT/'assets/quiz-art'

PALETTES=[('#161a2e','#80e8df','#ff729e','#f7d77a'),('#20203a','#f4b0cb','#83e7db','#ffdf85'),('#182b35','#f5cf68','#ff779b','#a5e6d0'),('#282039','#83dcf0','#f7ba70','#f2e8d5'),('#1e2a3d','#ff839b','#80e8df','#f4d372')]
MOTIF_WORDS=[
 (('acqua','mare','nave','oceano','poseidone','onda','costa','pesce','sushi'),'wave'),
 (('libro','testo','parola','lettura','sapere','studio','biblioteca','latina','grammatica','papiro'),'book'),
 (('fiore','foglia','natura','albero','pianta','giardino','demetra','artemide'),'leaf'),
 (('patto','regola','equità','giustizia','legge','accordo','promessa','istituzione'),'scale'),
 (('viaggio','strada','rotta','mappa','esplor','mobilità','ermes','sentiero'),'compass'),
 (('tempo','epoca','secolo','orologio','attesa','ritmo','storia'),'clock'),
 (('ripar','guasto','officina','tecnica','macchina','innov','strumento','tecnologia'),'gear'),
 (('città','comunità','assemblea','coalizione','ascolto','gruppo','alleanza','diplomazia'),'people'),
 (('teatro','scena','villain','sipario','spettacolo','maschera'),'mask'),
 (('coraggio','conflitto','guerra','rischio','difesa','ares','scudo'),'shield'),
 (('arte','musica','apollo','afrodite','crea','opera','dioniso'),'lyre'),
 (('autorità','zeus','hera','potere','corona','comando'),'crown'),
 (('fede','fides','fama','gloria','dignitas','riconoscimento'),'laurel'),
 (('cibo','scorte','risorse','dolci','panetteria','nutri'),'basket'),
 (('casa','rifugio','interno','stanza','estia','riparo'),'house'),
 (('dubbio','prova','analisi','ragion','socrate','domanda','indizio'),'lens'),
 (('ambizione','personaggio','strategia','alessandro','annibale','cesare'),'helmet'),
 (('equilibrio','misura','aequitas','prudentia','armonia'),'compass'),
]
MOTIF_DRAW={
'book':'<path d="M-52 -35 Q-18 -45 0 -28 Q18 -45 52 -35 L52 34 Q17 23 0 40 Q-18 23 -52 34Z"/><path d="M0 -28V40M-40 -19Q-18 -23 -9 -14M-40 -5Q-18 -9 -9 0M12 -14Q28 -23 40 -19M12 0Q28 -9 40 -5" fill="none" stroke="{a}" stroke-width="5" stroke-linecap="round"/>',
'leaf':'<path d="M-48 25 Q-54 -35 43 -43 Q47 17 -20 38 Q-35 42 -48 25Z"/><path d="M-43 30Q-5 0 35 -32M-18 10L-24 -13M3 -8L1 -28M-3 5L20 8" fill="none" stroke="{a}" stroke-width="5" stroke-linecap="round"/>',
'scale':'<path d="M0 -43V40M-44 -25H44M-32 -25L-46 8H-18Z M32 -25L18 8H46Z M-30 40H30"/><path d="M-18 8Q-32 22 -46 8M18 8Q32 22 46 8" fill="none" stroke="{a}" stroke-width="5" stroke-linecap="round"/>',
'compass':'<circle r="43"/><path d="M0 -36L13 0L0 36L-13 0Z"/><circle r="7" fill="{a}"/><path d="M-55 0H-42M42 0H55M0 -55V-42M0 42V55" stroke="{a}" stroke-width="4"/>',
'clock':'<circle r="42"/><path d="M0 -26V2L24 16M-12 -54H12" fill="none" stroke="{a}" stroke-width="7" stroke-linecap="round"/><circle r="5" fill="{b}"/>',
'gear':'<path d="M-10 -52H10L15 -39L27 -34L39 -40L52 -26L45 -14L49 0L62 6L58 25L44 28L35 40L39 53L22 62L12 51H-2L-10 63L-28 56L-25 42L-36 32L-50 34L-57 16L-45 7L-45 -8L-57 -18L-48 -35L-34 -31L-23 -40L-24 -54L-5 -59Z"/><circle r="19" fill="none" stroke="{a}" stroke-width="7"/>',
'people':'<circle cx="-25" cy="-22" r="15"/><circle cx="25" cy="-22" r="15"/><circle cy="-35" r="15"/><path d="M-52 37Q-48 0 -25 0Q-5 0 -1 31M52 37Q48 0 25 0Q5 0 1 31M-25 38Q-20 -2 0 -2Q20 -2 25 38Z"/>',
'mask':'<path d="M-47 -40Q0 -57 47 -40L40 17Q27 44 0 53Q-27 44 -40 17Z"/><path d="M-28 -12Q-15 -22 -5 -12M5 -12Q15 -22 28 -12M-19 19Q0 31 19 19" fill="none" stroke="{a}" stroke-width="5" stroke-linecap="round"/>',
'shield':'<path d="M0 -50L43 -34V0Q38 35 0 53Q-38 35 -43 0V-34Z"/><path d="M-20 0L-4 16L23 -18" fill="none" stroke="{a}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>',
'lyre':'<path d="M-38 -43Q-52 -12 -42 23Q-30 53 0 42Q30 53 42 23Q52 -12 38 -43M-35 -35V-14Q0 12 35 -14V-35M-26 -29V28M-10 -20V38M10 -20V38M26 -29V28" fill="none" stroke="{a}" stroke-width="5" stroke-linecap="round"/>',
'crown':'<path d="M-48 35L-55 -22L-26 0L0 -43L26 0L55 -22L48 35Z"/><path d="M-42 18H42" stroke="{a}" stroke-width="5"/>',
'laurel':'<path d="M-3 48Q-10 0 4 -48M-8 28Q-42 28 -40 4Q-14 1 -7 18M-7 5Q-39 -4 -29 -27Q-7 -20 -4 -2M-3 -19Q-23 -34 -5 -49Q10 -34 3 -18M8 29Q42 29 40 5Q14 2 7 19M7 5Q39 -4 29 -27Q7 -20 4 -2" fill="none" stroke="{a}" stroke-width="6" stroke-linecap="round"/>',
'basket':'<path d="M-48 -8H48L38 43H-38Z M-28 -8L0 -43L28 -8M-20 0L-15 36M0 0V38M20 0L15 36" fill="none" stroke="{a}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
'house':'<path d="M-51 -2L0 -45L51 -2V43H-51Z M-13 43V9H13V43M-36 8H-20V24H-36ZM20 8H36V24H20Z"/>',
'lens':'<circle cx="-8" cy="-10" r="35" fill="none" stroke="{a}" stroke-width="8"/><path d="M18 17L49 48" stroke="{a}" stroke-width="11" stroke-linecap="round"/><circle cx="-8" cy="-10" r="12" fill="{b}"/>',
'helmet':'<path d="M-48 18Q-49 -35 0 -47Q49 -35 48 18H22Q17 -2 0 -4Q-17 -2 -22 18Z M-53 19H53V32H-53Z M0 -44V-14"/>',
'wave':'<path d="M-56 13Q-37 -17 -18 13Q0 43 19 13Q38 -17 57 13M-56 35Q-37 5 -18 35Q0 65 19 35Q38 5 57 35M-38 -15Q-12 -44 12 -15Q29 1 44 -18" fill="none" stroke="{a}" stroke-width="6" stroke-linecap="round"/>',
}
CYCLE=['book','leaf','scale','compass','clock','gear','people','mask','shield','lyre','crown','laurel','basket','house','lens','helmet','wave']
SLUG_CYCLES={
 'tipo-di-mente':['lens','book','compass','people','gear','leaf','scale','clock'],
 'apocalisse':['basket','compass','gear','people','shield','house','clock','wave'],
 'villain':['mask','crown','gear','lyre','shield','lens','laurel','compass'],
 'epoca-storica':['column','book','compass','gear','people','clock','basket','laurel','house','wave'],
 'dio-greco':['crown','scale','wave','basket','shield','lyre','leaf','helmet','rose','gear','wing','mask','hearth','gate'],
 'parola-latina':['laurel','handshake','anchor','lens','spear','heart','column','chain','crown','scale','people','lamp','chair','star'],
 'filosofo':['speech','book','lens','heart','lamp','column','wave','scale','leaf','compass','cloud','sun'],
 'personaggio-antico':['helmet','eagle','map','speech','scroll','laurel','sphinx','shield','obelisk','wheel','tablet','lamp'],
 'scegli-il-classico':['book','scroll','speech','lamp','compass','people','tablet','star'],
 'umano-o-ai':['camera','spark','lens','phone','cat','clock','plate','window','eye']}
# Extra symbols implemented as compact, meaningful original vector drawings.
MOTIF_DRAW.update({
'column':'<path d="M-35 -42H35V-30H-35ZM-25 -28H25V28H-25ZM-38 30H38V43H-38ZM-15 -20V23M0 -20V23M15 -20V23"/>',
'rose':'<path d="M0 0Q-34 -10 -13 -37Q2 -52 16 -34Q42 -49 40 -19Q59 -1 35 12Q42 39 12 35Q-2 60 -17 36Q-46 44 -38 15Q-57 -1 -33 -15Q-39 -38 -13 -34Z"/><circle r="10" fill="{a}"/>',
'wing':'<path d="M-46 42Q-43 -34 45 -48Q35 -15 12 4Q34 -4 49 -3Q31 29 -4 33Q-24 48 -46 42Z M-37 35Q-4 14 27 -25M-25 37L-21 16M-8 32L-2 9M10 22L17 3" fill="none" stroke="{a}" stroke-width="5" stroke-linecap="round"/>',
'gate':'<path d="M-48 43V-4Q-48 -42 0 -42Q48 -42 48 -4V43M-30 43V-2Q-30 -24 0 -24Q30 -24 30 -2V43M-56 43H56"/>',
'hearth':'<path d="M-47 24H47L37 43H-37ZM-34 16Q-35 -8 -10 -14Q-23 -42 4 -54Q7 -29 26 -20Q47 -2 34 16Z"/><path d="M0 5Q-8 -12 6 -26Q8 -11 17 -5Q22 7 12 13" fill="{a}"/>',
'handshake':'<path d="M-48 -10L-28 -30L-5 -21L12 -30L44 -13L26 20L7 34L-6 25L-18 33L-31 20Z M-28 -30L-13 -5L4 4L16 -8L29 -2" fill="none" stroke="{a}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>',
'anchor':'<path d="M0 -42V30M-31 -22H31M-48 5Q-42 38 0 44Q42 38 48 5M-12 -40A12 12 0 1 0 12 -40A12 12 0 1 0 -12 -40Z" fill="none" stroke="{a}" stroke-width="6" stroke-linecap="round"/>',
'spear':'<path d="M0 -55L16 -18L0 -7L-16 -18Z M0 -7V47M-12 25H12"/><path d="M-9 47H9" stroke="{a}" stroke-width="5"/>',
'heart':'<path d="M0 45Q-53 12 -43 -17Q-35 -42 -8 -27L0 -18L8 -27Q35 -42 43 -17Q53 12 0 45Z"/>',
'chain':'<g fill="none" stroke="{a}" stroke-width="8"><rect x="-45" y="-25" width="46" height="30" rx="15" transform="rotate(-35)"/><rect x="0" y="-5" width="46" height="30" rx="15" transform="rotate(-35)"/></g>',
'star':'<path d="M0 -52L13 -17L50 -17L20 5L31 42L0 20L-31 42L-20 5L-50 -17L-13 -17Z"/>',
'speech':'<path d="M-46 -32H46V25H9L-12 43V25H-46Z"/><path d="M-28 -11H28M-28 3H15" stroke="{a}" stroke-width="5" stroke-linecap="round"/>',
'sun':'<circle r="22"/><path d="M0 -54V-35M0 35V54M-54 0H-35M35 0H54M-38 -38L-25 -25M25 25L38 38M38 -38L25 -25M-25 25L-38 38" stroke="{a}" stroke-width="7" stroke-linecap="round"/>',
'cloud':'<path d="M-42 30Q-57 27 -55 9Q-53 -8 -34 -10Q-30 -36 -3 -35Q21 -35 26 -13Q49 -20 56 1Q63 24 42 30Z"/><path d="M-16 -5L-1 10L24 -17" fill="none" stroke="{a}" stroke-width="6"/>',
'eagle':'<path d="M0 -18Q-17 -44 -53 -34Q-35 -12 -10 -5L-53 9Q-32 23 -10 17L0 48L10 17Q32 23 53 9L10 -5Q35 -12 53 -34Q17 -44 0 -18Z"/>',
'map':'<path d="M-52 -35L-17 -45L16 -31L52 -42V35L17 45L-16 31L-52 42Z M-17 -45V31M16 -31V45"/><path d="M-4 -4Q-14 -4 -14 -15Q-14 -26 0 -26Q14 -26 14 -15Q14 -6 0 6L-4 13Z" fill="{a}"/>',
'sphinx':'<path d="M-48 38L-38 4Q-24 -5 -12 -2L-6 -26L9 -38L26 -29L32 -8L44 1L52 38Z M-6 -26L-25 -43L-8 -52L10 -40M-20 11H22"/>',
'obelisk':'<path d="M-12 -52H12L18 -40L28 36H-28L-18 -40ZM-38 38H38V50H-38Z"/>',
'tablet':'<rect x="-36" y="-48" width="72" height="96" rx="7"/><path d="M-20 -23H20M-20 -7H20M-20 9H11M-20 25H4" stroke="{a}" stroke-width="5" stroke-linecap="round"/>',
'lamp':'<path d="M-28 -43H28L18 -20H-18ZM0 -19V33M-26 37H26L35 48H-35Z"/><path d="M-18 -55L-27 -65M0 -58V-72M18 -55L27 -65" stroke="{a}" stroke-width="4"/>',
'chair':'<path d="M-28 -43V15H29V-43M-35 15H37M-25 15L-33 47M25 15L33 47M-28 -5H29"/>',
'camera':'<rect x="-48" y="-30" width="96" height="64" rx="10"/><path d="M-27 -30L-18 -44H10L20 -30"/><circle r="23" fill="none" stroke="{a}" stroke-width="8"/><circle r="7" fill="{b}"/>',
'spark':'<path d="M0 -53L9 -12L45 -34L20 -3L55 8L15 12L31 47L0 21L-31 47L-15 12L-55 8L-20 -3L-45 -34L-9 -12Z"/>',
'phone':'<rect x="-31" y="-52" width="62" height="104" rx="10"/><rect x="-22" y="-37" width="44" height="68" rx="3" fill="{a}"/><circle cy="42" r="4" fill="{b}"/>',
'cat':'<path d="M-40 -17L-47 -48L-19 -32Q0 -41 19 -32L47 -48L40 -17Q55 5 43 31Q28 49 0 43Q-28 49 -43 31Q-55 5 -40 -17Z"/><path d="M-25 0H-20M20 0H25M-12 20Q0 27 12 20" stroke="{a}" stroke-width="5" stroke-linecap="round"/>',
'eye':'<path d="M-54 0Q0 -48 54 0Q0 48 -54 0Z" fill="none" stroke="{a}" stroke-width="6"/><circle r="20"/><circle r="7" fill="{a}"/>',
'plate':'<circle r="48" fill="none" stroke="{a}" stroke-width="6"/><circle r="33" fill="none" stroke="{b}" stroke-width="3"/><path d="M-19 -5Q-5 -22 9 -5Q22 13 38 -5" fill="none" stroke="{a}" stroke-width="6"/>',
'window':'<rect x="-44" y="-48" width="88" height="96" rx="4" fill="none" stroke="{a}" stroke-width="7"/><path d="M0 -44V44M-40 0H40" stroke="{b}" stroke-width="5"/><path d="M4 4L31 -28" stroke="{a}" stroke-width="3"/>',
'column':'<path d="M-35 -42H35V-30H-35ZM-25 -28H25V28H-25ZM-38 30H38V43H-38ZM-15 -20V23M0 -20V23M15 -20V23"/>',
})

def motif_for(slug, kind, key, text):
    s=(text or '').lower()
    for words,motif in MOTIF_WORDS:
        if any(w in s for w in words): return motif
    cycle=SLUG_CYCLES.get(slug,CYCLE)
    if kind=='option':
        idx={'A':0,'B':1,'C':2,'D':3,'E':4,'F':5}.get(key[-1:],0)
        return cycle[idx%len(cycle)]
    if kind=='result':
        # Name/id-based stable selection keeps result art distinct and readable.
        digest=int(hashlib.sha256(key.encode()).hexdigest()[:8],16)
        return cycle[digest%len(cycle)]
    m=re.search(r'(\d+)',key)
    idx=int(m.group(1))-1 if m else 0
    return cycle[idx%len(cycle)]

def render(slug, kind, key, title, description, motif, n):
    bg,a,b,c=PALETTES[n%len(PALETTES)]
    glyph=MOTIF_DRAW.get(motif,MOTIF_DRAW['lens']).format(a=a,b=b)
    safe_desc=html.escape(description[:200],quote=True)
    lines=textwrap.wrap(title.replace('\\n',' '),width=34,break_long_words=True,break_on_hyphens=False)[:2] or ['Quiz']
    if len(textwrap.wrap(title,width=34,break_long_words=True))>2: lines[-1]=lines[-1].rstrip('.,;:')+'…'
    title_svg=''.join(f'<text x="256" y="{253+i*19}" text-anchor="middle" fill="{c}" font-family="system-ui,sans-serif" font-size="15" font-weight="800">{html.escape(line,quote=True)}</text>' for i,line in enumerate(lines))
    safe_title=html.escape(' '.join(lines),quote=True)
    symbol=f'''<g transform="translate(256 150)" fill="{b}" stroke="{b}" stroke-width="3" stroke-linejoin="round">{glyph}</g>'''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 360" role="img" aria-labelledby="t d"><title id="t">{safe_title}</title><desc id="d">{safe_desc}</desc><rect width="512" height="360" rx="20" fill="{bg}"/><path d="M18 63H494M18 292H494" stroke="{c}" stroke-width="2" opacity=".55"/><rect x="20" y="18" width="472" height="324" rx="15" fill="none" stroke="{a}" stroke-width="3"/><text x="36" y="48" fill="{a}" font-family="system-ui,sans-serif" font-size="13" font-weight="800" letter-spacing="2">CASARDI ARCADE · {html.escape(kind.upper())}</text>{symbol}{title_svg}<text x="256" y="321" text-anchor="middle" fill="{a}" font-family="monospace" font-size="11" letter-spacing="2">{html.escape(key.upper())}</text></svg>'''

def main():
    assets=[]; seen=set()
    existing=json.loads((ROOT/'data/asset-manifest.json').read_text())
    photo=json.loads((ROOT/'data/human-ai-assets.json').read_text())
    photo_ids={entry['id'] for entry in photo}
    for entry in existing:
        if entry.get('sourceUrl')=='local://original-project-svg': continue
        if entry['id'] not in seen and entry['id'] not in photo_ids:
            assets.append(entry); seen.add(entry['id'])
    for entry in photo:
        if entry['id'] not in seen:
            assets.append(entry); seen.add(entry['id'])
    for file in sorted(DATA.glob('*.json')):
        quiz=json.loads(file.read_text()); slug=quiz['id']
        for q in quiz['questions']:
            for kind,items in [('question',[q]),('option',q['options'])]:
                for item in items:
                    img=item.get('image')
                    if not img or 'manifestPath' not in img or img['sourceId'] in seen: continue
                    path=img['manifestPath']; full=ROOT/path
                    title=item.get('label') or q.get('prompt','')
                    desc=img.get('alt',title)
                    motif=motif_for(slug,kind,item.get('id',q['id']),title+' '+desc)
                    full.parent.mkdir(parents=True,exist_ok=True)
                    full.write_text(render(slug,kind,item.get('id',q['id']),title,desc,motif,len(assets)))
                    assets.append({'id':img['sourceId'],'quizId':slug,'elementId':f"{kind}-{item.get('id',q['id'])}",'localPath':path,'sourcePage':'scripts/build_quiz_art.py','sourceUrl':'local://original-project-svg','creator':'Casardi Arcade — illustrazione vettoriale originale del progetto','license':'CC BY 4.0 (asset originali del progetto)','attribution':'Casardi Arcade, illustrazione originale; CC BY 4.0','description':desc,'medium':'SVG originale, disegnato con primitive SVG deterministiche; nessun modello generativo o risorsa esterna','bytes':full.stat().st_size,'width':512,'height':360,'verified':'2026-11-27'})
                    seen.add(img['sourceId'])
        for result in quiz['results']:
            img=result.get('image')
            if not img or img['sourceId'] in seen: continue
            path=img['manifestPath'];full=ROOT/path;full.parent.mkdir(parents=True,exist_ok=True)
            title=result['title'];desc=img.get('alt',result.get('summary',title));motif=motif_for(slug,'result',result['id'],title+' '+desc)
            full.write_text(render(slug,'result',result['id'],title,desc,motif,len(assets)))
            assets.append({'id':img['sourceId'],'quizId':slug,'elementId':f"result-{result['id']}",'localPath':path,'sourcePage':'scripts/build_quiz_art.py','sourceUrl':'local://original-project-svg','creator':'Casardi Arcade — illustrazione vettoriale originale del progetto','license':'CC BY 4.0 (asset originali del progetto)','attribution':'Casardi Arcade, illustrazione originale; CC BY 4.0','description':desc,'medium':'SVG originale, disegnato con primitive SVG deterministiche; nessun modello generativo o risorsa esterna','bytes':full.stat().st_size,'width':512,'height':360,'verified':'2026-11-27'})
            seen.add(img['sourceId'])
    (ROOT/'data/asset-manifest.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n')
    print(f'{len(assets)} manifest record ({len(assets)-10} non-cover); create {len(list(ASSET_ROOT.rglob("*.svg")))} SVG')
if __name__=='__main__': main()
