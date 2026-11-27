# Report di collaudo · 3.1 NES Retro
## Open Day 2026/27 · Liceo Alfredo Casardi · Barletta

**Data: 27 novembre 2026.** Questo report riguarda i **sei nuovi scenari pixel e la UI ridisegnata**, con i personaggi LPC mantenuti dalla precedente revisione. Le prove sono state rieseguite sul runtime 3.1: i PASS della vecchia arte rifiutata non sono usati come approvazione dei nuovi sfondi. Evidenze in `docs/test-results/`.

## 1 · Cosa cambia e cosa rimane

- **Sostituiti tutti e sei i vecchi fondali NES**, non soltanto le palette: nuove architetture, materiali, pavimentazioni, vegetazione, profondità e luce. PNG canonici **600 × 400, 64 colori per sfondo, opachi**, identici come sorgente fra Canvas e Pillow. Vecchi disegni procedurali rimossi, senza fallback silenzioso.
- Sono **illustrazioni assistite da IA e rifinite su griglia/palette**, non disegni dichiarati interamente a mano, fotografie sintetiche spacciate per autentiche o rilievi storici. Provenienza/licenze/hash in `assets/nes/manifest.json`; dichiarazione in Info e nei metadati PNG. Nessuna esclusiva rivendicata sugli elementi generati automaticamente. L’app non esegue modelli né chiede rete o API per disegnare.
- **Nuova UI NES-rétro:** titoli pixel, pannelli squadrati, inventario illustrato, colori blu notte/menta/oro, focus e selezione visibili, controlli touch e movimento ridotto. Anche il download Go e il kiosk Python facoltativo adottano la stessa famiglia visiva. La guida stampabile resta chiara su fondo bianco.
- **Nuova targhetta NES compatta**, con soli istituto/evento/città/nome facoltativo. Appoggi del Foro NES ricalibrati; testo di Paestum spostato a sinistra. Corrette le miniature del benvenuto e le note di scena ora distinte fra foto e illustrazione.
- **Preservati:** creator LPC modulare, quattro pose/sei espressioni, otto companion facoltativi, stile fotografico, export reale **3000 × 2000**, creatore telefono completo, HTML autonomo, launcher Windows e QR del **PNG già finito**. Nessun timer per creare.

## 2 · Ambiente realmente usato e limiti

Linux x86-64, Python **3.13**, Go **1.27.4**, Chromium/Playwright; Node **20.20.2** per parità e sintassi. HTTP reale locale, QR decodificati indipendentemente con zxing-cpp, download confrontati byte per byte. Le suite browser e il renderer HD sono stati eseguiti **in serie**, nella sandbox con circa 2 GiB RAM. I nomi dei campioni sono fittizi.

**Non eseguiti qui:** Windows nativo, doppio clic/associazione browser/firewall/SmartScreen del PC reale, telefono fisico Android/iOS, Wi-Fi scolastica, Safari/Firefox, tastiera virtuale reale, Web Share nativo. Il PE Windows x64 è **cross-compilato e non firmato**: la build non equivale a una prova su Windows. Touch e viewport emulati non diventano una certificazione hardware.

Il servizio distribuito non abilita le eccezioni di collaudo `CASARDI_TRUST_PREVIEW` / `CASARDI_QA_LAN_IP`; non impostarle all’evento. I link loopback negli screenshot sono indirizzi di QA, non link raggiungibili dai telefoni del pubblico.

## 3 · Prove automatiche della 3.1

