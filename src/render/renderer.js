// Motore di Rendering Pixel-Art v3.0 del Liceo Classico Statale "A. Casardi" di Barletta
// Fondali 16-bit ad alto contrasto e gerarchia visiva pulita, porte proporzionate ai personaggi 32x36,
// Aula Magna teatrale completa (sipario in velluto, pianoforte a coda scolpito al pixel, busti marmorei, bandiere),
// pozzi con profondità architettonica e font bitmap pixelFont.js nitido al 100%.

import { SCREEN_W, SCREEN_H, TILE, CHARACTERS, CHAR_SPRITE_W, CHAR_SPRITE_H } from "../config/constants.js";
import { drawPixelText, measurePixelText, drawPixelPanel } from "./pixelFont.js";

export class PixelRenderer {
  constructor(spriteImages) {
    this.imgs = spriteImages; // { characters, portraits, tileset, enemiesProps }
    this.tick = 0;
  }

  /** Avanzamento dell'animazione ambiente: chiamato dallo step fisso, non dal render. */
  stepAnimation() {
    this.tick++;
  }

  renderWorld(ctx, world) {
    let camX = Math.round(world.camera.x);
    let camY = Math.round(world.camera.y);

    if (world.shakeTimer > 0) {
      camX += Math.round((Math.random() - 0.5) * 2 * world.shakeMag);
      camY += Math.round((Math.random() - 0.5) * 2 * world.shakeMag);
    }

    // 1. Fondale architettonico parallasse con profondità e contrasto calibrati
    this.drawEnvironmentBackground(ctx, world.bp.theme, camX, camY, world.camMinX > 0);

    ctx.save();
    ctx.translate(-camX, -camY);

    const cStart = Math.max(0, Math.floor(camX / TILE) - 1);
    const cEnd = Math.min(world.cols - 1, Math.ceil((camX + SCREEN_W) / TILE) + 1);
    const rStart = Math.max(0, Math.floor(camY / TILE) - 1);
    const rEnd = Math.min(world.rows - 1, Math.ceil((camY + SCREEN_H) / TILE) + 1);

    // 2A. Fondale scuro per le fosse / varchi nel pavimento così i burroni hanno vera profondità fisica!
    for (let r = Math.max(rStart, world.rows - 2); r <= rEnd; r++) {
      for (let c = cStart; c <= cEnd; c++) {
        if (world.grid[r][c] !== 1) {
          const px = c * TILE;
          const py = r * TILE;
          ctx.fillStyle = "#0b1020";
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = "#162038";
          ctx.fillRect(px + 2, py + 4, TILE - 4, 2);
        }
      }
    }

    // 2B. Arredi architettonici di parete (LIM, Librerie/Trofei, Pianoforte a Coda, Busti su piedistallo)
    //     disegnati DIETRO alle piattaforme e ai personaggi per evitare sovrapposizioni disordinate!
    this.drawWallProps(ctx, world, camX);

    // 3. Mappa a tile 16x16 usando tileset_casardi.png + ombre portate pulite
    for (let r = rStart; r <= rEnd; r++) {
      for (let c = cStart; c <= cEnd; c++) {
        const t = world.grid[r][c];
        if (t !== 0) {
          this.drawTile(ctx, world, t, c, r, c * TILE, r * TILE);
        }
      }
    }

    // 4. Piattaforme mobili & Pedane paraboliche auree del Prof. Ranaldo
    for (const mp of world.movingPlatforms) {
      const mx = Math.round(mp.x);
      const my = Math.round(mp.y);
      ctx.fillStyle = "rgba(9, 13, 26, 0.35)";
      ctx.fillRect(mx + 2, my + mp.h + 1, mp.w, 2);
      ctx.fillStyle = "#090d1a";
      ctx.fillRect(mx - 1, my - 1, mp.w + 2, mp.h + 2);
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(mx, my, mp.w, mp.h);
      ctx.fillStyle = "#bae6fd";
      ctx.fillRect(mx + 2, my + 1, mp.w - 4, 2);
      ctx.fillStyle = "#fde047";
      ctx.fillRect(mx + 4, my + 4, 4, 2);
      ctx.fillRect(mx + mp.w - 8, my + 4, 4, 2);
    }

    for (const tp of world.tempPlatforms) {
      if (tp.ttl < 45 && tp.ttl % 6 < 3) continue;
      const tx = Math.round(tp.x);
      const ty = Math.round(tp.y);
      ctx.fillStyle = "#090d1a";
      ctx.fillRect(tx - 1, ty - 1, tp.w + 2, tp.h + 2);
      ctx.fillStyle = "#eab308";
      ctx.fillRect(tx, ty, tp.w, tp.h);
      ctx.fillStyle = "#fef9c3";
      ctx.fillRect(tx + 2, ty + 1, tp.w - 4, 2);
    }

    // 5. Oggetti interattivi (Porte Sotto-Aule, Terminali CRT, Postazioni Passioni, Canestri-Relè e Uscite)
    this.drawInteractiveProps(ctx, world);

    // 6. Collezionabili (Bit-Token luminosi, Cuori Energia, Pergamene Alate di Pegaso)
    this.drawCollectibles(ctx, world);

    // 8. NPC animati 32x36 (Ruggero, Francesco, Sofia, Mimmo)
    this.drawDialogueNPCs(ctx, world);

    // 9. Nemici animati a 2 frame, Mid-Boss e Il Sofista Digitale 404-Ω
    this.drawEnemiesAndBoss(ctx, world);

    // 10. Compagni di squadra nel mondo (chi non è in campo segue il protagonista)
    this.drawCompanions(ctx, world);

    // 10b. Compagno in Tag-Team Assist [C] + Protagonista attivo con Squash & Stretch!
    this.drawAssistAndPlayer(ctx, world);

    // 11. Proiettili Passioni (Basket, Calcio, Onde e Note Musicali, Compasso Aureo, Onde Megafono)
    this.drawProjectiles(ctx, world);

    // 12. Onda d'inseguimento pixel-art 8-bit a denti digitali (Cap 5.3)
    if (world.chaseActive) {
      const wx = Math.round(world.chaseX);
      const wallH = world.rows * TILE;
      ctx.fillStyle = "rgba(30, 7, 58, 0.96)";
      ctx.fillRect(wx - 240, 27, 210, wallH - 27);
      ctx.fillStyle = "rgba(88, 28, 135, 0.92)";
      ctx.fillRect(wx - 30, 27, 22, wallH - 27);
      ctx.fillStyle = "#c026d3";
      ctx.fillRect(wx - 8, 27, 10, wallH - 27);
      for (let yy = 30; yy < wallH - 18; yy += 12) {
        const jut = ((yy * 7 + this.tick * 3) % 18) + 4;
        ctx.fillStyle = (yy / 12) % 2 === 0 ? "#e879f9" : "#22d3ee";
        ctx.fillRect(wx + 2, yy, jut, 8);
      }
      for (let yy = 36; yy < wallH - 22; yy += 28) {
        const col = (yy + this.tick) % 56 < 28 ? "#f0abfc" : "#22d3ee";
        drawPixelText(ctx, "404-Ω", wx - 48 + Math.round(Math.sin(this.tick * 0.2 + yy) * 4), yy, col, 1);
      }
    }

    // 13. Particelle pixel, testi danno/bonus e fumetto [E]
    for (const pt of world.particles) {
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.round(pt.x), Math.round(pt.y), 3, 3);
    }
    for (const ft of world.floatingTexts) {
      drawPixelText(ctx, ft.text, Math.round(ft.x), Math.round(ft.y), ft.color, 1);
    }
    if (world.interactPrompt) {
      const ip = world.interactPrompt;
      const bob = Math.round(Math.sin(this.tick * 0.14) * 2);
      const w = measurePixelText(ip.text, 1) + 12;
      drawPixelPanel(ctx, ip.x - 4, ip.y - 14 + bob, w, 17, "#0f172a", "#ffd147", "#1e293b");
      drawPixelText(ctx, ip.text, ip.x + 2, ip.y - 9 + bob, "#ffd147", 1);
    }

