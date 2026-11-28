# Verifiche · QR Internet 1

**Ambito:** servizio Windows `qr-internet-1` con creatore 3.3.1 invariato nel rendering/trascinamento. Non costituisce soluzione confermata del problema Android/Arena.

## Risultati della funzione corrente

- **42 test Go top-level PASS con race detector**, inclusi i 26 della base: token, bytes PNG, scadenza/revoca, autorizzazione owner, concorrenza; nuovi test su download separato, metodi pubblici, header falsificati, checksum/limiti/cancellazione del componente, opt-in, risposte obsolete e riconoscimento della vecchia istanza.
- **Vero Cloudflare Quick Tunnel:** origine HTTPS verificata, QR decodificato indipendentemente con OpenCV, PNG scaricato con confronto byte per byte, radice/creatore/API/sorgenti non pubblicati, scritture rifiutate, revoca dei tre percorsi pubblici e ritorno esplicito alla LAN.
- **9 controlli browser PASS:** file unico offline fino al PNG; consenso rifiutabile; attivazione Internet dal vero pulsante; QR HTTPS del PNG; secondo contesto touch sul vero hostname Cloudflare con download identico; Nuova cartolina → HTTP 410; terminazione reale di cloudflared → QR nascosto e PNG locale conservato; vecchia risposta HTTP trattenuta oltre Stop non ripristina il QR; nessuna eccezione JavaScript/cookie/storage del visitatore.
- Integrità: tutti i **473 asset**, dati incorporati, renderer, composizione, editor drag, sprite e logica del creatore confrontati con la base. Dettagli/hash in `qr-internet-integrity.json`.
- EXE **Windows x64 GUI cross-compilato** con Go 1.27.4; componente Cloudflare Windows ufficiale scaricato e SHA-256 verificato durante l’audit. Il componente non è incluso nello ZIP e viene scaricato dall’app solo all’attivazione.

File probatori correnti in `docs/test-results/`:

- `qr-internet-go-tests.txt`
- `qr-internet-live.json`
- `qr-internet-browser.json`
- `qr-internet-windows-build.json`
- `qr-internet-integrity.json`
- `qr-internet-package.json` / `qr-internet-extracted-smoke.json`

I report JSON correnti contengono hash del codice/HTML quando applicabile. La verifica ZIP/manifesto comprende anche i file non-runtime; l’hash finale dell’archivio è nel sidecar `.zip.sha256` esterno.

## Limiti dichiarati

Linux e Chromium, con secondo contesto touch emulato, **non** sono Windows nativo, Job Object Windows provato, SmartScreen/antivirus, telefono fisico 4G/5G, rete scolastica o Safari/iOS. Le condizioni di rete, le policy e la disponibilità di Quick Tunnels non sono garantite. Gli header `no-store`/`noindex` e la memoria locale non attestano assenza di log del fornitore.

Il test pubblico attraversa realmente l’hostname HTTPS Cloudflare, non due dispositivi fisici su operatori diversi. La verifica dei limiti/scadenze usa anche unit test controllati: non viene spacciata per un’attesa di 600 secondi su un telefono reale.

## Tentativi iniziali conservati

- `qr-internet-live-initial.json`: il primo controllo pretendeva 404 anche quando venivano inviati header proxy con loopback falsificato; il percorso esterno restituiva 403. La verifica successiva distingue il normale 404 dalla negazione 403/404 di quel tentativo, senza modificare il filtro applicativo.
- `qr-internet-browser-environment-initial.json`: Chromium non partiva per librerie di sistema mancanti; dipendenze del laboratorio installate prima dei test effettivi.
- `qr-internet-browser-inspector-initial.json`: cache dell’inspector insufficiente per rileggere il grande HTML; il laboratorio ha acquisito e inoltrato la risposta originale tramite APIRequest.
- `qr-internet-browser-node-dns-initial.json`: un controllo negativo usava il resolver Node di APIRequest, che non risolveva il nuovo hostname mentre il browser aveva già scaricato il PNG. Il controllo usa ora la navigazione del medesimo browser mobile. I token dei tentativi sono stati revocati e oscurati nei messaggi salvati.

Questi insuccessi non sono cancellati né rinominati come PASS. Il report finale browser è una nuova esecuzione con il laboratorio corretto.

## Documentazione precedente

Il report 3.3.1 originale è in `docs/storico/TEST_REPORT_3_3_1_prima_QR_Internet.md`; i vecchi risultati delle altre funzioni restano storici. Non si dichiara di avere rieseguito l’intera matrice precedente. Il difetto di trascinamento Android/Arena rimane non dichiarato risolto e l’esperimento Canvas rimane NON RELEASE.
