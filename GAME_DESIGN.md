# GAME DESIGN DOCUMENT — OPERAZIONE EIPASS: IL CASARDI IN 8 BIT

**Titolo completo:** *Operazione EIPASS — Il Casardi in 8 Bit*  
**Sottotitolo narrativo:** *L'Assedio del Sofista Digitale*  
**Genere:** Action-Platformer 8-Bit di precisione + Avventura Narrativa a Scelte con Minigiochi Arcade Tematici  
**Ambientazione:** Liceo Classico, delle Scienze Umane e Musicale Statale *"Alfredo Casardi"* — Sede Centrale di Via Ferdinando I d'Aragona, 100, Barletta  

---

## 1. Concept e Premessa Narrativa

È il pomeriggio che precede il grande **Open Day** del Liceo Casardi. Nella Sede Centrale di Via Ferdinando I d'Aragona 100 tutto è quasi pronto: le LIM brillano, i 23 PC del Laboratorio Multimediale stanno sincronizzando i progetti degli studenti e in Aula Magna il pianoforte a coda nero è appena stato accordato.

Mentre il **Prof. Ranaldo** e i tre studenti **Carlo**, **Francesco** e **Ruggero** caricano sul server scolastico il pacchetto conclusivo del percorso **EIPASS**, una postazione rimasta incustodita esegue un file trappola camuffato da circolare urgente (`"Circolare_Premio_OpenDay_ allegato.pdf.exe"`).  
Dalla rete locale prende forma **IL SOFISTA DIGITALE (ERRORE 404-Ω)**: un'anomalia informatica teatrale, retorica e dispettosa che detesta il rigore matematico e la competenza digitale. Il Sofista sigilla elettronicamente l'edificio, disperde le **7 competenze EIPASS** (una per modulo) nei luoghi simbolo della Sede Centrale e minaccia di mandare in onda durante l'Open Day presentazioni sabotate, cataloghi della Biblioteca mescolati e allarmi impazziti.

**Obiettivo immediato:** Entrare dalle due grandi colonne bianche di Via d'Aragona, alternare in tempo reale i cinque protagonisti sfruttando le loro abilità uniche (Matematica, Basket, Informatica, Calcio, Pianoforte) e le competenze EIPASS, neutralizzare le 7 competenze corrotte e sconfiggere il Sofista Digitale sul palco dell'Aula Magna prima dell'arrivo dei visitatori!

---

## 2. Direzione Artistica e Specifiche Tecniche Pixel Art

- **Risoluzione nativa interna:** `480 × 270` pixel (16:9 widescreen retro, moltiplicatore intero perfetto `×2` = 960×540, `×3` = 1440×810, `×4` = 1920×1080).
- **Rendering:** Pixel-perfect rigoroso (`imageSmoothingEnabled = false`, `image-rendering: pixelated`), zero sfocature, allineamento intero dei pixel (`Math.round`) su telecamera, sprite e font.
- **Griglia ambientale:** Tile `16 × 16` px.
- **Dimensione sprite personaggi (v2.0):** Griglia `32 × 36` px con **13 pose animate** per ciascun personaggio (`idle 4 frame` con palleggio/nota/compasso animati, `corsa 4 frame`, `salto`, `caduta`, `azione speciale`, `vittoria`, `danno`) + **Squash & Stretch**, particelle di polvere e **Assist di Squadra `[C]`**; include anche gli NPC **Sofia** (Caporedattrice di *Pegaso*) e **Mimmo** (Collaboratore scolastico storico).
- **Tipografia Bitmap Pixel-Perfect (`src/render/pixelFont.js`):** Motore tipografico bitmap `5×7` custom con set completo di accenti italiani (`à è é ì ò ù À È É Ì Ò Ù`) e simboli musicali/greci (`♪`, `Ω`, `★`) per garantire nitidezza 100% identica su qualsiasi sistema operativo senza sfocature.
- **Ritratti dialogo (v2.0):** `64 × 64` px nativi con **6 espressioni facciali distinte** (`neutro`, `sorridente`, `sorpreso`, `concentrato`, `determinato`, `occhiolino`) per tutti i 7 interlocutori (**Prof. Ranaldo, Carlo, Francesco, Ruggero, Il Sofista Digitale 404-Ω, Sofia, Mimmo**) + **Notifiche Stile Telltale** (*"★ Sofia si ricorderà di questo!"*) e **Banter di Squadra in tempo reale** durante l'esplorazione.
- **Tileset Scolpito `16 × 16` (`tileset_casardi.png`), Sotto-Aule Esplorabili, 5 Nemici e 2 Mid-Boss:** Include porte interattive `[E]` per entrare nell'*Aula 7 (5C)*, nella *Guardiola Storica* e nella *Redazione di Pegaso*, 5 archetipi nemici (`Spam-Bot`, `Glitch-Drone`, `Ransom-Crab`, `Popup-Slime`, `FakeNews-Megaphone`), **2 Mid-Boss di Capitolo** `48 × 60` (*Il Bufala-Bot Virale* in Cap. 2 e *Ransom-Kraken* in Cap. 4), **12 Simulatori Interattivi Live EIPASS** e **6 Minigiochi Arcade** (*Basket, Pianoforte Polifonico, Calcio, Parabola Matematica, Scudo Firewall, Smistatore File*).
- **Palette cromatica Casardi:**
  - *Pietra/Travertino Colonne:* `#f3efe6`, `#ddd6c7`, `#b9b09f`
  - *Intonaco Ali Razionaliste:* `#e5c79c`, `#cfa978`
  - *Cornicione Rosso Casardi:* `#7c2529`, `#59171b`
  - *Corridoi Storici:* Giallo pastello `#ecd374` + Bianco gesso `#f6f4ed` + Porte rovere `#c58b52`
  - *Laboratorio Digitale:* Blu cyber `#16243b`, Ciano terminale `#38e2d8`, Verde circuito `#4ce870`
  - *Biblioteca Storica:* Mogano `#5c3422`, Pergamena `#f2e2ba`, Oro antico `#e0b145`
  - *Aula Magna:* Graniglia palco `#9ea3a8`, Pianoforte nero laccato `#181a22`, Velluto blu `#233b6e`

