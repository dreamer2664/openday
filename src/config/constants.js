// Configurazione globale v3.0 — 5 Protagonisti giocabili (Carlo, Prof. Ranaldo, Daniele, Ruggero, Francesco) + Comprimari Casardi

export const SCREEN_W = 480;
export const SCREEN_H = 270;
export const TILE = 16;

export const CHAR_SPRITE_W = 32;
export const CHAR_SPRITE_H = 36;
export const PORTRAIT_SIZE = 64;

export const PHYSICS = {
  gravity: 0.33,
  maxFall: 6.2,
  groundAccel: 0.46,
  airAccel: 0.33,
  groundFriction: 0.76,
  airDrag: 0.91,
  baseSpeed: 2.4,
  baseJump: -6.25,
  jumpCutMultiplier: 0.48,
  coyoteFrames: 9,
  jumpBufferFrames: 9,
  invulnFrames: 65,
};

export const CHARACTERS = {
  carlo: {
    id: "carlo",
    row: 1,
    name: "Carlo",
    shortName: "CAR",
    fullName: "Carlo",
    role: "Protagonista & Cestista",
    passion: "Basket",
    color: "#f46d1f",
    accent: "#1d4ed8",
    speedMult: 1.05,
    jumpMult: 1.09,
    abilityName: "Parabola a Canestro",
    abilityDesc: "Lancia il pallone a rimbalzo per attivare i canestri-relè in quota e colpire i bersagli sopraelevati.",
    cooldownMax: 40,
    blipFreq: 305,
  },
  ranaldo: {
    id: "ranaldo",
    row: 0,
    name: "Prof. Ranaldo",
    shortName: "RAN",
    fullName: "Ranaldo",
    role: "Docente di Matematica",
    passion: "Matematica & Geometria",
    color: "#e5a92b",
    accent: "#1e3252",
    speedMult: 1.0,
    jumpMult: 1.0,
    abilityName: "Vettore Cartesiano",
    abilityDesc: "Traccia pedane temporanee lungo un arco geometrico e lancia la squadra aurea.",
    cooldownMax: 112,
    blipFreq: 215,
  },
  daniele: {
    id: "daniele",
    row: 4,
    name: "Daniele",
    shortName: "DAN",
    fullName: "Daniele",
    role: "Ballerino Latino-Americano",
    passion: "Salsa, Bachata & Cha-Cha-Chá",
    color: "#e0b25c",
    accent: "#7c5a33",
    speedMult: 1.04,
    jumpMult: 1.03,
    abilityName: "Passo di Salsa",
    abilityDesc:
      "Traccia una figura di ballo che apre i varchi ritmici, disorienta i pop-up corrotti e tiene unita la squadra a tempo.",
    cooldownMax: 48,
    blipFreq: 335,
  },
  ruggero: {
    id: "ruggero",
    row: 3,
    name: "Ruggero",
    shortName: "RUG",
    fullName: "Ruggero",
    role: "Velocista & Ostacolista",
    passion: "Atletica Leggera",
    color: "#f45565",
    accent: "#991b1b",
    speedMult: 1.16,
    jumpMult: 1.05,
    abilityName: "Scatto Ostacoli",
    abilityDesc: "Slancio atletico ad alta velocità che sfonda le barriere incrinate, supera i varchi e ribalta i blocchi corazzati.",
    cooldownMax: 42,
    blipFreq: 350,
  },
  francesco: {
    id: "francesco",
    row: 2,
    name: "Francesco",
    shortName: "FRA",
    fullName: "Francesco",
    role: "Pianista",
    passion: "Pianoforte & Musica",
    color: "#5eead4",
    accent: "#0f766e",
    speedMult: 1.02,
    jumpMult: 1.03,
    abilityName: "Accordo di Risonanza",
    abilityDesc: "Propaga un'onda armonica che rende solidi i Ponti Sonori e dissolve il rumore dei pop-up.",
    cooldownMax: 64,
    blipFreq: 392,
  },
  // Comprimari scolastici (NPC animati nelle aule e in biblioteca)
  sofia: {
    id: "sofia",
    row: 5,
    name: "Sofia",
    shortName: "Sofia",
    role: "Redazione di Pegaso",
    passion: "Giornalismo Scolastico",
    color: "#fbbf24",
    accent: "#5b21b6",
    speedMult: 1.0,
    jumpMult: 1.0,
    abilityName: "Verifica Fonti",
    abilityDesc: "Cura la redazione del giornale studentesco Pegaso.",
    cooldownMax: 60,
    blipFreq: 425,
  },
  mimmo: {
    id: "mimmo",
    row: 6,
    name: "Mimmo",
    shortName: "Mimmo",
    role: "Collaboratore Scolastico",
    passion: "Cura dell'Istituto",
    color: "#60a5fa",
    accent: "#1e3a5f",
    speedMult: 1.0,
    jumpMult: 1.0,
    abilityName: "Chiavi dell'Atrio",
    abilityDesc: "Conosce ogni ingresso e quadro elettrico della Sede Centrale.",
    cooldownMax: 60,
    blipFreq: 245,
  },
};

// ORDINE UFFICIALE DEI 5 SLOT (identico a: tasti 1-5, pillole mobile, striscia eroi e pausa)
// 1 Carlo · 2 Ranaldo · 3 Daniele · 4 Ruggero · 5 Francesco
export const CHAR_ORDER = ["carlo", "ranaldo", "daniele", "ruggero", "francesco"];

