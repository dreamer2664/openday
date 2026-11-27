// Sette Sfide Interattive v3.0 calibrate sui 5 Protagonisti e sui 7 Moduli EIPASS:
//   1. FRANCESCO (piano): Tastiera cromatica (bianchi + neri), fasi Ascolta/Suona, ritmo/durata, 3 frasi progressive, Riascolta
//   2. RUGGERO (athletics): Pista d'Atletica 110m Ostacoli — partenza dai blocchi, ritmo di corsa, stacco ostacoli e filo di lana
//   3. CARLO (basket): Tiro a parabola con anteprima parziale, rimbalzo al tabellone, movimento rete e posizioni progressive
//   4. PROF. RANALDO (math): Calibratore parabolico cartesiano con nodi geometrici e controlli touch/tastiera diretti
//   5. DANIELE (dance): Coreografia latino-americana a tempo (Salsa Cubana, Bachata, Cha-Cha-Chá)
//   6. EIPASS (firewall): Filtro pacchetti basato su protocollo/provenienza reale (non sul solo colore)
//   7. EIPASS (filesorter): Valutazione allegati basata su Mittente + Contesto + Estensione reale (mai solo sull'estensione!)

import { SCREEN_W, SCREEN_H } from "../config/constants.js";
import { PIANO_CHROMATIC_KEYS, PIANO_SCALE } from "../audio/chiptuneEngine.js";
import { drawPixelText, drawPixelTextCentered, drawPixelPanel, fitPixelText } from "../render/pixelFont.js";

// Allegati realistici: la sicurezza dipende da ORIGINE + CONTESTO + VERA ESTENSIONE, mai dal solo ".pdf" o ".docx"
const SORT_ITEMS = [
  {
    name: "Orario_Accoglienza_OpenDay.pdf",
    origin: "bapc01000r@istruzione.it (Segreteria)",
    signal: "Canale interno verificato, nessuna macro attiva",
    safe: true,
    hint: "Mittente istituzionale verificato e PDF statico coerente con l'Open Day.",
  },
  {
    name: "Modulo_Rimborso_Urgente.docm",
    origin: "rimborsi-scuola@portale-esterno.biz",
    signal: "Chiede di 'Abilitare il contenuto Macro' all'apertura",
    safe: false,
    hint: "Anche un documento Office (.docm) da mittente ignoto che chiede macro è rischioso!",
  },
  {
    name: "Circolare_Variazione_Aule.pdf.exe",
    origin: "avvisi-rapidi@casardi-alert.xyz",
    signal: "Doppia estensione: il file reale termina in .exe",
    safe: false,
    hint: "L'ultima estensione (.exe) è un programma eseguibile e il dominio .xyz è estraneo.",
  },
  {
    name: "Partitura_Insieme_AulaMagna.mid",
    origin: "Rete locale Laboratorio 23 PC (Cartella Docenti)",
    signal: "Traccia MIDI standard condivisa da Francesco",
    safe: true,
    hint: "File MIDI privo di codice eseguibile proveniente dalla cartella didattica interna.",
  },
  {
    name: "Elenco_Fornitori_2026.pdf",
    origin: "fatture@studio-sconosciuto99.ru",
    signal: "Contiene solo un pulsante 'Clicca qui per sbloccare con password'",
    safe: false,
    hint: "Un .pdf non è sicuro a prescindere: mittente estraneo + link di phishing interno!",
  },
  {
    name: "Bozza_Pegaso_NumeroSpeciale.pdf",
    origin: "Redazione Pegaso (Postazione Biblioteca)",
    signal: "Esportato in PDF/A da Sofia dieci minuti fa",
    safe: true,
    hint: "Origine interna nota, contesto verificato e formato d'archivio PDF/A.",
  },
];

// Frasi musicali progressive per il Pianoforte di Francesco (includono durata ritmica e tasti neri nei livelli avanzati)
const DEFAULT_PIANO_TIERS = [
  {
    name: "Frase 1 — Tema dell'Atrio",
    notes: [
      { key: "C4", beats: 1 },
      { key: "E4", beats: 1 },
      { key: "G4", beats: 1 },
      { key: "C5", beats: 2 },
    ],
  },
  {
    name: "Frase 2 — Passaggio Cromatico",
    notes: [
      { key: "C4", beats: 1 },
      { key: "D4", beats: 1 },
      { key: "Eb4", beats: 1 },
      { key: "G4", beats: 2 },
      { key: "F4", beats: 1 },
    ],
  },
  {
    name: "Frase 3 — Cadenza del Casardi",
    notes: [
      { key: "C5", beats: 1 },
      { key: "G4", beats: 1 },
      { key: "A4", beats: 1 },
      { key: "F#4", beats: 1 },
      { key: "G4", beats: 1 },
      { key: "C5", beats: 2 },
    ],
  },
];

// ===========================================================================
// DANIELE — COREOGRAFIE LATINO-AMERICANE (Salsa cubana, Bachata, Cha-Cha-Chá)
// Ogni battuta è una sequenza di passi che il giocatore deve ripetere a tempo.
// ===========================================================================
const DANCE_COMBO_GLYPHS = {
  fwd: "SU",
  back: "GIU",
  left: "SX",
  right: "DX",
  turn: "GIRO",
  clap: "BAT",
};

const DANCE_COMBO_COLORS = {
  fwd: "#f472b6",
  back: "#c084fc",
  left: "#38bdf8",
  right: "#4ade80",
  turn: "#fde047",
  clap: "#fb923c",
};

const SALSE_STEPS = [
  {
    style: "SALSA CUBANA",
    bpm: 48,
    song: "Ritmo del Laboratorio",
    moves: ["fwd", "back", "left", "right"],
    hint: "Base: avanti, indietro, SX, DX.",
  },
  {
    style: "BACHATA",
    bpm: 40,
    song: "Notte di Graniglia",
    moves: ["right", "left", "back", "turn", "clap"],
    hint: "Ottavi, giro e battito finale.",
  },
  {
    style: "CHA-CHA-CHÁ",
    bpm: 34,
    song: "Sessione FESR",
    moves: ["turn", "fwd", "clap", "right", "left", "clap"],
    hint: "Giro, avanti, battito, chiusura.",
  },
];

const STEP_KEYS = {
  fwd: "upPressed",
  back: "downPressed",
  left: "leftPressed",
  right: "rightPressed",
  turn: "jumpPressed",
  clap: "specialPressed",
};


// Pacchetti per il Firewall contestuale (nessuna codifica banale solo rosso/verde)
const FIREWALL_PACKETS = [
  { label: "HTTPS :443 Registro", detail: "liceocasardi.edu.it", bad: false },
  { label: "LOGIN casardi-auth.xyz", detail: "Dominio esterno clone", bad: true },
  { label: "BACKUP :22 Archivio", detail: "Copia locale verificata", bad: false },
  { label: "MACRO_AutoRun.docm", detail: "Script avvio remoto", bad: true },
  { label: "MIDI Sync :AulaMagna", detail: "Rete interna FESR", bad: false },
  { label: "EXEC :4444 shell.exe", detail: "Connessione inversa", bad: true },
  { label: "PDF/A Bozza_Pegaso", detail: "Redazione Biblioteca", bad: false },
  { label: "SMISH link-corto.bit", detail: "URL offuscato esterno", bad: true },
];

export class SpecialChallengeManager {
  constructor(audio, state, sprites = null) {
    this.audio = audio;
    this.state = state;
    this.sprites = sprites;
    this.active = null;
    this.onComplete = null;
  }

  isActive() {
    return this.active !== null;
  }

