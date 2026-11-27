#!/usr/bin/env bash
# Avvio locale — non installa nulla e non effettua richieste Internet.
set -euo pipefail
cd "$(dirname "$0")"
if [[ -x .venv/bin/python ]]; then PY=.venv/bin/python; else PY=python3; fi
if ! "$PY" -c 'import sys; assert sys.version_info >= (3,11); import flask, PIL, numpy, qrcode, waitress' >/dev/null 2>&1; then
  echo 'Occorrono Python 3.11 o successivo e le dipendenze locali.'
  echo 'Prima installazione (vedi README.md):'
  echo '  python3 -m venv .venv'
  echo '  .venv/bin/python -m pip install -r requirements.txt'
  exit 1
fi
exec "$PY" -m app.server
