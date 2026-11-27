# TEST REPORT E AUDIT VISIVO INTEGRALE (v3.1) — OPERAZIONE EIPASS: IL CASARDI IN 8 BIT

Documento di verifica funzionale, fisica, narrativa, visiva e operativa dell'Edizione Completa **v3.1**.

---

## 0. Aggiornamento v3.1 — nuove sfide, colonna sonora, dialoghi, ambienti

- **5 nuove sfide (12 minigiochi in totale):** *Operazioni a tempo del Prof. Ranaldo* (12 calcoli in 45 s, +3 s/-3 s), *Calcio ai rigori* con portiere mobile (3 gol, mira su 3 colonne × 2 altezze), *Greco*, *Latino*, *Storia* (4 domande estratte da banche di 5, 15 s a domanda, timer visibile, tempo scaduto gestito senza softlock).
- **Nuovo menu Pausa → Sfide Libere:** ingresso separato alle cinque sfide libere, indipendente dal livello. Verificato: apertura, navigazione `SU/GIU`, avvio, ritorno al gioco.
- **Stazioni nel mondo:** `od_1` ospita *matematica a tempo* (con cancello dedicato `gate_od1_math`, apribile anche con `[R]`), *greco* e *storia*; `od_3` ospita *latino* e *calcio*. Verificato in browser che ogni stazione mostra `[E] Avvia Sfida!` e apre il minigioco giusto.
- **Colonna sonora:** tre tracce nuove (`courtyard` 150 BPM, `aulamagna` 120 BPM, `study` 104 BPM) e due strumenti nuovi (pad armonico a due oscillatori scordati, arpeggio di ottavi); pad/arp attivati anche su tema principale, biblioteca, laboratorio, sport e vittoria senza toccare le melodie esistenti. **Verificate 10 tracce in browser reale: 0 errori.**
- **Dialoghi Open Day accorciati:** da 3.271 a 2.320 caratteri (-951, ≈ -1,1 minuto di lettura) più velocità di scrittura da 1,9 a 2,6 caratteri/frame (≈ -14 s): totale percepito ≈ **-1,7 minuti**, senza toccare la boss fight.
- **Ambienti più credibili:** corridoio con fontanella in ghisa, cestino a pedale e bacheca di istituto con gli avvisi veri (Open Day, sportello, PON).
- **Suite v3.1:** playtest **575/575**, testi **341/341**, regressione **195/195**, mobile **30/30**, screenshot desktop/mobile **7/7**.

---


Documento di verifica funzionale, fisica, narrativa, visiva (su tutte le **48 scene possibili**) e operativa dell'Edizione Completa **v3.0**.

---

## 1. Sintesi Esecutiva dei Test (v3.0)

- **Audit Visivo Integrale su 48 Scene (`node tools/render_all_scenes.mjs`):** Renderizzate e ispezionate visivamente **tutte le 48 scene possibili del gioco** (`assets/sprites/audit_48_scene/AUDIT_1..8.png` + `ANTEPRIMA_SCENE_CASARDI.png` + `TAVOLA_PERSONAGGI.png`): Menu Principale (3 e 4 voci), Comandi/Mixer, Pausa/Dossier, Finali Open Day e Campagna S+ (+CRT), tutti i ritratti `64×64`, tutte le 6 modalità Postazioni EIPASS, tutti e 6 i Minigiochi, tutte le 4 zone Open Day, le Sotto-Aule interne (*Aula 7*, *Portineria*, *Redazione Pegaso*) e **tutti i 18 livelli della Campagna (`c1_1`..`c6_3`)**.
- **Suite automatizzata eseguita:** `node tools/qa_playtest.mjs` — **511 / 511 test superati (`0` fallimenti)** a 60Hz. Le altre tre suite: testi **341/341**, regressione errori **193/193**, mobile & multi-touch **30/30**.
- **Verifica albero moduli ES6 su HTTP Live Server (`0.0.0.0:8080`) e bundle offline (`AVVIA_GIOCO.html` / `release/index.html`, 340 KB):** Superata con `0` errori e `0` dipendenze esterne.

---

## 2. Dettaglio dei Controlli e Miglioramenti v3.0

