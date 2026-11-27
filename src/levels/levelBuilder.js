// Costruttore modulare di mappe Pixel-Perfect v2.0 (Tile 16x16 + Sotto-Aule Esplorabili + Mid-Boss + Props)
// Tipi di tile nella griglia:
//   0 = vuoto
//   1 = pavimento/muro solido principale (travertino, graniglia, parquet, cyber-lab, mogano)
//   2 = piattaforma one-way (attraversabile dal basso verso l'alto)
//   3 = blocco incrinato Glitch (distruttibile con lo Scatto Ostacoli di Ruggero!)
//   4 = Ponte Sonoro Armonico (solidificato dall'Accordo di Francesco!)
//   5 = Cancello Elettronico (si apre con Canestro-Relè, Terminale EIPASS, Minigioco o Mid-Boss!)
//   6 = Spuntoni / Corrente Glitch (toglie 1 HP e riporta all'ultima pedana sicura)
//   7 = Trampolino ginnico (spinta verticale alta!)

import { TILE, CHAR_ORDER, CHARACTERS } from "../config/constants.js";

// =============================================================================
// TASTO EROE AUTOMATICO: ogni cartello che nomina un eroe riceve l'indice REALE
// del suo slot (1..5) preso da CHAR_ORDER. Impossibile che i suggerimenti vadano
// fuori sincrono quando si cambia l'ordine dei personaggi.
// =============================================================================
const CHAR_KEY_BY_NAME = (() => {
  const map = {};
  CHAR_ORDER.forEach((cid, i) => {
    const meta = CHARACTERS[cid];
    if (!meta) return;
    map[meta.name.toUpperCase()] = i + 1;              // "Prof. Ranaldo"
    if (meta.fullName) map[meta.fullName.toUpperCase()] = i + 1; // "RANALDO"
    map[cid.toUpperCase()] = i + 1;
    if (meta.shortName) map[meta.shortName.toUpperCase()] = i + 1; // "RAN"
  });
  map["RANALDO"] = map["RANALDO"] ?? map["PROF. RANALDO"];
  return map;
})();

function localizeHeroKeys(text) {
  if (typeof text !== "string") return text;
  return text.replace(
    /(PROF\.\s*RANALDO|RANALDO|CARLO|DANIELE|RUGGERO|FRANCESCO)\s*\[(\d)\]/gi,
    (full, name, _num) => {
      const key = CHAR_KEY_BY_NAME[String(name).toUpperCase().replace(/\s+/g, " ")];
      return key ? `${String(name).toUpperCase()} [${key}]` : full;
    }
  );
}


export class RoomBlueprint {
  constructor(cfg) {
    this.id = cfg.id;
    this.chapter = cfg.chapter || 1;
    this.name = cfg.name;
    this.subtitle = cfg.subtitle || "";
    this.theme = cfg.theme || "facade"; // 'facade' | 'corridor' | 'courtyard' | 'lab' | 'library' | 'aulamagna'
    this.music = cfg.music || "main";
    this.cols = cfg.cols || 96;
    this.rows = cfg.rows || 17;
    this.mainBoundCols = cfg.mainBoundCols || this.cols; // Limite camera zona principale se c'è sotto-aula a destra
    this.grid = Array.from({ length: this.rows }, () => new Array(this.cols).fill(0));

    this.spawn = { x: 3 * TILE, y: (this.rows - 4) * TILE };
    this.entities = [];
    this.decorations = [];
    this.movingPlatforms = [];
    this.chaseHazard = cfg.chaseHazard || false;

    this.fillRect(0, this.rows - 2, this.cols, 2, 1);
    this.fillRect(0, 0, 1, this.rows, 1);
    this.fillRect(this.cols - 1, 0, 1, this.rows, 1);
  }

