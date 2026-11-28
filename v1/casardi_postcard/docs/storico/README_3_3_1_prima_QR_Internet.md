# Cartolina digitale · Liceo Alfredo Casardi
## Open Day 2026/27 · Barletta — edizione 3.3.1 · Correzione trascinamenti

**Pacchetto di questa revisione: `Cartolina_Casardi_Windows_LPC_QR_2026-27.zip`.** Sostituisce la consegna precedente; i due file principali sono già pronti nella cartella, non vanno ricreati dai sorgenti.

Studio completo per creare cartoline **PNG 3000 × 2000, orizzontali 3:2**. Dodici ambientazioni autentiche, modalità fotografica e ricostruzione NES, nome facoltativo, personaggio modulare e otto companion facoltativi. Nessun account, cloud, servizio a pagamento o asset di videogiochi commerciali.

**Correzione 3.3.1:** risolto un blocco comune a personaggi e sticker quando un trascinamento perdeva la cattura del puntatore o veniva interrotto. Il gesto incompleto viene annullato, senza azzerare la cartolina o le modifiche precedenti; si può riprendere subito a trascinare. Sistemata anche la chiusura dello stato di attesa dell’anteprima. Asset e qualità del logo non sono modificati da questo intervento. [Diagnosi e prove](docs/BUG_TRASCINAMENTO_3.3.1.md).

**Novità 3.3, conservate:** nell’ultimo passaggio puoi **trascinare il personaggio sulla cartolina con mouse o dito**; il companion lo segue. Tre taglie nitide, frecce/Maiusc+frecce, annullamento e ripristino della posizione consigliata. Il pannello **Ultimi tocchi · facoltativi**, prima del PNG, offre **otto sticker** (fino a sei per cartolina) e aggiunte opzionali alla targhetta: finitura, simbolo, percorso e angolo. Nessuna decorazione è attiva di default.

**Sticker:** alloro, Pegaso decorativo, lira, libro, maschere teatrali, capitello ionico, rosa dei venti e **logo ufficiale Casardi autentico**, ricavato dalla brochure scolastica 2026/27, non generato o sostituito dallo stemma della Repubblica. Il logo conserva proporzioni/orientamento e fondo della fonte; i sette sticker decorativi sono originali assistiti da IA. Fonte, licenze ed eccezioni in [Fonti del logo](docs/FONTI_LOGO.md). [Guida a spostamento, sticker e targhetta](docs/COMPOSIZIONE_E_STICKER.md).

Lo spostamento libero è una scelta grafica: non riconosce automaticamente ogni piano architettonico della fotografia. Ombre e occlusione si ricalcolano al rilascio; per un appoggio sicuro usa **Posizione consigliata**. La nuova composizione è supportata da Canvas e Pillow, compreso l’HTML autonomo offline. Il file esportato resta 3000 × 2000 e la modalità NES resta 600 × 400 → ×5, senza catturare pannelli o maniglie.

**Dalla 3.2, conservato:** aggiunti **Colosseo, Acropoli di Atene / Partenone, Pompei / Foro, Teatro antico di Taormina, Castel del Monte e Castello di Barletta**, ciascuno con fotografia autentica e illustrazione pixel: **12 luoghi / 24 combinazioni**. Le sei illustrazioni della 3.1 che sono piaciute al committente sono conservate **byte per byte**, insieme allo stesso tema NES-rétro.

**Personalizzazione corretta, non sostituita:** rimane la famiglia professionale LPC. I pantaloncini usano ora il vero modulo Shorts, non un secondo pantalone lungo; denim/blu notte e beige/crema hanno rampe distinte; il colore delle cuffie è effettivo. Ogni gruppo confronta i **pixel dello sprite composto nell’abbigliamento attuale**: un’alternativa senza differenza visibile viene attenuata e spiegata. «Scopri questo dettaglio» rimuove esplicitamente gli strati che lo coprono; non vengono simulati cambiamenti. Uno zoom del viso mostra gli stessi pixel nativi, ingranditi. Gli effetti facciali restano intenzionalmente piccoli: non sono nuove anatomie ad alta definizione.

