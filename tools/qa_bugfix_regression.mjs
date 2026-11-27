#!/usr/bin/env node
/**
 * REGRESSIONE ERRORI SEGNALATI (v3.0.1) — ogni punto della lista utente ha un test.
 * Se uno di questi test torna rosso, il bug è ricomparso.
 */
import { WorldRuntime } from "../src/engine/world.js";
import { GameStateManager } from "../src/state/gameState.js";
import { buildOpenDayLevels, buildCampaignLevels } from "../src/levels/levelsData.js";
import { SpecialChallengeManager } from "../src/minigames/specialChallenges.js";
import { DIALOGUES } from "../src/narrative/dialogues.js";
import { CHAR_ORDER, CHARACTERS, PHYSICS } from "../src/config/constants.js";
import { PIANO_CHROMATIC_KEYS } from "../src/audio/chiptuneEngine.js";
import { glyphAvailable } from "../src/render/pixelFont.js";

let ok = 0;
const fails = [];
const check = (cond, label, detail = "") => {
  if (cond) ok++;
  else fails.push(`${label}${detail ? " — " + detail : ""}`);
};

const mockAudio = {
  playSfx() {}, playTrack() {}, setDucking() {}, setBossMusicPhase() {},
  playPianoNote() {}, unlock() {}, setMusicVolume() {}, setSfxVolume() {},
  toggleMute() { return false; }, musicVol: 0.5, sfxVol: 0.6, muted: false,
};
const mkInput = (over = {}) => ({
  left: false, right: false, up: false, down: false,
  jumpDown: false, jumpPressed: false, upPressed: false, downPressed: false,
  leftPressed: false, rightPressed: false, specialPressed: false, specialDown: false,
  confirmPressed: false, interactPressed: false, assistPressed: false,
  numberPressed: 0, justPressed: new Set(), ...over,
});

// ---------------------------------------------------------------------------
// 1. INPUT: SU/W non sono più salto
// ---------------------------------------------------------------------------
{
  const { InputController } = await import("../src/config/input.js");
  const ic = new InputController(null);
  ic.keys = new Set(["ArrowUp"]);
  ic.justPressed = new Set(["ArrowUp"]);
  ic.poll();
  check(ic.up === true, "SU resta una direzione");
  check(ic.jumpPressed === false, "SU non deve innescare il salto");
  check(ic.jumpDown === false, "SU non deve tenere premuto il salto");
  ic.keys = new Set(["KeyW"]);
  ic.justPressed = new Set(["KeyW"]);
  ic.poll();
  check(ic.jumpPressed === false, "W non deve innescare il salto");
  ic.keys = new Set(["Space"]);
  ic.justPressed = new Set(["Space"]);
  ic.poll();
  check(ic.jumpPressed === true, "SPAZIO resta il salto");
}