---

## 3. Schede Obbligatorie dei Quattro Protagonisti

Tutti e quattro i protagonisti sono **giocabili e intercambiabili in qualsiasi momento** (`Tasti 1-2-3-4` o `Q / Tab`) e ciascuno possiede animazioni complete (`idle`, `camminata 4 frame`, `salto`, `caduta`, `azione speciale`, `vittoria`, `danno/sconfitta`), oltre a sfide dedicate indispensabili per proseguire.

### 1. PROF. RANALDO — Insegnante di Matematica
- **Aspetto canonico obbligatorio:** Capelli grigi/argento spettinati e *messy* con ciocche/frangia disordinata sulla fronte (stesso taglio ribelle dei ragazzi, ma chiaramente grigio) + **piccola barbetta grigia chiaramente visibile** sul mento.
- **Abbigliamento e Palette:** Giacca blu ardesia (`#2b3e5e`), camicia chiara (`#f2efe9`), cravatta ocra dorata (`#d99b26`), pantaloni antracite. Silhouette autorevole con compasso/goniometro luminoso durante l'azione.
- **Personalità narrativa:** Brillante, ironico con aplomb matematico, esigente ma sempre pronto a fare scudo per i suoi studenti. Ragiona per teoremi, parabole, probabilità e logica impeccabile. Mai ridicolizzato: è il mentore carismatico della squadra.
- **Funzione nel Gameplay:**
  - **Abilità attiva (`X` / `E`) — *Vettore Cartesiano*:** Proietta un raggio geometrico aureo che materializza **piattaforme-parabola temporanee** sui varchi ampi e rallenta i proiettili caotici vicini.
  - **Sfida dedicata:** Enigmi matematico-informatici (coordinate cartesiane, formule e riferimenti assoluti `$A$1` nei fogli di calcolo EIPASS Modulo 6, sequenze logiche).
- **Battuta caratteristica:** *"Ragazzi, il panico è solo un'equazione con troppe incognite non raccolte. Isoliamo la X e passiamo dal corridoio!"*

