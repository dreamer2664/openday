# Tavole di revisione · NES Retro 3.1 / LPC mantenuti

Queste immagini mostrano **pixel effettivi dei renderer**, non concept art separata. I personaggi LPC della revisione precedente sono mantenuti; i sei vecchi fondali NES sono sostituiti. Non sono dati di visitatori; nomi e configurazioni sono sintetici.

- **01_personaggi.png** — 36 configurazioni nuove LPC, quattro look iniziali, diverse corporature/capi/capelli/pose; ingrandimenti nearest-neighbor e striscia 1×. Non 36 basi anatomiche nuove.
- **02_espressioni.png** — quattro teste e sei espressioni LPC in confronto, senza capelli per renderle leggibili.
- **03_companion.png** — tutti i 42 abbinamenti mantello-posa degli otto animali originali. Le varianti cromatiche non sono nuove anatomie.
- **04_sovrapposizioni.png** — capi e cinque oggetti in presa, copricapi/capelli/occhiali/borse; non una prova esaustiva di ogni combinazione.
- **05_cartoline.jpg** — dodici composizioni reali Pillow con i nuovi sprite, una per luogo/stile. Tutte renderizzate a 3000 × 2000; la tavola è solo una vista di revisione ridotta.
- **06_appoggio_foro.jpg** — crop effettivo del PNG fotografico del Foro, per controllare piedi e frammenti lapidei. L’avatar è più piccolo per rispettare l’inquadratura.
- **09_interfaccia_nes.jpg** e **10_interfaccia_telefono.jpg** — catture complete e reali del nuovo benvenuto, desktop e viewport telefono; tutte e sei le miniature con proporzioni 3:2 verificate. Non telefoni fisici.
- **08_nuovi_scenari_nes.jpg** — sei nuovi PNG canonici, griglia 600 × 400 e 64 colori per sfondo. Illustrazioni assistite da IA, senza personaggi; non master promozionali differenti dal runtime.
- **07_browser_12_cartoline.jpg** — dodici composizioni indipendenti Canvas esportate dal browser e ricomposte in una tavola di controllo. Non si pretende identità integrale con Pillow.

Tavole 01–04 generate con `scripts/asset_audit.py`; 05–06 dai campioni in `renders/` con `scripts/build_review_sheets.py`; 07 da `scripts/standalone_ui_test.py`; 08 da `scripts/nes_art_audit.py`; 09–10 da `scripts/nes_ui_test.py`. Le fonti e gli obblighi di riuso sono in SOURCES_AND_LICENSES.md e CREDITI_LPC.txt; la tavola non sostituisce le attribuzioni per parte.

**Controlli automatici nuovi:** 7716 render di asset/bordi/alpha e hash delle fonti; 6048 casi geometrici dei layout; 938 confronti RGBA esatti Python/JS. Non certificano da soli la prospettiva, la bellezza di ogni combinazione o l’approvazione del committente. Sono state osservate le tavole consegnate e le dodici composizioni rappresentative.
