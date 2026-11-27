// Mappe Architettoniche v2.0 progettate su misura per il Liceo Classico Statale "A. Casardi" di Barletta:
//   A) MODALITÀ OPEN DAY (4 Zone ricche + Aula esplorabile — 7–10 minuti autonomi con tutti i 5 protagonisti)
//   B) CAMPAGNA COMPLETA (6 Capitoli x 3 Zone = 18 Livelli + Aule/Redazione segrete + 2 Mid-Boss + Boss Finale — 35–45 min)

import { RoomBlueprint } from "./levelBuilder.js";

// =============================================================================
// MODALITÀ OPEN DAY (7–10 MINUTI)
// =============================================================================
export function buildOpenDayLevels() {
  const rooms = [];

  // ZONA OD-1: Piazzale Monumentale & Ingresso Via d'Aragona 100
  const od1 = new RoomBlueprint({
    id: "od_1",
    chapter: 1,
    name: "Via d'Aragona 100 — Ingresso Monumentale",
    subtitle: "Modalità Open Day (1/4) • Prof. Ranaldo & Carlo",
    theme: "facade",
    music: "main",
    cols: 88,
    rows: 17,
  });
  od1
    .dialogueTrigger(5, 15, "od_intro", true)
    .addSign(8, 14, "FRECCE/AD: Muovi | SPAZIO: Salta | [X]: Abilità | [C]: Assist!")
    .plat(14, 12, 5)
    .tokensArc(14, 11, 4)
    .plat(21, 9, 5)
    // Segreto sopra la loggia delle bandiere IT/UE!
    .plat(28, 6, 6)
    .pegaso(30, 6, "peg_01")
    .pit(26, 3)
    .enemy(35, 15, "spambot", 4)
    .banter(37, 15, "carlo", "Guarda le due colonne del 1937: perfette per un rimbalzo alto!")
    .addSign(41, 14, "CARLO [2] + [X]: Centra il Canestro-Relè in alto!")
    .plat(42, 12, 4)
    .hoopSwitch(48, 8, "gate_od1_hoop")
    .gate(50, 11, 4, "gate_od1_hoop")
    .checkpoint(53, 15)
    // Terminale Ispettore Email Phishing davanti al portone del Casardi!
    .terminal(60, 15, "qz_phishing_gate", "gate_od1_term")
    .gate(65, 11, 4, "gate_od1_term")
    .addSign(68, 14, "PROF. RANALDO [1] + [X]: Piattaforme paraboliche!")
    .pit(70, 5)
    .tokensArc(70, 11, 3)
    .enemy(78, 15, "slime", 3)
    .exitDoor(83, 15, "ENTRA NEI CORRIDOI");
  rooms.push(od1);

  // ZONA OD-2: Corridoio Giallo-Bianco, Aula 7 Esplorabile & Incontro con Ruggero!
  const od2 = new RoomBlueprint({
    id: "od_2",
    chapter: 2,
    name: "Corridoio Storico & Cortile Sportivo",
    subtitle: "Modalità Open Day (2/4) • La prova atletica di Ruggero!",
    theme: "corridor",
    music: "explore",
    cols: 92,
    rows: 17,
  });
  od2
    .archProp(6, 15, "bust")
    .plat(14, 11, 5)
    .plat(20, 8, 5)
    .enemy(20, 15, "spambot", 4)
    .tokensArc(20, 7, 4)
    .pit(26, 3)
    .dialogueTrigger(32, 15, "od_meet_ruggero", true, "ruggero")
    .crackedWall(39, 12, 3)
    .enemy(45, 15, "crab", 4)
    .banter(48, 15, "ruggero", "Col tasto [C] ci passiamo palla in combinazione rapida!")
    .checkpoint(51, 15)
    .plat(54, 11, 4)
    .movingPlat(60, 11, 66, 11, 4, 0.95)
    .pit(59, 9)
    .pegaso(63, 7, "peg_05")
    .enemy(69, 15, "megaphone", 2)
    .addSign(72, 14, "Premi [E] sui Blocchi: Sfida Atletica di Ruggero!")
    .minigameStation(
      75,
      15,
      "athletics",
      { id: "od_mg_athletics", title: "RUGGERO - 110m OSTACOLI SULLA PISTA!", hard: false },
      "gate_od2_goal"
    )
    .gate(80, 11, 4, "gate_od2_goal")
    .heart(83, 15)
    .exitDoor(87, 15, "LABORATORIO 23 PC");
  // Porta opzionale Aula 7 ben distanziata da piattaforme e busti!
  const od2Sub = od2.buildSubRoomAlcove("od2_aula7", 10, 15, "ENTRA IN AULA 7", "AULA 7 • 5C L.C.");
  od2.dialogueTrigger(od2Sub.subStartC + 16, od2Sub.floorR, "npc_mimmo_atrio", false, "mimmo");
  rooms.push(od2);

  // ZONA OD-3: Laboratorio Multimediale 23 Postazioni (Francesco, Firewall & Master Keyboard!)
  const od3 = new RoomBlueprint({
    id: "od_3",
    chapter: 3,
    name: "Laboratorio Multimediale — 23 Postazioni",
    subtitle: "Modalità Open Day (3/4) • Entra Francesco al Pianoforte!",
    theme: "lab",
    music: "lab",
    cols: 90,
    rows: 17,
  });
  od3
    .dialogueTrigger(6, 15, "od_meet_francesco", true, "francesco")
    .archProp(11, 15, "desk_pc", "POSTAZIONE 01")
    .pit(15, 5)
    .harmonicBridge(15, 14, 5)
    .tokensArc(15, 11, 4)
    .enemy(26, 11, "drone", 4)
    .plat(24, 12, 5)
    .plat(31, 9, 6)
    .pegaso(34, 9, "peg_09")
    .enemy(38, 15, "slime", 3)
    .checkpoint(42, 15)
    .terminal(47, 15, "qz_lab_23pc", "gate_od3_term")
    .gate(52, 11, 4, "gate_od3_term")
    .banter(54, 15, "francesco", "Sentite il riverbero? Accordiamo la Master Keyboard!")
    .dialogueTrigger(57, 15, "od_meet_daniele", true, "daniele")
    .pit(56, 3)
    .spring(60, 14)
    .plat(62, 9, 6)
    .minigameStation(66, 15, "dance", { id: "od_mg_dance", title: "DANIELE - SALSA CUBANA SOTTO I PORTICI!" }, "gate_od3_net")
    .gate(71, 11, 4, "gate_od3_net")
    .addSign(70, 14, "Premi [E] sulla Master Keyboard: Enigma di Francesco!")
    .minigameStation(
      74,
      15,
      "piano",
      {
        id: "od_mg_piano",
        title: "FRANCESCO - SBLOCCO MASTER KEYBOARD (4 NOTE)",
        subtitle: "Suona DO - MI - SOL - DO+ per aprire l'Aula Magna!",
        sequence: [0, 2, 4, 7],
      },
      "gate_od3_piano"
    )
    .gate(79, 11, 4, "gate_od3_piano")
    .heart(82, 15)
    .exitDoor(85, 15, "AULA MAGNA!");
  rooms.push(od3);

  // ZONA OD-4: Aula Magna — Resa dei Conti sul Palco per l'Open Day!
  const od4 = new RoomBlueprint({
    id: "od_4",
    chapter: 4,
    name: "Aula Magna — Il Palco dell'Open Day",
    subtitle: "Modalità Open Day (4/4) • Sfida Finale al Sofista Digitale!",
    theme: "aulamagna",
    music: "boss",
    cols: 52,
    rows: 17,
  });
  od4
    .heart(5, 15)
    .dialogueTrigger(9, 15, "od_boss_intro", true)
    .checkpoint(12, 15)
    .fillRect(15, 14, 35, 1, 1)
    .setTile(14, 14, 2)
    .archProp(16, 14, "piano_grand")
    .plat(22, 10, 4)
    .plat(38, 10, 4)
    .hoopSwitch(43, 6, "boss_stun_hoop")
    .bossArena(33, 14, true);
  rooms.push(od4);

  return rooms;
}

