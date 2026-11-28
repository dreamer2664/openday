# Stato vincolante — blocco Android/Arena

## Richiesta e limiti da non perdere

L’utente ha concluso il proprio testing: **non chiedere altri test, screenshot, tracce, outfit o verifica di candidati**. L’agente possiede l’indagine.

Caso confermato: Android, anteprima HTML di Arena, **nessuno sticker**; trascina → tocco altrove → riselezione del personaggio; compare un quadrato blu senza movimento. Non attribuire una durata precisa al blocco oltre quanto riferito. A1 si è mossa sul dispositivo, ma con un abbigliamento diverso.

**Non è ancora dimostrata la causa esatta della segnalazione fisica. Il problema non è dichiarato risolto.** La 3.3.1 non aveva risolto la segnalazione: la perdita di cattura dell’attore iniettata nei vecchi test non dimostrava la causa originale.

## Nuovo meccanismo dimostrato, non da confondere con il caso fisico

Dopo il rilascio, l’HTML pubblicato abilita un livello di caricamento che riceve i tocchi e attende ricomposizione + tre codifiche PNG + `image.decode()` del livello principale. Se il secondo contatto dello stesso singolo dito inizia su quel livello, non inizia un drag dell’attore. Non è un test a due dita.

Le tracce di timing originali hanno 7/36 secondi contatti persi e **26 movimenti successivi ancora indirizzati al livello anche quando è già nascosto e `rendering=false`**. Non è solo un’attesa temporanea: finire il rendering non salva quel contatto. La rianalisi è in `timing-contact-ownership.json`, non è una nuova esecuzione dei gesti.

### Nuova prova naturale con contatto mantenuto premuto

`held-contact-ownership-results.json`: **PASS / 157,81 s / 25 sequenze / 75 contatti attore / 25 tocchi esterni / errori JS vuoti**. Stesso preset scelto nell’emulatore, fotografia/NES, produzione/A1/Canvas, due srcdoc opachi annidati. Solo tracciamento PointerEvent passivo aggiunto; nessuna modifica a sorgenti/handler e nessun ritardo, errore decode o capture loss iniettato.

- Produzione: fotografia 2 secondi contatti bloccati in 4 sequenze; NES 2 in 7.
- A1: fotografia 2 in 3; NES 2 in 3.
- Canvas: fotografia 0 in 4; NES 0 in 4.
- Arresto adattivo dopo due osservazioni per stile nella produzione/A1: **non sono frequenze statistiche del bug**.

Negli otto contatti falliti, dopo la scomparsa del caricamento e altri 250 ms con lo stesso contatto premuto:

- export abilitato e caricamento nascosto;
- `preview-loading.hasPointerCapture(id) === true` e cattura sull’attore falsa;
- sei movimenti ancora diretti al livello nascosto, rettangolo dell’attore fermo, ghost nascosto;
- tutti i 25 terzi contatti reali di controllo hanno di nuovo prodotto uno spostamento confermato.

**Causa di questa classe di difetto:** barriera di anteprima + cattura implicita touch su un livello che scompare + nessun pointerdown all’attore. Non è la perdita della cattura dell’attore trattata dalla 3.3.1.

**Limite:** nei casi riprodotti il focus era BODY, senza focus-visible dell’attore; il quadrato blu non è stato riprodotto. Non è un deadlock che continui su nuovi contatti dopo il rilascio. Non spacciare il risultato per radice certa del caso Android/Arena.

A1 contiene gli stessi handler più DOM/listener passivi anche TouchEvent/letture e aggiornamenti diagnostici. Il controllo sullo stesso preset mostra che A1 non elimina strutturalmente la perdita di contatto. Il successo riferito dal telefono resta valido ma confondente; non prova una causa nell’outfit.

## Lettura e altri test completati

- **93 sorgenti/template/CSS, 16.661 righe fisiche**: 84 file first-party più 9 Go vendorizzati. Copie condivise/generate incluse.
- Altri 8 avvii/configurazioni/dipendenze, 71 righe; 6 file metadata/licenza/guida statica, 138 righe.
- Font rigenerato byte-identico: 33.884 byte WOFF, Casardi Pixel, 602 glifi. Verifica congiunta font/QR eseguita, non solo scritta.
- Tabelle QR indipendenti: 160 configurazioni versione/livello, 32 formati, 34 versioni, 40 allineamenti, 256 esponenziali e 256 logaritmi GF.
- **76 test Python PASS**; **26 test Go `-race -count=1 -mod=vendor` PASS**. Toolchain Go 1.27.4 verificata con SHA; nessun Windows nativo.
- HTML originale non strumentato: **288 spostamenti PASS**, iframe opaco semplice/annidato, quattro preset/tre taglie, nessuno sticker. Zero eccezioni JS/rete del figlio.
- Focus 72 e contatti 81 riusciti. I 36 contatti inizialmente chiamati «esterni» erano hit dell’attore, non prova di deselect sullo sfondo.
- Inviluppo geometrico Python e JS: **1.465.440 casi ciascuno PASS**, minimi intervalli 140,8 / 69,2 unità. Ipotesi mandatory body/head, native 64×64 e ancora da ritaglio; non prova dei tocchi o di ogni outfit fisico.
- Native edges: **96 tentativi = 72 spostamenti asseriti live/commit + 24 contatti preparatori**; 36 valori del range 65/100/135 verificati. PASS. Non retrodatare queste asserzioni ai vecchi test senza controllo del valore.

