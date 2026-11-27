#!/usr/bin/env node
/**
 * Cattura 6 schermate reali 480x270 eseguendo il vero codice di rendering JS v2.0
 * (`PixelRenderer` + `UIManager` + `pixelFont.js` + `tileset_casardi.png` + `characters_sheet.png` + `portraits_sheet.png` + `enemies_props.png`)
 * e le esporta in `assets/sprites/ANTEPRIMA_SCENE_CASARDI.png` per ispezione visiva pixel-by-pixel!
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
  fillText(text, x, y) {
    this.cmds.push({ op: "fillText", text: String(text), x: this.tx + x, y: this.ty + y, c: this._resolveColor(this.fillStyle), a: this.globalAlpha });
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
const mockAudio = { muted: false, musicVol: 0.7, sfxVol: 0.85, playSfx() {}, playTrack() {}, setDucking() {} };
const od = buildOpenDayLevels();
const camp = buildCampaignLevels();

// Scena 1: Menu Principale v3.0 (Colonne bianche Via d'Aragona 100 visibili al 100% + 4 Protagonisti distinti!)
const ctx1 = new RecordingContext2D();
ui.renderTitleMenu(
  ctx1,
  renderer,
  0,
  [
    { id: "openday", label: "★ MODALITA OPEN DAY (7-10 MIN)", sub: "Missione demo con tutti e 4 i protagonisti!" },
    { id: "campaign_new", label: "AVVIA CAMPAGNA COMPLETA", sub: "6 Cap. • 18 Mappe • 7 Moduli • 4 Finali!" },
    { id: "controls", label: "COMANDI & MIXER AUDIO", sub: "Tastiera, Gamepad, Volumi e Filtro CRT [V]" },
  ],
  mockAudio,
  false
);

// Scena 2: Ritratto Carlo v3.0 (Occhiali neri + Baffetti da foto reale!) + Scelta & Notifica Telltale!
const ctx2 = new RecordingContext2D();
const gs2 = new GameStateManager();
gs2.pushConsequence("★ Carlo si ricorderà della tua fiducia! (+12% Fiducia)", "#ffd147");
const w2 = new WorldRuntime(od[0], gs2, mockAudio, {});
renderer.renderWorld(ctx2, w2);
ui.renderHUD(ctx2, gs2, w2, mockAudio);
const carloNode = {
  speaker: "carlo",
  expr: 1,
  text: "Tre secondi sul cronometro, Prof! Mi piazzo sotto le colonne bianche di Via d'Aragona e sblocco quel relè a canestro!",
};
ui.renderDialogue(ctx2, { currentNode: carloNode, charCount: carloNode.text.length, choiceIndex: 0 });

// Scena 3: Corridoio Casardi + Assist di Squadra [C] (Ruggero #10 + Carlo #23 distinti!)
const ctx3 = new RecordingContext2D();
const gs3 = new GameStateManager();
gs3.data.unlockedChars = ["ranaldo", "carlo", "daniele", "ruggero", "francesco"];
gs3.data.activeChar = "ruggero";
const w3 = new WorldRuntime(od[1], gs3, mockAudio, {});
w3.player.x = 35 * 16;
w3.camera.x = 24 * 16;
w3.assistActor = { charId: "carlo", x: 32 * 16, y: w3.player.y, facing: 1, ttl: 28 };
w3.activeBanter = { speaker: "carlo", text: "Vai Ruggero! Sfondiamo quel blocco Glitch lungo il corridoio!", ttl: 150 };
renderer.renderWorld(ctx3, w3);
ui.renderHUD(ctx3, gs3, w3, mockAudio);

// Scena 4: Postazione Interattiva EIPASS (Simulatore Live Foglio di Calcolo Modulo 6!)
const ctx4 = new RecordingContext2D();
const gs4 = new GameStateManager();
const w4 = new WorldRuntime(camp[8], gs4, mockAudio, {});
renderer.renderWorld(ctx4, w4);
ui.renderQuiz(ctx4, {
  challenge: EIPASS_CHALLENGES.qz_excel_formula,
  selectedIndex: 1,
  answered: false,
  wasCorrect: false,
});

// Scena 5: Biblioteca Storica 8.000 Volumi — Redazione Pegaso (Francesco con cuffie + Sofia!)
const ctx5 = new RecordingContext2D();
const gs5 = new GameStateManager();
gs5.data.unlockedChars = ["ranaldo", "carlo", "daniele", "ruggero", "francesco"];
gs5.data.activeChar = "francesco";
const w5 = new WorldRuntime(camp[13], gs5, mockAudio, {});
const sd5 = w5.subDoors.find((d) => !d.inSubRoom);
if (sd5) {
  w5.camMinX = sd5.subMinC * 16;
  w5.camMaxX = sd5.subMaxC * 16;
  w5.player.x = (sd5.subMinC + 10) * 16;
  w5.player.y = 14 * 16 + 12;
  w5.camera.x = w5.camMinX;
}
w5.projectiles.push({ kind: "music_note", x: w5.player.x + 28, y: w5.player.y + 4, vx: 3.5, vy: -0.4, ttl: 40 });
renderer.renderWorld(ctx5, w5);
ui.renderHUD(ctx5, gs5, w5, mockAudio);

// Scena 6: Gran Finale in Aula Magna v3.0 (Sipario bordeaux, Pianoforte a Coda, Prof. Ranaldo 45a vs Il Sofista 404-Ω!)
const ctx6 = new RecordingContext2D();
const gs6 = new GameStateManager();
gs6.data.unlockedChars = ["ranaldo", "carlo", "daniele", "ruggero", "francesco"];
gs6.data.activeChar = "ranaldo";
const w6 = new WorldRuntime(camp[17], gs6, mockAudio, {});
w6.player.x = 24 * 16;
w6.player.y = 12 * 16 + 12;
w6.camera.x = Math.min(w6.camMaxX - 480, 12 * 16);
w6.projectiles.push({ kind: "golden_compass", x: 28 * 16, y: 12 * 16 + 18, vx: 4.8, vy: 0, ttl: 50 });
renderer.renderWorld(ctx6, w6);
ui.renderHUD(ctx6, gs6, w6, mockAudio);

fs.writeFileSync(
  "/tmp/scenes_cmds_v2.json",
  JSON.stringify([ctx1.cmds, ctx2.cmds, ctx3.cmds, ctx4.cmds, ctx5.cmds, ctx6.cmds])
);

execSync(`python3 - << 'PY'
import json, re
from PIL import Image, ImageDraw

with open("/tmp/scenes_cmds_v2.json") as f:
    scenes = json.load(f)

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

grid_img = Image.new("RGBA", (480*2 + 24, 270*3 + 32), (10, 14, 26, 255))

for idx, cmds in enumerate(scenes):
    im = Image.new("RGBA", (480, 270), (0, 0, 0, 255))
    d = ImageDraw.Draw(im, "RGBA")
    for cmd in cmds:
        op = cmd["op"]
        if op == "fillRect":
            w, h = max(1, int(round(cmd["w"]))), max(1, int(round(cmd["h"])))
            x, y = int(round(cmd["x"])), int(round(cmd["y"]))
            col = parse_col(cmd["c"], cmd.get("a", 1.0))
            if col[3] >= 250:
                d.rectangle([x, y, x + w - 1, y + h - 1], fill=col)
            else:
                ov = Image.new("RGBA", (w, h), col)
                im.alpha_composite(ov, (x, y))
                d = ImageDraw.Draw(im, "RGBA")
        elif op == "strokeRect":
            d.rectangle(
                [cmd["x"], cmd["y"], cmd["x"] + cmd["w"], cmd["y"] + cmd["h"]],
                outline=parse_col(cmd["c"], cmd.get("a", 1.0)),
                width=max(1, int(cmd.get("lw", 1))),
            )
        elif op == "fillCircle":
            r = cmd["r"]
            d.ellipse([cmd["x"] - r, cmd["y"] - r, cmd["x"] + r, cmd["y"] + r], fill=parse_col(cmd["c"]))
        elif op == "strokeCircle":
            r = cmd["r"]
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
    gy = 8 + (idx // 2) * (270 + 8)
    grid_img.alpha_composite(im, (gx, gy))

grid_img.save("assets/sprites/ANTEPRIMA_SCENE_CASARDI.png")
print("Salvata ANTEPRIMA_SCENE_CASARDI.png (6 scene v2.0)!")
PY`);
fs.unlinkSync("/tmp/scenes_cmds_v2.json");