// =============================================================================
// CAMPAGNA COMPLETA (6 CAPITOLI x 3 LIVELLI = 18 GRANDI MAPPE — 35–45 MINUTI!)
// =============================================================================
export function buildCampaignLevels() {
  const rooms = [];

  // ---------------------------------------------------------------------------
  // CAPITOLO 1: VIA D'ARAGONA 100 — IL PORTALE SIGILLATO (3 Zone)
  // ---------------------------------------------------------------------------
  const c1_1 = new RoomBlueprint({
    id: "c1_1",
    chapter: 1,
    name: "Cap. 1.1 — Viale dei Pini e Colonne Bianche",
    subtitle: "Via Ferdinando I d'Aragona, 100 • Sede Centrale",
    theme: "facade",
    music: "main",
    cols: 108,
    rows: 18,
  });
  c1_1
    .dialogueTrigger(5, 16, "c1_opening", true)
    .addSign(9, 15, "FRECCE/AD: Cammina | SPAZIO: Salta | [X]: Abilità | [C]: Assist!")
    .plat(15, 13, 5)
    .tokensArc(15, 12, 5)
    .plat(23, 10, 5)
    .enemy(26, 16, "spambot", 5)
    .pit(32, 3)
    .plat(37, 13, 4)
    .plat(43, 10, 5)
    .plat(35, 7, 6)
    .pegaso(37, 7, "peg_01")
    .banter(48, 16, "ranaldo", "Notate la geometria razionalista dell'ing. Boccassini: pura proporzione!")
    .checkpoint(51, 16)
    .enemy(57, 16, "spambot", 4)
    .enemy(63, 11, "drone", 4)
    .addSign(67, 15, "CARLO [2] + [X]: Tira a parabola nel Canestro-Relè!")
    .plat(68, 13, 4)
    .hoopSwitch(74, 9, "g_c1_1_a")
    .gate(76, 12, 4, "rh_g_c1_1_a")
    .pit(80, 5)
    .addSign(78, 15, "RANALDO [1] + [X]: Vettore Cartesiano sul fossato!")
    .tokensArc(80, 12, 4)
    .terminal(90, 16, "qz_casardi_1937", "g_c1_1_b")
    .gate(95, 12, 4, "g_c1_1_b")
    .exitDoor(102, 16, "GRADINATA E PORTICO");
  rooms.push(c1_1);

  const c1_2 = new RoomBlueprint({
    id: "c1_2",
    chapter: 1,
    name: "Cap. 1.2 — Portico Razionalista e Tornelli",
    subtitle: "Modulo 4 Sicurezza & Modulo 1 ICT",
    theme: "facade",
    music: "main",
    cols: 110,
    rows: 18,
  });
  c1_2
    .plat(10, 13, 5)
    .movingPlat(17, 13, 24, 13, 4, 0.9)
    .pit(16, 10)
    .tokensArc(18, 10, 4)
    .enemy(31, 16, "slime", 4)
    .spring(36, 15)
    .plat(38, 9, 6)
    .plat(46, 6, 6)
    .pegaso(48, 6, "peg_02")
    .banter(51, 16, "carlo", "Quei pop-up blu rimbalzano come rimbalzi lunghi: schiacciamoli!")
    .checkpoint(53, 16)
    .terminal(58, 16, "qz_phishing_gate", "g_c1_2_a")
    .gate(63, 12, 4, "rh_g_c1_2_a")
    .enemy(69, 16, "spambot", 3)
    .enemy(74, 11, "drone", 4)
    .pit(78, 3)
    .plat(82, 13, 5)
    .hoopSwitch(89, 8, "g_c1_2_b")
    .gate(92, 12, 4, "rh_g_c1_2_b")
    .heart(96, 16)
    .exitDoor(104, 16, "ATRIO CENTRALE");
  rooms.push(c1_2);

  const c1_3 = new RoomBlueprint({
    id: "c1_3",
    chapter: 1,
    name: "Cap. 1.3 — Atrio d'Ingresso e Scalone",
    subtitle: "Guardiola di Mimmo & Salita al Primo Piano",
    theme: "corridor",
    music: "explore",
    cols: 106,
    rows: 18,
  });
  c1_3
    .dialogueTrigger(6, 16, "c1_atrium_clue", true)
    .archProp(9, 16, "bust")
    .plat(18, 12, 5)
    .plat(25, 9, 5)
    .plat(32, 7, 5)
    .tokensArc(25, 8, 4)
    .enemy(33, 16, "spambot", 4)
    .pit(39, 4)
    .movingPlat(45, 13, 45, 8, 4, 0.85)
    .plat(51, 8, 6)
    .pegaso(54, 8, "peg_03")
    .checkpoint(59, 16)
    .terminal(64, 16, "qz_ict_ram_ssd", "g_c1_3_a")
    .gate(69, 12, 4, "rh_g_c1_3_a")
    .addSign(73, 15, "Premi [E]: Calibratore Parabolico del Prof. Ranaldo!")
    .minigameStation(
      77,
      16,
      "math",
      { id: "c1_mg_math", title: "PROF. RANALDO - ALLINEA LA PARABOLA DELLO SCALONE!", targetA: 3, targetK: 2 },
      "g_c1_3_math"
    )
    .gate(82, 12, 4, "g_c1_3_math")
    .enemy(88, 16, "slime", 4)
    .spring(94, 15)
    .plat(96, 10, 6)
    .exitDoor(100, 10, "CAPITOLO 2: PRIMO PIANO");
  const c1Sub = c1_3.buildSubRoomAlcove("c1_guardiola", 13, 16, "PORTINERIA STORICA", "PORTINERIA CASARDI");
  c1_3.dialogueTrigger(c1Sub.subStartC + 16, c1Sub.floorR, "npc_mimmo_atrio", false, "mimmo");
  rooms.push(c1_3);

  // ---------------------------------------------------------------------------
  // CAPITOLO 2: CORRIDOI DEL PRIMO PIANO — TRA CLASSICI E RETE (3 Zone + Mid-Boss)
  // ---------------------------------------------------------------------------
  const c2_1 = new RoomBlueprint({
    id: "c2_1",
    chapter: 2,
    name: "Cap. 2.1 — Corridoio Est e Aula 7",
    subtitle: "Pareti Giallo-Bianche, LIM e Ingresso di Ruggero!",
    theme: "corridor",
    music: "explore",
    cols: 112,
    rows: 18,
  });
  c2_1
    .dialogueTrigger(6, 16, "c2_corridoio_ruggero", true, "ruggero")
    .crackedWall(16, 13, 3)
    .tokensArc(20, 14, 4)
    .enemy(28, 16, "crab", 4)
    .plat(33, 13, 5)
    .plat(40, 10, 6)
    .crackedWall(44, 7, 3, true)
    .plat(46, 10, 5)
    .pegaso(48, 10, "peg_04")
    .pit(52, 3)
    .checkpoint(58, 16)
    .terminal(64, 16, "qz_web_sources", "g_c2_1_a")
    .gate(69, 12, 4, "rh_g_c2_1_a")
    .movingPlat(73, 13, 81, 13, 4, 1.0)
    .pit(72, 11)
    .enemy(88, 16, "megaphone", 2)
    .enemy(93, 10, "drone", 4)
    .crackedWall(99, 13, 3)
    .exitDoor(106, 16, "SNODO DELLE LIM");
  // Aula 7 interna esplorabile!
  c2_1.buildSubRoomAlcove("c2_aula7", 21, 16, "ENTRA IN AULA 7", "AULA 7 • 5C L.C.");
  rooms.push(c2_1);

  const c2_2 = new RoomBlueprint({
    id: "c2_2",
    chapter: 2,
    name: "Cap. 2.2 — Snodo delle LIM e Segreteria",
    subtitle: "Modulo 3 PEC/CCN & Smistatore Estensioni File!",
    theme: "corridor",
    music: "explore",
    cols: 116,
    rows: 18,
  });
  c2_2
    .plat(10, 13, 4)
    .plat(16, 10, 6)
    .plat(24, 7, 7)
    .tokensArc(24, 6, 4)
    .crackedWall(14, 13, 3)
    .enemy(22, 16, "crab", 4)
    .enemy(30, 16, "slime", 4)
    .pit(36, 3)
    .plat(41, 13, 5)
    .hoopSwitch(48, 8, "g_c2_2_a")
    .gate(51, 12, 4, "rh_g_c2_2_a")
    .checkpoint(55, 16)
    .spring(60, 15)
    .plat(62, 8, 6)
    .pegaso(65, 8, "peg_06")
    .terminal(71, 16, "qz_pec_ccn", "g_c2_2_b")
    .gate(76, 12, 4, "g_c2_2_b")
    .addSign(79, 15, "Premi [E]: Smistatore Estensioni File EIPASS!")
    .minigameStation(
      83,
      16,
      "filesorter",
      { id: "c2_mg_sorter", title: "SEGRETERIA - ISPETTORE ESTENSIONI FILE!", count: 4 },
      "g_c2_2_sort"
    )
    .gate(88, 12, 4, "g_c2_2_sort")
    .dialogueTrigger(90, 16, "c2_meet_daniele", true, "daniele")
    .minigameStation(96, 16, "dance", { id: "c2_mg_dance", title: "DANIELE - BACHATA NEL CORRIDOIO!" }, "g_c2_mnet")
    .gate(101, 12, 4, "g_c2_mnet")
    .movingPlat(92, 13, 99, 10, 4, 0.95)
    .pit(91, 9)
    .heart(103, 16)
    .exitDoor(110, 16, "ALA MUSICALE & MID-BOSS");
  rooms.push(c2_2);

  const c2_3 = new RoomBlueprint({
    id: "c2_3",
    chapter: 2,
    name: "Cap. 2.3 — Ala Musicale: Il Bufala-Bot 3000!",
    subtitle: "Sconfiggi il Mid-Boss delle Finte Circolari per scendere al Cortile!",
    theme: "corridor",
    music: "boss",
    cols: 112,
    rows: 18,
  });
  c2_3
    .enemy(14, 16, "spambot", 4)
    .plat(18, 13, 5)
    .plat(25, 10, 5)
    .enemy(27, 9, "drone", 4)
    .pit(32, 3)
    .crackedWall(38, 13, 3)
    .tokensArc(41, 13, 5)
    .checkpoint(50, 16)
    .pit(54, 5)
    .spring(53, 15)
    .plat(60, 10, 6)
    .hoopSwitch(68, 7, "g_c2_3_a")
    .gate(71, 12, 4, "rh_g_c2_3_a")
    .heart(75, 16)
    .dialogueTrigger(79, 16, "c2_midboss_bufala", true)
    .plat(83, 10, 5)
    .plat(95, 10, 5)
    .midBoss(91, 16, "bufala", "g_c2_3_boss")
    .gate(102, 11, 5, "g_c2_3_boss")
    .exitDoor(106, 16, "CAPITOLO 3: CORTILE SPORTIVO");
  rooms.push(c2_3);

  // ---------------------------------------------------------------------------
  // CAPITOLO 3: CORTILE E PALESTRA — PARABOLE, BASKET E CALCIO (3 Zone)
  // ---------------------------------------------------------------------------
  const c3_1 = new RoomBlueprint({
    id: "c3_1",
    chapter: 3,
    name: "Cap. 3.1 — Campo da Basket all'Aperto",
    subtitle: "La Grande Sfida a Canestro di Carlo!",
    theme: "courtyard",
    music: "sports",
    cols: 110,
    rows: 18,
  });
  c3_1
    .dialogueTrigger(6, 16, "c3_cortile_intro", true)
    .plat(14, 13, 5)
    .plat(21, 10, 5)
    .tokensArc(21, 9, 4)
    .pit(28, 3)
    .enemy(35, 16, "slime", 4)
    .hoopSwitch(42, 8, "g_c3_1_a")
    .gate(45, 12, 4, "rh_g_c3_1_a")
    .checkpoint(49, 16)
    .terminal(55, 16, "qz_excel_formula", "g_c3_1_b")
    .gate(60, 12, 4, "rh_g_c3_1_b")
    .spring(64, 15)
    .plat(66, 8, 6)
    .pegaso(69, 8, "peg_10")
    .addSign(75, 15, "Premi [E] sul Canestro Centrale: Sfida Arcade di Carlo!")
    .minigameStation(
      80,
      16,
      "basket",
      { id: "c3_mg_basket", title: "CARLO - 3 CANESTRI SUL TABELLONE MOBILE!", goalsNeeded: 3, movingHoop: true },
      "g_c3_1_basket"
    )
    .gate(86, 12, 4, "g_c3_1_basket")
    .heart(90, 16)
    .enemy(96, 16, "crab", 4)
    .exitDoor(104, 16, "CAMPO CALCIO & PALLAVOLO");
  rooms.push(c3_1);

  const c3_2 = new RoomBlueprint({
    id: "c3_2",
    chapter: 3,
    name: "Cap. 3.2 — Piazzale Sportivo: Sfida di Ruggero",
    subtitle: "Dribbling, Muri Incrinati e Tiri all'Incrocio!",
    theme: "courtyard",
    music: "sports",
    cols: 112,
    rows: 18,
  });
  c3_2
    .crackedWall(12, 13, 3)
    .enemy(19, 16, "crab", 4)
    .crackedWall(25, 13, 3)
    .tokensArc(28, 13, 5)
    .banter(31, 16, "ruggero", "Uno-due nello stretto e tiro rasoterra: non ci prendono più!")
    .pit(36, 3)
    .movingPlat(40, 13, 48, 10, 4, 1.05)
    .pit(40, 10)
    .checkpoint(53, 16)
    .plat(57, 13, 5)
    .plat(64, 10, 5)
    .enemy(66, 9, "drone", 4)
    .addSign(73, 15, "Premi [E] sui Blocchi: Sfida Atletica di Ruggero!")
    .minigameStation(
      78,
      16,
      "athletics",
      { id: "c3_mg_athletics", title: "RUGGERO - 135m OSTACOLI: SCATTO FINALE!", hard: true },
      "g_c3_2_foot"
    )
    .gate(84, 12, 4, "g_c3_2_foot")
    .pit(88, 3)
    .plat(93, 13, 5)
    .heart(98, 16)
    .exitDoor(106, 16, "PALESTRA COPERTA");
  rooms.push(c3_2);

  const c3_3 = new RoomBlueprint({
    id: "c3_3",
    chapter: 3,
    name: "Cap. 3.3 — Palestra Coperta: Riferimenti Assoluti",
    subtitle: "Modulo 6 Foglio di Calcolo & Sinergia Atletica",
    theme: "courtyard",
    music: "sports",
    cols: 106,
    rows: 18,
  });
  c3_3
    .archProp(6, 16, "trophy", "CENTRO SPORTIVO")
    .spring(10, 15)
    .plat(12, 10, 5)
    .plat(19, 7, 5)
    .hoopSwitch(26, 6, "g_c3_3_a")
    .gate(29, 12, 4, "rh_g_c3_3_a")
    .enemy(35, 16, "megaphone", 3)
    .pit(41, 4)
    .plat(47, 13, 5)
    .checkpoint(54, 16)
    .terminal(59, 16, "qz_excel_abs_ref", "g_c3_3_b")
    .gate(64, 12, 4, "rh_g_c3_3_b")
    .crackedWall(70, 13, 3)
    .movingPlat(75, 13, 83, 10, 4, 1.0)
    .pit(74, 11)
    .tokensArc(86, 12, 4)
    .enemy(94, 16, "slime", 4)
    .exitDoor(101, 16, "CAPITOLO 4: LABORATORIO");
  rooms.push(c3_3);

  // ---------------------------------------------------------------------------
  // CAPITOLO 4: LABORATORIO MULTIMEDIALE — 23 POSTAZIONI & MID-BOSS (3 Zone)
  // ---------------------------------------------------------------------------
  const c4_1 = new RoomBlueprint({
    id: "c4_1",
    chapter: 4,
    name: "Cap. 4.1 — Ingresso Laboratorio Multimediale",
    subtitle: "23 Postazioni in Rete • Entra in squadra Francesco!",
    theme: "lab",
    music: "lab",
    cols: 114,
    rows: 18,
  });
  c4_1
    .dialogueTrigger(6, 16, "c4_lab_francesco", true, "francesco")
    .archProp(11, 16, "desk_pc", "MIDI 01")
    .pit(15, 5)
    .harmonicBridge(15, 15, 5)
    .tokensArc(15, 12, 4)
    .enemy(26, 16, "spambot", 4)
    .plat(31, 13, 5)
    .pit(37, 5)
    .harmonicBridge(37, 12, 5)
    .plat(43, 9, 6)
    .pegaso(46, 9, "peg_05")
    .checkpoint(52, 16)
    .terminal(58, 16, "qz_lab_23pc", "g_c4_1_a")
    .gate(63, 12, 4, "rh_g_c4_1_a")
    .addSign(66, 15, "Premi [E]: Difesa Firewall Live delle 23 Postazioni!")
    .minigameStation(
      70,
      16,
      "firewall",
      { id: "c4_mg_firewall", title: "LAB 23 PC - DIFESA FIREWALL A 3 CORSIE!", needed: 5 },
      "g_c4_1_fw"
    )
    .gate(75, 12, 4, "g_c4_1_fw")
    .enemy(80, 11, "drone", 4)
    .pit(85, 5)
    .harmonicBridge(85, 15, 5)
    .crackedWall(94, 13, 3)
    .heart(99, 16)
    .exitDoor(107, 16, "SALA MASTER KEYBOARD");
  rooms.push(c4_1);

  const c4_2 = new RoomBlueprint({
    id: "c4_2",
    chapter: 4,
    name: "Cap. 4.2 — Sala Master Keyboard e Notazione",
    subtitle: "L'Enigma Musicale a 6 Note di Francesco!",
    theme: "lab",
    music: "lab",
    cols: 110,
    rows: 18,
  });
  c4_2
    .plat(10, 13, 4)
    .harmonicBridge(15, 11, 5)
    .plat(21, 9, 5)
    .tokensArc(21, 8, 4)
    .pit(14, 12)
    .enemy(32, 16, "crab", 4)
    .hoopSwitch(39, 8, "g_c4_2_a")
    .gate(42, 12, 4, "rh_g_c4_2_a")
    .checkpoint(47, 16)
    .movingPlat(52, 13, 60, 10, 4, 1.0)
    .pit(51, 11)
    .plat(63, 10, 5)
    .pegaso(65, 10, "peg_09")
    .addSign(71, 15, "Premi [E] sulla Master Keyboard: Melodia a 6 Note!")
    .minigameStation(
      76,
      16,
      "piano",
      {
        id: "c4_mg_piano",
        title: "FRANCESCO - SINFONIA DELLE 23 POSTAZIONI (6 NOTE)",
        subtitle: "Riproduci DO - MI - SOL - LA - SOL - DO+ sulla tastiera!",
        sequence: [0, 2, 4, 5, 4, 7],
      },
      "g_c4_2_piano"
    )
    .gate(82, 12, 4, "g_c4_2_piano")
    .enemy(89, 11, "drone", 4)
    .pit(94, 4)
    .harmonicBridge(94, 15, 4)
    .exitDoor(104, 16, "CORE FIREWALL");
  rooms.push(c4_2);

  const c4_3 = new RoomBlueprint({
    id: "c4_3",
    chapter: 4,
    name: "Cap. 4.3 — Core Firewall: Il Ransom-Kraken!",
    subtitle: "Modulo 4 EIPASS + Scontro col Mid-Boss del Ransomware!",
    theme: "lab",
    music: "boss",
    cols: 114,
    rows: 18,
  });
  c4_3
    .crackedWall(12, 13, 3)
    .pit(18, 5)
    .harmonicBridge(18, 15, 5)
    .plat(26, 13, 5)
    .hoopSwitch(33, 8, "g_c4_3_a")
    .gate(36, 12, 4, "rh_g_c4_3_a")
    .checkpoint(42, 16)
    .terminal(48, 16, "qz_2fa_backup", "g_c4_3_b")
    .gate(53, 12, 4, "rh_g_c4_3_b")
    .minigameStation(
      60,
      16,
      "math",
      { id: "c4_mg_math", title: "PROF. RANALDO - CRITTOGRAFIA PARABOLICA SERVER", targetA: 4, targetK: 1 },
      "g_c4_3_c"
    )
    .gate(65, 12, 4, "g_c4_3_c")
    .heart(70, 16)
    .dialogueTrigger(75, 16, "c4_midboss_kraken", true)
    .plat(80, 12, 5)
    .plat(94, 12, 5)
    .midBoss(88, 16, "kraken", "g_c4_3_kraken")
    .gate(102, 11, 5, "g_c4_3_kraken")
    .exitDoor(107, 16, "CAPITOLO 5: BIBLIOTECA");
  rooms.push(c4_3);

  // ---------------------------------------------------------------------------
  // CAPITOLO 5: BIBLIOTECA STORICA — GLI 8.000 VOLUMI, REDAZIONE PEGASO & FUGA
  // ---------------------------------------------------------------------------
  const c5_1 = new RoomBlueprint({
    id: "c5_1",
    chapter: 5,
    name: "Cap. 5.1 — Sala degli Ottomila Volumi",
    subtitle: "Scalata verticale tra librerie storiche in mogano e busti classici",
    theme: "library",
    music: "library",
    cols: 106,
    rows: 20,
  });
  c5_1
    .dialogueTrigger(6, 18, "c5_biblioteca_intro", true)
    .archProp(9, 18, "bust")
    .plat(12, 15, 6)
    .plat(20, 12, 6)
    .plat(12, 9, 6)
    .pegaso(14, 9, "peg_07")
    .plat(22, 7, 7)
    .tokensArc(22, 6, 4)
    .enemy(32, 18, "spambot", 5)
    .pit(39, 3)
    .plat(44, 15, 5)
    .harmonicBridge(50, 13, 5)
    .checkpoint(57, 18)
    .terminal(63, 18, "qz_word_styles", "g_c5_1_a")
    .gate(68, 14, 4, "rh_g_c5_1_a")
    .spring(73, 17)
    .plat(75, 11, 6)
    .plat(83, 8, 6)
    .hoopSwitch(91, 6, "g_c5_1_b")
    .gate(94, 14, 4, "rh_g_c5_1_b")
    .exitDoor(100, 18, "MEDIATECA & PEGASO");
  rooms.push(c5_1);

  const c5_2 = new RoomBlueprint({
    id: "c5_2",
    chapter: 5,
    name: "Cap. 5.2 — Mediateca e Redazione di Pegaso",
    subtitle: "Modulo 5 PDF/A & Incontro con Sofia nella Redazione!",
    theme: "library",
    music: "library",
    cols: 108,
    rows: 18,
  });
  c5_2
    .crackedWall(13, 13, 3)
    .enemy(20, 16, "crab", 4)
    .plat(25, 13, 5)
    .movingPlat(32, 13, 32, 7, 4, 0.9)
    .plat(38, 7, 6)
    .pegaso(41, 7, "peg_08")
    .pit(46, 4)
    .checkpoint(53, 16)
    .terminal(59, 16, "qz_library_casardi", "g_c5_2_a")
    .gate(64, 12, 4, "rh_g_c5_2_a")
    .enemy(70, 11, "drone", 4)
    .pit(76, 5)
    .harmonicBridge(76, 15, 5)
    .plat(84, 13, 5)
    .plat(91, 10, 5)
    .heart(96, 16)
    .exitDoor(102, 16, "CORRIDOIO DI FUGA!");
  const c5Sub = c5_2.buildSubRoomAlcove("c5_redazione", 50, 16, "REDAZIONE PEGASO", "REDAZIONE PEGASO");
  c5_2.dialogueTrigger(c5Sub.subStartC + 16, c5Sub.floorR, "npc_sofia_pegaso", false, "sofia");
  rooms.push(c5_2);

  const c5_3 = new RoomBlueprint({
    id: "c5_3",
    chapter: 5,
    name: "Cap. 5.3 — Fuga dall'Indice Corrotto!",
    subtitle: "Corsa ritmata verso l'Aula Magna (Usa Ruggero [4] e Carlo [2]!)",
    theme: "library",
    music: "boss",
    cols: 116,
    rows: 17,
    chaseHazard: true,
  });
  c5_3
    .dialogueTrigger(5, 15, "c5_chase_warning", true)
    .plat(14, 12, 5)
    .tokensArc(14, 11, 4)
    .pit(21, 3)
    .crackedWall(28, 12, 3)
    .spring(34, 14)
    .plat(36, 9, 7)
    .plat(45, 11, 6)
    .pit(53, 3)
    .checkpoint(58, 15)
    .harmonicBridge(63, 14, 5)
    .pit(63, 5)
    .plat(71, 12, 5)
    .plat(78, 9, 6)
    .pegaso(81, 9, "peg_12")
    .pit(86, 3)
    .tokensArc(91, 13, 5)
    .spring(102, 14)
    .plat(104, 9, 8)
    .exitDoor(109, 9, "CAPITOLO 6: AULA MAGNA");
  rooms.push(c5_3);

  // ---------------------------------------------------------------------------
  // CAPITOLO 6: AULA MAGNA — SINFONIA FINALE PER L'OPEN DAY (3 Zone)
  // ---------------------------------------------------------------------------
  const c6_1 = new RoomBlueprint({
    id: "c6_1",
    chapter: 6,
    name: "Cap. 6.1 — Foyer della Notte Nazionale del Classico",
    subtitle: "Atelier Didattici, Saffo e Ultimi Preparativi",
    theme: "corridor",
    music: "explore",
    cols: 106,
    rows: 18,
  });
  c6_1
    .archProp(7, 16, "bust")
    .plat(11, 13, 5)
    .plat(18, 10, 5)
    .enemy(22, 16, "crab", 4)
    .pit(26, 4)
    .harmonicBridge(26, 15, 4)
    .crackedWall(34, 13, 3)
    .spring(39, 15)
    .plat(41, 8, 6)
    .pegaso(44, 8, "peg_11")
    .checkpoint(51, 16)
    .movingPlat(56, 13, 64, 10, 4, 1.0)
    .pit(55, 11)
    .hoopSwitch(71, 7, "g_c6_1_a")
    .gate(74, 12, 4, "rh_g_c6_1_a")
    .enemy(80, 11, "drone", 4)
    .enemy(86, 16, "megaphone", 3)
    .heart(93, 16)
    .exitDoor(100, 16, "INGRESSO AULA MAGNA");
  rooms.push(c6_1);

  const c6_2 = new RoomBlueprint({
    id: "c6_2",
    chapter: 6,
    name: "Cap. 6.2 — Platea dell'Aula Magna & Touch TV",
    subtitle: "Modulo 7 Presentazioni & Consiglio Tattico della Squadra",
    theme: "aulamagna",
    music: "lab",
    cols: 96,
    rows: 17,
  });
  c6_2
    .plat(10, 12, 5)
    .tokensArc(10, 11, 4)
    .pit(17, 3)
    .plat(22, 12, 5)
    .enemy(29, 15, "slime", 4)
    .terminal(37, 15, "qz_ppt_openday", "g_c6_2_ppt")
    .gate(42, 11, 4, "g_c6_2_ppt")
    .checkpoint(47, 15)
    .minigameStation(
      55,
      15,
      "piano",
      {
        id: "c6_mg_piano_pre",
        title: "FRANCESCO - ACCORDATURA DEL PIANOFORTE A CODA",
        subtitle: "Suona l'accordo d'apertura dell'Aula Magna: DO - FA - LA - DO+ - SOL!",
        sequence: [0, 3, 5, 7, 4],
      },
      "g_c6_2_piano"
    )
    .gate(62, 11, 4, "g_c6_2_piano")
    .dialogueTrigger(70, 15, "c6_council", true)
    .heart(78, 15)
    .exitDoor(88, 15, "SALITE SUL PALCO!");
  rooms.push(c6_2);

  const c6_3 = new RoomBlueprint({
    id: "c6_3",
    chapter: 6,
    name: "Cap. 6.3 — Palco dell'Aula Magna: Il Sofista Ω",
    subtitle: "Gran Finale a 3 Fasi • Pianoforte a Coda, Busti Classici e Gioco di Squadra!",
    theme: "aulamagna",
    music: "boss",
    cols: 52,
    rows: 17,
  });
  c6_3
    .heart(5, 15)
    .dialogueTrigger(9, 15, "c6_boss_intro", true)
    .checkpoint(12, 15)
    .fillRect(15, 14, 35, 1, 1)
    .setTile(14, 14, 2)
    .archProp(16, 14, "piano_grand")
    .plat(22, 10, 4)
    .plat(38, 10, 4)
    .hoopSwitch(43, 6, "boss_stun_hoop")
    .bossArena(33, 14, false);
  rooms.push(c6_3);

  return rooms;
}
