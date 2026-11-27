// Interfaccia Utente Pixel-Art v2.0: Font Bitmap 8-Bit, Ritratti 64x64 a 6 Espressioni,
// Notifiche Stile Telltale, Banter in Tempo Reale, Postazioni Interattive EIPASS e Filtro CRT Arcade!

import {
  SCREEN_W,
  SCREEN_H,
  CHARACTERS,
  CHAR_ORDER,
  CONTROLS_HELP,
  HERO_BASE_ORDER,
  EIPASS_MODULES,
  PEGASO_LORE,
  CHAR_SPRITE_W,
  CHAR_SPRITE_H,
  PORTRAIT_SIZE,
} from "../config/constants.js";
import { GAME_VERSION } from "../config/constants.js";
import { FREE_CHALLENGES } from "../minigames/specialChallenges.js";
import {
  drawPixelText,
  drawPixelTextCentered,
  wrapPixelText,
  fitPixelText,
  measurePixelText,
  drawPixelPanel,
} from "../render/pixelFont.js";

// Ordine righe del portraits_sheet.png (8 righe x 6 espressioni, 64x64):
// generato da tools/generate_assets.py -> ["ranaldo","carlo","francesco","ruggero","daniele","sofista","sofia","mimmo"]
const PORTRAIT_ROWS = {
  ranaldo: 0,
  carlo: 1,
  francesco: 2,
  ruggero: 3,
  daniele: 4,
  sofista: 5,
  sofia: 6,
  mimmo: 7,
};

const SPEAKER_NAMES = {
  ranaldo: "PROF. RANALDO (Matematica)",
  carlo: "CARLO (Basket)",
  francesco: "FRANCESCO (Pianoforte)",
  ruggero: "RUGGERO (Atletica Leggera)",
  daniele: "DANIELE (Ballerino Latino-Americano)",
  sofista: "IL SOFISTA DIGITALE 404-Ω",
  sofia: "SOFIA (Caporedattrice Pegaso)",
  mimmo: "MIMMO (Collaboratore Storico)",
};

// L'HUD segue l'ordine ufficiale (CHAR_ORDER): tasto mostrato == tasto che risponde.
const HUD_SLOT_ORDER = CHAR_ORDER;

export class UIManager {
  constructor(spriteImages) {
    // true quando il controller touch è visibile sopra il canvas (orizzontale): riserva l'angolo
    this.touchSafe = false;
    this.imgs = spriteImages;
    this.bannerText = "";
    this.bannerSub = "";
    this.bannerTimer = 0;
    this.tick = 0;
  }

  showRoomBanner(title, subtitle = "") {
    this.bannerText = title;
    this.bannerSub = subtitle;
    this.bannerTimer = 185;
  }

  // ===========================================================================
  // MENU PRINCIPALE — FACCIATA VIVA + 4 PROTAGONISTI ANIMATI + PULSANTI ARCADE
  // ===========================================================================
  renderTitleMenu(ctx, renderer, menuIndex, options, audio, _hasSave) {
    // tick del titolo: avanzato in stepHUD (animazione costante a 60 Hz su ogni schermo)
    // Centra perfettamente la vista sulle due grandi colonne bianche e sul portale di Via d'Aragona 100!
    renderer.drawEnvironmentBackground(ctx, "facade", Math.sin(this.tick * 0.007) * 14, 0);

    // 1. Marquee Superiore Compatta: lascia 100% visibili colonne, bandiere IT/UE e portale!
    drawPixelPanel(ctx, 14, 5, SCREEN_W - 28, 49, "rgba(9, 14, 28, 0.93)", "#ffd147", "#1e3a8a");
    drawPixelTextCentered(ctx, "OPERAZIONE EIPASS", SCREEN_W / 2, 11, "#ffd147", 2);
    drawPixelTextCentered(
      ctx,
      "★ IL CASARDI IN 8 BIT • Liceo 'A. Casardi' Barletta ★",
      SCREEN_W / 2,
      30,
      "#38bdf8",
      1
    );
    drawPixelTextCentered(
      ctx,
      `Carlo • Ranaldo • Daniele • Ruggero • Francesco   ${GAME_VERSION}`,
      SCREEN_W / 2,
      42,
      "#fde047",
      1
    );

    // 2. Pedana in basso a sinistra con i 5 Protagonisti 32x36 animati
    drawPixelPanel(ctx, 6, 176, 178, 70, "rgba(11, 17, 32, 0.91)", "#ffd147", "#1e293b");
    drawPixelTextCentered(ctx, "SQUADRA DEL CASARDI", 95, 180, "#fde047", 1);
    if (this.imgs.characters) {
      const pose = Math.floor(this.tick / 14) % 4;
      // 5 sprite da 26px dentro un pannello largo 178: 5*26 = 130px, sempre dentro
      const slotW = 26;
      const squadW = CHAR_ORDER.length * slotW;
      const startX = 6 + Math.max(4, Math.round((178 - squadW) / 2));
      CHAR_ORDER.forEach((cid, i) => {
        const meta = CHARACTERS[cid];
        ctx.drawImage(
          this.imgs.characters,
          pose * CHAR_SPRITE_W,
          meta.row * CHAR_SPRITE_H,
          CHAR_SPRITE_W,
          CHAR_SPRITE_H,
          startX + i * slotW,
          190,
          CHAR_SPRITE_W,
          CHAR_SPRITE_H
        );
      });
      // Sigle allineate SOTTO il proprio sprite, nell'ordine reale dei 5 slot
      CHAR_ORDER.forEach((cid, i) => {
        const sig = CHARACTERS[cid].shortName.slice(0, 3).toUpperCase();
        const cx = startX + i * slotW + slotW / 2;
        drawPixelText(ctx, sig, Math.round(cx - measurePixelText(sig, 1) / 2), 230, CHARACTERS[cid].color || "#cbd5e1", 1);
      });
    }

    // 3. Pannello Selezione Modalità compatto in basso a destra (lascia respirare tutta la facciata!)
    // Il pannello si dimensiona sul numero REALE di voci: nessuna voce fuori cornice
    const PANEL_X = 190;
    const PANEL_W = SCREEN_W - PANEL_X - 6;
    const stepH = 27;
    const panelH = Math.min(SCREEN_H - 24, 8 + options.length * stepH + 4);
    const panelY = SCREEN_H - 20 - panelH - 3;
    drawPixelPanel(ctx, PANEL_X - 6, panelY, PANEL_W + 6, panelH, "rgba(11, 17, 32, 0.93)", "#38bdf8", "#1e293b");

    const labelMaxW = PANEL_W - 24;
    const subMaxW = PANEL_W - 32;

    options.forEach((opt, idx) => {
      const y = panelY + 5 + idx * stepH;
      const sel = idx === menuIndex;
      const isOpenDayBtn = opt.id === "openday";

      const bg = sel ? (isOpenDayBtn ? "#c2410c" : "#0369a1") : isOpenDayBtn ? "#431407" : "#162038";
      const brd = sel ? "#ffd147" : isOpenDayBtn ? "#fb923c" : "#475569";
      drawPixelPanel(ctx, PANEL_X, y, PANEL_W - 4, stepH - 2, bg, brd, "#0f172a");

      // Etichetta e sottotitolo si adattano ai pixel disponibili (con "…" se serve)
      const pre = `${sel ? "▶ " : "  "}`;
      const label = `${pre}${opt.label}`;
      const maxChars = Math.max(10, Math.floor((labelMaxW + 1) / 6));
      drawPixelText(
        ctx,
        label.length > maxChars ? `${label.slice(0, maxChars - 1).trimEnd()}…` : label,
        PANEL_X + 6,
        y + 3,
        sel ? "#ffffff" : "#e2e8f0",
        1
      );
      drawPixelText(ctx, fitPixelText(opt.sub, subMaxW, 1, 1)[0], PANEL_X + 14, y + 13, sel ? "#fef08a" : "#94a3b8", 1);
    });

    // Barra inferiore stato audio & tasti rapidi Open Day
    ctx.fillStyle = "rgba(7, 10, 20, 0.96)";
    ctx.fillRect(0, SCREEN_H - 20, SCREEN_W, 20);
    ctx.fillStyle = "#ffd147";
    ctx.fillRect(0, SCREEN_H - 20, SCREEN_W, 1);
    const audioStr = audio.muted ? "[M] AUDIO:OFF" : "♪ [M] AUDIO:ON";
    drawPixelText(
      ctx,
      `FRECCE+INVIO: Avvia | ${audioStr} | [V] CRT | [F9] Reset Open Day`,
      14,
      SCREEN_H - 13,
      "#fde047",
      1
    );
  }

