#!/usr/bin/env python3
"""Genera dati statici dei quiz dai contenuti editoriali e dal blueprint locale."""
from __future__ import annotations
import json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'data/quiz-config.json').read_text())
QUESTION_DEPTH=json.loads((ROOT/'data/question-depth.json').read_text())
BRANCH_RESPONSES=json.loads((ROOT/'data/branch-responses.json').read_text())
OUT=ROOT/'data/quizzes'; OUT.mkdir(parents=True,exist_ok=True)

PHOTO_ITEMS=[
 ('real-01','Gatto domestico a pelo lungo','animali'),('ai-01','Cuffie wireless su fondo chiaro','oggetti'),
 ('real-02','Fiori primaverili davanti a un edificio','natura'),('ai-02','Smartphone color bronzo fotografato dall’alto','oggetti'),
 ('real-03','Bicicletta in una strada di Jabalpur','oggetti'),('ai-03','Oggetti su un tavolo con interfaccia fotografica','oggetti'),
 ('real-04','Sentiero tra gli alberi vicino a Williamsburg','paesaggi'),('ai-04','Automobile con neve sul cofano','oggetti'),
 ('ai-05','Gatto fra foglie autunnali','animali'),('real-05','Vetrina di una libreria','ambienti'),
 ('ai-06','Orologio da polso in luce naturale','oggetti'),('real-06','Panetteria con dolci esposti','cibo'),
 ('ai-07','Piatto di sushi fotografato da vicino','cibo'),('real-07','Costa erbosa affacciata sul mare','paesaggi'),
 ('ai-08','Interno di una stanza vicino a una finestra','ambienti'),('real-08','Dolci siciliani su un piatto','cibo'),
]
PHOTO_RESULTS=[
 ('zero','Zero indizi certi','Riconoscere la provenienza da una singola immagine è difficile: il risultato non misura intelligenza o alfabetizzazione digitale.','Confronta i tuoi dubbi e osserva come cambia la confidenza dopo il feedback.'),
 ('uno','Primo giro di osservazione','Hai colto un indizio in questa prova, ma la classificazione resta un esercizio probabilistico.','Non trasformare un dettaglio isolato in una regola universale.'),
 ('due','Sguardo in allenamento','Due risposte corrette sono un punto di partenza per confrontare aspettative e segnali visivi.','Rivedi le immagini dopo aver conosciuto la provenienza, senza colpevolizzarti.'),
 ('tre','Qualche intuizione','Tre classificazioni corrette indicano intuizioni utili, ma un campione piccolo non dimostra una tecnica affidabile.','Chiediti quali indizi ti hanno convinto e quanto erano davvero diagnostici.'),
 ('quattro','A metà del percorso','Hai riconosciuto alcune immagini; fotografie e sistemi generativi possono condividere indizi e imperfezioni.','Prova a distinguere impressione, confidenza e prova verificabile.'),
 ('cinque','Occhio curioso','Cinque risposte corrette mostrano un risultato interessante su questa selezione, non una capacità stabile in ogni contesto.','Nota quali categorie ti hanno messo più alla prova.'),
 ('sei','Intuitivo con metodo','Hai ottenuto un buon numero di risposte corrette. Il feedback e la revisione contano quanto il colpo d’occhio.','Usa la confidenza per capire dove la tua intuizione è ben calibrata.'),
 ('sette','Quasi a fuoco','Sette risposte corrette in questa sessione: ottimo risultato, senza che diventi una garanzia generale.','Le immagini sintetiche cambiano rapidamente; resta curioso e prudente.'),
 ('otto','Occhio d’aquila — in questa prova','Hai classificato correttamente tutte le immagini di questo campione. È una sessione riuscita, non una prova che esista un segno infallibile.','Continua a controllare fonti e contesto: la sola immagine non basta sempre.'),
]

