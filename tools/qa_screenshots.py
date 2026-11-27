#!/usr/bin/env python3
"""
QA visivo v3.0 — apre le build standalone reali in Chromium headless e scatta
screenshot multi-risoluzione, verificando console error e presenza del canvas.

Uso:
  python3 tools/qa_screenshots.py
Output: assets/sprites/qa_v3/*.png + report a video
"""
import os
import sys
import json

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sprites", "qa_v3")
os.makedirs(OUT, exist_ok=True)

PC_BUILD = os.path.join(ROOT, "AVVIA_GIOCO_PC_V3.html")
MOBILE_BUILD = os.path.join(ROOT, "AVVIA_GIOCO_MOBILE_V3.html")

VIEWPORTS = [
    ("mobile_360x800", 360, 800, MOBILE_BUILD, True),
    ("mobile_390x844", 390, 844, MOBILE_BUILD, True),
    ("mobile_412x915", 412, 915, MOBILE_BUILD, True),
    ("mobile_landscape_844x390", 844, 390, MOBILE_BUILD, True),
    ("tablet_768x1024", 768, 1024, MOBILE_BUILD, True),
    ("pc_1366x768", 1366, 768, PC_BUILD, False),
    ("pc_1920x1080", 1920, 1080, PC_BUILD, False),
]

results = []


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"])

        for name, w, h, build, is_mobile in VIEWPORTS:
            ctx = browser.new_context(
                viewport={"width": w, "height": h},
                device_scale_factor=1,
                is_mobile=is_mobile,
                has_touch=is_mobile,
            )
            page = ctx.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

            url = "file://" + build
            page.goto(url, wait_until="load")
            page.wait_for_timeout(1600)

            # Avvia la modalità Open Day cliccando il pulsante (via API esposta)
            started = page.evaluate(
                """() => {
                    const app = window.__CASARDI_GAME__;
                    if (!app) return false;
                    try { app.audio.unlock(); } catch (e) {}
                    app.startMode('openday', false);
                    return !!app.world;
                }"""
            )
            page.wait_for_timeout(1800)

            info = page.evaluate(
                """() => {
                    const app = window.__CASARDI_GAME__;
                    const c = document.getElementById('game-canvas');
                    return {
                        hasApp: !!app,
                        scene: app ? app.scene : null,
                        bp: app && app.world ? app.world.bp.id : null,
                        activeChar: app && app.state ? app.state.data.activeChar : null,
                        unlocked: app && app.state ? app.state.data.unlockedChars.slice() : [],
                        canvasW: c ? c.width : 0,
                        canvasH: c ? c.height : 0,
                        bodyClass: document.body.className,
                        touchDeckVisible: !!document.getElementById('touch-deck') &&
                            getComputedStyle(document.getElementById('touch-deck')).display !== 'none',
                        heroPills: Array.from(document.querySelectorAll('.hero-pill')).map(p => p.getAttribute('data-char')),
                    };
                }"""
            )

            shot = os.path.join(OUT, f"{name}.png")
            page.screenshot(path=shot, full_page=False)
            results.append(
                {
                    "name": name,
                    "viewport": [w, h],
                    "started": started,
                    "scene": info.get("scene"),
                    "bp": info.get("bp"),
                    "activeChar": info.get("activeChar"),
                    "unlocked": info.get("unlocked"),
                    "canvas": [info.get("canvasW"), info.get("canvasH")],
                    "touchDeckVisible": info.get("touchDeckVisible"),
                    "heroPills": info.get("heroPills"),
                    "errors": errors[:6],
                    "screenshot": shot,
                    "bytes": os.path.getsize(shot),
                }
            )
            ctx.close()

        browser.close()


if __name__ == "__main__":
    run()
    ok = True
    print("\n=== QA VISIVO MULTI-RISOLUZIONE v3.0 ===")
    for r in results:
        bad = []
        if not r["started"]:
            bad.append("non avviato")
        if r["scene"] != "playing":
            bad.append(f"scene={r['scene']}")
        if r["canvas"] != [480, 270]:
            bad.append(f"canvas={r['canvas']}")
        if r["errors"]:
            bad.append(f"{len(r['errors'])} errori console")
        if r["bytes"] < 20000:
            bad.append("screenshot sospetto (troppo piccolo)")
        status = "OK " if not bad else "KO "
        if bad:
            ok = False
        print(
            f"  [{status}] {r['name']:<26} {r['viewport'][0]}x{r['viewport'][1]:<5} "
            f"scena={r['scene']} mappa={r['bp']} eroe={r['activeChar']} "
            f"touch={r['touchDeckVisible']} shot={r['bytes']//1024}KB"
        )
        if bad:
            print(f"         problemi: {', '.join(bad)}")
            for e in r["errors"]:
                print(f"         ! {e[:160]}")

    with open(os.path.join(OUT, "report.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nScreenshot e report in: {OUT}")
    sys.exit(0 if ok else 1)