  // ===========================================================================
  // HUD IN PARTITA + NOTIFICHE TELLTALE + BANTER DI SQUADRA
  // ===========================================================================
  /**
   * Avanzamento temporale del HUD: va chiamato SOLO dallo step fisso a 60 Hz.
   * (Prima tick/banner/notifiche avanzavano ad ogni frame: a 120/144 Hz andavano al doppio.)
   */
  stepHUD(state) {
    this.tick++;
    for (let i = state.consequenceQueue.length - 1; i >= 0; i--) {
      state.consequenceQueue[i].ttl--;
      if (state.consequenceQueue[i].ttl <= 0) state.consequenceQueue.splice(i, 1);
    }
    if (this.bannerTimer > 0) this.bannerTimer--;
  }

  renderHUD(ctx, state, world, audio) {
    const d = state.data;

    // Fascia HUD superiore
    ctx.fillStyle = "rgba(9, 13, 26, 0.94)";
    ctx.fillRect(0, 0, SCREEN_W, 27);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(0, 26, SCREEN_W, 1);

    // Energia (Cuori scolpiti) + Scudo
    for (let i = 0; i < d.maxHp; i++) {
      const hx = 7 + i * 13;
      const full = i < d.hp;
      ctx.fillStyle = "#090d1a";
      ctx.fillRect(hx - 1, 6, 12, 11);
      ctx.fillStyle = full ? "#ef4444" : "#334155";
      ctx.fillRect(hx, 7, 4, 4);
      ctx.fillRect(hx + 6, 7, 4, 4);
      ctx.fillRect(hx, 9, 10, 4);
      ctx.fillRect(hx + 2, 13, 6, 2);
      ctx.fillRect(hx + 4, 15, 2, 1);
      if (full) {
        ctx.fillStyle = "#fecaca";
        ctx.fillRect(hx + 1, 8, 2, 2);
      }
    }
    // §4.1: il contatore scudo finiva SOTTO il riquadro dell'eroe attivo (con 5 cuori
    // il testo partiva da x=73 e le pillole da x=94). Ora sta su una micro-riga dedicata
    // sotto i cuori (y=18), dove c'è spazio reale e non si sovrappone a niente.
    if (d.shield > 0) {
      drawPixelText(ctx, `SCUDO x${d.shield}`, 7, 18, "#38bdf8", 1);
    }

    // Selettore rapido dei Protagonisti: 1=Carlo, 2=Ranaldo, poi gli altri acquisiti.
    // Lo stesso ordine usato dai tasti numerici (main.heroSlotOrder), così non si sfalsano.
    const baseOrder = HERO_BASE_ORDER;
    const rosterKey = (d.unlockedChars || []).join(",");
    if (this._rosterCacheKey !== rosterKey) {
      this._rosterCacheKey = rosterKey;
      this._rosterOrder = baseOrder.concat(
        (d.unlockedChars || []).filter((c) => !baseOrder.includes(c) && CHARACTERS[c])
      );
    }
    const slotOrder = this._rosterOrder;
    const SLOT_W = 42;
    const SLOT_PITCH = 45;
    const SLOT_X0 = 94;
    slotOrder.forEach((cid, idx) => {
      const unlocked = d.unlockedChars.includes(cid);
      const active = d.activeChar === cid;
      const meta = CHARACTERS[cid];
      const sx = SLOT_X0 + idx * SLOT_PITCH;

      ctx.fillStyle = active ? meta.accent : unlocked ? "#1e293b" : "#0f172a";
      ctx.fillRect(sx, 3, SLOT_W, 20);
      ctx.strokeStyle = active ? meta.color : unlocked ? "#475569" : "#1e293b";
      ctx.strokeRect(sx, 3, SLOT_W, 20);

      const label = unlocked ? `${idx + 1}:${meta.shortName.slice(0, 3)}` : `${idx + 1}:??`;
      drawPixelText(ctx, label, sx + 2, 6, unlocked ? (active ? "#ffffff" : "#cbd5e1") : "#475569", 1);
      if (world && unlocked && !active) {
        // hint discreto: le pillole degli altri compagni si possono cliccare col mouse
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(sx + 3, 21, SLOT_W - 6, 1);
      }

      if (active && world) {
        const ratio = Math.max(0, 1 - world.player.cooldown / meta.cooldownMax);
        ctx.fillStyle = meta.color;
        ctx.fillRect(sx + 2, 18, Math.round((SLOT_W - 4) * ratio), 3);
      }
    });

    // Indicatore Assist [C]
    if (world) {
      const assistReady = world.player.assistCooldown <= 0 && d.unlockedChars.length > 1;
      drawPixelText(ctx, assistReady ? "[C]OK" : "[C]..", 320, 5, assistReady ? "#4ade80" : "#64748b", 1);
    }

    // Indicatori EIPASS, Pegaso e Punti
    const totalPeg = d.mode === "openday" ? 3 : 12;
    drawPixelText(ctx, `PEG:${d.pegasoCollected.length}/${totalPeg}`, 320, 15, "#fde047", 1);
    drawPixelText(ctx, `EIP:${d.eipassScore}%`, 386, 5, "#38bdf8", 1);
    drawPixelText(ctx, `PT:${d.score}`, 386, 15, "#f8fafc", 1);
    drawPixelText(ctx, "[P]", 456, 10, "#ffd147", 1);

    // 1) Notifiche Narrative Stile Telltale ("★ Carlo si ricorderà di questo!") in alto a sinistra!
    //    (i TTL avanzano in stepHUD, non qui: niente velocità doppia sugli schermi 120/144 Hz)
    if (state.consequenceQueue.length > 0) {
      const topNote = state.consequenceQueue[state.consequenceQueue.length - 1];
      const w = Math.min(SCREEN_W - 20, topNote.text.length * 6 + 18);
      drawPixelPanel(ctx, 8, 31, w, 19, "rgba(11, 17, 32, 0.95)", topNote.color, "#1e293b");
      drawPixelText(ctx, topNote.text.slice(0, 74), 15, 37, topNote.color, 1);
    } else if (this.bannerTimer > 0) {
      // 2) Banner ingresso Zona/Capitolo
      const alpha = Math.min(1, this.bannerTimer / 28);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawPixelPanel(ctx, 64, 32, 400, 34, "rgba(11, 17, 32, 0.93)", "#ffd147", "#1e3a8a");
      // §4.4: pannello allargato a 400 px e testo MISURATO con ellissi di parola,
      // così i nomi dei boss ("Il Sofista Ω", 455 px) non escono più dal bordo.
      drawPixelTextCentered(ctx, fitPixelText(this.bannerText, 396, 1, 1)[0], SCREEN_W / 2, 38, "#ffd147", 1);
      if (this.bannerSub) {
        drawPixelTextCentered(ctx, fitPixelText(this.bannerSub, 396, 1, 1)[0], SCREEN_W / 2, 51, "#cbd5e1", 1);
      }
      ctx.restore();
    }

    // 3) Fumetto Banter non bloccante mentre si corre nei livelli!
    if (world && world.activeBanter && this.bannerTimer <= 0 && state.consequenceQueue.length === 0) {
      const bn = world.activeBanter;
      const pRow = PORTRAIT_ROWS[bn.speaker] ?? 0;
      drawPixelPanel(ctx, 8, 31, 344, 34, "rgba(11, 17, 32, 0.92)", CHARACTERS[bn.speaker]?.color || "#38bdf8", "#1e293b");
      if (this.imgs.portraits) {
        ctx.drawImage(this.imgs.portraits, 1 * PORTRAIT_SIZE, pRow * PORTRAIT_SIZE, PORTRAIT_SIZE, PORTRAIT_SIZE, 13, 35, 26, 26);
      }
      const lines = wrapPixelText(bn.text, 292, 1);
      lines.slice(0, 2).forEach((ln, li) => {
        drawPixelText(ctx, ln, 45, 37 + li * 11, "#f8fafc", 1);
      });
    }
  }

