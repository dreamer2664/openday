// Motore Chiptune 8-Bit Originale v3.0 — Leitmotiv del Casardi, Transizioni Morbide, 3 Fasi Boss,
// Sintetizzatore Pianoforte Cromatico (Tasti Bianchi + Neri) e 22 SFX calibrati.

const NOTE_HZ = {
  R: 0,
  C2: 65.41, "C#2": 69.3, D2: 73.42, Eb2: 77.78, E2: 82.41, F2: 87.31, "F#2": 92.5, G2: 98.0, "G#2": 103.83, Ab2: 103.83, A2: 110.0, Bb2: 116.54, B2: 123.47,
  C3: 130.81, "C#3": 138.59, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, "F#3": 185.0, G3: 196.0, "G#3": 207.65, Ab3: 207.65, A3: 220.0, Bb3: 233.08, B3: 246.94,
  C4: 261.63, "C#4": 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, "F#4": 369.99, G4: 392.0, "G#4": 415.3, Ab4: 415.3, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, "C#5": 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, "F#5": 739.99, G5: 783.99, "G#5": 830.61, Ab5: 830.61, A5: 880.0, Bb5: 932.33, B5: 987.77,
  C6: 1046.5, "C#6": 1108.73, D6: 1174.66, Eb6: 1244.51, E6: 1318.51, F6: 1396.91, "F#6": 1479.98, G6: 1567.98, "G#6": 1661.22, A6: 1760.0, Bb6: 1864.66, B6: 1975.53,
};

// Scala diatonica 8 tasti bianchi (compatibilità rapida tasti 1-8)
export const PIANO_SCALE = [
  { idx: 0, note: "C4", solfege: "DO", keyLabel: "1", color: "#ef4444", isBlack: false },
  { idx: 1, note: "D4", solfege: "RE", keyLabel: "2", color: "#f97316", isBlack: false },
  { idx: 2, note: "E4", solfege: "MI", keyLabel: "3", color: "#eab308", isBlack: false },
  { idx: 3, note: "F4", solfege: "FA", keyLabel: "4", color: "#22c55e", isBlack: false },
  { idx: 4, note: "G4", solfege: "SOL", keyLabel: "5", color: "#06b6d4", isBlack: false },
  { idx: 5, note: "A4", solfege: "LA", keyLabel: "6", color: "#3b82f6", isBlack: false },
  { idx: 6, note: "B4", solfege: "SI", keyLabel: "7", color: "#a855f7", isBlack: false },
  { idx: 7, note: "C5", solfege: "DO+", keyLabel: "8", color: "#ec4899", isBlack: false },
];

// Tastiera cromatica completa (8 tasti bianchi + 5 tasti neri reali) per il Pianoforte di Francesco v3.0
export const PIANO_CHROMATIC_KEYS = [
  { id: "C4", solfege: "DO", whiteSlot: 0, isBlack: false, shortcut: "1", color: "#ef4444" },
  { id: "C#4", solfege: "DO#", whiteSlot: 0.68, isBlack: true, shortcut: "T", color: "#f43f5e" },
  { id: "D4", solfege: "RE", whiteSlot: 1, isBlack: false, shortcut: "2", color: "#f97316" },
  { id: "Eb4", solfege: "MIb", whiteSlot: 1.72, isBlack: true, shortcut: "Y", color: "#fb923c" },
  { id: "E4", solfege: "MI", whiteSlot: 2, isBlack: false, shortcut: "3", color: "#eab308" },
  { id: "F4", solfege: "FA", whiteSlot: 3, isBlack: false, shortcut: "4", color: "#22c55e" },
  { id: "F#4", solfege: "FA#", whiteSlot: 3.66, isBlack: true, shortcut: "U", color: "#10b981" },
  { id: "G4", solfege: "SOL", whiteSlot: 4, isBlack: false, shortcut: "5", color: "#06b6d4" },
  { id: "Ab4", solfege: "LAb", whiteSlot: 4.7, isBlack: true, shortcut: "I", color: "#38bdf8" },
  { id: "A4", solfege: "LA", whiteSlot: 5, isBlack: false, shortcut: "6", color: "#3b82f6" },
  { id: "Bb4", solfege: "SIb", whiteSlot: 5.74, isBlack: true, shortcut: "O", color: "#818cf8" },
  { id: "B4", solfege: "SI", whiteSlot: 6, isBlack: false, shortcut: "7", color: "#a855f7" },
  { id: "C5", solfege: "DO+", whiteSlot: 7, isBlack: false, shortcut: "8", color: "#ec4899" },
];

