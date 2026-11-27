// Orchestratore Principale v2.0 di "OPERAZIONE EIPASS — IL CASARDI IN 8 BIT"
// Gestisce Ciclo 60Hz deterministico, Menu, Modalità Open Day (7-10 min), Campagna Completa (6 Capitoli),
// Dialoghi Cinematografici 64x64, Postazioni Interattive EIPASS, Minigiochi Passioni, Assist [C], CRT [V] e Audio Chiptune.

import { SCREEN_W, SCREEN_H, CHARACTERS, CHAR_ORDER } from "./config/constants.js";
import { GameStateManager } from "./state/gameState.js";
import { EMBEDDED_SPRITES } from "./assets/embeddedSprites.js";
import { ChiptuneAudioEngine } from "./audio/chiptuneEngine.js";
import { InputController } from "./config/input.js";
import { buildOpenDayLevels, buildCampaignLevels } from "./levels/levelsData.js";
import { WorldRuntime } from "./engine/world.js";
import { PixelRenderer } from "./render/renderer.js";
import { UIManager } from "./ui/hudAndMenus.js";
import { DIALOGUES } from "./narrative/dialogues.js";
import { EIPASS_CHALLENGES } from "./narrative/eipassQuiz.js";
import { SpecialChallengeManager } from "./minigames/specialChallenges.js";

