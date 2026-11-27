# Report di collaudo · 3.2 · Dodici luoghi e controlli effettivi
## Open Day 2026/27 · Liceo Alfredo Casardi · Barletta

**Data: 27 novembre 2026.** Prove della revisione con **12 luoghi / 24 combinazioni**, famiglia LPC mantenuta e personalizzazione corretta. Le evidenze correnti sono in `docs/test-results/`; non si usano i PASS della 3.1 per certificare il nuovo HTML.

## 1 · Modifiche realmente implementate

- Aggiunti **Colosseo, Acropoli di Atene / Partenone, Pompei / Foro, Teatro antico di Taormina, Castel del Monte, Castello di Barletta**: sei fotografie autentiche con licenze verificate e sei illustrazioni coordinate.
- Le sei illustrazioni apprezzate della **3.1 sono conservate byte per byte**, con hash precedenti in `assets/nes/manifest.json → retained_from_3_1`. Dodici PNG canonici **600 × 400, ≤64 colori per sfondo, opachi**, comuni a Canvas/Pillow; composizione NES nativa e ingrandimento nearest-neighbor ×5.
- La famiglia professionale **LPC non è stata sostituita**. Pantaloncini ora dal vero modulo Shorts; rampe denim/blu notte e beige/crema distinte; colore delle cuffie realmente applicato; cintura non disegnata sopra i cappotti; labbra non sovrascritte sopra la barba.
- Ogni controllo confronta i pixel dello **sprite composto corrente**, non lo stato del pulsante. Alternative senza effetto visibile attenuate con spiegazione; azione esplicita «Scopri questo dettaglio» per rimuovere coperture, non modifiche silenziose all’abbigliamento. Zoom **28 × 28** del viso reale, nearest-neighbor.
- Preservati tema NES-rétro, quattro pose/sei espressioni, otto companion facoltativi, nome facoltativo, percorso completo PC/telefono, PNG reale **3000 × 2000**, EXE Windows e QR LAN del **PNG già finito**. Nessun timer per creare.
- Assistenza **IA dichiarata** per le illustrazioni; nessun modello a runtime, nessun asset di giochi commerciali, nessuna dichiarazione di disegno interamente manuale o rilievo filologico. Casardi: riferimento autentico **1936**, non foto attuale.

**Richiesta QR solo HTML / Android:** non soddisfatta e non sostituita di nascosto. Un HTML locale non può ospitare il proprio PNG per un altro telefono; un QR ordinario non contiene un PNG HD. Serve un servizio raggiungibile. Nessun cloud, hosting esterno, due-QR/WebRTC o app Android non approvati è stato aggiunto. Il servizio Windows è distinto da quella richiesta; l’HTML autonomo salva sul dispositivo che lo esegue.

## 2 · Ambiente e limiti della prova

Linux x86-64, Python **3.13**, Go **1.27.4**, Chromium/Playwright, Node **20.20.2**. HTTP loopback reale, QR decodificati indipendentemente con zxing-cpp, PNG scaricati e confrontati byte per byte. Suite pesanti eseguite in serie in una sandbox da circa **2 GiB**. Nomi e configurazioni sono sintetici.

**Non eseguiti:** Windows nativo/doppio clic/browser predefinito/firewall/SmartScreen, telefono fisico Android/iOS, Wi-Fi scolastica/VLAN, Safari/Firefox, touch/tastiera fisici, Web Share nativo. PE Windows x64 **cross-compilato e non firmato**: la build non è una prova Windows. Le emulazioni non diventano certificazioni hardware.

Le istanze Go di QA del QR usano eccezioni dichiarate `CASARDI_TRUST_PREVIEW=1` e loopback: **non sono configurazioni di produzione**. Il test separato di avvio/arresto usa invece i default, senza eccezioni e senza override dell’HTML. Il normale EXE non abilita quelle variabili. Non impostarle all’evento.

## 3 · Risultati correnti

