// Motore di Rendering Pixel-Art v3.0 del Liceo Classico Statale "A. Casardi" di Barletta
// Fondali 16-bit ad alto contrasto e gerarchia visiva pulita, porte proporzionate ai personaggi 32x36,
// Aula Magna teatrale completa (sipario in velluto, pianoforte a coda scolpito al pixel, busti marmorei, bandiere),
// pozzi con profondità architettonica e font bitmap pixelFont.js nitido al 100%.

import { SCREEN_W, SCREEN_H, TILE, CHARACTERS, CHAR_SPRITE_W, CHAR_SPRITE_H } from "../config/constants.js";
import { drawPixelText, measurePixelText, drawPixelPanel, fitPixelText } from "./pixelFont.js";

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
      // =====================================================================
      // VIALE F. D'ARAGONA 100 — RICOSTRUZIONE DALLE FOTO REALI DEL CASARDI
      // Cielo di Barletta, avancorpo in travertino con le due colonne cilindriche
      // che nascono sopra il tetto, loggia con bandiere IT/UE, portale a due
      // ante di legno con targa "LICEO CLASSICO STATALE A. CASARDI — BARLETTA",
      // gradini d'ingresso, ali ocra con cornice bordeaux, targhe PON e pini.
      // =====================================================================
      const sky = ["#1d4ed8", "#2563eb", "#3b82f6", "#5b9cf8", "#7db4fb", "#a5cdfd"];
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = sky[i];
        ctx.fillRect(0, i * 24, SCREEN_W, 24);
      }
      // Sole alto a destra con alone (come nella foto di giorno)
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fillRect(392, 4, 70, 70);
      ctx.fillStyle = "#fff7d6";
      ctx.fillRect(412, 12, 30, 30);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(418, 16, 18, 18);

      // Nuvole sottili a strati (estate pugliese)
      for (let i = 0; i < 5; i++) {
        const cx = (((i * 158 - Math.round(camX * 0.06)) % 700) + 700) % 700 - 90;
        const cy = 22 + (i % 3) * 15;
        ctx.fillStyle = "rgba(219,234,254,0.85)";
        ctx.fillRect(cx, cy + 7, 56, 4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cx + 3, cy + 3, 48, 5);
        ctx.fillRect(cx + 14, cy - 3, 26, 5);
      }

      for (let rep = -1; rep <= 3; rep++) {
        const bx = rep * 440 - (pxSlow % 440);
        const baseY = 58;

        // ---------------- ALI LATERALI (intonaco ocra + cornice bordeaux) ----------------
        ctx.fillStyle = "#d9bb91";
        ctx.fillRect(bx, baseY + 30, 440, 190);
        // Finto bugnato: righe di intonaco leggermente più scuro
        ctx.fillStyle = "#cfae83";
        for (let lineY = baseY + 52; lineY < baseY + 212; lineY += 22) {
          ctx.fillRect(bx, lineY, 440, 1);
        }
        // Ombra generale in basso (più credibile)
        ctx.fillStyle = "rgba(90,60,30,0.10)";
        ctx.fillRect(bx, baseY + 150, 440, 70);
        // Cornice bordeaux a due fasce + gocciolatoio chiaro
        ctx.fillStyle = "#7c2529";
        ctx.fillRect(bx, baseY + 16, 440, 9);
        ctx.fillStyle = "#9c3a34";
        ctx.fillRect(bx, baseY + 16, 440, 3);
        ctx.fillStyle = "#5c1a1d";
        ctx.fillRect(bx, baseY + 25, 440, 4);
        ctx.fillStyle = "#eee6d4";
        ctx.fillRect(bx, baseY + 29, 440, 2);

        // ---------------- FINESTRE RAZIONALISTE ----------------
        for (const wxOff of [20, 74, 324, 378]) {
          for (const wyOff of [46, 114]) {
            // cornice in travertino chiaro con ombra a destra/basso
            ctx.fillStyle = "#e9e2d3";
            ctx.fillRect(bx + wxOff - 4, baseY + wyOff - 4, 37, 50);
            ctx.fillStyle = "#c6bda9";
            ctx.fillRect(bx + wxOff + 31, baseY + wyOff - 4, 2, 50);
            ctx.fillRect(bx + wxOff - 4, baseY + wyOff + 44, 37, 2);
            // vetro scuro con riflesso del cielo
            ctx.fillStyle = "#16283f";
            ctx.fillRect(bx + wxOff, baseY + wyOff, 29, 42);
            ctx.fillStyle = "#2a4a6b";
            ctx.fillRect(bx + wxOff, baseY + wyOff, 29, 6);
            ctx.fillStyle = "#8fc4f0";
            ctx.fillRect(bx + wxOff + 3, baseY + wyOff + 2, 6, 12);
            // crociera del serramento
            ctx.fillStyle = "#cfd8e3";
            ctx.fillRect(bx + wxOff + 14, baseY + wyOff, 1, 42);
            ctx.fillRect(bx + wxOff, baseY + wyOff + 15, 29, 1);
            ctx.fillRect(bx + wxOff, baseY + wyOff + 29, 29, 1);
            // davanzale
            ctx.fillStyle = "#f1ebe0";
            ctx.fillRect(bx + wxOff - 5, baseY + wyOff + 46, 39, 3);
          }
        }

        // ---------------- AVANCORPO CENTRALE IN TRAVERTINO ----------------
        ctx.fillStyle = "#eae4d6";
        ctx.fillRect(bx + 132, baseY + 2, 176, 212);
        ctx.fillStyle = "#dfd8c8";
        ctx.fillRect(bx + 132, baseY + 2, 176, 4);
        // paramento a lastre (righe orizzontali chiare/scure)
        for (let ly = baseY + 12; ly < baseY + 210; ly += 14) {
          ctx.fillStyle = ly % 28 === 0 ? "#e3ddcd" : "#d8d1c0";
          ctx.fillRect(bx + 132, ly, 176, 1);
        }
        // attacco a terra in pietra più scura
        ctx.fillStyle = "#cfc7b5";
        ctx.fillRect(bx + 132, baseY + 196, 176, 18);

        // ---------------- LOGGIA SUPERIORE CON LE BANDIERE ----------------
        // vano incassato con ombra interna
        ctx.fillStyle = "#b3ab99";
        ctx.fillRect(bx + 176, baseY + 20, 88, 56);
        ctx.fillStyle = "#0f1c2b";
        ctx.fillRect(bx + 180, baseY + 24, 80, 48);
        // vetrata a due ante
        ctx.fillStyle = "#1c3450";
        ctx.fillRect(bx + 180, baseY + 24, 39, 48);
        ctx.fillRect(bx + 221, baseY + 24, 39, 48);
        ctx.fillStyle = "#9fc8ec";
        ctx.fillRect(bx + 183, baseY + 27, 10, 16);
        ctx.fillRect(bx + 224, baseY + 27, 10, 16);
        ctx.fillStyle = "#5f7590";
        ctx.fillRect(bx + 219, baseY + 24, 2, 48);
        // parapetto in travertino davanti alla loggia
        ctx.fillStyle = "#efe9db";
        ctx.fillRect(bx + 176, baseY + 68, 88, 4);
        ctx.fillStyle = "#cdc5b3";
        ctx.fillRect(bx + 176, baseY + 72, 88, 2);
        // aste e bandiere: Tricolore + Europa (attaccate al parapetto, come in foto)
        ctx.fillStyle = "#8c8577";
        ctx.fillRect(bx + 196, baseY + 44, 2, 26);
        ctx.fillRect(bx + 228, baseY + 44, 2, 26);
        ctx.fillStyle = "#0f8a3c";
        ctx.fillRect(bx + 198, baseY + 45, 4, 14);
        ctx.fillStyle = "#f7f9fb";
        ctx.fillRect(bx + 202, baseY + 45, 4, 14);
        ctx.fillStyle = "#d31f26";
        ctx.fillRect(bx + 206, baseY + 45, 4, 14);
        ctx.fillStyle = "#1338a3";
        ctx.fillRect(bx + 230, baseY + 45, 14, 14);
        ctx.fillStyle = "#f7d117";
        for (let sxi = 0; sxi < 3; sxi++) {
          ctx.fillRect(bx + 234 + sxi, baseY + 50 + sxi, 6 - sxi * 2, 1);
        }

        // ---------------- PORTALE MONUMENTALE ----------------
        // cornice in pietra che incornicia il portone
        ctx.fillStyle = "#cfc7b4";
        ctx.fillRect(bx + 170, baseY + 84, 100, 126);
        ctx.fillStyle = "#efe9db";
        ctx.fillRect(bx + 173, baseY + 87, 94, 120);
        // targa marmorea con l'intestazione della scuola (testo centrato e dentro la lastra)
        ctx.fillStyle = "#fbf8f0";
        ctx.fillRect(bx + 164, baseY + 88, 112, 30);
        ctx.fillStyle = "#8d8578";
        ctx.fillRect(bx + 164, baseY + 88, 112, 1);
        ctx.fillStyle = "#c9c1ae";
        ctx.fillRect(bx + 164, baseY + 117, 112, 1);
        const plaqueLines = ["LICEO CLASSICO", "A. CASARDI", "BARLETTA"];
        plaqueLines.forEach((line, li) => {
          const lw = measurePixelText(line, 1);
          drawPixelText(ctx, line, bx + 220 - Math.round(lw / 2), baseY + 91 + li * 8, "#233043", 1, null);
        });

        // portone di legno a due ante (noce scuro, come nelle foto)
        ctx.fillStyle = "#3b2417";
        ctx.fillRect(bx + 178, baseY + 120, 84, 88);
        ctx.fillStyle = "#2a190f";
        ctx.fillRect(bx + 178, baseY + 120, 84, 3);
        for (const doorX of [bx + 180, bx + 222]) {
          ctx.fillStyle = "#4a2d1c";
          ctx.fillRect(doorX, baseY + 123, 40, 83);
          // pannelli e vetrata superiore di ogni anta
          ctx.fillStyle = "#1c1917";
          ctx.fillRect(doorX + 4, baseY + 126, 32, 24);
          ctx.fillStyle = "#4f6b8a";
          ctx.fillRect(doorX + 5, baseY + 127, 30, 22);
          ctx.fillStyle = "#7ea0c4";
          ctx.fillRect(doorX + 7, baseY + 129, 8, 16);
          ctx.fillStyle = "#3d2415";
          ctx.fillRect(doorX + 4, baseY + 154, 32, 20);
          ctx.fillStyle = "#57331f";
          ctx.fillRect(doorX + 6, baseY + 156, 28, 16);
          ctx.fillStyle = "#3d2415";
          ctx.fillRect(doorX + 4, baseY + 178, 32, 24);
          ctx.fillStyle = "#57331f";
          ctx.fillRect(doorX + 6, baseY + 180, 28, 20);
          // maniglia dorata
          ctx.fillStyle = "#d9b45a";
          ctx.fillRect(doorX + (doorX === bx + 180 ? 33 : 6), baseY + 160, 2, 4);
        }
        ctx.fillStyle = "#1b100a";
        ctx.fillRect(bx + 219, baseY + 122, 2, 84);

        // ---------------- LE DUE COLONNE CILINDRICHE (firma dell'edificio) ----------------
        for (const colX of [bx + 132, bx + 268]) {
          const w = 40;
          // ombra portata dietro la colonna
          ctx.fillStyle = "rgba(90,70,40,0.18)";
          ctx.fillRect(colX + w, baseY + 4, 6, 208);
          // fusto con modulazione cilindrica a 5 fasce
          ctx.fillStyle = "#c4bcaa";
          ctx.fillRect(colX, baseY - 14, w, 220);
          ctx.fillStyle = "#ded8c9";
          ctx.fillRect(colX + 4, baseY - 14, w - 8, 220);
          ctx.fillStyle = "#efeade";
          ctx.fillRect(colX + 10, baseY - 14, 18, 220);
          ctx.fillStyle = "#fbf9f2";
          ctx.fillRect(colX + 14, baseY - 14, 8, 220);
          // giunti dei rocchi
          ctx.fillStyle = "#cec6b4";
          for (let cy = baseY + 2; cy < baseY + 196; cy += 16) {
            ctx.fillRect(colX + 4, cy, w - 8, 1);
          }
          // blocchi scultorei sopra il tetto (le "torri" delle foto)
          ctx.fillStyle = "#e6e0d2";
          ctx.fillRect(colX + 8, baseY - 26, 24, 26);
          ctx.fillStyle = "#f4f0e6";
          ctx.fillRect(colX + 11, baseY - 26, 12, 26);
          ctx.fillStyle = "#a79e8c";
          ctx.fillRect(colX + 8, baseY - 26, 24, 2);
          ctx.fillStyle = "#b9b1a0";
          ctx.fillRect(colX + 30, baseY - 26, 2, 26);
        }

        // ---------------- BALCONCINI CON RINGHIERA SOTTO LE FINESTRE DEL PRIMO PIANO ----------------
        for (const wxOff of [20, 74, 324, 378]) {
          const rx = bx + wxOff - 3;
          // soletta in pietra
          ctx.fillStyle = "#e6e0d2";
          ctx.fillRect(rx, baseY + 90, 37, 3);
          ctx.fillStyle = "#b9b1a0";
          ctx.fillRect(rx, baseY + 93, 37, 1);
          // ringhiera a bacchette
          ctx.fillStyle = "#3a3530";
          ctx.fillRect(rx, baseY + 96, 37, 1);
          ctx.fillRect(rx, baseY + 106, 37, 1);
          for (let rb = 0; rb < 7; rb++) {
            ctx.fillRect(rx + 2 + rb * 6, baseY + 96, 1, 11);
          }
        }

        // ---------------- BACHECA DELLA SCUOLA ACCANTO AL PORTALE ----------------
        ctx.fillStyle = "#5b3a24";
        ctx.fillRect(bx + 296, baseY + 140, 40, 30);
        ctx.fillStyle = "#8a5f3d";
        ctx.fillRect(bx + 297, baseY + 141, 38, 28);
        ctx.fillStyle = "#f6f1e3";
        ctx.fillRect(bx + 300, baseY + 144, 15, 11);
        ctx.fillRect(bx + 318, baseY + 144, 14, 9);
        ctx.fillRect(bx + 300, baseY + 158, 22, 9);
        ctx.fillStyle = "#c0b9a6";
        ctx.fillRect(bx + 303, baseY + 147, 9, 1);
        ctx.fillRect(bx + 303, baseY + 150, 7, 1);
        ctx.fillRect(bx + 321, baseY + 147, 8, 1);

        // ---------------- TARGHE ISTITUZIONALI AI LATI DEL PORTALE ----------------
        const plates = [
          [bx + 150, 96, "#1d4ed8", "#f8fafc"],
          [bx + 150, 112, "#eab308", "#1f2937"],
          [bx + 292, 96, "#0e7490", "#f8fafc"],
          [bx + 292, 112, "#16a34a", "#f8fafc"],
        ];
        for (const [px0, py0, c1, c2] of plates) {
          ctx.fillStyle = "#f4efe2";
          ctx.fillRect(bx + (px0 - bx), baseY + py0 - 1, 18, 13);
          ctx.fillStyle = c1;
          ctx.fillRect(bx + (px0 - bx), baseY + py0, 16, 11);
          ctx.fillStyle = c2;
          ctx.fillRect(bx + (px0 - bx) + 2, baseY + py0 + 3, 12, 1);
          ctx.fillRect(bx + (px0 - bx) + 2, baseY + py0 + 6, 9, 1);
        }

        // ---------------- GRADINI D'INGRESSO ----------------
        ctx.fillStyle = "#b8b2a2";
        ctx.fillRect(bx + 158, baseY + 208, 124, 8);
        ctx.fillStyle = "#d3cdbe";
        ctx.fillRect(bx + 158, baseY + 208, 124, 3);
        ctx.fillStyle = "#cdc6b6";
        ctx.fillRect(bx + 150, baseY + 216, 140, 8);
        ctx.fillStyle = "#e2ddd0";
        ctx.fillRect(bx + 150, baseY + 216, 140, 3);
      }

      // ---------------- MARCIAPIEDE, CANCELLO E PRIMO PIANO ----------------
      ctx.fillStyle = "#b9b4a6";
      ctx.fillRect(0, 232, SCREEN_W, 6);
      ctx.fillStyle = "#a29d90";
      ctx.fillRect(0, 238, SCREEN_W, 2);

      // Pini marittimi e alberi del viale: chiome a strati con luce dal cielo
      for (let p = -1; p <= 3; p++) {
        const tx = p * 440 - (pxMid % 440) + 8;
        // tronco con corteccia
        ctx.fillStyle = "#4a3222";
        ctx.fillRect(tx + 24, 132, 9, 108);
        ctx.fillStyle = "#2e1e14";
        ctx.fillRect(tx + 29, 132, 4, 108);
        ctx.fillStyle = "#5c3f2b";
        ctx.fillRect(tx + 25, 140, 2, 60);
        // chioma a 4 strati
        ctx.fillStyle = "#0f3d22";
        ctx.fillRect(tx - 10, 118, 74, 26);
        ctx.fillStyle = "#14532d";
        ctx.fillRect(tx - 4, 106, 62, 22);
        ctx.fillStyle = "#166534";
        ctx.fillRect(tx + 4, 96, 48, 18);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(tx + 12, 90, 30, 10);
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(tx + 18, 88, 14, 4);
      }
      // Ramo d'albero in primo piano (dà profondità, come nella foto dal basso)
      ctx.fillStyle = "#12341f";
      ctx.fillRect(0, 0, 26, 4);
      ctx.fillRect(0, 4, 12, 3);
      ctx.fillStyle = "#1c4a2c";
      for (let k = 0; k < 9; k++) {
        ctx.fillRect(18 + k * 7, 6 + (k % 3) * 3, 6, 2);
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

          // Cornice con BUSTO CLASSICO (il Casardi è un liceo classico: marmo, non poster anonimi)
          ctx.fillStyle = "#5c3422";
          ctx.fillRect(dx + 96, 58, 54, 42);
          ctx.fillStyle = "#f5efe0";
          ctx.fillRect(dx + 99, 61, 48, 36);
          ctx.fillStyle = "#e8e1cf";
          ctx.fillRect(dx + 101, 63, 44, 32);
          // nicchia con ombra
          ctx.fillStyle = "#d6cdb8";
          ctx.fillRect(dx + 107, 66, 32, 26);
          // testa e spalle del busto in marmo
          ctx.fillStyle = "#f8f6ef";
          ctx.fillRect(dx + 117, 69, 12, 12);
          ctx.fillRect(dx + 113, 80, 20, 10);
          ctx.fillStyle = "#cfc7b2";
          ctx.fillRect(dx + 117, 80, 12, 3);
          ctx.fillRect(dx + 129, 70, 2, 11);
          ctx.fillStyle = "#9c9484";
          ctx.fillRect(dx + 118, 73, 2, 2);
          ctx.fillRect(dx + 125, 73, 2, 2);
          // basamento della nicchia
          ctx.fillStyle = "#b7ae9a";
          ctx.fillRect(dx + 107, 90, 32, 2);

          // TERMOSIFONO A PARETE (elemento vero dei corridoi italiani)
          ctx.fillStyle = "#d9d6cc";
          ctx.fillRect(dx + 58, 208, 40, 26);
          ctx.fillStyle = "#eeece4";
          ctx.fillRect(dx + 59, 209, 38, 24);
          ctx.fillStyle = "#c3c0b5";
          for (let fin = 0; fin < 8; fin++) {
            ctx.fillRect(dx + 61 + fin * 4, 211, 2, 20);
          }
          ctx.fillStyle = "#b3b0a6";
          ctx.fillRect(dx + 58, 232, 40, 2);

          // ombra di appoggio del termosifone e zoccolatura
          ctx.fillStyle = "rgba(70,50,20,0.13)";
          ctx.fillRect(dx + 56, 234, 44, 5);

          // v3.1 — DETTAGLI VERI DEL CORRIDOIO DEL CASARDI:
          // colonnina con fontanella (quelle di inizio Novecento), cestino,
          // e una bacheca di istituto con l'avviso dell'Open Day.
          // ⚠️ qui NON si può usare `dx % 2`: dx = i*192 - (pxSlow % 192) + 28
          // cambia parità ad ogni pixel di cammino e faceva lampeggiare gli
          // arredi (fontanella/cestino si scambiavano ad ogni frame).
          // La chiave stabile è il pilastro nel mondo: worldCol = i - floor(pxSlow/192)
          const worldCol = i + Math.floor(pxSlow / 192);
          if (!(worldCol % 2)) {
            // Fontanella a muro in ghisa (resta sopra il battiscopa, y 150-196)
            ctx.fillStyle = "#8f9aa8";
            ctx.fillRect(dx + 62, 154, 13, 36); // fusto
            ctx.fillStyle = "#c3ccd6";
            ctx.fillRect(dx + 63, 155, 11, 34); // luce sul fusto
            ctx.fillStyle = "#e2e8f0";
            ctx.fillRect(dx + 59, 188, 19, 8); // vasca
            ctx.fillStyle = "#64748b";
            ctx.fillRect(dx + 59, 194, 19, 2); // bordo vasca
            ctx.fillStyle = "#475569";
            ctx.fillRect(dx + 66, 146, 4, 9); // rubinetto a colonna
            ctx.fillStyle = "#94a3b8";
            ctx.fillRect(dx + 66, 146, 9, 3);
            ctx.fillStyle = "rgba(56,189,248,0.55)";
            ctx.fillRect(dx + 69, 160, 1, 6); // filo d'acqua
          } else {
            // Cestino portarifiuti a pedale accanto alla porta (appoggiato a terra)
            ctx.fillStyle = "#2f3a4a";
            ctx.fillRect(dx + 60, 176, 15, 21);
            ctx.fillStyle = "#3f4c5f";
            ctx.fillRect(dx + 61, 177, 13, 5);
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(dx + 62, 183, 11, 12);
            ctx.fillStyle = "#64748b";
            ctx.fillRect(dx + 64, 195, 7, 2); // pedale
          }

          // BACHECA DI ISTITUTO: vetro, cornice di legno e avvisi spillati
          // (comunicazioni vere, non decorazioni: Open Day, PON, sportello).
          // Non su ogni campata: una ogni tre, come in un corridoio vero.
          if (worldCol % 3 === 0) {
          ctx.fillStyle = "#5b3a24";
          ctx.fillRect(dx + 98, 118, 46, 62);
          ctx.fillStyle = "#8a5f3d";
          ctx.fillRect(dx + 99, 119, 44, 60);
          ctx.fillStyle = "#f6f1e3";
          ctx.fillRect(dx + 102, 122, 38, 54);
          // avviso OPEN DAY
          ctx.fillStyle = "#1d4ed8";
          ctx.fillRect(dx + 105, 125, 32, 12);
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(dx + 107, 128, 22, 2);
          ctx.fillRect(dx + 107, 132, 16, 2);
          // volantino sportivo
          ctx.fillStyle = "#fde047";
          ctx.fillRect(dx + 105, 141, 15, 14);
          ctx.fillStyle = "#16a34a";
          ctx.fillRect(dx + 106, 156, 15, 1);
          ctx.fillStyle = "#14532d";
          ctx.fillRect(dx + 109, 143, 7, 7);
          // comunicato PON
          ctx.fillStyle = "#e2e8f0";
          ctx.fillRect(dx + 123, 141, 15, 20);
          ctx.fillStyle = "#94a3b8";
          for (let ln = 0; ln < 5; ln++) ctx.fillRect(dx + 125, 144 + ln * 3, 11, 1);
          // riflesso del vetro
          ctx.fillStyle = "rgba(255,255,255,0.28)";
          ctx.fillRect(dx + 102, 122, 8, 54);
          }

          // CONO DI LUCE della plafoniera sul pavimento
          const glow = ctx.createLinearGradient(0, 150, 0, 250);
          glow.addColorStop(0, "rgba(255,250,220,0.22)");
          glow.addColorStop(1, "rgba(255,250,220,0)");
          ctx.fillStyle = glow;
          ctx.fillRect(dx + 8, 150, 80, 100);

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
        // §4.3: nessun taglio a metà parola: il cartello va a capo entro i 106 px del pannello
        fitPixelText(dec.label || "LIM CASARDI", 104, 2, 1).forEach((ln, li) => {
          drawPixelText(ctx, ln, dec.x + 7, dec.y - 55 + li * 9, "#fef08a", 1, null);
        });
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
    drawPixelText(ctx, fitPixelText(txt, SCREEN_W - 36, 1, 1)[0], bx + 8, by + 5, "#fef08a", 1);
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
      // v3.1.1 — ogni sfida ha il suo colore E la sua etichetta: prima le nuove
      // sfide (greco, latino, storia, calcio, operazioni a tempo) cadevano tutte
      // nel caso di default e si presentavano come "MAT".
      const STATION_STYLE = {
        basket: { col: "#f97316", tag: "BSK" },
        piano: { col: "#38e2d8", tag: "KEY" },
        athletics: { col: "#f45565", tag: "RUN" },
        football: { col: "#f45565", tag: "RUN" },
        dance: { col: "#f472b6", tag: "DAN" },
        netdiag: { col: "#f472b6", tag: "DAN" },
        firewall: { col: "#a855f7", tag: "FW!" },
        filesorter: { col: "#22d3ee", tag: "SSD" },
        math: { col: "#ffd147", tag: "MAT" },
        mathsprint: { col: "#fbbf24", tag: "CALC" },
        soccer: { col: "#4ade80", tag: "GOL" },
        greek: { col: "#38bdf8", tag: "GRK" },
        latin: { col: "#f472b6", tag: "LAT" },
        history: { col: "#fde047", tag: "STO" },
      };
      const style = STATION_STYLE[mg.mgType] || { col: "#ffd147", tag: "MAT" };
      const col = style.col;
      drawPixelPanel(ctx, mg.x - 3, mg.y - 10, 28, 28, "#0f172a", mg.done ? "#22c55e" : col, "#1e293b");
      drawPixelText(ctx, mg.done ? "OK!" : style.tag, mg.x + 1, mg.y, mg.done ? "#4ade80" : col, 1);
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
