#!/usr/bin/env python3
"""
Cattura schermate di gioco reali v3.0 (non solo il title/OD-1):
  - Minigioco DANZA di Daniele (fase dancing + fase combo)
  - Minigioco ATLETICA di Ruggero (corsa ostacoli)
  - HUD a 5 eroi con Daniele attivo
  - Dialogo di incontro con Daniele

Uso: python3 tools/qa_minigame_shots.py
Output: assets/sprites/qa_v3/mg_*.png
"""
import os
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sprites", "qa_v3")
os.makedirs(OUT, exist_ok=True)
BUILD = os.path.join(ROOT, "AVVIA_GIOCO_PC_V3.html")

SHOTS = []


def shot(page, name):
    p = os.path.join(OUT, f"{name}.png")
    page.screenshot(path=p)
    SHOTS.append((name, os.path.getsize(p)))
    return p


with sync_playwright() as pw:
    browser = pw.chromium.launch(args=["--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"])
    ctx = browser.new_context(viewport={"width": 1024, "height": 640}, device_scale_factor=2)
    page = ctx.new_page()
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto("file://" + BUILD, wait_until="load")
    page.wait_for_timeout(1200)

    # Avvia Open Day e chiudi il dialogo iniziale
    page.evaluate("""() => {
        const app = window.__CASARDI_GAME__;
        app.audio.unlock();
        app.startMode('openday', false);
        if (app.activeDialogue) app.activeDialogue = null;
    }""")
    page.wait_for_timeout(600)

    # --- HUD a 5 eroi con Daniele attivo ---
    page.evaluate("""() => {
        const app = window.__CASARDI_GAME__;
        app.state.data.unlockedChars = ['ranaldo','carlo','daniele','ruggero','francesco'];
        app.state.data.activeChar = 'daniele';
        app.activeDialogue = null;
    }""")
    page.wait_for_timeout(500)
    shot(page, "mg_01_hud_daniele")

    # --- Abilità Passo di Salsa in azione ---
    page.evaluate("""() => {
        const app = window.__CASARDI_GAME__;
        app.world.triggerCharacterAbility('special');
    }""")
    page.wait_for_timeout(220)
    shot(page, "mg_02_salsa_ability")

    # --- Minigioco DANZA: fase dancing ---
    page.evaluate("""() => {
        const app = window.__CASARDI_GAME__;
        app.minigames.start('dance', { id: 'shot_dance', title: 'DANIELE — SALSA CUBANA IN AULA MAGNA' }, () => {});
        const m = app.minigames.active;
        m.readyTimer = 1;
    }""")
    page.wait_for_timeout(300)
    page.evaluate("""() => {
        const app = window.__CASARDI_GAME__;
        const m = app.minigames.active;
        m.phase = 'dancing';
        m.stepIdx = 1;
        m.comboResults = ['ok'];
        m.crowd = 62;
        m.msg = 'RIPETI LA SEQUENZA: segui le frecce a tempo!';
    }""")
    page.wait_for_timeout(320)
    shot(page, "mg_03_dance_dancing")

    # --- Minigioco DANZA: fase combo / pubblico in festa ---
    page.evaluate("""() => {
        const app = window.__CASARDI_GAME__;
        const m = app.minigames.active;
        m.phase = 'combo';
        m.comboResults = ['ok','ok','ok','ok'];
        m.crowd = 92;
        m.flashColor = '#f472b6';
        m.flashTimer = 8;
    }""")
    page.wait_for_timeout(200)
    shot(page, "mg_04_dance_combo")
    page.evaluate("() => { window.__CASARDI_GAME__.minigames.active = null; }")

    # --- Minigioco ATLETICA di Ruggero in corsa ---
    page.evaluate("""() => {
        const app = window.__CASARDI_GAME__;
        app.state.data.activeChar = 'ruggero';
        app.minigames.start('athletics', { id: 'shot_ath', title: 'RUGGERO — 110m OSTACOLI' }, () => {});
        const m = app.minigames.active;
        m.countdown = 0;
        m.phase = 'running';
        m.pos = 34;
        m.speed = 0.22;
        m.jumpY = 16;
        m.jumpVy = 1.2;
        m.hurdles[0].state = 'cleared';
        m.cleanHurdles = 1;
        m.msg = 'OSTACOLO PULITO (1/4)! Ottimo stacco!';
    }""")
    page.wait_for_timeout(400)
    shot(page, "mg_05_athletics_running")
    page.evaluate("() => { window.__CASARDI_GAME__.minigames.active = null; }")

    # --- Dialogo di incontro con Daniele ---
    page.evaluate("""() => {
        const app = window.__CASARDI_GAME__;
        app.startDialogue ? app.startDialogue('od_meet_daniele') : app.dialogue.start('od_meet_daniele');
    }""")
    page.wait_for_timeout(900)
    shot(page, "mg_06_dialogue_daniele")

    print("\n=== SCHERMATE MINIGIOCHI v3.0 ===")
    for n, b in SHOTS:
        print(f"  OK  {n:<26} {b // 1024}KB")
    if errs:
        print("\nErrori JS:")
        for e in errs[:8]:
            print("  !", e[:200])
    else:
        print("\nNessun errore JavaScript.")
    browser.close()