**Provenienza degli scenari:** dodici illustrazioni **assistite da IA**, create dai riferimenti fotografici documentati e rifinite a **600 × 400 nativi, massimo 64 colori per sfondo**. Non si dichiarano interamente disegnate a mano o rilievi storici. Canvas e Pillow leggono gli stessi PNG canonici, senza generazione a runtime. Manifest, licenze e limiti in [assets/nes/manifest.json](assets/nes/manifest.json) e [SOURCES_AND_LICENSES.md](SOURCES_AND_LICENSES.md). I colori del Casardi reinterpretano il riferimento storico del **1936**, non documentano la scuola attuale. Le licenze LPC sono miste: **non è tutto CC0**.

**Limite richiesto e non risolto con un trucco:** il solo HTML aperto su Android o PC crea e salva il PNG sul proprio dispositivo; non può consegnarlo a un altro telefono mediante un normale QR senza un servizio raggiungibile che ospiti il file. Un QR non può contenere un PNG HD e un URL Blob/file locale non è remoto. Non sono stati aggiunti cloud, hosting esterno, accoppiamento WebRTC o due QR come se soddisfacessero quella richiesta. Il servizio Windows già presente resta un’opzione separata, non un equivalente Android-only.

**Il QR principale trasferisce il PNG già finito**, non apre il creatore. Il QR distinto del creatore telefono è soltanto in Info. Il trasferimento reale è stato verificato via HTTP fra due contesti Chromium indipendenti, con decodifica del QR e confronto byte per byte del PNG. **Non è una prova con un telefono fisico sulla rete della scuola.**

---

## 1 · Avvio Windows, senza terminale

1. **Estrarre tutto lo ZIP** in una cartella del PC. Non eseguire dall’interno dell’archivio.
2. Lasciare nella stessa cartella questi due file:
   - **`AVVIA_CARTOLINA_WINDOWS.exe`**
   - **`Cartolina_Casardi_PC_e_Telefono.html`**
3. Collegare il PC alla rete locale autorizzata per lo stand.
4. Fare **doppio clic su `AVVIA_CARTOLINA_WINDOWS.exe`**. Il programma avvia il piccolo servizio locale e chiede al browser predefinito di aprire lo studio. Non richiede Python, Go, Node.js o installazioni.
5. Se Windows chiede l’accesso alla rete, far autorizzare dal responsabile IT **soltanto la rete privata prevista per l’evento**. Non disattivare il firewall.
6. Facoltativo: `F11` per lo schermo intero. Tenere una sola scheda principale dello stand.

**Destinazione dell’eseguibile:** Windows 10/11 **x64**, non Windows a 32 bit o ARM nativo. È un PE x64 con sottosistema grafico, cross-compilato nella sandbox Linux. **L’apertura nativa su Windows, il browser predefinito e la finestra firewall non sono stati eseguiti qui:** provarli sul PC dello stand prima dell’evento. Il programma è **non firmato digitalmente**; SmartScreen/antivirus o policy scolastiche possono richiedere una verifica dell’IT. Sono inclusi sorgenti, hash e istruzioni di ricompilazione. Non aggirare le protezioni del PC.

L’indirizzo del PC è normalmente **`http://127.0.0.1:8080/`**. Se la porta appartiene a un altro programma il servizio prova **8787**, poi **8899**. Se lo studio è già in funzione, un altro doppio clic riapre l’istanza esistente; il nuovo caricamento della pagina principale avvia una sessione pulita e revoca il vecchio QR. Se tutte le porte sono occupate viene mostrato un errore in italiano.

### Arresto, sempre senza terminale

**Info → Servizio dello stand → Arresta servizio locale**, poi confermare. Il QR viene revocato, la memoria temporanea svuotata e il servizio si arresta. Chiudere soltanto il browser **non** arresta il servizio. Per riattivarlo: doppio clic sull’EXE. Un creatore già caricato può continuare a esportare PNG locali, ma non pubblicare un nuovo QR finché il servizio non viene riavviato e la pagina ricaricata.

## 2 · Percorso del visitatore

**Inizia → stile → luogo → nome facoltativo → personaggio → companion facoltativo → anteprima e ultimi tocchi facoltativi → Genera PNG.**