  setTile(c, r, val) {
    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      this.grid[r][c] = val;
    }
    return this;
  }

  fillRect(c, r, w, h, val) {
    for (let yy = r; yy < r + h; yy++) {
      for (let xx = c; xx < c + w; xx++) {
        this.setTile(xx, yy, val);
      }
    }
    return this;
  }

  pit(c, w, hazard = true) {
    this.fillRect(c, this.rows - 2, w, 2, 0);
    if (hazard) {
      this.fillRect(c, this.rows - 1, w, 1, 6);
    }
    return this;
  }

  plat(c, r, w, oneWay = true) {
    this.fillRect(c, r, w, 1, oneWay ? 2 : 1);
    return this;
  }

  wall(c, r, h) {
    this.fillRect(c, r, 1, h, 1);
    return this;
  }

  /**
   * Muro incrinato: DEVE restare invalicabile senza Ruggero.
   * Il salto più alto arriva a ~70px (Carlo), quindi 3 tile (48px) si scavalcherebbero:
   * minime 5 tile (80px), con la base appoggiata al pavimento.
   */
  crackedWall(c, r, h = 3, floating = false) {
    // floating = true per i blocchi pensili (sopra una piattaforma): non vanno appoggiati al suolo
    const tiles = Math.max(5, h);
    const top = floating ? r : Math.min(r, this.rows - 2 - tiles);
    this.fillRect(c, top, 2, tiles, 3);
    this.addSign(Math.max(1, c - 4), Math.max(2, r - 1), "RUGGERO [4]+[X]: SCATTO OSTACOLI!");
    return this;
  }

  harmonicBridge(c, r, w = 5) {
    this.fillRect(c, r, w, 1, 4);
    this.addSign(Math.max(1, c - 1), Math.max(2, r - 1), "FRANCESCO [5]+[X]: Risonanza!");
    return this;
  }

  gate(c, r, h, gateId) {
    this.fillRect(c, r, 1, h, 5);
    this.entities.push({ type: "gate_marker", c, r, h, gateId });
    return this;
  }

  spring(c, r) {
    this.setTile(c, r, 7);
    return this;
  }

  movingPlat(c1, r1, c2, r2, w = 4, speed = 0.9) {
    this.movingPlatforms.push({
      x1: c1 * TILE,
      y1: r1 * TILE,
      x2: c2 * TILE,
      y2: r2 * TILE,
      w: w * TILE,
      h: 8,
      speed,
    });
    return this;
  }

  hoopSwitch(c, r, targetGateId) {
    this.entities.push({
      type: "hoop_switch",
      x: c * TILE,
      y: r * TILE,
      targetGateId,
      activated: false,
    });
    return this;
  }

  terminal(c, r, quizId, targetGateId = null) {
    this.entities.push({
      type: "terminal",
      x: c * TILE,
      y: r * TILE - 8,
      quizId,
      targetGateId,
    });
    return this;
  }

  minigameStation(c, r, mgType, mgConfig, targetGateId = null) {
    this.entities.push({
      type: "minigame",
      x: c * TILE,
      y: r * TILE - 10,
      mgType,
      mgConfig,
      targetGateId,
    });
    return this;
  }

  dialogueTrigger(c, r, dialogueId, autoTrigger = true, npcChar = null) {
    this.entities.push({
      type: "dialogue",
      x: c * TILE,
      y: r * TILE - 16,
      dialogueId,
      autoTrigger,
      npcChar,
    });
    return this;
  }

  banter(c, r, speaker, text) {
    this.entities.push({
      type: "banter",
      x: c * TILE,
      y: r * TILE - 16,
      speaker,
      text,
    });
    return this;
  }

  /**
   * Crea una sotto-aula / redazione esplorabile separata da muro divisorio,
   * collegata a una porta con sopraluce nel corridoio principale!
   */
  buildSubRoomAlcove(doorId, entryC, entryR, entryLabel, roomTitle) {
    const subStartC = this.mainBoundCols;
    const subWidth = 28;
    const newCols = subStartC + subWidth;
    for (let rr = 0; rr < this.rows; rr++) {
      while (this.grid[rr].length < newCols) this.grid[rr].push(0);
    }
    this.cols = newCols;

    // Pavimento, soffitto e pareti della sotto-aula
    this.fillRect(subStartC, 0, subWidth, this.rows, 0);
    this.fillRect(subStartC, this.rows - 2, subWidth, 2, 1);
    this.fillRect(subStartC, 0, subWidth, 2, 1);
    this.fillRect(subStartC, 0, 2, this.rows, 1);
    this.fillRect(newCols - 2, 0, 2, this.rows, 1);

    // Arredo interno ordinato dell'aula / redazione (ZERO sovrapposizioni tra LIM, mensola e NPC!)
    const floorR = this.rows - 2;
    this.archProp(subStartC + 7, floorR, "lim", roomTitle);
    this.plat(subStartC + 18, floorR - 5, 6, true);
    this.tokensArc(subStartC + 18, floorR - 6, 4);
    this.heart(subStartC + 21, floorR);
    this.archProp(subStartC + 24, floorR, "bust");

    const backC = subStartC + 4;
    this.entities.push({
      type: "subdoor",
      id: `${doorId}_in`,
      x: entryC * TILE,
      y: entryR * TILE - 24,
      targetX: backC * TILE,
      targetY: (floorR - 2) * TILE,
      inSubRoom: false,
      subMinC: subStartC,
      subMaxC: newCols,
      label: entryLabel,
      roomTitle,
    });
    this.entities.push({
      type: "subdoor",
      id: `${doorId}_out`,
      x: backC * TILE,
      y: floorR * TILE - 24,
      targetX: entryC * TILE,
      targetY: (entryR - 2) * TILE,
      inSubRoom: true,
      subMinC: 0,
      subMaxC: this.mainBoundCols,
      label: "TORNA AL CORRIDOIO",
      roomTitle: this.name,
    });
    return { subStartC, floorR };
  }

  archProp(c, r, propKind, label = "") {
    this.decorations.push({
      type: "arch_prop",
      propKind, // 'bust' | 'lim' | 'desk_pc' | 'piano_grand' | 'trophy'
      x: c * TILE,
      y: r * TILE,
      label,
    });
    return this;
  }

  checkpoint(c, r) {
    this.entities.push({
      type: "checkpoint",
      x: c * TILE,
      y: r * TILE - 16,
      active: false,
    });
    return this;
  }

  enemy(c, r, kind = "spambot", rangeTiles = 5) {
    // kind: 'spambot' | 'drone' | 'crab' | 'slime' | 'megaphone'
    this.entities.push({
      type: "enemy",
      kind,
      x: c * TILE,
      y: r * TILE - 20,
      minX: (c - rangeTiles) * TILE,
      maxX: (c + rangeTiles) * TILE,
    });
    return this;
  }

  midBoss(c, r, bossKind = "bufala", targetGateId = null) {
    this.entities.push({
      type: "midboss",
      bossKind, // 'bufala' | 'kraken'
      x: c * TILE,
      y: r * TILE - 52,
      minX: (c - 7) * TILE,
      maxX: (c + 5) * TILE,
      targetGateId,
    });
    return this;
  }

  tokensArc(cStart, rBase, count = 5) {
    for (let i = 0; i < count; i++) {
      const arc = Math.round(Math.sin((i / Math.max(1, count - 1)) * Math.PI) * 2);
      this.entities.push({
        type: "token",
        x: (cStart + i * 2) * TILE + 4,
        y: (rBase - arc) * TILE + 4,
      });
    }
    return this;
  }

  pegaso(c, r, pegasoId) {
    this.entities.push({
      type: "pegaso",
      x: c * TILE,
      y: r * TILE - 14,
      pegasoId,
    });
    return this;
  }

  heart(c, r) {
    this.entities.push({
      type: "heart",
      x: c * TILE,
      y: r * TILE - 10,
    });
    return this;
  }

  addSign(c, r, hintText) {
    // Il tasto eroe viene ricalcolato da CHAR_ORDER: mai un indice sbagliato.
    this.decorations.push({ type: "hint", x: c * TILE, y: r * TILE, text: localizeHeroKeys(hintText) });
    return this;
  }

  exitDoor(c, r, label = "PROSSIMA ZONA") {
    this.entities.push({
      type: "exit",
      x: c * TILE,
      y: r * TILE - 24,
      label,
    });
    return this;
  }

  bossArena(c, r, isCompactOpenDay = false) {
    this.entities.push({
      type: "boss",
      x: c * TILE,
      y: r * TILE - 52,
      compact: isCompactOpenDay,
    });
    return this;
  }
}
