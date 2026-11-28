# Cartolina Casardi · Open Day 2026/27 · revisione 3.3.1

**Correzione 3.3.1:** risolto il blocco condiviso di personaggi e sticker dopo un trascinamento interrotto/perdita di cattura. Il gesto incompleto viene annullato senza perdere la cartolina. Corretto anche lo stato di attesa delle anteprime. [Diagnosi e prova ripetibile](casardi_postcard/docs/BUG_TRASCINAMENTO_3.3.1.md): riprodotto sulla 3.3, 72 nuove verifiche, 240 trascinamenti consecutivi e sei export HD. Tutti i 473 asset, logo compreso, restano identici alla 3.3.

**Personaggio spostabile con mouse, dito o frecce; ultimi tocchi facoltativi alla fine.** Otto sticker: alloro, Pegaso decorativo, lira, libro, maschere, capitello, rosa dei venti e logo ufficiale autentico dalla brochure Casardi. Fino a sei sticker, dimensioni/inclinazione/livelli e annulla. Targhetta opzionale: finitura, simbolo, percorso e posizione. Nessuna decorazione di default.

- **[Scarica lo ZIP completo Windows](Cartolina_Casardi_Windows_LPC_QR_2026-27.zip)** — estrarre tutto, poi doppio clic su `AVVIA_CARTOLINA_WINDOWS.exe`.
- **[File HTML unico PC e telefono](casardi_postcard/Cartolina_Casardi_PC_e_Telefono.html)** — scaricarlo e aprirlo in un browser; creator completo offline, non una pagina launcher.
- [Guida A4 stampabile](casardi_postcard/docs/GUIDA_RAPIDA.pdf)
- [Come spostare il personaggio e aggiungere sticker/targhetta](casardi_postcard/docs/COMPOSIZIONE_E_STICKER.md)
- [Sorgenti e istruzioni complete](casardi_postcard/README.md) · [Prove realmente eseguite e limiti](casardi_postcard/TEST_REPORT.md)
- [Fonti e licenze](casardi_postcard/SOURCES_AND_LICENSES.md) · [Logo ufficiale: provenienza e limiti](casardi_postcard/docs/FONTI_LOGO.md)
- [SHA-256 dello ZIP](Cartolina_Casardi_Windows_LPC_QR_2026-27.zip.sha256)

Conservati 12 luoghi / 24 combinazioni, illustrazioni apprezzate, sprite professionali LPC/sci-fi, controlli effettivi e otto companion. PNG 3000 × 2000; NES nativo 600 × 400 → ×5. Gli esempi e il nuovo editor sono nel pacchetto.

Il QR del PNG finito richiede PC Windows e telefono sulla stessa LAN comunicante. Il solo HTML locale crea/salva ma non ospita un download per altri dispositivi: niente cloud o due-QR aggiunti. Il servizio Windows conserva il solo PNG temporaneo in RAM, revoca/reset e scadenza iniziale 10 minuti. Il QR del creatore telefono è distinto e si trova in Info.

**Prima dell’evento:** provare su Windows reale e con telefono fisico sulla Wi-Fi dello stand. Linux/Chromium e touch emulato non sostituiscono il collaudo. Eseguibile x64 non firmato: verifica dell’IT, senza disattivare le protezioni. Casardi fotografico storico 1936; illustrazioni e sette sticker assistiti da IA dichiarati; il logo ufficiale non è generato. Licenze foto/LPC/marchio distinte, nessuna approvazione istituzionale implicita.

Questa consegna modifica esclusivamente `v1/` sul branch `v1`; non il gioco o gli altri rami.
