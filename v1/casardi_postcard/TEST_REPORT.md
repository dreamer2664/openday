# Report di collaudo · revisione LPC / Windows / QR 3.0
## Open Day 2026/27 · Liceo Alfredo Casardi · Barletta

**Data: 27 novembre 2026.** Questo report riguarda i **nuovi personaggi LPC e il vero trasferimento del PNG**. I numeri della precedente consegna con arte rifiutata non vengono usati per dimostrare la revisione. Le evidenze leggibili da macchina sono in `docs/test-results/`.

## 1 · Esito e ambiente effettivo

**Implementato:** creatore completo responsive, nuovo sistema modulare LPC con equipaggiamento fantascientifico, sei luoghi in due stili, PNG 3000 × 2000, HTML autonomo, creatore telefono completo, servizio Go LAN con QR del **file già finito**, launcher Windows a doppio clic e kiosk Python facoltativo.

**Verificato qui:** Linux x86-64, Python 3.13, Go **1.27.4**, Chromium/Playwright, Node **20.20.2** per la sola parità degli sprite. Le API sono state provate via HTTP reale locale e il QR decodificato indipendentemente con zxing-cpp. La sandbox dispone di circa 2 GiB RAM: i collaudi pesanti sono stati eseguiti in serie, spegnendo il renderer Python quando non necessario.

**Non verificato qui:** esecuzione nativa dell’EXE su Windows, associazione browser/firewall/SmartScreen del PC, telefono fisico separato, Wi-Fi della scuola, Safari/Firefox, Web Share nativo e tastiera virtuale reale. Il binario è **cross-compilato e non firmato**. Nessuna emulazione viene presentata come test hardware.

L’EXE è un vero PE x64 con sottosistema grafico, non un collegamento a un servizio esterno. L’HTML deve restare accanto; un errore esplicito gestisce il file mancante. Per l’uso normale non servono terminale, Go o Python.

## 2 · Risultati automatici della revisione

| Suite / evidenza | Risultato effettivo | Ambito |
|---|---|---|
| `unit-tests.txt` | **34 test PASS** | Validazione, personaggi, compositor, storage/API Python, HTML incorporato, font, route telefono e traduttore |
| `go-service-tests.txt` | **26 test principali PASS, race detector** | Sicurezza e ciclo di vita del servizio; 24,735 s nell’ultima esecuzione |
| `asset-audit.json` | **7716 casi PASS**, zero tocchi al bordo | Renderabilità, alpha finale binario e limiti della tela; non tutte le combinazioni artistiche |
| Stesso audit LPC | **255 PNG, 56 definizioni, 85 atlanti SHA-256 verificati** | Provenienza dei bytes, non un’autorizzazione legale nuova |
| `layout-audit.json` | **6048 casi**, zero fuori cornice e zero sovrapposizioni fra basi dei piedi | Geometria; non riconoscimento automatico di pavimento/prospettiva |
| `browser-sprite-audit.json` | **938 confronti RGBA esatti, zero differenze** | 182 geometrie, 272 palette, 400 profili congiunti, 84 animali/stili |
| `go-service-browser.json` | **15 verifiche PASS** | Chromium desktop + contesto touch indipendente, vero QR/PNG/reset/fallback |
| `standalone-browser-tests.json` | **22 verifiche PASS + 12 export HD PASS** | File unico offline, intero percorso, telefono emulato, errori/reset, tutte le scene/stili |
| `go-real-expiry.json` | **300 secondi reali, PASS a 301,47 s** | Nessuna accelerazione dell’orologio del server |
| `go-launch-lifecycle.json` | **7 verifiche PASS** | Processo Go Linux con configurazione standard, porte/file mancanti e arresto dal pulsante browser |
| `browser-tests.json` | **16 verifiche PASS** | UI distinta del kiosk Python, tutte le categorie, QR e secondo contesto browser |
| `hd-http-regression.json` | **12 export HTTP HD PASS**, 38,94 s complessivi | Tutte le scene/stili del renderer Pillow; reset finale e zero cartoline attive |
| `photo-integrity.txt` | **6 fonti fotografiche PASS** | SHA-256 locali, senza richieste Internet |
| `windows-build.json` | **Build Windows x64 PASS** | Hash dell’EXE e dei 20 file Go/vendor di input; **non** esecuzione Windows |

