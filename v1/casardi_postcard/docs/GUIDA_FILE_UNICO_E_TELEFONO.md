# Un solo HTML · PC e telefono
## Cartolina Casardi · Open Day 2026/27 — revisione 3.3 · Composizione libera e sticker

**File pronto: `Cartolina_Casardi_PC_e_Telefono.html`**, circa 24,3 MB. È il creatore completo: dodici luoghi in entrambi gli stili, personaggi modulari LPC con equipaggiamento fantascientifico, otto animali facoltativi, anteprima, export PNG **3000 × 2000** e TXT dei crediti. Non scarica librerie o font da Internet e non richiede Python, Go, Node o comandi.

## Aprirlo sul PC

Scaricare il file, poi doppio clic o Apri con → browser recente. Può essere copiato **da solo**, senza la cartella sorgenti. L’anteprima di un allegato dentro un’altra applicazione non equivale a un browser con JavaScript. La chiusura/ricarica perde il lavoro non salvato.

**Per il QR di trasferimento dal PC a un altro dispositivo, invece:** usare l’avvio Windows `AVVIA_CARTOLINA_WINDOWS.exe` con questo HTML affiancato. L’EXE avvia il servizio HTTP locale senza terminale. Dopo «Genera PNG» la scheda «Dal PC al telefono» mostra il **vero QR del PNG finito**.

Un file HTML aperto da solo **non può ospitare un server LAN** né rendere raggiungibile il proprio URL Blob da un altro dispositivo. Non viene mostrato un QR fittizio o un collegamento al creatore spacciato per il file. La versione autonoma salva direttamente sul dispositivo su cui viene aperta.

## Aprirlo sul telefono

### Metodo consigliato allo stand: browser via LAN

1. Sul PC avviare l’EXE Windows con doppio clic, sulla rete autorizzata.
2. In **Info → Servizio dello stand**, aprire **QR distinto: creare una nuova cartolina sul telefono**.
3. Collegare il telefono alla stessa LAN comunicante, scansionare e aprire l’indirizzo **`http://IP-PC:PORTA/telefono`**. La porta è quella mostrata, normalmente 8080 (alternative 8787 / 8899).
4. Si apre il **creatore completo**, non una pagina di sola anteprima/download.
5. Dopo il primo caricamento l’app è autonoma: può creare ed esportare sul telefono anche senza altre richieste al server. Non chiudere/ricaricare la pagina offline: non è una PWA e non è promesso il ricaricamento dalla cache.

Aprire `/telefono` non rivela la chiave riservata, non trasferisce nome/scelte al PC e non resetta la cartolina dello stand. Non pubblica a sua volta un QR: il PNG viene creato sul telefono e salvato lì.

**Questo QR non è quello del file finito.** Per ricevere la cartolina creata dal visitatore sul PC, scansionare il QR che compare **dopo Genera PNG nella schermata di risultato**.

### Alternativa: HTML locale sul telefono

Trasferire/scaricare lo stesso file `.html` e aprirlo in un browser che esegue HTML locali. Non tutti i sistemi gestiscono allo stesso modo gli allegati: **File / Quick Look di iOS può mostrare un’anteprima senza JavaScript**. Se non compare il pulsante «Inizia», usare il percorso HTTP qui sopra. Non si dichiara risolta una limitazione del visualizzatore del sistema operativo con un pulsante simulato.

## La richiesta Android → un QR → altro telefono

Non è realizzabile con il solo HTML, senza un servizio raggiungibile: il PNG HD non entra nel QR e il browser non può servire il proprio file locale a un altro telefono. Non sono stati aggiunti cloud o accoppiamenti a due QR non approvati. La condivisione nativa del PNG sul dispositivo è distinta da un QR di download. Il servizio Windows già incluso è una soluzione separata, non un’app Android-only.

## Creare e salvare

La UI NES-rétro usa pannelli squadrati, titoli pixel, colori ad alto contrasto e controlli touch. Non è un’edizione ridotta. Ha nove categorie, quattro look iniziali modificabili, quattro pose e sei espressioni. Su schermi piccoli l’avatar di dettaglio resta visibile mentre si personalizza; l’anteprima finale mostra tutta la cartolina.

Le alternative che non cambierebbero pixel visibili sono disabilitate e spiegate. «Scopri questo dettaglio» modifica esplicitamente le coperture; uno zoom mostra il viso reale. I pantaloncini, i colori denim e le cuffie sono corretti rispetto alla 3.1.

Dopo **Genera PNG**:

- **Scarica PNG** tenta il download del file originale, non uno screenshot.
- **Apri l’immagine** mostra lo stesso PNG per il salvataggio del browser.
- «Mostra il PNG da salvare con pressione prolungata» espande l’immagine completa.
- **Condividi / Salva…** appare solo se il browser supporta `navigator.canShare` con file. HTTP e browser diversi possono non abilitarlo. Non è stata provata qui una finestra nativa di condivisione su un telefono reale.
- **Scarica anche i crediti** produce un TXT. Le attribuzioni della foto e dei moduli LPC sono anche nei metadati UTF-8 del PNG. Se un social li rimuove, accompagnare il TXT o riportare i crediti in didascalia.