### 2. CARLO — Appassionato di Basket (Ruolo Centrale d'Azione)
- **Aspetto canonico obbligatorio:** Capelli castano scuro/neri, spettinati e *messy*, con ciocche/frangia disordinata che ricade sulla fronte.
- **Abbigliamento e Palette:** Canotta/felpa smanicata sportiva **arancione vivo (`#f26b1d`)** sopra maglia blu royal (`#1e3a8a`), scarpe high-top bianche e arancioni, **palla da basket a spicchi arancione** sempre pronta tra le mani (palleggio ritmico nell'animazione idle!).
- **Personalità narrativa:** Energico, propositivo, trascinatore del gruppo nei momenti critici; vede ogni ostacolo come uno schema in contropiede o un tiro sulla sirena. Ha un ruolo trainante lungo tutta l'avventura.
- **Funzione nel Gameplay:**
  - **Salto leggermente più elastico (+8% spinta verticale)** grazie all'elevazione da cestista.
  - **Abilità attiva (`X` / `E`) — *Tiro a Parabola / Sponda Basket*:** Lancia il pallone da basket con un arco parabolico perfetto che **rimbalza sulle pareti/tabelloni**, colpisce interruttori sopraelevati irraggiungibili dal basso e stordisce i droni volanti.
  - **Sfida Arcade dedicata:** **Sfida Canestro & Rimbalzo** nel Campo da Basket della Sede Centrale (e tiri-interruttore nei livelli): calcolo di angolo/potenza per centrare canestri fissi e mobili che alimentano i generatori di sblocco.
- **Battuta caratteristica:** *"Tre secondi sul cronometro, tabellone libero: copritemi il rimbalzo che questo firewall lo mandiamo a canestro!"*

### 3. FRANCESCO — Appassionato di Pianoforte
- **Aspetto canonico obbligatorio:** Capelli castano scuro/neri, spettinati e *messy*, con ciocche/frangia disordinata sulla parte anteriore della testa.
- **Abbigliamento e Palette:** Giacca/cardigan **verde smeraldo/ottanio (`#167c6e`)** su camicia avorio (`#f5efe0`) con spilla a chiave Musicale dorata, pantaloni scuri eleganti. Nell'idle muove le dita come su una tastiera invisibile generando piccole note pixelate (`♪`).
- **Personalità narrativa:** Osservatore acuto, ironia sottile, orecchio assoluto per il ritmo e per qualsiasi stonatura — che sia un accordo sbagliato o una mail di phishing scritta male.
- **Funzione nel Gameplay:**
  - **Abilità attiva (`X` / `E`) — *Accordo di Risonanza*:** Emette un'onda armonica circolare che **attiva i diapason/ponti sonori**, rivela blocchi segreti invisibili e respinge gli sciami di Pop-Up.
  - **Sfida Musicale dedicata:** **Enigma del Pianoforte Interattivo** (sulla *Master Keyboard* del Laboratorio Multimediale e sul *Pianoforte a coda nero* dell'Aula Magna): una vera tastiera a 8 note (`DO4–DO5`) suonabile con tastiera o frecce per ricostruire e comporre i motivi melodici originali che aprono i sigilli armonici! (Accessibile anche senza audio grazie al codice visivo note/colori).
- **Battuta caratteristica:** *"Sentite questo ronzio del server? È calante di mezzo tono… e nasconde una porta segreta dietro lo scaffale."*

### 4. RUGGERO — Appassionato di Calcio
- **Aspetto canonico obbligatorio:** Capelli castano scuro/neri, spettinati e *messy*, con ciocche/frangia disordinata sulla parte anteriore della testa.
- **Daniele (nuovo protagonista, v3.0):** fade, occhiali sottili ambrati e giacca avorio; abilità legata ai sistemi informatici (porte logiche, note di rete) e al modulo EIPASS della sicurezza.
- **Abbigliamento e Palette:** Giacca sportiva **biancorossa (`#f45565` corallo con bande bianche)** — omaggio cromatico sportivo —, pantaloni tecnici blu notte, scarpini agili e **pallone da calcio bianco-nero** ai piedi (piccoli palleggi di piede nell'animazione idle!).
- **Personalità narrativa:** Rapido, concreto, battuta pronta da spogliatoio, specialista negli inserimenti veloci e nel togliere le castagne dal fuoco quando il tempo stringe.
- **Funzione nel Gameplay:**
  - **Velocità di scatto a terra leggermente superiore (+10% sprint)** per sezioni a tempo e inseguimenti.
  - **Abilità attiva (`X` / `E`) — *Tiro Teso Rasoterra*:** Calcia il pallone ad alta velocità lungo il suolo e dentro cunicoli bassi, **sfondando blocchi di codice incrinati (`Glitch Cracked Blocks`)**, colpendo bersagli lontani in linea retta e atterrando i bot corazzati.
  - **Sfida Arcade dedicata:** **Sfida Rigori & Bersagli di Precisione** nel Cortile/Palestra (e passaggi filtranti contro le barriere mobili del Sofista): mirino oscillante, finte contro il portiere-firewall e tiri all'incrocio dei pali!
- **Battuta caratteristica:** *"Voi fate pure i calcoli millimetrici… datemi palla nello spazio e quella porta bloccata la apro di collo pieno!"*

---

## 4. Sistema di Variabili Narrative e Conseguenze Reali

Tutte le variabili sono centralizzate in `GameState` e verificate attivamente dal codice dei livelli, dei dialoghi, dei negozi/terminali e del Boss Finale:

1. `trust.ranaldo`, `trust.carlo`, `trust.francesco`, `trust.ruggero` (`0–100`, base `50`):
   - Se `trust >= 70`, il personaggio sblocca **aiuti passivi reali**:
     - *Ranaldo:* +1 tacca di Scudo Logico massimo e suggerimento matematico nei terminali.
     - *Carlo:* rimbalzo doppio potenziato sul pallone da basket + intervento a canestro contro il Boss.
     - *Francesco:* raggio dell'Accordo di Risonanza ampliato + rivelazione automatica segreti vicini.
     - *Ruggero:* ricarica rapida del Tiro Teso + contropiede stordente nella boss fight.
   - Se `trust < 40`, il personaggio commenta con ironia la scelta avventata e non attiva il bonus automatico finché non si recupera fiducia.
2. `eipassScore` (`0–100`) e `modulesCleared` (Moduli 1–7):
   - **Risposta corretta:** apre scorciatoie pulite, disattiva torrette/laser, assegna Cuori Energia o Batterie Scudo e incrementa il grado finale EIPASS.
   - **Risposta errata (conseguenza reale immediata ma equa):**
     - Toglie 1 punto Energia (fino al minimo di 1 HP di sicurezza durante un dialogo per evitare morti ingiuste a schermo fermo, oppure attiva uno stato di *Allerta Malware*),
     - Attiva trappole o droni di guardia aggiuntivi nella stanza,
     - Chiude la scorciatoia rapida obbligando a superare il percorso platform superiore/alternativo,
     - Mostra sempre una spiegazione chiara, spiritosa e istruttiva dell'errore!
3. `pegasoPages` (`0–12` nella Campagna, `0–3` nell'Open Day):
   - Numeri speciali perduti del giornale studentesco *Pegaso* nascosti in passaggi segreti; sbloccano curiosità autentiche sul Casardi e il **4° Finale Segreto**.
4. **Decisioni Chiave (`flags`):**
   - `ch1_entry_plan` (*Analisi header col Prof* vs *Ponte atletico di Carlo* vs *Sfondamento rapido di Ruggero*) -> cambia quali porte e nemici sono attivi nell'Atrio!
   - `ch2_fake_news_response` (*Smentita con fonte ufficiale `liceocasardi.edu.it`* vs *Inoltro impulsivo* vs *Scherzo ironico*) -> modifica gli ostacoli nei corridoi e il morale studentesco!
   - `ch4_backup_target` (*Salvare prima il Catalogo Storico 8.000 volumi* vs *Partiture Liceo Musicale* vs *Backup incrementale completo 3-2-1*) -> modifica gli aiuti disponibili in Biblioteca e Aula Magna!
   - `ch6_tactical_lead` -> sceglie chi guida l'assalto decisivo al Sofista Digitale!

---

## 5. Struttura delle Due Modalità di Gioco

### A. MODALITÀ OPEN DAY (7–10 Minuti — Esperienza Autonoma Completa)
Accessibile con pulsante dedicato in primo piano nel Menu Principale. Progettata specificamente per i visitatori dell'Open Day:
1. **Zona 1 — Piazzale Monumentale Via d'Aragona 100 (~1,5 min):** Colonne bianche, bandiere IT/UE, pini marittimi. Tutorial visivo istantaneo in movimento, incontro con **Prof. Ranaldo** e **Carlo**, prima scelta narrativa + primo terminale EIPASS (Phishing/Estensioni file) che apre o complica il portone.
2. **Zona 2 — Corridoio Giallo-Bianco & Cortile Sportivo (~3 min):** Platform dinamico tra porte con sopraluce, LIM impazzite e droni Spam; incontro in azione con **Ruggero** (tiro rasoterra per abbattere la barriera + mini-sfida calcio a bersaglio) e tiro a rimbalzo da basket di **Carlo** per calare la passerella verso il piano superiore.
3. **Zona 3 — Laboratorio Multimediale 23 Postazioni (~2,5 min):** Incontro con **Francesco** alla Master Keyboard! Scelta con conseguenze sul backup dell'Open Day + **Puzzle Musicale al Pianoforte** (4 note originali da suonare) + sfida lampo EIPASS/Casardi.
4. **Zona 4 — Aula Magna: Resa dei Conti (~2 min):** Sul palco in graniglia accanto al pianoforte a coda nero e ai busti classici, sfida finale compatta contro il **Sofista Digitale** dove tutti e quattro i protagonisti intervengono, seguita dalla **Schermata Certificato Visitatore Open Day**, invito alla Campagna Completa e pulsante **Reset Immediato Nuovo Visitatore (`F9`)**.

### B. CAMPAGNA COMPLETA (6 Capitoli — 35–45 Minuti di Gameplay Effettivo)
Ogni capitolo comprende **3 ampie sezioni interconnesse** (18 grandi mappe totali nella campagna + arene minigiochi + stanze segrete), checkpoint frequenti, collezionabili *Pagine di Pegaso*, dialoghi ramificati, terminali dei **7 Moduli EIPASS** e sfide dedicate ai cinque protagonisti:

- **Capitolo 1 — *Via d'Aragona 100: Il Portale Sigillato*** *(Esterno Monumentale, Gradinata & Portico, Atrio d'Ingresso e Scalone)* — Modulo 1 EIPASS (*Fondamenti ICT*), introduzione cambio personaggio Ranaldo/Carlo, segreto sopra la loggia delle bandiere. (~6 min)
- **Capitolo 2 — *Corridoi del Primo Piano: Voci di Corridoio e Fake News*** *(Ala Classica Est, Snodo delle LIM, Ala Musicale Ovest)* — Moduli 2 e 3 EIPASS (*Ricerca Web/Fonti* e *Comunicare in Rete: PEC & CCN*), bivi alto/basso, porte interattive, sblocco di Ruggero in squadra. (~6–7 min)
- **Capitolo 3 — *Cortile e Palestra: Parabole, Angoli e Contropiedi*** *(Cortile dei Pini, Campo da Basket all'aperto, Palestra Coperta)* — Modulo 6 EIPASS (*Foglio di Calcolo: formule `=SOMMA`, `=MEDIA`, `$A$1`*), **Grande Sfida Arcade Basket di Carlo** + **Grande Sfida Arcade Calcio di Ruggero** + ponti geometrici del Prof. Ranaldo. (~6–7 min)
- **Capitolo 4 — *Laboratorio Multimediale: 23 Postazioni nel Caos*** *(Ingresso Rete FESR, Sala delle 23 Postazioni & Master Keyboard, Core Firewall)* — Modulo 4 EIPASS (*Sicurezza Informatica: Phishing, 2FA, Ransomware, Backup*), laser sincronizzati, nastri dati, sblocco e **Puzzle Musicale di Francesco**. (~6–7 min)
- **Capitolo 5 — *Biblioteca Storica: Il Labirinto degli 8.000 Volumi*** *(Sala di Lettura Antica, Scaffali Alti & Mediateca, Fuga dall'Indice Corrotto)* — Modulo 5 EIPASS (*Elaborazione Testi: Stili, Sommari, PDF*), arrampicata verticale tra librerie storiche, enigmi verificati sulla storia del Casardi (1924/1937 Boccassini/Alfredo Casardi/Pegaso), sequenza adrenalinica a tempo contro l'onda di dati corrotti! (~6–7 min)
- **Capitolo 6 — *Aula Magna: Sinfonia a 8 Bit per l'Open Day*** *(Foyer degli Atelier, Platea & Proiezione, Palco dell'Aula Magna)* — Modulo 7 EIPASS (*Presentazioni Multimediali*), consiglio finale della squadra con verifica di tutte le scelte precedenti, **Boss Finale a 3 Fasi contro il Sofista Digitale Ω** (azione platform + basket + calcio + matematica + duello melodico finale al pianoforte a coda!) ed **Epilogo Dinamico (4 Finali distinti)**. (~7–8 min)
