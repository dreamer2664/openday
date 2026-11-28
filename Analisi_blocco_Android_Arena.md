# Blocco del personaggio su Android/Arena — esito dell’audit

## Conclusione, prima dei numeri

**Ho dimostrato un meccanismo che perde la riselezione per l’intero contatto del dito, anche quando l’anteprima è già pronta. Non è però dimostrato che sia la causa esatta della segnalazione Android/Arena. Non considero risolto il problema dell’utente.**

La 3.3.1 era stata presentata prematuramente come soluzione: i suoi test riproducevano una perdita di cattura del puntatore provocata in laboratorio, non la sequenza Android/Arena dell’utente. Il successivo riscontro dell’utente ha smentito che quella correzione fosse sufficiente.

Questa indagine riguarda esattamente il caso **senza sticker**: spostare il personaggio → toccare altrove → tornare sul personaggio → compare un quadrato blu ma non si sposta. L’utente ha concluso il proprio testing: **non sono richiesti altri test, screenshot, tracce o ricostruzioni del vecchio look**.

La produzione rimane **3.3.1**, commit `1b627eeb721826bf9b628753e81fa8c2b1088ad9`. Durante questo audit non ho modificato né pubblicato sorgenti o pacchetti di produzione. Un controllo finale ha confrontato **tutti i 717 file dello ZIP** con la copia estratta: identici byte per byte; i **473 asset** sono invariati.

## 1. Cosa ho esaminato

L’inventario riconciliato comprende **93 file di codice, template e fogli di stile, 16.661 righe fisiche**, comprese copie condivise, codice generato e dati tabellari. A questi si aggiungono **8 file di avvio/configurazione/dipendenze, 71 righe**, e altri **6 file di supporto, 138 righe**: README/licenza/configurazione CI del vendor, file ignore e guida HTML statica. Non sono conteggiate come codice le fotografie o le stringhe base64 dell’HTML generato.

| Area | File | Righe fisiche | Verifica effettuata |
|---|---:|---:|---|
| `app/` | 17 | 3.131 | Lettura dei moduli Python; test unitari separati |
| `browser/` | 11 | 1.895 | Lettura del percorso effettivo dell’HTML: eventi, renderer, geometria, CSS, template, bridge |
| `web/` | 9 | 1.245 | Lettura dell’edizione HTTP, distinta dall’HTML standalone |
| `scripts/` | 37 | 3.038 | Lettura degli script di build/manutenzione/QA; **non** esecuzione di tutte le relative suite |
| `tests/` | 5 | 589 | Lettura e successiva evidenza dei 76 test Python eseguiti |
| `service/`, escluso vendor | 5 | 1.046 | Lettura Go, test, piattaforme e font generato |
| Libreria QR vendorizzata | 9 | 5.717 | Lettura dell’implementazione; controlli indipendenti dei dati QR |

Sono state verificate anche queste corrispondenze:

- I sei moduli JavaScript incorporati nell’HTML pubblicato coincidono esattamente con i sorgenti del pacchetto.
- `sprites.js` si rigenera identico dai sorgenti Python e dagli helper del browser.
- Editor JS/CSS condivisi fra edizioni browser e HTTP: identici nella produzione.
- Togliendo le sole aggiunte diagnostiche documentate, **A1 torna identica alla produzione**: non contiene un diverso algoritmo di trascinamento.
- Il font Go incorporato si rigenera identico: **33.884 byte WOFF**, nome interno **Casardi Pixel**, 602 glifi. La medesima codifica è presente nell’HTML.
- Dati QR: verificate 160 configurazioni versione/livello, 32 sequenze di formato, 34 sequenze di versione, 40 tabelle di allineamento, 256 valori esponenziali e 256 logaritmici del campo finito.

**Lettura completa non significa prova formale di assenza di errori, né copertura dinamica di ogni riga.** Le dipendenze installate esternamente e le implementazioni interne del browser/sistema operativo non sono comprese in questa revisione del pacchetto. Il binario Windows è stato verificato per identità con il pacchetto, non eseguito nativamente su Windows.

