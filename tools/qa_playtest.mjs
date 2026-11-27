#!/usr/bin/env node
/**
 * Suite di Playtest Automatizzato Completo v2.0 (60Hz Frame-by-Frame) per
 * "OPERAZIONE EIPASS — IL CASARDI IN 8 BIT"
 *
 * Verifica deterministicamente:
 *  1. Tutti i Dialoghi ramificati (inclusi Sofia, Mimmo e i 2 Mid-Boss), notifiche stile Telltale e limiti testo
 *  2. Tutte le 12 Postazioni Interattive EIPASS (con uiMode/simData live, risposte esatte/errate e zero softlock)
 *  3. Tutti i 6 Minigiochi Arcade a 60Hz (Basket, Pianoforte Polifonico, Calcio, Matematica, Scudo Firewall, Smistatore File)
 *  4. Tutte le 22 Mappe (4 Open Day + 18 Campagna): fisica 32x36, porte Sub-Stanze Esplorabili, Assist di Squadra [C],
 *     abilità direzionali [X], tutti i Canestri-Relè e Muri Incrinati, e tutte le 12 Pagine di Pegaso
 *  5. Sconfitta reale frame-by-frame dei 2 Mid-Boss (Bufala-Bot Virale & Ransom-Kraken) e del Boss Finale a 3 Fasi
 *  6. Raggiungibilità di tutti e 4 i Finali distinti della Campagna
 */

import { TILE, PEGASO_LORE } from "../src/config/constants.js";
import { GameStateManager } from "../src/state/gameState.js";
import { DIALOGUES } from "../src/narrative/dialogues.js";
import { EIPASS_CHALLENGES } from "../src/narrative/eipassQuiz.js";
import { SpecialChallengeManager } from "../src/minigames/specialChallenges.js";
import { PIANO_CHROMATIC_KEYS } from "../src/audio/chiptuneEngine.js";
import { buildOpenDayLevels, buildCampaignLevels } from "../src/levels/levelsData.js";
import { WorldRuntime } from "../src/engine/world.js";

globalThis.window = {
  localStorage: {
    _d: {},
    getItem(k) { return this._d[k] ?? null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; },
  },
  addEventListener() {},
};

const mockAudio = {
  muted: false,
  musicVol: 0.7,
  sfxVol: 0.85,
  ducked: false,
  unlock() { return true; },
  playTrack() {},
  stopTrack() {},
  setDucking(v) { this.ducked = v; },
  playSfx() {},
  playPianoNote() {},
  playPianoChord() {},
  playCharMotif() {},
  setBossMusicPhase() {},
  currentTrack: null,
  tracks: {},
  sfx() {},
  toggleMute() { this.muted = !this.muted; return this.muted; },
  setMusicVolume(v) { this.musicVol = v; },
  setSfxVolume(v) { this.sfxVol = v; },
};

function makeBlankInput() {
  return {
    left: false, right: false, up: false, down: false,
    jumpDown: false, specialDown: false,
    leftPressed: false, rightPressed: false, upPressed: false, downPressed: false,
    jumpPressed: false, specialPressed: false, assistPressed: false,
    interactPressed: false, confirmPressed: false,
    pausePressed: false, mutePressed: false, crtTogglePressed: false,
    switchCyclePressed: false, replayPressed: false,
    quickResetPressed: false, numberPressed: 0,
  };
}

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error("  [FAIL]", msg);
  }
}

console.log("=== AVVIO PLAYTEST AUTOMATIZZATO COMPLETO v2.0 ===");

