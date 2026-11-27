# Tavole di revisione · 3.2 · Dodici luoghi / LPC mantenuti

Queste immagini mostrano **pixel effettivi dei renderer**, non concept art separata. Le sei illustrazioni della 3.1 sono mantenute byte per byte e si aggiungono sei luoghi in entrambi gli stili. La famiglia LPC è conservata; pantaloncini, colori e strati sono corretti. Nomi e configurazioni sono sintetici, non dati di visitatori.

- **01_personaggi.png** — 36 configurazioni LPC, quattro look iniziali, diverse corporature/capi/capelli/pose; ingrandimenti nearest-neighbor e striscia 1×. Non 36 basi anatomiche nuove.
- **02_espressioni.png** — quattro teste e sei espressioni in confronto, senza capelli per renderle leggibili.
- **03_companion.png** — 42 abbinamenti mantello-posa degli otto animali originali. Le palette non sono nuove anatomie.
- **04_sovrapposizioni.png** — capi, cinque oggetti in presa, copricapi/capelli/occhiali/borse; non ogni possibile combinazione.
- **05_cartoline.jpg** — 24 composizioni reali Pillow, una per luogo/stile, tutte renderizzate a 3000 × 2000. La tavola è una vista ridotta, non l’export HD.
- **06_appoggio_foro.jpg** — crop effettivo del PNG fotografico del Foro, piedi e frammenti lapidei. Avatar più piccolo per rispettare l’inquadratura.
- **07_browser_24_cartoline.jpg** — 24 composizioni Canvas realmente esportate in una sola sessione browser. Non si pretende identità integrale Canvas/Pillow. La precedente tavola da 12 è rimossa.
- **08_nuovi_scenari_nes.jpg** — tutti i 12 PNG canonici, 600 × 400 e 64 colori per sfondo. Illustrazioni assistite da IA; nessun master promozionale diverso dal runtime.
- **09_interfaccia_nes.jpg**, **10_interfaccia_telefono.jpg** — catture reali e complete del benvenuto desktop/telefono; 12 miniature 3:2. Telefono emulato, non hardware fisico.
- **11_controlli_effettivi.png** — confronti prima/dopo del personaggio composto: pantaloncini, denim, occhi, labbra, cuffie, cintura. Differenze contate sui pixel nativi; non tutte ugualmente percepibili e non prova estetica universale.
- **12_zoom_volto_pc.jpg**, **13_zoom_volto_telefono.jpg** — reale zoom 28 × 28 dei pixel del viso; desktop e viewport da 390 px. Non una testa promozionale distinta.

Generatori: `asset_audit.py` (01–04), `build_review_sheets.py` (05–06), `standalone_ui_test.py` (07), `nes_art_audit.py` (08), `nes_ui_test.py` (09–10), `control_effect_audit.py` (11), `control_ui_test.py` (12–13), tutti in `scripts/`.

**Verifiche correnti:** 7716 render di asset/bordi/alpha e hash delle fonti; 12096 casi geometrici; 938 confronti RGBA esatti Python/JS; 3250 confronti degli effetti, con 563 alternative zero-pixel dichiarate; 137 alternative realmente cliccate nelle nove categorie UI. Non sono un giudizio automatico di bellezza, prospettiva, equivalenza percettiva o approvazione del committente. Dettagli facciali di pochi pixel restano piccoli, anche se realmente differenti.

Fonti e obblighi di riuso: `SOURCES_AND_LICENSES.md`, `assets/characters/CREDITI_LPC.txt`, manifest e metadati dei campioni. Queste tavole non sostituiscono le attribuzioni per parte. Nessuna prova con telefono fisico o Wi-Fi scolastica è implicita.