## 2. Il percorso effettivo del gesto

### Accettazione e movimento

In `browser/layout-editor.js:65–75`:

1. Il dito deve colpire il pulsante trasparente `[data-drag="actor"]` sovrapposto al personaggio.
2. Il gesto viene rifiutato se l’editor è occupato, sta preparando un’anteprima, non ha metadati o conserva già un altro gesto.
3. Solo dopo questi controlli vengono impostati focus, cattura e stato del gesto.
4. I movimenti devono arrivare con lo stesso `pointerId`; le coordinate vengono convertite nello spazio canonico 600 × 400 e limitate alla cornice.
5. Durante il movimento viene mostrato un livello grafico separato; l’esportazione finale non dipende da una cattura dello schermo.

**Il quadrato visibile non certifica che l’editor abbia accettato il gesto.** Focus, indicazione visiva del browser e reale ingresso nell’handler sono fenomeni distinti. Non ho identificato quale dei tre produca il quadrato sul dispositivo dell’utente.

Non esiste un handler che, al semplice tocco sullo sfondo, imposti uno stato «personaggio deselezionato e bloccato». Senza sticker l’elemento attivo dell’editor resta normalmente `actor`. Il tocco esterno può invece modificare focus, scroll o instradamento degli eventi: questo va distinto dallo stato del modello.

### Rilascio e nuova anteprima: il punto critico concreto

In `browser/layout-editor.js:76–79` e `browser/app.js:89–94`, ogni spostamento concluso avvia questo percorso:

```text
rilascio del personaggio
  → rendering = true
  → overlay di caricamento che riceve i tocchi
  → ricomposizione Canvas
  → codifica PNG di immagine principale, sfondo pulito e livello mobile
  → assegnazione image.src
  → attesa image.decode()
  → applicazione dei nuovi metadati e sblocco
```

Il blocco dei nuovi gesti durante questa operazione è **dimostrato nel codice e osservato nei test**. In 7 delle 36 coppie di gesti ravvicinati della produzione, il secondo contatto è arrivato sul livello `preview-loading`, non sul personaggio; il modello non si è mosso.

La rilettura delle tracce ha mostrato un punto più preciso: **26 movimenti successivi di quei sette contatti continuavano a essere indirizzati al livello di caricamento anche dopo che era stato nascosto e `rendering` era tornato falso**. La fine del rendering, da sola, non recupera un gesto iniziato sull’elemento sbagliato.

### Conferma naturale: dito mantenuto premuto oltre la fine del caricamento

Ho eseguito una nuova prova senza ritardare artificialmente compose/decode, senza perdere intenzionalmente la cattura e senza cambiare sorgenti o handler. Sono stati aggiunti solo listener passivi di tracciamento dei **PointerEvent**, senza listener TouchEvent aggiuntivi. Sequenza: primo spostamento → tocco sul pulsante esterno del frame → secondo contatto → attesa della scomparsa del caricamento, **mantenendo lo stesso dito premuto per altri 250 ms** → sei movimenti → rilascio → terzo vero spostamento di controllo.

| Variante e stile, stesso preset nel laboratorio | Sequenze eseguite | Secondi contatti rimasti sul livello nascosto |
|---|---:|---:|
| Produzione · fotografia | 4 | 2 |
| Produzione · NES | 7 | 2 |
| A1 · fotografia | 3 | 2 |
| A1 · NES | 3 | 2 |
| Esperimento Canvas · fotografia | 4 | 0 |
| Esperimento Canvas · NES | 4 | 0 |

Totale: **25 sequenze, 75 contatti destinati all’attore e 25 tocchi esterni**, 157,81 s, zero eccezioni JS. I test di produzione/A1 si fermavano dopo due osservazioni del difetto per stile: questi numeri **non sono una stima della frequenza del bug**.

Negli otto contatti falliti ho verificato contemporaneamente:

- caricamento nascosto e pulsante di esportazione già abilitato;
- `preview-loading.hasPointerCapture(pointerId) === true`;
- `actor.hasPointerCapture(pointerId) === false`;
- tutti i sei movimenti diretti al livello nascosto, rettangolo dell’attore fermo e livello mobile non mostrato;
- spostamento nuovamente riuscito con un terzo contatto reale: **25/25 controlli di recupero riusciti**.

**La causa di questa perdita del secondo gesto è quindi dimostrata: barriera di anteprima + cattura implicita touch sul livello che poi scompare + assenza di un inizio gesto sull’attore.** Non serve ipotizzare un difetto di Android o Arena per produrla. Non è la perdita della cattura dell’attore che era stata usata per giustificare la 3.3.1; liberare una cattura o nascondere il caricamento non crea retroattivamente il `pointerdown` mancante sull’attore.

**Limite decisivo:** in questi casi il focus osservato era su `BODY`, senza contorno `focus-visible` dell’attore. Non ho riprodotto il quadrato blu descritto sul telefono, né un blocco che continui attraverso nuovi contatti dopo il rilascio. È un difetto reale e una spiegazione candidata per parte della sequenza, **non un’identificazione certa della segnalazione originale**.

La versione pubblicata sblocca correttamente il proprio stato in caso di risoluzione o errore della promessa corrente. Tuttavia non esiste un limite all’attesa di tutte le promesse coinvolte: se caricamento font/immagine o decodifica non terminassero e non generassero un errore, il `finally` non sarebbe ancora eseguito. **È un rischio strutturale, non un evento naturale che io abbia riprodotto su Android/Arena.** Non lo attribuisco al dispositivo o al contenitore senza evidenza.

### Cattura e annullamento

Ho tracciato tutte le scritture e le uscite dei flag `drag`, `rendering`, `busy`, dei metadati e delle anteprime. La 3.3.1 gestisce rilascio globale, annullamento, perdita di cattura, blur, pagina nascosta, uscita dalla pagina e tastiera. La precedente riproduzione con perdita di cattura iniettata resta valida per quella classe di errore, **ma non stabilisce la causa di questa segnalazione**.

## 3. Risultati dei test eseguiti nell’audit

Ambiente: Linux, Python 3.13.18, Node 20.20.2, Chromium 159.0.8154.6 / Playwright build 1255. Per il servizio Go è stata installata una toolchain verificata SHA-256, Go 1.27.4. Le versioni effettive sono registrate nelle prove.

| Controllo | Esito osservato | Cosa permette di concludere |
|---|---|---|
| 76 test unitari Python | PASS, 13,293 s | Le asserzioni della suite passano; non è una prova del gesto su Android |
| 26 test Go con `-race -count=1 -mod=vendor` | PASS, 28,147 s; nessuna race segnalata | Controlli del servizio locale; percorso separato dal drag dell’HTML su Arena |
| HTML originale, 1/2 iframe sandbox a origine opaca, 4 preset, 3 taglie, nessuno sticker | **288 gesti verificati**, PASS; zero eccezioni JS e richieste di rete del frame figlio | Il blocco persistente non si è riprodotto in queste condizioni emulate |
| Pressioni prolungate, multitocco, rilascio fuori dai frame, larghezza ridotta e scala CSS del genitore | **96 tentativi**: 72 spostamenti con verifica live/commit e 24 contatti di preparazione; PASS | Copertura su entrambe le implementazioni e i due stili; non è il telefono fisico |
| Controlli nativi di taglia nell’ultima suite | **36 valori effettivi verificati**: 65, 100, 135 | Non ci si è limitati a inviare tasti senza controllarne l’effetto |
| Gesti ravvicinati della produzione | **7/36 secondi gesti intercettati dal caricamento**; 26 movimenti restano sul livello dopo che è nascosto | Intero contatto perso, non semplice attesa del rendering; nessun blocco permanente dimostrato |
| Nuova prova con secondo contatto mantenuto premuto oltre il caricamento | **75 contatti attore / 25 sequenze**: 8 secondi contatti naturalmente catturati dal livello nascosto in produzione/A1; 0 negli 8 controlli Canvas; 25/25 terzi contatti riusciti | Conferma diretta con `hasPointerCapture`; non ricrea il quadrato blu o il dispositivo originale |
| Caricamento dei livelli IMG a CPU 1×/4×/8× | Nessun fallimento nativo di decode riprodotto | Non prova che decode non possa fallire sul dispositivo reale |
| Inviluppo geometrico conservativo, Python e JS effettivo | **1.465.440 casi per implementazione**, PASS | Escluso un intervallo canonico totalmente chiuso entro le ipotesi dichiarate; non prova la consegna dei tocchi |