  // ===========================================================================
  // DIALOGO CINEMATOGRAFICO CON RITRATTI 64x64 A 6 ESPRESSIONI
  // ===========================================================================
  renderDialogue(ctx, dlgState) {
    const node = dlgState.currentNode;
    if (!node) return;

    const hasChoices = !!node.choices;
    const boxY = hasChoices ? 96 : 166;
    const boxH = SCREEN_H - boxY - 6;

    const borderCol = node.speaker === "sofista" ? "#d946ef" : CHARACTERS[node.speaker]?.color || "#ffd147";
    drawPixelPanel(ctx, 8, boxY, SCREEN_W - 16, boxH, "rgba(8, 12, 24, 0.96)", borderCol, "#1e293b");

    // Ritratto nativo 64x64 pixel-perfect!
    const pRow = PORTRAIT_ROWS[node.speaker] ?? 0;
    const expr = Math.max(0, Math.min(5, node.expr ?? 0));
    if (this.imgs.portraits) {
      ctx.drawImage(
        this.imgs.portraits,
        expr * PORTRAIT_SIZE,
        pRow * PORTRAIT_SIZE,
        PORTRAIT_SIZE,
        PORTRAIT_SIZE,
        16,
        boxY + 10,
        PORTRAIT_SIZE,
        PORTRAIT_SIZE
      );
    }

    drawPixelText(
      ctx,
      SPEAKER_NAMES[node.speaker] || node.speaker.toUpperCase(),
      88,
      boxY + 10,
      node.speaker === "sofista" ? "#f0abfc" : "#ffd147",
      1
    );

    // --- TESTO DIALOGO: righe misurate sul pannello reale (niente più testo tagliato) ---
    // Con i comandi touch sopra lo schermo si riserva l'angolo in basso a destra
    const touchReserve = this.touchSafe ? 96 : 0;
    const textMaxW = SCREEN_W - 106 - touchReserve;
    const textTop = boxY + 24;
    const lineH = 11;
    const maxTextLines = hasChoices ? 4 : 9;
    const textBottomLimit = boxY + boxH - 14;
    const maxByHeight = Math.max(2, Math.floor((textBottomLimit - textTop) / lineH) + 1);
    const shownText = node.text.slice(0, Math.floor(dlgState.charCount));
    const allLines = wrapPixelText(shownText, textMaxW, 1, true);
    const usedLines = Math.min(allLines.length, maxTextLines, maxByHeight);
    allLines.slice(0, usedLines).forEach((ln, i) => {
      drawPixelText(ctx, ln, 88, textTop + i * lineH, "#f8fafc", 1);
    });
    // Indicatore di scorrimento se il testo supera lo spazio disponibile
    if (allLines.length > usedLines) {
      drawPixelText(ctx, "▼", SCREEN_W - 24, textTop + (usedLines - 1) * lineH, "#fde047", 1);
    }

    // Nomi "sussurrati" al centro del pannello (stile Telltale) per la voce NON in scena
    if (node.speaker !== node.focus && !hasChoices) {
      const whisper = SPEAKER_NAMES[node.focus] || "";
      if (whisper) {
        drawPixelTextCentered(ctx, whisper.toLowerCase(), SCREEN_W / 2, boxY + 34, "#475569", 1);
      }
    }

    if (hasChoices && dlgState.charCount >= node.text.length) {
      const choiceStep = 18;
      const choiceTop = SCREEN_H - 12 - (node.choices.length * choiceStep) + 2;
      node.choices.forEach((ch, idx) => {
        const cy = choiceTop + idx * choiceStep;
        const sel = idx === dlgState.choiceIndex;
        drawPixelPanel(
          ctx,
          12,
          cy,
          SCREEN_W - 24,
          16,
          sel ? "#0369a1" : "#131c31",
          sel ? "#ffd147" : "#475569",
          "#0f172a"
        );
        // Etichetta scelta: si accorcia con "…" in base alla larghezza REALE del pannello
        const prefix = `${sel ? "▶" : " "} [${idx + 1}] `;
        const availPx = SCREEN_W - 24 - 16 - measurePixelText(prefix, 1) - (this.touchSafe ? 96 : 0);
        const maxChars = Math.max(8, Math.floor((availPx + 1) / 6));
        const label = ch.label.length > maxChars ? `${ch.label.slice(0, maxChars - 1).trimEnd()}…` : ch.label;
        drawPixelText(ctx, `${prefix}${label}`, 18, cy + 5, sel ? "#ffffff" : "#cbd5e1", 1);
      });
    } else {
      drawPixelText(
        ctx,
        "[SPAZIO / INVIO / E] Continua ▶",
        this.touchSafe ? 24 : SCREEN_W - 204,
        SCREEN_H - 18,
        "#fde047",
        1
      );
    }
  }

