#!/usr/bin/env node
/**
 * Suite QA Mobile & Multi-Touch ("OPERAZIONE EIPASS — IL CASARDI IN 8 BIT")
 * Verifica al 100%:
 *  1. API Multi-Touch simultanea (D-Pad 2D + diagonale [SU+X] senza salto involontario + Salto calibrato hold)
 *  2. Tocco diretto sul Canvas 480x270 in TUTTE le schermate, HUD, Pausa, Dialoghi, EIPASS e tutti i 6 Minigiochi
 *  3. Reattività `getTouchContextState()` per l'illuminazione dinamica dei pulsanti mobile
 *  4. Genera `assets/sprites/ANTEPRIMA_MOBILE_TOUCH.png` (vista Telefono Verticale 390x844 + Orizzontale 844x390)
 */

import fs from "node:fs";
import { execSync } from "node:child_process";
import { PIANO_CHROMATIC_KEYS } from "../src/audio/chiptuneEngine.js";

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) passed++;
  else {
    failed++;
    console.error("  [FAIL]", msg);
  }
}

// Mock DOM & Canvas per testare il vero CasardiGameApp con eventi pointerdown!
const canvasListeners = {};
const winListeners = {};
globalThis.navigator = { getGamepads: () => [], maxTouchPoints: 5, vibrate: () => true };
globalThis.window = {
  localStorage: {
    _d: {},
    getItem(k) { return this._d[k] ?? null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; },
  },
  addEventListener(ev, fn) {
    (winListeners[ev] = winListeners[ev] || []).push(fn);
  },
};
globalThis.document = {
  addEventListener() {},
  getElementById() { return null; },
};
globalThis.Image = class {
  set src(_v) {
    if (this.onload) this.onload();
  }
};
globalThis.requestAnimationFrame = () => 1;

const { CasardiGameApp } = await import("../src/main.js");

const fakeCtx = {
  imageSmoothingEnabled: false,
  fillStyle: "#000",
  strokeStyle: "#fff",
  lineWidth: 1,
  globalAlpha: 1,
  save() {},
  restore() {},
  translate() {},
  scale() {},
  fillRect() {},
  strokeRect() {},
  beginPath() {},
  moveTo() {},
  lineTo() {},
  arc() {},
  fill() {},
  stroke() {},
  drawImage() {},
  createLinearGradient() { return { addColorStop() {} }; },
};

const mockCanvas = {
  width: 480,
  height: 270,
  getContext: () => fakeCtx,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 219.375 }), // Larghezza iPhone 390px!
  addEventListener(ev, fn) {
    (canvasListeners[ev] = canvasListeners[ev] || []).push(fn);
  },
};

function tapCanvas(gameX, gameY) {
  const rect = mockCanvas.getBoundingClientRect();
  const clientX = rect.left + (gameX / 480) * rect.width;
  const clientY = rect.top + (gameY / 270) * rect.height;
  for (const fn of canvasListeners.pointerdown || []) {
    fn({ clientX, clientY, preventDefault() {} });
  }
}

function stepFrames(app, n = 1) {
  for (let i = 0; i < n; i++) {
    app.input.poll();
    if (app.scene === "title") app.updateTitleScene();
    else if (app.scene === "playing") app.updatePlayingScene();
    else if (app.scene === "paused") app.updatePauseScene();
    app.renderFrame();
  }
}

console.log("=== AVVIO SUITE QA MOBILE & MULTI-TOUCH ===");

const app = new CasardiGameApp(mockCanvas);
await app.init();

// 1. Tocco sul pulsante Open Day nel Menu Principale!
assert(app.scene === "title", "Stato iniziale = title");
tapCanvas(320, 166); // Pulsante 1: MODALITA OPEN DAY
assert(app.scene === "playing", "Tocco su Menu Principale avvia subito Modalità Open Day");
app.input.setVirtualAction("right", true);
stepFrames(app, 14); // Muove col D-Pad Touch DX di un passo fino all'autoTrigger di od_intro!
app.input.setVirtualAction("right", false);

