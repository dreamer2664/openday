## Fase O — Somiglianza Ranaldo e canotta Carlo (v3.0.7, 26/11/2026)

**Feedback:** «Ranaldo non è per niente uguale, Carlo non ha il numero sulla canotta, a questo punto fai
semplicemente una canotta da basket colorata, senza numero, con vari colori.»

**Ranaldo (ritratto 64×64 e sprite 32×36)**
- Capelli: base grigio acciaio + calotta chiara + **punte irregolari** verso l'alto (6 ciuffi di altezza
  diversa) con ombre di separazione: niente effetto casco.
- Barba: percorsi anatomici (basettoni → guance → mascella → mento) in grigio chiaro, baffi sopra la bocca
  visibile, texture brizzolata.
- Sopracciglia scure (nelle foto sono molto più scure dei capelli), iride azzurra.
- Abito: **maglietta blu navy** piena, girocollo scuro, piega di luce — via giacca e cravatta.

**Carlo**
- Rimossi numero e riferimenti OKC. Canotta: petto arancio, spalline/bordi blu royal, filetto bianco,
  colletto blu, luci e ombre sul tessuto.

**Verifica:** playtest 511 · testi 341 · regressione 178 · mobile 30 · 0 errori JS.

## Fase N — Ranaldo, Carlo #35 OKC e Francesco (v3.0.6, 26/11/2026)

**Richieste:** «La frangia di Francesco un po' più bassa» · «due foto del prof. Ranaldo» ·
«Carlo fallo con la canotta di Kevin Durant nel 2013-14 (OKC numero 35)» · «Francesco molto elegante,
come nella foto: classico abito».

**Interventi (`tools/generate_assets.py` + testi)**
- Ranaldo: palette capelli `#4a5260 / #79828f / #b6bdc7`, capigliatura 32×36 e 64×64 riscritte con ciuffi
  alti scompigliati, barba brizzolata su guance+mento, iride azzurra, sopracciglia grigie.
- Carlo: palette canotta bianca con `sub` blu OKC e `acc` arancio; numero 35 disegnato a mano in due
  blocchi (sprite 3×4 px, ritratto 11×9 px) con bordi giromanica e colletto.
- Francesco: frangia estesa di una riga (sprite e ritratto), inserite ciocche chiare per non perdere
  dettaglio, capelli castano scuro `#141018 / #2a2320 / #453a33`.