  // ===========================================================================
  // POSTAZIONI INTERATTIVE EIPASS (SIMULATORE LIVE DEI 7 MODULI!)
  // ===========================================================================
  renderQuiz(ctx, qState) {
    const q = qState.challenge;
    drawPixelPanel(ctx, 10, 10, SCREEN_W - 20, SCREEN_H - 20, "rgba(8, 13, 26, 0.97)", "#38bdf8", "#1e3a8a");

    // Barra Titolo Postazione EIPASS
    ctx.fillStyle = "#0369a1";
    ctx.fillRect(15, 15, SCREEN_W - 30, 27);
    // §4.2: badge e titolo su DUE righe misurate (la barra passa da 19 a 28 px):
    // i 10 titoli su 12 che prima finivano con "…" ora si leggono per intero.
    drawPixelText(ctx, fitPixelText(q.badge, SCREEN_W - 44, 1, 1)[0], 22, 18, "#bae6fd", 1);
    drawPixelText(ctx, fitPixelText(q.title, SCREEN_W - 44, 1, 1)[0], 22, 28, "#fef08a", 1);

    if (!qState.answered) {
      // Pannello Simulatore Visivo Dinamico in tempo reale (y = 37..111)!
      this.renderQuizLiveSimulator(ctx, q, qState.selectedIndex);

      const pLines = wrapPixelText(q.prompt, SCREEN_W - 40, 1, true);
      pLines.slice(0, 2).forEach((pln, pi) => {
        drawPixelText(ctx, pln, 20, 118 + pi * 10, "#bae6fd", 1);
      });

      // Le opzioni si dimensionano sul testo reale: nessuna etichetta tagliata a metà
      const rects = this.getQuizOptionRects(qState);
      q.options.forEach((opt, idx) => {
        const sel = idx === qState.selectedIndex;
        const rect = rects[idx];
        drawPixelPanel(
          ctx,
          18,
          rect.y,
          SCREEN_W - 36,
          rect.h,
          sel ? "#0369a1" : "#151f36",
          sel ? "#ffd147" : "#475569",
          "#0f172a"
        );
        rect.lines.forEach((ln, li) => {
          drawPixelText(ctx, ln, 25, rect.y + 5 + li * 9, sel ? "#ffffff" : "#cbd5e1", 1);
        });
      });

      drawPixelText(
        ctx,
        "SU/GIU o [1-3]: Anteprima live | INVIO/SPAZIO: Conferma",
        20,
        243,
        "#94a3b8",
        1
      );
    } else {
      const ok = qState.wasCorrect;
      drawPixelPanel(
        ctx,
        22,
        42,
        SCREEN_W - 44,
        36,
        ok ? "#14532d" : "#7f1d1d",
        ok ? "#4ade80" : "#f87171",
        "#090d1a"
      );
      drawPixelText(
        ctx,
        ok ? "✓ PROCEDURA EIPASS VERIFICATA!" : "✗ ANOMALIA RILEVATA DAL SISTEMA!",
        32,
        49,
        "#ffffff",
        1
      );
      drawPixelText(ctx, fitPixelText(ok ? q.rewardDesc : q.penaltyDesc, SCREEN_W - 64, 1, 1)[0], 32, 62, ok ? "#bbf7d0" : "#fecaca", 1);

      const spk = ok ? q.speakerRight : q.speakerWrong;
      const pRow = PORTRAIT_ROWS[spk] ?? 0;
      if (this.imgs.portraits) {
        ctx.drawImage(
          this.imgs.portraits,
          (ok ? 1 : 2) * PORTRAIT_SIZE,
          pRow * PORTRAIT_SIZE,
          PORTRAIT_SIZE,
          PORTRAIT_SIZE,
          24,
          92,
          PORTRAIT_SIZE,
          PORTRAIT_SIZE
        );
      }
      drawPixelText(ctx, SPEAKER_NAMES[spk] || spk, 98, 96, "#ffd147", 1);

      const fbLines = wrapPixelText(ok ? q.feedbackRight : q.feedbackWrong, SCREEN_W - 122, 1);
      fbLines.slice(0, 5).forEach((ln, i) => {
        drawPixelText(ctx, ln, 98, 112 + i * 12, "#f8fafc", 1);
      });

      drawPixelTextCentered(ctx, "Premi [SPAZIO / INVIO / E] per continuare ▶", SCREEN_W / 2, 232, "#fde047", 1);
    }
  }