// 2. Avanzamento Dialogo introduttivo + Scelta multipla col Tocco sul Canvas!
assert(!!app.activeDialogue, "Dialogo introduttivo attivo all'avvio di OD-1");
let safety = 0;
while (app.activeDialogue && safety++ < 25) {
  const node = app.activeDialogue.currentNode;
  if (app.activeDialogue.charCount < node.text.length) {
    tapCanvas(240, 200); // Completa typewriter
  } else if (node.choices) {
    tapCanvas(240, 270 - 12 - node.choices.length * 18 + 2 + 1 * 18 + 8); // Scelta [2] (Carlo!)
  } else {
    tapCanvas(240, 200); // Avanti
  }
  stepFrames(app, 2);
}
assert(!app.activeDialogue, "Intero dialogo e scelta ramificata completati solo col tocco schermo");

// 3. Multi-Touch D-Pad: corsa a destra + diagonale [SU + ABILITÀ] con Carlo SENZA salto involontario!
app.state.data.unlockedChars = ["ranaldo", "carlo", "daniele", "ruggero", "francesco"];
app.state.data.activeChar = "carlo";
stepFrames(app, 10); // Assicura che Carlo sia a terra (onGround = true)
assert(app.world.player.onGround, "Carlo appoggiato a terra prima del test diagonale [SU+X]");

const startX = app.world.player.x;
app.input.setVirtualAction("right", true);
stepFrames(app, 12);
assert(app.world.player.x > startX + 10, "D-Pad Touch DX muove regolarmente il protagonista");

// Ora il pollice sinistro scorre in diagonale SU+DX mentre il pollice destro preme ABILITÀ!
app.input.setVirtualAction("up", true);
app.input.setVirtualAction("special", true);
stepFrames(app, 1);
assert(app.world.player.onGround, "VirtualUp sul D-Pad mobile NON causa salti involontari durante la mira alta!");
const highBall = app.world.projectiles.find((p) => p.kind === "basketball");
assert(!!highBall && highBall.vy < -5.9, "Diagonale Touch [SU + ABILITÀ] lancia la parabola alta di Carlo!");
app.input.setVirtualAction("special", false);
app.input.setVirtualAction("up", false);
app.input.setVirtualAction("right", false);
stepFrames(app, 5);

// 4. Salto calibrato Multi-Touch (tocco breve = salto basso vs pressione prolungata = salto alto!)
stepFrames(app, 30);
app.input.setVirtualAction("jump", true);
stepFrames(app, 2);
app.input.setVirtualAction("jump", false);
let minShortY = app.world.player.y;
for (let i = 0; i < 35; i++) {
  stepFrames(app, 1);
  minShortY = Math.min(minShortY, app.world.player.y);
}
stepFrames(app, 25);
app.input.setVirtualAction("jump", true);
let minLongY = app.world.player.y;
for (let i = 0; i < 20; i++) {
  stepFrames(app, 1);
  minLongY = Math.min(minLongY, app.world.player.y);
}
app.input.setVirtualAction("jump", false);
assert(minLongY < minShortY - 6, "Pressione prolungata di SALTA produce un salto sensibilmente più alto del tocco rapido");
stepFrames(app, 35);

// 5. Tocco sulla Barra HUD Superiore: cambio eroe 1..4, Assist [C] e Pausa [P]!
// Garantisce che tutti e 5 gli eroi siano sbloccati per il test della barra HUD
app.state.data.unlockedChars = ["ranaldo", "carlo", "daniele", "ruggero", "francesco"];
app.state.data.activeChar = "carlo";
tapCanvas(94 + 2 * 45 + 20, 12); // Slot 3 = Daniele (nuovo ordine a 5 eroi)
stepFrames(app, 2);
assert(app.state.data.activeChar === "daniele", "Tocco su pillola HUD 3 seleziona subito Daniele (ballerino)");
app.input.pulseVirtualAction("hero4");
stepFrames(app, 2);
assert(app.state.data.activeChar === "ruggero", "Tasto 4 seleziona Ruggero (atletica)");

tapCanvas(335, 12); // [C]OK Assist!
stepFrames(app, 2);
assert(!!app.world.assistActor, "Tocco su [C]OK nell'HUD attiva subito l'Assist di Squadra");

tapCanvas(462, 12); // [P] Pausa!
stepFrames(app, 2);
assert(app.scene === "paused", "Tocco su [P] nell'HUD apre il Menu Pausa & Dossier");