- Lo stile si sceglie una volta e vale per tutti i luoghi. Indietro conserva le scelte; si può cambiarlo tornando alla prima fase.
- Quattro look iniziali — Urbano, Esplorazione, Neon, Pilota — accelerano la scelta, ma restano modificabili.
- Nove categorie di personalizzazione; quattro pose e sei espressioni. Le opzioni senza una variante grafica compatibile con la corporatura sono disabilitate, non forzate.
- Nome/nickname facoltativo, massimo 28 caratteri. Non chiedere cognome, contatti o registrazione. I comuni accenti italiani sono coperti; emoji e tutti gli alfabeti Unicode non sono garantiti.
- Un oggetto in mano imposta la posa «Mani davanti»; scegliendo un’altra posa viene riposto. Cappuccio e berretto nascondono i capelli: la scelta resta memorizzata. L’interfaccia disabilita le alternative coperte e offre la rimozione esplicita della copertura.
- La vista laterale è un **dettaglio ingrandito**; posizione e scala reali si controllano in Anteprima.
- Nessun timer durante la creazione. Il conto alla rovescia riguarda **solo il collegamento di download** dopo l’esportazione.

Dopo «Genera PNG», la scheda **Dal PC al telefono → Scansiona e scarica** mostra il QR della cartolina pronta. Sul telefono aprire il link e premere **Scarica il PNG**. Controllare il salvataggio, quindi premere sul PC **Ho finito · Nuova cartolina** o **Ricomincia**: nome, scelte, PNG della pagina e copia temporanea del servizio sono azzerati. Non avviare il visitatore successivo se appare un errore di reset non confermato; ripristinare/riavviare il servizio.

Il QR scade dopo **10 minuti**; alla scadenza il servizio elimina la propria copia e l’interfaccia nasconde il QR. Il PNG locale resta salvabile finché non si resetta/chiude la pagina; si può richiedere un nuovo QR per quel medesimo PNG. Non esiste una galleria dei visitatori. Un reset non può cancellare copie già scaricate o bytes già consegnati al telefono.

**Composizione finale:** trascina personaggio/sticker, oppure selezionali con Tab e spostali con le frecce; Maiusc aumenta il passo. Le opzioni della targhetta sono in fondo. «Ripristina composizione» non cancella nome, luogo o aspetto. [Istruzioni complete](docs/COMPOSIZIONE_E_STICKER.md).

**Tastiera:** Tab / Shift+Tab, Invio / Spazio sui pulsanti; Esc chiude Info. Mouse e touch sono supportati. Alt+← / Alt+→ percorre i passaggi già sbloccati. Il battito delle palpebre è facoltativo e rispetta la preferenza di movimento ridotto.

## 3 · Rete e prova obbligatoria con un vero telefono

Il servizio ascolta su **`0.0.0.0:PORTA`**, non solo su localhost. `0.0.0.0` è l’indirizzo di ascolto, **non** un URL da digitare. Il QR contiene:

```text
http://IP-LAN-REALE-DEL-PC:PORTA/download/TOKEN-CASUALE
```

Il token ha **192 bit casuali**. Il QR non contiene l’immagine e non la carica su Internet. Il trasferimento è **HTTP locale, non HTTPS**; non vengono creati certificati finti. Non esporre il servizio su Internet e non fare port forwarding.

### Prima dell’apertura dello stand

1. PC e telefono separato sulla **stessa LAN comunicante**. Il PC può essere Ethernet e il telefono Wi-Fi se la rete consente la comunicazione tra i due segmenti. La sola rete mobile non basta.
2. Aprire **Info → Servizio dello stand**. Leggere il menu delle schede di rete: interfaccia, **IP e porta nel link**. In presenza di VPN o schede multiple scegliere l’IPv4 privato della rete corretta. Il servizio rileva le interfacce localmente, senza interrogare un servizio esterno. Se si cambia rete/IP, arrestarlo e riavviarlo.
3. Se non viene rilevato un normale IPv4 privato, l’app **non inventa un QR raggiungibile**: mostra l’avviso e permette comunque di salvare sul PC.
4. Aprire in Info **QR distinto: creare una nuova cartolina sul telefono**. Scansionarlo dal telefono. Se compare «Inizia», quel dispositivo raggiunge il servizio; questo è anche un controllo preliminare di rete, **non** il download di un’immagine finita. L’apertura `/telefono` non resetta il PC.
5. Creare una cartolina fotografica e una NES sul PC. Per ciascuna scansionare il **QR dopo Genera PNG**, scaricare, aprire il PNG sul telefono e verificare **3000 × 2000**.
6. Premere Nuova cartolina: il vecchio link deve restituire «non è più valido», HTTP **410**. Ripetere la prova dopo cambiamenti di rete, porta o firewall.

### Se il link non si apre