  /** Geometria UNICA delle opzioni quiz: la usano sia il disegno sia il tocco. */
  getQuizOptionRects(qState) {
    const q = qState.challenge;
    const optTop = 137;
    const optAvail = 240 - optTop;
    const wrapped = q.options.map((opt, idx) =>
      wrapPixelText(`[${idx + 1}] ${opt.label}`, SCREEN_W - 54, 1, false).slice(0, 3)
    );
    const wanted = wrapped.map((ls) => ls.length * 10 + 10);
    const totalWanted = wanted.reduce((a, b) => a + b, 0);
    const scale = totalWanted > optAvail ? optAvail / totalWanted : 1;
    let oy = optTop;
    return q.options.map((_, idx) => {
      const h = Math.max(20, Math.round(wanted[idx] * scale));
      const rect = { y: oy, h, lines: wrapped[idx] };
      oy += h + 3;
      return rect;
    });
  }

  renderQuizLiveSimulator(ctx, q, selIdx) {
    const opt = q.options[selIdx] || q.options[0];
    const sx = 20;
    const sy = 46;
    const sw = SCREEN_W - 40;
    const sh = 68;

    drawPixelPanel(ctx, sx, sy, sw, sh, "#0b1120", "#475569", "#162038");

    if (q.uiMode === "spreadsheet_live" && q.simData) {
      // Griglia Foglio di Calcolo interattiva con calcolo live in B6!
      ctx.fillStyle = "#14532d";
      ctx.fillRect(sx + 6, sy + 5, 200, 12);
      drawPixelText(ctx, `fx: ${opt.label.slice(0, 26)}`, sx + 10, sy + 8, "#bbf7d0", 1);

      q.simData.rows.forEach((r, ri) => {
        const ry = sy + 20 + ri * 12;
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(sx + 6, ry, 116, 11);
        ctx.fillRect(sx + 124, ry, 82, 11);
        drawPixelText(ctx, r[0], sx + 10, ry + 2, "#cbd5e1", 1);
        drawPixelText(ctx, r[1], sx + 128, ry + 2, "#f8fafc", 1);
      });

      // Cella Risultato Live a destra!
      drawPixelPanel(
        ctx,
        sx + 216,
        sy + 6,
        216,
        62,
        opt.correct ? "#0d3b2e" : "#3b1219",
        opt.correct ? "#4ade80" : "#f87171",
        "#090d1a"
      );
      drawPixelText(ctx, q.simData.resultLabel, sx + 224, sy + 12, "#93c5fd", 1);
      drawPixelText(ctx, opt.calcPreview || "---", sx + 224, sy + 24, opt.correct ? "#4ade80" : "#fda4af", 1);
      const tagWrapped = wrapPixelText(opt.previewTag || "", 200, 1);
      tagWrapped.slice(0, 2).forEach((tl, ti) => {
        drawPixelText(ctx, tl, sx + 224, sy + 38 + ti * 10, "#fde047", 1);
      });
    } else if (q.uiMode === "layout_studio" && q.simData) {
      // Anteprima Split-Screen Documento / Slide Aula Magna!
      const clean = opt.layoutState === "clean";
      const pageBg =
        q.simData.docKind === "slide"
          ? clean
            ? "#1e3a8a"
            : "#ffffff"
          : "#fefce8";
      ctx.fillStyle = pageBg;
      ctx.fillRect(sx + 8, sy + 7, 172, 64);
      ctx.strokeStyle = "#94a3b8";
      ctx.strokeRect(sx + 8, sy + 7, 172, 64);

      if (q.simData.docKind === "slide") {
        if (clean) {
          ctx.fillStyle = "#ffd147";
          ctx.fillRect(sx + 14, sy + 13, 160, 12);
          drawPixelText(ctx, "OPEN DAY CASARDI", sx + 20, sy + 16, "#090d1a", 1, null);
          drawPixelText(ctx, "• Classico & Biomedico", sx + 16, sy + 32, "#ffffff", 1);
          drawPixelText(ctx, "• Musicale & EIPASS", sx + 16, sy + 45, "#bae6fd", 1);
        } else {
          // Testo illeggibile giallo su bianco o caos!
          drawPixelText(ctx, "TESTO GIALLO ILLEGGIBILE!!", sx + 14, sy + 18, "#fef08a", 1, null);
          for (let ly = 30; ly < 64; ly += 5) {
            ctx.fillStyle = "#fde047";
            ctx.fillRect(sx + 14, ly, 152, 2);
          }
        }
      } else {
        // Catalogo 8.000 Volumi o Giornale Pegaso
        drawPixelText(
          ctx,
          q.simData.docTitle.slice(0, 24),
          sx + 14,
          sy + 12,
          clean ? "#7c2d12" : "#94a3b8",
          1,
          null
        );
        for (let r = 0; r < 3; r++) {
          const indent = clean ? 14 : 14 + (r % 2) * 26;
          ctx.fillStyle = clean ? "#1e293b" : "#ef4444";
          ctx.fillRect(sx + indent, sy + 28 + r * 12, clean ? 110 : 78, 4);
          if (clean) {
            ctx.fillStyle = "#0284c7";
            ctx.fillRect(sx + 150, sy + 28 + r * 12, 18, 4);
          }
        }
      }

      drawPixelText(ctx, "STATO ANTEPRIMA LIVE:", sx + 192, sy + 16, "#93c5fd", 1);
      const tagLines = wrapPixelText(opt.previewTag || "", 236, 1);
      tagLines.forEach((ln, i) => {
        drawPixelText(ctx, ln, sx + 192, sy + 32 + i * 13, clean ? "#4ade80" : "#fca5a5", 1);
      });
    } else if (q.uiMode === "phishing_inspector" && q.simData) {
      drawPixelText(ctx, `DA: ${q.simData.from}`, sx + 10, sy + 10, "#fca5a5", 1);
      drawPixelText(ctx, `ALLEGATO: ${q.simData.attachment}`, sx + 10, sy + 24, "#fde047", 1);
      ctx.fillStyle = opt.correct ? "#14532d" : "#7f1d1d";
      ctx.fillRect(sx + 10, sy + 42, sw - 20, 26);
      drawPixelText(ctx, opt.previewTag || "", sx + 16, sy + 51, "#ffffff", 1);
    } else if (q.uiMode === "mail_composer" && q.simData) {
      drawPixelText(ctx, `DESTINATARI: ${q.simData.recipients}`, sx + 10, sy + 10, "#e2e8f0", 1);
      drawPixelText(ctx, `OGGETTO: ${q.simData.subject}`, sx + 10, sy + 24, "#93c5fd", 1);
      ctx.fillStyle = opt.correct ? "#14532d" : "#7f1d1d";
      ctx.fillRect(sx + 10, sy + 42, sw - 20, 26);
      drawPixelText(ctx, opt.previewTag || "", sx + 16, sy + 51, "#ffffff", 1);
    } else {
      // Browser HTTPS o Centralina Hardware
      const topLine = q.simData?.url || (q.simData?.nodes || []).join("  |  ");
      drawPixelText(ctx, fitPixelText(topLine, sw - 24, 1, 1)[0], sx + 10, sy + 12, "#38bdf8", 1);
      if (q.simData?.alert || q.simData?.cardTitle) {
        drawPixelText(ctx, q.simData.alert || q.simData.cardTitle, sx + 10, sy + 27, "#fde047", 1);
      }
      ctx.fillStyle = opt.correct ? "#14532d" : "#45121b";
      ctx.fillRect(sx + 10, sy + 43, sw - 20, 25);
      drawPixelText(ctx, opt.previewTag || "", sx + 16, sy + 52, opt.correct ? "#4ade80" : "#fca5a5", 1);
    }
  }