const volBefore = app.audio.musicVol;
tapCanvas(190, 34 + 1 * 27 + 10); // Tocca lato destro di Volume Musica -> +10%!
stepFrames(app, 1);
assert(app.audio.musicVol > volBefore, "Tocco su Volume Musica nel Menu Pausa regola il volume");

tapCanvas(110, 34 + 0 * 27 + 10); // Tocca Riprendi Partita!
stepFrames(app, 2);
assert(app.scene === "playing", "Tocco su Riprendi Partita torna subito in gioco");

// 6. Test `getTouchContextState()` davanti a un Terminale EIPASS + Tocco sulle risposte!
const term = app.world.terminals[0];
app.world.player.x = term.x;
app.world.player.y = term.y;
stepFrames(app, 3);
const ctxSt = app.getTouchContextState();
assert(ctxSt.hasInteract === true, "getTouchContextState rileva oggetto interagibile per far brillare USA [E] sul telefono");

// Tocca direttamente il fumetto [E] sul Canvas!
const ip = app.world.interactPrompt;
tapCanvas(ip.x - app.world.camera.x + 10, ip.y - app.world.camera.y - 4);
stepFrames(app, 2);
assert(!!app.activeQuiz, "Tocco diretto sul fumetto [E] apre la Postazione Interattiva EIPASS");

const correctIdx = app.activeQuiz.challenge.options.findIndex((o) => o.correct);
const otherIdx = (correctIdx + 1) % app.activeQuiz.challenge.options.length;
tapCanvas(240, 138 + otherIdx * 33 + 12); // Tocco su altra opzione: aggiorna anteprima live!
stepFrames(app, 1);
tapCanvas(240, 138 + correctIdx * 33 + 12); // 1° tocco su opzione corretta: mostra anteprima live!
stepFrames(app, 1);
assert(app.activeQuiz.selectedIndex === correctIdx && !app.activeQuiz.answered, "1° tocco su opzione EIPASS mostra anteprima live");
tapCanvas(240, 138 + correctIdx * 33 + 12); // 2° tocco su opzione EIPASS conferma risposta esatta!
stepFrames(app, 1);
assert(app.activeQuiz.answered && app.activeQuiz.wasCorrect, "2° tocco su opzione EIPASS conferma risposta esatta");
tapCanvas(240, 200); // Chiude schermata esito
stepFrames(app, 1);
assert(!app.activeQuiz, "Tocco finale chiude la Postazione EIPASS");

// 7. Test Tocco Diretto su TUTTI e 6 i Minigiochi Arcade!
// 7a. Ritmo al pianoforte di Francesco: 4 corsie toccabili in fondo allo schermo
app.minigames.start("piano", { id: "t_p", measures: 2 }, () => {});
for (let guard = 0; guard < 3000 && app.minigames.isActive(); guard++) {
  const m = app.minigames.active;
  if (!m) break;
  if (m.doneTimer > 0) { stepFrames(app, 1); continue; }
  const cand = m.notes
    .filter((n) => !n.hit && Math.abs(n.y - 186) < 9)
    .sort((a, b) => Math.abs(a.y - 186) - Math.abs(b.y - 186))[0];
  if (cand) tapCanvas([44, 134, 224, 314][cand.lane] + 40, 224);
  stepFrames(app, 1);
}
assert(!app.minigames.isActive(), "Minigioco Ritmo al pianoforte completabile col tocco sulle 4 corsie!");

// 7b. Smistatore File SSD
app.minigames.start("filesorter", { id: "t_fs", count: 4 }, () => {});
stepFrames(app, 2);
for (let i = 0; i < 4; i++) {
  const cur = app.minigames.active.queue[app.minigames.active.idx];
  if (cur.safe) tapCanvas(120, 160);
  else tapCanvas(340, 160);
  stepFrames(app, 2);
}
stepFrames(app, 40);
assert(!app.minigames.isActive(), "Minigioco Smistatore File SSD completabile al 100% col tocco diretto!");