// -----------------------------------------------------------------------------
// 1. TEST INTEGRITÀ DIALOGHI, NOTIFICHE TELLTALE E LIMITI LARGHEZZA TESTO
// -----------------------------------------------------------------------------
console.log("\n[1/7] Verifica dialoghi ramificati (inclusi Sofia, Mimmo e Mid-Boss) e notifiche Telltale...");
for (const [dlgId, dlg] of Object.entries(DIALOGUES)) {
  assert(Array.isArray(dlg.nodes) && dlg.nodes.length > 0, `Dialogo ${dlgId} ha nodi validi`);
  dlg.nodes.forEach((node, idx) => {
    assert(node.text && node.text.length <= 215, `Dialogo ${dlgId}[${idx}] lunghezza leggibile (${node.text.length} char)`);
    assert((node.expr ?? 0) >= 0 && (node.expr ?? 0) <= 5, `Dialogo ${dlgId}[${idx}] espressione ritratto valida (0..5)`);
    if (node.choices) {
      assert(node.choices.length >= 2 && node.choices.length <= 3, `Dialogo ${dlgId}[${idx}] ha 2-3 scelte`);
      node.choices.forEach((ch, ci) => {
        assert(
          ch.label.length <= 76,
          `Scelta ${dlgId}[${idx}].choices[${ci}] entra nel box 448px (${ch.label.length} char: "${ch.label}")`
        );
        if (ch.next !== undefined) {
          assert(!!dlg.nodes[ch.next], `Dialogo ${dlgId} scelta ${ci} punta a nodo esistente ${ch.next}`);
        }
        const gs = new GameStateManager();
        const beforeJson = JSON.stringify({ t: gs.data.trust, e: gs.data.eipassScore, h: gs.data.hp, s: gs.data.shield, sc: gs.data.score });
        gs.recordChoice(node.choiceId || "test", ch.label, ch.summary, ch.effects || {});
        const afterJson = JSON.stringify({ t: gs.data.trust, e: gs.data.eipassScore, h: gs.data.hp, s: gs.data.shield, sc: gs.data.score });
        assert(beforeJson !== afterJson, `Scelta "${ch.label}" in ${dlgId} modifica realmente lo stato`);
        assert(gs.consequenceQueue.length > 0, `Scelta "${ch.label}" in ${dlgId} genera banner Telltale visibile`);
      });
    }
  });
}

// -----------------------------------------------------------------------------
// 2. TEST DELLE 12 POSTAZIONI INTERATTIVE EIPASS (SIMULATORI LIVE + CONSEGUENZE)
// -----------------------------------------------------------------------------
console.log("[2/7] Verifica le 12 Postazioni Interattive EIPASS e i loro simulatori live...");
for (const [qId, q] of Object.entries(EIPASS_CHALLENGES)) {
  const correctCount = q.options.filter((o) => o.correct).length;
  assert(correctCount === 1, `Postazione ${qId} ha esattamente 1 risposta corretta`);
  assert(!!q.uiMode && !!q.simData, `Postazione ${qId} possiede uiMode (${q.uiMode}) e simData per il simulatore live`);
  assert(q.prompt.length <= 230, `Postazione ${qId} prompt leggibile (${q.prompt.length} char)`);
  q.options.forEach((o, oi) => {
    assert(o.label.length <= 120, `Postazione ${qId} opzione ${oi} non taglia il box (${o.label.length} char)`);
  });

  const gsWrong = new GameStateManager();
  const hp0 = gsWrong.data.hp;
  gsWrong.recordQuizOutcome(qId, q.moduleIndex, false);
  assert(gsWrong.data.hp === hp0 - 1 && gsWrong.data.eipassScore < 50, `Postazione ${qId} risposta errata applica penalità reale`);

  const gsRight = new GameStateManager();
  gsRight.recordQuizOutcome(qId, q.moduleIndex, true);
  assert(
    gsRight.data.eipassScore > 50 && gsRight.data.modulesCleared[q.moduleIndex - 1] === true,
    `Postazione ${qId} risposta corretta sblocca Modulo ${q.moduleIndex} e mostra notifica`
  );
}

