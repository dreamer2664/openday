# CHANGELOG — OPERAZIONE EIPASS: IL CASARDI IN 8 BIT

## v3.0.6 — Ranaldo dalle foto, Carlo #35 OKC, Francesco in abito (26/11/2026)

**Prof. Ranaldo (2 foto reali)**
- Capelli **grigio argento scompigliati** con ciuffi alti e irregolari (prima erano antracite: sembrava
  molto più giovane di com'è).
- **Barba corta brizzolata** su guance e mento (barba di tre giorni), non più un filo di baffi.
- **Occhi azzurri** e sopracciglia grigie folte nei ritratti.

**Carlo**
- Maglia diventata la **canotta bianca degli Oklahoma City Thunder #35 di Kevin Durant (2013-14)**:
  spalline blu OKC, filetto arancio sul giromanica, colletto blu e **numero 35 in blu** sul petto
  (leggibile sia nello sprite 32×36 sia nel ritratto 64×64).
- Etichetta HUD aggiornata: `CARLO (Basket #35 OKC)`.

**Francesco**
- **Frangia abbassata di una riga**: ora copre la fronte come nella foto al pianoforte.
- Frangia resa **leggibile** con ciocche chiare e ombre (prima era un blocco scuro indistinto).
- Capelli tornati **castano scuro naturale** (niente più tonalità lilla); resta il **blazer nero da concerto**
  su camicia nera, che è l'abito classico della foto.

## v3.0.5 — Daniele e Francesco come nella vita reale (26/11/2026)

Dalle **foto reali** caricate: i tre ragazzi erano «praticamente uguali, solo colori diversi». Ora
hanno silhouette, taglio di capelli e abiti riconoscibili.

**Daniele** (2 foto al sole + ritratto in studio)
- **Taglio corto con fade ai lati** (tempie chiare quasi rasate) e ciuffo corto pettinato in avanti.
- **Occhiali sottili ovali con lente ambrata**, disegnati sia nei ritratti 64×64 sia sullo sprite 32×36.
- **Giacca avorio con revers ampi** su t-shirt bianca, spilla dorata, pantaloni chiari, scarpe chiare.
- Palette HUD spostata su **oro/ambra** (era magenta) con cornice ritratto avorio.

**Francesco** (foto al pianoforte)
- **Blazer nero da concerto** su camicia nera al posto del cardigan smeraldo, colletto chiaro per staccare a 1x.
- **Chioma molto voluminosa e mossa con frangia folta** sulla fronte (prima era un caschetto simile agli altri).
- Tinta HUD spostata su un **ciano più brillante** per leggersi sopra l'abito scuro.

**Tutti e cinque** restano distinti a colpo d'occhio: Carlo (occhiali spessi + baffetto + canotta #23),
Ranaldo (sale-e-pepe + cravatta ocra + compasso), Daniele (fade + occhiali sottili + giacca avorio),
Ruggero (fascia sportiva + pettorale di gara), Francesco (frangia folta + blazer nero).

## v3.0.4 — Personaggi rifiniti e facciata ricostruita dalle foto (26/11/2026)

**Personaggi (sprite 32x36 e ritratti 64x64 rigenerati)**
- **Daniele**: rimosso il residuo "strumento diagnostico di rete" (era rimasto dall'era pre-ballo).
  Ora porta **due note musicali dorate e rosa** che salgono a tempo e uno scintillio del passo di salsa.
- **Volti più leggibili a 1x**: sopracciglia disegnate per ogni eroe (la montatura nera di Carlo le
  sostituisce, come nella foto reale), guance con un tocco di rossore, **luce speculare sul ciuffo**
  per dare volume ai capelli.
- **Carlo**: baffetto più fedele alla fotografia (folto al centro, assottigliato ai lati), mento pulito.
- Tutti gli altri (Ranaldo, Ruggero, Francesco, Sofia, Mimmo) mantengono identità, palette e proporzioni.

**Facciata della scuola — ricostruita sulle fotografie reali**
- Avancorpo in **travertino con paramento a lastre** e **due colonne cilindriche** che nascono sopra la
  copertura con i blocchi scultorei, esattamente come negli scatti.
- **Loggia superiore incassata** con vetrata a due ante, parapetto in pietra e **bandiere Tricolore + Europa**.
- **Portale monumentale a due ante in legno scuro** con vetrate, specchiature, maniglie in ottone e
  **targa marmorea "LICEO CLASSICO / A. CASARDI / BARLETTA"** centrata e leggibile.
- **Gradini d'ingresso** a due alzate, **targhe PON/FESR blu-giallo-verde** ai lati del portale,
  **bacheca scolastica** in legno, **balconcini con ringhiera** sotto le finestre del primo piano.
- Cielo a sei fasce con sole e alone, **pini marittimi a strati** e **ramo in primo piano** per la profondità.

**Corridoi (palette e dettagli)**
- Al posto dei quadri anonimi: **nicchie con busti classici in marmo** (è un liceo classico).
- **Termosifoni a parete** con ombra di appoggio, **con spifferi di luce** delle plafoniere sul pavimento.

## v3.0.3 — Squadra al seguito: opzione (26/11/2026)

- Nuova opzione **SQUADRA AL SEGUITO: SI/NO**, scelta **nel menu iniziale** (terza voce), ripetibile
  **in pausa** e al volo con il tasto **`G`**. Viene salvata insieme alle preferenze audio.
- **Default: NO.** I compagni non pedinano più il giocatore: ognuno si aggira intorno al proprio punto
  (mai addosso, distanza minima ~25-90 px) e si sposta solo allontanandosi.
- Con l'opzione **SI** i compagni restano accanto al giocatore ma a **distanza di rispetto** (70-160 px),
  alternati a destra e sinistra: niente più fila indiana incollata alle spalle.
- Rimosso l'inseguimento "a catena" (era la causa del fastidio segnalato).
- I compagni restano dentro i bordi della stanza e continuano a funzionare come punti di cambio eroe
  (`[E]` vicino / click).
- Guida comandi: nuova voce `G` (12 voci, tutte con tasto).

## v3.0.2 — Comandi PC: cambio eroe e tasti mancanti (26/11/2026)

**Cambio personaggio in modalità PC (segnalazione principale)**
- Nuovo `switchActiveChar(charId)` con effetto in campo (squash, particelle, motivo dell'eroe e nota
  flottante `"<SIGLA> IN CAMPO!"`), usato da **tutti** i canali: tasti `1`-`5`, `Q`/`TAB`, **click sulle
  pillole dell'HUD** e **click/tap sul compagno** in scena.
- I compagni sbloccati ora **esistono davvero sullo schermo**: `WorldRuntime.syncCompanions()` /
  `updateCompanions()` li fanno seguire il giocatore a catena, `drawCompanions()` li disegna con sigla e
  **aura dorata** quando sono a portata. Prima il cambio era invisibile: si premeva `3` e non succedeva nulla.
- Accanto a un compagno compare il prompt `[E] Cambia con <SIGLA>` e `E` lo porta in campo.
- Slot **fissi**: `1=Carlo`, `2=Ranaldo`, poi gli eroi acquisiti. Con pochi eroi sbloccati un tasto
  "vuoto" ora mostra `<NOME> NON ANCORA IN SQUADRA` + suono invece di non fare nulla (e non crasha più).
- **Sinergia di squadra**: ogni compagno sbloccato dà bonus passivi reali (+10 HP massimi per membro,
  Daniele +0.15 al salto, Ruggero +8% danno, Francesco +5% velocità) — cambiare personaggio conta.

**Comandi senza tasto (seconda segnalazione)**
- Nella guida comandi `SX`/`DX` e `SU`/`GIU` ora regolano davvero musica ed effetti (prima il mixer era
  indicato ma inerte in pausa).
- Nuovi tasti globali: **`F1` / `?`** apre e chiude la guida comandi da qualunque schermata (e dalla partita
  si torna a giocare subito), **`Y`** attiva lo schermo intero.
- `CONTROLS_HELP` riscritta: **11 voci**, ognuna con tasto visibile e descrizione entro il pannello
  (`E (vicino)`, `F1 | ?`, `Y` inclusi). Nessun comando elencato senza tasto funzionante.
- Fix crash: con 2 soli eroi sbloccati il tasto `4`/`5` leggeva un elemento `undefined` di `CHAR_ORDER`.
- `src/main.js` è ora importabile in Node (guardia su `window`): la regressione può testare l'app vera.

## v3.0.1 — Fase G: correzione di 31 errori segnalati (26/11/2026)

**Logica e input**
- Touch: rimosso l'override forzato. `manualTouchOverride` vive solo nel runtime, il rilevamento usa
  `(pointer: coarse)` in live query e il resize non lo rifà più. La barra kiosk resta raggiungibile e in
  modalità touch compare il pulsante **⌨ TASTI** per tornare alla tastiera.
- `focusCanvas()` ora funziona: il canvas ha `tabindex="0"` e ogni click su un pulsante HTML riporta il focus.
- **SU/W non sono più salto**: restano direzione/mira/vertice/nota. Il salto è su SPAZIO, Z e tasto A.
- Jump-cut applicato **una sola volta per salto** (`jumpCutDone`): molle e rimbalzi non si azzerano più.
- `advanceRhythmGate` apre **solo i varchi `rh_`**: quiz, minigiochi e mid-boss restano vincolati alla prova.
- Quiz: il varco si apre **solo con la risposta corretta**; `clearedTerminals` non registra più gli errori e il
  pannello si chiude da solo dopo il feedback.
- `spawn_guard_drone`: lo spambot nasce **appoggiato al suolo** (`findGroundY`).
- Pareti incrinate: minimo **5 tile (80px)**, sopra il salto massimo (~70px) — niente più scavalchi senza Ruggero.

**Minigiochi**
- Pianoforte: qualsiasi `sequence` (4, 5 o 6 note) viene suonata; `subtitle` mostrato; **RIASCOLTA** in alto a
  destra nella stessa zona tocco; **tasti neri toccabili** e giocabili con **T Y U I O** (nessun conflitto WASD).
- Parabola: scala della curva ricalibrata (nodi sempre in griglia) e zone tocco allineate ai pulsanti disegnati.
- Danza: il tocco esegue **la mossa toccata**; `comboResults` azzerato ad ogni giro; nessun crash dopo l'ultimo giro.

**Audio e timing**
- `NOTE_HZ`: aggiunte `C#6` (boss) e `G#2` (biblioteca) più le ottave mancanti: nessuna nota muta.
- `tick`, banner e TTL delle notifiche avanzano **solo nello step fisso 60 Hz** (`stepHUD` / `stepAnimation`).

**Grafica e testi**
- Titolo: 5 sprite dentro la pedana (178px) con sigle CAR RAN DAN RUG FRA allineate; marquee con Daniele.
- Finale: 5 sprite nella colonna sinistra, mai sotto il riquadro statistiche.
- Tasti eroe ricalcolati da `CHAR_ORDER` (`localizeHeroKeys`): Ruggero [4], Francesco [5]. Rimossi “Tiro Teso” e i
  riferimenti a “4 protagonisti”.
- Font: aggiunti `— – … ^ ² ° € ▼ ▲ → ← ↑ ↓ ×` e le maiuscole accentate `Á Í Ó Ú`; il fallback non stampa più “?”
  sulle lettere accentate.
- Nessun `.slice()` sui testi: scelte, comandi, titoli quiz, pagine Pegaso e messaggi usano `fitPixelText`.
- Fix refuso “GERARCHica”.
- Narrazione: nessun eroe parla prima del proprio incontro (`od_meet_francesco`, `c2_corridoio_ruggero`).

**Verifiche**: playtest 511/511 · mobile 30/30 · testi 333/333 · regressione errori 137/137 · screenshot 7/7 ·
minigiochi 6/6 · 0 errori JS nel browser.


## v3.0 — "Notturno" (in corso)

### Nuovo protagonista e ribaltamento dei punti forti
- **Daniele** entra stabilmente nella squadra come **ballerino latino-americano** (Salsa cubana, Bachata, Cha-Cha-Chá).
  - Abilità **Passo di Salsa**: onda ritmica che dissolve i proiettili corrotti, stordisce i nemici e apre il varco ritmico più vicino.
  - Minigioco dedicato **Esibizione Latino-Americana**: 3 coreografie progressive, fase "osserva" → "ripeti a tempo", barra del tempo, gradimento del pubblico.
- **Ruggero non è più il calciatore**: è **velocista/ostacolista**. Nuova abilità **Scatto Ostacoli** (dash fisico che sfonda le barriere incrinate), nuovo minigioco **Atletica 110m/135m ostacoli** con partenza dai blocchi, ritmo di corsa, stacco ostacoli e cronometro al centesimo.
- Rimossi tutti i riferimenti al calcio da dialoghi, livelli, motore, renderer e test.

### HUD, mobile e accessibilità
- HUD a **5 slot eroi** compatti, striscia eroi mobile a 5 pillole, selezione con `1-5` / `Q`.
- Console touch riordinata e dimensionata per schermi da **360px** in su; barra utility compattata sotto i 400px.
- Layout verificati con screenshot reali a 360×800, 390×844, 412×915, 844×390, 768×1024, 1366×768, 1920×1080.

### Storia e dialoghi
- Incontri con Daniele (`od_meet_daniele`, `c2_meet_daniele`) riscritti sul tema ritmo/musica/festa d'istituto.
- Tono controllato e verosimile, zero esclamazioni caricaturali.

### Qualità
- Playtest automatico: **511/511** test superati.
- Suite mobile/multi-touch: **30/30** test superati.
- Nuovo audit visivo multi-risoluzione con Chromium headless e report JSON.

### Build
- `AVVIA_GIOCO_PC_V3.html` — versione PC / postazione Open Day.
- `AVVIA_GIOCO_MOBILE_V3.html` — versione telefono/tablet con comandi touch attivi dal primo istante.
- Entrambe 100% offline, avviabili con doppio clic anche da `file://`.

## v2.0 — Versione Open Day
- Modalità Open Day (4 zone) + Campagna completa a 6 capitoli e 18 livelli.
- 12 postazioni EIPASS contestuali, archivio Pegaso, 4 finali.
- Comandi touch multi-touch, D-Pad continuo con diagonali, supporto gamepad.