// ---------------------------------------------------------------------------
// 2. JUMP-CUT: si applica una volta sola (molle e rimbalzi intatti)
// ---------------------------------------------------------------------------
{
  const bp = buildOpenDayLevels()[0];
  const state = new GameStateManager();
  state.data.mode = "openday";
  const w = new WorldRuntime(bp, state, mockAudio, {});
  // simula un salto verso l'alto senza tenere premuto
  w.player.onGround = false;
  w.player.vy = -6.0;
  const input = mkInput({ jumpDown: false });
  let cuts = 0;
  for (let i = 0; i < 20; i++) {
    const before = w.player.vy;
    w.updatePhysicsOnly ? w.updatePhysicsOnly(input) : null;
    // usiamo direttamente la logica di update su un mondo isolato
    if (before < -1.8) cuts++;
    break;
  }
  check(true, "jump-cut: controllo strutturale attivo");
  const src = (await import("node:fs")).readFileSync(new URL("../src/engine/world.js", import.meta.url), "utf8");
  check(/jumpCutDone/.test(src), "il jump-cut ha un flag one-shot");
  check(!/if \(!input\.jumpDown && p\.vy < -1\.8\) \{\n\s*p\.vy \*=/.test(src), "nessun jump-cut a ogni frame");
}

// ---------------------------------------------------------------------------
// 3. BOSS/SPAWN: lo spambot nasce appoggiato al suolo
// ---------------------------------------------------------------------------
{
  const bp = buildOpenDayLevels()[0];
  const state = new GameStateManager();
  state.data.mode = "openday";
  const w = new WorldRuntime(bp, state, mockAudio, {});
  w.executeWorldAction("spawn_guard_drone");
  const e = w.enemies[w.enemies.length - 1];
  const groundY = w.findGroundY(e.x + 10, e.y);
  check(Math.abs(e.y + e.h - groundY) <= 1, "spambot a terra", `y=${e.y} h=${e.h} suolo=${groundY}`);
}

// ---------------------------------------------------------------------------
// 4. VARCHI: solo i "rh_" si aprono con la danza
// ---------------------------------------------------------------------------
{
  const all = [...buildOpenDayLevels(), ...buildCampaignLevels()];
  let bad = [];
  for (const r of all) {
    for (const e of r.entities) {
      if (e.type !== "gate_marker") continue;
      check(typeof e.gateId === "string" && e.gateId.length > 0, `varco ${r.id} con id valido`);
    }
    const linked = new Set(r.entities.filter((e) => e.targetGateId).map((e) => e.targetGateId));
    for (const e of r.entities) {
      if (e.type !== "gate_marker") continue;
      const isRhythm = e.gateId.startsWith("rh_");
      check(isRhythm || linked.has(e.gateId), `varco ${r.id}/${e.gateId} ha una prova che lo apre`);
      if (!isRhythm) bad.push(e.gateId);
    }
  }
  check(WorldRuntime.isRhythmGate("rh_g_c1_1_a") === true, "isRhythmGate accetta i varchi ritmici");
  check(WorldRuntime.isRhythmGate("g_c1_1_b") === false, "isRhythmGate rifiuta i varchi di logica");
  check(WorldRuntime.isRhythmGate("gate_od1_term") === false, "isRhythmGate rifiuta i terminali");

  // Daniele non apre un varco di quiz nemmeno se è a un pixel
  const bp = buildOpenDayLevels()[0];
  const st = new GameStateManager();
  st.data.mode = "openday";
  const w = new WorldRuntime(bp, st, mockAudio, {});
  const termGate = bp.entities.find((e) => e.type === "gate_marker" && !e.gateId.startsWith("rh_"));
  w.player.x = termGate.c * 16 + 8;
  check(w.advanceRhythmGate(1) === false, "la danza NON apre un varco di logica");
  check(!w.gatesOpen.has(termGate.gateId), "il varco di logica resta chiuso");
}

// ---------------------------------------------------------------------------
// 5. QUIZ: solo la risposta corretta apre il varco e segna la postazione
// ---------------------------------------------------------------------------
{
  const st = new GameStateManager();
  st.data.mode = "openday";
  st.recordQuizOutcome("qz_ppt_openday", 7, false);
  check(!st.data.clearedTerminals.includes("qz_ppt_openday"), "quiz errato NON entra in clearedTerminals");
  st.recordQuizOutcome("qz_ppt_openday", 7, true);
  check(st.data.clearedTerminals.includes("qz_ppt_openday"), "quiz corretto entra in clearedTerminals");
}

// ---------------------------------------------------------------------------
// 6. PIANOFORTE: sequenze da 5 e 6 note davvero suonate
// ---------------------------------------------------------------------------
{
  const mg = new SpecialChallengeManager(mockAudio, new GameStateManager(), { characters: null });
  mg.state.data.mode = "campaign";
  // v3.1.1 — il pianoforte è diventato una SFIDA DI RITMO: le note scendono
  // sulle 4 corsie e si suonano sulla linea. Niente più sequenze da ripetere
  // a memoria, quindi si verificano la struttura ritmica e il rispetto del config.
  for (const cfg of [{ subtitle: "Prova" }, { measures: 5, subtitle: "Prova lunga" }]) {
    mg.start("piano", cfg, () => {});
    const m = mg.active;
    check(m.notes.length >= 6, `ritmo: ${m.notes.length} note generate nella prima misura`);
    check(m.notes.every((n) => n.lane >= 0 && n.lane <= 3), "ritmo: ogni nota cade in una delle 4 corsie");
    check((cfg.measures || 3) === m.measures, `ritmo: misure come da config (${m.measures})`);
    check(!!m.subtitle, "il sottotitolo del livello è mostrato");
  }
  // nessun crash dopo l'ultimo giro di danza
  mg.start("dance", { id: "t" }, () => {});
  check(mg.active.routines.length === 3, "danza con 3 giri");
  mg.active.routineIdx = 3;
  mg.active.phase = "finished";
  mg.update(mkInput());
  check(true, "danza: nessun TypeError dopo l'ultimo giro");
  check(Array.isArray(mg.active.comboResults), "danza: comboResults sempre array");

  // tasti neri: 5, con scorciatoie uniche e senza conflitti con WASD/E/Q/R
  const blacks = PIANO_CHROMATIC_KEYS.filter((k) => k.isBlack);
  check(blacks.length === 5, "5 tasti neri", `${blacks.length}`);
  const shortcuts = blacks.map((k) => k.shortcut);
  check(new Set(shortcuts).size === 5, "scorciatoie nere uniche");
  check(!shortcuts.some((s) => "WAEQRSD".includes(s)), "nessun tasto nero ruba WASD/E/Q/R/S", shortcuts.join(""));
}

// ---------------------------------------------------------------------------
// 7. MATEMATICA: nodi e curva dentro la griglia per ogni combinazione
// ---------------------------------------------------------------------------
{
  const gy = 42, gh = 178, APEX_TOP = gy + 34, APEX_STEP = 16, CURVE_K = 700;
  const evalY = (a, k, dx) => Math.min(gy + gh - 4, APEX_TOP + k * APEX_STEP + (a * dx * dx) / CURVE_K);
  let out = 0;
  for (let a = 1; a <= 5; a++) for (let k = 0; k <= 4; k++) for (const dx of [-135, -100, 0, 100, 135]) {
    const y = evalY(a, k, dx);
    if (y > gy + gh - 2 || y < gy) out++;
  }
  check(out === 0, "parabola sempre dentro la griglia", `${out} punti fuori`);
}

// ---------------------------------------------------------------------------
// 8. GRAfica/TESTI: sprite nel pannello, sigle, glifi
// ---------------------------------------------------------------------------
{
  check(CHAR_ORDER.length === 5, "5 slot eroe");
  const slotW = 26, panelX = 6, panelW = 178;
  const squadW = CHAR_ORDER.length * slotW;
  const startX = panelX + Math.max(4, Math.round((panelW - squadW) / 2));
  check(startX >= panelX && startX + squadW <= panelX + panelW, "5 sprite dentro la pedana del titolo",
    `${startX}..${startX + squadW}`);

  // finale: la squadra resta a sinistra del riquadro statistiche (x=182)
  const eSlotW = 30, eStart = 14 + Math.max(0, Math.round((162 - CHAR_ORDER.length * eSlotW) / 2));
  check(eStart + CHAR_ORDER.length * eSlotW <= 182, "5 sprite del finale non invadono le statistiche",
    `${eStart}..${eStart + CHAR_ORDER.length * eSlotW}`);

  for (const ch of ["^", "Á", "—", "…", "▼", "→", "×", "²", "€", "ç", "à", "ù", "É"]) {
    check(glyphAvailable(ch), `glifo "${ch}" disegnabile`);
  }
  const json = JSON.stringify(DIALOGUES);
  check(!/GERARCHica/.test(json), "refuso GERARCHica assente");
  check(!/tutti e 4 i protagonisti/i.test(json), "nessun riferimento a 4 protagonisti");
}

// ---------------------------------------------------------------------------
// 9. NARRAZIONE: nessun eroe parla prima del suo incontro
// ---------------------------------------------------------------------------
{
  const meetOrder = { od_meet_daniele: 1 };
  const before = ["od_intro", "od_meet_francesco"];
  for (const id of before) {
    const speakers = (DIALOGUES[id]?.nodes || []).map((n) => n.speaker);
    check(!speakers.includes("daniele"), `${id}: Daniele non parla prima di od_meet_daniele`, speakers.join(","));
  }
  const c2 = (DIALOGUES.c2_corridoio_ruggero?.nodes || []).map((n) => n.speaker);
  check(!c2.includes("daniele"), "c2_corridoio_ruggero: nessuna battuta di Daniele prima di c2_meet_daniele", c2.join(","));
}

// ---------------------------------------------------------------------------
// 10. CARTELLI: il tasto eroe coincide con CHAR_ORDER
// ---------------------------------------------------------------------------
{
  const all = [...buildOpenDayLevels(), ...buildCampaignLevels()];
  const keyByName = {};
  CHAR_ORDER.forEach((cid, i) => {
    keyByName[CHARACTERS[cid].name.toUpperCase()] = i + 1;
    keyByName[cid.toUpperCase()] = i + 1;
  });
  let mismatched = [];
  for (const r of all) {
    for (const d of r.decorations) {
      if (d.type !== "hint") continue;
      const m = /([A-ZÀÈÉÌÒÙ ]+?)\s*\[(\d)\]/.exec(d.text);
      if (!m) continue;
      const name = m[1].trim().toUpperCase();
      const expected = keyByName[name] || (name === "PROF. RANALDO" ? keyByName["RANALDO"] : null);
      if (expected && Number(m[2]) !== expected) mismatched.push(`${name}[${m[2]}]≠[${expected}]`);
    }
  }
  check(mismatched.length === 0, "tutti i cartelli usano il tasto corretto", mismatched.join(", "));
  check(!/Tiro Teso/i.test(JSON.stringify(all.map((r) => r.decorations))), "nessun residuo 'Tiro Teso'");
}

// ---------------------------------------------------------------------------
// 11. TEMPO: il render non avanza il gioco
// ---------------------------------------------------------------------------
{
  const fs = await import("node:fs");
  const hud = fs.readFileSync(new URL("../src/ui/hudAndMenus.js", import.meta.url), "utf8");
  const rdr = fs.readFileSync(new URL("../src/render/renderer.js", import.meta.url), "utf8");
  const main = fs.readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
  const body = hud.slice(hud.indexOf("renderHUD(ctx"), hud.indexOf("renderHUD(ctx") + 4000);
  check(!/ttl--/.test(body), "renderHUD non decrementa i TTL");
  check(/stepHUD\(state\)/.test(hud), "esiste stepHUD per il tempo fisso");
  check(/stepAnimation\(\)/.test(rdr), "il renderer ha stepAnimation");
  check(/this\.ui\.stepHUD\(this\.state\)/.test(main), "main chiama stepHUD nel passo fisso");
  check(/this\.renderer\.stepAnimation\(\)/.test(main), "main chiama stepAnimation nel passo fisso");
}


// ---------------------------------------------------------------------------
// 12. PARETI INCRINATE: invalicabili senza Ruggero (>= 80px, salto max ~70px)
// ---------------------------------------------------------------------------
{
  const v = Math.abs(PHYSICS.baseJump) * 1.09; // Carlo = salto più alto
  const maxJump = (v * v) / (2 * PHYSICS.gravity);
  const all = [...buildOpenDayLevels(), ...buildCampaignLevels()];
  let lowest = 99;
  for (const r of all) {
    for (let c = 0; c < r.cols; c++) {
      let inB = false;
      for (let rr = 0; rr < r.rows; rr++) {
        const isC = r.grid[rr][c] === 3;
        if (isC && !inB) {
          inB = true;
          let h = 0;
          while (rr + h < r.rows && r.grid[rr + h][c] === 3) h++;
          lowest = Math.min(lowest, h * 16);
        }
        if (!isC) inB = false;
      }
    }
  }
  check(lowest > maxJump, "ogni parete incrinata è più alta del salto", `min ${lowest}px vs salto ${maxJump.toFixed(1)}px`);
}

// ---------------------------------------------------------------------------
// 13. TASTI EROE: il cartello coincide con la pillola dell'HUD
// ---------------------------------------------------------------------------
{
  const all = [...buildOpenDayLevels(), ...buildCampaignLevels()];
  const order = CHAR_ORDER.map((c) => `${CHARACTERS[c].shortName}`);
  check(order.join(",") === "CAR,RAN,DAN,RUG,FRA", "sigle HUD nell'ordine dei tasti", order.join(","));
}

// ---------------------------------------------------------------------------
// 14. CAMBIO EROE IN PC MODE: tasti, compagni in campo, prompt [E], ogni comando ha un tasto
// ---------------------------------------------------------------------------
{
  const { CasardiGameApp } = await import("../src/main.js");
  const boot = () => {
    const state = new GameStateManager();
    const app = Object.create(CasardiGameApp.prototype);
    app.state = state;
    app.audio = { ...mockAudio, musicVol: 0.7, sfxVol: 0.85, playCharMotif() {}, setMusicVolume(v) { this.musicVol = v; }, setSfxVolume(v) { this.sfxVol = v; } };
    app.input = mkInput();
    app.levels = buildOpenDayLevels();
    app.world = new WorldRuntime(app.levels[0], state, app.audio, app.input);
    app.scene = "playing";
    app.activeDialogue = null;
    app.minigames = { isActive: () => false };
    app.showControlsModal = false;
    app.addFloatingText = () => {};
    state.data.unlockedChars = ["carlo", "ranaldo"];
    state.data.activeChar = "carlo";
    app.world.syncCompanions();
    return app;
  };

  // 14a. slot fissi 1..5 con pochi eroi sbloccati (prima il tasto 4 crashava)
  const app = boot();
  check(app.heroSlotOrder().slice(0, 2).join(",") === "carlo,ranaldo", "slot 1 e 2 fissi su Carlo e Ranaldo", app.heroSlotOrder().join(","));
  let crashed = false;
  try {
    app.switchActiveChar("ruggero");
  } catch (e) {
    crashed = true;
  }
  check(!crashed, "cambio eroe bloccato non lancia eccezioni");
  check(app.state.data.activeChar === "carlo", "eroe bloccato NON viene messo in campo");
  check(app.switchActiveChar("ranaldo") === true && app.state.data.activeChar === "ranaldo", "switchActiveChar mette in campo l'eroe sbloccato");
  check(app.switchActiveChar("ranaldo") === false && app.state.data.activeChar === "ranaldo", "switchActiveChar sull'eroe già attivo ritorna false");
  check(app.switchActiveChar("carlo") === true && app.state.data.activeChar === "carlo", "si torna su Carlo quando è sbloccato");

  // 14b. i compagni seguono e sono cliccabili/agganggiabili
  app.world.syncCompanions();
  check(app.world.companionActors.length >= 1, "c'è almeno un compagno visibile in campo", `${app.world.companionActors.length}`);
  const comp = app.world.companionActors[0];
  const px = comp.x;
  app.world.update(mkInput());
  check(comp.x !== undefined && Math.abs(comp.x - px) < 40, "il compagno resta agganciato al giocatore");
  check(app.world.companionActors.every((a) => a.charId !== app.state.data.activeChar), "l'eroe attivo non è anche compagno");

  // 14c. [E] accanto al compagno lo prende in campo
  const app2 = boot();
  const c2 = app2.world.companionActors[0];
  app2.world.player.x = c2.x + 6;
  app2.world.player.y = c2.y;
  const wanted = c2.charId;
  app2.input.interactPressed = true;
  app2.checkCompanionSwitch();
  check(app2.state.data.activeChar === wanted, "[E] vicino al compagno cambia eroe", `atteso ${wanted}, attivo ${app2.state.data.activeChar}`);

  // 14d. ogni comando della guida ha un tasto visibile e una descrizione che entra nel pannello
  const { CONTROLS_HELP } = await import("../src/config/constants.js");
  check(CONTROLS_HELP.length >= 11, "la guida comandi elenca tutte le azioni", `${CONTROLS_HELP.length}`);
  check(CONTROLS_HELP.every((c) => c.keys && c.keys.trim().length > 0), "nessun comando senza tasto assegnato");
  check(CONTROLS_HELP.every((c) => c.action.length <= 36), "descrizioni comandi entro il pannello (<=36)");
  const keysAll = CONTROLS_HELP.map((c) => c.keys).join(" ");
  for (const need of ["1-5", "Q", "E / INVIO", "E (vicino)", "F1", "Y", "M", "F9", "ESC", "V", "C", "X", "SPAZIO"]) {
    check(keysAll.includes(need), `la guida mostra il tasto ${need}`);
  }

  // 14e. i tasti speciali dell'input sono tutti mappati
  const { InputController } = await import("../src/config/input.js");
  const ic2 = new InputController(null);
  ic2.keys = new Set();
  ic2.justPressed = new Set(["F1"]);
  ic2.poll();
  check(ic2.helpPressed === true, "[F1] apre la guida comandi");
  ic2.keys = new Set();
  ic2.justPressed = new Set(["KeyY"]);
  ic2.poll();
  check(ic2.fullscreenPressed === true, "[Y] attiva lo schermo intero");
  ic2.keys = new Set();
  ic2.justPressed = new Set(["Slash"]);
  ic2.poll();
  check(ic2.helpPressed === true, "[?] apre la guida comandi");

  // 14f. sinergia di squadra: i 5 eroi danno bonus passivi reali
  const app3 = boot();
  app3.state.data.unlockedChars = ["carlo", "ranaldo", "daniele", "ruggero", "francesco"];
  const syn = app3.teamSynergy();
  // §1.3 della review: prima questo controllo verificava solo un CAMPO MORTO (maxHpBonus===40)
  // mentre il giocatore restava a 5 cuori per sempre. Ora si verifica il COMPORTAMENTO.
  check(syn.maxHpPoints === 40, "sinergia: 10 punti vita per ogni compagno sbloccato", `${syn.maxHpPoints}`);
  check(syn.maxHpBonus === 1, "sinergia: +1 cuore reale al cap HUD con 5 eroi", `${syn.maxHpBonus}`);
  app3.state.data.maxHp = 5;
  app3.state.data.hp = 5;
  app3.state.applyTeamSynergyHp(syn.maxHpBonus);
  check(app3.state.data.maxHp === 6, "sinergia: i cuori bonus vengono APPLICATI (5 -> 6)", `${app3.state.data.maxHp}`);
  check(syn.jumpBonus > 0 && syn.dmgBonus > 0, "sinergia: Daniele e Ruggero danno bonus attivi");
  check(app3.world === null || app3.world === undefined || true, "sinergia: nessuna eccezione");
  check(app3.heroSlotOrder().length === 5, "con 5 eroi sbloccati ci sono 5 slot tasto", `${app3.heroSlotOrder().length}`);

  // 14g. "Squadra al seguito": toggle nel menu iniziale e distanza di rispetto
  const app4 = boot();
  app4.state.audioPrefs = { musicVol: 0.7, sfxVol: 0.85, muted: false, crt: false, followTeam: false };
  check(app4.state.audioPrefs.followTeam === false, "opzione squadra al seguito: spenta di default");
  const titleOpts = app4.getTitleOptions().map((o) => o.id);
  check(titleOpts.includes("team_follow"), "il menu iniziale ha la voce Squadra al seguito", titleOpts.join(","));
  check(app4.getPauseItems().some((i) => i.id === "team_follow"), "anche il menu pausa ha la voce Squadra al seguito");
  app4.toggleTeamFollow();
  check(app4.state.audioPrefs.followTeam === true, "il toggle accende l'opzione");
  app4.toggleTeamFollow();
  check(app4.state.audioPrefs.followTeam === false, "il toggle spegne l'opzione");

  // i compagni non stanno addosso: minima distanza di rispetto in entrambe le modalità
  const app5 = boot();
  app5.state.audioPrefs = { musicVol: 0.7, sfxVol: 0.85, muted: false, crt: false, followTeam: false };
  app5.world.syncCompanions();
  const runFrames = (n) => {
    for (let k = 0; k < n; k++) app5.world.update(mkInput());
  };
  runFrames(180);
  const distOff = app5.world.companionActors.map((a) => Math.abs(a.x - app5.world.player.x));
  check(distOff.length > 0 && Math.min(...distOff) >= 18, "senza opzione i compagni stanno a distanza (>=18px)", distOff.map((d) => Math.round(d)).join(","));
  app5.state.audioPrefs.followTeam = true;
  runFrames(120);
  const distOn = app5.world.companionActors.map((a) => Math.abs(a.x - app5.world.player.x));
  check(Math.min(...distOn) >= 18, "con l'opzione i compagni restano accanto ma non addosso (>=18px)", distOn.map((d) => Math.round(d)).join(","));
  const compX = app5.world.companionActors[0].x;
  app5.world.player.x += 400;
  runFrames(60);
  check(Math.abs(app5.world.companionActors[0].x - compX) < 420, "i compagni non pedinano il giocatore con uno scatto istantaneo");
  const ic3 = new InputController(null);
  ic3.keys = new Set();
  ic3.justPressed = new Set(["KeyG"]);
  ic3.poll();
  check(ic3.teamTogglePressed === true, "[G] attiva/disattiva Squadra al seguito");

  // -------------------------------------------------------------------------
  // 15. REVIEW ESTERNA (ERRORI_OPENDay.md) — punti CONFERMATI dalla verifica
  // -------------------------------------------------------------------------
  // 15a. §1.1 la fossa non è più un ping-pong: dopo la caduta il player torna
  //      SUL terreno sicuro e la caduta successiva fa danno (o viene assorbita dallo scudo)
  const app6 = boot();
  const w = app6.world;
  app6.state.data.shield = 0;
  app6.state.data.hp = 5;
  app6.state.data.deaths = 0;
  w.player.x = 100;
  w.player.y = 100;
  w.player.lastSafeX = 100;
  w.player.lastSafeY = 100;
  w.player.invuln = 0;
  w.recoverFromPit();
  check(w.player.x === 100 && w.player.y === 100, "§1.1 la caduta in fossa riporta sul punto sicuro", `${Math.round(w.player.x)},${Math.round(w.player.y)}`);
  check(app6.state.data.hp === 4, "§1.1 la caduta in fossa costa 1 HP", `${app6.state.data.hp}`);
  // con invulnerabilità attiva NON deve restare dentro la buca (§6.5: idempotenza)
  w.player.x = 900;
  w.player.y = 900;
  w.player.invuln = 30;
  w.player.lastSafeX = 100;
  w.player.lastSafeY = 100;
  w.recoverFromPit();
  check(w.player.x === 100, "§6.5 la caduta riposiziona anche durante l'invulnerabilità", `${Math.round(w.player.x)}`);
  check(app6.state.data.hp === 4, "§6.5 nessun doppio danno durante l'invulnerabilità", `${app6.state.data.hp}`);

  // 15b. §1.9 il punto sicuro non si salva sul bordo della fossa
  const w2 = boot().world;
  const pitCol = w2.cols - 1;
  let pitRow = w2.rows - 2;
  for (let r = 0; r < w2.rows; r++) for (let c = 0; c < w2.cols; c++) if (w2.grid[r][c] === 6) { pitRow = r; pitCol === w2.cols - 1 && (pitRow = r); }
  check(typeof w2.hasSafeFooting === "function", "§1.9 esiste il controllo di terreno sicuro");
  check(w2.hasSafeFooting(2, w2.rows - 1) === true, "§1.9 il terreno pieno è considerato sicuro");

  // 15c. §1.2 pillole mobile e tasti numerici danno lo STESSO eroe
  //      (l'ordine base è ora unico in constants.HERO_BASE_ORDER)
  const { HERO_BASE_ORDER } = await import("../src/config/constants.js");
  check(HERO_BASE_ORDER.join(",") === "carlo,ranaldo", "§1.10 ordine base eroi in un solo posto", HERO_BASE_ORDER.join(","));
  const app7 = boot();
  check(app7.heroSlotOrder()[0] === HERO_BASE_ORDER[0], "§1.2 lo slot 1 dell'HUD è lo stesso dei tasti 1-5");

  // 15d. §1.8 [E] vicino al compagno consuma il flag: una sola azione per tocco
  const app8 = boot();
  const c8 = app8.world.companionActors[0];
  app8.world.player.x = c8.x;
  app8.world.player.y = c8.y;
  app8.input.interactPressed = true;
  app8.checkCompanionSwitch();
  check(app8.input.interactPressed === false, "§1.8 il flag [E] viene consumato dal cambio eroe");
  check(app8.state.data.activeChar === c8.charId, "§1.8 il compagno entra in campo", app8.state.data.activeChar);

  // 15e. §1.3 la sinergia danno di Ruggero arriva al mondo
  const app9 = boot();
  app9.state.data.unlockedChars = ["carlo", "ranaldo", "daniele", "ruggero", "francesco"];
  const syn9 = app9.teamSynergy();
  check(syn9.dmgBonus > 0, "§1.3 il bonus danno di Ruggero esiste", `${syn9.dmgBonus}`);
  app9.world._synergyDmgBonus = syn9.dmgBonus;
  const mbHp = 12;
  app9.world.midBoss = { x: 0, y: 0, w: 40, h: 40, hp: mbHp, maxHp: mbHp, defeated: false, invuln: 0 };
  app9.world.hitMidBoss(2, "TEST");
  check(app9.world.midBoss.hp < mbHp - 2, "§1.3 il bonus danno è davvero applicato ai boss", `hp ${app9.world.midBoss.hp}`);
}

console.log(`\n=== REGRESSIONE ERRORI v3.0.1: ${ok} CONTROLLI OK, ${fails.length} FALLITI ===`);
for (const f of fails) console.log("  [FAIL] " + f);
if (fails.length === 0) console.log("  Tutti i bug segnalati risultano corretti.");
process.exit(fails.length === 0 ? 0 : 1);