### Pixel durante il gesto: esito PARTIAL, non PASS globale

`compositor-gesture-results.json` resta **FAIL**; `compositor-adjudication.json` documenta il sottoinsieme:

- **72/72 verifiche visive headless concluse**: produzione/A1/Canvas × due stili × quattro stessi preset × tre gesti, compresa riselezione interna/esterna. Nessuno sticker/companion.
- Screenshot reali confrontati con riferimento statico agli spostamenti nuovo/vecchio usando gli stessi livelli del renderer; non un secondo renderer indipendente. Errore RGB medio verso la posizione corretta ≤2,441; verso quella ferma ≥68,60; almeno 96,69% dei pixel nella tolleranza dichiarata.
- Il ramo Chromium con finestra Xvfb/SwiftShader ha avuto un crash in preparazione dell’UI **prima di qualsiasi gesto**. Causa non stabilita; non è il freeze con pagina ancora attiva e non è una prova GPU Android.
- Anche il primo smoke route-fulfilled era terminato con un crash sul secondo documento; preservato. Lo smoke successivo via HTTP diretto/browser isolato ha concluso 6/6 verifiche. Non attribuire automaticamente i crash a OOM.

Tutti i test browser sono Linux/Chromium, non Android fisico o il contenitore Arena reale. Lettura/inventario e PASS non equivalgono a copertura dinamica completa o prova formale.

## Esperimento Canvas e difetto HTTP distinti

**Canvas è NON RELEASE.** Quattro file del laboratorio; evita PNG encode/decode nel preview e rende interattive le rifiniture dopo drag, conserva delta cumulativo e annulla risultati obsoleti. Renderer, asset, sprite, bridge e composizione export invariati.

Risultati: timing 0/36 persi; nuovo held-contact 0/8; embedding 288 PASS; race 36 controlli / 136 tentativi / 4 veri download HD identici a ricomposizione separata con lo stesso renderer; commit RGBA/DOM 288 PASS; 24 verifiche screenshot Canvas fra le 72 headless concluse; risorse 120 spostamenti PASS.

Contatore risorse corretto include Canvas del parser e JavaScript: area mantenuta foto 1.695.570 pixel, NES 801.840; dopo reset nessun Canvas osservato oltre 16 pixel. Non misura tutta la memoria nativa/immagini o i limiti Android. Prima misura incompleta e primo problema del test Export conservati.

Separato difetto HTTP in `web/static/app.js`: una vecchia decode che fallisce altera lo stato di una nuova richiesta. Dimostrato con errore iniettato; patch isolata verificata. Controller diverso dall’HTML standalone: **non è una spiegazione del caso Arena** e non è stato applicato.

## Prove durevoli e integrità

- Rapporto principale: `/home/user/Analisi_blocco_Android_Arena.md`.
- `audit_agente/prove_audit.zip`; checksum nel corrispondente `.sha256`.
- `audit_agente/README.md` e `ripristina_laboratorio.py` per riproducibilità/manutenzione dell’agente, **non per chiedere altro testing all’utente**.
- Archivio con raw + annotazioni, log PASS/FAIL/PARTIAL, script effettivi e adattamenti solo metadata, patch NON RELEASE, inventario e screenshot rappresentativi. Nessuna credenziale o copia di asset/HTML completo/browser/toolchain.
- Cache `.cache/casardi-rootcause` non durevole; il sorgente completo di riferimento rimane nello ZIP di produzione già presente.
- Server di QA su 8092 arrestato al termine. Nessun test pesante ancora in esecuzione. Non confondere l’host locale di prova con l’implementazione reale del viewer Arena.

Controllo finale eseguito dopo i test: **tutti i 717 file** dello ZIP confrontati in streaming byte per byte con l’estrazione, CRC PASS, **473 asset** invariati. Produzione invariata al commit `1b627eeb721826bf9b628753e81fa8c2b1088ad9`; nessuna pubblicazione.

SHA-256:

- HTML: `8b247a2cd86bd0485f352190590371e83150aa3feb99b2cb5c59fc517d9a09ea`.
- A1: `2806e32423451c4ef7eeb5d37260b645a5ba06a11dba14474c99c5e6447e8992`.
- ZIP: `9fb4a649948ded763cb3436d3b82b12f58f196f8429e65abbd8dfe18bdf5a12f`.
- Esperimento: `a01ca4759b499979e8a9b0591f6b4a007fb11654d874053e0444be3c7b33245e`.

Etichette statiche del 27 novembre e timestamp del laboratorio del 28 UTC sono conservati distintamente, senza riscrivere la data della conversazione o fingere nuove esecuzioni. Nessuna ridatazione delle prove storiche della release.

**La richiesta di arrivare alla causa esatta del caso fisico non è ancora soddisfatta. Non dichiarare risolto il problema né chiedere la convalida all’utente.**