export const EIPASS_MODULES = [
  { id: 1, code: "MOD. 1", title: "I fondamenti dell'ICT", icon: "CPU" },
  { id: 2, code: "MOD. 2", title: "Navigare e cercare informazioni sul Web", icon: "WEB" },
  { id: 3, code: "MOD. 3", title: "Comunicare e collaborare in Rete", icon: "PEC" },
  { id: 4, code: "MOD. 4", title: "Sicurezza informatica", icon: "SEC" },
  { id: 5, code: "MOD. 5", title: "Elaborazione testi", icon: "DOC" },
  { id: 6, code: "MOD. 6", title: "Foglio di calcolo", icon: "XLS" },
  { id: 7, code: "MOD. 7", title: "Presentazioni multimediali", icon: "PPT" },
];

export const PEGASO_LORE = [
  {
    id: "peg_01",
    title: "Pegaso #1 — Dal progetto al 1937",
    text: "La sede di Via d'Aragona 100 nacque su progetto razionalista dell'ing. Arturo Boccassini: avviata nei primi anni Trenta, fu inaugurata nel 1937.",
  },
  {
    id: "peg_02",
    title: "Pegaso #2 — Gli anni a Palazzo Della Marra",
    text: "Prima della sede attuale, il Liceo Comunale di Barletta — nato negli anni Venti accanto al Regio Ginnasio Bonello — stava al secondo piano di Palazzo Della Marra.",
  },
  {
    id: "peg_03",
    title: "Pegaso #3 — L'intitolazione ad Alfredo Casardi",
    text: "Divenuto liceo statale, nel dopoguerra l'istituto fu intitolato al tenente barlettano Alfredo Casardi, Medaglia d'Oro al Valor Militare.",
  },
  {
    id: "peg_04",
    title: "Pegaso #4 — Tre indirizzi e tre plessi",
    text: "Oggi il Casardi riunisce Classico, Scienze Umane e Musicale tra la Sede Centrale di Via d'Aragona 100, la Succursale di Via Botticelli 1 e il plesso di Via Santo Stefano.",
  },
  {
    id: "peg_05",
    title: "Pegaso #5 — Il Laboratorio Multimediale e Musicale",
    text: "Realizzato con fondi europei FESR, il laboratorio integra 23 postazioni in rete con master keyboard e software di notazione, oltre a scanner, stampante e LIM.",
  },
  {
    id: "peg_06",
    title: "Pegaso #6 — Laboratori modulari e scienze",
    text: "Accanto alla tradizione umanistica, i laboratori scientifici hanno postazioni modulari e schermi interattivi per attività sperimentali e percorsi biomedici.",
  },
  {
    id: "peg_07",
    title: "Pegaso #7 — La Biblioteca d'Istituto",
    text: "La biblioteca della Sede Centrale, aperta a studenti e docenti, custodisce un ampio fondo storico e umanistico usato per ricerche e approfondimenti.",
  },
  {
    id: "peg_08",
    title: "Pegaso #8 — Iniziative lungo l'anno scolastico",
    text: "Oltre agli Open Day per l'orientamento delle famiglie, l'istituto partecipa alla Notte Nazionale del Liceo Classico e alla Pomeridiana delle Scienze Umane.",
  },
  {
    id: "peg_09",
    title: "Pegaso #9 — Competenze EIPASS 7 Moduli",
    text: "Il percorso EIPASS 7 Moduli User verifica l'uso consapevole degli strumenti digitali: file, fonti, posta, sicurezza, testi, fogli di calcolo e presentazioni.",
  },
  {
    id: "peg_10",
    title: "Pegaso #10 — Sport e pista a scuola",
    text: "Tra palestra coperta e spazi esterni, l'atletica leggera e gli sport di squadra fanno parte della vita quotidiana degli studenti.",
  },
  {
    id: "peg_11",
    title: "Pegaso #11 — L'Aula Magna e la musica d'insieme",
    text: "Con le alte vetrate razionaliste, i leggii e il pianoforte a coda, l'Aula Magna ospita le prove del Liceo Musicale e gli incontri culturali.",
  },
  {
    id: "peg_12",
    title: "Pegaso #12 — La redazione di Pegaso",
    text: "Hai ricomposto i dodici numeri d'archivio di Pegaso, il giornale studentesco del Casardi curato dal laboratorio di giornalismo.",
  },
];

// Testi dei comandi: ogni descrizione sta su UNA riga nel pannello 480x270.
export const CONTROLS_HELP = [
  { keys: "FRECCE / A-D", action: "Muoviti e schiva nell'arena del Boss" },
  { keys: "SPAZIO / Z", action: "Salto calibrato (breve o prolungato)" },
  { keys: "X / K / SHIFT", action: "Abilità dell'eroe (SU = mira alta)" },
  { keys: "C / L", action: "Assist di squadra di un compagno" },
  { keys: "E / INVIO", action: "Parla, apri porte, usa postazioni" },
  { keys: "1-5 / Q", action: "Cambia eroe tra i membri sbloccati" },
  { keys: "E (vicino)", action: "Prende in campo il compagno accanto" },
  { keys: "G", action: "Squadra al seguito: ON/OFF" },
  { keys: "P / ESC  |  V", action: "Pausa e Dossier | [V] filtro CRT" },
  { keys: "M  |  F9", action: "Audio muto | [F9] riavvio rapido" },
  { keys: "Y", action: "Schermo intero (solo versione PC)" },
  { keys: "F1  |  ?", action: "Apre o chiude questa guida comandi" },
];
