#!/usr/bin/env node
/**
 * Audit Visivo Integrale (48 Scene distinte a 480x270 = 8 Tavole da 6 pannelli)
 * Esegue il VERO motore di rendering JS (`PixelRenderer`, `UIManager`, `SpecialChallengeManager`, `WorldRuntime`)
 * su OGNI SINGOLA SCENA POSSIBILE del gioco per ispezione visiva completa e controllo zero-errori!
 */

import fs from "node:fs";
import { execSync } from "node:child_process";
import { GameStateManager } from "../src/state/gameState.js";
import { buildOpenDayLevels, buildCampaignLevels } from "../src/levels/levelsData.js";
import { WorldRuntime } from "../src/engine/world.js";
import { PixelRenderer } from "../src/render/renderer.js";
import { UIManager } from "../src/ui/hudAndMenus.js";
import { DIALOGUES } from "../src/narrative/dialogues.js";
import { EIPASS_CHALLENGES } from "../src/narrative/eipassQuiz.js";
import { SpecialChallengeManager } from "../src/minigames/specialChallenges.js";
import { PEGASO_LORE } from "../src/config/constants.js";

globalThis.window = {
  localStorage: { _d: {}, getItem() { return null; }, setItem() {}, removeItem() {} },
  addEventListener() {},
};

class RecordingContext2D {
  constructor() {
    this.cmds = [];
    this.fillStyle = "#000000";
    this.strokeStyle = "#ffffff";
    this.lineWidth = 1;
    this.font = "10px monospace";
    this.globalAlpha = 1.0;
    this._stack = [];
    this.tx = 0;
    this.ty = 0;
    this.sx = 1;
    this.sy = 1;
    this._path = [];
    this._arc = null;
  }
  save() {
    this._stack.push({
      tx: this.tx, ty: this.ty, sx: this.sx, sy: this.sy,
      a: this.globalAlpha, f: this.fillStyle, s: this.strokeStyle, lw: this.lineWidth, font: this.font,
    });
  }
  restore() {
    const st = this._stack.pop();
    if (st) {
      this.tx = st.tx; this.ty = st.ty; this.sx = st.sx; this.sy = st.sy;
      this.globalAlpha = st.a; this.fillStyle = st.f; this.strokeStyle = st.s;
      this.lineWidth = st.lw; this.font = st.font;
    }
  }
  translate(x, y) { this.tx += x * this.sx; this.ty += y * this.sy; }
  scale(sx, sy = 1) { this.sx *= sx; this.sy *= sy; }
  createLinearGradient() {
    return { _stops: [], addColorStop(p, c) { this._stops.push([p, c]); } };
  }
  _resolveColor(c) {
    if (c && typeof c === "object" && c._stops) return c._stops[0]?.[1] || "#4ea8de";
    return String(c || "#000000");
  }
  fillRect(x, y, w, h) {
    const rw = Math.abs(w * this.sx);
    const rh = Math.abs(h * this.sy);
    const rx = this.sx < 0 ? this.tx - (x + w) * Math.abs(this.sx) : this.tx + x * Math.abs(this.sx);
    const ry = this.sy < 0 ? this.ty - (y + h) * Math.abs(this.sy) : this.ty + y * Math.abs(this.sy);
    this.cmds.push({ op: "fillRect", x: rx, y: ry, w: rw, h: rh, c: this._resolveColor(this.fillStyle), a: this.globalAlpha });
  }
  strokeRect(x, y, w, h) {
    const rw = Math.abs(w * this.sx);
    const rh = Math.abs(h * this.sy);
    const rx = this.sx < 0 ? this.tx - (x + w) * Math.abs(this.sx) : this.tx + x * Math.abs(this.sx);
    const ry = this.sy < 0 ? this.ty - (y + h) * Math.abs(this.sy) : this.ty + y * Math.abs(this.sy);
    this.cmds.push({ op: "strokeRect", x: rx, y: ry, w: rw, h: rh, c: this._resolveColor(this.strokeStyle), lw: this.lineWidth, a: this.globalAlpha });
  }
  beginPath() { this._path = []; this._arc = null; }
  moveTo(x, y) { this._path.push([this.tx + x, this.ty + y]); }
  lineTo(x, y) { this._path.push([this.tx + x, this.ty + y]); }
  arc(x, y, r) { this._arc = { x: this.tx + x, y: this.ty + y, r }; }
  fill() {
    if (this._arc) {
      this.cmds.push({ op: "fillCircle", ...this._arc, c: this._resolveColor(this.fillStyle) });
      this._arc = null;
    } else if (this._path.length >= 3) {
      this.cmds.push({ op: "fillPoly", pts: this._path.slice(), c: this._resolveColor(this.fillStyle) });
    }
  }
  stroke() {
    if (this._arc) {
      this.cmds.push({ op: "strokeCircle", ...this._arc, c: this._resolveColor(this.strokeStyle) });
      this._arc = null;
    } else if (this._path.length >= 2) {
      this.cmds.push({ op: "strokeLine", pts: this._path.slice(), c: this._resolveColor(this.strokeStyle) });
    }
  }
  drawImage(imgTag, sx, sy, sw, sh, dx, dy, dw, dh) {
    const rw = Math.max(1, Math.round(Math.abs(dw * this.sx)));
    const rh = Math.max(1, Math.round(Math.abs(dh * this.sy)));
    const rx = this.sx < 0 ? this.tx - (dx + dw) * Math.abs(this.sx) : this.tx + dx * Math.abs(this.sx);
    const ry = this.sy < 0 ? this.ty - (dy + dh) * Math.abs(this.sy) : this.ty + dy * Math.abs(this.sy);
    this.cmds.push({ op: "sprite", sheet: imgTag, sx, sy, sw, sh, dx: rx, dy: ry, dw: rw, dh: rh, flip: this.sx < 0, a: this.globalAlpha });
  }
}

