# CHANGELOG — OPERAZIONE EIPASS: IL CASARDI IN 8 BIT

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