export class CasardiGameApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.state = new GameStateManager();
    this.audio = new ChiptuneAudioEngine(this.state.audioPrefs);
    this.input = new InputController(() => {
      this.audio.unlock();
      if (!this.audio.currentTrackKey) {
        this.audio.playTrack("main");
      }
    });

    this.sprites = { characters: null, portraits: null, tileset: null, enemiesProps: null };
    this.renderer = new PixelRenderer(this.sprites);
    this.ui = new UIManager(this.sprites);
    this.minigames = new SpecialChallengeManager(this.audio, this.state, this.sprites);

    // Scene: 'title' | 'playing' | 'paused' | 'ending'
    this.scene = "title";
    this.showControlsModal = false;
    this.titleIndex = 0;
    this.pauseIndex = 0;

    this.levels = [];
    this.world = null;
    this.activeDialogue = null;
    this.activeQuiz = null;

    this.lastFrameTime = 0;
    this.accumulator = 0;
  }

  async init() {
    window.__CASARDI_GAME__ = this;
    await this.loadSpriteSheets();
    this.bindCanvasClick();
    this.audio.playTrack("main");
    requestAnimationFrame((ts) => this.loop(ts));
  }

  bindCanvasClick() {
    this.canvas.addEventListener("pointerdown", (ev) => {
      this.audio.unlock();
      const rect = this.canvas.getBoundingClientRect();
      const mx = ((ev.clientX - rect.left) / rect.width) * SCREEN_W;
      const my = ((ev.clientY - rect.top) / rect.height) * SCREEN_H;

      if (this.scene === "title") {
        if (this.showControlsModal) {
          this.showControlsModal = false;
          return;
        }
        const opts = this.getTitleOptions();
        const panelH = opts.length > 3 ? 118 : 90;
        const panelY = 245 - panelH;
        const stepH = 28;
        opts.forEach((opt, idx) => {
          const y = panelY + 5 + idx * stepH;
          if (mx >= 190 && mx <= 464 && my >= y && my <= y + stepH - 2) {
            this.titleIndex = idx;
            this.audio.playSfx("confirm");
            if (opt.id === "openday") this.startMode("openday", false);
            else if (opt.id === "campaign_new") this.startMode("campaign", false);
            else if (opt.id === "campaign_continue") this.startMode("campaign", true);
            else if (opt.id === "team_follow") this.toggleTeamFollow();
            else if (opt.id === "controls") this.showControlsModal = true;
          }
        });
      } else if (this.scene === "paused") {
        if (this.showControlsModal) {
          this.showControlsModal = false;
          const back = this._helpReturnScene;
          this._helpReturnScene = null;
          if (back === "playing" && this._helpWasRunning) {
            this.scene = "playing";
            this.paused = false;
          }
          return;
        }
        // Tocco/Click sulle 7 voci del Menu Pausa & Dossier
        const items = this.getPauseItems();
        items.forEach((it, idx) => {
          const py = 34 + idx * 27;
          if (mx >= 20 && mx <= 232 && my >= py && my <= py + 23) {
            this.pauseIndex = idx;
            if (it.id === "music_vol") {
              const delta = mx > 126 ? 0.1 : -0.1;
              this.audio.setMusicVolume(this.audio.musicVol + delta);
              this.state.audioPrefs.musicVol = this.audio.musicVol;
              this.state.saveAudioPrefs();
              this.audio.playSfx("blip", 390);
            } else if (it.id === "sfx_vol") {
              const delta = mx > 126 ? 0.1 : -0.1;
              this.audio.setSfxVolume(this.audio.sfxVol + delta);
              this.state.audioPrefs.sfxVol = this.audio.sfxVol;
              this.state.saveAudioPrefs();
              this.audio.playSfx("confirm");
            } else if (it.id === "team_follow") {
              this.toggleTeamFollow();
            } else {
              this.input.justPressed.add("Enter");
            }
          }
        });
        // Tocco su [P] in alto a destra riprende subito la partita
        if (mx >= 435 && my <= 28) {
          this.scene = "playing";
        }
      } else if (this.scene === "playing") {
        // 1. Tocco diretto su tutti e 6 i Minigiochi Arcade!
        if (this.minigames.isActive()) {
          const m = this.minigames.active;
          if (m.type === "piano") {
            // Zona RIASCOLTA — identica al rettangolo disegnato (330,41,128,20)
            if (my >= 41 && my <= 61 && mx >= 330) {
              this.input.justPressed.add("KeyR");
            } else if (m.demoStep < 0 && my >= 112 && my <= 210) {
              // 1) Tasti NERI per primi: sono sopra i bianchi e devono essere toccabili
              let hitBlack = false;
              for (const k of m.chromaticKeys || []) {
                if (!k.isBlack) continue;
                const kx = 44 + k.whiteSlot * 48;
                if (mx >= kx && mx <= kx + 28) {
                  const code = `Key${k.shortcut}`;
                  this.input.justPressed.add(code);
                  hitBlack = true;
                  break;
                }
              }
              // 2) Tasti bianchi (slot 0..7)
              if (!hitBlack) {
                for (let k = 0; k < 8; k++) {
                  const kx = 44 + k * 48;
                  if (mx >= kx && mx <= kx + 45) {
                    this.input.justPressed.add(`Digit${k + 1}`);
                    break;
                  }
                }
              }
            }
          } else if (m.type === "filesorter") {
            if (mx >= 44 && mx <= 220 && my >= 120 && my <= 206) {
              this.input.justPressed.add("Digit1");
            } else if (mx >= 260 && mx <= 436 && my >= 120 && my <= 206) {
              this.input.justPressed.add("Digit2");
            }
          } else if (m.type === "firewall") {
            if (my >= 52 && my <= 104) this.input.justPressed.add("Digit1");
            else if (my > 104 && my <= 156) this.input.justPressed.add("Digit2");
            else if (my > 156 && my <= 220) this.input.justPressed.add("Digit3");
          } else if (m.type === "athletics") {
            // Atletica di Ruggero: tap a sinistra = partenza/corsa, tap in alto o a destra = salto ostacolo
            if (m.phase === "ready") {
              this.input.justPressed.add("Space");
            } else if (m.phase === "running" && (my < 120 || mx > 300)) {
              this.input.justPressed.add("Space");
            }
          } else if (m.type === "dance") {
            // Danza di Daniele: le quattro zone del riquadro sono i quattro passi, il resto è Giro/Battito
            if (m.phase === "ready") {
              this.input.justPressed.add("Space");
            } else if (m.phase === "dancing" && m.routines[m.routineIdx] && mx >= 34 && mx <= 414 && my >= 84 && my <= 118) {
              // IL TOCCO SULLA CASELLA ESEGUE QUELLA MOSSA (non quella attesa: niente più "sempre corretto")
              const moves = m.routines[m.routineIdx].moves;
              const stepW = Math.min(42, Math.floor(360 / Math.max(1, moves.length)));
              const totalW = stepW * moves.length;
              const startX = 34 + Math.max(0, Math.floor((380 - totalW) / 2));
              const idx = Math.max(0, Math.min(moves.length - 1, Math.floor((mx - startX) / stepW)));
              const move = moves[idx];
              const keyMap = { fwd: "ArrowUp", back: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", turn: "Space", clap: "KeyE" };
              this.input.justPressed.add(keyMap[move] || "ArrowUp");
            } else if (my < 84) {
              this.input.justPressed.add("Space");
            } else if (my >= 150) {
              this.input.justPressed.add("KeyE");
            }
          } else if (m.type === "basket") {
            if (!m.ball) {
              if (mx >= 330 || my >= 218) {
                this.input.justPressed.add("Enter");
              } else if (my >= 44 && my < 218) {
                const dx = Math.max(24, mx - 92);
                const dy = Math.max(16, 196 - my);
                m.angle = Math.max(32, Math.min(76, Math.round((Math.atan2(dy, dx) * 180) / Math.PI)));
                m.power = Math.max(35, Math.min(100, Math.round(Math.hypot(dx, dy) / 3.0)));
                this.audio.playSfx("blip", 360);
              }
            }
          } else if (m.type === "math") {
            // 1) Pulsanti VERI disegnati nel pannello destro: -a / +a / SU / GIU / VERIFICA
            const inRect = (x, y, w, h) => mx >= x && mx <= x + w && my >= y && my <= y + h;
            if (inRect(362, 154, 84, 26) || my >= 220) {
              this.input.justPressed.add("Enter");
            } else if (inRect(362, 66, 38, 22) || inRect(354, 42, 100, 190) && mx < 404 && my >= 60 && my < 96) {
              this.input.justPressed.add("ArrowLeft");
            } else if (inRect(408, 66, 38, 22)) {
              this.input.justPressed.add("ArrowRight");
            } else if (inRect(362, 116, 38, 22)) {
              this.input.justPressed.add("ArrowUp");
            } else if (inRect(408, 116, 38, 22)) {
              this.input.justPressed.add("ArrowDown");
            } else if (mx >= 36 && mx <= 346 && my >= 42 && my <= 220) {
              // 2) Trascinamento sulla griglia: SX/DX apre, SU/GIU alza/abbassa
              if (Math.abs(mx - 191) > Math.abs(my - 131)) {
                this.input.justPressed.add(mx > 191 ? "ArrowRight" : "ArrowLeft");
              } else {
                this.input.justPressed.add(my > 131 ? "ArrowDown" : "ArrowUp");
              }
            }
          }
          return;
        }

        // 1a. Click sulle pillole eroe dell'HUD (x=94+idx*45, y 3..23): porta in campo quell'eroe
        if (my >= 0 && my <= 26 && mx >= 94) {
          const slots = this.heroSlotOrder();
          const idx = Math.floor((mx - 94) / 45);
          if (idx >= 0 && idx < slots.length && mx <= 94 + idx * 45 + 42) {
            const target = slots[idx];
            if (!this.switchActiveChar(target)) {
              const meta = CHARACTERS[target] || { shortName: `EROE ${idx + 1}` };
              this.world?.addFloatingText(
                this.world.player.x - 20,
                this.world.player.y - 22,
                `${meta.shortName} NON ANCORA IN SQUADRA`,
                "#94a3b8"
              );
              this.audio.playSfx("wrong");
            }
            return;
          }
        }

        // 1b. Tocco/click su un compagno visibile: lo porta in campo
        if (this.world && this.world.companionActors) {
          const hit = this.world.companionActors.find(
            (a) => mx >= a.x - 4 && mx <= a.x + 36 && my >= a.y - 14 && my <= a.y + 40
          );
          if (hit) {
            this.switchActiveChar(hit.charId);
            return;
          }
        }

        // 2. Tocco sui Dialoghi Cinematografici e scelte multiple
        if (this.activeDialogue && this.activeDialogue.currentNode) {
          const node = this.activeDialogue.currentNode;
          if (this.activeDialogue.charCount < node.text.length) {
            this.activeDialogue.charCount = node.text.length;
          } else if (node.choices) {
            // Geometria IDENTICA al disegno: le scelte sono ancorate in basso
            const choiceStep = 18;
            const choiceTop = SCREEN_H - 12 - node.choices.length * choiceStep + 2;
            node.choices.forEach((_, idx) => {
              const cy = choiceTop + idx * choiceStep;
              if (mx >= 12 && mx <= SCREEN_W - 12 && my >= cy && my <= cy + 16) {
                this.commitDialogueChoice(node, idx);
              }
            });
          } else {
            this.input.justPressed.add("Enter");
          }
          return;
        }

        // 3. Tocco sulle opzioni delle Postazioni Interattive EIPASS
        if (this.activeQuiz) {
          if (!this.activeQuiz.answered) {
            let hitOption = false;
            const rects = this.ui.getQuizOptionRects(this.activeQuiz);
            rects.forEach((r, idx) => {
              if (mx >= 18 && mx <= SCREEN_W - 18 && my >= r.y && my <= r.y + r.h) {
                if (this.activeQuiz.selectedIndex === idx) {
                  this.submitQuizAnswer();
                } else {
                  this.activeQuiz.selectedIndex = idx;
                  this.audio.playSfx("blip", 380);
                }
              }
            });
            hitOption = rects.some((r) => my >= r.y && my <= r.y + r.h && mx >= 18 && mx <= SCREEN_W - 18);
            if (!hitOption && my >= 234) {
              this.submitQuizAnswer();
            }
          } else {
            this.activeQuiz = null;
            this.audio.setDucking(false);
          }
          return;
        }

        // 4. Tocco rapido sulla barra HUD superiore (cambio Eroe 1-5, Assist [C], Pausa [P])!
        if (my <= 28) {
          for (let idx = 0; idx < 5; idx++) {
            const sx = 94 + idx * 45;
            if (mx >= sx && mx <= sx + 42) {
              this.input.justPressed.add(`Digit${idx + 1}`);
              return;
            }
          }
          if (mx >= 316 && mx <= 370) {
            this.input.justPressed.add("KeyC");
            return;
          }
          if (mx >= 442) {
            this.input.justPressed.add("KeyP");
            return;
          }
        }

        // 5. Tocco sul fumetto interattivo [E] in mappa (porte, terminali, NPC, postazioni)!
        if (this.world && this.world.interactPrompt) {
          const ip = this.world.interactPrompt;
          const sx = ip.x - this.world.camera.x;
          const sy = ip.y - this.world.camera.y;
          if (mx >= sx - 24 && mx <= sx + 120 && my >= sy - 32 && my <= sy + 44) {
            this.input.justPressed.add("KeyE");
          }
        }
      } else if (this.scene === "ending") {
        this.instantOpenDayVisitorReset();
      }
    });
  }

  /**
   * Stato contestuale in tempo reale per il Gamepad Touch Mobile su Telefono
   */
  getTouchContextState() {
    const d = this.state.data;
    const hasInteract =
      this.scene === "playing" &&
      !this.minigames.isActive() &&
      !this.activeDialogue &&
      !this.activeQuiz &&
      !!(this.world && this.world.interactPrompt);
    const inModal =
      this.scene !== "playing" ||
      !!this.activeDialogue ||
      !!this.activeQuiz ||
      this.minigames.isActive();
    const assistReady =
      this.scene === "playing" &&
      !inModal &&
      this.world &&
      this.world.player.assistCooldown <= 0 &&
      d.unlockedChars.length > 1;
    return {
      scene: this.scene,
      activeChar: d.activeChar,
      unlockedChars: d.unlockedChars,
      hasInteract,
      interactText: hasInteract ? this.world.interactPrompt.text : "",
      inDialogueOrQuiz: !!(this.activeDialogue || this.activeQuiz),
      minigameType: this.minigames.isActive() ? this.minigames.active.type : null,
      assistReady: !!assistReady,
      muted: this.audio.muted,
    };
  }

  loadSpriteSheets() {
    const loadOne = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });

    return Promise.all([
      loadOne(EMBEDDED_SPRITES.characters),
      loadOne(EMBEDDED_SPRITES.portraits),
      loadOne(EMBEDDED_SPRITES.tileset),
      loadOne(EMBEDDED_SPRITES.enemiesProps),
    ]).then(([c, p, t, e]) => {
      this.sprites.characters = c;
      this.sprites.portraits = p;
      this.sprites.tileset = t;
      this.sprites.enemiesProps = e;
    });
  }

  getTitleOptions() {
    const opts = [
      {
        id: "openday",
        label: "★ MODALITA OPEN DAY (7-10 MIN)",
        sub: "Demo con tutti e 5 i protagonisti!",
      },
      {
        id: "campaign_new",
        label: "AVVIA CAMPAGNA COMPLETA",
        sub: "6 Capitoli • 18 Mappe • 7 Moduli",
      },
    ];
    if (this.state.hasSavedCampaign()) {
      opts.push({
        id: "campaign_continue",
        label: "CONTINUA CAMPAGNA SALVATA",
        sub: "Riprendi dal checkpoint salvato",
      });
    }
    opts.push({
      id: "team_follow",
      label: `SQUADRA AL SEGUITO: ${this.state.audioPrefs.followTeam ? "SI" : "NO"}`,
      sub: "I compagni ti restano accanto [G]",
    });
    opts.push({
      id: "controls",
      label: "COMANDI & MIXER AUDIO",
      sub: "Tastiera, Gamepad, Volumi e CRT [V]",
    });
    return opts;
  }

  startMode(mode, resumeSaved = false) {
    if (mode === "campaign" && resumeSaved && this.state.loadCampaign()) {
      this.levels = buildCampaignLevels();
    } else {
      this.state.reset(mode);
      this.levels = mode === "openday" ? buildOpenDayLevels() : buildCampaignLevels();
    }
    this.activeDialogue = null;
    this.activeQuiz = null;
    this.minigames.active = null;
    this.scene = "playing";
    this.loadRoom(this.state.data.roomIndex || 0);
  }

  instantOpenDayVisitorReset() {
    this.audio.setDucking(false);
    this.activeDialogue = null;
    this.activeQuiz = null;
    this.minigames.active = null;
    this.showControlsModal = false;
    this.scene = "title";
    this.titleIndex = 0;
    this.audio.playTrack("main");
  }

  loadRoom(index) {
    const safeIdx = Math.max(0, Math.min(this.levels.length - 1, index));
    this.state.data.roomIndex = safeIdx;
    const bp = this.levels[safeIdx];
    this.state.data.chapterIndex = bp.chapter;
    if (!this.state.data.checkpoint || this.state.data.checkpoint.roomId !== bp.id) {
      this.state.data.checkpoint = { roomId: bp.id, x: bp.spawn.x, y: bp.spawn.y };
    }
    this.state.saveCampaign();

    this.world = new WorldRuntime(bp, this.state, this.audio, {
      onStartDialogue: (dlgId) => this.startDialogue(dlgId),
      onStartQuiz: (terminalObj) => this.startQuiz(terminalObj),
      onStartMinigame: (mgEntity) => this.startMinigameEntity(mgEntity),
      onRoomExit: () => this.advanceRoom(),
      onBossDefeated: () => this.triggerVictoryEnding(),
      onSubRoomChange: (subTitle) => this.ui.showRoomBanner(subTitle, "Esplora l'ambiente e premi [E] sulla porta per uscire"),
    });

    this.audio.playTrack(bp.music);
    this.ui.showRoomBanner(bp.name, bp.subtitle);
  }

  advanceRoom() {
    const next = this.state.data.roomIndex + 1;
    if (next >= this.levels.length) {
      this.triggerVictoryEnding();
    } else {
      this.state.data.checkpoint = null;
      this.loadRoom(next);
    }
  }

  triggerVictoryEnding() {
    this.scene = "ending";
    this.audio.setDucking(false);
    this.audio.playTrack("victory");
    if (this.state.data.mode === "campaign") {
      this.state.clearSavedCampaign();
    }
  }

  // ===========================================================================
  // DIALOGHI A SCELTA E POSTAZIONI INTERATTIVE EIPASS
  // ===========================================================================
  startDialogue(dlgId) {
    const script = DIALOGUES[dlgId];
    if (!script) return;
    if (script.unlockChar) {
      this.state.unlockCharacter(script.unlockChar);
      this.state.data.activeChar = script.unlockChar;
    }
    this.audio.setDucking(true);
    this.activeDialogue = {
      script,
      nodeIdx: 0,
      currentNode: script.nodes[0],
      charCount: 0,
      choiceIndex: 0,
      blipTick: 0,
    };
  }

  updateDialogue() {
    const d = this.activeDialogue;
    if (!d || !d.currentNode) return;
    const node = d.currentNode;

    if (d.charCount < node.text.length) {
      d.charCount = Math.min(node.text.length, d.charCount + 1.9);
      d.blipTick++;
      if (d.blipTick % 4 === 0) {
        const freq = CHARACTERS[node.speaker]?.blipFreq || 260;
        this.audio.playSfx("blip", freq);
      }
      if (this.input.confirmPressed || this.input.jumpPressed) {
        d.charCount = node.text.length;
      }
      return;
    }

    if (node.choices) {
      if (this.input.upPressed) {
        d.choiceIndex = (d.choiceIndex + node.choices.length - 1) % node.choices.length;
        this.audio.playSfx("blip", 350);
      }
      if (this.input.downPressed) {
        d.choiceIndex = (d.choiceIndex + 1) % node.choices.length;
        this.audio.playSfx("blip", 350);
      }
      if (this.input.numberPressed >= 1 && this.input.numberPressed <= node.choices.length) {
        d.choiceIndex = this.input.numberPressed - 1;
        this.commitDialogueChoice(node, d.choiceIndex);
        return;
      }
      if (this.input.confirmPressed) {
        this.commitDialogueChoice(node, d.choiceIndex);
      }
    } else if (this.input.confirmPressed) {
      if (node.end || d.nodeIdx + 1 >= d.script.nodes.length) {
        this.activeDialogue = null;
        this.audio.setDucking(false);
      } else {
        d.nodeIdx++;
        d.currentNode = d.script.nodes[d.nodeIdx];
        d.charCount = 0;
        d.choiceIndex = 0;
      }
    }
  }

  commitDialogueChoice(node, idx) {
    const ch = node.choices[idx];
    this.audio.playSfx("confirm");
    this.state.recordChoice(node.choiceId || "choice", ch.label, ch.summary, ch.effects || {});
    if (ch.worldAction && this.world) {
      this.world.executeWorldAction(ch.worldAction);
    }
    if (ch.next !== undefined && this.activeDialogue.script.nodes[ch.next]) {
      this.activeDialogue.nodeIdx = ch.next;
      this.activeDialogue.currentNode = this.activeDialogue.script.nodes[ch.next];
      this.activeDialogue.charCount = 0;
      this.activeDialogue.choiceIndex = 0;
    } else {
      this.activeDialogue = null;
      this.audio.setDucking(false);
    }
  }

  startQuiz(terminalEntity) {
    const ch = EIPASS_CHALLENGES[terminalEntity.quizId];
    if (!ch) return;
    this.audio.setDucking(true);
    this.audio.playSfx("interact");
    this.activeQuiz = {
      terminal: terminalEntity,
      challenge: ch,
      selectedIndex: 0,
      answered: false,
      wasCorrect: false,
    };
  }

  updateQuiz() {
    const q = this.activeQuiz;
    if (!q) return;

    if (!q.answered) {
      if (this.input.upPressed || this.input.leftPressed) {
        q.selectedIndex = (q.selectedIndex + q.challenge.options.length - 1) % q.challenge.options.length;
        this.audio.playSfx("blip", 340);
      }
      if (this.input.downPressed || this.input.rightPressed) {
        q.selectedIndex = (q.selectedIndex + 1) % q.challenge.options.length;
        this.audio.playSfx("blip", 340);
      }
      if (this.input.numberPressed >= 1 && this.input.numberPressed <= q.challenge.options.length) {
        q.selectedIndex = this.input.numberPressed - 1;
        this.submitQuizAnswer();
        return;
      }
      if (this.input.confirmPressed) {
        this.submitQuizAnswer();
      }
    }
    // Il pannello si chiude da solo dopo il feedback (INVIO lo chiude prima)
    this.updateQuizFeedback(1);
  }

  submitQuizAnswer() {
    const q = this.activeQuiz;
    if (!q || q.answered) return;
    const chosen = q.challenge.options[q.selectedIndex];
    q.answered = true;
    q.wasCorrect = !!chosen.correct;
    q.terminal.cleared = true;

    this.state.recordQuizOutcome(q.challenge.id, q.challenge.moduleIndex, q.wasCorrect);

    // IL VARCO SI APRE SOLO CON LA RISPOSTA CORRETTA.
    // Con un errore la postazione resta da rifare: si può ritentare subito dopo il feedback.
    if (q.wasCorrect) {
      if (q.terminal.targetGateId && this.world) {
        this.world.openGate(q.terminal.targetGateId, true);
      }
      this.audio.playSfx("correct");
      this.state.data.shield = Math.min(3, this.state.data.shield + 1);
      if (this.world) {
        this.world.addFloatingText(this.world.player.x, this.world.player.y - 16, "EIPASS OK! +SCUDO", "#4ade80");
      }
    } else {
      this.audio.playSfx("wrong");
      // La postazione torna disponibile: nessun voto "superato" con una risposta sbagliata.
      if (this.world) {
        for (const t of this.world.terminals) {
          if (t.quizId === q.challenge.id) t.cleared = false;
        }
        this.world.executeWorldAction("spawn_guard_drone");
      }
    }
    q.closeTimer = q.wasCorrect ? 150 : 190;
  }

  /** Il pannello del quiz si chiude DA SOLO dopo il feedback (o subito con INVIO). */
  updateQuizFeedback(frames) {
    const q = this.activeQuiz;
    if (!q || !q.answered) return;
    q.closeTimer -= frames;
    if (q.closeTimer <= 0 || this.input.confirmPressed) {
      this.activeQuiz = null;
      this.audio.setDucking(false);
      this.input.justPressed.clear();
    }
  }

  startMinigameEntity(mgEntity) {
    this.minigames.start(mgEntity.mgType, mgEntity.mgConfig, () => {
      mgEntity.done = true;
      if (mgEntity.targetGateId && this.world) {
        this.world.openGate(mgEntity.targetGateId, false);
      }
    });
  }

  // ===========================================================================
  // LOOP PRINCIPALE A PASSO FISSO 60 FPS
  // ===========================================================================
  loop(timestamp) {
    if (!this.lastFrameTime) this.lastFrameTime = timestamp;
    const delta = Math.min(64, timestamp - this.lastFrameTime);
    this.lastFrameTime = timestamp;
    this.accumulator += delta;

    const STEP = 1000 / 60;
    while (this.accumulator >= STEP) {
      this.stepSimulation();
      this.accumulator -= STEP;
    }

    this.renderFrame();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  stepSimulation() {
    this.input.poll();

    // Tutto il tempo di gioco avanza QUI (60 Hz fissi), mai nel render.
    this.renderer.stepAnimation();
    this.ui.stepHUD(this.state);

    if (this.input.mutePressed) {
      this.state.audioPrefs.muted = this.audio.toggleMute();
      this.state.saveAudioPrefs();
    }
    if (this.input.crtTogglePressed) {
      this.state.audioPrefs.crt = !this.state.audioPrefs.crt;
      this.state.saveAudioPrefs();
      this.audio.playSfx("blip", 480);
    }
    if (this.input.quickResetPressed) {
      this.instantOpenDayVisitorReset();
      return;
    }
    // [Y] schermo intero (PC): funziona in qualunque scena
    if (this.input.fullscreenPressed) {
      try {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
      } catch (e) {
        /* i browser senza fullscreen ignorano: nessun crash */
      }
    }
    // F2 = pausa audio rapida? no: [M] già presente.

    // [G] cambia al volo "Squadra al seguito" (stessa opzione del menu iniziale e della pausa)
    if (this.input.teamTogglePressed) {
      const on = this.toggleTeamFollow();
      this.world?.addFloatingText(
        this.world.player.x - 24,
        this.world.player.y - 26,
        on ? "SQUADRA AL SEGUITO: SI" : "SQUADRA AL SEGUITO: NO",
        on ? "#4ade80" : "#94a3b8"
      );
    }

    // F1 (o "?") apre la guida comandi da qualsiasi schermata, anche in partita
    if (this.input.helpPressed && this.scene !== "title") {
      if (!this.showControlsModal) {
        this.showControlsModal = true;
        this._helpReturnScene = this.scene;
        this._helpWasRunning = !this.paused;
        this.scene = "paused";
        this.audio.playSfx("confirm");
      }
      return;
    }

    if (this.scene === "title") {
      this.updateTitleScene();
    } else if (this.scene === "playing") {
      this.updatePlayingScene();
    } else if (this.scene === "paused") {
      this.updatePauseScene();
    } else if (this.scene === "ending") {
      if (this.input.confirmPressed || this.input.pausePressed) {
        this.instantOpenDayVisitorReset();
      }
    }
  }

  updateTitleScene() {
    if (this.showControlsModal) {
      if (this.input.leftPressed) {
        this.audio.setMusicVolume(this.audio.musicVol - 0.1);
        this.state.audioPrefs.musicVol = this.audio.musicVol;
        this.state.saveAudioPrefs();
      }
      if (this.input.rightPressed) {
        this.audio.setMusicVolume(this.audio.musicVol + 0.1);
        this.state.audioPrefs.musicVol = this.audio.musicVol;
        this.state.saveAudioPrefs();
      }
      if (this.input.downPressed) {
        this.audio.setSfxVolume(this.audio.sfxVol - 0.1);
        this.state.audioPrefs.sfxVol = this.audio.sfxVol;
        this.state.saveAudioPrefs();
        this.audio.playSfx("confirm");
      }
      if (this.input.upPressed) {
        this.audio.setSfxVolume(this.audio.sfxVol + 0.1);
        this.state.audioPrefs.sfxVol = this.audio.sfxVol;
        this.state.saveAudioPrefs();
        this.audio.playSfx("confirm");
      }
      if (this.input.confirmPressed || this.input.pausePressed) {
        this.showControlsModal = false;
        this.audio.playSfx("confirm");
      }
      return;
    }

    const opts = this.getTitleOptions();
    if (this.titleIndex >= opts.length) this.titleIndex = 0;

    if (this.input.upPressed) {
      this.titleIndex = (this.titleIndex + opts.length - 1) % opts.length;
      this.audio.playSfx("blip", 360);
    }
    if (this.input.downPressed) {
      this.titleIndex = (this.titleIndex + 1) % opts.length;
      this.audio.playSfx("blip", 360);
    }
    if (this.input.confirmPressed) {
      const pick = opts[this.titleIndex];
      this.audio.playSfx("confirm");
      if (pick.id === "openday") this.startMode("openday", false);
      else if (pick.id === "campaign_new") this.startMode("campaign", false);
      else if (pick.id === "campaign_continue") this.startMode("campaign", true);
      else if (pick.id === "team_follow") this.toggleTeamFollow();
      else if (pick.id === "controls") this.showControlsModal = true;
    }
  }

  updatePlayingScene() {
    this.state.data.playTimeSec += 1 / 60;

    // [E] sui compagni nel mondo: cambia eroe direttamente (tocco/click su di loro)
    this.checkCompanionSwitch();

    if (this.input.pausePressed && !this.minigames.isActive()) {
      this.scene = "paused";
      this.pauseIndex = 0;
      this.audio.playSfx("interact");
      return;
    }

    if (this.minigames.isActive()) {
      this.minigames.update(this.input);
      return;
    }

    if (this.activeDialogue) {
      this.updateDialogue();
      return;
    }

    if (this.activeQuiz) {
      this.updateQuiz();
      return;
    }

    // Derivato dall'ordine ufficiale: il tasto coincide sempre con la pillola mostrata
    const slotOrder = this.heroSlotOrder();
    if (this.input.numberPressed >= 1 && this.input.numberPressed <= 5) {
      // fallback su CHAR_ORDER: con 2 soli slot il tasto 4 deve comunque dare un messaggio, mai un crash
      const target = slotOrder[this.input.numberPressed - 1] || CHAR_ORDER[this.input.numberPressed - 1];
      if (!this.switchActiveChar(target)) {
        // Feedback chiaro se l'eroe non è ancora sbloccato (prima non succedeva nulla e sembrava rotto)
        const meta = CHARACTERS[target] || { shortName: `EROE ${this.input.numberPressed}` };
        this.world?.addFloatingText(this.world.player.x - 20, this.world.player.y - 22, `${meta.shortName} NON ANCORA IN SQUADRA`, "#94a3b8");
        this.audio.playSfx("wrong");
      }
    } else if (this.input.switchCyclePressed) {
      const unlocked = this.heroSlotOrder().filter((c) => this.state.data.unlockedChars.includes(c));
      const curIdx = unlocked.indexOf(this.state.data.activeChar);
      const nextChar = unlocked[(curIdx + 1) % unlocked.length];
      this.switchActiveChar(nextChar);
    }

    if (this.world) {
      const syn = this.teamSynergy();
      this.world._synergyJumpBonus = syn.jumpBonus;
      this.world._synergySpeedBonus = syn.speedBonus;
      this.world.update(this.input);
    }
  }

  /** Se il giocatore è accanto a un compagno, [E] lo fa diventare l'eroe attivo. */
  checkCompanionSwitch() {
    const w = this.world;
    if (!w || !w.companionActors) return;
    const p = w.player;
    let nearest = null;
    let bestDist = 46;
    for (const actor of w.companionActors) {
      const d = Math.hypot(actor.x - p.x, actor.y - p.y);
      if (d < bestDist) {
        bestDist = d;
        nearest = actor;
      }
    }
    this.world.nearestCompanion = nearest;
    if (!nearest) return;
    if (!this.input.interactPressed) return;
    if (!this.state.data.unlockedChars.includes(nearest.charId)) return;
    if (this.state.data.activeChar === nearest.charId) return;
    this.switchActiveChar(nearest.charId);
  }

  /** Opzione "Squadra al seguito": i compagni restano accanto a distanza invece di vagare. */
  toggleTeamFollow() {
    this.state.audioPrefs.followTeam = !this.state.audioPrefs.followTeam;
    this.state.saveAudioPrefs();
    this.audio.playSfx(this.state.audioPrefs.followTeam ? "confirm" : "blip", 420);
    return this.state.audioPrefs.followTeam;
  }

  /**
   * SINERGIA DI SQUADRA: ogni nuovo membro sbloccato lascia un bonus passivo
   * permanente (così "cambiare personaggio" non è solo cosmetico anche quando
   * si è costretti a restare sui due eroi iniziali).
   */
  teamSynergy() {
    const unlocked = this.state.data.unlockedChars || [];
    return {
      unlockedCount: unlocked.length,
      maxHpBonus: Math.max(0, unlocked.length - 1) * 10,
      jumpBonus: unlocked.includes("daniele") ? 0.15 : 0,
      dmgBonus: unlocked.includes("ruggero") ? 0.08 : 0,
      speedBonus: unlocked.includes("francesco") ? 0.05 : 0,
    };
  }

  /**
   * Ordine FISSO degli slot eroe: 1=Carlo, 2=Ranaldo, poi gli altri due in ordine
   * di squadra. I tasti 1-5 restano così coerenti con le pillole dell'HUD.
   */
  heroSlotOrder() {
    const base = ["carlo", "ranaldo"];
    const extra = (this.state.data.unlockedChars || []).filter((c) => !base.includes(c) && CHARACTERS[c]);
    return base.concat(extra);
  }

  /** Cambio eroe con effetto visivo: usato da tasti 1-5, [Q], pillole HUD e [E] vicino ai compagni. */
  switchActiveChar(charId) {
    if (!charId || this.state.data.activeChar === charId) return false;
    if (!this.state.data.unlockedChars.includes(charId)) return false;
    this.state.data.activeChar = charId;
    this.audio.playCharMotif(charId);
    if (this.world) {
      this.world.player.scaleX = 0.85;
      this.world.player.scaleY = 1.18;
      this.world.addParticles(this.world.player.x + 8, this.world.player.y + 14, CHARACTERS[charId].color, 9);
      this.world.addFloatingText(this.world.player.x - 6, this.world.player.y - 22, `${CHARACTERS[charId].shortName} IN CAMPO!`, CHARACTERS[charId].color);
    }
    return true;
  }

  getPauseItems() {
    const mPct = Math.round(this.audio.musicVol * 100);
    const sPct = Math.round(this.audio.sfxVol * 100);
    return [
      { id: "resume", label: "Riprendi Partita" },
      { id: "music_vol", label: `Volume Musica: ${mPct}% (SX/DX)` },
      { id: "sfx_vol", label: `Volume Effetti: ${sPct}% (SX/DX)` },
      { id: "team_follow", label: `Squadra al Seguito: ${this.state.audioPrefs.followTeam ? "SI" : "NO"}` },
      { id: "controls", label: "Guida Comandi Completa" },
      { id: "restart_room", label: "Ricomincia Zona Corrente" },
      { id: "openday_reset", label: "Reset Nuovo Visitatore Open Day" },
      { id: "quit_title", label: "Torna al Menu Principale" },
    ];
  }

  updatePauseScene() {
    if (this.showControlsModal) {
      // Nella guida: SX/DX e SU/GIU regolano i volumi (prima non succedeva nulla)
      if (this.input.leftPressed) {
        this.audio.setMusicVolume(this.audio.musicVol - 0.1);
        this.state.audioPrefs.musicVol = this.audio.musicVol;
        this.state.saveAudioPrefs();
        this.audio.playSfx("blip", 380);
      }
      if (this.input.rightPressed) {
        this.audio.setMusicVolume(this.audio.musicVol + 0.1);
        this.state.audioPrefs.musicVol = this.audio.musicVol;
        this.state.saveAudioPrefs();
        this.audio.playSfx("blip", 400);
      }
      if (this.input.downPressed) {
        this.audio.setSfxVolume(this.audio.sfxVol - 0.1);
        this.state.audioPrefs.sfxVol = this.audio.sfxVol;
        this.state.saveAudioPrefs();
        this.audio.playSfx("blip", 320);
      }
      if (this.input.upPressed) {
        this.audio.setSfxVolume(this.audio.sfxVol + 0.1);
        this.state.audioPrefs.sfxVol = this.audio.sfxVol;
        this.state.saveAudioPrefs();
        this.audio.playSfx("blip", 340);
      }
      if (this.input.confirmPressed || this.input.pausePressed || this.input.helpPressed) {
        this.showControlsModal = false;
        this.audio.playSfx("confirm");
        // Se la guida era stata aperta con F1 durante il gioco, si torna subito a giocare
        const back = this._helpReturnScene;
        this._helpReturnScene = null;
        if (back === "playing" && this._helpWasRunning) {
          this.scene = "playing";
          this.paused = false;
          this.input.keys.clear();
          this.input.justPressed.clear();
        }
      }
      return;
    }

    if (this.input.pausePressed) {
      this.scene = "playing";
      return;
    }

    const items = this.getPauseItems();
    if (this.input.upPressed) {
      this.pauseIndex = (this.pauseIndex + items.length - 1) % items.length;
      this.audio.playSfx("blip", 350);
    }
    if (this.input.downPressed) {
      this.pauseIndex = (this.pauseIndex + 1) % items.length;
      this.audio.playSfx("blip", 350);
    }

    const cur = items[this.pauseIndex];
    if (cur.id === "music_vol" && (this.input.leftPressed || this.input.rightPressed)) {
      const delta = this.input.rightPressed ? 0.1 : -0.1;
      this.audio.setMusicVolume(this.audio.musicVol + delta);
      this.state.audioPrefs.musicVol = this.audio.musicVol;
      this.state.saveAudioPrefs();
    } else if (cur.id === "sfx_vol" && (this.input.leftPressed || this.input.rightPressed)) {
      const delta = this.input.rightPressed ? 0.1 : -0.1;
      this.audio.setSfxVolume(this.audio.sfxVol + delta);
      this.state.audioPrefs.sfxVol = this.audio.sfxVol;
      this.state.saveAudioPrefs();
      this.audio.playSfx("confirm");
    }

    if (this.input.confirmPressed) {
      this.audio.playSfx("confirm");
      if (cur.id === "resume") this.scene = "playing";
      else if (cur.id === "team_follow") this.toggleTeamFollow();
      else if (cur.id === "controls") this.showControlsModal = true;
      else if (cur.id === "restart_room") {
        this.scene = "playing";
        this.loadRoom(this.state.data.roomIndex);
      } else if (cur.id === "openday_reset") {
        this.startMode("openday", false);
      } else if (cur.id === "quit_title") {
        this.instantOpenDayVisitorReset();
      }
    }
  }

  renderFrame() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    // I comandi touch sono sopra il canvas solo in orizzontale con deck visibile
    if (typeof document !== "undefined") {
      const deck = document.getElementById("touch-deck");
      const visible = deck && getComputedStyle(deck).display !== "none";
      this.ui.touchSafe = !!visible && document.body.classList.contains("touch-enabled") && window.innerWidth > window.innerHeight;
    }

    if (this.scene === "title") {
      if (this.showControlsModal) {
        this.ui.renderControlsScreen(ctx, this.audio);
      } else {
        this.ui.renderTitleMenu(
          ctx,
          this.renderer,
          this.titleIndex,
          this.getTitleOptions(),
          this.audio,
          this.state.hasSavedCampaign()
        );
      }
      if (this.state.audioPrefs.crt) this.ui.renderCRTFilter(ctx);
      return;
    }

    if (this.scene === "ending") {
      this.ui.renderEndingScreen(ctx, this.state);
      if (this.state.audioPrefs.crt) this.ui.renderCRTFilter(ctx);
      return;
    }

    if (this.world) {
      this.renderer.renderWorld(ctx, this.world);
    }
    this.ui.renderHUD(ctx, this.state, this.world, this.audio);

    if (this.minigames.isActive()) {
      this.minigames.render(ctx);
    } else if (this.activeDialogue) {
      this.ui.renderDialogue(ctx, this.activeDialogue);
    } else if (this.activeQuiz) {
      this.ui.renderQuiz(ctx, this.activeQuiz);
    }

    if (this.scene === "paused") {
      this.ui.renderPauseAndDossier(
        ctx,
        this.state,
        this.audio,
        this.pauseIndex,
        this.getPauseItems(),
        this.showControlsModal
      );
    }

    if (this.state.audioPrefs.crt) {
      this.ui.renderCRTFilter(ctx);
    }
  }
}

// Solo nel browser: importare il modulo in Node (test QA) non deve esplodere
if (typeof window !== "undefined" && typeof document !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("game-canvas");
    if (canvas) {
      const app = new CasardiGameApp(canvas);
      app.init();
    }
  });
}