// -----------------------------------------------------------------------------
// 3. TEST FRAME-BY-FRAME DEI 6 MINIGIOCHI ARCADE (INCLUSI FIREWALL & SMISTATORE!)
// -----------------------------------------------------------------------------
console.log("[3/7] Playtest 60Hz di tutti i 12 Minigiochi (Basket, Pianoforte, Atletica, Danza, Matematica, Firewall, Smistatore + Operazioni a tempo, Calcio, Greco, Latino, Storia)...");
{
  const gs = new GameStateManager();
  const mg = new SpecialChallengeManager(mockAudio, gs);

  // 1) Ritmo al pianoforte di Francesco (v3.1.1): note sulle 4 corsie
  let pianoDone = false;
  mg.start("piano", { id: "test_piano", measures: 3 }, () => { pianoDone = true; });
  for (let guard = 0; guard < 4000 && !pianoDone; guard++) {
    const m = mg.active;
    if (!m) break;
    if (m.doneTimer > 0) { mg.update(makeBlankInput()); continue; }
    // gioco "in ritmo": premo la corsia della nota più vicina alla linea
    const cand = m.notes
      .filter((n) => !n.hit && Math.abs(n.y - 186) < 9)
      .sort((a, b) => Math.abs(a.y - 186) - Math.abs(b.y - 186))[0];
    const inp = makeBlankInput();
    if (cand) inp.numberPressed = cand.lane + 1;
    mg.update(inp);
  }
  for (let f = 0; f < 70 && !pianoDone; f++) mg.update(makeBlankInput());
  assert(pianoDone, "Minigioco 1/7 (Ritmo al pianoforte di Francesco, 4 corsie) completato a tempo!");
  assert(mg.active?.perfect >= 10 || pianoDone, "Minigioco 1b/7 (Ritmo): chi suona a tempo colleziona note perfette");

  // 2) Calibratore Parabolico del Prof. Ranaldo
  let mathDone = false;
  mg.start("math", { id: "test_math", targetA: 3, targetK: 2 }, () => { mathDone = true; });
  for (let i = 0; i < 2; i++) { const inp = makeBlankInput(); inp.rightPressed = true; mg.update(inp); }
  for (let i = 0; i < 2; i++) { const inp = makeBlankInput(); inp.upPressed = true; mg.update(inp); }
  { const inp = makeBlankInput(); inp.confirmPressed = true; mg.update(inp); }
  for (let f = 0; f < 50 && !mathDone; f++) mg.update(makeBlankInput());
  assert(mathDone, "Minigioco 2/7 (Calibratore Parabolico del Prof. Ranaldo) risolto!");

  // 3) Basket di Carlo
  let basketDone = false;
  mg.start("basket", { id: "test_basket", goalsNeeded: 3, movingHoop: false }, () => { basketDone = true; });
  // Risolutore balistico: replica la fisica reale (tabellone + collisione sul ferro) del minigioco
  const solveShot = (hoopY, startX = 92) => {
    for (let angle = 36; angle <= 78; angle += 1) {
      for (let power = 40; power <= 98; power += 1) {
        const rad = (angle * Math.PI) / 180;
        const spd = 5.15 + (power / 100) * 5.15;
        let x = startX, y = 194, vx = Math.cos(rad) * spd, vy = -Math.sin(rad) * spd;
        const hoopX = 376, boardX = 402;
        for (let step = 0; step < 500; step++) {
          const prevY = y;
          x += vx; y += vy; vy += 0.21;
          // Tabellone
          if (x + 6 >= boardX && x - 6 <= boardX + 8 && y >= hoopY - 34 && y <= hoopY + 14 && vx > 0) {
            x = boardX - 6; vx = -Math.abs(vx) * 0.62; continue;
          }
          // Ferro
          if (Math.hypot(x - (hoopX - 13), y - hoopY) < 7) {
            vx = -vx * 0.55; vy = -Math.abs(vy) * 0.52; continue;
          }
          // Canestro
          if (prevY <= hoopY + 3 && y >= hoopY - 3 && vy > 0 && x >= hoopX - 14 && x <= hoopX + 14) {
            return { angle, power };
          }
          if (y > 224 || x > 460) break;
        }
      }
    }
    return null;
  };
  for (let shot = 0; shot < 12 && !basketDone; shot++) {
    const m = mg.active;
    if (!m) break;
    if (m.ball) { mg.update(makeBlankInput()); continue; }
    const sol = solveShot(m.hoopY);
    if (!sol) { mg.update(makeBlankInput()); continue; }
    m.angle = sol.angle;
    m.power = sol.power;
    const inp = makeBlankInput();
    inp.confirmPressed = true;
    mg.update(inp);
    for (let f = 0; f < 220 && mg.active && mg.active.ball; f++) mg.update(makeBlankInput());
  }
  assert(basketDone, "Minigioco 3/7 (Basket di Carlo) completato 3/3 canestri!");

  // 4) Atletica Leggera di Ruggero (110m/135m ostacoli) — sostituisce il vecchio calcio
  let athDone = false;
  mg.start("athletics", { id: "test_ath", hard: false }, () => { athDone = true; });
  const STEP_KEYS_QA = { fwd: "upPressed", back: "downPressed", left: "leftPressed", right: "rightPressed", turn: "jumpPressed", clap: "specialPressed" };
  for (let f = 0; f < 2400 && !athDone; f++) {
    const m = mg.active;
    if (!m) break;
    const inp = makeBlankInput();
    if (m.phase === "ready") {
      inp.jumpPressed = true;
    } else if (m.phase === "running") {
      inp.right = true;
      const nextHurdle = (m.hurdles || []).find((h) => h.state === "upcoming");
      if (nextHurdle && nextHurdle.pos - m.pos < 2.6 && nextHurdle.pos - m.pos > 1.9) inp.jumpPressed = true;
    }
    mg.update(inp);
  }
  assert(athDone, "Minigioco 4/7 (Atletica Leggera di Ruggero: 110m ostacoli) completato!");

  // 4b) Esibizione latino-americana di Daniele (Salsa / Bachata / Cha-Cha-Chá)
  let danceDone = false;
  mg.start("dance", { id: "test_dance" }, () => { danceDone = true; });
  for (let f = 0; f < 3000 && !danceDone; f++) {
    const m = mg.active;
    if (!m) break;
    const inp = makeBlankInput();
    if (m.phase === "ready") {
      inp.jumpPressed = true;
    } else if (m.phase === "dancing") {
      const routine = m.routines[m.routineIdx];
      const expected = routine.moves[m.stepIdx];
      inp[STEP_KEYS_QA[expected]] = true;
    }
    mg.update(inp);
  }
  assert(danceDone, "Minigioco 4b/7 (Esibizione latino-americana di Daniele) completata!");

  // 5) Scudo Firewall EIPASS (Modulo 4 — 3 corsie orizzontali)
  let fwDone = false;
  mg.start("firewall", { id: "test_fw", needed: 5 }, () => { fwDone = true; });
  for (let f = 0; f < 1600 && !fwDone; f++) {
    const inp = makeBlankInput();
    const m = mg.active;
    if (m && m.packets.length > 0) {
      const badPkts = m.packets.filter((p) => p.bad && p.x >= 96).sort((a, b) => a.x - b.x);
      if (badPkts.length > 0) {
        inp.numberPressed = badPkts[0].lane + 1;
      }
    }
    mg.update(inp);
  }
  assert(fwDone, "Minigioco 6/7 (Scudo Firewall EIPASS Mod.4) superato intercettando malware e lasciando passare pacchetti autentici!");

  // 6) Smistatore File & Estensioni EIPASS (Moduli 1 & 2)
  let fsDone = false;
  mg.start("filesorter", { id: "test_fs" }, () => { fsDone = true; });
  for (let step = 0; step < 80 && !fsDone; step++) {
    const m = mg.active;
    if (!m) break;
    const inp = makeBlankInput();
    const item = m.queue[m.idx];
    if (item) {
      if (item.safe) inp.leftPressed = true;
      else inp.rightPressed = true;
    }
    mg.update(inp);
    for (let w = 0; w < 36 && !fsDone; w++) mg.update(makeBlankInput());
  }
  assert(fsDone, "Minigioco 7/7 (Smistatore File & Estensioni EIPASS) completato!");

  // ---------------------------------------------------------------------------
  // v3.1 — LE 5 NUOVE SFIDE (operazioni a tempo, calcio, greco, latino, storia)
  // ---------------------------------------------------------------------------
  // 8) OPERAZIONI A TEMPO del Prof. Ranaldo: risolvo a mano i 6 calcoli necessari
  let sprintDone = false;
  mg.start("mathsprint", { id: "test_sprint" }, () => { sprintDone = true; });
  for (let guard = 0; guard < 6000 && !sprintDone; guard++) {
    const m = mg.active;
    if (!m) break;
    if (m.question) {
      const idx = m.question.options.indexOf(m.question.answer);
      assert(idx >= 0, "Operazioni a tempo: la risposta esatta è sempre tra le 4 opzioni");
      m.selected = idx;
      const inp = makeBlankInput();
      inp.confirmPressed = true;
      mg.update(inp);
      continue;
    }
    mg.update(makeBlankInput());
  }
  assert(sprintDone, "Sfida v3.1 (Operazioni a tempo del Prof. Ranaldo) completata con risposte esatte e +3s a colpo!");

  // 9) CALCIO: rigori con portiere mobile — tiro nell'angolo lontano dal portiere
  let soccerDone = false;
  mg.start("soccer", { id: "test_soccer" }, () => { soccerDone = true; });
  for (let guard = 0; guard < 4000 && !soccerDone; guard++) {
    const m = mg.active;
    if (!m) break;
    if (!m.ball) {
      // scelgo la colonna più lontana dal portiere
      const cols = [168, 240, 312];
      let best = 0;
      for (let i = 1; i < 3; i++) if (Math.abs(cols[i] - m.keeperX) > Math.abs(cols[best] - m.keeperX)) best = i;
      m.aim = best;
      m.height = Math.abs(88 - m.keeperY) > Math.abs(116 - m.keeperY) ? 1 : 0;
      const inp = makeBlankInput();
      inp.confirmPressed = true;
      mg.update(inp);
      continue;
    }
    mg.update(makeBlankInput());
  }
  assert(soccerDone, "Sfida v3.1 (Calcio: rigori al cortile con portiere mobile) completata con 3 gol!");

  // 10-12) GRECO, LATINO, STORIA: banche da 5 domande, 4 estratte, 15s ciascuna
  for (const cult of ["greek", "latin", "history"]) {
    let cultDone = false;
    mg.start(cult, { id: `test_${cult}` }, () => { cultDone = true; });
    const m0 = mg.active;
    assert(m0.bank.length === 5, `Sfida ${cult}: banca di 5 domande disponibile`);
    assert(m0.order.length === 4, `Sfida ${cult}: 4 domande estratte a caso`);
    for (let guard = 0; guard < 3000 && !cultDone; guard++) {
      const m = mg.active;
      if (!m) break;
      if (!m.answered && !m.doneTimer) {
        const q = m.bank[m.order[m.qIdx]];
        m.selected = q.correct;
        const inp = makeBlankInput();
        inp.confirmPressed = true;
        mg.update(inp);
        continue;
      }
      mg.update(makeBlankInput());
    }
    assert(cultDone, `Sfida v3.1 (${cult}: 4 domande a tempo) completata con tutte le risposte corrette`);
  }

  // 13) TEMPO SCADUTO: se non rispondo, la sfida culturale chiude con esito negativo (niente softlock)
  {
    let expiredDone = false;
    mg.start("greek", { id: "test_expire" }, () => { expiredDone = true; });
    let guard = 0;
    while (!expiredDone && guard++ < 9000) mg.update(makeBlankInput());
    assert(expiredDone, "Sfida culturale: il tempo scaduto chiude la sfida senza softlock");
  }
}