  start(type, config = {}, onComplete = null) {
    this.onComplete = onComplete;
    this.audio.setDucking(true);

    // Qualsiasi eventuale riferimento storico a "football" viene convertito nella sfida di Atletica di Ruggero
    // Alias storici: il calcio è diventato Atletica (Ruggero), la diagnostica è diventata Danza (Daniele)
    const normalizedType =
      type === "football" ? "athletics" : type === "netdiag" ? "dance" : type;

    if (normalizedType === "basket") {
      this.active = {
        type: "basket",
        id: config.id || "mg_basket",
        title: config.title || "CARLO — TIRO A CANESTRO IN CORTILE",
        goalsNeeded: config.goalsNeeded || 3,
        scored: 0,
        misses: 0,
        angle: 54,
        power: 74,
        powerDir: 1,
        charging: false,
        ball: null,
        hoopPositions: [104, 86, 114],
        hoopY: 104,
        hoopDir: 1,
        movingHoop: !!config.movingHoop,
        netSwing: 0,
        rimShake: 0,
        flashTimer: 0,
        msg: "SU/GIU: Angolo | Tieni SPAZIO/SALTA (o tocca l'arco) per dosare e tirare",
      };
    } else if (normalizedType === "piano") {
      // Costruisce i livelli progressivi (compatibile anche con config.sequence numerica)
      let tiers;
      if (Array.isArray(config.tiers) && config.tiers.length > 0) {
        tiers = config.tiers;
      } else if (Array.isArray(config.sequence) && config.sequence.length > 0) {
        // QUALSIASI lunghezza (4, 5 o 6 note): la sequenza del livello viene suonata davvero.
        const mapped = config.sequence.map((idx, i, arr) => ({
          key: PIANO_SCALE[Math.max(0, Math.min(PIANO_SCALE.length - 1, idx))]?.note || "C4",
          beats: i === arr.length - 1 ? 2 : 1,
        }));
        tiers = [
          {
            name: config.subtitle
              ? "Frase del livello"
              : `Frase 1 — ${mapped.length} note`,
            notes: mapped,
          },
        ];
        // Una seconda frase solo se il livello non ne specifica una propria
        if (mapped.length <= 4) tiers.push(DEFAULT_PIANO_TIERS[1]);
      } else {
        tiers = DEFAULT_PIANO_TIERS;
      }

      this.active = {
        type: "piano",
        id: config.id || "mg_piano",
        title: config.title || "FRANCESCO — TASTIERA E RISONANZA",
        subtitle: config.subtitle || "",
        tiers,
        tierIdx: 0,
        sequence: tiers[0].notes,
        inputIndex: 0,
        cursor: 0, // indice su PIANO_CHROMATIC_KEYS (0..12)
        chromaticKeys: PIANO_CHROMATIC_KEYS, // usata dal tocco per i tasti neri
        demoStep: -1,
        demoTimer: 0,
        litKeyId: null,
        litTimer: 0,
        mistakes: 0,
        doneTimer: 0,
        msg: "Ascolta la frase musicale: tra un istante tocca a te",
      };
      this.triggerPianoDemo();
    } else if (normalizedType === "athletics") {
      const distance = config.hard ? 135 : 110;
      const hurdles = config.hard
        ? [24, 46, 66, 88, 112].map((d) => ({ pos: d, state: "upcoming" }))
        : [26, 52, 78, 96].map((d) => ({ pos: d, state: "upcoming" }));
      this.active = {
        type: "athletics",
        id: config.id || "mg_athletics",
        title: config.title || "RUGGERO — PISTA D'ATLETICA: OSTACOLI",
        distance,
        hurdles,
        phase: "ready", // 'ready' | 'running' | 'finished'
        countdown: 48,
        timeElapsed: 0,
        pos: 0,
        speed: 0,
        jumpY: 0,
        jumpVy: 0,
        rivalPos: 0,
        rivalSpeed: config.hard ? 0.165 : 0.145,
        cleanHurdles: 0,
        clippedHurdles: 0,
        strideTick: 0,
        doneTimer: 0,
        flashTimer: 0,
        msg: "Pronti sui blocchi... al VIA tieni DX per correre e SALTA sugli ostacoli!",
      };
    } else if (normalizedType === "math") {
      this.active = {
        type: "math",
        id: config.id || "mg_math",
        title: config.title || "PROF. RANALDO — TRAIETTORIA PARABOLICA",
        targetA: config.targetA || 3,
        targetK: config.targetK || 2,
        curA: 1,
        curK: 4,
        doneTimer: 0,
        msg: "SX/DX: Apertura parabola | SU/GIU: Quota vertice | INVIO/SALTA: Verifica",
      };
    } else if (normalizedType === "dance") {
      this.active = {
        type: "dance",
        id: config.id || "mg_dance",
        title: config.title || "DANIELE — ESIBIZIONE LATINO-AMERICANA",
        routines: SALSE_STEPS,
        routineIdx: 0,
        stepIdx: 0,
        phase: "ready", // ready | dancing | combo | finished
        readyTimer: 96,
        beatTimer: 0,
        comboIdx: 0,
        comboResults: [],
        flashTimer: 0,
        flashColor: null,
        mistakes: 0,
        doneTimer: 0,
        crowd: 0,
        msg: "Preparati: al via ripeti i passi mostrati a ritmo!",
      };
    } else if (normalizedType === "firewall") {
      this.active = {
        type: "firewall",
        id: config.id || "mg_firewall",
        title: config.title || "EIPASS MOD. 4 — FILTRO TRAFFICO DI RETE",
        lane: 1,
        blocked: 0,
        needed: config.needed || 5,
        leaks: 0,
        spawnTimer: 14,
        seqCursor: 0,
        packets: [],
        doneTimer: 0,
        msg: "SU/GIU o tocca corsia: intercetta il traffico sospetto, lascia passare quello interno",
      };
    } else if (normalizedType === "filesorter") {
      this.active = {
        type: "filesorter",
        id: config.id || "mg_filesorter",
        title: config.title || "EIPASS MOD. 1/4 — ANALISI ALLEGATI E ORIGINE",
        queue: SORT_ITEMS.slice(0, config.count || 5),
        idx: 0,
        correctCount: 0,
        mistakes: 0,
        flashColor: null,
        flashTimer: 0,
        doneTimer: 0,
        msg: "Valuta FILE + ORIGINE + CONTESTO -> SX [1] Autorizza | DX [2] Quarantena",
      };
    }
  }

  triggerPianoDemo() {
    if (!this.active || this.active.type !== "piano") return;
    this.active.demoStep = 0;
    this.active.demoTimer = 14;
    this.active.msg = `FASE 1 (ASCOLTA): ${this.active.tiers[this.active.tierIdx].name}`;
  }

  finish(bonusSuccess = true) {
    if (!this.active) return;
    const finished = this.active;
    if (!this.state.data.completedMinigames.includes(finished.id)) {
      this.state.data.completedMinigames.push(finished.id);
    }
    this.state.data.score += bonusSuccess ? 480 : 250;
    this.audio.setDucking(false);
    this.audio.playSfx("correct");
    const cb = this.onComplete;
    this.active = null;
    this.onComplete = null;
    if (cb) cb(finished);
  }

  update(input) {
    if (!this.active) return;
    const m = this.active;
    if (m.type === "basket") this.updateBasket(m, input);
    else if (m.type === "piano") this.updatePiano(m, input);
    else if (m.type === "athletics") this.updateAthletics(m, input);
    else if (m.type === "math") this.updateMath(m, input);
    else if (m.type === "dance") this.updateDance(m, input);
    else if (m.type === "firewall") this.updateFirewall(m, input);
    else if (m.type === "filesorter") this.updateFileSorter(m, input);
  }

