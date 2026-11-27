# OPERAZIONE EIPASS — IL CASARDI IN 8 BIT


> **v3.0.4** — personaggi rifiniti (Daniele con le note al posto dell'aggeggio di rete, volti più leggibili) e **facciata del Casardi ricostruita sulle foto** (colonne, loggia con bandiere, portale in legno, targa, gradini, bacheca).
>
> **v3.0.3** — nuovo toggle **SQUADRA AL SEGUITO** (menu iniziale / pausa / tasto `G`): i compagni non ti pedinano più.
>
> **v3.0.2** — comandi PC a posto: cambio eroe con `1`-`5`, `Q`/`TAB`, click sulle pillole dell'HUD o sul compagno, prompt `[E]`; ogni comando della guida ha un tasto (`F1`/`?` = guida, `Y` = schermo intero); mixer attivo nella guida. Vedi `CHANGELOG.md` e `DEVLOG.md`.

Videogioco originale narrativo-platform a 8-bit realizzato per l'**Open Day del Liceo Classico, delle Scienze Umane e Musicale Statale *"Alfredo Casardi"* di Barletta** (Sede Centrale di Via Ferdinando I d'Aragona, 100) come prodotto finale del percorso **EIPASS**.

**Protagonisti giocabili (5):** **Prof. Ranaldo** *(Matematica)*, **Carlo** *(Basket)*, **Daniele** *(Ballo Latino-Americano)*, **Ruggero** *(Atletica Leggera)* e **Francesco** *(Pianoforte)*.

**Gioca subito dal browser:** https://dreamer2664.github.io/openday/ — build standalone v3.0.4, nessuna installazione.

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
   Missione dimostrativa autonoma progettata appositamente per i visitatori dell'Open Day: ritmo immediato, introduzione in azione di tutti e quattro i protagonisti (Prof. Ranaldo, Carlo, Ruggero e Francesco), scelte con conseguenze, sfide EIPASS/Casardi, enigmi dedicati alle passioni e scontro conclusivo sul palco dell'Aula Magna con attestato finale.
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
- `assets/sprites/` — Sprite sheets originali in pixel art v2.0 (`characters_sheet.png` 6×13 pose `32×36`, `portraits_sheet.png` 7×6 espressioni `64×64`, `tileset_casardi.png` `16×16`, `enemies_props.png` con 5 nemici e 3 Boss/Mid-Boss `48×60`) + `TAVOLA_PERSONAGGI.png` e `ANTEPRIMA_SCENE_CASARDI.png`.
- `assets/audio/` — 7 tracce musicali chiptune originali `.wav` + 13 effetti sonori `.wav` (20 file `.wav` totali + motore WebAudio a 4 canali).
- `tools/` — Script di generazione asset (`generate_assets.py`), compilazione (`build.py`), playtest 60Hz (`qa_playtest.mjs`) e ispezione visiva (`render_visual_check.mjs`).
- `RICERCA_CASARDI.md` — Ricerca verificata su storia, architettura e offerta formativa del Liceo Casardi e moduli EIPASS.
- `GAME_DESIGN.md` — Documento completo di progettazione v2.0 (narrativa, personaggi, sotto-stanze, 6 minigiochi, 12 simulatori live EIPASS, 2 Mid-Boss e 4 Finali).
- `CONTROLLI.md` — Mappa completa comandi tastiera (inclusi `[C]` Assist di Squadra, `[SU+X]` abilità direzionali e `[V]` filtro CRT), mouse e controller.
- `ASSET_CREDITS.md` — Crediti e licenze degli asset originali e riferimenti consultati.
- `TEST_REPORT.md` — Report completo dei **496 / 496 test automatizzati 60Hz** e dell'ispezione visiva su 6 scene reali.