const fakeSprites = {
  characters: "characters",
  portraits: "portraits",
  tileset: "tileset",
  enemiesProps: "enemiesProps",
};
const renderer = new PixelRenderer(fakeSprites);
const ui = new UIManager(fakeSprites);
const mockAudio = {
  muted: false, musicVol: 0.7, sfxVol: 0.85,
  playSfx() {}, playTrack() {}, setDucking() {}, playPianoNote() {}, playPianoChord() {}, playCharMotif() {},
};
const blankInput = {
  left: false, right: false, up: false, down: false, jumpDown: false, specialDown: false,
  leftPressed: false, rightPressed: false, upPressed: false, downPressed: false,
  jumpPressed: false, specialPressed: false, assistPressed: false, interactPressed: false,
  confirmPressed: false, pausePressed: false, mutePressed: false, crtTogglePressed: false,
  switchCyclePressed: false, replayPressed: false, quickResetPressed: false, numberPressed: 0,
};

const od = buildOpenDayLevels();
const camp = buildCampaignLevels();

function captureRoom(bp, hero = "carlo", targetTileC = null, extraFn = null) {
  const ctx = new RecordingContext2D();
  const gs = new GameStateManager();
  gs.data.unlockedChars = ["ranaldo", "carlo", "daniele", "ruggero", "francesco"];
  gs.data.activeChar = hero;
  const w = new WorldRuntime(bp, gs, mockAudio, {});
  if (targetTileC !== null) {
    w.player.x = targetTileC * 16;
    w.player.y = (bp.rows - 4) * 16;
    w.camera.x = Math.max(0, Math.min(w.camMaxX - 480, w.player.x - 190));
  }
  for (let i = 0; i < 20; i++) w.update(blankInput);
  if (extraFn) extraFn(w, gs, ctx);
  renderer.renderWorld(ctx, w);
  ui.renderHUD(ctx, gs, w, mockAudio);
  return ctx.cmds;
}

const allSheets = {};