  // ===========================================================================
  // 1. BASKET DI CARLO — ANTEPRIMA PARZIALE, FISICA RETE E CANESTRI PROGRESSIVI
  // ===========================================================================
  updateBasket(m, input) {
    if (m.flashTimer > 0) m.flashTimer--;
    if (m.netSwing > 0) m.netSwing = Math.max(0, m.netSwing - 0.08);
    if (m.rimShake > 0) m.rimShake--;

    if (m.movingHoop) {
      m.hoopY += m.hoopDir * 0.65;
      if (m.hoopY < 74 || m.hoopY > 130) m.hoopDir *= -1;
    }

    if (!m.ball) {
      if (input.up) m.angle = Math.min(75, m.angle + 0.75);
      if (input.down) m.angle = Math.max(34, m.angle - 0.75);
      if (input.left) m.power = Math.max(38, m.power - 0.8);
      if (input.right) m.power = Math.min(98, m.power + 0.8);

      const actionHeld = input.jumpDown || input.specialDown;
      if (actionHeld) {
        m.charging = true;
        m.power += m.powerDir * 1.55;
        if (m.power >= 98) {
          m.power = 98;
          m.powerDir = -1;
        } else if (m.power <= 38) {
          m.power = 38;
          m.powerDir = 1;
        }
      } else if (m.charging || input.confirmPressed) {
        m.charging = false;
        const rad = (m.angle * Math.PI) / 180;
        const spd = 5.15 + (m.power / 100) * 5.15;
        m.ball = {
          x: 92,
          y: 194,
          vx: Math.cos(rad) * spd,
          vy: -Math.sin(rad) * spd,
          bounces: 0,
          scoredThisShot: false,
        };
        this.audio.playSfx("jump");
      }
    } else {
      const b = m.ball;
      const prevY = b.y;
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.21;

      const hoopX = 376;
      const boardX = 402;
      if (b.x + 6 >= boardX && b.x - 6 <= boardX + 8 && b.y >= m.hoopY - 34 && b.y <= m.hoopY + 14 && b.vx > 0) {
        b.x = boardX - 6;
        b.vx = -Math.abs(b.vx) * 0.62;
        b.bounces++;
        this.audio.playSfx("basket_bounce");
      }
      const distRim = Math.hypot(b.x - (hoopX - 13), b.y - m.hoopY);
      if (distRim < 7 && !b.scoredThisShot) {
        b.vx = -b.vx * 0.55;
        b.vy = -Math.abs(b.vy) * 0.52;
        b.bounces++;
        m.rimShake = 10;
        this.audio.playSfx("basket_bounce");
      }

      if (
        !b.scoredThisShot &&
        prevY <= m.hoopY + 3 &&
        b.y >= m.hoopY - 3 &&
        b.vy > 0 &&
        b.x >= hoopX - 14 &&
        b.x <= hoopX + 14
      ) {
        b.scoredThisShot = true;
        m.scored++;
        m.netSwing = 1.0;
        m.flashTimer = 26;
        m.msg = b.bounces > 0 ? "CANESTRO DI TABELLONE! Ottima parabola." : "SOLO RETE! Esecuzione pulita.";
        this.audio.playSfx("basket_swish");
      }

      if (b.y > 224 || b.x > SCREEN_W + 20 || b.x < -20) {
        const made = b.scoredThisShot;
        const lastX = b.x;
        m.ball = null;
        if (made) {
          if (m.scored >= m.goalsNeeded) {
            this.state.modifyTrust("carlo", 10);
            this.state.pushConsequence("Serie di tiri completata con Carlo", "#f46d1f");
            this.finish(m.misses <= 2);
            return;
          }
          if (!m.movingHoop) {
            m.hoopY = m.hoopPositions[m.scored % m.hoopPositions.length];
          }
        } else {
          m.misses++;
          if (m.misses >= 3) {
            m.angle = 55;
            m.power = 75;
            m.msg = "Consiglio: prova intorno a 55° di angolo e 75% di spinta.";
          } else {
            m.msg = lastX < 362 ? "Tiro corto sul primo ferro: aumenta leggermente spinta o angolo." : "Tiro lungo sul tabellone: riduci di poco la spinta.";
          }
        }
      }
    }
  }

  // ===========================================================================
  // 2. PIANOFORTE DI FRANCESCO — TASTI BIANCHI E NERI, DURATA E 3 FRASI
  // ===========================================================================
  playChromaticKey(m, keyObj) {
    const expectedObj = m.sequence[m.inputIndex];
    const durSec = expectedObj && expectedObj.key === keyObj.id ? 0.34 * expectedObj.beats : 0.36;
    m.litKeyId = keyObj.id;
    m.litTimer = expectedObj && expectedObj.beats > 1 ? 24 : 15;
    this.audio.playPianoNote(keyObj.id, durSec);

    if (expectedObj && keyObj.id === expectedObj.key) {
      m.inputIndex++;
      if (m.inputIndex >= m.sequence.length) {
        if (m.tierIdx + 1 < m.tiers.length) {
          m.tierIdx++;
          m.sequence = m.tiers[m.tierIdx].notes;
          m.inputIndex = 0;
          this.audio.playSfx("correct");
          this.triggerPianoDemo();
        } else {
          m.msg = "ESECUZIONE COMPLETA! Tutte le frasi armoniche sono in sincrono.";
          m.doneTimer = 34;
        }
      } else {
        m.msg = `FASE 2 (SUONA): Nota ${m.inputIndex}/${m.sequence.length} corretta — prosegui!`;
      }
    } else {
      m.mistakes++;
      m.inputIndex = 0;
      this.audio.playSfx("wrong");
      const targetKey = PIANO_CHROMATIC_KEYS.find((k) => k.id === expectedObj?.key);
      m.msg = `Nota fuori frase (serviva ${targetKey ? targetKey.solfege : "DO"}). Riprova questa frase o premi Riascolta [R].`;
    }
  }

  updatePiano(m, input) {
    if (m.litTimer > 0) m.litTimer--;
    if (m.doneTimer > 0) {
      m.doneTimer--;
      if (m.doneTimer === 0) {
        this.state.modifyTrust("francesco", 12);
        this.state.pushConsequence("Sequenza al pianoforte completata con Francesco", "#38e2d8");
        this.finish(m.mistakes <= 1);
      }
      return;
    }

    // Fase 1: Ascolta la dimostrazione con ritmo reale (semiminime e minime)
    if (m.demoStep >= 0) {
      m.demoTimer--;
      if (m.demoTimer <= 0) {
        if (m.demoStep < m.sequence.length) {
          const stepNote = m.sequence[m.demoStep];
          m.litKeyId = stepNote.key;
          m.litTimer = stepNote.beats > 1 ? 26 : 16;
          this.audio.playPianoNote(stepNote.key, 0.34 * stepNote.beats);
          m.demoStep++;
          m.demoTimer = stepNote.beats > 1 ? 30 : 19;
        } else {
          m.demoStep = -1;
          m.msg = "TOCCA A TE: suona i tasti (bianchi 1-8, neri T Y U I O)";
        }
      }
      return;
    }

    if (input.replayPressed) {
      this.triggerPianoDemo();
      return;
    }
    if (input.leftPressed) {
      m.cursor = (m.cursor + PIANO_CHROMATIC_KEYS.length - 1) % PIANO_CHROMATIC_KEYS.length;
      this.audio.playSfx("blip", 350);
    }
    if (input.rightPressed) {
      m.cursor = (m.cursor + 1) % PIANO_CHROMATIC_KEYS.length;
      this.audio.playSfx("blip", 390);
    }

    // Tasti rapidi delle note nere (T Y U I O): prima dichiarati nell'interfaccia ma non gestiti.
    // Niente conflitti: WASD muove, E interagisce, Q cambia eroe, R riascolta.
    const BLACK_SHORTCUT_CODES = { KeyT: "T", KeyY: "Y", KeyU: "U", KeyI: "I", KeyO: "O" };
    const pressedCodes = input.justPressed || new Set();
    for (const [code, label] of Object.entries(BLACK_SHORTCUT_CODES)) {
      if (pressedCodes.has(code)) {
        const blackKey = PIANO_CHROMATIC_KEYS.find((k) => k.isBlack && k.shortcut === label);
        if (blackKey) {
          m.cursor = PIANO_CHROMATIC_KEYS.findIndex((k) => k.id === blackKey.id);
          this.playChromaticKey(m, blackKey);
          return;
        }
      }
    }

    // Tasti rapidi 1-8 per i tasti bianchi
    if (input.numberPressed >= 1 && input.numberPressed <= 8) {
      const whiteNote = PIANO_SCALE[input.numberPressed - 1]?.note;
      const idx = PIANO_CHROMATIC_KEYS.findIndex((k) => k.id === whiteNote);
      if (idx >= 0) {
        m.cursor = idx;
        this.playChromaticKey(m, PIANO_CHROMATIC_KEYS[idx]);
        return;
      }
    }

    if (input.jumpPressed || input.confirmPressed || input.specialPressed) {
      this.playChromaticKey(m, PIANO_CHROMATIC_KEYS[m.cursor]);
    }
  }