    ctx.restore();

    // Suggerimento didattico contestuale centrato in basso (ZERO collisioni con personaggi o targhe!)
    this.drawHintSigns(ctx, world, camX);

    // Poltroncine di platea in silhouette scura in primissimo piano solo in Aula Magna!
    if (world.bp.theme === "aulamagna") {
      for (let sx = 6; sx < SCREEN_W; sx += 30) {
        ctx.fillStyle = "#090d1a";
        ctx.fillRect(sx, SCREEN_H - 10, 24, 10);
        ctx.fillStyle = "#450a0a";
        ctx.fillRect(sx + 2, SCREEN_H - 8, 20, 8);
      }
    }

    // Barra salute Boss Finale o Mid-Boss di Capitolo in alto al centro!
    const activeBoss =
      world.boss && !world.boss.defeated
        ? {
            title: `IL SOFISTA DIGITALE 404-Ω (FASE ${world.boss.phase})`,
            hp: world.boss.hp,
            maxHp: world.boss.maxHp,
            border: "#e879f9",
            bar: "#d946ef",
          }
        : world.midBoss && !world.midBoss.defeated && Math.abs(world.player.x - world.midBoss.x) < 340
        ? {
            title:
              world.midBoss.bossKind === "kraken"
                ? "MID-BOSS: RANSOM-KRAKEN"
                : "MID-BOSS: BUFALA-BOT 3000",
            hp: world.midBoss.hp,
            maxHp: world.midBoss.maxHp,
            border: "#fb7185",
            bar: "#f43f5e",
          }
        : null;