Ulteriori prove di focus e contatto sono conservate integralmente: 72 e 81 spostamenti riusciti. Una classificazione iniziale di 36 contatti come «esterni» era imprecisa: dall’analisi dei target risultavano colpire l’attore. Non li uso come prova di tocco sullo sfondo.

### Controllo dei pixel durante il dito premuto: 72 verifiche concluse, non un PASS globale

Non mi sono limitato alle coordinate DOM. Ho confrontato screenshot del browser durante il contatto con un riferimento statico composto dagli stessi livelli grafici, una volta alla posizione nuova e una volta alla vecchia. **72/72 verifiche visive concluse** in modalità headless: produzione/A1/Canvas × fotografia/NES × quattro preset identici fra varianti × tre gesti, compresa riselezione dopo tocco interno ed esterno. Nessuno sticker o companion.

Sui pixel che distinguevano le due posizioni, l’errore RGB medio massimo verso la posizione corretta è **2,441**, contro un errore minimo di **68,60** verso quella ferma. Almeno il **96,69%** dei pixel di confronto rientra nella tolleranza dichiarata. Non è una dichiarazione di uguaglianza pixel-esatta o di un secondo renderer indipendente.

**L’esecuzione completa resta però FAIL:** dopo queste 72 verifiche, il ramo Chromium con finestra Xvfb e compositing SwiftShader abilitato ha avuto un crash durante la preparazione dell’interfaccia, prima di qualsiasi gesto. La causa del crash non è stabilita; non lo considero la riproduzione del blocco con pagina ancora attiva. Un primo smoke con trasferimento dell’HTML via routing del test era a sua volta terminato con un crash sul secondo documento: è conservato; lo smoke successivo con HTTP diretto e browser isolato per condizione ha completato 6/6 verifiche visive. Nessuno dei due crash è stato riscritto come PASS o attribuito automaticamente a memoria insufficiente.

Il sottoinsieme headless riuscito e il ramo incompleto sono separati in `compositor-adjudication.json`. Screenshot e letture diagnostiche possono cambiare lo scheduling; non sono una prova sul contenitore Arena reale.

### Abbigliamento e A1

L’utente ha riferito che A1 funziona, **ma con un personaggio vestito diversamente**. Quel risultato non isola la variabile abbigliamento: A1 aggiunge DOM, listener passivi anche per TouchEvent, letture diagnostiche, aggiornamenti periodici e un diverso file di anteprima. Non contiene un diverso algoritmo di trascinamento, ma l’osservazione può comunque cambiare layout e scheduling.

Nel nuovo controllo con **lo stesso preset scelto da me**, la perdita del secondo contatto è comparsa naturalmente anche in A1, nei due stili. Quindi A1 non elimina strutturalmente quel difetto. Questo non smentisce che sia risultata utilizzabile sul telefono dell’utente: quel caso conserva condizioni diverse e non isolate.

Le geometrie dipendono dal ritaglio dei pixel opachi, dall’ancora, dalla taglia e dall’eventuale companion. Il controllo conservativo copre le altezze ammesse dal corpo/testa obbligatori, tutte le 71 scale accettate, 12 scene × 2 stili e 43 stati companion. Lo spazio minimo residuo è **140,8 unità orizzontali e 69,2 verticali** nel sistema 600 × 400.