| Evidenza | Esito osservato | Ambito e limite |
|---|---|---|
| `unit-tests.txt` | **45 test PASS**, 9,913 s | Validazione, creator, compositore/storage/API, HTML/font, nuovi sfondi e note per stile. Comprende hash e pixel canonici incorporati identici, font Go rinominato e sei export Python esattamente nearest-neighbor |
| `go-service-tests.txt` | **26 test principali PASS**, race detector, 26,246 s | Sicurezza, RAM, token, scadenza, reset, isolamento, limiti PNG/HTTP. Nessuna gara rilevata nelle prove eseguite |
| `nes-art-audit.json` | **6 PNG PASS** | Dimensioni/opacità, palette ≤64, metadati IA, hash e riferimenti fotografici verificati; non un giudizio automatico sulla bellezza |
| `asset-audit.json` | **7716 casi PASS**, zero tocchi al bordo | Renderabilità/alpha/bordi del creator mantenuto. **255 PNG, 56 definizioni, 85 atlanti** LPC verificati con SHA-256; non tutte le combinazioni artistiche |
| `layout-audit.json` | **6048 casi**, zero fuori cornice o sovrapposizioni fra basi dei piedi | Geometria di sei scene/due stili, corporature/pose/animali. Non riconosce da solo pavimento o ostacoli |
| `browser-sprite-audit.json` | **938 confronti RGBA esatti**, zero differenze | 182 geometrie, 272 palette, 400 profili congiunti, 84 animali/stili. Non identità dell’intera cartolina Canvas/Pillow |
| `nes-retro-ui.json` | **8 verifiche PASS** | Miniature 3:2, no overflow a 320/375/390/768/1366, sei note NES distinte, provenienza, movimento ridotto, file offline senza richieste/JS error |
| `go-service-browser.json` | **15 verifiche PASS**, 18,30 s | Vero PNG/QR, contesto touch separato, bytes identici, revoca/reset/errori/fallback, creatore telefono offline |
| `standalone-browser-tests.json` | **22 verifiche + 12 export HD PASS**, 51,77 s | Percorso completo `file://` offline, desktop/touch emulato, tutte le scene/stili, metadati, errori e reset. Sei NES uguali pixel per pixel al nativo ingrandito ×5 |
| `go-real-expiry.json` | **300 secondi reali**, verifica a **301,47 s**, PASS | Landing, `/file`, `/image` → 410; copia RAM rimossa. Nessun salto dell’orologio del server |
| `go-launch-lifecycle.json` | **7 verifiche PASS**, 2,74 s | Processo Go Linux, configurazione standard, nessuna eccezione preview, porte/file mancanti, secondo avvio e arresto dal vero pulsante browser |
| `browser-tests.json` | **16 verifiche PASS**, 33,17 s | UI distinta Python aggiornata, categorie, sei scene/stili, QR, tastiera/dialogo, errori/reset e secondo contesto browser |
| `hd-http-regression.json` | **12 export HTTP HD PASS**, 42,93 s | Tutte le combinazioni Pillow, PNG 3000 × 2000 e crediti, reset finale e zero cartoline attive. Non è un test multiutente |
| `photo-integrity.txt` | **6 fonti PASS** | Hash dei file autentici locali, nessuna richiesta Internet |
| `windows-build.json` | **Build PE Windows x64 PASS** | Hash dell’EXE e dei **21 file Go/vendor**; non esecuzione nativa Windows |

Le suite finali servizio, standalone, redesign, avvio e scadenza registrano **lo stesso hash dell’HTML definitivo** qui sotto. Gli hash Go della prova del timer/avvio coincidono con la build Windows. Non si presenta un test su una vecchia build come test della consegna attuale.

### Vero QR del file finito, non del creatore

Eseguito l’intero percorso nello studio HTTP, generato un PNG, decodificato il QR, aperto il suo URL `/download/…` in **un altro contesto Chromium touch**, scaricato e verificato il PNG identico a quello del PC, dimensioni 3000 × 2000 e crediti presenti. `/telefono` ha un **QR distinto**, serve il creatore completo e non rivela la chiave del PC né ne resetta la sessione.

Provati: modifica personaggio → revoca immediata; nuova esportazione → token diverso; nuovo visitatore → nome/scelte/Blob e RAM azzerati, vecchio link HTTP 410; errore bridge iniettato → nessun QR fittizio e salvataggio locale ancora disponibile; rigenerazione QR dal medesimo PNG già pronto. Nessun cookie/progetto persistente nel creator Go/HTML, nessuna richiesta a host esterni osservata.

Il servizio conserva una sola copia PNG in **RAM**, non su disco; token casuale 192 bit, durata normale 600 s (configurabile 300–600), revoca su reset/nuova sessione/esportazione/arresto. Per la scadenza backend è stato atteso davvero il tempo di **300 s** su un’istanza separata della build finale: download iniziale identico, poi tre risposte 410 e trasferimento assente. La prova dell’orologio accelerato del solo browser è separata e non usata per dimostrare questa scadenza.

