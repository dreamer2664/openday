# Screenshot reali dell'esperienza

Le immagini sono state acquisite dall'applicazione realmente avviata in **Chromium 159.0.8154.6**, usando Playwright. Non sono mockup e non hanno testi, sprite o decorazioni aggiunti dopo la cattura.

| File | Contenuto |
|---|---|
| `01-schermata-iniziale.png` | Apertura desktop, pagina completa; viewport 1440 × 1000 |
| `02-pizia-idle.png` | Dettaglio della Pizia a riposo e del santuario, catturato direttamente come regione della pagina |
| `03-consultazione.png` | Attesa scenica: occhi chiusi, sigillo e indicatore in movimento |
| `04-responso-parlato.png` | Rivelazione in corso: testo intenzionalmente parziale e bocca in movimento |
| `05-responso-completo.png` | Responso completo, bocca chiusa, pulsante per ricominciare |
| `06-mobile-iniziale.png` | Pagina mobile completa; viewport 390 × 844 |
| `07-mobile-responso.png` | Viewport mobile 390 × 844 dopo lo scorrimento alla scena: Pizia e responso visibili insieme |
| `08-campo-vuoto.png` | Avviso per una domanda composta soltanto da spazi |
| `09-domanda-delicata.png` | Nota fissa al posto del sorteggio, desktop |
| `10-mobile-nota-importante.png` | La stessa protezione su mobile, senza testo tagliato |

Le immagini della pagina completa possono essere più alte della viewport. La foto della Pizia è un ritaglio diretto del browser, non una ricostruzione dello sprite. I metadati di stato, viewport e fotogramma della bocca per le schermate sono in `../tests/browser-results.json`.

Per ricrearle: avvia `python3 serve.py`, installa le sole dipendenze di test indicate nel README principale ed esegui `npm run test:browser`. I responsi cambieranno perché l'estrazione è realmente casuale.