Questo riduce l’ipotesi «un outfit riempie completamente l’intervallo di movimento», **non dimostra che ogni outfit riceva correttamente i tocchi**. Non ho ricostruito l’outfit originale, non disponibile; non chiedo all’utente di farlo.

## 4. Esperimento Canvas: cosa cambia e cosa è stato verificato

È stata realizzata **solo nell’area di laboratorio** una variante che:

- conserva i livelli dell’anteprima come Canvas, evitando codifica PNG e `image.decode()` nel percorso del trascinamento;
- consente di iniziare un altro gesto mentre la rifinitura dell’anteprima precedente è pendente;
- annulla il lavoro obsoleto e conserva lo spostamento già effettuato;
- trasferisce e libera esplicitamente i livelli grafici consumati;
- lascia invariati renderer, geometria di composizione, sprite, bridge, dati incorporati ed esportazione dagli asset.

**Non è una nuova release e non è una correzione confermata del caso Android/Arena.**

| Verifica della variante isolata | Risultato |
|---|---|
| Confronto dei gesti ravvicinati | **0/36** secondi gesti persi, contro 7/36 della produzione |
| Nuovo controllo con secondo contatto mantenuto premuto oltre il caricamento | **0/8** contatti persi nei due stili; gli otto controlli equivalenti riusciti non sono una prova fisica Android |
| Pixel mostrati durante gesti reali CDP | **24 verifiche Canvas** fra le 72 headless concluse, quattro preset × due stili × tre gesti; il ramo grafico con finestra resta incompleto per crash |
| HTML sperimentale senza strumenti diagnostici nei frame | **288 gesti**, PASS; zero eccezioni JS/rete del figlio |
| Concorrenza, ritardi/errori iniettati, annullamento, undo, lifecycle e regressione sticker | **36 controlli / 136 tentativi**, PASS |
| Download reali HD | **4 PNG 3000 × 2000** identici a una seconda ricomposizione degli asset con lo stesso renderer invariato |
| Commit grafico in 12 scene × 2 stili × 4 preset × 3 taglie, senza sticker/companion | **288 casi**: RGBA dei tre livelli identici prima/dopo il commit; errore massimo del rettangolo DOM 0,02705 unità canoniche |
| Risorse dopo 60 spostamenti per stile | **120 spostamenti verificati**; superficie dei Canvas grandi mantenuti stabile; dopo reset azzerata entro la soglia della misura |

Nella misura delle risorse, comprendendo Canvas creati sia dall’HTML sia da JavaScript, l’area osservata resta **1.695.570 pixel in fotografia** e **801.840 in NES**. Dopo reset non restano Canvas osservati con superficie superiore a 16 pixel. La topologia DOM resta di tre Canvas e un’area di presa prima del reset.

La misura usa WeakRef e garbage collection forzata: **non misura tutta la memoria nativa del processo, le immagini decodificate o i limiti di Android**. I confronti grafici sono test di commit del renderer, non 288 ricostruzioni dell’outfit sconosciuto.

Sono conservati anche due problemi degli strumenti di QA, senza presentarli come errori del prodotto:

1. Nel primo test di concorrenza, un messaggio di errore reso deliberatamente persistente intercettava il pulsante di esportazione. Il test è stato corretto chiudendo realmente il messaggio e ricollocando il pulsante; la nuova esecuzione ha completato i quattro download.
2. Il primo contatore risorse tracciava solo i Canvas creati da JavaScript e ometteva quello dichiarato nell’HTML. Ho conservato quel risultato, corretto il contatore e **rieseguito** i 120 spostamenti; i numeri sopra vengono dalla misura completa.

## 5. Difetto distinto verificato nell’edizione HTTP

In `web/static/app.js:304–321` il ramo di errore di un’anteprima non controlla che la richiesta che ha fallito sia ancora proprietaria dello stato corrente.