I 26 test Go includono owner/key/client/host/origine, generazioni obsolete/upload annullato, PNG corrotti/dimensioni/limite 24 MiB, scadenza esatta su tutte le route, buffer azzerato, pulitore senza nuove letture HTTP, HEAD/no-store/no cookie e nessun directory browsing. Il test di avvio ordinario legge l’HTML adiacente da una directory corrente diversa e conferma l’arresto dal browser, socket chiusa e processo uscito con codice 0.

### Creatore telefono e file autonomo

Il solo HTML è stato copiato/aperto tramite **`file://` con rete disattivata**. Verificati i nove gruppi, quattro look, compatibilità capi/pose/oggetti, accenti nel nome, nome/animale omessi, Indietro, focus/Esc, download PNG/TXT, annullamento e recupero da guasto `toBlob` iniettato. Esportate tutte e dodici le scene/stili, PNG opachi 3000 × 2000, metadati UTF-8 e 300 dpi. Le sei composizioni NES sono esattamente il nativo 600 × 400 ingrandito nearest-neighbor ×5, anche con il renderer Python.

`/telefono` è stato caricato via HTTP e poi portato offline: percorso completo ed export senza altre richieste al server. Il contesto è separato e touch **emulato**, non un telefono fisico. Nessun overflow alle larghezze indicate, orientamento landscape/reset provati. Quick Look/File iOS può non eseguire HTML locali; l’app non è una PWA, e non si promette il ricaricamento HTTP offline dopo aver chiuso la pagina. La condivisione nativa appare solo se supportata, ma non è stata azionata su hardware reale.

## 4 · Revisione artistica effettiva

Osservati i sei nuovi PNG canonici, le sei composizioni NES complete Pillow, la tavola delle dodici esportazioni Canvas e le catture reali desktop/telefono. Si sono controllati riconoscibilità delle architetture, piano dei piedi, scala, companion, contrasto della targhetta e conservazione dei caratteri richiesti. **Non tutte le possibili combinazioni sono state viste a occhio e non si presume approvazione del committente.**

Correzioni specifiche: rimosso il pannello con pseudo-iscrizione del Foro; avatar e companion spostati sul selciato centrale libero, lontano dall’olivo/pietre destre; nessun soggetto sui plutei della Malatestiana; targhetta di Paestum fuori dal timpano; note NES senza il vecchio testo sulla desaturazione fotografica; proporzioni 3:2 delle sei miniature corrette e ricontrollate su cinque larghezze. I colori Casardi sono interpretativi dal riferimento del **1936**, non documentazione attuale. I dettagli architettonici minori delle illustrazioni restano interpretazioni, non un rilievo filologico certificato.

Materiale consegnato: **8 PNG HD**, **12 JPG attribuiti**, **7 screenshot servizio**, **6 standalone**, **16 Python**, tavole `docs/qa/01…10`, guida A4 **di una pagina** rigenerata e controllata visivamente. Le tavole 08/09/10 mostrano rispettivamente i sei fondali canonici, l’interfaccia desktop completa e il benvenuto telefono emulato; non illustrazioni promozionali diverse dal runtime. Per contenere il pacchetto, le sedici schermate del kiosk Python sono ricompresse in JPEG qualità 76; nessun PNG HD o asset del creator è stato ridotto. Schede di appoggio/luce/scala in `docs/SCENE_COMPOSITION.md`.

La parità degli sprite non implica identità dell’intero montaggio fra Canvas e Pillow: JPEG ottimizzati, rasterizzazione font, interpolazione, rumore e ombre hanno implementazioni distinte. Lo sfondo NES invece è un **unico file canonico per scena** ed è verificato byte per byte anche nell’HTML incorporato.

## 5 · Risorse e limiti residui

Il giro HTTP Python finale di dodici export ha lasciato **610924 KiB RSS**, con picco processo **714004 KiB**. Rendering serializzato e cache limitate; non è certificazione per molti client contemporanei. Consigliati browser recente, una sola edizione attiva e **8 GB RAM** sul PC dello stand. I tempi della sandbox non sono promesse sui telefoni.

Un primo tentativo di richiamare la build Go senza percorso esplicito è fallito perché Go non è nel PATH; ripetuto con il toolchain verificato e build/test completi PASS. Per la revisione PDF il modulo `fitz` non era installato: usato l’esistente `pypdfium2`, verificata una pagina e osservato il raster della guida. Nessuna dipendenza aggiuntiva è richiesta agli operatori. Questi errori degli strumenti di manutenzione non sono nascosti come prove riuscite dell’app.

