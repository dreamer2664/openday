# CASARDI 8-BIT — Il segnale fantasma

Un’avventura platform narrativa originale per l’Open Day del Liceo Casardi. Il prototipo attuale gira nel browser senza librerie o risorse remote: grafica procedurale su canvas e suoni sintetizzati localmente via Web Audio.

## Avvio rapido

1. Aprire `index.html` con un browser moderno (Chrome/Firefox/Edge recenti) **oppure** avviare un server statico nella cartella:
   ```bash
   python3 -m http.server 8000
   ```
2. Visitare `http://localhost:8000`.
3. Premere **INIZIA LA MISSIONE**. Per una postazione pubblica preferire schermo intero e verificare prima l’audio del browser.

Non servono account, connessione Internet, installazione o CDN. Il carattere usa stack di sistema; tutto il codice di gioco è incluso localmente. Il browser potrebbe richiedere un primo click per abilitare l’audio.

## Comandi

- **A / D** oppure **← / →**: muovi
- **Spazio**: salta; nelle prove a tempo carica e rilascia il tiro
- **E**: interagisci con un personaggio/terminale vicino
- **1, 2, 3**: suona la sequenza di Francesco
- **Esc**: pausa
- **R**: ricomincia dopo il finale

## Modalità

- **Missione Open Day**: esperienza autonoma con i quattro protagonisti, platform, logica, basket, pianoforte, calcio e scelta di sicurezza digitale.
- **Avventura completa**: campagna a cinque capitoli, con scenari digitali stilizzati, salti sopra varchi, frammenti collezionabili e sfide su file/cartelle, fogli di calcolo, verifica delle fonti e privacy.

Il progetto resta aperto e in sviluppo continuativo: il lavoro prosegue sulla build esistente, senza stop di fase. I flussi principali hanno un test automatico headless; durata effettiva, test browser cross-device e playtest con visitatori restano da verificare. Non dichiariamo completati i requisiti di 7–10 minuti per la demo e 30 minuti per la campagna finché non saranno misurati e rifiniti.

## Struttura

- `index.html`, `style.css`, `game.js` — build web senza dipendenze.
- `RICERCA_CASARDI.md` — ricognizione iniziale e fonti.
- `GAME_DESIGN.md` — direzione creativa, personaggi, sistema e capitoli.
- `CONTROLLI.md` — scheda comandi e istruzioni postazione.
- `ASSET_CREDITS.md` — provenienza e licenze.
- `TEST_REPORT.md` — verifiche realizzate e lavoro rimanente.
- `tests/smoke.cjs` — test headless senza dipendenze per i flussi demo/campagna (`node tests/smoke.cjs`).

## Stato GitHub

Repository di destinazione: [dreamer2664/openday](https://github.com/dreamer2664/openday), branch `main`. La build aggiornata viene versionata in commit incrementali. Il token personale non va inserito nei file del progetto, negli URL Git, nei log o nei commit; l’eventuale credenziale resta fuori dal repository con permessi locali ristretti.
