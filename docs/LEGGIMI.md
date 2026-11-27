# Build standalone (GitHub Pages)

`index.html` in questa cartella è la build **standalone** del gioco (**v3.1.0**): si apre e si gioca,
nessuna dipendenza esterna, nessun server richiesto.

- `AVVIA_GIOCO_PC_V3.html` — versione per computer (tastiera, barra kiosk).
- `AVVIA_GIOCO_MOBILE_V3.html` — versione per telefono/tablet (controller touch attivo all'avvio).

Sorgente completo, documentazione e suite di QA nella radice del repository.

## Controlli essenziali

`Frecce/AD` muovi · `Spazio` salta · `X` abilità · `C` assist · `E` interagisci · `1`-`5`/`Q` eroe ·
`P`/`ESC` pausa (da lì anche **Sfide Libere**) · `M` audio · `V` filtro CRT · `Y` schermo intero · `F1`/`?` guida · `F9` reset postazione.

## Build sincronizzate

`AVVIA_GIOCO.html`, `release/index.html`, `docs/index.html`, `AVVIA_GIOCO_PC_V3.html` e
`AVVIA_GIOCO_MOBILE_V3.html` sono generate da **un unico comando**:

```bash
python3 tools/sync_builds.py
```

(richiama `tools/build.py` e ricopia le build in `docs/` e `release/`: zero copie divergenti)