- Confrontare l’IP mostrato con l’IPv4 della scheda corretta nelle impostazioni Windows o in `ipconfig` (solo diagnostica dell’IT, non richiesta per l’avvio ordinario).
- Far autorizzare ingresso **TCP sulla porta effettiva**, soltanto dalla rete locale prevista. Non disabilitare globalmente il firewall.
- Lo stesso SSID **non** garantisce connettività: reti ospiti, VLAN o client/AP isolation possono impedire telefono → PC. Chiedere all’IT una LAN autorizzata non isolata o una rete dedicata approvata. Non aggirare le policy scolastiche.
- Un pulsante o test sul PC non può certificare il percorso dal telefono. Serve il dispositivo separato.
- **Fallback sempre utile:** «Scarica PNG» / «Apri l’immagine» sul PC usa il file già composto nel browser. Un errore del servizio non fa perdere l’immagine. Le copie nella cartella Download vanno gestite dall’operatore, non sono cancellabili dall’app.

## 4 · File unico autonomo e versione telefono completa

**`Cartolina_Casardi_PC_e_Telefono.html`**, circa **24,3 MB**, contiene l’applicazione completa: foto, ricostruzioni, sprite, font, crediti e licenze. Può essere copiato **da solo** e aperto in un browser, senza comandi, Python o file accanto. Non è una demo né un semplice download viewer.

| Apertura | Cosa offre |
|---|---|
| EXE Windows + HTML accanto | Creatore completo e **QR temporaneo del PNG finito** tramite il servizio LAN |
| Solo HTML, `file://` | Creatore completo offline, PNG e crediti salvati sul dispositivo; **nessun servizio QR cross-device** |
| `http://IP-PC:PORTA/telefono` | Lo stesso creatore completo, responsive touch; una volta caricato funziona anche offline fino al PNG. Non riceve la chiave del PC e non ne modifica la sessione |
| Kiosk Python facoltativo | UI distinta con rendering Pillow sul PC e download LAN temporaneo su disco; non serve per l’avvio EXE |

Su telefono: **Scarica PNG**, **Apri l’immagine**, immagine espandibile con pressione prolungata. «Condividi / Salva…» compare soltanto se il browser supporta la condivisione di file; su HTTP può non essere disponibile. **L’anteprima di un allegato o File/Quick Look su iOS può non eseguire JavaScript:** usare un browser adatto oppure `/telefono` sulla LAN del PC. Non è una PWA o un’app nativa, e non si promette il ricaricamento HTTP offline dopo aver chiuso la pagina.

Guida dedicata: [File unico e telefono](docs/GUIDA_FILE_UNICO_E_TELEFONO.md).

## 5 · Dati temporanei e configurazione del servizio Windows

**Nessun PNG viene scritto su disco dal servizio Go.** Riceve il PNG definitivo dal browser, lo verifica e ne conserva una sola copia in **RAM**, fuori da qualunque directory pubblica. È una scelta più restrittiva rispetto alla directory temporanea prevista inizialmente.

- Scadenza controllata su ogni lettura; pulitore ogni secondo. Scadenza, reset, nuova esportazione, nuova pagina principale e arresto revocano il token e azzerano il buffer posseduto dal servizio.
- Richieste obsolete/in corso sono invalidate con una generazione di sessione. `/telefono` non riceve i controlli riservati.
- Chiave owner casuale distinta dal token, controlli client locale/host/origine per le operazioni di scrittura; limite **24 MiB**, solo PNG validi **3000 × 2000**.
- Nessun cookie, localStorage, sessionStorage, analytics o access log con nome/token. I link sono comunque presenti sullo schermo e possono entrare nella cronologia del browser: gestire il PC dello stand come dispositivo condiviso.
- `Cache-Control: no-store`; nessuna libreria permanente. Non si promette cancellazione forense della RAM, delle copie del sistema operativo o dei file già scaricati.

Variabili **facoltative per manutentori**, non necessarie al doppio clic:

| Variabile | Default | Significato |
|---|---|---|
| `CASARDI_PORT` | 8080 → 8787 → 8899 | Se impostata, usa soltanto quella porta (1024–65535) |
| `CASARDI_TTL` | 600 | Secondi, 300–600 inclusi; valori non validi mantengono 600 |
| `CASARDI_HTML` | HTML accanto all’EXE | Percorso esplicito del file completo |
| `CASARDI_NO_BROWSER` | non impostata | `1` per collaudo senza avvio browser |