// =============================================================================
// SHEET 1: MENU, COMANDI, PAUSA, DOSSIER E FINALI (6 SCENE)
// =============================================================================
{
  const s = [];
  // 1. Title 3 options
  {
    const c = new RecordingContext2D();
    ui.renderTitleMenu(c, renderer, 0, [
      { id: "openday", label: "★ MODALITA OPEN DAY (7-10 MIN)", sub: "Missione demo con tutti e 4 i protagonisti!" },
      { id: "campaign_new", label: "AVVIA CAMPAGNA COMPLETA", sub: "6 Cap. • 18 Mappe • 7 Moduli • 4 Finali!" },
      { id: "controls", label: "COMANDI & MIXER AUDIO", sub: "Tastiera, Gamepad, Volumi e Filtro CRT [V]" },
    ], mockAudio, false);
    s.push({ label: "1. Menu Principale (Standard)", cmds: c.cmds });
  }
  // 2. Title 4 options (con salvataggio)
  {
    const c = new RecordingContext2D();
    ui.renderTitleMenu(c, renderer, 2, [
      { id: "openday", label: "★ MODALITA OPEN DAY (7-10 MIN)", sub: "Missione demo con tutti e 4 i protagonisti!" },
      { id: "campaign_new", label: "AVVIA CAMPAGNA COMPLETA", sub: "6 Cap. • 18 Mappe • 7 Moduli • 4 Finali!" },
      { id: "campaign_continue", label: "CONTINUA CAMPAGNA SALVATA", sub: "Riprendi dall'ultimo checkpoint salvato" },
      { id: "controls", label: "COMANDI & MIXER AUDIO", sub: "Tastiera, Gamepad, Volumi e Filtro CRT [V]" },
    ], mockAudio, true);
    s.push({ label: "2. Menu Principale (4 Voci con Continua)", cmds: c.cmds });
  }
  // 3. Controls & Mixer
  {
    const c = new RecordingContext2D();
    ui.renderControlsScreen(c, mockAudio);
    s.push({ label: "3. Comandi & Mixer Audio", cmds: c.cmds });
  }
  // 4. Pause & Dossier
  {
    const c = new RecordingContext2D();
    const gs = new GameStateManager();
    gs.data.unlockedChars = ["ranaldo", "carlo", "daniele", "ruggero", "francesco"];
    gs.data.trust = { ranaldo: 82, carlo: 76, francesco: 74, ruggero: 68 };
    gs.data.modulesCleared = [true, true, true, true, true, false, false];
    gs.data.eipassScore = 78;
    gs.collectPegaso("peg_01");
    ui.renderPauseAndDossier(c, gs, mockAudio, 0, [
      { id: "resume", label: "Riprendi Partita" },
      { id: "music_vol", label: "Volume Musica: 70% (SX/DX)" },
      { id: "sfx_vol", label: "Volume Effetti: 85% (SX/DX)" },
      { id: "controls", label: "Guida Comandi Completa" },
      { id: "restart_room", label: "Ricomincia Zona Corrente" },
      { id: "openday_reset", label: "Reset Nuovo Visitatore Open Day" },
      { id: "quit_title", label: "Torna al Menu Principale" },
    ], false);
    s.push({ label: "4. Pausa & Dossier Fiducia/Pegaso", cmds: c.cmds });
  }
  // 5. Ending Open Day
  {
    const c = new RecordingContext2D();
    const gs = new GameStateManager();
    gs.reset("openday");
    gs.data.score = 4850;
    gs.data.playTimeSec = 495;
    gs.data.eipassScore = 86;
    gs.data.eipassCorrect = 3;
    gs.data.eipassAnswered = 3;
    gs.data.pegasoCollected = ["peg_01", "peg_05", "peg_09"];
    ui.renderEndingScreen(c, gs);
    s.push({ label: "5. Schermata Finale Open Day", cmds: c.cmds });
  }
  // 6. Ending Campaign S+ Secret
  {
    const c = new RecordingContext2D();
    const gs = new GameStateManager();
    gs.reset("campaign");
    gs.data.score = 19400;
    gs.data.playTimeSec = 2310;
    gs.data.eipassScore = 96;
    gs.data.eipassCorrect = 12;
    gs.data.eipassAnswered = 12;
    gs.data.trust = { ranaldo: 90, carlo: 92, francesco: 88, ruggero: 90 };
    gs.data.pegasoCollected = PEGASO_LORE.map((p) => p.id);
    gs.data.decisionsLog = [{ label: "Analisi Header col Prof" }, { label: "Smentita Ufficiale" }];
    ui.renderEndingScreen(c, gs);
    ui.renderCRTFilter(c);
    s.push({ label: "6. Finale Segreto S+ Campagna (+CRT)", cmds: c.cmds });
  }
  allSheets["AUDIT_1_MENU_UI_FINALI.png"] = s;
}