  // ===========================================================================
  // 3. PISTA D'ATLETICA DI RUGGERO — 110M OSTACOLI, RITMO DI CORSA & CRONOMETRO
  // ===========================================================================
  updateAthletics(m, input) {
    if (m.flashTimer > 0) m.flashTimer--;

    if (m.doneTimer > 0) {
      m.doneTimer--;
      if (m.doneTimer === 0) {
        this.state.modifyTrust("ruggero", 12);
        this.state.pushConsequence("Prova in pista superata con Ruggero", "#f45565");
        this.finish(m.clippedHurdles <= 1);
      }
      return;
    }

    if (m.phase === "ready") {
      m.countdown--;
      if (m.countdown === 24) {
        m.msg = "AI VOSTRI POSTI... PRONTI...";
        this.audio.playSfx("blip", 330);
      } else if (m.countdown <= 0) {
        m.phase = "running";
        if (input.right || input.jumpPressed || input.specialPressed) {
          m.speed = 0.22;
          m.msg = "PARTENZA PERFETTA DAI BLOCCHI! Tieni il ritmo e salta gli ostacoli!";
        } else {
          m.speed = 0.16;
          m.msg = "VIA! Tieni premuto DX per spingere sul passo e SALTA prima degli ostacoli!";
        }
        this.audio.playSfx("sprint_dash");
      }
      return;
    }

    if (m.phase === "running") {
      m.timeElapsed += 1 / 60;

      // Accelerazione fluida da velocista (anche automatica assistita se si gioca solo col tocco salto, ma premiata col tasto DX!)
      const targetTopSpeed = input.right ? 0.235 : 0.185;
      if (m.speed < targetTopSpeed) {
        m.speed = Math.min(targetTopSpeed, m.speed + (input.right ? 0.0048 : 0.0028));
      } else {
        m.speed = Math.max(targetTopSpeed, m.speed - 0.002);
      }
      if (input.specialPressed && m.jumpY === 0) {
        m.speed = Math.min(0.255, m.speed + 0.035);
        this.audio.playSfx("sprint_dash");
      }

      // Salto ostacolo calibrato
      if ((input.jumpPressed || input.upPressed) && m.jumpY === 0) {
        m.jumpVy = 4.35;
        this.audio.playSfx("jump");
      }
      if (m.jumpY > 0 || m.jumpVy !== 0) {
        m.jumpY += m.jumpVy;
        m.jumpVy -= 0.28;
        if (m.jumpY <= 0) {
          m.jumpY = 0;
          m.jumpVy = 0;
        }
      }

      m.pos += m.speed;
      m.rivalPos += m.rivalSpeed;
      m.strideTick += m.speed * 2.4;

      // Controllo passaggio sugli ostacoli
      for (const h of m.hurdles) {
        if (h.state !== "upcoming") continue;
        if (Math.abs(m.pos - h.pos) < 1.35) {
          if (m.jumpY >= 12) {
            h.state = "cleared";
            m.cleanHurdles++;
            m.speed = Math.min(0.26, m.speed + 0.018);
            m.flashTimer = 14;
            this.audio.playSfx("hurdle_clear");
            m.msg = `OSTACOLO PULITO (${m.cleanHurdles}/${m.hurdles.length})! Ottimo stacco!`;
          } else if (m.jumpY >= 5) {
            h.state = "skimmed";
            m.cleanHurdles++;
            m.speed = Math.max(0.14, m.speed - 0.015);
            this.audio.playSfx("land");
            m.msg = "Ostacolo sfiorato: passo tenuto, prepara il prossimo!";
          } else if (m.pos >= h.pos + 0.35) {
            h.state = "clipped";
            m.clippedHurdles++;
            m.speed = 0.095;
            this.audio.playSfx("wrong");
            m.msg = "Ostacolo toccato! Riprendi subito il ritmo e stacca un istante prima.";
          }
        }
      }

      // Taglio del traguardo
      if (m.pos >= m.distance) {
        if (m.pos >= m.rivalPos - 1.5 || m.cleanHurdles >= m.hurdles.length - 1) {
          m.phase = "finished";
          m.doneTimer = 38;
          this.audio.playSfx("hurdle_clear");
          m.msg = `TRAGUARDO TAGLIATO IN ${m.timeElapsed.toFixed(2)}s! Linea esterna riattivata!`;
        } else {
          // Riprova immediata e incoraggiante sulla stessa batteria, leggermente più permissiva
          m.pos = 0;
          m.rivalPos = 0;
          m.timeElapsed = 0;
          m.speed = 0.17;
          m.rivalSpeed = Math.max(0.125, m.rivalSpeed - 0.015);
          m.clippedHurdles = 0;
          m.cleanHurdles = 0;
          m.hurdles.forEach((h) => (h.state = "upcoming"));
          m.msg = "Il drone ti ha preceduto sul filo: nuova batteria, stacca sulla tacca bianca!";
        }
      }
    }
  }

  // ===========================================================================
  // 4. MATEMATICA DEL PROF. RANALDO
  // ===========================================================================
  updateMath(m, input) {
    if (m.doneTimer > 0) {
      m.doneTimer--;
      if (m.doneTimer === 0) {
        this.state.modifyTrust("ranaldo", 12);
        this.state.pushConsequence("Parabola verificata col Prof. Ranaldo", "#e5a92b");
        this.finish(true);
      }
      return;
    }

    if (input.leftPressed) {
      m.curA = Math.max(1, m.curA - 1);
      this.audio.playSfx("blip", 300);
    }
    if (input.rightPressed) {
      m.curA = Math.min(5, m.curA + 1);
      this.audio.playSfx("blip", 340);
    }
    if (input.upPressed) {
      m.curK = Math.max(0, m.curK - 1);
      this.audio.playSfx("blip", 420);
    }
    if (input.downPressed) {
      m.curK = Math.min(4, m.curK + 1);
      this.audio.playSfx("blip", 380);
    }

    if (input.jumpPressed || input.confirmPressed || input.specialPressed) {
      if (m.curA === m.targetA && m.curK === m.targetK) {
        m.msg = "Traiettoria verificata: la curva intercetta esattamente i tre punti.";
        this.audio.playSfx("correct");
        m.doneTimer = 30;
      } else {
        this.audio.playSfx("wrong");
        const hintA = m.curA < m.targetA ? "stringi l'apertura (+a)" : m.curA > m.targetA ? "allarga la curva (-a)" : "apertura esatta";
        const hintK = m.curK < m.targetK ? "abbassa il vertice" : m.curK > m.targetK ? "alza il vertice" : "vertice esatto";
        m.msg = `Quasi: ${hintA}, ${hintK}.`;
      }
    }
  }

  // ===========================================================================
  // 5. DIAGNOSTICA DI RETE DI DANIELE (NUOVA SFIDA DEDICATA!)
  // ===========================================================================
  updateDance(m, input) {
    if (m.flashTimer > 0) m.flashTimer--;
    if (m.doneTimer > 0) {
      m.doneTimer--;
      if (m.doneTimer === 0) {
        this.state.modifyTrust("daniele", 12);
        this.state.data.eipassScore = Math.min(100, this.state.data.eipassScore + 8);
        this.state.pushConsequence("Esibizione latino-americana di Daniele completata (+8% EIPASS)", "#f472b6");
        this.finish(m.mistakes <= 2);
      }
      return;
    }

    // Dopo l'ultimo giro non esiste più una routine: niente TypeError.
    const routine = m.routines[m.routineIdx];
    if (!routine || m.phase === "finished") return;
    const moves = routine.moves;

    // FASE 1: Daniele mostra la coreografia (demo), poi tocca a te
    if (m.phase === "ready") {
      m.readyTimer--;
      if (m.readyTimer <= 0) {
        m.phase = "dancing";
        m.stepIdx = 0;
        m.beatTimer = 0;
        m.msg = "RIPETI LA SEQUENZA: segui le frecce a tempo!";
        this.audio.playSfx("blip", 440);
      }
      return;
    }

    // FASE 3: la battuta è conclusa, valuta e passa alla successiva
    if (m.phase === "combo") {
      const good = m.comboResults.filter((r) => r === "ok").length;
      if (good === moves.length) {
        m.crowd = Math.min(100, m.crowd + 22);
        this.audio.playSfx("correct");
        m.flashColor = "#f472b6";
        m.flashTimer = 10;
      } else if (good >= Math.ceil(moves.length / 2)) {
        m.crowd = Math.min(100, m.crowd + 10);
        this.audio.playSfx("goal");
        m.flashColor = "#fde047";
        m.flashTimer = 10;
      } else {
        m.mistakes++;
        this.audio.playSfx("wrong");
        m.flashColor = "#7f1d1d";
        m.flashTimer = 10;
      }

      m.routineIdx++;
      m.phase = "ready";
      m.readyTimer = 70;
      m.stepIdx = 0;
      m.comboIdx = 0;
      m.beatTimer = 0;
      m.comboResults = []; // i risultati del giro precedente non devono restare a schermo

      if (m.routineIdx >= m.routines.length) {
        m.msg = "ESIBIZIONE CHIUSA! Il pubblico dell'Aula Magna è in piedi.";
        m.doneTimer = 34;
        m.phase = "finished";
        m.crowd = Math.min(100, m.crowd + 12);
      } else {
        const nr = m.routines[m.routineIdx];
        m.msg = `Prossima figura: ${nr.style} — ${nr.song}`;
      }
      return;
    }

    // FASE 2: esecuzione a tempo
    if (m.phase === "dancing") {
      // Finestra ritmica: la freccia corrente deve essere premuta prima che il beat scada
      m.beatTimer++;
      if (m.beatTimer > routine.bpm) {
        m.beatTimer = 0;
        m.comboResults[m.stepIdx] = "miss";
        m.stepIdx++;
        this.audio.playSfx("blip", 180);
        if (m.stepIdx >= moves.length) {
          m.phase = "combo";
        }
        return;
      }

      const expected = moves[m.stepIdx];
      for (const move in STEP_KEYS) {
        if (input[STEP_KEYS[move]]) {
          m.beatTimer = 0;
          if (move === expected) {
            m.comboResults[m.stepIdx] = "ok";
            this.audio.playSfx("salsa_step");
          } else {
            m.comboResults[m.stepIdx] = "miss";
            m.mistakes++;
            this.audio.playSfx("wrong");
          }
          m.stepIdx++;
          this.audio.playSfx("blip", 300 + m.stepIdx * 40);
          if (m.stepIdx >= moves.length) m.phase = "combo";
          return;
        }
      }
      return;
    }
  }