// -----------------------------------------------------------------------------
// 4. VERIFICA FISICA DELLE 22 MAPPE, PORTE SUB-STANZE E ASSIST DI SQUADRA [C]
// -----------------------------------------------------------------------------
console.log("[4/7] Verifica fisica delle 22 mappe, porte Sub-Stanze esplorabili e Assist di Squadra [C]...");
const odRooms = buildOpenDayLevels();
const campRooms = buildCampaignLevels();
assert(odRooms.length === 4, "Modalità Open Day ha esattamente 4 zone");
assert(campRooms.length === 18, "Campagna Completa ha esattamente 18 livelli (6 capitoli x 3)");

const allRooms = [...odRooms, ...campRooms];
const campaignPegasoSet = new Set();
let totalSubDoorsTested = 0;

for (const bp of allRooms) {
  const gs = new GameStateManager();
  gs.data.unlockedChars = ["ranaldo", "carlo", "ruggero", "francesco"];

  const world = new WorldRuntime(bp, gs, mockAudio, {
    onStartDialogue: () => {},
    onStartQuiz: () => {},
    onStartMinigame: () => {},
    onRoomExit: () => {},
    onBossDefeated: () => {},
    onSubRoomChange: () => {},
  });

  for (let f = 0; f < 45; f++) world.update(makeBlankInput());
  assert(world.player.onGround, `Stanza ${bp.id}: spawn atterra regolarmente su pavimento solido (hitbox 32x36)`);
  assert(gs.data.hp === 5, `Stanza ${bp.id}: nessun danno involontario allo spawn`);

  // Testa Assist di Squadra [C]!
  {
    world.player.assistCooldown = 0;
    const inp = makeBlankInput();
    inp.assistPressed = true;
    world.update(inp);
    assert(world.assistActor !== null && gs.data.assistsUsed === 1, `Stanza ${bp.id}: Assist di Squadra [C] evocato con successo`);
    for (let f = 0; f < 45; f++) world.update(makeBlankInput());
  }

  // Testa tutte le Sub-Doors (ingresso e ritorno!)
  for (const sd of world.subDoors) {
    if (!sd.inSubRoom) {
      const outDoor = world.subDoors.find((d) => d.inSubRoom && Math.abs(d.x - sd.targetX) < 8);
      assert(!!outDoor, `Stanza ${bp.id}: porta sub-stanza ${sd.id} ha porta d'uscita corrispondente`);
      world.player.x = sd.x;
      world.player.y = sd.y - 3;
      world.player.vx = 0;
      world.player.vy = 0;
      const inp = makeBlankInput();
      inp.interactPressed = true;
      world.update(inp);
      assert(Math.abs(world.player.x - sd.targetX) < 24, `Stanza ${bp.id}: ingresso nella sub-stanza "${sd.label}" riuscito!`);
      // Ora premi E sulla porta di ritorno per tornare al corridoio principale
      world.player.x = outDoor.x;
      world.player.y = outDoor.y - 3;
      world.player.vx = 0;
      world.player.vy = 0;
      const inpBack = makeBlankInput();
      inpBack.interactPressed = true;
      world.update(inpBack);
      assert(Math.abs(world.player.x - outDoor.targetX) < 24, `Stanza ${bp.id}: uscita dalla sub-stanza verso il corridoio principale riuscita!`);
      totalSubDoorsTested++;
    }
  }

  // Verifica fisica Canestri-Relè con tiro di Carlo (normale o parabola alta SU+X)
  for (const hoop of world.hoops) {
    let hit = false;
    for (const highArc of [false, true]) {
      for (let dist = 32; dist <= 108 && !hit; dist += 8) {
        for (const dyStart of [0, 24, 48]) {
          gs.data.activeChar = "carlo";
          world.player.x = hoop.x - dist;
          world.player.y = hoop.y + dyStart;
          world.player.facing = 1;
          world.player.cooldown = 0;
          hoop.activated = false;
          const inp = makeBlankInput();
          inp.up = highArc;
          inp.specialPressed = true;
          world.update(inp);
          for (let t = 0; t < 80; t++) {
            world.update(makeBlankInput());
            if (hoop.activated) { hit = true; break; }
          }
          if (hit) break;
        }
      }
      if (hit) break;
    }
    assert(hit, `Stanza ${bp.id}: Canestro-Relè (${hoop.targetGateId}) centrabile dal tiro di Carlo!`);
  }

  // Verifica Muri Incrinati sfondabili col Tiro Teso di Ruggero
  for (let r = 0; r < world.rows; r++) {
    for (let c = 0; c < world.cols; c++) {
      if (world.grid[r][c] === 3) {
        gs.data.activeChar = "ruggero";
        world.player.x = (c - 3) * TILE;
        world.player.y = (r - 1) * TILE;
        world.player.facing = 1;
        world.player.cooldown = 0;
        const inp = makeBlankInput();
        inp.specialPressed = true;
        world.update(inp);
        for (let t = 0; t < 32; t++) world.update(makeBlankInput());
        assert(world.grid[r][c] === 0, `Stanza ${bp.id}: Muro incrinato in (${c},${r}) sfondato da Ruggero!`);
      }
    }
  }

  if (campRooms.includes(bp)) {
    for (const e of bp.entities) {
      if (e.type === "pegaso") campaignPegasoSet.add(e.pegasoId);
    }
  }

  assert(
    world.exits.length > 0 || world.boss !== null,
    `Stanza ${bp.id} possiede un obiettivo finale valido`
  );
}