  // ===========================================================================
  // MENU PAUSA, DOSSIER VARIABILI NARRATIVE, PEGASO E MIXER AUDIO
  // ===========================================================================
  renderPauseAndDossier(ctx, state, audio, pauseIndex, pauseItems, showControlsModal, freeChallengeMenu = null) {
    ctx.fillStyle = "rgba(6, 10, 22, 0.95)";
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    if (showControlsModal) {
      this.renderControlsScreen(ctx, audio);
      return;
    }

    if (freeChallengeMenu && freeChallengeMenu.open) {
      this.renderFreeChallengeMenu(ctx, freeChallengeMenu.index);
      return;
    }

    drawPixelPanel(ctx, 10, 10, SCREEN_W - 20, SCREEN_H - 20, "#0d1528", "#ffd147", "#1e293b");
    drawPixelText(ctx, "PAUSA & DOSSIER SQUADRA LICEO CASARDI", 22, 19, "#ffd147", 1);

    pauseItems.forEach((it, idx) => {
      const y = 34 + idx * 27;
      const sel = idx === pauseIndex;
      drawPixelPanel(
        ctx,
        20,
        y,
        212,
        23,
        sel ? "#0369a1" : "#162038",
        sel ? "#ffd147" : "#475569",
        "#0f172a"
      );
      drawPixelText(ctx, `${sel ? "▶ " : "  "}${it.label.slice(0, 31)}`, 26, y + 8, "#f8fafc", 1);
    });

    const d = state.data;
    drawPixelPanel(ctx, 240, 34, 220, 206, "#131d36", "#38bdf8", "#0f172a");
    drawPixelText(ctx, "FIDUCIA SQUADRA (Bonus >=70%):", 248, 42, "#38bdf8", 1);

    // 5 eroi: righe da 15px per entrare tutti e 5 prima del blocco EIPASS
    CHAR_ORDER.forEach((cid, i) => {
      const meta = CHARACTERS[cid];
      const val = d.trust[cid] ?? 50;
      const y = 54 + i * 15;
      drawPixelText(ctx, meta.shortName.slice(0, 3), 248, y + 1, "#cbd5e1", 1);
      ctx.fillStyle = "#090d1a";
      ctx.fillRect(302, y, 112, 9);
      ctx.fillStyle = val >= 70 ? "#4ade80" : meta.color;
      ctx.fillRect(302, y, Math.round(val * 1.12), 9);
      drawPixelText(ctx, `${val}%`, 418, y + 1, "#f8fafc", 1);
    });

    drawPixelText(ctx, `COMPETENZA EIPASS: ${d.eipassScore}%`, 248, 133, "#fde047", 1);
    EIPASS_MODULES.forEach((mod, i) => {
      const mx = 248 + i * 29;
      const ok = d.modulesCleared[i];
      ctx.fillStyle = ok ? "#16a34a" : "#334155";
      ctx.fillRect(mx, 144, 26, 14);
      drawPixelText(ctx, mod.icon, mx + 4, 148, ok ? "#ffffff" : "#94a3b8", 1);
    });

    drawPixelText(ctx, `PAGINE DI PEGASO: ${d.pegasoCollected.length}`, 248, 164, "#f8fafc", 1);
    if (d.pegasoCollected.length > 0) {
      const lastId = d.pegasoCollected[d.pegasoCollected.length - 1];
      const lore = PEGASO_LORE.find((l) => l.id === lastId);
      if (lore) {
        drawPixelText(ctx, fitPixelText(lore.title, 208, 1, 1)[0], 248, 175, "#fde047", 1);
        // Il testo della pagina si adatta alla larghezza reale: 4 righe piene, nessun "…" a metà frase
        const lns = fitPixelText(lore.text, 212, 5, 1);
        lns.forEach((ln, li) => drawPixelText(ctx, ln, 248, 186 + li * 9, "#cbd5e1", 1));
      }
    } else {
      drawPixelText(ctx, "Esplora balconate e aule interne", 248, 186, "#94a3b8", 1);
      drawPixelText(ctx, "per scoprire i numeri di PEGASO!", 248, 198, "#94a3b8", 1);
    }

    drawPixelTextCentered(
      ctx,
      "SU/GIU: Voce | SX/DX: Volume | INVIO: Conferma | [V] CRT | ESC: Gioca",
      SCREEN_W / 2,
      248,
      "#94a3b8",
      1
    );
  }