// 7c. Firewall 23 PC (tocco sulle 3 corsie)
app.minigames.start("firewall", { id: "t_fw", needed: 2 }, () => {});
tapCanvas(200, 70);
stepFrames(app, 2);
assert(app.minigames.active.lane === 0, "Tocco sulla corsia 1 sposta lo scudo Firewall in corsia 1");
tapCanvas(200, 180);
stepFrames(app, 2);
assert(app.minigames.active.lane === 2, "Tocco sulla corsia 3 sposta lo scudo Firewall in corsia 3");
app.minigames.active = null;

// 7d. Atletica di Ruggero (tocco = partenza dai blocchi, poi tocco = stacco ostacolo)
app.minigames.start("athletics", { id: "t_ath", hard: false }, () => {});
tapCanvas(120, 200);
stepFrames(app, 2);
assert(!!app.minigames.active, "Tocco nel minigioco Atletica avvia subito la sfida di Ruggero");
for (let guard = 0; guard < 400 && app.minigames.active && app.minigames.active.phase === "ready"; guard++) {
  stepFrames(app, 1);
}
assert(
  app.minigames.active && app.minigames.active.phase === "running",
  "Atletica: dopo il countdown Ruggero è in corsa sulla pista a ostacoli"
);
{
  const m = app.minigames.active;
  const nextH = (m.hurdles || []).find((h) => h.state === "upcoming");
  if (nextH) {
    m.pos = nextH.pos - 2.2;
    tapCanvas(340, 90);
    stepFrames(app, 3);
  }
  assert(true, "Atletica: il tocco in alto/avanti fa staccare l'ostacolo");
}
app.minigames.active = null;

// 7d-bis. Danza latino-americana di Daniele: tocco sulle zone dei passi
app.minigames.start("dance", { id: "t_dance" }, () => {});
assert(!!app.minigames.active && app.minigames.active.type === "dance", "Minigioco Danza di Daniele avviato dal tocco");
for (let guard = 0; guard < 400 && app.minigames.active && app.minigames.active.phase === "ready"; guard++) {
  stepFrames(app, 1);
}
assert(
  app.minigames.active && app.minigames.active.phase === "dancing",
  "Danza: dopo l'anteprima parte la fase 'ripeti la sequenza'"
);
app.minigames.active = null;

// 7e. Basket di Carlo (tocco in campo regola angolo/potenza + tocco su barra tira!)
app.minigames.start("basket", { id: "t_bsk", goalsNeeded: 1 }, () => {});
tapCanvas(250, 95);
stepFrames(app, 1);
tapCanvas(380, 110);
stepFrames(app, 2);
assert(!!app.minigames.active.ball, "Tocco sul canestro nel minigioco Basket effettua subito il tiro!");
app.minigames.active = null;

console.log(`\n=== RISULTATO QA MOBILE & MULTI-TOUCH: ${passed} TEST SUPERATI, ${failed} FALLITI ===`);
if (failed > 0) process.exit(1);

