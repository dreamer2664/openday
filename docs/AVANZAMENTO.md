# Stato del branch `quiz` — aggiornato 27 novembre 2026

## Esperienza implementata

- Sala giochi con dieci quiz autonomi e platform originale preservato in `platform.html`.
- Ogni quiz non fotografico ha 16 nodi, sessione di 8 domande, sei strategie di risposta con scoring multidimensionale e un trade-off contestuale che esplicita costi, vincoli o prospettive mancanti.
- Tre snodi modificano il percorso; ogni risposta alimenta sia i tratti sia uno stile di risposta. Dopo ogni scelta compare una riflessione specifica sulla strategia e sui tratti influenzati; le sei opzioni si rimescolano a ogni domanda. Risultati e rami sono testati per raggiungibilità.
- “Umano o AI?” mantiene la meccanica specifica di classificazione binaria, confidenza, feedback e attribuzione soltanto dopo la risposta.
- Asset locali, SVG originali, immagini di prova, metadati e attribuzioni sono raccolti nel manifest.

## Approfondimento delle domande

Gli otto quiz non fotografici includono sei scelte plausibili per ciascuno dei 16 item. I tre snodi principali hanno sei testi di risposta scritti sul dilemma specifico (non solo varianti di tono); gli altri item combinano strategie editoriali del quiz e vincoli contestuali. Una nota “In bilico” accompagna ogni item. Dopo ogni scelta, il feedback riflessivo collega l'opzione ai tratti e mostra il ramo successivo. L'ordine delle sei schede varia a ogni domanda. Le strategie aggiunte esplorano punto cieco e test reversibili; margine di rischio e accordi rivedibili; limiti etici e cambiamento di piano; chi paga il costo e come riformare; giustizia e mediazione; controesempio e pratica; controllo delle fonti e costo umano; metodo, supporto e prove di orientamento.

Il quiz umano/AI non adotta sei scelte perché la classificazione fotografia/AI è la sua meccanica centrale. I risultati restano ludici: nessun quiz è diagnosi o misura psicometrica.

## Verifiche

- `node tests/quiz-engine.cjs`: PASS — dieci dataset, sedici nodi, tutti gli asset e i record manifest, sei opzioni, trade-off e feedback riflessivo per domanda non fotografica, otto risposte per sessione, risultati raggiungibili; 216 combinazioni esaustive degli snodi per ciascun quiz non fotografico, 48 combinazioni risposta/confidenza per il quiz fotografico, 500 simulazioni non fotografiche e 20.000 fotografiche. Report in `docs/report-simulazioni.json`.
- `node tests/smoke.cjs`: PASS — regressione del platform.
- Chromium: in un test precedente tutte le dieci esperienze hanno completato il flusso a 320 px senza overflow; l'espansione più recente richiede un test browser aggiornato delle sei schede, dei feedback di riflessione e del rimescolamento.
- SVG rigenerati da `scripts/build_quiz_art.py`; i test controllano presenza, unicità, byte e metadati degli asset. Eseguire `git diff --check` e i controlli di sintassi prima del rilascio.

## Limiti / prossimi controlli

- Playtest con studenti e revisione didattica: da fare; la plausibilità editoriale non si dimostra con test automatici.
- Controllare leggibilità e scorrimento mobile delle sei opzioni, soprattutto su schermi bassi; ripetere il test Chromium dopo questa modifica.
- Verifica legale indipendente di licenze, disclosure e condizioni di redistribuzione prima della pubblicazione esterna.
- Nessun commit o push. Il PAT esposto in chat va revocato e ruotato prima di un eventuale push, usando una credenziale sicura ed effimera.