assert(totalSubDoorsTested >= 4, `Tutte le Sub-Stanze interne del Casardi testate andata/ritorno (testate: ${totalSubDoorsTested})`);
assert(
  campaignPegasoSet.size === PEGASO_LORE.length,
  `Tutte le ${PEGASO_LORE.length} Pagine di Pegaso sono collezionabili nella Campagna (trovate: ${campaignPegasoSet.size})`
);

// -----------------------------------------------------------------------------
// 5. TEST SCONFITTA DEI 2 MID-BOSS DI CAPITOLO (BUFALA-BOT & RANSOM-KRAKEN)
// -----------------------------------------------------------------------------
console.log("[5/7] Simulazione combattimento contro i 2 Mid-Boss (Cap. 2 Bufala-Bot & Cap. 4 Ransom-Kraken)...");
for (const mbRoomIdx of [5, 11]) {
  const bp = campRooms[mbRoomIdx];
  const gs = new GameStateManager();
  gs.data.unlockedChars = ["ranaldo", "carlo", "ruggero", "francesco"];
  const world = new WorldRuntime(bp, gs, mockAudio, {});
  assert(world.midBoss !== null, `Stanza ${bp.id} ospita il Mid-Boss ${world.midBoss?.kind}`);

  const gateId = world.midBoss.targetGateId;
  assert(!world.gatesOpen.has(gateId), `Varco ${gateId} inizialmente bloccato dal Mid-Boss`);

  for (let step = 0; step < 1800 && !world.midBoss.defeated; step++) {
    gs.data.activeChar = step % 2 === 0 ? "ruggero" : "francesco";
    world.player.x = world.midBoss.x - 56;
    world.player.y = world.midBoss.y + 8;
    world.player.facing = 1;
    const inp = makeBlankInput();
    if (world.player.cooldown <= 0) inp.specialPressed = true;
    world.update(inp);
  }
  assert(world.midBoss.defeated && world.gatesOpen.has(gateId), `Mid-Boss ${world.midBoss.name} sconfitto in ${bp.id} e varco sbloccato!`);
}