  // ===========================================================================
  // 6. FIREWALL CONTESTUALE EIPASS (LETTURA PROTOCOLLO/ORIGINE)
  // ===========================================================================
  updateFirewall(m, input) {
    if (m.doneTimer > 0) {
      m.doneTimer--;
      if (m.doneTimer === 0) {
        this.state.data.eipassScore = Math.min(100, this.state.data.eipassScore + 8);
        this.state.data.modulesCleared[3] = true;
        this.state.modifyTrust("daniele", 6);
        this.state.pushConsequence("Filtro di rete calibrato (+8% EIPASS)", "#4ade80");
        this.finish(m.leaks <= 1);
      }
      return;
    }

    if (input.upPressed) {
      m.lane = Math.max(0, m.lane - 1);
      this.audio.playSfx("blip", 360);
    }
    if (input.downPressed) {
      m.lane = Math.min(2, m.lane + 1);
      this.audio.playSfx("blip", 320);
    }
    if (input.numberPressed >= 1 && input.numberPressed <= 3) {
      m.lane = input.numberPressed - 1;
    }

    m.spawnTimer--;
    if (m.spawnTimer <= 0 && m.packets.length < 3) {
      const tpl = FIREWALL_PACKETS[m.seqCursor % FIREWALL_PACKETS.length];
      m.seqCursor++;
      const lane = (m.seqCursor * 2 + m.blocked) % 3;
      m.packets.push({
        x: 416,
        lane,
        bad: tpl.bad,
        label: tpl.label,
        detail: tpl.detail,
        speed: 1.85,
      });
      m.spawnTimer = 46;
    }

    const shieldX = 112;
    for (let i = m.packets.length - 1; i >= 0; i--) {
      const pk = m.packets[i];
      pk.x -= pk.speed;

      if (Math.abs(pk.x - shieldX) < 18 && pk.lane === m.lane) {
        if (pk.bad) {
          m.blocked++;
          this.audio.playSfx("diag_pulse");
          m.msg = `Isolato traffico sospetto [${pk.label}] (${m.blocked}/${m.needed})`;
          m.packets.splice(i, 1);
          if (m.blocked >= m.needed) {
            m.msg = "FILTRO CALIBRATO! Traffico anomalo fermato senza bloccare la didattica.";
            m.doneTimer = 30;
          }
          continue;
        } else {
          // Se blocchi per sbaglio un pacchetto legittimo ti avvisa chiaramente!
          this.audio.playSfx("blip", 240);
          m.msg = `Attenzione: [${pk.label}] era traffico scolastico legittimo! Lascia liberi i flussi validi.`;
          m.packets.splice(i, 1);
          continue;
        }
      }

      if (pk.x < 64) {
        if (pk.bad) {
          m.leaks++;
          this.audio.playSfx("wrong");
          m.msg = `Passato flusso anomalo [${pk.label}]: spostati sulla sua corsia per fermarlo!`;
        } else {
          m.blocked++;
          this.audio.playSfx("collect");
          m.msg = `Consegnato flusso valido [${pk.label}] (${m.blocked}/${m.needed})`;
          if (m.blocked >= m.needed) {
            m.msg = "FILTRO CALIBRATO! Rete protetta e servizi attivi.";
            m.doneTimer = 30;
          }
        }
        m.packets.splice(i, 1);
      }
    }
  }

  // ===========================================================================
  // 7. ANALISI ALLEGATI & PROVENIENZA (MAI BASATA SULLA SOLA ESTENSIONE!)
  // ===========================================================================
  updateFileSorter(m, input) {
    if (m.flashTimer > 0) m.flashTimer--;
    if (m.doneTimer > 0) {
      m.doneTimer--;
      if (m.doneTimer === 0) {
        this.state.data.eipassScore = Math.min(100, this.state.data.eipassScore + 8);
        this.state.data.modulesCleared[0] = true;
        this.state.pushConsequence("Verifica allegati completata (+8% EIPASS)", "#38bdf8");
        this.finish(m.mistakes <= 1);
      }
      return;
    }

    const chooseSafe = input.leftPressed || input.numberPressed === 1;
    const chooseQuarantine = input.rightPressed || input.numberPressed === 2;
    if (!chooseSafe && !chooseQuarantine) return;

    const item = m.queue[m.idx];
    const ok = (chooseSafe && item.safe) || (chooseQuarantine && !item.safe);
    if (ok) {
      m.correctCount++;
      m.flashColor = "#14532d";
      m.flashTimer = 18;
      this.audio.playSfx("correct");
      m.idx++;
      if (m.idx >= m.queue.length) {
        m.msg = "ANALISI COMPLETATA! Hai valutato origine, contesto ed estensione reale.";
        m.doneTimer = 30;
      } else {
        m.msg = `Corretto: ${item.hint}`;
      }
    } else {
      m.mistakes++;
      m.flashColor = "#7f1d1d";
      m.flashTimer = 22;
      this.audio.playSfx("wrong");
      m.msg = `Rifletti: ${item.hint}`;
    }
  }

  // ===========================================================================
  // RENDERING DEI 7 MINIGIOCHI IN PIXEL-ART NITIDA
  // ===========================================================================
  render(ctx) {
    if (!this.active) return;
    const m = this.active;

    ctx.fillStyle = "rgba(7, 11, 22, 0.93)";
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    drawPixelPanel(ctx, 14, 10, SCREEN_W - 28, SCREEN_H - 20, "#131d36", "#ffd147", "#233559");
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(19, 15, SCREEN_W - 38, 21);
    drawPixelText(ctx, fitPixelText(m.title, SCREEN_W - 58, 1, 1)[0], 26, 22, "#ffd147", 1);

    if (m.type === "basket") this.renderBasket(ctx, m);
    else if (m.type === "piano") this.renderPiano(ctx, m);
    else if (m.type === "athletics") this.renderAthletics(ctx, m);
    else if (m.type === "math") this.renderMath(ctx, m);
    else if (m.type === "dance") this.renderDance(ctx, m);
    else if (m.type === "firewall") this.renderFirewall(ctx, m);
    else if (m.type === "filesorter") this.renderFileSorter(ctx, m);

    ctx.fillStyle = "#090d1a";
    ctx.fillRect(20, SCREEN_H - 31, SCREEN_W - 40, 17);
    // La riga comandi si adatta alla larghezza reale (e lascia spazio al pulsante RIASCOLTA)
    drawPixelText(ctx, fitPixelText(m.msg, SCREEN_W - 60, 1, 1)[0], 25, SCREEN_H - 26, "#e2e8f0", 1);
  }

