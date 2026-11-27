#!/usr/bin/env bash
DIR="$(cd "$(dirname "$0")" && pwd)"
if command -v xdg-open >/dev/null 2>&1; then xdg-open "$DIR/AVVIA_GIOCO.html"; elif command -v open >/dev/null 2>&1; then open "$DIR/AVVIA_GIOCO.html"; else python3 -m http.server 8080 --directory "$DIR"; fi