def parse_blueprint():
    text=(ROOT/'docs/grafi-e-punteggi.md').read_text()
    parts=re.split(r'(?m)^## (\d+) — ([^\n]+)\n',text)
    sections={}
    for i in range(1,len(parts),3):
        num=int(parts[i]); title=parts[i+1]; body=parts[i+2]
        m=re.search(r'(?m)^\*\*Banca:\*\*\s*(.+)$',body)
        if m: prompts=[re.sub(r'^Q\d+\s*[—–-]\s*','',x.strip()) for x in m.group(1).split(';')]
        elif num==1:
            prompts=PHOTO_ITEMS
        else:
            prompts=[]
        sections[num]=(title,body,prompts)
    return sections
SECTIONS=parse_blueprint()
SLUGS=['umano-o-ai','tipo-di-mente','apocalisse','villain','epoca-storica','dio-greco','parola-latina','filosofo','personaggio-antico','scegli-il-classico']
SEP='https://plato.stanford.edu/entries/'
BRIT='https://www.britannica.com/'
PERSON_URLS={
 'alessandro':BRIT+'biography/Alexander-the-Great','cesare':BRIT+'biography/Julius-Caesar-Roman-ruler','annibale':BRIT+'biography/Hannibal-Carthaginian-general','pericle':BRIT+'biography/Pericles-Athenian-statesman','cicerone':BRIT+'biography/Cicero','augusto':BRIT+'biography/Augustus-Roman-emperor','cleopatra':BRIT+'biography/Cleopatra-queen-of-Egypt','leonida':BRIT+'biography/Leonidas-king-of-Sparta','hatshepsut':BRIT+'biography/Hatshepsut','ashoka':BRIT+'biography/Ashoka','enheduanna':'https://etcsl.orinst.ox.ac.uk/','ipazia':BRIT+'biography/Hypatia'}
PHILOSOPHER_URLS={'socrate':SEP+'ethics-ancient/','platone':SEP+'plato/','aristotele':SEP+'aristotle/','epicuro':SEP+'epicurus/','diogene':SEP+'ethics-ancient/','zenone':SEP+'stoicism/','marco-aurelio':SEP+'marcus-aurelius/','seneca':SEP+'ethics-ancient/','eraclito':SEP+'presocratics/','pitagora':SEP+'pythagoreanism/','pirrone':SEP+'skepticism-ancient/','anassimandro':SEP+'presocratics/'}
EPOCH_URLS={'grecia':SEP+'ancient-political/','repubblica':SEP+'ancient-political/','impero':BRIT+'place/Roman-Empire','medioevo':BRIT+'event/Middle-Ages','rinascimento':BRIT+'event/Renaissance','esplorazioni':BRIT+'event/European-exploration','illuminismo':SEP+'enlightenment/','industriale':BRIT+'event/Industrial-Revolution','belle-epoque':BRIT+'event/Belle-Epoque','novecento':BRIT+'topic/history/20th-century'}
LATIN_URLS={'virtus':'virtus','fides':'fides','constantia':'constantia','prudentia':'prudentia','audacia':'audacia','clementia':'clementia','dignitas':'dignitas','libertas':'libertas','auctoritas':'auctoritas','aequitas':'aequitas','amicitia':'amicitia','cura':'cura','otium':'otium','gloria':'gloria'}

def source_links(slug, result):
    rid=result['id']; links=[]
    def add(label,url): links.append({'label':label,'url':url})
    if slug=='umano-o-ai': add('Dataset e documentazione WasItAIGenerated','https://github.com/wasitaigenerated/ai-image-detection-benchmark')
    elif slug=='epoca-storica': add('Approfondimento storico di riferimento',EPOCH_URLS[rid])
    elif slug=='dio-greco':
        add('Britannica — Greek mythology','https://www.britannica.com/topic/Greek-mythology')
        add('Perseus Digital Library — testi antichi','https://www.perseus.tufts.edu/hopper/')
    elif slug=='parola-latina': add(f"Lewis & Short, lemma {LATIN_URLS[rid]}",f"https://www.perseus.tufts.edu/hopper/morph?l={LATIN_URLS[rid]}&la=la")
    elif slug=='filosofo': add('Stanford Encyclopedia of Philosophy — voce di riferimento',PHILOSOPHER_URLS[rid])
    elif slug=='personaggio-antico': add('Scheda storico-enciclopedica / fonte primaria',PERSON_URLS[rid])
    elif slug=='scegli-il-classico': add('Liceo Casardi — informazioni istituzionali', 'https://www.liceocasardi.edu.it/')
    return links