  renderBasket(ctx, m) {
    ctx.fillStyle = m.flashTimer > 0 ? "#1e3a5f" : "#17253b";
    ctx.fillRect(24, 40, SCREEN_W - 48, 184);
    ctx.fillStyle = "#b45309";
    ctx.fillRect(24, 210, SCREEN_W - 48, 14);
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(24, 210, SCREEN_W - 48, 2);

    drawPixelText(ctx, `CANESTRI: ${m.scored}/${m.goalsNeeded}`, 32, 47, "#ffffff", 1);
    ctx.fillStyle = "#090d1a";
    ctx.fillRect(32, 60, 104, 10);
    ctx.fillStyle = m.power > 86 ? "#ef4444" : "#f97316";
    ctx.fillRect(34, 62, Math.round(m.power), 6);
    drawPixelText(ctx, `SPINTA:${Math.round(m.power)}%  ANGOLO:${Math.round(m.angle)}°`, 32, 74, "#cbd5e1", 1);

    // Pulsante contestuale TIRA su canvas per touch immediato
    if (!m.ball) {
      drawPixelPanel(ctx, 360, 44, 86, 20, "#c2410c", "#ffd147", "#7c2d12");
      drawPixelTextCentered(ctx, "TIRA [INVIO]", 403, 50, "#ffffff", 1);
    }

    if (this.sprites && this.sprites.characters) {
      const pose = m.ball ? 10 : 0;
      ctx.drawImage(this.sprites.characters, pose * 32, 1 * 36, 32, 36, 68, 175, 32, 36);
    }

    // Anteprima parziale (solo prima metà dell'arco: aiuta a leggere l'angolo senza banalizzare il tiro!)
    if (!m.ball) {
      const rad = (m.angle * Math.PI) / 180;
      const spd = 5.15 + (m.power / 100) * 5.15;
      let px = 92;
      let py = 194;
      let vx = Math.cos(rad) * spd;
      let vy = -Math.sin(rad) * spd;
      ctx.fillStyle = "#fde047";
      for (let i = 0; i < 11; i++) {
        px += vx * 1.9;
        py += vy * 1.9 + 0.4;
        vy += 0.4;
        if (i % 2 === 0) ctx.fillRect(Math.round(px), Math.round(py), 3, 3);
      }
    }

    const hoopX = 376 + (m.rimShake > 0 ? (m.rimShake % 2 === 0 ? 1 : -1) : 0);
    ctx.fillStyle = "#64748b";
    ctx.fillRect(408, m.hoopY - 26, 6, 212 - (m.hoopY - 26));
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(402, m.hoopY - 34, 6, 46);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(403, m.hoopY - 12, 4, 12);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(hoopX - 13, m.hoopY - 2, 28, 4);

    // Reticella con deformazione morbida al passaggio della palla
    const swing = Math.round(Math.sin(m.netSwing * Math.PI * 2) * 4 * m.netSwing);
    ctx.strokeStyle = "#e2e8f0";
    ctx.strokeRect(hoopX - 10 + swing, m.hoopY + 2, 20, Math.round(12 + m.netSwing * 4));

    const bx = Math.round(m.ball ? m.ball.x : 94);
    const by = Math.round(m.ball ? m.ball.y : 192);
    ctx.fillStyle = "#090d1a";
    ctx.fillRect(bx - 6, by - 6, 12, 12);
    ctx.fillStyle = "#f97316";
    ctx.fillRect(bx - 5, by - 5, 10, 10);
    ctx.fillStyle = "#fed7aa";
    ctx.fillRect(bx - 3, by - 3, 3, 3);
  }

  renderPiano(ctx, m) {
    const isListening = m.demoStep >= 0;
    // Banner chiarissimo FASE 1 ASCOLTA vs FASE 2 SUONA + Pulsante singolo Riascolta
    drawPixelPanel(
      ctx,
      26,
      41,
      292,
      20,
      isListening ? "#78350f" : "#064e3b",
      isListening ? "#fbbf24" : "#34d399",
      "#0f172a"
    );
    drawPixelText(
      ctx,
      isListening
        ? `FASE 1: ASCOLTA  •  Frase ${m.tierIdx + 1}/${m.tiers.length}`
        : `FASE 2: SUONA TU •  Frase ${m.tierIdx + 1}/${m.tiers.length}`,
      34,
      47,
      "#ffffff",
      1
    );

    // Sottotitolo della prova (prima veniva scartato: ora è leggibile)
    if (m.subtitle) {
      drawPixelText(ctx, fitPixelText(m.subtitle, 292 - 8, 1, 1)[0], 34, 52, "#fde68a", 1);
    }

    // Pulsante RIASCOLTA in alto a destra: nessun tasto lo copre, zona tocco identica
    drawPixelPanel(ctx, 330, 41, 128, 20, "#1e293b", "#38bdf8", "#0f172a");
    drawPixelTextCentered(ctx, "RIASCOLTA [R]", 394, 47, "#bae6fd", 1);


    // Spartito / Barra note con indicazione visiva della DURATA (nota corta vs nota lunga 2 battiti!)
    let sx = 30;
    m.sequence.forEach((stepNote, i) => {
      const kInfo = PIANO_CHROMATIC_KEYS.find((k) => k.id === stepNote.key) || PIANO_CHROMATIC_KEYS[0];
      const w = stepNote.beats > 1 ? 68 : 48;
      const done = i < m.inputIndex;
      const activeDemo = m.demoStep - 1 === i && m.demoStep >= 0;
      const isNext = !isListening && i === m.inputIndex;

      ctx.fillStyle = done ? "#15803d" : activeDemo ? "#ca8a04" : isNext ? "#1e3a8a" : "#1e293b";
      ctx.fillRect(sx, 67, w, 34);
      ctx.strokeStyle = isNext ? "#ffd147" : kInfo.color;
      ctx.strokeRect(sx, 67, w, 34);
      drawPixelText(ctx, kInfo.solfege, sx + 6, 73, "#ffffff", 1);
      drawPixelText(ctx, stepNote.beats > 1 ? "LUNGA 2x" : "1 TEMPO", sx + 6, 87, "#fde047", 1);
      sx += w + 6;
    });

    // Francesco in ascolto accanto allo spartito
    if (this.sprites && this.sprites.characters) {
      const pose = m.litTimer > 0 ? 10 : 0;
      ctx.drawImage(this.sprites.characters, pose * 32, 2 * 36, 32, 36, 418, 66, 32, 36);
    }

    // Tastiera realistica: prima gli 8 tasti bianchi, poi i 5 tasti neri sovrapposti e cliccabili!
    const baseLeft = 44;
    const whiteW = 48;
    const whiteY = 110;
    const whiteH = 108;

    PIANO_CHROMATIC_KEYS.filter((k) => !k.isBlack).forEach((k) => {
      const kx = baseLeft + k.whiteSlot * whiteW;
      const isLit = m.litKeyId === k.id && m.litTimer > 0;
      const isCur = PIANO_CHROMATIC_KEYS[m.cursor]?.id === k.id;
      const dy = isLit ? 3 : 0;

      ctx.fillStyle = isLit ? k.color : "#f8fafc";
      ctx.fillRect(kx, whiteY + dy, whiteW - 3, whiteH - dy);
      ctx.strokeStyle = isCur ? "#ffd147" : "#334155";
      ctx.lineWidth = isCur ? 2 : 1;
      ctx.strokeRect(kx, whiteY + dy, whiteW - 3, whiteH - dy);

      drawPixelText(ctx, k.solfege, kx + 10, whiteY + 80, "#090d1a", 1, null);
      ctx.fillStyle = k.color;
      ctx.fillRect(kx + 6, whiteY + 92, whiteW - 15, 11);
      drawPixelText(ctx, k.shortcut, kx + 19, whiteY + 94, "#090d1a", 1, null);
    });

    PIANO_CHROMATIC_KEYS.filter((k) => k.isBlack).forEach((k) => {
      const kx = Math.round(baseLeft + k.whiteSlot * whiteW);
      const bw = 28;
      const bh = 62;
      const isLit = m.litKeyId === k.id && m.litTimer > 0;
      const isCur = PIANO_CHROMATIC_KEYS[m.cursor]?.id === k.id;
      const dy = isLit ? 2 : 0;

      ctx.fillStyle = isLit ? k.color : "#0f172a";
      ctx.fillRect(kx, whiteY + dy, bw, bh - dy);
      ctx.strokeStyle = isCur ? "#ffd147" : "#64748b";
      ctx.lineWidth = isCur ? 2 : 1;
      ctx.strokeRect(kx, whiteY + dy, bw, bh - dy);
      drawPixelText(ctx, k.solfege, kx + 2, whiteY + 40, "#fde047", 1, null);
      // Scorciatoia del tasto nero: prima non era né scritta né gestita
      // Fondo del tasto NERO (non colorato): la lettera si legge sempre
      ctx.fillStyle = isLit ? k.color : "#090d1a";
      ctx.fillRect(kx + 4, whiteY + 50, bw - 8, 10);
      drawPixelText(ctx, k.shortcut, kx + 11, whiteY + 51, isLit ? "#090d1a" : k.color, 1, null);
    });
    ctx.lineWidth = 1;
  }