// =============================================================================
// SHEET 2: TUTTI I 7 RITRATTI DIALOGO & SCELTE NARRATIVE (6 SCENE)
// =============================================================================
{
  const s = [];
  const makeDlgScene = (bp, speaker, expr, text, choices = null, toast = null, focus = null) => {
    const c = new RecordingContext2D();
    const gs = new GameStateManager();
    gs.data.unlockedChars = ["ranaldo", "carlo", "daniele", "ruggero", "francesco"];
    if (toast) gs.pushConsequence(toast, "#ffd147");
    const w = new WorldRuntime(bp, gs, mockAudio, {});
    renderer.renderWorld(c, w);
    ui.renderHUD(c, gs, w, mockAudio);
    const node = { speaker, expr, text, choices, focus: focus || speaker };
    ui.renderDialogue(c, { currentNode: node, charCount: text.length, choiceIndex: 0 });
    return c.cmds;
  };

  s.push({
    label: "1. Ritratto Prof. Ranaldo (45a) + Scelte",
    cmds: makeDlgScene(
      od[0],
      "ranaldo",
      4,
      "Ragazzi, il panico è solo un'equazione con troppe incognite. Come aggiriamo il blocco sul portale?",
      DIALOGUES.od_intro.nodes[4].choices
    ),
  });
  s.push({
    label: "2. Ritratto Carlo (Occhiali + Baffetti!)",
    cmds: makeDlgScene(
      od[0],
      "carlo",
      1,
      "Tre secondi sul cronometro, Prof! Mi piazzo sotto le colonne bianche e mando a canestro quel relè di sblocco!",
      null,
      "★ Carlo si ricorderà della tua fiducia! (+12% Fiducia)"
    ),
  });
  s.push({
    label: "3. Ritratto Francesco (Pianoforte + Cuffie)",
    cmds: makeDlgScene(
      od[2],
      "francesco",
      1,
      "Sentite questo accordo in Do maggiore sulla Master Keyboard? Spezza il rumore del ransomware all'istante!"
    ),
  });
  s.push({
    label: "4. Ritratto Ruggero (Calcio #10)",
    cmds: makeDlgScene(
      od[1],
      "ruggero",
      5,
      "Datemi palla nello spazio lungo il corridoio giallo-bianco: quel muro Glitch lo apro di collo pieno!"
    ),
  });
  s.push({
    label: "5. Ritratto Sofia (Caporedattrice Pegaso)",
    cmds: makeDlgScene(
      camp[13],
      "sofia",
      1,
      "Benvenuti nella Redazione di Pegaso! Recuperate le 12 bozze storiche tra gli 8.000 volumi della Biblioteca!"
    ),
  });
  s.push({
    label: "6. Ritratto Il Sofista Digitale 404-Ω",
    cmds: makeDlgScene(
      camp[17],
      "sofista",
      1,
      "Illusi mortali del Casardi! La mia retorica binaria oscurerà l'Aula Magna prima che inizi l'Open Day!"
    ),
  });
  allSheets["AUDIT_2_DIALOGHI_PERSONAGGI.png"] = s;
}

// =============================================================================
// SHEET 3: TUTTE LE 6 MODALITÀ POSTAZIONE INTERATTIVA EIPASS (6 SCENE)
// =============================================================================
{
  const s = [];
  const makeQuizScene = (quizKey, selIdx = 0, answered = false) => {
    const c = new RecordingContext2D();
    const gs = new GameStateManager();
    const w = new WorldRuntime(od[2], gs, mockAudio, {});
    renderer.renderWorld(c, w);
    const ch = EIPASS_CHALLENGES[quizKey];
    ui.renderQuiz(c, { challenge: ch, selectedIndex: selIdx, answered, wasCorrect: true });
    return c.cmds;
  };
  s.push({ label: "1. EIPASS Phishing Inspector (Mod.4)", cmds: makeQuizScene("qz_phishing_gate", 1) });
  s.push({ label: "2. EIPASS Centralina Hardware (Mod.1)", cmds: makeQuizScene("qz_lab_23pc", 1) });
  s.push({ label: "3. EIPASS Browser HTTPS Verifier (Mod.2)", cmds: makeQuizScene("qz_web_sources", 0) });
  s.push({ label: "4. EIPASS Webmail Segreteria CCN (Mod.3)", cmds: makeQuizScene("qz_pec_ccn", 1) });
  s.push({ label: "5. EIPASS Foglio di Calcolo Live (Mod.6)", cmds: makeQuizScene("qz_excel_formula", 1) });
  s.push({ label: "6. EIPASS Layout Studio Slide (Mod.7)", cmds: makeQuizScene("qz_ppt_openday", 1) });
  allSheets["AUDIT_3_POSTAZIONI_EIPASS.png"] = s;
}