| Evidenza | Esito osservato | Ambito / limite |
|---|---|---|
| `unit-tests.txt` | **58 test PASS**, 10.947 s | 13 nuove regressioni su effetti reali/occlusioni/recupero/CSRF/crop; validazione, storage/API, licenze/font, 12 export Python NES esattamente ×5 |
| `control-effects-audit.json` | **3250 confronti PASS**, nessun duplicato nei contesti di riferimento; **563 alternative zero-pixel rilevate** | Sprite RGBA composti; RGB sotto alpha zero ignorati. Le alternative coperte non sono contate come effetti riusciti |
| `control-ui-tests.json` | **9 verifiche PASS**, **137 alternative realmente cliccate** in nove categorie; **400 confronti effetti Python/JS** | PNG effettivi, visore/cappuccio/occhi chiusi, cuffie, scopertura/zoom, file offline e UI Python; non ogni possibile abbigliamento |
| `go-service-tests.txt` | **26 test principali PASS**, race detector, 23.764 s | RAM, token, scadenza, reset, chiave/host/origine/generazioni, limiti PNG; nessuna gara rilevata nelle prove eseguite |
| `nes-art-audit.json` | **12 PNG PASS**, **6 originali 3.1 invariati** | Hash/riferimenti, griglia/opacità/palette/metadati; non un giudizio automatico sull’arte |
| `asset-audit.json` | **7716 casi PASS**, zero tocchi al bordo | **255 PNG sorgenti, 56 definizioni, 85 atlanti** LPC con hash verificati; non tutte le combinazioni artistiche |
| `layout-audit.json` | **12096 casi**, zero fuori cornice / sovrapposizioni fra basi dei piedi | Dodici luoghi/due stili, corporature/pose/animali; geometria, non riconoscimento automatico del pavimento |
| `browser-sprite-audit.json` | **938 confronti RGBA esatti**, zero differenze | 182 geometrie, 272 palette, 400 profili, 84 animali/stili; non identità delle intere cartoline |
| `nes-retro-ui.json` | **8 verifiche PASS** | Miniature 3:2, 12 note distinte, no overflow 320/375/390/768/1366 px, movimento ridotto, offline zero HTTP/JS error |
| `standalone-browser-tests.json` | **22 verifiche + 24 export HD PASS**, 46.39 s | Un’unica sessione `file://` offline, 24 PNG 3000 × 2000 opachi/300 dpi/metadati, 12 NES esattamente ×5; desktop e touch emulato |
| `go-service-browser.json` | **15 verifiche PASS**, 11.75 s | PNG/QR effettivi, secondo contesto touch, bytes identici, revoca/reset/errori, creatore telefono offline |
| `go-real-expiry.json` | TTL **300 secondi reali**, verifica a **301.45 s**, PASS | Landing, `/file`, `/image` → 410; copia RAM rimossa, HTML servito identico a quello verificato; nessun salto dell’orologio server |
| `go-launch-lifecycle.json` | **7 verifiche PASS**, 2.74 s | Default di produzione, HTML adiacente da cwd diversa, secondo avvio, errori porte/file, pulsante Arresta e socket chiusa |
| `browser-tests.json` | **16 verifiche PASS**, 40.28 s | UI Python distinta, dodici luoghi, categorie, QR, tastiera/dialogo, errori/reset e secondo contesto |
| `hd-http-regression.json` | **24 export HTTP HD PASS**, 99.13 s | Tutte le combinazioni Pillow, crediti/PNG, una sola cartolina temporanea, reset finale; non carico multiutente |
| `photo-integrity.txt` | **12 fonti PASS** | Hash delle copie autentiche locali, controllo offline; non una clearance universale dei beni culturali |
| `windows-build.json` | **PE Windows x64 PASS**, sorgenti/vendor **21 file** | Go 1.27.4, CGO=0, GUI subsystem; EXE invariato perché il servizio non è cambiato e legge l’HTML adiacente |

Le suite standalone, controlli, redesign, bridge, avvio e timer registrano **lo stesso SHA-256 dell’HTML finale**. La parità sprite registra gli hash dei sorgenti; il controllo effetti quelli dei moduli interessati. Il confezionatore rifiuta evidenze non corrispondenti.

### La personalizzazione: effetto vero, non promessa percettiva

Pantaloni lunghi → pantaloncini: **56 pixel nativi** diversi nel confronto di riferimento; denim → blu notte **54**; cuffie rosse → azzurre **44**. Alcuni dettagli del viso cambiano solo **4–17 pixel nativi**: sono effetti reali ma piccoli, non nuove anatomie ad alta definizione. Lo zoom mostra quei pixel, non un’icona sostitutiva. Le scelte coperte sono spiegate: barba/labbra, visore/occhi, espressioni a occhi chiusi, cappuccio/capelli, cappotti/cinture. Conteggi e contesti completi nella prova e nella tavola 11.