  renderAthletics(ctx, m) {
    // Cielo & Cortile del Casardi sullo sfondo
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(24, 40, SCREEN_W - 48, 52);
    ctx.fillStyle = "#d8b88c";
    ctx.fillRect(24, 68, SCREEN_W - 48, 28);
    ctx.fillStyle = "#7c2529";
    ctx.fillRect(24, 64, SCREEN_W - 48, 4);

    // Pista d'atletica rossa tartan a 2 corsie con righe bianche nitide!
    ctx.fillStyle = "#991b1b";
    ctx.fillRect(24, 96, SCREEN_W - 48, 48); // Corsia 2 (Drone cronometro)
    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(24, 146, SCREEN_W - 48, 76); // Corsia 1 (Ruggero)
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(24, 96, SCREEN_W - 48, 2);
    ctx.fillRect(24, 144, SCREEN_W - 48, 2);
    ctx.fillRect(24, 218, SCREEN_W - 48, 3);

    // Barra progresso gara & Cronometro in centesimi (pannello piu alto: testo + barra separati)
    drawPixelPanel(ctx, 30, 44, 198, 22, "#0f172a", "#ffd147", "#1e293b");
    drawPixelText(ctx, `DISTANZA: ${Math.min(m.distance, Math.round(m.pos))}m / ${m.distance}m`, 35, 47, "#ffffff", 1);
    const pct = Math.min(1, m.pos / m.distance);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(34, 59, 190, 3);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(34, 59, Math.round(190 * pct), 3);

    drawPixelPanel(ctx, 236, 44, 112, 22, "#0f172a", "#38bdf8", "#1e293b");
    drawPixelText(ctx, `TEMPO: ${m.timeElapsed.toFixed(2)}s`, 244, 49, "#bae6fd", 1);

    drawPixelPanel(ctx, 354, 44, 96, 22, "#0f172a", "#4ade80", "#1e293b");
    drawPixelText(ctx, `OSTACOLI:${m.cleanHurdles}/${m.hurdles.length}`, 360, 49, "#86efac", 1);

    // Tacche metriche lungo la pista che scorrono con la velocità di Ruggero
    const pxPerMeter = 12;
    const runnerScreenX = 96;

    for (let meter = 0; meter <= m.distance + 15; meter += 10) {
      const sx = Math.round(runnerScreenX + (meter - m.pos) * pxPerMeter);
      if (sx >= 26 && sx <= SCREEN_W - 30) {
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillRect(sx, 210, 2, 8);
      }
    }

    // Filo di lana del Traguardo!
    const finishX = Math.round(runnerScreenX + (m.distance - m.pos) * pxPerMeter);
    if (finishX >= 26 && finishX <= SCREEN_W - 28) {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(finishX, 94, 4, 126);
      ctx.fillStyle = "#fde047";
      ctx.fillRect(finishX - 2, 120, 8, 4);
      ctx.fillRect(finishX - 2, 174, 8, 4);
      drawPixelText(ctx, "ARRIVO", finishX - 14, 84, "#fde047", 1);
    }

    // Ostacoli regolamentari bianco-rossi con tacca di stacco consigliata!
    for (const h of m.hurdles) {
      const hx = Math.round(runnerScreenX + (h.pos - m.pos) * pxPerMeter);
      if (hx < 26 || hx > SCREEN_W - 32) continue;
      // Tacca bianca di stacco prima dell'ostacolo (leggibilissima!)
      ctx.fillStyle = "rgba(254, 240, 138, 0.75)";
      ctx.fillRect(hx - 20, 208, 10, 3);

      const knocked = h.state === "clipped";
      if (knocked) {
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(hx, 204, 18, 4);
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(hx + 12, 200, 8, 5);
      } else {
        ctx.fillStyle = "#334155";
        ctx.fillRect(hx + 2, 184, 3, 24);
        ctx.fillRect(hx + 8, 205, 8, 3);
        ctx.fillStyle = h.state === "cleared" ? "#4ade80" : "#f8fafc";
        ctx.fillRect(hx, 180, 10, 6);
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(hx + 2, 182, 6, 2);
      }
    }

    // Avversario Drone-Cronometro in Corsia 2
    const rivX = Math.round(runnerScreenX + (m.rivalPos - m.pos) * pxPerMeter);
    if (rivX >= 28 && rivX <= SCREEN_W - 44 && this.sprites && this.sprites.enemiesProps) {
      ctx.drawImage(this.sprites.enemiesProps, 64, 0, 32, 32, rivX - 8, 104, 28, 28);
    }

    // Ombra a terra + Ruggero 32x36 animato in corsa o in volo sopra l'ostacolo!
    ctx.fillStyle = "rgba(9, 13, 26, 0.45)";
    ctx.fillRect(runnerScreenX - 4, 206, 22, 4);

    if (this.sprites && this.sprites.characters) {
      let pose = 0;
      if (m.phase === "finished") pose = 11;
      else if (m.jumpY > 4) pose = m.jumpVy >= 0 ? 8 : 9;
      else if (m.phase === "running") pose = 4 + (Math.floor(m.strideTick) % 4);
      ctx.drawImage(
        this.sprites.characters,
        pose * 32,
        3 * 36,
        32,
        36,
        runnerScreenX - 8,
        Math.round(173 - m.jumpY),
        32,
        36
      );
    }
  }