**Non impostare `CASARDI_TRUST_PREVIEW` o `CASARDI_QA_LAN_IP` sul PC dell’evento.** Sono eccezioni di collaudo per l’iframe della sandbox: indeboliscono i controlli di origine/client e non fanno parte dell’avvio distribuito. Il programma non le abilita da solo.

## 6 · Cosa è incluso, fonti e limiti artistici

Dodici luoghi: **Casardi**, **Pantheon**, **Foro Romano / Arco di Tito**, **Teatro di Epidauro**, **Biblioteca Malatestiana**, **Tempio di Hera II a Paestum**, **Colosseo**, **Acropoli di Atene / Partenone**, **Pompei / Foro**, **Teatro antico di Taormina**, **Castel del Monte**, **Castello di Barletta**. Le 24 interpretazioni hanno layout dedicati; il Foro fotografico mantiene volutamente un personaggio più piccolo per rispettare passanti e piano di appoggio.

**Foto Casardi:** autentica ma d’archivio, **1936, 707 × 491 px**, non una fotografia attuale ad alta risoluzione. Il PNG HD non inventa dettaglio mancante. È predisposta una cartella di sostituzione con immagine attuale **solo se realmente autorizzata**. Nessuna licenza viene dedotta dal sito della scuola.

- [Fonti e licenze](SOURCES_AND_LICENSES.md), [crediti LPC completi](assets/characters/CREDITI_LPC.txt)
- [Matrice effettiva degli asset](ASSET_MATRIX.md), [schede di composizione](docs/SCENE_COMPOSITION.md)
- [Report dei test e limiti](TEST_REPORT.md)
- [Guida operatore](docs/GUIDA_OPERATORE.md), [guida A4 stampabile](docs/GUIDA_RAPIDA.pdf)

Le foto conservano le proprie licenze. I personaggi LPC non vengono dichiarati originali Casardi né tutti CC0. Le composizioni e gli sfondi NES consegnati sono adattamenti **CC BY-SA 4.0** con attribuzioni nei metadati; le parti mantengono i propri obblighi. Il TXT dei crediti si scarica dal creatore; accompagnarlo al PNG quando un servizio elimina i metadati. Vedi le fonti per diritti extra-fotografici e beni culturali.

```text
AVVIA_CARTOLINA_WINDOWS.exe       avvio stand senza terminale
Cartolina_Casardi_PC_e_Telefono.html  creatore universale autonomo
service/                         sorgenti Go e dipendenza QR vendorizzata
browser/                         creatore e compositore Canvas originali
app/, web/                       renderer e kiosk Python facoltativo
assets/characters/lpc/            fonti LPC, definizioni, atlanti, palette, hash
assets/photos/, nes/, fonts/      foto, ricostruzioni e font locali
assets/stickers/                 7 sticker nativi + logo autentico, manifest/fonti
assets/licenses/                 testi legali e avvisi delle dipendenze
assets/replacements/casardi/      procedura per foto attuale autorizzata
renders/                         13 PNG HD di base + 2 PNG decorati, 24 JPG; nomi fittizi
docs/                            guide, screenshot reali e risultati QA
scripts/, tests/                 build, controlli riproducibili e unitari
var/                             solo edizione Python, mai dati da archiviare
```

Sono stati renderizzati **tutti e 24** gli esempi a 3000 × 2000. Per contenere lo ZIP si conservano un PNG fotografico e dodici PNG NES, più tutte le 24 viste JPG attribuite a 1200 px. `python scripts/render_gallery.py --all-hd` conserva anche tutti i PNG fotografici. Nessuna risoluzione dell’export nell’app è ridotta.

## 7 · Edizione Python facoltativa

Non occorre per Windows EXE/HTML. È mantenuta per ambienti con Python o per il rendering Pillow. Consigliati Python **3.11–3.13 64 bit**, browser Chromium recente, 4 GB RAM (8 GB consigliati). Qui verificati Linux / Python 3.13. Le dipendenze runtime sono in `requirements.txt`; versioni del collaudo in `requirements-lock.txt`.

Windows, soltanto per chi sceglie questa edizione:

```bat
py -3.13 -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
start.cmd
```

Linux/macOS:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
bash start.sh
```

Aprire `http://127.0.0.1:8080`, lasciare il terminale aperto; **Ctrl+C** per arrestare. Non avviare insieme l’edizione Go e Python sulla stessa porta. L’installazione richiede Internet oppure wheel preparate su una macchina con stesso OS/architettura/Python (`pip download -r requirements-lock.txt -d wheelhouse`, poi installazione `--no-index --find-links=wheelhouse`). Interprete e wheel non sono inclusi. Durante l’evento tutti gli asset sono locali.

