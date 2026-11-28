# Cartolina Casardi · revisione 3.3

**Open Day 2026/27 · Liceo Alfredo Casardi · Barletta**

## Novità

- Personaggio spostabile direttamente sulla cartolina con mouse, dito o frecce; il companion segue. Tre taglie nitide, annulla e posizione consigliata.
- Ultimi tocchi **facoltativi, alla fine**: otto sticker (alloro, Pegaso, lira, libro, maschere, capitello, rosa dei venti e logo ufficiale autentico); fino a sei sulla cartolina, spostabili/ridimensionabili/inclinabili salvo l’orientamento del logo.
- Targhetta opzionale: finitura Originale/Notte/Avorio/Pergamena, simbolo, percorso Classico/Scienze Umane/Musicale e angolo. Nessuna decorazione attiva di default.
- Conservati 12 luoghi, entrambi gli stili, LPC/sci-fi, otto companion, controlli reali, offline e PNG 3000 × 2000. NES nativo 600 × 400 → ×5. Il logo ufficiale non è generato; fonte e limiti di licenza nel pacchetto.

## Aprire

**Windows dello stand:** estrarre tutto `Cartolina_Casardi_Windows_LPC_QR_2026-27.zip`; doppio clic su `AVVIA_CARTOLINA_WINDOWS.exe`, lasciando l’HTML affiancato. Nessun terminale/Python. QR del PNG finito su LAN comunicante; scadenza iniziale 10 minuti, revoca/reset e copia solo RAM. Eseguibile x64 non firmato: far verificare all’IT.

**PC o telefono autonomo:** aprire `Cartolina_Casardi_PC_e_Telefono.html` completo in un browser. Tutto incorporato, inclusi sticker e logo; crea e salva offline. Il solo file HTML locale non può ospitare un PNG per un altro telefono con un QR ordinario: serve un servizio raggiungibile. Nessun cloud o alternativa a due QR aggiunto. Su iPhone l’anteprima File può non eseguire l’app; usare un browser adeguato o il creatore telefono via LAN dello stand.

**Guida stampabile:** `Guida_Casardi_3.3.pdf`. Istruzioni complete, sorgenti, asset/licenze, esempi e prove sono nello ZIP.

## Prove e limiti

76 unit test, 26 verifiche editor (mouse/tastiera/touch emulato e PNG reali), geometria Canvas/Pillow 3240 posizionamenti + 324 sticker + 745 validazioni, regressioni dei 24 export per ciascun renderer, servizio QR e scadenza reale 300 secondi. HTML estratto da solo provato offline con cartoline decorate e PNG identico scaricato dal servizio estratto. CRC/manifest SHA-256 dello ZIP PASS.

**Windows nativo, telefoni fisici, Safari/Firefox e Wi-Fi scolastica non provati:** completare il collaudo sul posto. Lo spostamento libero è grafico, non riconoscimento 3D dei piani della foto. Casardi fotografico storico 1936; illustrazioni e sette sticker assistiti da IA dichiarati. Diritti foto, LPC e marchio distinti.

## Pubblicazione verificata

Solo `dreamer2664/openday`, branch `v1`, cartella `v1/`.

- Commit: `004f06afe7c0b33be85d42fa0b08aba696b22f17`
- [ZIP completo verificato](https://raw.githubusercontent.com/dreamer2664/openday/004f06afe7c0b33be85d42fa0b08aba696b22f17/v1/Cartolina_Casardi_Windows_LPC_QR_2026-27.zip)
- [HTML unico verificato](https://raw.githubusercontent.com/dreamer2664/openday/004f06afe7c0b33be85d42fa0b08aba696b22f17/v1/casardi_postcard/Cartolina_Casardi_PC_e_Telefono.html)
- [Cartella del repository](https://github.com/dreamer2664/openday/tree/v1/v1)
- ZIP: 75,370,094 byte · SHA-256 `280284d37cadd0b3965867426f211b1e19a37e7de61eb18455d4224cdf7f839d`
- HTML: 24,818,408 byte · SHA-256 `e8e28940e478a985e2b5113606045b4eac8677c58c27055a8392b719605a392a`

717 file di consegna verificati nel repository; 713 membri nello ZIP; 117 elementi esterni conservati. Altri branch invariati; credenziali assenti. Prova dettagliata: `Verifica_pubblicazione_Casardi_3.3.json`.