### A. Personaggi Ridisegnati e Verificati (`TAVOLA_PERSONAGGI.png`)
- **Carlo (modellato sulla foto reale):** Capelli neri corti ai lati con frangia spettinata sulla fronte, sopracciglia nere marcate, **occhiali neri rettangolari stile Wayfarer** con riflesso lente, **baffetti giovani (`baffetti`)** sopra il labbro superiore e mento pulito, sia nel ritratto `64×64` sia nello sprite `32×36`.
- **Prof. Ranaldo (45 anni reali):** Capelli e barba corta curata sale-e-pepe (grigio antracite/acciaio), postura energica e lineamenti giovanili da quarantacinquenne (eliminato l'effetto anziano della v2.0).
- **Francesco vs Ruggero nettamente differenziati:** **Francesco** ha ciuffo morbido con riga laterale, **cuffie da studio al collo**, cardigan verde smeraldo su t-shirt crema e pantaloni scuri; **Ruggero** ha cresta sportiva *spiky*, **fascia tergisudore con ciocche ribelli**, maglia biancorossa `#10`, pantaloncini sportivi, gambe visibili e calzettoni a righe.
- **Il Sofista Digitale 404-Ω:** Ridisegnato come busto di filosofo greco classico metà marmo pario scolpito con corona d'alloro d'oro e metà ologramma cyber magenta/ciano.

### B. Restyling Architettonico, Aula Magna Teatrale e Zero Sovrapposizioni (`48/48` Scene)
- **Aula Magna Teatrale (`od_4`, `c6_2`, `c6_3`):** Ridisegnata integralmente con soffitto a cassettoni e faretti di palco, sipari laterali in velluto bordeaux con frangia dorata, boiserie in noce, finestre a veneziana, schermo `"LICEO STATALE A. CASARDI"`, bandiere IT/UE su aste d'ottone, teche vetrate con busti classici, poltroncine in primo piano e **vero Pianoforte a Coda da Concerto pixel-art** (coperchio aperto con asta in ottone, arpa dorata, tastiera e panchetta).
- **Corridoi, Sotto-Aule e Suggerimenti:** Porte in rovere proporzionate agli sprite `32×36`, aule interne con finestre dedicate e LIM ampia senza sovrapposizioni con mensole o NPC, e suggerimenti contestuali ancorati in una pillola HUD centrata in basso.

### B. Fisica Platform, Sotto-Aule Esplorabili, Assist `[C]` e 6 Minigiochi Arcade
- **22 Mappe Complete (4 Open Day + 18 Campagna):** Verificati spawn, hitbox `15×27`, Coyote Time, Jump Buffering, Squash & Stretch e assenza di softlock.
- **Sotto-Aule Interne Esplorabili (`[E]`):** Testato andata e ritorno fisico per tutte le sotto-stanze interne (*Aula 7 • 5C*, *Portineria Storica di Mimmo*, *Redazione Giornale Pegaso con Sofia*), con aggiornamento dinamico dei limiti camera.
- **Abilità Direzionali `[X]` / `[SU+X]` e Assist `[C]`:** Testati a 60Hz tutti i Canestri-Relè di Carlo, tutti i Muri Incrinati sfondati da Ruggero, i Ponti Sonori + Doppie Note di Francesco, il Compasso Aureo + Pedane di Ranaldo e l'evocazione Tag-Team `[C]` in tutte le 22 stanze.
- **6 Minigiochi Giocabili a 60Hz:** Completati in simulazione frame-by-frame *Basket di Carlo*, *Pianoforte Polifonico di Francesco*, *Rigori di Ruggero*, *Calibratore Parabolico di Ranaldo*, *Scudo Firewall EIPASS (Mod. 4)* e *Smistatore File & Estensioni EIPASS (Mod. 1-2)*.

### C. 12 Simulatori Live EIPASS, 2 Mid-Boss, Boss Finale a 3 Fasi e 4 Finali
- **12 Postazioni Interattive EIPASS:** Verificati tutti i `uiMode` (*Foglio di Calcolo Live*, *Layout Studio Slide/PDF*, *Phishing Inspector*, *Webmail CCN*, *Browser HTTPS*, *Hardware Switch*) sia con risposta corretta sia con risposta errata.
- **2 Mid-Boss di Capitolo + Boss Finale:** Sconfitti in simulazione reale a 60Hz *Il Bufala-Bot Virale* (`c2_3`), *Ransom-Kraken* (`c4_3`) e *Il Sofista Digitale 404-Ω* a 3 fasi (`od_4` e `c6_3`).
- **12 Pagine di Pegaso & 4 Finali:** Confermata la raccolta integrale nella Campagna e la raggiungibilità di tutti e 4 i finali (`S+`, `A+`, `B`, `C+`).

---

## 3. Problemi Individuati e Risolti Durante la Revisione v2.0

1. **Risoluzione import relativi ES6 in `src/main.js` per server HTTP live:** Allineati tutti i percorsi relativi in `src/main.js` (`./config/...`, `./state/...`, ecc.) così che sia l'apertura diretta via HTTP (`index.html` su porta `8080`) sia il bundle offline (`AVVIA_GIOCO.html` / `release/index.html`) carichino tutti i 15 moduli con `0` errori.
2. **Glifo separatore verticale `|` nel font bitmap `pixelFont.js`:** Individuato tramite ispezione visiva della barra comandi in `ANTEPRIMA_SCENE_CASARDI.png` e aggiunto a `GLYPHS_5X7` insieme alle virgolette tipografiche.
3. **Wrapping su 2 righe nelle Postazioni Live EIPASS (`hudAndMenus.js`):** Ottimizzato l'incastro verticale del simulatore Foglio di Calcolo e dei prompt per eliminare qualsiasi troncamento a `480×270`.