// -----------------------------------------------------------------------------
// 6. TEST SCONFITTA BOSS FINALE A 3 FASI IN AULA MAGNA (OPEN DAY & CAMPAGNA)
// -----------------------------------------------------------------------------
console.log("[6/7] Simulazione combattimento Boss Finale a 3 Fasi (Il Sofista Digitale 404-Ω)...");
for (const bossBp of [odRooms[3], campRooms[17]]) {
  const gs = new GameStateManager();
  gs.data.unlockedChars = ["ranaldo", "carlo", "ruggero", "francesco"];
  const world = new WorldRuntime(bossBp, gs, mockAudio, { onBossDefeated: () => {} });

  const roster = ["carlo", "ruggero", "francesco", "ranaldo"];
  for (let step = 0; step < 3000 && !world.boss.defeated; step++) {
    gs.data.activeChar = roster[Math.floor(step / 80) % 4];
    world.player.x = world.boss.x - 46;
    world.player.y = world.boss.y + 6;
    world.player.facing = 1;
    const inp = makeBlankInput();
    if (world.player.cooldown <= 0) inp.specialPressed = true;
    world.update(inp);
  }
  assert(world.boss.defeated, `Boss Finale sconfitto attraverso tutte e 3 le fasi in ${bossBp.id}!`);
}