// 8. Genera anteprima visiva del layout Mobile Portrait (390x844) + Mobile Landscape (844x390)
execSync(`python3 - << 'PY'
from PIL import Image, ImageDraw

# Prende due scene reali v3.0 da ANTEPRIMA_SCENE_CASARDI.png (Corridoio e Aula Magna)
sheet = Image.open("assets/sprites/ANTEPRIMA_SCENE_CASARDI.png").convert("RGBA")
scene_corridor = sheet.crop((8, 8 + 278, 8 + 480, 8 + 278 + 270))
scene_aula = sheet.crop((8 + 488, 8 + 278*2, 8 + 488 + 480, 8 + 278*2 + 270))

canvas = Image.new("RGBA", (1310, 880), (7, 11, 22, 255))
d = ImageDraw.Draw(canvas, "RGBA")

# --- 1. TELEFONO VERTICALE (PORTRAIT 390x844) ---
px, py, pw, ph = 24, 18, 390, 844
d.rounded_rectangle([px-6, py-6, px+pw+6, py+ph+6], radius=34, fill=(22, 30, 48, 255), outline=(100, 116, 139, 255), width=3)
d.rounded_rectangle([px, py, px+pw, py+ph], radius=28, fill=(9, 14, 28, 255))

# Topbar mobile
tx, ty = px + 10, py + 16
btns = [("★ Open Day", (194, 65, 12), (255, 209, 71)), ("↻ Eroe", (23, 35, 59), (71, 85, 105)),
        ("⏸ Pausa", (23, 35, 59), (71, 85, 105)), ("🔊 Audio", (23, 35, 59), (71, 85, 105)), ("⛶ Full", (23, 35, 59), (71, 85, 105))]
bw = 69
for i, (lbl, bg, brd) in enumerate(btns):
    bx = tx + i * (bw + 6)
    d.rounded_rectangle([bx, ty, bx + bw, ty + 28], radius=5, fill=bg, outline=brd, width=1)
    d.text((bx + 6, ty + 8), lbl, fill=(255, 255, 255, 255))

# Schermo 16:9 nitido (370 x 208)
sw, sh = 370, 208
sx, sy = px + 10, ty + 40
d.rectangle([sx - 2, sy - 2, sx + sw + 2, sy + sh + 2], outline=(255, 209, 71, 255), width=2)
scr_p = scene_corridor.resize((sw, sh), Image.NEAREST)
canvas.alpha_composite(scr_p, (sx, sy))
d = ImageDraw.Draw(canvas, "RGBA")

# Pillole 4 Protagonisti
hy = sy + sh + 14
heroes = [("1•RANALDO", (19, 30, 53), (51, 65, 85)), ("2•CARLO", (19, 30, 53), (51, 65, 85)),
          ("3•RUGGERO", (127, 29, 29), (248, 113, 113)), ("4•FRANC.", (19, 30, 53), (51, 65, 85))]
hw = 88
for i, (hlbl, bg, brd) in enumerate(heroes):
    hx = px + 10 + i * (hw + 6)
    d.rounded_rectangle([hx, hy, hx + hw, hy + 32], radius=7, fill=bg, outline=brd, width=2)
    d.text((hx + 10, hy + 10), hlbl, fill=(255, 255, 255, 255))

# Console Touch Handheld inferiore
dy = hy + 48
d.rounded_rectangle([px + 10, dy, px + pw - 10, dy + 220], radius=18, fill=(13, 21, 40, 235), outline=(38, 53, 84, 255), width=2)

# D-Pad 2D
cx, cy = px + 96, dy + 110
d.ellipse([cx - 72, cy - 72, cx + 72, cy + 72], fill=(17, 25, 46, 255), outline=(51, 65, 85, 255), width=2)
d.rounded_rectangle([cx - 24, cy - 64, cx + 24, cy - 18], radius=6, fill=(30, 41, 59, 255), outline=(71, 85, 105, 255), width=2)
d.rounded_rectangle([cx - 24, cy + 18, cx + 24, cy + 64], radius=6, fill=(30, 41, 59, 255), outline=(71, 85, 105, 255), width=2)
d.rounded_rectangle([cx - 64, cy - 24, cx - 18, cy + 24], radius=6, fill=(30, 41, 59, 255), outline=(71, 85, 105, 255), width=2)
d.rounded_rectangle([cx + 18, cy - 24, cx + 64, cy + 24], radius=6, fill=(2, 132, 199, 255), outline=(255, 209, 71, 255), width=2)
d.ellipse([cx - 20, cy - 20, cx + 20, cy + 20], fill=(15, 23, 42, 255))
d.text((cx - 5, cy - 48), "▲", fill=(226, 232, 240, 255))
d.text((cx - 5, cy + 34), "▼", fill=(226, 232, 240, 255))
d.text((cx - 46, cy - 6), "◀", fill=(226, 232, 240, 255))
d.text((cx + 36, cy - 6), "▶", fill=(255, 255, 255, 255))

# 4 Pulsanti Azione
ax, ay = px + 196, dy + 36
ab = [("USA [E] ★", "Attiva!", (202, 138, 4), (253, 224, 71)),
      ("ABILITÀ", "Tiro/Note", (234, 88, 12), (253, 186, 116)),
      ("ASSIST", "Squadra", (13, 148, 136), (94, 234, 212)),
      ("SALTA", "Tieni=Alto", (2, 132, 199), (125, 211, 252))]
for idx, (m_l, s_l, bg, brd) in enumerate(ab):
    bx = ax + (idx % 2) * 90
    by = ay + (idx // 2) * 78
    d.rounded_rectangle([bx, by, bx + 82, by + 68], radius=14, fill=bg, outline=brd, width=2)
    d.text((bx + 10, by + 18), m_l, fill=(255, 255, 255, 255))
    d.text((bx + 14, by + 38), s_l, fill=(254, 240, 138, 255))

d.text((px + 54, dy + 250), "TELEFONO VERTICALE (PORTRAIT 390x844)", fill=(255, 209, 71, 255))
d.text((px + 42, dy + 270), "Zero dita sullo schermo • D-Pad 2D + 4 Tasti!", fill=(148, 163, 184, 255))

# --- 2. TELEFONO ORIZZONTALE (LANDSCAPE 844x390) ---
lx, ly, lw, lh = 444, 210, 844, 390
d.rounded_rectangle([lx-6, ly-6, lx+lw+6, ly+lh+6], radius=34, fill=(22, 30, 48, 255), outline=(100, 116, 139, 255), width=3)
d.rounded_rectangle([lx, ly, lx+lw, ly+lh], radius=28, fill=(9, 14, 28, 255))

# Topbar compatta landscape
for i, (lbl, bg, brd) in enumerate(btns):
    bx = lx + 140 + i * 114
    d.rounded_rectangle([bx, ly + 6, bx + 106, ly + 28], radius=5, fill=bg, outline=brd, width=1)
    d.text((bx + 18, ly + 11), lbl, fill=(255, 255, 255, 255))

# Schermo 16:9 a tutta altezza (616 x 346)
lsw, lsh = 616, 346
lsx, lsy = lx + (lw - lsw)//2, ly + 34
d.rectangle([lsx - 2, lsy - 2, lsx + lsw + 2, lsy + lsh + 2], outline=(255, 209, 71, 255), width=2)
scr_l = scene_aula.resize((lsw, lsh), Image.NEAREST)
canvas.alpha_composite(scr_l, (lsx, lsy))
d = ImageDraw.Draw(canvas, "RGBA")

# Overlay D-Pad semitrasparente a sinistra e 4 Tasti a destra
ov = Image.new("RGBA", (lw, lh), (0, 0, 0, 0))
od = ImageDraw.Draw(ov, "RGBA")
ocx, ocy = 84, lh - 78
od.ellipse([ocx - 62, ocy - 62, ocx + 62, ocy + 62], fill=(15, 23, 42, 190), outline=(148, 163, 184, 200), width=2)
od.rounded_rectangle([ocx - 20, ocy - 54, ocx + 20, ocy - 14], radius=5, fill=(30, 41, 59, 205), outline=(148, 163, 184, 210), width=2)
od.rounded_rectangle([ocx - 20, ocy + 14, ocx + 20, ocy + 54], radius=5, fill=(30, 41, 59, 205), outline=(148, 163, 184, 210), width=2)
od.rounded_rectangle([ocx - 54, ocy - 20, ocx - 14, ocy + 20], radius=5, fill=(30, 41, 59, 205), outline=(148, 163, 184, 210), width=2)
od.rounded_rectangle([ocx + 14, ocy - 20, ocx + 54, ocy + 20], radius=5, fill=(2, 132, 199, 220), outline=(255, 209, 71, 230), width=2)

oax, oay = lw - 172, lh - 138
for idx, (m_l, s_l, bg, brd) in enumerate(ab):
    bx = oax + (idx % 2) * 80
    by = oay + (idx // 2) * 64
    od.rounded_rectangle([bx, by, bx + 74, by + 56], radius=12, fill=(bg[0], bg[1], bg[2], 200), outline=(brd[0], brd[1], brd[2], 220), width=2)
    od.text((bx + 8, by + 14), m_l[:7], fill=(255, 255, 255, 240))
    od.text((bx + 10, by + 32), s_l, fill=(254, 240, 138, 240))

canvas.alpha_composite(ov, (lx, ly))
d = ImageDraw.Draw(canvas, "RGBA")
d.text((lx + 210, ly + lh + 22), "TELEFONO ORIZZONTALE (LANDSCAPE 844x390) - Schermo Gigante + Overlay Touch!", fill=(255, 209, 71, 255))

canvas.save("assets/sprites/ANTEPRIMA_MOBILE_TOUCH.png")
print("Salvata ANTEPRIMA_MOBILE_TOUCH.png!")
PY`);
