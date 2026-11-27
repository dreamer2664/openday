# OPERAZIONE EIPASS — IL CASARDI IN 8 BIT


> **v3.1.3 — Passata di controllo completa (codice e dati) + due correzioni:** nel gioco di ritmo di Daniele ogni casella mostrava **due volte lo stesso testo** (il passo "AVAN..." e la scorciatoia "AVAN...", oppure "SU" sopra "SU"); ora la casella mostra solo il **tasto da premere** ([SU], [GIU], [SX], [DX], [SALTA], [ABIL]) e sotto l'esito (OK!, ERR, ORA!), mentre il significato del movimento resta nella riga di istruzioni. La **batteria della traccia "studio"** chiudeva il giro prima del resto della musica (12 colpi su 32 passi) e si riallineava di scatto: ora segue tutti i 32 passi. Aggiunti i **cartelli mancanti** davanti ai cancelli ritmici di otto stanze della campagna (Capitolo 1.2, 2.3, 3.3, 4.2, 4.3, 5.1, 6.1, 6.2): senza quel cartello un giocatore non poteva sapere che il varco si apre con il **Passo di Salsa** o con lo **Scatto di Ruggero**. Verificati in questa passata: 22 stanze percorribili fino all'uscita, 40 fosse tutte superabili (peggiore: 5 tile con piattaforma mobile), 20 porte d'uscita funzionanti, salvataggi e preferenze audio, 12 tracce musicali con tutte le note definite, e 100.000+ frame di gioco automatico senza un solo crash.
>
> **v3.1.2 — Quiz senza soluzioni regalate:** nella sfida di storia la riga grande in cima mostrava il numero della risposta ("1937", "23", "8000"); ora mostra l'**argomento** (IL PALAZZO, IL LABORATORIO, LA BIBLIOTECA...) e la risposta va cercata nelle opzioni. Le opzioni di greco, latino e storia vengono **rimescolate a ogni partita** (prima la risposta esatta stava quasi sempre nella stessa posizione, e in storia le date erano in ordine cronologico). Stesso difetto trovato e corretto anche nelle **12 postazioni EIPASS**, dove la risposta corretta era sempre la prima o la seconda. Aggiunta una domanda sull'intitolazione, verificata sul sito dell'istituto: il liceo porta il nome del **Tenente Alfredo Casardi**, Medaglia d'Oro.
>
> **v3.1.1 — Correzioni richieste dopo la prova sul campo:** risolto il **lampeggio** degli arredi del corridoio (fontanella, cestino e bacheca si scambiavano di posto perché la scelta era legata alla parità di un valore che cambia ad ogni pixel di cammino); le **sfide non stanno più ammassate né sopra le fosse** (greco all'ingresso, storia a metà viale, operazioni a tempo dopo la fossa in *Viale d'Aragona*; latino e calcio su terreno solido nel *Laboratorio*); la sfida di **Francesco è diventata un gioco di ritmo** a 4 corsie (le note scendono e si suonano sulla linea, tre misure sempre più veloci) al posto della sequenza da ripetere a memoria; ogni sfida ha ora **colore ed etichetta propri** nel mondo (GRK, LAT, STO, GOL, CALC) invece di confondersi con "MAT".
>
> **v3.1.0** — Cinque nuove sfide: **Operazioni a tempo del Prof. Ranaldo** (12 calcoli in 45 secondi, ±3 s a risposta), **Calcio ai rigori** con portiere mobile, **Greco, Latino e Storia** (4 domande a tempo da una banca di 5). Le sfide libere si lanciano anche dal nuovo menu **Pausa → Sfide Libere**, senza aspettare di trovare la stazione nel livello. Colonna sonora ampliata: tre nuove tracce (Cortile sportivo, Aula Magna, Studio) più due strumenti nuovi (pad armonico e arpeggio). Dialoghi dell'Open Day accorciati di circa un minuto e mezzo e testo più veloce. Corridoi più credibili: fontanella, cestino e bacheca di istituto con gli avvisi veri.
>
> **v3.0.7** — Ranaldo ridisegnato sulle foto (capelli argento a punte, barba che segue la mascella, maglietta blu navy) e canotta da basket **colorata senza numero** per Carlo.
>
> **v3.0.6** — Ranaldo dalle foto (capelli argento, barba brizzolata, occhi azzurri), Carlo con la **canotta #35 OKC di Durant (2013-14)** e Francesco in blazer nero con frangia più bassa.
>
> **v3.0.5** — Daniele e Francesco ridisegnati **dalle foto reali**: fade + occhiali sottili + giacca avorio per Daniele, frangia folta + blazer nero da concerto per Francesco.
>
> **v3.0.4** — personaggi rifiniti (Daniele con le note al posto dell'aggeggio di rete, volti più leggibili) e **facciata del Casardi ricostruita sulle foto** (colonne, loggia con bandiere, portale in legno, targa, gradini, bacheca).
>
> **v3.0.3** — nuovo toggle **SQUADRA AL SEGUITO** (menu iniziale / pausa / tasto `G`): i compagni non ti pedinano più.
>
> **v3.0.2** — comandi PC a posto: cambio eroe con `1`-`5`, `Q`/`TAB`, click sulle pillole dell'HUD o sul compagno, prompt `[E]`; ogni comando della guida ha un tasto (`F1`/`?` = guida, `Y` = schermo intero); mixer attivo nella guida. Vedi `CHANGELOG.md` e `DEVLOG.md`.

Videogioco originale narrativo-platform a 8-bit realizzato per l'**Open Day del Liceo Classico, delle Scienze Umane e Musicale Statale *"Alfredo Casardi"* di Barletta** (Sede Centrale di Via Ferdinando I d'Aragona, 100) come prodotto finale del percorso **EIPASS**.

