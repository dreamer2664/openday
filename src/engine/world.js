// Motore Fisico Platform 2D v2.0: Collisioni AABB, Squash & Stretch, Proiettili Passioni,
// Tag-Team Assist [C], Sotto-Aule Esplorabili, Banter in Tempo Reale, 5 Nemici, 2 Mid-Boss e Boss a 3 Fasi!

import { PHYSICS, CHARACTERS, TILE, SCREEN_W, SCREEN_H } from "../config/constants.js";

export class WorldRuntime {
  constructor(blueprint, state, audio, callbacks) {
    this.bp = blueprint;
    this.state = state;
    this.audio = audio;
    this.cb = callbacks; // { onStartDialogue, onStartQuiz, onStartMinigame, onRoomExit, onBossDefeated, onSubRoomChange }

    this.cols = blueprint.cols;
    this.rows = blueprint.rows;
    this.grid = blueprint.grid.map((row) => row.slice());

    // Limiti camera dinamici (zona principale vs sotto-aula segreta esplorabile)
    this.camMinX = 0;
    this.camMaxX = (blueprint.mainBoundCols || blueprint.cols) * TILE;

    this.harmonicTimer = 0;
    this.hitstopFrames = 0;
    this.shakeTimer = 0;
    this.shakeMag = 0;

    this.tempPlatforms = [];
    this.movingPlatforms = blueprint.movingPlatforms.map((mp) => ({
      ...mp,
      x: mp.x1,
      y: mp.y1,
      t: 0,
      dir: 1,
      dx: 0,
      dy: 0,
    }));

    const sx =
      state.data.checkpoint && state.data.checkpoint.roomId === blueprint.id
        ? state.data.checkpoint.x
        : blueprint.spawn.x;
    const sy =
      state.data.checkpoint && state.data.checkpoint.roomId === blueprint.id
        ? state.data.checkpoint.y
        : blueprint.spawn.y;

    this.player = {
      x: sx,
      y: sy,
      w: 15,
      h: 27,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      coyote: 0,
      jumpBuffer: 0,
      invuln: 0,
      cooldown: 0,
      assistCooldown: 0,
      actionAnim: 0,
      victoryTimer: 0,
      walkTimer: 0,
      scaleX: 1,
      scaleY: 1,
      dashing: false,
      dashTimer: 0,
      jumpCutDone: false,
      lastSafeX: sx,
      lastSafeY: sy,
    };

    this.assistActor = null; // { charId, x, y, facing, ttl }
    // COMPAGNI NEL MONDO: gli altri eroi sbloccati seguono il giocatore e possono essere
    // "presi in campo" con [E] o con un tocco. Prima non esistevano e il cambio eroe era invisibile.
    this.companionActors = [];
    this.nearestCompanion = null;
    this.syncCompanions();
    this.activeBanter = null; // { speaker, text, ttl }

    this.camera = { x: Math.max(0, sx - 200), y: 0 };
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.gatesOpen = new Set(state.data.unlockedDoors || []);
    this.interactPrompt = null;

    this.chaseActive = !!blueprint.chaseHazard;
    this.chaseX = -96;

    this.hoops = [];
    this.terminals = [];
    this.minigames = [];
    this.dialogues = [];
    this.banters = [];
    this.subDoors = [];
    this.checkpoints = [];
    this.enemies = [];
    this.items = [];
    this.exits = [];
    this.midBoss = null;
    this.boss = null;

    for (const e of blueprint.entities) {
      if (e.type === "hoop_switch") {
        const already = this.gatesOpen.has(e.targetGateId);
        this.hoops.push({ ...e, activated: already });
        if (already) this.clearGateTiles(e.targetGateId);
      } else if (e.type === "terminal") {
        const cleared = state.data.clearedTerminals.includes(e.quizId);
        this.terminals.push({ ...e, cleared });
        if (cleared && e.targetGateId) this.openGate(e.targetGateId, true);
      } else if (e.type === "minigame") {
        const done = state.data.completedMinigames.includes(e.mgConfig.id);
        this.minigames.push({ ...e, done });
        if (done && e.targetGateId) this.openGate(e.targetGateId, true);
      } else if (e.type === "dialogue") {
        const seen = state.data.triggeredDialogues.includes(e.dialogueId);
        this.dialogues.push({ ...e, triggered: seen });
      } else if (e.type === "banter") {
        this.banters.push({ ...e, triggered: false });
      } else if (e.type === "subdoor") {
        this.subDoors.push({ ...e });
      } else if (e.type === "checkpoint") {
        const isCur =
          state.data.checkpoint &&
          state.data.checkpoint.roomId === blueprint.id &&
          Math.abs(state.data.checkpoint.x - e.x) < 8;
        this.checkpoints.push({ ...e, active: !!isCur });
      } else if (e.type === "enemy") {
        this.enemies.push({
          ...e,
          w: 20,
          h: 20,
          vx: e.kind === "megaphone" ? 0 : e.kind === "crab" ? 0.65 : 0.85,
          vy: 0,
          baseY: e.y,
          phase: Math.random() * Math.PI * 2,
          hopTimer: 35 + Math.floor(Math.random() * 35),
          shotTimer: 70 + Math.floor(Math.random() * 40),
          stun: 0,
          alive: true,
        });
      } else if (e.type === "midboss") {
        const alreadyOpen = e.targetGateId && this.gatesOpen.has(e.targetGateId);
        if (!alreadyOpen) {
          const maxHp = e.bossKind === "kraken" ? 8 : 6;
          this.midBoss = {
            ...e,
            baseY: e.y,
            w: 40,
            h: 48,
            hp: maxHp,
            maxHp,
            vx: 1.05,
            timer: 0,
            invuln: 0,
            defeated: false,
          };
        } else {
          this.openGate(e.targetGateId, true);
        }
      } else if (e.type === "token") {
        this.items.push({ ...e, kind: "token", w: 10, h: 10, taken: false });
      } else if (e.type === "heart") {
        this.items.push({ ...e, kind: "heart", w: 14, h: 14, taken: false });
      } else if (e.type === "pegaso") {
        const has = state.data.pegasoCollected.includes(e.pegasoId);
        if (!has) {
          this.items.push({ ...e, kind: "pegaso", w: 16, h: 18, taken: false });
        }
      } else if (e.type === "exit") {
        this.exits.push({ ...e, w: 24, h: 32 });
      } else if (e.type === "boss") {
        const weakened = state.data.clearedTerminals.includes("qz_ppt_openday");
        const maxHp = e.compact ? 8 : weakened ? 12 : 15;
        this.boss = {
          x: e.x,
          y: e.y,
          baseX: e.x,
          baseY: e.y - 20,
          w: 38,
          h: 48,
          hp: maxHp,
          maxHp,
          compact: e.compact,
          phase: 1,
          timer: 0,
          invuln: 0,
          stunTimer: 0,
          defeated: false,
        };
      }
    }
  }

  triggerShake(frames = 8, mag = 2.5) {
    this.shakeTimer = Math.max(this.shakeTimer, frames);
    this.shakeMag = Math.max(this.shakeMag, mag);
  }

  // IL PASSO DI SALSA NON APRE I VARCHI DI LOGICA.
  // Solo i varchi ritmici (gateId con prefisso "rh_") sono apribili da Daniele:
  // quiz, minigiochi e mid-boss restano vincolati alla loro prova.
  static isRhythmGate(gateId) {
    return typeof gateId === "string" && gateId.startsWith("rh_");
  }