// =============================================================================
// SHEET 4: TUTTI I 6 MINIGIOCHI ARCADE GIOCABILI (6 SCENE)
// =============================================================================
{
  const s = [];
  const makeMgScene = (type, cfg, stepFrames = 25) => {
    const c = new RecordingContext2D();
    const gs = new GameStateManager();
    const mg = new SpecialChallengeManager(mockAudio, gs, fakeSprites);
    const w = new WorldRuntime(od[1], gs, mockAudio, {});
    mg.start(type, cfg, () => {});
    for (let i = 0; i < stepFrames; i++) mg.update(blankInput);
    renderer.renderWorld(c, w);
    mg.render(c);
    return c.cmds;
  };
  s.push({ label: "1. Minigioco Basket (Carlo)", cmds: makeMgScene("basket", { id: "b", goalsNeeded: 3 }) });
  s.push({ label: "2. Studio Pianoforte (Francesco)", cmds: makeMgScene("piano", { id: "p", sequence: [0, 2, 4, 7] }, 140) });
  s.push({ label: "3. Atletica Ostacoli (Ruggero)", cmds: makeMgScene("athletics", { id: "f", hard: false }) });
  s.push({ label: "3b. Salsa Latino-Americana (Daniele)", cmds: makeMgScene("dance", { id: "d", title: "DANIELE — SALSA CUBANA" }) });
  s.push({ label: "4. Calibratore Parabolico (Ranaldo)", cmds: makeMgScene("math", { id: "m", targetA: 3, targetK: 2 }) });
  s.push({ label: "5. Scudo Firewall 23 PC (EIPASS)", cmds: makeMgScene("firewall", { id: "fw", needed: 5 }, 50) });
  s.push({ label: "6. Smistatore File SSD (EIPASS)", cmds: makeMgScene("filesorter", { id: "fs" }, 10) });
  allSheets["AUDIT_4_MINIGIOCHI_ARCADE.png"] = s;
}

// =============================================================================
// SHEET 5: LE 4 ZONE OPEN DAY + 2 SOTTO-AULE INTERNE ESPLORABILI (6 SCENE)
// =============================================================================
{
  const s = [];
  s.push({ label: "1. OD-1 Via d'Aragona 100 (Carlo)", cmds: captureRoom(od[0], "carlo", 14) });
  s.push({
    label: "2. OD-2 Corridoio & Assist Squadra",
    cmds: captureRoom(od[1], "ruggero", 34, (w) => {
      w.assistActor = { charId: "carlo", x: 31 * 16, y: w.player.y, facing: 1, ttl: 24 };
      w.activeBanter = { speaker: "carlo", text: "Vai Ruggero! Sfondiamo quel blocco Glitch di collo pieno!", ttl: 120 };
    }),
  });
  s.push({
    label: "3. Sotto-Aula: Aula 7 (con Mimmo!)",
    cmds: captureRoom(od[1], "carlo", 98, (w) => {
      const sd = w.subDoors.find((d) => !d.inSubRoom);
      if (sd) {
        w.camMinX = sd.subMinC * 16;
        w.camMaxX = sd.subMaxC * 16;
        w.player.x = (sd.subMinC + 10) * 16;
        w.camera.x = w.camMinX;
      }
    }),
  });
  s.push({ label: "4. OD-3 Laboratorio 23 PC (Francesco)", cmds: captureRoom(od[2], "francesco", 22) });
  s.push({
    label: "5. OD-4 Aula Magna Boss (Open Day)",
    cmds: captureRoom(od[3], "carlo", 25, (w) => {
      w.camera.x = Math.min(w.camMaxX - 480, 12 * 16);
    }),
  });
  s.push({
    label: "6. Sotto-Aula: Redazione Pegaso (Sofia)",
    cmds: captureRoom(camp[13], "francesco", 104, (w) => {
      const sd = w.subDoors.find((d) => !d.inSubRoom);
      if (sd) {
        w.camMinX = sd.subMinC * 16;
        w.camMaxX = sd.subMaxC * 16;
        w.player.x = (sd.subMinC + 10) * 16;
        w.camera.x = w.camMinX;
      }
    }),
  });
  allSheets["AUDIT_5_OPEN_DAY_E_SOTTOAULE.png"] = s;
}