- Testi: `hudAndMenus.js` (CARLO Basket #35 OKC), `constants.js` (passion), etichette della tavola.

**Verifica:** playtest 511 · testi 341 · regressione 178 · mobile 30 · screenshot 7/7 · minigiochi 6/6 · 0 errori JS.

## Fase M — Daniele e Francesco dalle foto (v3.0.5, 26/11/2026)

**Richiesta:** «Ho caricato 2 foto di Daniele e una di Francesco per renderli più come la loro versione
nella vita reale, visto che ora sono praticamente 3 personaggi uguali solo colori diversi.»

**Analisi delle foto**
- Daniele: taglio corto con fade netto ai lati, ciuffo pettinato avanti, occhiali sottili con lente scura
  ambrata, giacca avorio con revers ampi, t-shirt bianca, pantaloni chiari, postura rilassata.
- Francesco: capelli mossi molto voluminosi con frangia folta, blazer nero su camicia nera, al pianoforte.

**Interventi su `tools/generate_assets.py`** (nessuna modifica al runtime)
- Nuove palette `daniele` (avorio/oro) e `francesco` (nero/carbonio).
- Capigliatura 32×36 riscritta per entrambi: fade per Daniele, frangia folta per Francesco.
- Occhiali di Daniele disegnati su sprite (3 righe) e su ritratto (montatura fine + lente ambrata).
- Abiti ridisegnati: giacca avorio con revers e spilla; blazer nero con colletto chiaro.
- `constants.js`: tinte HUD (Daniele oro `#e0b25c`, Francesco ciano `#5eead4`) e cornice ritratto avorio.

**Verifica:** playtest 511 · testi 341 · regressione 178 · mobile 30 · screenshot 7/7 · minigiochi 6/6 · 0 errori JS.

## Fase L — Personaggi e facciata dalle foto (v3.0.4, 26/11/2026)

**Richiesta:** «Concentrati sui personaggi molto, puoi migliorarli molto. Poi vedi le foto della scuola e
migliora i dettagli nel gioco.»

**Metodo:** rigenerazione degli sprite con `tools/generate_assets.py` (nessun refactor del runtime) e
riscrittura del solo blocco `theme === "facade"` in `renderer.js`.

**Personaggi**
- Daniele: rimossa l'icona "strumento di rete" (residuo pre-v3) → coppia di note musicali oro/rosa.
- Aggiunte sopracciglia, guance e luce speculare sui capelli: il volto si legge a risoluzione nativa.
- Carlo: baffetto ricalibrato sulla foto reale (folto al centro, sottile ai lati).

**Facciata (dalle 2 foto dell'ingresso)**
- Travertino a lastre, due colonne cilindriche oltre il tetto con blocchi scultorei.
- Loggia incassata con vetrata e bandiere IT/UE sul parapetto.
- Portale in legno a due ante con targa marmorea su 3 righe, gradini, targhe PON, bacheca, balconcini.
- Cielo a fasce, sole, pini stratificati e ramo in primo piano.

**Corridoi**
- Busti classici in marmo nelle nicchie al posto dei quadri anonimi, termosifoni a parete, coni di luce.

**Verifica:** playtest 511 · testi 341 · regressione 178 · mobile 30 · screenshot 7/7 · 0 errori JS.

## Fase I — Squadra al seguito (v3.0.3, 26/11/2026)

**Richiesta:** «È fastidioso che i personaggi ti seguono ovunque vai. Aggiungi un toggle all'inizio del gioco
per scegliere se tenere o no questa funzione, e comunque se la tieni i personaggi ti stanno a una distanza
per i fatti propri, non ti seguono.»

**Intervento (chirurgico: 4 file, nessun refactor)**
- `world.js`: `updateCompanions()` riscritto in due rami. Opzione **off** → ogni compagno ha un `homeX` e si
  aggira intorno al suo punto (mai verso il giocatore). Opzione **on** → resta accanto a 70-160 px alternati
  destra/sinistra. Rimosso l'inseguimento a catena. `clampCompanionX()` evita che finiscano fuori schermo.
- `gameState.js`: `audioPrefs.followTeam` (default `false`) salvato con le altre preferenze.
- `main.js`: voce `team_follow` nel menu iniziale e in pausa, tasto **`G`** ovunque, `toggleTeamFollow()`.
- `input.js` + `constants.js`: `teamTogglePressed` e voce `G` nella guida comandi (12 voci).
- Test: nuovo blocco 14g in `qa_bugfix_regression.mjs` (9 controlli su toggle e distanze minime).

**Verifica:** playtest 511 · mobile 30 · testi 341 · regressione 178 · 0 errori JS.

## Fase H — Comandi PC (v3.0.2, 26/11/2026)

**Sintomo riferito dall'utente:** «Nella modalità PC alcuni comandi non funzionano, come cambiare i
personaggi, e dei comandi non hanno tasti assegnati».

**Diagnosi (Playwright su `AVVIA_GIOCO_PC_V3.html`)**
1. In Open Day `unlockedChars = [carlo, ranaldo]`, quindi `3`/`4`/`5` non facevano nulla e sembravano rotti
   (nessun messaggio, nessun suono).
2. Il cambio eroe era **invisibile**: nessun compagno veniva disegnato in scena, l'eroe cambiava solo nei dati.
3. Nella guida comandi aperta dalla pausa, `SU`/`GIU` e `SX`/`DX` non regolavano i volumi (la logica esisteva
   solo nel modal sui titoli).
4. Alcune voci elencate non avevano un tasto corrispondente (schermo intero) e `?` non era mappato.

**Interventi**
- `switchActiveChar()` unico punto di cambio eroe + `checkCompanionSwitch()` ([E], raggio 46 px).
- Compagni visibili: `syncCompanions()`, `updateCompanions()` (catena con lerp), `drawCompanions()` con aura.
- Click su pillole HUD (`94 + idx*45`) e click sui compagni in scena.
- Slot fissi `1=Carlo 2=Ranaldo`, fallback `CHAR_ORDER` e guardia anti-crash sui tasti vuoti.
- Mixer attivo nella guida; nuovi tasti `F1`/`?` (guida) e `Y` (fullscreen); `CONTROLS_HELP` a 11 voci.
- Sinergia di squadra con bonus passivi (HP, salto, danno, velocità) applicati a `WorldRuntime`.
- `src/main.js` importabile da Node; nuovo blocco 14 in `tools/qa_bugfix_regression.mjs` (32 controlli).

**Verifica:** 511 playtest · 30 mobile · 339 testi · 169 regressione · 7 screenshot · 0 errori JS
su `file://` (PC) con tasti, click HUD, click compagno, `[E]`, `F1`, `Y` e 40 input casuali.

# DEVLOG.md — Registro di Sviluppo e Rifinitura Notturna (Verso v3.0)

## Fase A — Backup Immutabile e Audit Tecnico dell'Esistente
- **Backup creato:** salvata copia integrale pre-v3.0 in `backups_pre_v3/` (`AVVIA_GIOCO.html`, `index.html`, intera cartella `src/`).
- **Mappatura architetturale verificata (`15` moduli ES6):**
  - `src/config/constants.js` (costanti fisiche, roster personaggi, moduli EIPASS, archivio Pegaso, guida tasti).
  - `src/state/gameState.js` (stato partita, salvataggio `localStorage`, fiducia, competenze EIPASS, calcolo finali).
  - `src/assets/embeddedSprites.js` + `tools/generate_assets.py` (atlanti PNG codificati in base64 per funzionamento 100% offline).
  - `src/audio/chiptuneEngine.js` (sintetizzatore Web Audio con lookahead scheduler e 7 tracce).
  - `src/config/input.js` (tastiera, gamepad HTML5, azioni virtuali touch).
  - `src/render/pixelFont.js` (font bitmap `5×7` pixel-perfect con supporto accenti italiani).
  - `src/narrative/dialogues.js` & `src/narrative/eipassQuiz.js` (dialoghi ramificati e postazioni EIPASS).
  - `src/minigames/specialChallenges.js` (6 minigiochi attuali).
  - `src/levels/levelBuilder.js` & `src/levels/levelsData.js` (costruttore stanze, sotto-stanze, 4 zone Open Day + 18 livelli Campagna).
  - `src/engine/world.js` (fisica platform 60Hz, collisioni, nemici, Mid-Boss, Boss Finale).
  - `src/render/renderer.js` & `src/ui/hudAndMenus.js` & `src/main.js` (rendering, HUD, menu, ciclo principale).
- **Criticità individuate nell'audit tecnico e narrativo:**
  1. **Assenza totale di Daniele:** il roster comprende solo 4 personaggi (`ranaldo`, `carlo`, `francesco`, `ruggero`); manca completamente `daniele` in sprite, ritratti, fisica, dialoghi, sfide, boss fight e finali.
  2. **Tono dei dialoghi eccessivamente enfatico/artificiale:** presenti esclamazioni caricaturali (*"Salvete, mortali analogici!"*, *"buco lo scudo firewall da centrocampo"*, battute forzate su Saffo in binario o metafore informatiche in ogni frase).
  3. **Ambienti interni poco aderenti alle foto reali del Casardi:** il Laboratorio attuale appare come una sala server cyberpunk blu notte anziché il vero laboratorio luminoso con banchi modulari blu e pannelli grigi (`CAS-0062`); l'Aula Magna attuale usa velluti teatrali scuri invece della vera sala luminosa curva con grandi vetrate, vetrine grigio-salvia, leggii e pianoforte a coda (`CAS-0074`).
  4. **Imprecisioni didattiche e storiche:** nello *Smistatore File* la sicurezza dipende solo dall'estensione (`.pdf` = sicuro vs `.exe` = malware), scorciatoia didatticamente scorretta; nei testi Pegaso e dialoghi compaiono sigle di classi specifiche, una graduatoria non datata e una parziale sovrapposizione tra Open Day e Notte Nazionale del Classico.
  5. **Boss Fight Finale:** attualmente basata solo sul salto platform sul palco; manca una vera fase dedicata di schivata geometrica in arena delimitata (*bullet-dodge* leggibile e imparabile a 3 fasi) in cui ciascuno dei 5 membri del gruppo offra un intervento strategico contestuale.
  6. **Minigiochi Pianoforte e Calcio migliorabili:** il pianoforte mostra solo tasti astratti senza durata ritmica né progressione in 3 frasi; il calcio ha un rettangolo rosso (`FW-BOT`) al posto di un vero portiere animato in tuffo e manca di traiettoria curva/tipi di tiro/feedback chiaro per palo, parata o traversa.
  7. **Interfaccia Mobile troppo carica di pulsanti:** erano visibili contemporaneamente una barra superiore a 5 tasti, una striscia fissa di 4 eroi, il D-Pad e una griglia di 4 tasti azione (14 elementi!). Va ridotta drasticamente secondo la regola vincolante §9: solo **D-Pad**, **Salta**, **1 pulsante contestuale intelligente** e **controllo compatto Pausa / Selettore a comparsa**.

## Fase B — Ricerca Ufficiale sulla Scuola (`SCHOOL_RESEARCH.md`)
- Consultate le pagine ufficiali `liceocasardi.edu.it/luogo/`, `sede-casardi`, `sede-succursale-via-botticelli`, `via-santo-stefano`, il documento di Monitoraggio PTOF e le fotografie verificate della Sede Centrale (`CAS-0044`, `CAS-0052`, `CAS-0062`, `CAS-0074`).
- Redatto `SCHOOL_RESEARCH.md` con tutte le fonti, i tre plessi ufficiali, la cronologia distinta (Palazzo Della Marra → progetto/delibera 1930–1932 ing. Boccassini → inaugurazione 1937 → intitolazione postbellica ad Alfredo Casardi) e l'elenco delle correzioni applicate.

## Fase F-bis — Correzione Narrativa/Gameplay: Ruggero Atletica e Daniele Ballerino
- **Ruggero non è più "il calciatore":** rimosso ogni riferimento al calcio da abilità, dialoghi, sfide, livelli, renderer e QA. Ora è **velocista/ostacolista (Atletica Leggera)**.
  - Abilità **`Scatto Ostacoli`** in `world.js`: dash fisico in avanti (`dashing`, `dashTimer`) con invulnerabilità breve, salto conservato durante lo scatto e **sfondamento delle barriere incrinate** anche in corsa (`resolveHorizontalCollisions` + `shatterCrackedCluster`).
  - Proiettile `football` eliminato dal motore, dal renderer e dai livelli.
- **Daniele è il ballerino latino-americano** (nuovo punto forte richiesto):
  - `constants.js`: ruolo *Ballerino Latino-Americano*, passione *Salsa, Bachata & Cha-Cha-Chá*, abilità **`Passo di Salsa`** (colore magenta `#f472b6`).
  - Abilità in `world.js`: onda ritmica `salsa_wave` che neutralizza proiettili corrotti, stordisce i nemici e **apre il varco ritmico più vicino** (`advanceRhythmGate`).
  - Minigioco dedicato **`dance`** (sostituisce la vecchia diagnostica di rete): 3 coreografie progressive — *Salsa Cubana*, *Bachata*, *Cha-Cha-Chá* — con fase "osserva i passi" → "ripeti a tempo" (SU/GIU/SX/DX + SALTA = Giro + ABILITÀ = Battito), barra del tempo, gradimento del pubblico e valutazione per battuta.
  - Storia e dialoghi riscritti: `od_meet_daniele` e `c2_meet_daniele` ora ruotano su festa d'istituto, cassa sfasata, cicalino-metronomo e "tengo io il tempo, tengo anche il varco". Aggiornati anche 7 battute di raccordo di Daniele negli altri capitoli.
  - Sprite e ritratti rigenerati: camicia corallo/magenta aperta su canotta bianca, fazzoletto oro, pantaloni neri e scarpe da salsa; tema ritratto magenta.
- **Audio:** nuove SFX `salsa_step` (conga + clave sintetica) e `clave`; l'abilità di Daniele usa `resonance`, il minigioco `salsa_step`/`clave`.
- **HUD a 5 eroi:** `slotOrder` a 5 slot compatti (`RAN, CAR, DAN, RUG, FRA`) in HUD e tap touch; striscia eroi mobile a 5 pillole; tasti `1-5`/`Q`.
- **Livelli:** postazioni `athletics` in OD-2 e Cap. 3; postazioni `dance` in OD-3 e Cap. 2 con relativi varchi; incontri con Daniele cablati come `dialogueTrigger`.
- **QA:** aggiornate le suite. Ora **511/511** playtest e **30/30** touch; nuovo `tools/qa_screenshots.py` (7 risoluzioni reali, Chromium headless) e `tools/qa_minigame_shots.py` (schermate di danza, atletica, abilità, dialogo).
- **Build v3.0:** `AVVIA_GIOCO_PC_V3.html` e `AVVIA_GIOCO_MOBILE_V3.html` (419 KB ciascuna, offline, doppio clic).

## Fase G — Correzione errori (v3.0.1, 26/11/2026)

Il giro di correzioni è partito da una lista di 31 difetti segnalati dall'utente, non da un audit interno.
Per ognuno è stato scritto un test di regressione (`tools/qa_bugfix_regression.mjs`, 137 controlli): se il
bug ricompare, la suite diventa rossa.

**Scelte di design**
1. **Un solo significato per ogni tasto.** SU/W erano insieme direzione e salto: nei minigiochi un solo
   tocco lanciava anche “Verifica”. Ora il salto è solo SPAZIO/Z/A e SU resta direzione pura.
2. **I varchi raccontano una prova.** La danza di Daniele apriva qualsiasi porta (quiz, minigiochi, boss).
   Ora solo i varchi `rh_` sono ritmici: il resto richiede la sua sfida. E un quiz sbagliato non apre nulla.
3. **Le pareti incrinate devono fermare chi non è Ruggero.** Il salto più alto misura ~70px: il muro minimo
   è passato da 48px (scavalcabile) a 80px (5 tile), appoggiato al pavimento.
4. **Il tempo di gioco vive nel passo fisso.** `tick`, banner e notifiche si sono spostati da `render()` a
   `stepSimulation()`: su schermi a 120/144 Hz non c'è più il doppio della velocità.
5. **Nessun testo tagliato.** Eliminati i `.slice()` a lunghezza fissa: si misura il pannello reale
   (`fitPixelText`, `wrapPixelText`) e si adattano le stringhe. Le pagine Pegaso sono state riscritte per
   entrare intere in 5 righe.
6. **I cartelli non possono più sbagliare tasto.** `localizeHeroKeys()` ricalcola l'indice dalla
   `CHAR_ORDER`: Ruggero è [4] e Francesco [5] per costruzione, non per correzione manuale.

**Verifiche finali**: playtest 511/511 · mobile 30/30 · testi 333/333 · regressione 137/137 · screenshot 7/7 ·
minigiochi 6/6 · 0 errori JavaScript in Chromium.