Il comportamento esatto di Foto/Download, menu Condividi e pressione prolungata deve essere verificato sui dispositivi usati all’evento.

## Autonomia, dati e qualità

- Tutti gli asset sono incorporati; niente richieste runtime esterne, analytics, cookie o localStorage. Nel servizio Windows soltanto il **PNG definitivo** viene copiato nella RAM del PC per il QR.
- Nel file autonomo lavoro e PNG rimangono nella memoria della pagina fino a reset/chiusura. Ricomincia revoca gli URL Blob e azzera le scelte, **non cancella i file già scaricati**.
- I dodici sfondi sono illustrazioni assistite da IA e rifinite su griglia/palette; nessun modello viene eseguito durante la visita. I PNG canonici sono gli stessi in tutte le edizioni. Non sono rilievi documentari o disegni dichiarati interamente manuali.
- La foto Casardi è autentica, storica (1936) e nativa 707 × 491; la grandezza dell’export non le aggiunge dettaglio.
- Foto ricomposta a 3000 × 2000; pixel art nativa 600 × 400 composta e ingrandita ×5 con nearest-neighbor. Nessuna dipendenza dalla risoluzione del monitor.
- Sprite Python e JavaScript: **938 confronti RGBA esatti**. Non si rivendica l’identità di intere cartoline fra Canvas e Pillow: interpolazione foto, rasterizzazione font, rumore e ombre sono implementazioni distinte. L’HTML incorpora JPEG ulteriormente ottimizzati, documentati nel report di build.
- Le licenze LPC sono miste, **non tutte CC0**. Crediti e testi completi sono disponibili offline in Info. Il derivato WOFF di Press Start 2P è rinominato internamente **Casardi Pixel**.

## Collaudi effettivi e limiti

Apertura del solo HTML isolato `file://` con rete disattivata; percorso completo desktop e touch **emulato**; tutte le 24 combinazioni luogo/stile esportate a 3000 × 2000; `/telefono` caricato via HTTP e poi portato offline fino al PNG; errori/reset e larghezze 320–1366 px verificati con Chromium. Risultati e hash in `docs/test-results/standalone-browser-tests.json` e TEST_REPORT.md.

**Non eseguiti:** telefono fisico Android/iOS, Safari/Firefox, Web Share nativo, tastiera virtuale reale, Windows nativo e Wi-Fi della scuola. L’emulazione non viene presentata come una prova hardware. La rete deve permettere telefono → PC; il link locale non funziona dalla sola rete mobile o da fuori LAN.


## Novità dell’ultimo passaggio · 3.3

In **Anteprima**, prima di Genera PNG, trascinare il personaggio direttamente sulla cartolina con mouse o dito; il companion lo segue. Tre taglie nitide e «Posizione consigliata» nel relativo riquadro. Con Tab selezionare l’elemento, poi frecce; Maiusc + frecce per un passo maggiore.

**Ultimi tocchi · facoltativi:** otto sticker disponibili, fino a sei sulla cartolina, spostabili, ridimensionabili e inclinabili (tranne il logo ufficiale). Per la targhetta si possono scegliere finitura, simbolo, percorso e angolo. Nessuna aggiunta obbligatoria. Annulla recupera l’ultima modifica; Ripristina composizione conserva nome/luogo/aspetto/animale. Ricomincia cancella tutta la sessione.

Il Pegaso decorativo non viene spacciato per logo ufficiale: lo stemma scolastico autentico proviene dalla brochure 2026/27, con fonti e limiti di licenza documentati. Guide: [composizione e sticker](COMPOSIZIONE_E_STICKER.md), [fonti logo](FONTI_LOGO.md). Il PNG HD e il QR della cartolina pronta includono le scelte effettive e le relative attribuzioni, non pannelli e maniglie.

### Prove aggiuntive da fare sui dispositivi dello stand

- [ ] Trascinato il personaggio con il mouse reale del PC, verificato il PNG salvato.
- [ ] Trascinati personaggio e sticker con un dito sul telefono effettivamente usato; lo scroll resta libero fuori dagli elementi.
- [ ] Verificati logo/simbolo/percorso facoltativi; nessuno compare senza selezione.
- [ ] Salvata una cartolina decorata tramite il normale QR finale; scelte corrette e dimensioni 3000 × 2000.
- [ ] Ripristina composizione/Indietro/Avanti/Ricomincia provati senza residui fra visitatori.

La posizione libera non ricostruisce i piani 3D: guidare il visitatore verso un appoggio plausibile oppure usare Posizione consigliata. Touch emulato in Chromium non equivale a telefono fisico. Anche con gli sticker, il solo file HTML locale non può ospitare un download per altri dispositivi senza un servizio raggiungibile.
