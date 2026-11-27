# Composizione libera e ultimi tocchi · revisione 3.3
## Liceo Alfredo Casardi · Barletta · Open Day 2026/27

Le aggiunte si trovano **alla fine**, nell’ultimo passaggio **Anteprima**, prima di Genera PNG. Non sono richieste per proseguire. All’inizio non ci sono sticker, simboli, indicazioni del percorso o nuove finiture.

## 1. Spostare il personaggio direttamente sulla cartolina

- Porta il puntatore sul personaggio: compare il piccolo indicatore di spostamento. **Premi e trascina**, quindi rilascia. Su telefono trascina con **un dito**.
- Il companion, se scelto, segue lo stesso spostamento e conserva il rapporto di scala. Il gruppo è contenuto nella cornice.
- Mentre trascini vedi il vero ritaglio del personaggio e del companion, non un segnaposto. Al rilascio si ricompongono ombre, contatto e occlusione.
- Per la tastiera: raggiungi il personaggio con **Tab**, poi usa **← ↑ → ↓**. **Maiusc + freccia** effettua uno spostamento più ampio. Esc annulla un trascinamento in corso.
- Apri **Personaggio · dimensione e posizione**: il cursore offre **Piccolo, Medio e Grande**, tre scale effettivamente distinte a passi di pixel interi. Non introduce una riscalatura sfocata dello sprite.
- **Posizione consigliata** riporta appoggio e dimensione a quelli del luogo, senza rimuovere gli sticker o la targhetta.

La posizione libera è una scelta grafica: l’app non riconosce semanticamente pavimento, tetti o balaustre in ogni punto di una foto. Se il personaggio sembra sospeso o appoggiato male, spostalo sul terreno visibile oppure usa Posizione consigliata. Nessun controllo geometrico equivale a una ricostruzione 3D della scena.

## 2. Sticker opzionali

La raccolta contiene:

1. Corona d’alloro.
2. Pegaso alato decorativo.
3. Lira classica.
4. Libro aperto.
5. Maschere teatrali.
6. Capitello ionico.
7. Rosa dei venti.
8. **Logo ufficiale del Liceo Casardi**, distinto dal Pegaso decorativo.

Tocca una tessera per aggiungere lo sticker. Sono consentiti **fino a sei sticker distinti** sulla stessa cartolina. Toccare di nuovo una tessera già attiva seleziona lo sticker presente, non ne aggiunge copie involontarie.

Trascina lo sticker sulla cartolina, oppure selezionalo e usa le frecce. Nel riquadro di modifica puoi cambiare **dimensione**, **inclinazione**, **Porta davanti** e **Rimuovi sticker**. Anche **Canc** o **Backspace** rimuovono lo sticker selezionato, senza intercettare la scrittura negli altri campi.

Il logo istituzionale mantiene proporzioni e orientamento originali: **non è inclinabile**. Il fondo bianco della fonte è intenzionalmente conservato. In modalità NES è ridotto su griglia e non ridisegnato; in fotografia usa il ritaglio autentico a 387 × 506. Il motore limita i bordi degli sticker, compresi quelli ruotati, dentro la cornice.

## 3. Targhetta opzionale

In **Targhetta · stile, simbolo e percorso** scegli, solo se vuoi:

- **Finitura:** Originale, Notte e oro, Avorio e inchiostro, Pergamena classica.
- **Simbolo accanto al testo:** nessuno oppure uno degli otto elementi della raccolta, anche il logo ufficiale.
- **Il mio percorso:** non indicarlo, Liceo Classico, Scienze Umane, Liceo Musicale. È una preferenza decorativa, non un’iscrizione o una raccolta di dati.
- **Posizione:** quella consigliata per il luogo oppure uno dei quattro angoli.

Le tre scritte istituzionali rimangono **LICEO ALFREDO CASARDI**, **OPEN DAY 2026/27**, **BARLETTA**; il nickname resta facoltativo. Il percorso compare soltanto se scelto. Senza modifiche, si mantiene la tipografia originale del rispettivo stile.

## 4. Annullare, tornare indietro ed esportare

- **Annulla** recupera le modifiche alla composizione, fino a 25 passaggi in memoria. Il trascinamento costituisce un solo passaggio, non uno per ogni pixel.
- **Ripristina composizione** rimuove spostamenti, sticker e aggiunte alla targhetta; **conserva luogo, stile, nome, aspetto e companion**.
- Indietro/Avanti conserva la composizione. **Ricomincia / Nuovo visitatore** azzera invece tutta la sessione e revoca il QR Windows eventualmente pubblicato.
- Attendi la fine dell’anteprima, poi **Genera PNG**. I controlli di composizione sono bloccati durante l’esportazione, per non produrre un file con scelte a metà.

Il PNG è ricomposto dagli asset a **3000 × 2000**, non catturato dall’interfaccia. In NES tutti gli elementi sono composti sul canvas **600 × 400** e ingranditi esattamente ×5 con nearest-neighbour. Contorni di selezione, maniglie e pannelli **non** finiscono nel PNG. La versione singolo HTML incorpora anche sticker, logo, font e licenze: nessuna richiesta Internet per applicarli.

## 5. Identità e diritti

Il logo è estratto dalla prima pagina della [brochure ufficiale 2026/27](https://www.liceocasardi.edu.it/wp-content/uploads/2025/12/POF-26-27-Liceo-Casardi-Brochure.pdf). La stessa identità è riscontrata nell’intestazione dell’istituto e in documenti scolastici del novembre 2026. Non sono usati come logo il pittogramma «Studente atleta», la copertina del giornalino Pegaso o lo stemma della Repubblica.

Il riuso si riferisce alla licenza generale **CC BY 4.0** dichiarata dalle [note legali ufficiali](https://www.liceocasardi.edu.it/note-legali/), fatte salve eccezioni, diritti distinti, di terzi e di marchio. L’inclusione non implica approvazione o titolarità del marchio da parte di chi sviluppa l’app. Verifica dell’istituto consigliata prima dell’uso pubblico. Attribuzione, URL e modifiche sono riportati nei crediti del PNG **se il logo viene scelto**.

Gli altri sette sticker sono originali **assistiti da IA**, rifiniti su griglia 96 × 96 con trasparenza e palette limitata; non sono asset di videogiochi commerciali né simboli ufficiali ridisegnati. CC0 1.0 nella misura dei diritti disponibili, senza esclusiva sugli elementi generati automaticamente. Manifest e hash in `assets/stickers/manifest.json`, avviso ufficiale acquisito in `assets/stickers/FONTE_LOGO_E_LICENZA.txt`, licenze in `SOURCES_AND_LICENSES.md`.

## 6. Collaudo prima dell’evento

Le prove automatiche coprono Chromium desktop, tastiera, viewport e touch **emulati**, due renderer e PNG scaricati. **Non** sono una prova su telefono fisico, Windows nativo o Wi-Fi scolastica. Far provare all’operatore il trascinamento, lo scroll intorno all’immagine e il salvataggio sul dispositivo realmente usato. Anche con queste aggiunte il solo HTML locale non può ospitare un PNG per un altro telefono: il QR ordinario del file finito richiede il servizio LAN Windows già incluso.