Una prova controllata con le vere route Flask ha sospeso due decodifiche e fatto fallire quella vecchia mentre la nuova era pendente. Nella produzione HTTP la vecchia richiesta ha chiamato `editor.failed()`, azzerando il flag di rendering della nuova richiesta e mostrando un errore obsoleto. Una patch isolata con controllo di sequenza/epoca/proprietà ha impedito entrambe le modifiche indebite.

**Il difetto è reale nel controllo iniettato, ma non spiega l’HTML standalone usato qui.** Il relativo controller JavaScript è diverso, e il percorso standalone ha già il controllo di proprietà nel proprio ramo di errore. La patch HTTP non è stata applicata alla produzione.

Altra osservazione statica non causale: la funzione non usata `WriteColorFile` della libreria QR assegna i colori prima di controllare l’errore di costruzione. Il servizio usa `qrcode.Encode`, non quella funzione. Non è nel percorso del gesto né è stato modificato per questa indagine.

## 6. Limiti e criterio per chiudere la diagnosi

- L’emulazione Pixel 7 di Chromium su Linux **non è Android fisico** e non riproduce automaticamente il contenitore Arena reale.
- Il codice del contenitore effettivo e la sessione del dispositivo non sono disponibili in questo ambiente. Il tentativo di leggere la homepage pubblica di Arena ha ricevuto HTTP 403; non è stato aggirato. Non attribuisco quindi una causa al contenitore.
- Un errore introdotto intenzionalmente è utile per verificare gestione e isolamento dello stato, **non dimostra che si sia verificato nella sessione dell’utente**.
- I PASS dimostrano soltanto le asserzioni eseguite, nelle condizioni registrate. Non annullano il riscontro dell’utente.
- Non ho eseguito l’EXE su Windows, Safari/Firefox, test su LAN scolastica o una prova su un telefono fisico durante questo audit.

Per dichiarare la causa risolta serve un legame dimostrato fra la sequenza originale, lo stato che impedisce il movimento e una correzione mirata che elimini quello stesso stato. **Quel legame non è ancora stato ottenuto.** La diagnosi resta aperta; non scarico la verifica sull’utente e non pubblico un’altra versione etichettata come risolutiva.

## 7. Prove conservate e integrità

Archivio tecnico: `casardi_diagnostica/audit_agente/prove_audit.zip`.

Contiene script, report originali e annotati, log, inventario con hash, provenienza dei timestamp, patch sperimentali e una selezione di screenshot di controllo. Conserva anche i run falliti o incompleti; non include copie duplicate dell’HTML da 24 MB, degli asset originali o di credenziali. Le istruzioni di ricostruzione sono in `casardi_diagnostica/audit_agente/README.md`; lo ZIP di produzione già presente rimane la sorgente di riferimento.

Alcuni strumenti di questa fase riportavano l’etichetta statica `2026-11-27`, che non è un timestamp di esecuzione. Gli originali sono conservati; copie annotate e registro di provenienza mantengono separati quell’etichetta e i timestamp dell’orologio del laboratorio, che riportano `2026-11-28` UTC. Non uso l’orologio del filesystem per correggere automaticamente la data della conversazione o per dedurre l’ora esatta dei test. **Non si tratta di nuove esecuzioni e non sono state ridatate le prove storiche dello ZIP di produzione.**

| Artefatto invariato | SHA-256 |
|---|---|
| HTML di produzione | `8b247a2cd86bd0485f352190590371e83150aa3feb99b2cb5c59fc517d9a09ea` |
| A1 diagnostica | `2806e32423451c4ef7eeb5d37260b645a5ba06a11dba14474c99c5e6447e8992` |
| ZIP di produzione | `9fb4a649948ded763cb3436d3b82b12f58f196f8429e65abbd8dfe18bdf5a12f` |
| HTML sperimentale, non distribuito come release | `a01ca4759b499979e8a9b0591f6b4a007fb11654d874053e0444be3c7b33245e` |