Gli hash esatti dell’HTML provato sono confrontati fra build, suite standalone e suite servizio; quelli dei sorgenti sprite e del servizio sono registrati nei relativi report. I tempi variano con cache, memoria e hardware; non sono promesse di velocità sui telefoni.

### 26 test Go: cosa è stato effettivamente esercitato

Token 192 bit non prevedibili, accettazione/validazione del PNG e bytes originali, scadenza al deadline esatto e su tutte e tre le route di download, reset con azzeramento del buffer, sostituzione alla nuova esportazione e nuova pagina principale, isolamento `/telefono`, nessuna chiave riservata per client remoti, chiave owner obbligatoria, client/host/origine non autorizzati respinti, generazioni obsolete e upload in corso non riesumabili dopo reset, dimensioni errate/PNG corrotti/limite 24 MiB, nessun directory browsing, GET non modifica la sessione, no cookie/no-store, pagina mobile e immagine inline, rete selezionata validata, assenza LAN senza URL inventato, pulitore senza letture HTTP, chiusura con buffer azzerato, QR con margine e HEAD senza corpo PNG. Il race detector non ha riportato gare nelle esecuzioni provate.

### 15 verifiche browser/servizio: trasferimento non simulato

1. Apertura reale HTTP dello studio con configurazione owner; la configurazione sensibile viene rimossa dal DOM.
2. Creazione e generazione di un PNG NES; **QR finale decodificato indipendentemente**, URL `/download/…`, non `/telefono`.
3. Download reale dal pulsante PC, 3000 × 2000, con crediti foto/LPC nei metadati.
4. Altro contesto Chromium touch, pagina aperta dal link del QR e **download byte per byte identico** al file PC.
5. QR del creatore telefono distinto; la sua apertura non revoca né rivela la sessione dello stand.
6. Nessun cookie o progetto in localStorage/sessionStorage.
7. Modifica personaggio → revoca immediata del vecchio file e rimozione dell’immagine QR.
8. Nuova esportazione → token diverso.
9. Clock del solo browser accelerato: QR nascosto al termine, PNG PC ancora disponibile. **Non** è la prova del clock backend.
10. Richiesta di nuovo QR per il PNG già composto, senza ricomposizione.
11. Nuovo visitatore → pagina pulita, nome/scelte/Blob cancellati, vecchio link HTTP 410.
12. Pagina mobile italiana di collegamento non valido.
13. Guasto bridge iniettato: messaggio italiano, nessun QR finto, PNG locale ancora salvabile.
14. Creatore telefono caricato via HTTP e usato offline fino al PNG.
15. Nessuna eccezione JavaScript o richiesta a host esterni nei contesti osservati.

### Scadenza backend realmente attesa

Istanza separata configurata a **300 s**. Caricato un vero PNG 3000 × 2000, decodificato il QR e scaricato il file identico. Dopo **301,47 secondi di tempo reale**, landing, `/file` e `/image` restituivano **410**; stato del servizio senza trasferimento attivo. Il servizio non scrive PNG su disco: il buffer posseduto è azzerato alla scadenza. Il test unitario separato verifica anche il pulitore senza richieste.

L’evidenza è legata allo stesso hash dei sorgenti Go della build Windows. Una successiva modifica solo cosmetica al contrasto CSS ha rigenerato l’HTML: non è stata usata per rivendicare un nuovo test del timer backend. Nessuna prova di dieci minuti su un telefono reale è implicata.

### Avvio, porte e arresto reale

Il test del processo Go è stato eseguito **senza `TRUST_PREVIEW`**, con l’HTML accanto al binario e directory corrente differente. Verificati host/chiave/origine errati respinti; assenza di LAN senza QR inventato; secondo avvio che riusa l’istanza; porta occupata da altro programma con errore italiano senza cancellare la cartolina attiva; HTML mancante con messaggio di ripristino; nessun accesso ai sorgenti. Il **pulsante Info → Arresta servizio locale è stato premuto nel browser**, confermato e la socket ha smesso di accettare connessioni. Il processo Linux è poi terminato con codice 0.

Questo prova il servizio e il ciclo di vita, **non** `rundll32`/MessageBox/firewall reali di Windows. L’eccezione QA dell’iframe non è attiva nell’avvio ordinario distribuito.

