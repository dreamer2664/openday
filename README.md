# Casardi Arcade + 8-bit — progetti Open Day

Un catalogo arcade con dieci quiz italiani originali e l’avventura platform preesistente del Liceo Casardi. Interfaccia, dati e immagini di gioco sono locali; non ci sono account, analitiche o risposte salvate. I quiz usano bundle JavaScript locali (nessuna chiamata fetch o API): dopo aver estratto lo ZIP puoi aprire `index.html`; se il browser limita i file locali, avvia il server statico indicato sotto.

## Avvio

Dalla cartella del repository:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Apri `http://localhost:8000/`. La home è la sala giochi; scegli una cartuccia e premi **Inizia**. Per l’avventura platform già esistente, scegli il link in alto o visita `platform.html`.

I quiz hanno una sessione standard di otto domande, percorsi ramificati, riprova e ritorno alla sala giochi. Nei nove quiz narrativi, ogni dilemma presenta sei risposte strategiche e un vincolo aggiuntivo (“In bilico”) su conseguenze, incertezze e prospettive; l’ordine delle risposte cambia a ogni schermata. Dopo ogni scelta compare una riflessione specifica sullo stile scelto, sui tratti influenzati e sulla prossima tappa, senza assegnare risposte giuste o sbagliate. “Umano o AI?” mantiene le due scelte di classificazione e la scala di confidenza. Include un avviso generale prima di iniziare e feedback con provenienza dopo ogni risposta; i singoli esiti non sono mostrati durante la domanda. La disclosure attuale riflette la decisione editoriale del committente e non costituisce un parere legale.

## Struttura

- `index.html`, `styles/arcade.css` — home arcade responsive.
- `quizzes/*.html` — dieci pagine HTML distinte e giocabili.
- `data/quizzes/*.json` — sorgenti leggibili dei quiz, grafi, sei opzioni, trade-off, feedback e risultati.
- `data/quizzes/*.js` — bundle locali caricati dalle pagine quiz senza `fetch`, compatibili con l'apertura da cartella estratta.
- `data/question-depth.json` — vincoli e conseguenze contestuali per ogni domanda narrativa.
- `data/branch-responses.json` — sei risposte scritte appositamente per ciascuno dei tre snodi di ogni quiz, così il testo cambia con il dilemma e non solo con lo stile.
- `data/human-ai-answer-key.json` e `.js` — chiavi/fonti dell’immagine fotografica; il bundle locale viene inserito nella pagina solo dopo la risposta.
- `data/asset-manifest.json` — manifest unico per cover, fotografie di prova e illustrazioni di domanda/opzione/risultato.
- `assets/quiz-art/` — SVG originali e locali; il codice generatore è `scripts/build_quiz_art.py`.
- `assets/human-ai/` — fotografie reali e immagini sintetiche di terzi per la prova.
- `platform.html`, `style.css`, `game.js` — avventura platform originale, conservata.
- `docs/ricerca-e-progettazione.md`, `docs/grafi-e-punteggi.md` — fonti e blueprint dei contenuti.
- `ASSET_CREDITS.md` — licenze e attribuzioni.

## Test

```bash
node --check game.js
node tests/smoke.cjs
node --check scripts/quiz-engine.js
node --check scripts/quiz-page.js
node tests/quiz-engine.cjs
```

`tests/quiz-engine.cjs` controlla i dieci dataset, i 16 nodi, le sei risposte e i trade-off narrativi, gli otto quesiti per sessione, i link nel manifest e la raggiungibilità dei risultati; esplora 216 combinazioni di ramo per quiz narrativo, poi simula 500 sessioni per quiz e 20.000 per la prova fotografica. Le simulazioni automatiche non sostituiscono playtest con visitatori né revisione editoriale o legale.

Per rigenerare i dati e le illustrazioni originali dopo modifiche ai contenuti:

```bash
python3 scripts/build_quiz_data.py
python3 scripts/build_quiz_art.py
```

Le immagini SVG sono disegnate con primitive deterministiche locali (non generate da un modello d’immagini) e attribuite nel manifest. Il runtime non carica CDN, font, librerie o immagini esterne; solo i link di attribuzione rimandano ai siti delle fonti.