  /** Elenco delle sfide libere (greco, latino, storia, calcio, operazioni a tempo). */
  renderFreeChallengeMenu(ctx, index) {
    drawPixelPanel(ctx, 10, 10, SCREEN_W - 20, SCREEN_H - 20, "#0d1528", "#38e2d8", "#1e293b");
    drawPixelText(ctx, "SFIDE LIBERE — CULTURA E SPORT", 22, 19, "#38e2d8", 1);
    drawPixelText(ctx, "Non servono eroi: sono sfide extra del Liceo Classico.", 22, 31, "#94a3b8", 1);

    FREE_CHALLENGES.forEach((ch, i) => {
      const y = 46 + i * 34;
      const sel = i === index;
      drawPixelPanel(ctx, 20, y, SCREEN_W - 40, 31, sel ? "#0369a1" : "#162038", sel ? "#ffd147" : "#475569", "#0f172a");
      drawPixelText(ctx, fitPixelText(`${sel ? "▶ " : "  "}${ch.title}`, SCREEN_W - 70, 1, 1)[0], 28, y + 5, sel ? "#ffffff" : "#e2e8f0", 1);
      drawPixelText(ctx, fitPixelText(ch.sub, SCREEN_W - 70, 1, 1)[0], 28, y + 16, sel ? "#fef08a" : "#94a3b8", 1);
    });

    const cur = FREE_CHALLENGES[index];
    if (cur) drawPixelTextCentered(ctx, fitPixelText(cur.desc, SCREEN_W - 60, 1, 1)[0], SCREEN_W / 2, 226, "#9adfd6", 1);
    drawPixelTextCentered(ctx, "SU/GIU: scegli | INVIO: gioca | P/ESC: torna", SCREEN_W / 2, 244, "#ffd147", 1);
  }

