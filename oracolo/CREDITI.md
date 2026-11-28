# Crediti e risorse

## Grafica e suoni originali del progetto

- **Pizia Deluxe:** disegno a rettangoli e tracciati ortogonali su una griglia di **120 × 160 pixel**, in `js/pythia-sprites.js`. Diadema d'alloro, treccia, gioielli, peplo ricamato, mantello, bracciali e sandali. Tutte le pose condividono lo stesso disegno; occhi e bocca vengono ridisegnati sul medesimo volto.
- **Santuario, allori, sigillo, greche, grana della pietra e pavimento:** SVG originali a griglia nella cartella `assets/`. Colonne scanalate, marmo inciso, lucerne, anfore e vegetazione sono tracciati geometrici, non immagini ottenute da un generatore.
- **Fondale:** montagne a gradini con facce illuminate, crateri lunari, cipressi, costellazioni e scintille disegnati nel Canvas da `js/scenery.js`.
- **Fiamme, fumo, bronzo, cornici e rilievi:** CSS in `css/style.css` e `css/detail.css`.
- **Effetti sonori:** oscillatori, rumore filtrato, riverbero e delay sintetizzati tramite Web Audio in `js/audio.js`; nuovi timbri per attivazione, consultazione, rivelazione, reset e campo vuoto.
- **Soundtrack originale «Vento sul Parnaso»:** composizione strumentale di **16 battute, 78 BPM, circa 49,23 secondi per giro**, con pad morbidi, arpa/chip, basso e percussioni leggere. Partitura e sintesi sono interamente in `js/audio.js`. Nessuna registrazione, campionamento o brano esterno. Anche riverbero e rumore vengono creati localmente. La musica si ripete in modo continuo, si attenua durante la consultazione e si mette in pausa quando la pagina è nascosta.

Non sono stati usati generatori d'immagini, sprite di videogiochi, loghi proprietari, fotografie o librerie grafiche di terzi. Il riferimento NES/arcade riguarda soltanto il linguaggio dei pixel e dell'interazione.

## Font inclusi localmente

### Press Start 2P

Copyright 2012 The Press Start 2P Project Authors, con nome riservato «Press Start 2P».

- Distribuzione: https://fonts.google.com/specimen/Press+Start+2P
- File WOFF2 originali in `assets/fonts/pressstart2p-*.woff2`.
- Licenza **SIL Open Font License 1.1**, inclusa integralmente in `assets/fonts/PressStart2P-OFL.txt`.

### VT323

Copyright 2011 The VT323 Project Authors.

- Distribuzione: https://fonts.google.com/specimen/VT323
- File WOFF2 originali in `assets/fonts/vt323-*.woff2`.
- Licenza **SIL Open Font License 1.1**, inclusa integralmente in `assets/fonts/VT323-OFL.txt`.

Il CSS è stato adattato soltanto per usare URL locali. I font non sono modificati e non vengono richiesti a Google durante l'utilizzo. Domande e responsi usano il font di sistema, per mantenere la leggibilità.

## Strumenti di verifica, non dipendenze dell'app

Playwright e axe-core sono usati esclusivamente negli script di test. Non vengono caricati nel browser dell'esperienza e `node_modules` non fa parte della consegna. Le relative dipendenze di sviluppo sono dichiarate in `package.json`.
