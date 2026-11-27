# Test report — Casardi 8-bit

**Aggiornato:** 26 novembre 2026 · **Sviluppo:** continuativo; questo report accompagna la build corrente e non segna la fine del progetto.

## Verifiche eseguite

- [x] `node --check game.js` — sintassi JavaScript valida.
- [x] `node tests/smoke.cjs` — simulati i flussi di missione e campagna: presentazione dei quattro personaggi, tiro basket, sequenza piano, sicurezza digitale, passaggio fra cinque capitoli, quiz e finale.
- [x] `git diff --check` — nessun errore di whitespace nei cambiamenti controllati.
- [x] Server statico locale: `index.html`, `style.css` e `game.js` serviti con HTTP 200.
- [x] Nessuna libreria o risorsa remota necessaria per eseguire il gioco.
- [x] Nessun PAT o file di credenziali tracciato nel repository.

Il test headless usa un DOM/Canvas simulato per controllare la logica e i flussi; non sostituisce un playthrough in un browser vero o un test con utenti.

## Da verificare continuando il lavoro

- [ ] Playthrough manuale in browser desktop, mobile e schermo grande; controllare console, ridimensionamento e DPR.
- [ ] Provare tutti i rami di risposta errata, costi energia, checkpoint, cadute nei varchi e accesso al finale.
- [ ] Verificare pausa/ripresa, reset completo e riavvio della campagna dopo il finale.
- [ ] Provare audio dopo gesto utente, mute, regolarità del loop e intelligibilità dei dialoghi.
- [ ] Misurare durata Open Day e campagna con persone non istruite sui controlli; iterare verso gli obiettivi 7–10 e 30 minuti.
- [ ] Verificare contrasto, focus e navigazione da tastiera, leggibilità e accessibilità del movimento.
- [ ] Allineare quiz ai moduli effettivamente frequentati, usando i materiali EIPASS del gruppo.
- [ ] Ottenere/registrare riferimenti interni verificati e licenze per ogni eventuale nuovo asset esterno.

## Limiti attuali noti

- La campagna ha cinque capitoli e flussi completi nel test headless, ma la durata richiesta di almeno 30 minuti non è ancora dimostrata.
- La demo è giocabile, ma non è stata cronometrata con visitatori per confermare l’intervallo di 7–10 minuti.
- La colonna sonora è sintetizzata al runtime: identità audio, variazioni e mix sono ancora da raffinare; non ci sono slider separati musica/SFX.
- I quiz EIPASS sono esempi di competenze digitali generali, in attesa di conferma del programma specifico seguito dal gruppo.
- Gli ambienti oltre la facciata sono aree virtuali stilizzate, non ricostruzioni certificate di spazi interni della scuola.