// =============================================================================
// SHEET 6: CAMPAGNA CAPITOLI 1 & 2 (c1_1, c1_2, c1_3, c2_1, c2_2, c2_3 Mid-Boss)
// =============================================================================
allSheets["AUDIT_6_CAMPAGNA_CAP1_CAP2.png"] = [
  { label: "1. c1_1 Viale Via d'Aragona 100", cmds: captureRoom(camp[0], "ranaldo", 18) },
  { label: "2. c1_2 Gradinata & Colonne Bianche", cmds: captureRoom(camp[1], "carlo", 28) },
  { label: "3. c1_3 Atrio d'Onore & Scalone", cmds: captureRoom(camp[2], "carlo", 24) },
  { label: "4. c2_1 Corridoio Classico Est", cmds: captureRoom(camp[3], "ruggero", 30) },
  { label: "5. c2_2 Snodo Segreteria & LIM", cmds: captureRoom(camp[4], "ranaldo", 36) },
  {
    label: "6. c2_3 Mid-Boss Bufala-Bot 3000!",
    cmds: captureRoom(camp[5], "francesco", 84, (w) => {
      w.player.x = w.midBoss.x - 74;
      w.camera.x = Math.max(0, w.midBoss.x - 280);
    }),
  },
];

// =============================================================================
// SHEET 7: CAMPAGNA CAPITOLI 3 & 4 (c3_1, c3_2, c3_3, c4_1, c4_2, c4_3 Mid-Boss)
// =============================================================================
allSheets["AUDIT_7_CAMPAGNA_CAP3_CAP4.png"] = [
  { label: "1. c3_1 Cortile dei Pini & Basket", cmds: captureRoom(camp[6], "carlo", 30) },
  { label: "2. c3_2 Campo Sportivo (Ruggero)", cmds: captureRoom(camp[7], "ruggero", 34) },
  { label: "3. c3_3 Palestra Coperta & Tabellone", cmds: captureRoom(camp[8], "carlo", 38) },
  { label: "4. c4_1 Ingresso Rete FESR 23 PC", cmds: captureRoom(camp[9], "francesco", 26) },
  { label: "5. c4_2 Sala Master Keyboard MIDI", cmds: captureRoom(camp[10], "francesco", 38) },
  {
    label: "6. c4_3 Mid-Boss Ransom-Kraken!",
    cmds: captureRoom(camp[11], "carlo", 80, (w) => {
      w.player.x = w.midBoss.x - 78;
      w.camera.x = Math.max(0, w.midBoss.x - 280);
    }),
  },
];

// =============================================================================
// SHEET 8: CAMPAGNA CAPITOLI 5 & 6 (c5_1, c5_2, c5_3, c6_1, c6_2, c6_3 Boss Finale!)
// =============================================================================
allSheets["AUDIT_8_CAMPAGNA_CAP5_CAP6.png"] = [
  { label: "1. c5_1 Biblioteca 8.000 Volumi", cmds: captureRoom(camp[12], "ranaldo", 26) },
  { label: "2. c5_2 Sala Lettura & Pegaso", cmds: captureRoom(camp[13], "francesco", 34) },
  {
    label: "3. c5_3 Fuga dall'Onda Glitch 404-Ω!",
    cmds: captureRoom(camp[14], "ruggero", 28, (w) => {
      w.chaseX = w.player.x - 110;
    }),
  },
  { label: "4. c6_1 Foyer Atelier Didattici", cmds: captureRoom(camp[15], "carlo", 28) },
  { label: "5. c6_2 Vigilia dell'Aula Magna", cmds: captureRoom(camp[16], "francesco", 34) },
  {
    label: "6. c6_3 Aula Magna — Il Sofista 404-Ω!",
    cmds: captureRoom(camp[17], "ranaldo", 25, (w) => {
      w.camera.x = Math.min(w.camMaxX - 480, 12 * 16);
      w.projectiles.push({ kind: "golden_compass", x: 28 * 16, y: 12 * 16 + 6, vx: 4.8, vy: 0, ttl: 50 });
    }),
  },
];

fs.writeFileSync("/tmp/all_48_scenes.json", JSON.stringify(allSheets));