### QR del file finito

Percorso completo HTTP: generazione, decodifica QR `/download/…`, apertura in **un contesto Chromium indipendente touch**, download del medesimo PNG del PC. `/telefono` ha un QR separato e non rivela chiave o scelte del PC né ne resetta la sessione. Provati modifica → revoca, nuova esportazione → nuovo token, reset → nome/scelte/URL e RAM ripuliti, link precedente 410, errori di rete → nessun QR fittizio con salvataggio locale preservato, rigenerazione dal PNG già pronto.

Una sola copia PNG in **RAM** nel servizio Go; token 192 bit, TTL normale 600 s (configurabile 300–600), pulizia a scadenza/reset/nuova sessione/arresto. Niente cookie del visitatore, cloud, registri di nomi/token o directory browsing. La scadenza backend è stata attesa naturalmente per cinque minuti su un’istanza dedicata; la distinta simulazione dell’orologio **del browser** verifica soltanto la UI.

### File autonomo e telefono

Il solo HTML `file://` è provato senza rete: nove categorie, quattro look, Indietro, nomi accentati/omessi, companion/nessuno, focus/Esc, download PNG/TXT, annullamento e recupero da `toBlob` nullo iniettato. Tutte le 24 esportazioni nello **stesso tab** senza riavvio del renderer. `/telefono` caricato via HTTP e poi offline completa il percorso senza nuove richieste server.

iOS File/Quick Look può non eseguire allegati HTML. Non è una PWA, non si promette ricaricamento HTTP offline dopo la chiusura. Condivisione nativa e salvataggio Foto/Download richiedono prove su hardware reale.

## 4 · Revisione visiva e materiale consegnato

Osservati i dodici fondali canonici, le tavole **24-up Pillow e Canvas**, i crop di appoggio e le schermate effettive. Corretta la posizione fotografica di Taormina a **x=2500** (companion 2150) dopo 252 fuori-cornice iniziali su corporatura Slanciata/In movimento; nuovo audit **12096/0 errori**. Castel del Monte: personaggio **x=690**, cane 1140 sul primo piano davanti agli arbusti; vista finale osservata. Nessun soggetto volutamente appoggiato sui plutei della Biblioteca o sopra il tempio.

Conservati gli appoggi delle illustrazioni 3.1; le sei aggiunte hanno layout, luce, tinta, scala e contatto dedicati. L’architettura illustrata e le aree libere di appoggio sono interpretative, non rilievi metrici. **Non tutte le possibili combinazioni sono state viste a occhio; nessuna approvazione del committente è presunta.**

Materiale: **13 PNG HD** (1 foto + 12 NES), **24 JPG attribuiti**, **7 screenshot servizio**, **6 standalone**, **16 Python**, tavole **01–13**, guide italiane e PDF A4 di **una pagina**. La tavola 11 confronta cambiamenti effettivi; 12/13 mostrano lo zoom reale PC/390 px; 05/07 i due renderer. La vecchia tavola 07 da dodici esempi è rimossa, non spacciata per prova corrente. Nomi fittizi e token di QA revocati.

Parità sprite e PNG di sfondo comuni **non** significano identità completa Canvas/Pillow: JPEG incorporati ottimizzati, rasterizzazione font, rumore, interpolazione e ombre hanno implementazioni distinte. Schede in `docs/SCENE_COMPOSITION.md`, crediti/limiti in `SOURCES_AND_LICENSES.md`.

## 5 · Risorse, errori di sviluppo e limiti residui

Il giro Python finale di 24 export ha lasciato **735016 KiB RSS**, picco processo **827116 KiB**. Rendering serializzato e cache limitate: non è certificazione di molti client. Consigliati browser recente, una sola edizione attiva, **8 GB RAM** sul PC dello stand. Tempi della sandbox non promessi sui telefoni.

Due primi giri di stress browser sono stati interrotti dal sistema per pressione di memoria nella sandbox; non sono conteggiati come PASS. Migliorato il rilascio esplicito dei backing store Canvas consumati, della cache sfondo espulsa e dei canvas temporanei. Il test ora cancella i download temporanei già verificati e usa una directory su disco (`TMPDIR`), non un accumulo su tmpfs; rimossi dalla RAM anche vecchi scratch di QA. Poi rieseguito **l’intero giro 24 export, in un solo tab, fino a PASS**, senza GC forzata o riavvio pagina fra gli export. Un limite di memoria può comunque dipendere dal dispositivo; niente promessa di funzionamento illimitato su ogni telefono.