// Colonna Sonora v3.0 costruita attorno al Motivo Conduttore del Casardi (C5 - G4 - A4 - E5 - D5 - C5)
const TRACKS = {
  // 1. TEMA PRINCIPALE — Luminoso, cantabile, apertura A + sviluppo B
  main: {
    bpm: 136,
    leadWave: "square",
    harmWave: "triangle",
    lead: [
      "C5", "-", "G4", "A4", "E5", "-", "D5", "C5",  "D5", "-", "E5", "F5", "G5", "-", "E5", "-",
      "A5", "-", "G5", "E5", "F5", "-", "D5", "C5",  "D5", "-", "E5", "C5", "D5", "-", "G4", "-",
      "C5", "-", "G4", "A4", "E5", "-", "G5", "A5",  "F5", "-", "E5", "D5", "E5", "-", "C5", "-",
      "D5", "E5", "F5", "G5", "A5", "-", "G5", "F5",  "E5", "-", "D5", "-", "C5", "-", "-", "R",
      // Sezione B
      "E5", "-", "G5", "A5", "B5", "-", "G5", "E5",  "A5", "-", "G5", "F5", "E5", "-", "C5", "-",
      "D5", "-", "F5", "A5", "G5", "-", "F5", "E5",  "D5", "C5", "B4", "C5", "D5", "-", "G4", "-",
      "C5", "-", "G4", "A4", "E5", "-", "C6", "-",  "B5", "A5", "G5", "F5", "E5", "-", "C5", "-",
      "F5", "-", "E5", "D5", "G5", "-", "B4", "-",  "C5", "-", "G4", "C5", "C5", "-", "-", "R",
    ],
    harm: [
      "E4", "-", "E4", "F4", "C5", "-", "B4", "A4",  "B4", "-", "C5", "D5", "E5", "-", "C5", "-",
      "C5", "-", "E5", "C5", "A4", "-", "A4", "G4",  "B4", "-", "C5", "A4", "B4", "-", "F4", "-",
      "E4", "-", "E4", "F4", "C5", "-", "E5", "E5",  "D5", "-", "C5", "B4", "C5", "-", "A4", "-",
      "B4", "C5", "D5", "E5", "F5", "-", "E5", "D5",  "C5", "-", "B4", "-", "E4", "-", "-", "R",
      "G4", "C5", "E5", "C5", "G4", "B4", "E5", "B4",  "F4", "A4", "C5", "A4", "G4", "C5", "E5", "G4",
      "F4", "A4", "D5", "C5", "B4", "-", "D5", "C5",  "B4", "A4", "G4", "A4", "B4", "-", "F4", "-",
      "E4", "-", "E4", "F4", "C5", "-", "E5", "-",  "D5", "C5", "B4", "A4", "G4", "-", "E4", "-",
      "A4", "-", "G4", "F4", "B4", "-", "F4", "-",  "E4", "-", "E4", "G4", "E4", "-", "-", "R",
    ],
    bass: [
      "C3", "-", "C4", "-", "A2", "-", "A3", "-",  "G2", "-", "B2", "-", "C3", "-", "G2", "-",
      "F2", "-", "F3", "-", "D3", "-", "F3", "-",  "G2", "-", "D3", "-", "G2", "-", "B2", "-",
      "C3", "-", "C4", "-", "A2", "-", "C3", "-",  "D3", "-", "A2", "-", "A2", "-", "E3", "-",
      "F2", "-", "A2", "-", "D3", "-", "G2", "-",  "C3", "-", "G2", "-", "C3", "-", "G2", "-",
      "C3", "-", "G3", "-", "E2", "-", "B2", "-",  "F2", "-", "C3", "-", "C3", "-", "G2", "-",
      "D3", "-", "A2", "-", "E3", "-", "C3", "-",  "G2", "-", "D3", "-", "G2", "-", "B2", "-",
      "C3", "-", "E3", "-", "A2", "-", "E3", "-",  "F2", "-", "A2", "-", "C3", "-", "G2", "-",
      "D3", "-", "F3", "-", "G2", "-", "D3", "-",  "C3", "-", "G2", "C3", "C3", "-", "-", "R",
    ],
    drums: "KhShKhShKhShKSSh",
  },

  // 2. CORRIDOI & ATRIO — Curioso, arioso, morbido per lunghe esplorazioni
  explore: {
    bpm: 116,
    leadWave: "triangle",
    harmWave: "square",
    lead: [
      "E5", "-", "C5", "D5", "E5", "-", "G4", "-",  "A4", "-", "C5", "D5", "E5", "-", "C5", "-",
      "F5", "-", "E5", "D5", "C5", "-", "A4", "-",  "B4", "C5", "D5", "B4", "G4", "-", "-", "R",
      "C5", "-", "G4", "A4", "E5", "-", "D5", "C5",  "A5", "-", "G5", "E5", "D5", "-", "C5", "-",
      "F5", "-", "E5", "D5", "E5", "-", "C5", "A4",  "D5", "-", "B4", "G4", "C5", "-", "-", "R",
      // Sezione B
      "G5", "-", "E5", "C5", "A4", "-", "C5", "E5",  "F5", "-", "D5", "B4", "G4", "-", "B4", "D5",
      "E5", "-", "C5", "A4", "F4", "A4", "C5", "E5",  "D5", "-", "C5", "B4", "C5", "-", "-", "R",
    ],
    harm: [
      "G4", "C5", "E4", "G4", "G4", "C5", "E4", "G4",  "F4", "A4", "C4", "F4", "G4", "C5", "E4", "G4",
      "A4", "C5", "F4", "A4", "E4", "A4", "C4", "E4",  "D4", "G4", "B3", "D4", "B3", "D4", "G3", "B3",
      "E4", "G4", "C4", "F4", "G4", "C5", "F4", "E4",  "C5", "F4", "B4", "G4", "F#4", "A4", "D4", "F#4",
      "A4", "C5", "F4", "A4", "G4", "C5", "E4", "C4",  "F4", "A4", "D4", "B3", "E4", "G4", "C4", "R",
      "C5", "G4", "E4", "G4", "C5", "E4", "A4", "C5",  "A4", "F4", "D4", "F4", "B4", "D4", "G4", "B4",
      "G4", "E4", "C4", "E4", "A4", "F4", "A4", "C5",  "F4", "A4", "G4", "F4", "E4", "G4", "C4", "R",
    ],
    bass: [
      "C3", "-", "-", "G2", "C3", "-", "E3", "-",  "F2", "-", "-", "A2", "C3", "-", "G2", "-",
      "D3", "-", "-", "F2", "A2", "-", "E2", "-",  "G2", "-", "-", "D3", "G2", "-", "B2", "-",
      "C3", "-", "-", "E2", "A2", "-", "G2", "-",  "F2", "-", "E2", "-", "D2", "-", "A2", "-",
      "D3", "-", "G2", "-", "C3", "-", "A2", "-",  "G2", "-", "G2", "-", "C3", "-", "-", "R",
      "C3", "-", "G2", "-", "A2", "-", "E2", "-",  "D3", "-", "A2", "-", "G2", "-", "D3", "-",
      "A2", "-", "E2", "-", "F2", "-", "C3", "-",  "G2", "-", "D3", "-", "C3", "-", "-", "R",
    ],
    drums: "K.h.S.h.K.h.S.h.",
  },

  // 3. LABORATORIO MULTIMEDIALE — Ritmato, pulito, mai stridente
  lab: {
    bpm: 126,
    leadWave: "square",
    harmWave: "triangle",
    lead: [
      "C5", "G4", "A4", "C5", "E5", "-", "D5", "C5",  "G5", "-", "E5", "D5", "C5", "D5", "E5", "-",
      "F5", "-", "E5", "C5", "D5", "-", "C5", "A4",  "G4", "A4", "C5", "D5", "C5", "-", "-", "R",
      "E5", "G5", "A5", "G5", "E5", "-", "C5", "-",  "F5", "G5", "A5", "F5", "D5", "-", "G4", "-",
      "C5", "D5", "E5", "G5", "A5", "-", "G5", "E5",  "F5", "E5", "D5", "B4", "C5", "-", "-", "R",
    ],
    harm: [
      "E4", "C4", "F4", "E4", "G4", "C5", "B4", "G4",  "B4", "G4", "C5", "B4", "A4", "B4", "C5", "G4",
      "A4", "F4", "G4", "E4", "F4", "D4", "E4", "C4",  "D4", "F4", "E4", "G4", "E4", "G4", "C4", "R",
      "G4", "B4", "C5", "B4", "G4", "E4", "G4", "E4",  "A4", "B4", "C5", "A4", "F4", "D4", "B3", "D4",
      "E4", "F4", "G4", "B4", "C5", "F4", "B4", "G4",  "A4", "G4", "F4", "D4", "E4", "-", "-", "R",
    ],
    bass: [
      "C3", "C3", "R", "G2", "A2", "-", "E2", "-",  "E2", "-", "G2", "-", "A2", "-", "G2", "-",
      "F2", "-", "C3", "-", "D3", "-", "A2", "-",  "G2", "-", "D3", "-", "C3", "-", "G2", "-",
      "C3", "-", "E3", "-", "A2", "-", "G2", "-",  "F2", "-", "A2", "-", "G2", "-", "B2", "-",
      "C3", "-", "E3", "-", "F2", "-", "E2", "-",  "D3", "-", "G2", "-", "C3", "-", "-", "R",
    ],
    drums: "KhShKhSKKhShKSSh",
  },

  // 4. CORTILE & PISTA ATLETICA — Energico, slanciato, richiama il motivo del Casardi nella sezione B
  sports: {
    bpm: 144,
    leadWave: "square",
    harmWave: "square",
    lead: [
      "G5", "-", "E5", "G5", "A5", "-", "G5", "-",  "E5", "D5", "C5", "D5", "E5", "-", "C5", "-",
      "F5", "-", "D5", "F5", "G5", "-", "F5", "-",  "E5", "D5", "C5", "B4", "D5", "-", "G4", "-",
      "C5", "-", "G4", "A4", "E5", "-", "G5", "A5",  "C6", "-", "A5", "G5", "E5", "-", "C5", "-",
      "D5", "E5", "F5", "G5", "A5", "-", "B5", "-",  "C6", "-", "G5", "E5", "C5", "-", "-", "R",
    ],
    harm: [
      "C5", "G4", "C5", "E5", "C5", "A4", "C5", "E5",  "G4", "F4", "E4", "F4", "G4", "C5", "E4", "G4",
      "A4", "F4", "A4", "D5", "B4", "G4", "B4", "D5",  "G4", "F4", "E4", "D4", "B4", "G4", "D4", "B3",
      "E4", "G4", "E4", "F4", "C5", "G4", "C5", "E5",  "F5", "C5", "F5", "D5", "C5", "G4", "E4", "G4",
      "F4", "G4", "A4", "B4", "C5", "F4", "D5", "G4",  "E5", "-", "C5", "G4", "E4", "-", "-", "R",
    ],
    bass: [
      "C3", "C4", "G3", "C4", "F3", "F3", "C3", "E3",  "C3", "-", "A2", "-", "C3", "G3", "E3", "G2",
      "D3", "D4", "A3", "D3", "G2", "G3", "D3", "G2",  "C3", "-", "A2", "-", "G2", "D3", "B2", "G2",
      "C3", "G3", "E3", "F3", "A2", "E3", "C3", "A2",  "F2", "C3", "F3", "G2", "C3", "G3", "E3", "C3",
      "D3", "-", "F3", "-", "F3", "-", "G3", "-",  "C3", "-", "G2", "C3", "C3", "-", "-", "R",
    ],
    drums: "KhSKKhShKhSKKSSS",
  },

  // 5. BIBLIOTECA & PEGASO — Intimo, contrappuntistico, cameristico
  library: {
    bpm: 110,
    leadWave: "triangle",
    harmWave: "square",
    lead: [
      "A4", "C5", "E5", "A5", "G5", "-", "E5", "-",  "F5", "E5", "D5", "C5", "B4", "-", "E4", "-",
      "C5", "-", "G4", "A4", "E5", "-", "D5", "C5",  "B4", "C5", "D5", "B4", "A4", "-", "-", "R",
      "C5", "E5", "G5", "C6", "B5", "A5", "G5", "F5",  "E5", "D5", "C5", "B4", "A4", "-", "C5", "-",
      "D5", "F5", "E5", "D5", "C5", "B4", "A4", "G#4", "A4", "-", "E4", "G#4", "A4", "-", "-", "R",
    ],
    harm: [
      "C4", "E4", "A4", "C5", "B4", "-", "G4", "-",  "A4", "G4", "F4", "E4", "G#4", "-", "B3", "-",
      "E4", "-", "E4", "F4", "G4", "-", "F4", "E4",  "D4", "E4", "F4", "D4", "C4", "-", "-", "R",
      "E4", "G4", "C5", "E5", "D5", "C5", "B4", "A4",  "G4", "F4", "E4", "D4", "C4", "-", "E4", "-",
      "F4", "A4", "G#4", "F4", "E4", "D4", "C4", "B3", "C4", "-", "B3", "E4", "C4", "-", "-", "R",
    ],
    bass: [
      "A2", "-", "C3", "-", "E3", "-", "C3", "-",  "D3", "-", "A2", "-", "E2", "-", "G#2", "-",
      "A2", "-", "E2", "-", "C3", "-", "G2", "-",  "G2", "-", "E2", "-", "A2", "-", "E2", "-",
      "C3", "-", "E3", "-", "G2", "-", "B2", "-",  "C3", "-", "G2", "-", "A2", "-", "G2", "-",
      "F2", "-", "B2", "-", "E2", "-", "E3", "-",  "A2", "-", "E2", "-", "A2", "-", "-", "R",
    ],
    drums: "K...S.h.K.h.S...",
  },

  // 6A. BOSS FASE 1 (Analisi — 144 BPM, tensione misurata e lucida)
  boss: {
    bpm: 144,
    leadWave: "square",
    harmWave: "triangle",
    lead: [
      "D5", "-", "A4", "D5", "F5", "-", "E5", "D5",  "C#5", "-", "E5", "G5", "F5", "-", "D5", "-",
      "Bb4", "-", "D5", "F5", "A5", "-", "G5", "F5",  "E5", "D5", "C#5", "B4", "A4", "-", "-", "R",
      "C5", "-", "G4", "A4", "F5", "-", "E5", "D5",  "G5", "-", "F5", "E5", "A5", "-", "E5", "-",
      "F5", "E5", "D5", "F5", "E5", "D5", "C#5", "E5",  "D5", "-", "A4", "C#5", "D5", "-", "-", "R",
    ],
    harm: [
      "F4", "-", "F4", "A4", "D5", "-", "C5", "Bb4",  "A4", "-", "C#5", "E5", "D5", "-", "A4", "-",
      "G4", "-", "Bb4", "D5", "F5", "-", "E5", "D5",  "C#5", "B4", "A4", "G4", "F4", "-", "-", "R",
      "E4", "-", "E4", "F4", "D5", "-", "C5", "Bb4",  "D5", "-", "D5", "C5", "C#5", "-", "A4", "-",
      "D5", "C5", "Bb4", "D5", "C#5", "B4", "A4", "G4",  "F4", "-", "E4", "A4", "F4", "-", "-", "R",
    ],
    bass: [
      "D2", "-", "D3", "-", "Bb2", "-", "F2", "-",  "A2", "-", "E3", "-", "D2", "-", "A2", "-",
      "G2", "-", "D3", "-", "F2", "-", "D3", "-",  "A2", "-", "E2", "-", "A2", "-", "E2", "-",
      "C3", "-", "G2", "-", "Bb2", "-", "F2", "-",  "G2", "-", "D3", "-", "A2", "-", "E3", "-",
      "Bb2", "-", "G2", "-", "A2", "-", "A2", "-",  "D2", "-", "A2", "-", "D3", "-", "-", "R",
    ],
    drums: "Kh.hS.h.Kh.hS.S.",
  },

  // 6B. BOSS FASE 2 (Manipolazione — 152 BPM, basso incalzante e armonie più serrate)
  boss_p2: {
    bpm: 152,
    leadWave: "square",
    harmWave: "sawtooth",
    lead: [
      "D5", "A4", "D5", "F5", "A5", "-", "G5", "F5",  "E5", "F5", "G5", "E5", "F5", "-", "D5", "-",
      "Bb4", "D5", "G5", "Bb5", "A5", "-", "G5", "F5",  "E5", "D5", "C#5", "E5", "A4", "-", "-", "R",
      "C5", "-", "G4", "A4", "F5", "-", "E5", "D5",  "G5", "A5", "Bb5", "G5", "A5", "-", "E5", "-",
      "F5", "G5", "A5", "D6", "C#6", "A5", "G5", "E5",  "D5", "-", "A4", "C#5", "D5", "-", "-", "R",
    ],
    harm: [
      "F4", "F4", "A4", "D5", "F5", "-", "E5", "D5",  "C#5", "D5", "E5", "C#5", "D5", "-", "A4", "-",
      "G4", "Bb4", "D5", "G5", "F5", "-", "E5", "D5",  "C#5", "B4", "A4", "G4", "F4", "-", "-", "R",
      "E4", "-", "E4", "F4", "D5", "-", "C5", "Bb4",  "D5", "F5", "G5", "D5", "C#5", "-", "A4", "-",
      "D5", "E5", "F5", "A5", "A5", "E5", "C#5", "A4",  "F4", "-", "E4", "A4", "F4", "-", "-", "R",
    ],
    bass: [
      "D2", "D3", "D2", "D3", "F2", "F3", "G2", "A2",  "A2", "E3", "A2", "G2", "D2", "A2", "F2", "D2",
      "G2", "G3", "G2", "G3", "F2", "F3", "D2", "D3",  "A2", "A2", "E2", "G2", "A2", "G2", "F2", "E2",
      "C3", "C3", "E2", "F2", "Bb2", "Bb2", "G2", "F2",  "G2", "D3", "G2", "Bb2", "A2", "E3", "A2", "G2",
      "D2", "F2", "A2", "D3", "A2", "E3", "A2", "C#3",  "D2", "-", "A2", "-", "D3", "-", "-", "R",
    ],
    drums: "KhSKKhShKhSKKSSh",
  },

  // 6C. BOSS FASE 3 (Verifica Finale — 160 BPM, contrappunto eroico col motivo del Casardi che riemerge!)
  boss_p3: {
    bpm: 160,
    leadWave: "square",
    harmWave: "sawtooth",
    lead: [
      "A5", "F5", "D5", "A5", "Bb5", "-", "A5", "G5",  "F5", "G5", "A5", "F5", "E5", "-", "A4", "-",
      "C5", "-", "G4", "A4", "E5", "-", "F5", "G5",  "A5", "-", "B5", "C#6", "D6", "-", "A5", "-",
      "Bb5", "A5", "G5", "F5", "G5", "F5", "E5", "D5",  "C5", "D5", "E5", "G5", "A5", "-", "G5", "F5",
      "E5", "F5", "G5", "A5", "Bb5", "A5", "G5", "E5",  "D5", "-", "D6", "-", "D5", "-", "-", "R",
    ],
    harm: [
      "D5", "A4", "F4", "D5", "D5", "-", "C5", "Bb4",  "A4", "Bb4", "C5", "A4", "C#5", "-", "E4", "-",
      "E4", "-", "E4", "F4", "C5", "-", "D5", "E5",  "F5", "-", "G5", "A5", "F5", "-", "D5", "-",
      "D5", "C5", "Bb4", "A4", "Bb4", "A4", "G4", "F4",  "E4", "F4", "G4", "C5", "C5", "-", "B4", "A4",
      "G4", "A4", "Bb4", "C5", "D5", "C5", "Bb4", "C#5",  "F4", "-", "F5", "-", "F4", "-", "-", "R",
    ],
    bass: [
      "D2", "D3", "D2", "D3", "G2", "G3", "C3", "C3",  "F2", "F3", "D2", "D3", "A2", "E3", "A2", "G2",
      "C3", "G2", "E2", "F2", "C3", "C3", "D3", "E3",  "F2", "C3", "G2", "A2", "D3", "A2", "F2", "D2",
      "G2", "D3", "G2", "F2", "E2", "B2", "E2", "D2",  "C2", "G2", "C3", "E3", "F2", "C3", "D3", "F2",
      "G2", "D3", "E2", "A2", "G2", "F2", "E2", "A2",  "D2", "-", "A2", "D3", "D2", "-", "-", "R",
    ],
    drums: "KhSKKhSKKhSKKSSS",
  },

  // 7. VITTORIA & EPILOGO A 5 VOCI — Risoluzione calda del Motivo del Casardi
  victory: {
    bpm: 132,
    leadWave: "square",
    harmWave: "triangle",
    lead: [
      "C5", "-", "G4", "A4", "E5", "-", "G5", "-",  "A5", "-", "F5", "A5", "G5", "-", "E5", "-",
      "F5", "G5", "A5", "B5", "C6", "-", "G5", "E5",  "F5", "-", "D5", "G5", "C5", "-", "-", "R",
    ],
    harm: [
      "E4", "-", "E4", "F4", "C5", "-", "E5", "-",  "C5", "-", "A4", "C5", "B4", "-", "G4", "-",
      "A4", "B4", "C5", "D5", "E5", "-", "C5", "G4",  "A4", "-", "B4", "B4", "E4", "-", "-", "R",
    ],
    bass: [
      "C3", "-", "E3", "F3", "C3", "-", "E3", "-",  "F3", "-", "C3", "-", "C3", "-", "G2", "-",
      "F2", "-", "D3", "-", "C3", "-", "E3", "C3",  "D3", "-", "G2", "-", "C3", "-", "-", "R",
    ],
    drums: "KhShKhSSKhShKSSS",
  },
};