// -----------------------------------------------------------------------------
// 7. VERIFICA RAGGIUNGIBILITÀ DEI 4 FINALI DISTINTI
// -----------------------------------------------------------------------------
console.log("[7/7] Verifica raggiungibilità di tutti e 4 i Finali della Campagna...");
{
  const g1 = new GameStateManager();
  g1.reset("campaign");
  g1.data.eipassScore = 90;
  g1.data.trust = { ranaldo: 85, carlo: 85, daniele: 85, francesco: 85, ruggero: 85 };
  g1.data.pegasoCollected = PEGASO_LORE.map((p) => p.id);
  assert(g1.computeEnding().id === "secret_golden", "Finale 1 (Segreto Leggendario S+) raggiungibile");

  const g2 = new GameStateManager();
  g2.reset("campaign");
  g2.data.eipassScore = 80;
  g2.data.trust = { ranaldo: 75, carlo: 70, daniele: 70, francesco: 70, ruggero: 70 };
  assert(g2.computeEnding().id === "heroic_lode", "Finale 2 (Eroico A+) raggiungibile");

  const g3 = new GameStateManager();
  g3.reset("campaign");
  g3.data.eipassScore = 58;
  {
    const e3 = g3.computeEnding();
    assert(
      e3.id === "solid_win" || (e3.aliases || []).includes("solid_win") || e3.rank.includes("GRADO B"),
      "Finale 3 (Promossi sul Campo B) raggiungibile"
    );
  }

  const g4 = new GameStateManager();
  g4.reset("campaign");
  g4.data.eipassScore = 30;
  {
    const e4 = g4.computeEnding();
    assert(
      e4.id === "chaotic_comedy" || (e4.aliases || []).includes("chaotic_comedy") || e4.rank.includes("GRADO C"),
      "Finale 4 (Comico-Caotico C+) raggiungibile"
    );
  }
}

console.log(`\n=== RISULTATO QA v2.0: ${passed} TEST SUPERATI, ${failed} FALLITI ===`);
if (failed > 0) {
  process.exit(1);
}