Questa edizione scrive PNG in **`var/exports`**, con indice RAM, pulizia alla scadenza/reset/arresto e rimozione degli orfani all’avvio. Le opzioni `POSTCARD_PORT` (8080), `POSTCARD_HOST` (0.0.0.0), `POSTCARD_LAN_IP` (automatico), `POSTCARD_TTL_SECONDS` (600, ammesso 300–600), `POSTCARD_EXPORT_DIR` (var/exports) e `POSTCARD_BASE_URL` (override esperto) valgono **solo per Python**. Una porta occupata viene rilevata prima della pulizia della directory. Non condividere la stessa directory export fra più processi.

Il QR di prova rete di questa UI apre `/network-test`; il QR `/telefono` è distinto. Il salvataggio «Salva sul PC» usa il server, diversamente dal Blob locale dell’edizione Go/HTML. Attendere il reset confermato prima del nuovo visitatore.

## 8 · Build e collaudi per manutentori

Non servono a chi apre l’EXE o l’HTML già forniti:

```sh
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
python -m unittest discover -s tests -v
python scripts/fetch_photos.py --check
python scripts/asset_audit.py
python scripts/layout_audit.py
python scripts/nes_art_audit.py
python scripts/render_gallery.py
python scripts/build_review_sheets.py
python scripts/build_examples.py
python scripts/build_standalone.py
python scripts/browser_sprite_audit.py
python scripts/control_effect_audit.py
python scripts/nes_ui_test.py
```

La curation LPC è fissata a una revisione e non viene eseguita a runtime. `scripts/curate_lpc.py` richiede rete solo se si vuole ricreare il sottoinsieme da monte; conservare autori/licenze e non aggiornare durante l’evento. Il traduttore degli equipaggiamenti originali è limitato e rifiuta sintassi non supportata: nessun interprete Python è incorporato nell’HTML.

Go **≥1.24**, toolchain del collaudo **1.27.4**. Con Go installato:

```sh
cd service
go test -mod=vendor -race -count=1 -v ./...
cd ..
python scripts/build_phone_font.py  # solo se si modifica il font della pagina QR
python scripts/build_service.py
```

La dipendenza QR è già vendorizzata; la build imposta `GOPROXY=off`, `GOSUMDB=off`, CGO disabilitato. Il race detector richiede un toolchain C sul sistema di QA, non sul PC visitatori. La build Windows non equivale al test Windows nativo.

I test browser devono essere eseguiti **in serie nella sandbox limitata**, su istanze dedicate e senza visitatori. Avviare il servizio di prova come indicato nelle intestazioni degli script, poi:

```sh
python scripts/service_ui_test.py
python scripts/control_ui_test.py  # richiede anche il kiosk Python su :8080
python scripts/standalone_ui_test.py
python scripts/composition_audit.py  # geometria/validazione Canvas-Pillow
python scripts/composition_ui_test.py # drag, touch emulato, controlli e PNG reali
# solo con il kiosk Python avviato:
python scripts/ui_test.py
python scripts/stress_http_test.py
```

`scripts/service_expiry_test.py` attende davvero **300 secondi** su una seconda istanza; non modifica l’orologio. L’HTTP Python in due fasi è documentato in `scripts/live_http_test.py`. Nessuna di queste prove sostituisce telefono, Windows e Wi-Fi reali.

### Ricreare lo ZIP

`python scripts/package.py --candidate`, estrazione indipendente e `scripts/package_smoke.py` secondo le sue istruzioni; infine `python scripts/package.py`. Il preflight confronta prove e hash del runtime corrente. Lo ZIP contiene sorgenti, EXE, HTML, asset, licenze, guide, screenshot e campioni; **esclude tutti i dati visitatori, cache e ambienti virtuali**. Sono controllati CRC ZIP e SHA-256 di ogni file. Il file `.zip.sha256` e `MANIFEST.sha256` permettono la verifica di integrità.

**Prima dell’evento rimangono indispensabili:** esecuzione sul Windows dello stand, autorizzazione IT dell’eseguibile/firewall, prova con telefono fisico e LAN effettiva. Safari/Firefox, Web Share nativo e tastiera virtuale non sono certificati dalla sola emulazione Chromium.