execSync(`python3 - << 'PY'
import json, os, re
from PIL import Image, ImageDraw

with open("/tmp/all_48_scenes.json") as f:
    all_sheets = json.load(f)

sheets = {
    "characters": Image.open("assets/sprites/characters_sheet.png").convert("RGBA"),
    "portraits": Image.open("assets/sprites/portraits_sheet.png").convert("RGBA"),
    "tileset": Image.open("assets/sprites/tileset_casardi.png").convert("RGBA"),
    "enemiesProps": Image.open("assets/sprites/enemies_props.png").convert("RGBA"),
}

def parse_col(c, a=1.0):
    c = c.strip()
    if c.startswith("#"):
        h = c.lstrip("#")
        if len(h) == 3:
            h = "".join(ch*2 for ch in h)
        return (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), int(255*a))
    m = re.match(r"rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([0-9.]+))?\\)", c)
    if m:
        alpha = float(m.group(4)) if m.group(4) is not None else 1.0
        return (int(m.group(1)), int(m.group(2)), int(m.group(3)), int(255*alpha*a))
    return (255, 255, 255, int(255*a))

out_dir = "assets/sprites/audit_48_scene"
os.makedirs(out_dir, exist_ok=True)

for filename, panel_list in all_sheets.items():
    grid_img = Image.new("RGBA", (480*2 + 24, (270 + 18)*3 + 16), (9, 13, 24, 255))
    gd = ImageDraw.Draw(grid_img)

    for idx, item in enumerate(panel_list):
        cmds = item["cmds"]
        im = Image.new("RGBA", (480, 270), (0, 0, 0, 255))
        d = ImageDraw.Draw(im, "RGBA")
        for cmd in cmds:
            op = cmd["op"]
            if op == "fillRect":
                w = max(1, int(round(float(cmd.get("w") or 1))))
                h = max(1, int(round(float(cmd.get("h") or 1))))
                x, y = int(round(float(cmd.get("x") or 0))), int(round(float(cmd.get("y") or 0)))
                col = parse_col(cmd["c"], cmd.get("a", 1.0))
                if col[3] >= 250:
                    d.rectangle([x, y, x + w - 1, y + h - 1], fill=col)
                else:
                    ov = Image.new("RGBA", (w, h), col)
                    im.alpha_composite(ov, (x, y))
                    d = ImageDraw.Draw(im, "RGBA")
            elif op == "strokeRect":
                rx0, ry0 = float(cmd.get("x") or 0), float(cmd.get("y") or 0)
                rw0, rh0 = float(cmd.get("w") or 0), float(cmd.get("h") or 0)
                d.rectangle(
                    [rx0, ry0, rx0 + rw0, ry0 + rh0],
                    outline=parse_col(cmd["c"], cmd.get("a", 1.0)),
                    width=max(1, int(float(cmd.get("lw") or 1))),
                )
            elif op == "fillCircle":
                r = float(cmd.get("r") or 1)
                d.ellipse([cmd["x"] - r, cmd["y"] - r, cmd["x"] + r, cmd["y"] + r], fill=parse_col(cmd["c"]))
            elif op == "strokeCircle":
                r = float(cmd.get("r") or 1)
                d.ellipse([cmd["x"] - r, cmd["y"] - r, cmd["x"] + r, cmd["y"] + r], outline=parse_col(cmd["c"]))
            elif op == "fillPoly":
                d.polygon([(p[0], p[1]) for p in cmd["pts"]], fill=parse_col(cmd["c"]))
            elif op == "strokeLine":
                d.line([(p[0], p[1]) for p in cmd["pts"]], fill=parse_col(cmd["c"]), width=1)
            elif op == "sprite":
                sh = sheets.get(cmd["sheet"])
                if sh:
                    crop = sh.crop((int(cmd["sx"]), int(cmd["sy"]), int(cmd["sx"] + cmd["sw"]), int(cmd["sy"] + cmd["sh"])))
                    if cmd.get("flip"):
                        crop = crop.transpose(Image.FLIP_LEFT_RIGHT)
                    crop = crop.resize((max(1, int(cmd["dw"])), max(1, int(cmd["dh"]))), Image.NEAREST)
                    im.alpha_composite(crop, (int(round(cmd["dx"])), int(round(cmd["dy"]))))
                    d = ImageDraw.Draw(im, "RGBA")

        gx = 8 + (idx % 2) * (480 + 8)
        gy = 8 + (idx // 2) * (270 + 18)
        gd.text((gx + 4, gy + 2), item["label"], fill=(254, 240, 138, 255))
        grid_img.alpha_composite(im, (gx, gy + 16))

    grid_img.save(os.path.join(out_dir, filename))
    print("Renderizzato:", filename)
PY`);
fs.unlinkSync("/tmp/all_48_scenes.json");