  renderControlsScreen(ctx, audio) {
    drawPixelPanel(ctx, 12, 10, SCREEN_W - 24, SCREEN_H - 20, "#0b1326", "#38bdf8", "#1e293b");
    drawPixelTextCentered(ctx, "COMANDI DI GIOCO & MIXER AUDIO CHIPTUNE", SCREEN_W / 2, 20, "#ffd147", 1);

    // 12 voci, 15px per riga: ogni descrizione sta su UNA riga del pannello reale
    CONTROLS_HELP.forEach((c, i) => {
      const y = 30 + i * 15;
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(24, y, 136, 13);
      ctx.strokeStyle = "#475569";
      ctx.strokeRect(24, y, 136, 13);
      const keysTxt = fitPixelText(c.keys, 130, 1, 1)[0];
      drawPixelText(ctx, keysTxt, 29, y + 4, "#38bdf8", 1);
      const desc = fitPixelText(c.action, SCREEN_W - 24 - 168 - 8, 1, 1)[0];
      drawPixelText(ctx, desc, 168, y + 4, "#f8fafc", 1);
    });

    const mPct = Math.round(audio.musicVol * 100);
    const sPct = Math.round(audio.sfxVol * 100);
    drawPixelTextCentered(
      ctx,
      `Musica ${mPct}% (SX/DX) | Effetti ${sPct}% (SU/GIU) | [M] Muto: ${audio.muted ? "SI" : "NO"}`,
      SCREEN_W / 2,
      213,
      "#fde047",
      1
    );
    drawPixelTextCentered(
      ctx,
      "Premi [ESC / INVIO / SPAZIO] per tornare",
      SCREEN_W / 2,
      228,
      "#4ade80",
      1
    );
  }

  // ===========================================================================
  // SCHERMATA DI VITTORIA / EPILOGO DINAMICO (POSA 11 VITTORIA DEI 5 EROI!)
  // ===========================================================================
  renderEndingScreen(ctx, state) {
    // tick avanzato in stepHUD
    const d = state.data;
    const ending = state.computeEnding();

    ctx.fillStyle = "#080e1e";
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    drawPixelPanel(ctx, 8, 8, SCREEN_W - 16, SCREEN_H - 16, "#0d162c", "#ffd147", "#1e3a8a");

    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(14, 14, SCREEN_W - 28, 34);
    const head =
      d.mode === "openday"
        ? "★ MISSIONE OPEN DAY COMPLETATA! - LICEO CASARDI ★"
        : `★ FINALE SBLOCCATO [${ending.rank}] ★`;
    drawPixelTextCentered(ctx, head, SCREEN_W / 2, 20, "#ffd147", 1);
    drawPixelTextCentered(ctx, ending.title, SCREEN_W / 2, 34, "#e0f2fe", 1);

    // I 5 Protagonisti in posa di Vittoria (pose = 11 nel foglio 32x36!)
    if (this.imgs.characters) {
      const bounce = Math.round(Math.abs(Math.sin(this.tick * 0.1)) * 3);
      // 5 sprite da 30px nella colonna sinistra (x 14..176): mai sotto il riquadro statistiche (x>=182)
      const squadW = CHAR_ORDER.length * 30;
      const startX = 14 + Math.max(0, Math.round((162 - squadW) / 2));
      CHAR_ORDER.forEach((cid, i) => {
        const meta = CHARACTERS[cid];
        ctx.drawImage(
          this.imgs.characters,
          11 * CHAR_SPRITE_W,
          meta.row * CHAR_SPRITE_H,
          CHAR_SPRITE_W,
          CHAR_SPRITE_H,
          startX + i * 30,
          54 - (i % 2 === 0 ? bounce : 0),
          CHAR_SPRITE_W,
          CHAR_SPRITE_H
        );
      });
    }

    const mins = Math.floor(d.playTimeSec / 60);
    const secs = String(Math.floor(d.playTimeSec % 60)).padStart(2, "0");
    drawPixelPanel(ctx, 182, 54, 282, 46, "#131f3a", "#38bdf8", "#0f172a");
    drawPixelText(ctx, `Punteggio: ${d.score}  |  Tempo: ${mins}m ${secs}s`, 190, 61, "#f8fafc", 1);
    drawPixelText(
      ctx,
      `EIPASS: ${d.eipassScore}% (${d.eipassCorrect}/${d.eipassAnswered} OK)`,
      190,
      73,
      "#4ade80",
      1
    );
    drawPixelText(
      ctx,
      `Fiducia Squadra: ${state.getAverageTrust()}% | Pegaso: ${d.pegasoCollected.length}`,
      190,
      85,
      "#fde047",
      1
    );

    const sLines = fitPixelText(ending.summary, SCREEN_W - 44, 6, 1);
    sLines.forEach((ln, i) => drawPixelText(ctx, ln, 22, 110 + i * 12, "#f8fafc", 1));

    if (d.mode === "openday") {
      drawPixelPanel(ctx, 20, 188, SCREEN_W - 40, 34, "#14532d", "#4ade80", "#052e16");
      drawPixelTextCentered(
        ctx,
        "PROVA ORA LA CAMPAGNA COMPLETA (6 CAPITOLI • 18 LIVELLI)!",
        SCREEN_W / 2,
        195,
        "#fef08a",
        1
      );
      drawPixelTextCentered(
        ctx,
        "Biblioteca 8.000 Volumi, Redazione Pegaso, 2 Mid-Boss e 4 Finali!",
        SCREEN_W / 2,
        208,
        "#dcfce7",
        1
      );
    } else if (d.decisionsLog.length > 0) {
      drawPixelText(
        ctx,
        `Scelte: ${d.decisionsLog.map((x) => x.label.slice(0, 30)).slice(0, 2).join(" • ")}`,
        22,
        204,
        "#fde047",
        1
      );
    }

    drawPixelTextCentered(
      ctx,
      "[INVIO / SPAZIO] Menu Principale  |  [F9] Reset Nuovo Visitatore",
      SCREEN_W / 2,
      242,
      "#ffd147",
      1
    );
  }

  /**
   * Filtro opzionale Scanline CRT Arcade attivabile/disattivabile col tasto [V]
   */
  renderCRTFilter(ctx) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
    for (let y = 0; y < SCREEN_H; y += 2) {
      ctx.fillRect(0, y, SCREEN_W, 1);
    }
  }
}