Il testo legale CC BY-SA 2.5 non era disponibile al percorso `.txt` canonico (404), e l’HTML canonico bloccava il client diretto (403): verificato il codice canonico e incluso il testo completo dal mirror SPDX, con URL documentati. Un errore di directory nella copia per il test di avvio è stato corretto prima di eseguire le prove. Nessuno di questi tentativi falliti è presentato come test riuscito.

| Aspetto | Stato / azione |
|---|---|
| Solo HTML Android → QR ordinario → altro telefono | **NON REALIZZATO sotto i vincoli richiesti**; occorre un servizio raggiungibile, nessun sostituto non approvato |
| Windows nativo / firewall / SmartScreen | **NON ESEGUITO**; verifica IT e prova sul PC dello stand |
| Telefono fisico / rete scolastica / VLAN | **NON ESEGUITO**; checklist nella guida operatore |
| Safari/Firefox / Web Share / tastiera virtuale reale | **NON ESEGUITI** |
| Foto Casardi | Autentica ma **1936, 707 × 491**; sostituzione attuale solo con diritti reali |
| Foto/LPC/beni culturali | Licenze per parte conservate; non permesso istituzionale o clearance universale |
| Illustrazioni assistite da IA | Provenienza dichiarata, nessuna esclusiva sugli elementi automatici o certificazione filologica |
| Copie già scaricate / traffico già consegnato | Non cancellabili a distanza; revoca solo degli accessi successivi |
| RAM e sistema | Azzeramento del buffer posseduto testato, non cancellazione forense di ogni copia OS/browser |
| Internet / HTTPS | Non previsti; HTTP LAN fidata, niente port forwarding o servizi esterni |

## 6 · Integrità e confezionamento

- HTML: **24,318,425 byte**, SHA-256 `48cca47603d4eb53db38680ace4151c9b3dac134b38c02bbd7f0849403d7e049`.
- EXE x64: **10,467,840 byte**, SHA-256 `f49fcf7d0d69b01e0d52f0bceb6893722c7598cbc7bff28504b1ea3a7b87d465`.
- Go/vendor: **21 file**, SHA-256 aggregato `a2d19278837a05e253a2a7dd35874720651c21b5f262b754fe11d330ee994122`.
- Manifest dodici fondali: SHA-256 `430b3da527706d6fe889ed0a5afc742f6096b28689d83fee28e3b0f4e740ecf5`.

`scripts/package.py` controlla test correnti, hash, sintassi, crediti/dimensioni, assenza cartoline visitatori e copie temporanee. La candidata è distinta dalla finale: quest’ultima richiede una prova indipendente di estrazione con **fingerprint runtime identico**. Procedura in `scripts/package_smoke.py`: sorgenti Go vendorizzati estratti e ricompilati, HTML letto accanto, copia del solo HTML aperta offline. Il PE Windows è confrontato, non eseguito.

**Estrazione indipendente eseguita e PASS:** **520 file runtime identici**, fingerprint aggregato `8ff44c31e4e56260dfba77991e8c88793fb9c8922efee0b47af99e4e38661a0f`. Dal solo HTML estratto e copiato da solo, aperto offline e separato dal progetto, creati PNG fotografico e NES 3000 × 2000; trasferiti con il servizio ricompilato dai sorgenti vendorizzati della copia estratta mediante QR decodificato, download byte per byte identici. Verificati reset/RAM vuota, revoca del vecchio link, `/telefono` senza chiave e nessun directory browsing. Il PE Windows è confrontato, non eseguito. Il servizio di collaudo viene arrestato al termine; non è una prova Windows/telefono fisico.

Lo ZIP contiene tutti i sorgenti, EXE/HTML pronti, asset/licenze, guide, test, screenshot e campioni. Esclusi cache/toolchain, binari Linux di QA, virtualenv e cartoline visitatori. CRC e SHA-256 dei membri verificati; `MANIFEST.sha256`, sidecar `.zip.sha256` e `docs/test-results/package-audit.json` coprono la distribuzione. I soli documenti non modificano il fingerprint runtime, ma sono coperti dal manifest completo.

**Prima del pubblico:** Windows + IT + telefono fisico separato, due stili, rete dello stand e vecchio link dopo reset. Nessuna prova in sandbox sostituisce quel collaudo.