## 3 · HTML autonomo e telefono

- File unico isolato con **`file://` e rete già disattivata**, senza dipendenze accanto; intero percorso e nove categorie, quattro preset, incompatibilità gestite, pose/oggetti e otto companion.
- Due stili, sei luoghi, nome con accenti e sua omissione; ritorno senza perdita delle scelte, dialogo/focus/Esc, PNG e TXT realmente scaricati.
- Reset annulla lavori e URL, navigazione bloccata durante export, guasto `toBlob` iniettato con recupero.
- **12 PNG 3000 × 2000** aperti/verificati, alpha opaco, iTXt e 300 dpi. Sei NES esattamente uguali alla composizione nativa 600 × 400 ingrandita ×5 nearest-neighbor.
- Nessun overflow orizzontale alle larghezze **320, 375, 390, 768, 1366**; percorso completo touch emulato 390 × 844, orientamento orizzontale e reset.
- `/telefono` inizialmente via HTTP, poi offline: percorso fotografico Biblioteca/gufo e PNG, **zero richieste successive** all’HTML iniziale. Nessun owner/key o reset del PC.
- Nessun errore JavaScript/CSP nei contesti della suite passata. Web Share è mostrato solo dove l’API lo consente: **nessuna finestra nativa di condivisione è stata provata**.

La parità RGBA degli sprite non significa identità dell’intera cartolina Canvas/Pillow: foto ottimizzate, interpolazione, font, rumore e ombre hanno implementazioni distinte. L’HTML non è una PWA; Quick Look/File iOS può non eseguirlo. L’alternativa HTTP completa è documentata, senza promettere comportamento non osservato.

## 4 · Revisione visiva e correzioni

Sono state osservate le nuove tavole, le dodici composizioni vere Pillow e le dodici Canvas, non solo schermate dell’interfaccia. I campioni usano nomi fittizi. Il set mantenuto include **8 PNG HD** (due foto e sei NES), **12 JPG attribuiti**, **7 screenshot servizio**, **6 standalone/touch**, **16 kiosk Python** e una guida operatore A4 di **una pagina**, renderizzata e controllata.

Correzioni specifiche della revisione:

- Abbandonata la precedente base procedurale del personaggio; veri livelli artistici LPC e nuovi equipaggiamenti tecnici, con attribuzione per parte.
- Cappotti senza variante femminile/teen non vengono forzati: controlli disabilitati e normalizzazione esplicita. Gonna dritta limitata ai corpi supportati.
- Trasparenze intenzionali di lenti, capelli e cappuccio composte sul pixel nativo con alpha-over; niente buchi nella testa né sfocatura della sagoma.
- Ancora centrale del corpo conservata dopo ritaglio/armonizzazione; piedi e ombre non si spostano con capelli o oggetti. Ombra del companion specchiato corretta.
- Tartaruga ridotta a rapporto .10; cani e pose ampie separati in Biblioteca (foto x=1200, NES x=242). L’audit di layout, inizialmente fallito durante l’adattamento LPC, è ora a zero errori sui 6048 casi.
- QR del PNG in evidenza **prima** delle azioni di salvataggio, testo/azioni leggibili anche nel tema NES; il creatore telefono rimane separato in Info.
- Schede di composizione per appoggi, luce, grading, ombre e piccola occlusione d’erba a Paestum; cornice discreta e soli testi richiesti. La scala contenuta al Foro evita i blocchi lapidei.

Tavole `docs/qa/01…07`, campioni `renders/` e schede `docs/SCENE_COMPOSITION.md`. La geometria automatica non dimostra da sola prospettiva o fusione artistica. **Non tutte le combinazioni possibili sono state osservate a occhio e non si presume approvazione del committente.**

## 5 · Risorse, errori incontrati e limiti

Il giro HTTP Python delle dodici cartoline è passato: memoria residente finale **628684 KiB**, massimo processo osservato **764148 KiB**. Un solo compositore alla volta, finitura a blocchi e cache limitata; non è certificazione multiutente/load test. Consigliati **8 GB RAM** sul PC, browser recente e una sola edizione attiva.

