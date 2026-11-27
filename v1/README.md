# Cartolina Casardi · v1 · 3.2 · Dodici luoghi

**Open Day 2026/27 — Liceo Alfredo Casardi, Barletta.** Aggiornamento del 27 novembre 2026.

## Sei luoghi in più, entrambi gli stili

Aggiunti **Colosseo, Acropoli di Atene / Partenone, Pompei / Foro, Teatro antico di Taormina, Castel del Monte e Castello di Barletta**. Totale **12 luoghi / 24 combinazioni**: fotografie autentiche con fonti/licenze e illustrazioni pixel coordinate, assistite da IA e rifinite a **600 × 400 nativi, massimo 64 colori per sfondo**. Nessuna generazione a runtime. Le sei illustrazioni apprezzate della 3.1 sono **conservate byte per byte**.

**Famiglia LPC mantenuta, controlli corretti:** veri pantaloncini, colori denim distinti e cuffie realmente ricolorabili. Le alternative coperte dagli strati sono misurate sui pixel del personaggio attuale, attenuate e spiegate; «Scopri questo dettaglio» rende esplicita la rimozione delle coperture. Zoom del viso reale, non icone promozionali. I piccoli dettagli facciali restano di pochi pixel.

Preservati tema NES-rétro, quattro pose/sei espressioni, otto companion, creatore completo PC/telefono, PNG **3000 × 2000** e QR LAN temporaneo del **PNG già finito**. Il QR distinto del creatore telefono resta in Info.

![Dodici scenari effettivi](casardi_postcard/docs/qa/08_nuovi_scenari_nes.jpg)

Consegna isolata nel **branch `v1`, cartella `v1/`**. Nessun cambiamento al gioco preesistente fuori da questa cartella o al branch `main`.

## Scaricare e avviare

- **[ZIP completo Windows e sorgenti (62.4 MB)](https://raw.githubusercontent.com/dreamer2664/openday/refs/heads/v1/v1/Cartolina_Casardi_Windows_LPC_QR_2026-27.zip)**.
- [SHA-256 ZIP](Cartolina_Casardi_Windows_LPC_QR_2026-27.zip.sha256).
- **[HTML autonomo completo (24,3 MB)](https://raw.githubusercontent.com/dreamer2664/openday/refs/heads/v1/v1/casardi_postcard/Cartolina_Casardi_PC_e_Telefono.html)** — scaricare e aprire nel browser; da solo esporta sul dispositivo.
- [Sorgenti, asset e file pronti](casardi_postcard/).
- [Guida operatore PDF](casardi_postcard/docs/GUIDA_RAPIDA.pdf).
- [Tutte le 24 cartoline Canvas](casardi_postcard/docs/qa/07_browser_24_cartoline.jpg) · [correzioni dei controlli](casardi_postcard/docs/qa/11_controlli_effettivi.png) · [zoom telefono](casardi_postcard/docs/qa/13_zoom_volto_telefono.jpg).

1. Estrarre tutto lo ZIP su Windows 10/11 x64.
2. Lasciare `AVVIA_CARTOLINA_WINDOWS.exe` e `Cartolina_Casardi_PC_e_Telefono.html` affiancati.
3. Doppio clic sull’EXE: niente terminale, Python, Go o Node.
4. Per il QR del PNG usare **Dal PC al telefono**, dopo Genera PNG. PC e telefono sulla stessa LAN comunicante.

**Limite Android-only dichiarato:** un HTML locale non può servire il PNG HD a un altro telefono tramite un normale QR senza un servizio raggiungibile. Il solo HTML salva localmente. Non si spaccia l’EXE Windows per una soluzione Android-only e non sono stati aggiunti cloud, hosting esterno o accoppiamenti a due QR non approvati.

## Verifiche effettive

**679 file nel pacchetto**, con sorgenti, asset/licenze, EXE/HTML, guide e prove. Nessuna credenziale o cartolina visitatore.

- **58 test unitari** e **26 test principali Go con race detector**.
- **3250 confronti degli effetti** e **137 alternative realmente cliccate** nelle nove categorie UI; 563 alternative zero-pixel correttamente dichiarate, non conteggiate come effetti.
- **7716 casi asset**, **12096 layout**, **938 confronti sprite RGBA esatti**; dodici sfondi verificati e sei 3.1 invariati.
- **24 export standalone + 24 export HTTP Python**, tutti 3000 × 2000; dodici NES esattamente nearest-neighbor ×5.
- Browser: 22 controlli standalone, 15 bridge/QR, 9 controlli effettivi, 8 responsive/NES, 16 UI Python, 7 avvio/arresto.
- Scadenza attesa **300 secondi reali**; download iniziale identico, poi tre HTTP 410 e copia RAM rimossa.
- ZIP estratto indipendentemente: **520 file runtime identici**, HTML isolato offline, entrambi gli stili, servizio ricompilato dai sorgenti estratti, QR decodificati/download identici, reset e assenza directory browsing. CRC e manifest SHA-256 verificati.

**Non provati qui:** Windows nativo, SmartScreen/firewall/browser predefinito, telefono fisico, rete scolastica, Safari/Firefox e Web Share nativo. EXE cross-compilato x64 **non firmato**; prova IT sul posto indispensabile. Foto Casardi autentica ma **1936**; la colorazione illustrata è interpretativa. Nessuna certificazione filologica delle illustrazioni o approvazione ufficiale della scuola.

## Documentazione e licenze

- [README completo](casardi_postcard/README.md) · [File unico e telefono](casardi_postcard/docs/GUIDA_FILE_UNICO_E_TELEFONO.md)
- [Report prove](casardi_postcard/TEST_REPORT.md) · [Matrice asset](casardi_postcard/ASSET_MATRIX.md) · [Schede di scena](casardi_postcard/docs/SCENE_COMPOSITION.md)
- [Fonti/licenze](casardi_postcard/SOURCES_AND_LICENSES.md) · [Crediti LPC](casardi_postcard/assets/characters/CREDITI_LPC.txt) · [Manifest sfondi](casardi_postcard/assets/nes/manifest.json)

Codice originale MIT; LPC con licenze per parte (**non tutto CC0**); fotografie CC0/pubblico dominio/CC BY-SA 2.5/3.0/4.0 secondo fonte. Illustrazioni e composizioni offerte prudenzialmente come adattamenti CC BY-SA 4.0, con obblighi dei riferimenti conservati. Assistenza IA dichiarata, nessuna esclusiva rivendicata sugli elementi automatici. Nessun asset di giochi commerciali.

**SHA-256 ZIP:** `b03b5f3c5e80f49cc60be8961334cabfb4c3700bf3115850763fbf24be01ab5d`.
