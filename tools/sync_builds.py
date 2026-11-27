#!/usr/bin/env python3
"""
Sincronizza TUTTE le build del gioco con un solo comando (§2.7 della review esterna).

Prima esistevano 7 file HTML per lo stesso gioco, copiati a mano in `docs/` e `release/`:
bastava dimenticarne uno perché GitHub Pages servisse una versione vecchia. Ora c'è
un'unica sorgente (index.html + src/) e questo script rigenera e ricopia tutto:

  python3 tools/sync_builds.py

Output:
  release/index.html, AVVIA_GIOCO.html        (build standalone 100% offline)
  AVVIA_GIOCO_PC_V3.html                      (layout desktop / kiosk)
  AVVIA_GIOCO_MOBILE_V3.html                  (controlli touch sempre attivi)
  docs/index.html, docs/AVVIA_GIOCO_PC_V3.html, docs/AVVIA_GIOCO_MOBILE_V3.html
  VERSIONE_PC.html, VERSIONE_TELEFONO.html    (nomi legacy, stesse build)
"""

import filecmp
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))

import build as build_mod  # noqa: E402


COPIES = [
    ("release/index.html", "docs/index.html"),
    ("AVVIA_GIOCO.html", "release/index.html"),
    ("AVVIA_GIOCO_PC_V3.html", "docs/AVVIA_GIOCO_PC_V3.html"),
    ("AVVIA_GIOCO_MOBILE_V3.html", "docs/AVVIA_GIOCO_MOBILE_V3.html"),
]


def main():
    build_mod.build_bundle()
    for src, dst in COPIES:
        s = os.path.join(ROOT, src)
        d = os.path.join(ROOT, dst)
        os.makedirs(os.path.dirname(d), exist_ok=True)
        shutil.copyfile(s, d)
    # verifica: nessuna copia divergente
    bad = []
    for src, dst in COPIES:
        if not filecmp.cmp(os.path.join(ROOT, src), os.path.join(ROOT, dst), shallow=False):
            bad.append(f"{src} != {dst}")
    if bad:
        print("COPIE DIVERGENTI:")
        for b in bad:
            print("  " + b)
        sys.exit(1)
    print("\nTutte le build sono sincronizzate (md5 identico a coppie).")


if __name__ == "__main__":
    main()