  advanceRhythmGate(facing = 1) {
    let best = null;
    let bestDist = Infinity;
    for (const e of this.bp.entities) {
      if (e.type !== "gate_marker" || !e.gateId) continue;
      if (!WorldRuntime.isRhythmGate(e.gateId)) continue; // mai quiz / minigiochi / boss
      if (this.gatesOpen.has(e.gateId)) continue;
      const gx = e.c * TILE;
      const dist = (gx - this.player.x) * facing;
      if (dist > -TILE && dist < bestDist) {
        bestDist = dist;
        best = e;
      }
    }
    if (best && bestDist < TILE * 5) {
      this.openGate(best.gateId, false);
      this.addFloatingText(this.player.x, this.player.y - 26, "VARCO RITMICO!", "#f472b6");
      this.audio.playSfx("blip", 523.25);
      return true;
    }
    if (best && bestDist < TILE * 8) {
      this.addFloatingText(this.player.x, this.player.y - 26, "AVVICINATI AL VARCO!", "#f9a8d4");
    }
    return false;
  }

  openGate(gateId, silent = false) {
    if (!gateId) return;
    this.gatesOpen.add(gateId);
    if (!this.state.data.unlockedDoors.includes(gateId)) {
      this.state.data.unlockedDoors.push(gateId);
    }
    this.clearGateTiles(gateId);
    if (!silent) {
      this.audio.playSfx("door");
      this.addFloatingText(this.player.x, this.player.y - 16, "VARCO SBLOCCATO!", "#4ade80");
    }
  }

  clearGateTiles(gateId) {
    for (const e of this.bp.entities) {
      if (e.type === "gate_marker" && e.gateId === gateId) {
        for (let rr = e.r; rr < e.r + e.h; rr++) {
          if (this.grid[rr] && this.grid[rr][e.c] === 5) {
            this.grid[rr][e.c] = 0;
          }
        }
      }
    }
  }

  executeWorldAction(actionName) {
    if (actionName === "open_shortcut_gate") {
      const firstGate = this.bp.entities.find((e) => e.type === "gate_marker");
      if (firstGate) this.openGate(firstGate.gateId, false);
      this.addFloatingText(this.player.x, this.player.y - 20, "SCORCIATOIA LOGICA!", "#38bdf8");
    } else if (actionName === "spawn_bonus_tokens") {
      for (let i = 0; i < 6; i++) {
        this.items.push({
          kind: "token",
          x: this.player.x + 28 + i * 16,
          y: this.player.y - 18 - (i % 2) * 10,
          w: 10,
          h: 10,
          taken: false,
        });
      }
      this.addFloatingText(this.player.x, this.player.y - 20, "BONUS CONTROPIEDE!", "#f97316");
    } else if (actionName === "spawn_guard_drone") {
      // Nasce APPOGGIATO al suolo davanti al giocatore: niente vibrazione a mezz'aria.
      const spawnX = Math.min(this.camMaxX - 48, this.player.x + 96);
      const groundY = this.findGroundY(spawnX + 10, this.player.y - 40);
      this.enemies.push({
        kind: "spambot",
        x: spawnX,
        y: groundY - 20,
        baseY: groundY - 20,
        minX: this.player.x + 32,
        maxX: Math.min(this.camMaxX - 32, this.player.x + 160),
        w: 20,
        h: 20,
        vx: -0.95,
        vy: 0,
        phase: 0,
        hopTimer: 40,
        shotTimer: 90,
        stun: 0,
        alive: true,
      });
      this.addFloatingText(this.player.x, this.player.y - 20, "ALLARME SPAM-BOT!", "#ef4444");
    }
  }

  addParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = 1.0 + Math.random() * 2.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.6,
        color,
        ttl: 18 + Math.floor(Math.random() * 12),
      });
    }
  }

  addFloatingText(x, y, text, color = "#ffd147") {
    this.floatingTexts.push({ x, y, text, color, ttl: 54 });
  }

  /** Crea/aggiorna i compagni visibili: uno sprite per ogni eroe sbloccato non attivo. */
  syncCompanions() {
    const unlocked = (this.state.data.unlockedChars || []).slice();
    const active = this.state.data.activeChar;
    const others = unlocked.filter((c) => c !== active && CHARACTERS[c]);
    // rimuove chi non è più in squadra
    this.companionActors = this.companionActors.filter((a) => others.includes(a.charId));
    for (const cid of others) {
      if (this.companionActors.some((a) => a.charId === cid)) continue;
      const idx = this.companionActors.length;
      // Ogni compagno ha il SUO posto: senza "segui" resta lì e si aggira in zona, non ti pedina.
      // Si sistemano alternati a destra e sinistra, a distanza di rispetto (70-160px).
      const side = idx % 2 === 0 ? -1 : 1;
      const spread = 70 + Math.floor(idx / 2) * 55;
      const homeX = this.clampCompanionX(this.player.x + side * spread);
      this.companionActors.push({
        charId: cid,
        x: homeX,
        y: this.player.y,
        homeX,
        homeY: this.player.y,
        targetX: homeX,
        targetY: this.player.y,
        waitTimer: 40 + idx * 55,
        wander: idx + 1,
        bob: idx * 10,
        facing: 1,
        label: CHARACTERS[cid].shortName,
      });
    }
  }

  /** I compagni seguono con un certo ritardo e non entrano nei muri. */
  /** Tiene i compagni dentro i bordi della stanza (mai fuori schermo). */
  clampCompanionX(x) {
    const maxX = Math.min(this.camMaxX || this.cols * TILE, this.cols * TILE) - 44;
    return Math.max(14, Math.min(maxX, x));
  }

  /** Opzione "Squadra al seguito": la decide il giocatore nel menu iniziale o in pausa. */
  isTeamFollowEnabled() {
    return !!(this.state.audioPrefs && this.state.audioPrefs.followTeam);
  }

  /**
   * Compagni in scena. Due comportamenti, scelti dall'opzione "Squadra al seguito"
   * nel menu iniziale o in pausa:
   *  - followTeam = true  -> ti seguono a catena (vecchio comportamento);
   *  - followTeam = false -> restano dalle loro parti: si aggirano intorno al loro punto
   *    e ti si riavvicinano solo se ti allontani troppo (non ti stanno addosso).
   */
  updateCompanions() {
    this.syncCompanions();
    const p = this.player;
    this.companionTick = (this.companionTick || 0) + 1;
    // Nessuno ti pedina: ogni compagno ha la sua distanza di rispetto (70-160px).
    const follow = this.isTeamFollowEnabled();
    this.companionActors.forEach((a, i) => {
      if (a.homeX === undefined) {
        a.homeX = a.x;
        a.homeY = a.y;
        a.targetX = a.x;
        a.targetY = a.y;
        a.waitTimer = 40 + i * 50;
      }
      const side = i % 2 === 0 ? -1 : 1;
      const spread = 70 + Math.floor(i / 2) * 55;

      if (follow) {
        // Opzione attiva: ti restano accanto, ma alla loro distanza (mai addosso)
        const tx = this.clampCompanionX(p.x + side * spread);
        a.x += (tx - a.x) * 0.06;
        a.y += (p.y - a.y) * 0.09;
        a.facing = tx > a.x ? 1 : -1;
        a.homeX = tx;
        a.homeY = p.y;
      } else {
        // Opzione spenta: ognuno si aggira intorno al SUO punto e non ti segue
        a.waitTimer = (a.waitTimer || 0) - 1;
        if (a.waitTimer <= 0) {
          // si aggira solo ALLONTANANDOSI dal giocatore: mai addosso
          const away = Math.sign(a.homeX - p.x) || (i % 2 === 0 ? -1 : 1);
          a.targetX = this.clampCompanionX(
            a.homeX + away * Math.abs(Math.round(Math.sin((this.companionTick + i * 37) * 0.013) * 26))
          );
          a.targetY = a.homeY;
          a.waitTimer = 70 + ((i * 41 + this.companionTick) % 90);
        }
        const dx = a.targetX - a.x;
        const dy = a.targetY - a.y;
        a.x += dx * 0.035;
        a.y += dy * 0.05;
        a.facing =
          (Math.abs(dx) > 0.6 ? Math.sign(dx) : Math.cos((this.companionTick + i * 20) * 0.02)) > 0 ? 1 : -1;
      }
      a.bob = (a.bob + 1) % 90;
    });
  }

  /** Cerca la prima superficie solida sotto (x,y) e ne restituisce la coordinata Y in pixel. */
  findGroundY(x, fromY) {
    const c = Math.floor(x / TILE);
    const startRow = Math.max(0, Math.floor(fromY / TILE));
    for (let r = startRow; r < this.rows; r++) {
      if (this.isSolidTile(c, r)) {
        return r * TILE;
      }
    }
    return (this.rows - 2) * TILE;
  }

  isSolidTile(c, r) {
    if (c < 0 || c >= this.cols) return true;
    if (r < 0) return false;
    if (r >= this.rows) return false;
    const t = this.grid[r][c];
    if (t === 1 || t === 3 || t === 5 || t === 7) return true;
    if (t === 4 && this.harmonicTimer > 0) return true;
    return false;
  }

  update(input) {
    if (this.shakeTimer > 0) this.shakeTimer--;
    if (this.activeBanter) {
      this.activeBanter.ttl--;
      if (this.activeBanter.ttl <= 0) this.activeBanter = null;
    }
    if (this.assistActor) {
      this.assistActor.ttl--;
      if (this.assistActor.ttl <= 0) this.assistActor = null;
    }

    if (this.hitstopFrames > 0) {
      this.hitstopFrames--;
      return;
    }

    const p = this.player;
    const charMeta = CHARACTERS[this.state.data.activeChar] || CHARACTERS.carlo;

    if (this.harmonicTimer > 0) this.harmonicTimer--;
    if (p.invuln > 0) p.invuln--;
    if (p.cooldown > 0) p.cooldown--;
    if (p.assistCooldown > 0) p.assistCooldown--;
    if (p.actionAnim > 0) p.actionAnim--;

    // Ritorno elastico squash & stretch
    p.scaleX += (1 - p.scaleX) * 0.26;
    p.scaleY += (1 - p.scaleY) * 0.26;

    for (let i = this.tempPlatforms.length - 1; i >= 0; i--) {
      this.tempPlatforms[i].ttl--;
      if (this.tempPlatforms[i].ttl <= 0) this.tempPlatforms.splice(i, 1);
    }

    for (const mp of this.movingPlatforms) {
      const oldX = mp.x;
      const oldY = mp.y;
      const dist = Math.hypot(mp.x2 - mp.x1, mp.y2 - mp.y1) || 1;
      mp.t += (mp.speed / dist) * mp.dir;
      if (mp.t >= 1) {
        mp.t = 1;
        mp.dir = -1;
      } else if (mp.t <= 0) {
        mp.t = 0;
        mp.dir = 1;
      }
      mp.x = mp.x1 + (mp.x2 - mp.x1) * mp.t;
      mp.y = mp.y1 + (mp.y2 - mp.y1) * mp.t;
      mp.dx = mp.x - oldX;
      mp.dy = mp.y - oldY;
    }

    // --- MOVIMENTO ORIZZONTALE (incluso Scatto Ostacoli di Ruggero) ---
    if (p.dashTimer > 0) {
      p.dashTimer--;
      if (p.dashTimer === 0) p.dashing = false;
    }
    const maxSpd = PHYSICS.baseSpeed * (charMeta.speedMult + this.synergySpeedBonus);
    const accel = p.onGround ? PHYSICS.groundAccel : PHYSICS.airAccel;
    if (p.dashing) {
      // Mantiene lo slancio dello Scatto Ostacoli consentendo solo il salto sopra gli ostacoli
      const dashSpd = Math.max(3.6, Math.abs(p.vx));
      p.vx = p.facing * dashSpd * 0.985;
      if (input.jumpPressed) p.jumpBuffer = PHYSICS.jumpBufferFrames;
    } else if (input.left) {
      p.vx = Math.max(-maxSpd, p.vx - accel);
      p.facing = -1;
    } else if (input.right) {
      p.vx = Math.min(maxSpd, p.vx + accel);
      p.facing = 1;
    } else {
      p.vx *= p.onGround ? PHYSICS.groundFriction : PHYSICS.airDrag;
      if (Math.abs(p.vx) < 0.06) p.vx = 0;
    }

    // --- COYOTE TIME & JUMP BUFFERING ---
    if (p.onGround) p.coyote = PHYSICS.coyoteFrames;
    else if (p.coyote > 0) p.coyote--;

    if (input.jumpPressed) p.jumpBuffer = PHYSICS.jumpBufferFrames;
    else if (p.jumpBuffer > 0) p.jumpBuffer--;

    if (p.jumpBuffer > 0 && p.coyote > 0) {
      // sinergia di squadra: i compagni sbloccati alleggeriscono un po' il salto
      p.vy = PHYSICS.baseJump * (charMeta.jumpMult + this.synergyJumpBonus);
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuffer = 0;
      p.jumpCutDone = false;
      p.scaleX = 0.82;
      p.scaleY = 1.2;
      this.audio.playSfx("jump");
      this.addParticles(p.x + p.w / 2, p.y + p.h, "#e2e8f0", 5);
    }

    // Jump-cut SOLO una volta per salto: un solo tocco non deve azzerare molle e rimbalzi.
    if (!input.jumpDown && p.vy < -1.8 && !p.jumpCutDone) {
      p.vy *= PHYSICS.jumpCutMultiplier;
      p.jumpCutDone = true;
    }
    if (p.onGround || p.vy > 0) p.jumpCutDone = false;

    p.vy = Math.min(PHYSICS.maxFall, p.vy + PHYSICS.gravity);

    // --- COLLISIONI ---
    p.x += p.vx;
    this.resolveHorizontalCollisions(p);

    const prevBottom = p.y + p.h;
    const wasOnGround = p.onGround;
    p.y += p.vy;
    p.onGround = false;
    this.resolveVerticalCollisions(p, prevBottom);

    if (!wasOnGround && p.onGround) {
      p.scaleX = 1.22;
      p.scaleY = 0.8;
      this.audio.playSfx("land");
      this.addParticles(p.x + p.w / 2, p.y + p.h, "#cbd5e1", 4);
    }

    if (p.onGround) {
      const footC = Math.floor((p.x + p.w / 2) / TILE);
      const footR = Math.floor((p.y + p.h + 1) / TILE);
      if (footR >= 0 && footR < this.rows && this.grid[footR][footC] === 1) {
        p.lastSafeX = p.x;
        p.lastSafeY = p.y;
      }
      if (Math.abs(p.vx) > 0.25) {
        p.walkTimer += 0.22;
        if (Math.floor(p.walkTimer * 5) % 14 === 0) {
          this.particles.push({
            x: p.x + p.w / 2 - p.facing * 5,
            y: p.y + p.h - 1,
            vx: -p.facing * 0.4,
            vy: -0.25,
            color: "#cbd5e1",
            ttl: 10,
          });
        }
      } else {
        p.walkTimer = 0;
      }
    }

    this.checkHazards(p);

    // --- ABILITÀ SPECIALE [X] & ASSIST DI SQUADRA [C] ---
    if (input.specialPressed && p.cooldown <= 0) {
      this.triggerCharacterAbility(charMeta, input.up, p.x, p.y, p.facing, false);
    }
    if (input.assistPressed && p.assistCooldown <= 0) {
      this.triggerSquadAssist(input.up);
    }

    this.updateCompanions();
    this.updateProjectiles();
    this.updateEnemies();

    if (this.midBoss && !this.midBoss.defeated) {
      this.updateMidBoss();
    }
    if (this.boss && !this.boss.defeated) {
      this.updateBoss();
    }

    if (this.chaseActive) {
      this.chaseX = Math.max(this.chaseX + 1.38, p.x - 210);
      if (p.x < this.chaseX + 24) {
        this.damagePlayer(1, true);
        this.chaseX = p.x - 135;
      }
    }

    this.checkTriggersAndInteractions(input);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.12;
      pt.ttl--;
      if (pt.ttl <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].y -= 0.45;
      this.floatingTexts[i].ttl--;
      if (this.floatingTexts[i].ttl <= 0) this.floatingTexts.splice(i, 1);
    }

    const targetCamX = p.x + p.w / 2 - 240 + p.facing * 26;
    const targetCamY = p.y + p.h / 2 - 145;
    this.camera.x += (targetCamX - this.camera.x) * 0.15;
    this.camera.y += (targetCamY - this.camera.y) * 0.15;
    const maxCamX = Math.max(this.camMinX, this.camMaxX - SCREEN_W);
    this.camera.x = Math.round(Math.max(this.camMinX, Math.min(maxCamX, this.camera.x)));
    this.camera.y = Math.round(Math.max(0, Math.min(Math.max(0, this.rows * TILE - SCREEN_H), this.camera.y)));
  }

  resolveHorizontalCollisions(ent) {
    const top = Math.floor((ent.y + 2) / TILE);
    const bottom = Math.floor((ent.y + ent.h - 2) / TILE);
    if (ent.vx > 0) {
      const right = Math.floor((ent.x + ent.w) / TILE);
      for (let r = top; r <= bottom; r++) {
        if (this.isSolidTile(right, r)) {
          if (ent === this.player && ent.dashing && this.grid[r][right] === 3) {
            this.shatterCrackedCluster(right, r);
            this.audio.playSfx("goal");
            this.addParticles(ent.x + ent.w, ent.y + ent.h / 2, "#f45565", 10);
            this.addFloatingText(ent.x, ent.y - 8, "BARRIERA SFONDATA!", "#f45565");
            continue;
          }
          ent.x = right * TILE - ent.w - 0.01;
          ent.vx = 0;
          break;
        }
      }
    } else if (ent.vx < 0) {
      const left = Math.floor(ent.x / TILE);
      for (let r = top; r <= bottom; r++) {
        if (this.isSolidTile(left, r)) {
          if (ent === this.player && ent.dashing && this.grid[r][left] === 3) {
            this.shatterCrackedCluster(left, r);
            this.audio.playSfx("goal");
            this.addParticles(ent.x, ent.y + ent.h / 2, "#f45565", 10);
            this.addFloatingText(ent.x, ent.y - 8, "BARRIERA SFONDATA!", "#f45565");
            continue;
          }
          ent.x = (left + 1) * TILE + 0.01;
          ent.vx = 0;
          break;
        }
      }
    }
  }

  resolveVerticalCollisions(p, prevBottom) {
    const left = Math.floor((p.x + 2) / TILE);
    const right = Math.floor((p.x + p.w - 2) / TILE);

    if (p.vy >= 0) {
      const bottom = Math.floor((p.y + p.h) / TILE);
      for (let c = left; c <= right; c++) {
        if (bottom >= 0 && bottom < this.rows) {
          const t = this.grid[bottom][c];
          if (t === 7) {
            p.y = bottom * TILE - p.h;
            p.vy = -8.8;
            p.onGround = false;
            p.scaleX = 0.76;
            p.scaleY = 1.28;
            this.audio.playSfx("jump");
            this.addParticles(p.x + p.w / 2, p.y + p.h, "#fde047", 10);
            return;
          }
          const solid = this.isSolidTile(c, bottom);
          const oneWay = t === 2 && prevBottom <= bottom * TILE + 4;
          if (solid || oneWay) {
            p.y = bottom * TILE - p.h;
            p.vy = 0;
            p.onGround = true;
            return;
          }
        }
      }

      for (const tp of this.tempPlatforms) {
        if (p.x + p.w > tp.x && p.x < tp.x + tp.w && prevBottom <= tp.y + 5 && p.y + p.h >= tp.y) {
          p.y = tp.y - p.h;
          p.vy = 0;
          p.onGround = true;
          return;
        }
      }

      for (const mp of this.movingPlatforms) {
        if (
          p.x + p.w > mp.x &&
          p.x < mp.x + mp.w &&
          prevBottom <= mp.y + 6 + Math.abs(mp.dy) &&
          p.y + p.h >= mp.y - 2
        ) {
          p.y = mp.y - p.h;
          p.x += mp.dx;
          p.vy = 0;
          p.onGround = true;
          return;
        }
      }
    } else if (p.vy < 0) {
      const top = Math.floor(p.y / TILE);
      for (let c = left; c <= right; c++) {
        if (this.isSolidTile(c, top)) {
          p.y = (top + 1) * TILE + 0.01;
          p.vy = 0;
          return;
        }
      }
    }
  }

  checkHazards(p) {
    if (p.y > this.rows * TILE + 24) {
      this.recoverFromPit();
      return;
    }
    const c = Math.floor((p.x + p.w / 2) / TILE);
    const r = Math.floor((p.y + p.h - 2) / TILE);
    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.grid[r][c] === 6) {
      this.recoverFromPit();
    }
  }

  recoverFromPit() {
    const p = this.player;
    this.damagePlayer(1, false);
    if (this.state.data.hp > 0) {
      p.x = p.lastSafeX;
      p.y = p.lastSafeY - 4;
      p.vx = 0;
      p.vy = 0;
      p.invuln = 65;
    }
  }

  /** Bonus passivo di squadra: fornito da main.teamSynergy(), 0 se non disponibile. */
  get synergyJumpBonus() {
    return this._synergyJumpBonus || 0;
  }

  get synergySpeedBonus() {
    return this._synergySpeedBonus || 0;
  }

  damagePlayer(amount = 1, knockback = true) {
    const p = this.player;
    if (p.invuln > 0) return;

    if (this.state.data.shield > 0) {
      this.state.data.shield--;
      p.invuln = 55;
      this.audio.playSfx("mechanism");
      this.triggerShake(6, 2);
      this.addFloatingText(p.x, p.y - 12, "SCUDO ASSORBE IL COLPO!", "#38bdf8");
      return;
    }

    this.state.data.hp -= amount;
    p.invuln = PHYSICS.invulnFrames;
    this.audio.playSfx("damage");
    this.triggerShake(10, 3.5);
    this.addParticles(p.x + p.w / 2, p.y + p.h / 2, "#ef4444", 12);

    if (knockback) {
      p.vy = -3.8;
      p.vx = -p.facing * 2.4;
    }

    if (this.state.data.hp <= 0) {
      this.state.data.deaths++;
      this.state.data.hp = this.state.data.maxHp;
      this.camMinX = 0;
      this.camMaxX = (this.bp.mainBoundCols || this.bp.cols) * TILE;
      const cp = this.state.data.checkpoint;
      if (cp && cp.roomId === this.bp.id) {
        p.x = cp.x;
        p.y = cp.y;
      } else {
        p.x = this.bp.spawn.x;
        p.y = this.bp.spawn.y;
      }
      p.lastSafeX = p.x;
      p.lastSafeY = p.y;
      p.vx = 0;
      p.vy = 0;
      if (this.chaseActive) this.chaseX = p.x - 190;
      this.addFloatingText(p.x, p.y - 18, "RIPARTENZA DAL CHECKPOINT!", "#fde047");
    }
  }

  triggerSquadAssist(aimUp = false) {
    const p = this.player;
    const unlocked = this.state.data.unlockedChars.filter((c) => c !== this.state.data.activeChar);
    if (unlocked.length === 0) return;
    const helperId = unlocked[this.state.data.assistsUsed % unlocked.length];
    const helperMeta = CHARACTERS[helperId];
    if (!helperMeta) return;

    this.state.data.assistsUsed++;
    const avgTrust = this.state.getAverageTrust();
    p.assistCooldown = avgTrust >= 70 ? 220 : 280;

    const ax = p.x - p.facing * 14;
    const ay = p.y;
    this.assistActor = {
      charId: helperId,
      x: ax,
      y: ay,
      facing: p.facing,
      ttl: 40,
    };
    this.audio.playSfx("assist");
    this.addParticles(ax + 8, ay + 14, helperMeta.color, 10);
    this.addFloatingText(ax - 8, ay - 16, `ASSIST DI ${helperMeta.shortName.toUpperCase()}!`, helperMeta.color);
    this.triggerCharacterAbility(helperMeta, aimUp, ax, ay, p.facing, true);
  }

  triggerCharacterAbility(charMeta, aimUp = false, ox = this.player.x, oy = this.player.y, facing = this.player.facing, isAssist = false) {
    const p = this.player;
    const trust = this.state.data.trust[charMeta.id] || 55;
    if (!isAssist) {
      p.actionAnim = 16;
      p.cooldown = trust >= 70 ? Math.round(charMeta.cooldownMax * 0.78) : charMeta.cooldownMax;
    }

    if (charMeta.id === "carlo") {
      const boost = trust >= 70 ? 1.12 : 1.0;
      this.projectiles.push({
        kind: "basketball",
        x: ox + 8 + facing * 8,
        y: oy + 8,
        vx: facing * (aimUp ? 3.5 : 4.3) * boost,
        vy: (aimUp ? -6.5 : -5.1) * boost,
        bouncesLeft: 3,
        ttl: 135,
      });
      this.audio.playSfx("jump");
    } else if (charMeta.id === "ruggero") {
      // SCATTO OSTACOLI — slancio atletico ad alta velocità che sfonda le barriere incrinate
      const boost = trust >= 70 ? 1.2 : 1.0;
      p.dashTimer = 16;
      p.dashing = true;
      p.vx = facing * 6.0 * boost;
      p.vy = aimUp ? -3.4 : Math.max(p.vy, -0.5);
      p.invuln = Math.max(p.invuln, 14);
      p.actionAnim = 18;
      this.audio.playSfx("sprint_dash");
      this.addFloatingText(ox - 10, oy - 14, "SCATTO OSTACOLI!", "#f45565");
    } else if (charMeta.id === "daniele") {
      // PASSO DI SALSA — onda ritmica che apre i varchi, stordisce i pop-up corrotti e fa da metronomo
      this.audio.playSfx("resonance");
      this.projectiles.push({
        kind: "salsa_wave",
        x: ox + 8 + facing * 10,
        y: oy + 12,
        vx: facing * 4.6,
        vy: aimUp ? -1.4 : 0,
        ttl: 78,
        radius: 10,
        beat: 0,
      });
      p.actionAnim = 18;
      if (!isAssist) this.advanceRhythmGate(facing);
      this.addFloatingText(ox - 12, oy - 14, "PASSO DI SALSA!", "#f472b6");
    } else if (charMeta.id === "francesco") {
      this.harmonicTimer = trust >= 70 ? 540 : 440;
      this.audio.playSfx("resonance");
      this.projectiles.push({
        kind: "harmonic_wave",
        x: ox + 8,
        y: oy + 14,
        radius: 10,
        maxRadius: trust >= 70 ? 98 : 78,
        ttl: 24,
      });
      // Doppie note musicali cercanti!
      for (const vyNote of [-0.9, 0.7]) {
        this.projectiles.push({
          kind: "music_note",
          x: ox + 8 + facing * 10,
          y: oy + 12,
          vx: facing * 4.2,
          vy: aimUp ? vyNote - 1.4 : vyNote,
          ttl: 72,
        });
      }
      if (!isAssist) this.addFloatingText(ox - 10, oy - 14, "♪ RISONANZA ATTIVA!", "#38e2d8");
    } else if (charMeta.id === "ranaldo") {
      this.audio.playSfx("mechanism");
      const count = trust >= 70 ? 3 : 2;
      for (let i = 1; i <= count; i++) {
        const px = ox + facing * (i * 38) - 12;
        const py = oy + 27 - (i === 2 ? 14 : 4);
        this.tempPlatforms.push({ x: px, y: py, w: 34, h: 6, ttl: 290 });
        this.addParticles(px + 17, py, "#ffd147", 5);
      }
      // Lancia anche il Vettore Aureo offensivo!
      this.projectiles.push({
        kind: "golden_compass",
        x: ox + 8 + facing * 10,
        y: oy + 12,
        vx: facing * 4.8,
        vy: aimUp ? -1.8 : 0,
        ttl: 65,
      });
      for (const e of this.enemies) {
        if (e.alive && Math.hypot(e.x - ox, e.y - oy) < 96) e.stun = 95;
      }
      if (!isAssist) this.addFloatingText(ox - 8, oy - 14, "y = a*x² + k!", "#ffd147");
    }
  }

  updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.ttl--;
      if (pr.ttl <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (pr.kind === "harmonic_wave") {
        pr.radius += (pr.maxRadius - pr.radius) * 0.25;
        for (let j = this.projectiles.length - 1; j >= 0; j--) {
          if (this.projectiles[j].kind === "enemy_orb" || this.projectiles[j].kind === "sound_ring") {
            const d = Math.hypot(this.projectiles[j].x - pr.x, this.projectiles[j].y - pr.y);
            if (d < pr.radius) this.projectiles[j].ttl = 0;
          }
        }
        for (const e of this.enemies) {
          if (e.alive && Math.hypot(e.x - pr.x, e.y - pr.y) < pr.radius) {
            e.stun = 95;
          }
        }
        if (this.midBoss && !this.midBoss.defeated && this.midBoss.invuln <= 0) {
          const d = Math.hypot(this.midBoss.x + 20 - pr.x, this.midBoss.y + 24 - pr.y);
          if (d < pr.radius && !pr.hitMid) {
            pr.hitMid = true;
            this.hitMidBoss(1, "ONDA SONORA!");
          }
        }
        if (this.boss && !this.boss.defeated && this.boss.invuln <= 0) {
          const d = Math.hypot(this.boss.x + 19 - pr.x, this.boss.y + 24 - pr.y);
          if (d < pr.radius && !pr.hitBoss) {
            pr.hitBoss = true;
            this.hitBoss(this.state.data.flags.c6_leader_choice === "lead_francesco" ? 2 : 1, "ARMONIA!");
          }
        }
        continue;
      }

      if (pr.kind === "enemy_orb" || pr.kind === "sound_ring") {
        pr.x += pr.vx;
        pr.y += pr.vy;
        const p = this.player;
        if (pr.x > p.x && pr.x < p.x + p.w && pr.y > p.y && pr.y < p.y + p.h) {
          this.damagePlayer(1, true);
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      // Note musicali e Compasso Aureo (volo teso senza rimbalzo)
      if (pr.kind === "music_note" || pr.kind === "golden_compass") {
        pr.x += pr.vx;
        pr.y += pr.vy + (pr.kind === "music_note" ? Math.sin(pr.ttl * 0.25) * 0.6 : 0);
        if (this.checkPlayerProjectileHits(pr)) {
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      // Passo di Salsa di Daniele: onda ritmica che neutralizza proiettili corrotti e stordisce i nemici
      if (pr.kind === "salsa_wave") {
        pr.x += pr.vx;
        pr.y += pr.vy + Math.sin(pr.ttl * 0.28) * 0.6;
        pr.beat += 0.22;
        pr.radius = 10 + Math.sin(pr.beat) * 4;
        for (let j = this.projectiles.length - 1; j >= 0; j--) {
          const o = this.projectiles[j];
          if ((o.kind === "enemy_orb" || o.kind === "sound_ring") && Math.hypot(o.x - pr.x, o.y - pr.y) < 40) {
            o.ttl = 0;
          }
        }
        for (const e of this.enemies) {
          if (e.alive && Math.hypot(e.x - pr.x, e.y - pr.y) < 42) e.stun = Math.max(e.stun, 80);
        }
        if (pr.ttl % 6 === 0) this.addParticles(pr.x, pr.y, "#f472b6", 2);
        if (this.checkPlayerProjectileHits(pr)) {
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      // Fisica palla da basket o proiettile atletico
      pr.x += pr.vx;
      pr.vy += pr.kind === "basketball" ? 0.24 : 0.12;
      pr.y += pr.vy;

      const c = Math.floor(pr.x / TILE);
      const r = Math.floor(pr.y / TILE);

      if (pr.kind === "basketball") {
        for (const h of this.hoops) {
          if (!h.activated && Math.hypot(pr.x - (h.x + 8), pr.y - (h.y + 8)) < 19) {
            h.activated = true;
            this.audio.playSfx("basket_swish");
            this.addParticles(h.x + 8, h.y + 8, "#f97316", 14);
            this.addFloatingText(h.x - 10, h.y - 10, "CIUFF! CANESTRO!", "#fb923c");
            if (h.targetGateId === "boss_stun_hoop" && this.boss && !this.boss.defeated) {
              this.boss.stunTimer = 145;
              this.hitBoss(2, "TRIPLA SUL SOFISTA!");
              setTimeout(() => {
                h.activated = false;
              }, 5500);
            } else {
              this.openGate(h.targetGateId, false);
            }
          }
        }
      }

      if (this.isSolidTile(c, r)) {
        if (pr.bouncesLeft > 0) {
          pr.bouncesLeft--;
          const prevC = Math.floor((pr.x - pr.vx) / TILE);
          if (prevC !== c) pr.vx = -pr.vx * 0.75;
          else pr.vy = -Math.abs(pr.vy) * 0.72;
          this.audio.playSfx("basket_bounce");
        } else {
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      if (this.checkPlayerProjectileHits(pr)) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  checkPlayerProjectileHits(pr) {
    for (const e of this.enemies) {
      if (e.alive && pr.x > e.x - 4 && pr.x < e.x + e.w + 4 && pr.y > e.y - 4 && pr.y < e.y + e.h + 4) {
        e.alive = false;
        this.state.data.enemiesDefeated++;
        this.state.data.score += 120;
        this.audio.playSfx("stomp");
        this.addParticles(e.x + 10, e.y + 10, "#fde047", 10);
        return true;
      }
    }

    if (this.midBoss && !this.midBoss.defeated && this.midBoss.invuln <= 0) {
      const mb = this.midBoss;
      if (pr.x > mb.x && pr.x < mb.x + mb.w && pr.y > mb.y && pr.y < mb.y + mb.h) {
        this.hitMidBoss(1, "COLPO A SEGNO!");
        return true;
      }
    }

    if (this.boss && !this.boss.defeated && this.boss.invuln <= 0) {
      const b = this.boss;
      if (pr.x > b.x && pr.x < b.x + b.w && pr.y > b.y && pr.y < b.y + b.h) {
        const bonus =
          (pr.kind === "basketball" && this.state.data.flags.c6_leader_choice === "lead_carlo") ||
          ((pr.kind === "salsa_wave" || pr.kind === "golden_compass") &&
            this.state.data.flags.c6_leader_choice === "lead_tactical")
            ? 2
            : 1;
        this.hitBoss(
          bonus,
          pr.kind === "basketball"
            ? "TIRO DA TRE!"
            : pr.kind === "salsa_wave"
            ? "FIGURA DI SALSA!"
            : "COLPO DIRETTO!"
        );
        return true;
      }
    }
    return false;
  }

  shatterCrackedCluster(startC, startR) {
    const stack = [[startC, startR]];
    while (stack.length > 0) {
      const [c, r] = stack.pop();
      if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
      if (this.grid[r][c] !== 3) continue;
      this.grid[r][c] = 0;
      stack.push([c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]);
    }
  }

  updateEnemies() {
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.stun > 0) {
        e.stun--;
        continue;
      }

      if (e.kind === "drone") {
        e.x += e.vx;
        if (e.x < e.minX || e.x > e.maxX) e.vx *= -1;
        e.phase += 0.07;
        e.y = e.baseY + Math.sin(e.phase) * 14;
      } else if (e.kind === "slime") {
        // Popup-Slime rimbalzante!
        e.x += e.vx;
        const aheadC = Math.floor((e.x + (e.vx > 0 ? e.w + 2 : -2)) / TILE);
        const footR = Math.floor((e.baseY + e.h + 2) / TILE);
        const midR = Math.floor((e.baseY + 8) / TILE);
        if (e.x < e.minX || e.x > e.maxX || this.isSolidTile(aheadC, midR) || !this.isSolidTile(aheadC, footR)) {
          e.vx *= -1;
        }
        e.hopTimer--;
        if (e.hopTimer <= 0 && e.y >= e.baseY - 0.5) {
          e.vy = -3.8;
          e.hopTimer = 72;
        }
        e.y += e.vy;
        e.vy += 0.22;
        if (e.y > e.baseY) {
          e.y = e.baseY;
          e.vy = 0;
        }
      } else if (e.kind === "megaphone") {
        // Torretta FakeNews-Megaphone: spara onde sonore rosa quando il giocatore è in vista!
        e.shotTimer--;
        const dist = p.x - e.x;
        if (e.shotTimer <= 0 && Math.abs(dist) < 220 && Math.abs(p.y - e.y) < 90) {
          e.shotTimer = 115;
          const dir = dist >= 0 ? 1 : -1;
          this.projectiles.push({
            kind: "sound_ring",
            x: e.x + (dir > 0 ? 20 : 0),
            y: e.y + 10,
            vx: dir * 1.9,
            vy: 0,
            ttl: 110,
          });
        }
      } else {
        e.x += e.vx;
        const aheadC = Math.floor((e.x + (e.vx > 0 ? e.w + 2 : -2)) / TILE);
        const footR = Math.floor((e.y + e.h + 2) / TILE);
        const midR = Math.floor((e.y + 8) / TILE);
        if (e.x < e.minX || e.x > e.maxX || this.isSolidTile(aheadC, midR) || !this.isSolidTile(aheadC, footR)) {
          e.vx *= -1;
        }
      }

      if (p.x + p.w > e.x + 2 && p.x < e.x + e.w - 2 && p.y + p.h > e.y + 2 && p.y < e.y + e.h - 2) {
        const fallingOnTop = p.vy > 0 && p.y + p.h - p.vy <= e.y + 11;
        if (fallingOnTop && e.kind !== "crab") {
          e.alive = false;
          p.vy = -5.4;
          p.scaleX = 0.85;
          p.scaleY = 1.18;
          this.state.data.enemiesDefeated++;
          this.state.data.score += 110;
          this.audio.playSfx("stomp");
          this.addParticles(e.x + 10, e.y + 10, "#38bdf8", 8);
        } else if (fallingOnTop && e.kind === "crab") {
          p.vy = -4.9;
          this.audio.playSfx("basket_bounce");
          this.addFloatingText(e.x - 20, e.y - 10, "CORAZZATO! Usa [X] o [C]!", "#fbbf24");
        } else {
          this.damagePlayer(1, true);
        }
      }
    }
  }

  updateMidBoss() {
    const mb = this.midBoss;
    const p = this.player;
    if (mb.invuln > 0) mb.invuln--;
    mb.timer++;

    if (mb.bossKind === "bufala") {
      mb.x += mb.vx;
      if (mb.x < mb.minX || mb.x > mb.maxX) mb.vx *= -1;
      if (mb.timer % 95 === 0 && Math.abs(p.x - mb.x) < 280) {
        const dir = p.x >= mb.x ? 1 : -1;
        this.projectiles.push({
          kind: "sound_ring",
          x: mb.x + 20,
          y: mb.y + 24,
          vx: dir * 2.2,
          vy: 0,
          ttl: 120,
        });
        this.audio.playSfx("blip", 180);
      }
    } else {
      // Ransom-Kraken fluttuante con tentacoli
      mb.x += mb.vx * 0.9;
      if (mb.x < mb.minX || mb.x > mb.maxX) mb.vx *= -1;
      mb.y = mb.baseY - 12 + Math.sin(mb.timer * 0.05) * 14;
      if (mb.timer % 88 === 0 && Math.abs(p.x - mb.x) < 280) {
        const dx = p.x - mb.x;
        const dy = p.y - mb.y;
        const d = Math.hypot(dx, dy) || 1;
        this.projectiles.push({
          kind: "enemy_orb",
          x: mb.x + 20,
          y: mb.y + 28,
          vx: (dx / d) * 2.1,
          vy: (dy / d) * 2.1,
          ttl: 140,
        });
        this.audio.playSfx("blip", 170);
      }
    }

    if (p.x + p.w > mb.x + 4 && p.x < mb.x + mb.w - 4 && p.y + p.h > mb.y + 4 && p.y < mb.y + mb.h - 4) {
      if (p.vy > 0 && p.y + p.h - p.vy <= mb.y + 16 && mb.invuln <= 0) {
        p.vy = -5.8;
        this.hitMidBoss(2, "STOMP CRITICO!");
      } else if (mb.invuln <= 0) {
        this.damagePlayer(1, true);
      }
    }
  }

  hitMidBoss(dmg, label = "COLPITO!") {
    const mb = this.midBoss;
    if (!mb || mb.defeated || mb.invuln > 0) return;
    mb.hp = Math.max(0, mb.hp - dmg);
    mb.invuln = 28;
    this.hitstopFrames = 2;
    this.triggerShake(7, 2.5);
    this.audio.playSfx("midboss_hit");
    this.addParticles(mb.x + 20, mb.y + 24, "#fb7185", 12);
    this.addFloatingText(mb.x - 6, mb.y - 10, `${label} (-${dmg})`, "#fde047");

    if (mb.hp <= 0) {
      mb.defeated = true;
      this.state.data.score += 800;
      this.audio.playSfx("pegaso");
      this.addParticles(mb.x + 20, mb.y + 24, "#ffd147", 24);
      this.items.push({ kind: "heart", x: mb.x + 12, y: mb.baseY + 24, w: 14, h: 14, taken: false });
      if (mb.targetGateId) this.openGate(mb.targetGateId, false);
      const bName = mb.bossKind === "kraken" ? "Ransom-Kraken" : "Bufala-Bot 3000";
      this.state.pushConsequence(`★ ${bName} neutralizzato! Varco aperto!`, "#4ade80");
    }
  }

  updateBoss() {
    const b = this.boss;
    const p = this.player;
    if (b.invuln > 0) b.invuln--;
    if (b.stunTimer > 0) {
      b.stunTimer--;
      b.y = b.baseY + 24;
      return;
    }

    b.timer++;
    const ratio = b.hp / b.maxHp;
    b.phase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;

    if (b.phase !== this._lastBossPhase) {
      this._lastBossPhase = b.phase;
      if (typeof this.audio.setBossMusicPhase === "function") this.audio.setBossMusicPhase(b.phase);
      this.audio.playSfx("telegraph");
      this.addFloatingText(
        b.x + 19,
        b.y - 12,
        `FASE ${b.phase}: ${b.phase === 1 ? "ANALISI" : b.phase === 2 ? "MANIPOLAZIONE" : "VERIFICA FINALE"}`,
        "#f0abfc"
      );
    }

    const speed = b.phase === 1 ? 0.028 : b.phase === 2 ? 0.042 : 0.056;
    b.x = b.baseX + Math.sin(b.timer * speed) * 96;
    b.y = b.baseY + Math.cos(b.timer * speed * 1.5) * 22;

    const fireInterval = b.phase === 1 ? 105 : b.phase === 2 ? 84 : 68;
    if (b.timer % fireInterval === 0) {
      const dx = p.x - b.x;
      const dy = p.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      const spd = b.phase === 3 ? 2.45 : 2.0;
      this.projectiles.push({
        kind: "enemy_orb",
        x: b.x + 19,
        y: b.y + 24,
        vx: (dx / d) * spd,
        vy: (dy / d) * spd,
        ttl: 180,
      });
      if (b.phase >= 2) {
        this.projectiles.push({
          kind: "enemy_orb",
          x: b.x + 19,
          y: b.y + 24,
          vx: (dx / d) * spd * 0.85,
          vy: (dy / d) * spd - 0.8,
          ttl: 165,
        });
      }
      this.audio.playSfx("blip", 190);
    }

    if (p.x + p.w > b.x + 3 && p.x < b.x + b.w - 3 && p.y + p.h > b.y + 3 && p.y < b.y + b.h - 3) {
      if (p.vy > 0 && p.y + p.h - p.vy <= b.y + 16 && b.invuln <= 0) {
        p.vy = -5.9;
        this.hitBoss(2, "COLPO CRITICO!");
      } else if (b.invuln <= 0) {
        this.damagePlayer(1, true);
      }
    }
  }

  hitBoss(dmg, label = "COLPITO!") {
    const b = this.boss;
    if (!b || b.defeated || b.invuln > 0) return;
    b.hp = Math.max(0, b.hp - dmg);
    b.invuln = 34;
    this.hitstopFrames = 3;
    this.triggerShake(9, 3.2);
    this.audio.playSfx("midboss_hit");
    this.addParticles(b.x + 19, b.y + 24, "#e879f9", 16);
    this.addFloatingText(b.x - 8, b.y - 12, `${label} (-${dmg})`, "#f0abfc");

    if (b.hp <= 0) {
      b.defeated = true;
      this.state.data.score += 1500;
      this.audio.playSfx("pegaso");
      this.addParticles(b.x + 19, b.y + 24, "#ffd147", 32);
      if (this.cb.onBossDefeated) {
        setTimeout(() => this.cb.onBossDefeated(), 900);
      }
    }
  }

  checkTriggersAndInteractions(input) {
    const p = this.player;
    const pcx = p.x + p.w / 2;
    const pcy = p.y + p.h / 2;
    this.interactPrompt = null;

    // Raccolta oggetti
    for (const it of this.items) {
      if (it.taken) continue;
      if (p.x + p.w > it.x && p.x < it.x + it.w && p.y + p.h > it.y && p.y < it.y + it.h) {
        it.taken = true;
        if (it.kind === "token") {
          const bonus = this.state.addBitToken(1);
          this.audio.playSfx("collect");
          if (bonus === "heal") this.addFloatingText(p.x, p.y - 12, "25 BIT: +1 CUORE!", "#4ade80");
          else if (bonus === "shield") this.addFloatingText(p.x, p.y - 12, "25 BIT: +1 SCUDO!", "#38bdf8");
        } else if (it.kind === "heart") {
          this.state.data.hp = Math.min(this.state.data.maxHp, this.state.data.hp + 1);
          this.audio.playSfx("correct");
          this.addFloatingText(p.x, p.y - 12, "+1 ENERGIA!", "#f87171");
        } else if (it.kind === "pegaso") {
          this.state.collectPegaso(it.pegasoId);
          this.audio.playSfx("pegaso");
          this.addParticles(it.x + 7, it.y + 8, "#fde047", 16);
          this.addFloatingText(p.x - 20, p.y - 16, "PAGINA DI PEGASO TROVATA!", "#fde047");
        }
      }
    }

    // Banter non bloccanti di squadra!
    for (const bn of this.banters) {
      if (!bn.triggered && Math.hypot(pcx - bn.x, pcy - bn.y) < 36) {
        bn.triggered = true;
        this.activeBanter = { speaker: bn.speaker, text: bn.text, ttl: 215 };
        this.audio.playSfx("blip", CHARACTERS[bn.speaker]?.blipFreq || 320);
      }
    }

    // Checkpoint
    for (const cp of this.checkpoints) {
      if (!cp.active && Math.hypot(pcx - cp.x, pcy - cp.y) < 24) {
        this.checkpoints.forEach((c) => (c.active = false));
        cp.active = true;
        this.state.data.checkpoint = { roomId: this.bp.id, x: cp.x, y: cp.y - 10 };
        this.state.saveCampaign();
        this.audio.playSfx("confirm");
        this.addFloatingText(cp.x - 18, cp.y - 18, "CHECKPOINT!", "#38bdf8");
      }
    }

    // Porte Sotto-Aule / Redazione Pegaso esplorabili con [E]!
    for (const sd of this.subDoors) {
      if (Math.hypot(pcx - (sd.x + 12), pcy - (sd.y + 16)) < 24) {
        this.interactPrompt = { x: sd.x - 18, y: sd.y - 16, text: `[E] ${sd.label}` };
        if (input.interactPressed) {
          this.audio.playSfx("portal");
          p.x = sd.targetX;
          p.y = sd.targetY;
          p.vx = 0;
          p.vy = 0;
          p.lastSafeX = sd.targetX;
          p.lastSafeY = sd.targetY;
          this.camMinX = sd.subMinC * TILE;
          this.camMaxX = sd.subMaxC * TILE;
          this.camera.x = Math.max(this.camMinX, Math.min(this.camMaxX - SCREEN_W, p.x - 180));
          if (!sd.inSubRoom && !this.state.data.subRoomsVisited.includes(sd.id)) {
            this.state.data.subRoomsVisited.push(sd.id);
            this.state.data.score += 150;
          }
          if (this.cb.onSubRoomChange) this.cb.onSubRoomChange(sd.roomTitle);
          return;
        }
      }
    }

    // Compagni di squadra: [E] li porta in campo (prompt a bassa priorità)
    if (this.nearestCompanion && !this.interactPrompt) {
      this.interactPrompt = {
        x: this.nearestCompanion.x - 16,
        y: this.nearestCompanion.y - 20,
        text: `[E] Cambia con ${this.nearestCompanion.label}`,
      };
    }

    // Dialoghi
    for (const dg of this.dialogues) {
      if (!dg.triggered && Math.hypot(pcx - dg.x, pcy - dg.y) < 28) {
        if (dg.autoTrigger || input.interactPressed) {
          dg.triggered = true;
          if (!this.state.data.triggeredDialogues.includes(dg.dialogueId)) {
            this.state.data.triggeredDialogues.push(dg.dialogueId);
          }
          if (this.cb.onStartDialogue) this.cb.onStartDialogue(dg.dialogueId);
          return;
        } else {
          const npcName = CHARACTERS[dg.npcChar]?.shortName || "Parla";
          this.interactPrompt = { x: dg.x - 12, y: dg.y - 18, text: `[E] Parla con ${npcName}` };
        }
      }
    }

    // Terminali EIPASS
    for (const tm of this.terminals) {
      if (!tm.cleared && Math.hypot(pcx - tm.x, pcy - tm.y) < 26) {
        this.interactPrompt = { x: tm.x - 20, y: tm.y - 22, text: "[E] Postazione EIPASS" };
        if (input.interactPressed && this.cb.onStartQuiz) {
          this.cb.onStartQuiz(tm);
          return;
        }
      }
    }

    // Postazioni Minigioco
    for (const mg of this.minigames) {
      if (!mg.done && Math.hypot(pcx - mg.x, pcy - mg.y) < 28) {
        this.interactPrompt = { x: mg.x - 18, y: mg.y - 22, text: "[E] Avvia Sfida!" };
        if (input.interactPressed && this.cb.onStartMinigame) {
          this.cb.onStartMinigame(mg);
          return;
        }
      }
    }

    // Porte d'uscita al livello successivo
    for (const ex of this.exits) {
      if (Math.hypot(pcx - (ex.x + 12), pcy - (ex.y + 16)) < 24) {
        this.interactPrompt = { x: ex.x - 16, y: ex.y - 16, text: `[E] ${ex.label}` };
        if (input.interactPressed || Math.hypot(pcx - (ex.x + 12), pcy - (ex.y + 16)) < 11) {
          this.audio.playSfx("door");
          if (this.cb.onRoomExit) this.cb.onRoomExit();
          return;
        }
      }
    }
  }
}
