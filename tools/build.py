#!/usr/bin/env python3
"""
Compilatore Build Standalone Offline per "OPERAZIONE EIPASS — IL CASARDI IN 8 BIT".

Assembla i moduli ES6 puliti in `src/` in una build eseguibile autonoma 100% offline:
  - release/index.html    (eseguibile in qualsiasi browser anche con doppio clic da file:// senza server!)
  - AVVIA_GIOCO.html      (copia rapida nella radice del progetto per l'operatore Open Day)
  - avvia_open_day.sh     (launcher Linux/macOS)
  - AVVIA_OPEN_DAY.bat    (launcher Windows a doppio clic)
"""

import os
import re
import stat

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_DIR = os.path.join(ROOT, "release")
os.makedirs(BUILD_DIR, exist_ok=True)

# Ordine topologico dei moduli sorgente
MODULE_ORDER = [
    "src/config/constants.js",
    "src/state/gameState.js",
    "src/assets/embeddedSprites.js",
    "src/audio/chiptuneEngine.js",
    "src/config/input.js",
    "src/render/pixelFont.js",
    "src/narrative/eipassQuiz.js",
    "src/narrative/dialogues.js",
    "src/minigames/specialChallenges.js",
    "src/levels/levelBuilder.js",
    "src/levels/levelsData.js",
    "src/engine/world.js",
    "src/render/renderer.js",
    "src/ui/hudAndMenus.js",
    "src/main.js",
]


def strip_esm_syntax(code):
    # Rimuove dichiarazioni import multi-linea o singola linea
    code = re.sub(r"^\s*import\s+[\s\S]*?from\s+['\"].*?['\"];?\s*$", "", code, flags=re.MULTILINE)
    # Converte `export class/function/const` in `class/function/const`
    code = re.sub(r"^\s*export\s+(class|function|const|let|var)\s+", r"\1 ", code, flags=re.MULTILINE)
    return code


def build_bundle():
    parts = ["(function() {\n'use strict';\n"]
    for rel in MODULE_ORDER:
        full = os.path.join(ROOT, rel)
        with open(full, "r", encoding="utf-8") as f:
            raw = f.read()
        cleaned = strip_esm_syntax(raw)
        parts.append(f"\n// === MODULE: {rel} ===\n{cleaned}\n")
    parts.append("\n})();\n")
    bundle_js = "".join(parts)

    with open(os.path.join(ROOT, "index.html"), "r", encoding="utf-8") as f:
        html = f.read()

    standalone_html = html.replace(
        '<script type="module" src="./src/main.js"></script>',
        f"<script>\n{bundle_js}\n</script>"
    )

    out_build = os.path.join(BUILD_DIR, "index.html")
    out_root = os.path.join(ROOT, "AVVIA_GIOCO.html")
    out_pc = os.path.join(ROOT, "VERSIONE_PC.html")
    out_mobile = os.path.join(ROOT, "VERSIONE_TELEFONO.html")
    out_pc_v3 = os.path.join(ROOT, "AVVIA_GIOCO_PC_V3.html")
    out_mobile_v3 = os.path.join(ROOT, "AVVIA_GIOCO_MOBILE_V3.html")

    # Versione PC dedicata (sempre layout Desktop/Kiosk pulito di default)
    pc_html = standalone_html.replace(
        "let manualTouchOverride = null;",
        "let manualTouchOverride = false;"
    ).replace(
        "<title>OPERAZIONE EIPASS — Il Casardi in 8 Bit</title>",
        "<title>OPERAZIONE EIPASS — Il Casardi in 8 Bit (Versione PC)</title>"
    )

    # Versione Telefono dedicata (sempre Console Touch Handheld attiva fin dal primo istante)
    mobile_html = standalone_html.replace(
        "<body>",
        '<body class="touch-enabled">'
    ).replace(
        "let manualTouchOverride = null;",
        "let manualTouchOverride = true;"
    ).replace(
        "<title>OPERAZIONE EIPASS — Il Casardi in 8 Bit</title>",
        "<title>OPERAZIONE EIPASS — Il Casardi in 8 Bit (Versione Telefono)</title>"
    )

    with open(out_build, "w", encoding="utf-8") as f:
        f.write(standalone_html)
    with open(out_root, "w", encoding="utf-8") as f:
        f.write(standalone_html)
    with open(out_pc, "w", encoding="utf-8") as f:
        f.write(pc_html)
    with open(out_mobile, "w", encoding="utf-8") as f:
        f.write(mobile_html)

    # ---------------------------------------------------------------------
    # BUILD UFFICIALI v3.0 (Notturno) — PC e Mobile dedicati
    # ---------------------------------------------------------------------
    pc_v3_html = pc_html.replace(
        "<title>OPERAZIONE EIPASS — Il Casardi in 8 Bit (Versione PC)</title>",
        "<title>OPERAZIONE EIPASS v3.0 — Il Casardi in 8 Bit (PC / Open Day)</title>"
    )
    mobile_v3_html = mobile_html.replace(
        "<title>OPERAZIONE EIPASS — Il Casardi in 8 Bit (Versione Telefono)</title>",
        "<title>OPERAZIONE EIPASS v3.0 — Il Casardi in 8 Bit (Telefono / Touch)</title>"
    )
    with open(out_pc_v3, "w", encoding="utf-8") as f:
        f.write(pc_v3_html)
    with open(out_mobile_v3, "w", encoding="utf-8") as f:
        f.write(mobile_v3_html)

    # Crea script launcher rapidi per Windows e Linux/macOS
    bat_path = os.path.join(ROOT, "AVVIA_OPEN_DAY.bat")
    with open(bat_path, "w", encoding="utf-8") as f:
        f.write('@echo off\r\necho Avvio di OPERAZIONE EIPASS - Il Casardi in 8 Bit...\r\nstart "" "%~dp0AVVIA_GIOCO.html"\r\n')

    sh_path = os.path.join(ROOT, "avvia_open_day.sh")
    with open(sh_path, "w", encoding="utf-8") as f:
        f.write('#!/usr/bin/env bash\nDIR="$(cd "$(dirname "$0")" && pwd)"\nif command -v xdg-open >/dev/null 2>&1; then xdg-open "$DIR/AVVIA_GIOCO.html"; elif command -v open >/dev/null 2>&1; then open "$DIR/AVVIA_GIOCO.html"; else python3 -m http.server 8080 --directory "$DIR"; fi\n')
    os.chmod(sh_path, os.stat(sh_path).st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)

    print(f"Build completata: {out_build} ({len(standalone_html) // 1024} KB)")
    print(f"  PC v3.0     : {out_pc_v3} ({len(pc_v3_html) // 1024} KB)")
    print(f"  Mobile v3.0 : {out_mobile_v3} ({len(mobile_v3_html) // 1024} KB)")


if __name__ == "__main__":
    build_bundle()