Durante tentativi di collaudo con più contesti browser e il renderer Python HD già residente sono comparsi un timeout di navigazione e un blocco/timeout del comando di QA. Non vengono nascosti come PASS: le prove sono state ripetute **separatamente**, fermando gli altri processi pesanti. Le successive suite complete servizio (15), standalone (22 + 12 export) e kiosk (16) sono passate. Non è stata introdotta una scorciatoia che salta i controlli o riduce l’export. Evitare di eseguire più suite/server/render HD insieme nella sandbox limitata.

| Aspetto | Stato reale / azione necessaria |
|---|---|
| Windows nativo, doppio clic, browser, firewall e SmartScreen | **NON ESEGUITO qui**; cross-build verificata, collaudo sul PC necessario |
| Telefono fisico / Wi-Fi della scuola / VLAN e isolamento | **NON ESEGUITO**; procedura e checklist in GUIDA_OPERATORE.md |
| IP sandbox | Loopback/link-local di QA, non indirizzi dello stand |
| Safari/Firefox, iOS/Android reali, touch fisico e Web Share | **NON ESEGUITI** |
| Fotografia Casardi | Autentica ma **1936, 707 × 491**, non attuale; dettaglio limitato dichiarato, cartella per sostituzione autorizzata |
| Licenze e beni culturali | Fonti fotografiche/LPC documentate; nessuna liberatoria istituzionale o clearance di ogni diritto presunta |
| Tutte le combinazioni artistiche | Audit limitati e tavole rappresentative, non revisione esaustiva |
| Copie già scaricate / traffico in corso | Non richiamabili o cancellabili a distanza; il reset revoca solo accessi successivi |
| Cancellazione forense della RAM / sistema | Non promessa; azzeramento del buffer posseduto verificato nei test |
| Accesso fuori LAN / HTTPS | Non previsto; HTTP sulla LAN fidata, nessun hosting o port forwarding |

## 6 · Pacchetto e riproducibilità

Il builder `scripts/package.py` richiede tutte le prove sopra, controlla gli hash correnti di HTML/EXE/sorgenti, le attribuzioni dei campioni e l’assenza di cartoline temporanee. **La build candidata non è la consegna finale.** La build finale richiede anche `package-smoke.json` riferito allo stesso fingerprint di tutti i file runtime.

La prova della copia estratta è riproducibile nell’intestazione di `scripts/package_smoke.py`: ZIP estratto fuori dai sorgenti, servizio nativo Linux ricompilato dai suoi sorgenti vendorizzati, HTML letto dalla sua cartella, file unico copiato da solo e aperto offline. Entrambi gli stili sono composti a 3000 × 2000, caricati su quel servizio, scaricati via URL QR decodificato e confrontati byte per byte; reset, `/telefono` senza chiave e nessun directory browsing. L’EXE Windows è confrontato con il file sorgente, **non eseguito** in questa prova.

**Estrazione indipendente eseguita e PASS:** **502 file runtime identici**, fingerprint aggregato `4d833f4e035aaceccf58ef41b5756ea938852af319dfe622dfb7df01cc9a7be6`. Dal solo HTML estratto, a rete disattivata, creati i PNG fotografico e NES; entrambi trasferiti dal servizio ricompilato della copia estratta tramite QR decodificato, bytes identici, poi revocati con reset. Verificati anche creatore telefono senza chiave, stato RAM svuotato e nessun accesso ai sorgenti. Evidenza: **`package-smoke.json`**. Non è un test su un sistema operativo appena installato.

**Pacchetto finale:** `Cartolina_Casardi_Windows_LPC_QR_2026-27.zip`. La verifica ZIP controlla CRC e tutti gli SHA-256 interni, emettendo `MANIFEST.sha256` e il `.zip.sha256` esterno; preflight completo in **`package-audit.json`**. Esclusi cache, toolchain, binari Linux di QA, virtualenv e ogni file visitatore. Le sole modifiche documentali aggiunte dopo l’estrazione non cambiano i 502 file runtime; sono comunque comprese nel manifest e nella verifica CRC/hash dell’archivio finale.

**Prima di aprire al pubblico:** compilare la checklist reale, verificare Windows e IT, scaricare con un telefono separato entrambe le modalità e controllare reset/vecchio link. Nessun collaudo della sandbox elimina questa dipendenza esterna.