**Protagonisti giocabili (5):** **Prof. Ranaldo** *(Matematica)*, **Carlo** *(Basket)*, **Daniele** *(Ballo Latino-Americano)*, **Ruggero** *(Atletica Leggera)* e **Francesco** *(Pianoforte)*.

**Gioca subito dal browser:** https://dreamer2664.github.io/openday/ — build standalone v3.0.7, nessuna installazione.

**Repository:** https://github.com/dreamer2664/openday (sorgente `src/`, strumenti `tools/`, documentazione e storico).

**Build consigliate v3.0:** `AVVIA_GIOCO_PC_V3.html` (postazione Open Day) e `AVVIA_GIOCO_MOBILE_V3.html` (telefono/tablet).

---

## Avvio Immediato (Zero Installazione, 100% Offline)

Il gioco è pronto all'uso e **non richiede connessione Internet, account, librerie esterne o installazioni**:

### Metodo 1 — Doppio Clic Diretto (Consigliato per la Postazione Open Day)
1. Apri la cartella `CASARDI_8BIT_GAME/`.
2. Fai **doppio clic** sul file **`AVVIA_GIOCO.html`** *(oppure su `release/index.html`, o `AVVIA_OPEN_DAY.bat` su Windows / `avvia_open_day.sh` su Linux-macOS)*.
3. Il gioco si apre istantaneamente in qualsiasi browser moderno (Chrome, Edge, Firefox, Safari). Clicca o premi un tasto qualsiasi per attivare la **musichetta chiptune 8-bit**!

### Metodo 2 — Server Locale (Opzionale, per sviluppo sui moduli sorgente `src/`)
```bash
cd CASARDI_8BIT_GAME
python3 -m http.server 8080
```
Poi apri `http://localhost:8080` nel browser.

---

## Le Due Modalità di Gioco

1. **★ MODALITÀ OPEN DAY (7–10 minuti — Pulsante arancione in cima al Menu Principale)**  
   Missione dimostrativa autonoma progettata appositamente per i visitatori dell'Open Day: ritmo immediato, introduzione in azione di tutti e cinque i protagonisti (Carlo, Prof. Ranaldo, Daniele, Ruggero e Francesco), scelte con conseguenze, sfide EIPASS/Casardi, enigmi dedicati alle passioni e scontro conclusivo sul palco dell'Aula Magna con attestato finale.
