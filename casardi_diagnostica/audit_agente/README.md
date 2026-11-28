# Prove tecniche dell’audit — non una nuova release

## Stato vincolante

- La causa specifica del blocco persistente Android/Arena **non è dimostrata**.
- Il problema della 3.3.1 segnalato dall’utente non è dichiarato risolto.
- L’utente ha terminato i test: nessuna richiesta di nuove prove, screenshot o ricostruzione del look.
- Produzione invariata al commit `1b627eeb721826bf9b628753e81fa8c2b1088ad9`.
- Canvas e patch HTTP sono esperimenti separati; non applicarli/pubblicarli come riparazione confermata.

Rapporto principale: `/home/user/Analisi_blocco_Android_Arena.md`.

## Contenuto di `prove_audit.zip`

- `reports/original/`: JSON esattamente come generati, inclusi gli errori di metadata/data delle prime prove.
- `reports/annotated/`: copie con annotazioni di provenienza e rimando all’hash originale; **non nuove esecuzioni né ridatazioni dei risultati**.
- `logs/`: risultati dei test, compresi i primi problemi del test harness conservati separatamente.
- `harness/original/`: script effettivamente utilizzati, senza riscriverne retroattivamente il contenuto.
- `harness/rerunnable/`: stesse logiche di test; eventuali date fisse sostituite con la data UTC al momento del run. Non sono stati rieseguiti solo per questa modifica dei metadata.
- `experimental_non_release/`: quattro sorgenti della variante Canvas, patch/build proof e patch HTTP isolata. Nessuna modifica ai sorgenti del pacchetto di produzione.
- `review-coverage.json`: inventario riconciliato con lettura, hash e natura dei controlli; include il rimando ai sei file di supporto aggiuntivi.
- `screenshots/` e `capture-index.json`: selezione di screenshot del laboratorio, non del telefono dell’utente. I sei esempi del confronto grafico sono ritagli dell’anteprima: i loro hash differiscono dagli screenshot a pagina intera registrati nel report.
- `date-provenance.json`: distingue l’etichetta statica dei vecchi harness dai timestamp dell’orologio del laboratorio. Questi ultimi sono metadata dell’ambiente, non la data locale dell’utente o una prova indipendente dell’ora di esecuzione.
- `MANIFEST.json`: dimensioni e SHA-256 di ogni altro membro dell’archivio.

Nessun asset, HTML da 24 MB, browser, toolchain o credenziale viene duplicato nell’archivio delle prove. Lo ZIP di produzione esistente contiene il riferimento completo.

## Ricostruzione del laboratorio (per manutenzione dell’agente)

Queste istruzioni servono a rendere ripetibili le prove: **non sono un’altra richiesta di testing all’utente**.

```bash
python3 /home/user/casardi_diagnostica/audit_agente/ripristina_laboratorio.py --verify-only
python3 /home/user/casardi_diagnostica/audit_agente/ripristina_laboratorio.py
C=/home/user/.cache/casardi-rootcause
R="$C/casardi_postcard"
python3 -m pip install -r "$R/requirements-dev.txt"
export PLAYWRIGHT_BROWSERS_PATH="$C/pw-browsers"
python3 -m playwright install chromium
# Installare le librerie di sistema Chromium se assenti:
# python3 -m playwright install-deps chromium
python3 "$C/make_canvas_experiment.py"
```

Il ripristino scrive soltanto nella cache del laboratorio. Non avvia server, test o pubblicazioni. L’hash dello ZIP originale è verificato prima dell’estrazione.

Comandi principali, **in sequenza** per non sovrapporre renderer pesanti su un ambiente con circa 2 GB RAM:

```bash
cd "$R"
python3 -m unittest discover -s tests -v
python3 "$C/source_check.py"
python3 "$C/support_integrity_qa.py"
python3 "$C/geometry_envelope_probe.py"
node "$C/browser_geometry_envelope.js"
python3 "$C/audit_integrity.py"
python3 "$C/whole_release_integrity.py"

# Non richiedono server HTTP:
python3 "$C/focus_probe.py"
python3 "$C/timing_probe.py"
python3 "$C/canvas_timing_probe.py"
python3 "$C/image_probe.py"
python3 "$C/canvas_race_qa.py"
python3 "$C/canvas_pixel_qa.py"
python3 "$C/canvas_resource_qa.py"
python3 "$C/kiosk_ownership_probe.py"
```

Le prove di incorporamento richiedono `embed_host.py` in un processo separato, in ascolto su `0.0.0.0:8092`:

```bash
python3 "$C/embed_host.py"
# In un altro processo:
python3 "$C/pristine_embedding_test.py"
python3 "$C/canvas_embedding_test.py"
python3 "$C/native_embedding_edges.py"
python3 "$C/held_contact_ownership_qa.py"
```

### Ultimi controlli di proprietà del contatto e grafica

