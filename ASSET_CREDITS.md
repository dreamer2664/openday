# Crediti e licenze degli asset

## Asset originali

- Grafica di sfondo, architettura stilizzata, personaggi, interfaccia, animazioni procedurali: disegnati nel progetto con primitive Canvas e CSS da `game.js`/`style.css`; nessun file di asset esterno.
- Tema e segnali audio della build 0.1: generati al runtime con oscillatori Web Audio; non contengono campioni o melodie di terzi.
- Testi e sceneggiatura: creati per il prototipo.

## Riferimenti, non incorporati

- Due fotografie della facciata/ingresso del Casardi fornite dal committente. I file sono mantenuti nell’area uploads fuori dal repository; hanno ispirato palette e composizione. Licenza/diritti di riutilizzo pubblico non verificati.
- Sito istituzionale del Liceo Casardi, pagina [Sede centrale](https://www.liceocasardi.edu.it/luogo/sede-casardi/), consultato per fatti e indirizzo. Nessuna foto del sito è copiata nel gioco.

## Quiz arcade

- `assets/covers/`: dieci copertine dal Metropolitan Museum of Art, selezionate con `isPublicDomain=true`. Record, pagina dell'oggetto, URL immagine, autore/credito, medium, stato/licenza, dimensioni e data di verifica in `data/asset-manifest.json`. Fonte programma: [The Met Open Access](https://www.metmuseum.org/about-the-met/policies-and-documents/open-access) e [API della collezione](https://collectionapi.metmuseum.org/).
- `assets/human-ai/`: 8 immagini sintetiche originali del dataset WasItAIGenerated (metadati dichiarano CC BY 4.0; il generatore è riportato per singolo file) e 8 fotografie reali. Per le fotografie la pagina Commons e la licenza individuale sono state controllate via API; sono state scelte solo voci CC0, pubblico dominio o CC BY 4.0. Le etichette e le fonti per file sono conservate in `data/human-ai-assets.json` e `data/human-ai-answer-key.json`; quest'ultimo è richiesto dall'interfaccia soltanto dopo la risposta. Le immagini sono campioni didattici, non un benchmark validato scientificamente.
- `assets/quiz-art/`: illustrazioni SVG originali per ogni domanda, opzione e risultato. Sono composte localmente da primitive SVG dal sorgente `scripts/build_quiz_art.py`, senza modelli generativi, fotografie di terzi, font o risorse remote. Distribuite con licenza CC BY 4.0 e attribuzione «Casardi Arcade, illustrazione originale». File e crediti individuali in `data/asset-manifest.json`.
- Il manifest è l'indice unico di immagini e copertine: include path locale, pagina e URL fonte, creatore, licenza/attribuzione, dimensioni e identificatore stabile. Le immagini del Met sono solo copertine; quelle SVG originali non sono fotografie né sono presentate come tali.

Fonti istituzionali consultate per trasparenza AI: [FAQ della Commissione UE sull'Articolo 50](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act). L'avviso generale prima della prova e la rivelazione dell'etichetta dopo la risposta seguono la decisione editoriale del committente; non sono un parere legale né una conclusione che tutti gli obblighi siano assolti.

## Dipendenze

Nessuna dipendenza runtime esterna. Il prototipo è progettato per funzionare offline; non usa font CDN, librerie JavaScript remote o immagini remote.