2. **▶ CAMPAGNA COMPLETA (35–45 minuti — 6 Capitoli, 18 Livelli, 4 Finali)**  
   L'avventura integrale attraverso i due piani della Sede Centrale di Via d'Aragona 100: *Ingresso Monumentale, Corridoi Storici Giallo-Bianchi, Cortile e Palestra, Laboratorio Multimediale da 23 Postazioni, Biblioteca Storica degli 8.000 Volumi* (con sequenza d'inseguimento!) e *Aula Magna*, con salvataggio automatico dei checkpoint, tutti i **7 Moduli EIPASS**, **12 Pagine segrete del giornale d'istituto *Pegaso*** e **4 Finali ramificati**.

---

## Guida Rapida per chi Gestisce la Postazione Open Day

- **Preparazione mattina Open Day (30 secondi):**
  1. Apri `AVVIA_GIOCO.html` su PC collegato a monitor grande o LIM/Touch TV.
  2. Premi il pulsante **`⛶ Schermo Intero`** nella barra in basso.
  3. Verifica che le casse siano accese (puoi regolare separatamente Volume Musica ed Effetti dal menu `Comandi & Mixer Audio` o premendo `P`).
- **Come far iniziare un visitatore:**
  - Basta premere `INVIO` / `SPAZIO` o cliccare su **`★ Demo Open Day`**! I comandi compaiono subito in modo visivo.
- **Come resettare il gioco tra un visitatore e il successivo (1 secondo):**
  - Premi il tasto **`F9`** sulla tastiera *(oppure clicca il pulsante **`↻ Nuovo Visitatore (F9)`** sotto lo schermo)*. Il gioco torna istantaneamente al menu iniziale azzerando la sessione dimostrativa.
- **Risoluzione rapida problemi comuni:**
  - *Non si sente la musica all'apertura della scheda?* Fai un clic qualsiasi dentro lo schermo o premi `SPAZIO`: i browser sbloccano l'audio al primo tocco. Controlla anche che non sia attivo il Muto (`Tasto M`).
  - *I tasti freccia non rispondono?* Clicca una volta al centro del riquadro di gioco per ridare il focus alla finestra.
  - *Un visitatore vuole interrompere a metà?* Premi **`F9`** per riportare subito la postazione pronta per il prossimo ospite.

---

## Struttura della Directory `CASARDI_8BIT_GAME/`

- `AVVIA_GIOCO.html` / `release/index.html` — Build standalone completa eseguibile offline con doppio clic.
- `AVVIA_OPEN_DAY.bat` / `avvia_open_day.sh` — Script di avvio rapido per Windows, Linux e macOS.
- `index.html` & `src/` — Codice sorgente modulare ES6 completo (`config`, `state`, `audio`, `engine`, `minigames`, `narrative`, `levels`, `render/pixelFont.js`, `render/renderer.js`, `ui/hudAndMenus.js`).
- `assets/sprites/` — Sprite sheets originali in pixel art v2.0 (`characters_sheet.png` 13×7 pose `32×36` (91 frame), `portraits_sheet.png` 6×8 espressioni `64×64` (48 ritratti), `tileset_casardi.png` `16×16`, `enemies_props.png` con 5 nemici e 3 Boss/Mid-Boss `48×60`) + `TAVOLA_PERSONAGGI.png` e `ANTEPRIMA_SCENE_CASARDI.png`.
- `assets/audio/` — 7 tracce musicali chiptune originali `.wav` + 17 effetti sonori `.wav` (**24 file** `.wav` totali, 3,3 MB) + il motore WebAudio a 4 canali che **genera la musica in tempo reale** (i WAV sono gli stessi brani esportati, per uso esterno: il gioco non li carica).
- `tools/` — Script di generazione asset (`generate_assets.py`), compilazione (`build.py`), playtest 60Hz (`qa_playtest.mjs`) e ispezione visiva (`render_visual_check.mjs`).
- `RICERCA_CASARDI.md` — Ricerca verificata su storia, architettura e offerta formativa del Liceo Casardi e moduli EIPASS.
- `GAME_DESIGN.md` — Documento completo di progettazione (narrativa, **5 protagonisti**, sotto-stanze, 6 minigiochi, 12 simulatori live EIPASS sui 7 moduli, 2 Mid-Boss e 4 Finali).
- `LICENSE` / `NOTICE_LICENSE.md` — licenza d'uso didattico del progetto.
- `requirements.txt` — dipendenze Python dei tool (`pillow`, `playwright`).
- `CONTROLLI.md` — Mappa completa comandi tastiera (inclusi `[C]` Assist di Squadra, `[SU+X]` abilità direzionali e `[V]` filtro CRT), mouse e controller.
- `ASSET_CREDITS.md` — Crediti e licenze degli asset originali e riferimenti consultati.
- `TEST_REPORT.md` — Report completo delle **4 suite automatiche** (`qa_playtest` 511/511, `qa_text_overflow` 341/341, `qa_bugfix_regression` 193/193, `qa_mobile_touch` 30/30) e dell'ispezione visiva su 6 scene reali.