| Aspetto | Stato / azione necessaria |
|---|---|
| Windows nativo, doppio clic, browser, firewall, SmartScreen | **NON ESEGUITO qui**; prova sul PC dello stand e verifica IT indispensabili |
| Telefono fisico / Wi-Fi scolastica / VLAN e isolamento | **NON ESEGUITO**; compilare la checklist GUIDA_OPERATORE.md |
| Safari/Firefox, touch/tastiera fisici, Web Share | **NON ESEGUITI** |
| Fotografia Casardi | Autentica ma **1936, 707 × 491**, non attuale. Nessuna autorizzazione istituzionale inventata; procedura di sostituzione inclusa |
| Nuove illustrazioni | Assistenza IA dichiarata, no generazione runtime; nessuna garanzia filologica o esclusiva sui contenuti prodotti automaticamente |
| Licenze LPC/foto e beni culturali | Obblighi per parte conservati; non una clearance universale o una liberatoria della scuola |
| Copie già salvate / traffico già consegnato | Non cancellabili a distanza; reset revoca soltanto gli accessi successivi |
| Cancellazione forense RAM / sistema | Non promessa; azzeramento del buffer posseduto controllato nei test |
| Internet / HTTPS | Non previsti. HTTP sulla LAN fidata; niente hosting esterno o port forwarding |

## 6 · Integrità della build finale

- HTML: **12.734.874 byte**, SHA-256 `00dbd839a4749810b8ceefecf83d108a9cbcbf336d198d3ff58dd7fe36e9d3f7`.
- EXE Windows x64: **10.467.840 byte**, SHA-256 `f49fcf7d0d69b01e0d52f0bceb6893722c7598cbc7bff28504b1ea3a7b87d465`.
- Sorgenti Go/vendor: **21 file**, SHA-256 aggregato `a2d19278837a05e253a2a7dd35874720651c21b5f262b754fe11d330ee994122`.
- Manifest dei sei sfondi: SHA-256 `61e3da814da0865ee343c9ca7c721d98c1e5b74fd208190e02433524c86ed008`.

`scripts/package.py` verifica hash correnti, suite passate, sintassi, dimensioni/crediti dei campioni e assenza di PNG visitatori. Per la **build finale**, oltre alla candidata, richiede una prova da ZIP estratto con fingerprint identico di tutti i file runtime. La procedura riproducibile è nell’intestazione di `scripts/package_smoke.py`: estrazione separata, servizio nativo Linux ricompilato dai sorgenti vendorizzati estratti, HTML letto accanto e copia del solo HTML aperta offline. Il PE Windows viene confrontato, non eseguito. Esito e fingerprint effettivi sono registrati in `docs/test-results/package-smoke.json`.

**Estrazione indipendente eseguita e PASS:** **506 file runtime identici**, fingerprint aggregato `0ccf8d9b2a6bfade3cad7e39d102223ee827ffb0a2cf666e8ada3188be6458a0`. Dal solo HTML estratto, aperto offline e separato dal progetto, creati PNG fotografico e NES a 3000 × 2000; trasferiti con il servizio ricompilato della copia estratta tramite QR decodificato, download byte per byte identici. Verificati anche reset/RAM vuota, revoca del vecchio link, `/telefono` senza chiave e nessun directory browsing. Il servizio di QA è stato poi arrestato. Questa prova non è un’installazione su Windows pulito o un telefono fisico.

Il pacchetto `Cartolina_Casardi_Windows_LPC_QR_2026-27.zip` contiene sorgenti, EXE/HTML pronti, asset/licenze, guide, campioni e prove; esclude cache, toolchain, binari Linux di QA, virtualenv e cartoline visitatori. CRC ZIP e SHA-256 di tutti i membri sono controllati. `MANIFEST.sha256`, `.zip.sha256` e `docs/test-results/package-audit.json` permettono il controllo della distribuzione finale. Le modifiche ai soli documenti non cambiano il fingerprint runtime, ma restano coperte dal manifest completo.

**Prima dell’apertura al pubblico:** prova con Windows, IT e un vero telefono separato, nei due stili, sulla rete dello stand; controllare anche il vecchio link dopo reset. Nessuna prova della sandbox elimina questa dipendenza esterna.