  renderMath(ctx, m) {
    const gx = 36;
    const gy = 42;
    const gw = 310;
    const gh = 178;
    ctx.fillStyle = "#090f1f";
    ctx.fillRect(gx, gy, gw, gh);

    ctx.strokeStyle = "#1e293b";
    for (let x = gx; x <= gx + gw; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x, gy + gh);
      ctx.stroke();
    }
    for (let y = gy; y <= gy + gh; y += 18) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx + gw, y);
      ctx.stroke();
    }

    const cx = gx + gw / 2;
    // Scala calibrata: con a=5 e k=4 la curva e i nodi restano DENTRO la griglia (prima uscivano a y=238).
    const APEX_TOP = gy + 34;
    const APEX_STEP = 16;
    const CURVE_K = 700;
    const evalY = (aIdx, kIdx, dx) =>
      Math.min(gy + gh - 4, APEX_TOP + kIdx * APEX_STEP + (aIdx * dx * dx) / CURVE_K);

    [-100, 0, 100].forEach((dx) => {
      const nx = Math.round(cx + dx);
      const ny = Math.round(evalY(m.targetA, m.targetK, dx));
      ctx.strokeStyle = "#38e2d8";
      ctx.lineWidth = 2;
      ctx.strokeRect(nx - 6, ny - 6, 12, 12);
    });

    const solved = m.curA === m.targetA && m.curK === m.targetK;
    ctx.fillStyle = solved ? "#4ade80" : "#ffd147";
    for (let dx = -135; dx <= 135; dx += 3) {
      const py = evalY(m.curA, m.curK, dx);
      ctx.fillRect(Math.round(cx + dx), Math.round(py), 3, 3);
    }
    ctx.lineWidth = 1;
    drawPixelText(ctx, `y = ${m.curA}a*x^2 + k(${m.curK})`, gx + 8, gy + 8, "#ffd147", 1);

    // Pannello laterale controlli chiari anche da telefono!
    drawPixelPanel(ctx, 354, 42, 100, 178, "#162038", "#38bdf8", "#0f172a");
    drawPixelText(ctx, `APERTURA: ${m.curA}`, 362, 52, "#fde047", 1);
    drawPixelPanel(ctx, 362, 66, 38, 22, "#1e3a8a", "#93c5fd", "#0f172a");
    drawPixelTextCentered(ctx, "-a", 381, 73, "#ffffff", 1);
    drawPixelPanel(ctx, 408, 66, 38, 22, "#1e3a8a", "#93c5fd", "#0f172a");
    drawPixelTextCentered(ctx, "+a", 427, 73, "#ffffff", 1);

    drawPixelText(ctx, `VERTICE: ${m.curK}`, 362, 102, "#38e2d8", 1);
    drawPixelPanel(ctx, 362, 116, 38, 22, "#1e3a8a", "#93c5fd", "#0f172a");
    drawPixelTextCentered(ctx, "SU", 381, 123, "#ffffff", 1);
    drawPixelPanel(ctx, 408, 116, 38, 22, "#1e3a8a", "#93c5fd", "#0f172a");
    drawPixelTextCentered(ctx, "GIU", 427, 123, "#ffffff", 1);

    drawPixelPanel(ctx, 362, 154, 84, 26, "#15803d", "#ffd147", "#0f172a");
    drawPixelTextCentered(ctx, "VERIFICA", 404, 163, "#ffffff", 1);

    if (this.sprites && this.sprites.characters) {
      const pose = solved ? 11 : 0;
      ctx.drawImage(this.sprites.characters, pose * 32, 0 * 36, 32, 36, 388, 182, 32, 36);
    }
  }

  renderDance(ctx, m) {
    const bg = m.flashTimer > 0 && m.flashColor ? m.flashColor : "#1a0f24";
    ctx.fillStyle = bg;
    ctx.fillRect(24, 40, SCREEN_W - 48, 184);

    const routine = m.routines[Math.min(m.routineIdx, m.routines.length - 1)];

    // Intestazione: giro corrente e brano (lo stile è già nella barra del titolo)
    drawPixelText(ctx, `Giro ${Math.min(m.routineIdx + 1, m.routines.length)}/${m.routines.length} • ${routine.song}`, 34, 47, "#fde047", 1);
    drawPixelText(ctx, routine.style, 34, 61, "#f472b6", 1);

    // Barra del gradimento del pubblico
    drawPixelText(ctx, "PUBBLICO", 330, 47, "#c084fc", 1);
    ctx.strokeStyle = "#475569";
    ctx.strokeRect(330, 58, 110, 9);
    ctx.fillStyle = "#f472b6";
    ctx.fillRect(331, 59, Math.round(108 * (m.crowd / 100)), 7);

    // Traccia della coreografia: passi già eseguiti, corrente ed in arrivo
    const stepW = Math.min(42, Math.floor(360 / Math.max(1, routine.moves.length)));
    const totalW = stepW * routine.moves.length;
    const startX = 34 + Math.max(0, Math.floor((380 - totalW) / 2));
    routine.moves.forEach((move, idx) => {
      const sx = startX + idx * stepW;
      const res = m.comboResults[idx];
      const isCur = m.phase === "dancing" && idx === m.stepIdx;
      const col = DANCE_COMBO_COLORS[move] || "#38bdf8";
      const fill =
        res === "ok" ? "#14532d" : res === "miss" ? "#7f1d1d" : isCur ? "#3b0f2e" : "#151f36";
      drawPixelPanel(ctx, sx, 84, stepW - 4, 34, fill, isCur ? "#ffffff" : col, "#0f172a");
      drawPixelTextCentered(ctx, DANCE_COMBO_GLYPHS[move] || "?", sx + (stepW - 4) / 2, 90, isCur ? "#ffffff" : col, 1);
      if (res === "ok") drawPixelText(ctx, "OK", sx + 4, 104, "#4ade80", 1);
      if (res === "miss") drawPixelText(ctx, "X", sx + 4, 104, "#f87171", 1);
      // Scorciatoia tasto, centrata e sempre dentro la casella (la stessa che invia il tocco)
      const stepKeyLabel = { fwd: "SU", back: "GIU", left: "SX", right: "DX", turn: "SAL", clap: "ABI" }[move] || "";
      drawPixelTextCentered(ctx, stepKeyLabel, sx + (stepW - 4) / 2, 104, "#94a3b8", 1);
    });

    // Indicatore di tempo: la freccia corrente deve essere premuta prima che la barra si svuoti
    if (m.phase === "dancing") {
      const ratio = Math.max(0, 1 - m.beatTimer / routine.bpm);
      ctx.strokeStyle = "#64748b";
      ctx.strokeRect(34, 124, 380, 6);
      ctx.fillStyle = ratio > 0.4 ? "#4ade80" : "#f87171";
      ctx.fillRect(35, 125, Math.round(378 * ratio), 4);
    } else if (m.phase === "ready") {
      drawPixelText(ctx, `OSSERVA I PASSI... ${Math.ceil(m.readyTimer / 30)}`, 34, 124, "#fde047", 1);
    }

    // Suggerimento / messaggio di stato
    drawPixelText(ctx, fitPixelText(m.msg, 412, 1, 1)[0], 34, 136, "#e9d5ff", 1);

    // Legenda comandi (chiara anche su touch: la D-Pad + Salta + Abilità)
    drawPixelPanel(ctx, 34, 150, 262, 66, "#0f172a", "#c084fc", "#1e293b");
    drawPixelText(ctx, "SU = AVANTI      GIU = INDIETRO", 42, 158, "#38bdf8", 1);
    drawPixelText(ctx, "SX = SINISTRA    DX = DESTRA", 42, 172, "#4ade80", 1);
    drawPixelText(ctx, "SALTA = GIRO     ABILITÀ = BATTITO", 42, 186, "#fde047", 1);
    drawPixelText(ctx, fitPixelText(routine.hint, 246, 1, 1)[0], 42, 200, "#c084fc", 1);

    // Daniele in posa di salsa (pose 10 = azione, 11 = vittoria)
    if (this.sprites && this.sprites.characters) {
      const pose = m.doneTimer > 0 ? 11 : m.phase === "dancing" ? 10 : 4;
      const bob = m.phase === "dancing" ? (Math.floor(Date.now() / 120) % 2) * 2 : 0;
      ctx.drawImage(this.sprites.characters, pose * 32, 4 * 36, 32, 36, 404, 112 - bob, 32, 36);
    }
    drawPixelTextCentered(ctx, "SALSA", 420, 154, "#f472b6", 1);
  }

  renderFirewall(ctx, m) {
    ctx.fillStyle = "#0b1326";
    ctx.fillRect(24, 40, SCREEN_W - 48, 184);

    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(30, 48, 36, 166);
    ctx.strokeStyle = "#38bdf8";
    ctx.strokeRect(30, 48, 36, 166);
    drawPixelText(ctx, "RETE", 36, 118, "#67e8f9", 1);
    drawPixelText(ctx, "23PC", 36, 132, "#fde047", 1);

    for (let l = 0; l < 3; l++) {
      const ly = 78 + l * 52;
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(70, ly + 12, 374, 3);
      drawPixelText(ctx, `CORSIA ${l + 1}`, 74, ly - 6, m.lane === l ? "#fde047" : "#64748b", 1);
    }

    const sy = 64 + m.lane * 52;
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(104, sy, 16, 36);
    ctx.strokeStyle = "#ffd147";
    ctx.strokeRect(104, sy, 16, 36);

    // Pacchetti con grafica tecnica uniforme: il giocatore legge origine e protocollo!
    for (const pk of m.packets) {
      const py = 64 + pk.lane * 52;
      const px = Math.min(308, Math.round(pk.x) - 24);
      drawPixelPanel(ctx, px, py, 138, 32, "#162238", "#60a5fa", "#0f172a");
      drawPixelText(ctx, pk.label.slice(0, 21), px + 5, py + 6, "#ffffff", 1);
      drawPixelText(ctx, pk.detail.slice(0, 21), px + 5, py + 18, "#cbd5e1", 1);
    }

    drawPixelText(ctx, `FLUSSI GESTITI: ${m.blocked}/${m.needed}`, 296, 46, "#4ade80", 1);
  }

  renderFileSorter(ctx, m) {
    ctx.fillStyle = m.flashTimer > 0 && m.flashColor ? m.flashColor : "#0f172a";
    ctx.fillRect(24, 40, SCREEN_W - 48, 184);

    drawPixelText(ctx, `ALLEGATO ${Math.min(m.idx + 1, m.queue.length)}/${m.queue.length}`, 34, 46, "#fde047", 1);

    const cur = m.queue[Math.min(m.idx, m.queue.length - 1)];
    if (cur) {
      drawPixelPanel(ctx, 34, 58, SCREEN_W - 68, 68, "#1e293b", "#38bdf8", "#0f172a");
      drawPixelText(ctx, `FILE:     ${cur.name}`.slice(0, 64), 44, 66, "#ffffff", 1);
      drawPixelText(ctx, `ORIGINE:  ${cur.origin}`.slice(0, 64), 44, 82, "#bae6fd", 1);
      drawPixelText(ctx, `CONTESTO: ${cur.signal}`.slice(0, 64), 44, 98, "#fde047", 1);
    }

    drawPixelPanel(ctx, 34, 136, 196, 78, "#0d3b2e", "#4ade80", "#14532d");
    drawPixelTextCentered(ctx, "[SX / 1] AUTORIZZA", 132, 148, "#4ade80", 1);
    drawPixelTextCentered(ctx, "Origine e contesto", 132, 168, "#ffffff", 1);
    drawPixelTextCentered(ctx, "coerenti e verificati", 132, 182, "#bbf7d0", 1);

    drawPixelPanel(ctx, 250, 136, 196, 78, "#45121b", "#f87171", "#7f1d1d");
    drawPixelTextCentered(ctx, "[DX / 2] QUARANTENA", 348, 148, "#f87171", 1);
    drawPixelTextCentered(ctx, "Mittente dubbio, macro", 348, 168, "#ffffff", 1);
    drawPixelTextCentered(ctx, "o estensione rischiosa", 348, 182, "#fecaca", 1);
  }
}