# Result assets are original project illustrations; result wording is stored independently in config.
def visual(slug, kind, key, description):
    rootid=f'{slug}:{kind}:{key}'
    path=f'assets/quiz-art/{slug}/{kind}-{key}.svg'
    return {'src':'../'+path,'sourceId':rootid,'alt':description,'manifestPath':path}

def ordinary_quiz(slug, index):
    title,body,prompts=SECTIONS[index]
    cfg=CONFIG[slug]
    if len(prompts)!=16: raise ValueError(f'{slug}: attese 16 domande, trovate {len(prompts)}')
    if len(QUESTION_DEPTH.get(slug,[]))!=16: raise ValueError(f'{slug}: servono 16 trade-off editoriali')
    if len(cfg['approaches'])!=6: raise ValueError(f'{slug}: servono sei strategie di risposta')
    if any(not approach.get('feedback') for approach in cfg['approaches']): raise ValueError(f'{slug}: feedback riflessivo mancante per una strategia')
    if any(len(BRANCH_RESPONSES.get(slug,{}).get(qid,[]))!=6 for qid in ('Q01','Q06','Q11')): raise ValueError(f'{slug}: risposte contestuali mancanti su uno snodo')
    questions=[]
    branch_dest={1:['Q02','Q03','Q04','Q05','Q03','Q04'],6:['Q07','Q08','Q09','Q10','Q08','Q09'],11:['Q12','Q12','Q13','Q13','Q14','Q14']}
    fixed={2:'Q06',3:'Q06',4:'Q06',5:'Q06',7:'Q11',8:'Q11',9:'Q11',10:'Q11',12:'Q15',13:'Q15',14:'Q15',15:'Q16'}
    for n,prompt in enumerate(prompts,1):
        qid=f'Q{n:02d}'; options=[]
        count=len(cfg['approaches'])
        for ai,approach in enumerate(cfg['approaches']):
            if n in branch_dest: nxt=branch_dest[n][ai]
            else: nxt=fixed.get(n)
            oid=approach['id']
            response=BRANCH_RESPONSES[slug][qid][ai] if qid in BRANCH_RESPONSES[slug] else approach['text'][(n-1)%len(approach['text'])]
            options.append({'id':oid,'label':approach['label'],'text':response,
                'image':visual(slug,'option',f'{qid}-{oid}',f"Illustrazione originale: {approach['label']} — {title}, {qid}"),
                'scores':approach['scores'],'feedback':approach['feedback'],**({'next':nxt} if nxt else {})})
        question={'id':qid,'number':n,'prompt':prompt,'tradeoff':QUESTION_DEPTH[slug][n-1],'image':visual(slug,'question',qid,f"Illustrazione originale pertinente a: {prompt}"),'options':options,'minimumOptions':count}
        if n==16: question['terminal']=True
        questions.append(question)
    results=[]
    dims=cfg['dimensions']
    for i,r in enumerate(cfg['results']):
        # Distribuisce i match sui sei stili; i tre snodi hanno 6 scelte ciascuno.
        a=i%6; b=(i//6)%6; c=(i//36)%6
        rr=dict(r)
        style=cfg['approaches'][i%len(cfg['approaches'])]
        rr['scoreStyle']=style['id']
        rr['match']=list(style['scores'].keys())[:2]
        rr['branchMatch']={'Q01':'ABCDEF'[a],'Q06':'ABCDEF'[b],'Q11':'ABCDEF'[c]}
        rr['sourceLinks']=source_links(slug,rr)
        rr['image']=visual(slug,'result',rr['id'],f"Illustrazione originale del profilo {rr['title']}")
        results.append(rr)
    return {'id':slug,'title':title,'intro':f"Otto domande, sei strategie di risposta, tre snodi e un profilo esplorativo ispirato a {title.lower()}: non è una diagnosi né una misura scientifica.",
      'category':f'{index:02d} · QUIZ','binary':False,'dimensions':dims,'questions':questions,'results':results,
      'startQuestion':'Q01','sessionLength':8,'minimumResults':8,'branchQuestions':['Q01','Q06','Q11']}

def photo_quiz():
    slug='umano-o-ai'; title=SECTIONS[1][0]
    assets=json.loads((ROOT/'data/human-ai-assets.json').read_text())
    byid={f"{a['label']}-{a['id'][-2:]}":a for a in assets}
    questions=[]; key={}
    targets={1:{'real-low':'Q02','real-high':'Q03','ai-low':'Q04','ai-high':'Q05'},
             6:{'real-low':'Q07','real-high':'Q08','ai-low':'Q09','ai-high':'Q10'},
             11:{'real-low':'Q12','real-high':'Q13','ai-low':'Q14','ai-high':'Q14'}}
    fixed={2:'Q06',3:'Q06',4:'Q06',5:'Q06',7:'Q11',8:'Q11',9:'Q11',10:'Q11',12:'Q15',13:'Q15',14:'Q15',15:'Q16'}
    for n,(asset_id,description,category) in enumerate(PHOTO_ITEMS,1):
        qid=f'Q{n:02d}'; asset=byid[asset_id]
        opts=[]
        for label in ('real','ai'):
            o={'id':label,'label':'Fotografia' if label=='real' else 'Immagine generata dall’AI',
               'text':'La mia risposta è fotografia.' if label=='real' else 'La mia risposta è immagine generata dall’AI.',
               'image':visual(slug,'option',f'{qid}-{label}',f"Simbolo di risposta {label}, illustrazione originale")}
            if n in targets: o['nextBy']=targets[n]
            elif n in fixed: o['next']=fixed[n]
            opts.append(o)
        image={'src':'../'+asset['localPath'],'sourceId':asset['id'],'alt':'Immagine-test: osserva la scena e decidi la provenienza.','manifestPath':asset['localPath']}
        questions.append({'id':qid,'number':n,'prompt':'Secondo te, questa immagine è una fotografia autentica o è stata generata con un sistema di intelligenza artificiale?','image':image,'options':opts,
          'confidenceRequired':True,'routeBand':'confidence','minimumOptions':2,**({'terminal':True} if n==16 else {})})
        key[qid]={'assetId':asset['id'],'label':asset['label'],'description':description,'sourcePage':asset['sourcePage'],'sourceUrl':asset['sourceUrl'],'creator':asset['creator'],'generator':asset.get('generator'),'license':asset['license'],'attribution':asset['attribution'],'category':category}
    results=[]
    for i,(rid,name,summary,nudge) in enumerate(PHOTO_RESULTS):
        results.append({'id':rid,'title':name,'summary':summary,'strength':'Il dato mostra solo quante risposte coincidono con l’etichetta verificata nel campione.','tension':'La confidenza è una stima personale; non è una misura clinica o una prova di competenza universale.','nudge':nudge,'sources':['Benchmark WasItAIGenerated, immagini originali selezionate; provenienza individuale nel manifest.'],'sourceLinks':source_links(slug,{'id':rid}),'match':[],'image':visual(slug,'result',rid,f"Illustrazione originale del risultato: {name}"),'exactCorrect':i})
    (ROOT/'data/human-ai-answer-key.json').write_text(json.dumps(key,ensure_ascii=False,indent=2)+'\n')
    return {'id':slug,'title':title,'intro':'Allena lo sguardo senza pretendere che un singolo indizio basti. Prima di iniziare: il campione include immagini sintetiche e fotografie; la provenienza di ciascuna viene svelata solo dopo la tua risposta.','category':'01 · SFIDA VISIVA','binary':True,'dimensions':['accuratezza','calibrazione','miglioramento'],'questions':questions,'results':results,'startQuestion':'Q01','sessionLength':8,'minimumResults':8,'branchQuestions':['Q01','Q06','Q11'],'answerKey':'../data/human-ai-answer-key.json'}

for idx,slug in enumerate(SLUGS,1):
    data=photo_quiz() if slug=='umano-o-ai' else ordinary_quiz(slug,idx)
    (OUT/f'{slug}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(slug,len(data['questions']),len(data['results']))