    if (activeBoss) {
      drawPixelPanel(ctx, 118, 30, 244, 24, "rgba(11, 15, 29, 0.94)", activeBoss.border, "#2e1065");
      drawPixelText(ctx, activeBoss.title, 126, 35, "#f5d0fe", 1);
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(126, 45, 228, 5);
      ctx.fillStyle = activeBoss.bar;
      ctx.fillRect(126, 45, Math.round((activeBoss.hp / activeBoss.maxHp) * 228), 5);
    }
  }

  // ===========================================================================
  // FONDALI PIXEL-ART 16-BIT AUTENTICI E PULITI DEL LICEO CASARDI
  // ===========================================================================
  drawEnvironmentBackground(ctx, theme, camX, _camY, inSubRoom = false) {
    const pxSlow = Math.round(camX * 0.22);
    const pxMid = Math.round(camX * 0.42);

    if (theme === "facade") {
      // Cielo mediterraneo di Barletta a fasce pixel-art nitide
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(0, 0, SCREEN_W, 58);
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(0, 58, SCREEN_W, 56);
      ctx.fillStyle = "#60a5fa";
      ctx.fillRect(0, 114, SCREEN_W, 64);
      ctx.fillStyle = "#93c5fd";
      ctx.fillRect(0, 178, SCREEN_W, SCREEN_H - 178);

      // Nuvole scolpite con ombra inferiore azzurra
      for (let i = 0; i < 5; i++) {
        const cx = (((i * 145 - Math.round(camX * 0.08)) % 620) + 620) % 620 - 70;
        const cy = 34 + (i % 2) * 14;
        ctx.fillStyle = "#dbeafe";
        ctx.fillRect(cx, cy + 6, 48, 5);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cx + 2, cy + 2, 44, 6);
        ctx.fillRect(cx + 12, cy - 4, 24, 6);
      }

      // FACCIATA RAZIONALISTA DEL CASARDI (1937 - Ing. Arturo Boccassini)
      for (let rep = -1; rep <= 3; rep++) {
        const bx = rep * 440 - (pxSlow % 440);
        const baseY = 58;

        // Ali laterali ocra calda con bugnato leggero e cornicione rosso bordeaux Casardi
        ctx.fillStyle = "#d8b88c";
        ctx.fillRect(bx, baseY + 26, 440, 186);
        ctx.fillStyle = "#c9a677";
        for (let lineY = baseY + 46; lineY < baseY + 200; lineY += 20) {
          ctx.fillRect(bx, lineY, 440, 1);
        }
        ctx.fillStyle = "#7c2529";
        ctx.fillRect(bx, baseY + 18, 440, 8);
        ctx.fillStyle = "#4c1417";
        ctx.fillRect(bx, baseY + 26, 440, 3);

        // Finestre razionaliste incorniciate in pietra chiara (ben ordinate ai lati delle colonne)
        for (const wxOff of [22, 76, 326, 380]) {
          for (const wyOff of [44, 112]) {
            ctx.fillStyle = "#ede8dc";
            ctx.fillRect(bx + wxOff - 3, baseY + wyOff - 3, 34, 46);
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(bx + wxOff, baseY + wyOff, 28, 40);
            ctx.fillStyle = "#38bdf8";
            ctx.fillRect(bx + wxOff + 2, baseY + wyOff + 2, 7, 10);
            ctx.fillStyle = "#cbd5e1";
            ctx.fillRect(bx + wxOff + 9, baseY + wyOff, 1, 40);
            ctx.fillRect(bx + wxOff + 18, baseY + wyOff, 1, 40);
            ctx.fillRect(bx + wxOff, baseY + wyOff + 13, 28, 1);
            ctx.fillRect(bx + wxOff, baseY + wyOff + 26, 28, 1);
          }
        }

        // Avancorpo centrale monumentale in travertino di Trani
        ctx.fillStyle = "#e7e1d3";
        ctx.fillRect(bx + 136, baseY + 6, 168, 204);
        ctx.fillStyle = "#cfc7b6";
        ctx.fillRect(bx + 136, baseY + 6, 168, 3);

        // Loggia d'onore superiore incassata con Bandiere IT & UE
        ctx.fillStyle = "#b5ad9c";
        ctx.fillRect(bx + 180, baseY + 24, 80, 52);
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(bx + 186, baseY + 30, 68, 44);
        ctx.fillStyle = "#d6cfc0";
        ctx.fillRect(bx + 207, baseY + 30, 2, 44);
        ctx.fillRect(bx + 231, baseY + 30, 2, 44);

        // Bandiera Italiana + Bandiera Europea con aste inclinate
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(bx + 201, baseY + 46, 2, 26);
        ctx.fillRect(bx + 225, baseY + 46, 2, 26);
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(bx + 203, baseY + 48, 4, 16);
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(bx + 207, baseY + 48, 4, 16);
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(bx + 211, baseY + 48, 4, 16);
        ctx.fillStyle = "#1d4ed8";
        ctx.fillRect(bx + 227, baseY + 48, 12, 16);
        ctx.fillStyle = "#facc15";
        ctx.fillRect(bx + 231, baseY + 53, 4, 4);

        // Portale monumentale noce scuro + Targa marmorea "LICEO A. CASARDI"
        ctx.fillStyle = "#2e1a14";
        ctx.fillRect(bx + 180, baseY + 98, 80, 108);
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(bx + 186, baseY + 104, 68, 15);
        drawPixelText(ctx, "A. CASARDI", bx + 191, baseY + 108, "#1e293b", 1, null);
        // Portone vetrato d'ingresso
        ctx.fillStyle = "#c8a96e";
        ctx.fillRect(bx + 196, baseY + 125, 48, 78);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(bx + 199, baseY + 128, 19, 72);
        ctx.fillRect(bx + 222, baseY + 128, 19, 72);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(bx + 202, baseY + 132, 6, 20);
        ctx.fillRect(bx + 225, baseY + 132, 6, 20);

        // LE DUE ICONICHE COLONNE CILINDRICHE BIANCHE IN TRAVERTINO!
        for (const colX of [bx + 140, bx + 264]) {
          ctx.fillStyle = "#b8b0a0";
          ctx.fillRect(colX, baseY - 12, 36, 218);
          ctx.fillStyle = "#ded8ca";
          ctx.fillRect(colX + 3, baseY - 12, 26, 218);
          ctx.fillStyle = "#f7f5ef";
          ctx.fillRect(colX + 7, baseY - 12, 14, 218);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(colX + 10, baseY - 12, 6, 218);
          // Conci lapidei orizzontali
          ctx.fillStyle = "#c7bfb0";
          for (let cy = baseY + 4; cy < baseY + 200; cy += 18) {
            ctx.fillRect(colX + 1, cy, 34, 1);
          }
          // Blocco scultoreo superiore sopra il tetto
          ctx.fillStyle = "#e5dfd2";
          ctx.fillRect(colX + 10, baseY - 18, 16, 22);
          ctx.strokeStyle = "#9e9686";
          ctx.strokeRect(colX + 10, baseY - 18, 16, 22);
        }

        // Targhe istituzionali PON/FESR
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(bx + 150, baseY + 104, 16, 10);
        ctx.fillStyle = "#eab308";
        ctx.fillRect(bx + 150, baseY + 116, 16, 10);
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(bx + 274, baseY + 104, 16, 10);
      }

      // Pini marittimi pugliesi ai lati del viale (senza coprire il portale centrale!)
      for (let p = -1; p <= 3; p++) {
        const tx = p * 440 - (pxMid % 440) + 12;
        ctx.fillStyle = "#4a3222";
        ctx.fillRect(tx + 22, 140, 8, 104);
        ctx.fillStyle = "#2e1e14";
        ctx.fillRect(tx + 27, 140, 3, 104);
        ctx.fillStyle = "#14532d";
        ctx.fillRect(tx - 6, 114, 64, 26);
        ctx.fillStyle = "#166534";
        ctx.fillRect(tx + 2, 102, 48, 18);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(tx + 10, 96, 32, 9);
      }
    } else if (theme === "corridor") {
      // CORRIDOIO STORICO DEL CASARDI — Proporzioni 16-bit armoniose e calde!
      // Controsoffitto scolastico con plafoniere calde
      ctx.fillStyle = "#cbc5b5";
      ctx.fillRect(0, 26, SCREEN_W, 14);
      ctx.fillStyle = "#948e7e";
      ctx.fillRect(0, 40, SCREEN_W, 2);

      // Fascia superiore avorio morbido (non bianco abbagliante!) + zoccolatura giallo pastello Casardi
      ctx.fillStyle = "#e6e0cf";
      ctx.fillRect(0, 42, SCREEN_W, 108);
      ctx.fillStyle = "#85582a";
      ctx.fillRect(0, 150, SCREEN_W, 3);
      ctx.fillStyle = "#dec368";
      ctx.fillRect(0, 153, SCREEN_W, SCREEN_H - 153);

      const labels = ["AULA 7", "AULA 3", "4B MUS", "5A L.C."];
      if (inSubRoom) {
        // INTERNO D'AULA / PORTINERIA STORICA — finestre alte e lavagna luminosa
        for (const wx of [104, 336]) {
          ctx.fillStyle = "#5c3419";
          ctx.fillRect(wx, 54, 48, 76);
          ctx.fillStyle = "#dbeafe";
          ctx.fillRect(wx + 4, 58, 18, 32);
          ctx.fillRect(wx + 26, 58, 18, 32);
          ctx.fillStyle = "#bfdbfe";
          ctx.fillRect(wx + 4, 94, 18, 32);
          ctx.fillRect(wx + 26, 94, 18, 32);
          ctx.fillStyle = "#5c3419";
          ctx.fillRect(wx, 72, 48, 2);
          ctx.fillRect(wx, 90, 48, 2);
          ctx.fillRect(wx + 23, 54, 2, 76);
        }
        // LIM / lavagna luminosa
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(186, 30, 108, 8);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(188, 32, 104, 4);
      } else {
        for (let i = -1; i <= 4; i++) {
          const dx = i * 192 - (pxSlow % 192) + 28;

          // Lesena architettonica verticale che scandisce il corridoio
          ctx.fillStyle = "#d5ceb9";
          ctx.fillRect(dx - 18, 42, 10, 198);
          ctx.fillStyle = "#c9ae53";
          ctx.fillRect(dx - 18, 153, 10, 87);

          // Plafoniera luminosa a soffitto
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(dx + 24, 30, 48, 5);
          ctx.fillStyle = "#fef9c3";
          ctx.fillRect(dx + 28, 35, 40, 2);

          // Stampa greca incorniciata nella fascia alta (sempre SOPRA la porta)
          ctx.fillStyle = "#5c3422";
          ctx.fillRect(dx + 96, 60, 54, 38);
          ctx.fillStyle = "#f5efe0";
          ctx.fillRect(dx + 99, 63, 48, 32);
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(dx + 105, 69, 36, 12);
          ctx.fillStyle = "#cbd5e1";
          ctx.fillRect(dx + 105, 84, 28, 6);

          // ================= PORTE A SOMMESSA (si vede il vano d'ombra!) =============
          const doorTop = 132;
          const doorH = 108;
          // 1) vano in ombra ricavato nel muro
          ctx.fillStyle = "#8d8778";
          ctx.fillRect(dx - 4, doorTop - 4, 50, doorH + 4);
          // 2) telaio bianco di contorno (tipico delle porte scolastiche)
          ctx.fillStyle = "#ede8dc";
          ctx.fillRect(dx - 4, doorTop - 4, 50, 6);
          ctx.fillRect(dx - 4, doorTop - 4, 5, doorH + 4);
          ctx.fillRect(dx + 42, doorTop - 4, 4, doorH + 4);
          // 3) battente in rovere scuro (LEGNO VERO, non azzurro)
          ctx.fillStyle = "#4a2a12";
          ctx.fillRect(dx + 1, doorTop + 2, 42, doorH - 2);
          ctx.fillStyle = "#6b3d1c";
          ctx.fillRect(dx + 3, doorTop + 4, 38, doorH - 6);
          // 4) effetto profondità: metà sinistra in ombra, metà destra illuminata
          ctx.fillStyle = "rgba(0,0,0,0.22)";
          ctx.fillRect(dx + 3, doorTop + 4, 12, doorH - 6);
          ctx.fillStyle = "rgba(255,255,255,0.10)";
          ctx.fillRect(dx + 30, doorTop + 4, 11, doorH - 6);
          // 5) oblò di vetro smerigliato in alto + specchiera in basso
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(dx + 9, doorTop + 10, 26, 20);
          ctx.fillStyle = "#bae6fd";
          ctx.fillRect(dx + 11, doorTop + 12, 22, 16);
          ctx.fillStyle = "#7dd3fc";
          ctx.fillRect(dx + 21, doorTop + 12, 2, 16);
          // 6) pannelli inferiori della porta
          ctx.strokeStyle = "#3a1f0d";
          ctx.strokeRect(dx + 8, doorTop + 40, 28, 28);
          ctx.strokeRect(dx + 8, doorTop + 74, 28, 26);
          // 7) maniglia in ottone e soglia
          ctx.fillStyle = "#fbbf24";
          ctx.fillRect(dx + 34, doorTop + 58, 5, 4);
          ctx.fillStyle = "#fde68a";
          ctx.fillRect(dx + 34, doorTop + 58, 2, 2);
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(dx - 2, doorTop + doorH - 3, 48, 3);

          // TARGA D'AULA: staffa + pannello metallico con nome (fuori dalla somma!)
          const tagY = doorTop - 14;
          ctx.fillStyle = "#334155";
          ctx.fillRect(dx + 6, tagY, 44, 15);
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(dx + 7, tagY + 1, 42, 13);
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(dx + 7, tagY + 12, 42, 2);
          const lbl = labels[((i % labels.length) + labels.length) % labels.length];
          drawPixelText(ctx, lbl, dx + 10, tagY + 4, "#0f172a", 1, null);
        }
      }
    } else if (theme === "courtyard") {
      // CORTILE SPORTIVO E PALESTRA DEL CASARDI
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(0, 0, SCREEN_W, 68);
      ctx.fillStyle = "#60a5fa";
      ctx.fillRect(0, 68, SCREEN_W, 62);

      // Chiome di pini marittimi oltre il muro del cortile
      for (let p = -1; p <= 4; p++) {
        const pxTree = p * 170 - (pxSlow % 170);
        ctx.fillStyle = "#14532d";
        ctx.fillRect(pxTree, 44, 74, 28);
        ctx.fillStyle = "#166534";
        ctx.fillRect(pxTree + 10, 36, 54, 16);
      }

      // Ala scolastica in sfondo + palestra
      ctx.fillStyle = "#d9b98e";
      ctx.fillRect(0, 66, SCREEN_W, 88);
      ctx.fillStyle = "#7c2529";
      ctx.fillRect(0, 60, SCREEN_W, 7);
      for (let wx = 24 - (pxSlow % 72); wx < SCREEN_W; wx += 72) {
        ctx.fillStyle = "#ede8dc";
        ctx.fillRect(wx - 2, 78, 28, 34);
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(wx, 80, 24, 30);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(wx + 2, 82, 8, 10);
      }

      // Fascia tribuna/parapetto sportivo blu notte con righe biancorosse
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 152, SCREEN_W, 118);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(0, 152, SCREEN_W, 4);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 156, SCREEN_W, 2);
      ctx.fillStyle = "#172554";
      ctx.fillRect(0, 162, SCREEN_W, 108);

      // Linee campo regolamentari sul fondale
      for (let i = -1; i <= 3; i++) {
        const hx = i * 240 - (pxMid % 240) + 90;
        ctx.strokeStyle = "rgba(255,255,255,0.16)";
        ctx.strokeRect(hx - 40, 174, 80, 66);
      }
    } else if (theme === "lab") {
      // =====================================================================
      // LABORATORIO MULTIMEDIALE 23 PC FESR — FEDELE ALLE FOTO REALI:
      // pavimento in graniglia chiara, pareti avorio, banchi modulari blu,
      // pannelli grigi portacavi, finestre luminose e plafoniere a soffitto.
      // =====================================================================
      const CEIL = 34;

      // Soffitto con plafoniere a tubi fluorescenti
      ctx.fillStyle = "#e8e4dc";
      ctx.fillRect(0, 0, SCREEN_W, CEIL);
      ctx.fillStyle = "#d5d0c6";
      ctx.fillRect(0, CEIL - 3, SCREEN_W, 3);
      for (let i = 0; i < 8; i++) {
        const lx = i * 62 - (pxSlow % 62) + 14;
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(lx, 9, 42, 5);
        ctx.fillStyle = "#fef9c3";
        ctx.fillRect(lx + 1, 10, 40, 3);
      }

      // Parete avorio (intonaco chiaro) con fascia grigio-salvia battiscopa
      ctx.fillStyle = "#eae5db";
      ctx.fillRect(0, CEIL, SCREEN_W, 92);
      ctx.fillStyle = "#dcd6ca";
      ctx.fillRect(0, CEIL + 4, SCREEN_W, 2);

      // Finestre alte con luce naturale sul lato aula
      for (let i = -1; i <= 4; i++) {
        const wx = i * 148 - (pxSlow % 148) + 30;
        ctx.fillStyle = "#c9d3d8";
        ctx.fillRect(wx - 2, 44, 40, 32);
        ctx.fillStyle = "#dbeafe";
        ctx.fillRect(wx, 46, 36, 28);
        ctx.fillStyle = "#bfdbfe";
        ctx.fillRect(wx + 3, 49, 15, 22);
        ctx.fillStyle = "#93c5fd";
        ctx.fillRect(wx + 19, 49, 14, 22);
        ctx.fillStyle = "#c9d3d8";
        ctx.fillRect(wx + 17, 46, 2, 28);
      }

      // Fascia passacavi grigia (le "canaline" dei banchi modulari)
      ctx.fillStyle = "#b8bec4";
      ctx.fillRect(0, 82, SCREEN_W, 7);
      ctx.fillStyle = "#9aa3ab";
      ctx.fillRect(0, 88, SCREEN_W, 2);

      // Pannelli grigi dei banchi con prese e switch di rete
      for (let i = -1; i <= 4; i++) {
        const bx = i * 148 - (pxSlow % 148) + 30;
        ctx.fillStyle = "#aeb6bd";
        ctx.fillRect(bx + 52, 60, 84, 30);
        ctx.strokeStyle = "#8b949c";
        ctx.strokeRect(bx + 52, 60, 84, 30);
        // Prese e LED di rete
        for (let p = 0; p < 3; p++) {
          ctx.fillStyle = "#e2e8f0";
          ctx.fillRect(bx + 58 + p * 12, 66, 8, 6);
          ctx.fillStyle = "#475569";
          ctx.fillRect(bx + 59 + p * 12, 67, 6, 4);
        }
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(bx + 100, 66, 3, 3);
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(bx + 106, 66, 3, 3);
        drawPixelText(ctx, "LAN", bx + 58, 78, "#475569", 1, null);
      }

      // Pavimento in graniglia chiara (macchia veneziana grigio-blu)
      ctx.fillStyle = "#cdd3d8";
      ctx.fillRect(0, 126, SCREEN_W, SCREEN_H - 126);
      ctx.fillStyle = "#bcc4ca";
      ctx.fillRect(0, 126, SCREEN_W, 2);
      for (let gx = -1; gx < 12; gx++) {
        for (let gy = 0; gy < 5; gy++) {
          const sx = gx * 46 - (pxMid % 46) + (gy % 2) * 23;
          const sy = 138 + gy * 26;
          ctx.fillStyle = (gx + gy) % 3 === 0 ? "#c3cad0" : "#d2d8dd";
          ctx.fillRect(sx, sy, 6, 4);
          ctx.fillRect(sx + 14, sy + 9, 4, 3);
        }
      }

      // Banchi modulari BLU in primo piano (il vero colore del laboratorio)
      for (let i = -1; i <= 3; i++) {
        const dx = i * 168 - (pxSlow % 168) + 24;
        // piano di lavoro blue navy
        ctx.fillStyle = "#1f3d68";
        ctx.fillRect(dx, 150, 104, 9);
        ctx.fillStyle = "#2b548c";
        ctx.fillRect(dx, 150, 104, 3);
        // gambe/pannello frontale
        ctx.fillStyle = "#16304f";
        ctx.fillRect(dx + 6, 159, 12, 22);
        ctx.fillRect(dx + 86, 159, 12, 22);
        ctx.fillStyle = "#0f2440";
        ctx.fillRect(dx + 22, 162, 60, 18);
        // monitor spento sul banco
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(dx + 30, 132, 44, 20);
        ctx.fillStyle = "#1e3a5f";
        ctx.fillRect(dx + 32, 134, 40, 16);
        ctx.fillStyle = "#38bdf8";
        ctx.globalAlpha = 0.55;
        ctx.fillRect(dx + 35, 137, 14, 10);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(dx + 48, 152, 8, 3);
      }
    } else if (theme === "library") {
      // BIBLIOTECA STORICA DEGLI 8.000 VOLUMI — Atmosfera calda in mogano e ottone!
      ctx.fillStyle = "#1b0f0a";
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

      // Palette rilegature antiche in pelle e pergamena (calda e armoniosa, zero colori neon!)
      const antiqueSpines = ["#6b1d1d", "#1e3a5f", "#274e2e", "#783f12", "#4a2545", "#8a5a19", "#522b18"];
      for (let i = -1; i <= 5; i++) {
        const sx = i * 124 - (pxSlow % 124);

        // Pilastro ligneo intagliato tra le campate
        ctx.fillStyle = "#3b1f12";
        ctx.fillRect(sx, 26, 16, 224);
        ctx.fillStyle = "#59301c";
        ctx.fillRect(sx + 3, 26, 10, 224);
        ctx.fillStyle = "#b45309";
        ctx.fillRect(sx + 5, 34, 6, 8);

        // Scaffalatura incassata scura per massimo stacco con i personaggi!
        ctx.fillStyle = "#29150c";
        ctx.fillRect(sx + 16, 32, 108, 214);

        for (let shelfY = 44; shelfY < 224; shelfY += 34) {
          ctx.fillStyle = "#5c321c";
          ctx.fillRect(sx + 18, shelfY + 22, 104, 5);
          ctx.fillStyle = "#7c4527";
          ctx.fillRect(sx + 18, shelfY + 22, 104, 1);
          for (let b = 0; b < 15; b++) {
            const col = antiqueSpines[(b * 3 + Math.abs(i) + shelfY) % antiqueSpines.length];
            const bh = 16 + (b % 3) * 2;
            ctx.fillStyle = col;
            ctx.fillRect(sx + 21 + b * 6, shelfY + 22 - bh, 5, bh);
            if (b % 4 === 0) {
              ctx.fillStyle = "#d97706";
              ctx.fillRect(sx + 22 + b * 6, shelfY + 10, 3, 2);
            }
          }
        }

        // Lampada in ottone da biblioteca con cono di luce ambrata!
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(sx + 62, 30, 16, 4);
        ctx.fillStyle = "rgba(251, 191, 36, 0.08)";
        ctx.fillRect(sx + 42, 34, 56, 70);
      }
    } else {
      // =========================================================================
      // AULA MAGNA MONUMENTALE DEL LICEO CASARDI — Rifatta da zero in 16-bit!
      // =========================================================================
      // 1. Soffitto a cassettoni lignei scuri + fari teatrali dorati
      ctx.fillStyle = "#1c141d";
      ctx.fillRect(0, 26, SCREEN_W, 24);
      ctx.fillStyle = "#3b2316";
      for (let cx = 0; cx < SCREEN_W; cx += 48) {
        ctx.fillRect(cx + 4, 29, 40, 16);
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(cx + 21, 45, 6, 3);
        ctx.fillStyle = "#3b2316";
      }

      // 2. Parete di fondo dell'Aula Magna in caldo travertino ambrato + boiserie in noce
      ctx.fillStyle = "#d8cebc";
      ctx.fillRect(0, 50, SCREEN_W, 118);
      // Boiserie inferiore in legno noce classico dietro al palco (contrasto perfetto con gli sprite!)
      ctx.fillStyle = "#4a2a19";
      ctx.fillRect(0, 152, SCREEN_W, 96);
      ctx.fillStyle = "#6e4027";
      ctx.fillRect(0, 150, SCREEN_W, 4);
      for (let wx = 12 - (pxSlow % 48); wx < SCREEN_W; wx += 48) {
        ctx.strokeStyle = "#381e10";
        ctx.strokeRect(wx, 160, 38, 56);
      }

      const ox = Math.round(20 - camX * 0.14);

      // 3. Tre grandi finestre classiche incorniciate + Grande Telo Proiezione Centrale "OPEN DAY CASARDI"
      for (const winX of [ox + 68, ox + 378]) {
        ctx.fillStyle = "#6e4027";
        ctx.fillRect(winX - 4, 62, 58, 82);
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(winX, 66, 50, 74);
        // Veneziane / luce azzurra filtrata
        for (let wy = 70; wy < 136; wy += 8) {
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(winX + 4, wy, 42, 3);
        }
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(winX + 24, 66, 2, 74);
      }

      // Grande Schermo di Proiezione Istituzionale al centro del palco!
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(ox + 168, 56, 174, 86);
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(ox + 164, 54, 182, 5);
      ctx.fillStyle = "#0f1e3d";
      ctx.fillRect(ox + 174, 62, 162, 74);
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(ox + 180, 68, 150, 16);
      drawPixelText(ctx, "LICEO STATALE A. CASARDI", ox + 184, 73, "#ffd147", 1, null);
      drawPixelText(ctx, "CLASSICO • SCIENZE UMANE", ox + 184, 92, "#e0f2fe", 1, null);
      drawPixelText(ctx, "MUSICALE • OPEN DAY EIPASS", ox + 180, 106, "#7dd3fc", 1, null);
      ctx.fillStyle = "#eab308";
      ctx.fillRect(ox + 190, 122, 130, 2);

      // 4. Bandiere Istituzionali Italiana ed Europea su aste d'ottone ai lati dello schermo!
      for (const [fx, isEU] of [
        [ox + 142, false],
        [ox + 350, true],
      ]) {
        ctx.fillStyle = "#d97706";
        ctx.fillRect(fx + 6, 70, 3, 82);
        ctx.fillStyle = "#fde047";
        ctx.fillRect(fx + 5, 66, 5, 4);
        if (!isEU) {
          ctx.fillStyle = "#16a34a";
          ctx.fillRect(fx + 9, 74, 5, 24);
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(fx + 14, 74, 5, 24);
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(fx + 19, 74, 5, 24);
        } else {
          ctx.fillStyle = "#1d4ed8";
          ctx.fillRect(fx + 9, 74, 15, 24);
          ctx.fillStyle = "#facc15";
          ctx.fillRect(fx + 14, 82, 5, 6);
        }
      }

      // 5. Librerie storiche a vetri con BUSTI CLASSICI MARMOREI su entrambi i lati!
      for (const libX of [ox - 10, ox + 452]) {
        ctx.fillStyle = "#3b1f12";
        ctx.fillRect(libX, 100, 64, 112);
        ctx.fillStyle = "#5c321c";
        ctx.fillRect(libX + 3, 103, 58, 106);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(libX + 7, 108, 22, 58);
        ctx.fillRect(libX + 35, 108, 22, 58);
        // Riflesso sui vetri e libri antichi dentro
        ctx.fillStyle = "#7f1d1d";
        ctx.fillRect(libX + 9, 126, 18, 14);
        ctx.fillStyle = "#1e3a8a";
        ctx.fillRect(libX + 37, 144, 18, 16);
        ctx.fillStyle = "rgba(186, 230, 253, 0.25)";
        ctx.fillRect(libX + 8, 110, 6, 48);
        ctx.fillRect(libX + 36, 110, 6, 48);
        // Busto classico marmoreo sopra la libreria!
        if (this.imgs.enemiesProps) {
          ctx.drawImage(this.imgs.enemiesProps, 128, 32, 32, 32, libX + 16, 70, 32, 32);
        }
      }

      // 6. Coni di luce calda dei riflettori teatrali sul palco
      ctx.fillStyle = "rgba(254, 240, 138, 0.07)";
      ctx.fillRect(96, 50, 90, 180);
      ctx.fillRect(294, 50, 90, 180);

      // 7. Quinte teatrali in velluto rosso bordeaux con frangia d'oro ai bordi dello schermo!
      for (const qx of [0, SCREEN_W - 26]) {
        ctx.fillStyle = "#5c1116";
        ctx.fillRect(qx, 26, 26, 220);
        ctx.fillStyle = "#881b22";
        ctx.fillRect(qx + 4, 26, 7, 220);
        ctx.fillRect(qx + 15, 26, 7, 220);
        ctx.fillStyle = "#eab308";
        ctx.fillRect(qx, 142, 26, 4);
      }
      // Mantovana superiore in velluto bordeaux e oro
      ctx.fillStyle = "#7c1920";
      ctx.fillRect(0, 26, SCREEN_W, 12);
      ctx.fillStyle = "#eab308";
      ctx.fillRect(0, 38, SCREEN_W, 2);
    }
  }

  // ===========================================================================
  // DISEGNO TILE 16x16 CON TILESET_CASARDI.PNG + OMBRE DI STACCO
  // ===========================================================================
  drawTile(ctx, world, t, c, r, x, y) {
    const ts = this.imgs.tileset;
    const theme = world.bp.theme;
    const harmonicSolid = world.harmonicTimer > 0;

    // Leggera ombra sotto le piattaforme sospese per separarle visivamente dallo sfondo!
    if ((t === 2 || t === 4 || (t === 1 && r + 1 < world.rows && world.grid[r + 1][c] === 0)) && t !== 6) {
      ctx.fillStyle = "rgba(9, 13, 26, 0.28)";
      ctx.fillRect(x, y + (t === 2 || t === 4 ? 7 : 16), 16, 3);
    }

    if (ts) {
      let tx = -1;
      if (t === 1) {
        tx =
          theme === "facade"
            ? 0
            : theme === "corridor" || theme === "aulamagna"
            ? 16
            : theme === "courtyard"
            ? 32
            : theme === "lab"
            ? 48
            : 64;
      } else if (t === 2) {
        tx = theme === "library" || theme === "aulamagna" ? 96 : 80;
      } else if (t === 3) {
        tx = 112;
      } else if (t === 4) {
        tx = harmonicSolid ? 128 : 144;
      } else if (t === 5) {
        tx = 160;
      } else if (t === 6) {
        tx = 176;
      } else if (t === 7) {
        tx = 192;
      }

      if (tx >= 0) {
        ctx.drawImage(ts, tx, 0, 16, 16, x, y, 16, 16);
        if (t === 1 && r > 0 && world.grid[r - 1][c] === 1) {
          ctx.fillStyle = "rgba(9, 13, 26, 0.22)";
          ctx.fillRect(x, y, 16, 3);
        }
        return;
      }
    }

    ctx.fillStyle = t === 1 ? "#94a3b8" : t === 2 ? "#e2e8f0" : t === 3 ? "#dc2626" : "#38bdf8";
    ctx.fillRect(x, y, TILE, t === 2 ? 6 : TILE);
  }

  // ===========================================================================
  // ARREDI SCOLASTICI DI PARETE (DISEGNATI IN SECONDO PIANO PULITO)
  // ===========================================================================
  drawWallProps(ctx, world, camX) {
    for (const dec of world.bp.decorations) {
      if (dec.type !== "arch_prop") continue;
      if (dec.x < camX - 200 || dec.x > camX + SCREEN_W + 100) continue;

      if (dec.propKind === "bust" && this.imgs.enemiesProps) {
        // Colonnina di legno + Busto marmoreo classico
        ctx.fillStyle = "#4a2a19";
        ctx.fillRect(dec.x + 3, dec.y - 18, 18, 18);
        ctx.fillStyle = "#6e4027";
        ctx.fillRect(dec.x + 1, dec.y - 20, 22, 3);
        ctx.drawImage(this.imgs.enemiesProps, 128, 32, 32, 32, dec.x - 4, dec.y - 48, 32, 32);
      } else if (dec.propKind === "lim") {
        // Lavagna Interattiva Multimediale (LIM) ampia e leggibile senza alcun taglio del titolo!
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(dec.x, dec.y - 72, 114, 44);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(dec.x + 2, dec.y - 70, 110, 40);
        ctx.fillStyle = "#0369a1";
        ctx.fillRect(dec.x + 4, dec.y - 68, 106, 36);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(dec.x + 4, dec.y - 68, 106, 7);
        drawPixelText(ctx, (dec.label || "LIM CASARDI").slice(0, 17), dec.x + 7, dec.y - 55, "#fef08a", 1, null);
      } else if (dec.propKind === "desk_pc") {
        ctx.fillStyle = "#334155";
        ctx.fillRect(dec.x, dec.y - 16, 40, 16);
        ctx.fillStyle = "#64748b";
        ctx.fillRect(dec.x - 2, dec.y - 18, 44, 3);
        ctx.fillStyle = "#090d1a";
        ctx.fillRect(dec.x + 9, dec.y - 33, 22, 15);
        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(dec.x + 11, dec.y - 31, 18, 11);
      } else if (dec.propKind === "piano_grand") {
        // VERO PIANOFORTE A CODA NERO SCOLPITO AL PIXEL SUL PALCO DELL'AULA MAGNA!
        const px = dec.x;
        const py = dec.y - 44;
        // Coperchio superiore aperto inclinato a gradoni pixel-art + asta in ottone!
        for (let step = 0; step < 18; step++) {
          ctx.fillStyle = "#090d1a";
          ctx.fillRect(px + 12 + step * 2, py + 16 - step, 26 - step, 3);
          ctx.fillStyle = "#334155";
          ctx.fillRect(px + 12 + step * 2, py + 15 - step, 4, 1);
        }
        // Asta reggi-coperchio dorata + arpa interna in bronzo dorato
        for (let b = 0; b < 12; b++) {
          ctx.fillStyle = "#eab308";
          ctx.fillRect(px + 38 - Math.floor(b / 3), py + 6 + b, 2, 1);
        }
        ctx.fillStyle = "#b45309";
        ctx.fillRect(px + 16, py + 16, 36, 3);
        // Cassa armonica nera laccata con riflesso bianco/azzurro
        ctx.fillStyle = "#090d1a";
        ctx.fillRect(px, py + 18, 62, 14);
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(px + 2, py + 19, 58, 3);
        // Leggio spartito + tastiera 88 tasti bianco/nera!
        ctx.fillStyle = "#fef3c7";
        ctx.fillRect(px + 6, py + 13, 10, 5);
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(px - 4, py + 24, 24, 5);
        ctx.fillStyle = "#090d1a";
        for (let k = 0; k < 20; k += 4) {
          ctx.fillRect(px - 2 + k, py + 24, 2, 3);
        }
        // Gambe tornite con rotelle in ottone + panchetta imbottita!
        ctx.fillStyle = "#090d1a";
        ctx.fillRect(px + 4, py + 32, 4, 12);
        ctx.fillRect(px + 28, py + 32, 4, 12);
        ctx.fillRect(px + 52, py + 32, 4, 12);
        ctx.fillStyle = "#eab308";
        ctx.fillRect(px + 4, py + 43, 4, 1);
        ctx.fillRect(px + 52, py + 43, 4, 1);
        // Panchetta pianista a sinistra della tastiera
        ctx.fillStyle = "#7f1d1d";
        ctx.fillRect(px - 16, py + 33, 12, 3);
        ctx.fillStyle = "#090d1a";
        ctx.fillRect(px - 15, py + 36, 3, 8);
        ctx.fillRect(px - 7, py + 36, 3, 8);
      } else if (dec.propKind === "trophy") {
        ctx.fillStyle = "#451a03";
        ctx.fillRect(dec.x, dec.y - 44, 36, 44);
        ctx.fillStyle = "#78350f";
        ctx.fillRect(dec.x + 2, dec.y - 42, 32, 40);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(dec.x + 4, dec.y - 38, 28, 22);
        ctx.fillStyle = "#facc15";
        ctx.fillRect(dec.x + 8, dec.y - 30, 8, 12);
        ctx.fillRect(dec.x + 20, dec.y - 26, 8, 8);
      }
    }
  }

  drawHintSigns(ctx, world, _camX) {
    if (world.activeBanter) return;
    let best = null;
    let bestDist = 150;
    for (const dec of world.bp.decorations) {
      if (dec.type !== "hint") continue;
      const dist = Math.abs(world.player.x - dec.x);
      if (dist < bestDist) {
        bestDist = dist;
        best = dec;
      }
    }
    if (!best) return;
    const txt = `★ ${best.text}`;
    const w = Math.min(SCREEN_W - 20, measurePixelText(txt, 1) + 16);
    const bx = Math.round((SCREEN_W - w) / 2);
    const by = SCREEN_H - 21;
    drawPixelPanel(ctx, bx, by, w, 17, "rgba(9, 14, 28, 0.94)", "#38bdf8", "#1e3a8a");
    drawPixelText(ctx, txt.slice(0, 74), bx + 8, by + 5, "#fef08a", 1);
  }

  drawInteractiveProps(ctx, world) {
    // Canestri-Relè per Carlo (con asta di supporto ancorata in modo pulito!)
    for (const h of world.hoops) {
      ctx.fillStyle = "#334155";
      ctx.fillRect(h.x + 12, h.y - 8, 4, 24);
      ctx.fillStyle = "#090d1a";
      ctx.fillRect(h.x + 7, h.y - 12, 8, 22);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(h.x + 8, h.y - 11, 6, 20);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(h.x + 9, h.y - 4, 4, 6);
      ctx.fillStyle = h.activated ? "#22c55e" : "#f97316";
      ctx.fillRect(h.x - 5, h.y + 2, 16, 3);
      ctx.strokeStyle = "#e2e8f0";
      ctx.strokeRect(h.x - 3, h.y + 5, 12, 8);
    }

    // Checkpoint (Stendardo Casardi oro/verde)
    for (const cp of world.checkpoints) {
      ctx.fillStyle = "#090d1a";
      ctx.fillRect(cp.x + 5, cp.y - 8, 4, 26);
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(cp.x + 6, cp.y - 7, 2, 24);
      ctx.fillStyle = cp.active ? "#16a34a" : "#475569";
      ctx.fillRect(cp.x + 8, cp.y - 7, 15, 10);
      drawPixelText(ctx, cp.active ? "OK" : "CP", cp.x + 10, cp.y - 5, "#ffffff", 1, null);
    }

    // Terminali CRT EIPASS
    for (const tm of world.terminals) {
      if (this.imgs.enemiesProps) {
        ctx.drawImage(this.imgs.enemiesProps, 96, 32, 32, 32, tm.x - 4, tm.y - 14, 32, 32);
      }
      const badgeCol = tm.cleared ? "#4ade80" : this.tick % 30 < 15 ? "#fde047" : "#38bdf8";
      drawPixelText(ctx, tm.cleared ? "OK" : "EIP", tm.x + 3, tm.y - 20, badgeCol, 1);
    }

    // Postazioni Minigioco
    for (const mg of world.minigames) {
      const col =
        mg.mgType === "basket"
          ? "#f97316"
          : mg.mgType === "piano"
          ? "#38e2d8"
          : mg.mgType === "athletics" || mg.mgType === "football"
          ? "#f45565"
          : mg.mgType === "dance" || mg.mgType === "netdiag"
          ? "#f472b6"
          : mg.mgType === "firewall"
          ? "#a855f7"
          : mg.mgType === "filesorter"
          ? "#22d3ee"
          : "#ffd147";
      drawPixelPanel(ctx, mg.x - 3, mg.y - 10, 28, 28, "#0f172a", mg.done ? "#22c55e" : col, "#1e293b");
      const tag =
        mg.mgType === "basket"
          ? "BSK"
          : mg.mgType === "piano"
          ? "KEY"
          : mg.mgType === "athletics" || mg.mgType === "football"
          ? "RUN"
          : mg.mgType === "dance" || mg.mgType === "netdiag"
          ? "DAN"
          : mg.mgType === "firewall"
          ? "FW!"
          : mg.mgType === "filesorter"
          ? "SSD"
          : "MAT";
      drawPixelText(ctx, mg.done ? "OK!" : tag, mg.x + 2, mg.y, mg.done ? "#4ade80" : col, 1);
    }

    // Porte Sotto-Aule / Redazione Pegaso esplorabili (portale in legno con insegna luminosa!)
    for (const sd of world.subDoors) {
      ctx.fillStyle = "#090d1a";
      ctx.fillRect(sd.x - 4, sd.y - 26, 34, 50);
      ctx.fillStyle = "#5c3419";
      ctx.fillRect(sd.x - 3, sd.y - 25, 32, 49);
      ctx.fillStyle = "#b45309";
      ctx.fillRect(sd.x, sd.y - 12, 26, 36);
      ctx.fillStyle = "#92400e";
      ctx.fillRect(sd.x + 3, sd.y - 8, 20, 13);
      ctx.fillRect(sd.x + 3, sd.y + 8, 20, 13);
      ctx.fillStyle = this.tick % 40 < 20 ? "#fde047" : "#38bdf8";
      ctx.fillRect(sd.x, sd.y - 22, 26, 8);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(sd.x + 21, sd.y + 6, 3, 3);
    }

    // Porte d'uscita al livello successivo
    for (const ex of world.exits) {
      ctx.fillStyle = "#090d1a";
      ctx.fillRect(ex.x - 2, ex.y - 14, 30, 40);
      ctx.fillStyle = "#7c2529";
      ctx.fillRect(ex.x - 1, ex.y - 13, 28, 38);
      ctx.fillStyle = "#fde047";
      ctx.fillRect(ex.x + 2, ex.y - 10, 22, 35);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(ex.x + 4, ex.y - 8, 18, 33);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(ex.x + 6, ex.y - 4, 14, 10);
      drawPixelText(ctx, "▶", ex.x + 11, ex.y + 11, "#fde047", 1, null);
    }
  }

  drawCollectibles(ctx, world) {
    const bob = Math.round(Math.sin(this.tick * 0.12) * 2);
    for (const it of world.items) {
      if (it.taken) continue;
      if (it.kind === "token") {
        ctx.fillStyle = "#090d1a";
        ctx.fillRect(it.x - 1, it.y - 1 + bob, 10, 10);
        ctx.fillStyle = "#0ea5e9";
        ctx.fillRect(it.x, it.y + bob, 8, 8);
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(it.x + 2, it.y + 2 + bob, 4, 4);
      } else if (it.kind === "heart" && this.imgs.enemiesProps) {
        ctx.drawImage(this.imgs.enemiesProps, 32, 32, 32, 32, it.x - 7, it.y - 8 + bob, 28, 28);
      } else if (it.kind === "pegaso" && this.imgs.enemiesProps) {
        ctx.drawImage(this.imgs.enemiesProps, 0, 32, 32, 32, it.x - 7, it.y - 8 + bob, 30, 30);
      }
    }
  }

  drawDialogueNPCs(ctx, world) {
    if (!this.imgs.characters) return;
    for (const dg of world.dialogues) {
      if (!dg.npcChar || dg.triggered) continue;
      const meta = CHARACTERS[dg.npcChar];
      if (!meta) continue;
      const pose = Math.floor(this.tick / 14) % 4;
      const dx = Math.round(dg.x) - 8;
      const dy = Math.round(dg.y) - 18;
      ctx.drawImage(
        this.imgs.characters,
        pose * CHAR_SPRITE_W,
        meta.row * CHAR_SPRITE_H,
        CHAR_SPRITE_W,
        CHAR_SPRITE_H,
        dx,
        dy,
        CHAR_SPRITE_W,
        CHAR_SPRITE_H
      );
      const bob = Math.round(Math.sin(this.tick * 0.15) * 2);
      drawPixelPanel(ctx, dx + 10, dy - 13 + bob, 13, 13, "#ffd147", "#090d1a", "#fde047");
      drawPixelText(ctx, "!", dx + 14, dy - 10 + bob, "#090d1a", 1, null);
    }
  }

  drawEnemiesAndBoss(ctx, world) {
    const animF = Math.floor(this.tick / 14) % 2;
    if (!this.imgs.enemiesProps) return;

    for (const e of world.enemies) {
      if (!e.alive) continue;
      const baseSlot =
        e.kind === "spambot"
          ? 0
          : e.kind === "drone"
          ? 2
          : e.kind === "crab"
          ? 4
          : e.kind === "slime"
          ? 6
          : 8;
      const sx = (baseSlot + animF) * 32;
      if (e.stun > 0 && this.tick % 6 < 3) ctx.globalAlpha = 0.55;
      ctx.drawImage(this.imgs.enemiesProps, sx, 0, 32, 32, Math.round(e.x) - 6, Math.round(e.y) - 8, 32, 32);
      ctx.globalAlpha = 1.0;
    }

    // Mid-Boss di Capitolo
    if (world.midBoss && !world.midBoss.defeated) {
      const mb = world.midBoss;
      if (!(mb.invuln > 0 && this.tick % 4 < 2)) {
        const sx = (mb.bossKind === "kraken" ? 208 : 104) + animF * 52;
        ctx.drawImage(this.imgs.enemiesProps, sx, 65, 48, 60, Math.round(mb.x) - 4, Math.round(mb.y) - 6, 48, 60);
      }
    }

    // Il Sofista Digitale 404-Ω con aura energetica olografica!
    if (world.boss && !world.boss.defeated) {
      const b = world.boss;
      if (!(b.invuln > 0 && this.tick % 4 < 2)) {
        const bx = Math.round(b.x) - 5;
        const by = Math.round(b.y) - 6;
        // Aura mistica dietro al Boss
        ctx.fillStyle = b.phase === 3 ? "rgba(244, 63, 94, 0.22)" : "rgba(192, 38, 211, 0.18)";
        ctx.fillRect(bx + 4, by + 6, 40, 48);
        const sx = animF * 52;
        ctx.drawImage(this.imgs.enemiesProps, sx, 65, 48, 60, bx, by, 48, 60);
        if (b.stunTimer > 0) {
          drawPixelText(ctx, "STORDITO!", bx + 2, by - 10, "#38bdf8", 1);
        }
      }
    }
  }

  /** Compagni di squadra visibili: sprite 32x36 con sigla e alone quando sono "prendibili" con [E]. */
  drawCompanions(ctx, world) {
    if (!this.imgs.characters || !world.companionActors) return;
    for (const a of world.companionActors) {
      const meta = CHARACTERS[a.charId];
      if (!meta) continue;
      const bob = Math.round(Math.sin((this.tick + a.bob) * 0.09) * 1.5);
      const px = Math.round(a.x);
      const py = Math.round(a.y) - bob;
      const isNear = world.nearestCompanion && world.nearestCompanion.charId === a.charId;

      // alone luminoso quando [E] è disponibile
      if (isNear) {
        ctx.fillStyle = "rgba(255, 209, 71, 0.20)";
        ctx.fillRect(px - 3, py - 4, 38, 44);
      }

      // ombra a terra
      ctx.fillStyle = "rgba(9, 13, 26, 0.28)";
      ctx.fillRect(px + 8, py + 34, 16, 3);

      const walk = Math.floor((this.tick + a.bob) / 12) % 4;
      ctx.drawImage(this.imgs.characters, walk * 32, meta.row * 36, 32, 36, px, py, 32, 36);

      // sigla sopra la testa
      const sig = meta.shortName;
      const sigW = sig.length * 6 + 6;
      ctx.fillStyle = "rgba(9, 13, 26, 0.82)";
      ctx.fillRect(px + 16 - sigW / 2, py - 12, sigW, 10);
      drawPixelText(ctx, sig, px + 19 - sigW / 2, py - 10, isNear ? "#ffd147" : meta.color, 1);
    }
  }

  drawAssistAndPlayer(ctx, world) {
    if (!this.imgs.characters) return;

    if (world.assistActor) {
      const a = world.assistActor;
      const meta = CHARACTERS[a.charId] || CHARACTERS.carlo;
      ctx.save();
      ctx.globalAlpha = Math.min(1, a.ttl / 12);
      const ax = Math.round(a.x) - 8;
      const ay = Math.round(a.y) - 9;
      if (a.facing < 0) {
        ctx.translate(ax + CHAR_SPRITE_W, ay);
        ctx.scale(-1, 1);
        ctx.drawImage(this.imgs.characters, 10 * 32, meta.row * 36, 32, 36, 0, 0, 32, 36);
      } else {
        ctx.drawImage(this.imgs.characters, 10 * 32, meta.row * 36, 32, 36, ax, ay, 32, 36);
      }
      ctx.restore();
    }

    const p = world.player;
    if (p.invuln > 0 && this.tick % 6 < 3) return;

    const meta = CHARACTERS[world.state.data.activeChar] || CHARACTERS.carlo;
    let pose = 0;
    if (p.invuln > 45) pose = 12;
    else if (p.victoryTimer > 0) pose = 11;
    else if (p.actionAnim > 0) pose = 10;
    else if (!p.onGround) pose = p.vy < 0 ? 8 : 9;
    else if (Math.abs(p.vx) > 0.25) pose = 4 + (Math.floor(p.walkTimer) % 4);
    else pose = Math.floor(this.tick / 14) % 4;

    const footX = Math.round(p.x + p.w / 2);
    const footY = Math.round(p.y + p.h);

    ctx.save();
    ctx.translate(footX, footY);
    ctx.scale(p.facing * p.scaleX, p.scaleY);
    ctx.drawImage(
      this.imgs.characters,
      pose * CHAR_SPRITE_W,
      meta.row * CHAR_SPRITE_H,
      CHAR_SPRITE_W,
      CHAR_SPRITE_H,
      -CHAR_SPRITE_W / 2,
      -CHAR_SPRITE_H + 2,
      CHAR_SPRITE_W,
      CHAR_SPRITE_H
    );
    ctx.restore();

    if (world.state.data.shield > 0) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
      ctx.strokeRect(Math.round(p.x) - 3, Math.round(p.y) - 3, p.w + 6, p.h + 5);
    }
  }

  drawProjectiles(ctx, world) {
    for (const pr of world.projectiles) {
      const px = Math.round(pr.x);
      const py = Math.round(pr.y);
      if (pr.kind === "basketball") {
        ctx.fillStyle = "#090d1a";
        ctx.fillRect(px - 5, py - 5, 10, 10);
        ctx.fillStyle = "#f97316";
        ctx.fillRect(px - 4, py - 4, 8, 8);
        ctx.fillStyle = "#090d1a";
        ctx.fillRect(px - 4, py, 8, 1);
      } else if (pr.kind === "salsa_wave") {
        // Passo di Salsa di Daniele: anello rosa ritmico che pulsa a tempo
        const pulse = Math.sin(this.tick * 0.35) * 3;
        ctx.strokeStyle = "rgba(244, 114, 182, 0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, (pr.radius || 10) + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(192, 132, 252, 0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, (pr.radius || 10) + 6 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#fbcfe8";
        ctx.fillRect(px - 2, py - 3, 4, 6);
        ctx.fillStyle = "#f472b6";
        ctx.fillRect(px - 1, py - 4, 2, 2);
        ctx.fillRect(px - 1, py + 2, 2, 2);
      } else if (pr.kind === "football") {
        ctx.fillStyle = "#090d1a";
        ctx.fillRect(px - 5, py - 5, 10, 10);
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(px - 4, py - 4, 8, 8);
        ctx.fillStyle = "#090d1a";
        ctx.fillRect(px - 1, py - 1, 3, 3);
      } else if (pr.kind === "music_note") {
        drawPixelText(ctx, "♪", px - 3, py - 4, "#38e2d8", 1);
      } else if (pr.kind === "golden_compass") {
        ctx.fillStyle = "#090d1a";
        ctx.fillRect(px - 5, py - 5, 10, 10);
        ctx.fillStyle = "#fde047";
        ctx.fillRect(px - 4, py - 4, 8, 2);
        ctx.fillRect(px - 4, py - 4, 2, 8);
        ctx.fillRect(px - 2, py - 2, 4, 4);
      } else if (pr.kind === "harmonic_wave") {
        ctx.strokeStyle = "#38e2d8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, pr.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      } else if (pr.kind === "sound_ring") {
        ctx.strokeStyle = "#f472b6";
        ctx.lineWidth = 2;
        ctx.strokeRect(px - 5, py - 7, 10, 14);
        ctx.lineWidth = 1;
      } else if (pr.kind === "enemy_orb") {
        ctx.fillStyle = "#090d1a";
        ctx.fillRect(px - 5, py - 5, 10, 10);
        ctx.fillStyle = "#e879f9";
        ctx.fillRect(px - 4, py - 4, 8, 8);
        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(px - 2, py - 2, 4, 4);
      }
    }
  }
}