export class ChiptuneAudioEngine {
  constructor(prefs = { musicVol: 0.7, sfxVol: 0.85, muted: false }) {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noiseBuffer = null;

    this.musicVol = prefs.musicVol ?? 0.7;
    this.sfxVol = prefs.sfxVol ?? 0.85;
    this.muted = !!prefs.muted;
    this.ducked = false;

    this.currentTrackKey = null;
    this.stepIndex = 0;
    this.nextStepTime = 0;
    this.schedulerId = null;
    this.unlocked = false;

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (!this.ctx) return;
        if (document.hidden) {
          if (this.ctx.state === "running") this.ctx.suspend().catch(() => {});
        } else if (!this.muted && this.unlocked) {
          this.ctx.resume().catch(() => {});
        }
      });
    }
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
      this.buildNoiseBuffer();
      this.applyVolumes();
    }
    if (this.ctx.state === "suspended" || this.ctx.state === "interrupted") {
      try {
        const silent = this.ctx.createBuffer(1, 1, 22050);
        const src = this.ctx.createBufferSource();
        src.buffer = silent;
        src.connect(this.ctx.destination);
        src.start(0);
      } catch (_e) {}
      this.ctx
        .resume()
        .then(() => {
          this.unlocked = this.ctx && this.ctx.state === "running";
          this.applyVolumes();
          if (this.currentTrackKey && !this.schedulerId) {
            this.startScheduler();
          }
        })
        .catch(() => {});
    }
    this.unlocked = this.ctx.state === "running";
    if (this.currentTrackKey && !this.schedulerId && this.unlocked) {
      this.startScheduler();
    }
    return this.unlocked;
  }

  buildNoiseBuffer() {
    if (!this.ctx) return;
    const len = this.ctx.sampleRate * 0.4;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let lfsr = 0x53a1;
    for (let i = 0; i < len; i++) {
      lfsr = (lfsr >> 1) ^ (-(lfsr & 1) & 0xb400);
      data[i] = lfsr & 1 ? 0.8 : -0.8;
    }
    this.noiseBuffer = buf;
  }

  applyVolumes() {
    if (!this.ctx || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const duckMult = this.ducked ? 0.36 : 1.0;
    const mTarget = this.muted ? 0.0001 : Math.max(0.0001, this.musicVol * 0.25 * duckMult);
    const sTarget = this.muted ? 0.0001 : Math.max(0.0001, this.sfxVol * 0.4);
    this.musicGain.gain.setTargetAtTime(mTarget, now, 0.045);
    this.sfxGain.gain.setTargetAtTime(sTarget, now, 0.02);
  }

  setMusicVolume(v) {
    this.musicVol = Math.max(0, Math.min(1, v));
    this.applyVolumes();
  }

  setSfxVolume(v) {
    this.sfxVol = Math.max(0, Math.min(1, v));
    this.applyVolumes();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.applyVolumes();
    return this.muted;
  }

  setDucking(active) {
    if (this.ducked !== active) {
      this.ducked = active;
      this.applyVolumes();
    }
  }

  playTrack(trackKey, keepBeatAlignment = false) {
    if (!TRACKS[trackKey]) return;
    if (this.currentTrackKey === trackKey && this.schedulerId) return;

    // Morbida micro-dissolvenza sul cambio traccia per evitare stacchi bruschi
    if (this.ctx && this.musicGain && !this.muted && this.currentTrackKey) {
      const now = this.ctx.currentTime;
      const duckMult = this.ducked ? 0.36 : 1.0;
      const target = Math.max(0.0001, this.musicVol * 0.25 * duckMult);
      this.musicGain.gain.setTargetAtTime(Math.max(0.0001, target * 0.35), now, 0.025);
      this.musicGain.gain.setTargetAtTime(target, now + 0.07, 0.06);
    }

    this.currentTrackKey = trackKey;
    if (!keepBeatAlignment) {
      this.stepIndex = 0;
    }
    if (this.ctx) {
      if (!this.schedulerId) {
        this.nextStepTime = this.ctx.currentTime + 0.03;
        this.startScheduler();
      }
    }
  }

  setBossMusicPhase(phase = 1) {
    const target = phase >= 3 ? "boss_p3" : phase === 2 ? "boss_p2" : "boss";
    if (this.currentTrackKey !== target) {
      this.playTrack(target, true);
    }
  }

  stopTrack() {
    this.currentTrackKey = null;
    if (this.schedulerId) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
  }

  startScheduler() {
    if (this.schedulerId) clearInterval(this.schedulerId);
    this.nextStepTime = this.ctx.currentTime + 0.04;
    this.schedulerId = setInterval(() => this.scheduleSteps(), 35);
  }

  scheduleSteps() {
    if (!this.ctx || !this.currentTrackKey || this.ctx.state !== "running") return;
    const track = TRACKS[this.currentTrackKey];
    if (!track) return;

    const stepDur = 60.0 / track.bpm / 4.0;
    const totalSteps = track.lead.length;

    while (this.nextStepTime < this.ctx.currentTime + 0.14) {
      const idx = this.stepIndex % totalSteps;
      this.scheduleVoiceNote(track.lead, idx, this.nextStepTime, stepDur, track.leadWave, 0.23);
      this.scheduleVoiceNote(track.harm, idx, this.nextStepTime, stepDur, track.harmWave, 0.13);
      this.scheduleVoiceNote(track.bass, idx, this.nextStepTime, stepDur, "triangle", 0.33);
      this.scheduleDrum(track.drums[idx % track.drums.length], this.nextStepTime);

      this.nextStepTime += stepDur;
      this.stepIndex = (this.stepIndex + 1) % totalSteps;
    }
  }

  scheduleVoiceNote(seq, idx, time, stepDur, waveType, gainLevel) {
    const token = seq[idx];
    if (!token || token === "-" || token === "R") return;
    const freq = NOTE_HZ[token];
    if (!freq) return;

    let hold = 1;
    while (idx + hold < seq.length && seq[idx + hold] === "-") {
      hold++;
    }
    const dur = stepDur * hold * 0.94;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, time);

    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(gainLevel, time + 0.009);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, gainLevel * 0.56), time + dur * 0.84);
    g.gain.linearRampToValueAtTime(0.0001, time + dur);

    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + dur + 0.01);
  }

  scheduleDrum(symbol, time) {
    if (!symbol || symbol === ".") return;
    if (symbol === "K") {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(142, time);
      osc.frequency.exponentialRampToValueAtTime(42, time + 0.075);
      g.gain.setValueAtTime(0.3, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.085);
    } else if ((symbol === "S" || symbol === "h") && this.noiseBuffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = symbol === "S" ? "bandpass" : "highpass";
      filter.frequency.setValueAtTime(symbol === "S" ? 1800 : 5600, time);
      const g = this.ctx.createGain();
      const dur = symbol === "S" ? 0.072 : 0.026;
      g.gain.setValueAtTime(symbol === "S" ? 0.15 : 0.065, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      src.connect(filter);
      filter.connect(g);
      g.connect(this.musicGain);
      src.start(time);
      src.stop(time + dur + 0.01);
    }
  }

  /**
   * Sintetizzatore Pianoforte a Coda Cromatico per Francesco (accetta indice 0..7 oppure nota es. "Eb4", "F#4", "C5")
   */
  playPianoNote(noteOrScaleIdx, duration = 0.45) {
    if (!this.ctx || this.muted) return;
    let noteName = "C4";
    if (typeof noteOrScaleIdx === "string") {
      noteName = noteOrScaleIdx;
    } else {
      const item = PIANO_SCALE[Math.max(0, Math.min(PIANO_SCALE.length - 1, noteOrScaleIdx))];
      noteName = item ? item.note : "C4";
    }
    const freq = NOTE_HZ[noteName] || 261.63;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const g2 = this.ctx.createGain();

    osc1.type = "triangle";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);

    g2.gain.setValueAtTime(0.22, now);
    g2.gain.exponentialRampToValueAtTime(0.008, now + duration * 0.65);

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.56, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(g);
    osc2.connect(g2);
    g2.connect(g);
    g.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.025);
    osc2.stop(now + duration + 0.025);
  }

  playSfx(type, customFreq = 320) {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    const now = this.ctx.currentTime;

    const tone = (f0, f1, dur, wave = "square", vol = 0.36, delay = 0) => {
      const t = now + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(25, f1), t + dur);
      }
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + dur + 0.01);
    };

    switch (type) {
      case "jump":
        tone(215, 585, 0.12, "square", 0.32);
        break;
      case "land":
        tone(135, 62, 0.05, "triangle", 0.26);
        break;
      case "collect":
        tone(587.33, 587.33, 0.048, "square", 0.28);
        tone(880.0, 880.0, 0.085, "square", 0.3, 0.048);
        break;
      case "pegaso":
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
          tone(f, f, 0.08, "triangle", 0.38, i * 0.055)
        );
        break;
      case "damage":
        tone(260, 78, 0.2, "sawtooth", 0.42);
        break;
      case "interact":
        tone(440, 660, 0.07, "triangle", 0.3);
        break;
      case "confirm":
        tone(523.25, 783.99, 0.085, "triangle", 0.32);
        break;
      case "blip":
        tone(customFreq, customFreq * 1.05, 0.03, "triangle", 0.16);
        break;
      case "correct":
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
          tone(f, f, 0.075, "triangle", 0.38, i * 0.052)
        );
        break;
      case "wrong":
        tone(277.18, 233.08, 0.11, "sawtooth", 0.34, 0);
        tone(220.0, 164.81, 0.18, "sawtooth", 0.36, 0.11);
        break;
      case "door":
        [196, 261.63, 329.63, 392].forEach((f, i) =>
          tone(f, f, 0.065, "triangle", 0.36, i * 0.052)
        );
        break;
      case "mechanism":
        tone(330, 660, 0.075, "triangle", 0.3, 0);
        tone(440, 880, 0.095, "triangle", 0.3, 0.068);
        break;
      case "basket_bounce":
        tone(235, 98, 0.085, "triangle", 0.4);
        break;
      case "basket_swish":
        tone(784, 1175, 0.1, "triangle", 0.36, 0);
        tone(1046.5, 1318.5, 0.13, "triangle", 0.34, 0.065);
        break;
      case "sprint_dash":
      case "football_kick":
        tone(240, 680, 0.085, "triangle", 0.36, 0);
        tone(520, 320, 0.07, "square", 0.24, 0.04);
        break;
      case "hurdle_clear":
      case "goal":
        [587.33, 783.99, 987.77, 1174.66].forEach((f, i) =>
          tone(f, f, 0.085, "triangle", 0.38, i * 0.055)
        );
        break;
      case "salsa_step":
      case "diag_pulse":
        // Conga + clave sintetica: il suono ritmico di Daniele
        tone(523.25, 1046.5, 0.06, "triangle", 0.3, 0);
        tone(1760, 1320, 0.045, "square", 0.16, 0.02);
        tone(783.99, 1174.66, 0.07, "sine", 0.22, 0.05);
        break;
      case "clave":
        tone(2200, 1900, 0.035, "square", 0.18);
        break;
      case "telegraph":
        tone(440, 554.37, 0.055, "triangle", 0.2);
        break;
      case "resonance":
        this.playPianoNote("C4", 0.3);
        setTimeout(() => this.playPianoNote("E4", 0.3), 42);
        setTimeout(() => this.playPianoNote("G4", 0.36), 84);
        break;
      case "stomp":
        tone(180, 420, 0.095, "square", 0.34);
        break;
      case "assist":
        [392.0, 523.25, 659.25, 783.99].forEach((f, i) =>
          tone(f, f * 1.03, 0.06, "triangle", 0.34, i * 0.038)
        );
        break;
      case "portal":
        tone(320, 640, 0.1, "triangle", 0.34, 0);
        tone(480, 960, 0.11, "triangle", 0.26, 0.055);
        break;
      case "midboss_hit":
        tone(140, 65, 0.13, "sawtooth", 0.4, 0);
        tone(420, 210, 0.085, "square", 0.28, 0.03);
        break;
      default:
        tone(440, 440, 0.05, "triangle", 0.22);
    }
  }

  playCharMotif(charId) {
    if (!this.ctx || this.muted) return;
    if (charId === "carlo") {
      this.playSfx("blip", 329.63);
      setTimeout(() => this.playSfx("blip", 440.0), 42);
      setTimeout(() => this.playSfx("blip", 523.25), 84);
    } else if (charId === "ranaldo") {
      this.playSfx("blip", 261.63);
      setTimeout(() => this.playSfx("blip", 392.0), 45);
    } else if (charId === "daniele") {
      this.playSfx("blip", 392.0);
      setTimeout(() => this.playSfx("blip", 587.33), 42);
    } else if (charId === "ruggero") {
      this.playSfx("blip", 349.23);
      setTimeout(() => this.playSfx("blip", 523.25), 38);
      setTimeout(() => this.playSfx("blip", 659.25), 76);
    } else if (charId === "francesco") {
      this.playPianoNote("E4", 0.2);
      setTimeout(() => this.playPianoNote("G4", 0.24), 48);
    }
  }
}
