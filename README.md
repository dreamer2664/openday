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

- **Missione Open Day**: prologo dimostrativo in sviluppo, con i quattro protagonisti, platform orizzontale, logica, basket, pianoforte, calcio e scelta di sicurezza digitale.
- **Campagna completa**: non ancora implementata; il menu la indica correttamente come prossimamente.

La specifica richiede demo rifinita da 7–10 minuti e campagna di almeno 30 minuti. Questa build è l’avvio di quel lavoro, non la consegna finale.

## Struttura

- `index.html`, `style.css`, `game.js` — build web senza dipendenze.
- `RICERCA_CASARDI.md` — ricognizione iniziale e fonti.
- `GAME_DESIGN.md` — direzione creativa, personaggi, sistema e capitoli.
- `CONTROLLI.md` — scheda comandi e istruzioni postazione.
- `ASSET_CREDITS.md` — provenienza e licenze.
- `TEST_REPORT.md` — verifiche realizzate e lavoro rimanente.

## Stato GitHub

Repository di destinazione: [dreamer2664/openday](https://github.com/dreamer2664/openday), branch `main`. La prima versione locale è in preparazione. Il token personale non va inserito nei file del progetto, negli URL Git, nei log o nei commit; l’eventuale credenziale resta fuori dal repository con permessi locali ristretti.