`held-contact-ownership-results.json`: PASS, 25 sequenze / 75 contatti destinati all’attore / 25 tocchi esterni. In otto secondi contatti di produzione/A1, a caricamento già finito e dopo altri 250 ms tenendo il dito premuto, il livello nascosto conservava realmente la cattura; nessun movimento dell’attore. I 25 contatti successivi di controllo sono riusciti. Canvas: zero contatti persi negli otto controlli di questo test. Prova naturale, nessun ritardo/decode/capture loss iniettato; solo listener PointerEvent passivi aggiunti. Non riproduce il quadrato blu sul telefono: nei casi falliti il focus era BODY e il contorno dell’attore non era focus-visible.

`analyze_timing_ownership.py` rianalizza le tracce già esistenti: 7/36 secondi contatti persi, con 26 movimenti successivi ancora diretti al livello ormai nascosto. **Non è un’altra esecuzione dei gesti**. Per ripetere soltanto questa analisi dopo la perdita della cache occorre copiare le due tracce originali `timing-probe.json` e `canvas-timing-probe.json` da `reports/original/` dello ZIP, oppure rigenerarle eseguendo i due probe.

`compositor-gesture-results.json`: il run completo resta **FAIL**. Il sottoinsieme concluso ha 72/72 verifiche visive riuscite (24 condizioni headless); il ramo con finestra Xvfb/SwiftShader è andato in crash durante la preparazione dell’UI, **prima di qualsiasi gesto**. `compositor-adjudication.json` registra questo esito PARTIAL senza cambiare il FAIL originale. La causa del crash non è stabilita e non è il freeze con pagina attiva segnalato dall’utente.

Le 72 verifiche confrontano screenshot durante il contatto con un layout statico agli spostamenti corretto/vecchio, usando gli stessi livelli del renderer originale: non un secondo renderer indipendente o una prova GPU Android. Per eseguire il controllo grafico serve anche NumPy 2.3.5:

```bash
python3 -m pip install numpy==2.3.5
python3 "$C/compositor_gesture_qa.py" --smoke
# Il run pieno riproduce anche il ramo headed che qui è fallito; non presumere PASS:
xvfb-run -a -s '-screen 0 1280x1024x24' python3 "$C/compositor_gesture_qa.py"
```

Il primo smoke con route-fulfill era terminato con un crash sul secondo documento; report/script/log originali sono conservati. Lo smoke successivo via HTTP diretto e browser isolato per condizione ha concluso 6/6 verifiche. `embed_host_previsual.py` conserva il precedente host; `host-version-provenance.json` documenta l’aggiunta della sola route di A1, senza cambiare i documenti di test o gli altri percorsi.

Non eseguire `canvas_resource_first_incomplete_tracking.py` come prova aggiornata: è il contatore storico che ometteva il Canvas creato dal parser HTML, conservato per trasparenza. La versione corretta è `canvas_resource_qa.py` e il report corrente è `canvas-resource-results.json`.

### Servizio Go

La toolchain non è inclusa nelle prove. `go-toolchain.json` registra versione, nome archivio, origine e SHA-256 della toolchain effettivamente usata. La prova eseguita è:

```bash
cd "$R/service"
GOTOOLCHAIN=local GOPROXY=off GOSUMDB=off GOMAXPROCS=2 \
GOFLAGS='-p=1' GOCACHE="$C/go-cache" \
"$C/toolchain/go/bin/go" test -race -count=1 -mod=vendor -v ./...
```

Il file `logs/go-unit-audit.log` contiene i 26 PASS. Non è un’esecuzione nativa del binario Windows. Le librerie QR del vendor sono compilate/esercitate attraverso il servizio, ma non è stata dichiarata una copertura dinamica completa della libreria.

## Avvertenze per interpretare i risultati

- Chromium su Linux con profilo Pixel 7 è un’emulazione, non il dispositivo Android o il contenitore Arena reale.
- Non sommare i due inviluppi da 1.465.440 geometrie come se fossero outfit diversi: è lo stesso inviluppo verificato in Python e nel JS effettivo.
- Il test originale delle 288 gesture non aveva un’asserzione diretta sul valore del range. Le 36 asserzioni esplicite sono in `native_embedding_edges.py`.
- Nei 96 tentativi dell’ultima suite vi sono 72 spostamenti con asserzioni live/commit e 24 contatti per preparare multitocco/rilascio esterno.
- Nei test di timing, il campo storico «rejected second starts» guarda lo stato prima del gesto e non basta per classificarne l’esito. La conclusione 7/36 contro 0/36 è basata su target degli eventi e modello effettivo.
- Le iniezioni di errore verificano proprietà di isolamento/recupero, non riproducono il trigger fisico sconosciuto.
- I confronti di download usano una seconda chiamata al medesimo renderer di produzione invariato: non sono una seconda implementazione indipendente del renderer.
- La misura risorse riguarda Canvas osservati e topologia DOM con GC forzata, non tutta la memoria nativa/immagini del browser.
- I report storici nello ZIP di produzione non sono stati rigenerati, ridatati o promossi a nuove evidenze.
