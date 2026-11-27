# CREDITI E LICENZE ASSET — OPERAZIONE EIPASS: IL CASARDI IN 8 BIT

## 1. Asset Grafici, Codice e Musiche Incorporati nel Gioco

**Tutti gli asset inclusi ed eseguiti nel videogioco sono originali al 100%**, creati appositamente per questo progetto scolastico senza utilizzare sprite, tileset, loghi, font esterni, campioni musicali o effetti sonori provenienti da altri videogiochi o librerie proprietarie:

| Categoria Asset | Percorso nel Progetto | Autore / Origine | Licenza |
|---|---|---|---|
| **Sprite Personaggi & NPC (91 pose `32×36`)** | `assets/sprites/characters_sheet.png` | Creazione originale v2.0 (`tools/generate_assets.py`) | Originale progetto (uso libero per il Liceo Casardi) |
| **Ritratti Dialogo (48 ritratti `64×64` a 6 espressioni)** | `assets/sprites/portraits_sheet.png` | Creazione originale v2.0 (`tools/generate_assets.py`) | Originale progetto |
| **Tileset Architettonico Casardi (`16×16`)** | `assets/sprites/tileset_casardi.png` | Creazione originale v2.0 (`tools/generate_assets.py`) | Originale progetto |
| **5 Nemici (`32×32`), 3 Boss/Mid-Boss (`48×60`) e Oggetti** | `assets/sprites/enemies_props.png` | Creazione originale v2.0 (`tools/generate_assets.py`) | Originale progetto |
| **Tavola Personaggi & 6 Anteprime Reali** | `assets/sprites/TAVOLA_PERSONAGGI.png`, `ANTEPRIMA_SCENE_CASARDI.png` | Creazione originale (`tools/generate_assets.py`, `tools/render_visual_check.mjs`) | Originale progetto |
| **Font Bitmap Pixel-Art 5×7 Italiano & Fondali Casardi** | `src/render/pixelFont.js`, `src/render/renderer.js` | Codice pixel-art originale | Originale progetto |
| **Colonna Sonora Chiptune (7 brani originali)** | `assets/audio/theme_*.wav` + `src/audio/chiptuneEngine.js` | Composizione chiptune originale a 4 canali (*Via d'Aragona*, *Corridoi Classici*, *Cortile Sportivo*, *23 Postazioni Lab*, *Biblioteca 8.000 Volumi*, *Sofista Boss*, *Vittoria*) | Originale progetto |
| **Effetti Sonori 8-Bit (17 file WAV + sintesi WebAudio)** | `assets/audio/sfx_*.wav` + `src/audio/chiptuneEngine.js` | Sintesi procedurale originale (**24 file** `.wav` totali, senza offset DC e senza duplicati) | Originale progetto |
| **Motore di Gioco, Fisica, Dialoghi e Livelli** | `src/**` | Codice JavaScript ES6 originale senza dipendenze esterne | Originale progetto |

---

## 2. Fonti Visive e Documentali di Riferimento (Non incluse nel pacchetto)

Le fotografie e i documenti seguenti sono stati consultati **esclusivamente come riferimento visivo e informativo** per garantire la fedeltà architettonica e storica alla Sede Centrale del Liceo Classico Statale *"Alfredo Casardi"* di Barletta (Via Ferdinando I d'Aragona, 100). Nessuna fotografia di terze parti è stata copiata o distribuita dentro il gioco:

1. **Fotografie di riferimento della facciata fornite dal committente** (`IMG_62eaeaa3...jpg`, `IMG_32b54b95...jpg`) — Riferimento diretto per le due colonne cilindriche bianche, la loggia con bandiera italiana ed europea, il cornicione rosso bordeaux, le ali ocra, la gradinata e i pini marittimi.
2. **Sito Istituzionale del Liceo "A. Casardi" di Barletta** (`https://www.liceocasardi.edu.it/`) — PTOF, Brochure d'Istituto e pagine storiche ufficiali (Licenza contenuti istituzionali PA / tutti i diritti riservati ai rispettivi titolari per il materiale fotografico).
3. **Wikipedia Italia — Voce *Liceo classico Alfredo Casardi*** (`https://it.wikipedia.org/wiki/Liceo_classico_Alfredo_Casardi`) — Riferimento storico sul progetto razionalista dell'ing. Arturo Boccassini (1937).
4. **Articoli di cronaca scolastica locale (*BarlettaLive*, *BarlettaViva*)** — Consultati esclusivamente come riferimento visivo per i colori reali dei corridoi (giallo pastello/bianco, porte con sopraluce, targhe argentate) e la disposizione dell'Aula Magna (palco in graniglia, pianoforte a coda nero, librerie con busti classici, Touch TV). Tutti i diritti fotografici restano delle rispettive testate.
5. **Programma pubblico certificazione EIPASS 7 Moduli User** (`https://it.eipass.com/certificazioni-informatiche/7-moduli-user/`) — Riferimento didattico per l'elenco verificato dei 7 moduli d'esame. *EIPASS* è un marchio registrato di Certipass s.r.l., citato esclusivamente a scopo didattico descrittivo del percorso scolastico svolto dagli studenti.
