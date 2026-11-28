# L'ORACOLO DI DELFI — Pixel & Chill

## Consegna principale

**`Oracolo-di-Delfi-Deluxe.html`** è il nuovo file autonomo: circa 249 KB, con CSS, JavaScript, font, SVG e licenze incorporati. Si apre da solo, anche se viene rinominato o copiato in una cartella vuota. Non richiede un server, un account, file audio, una rete o l'estrazione di uno ZIP.

Il precedente `Oracolo-di-Delfi.html` rimane disponibile come versione precedente. Questa revisione conserva il funzionamento ludico dell'Oracolo, senza chatbot o interpretazione semantica delle domande.

## Pixel art rinnovata

- **Pizia a 120 × 160 pixel**, con diadema d'alloro, treccia, gioielli, abito ricamato a greca, pieghe del mantello, bracciali, sandali e riflessi discreti. Stessa base per tutti i fotogrammi; tre posizioni della bocca, battito di ciglia, respiro e posa raccolta.
- **Tempio dettagliato:** marmo con venature e giunti, scanalature, capitelli, cornici, fregi, sole di Apollo, lucerne appese, anfore, rami d'olivo, edera e gradini incisi.
- **Paesaggio:** montagne stratificate e tratteggiate a pixel, luna con crateri e alone a gradini, costellazioni tracciate a pixel, cipressi, valle e piccole luci lontane.
- **Interfaccia:** greche, lastricato, superfici in pietra, angoli in bronzo, bordi scolpiti, frecce a pixel, nuovo sigillo oracolare e particelle a stella/rombo. Domanda e responso restano in un font leggibile.

Tutta la grafica è originale in Canvas/SVG/CSS. Nessun generatore d'immagini e nessun asset copiato da videogiochi.

## Audio rinnovato

### Soundtrack «Vento sul Parnaso»

Composizione originale, **78 BPM**, 16 battute, **circa 49,23 secondi per giro**. Pad caldi e leggermente scordati, melodia morbida a timbro arpa/chiptune, basso, cassa delicata, spazzole e shaker. Riverbero stereo e delay, creati localmente, danno profondità senza aggiungere file al pacchetto.

La partitura è schedulata con il clock di Web Audio, non con intervalli usati come metronomo. La riproduzione è stata controllata oltre il primo giro completo. Le voci terminate vengono scollegate; il trasporto si ferma quando viene spento. La scheda nascosta mette in pausa la musica; al ritorno riparte senza duplicare il trasporto.

### Effetti e comandi

Nuovi timbri per attivazione, consultazione, rivelazione, reset e invito a compilare il campo vuoto. I due interruttori sono indipendenti:

- **SUONI:** effetti dell'interazione.
- **MUSICA:** colonna sonora; su mobile la scritta MUSICA è accompagnata da un indicatore.
- **Icona dei cursori:** pannello del volume, con slider utilizzabile via mouse, touch o tastiera.

**Tutto l'audio è spento all'apertura**, e nessun AudioContext viene creato prima di un'attivazione esplicita. Durante consultazione, parlato e nota di sicurezza, la musica viene attenuata. Quando entrambi i canali sono spenti, il contesto audio viene sospeso per risparmiare risorse.

## Verifiche

**17/17 gruppi di test Deluxe superati**, più **5/5 gruppi del motore delle risposte**.

Collaudo in Chromium 159.0.8154.6:

- HTML isolato, offline, senza cartelle di supporto; immagini, font e script incorporati.
- Avvio senza autoplay, comandi musica/effetti indipendenti, volume e chiusura del mixer con Esc.
- Ciclo completo, campo vuoto, limite 140, doppi invii, nove consultazioni consecutive, memoria degli ultimi otto responsi e protezione locale delle domande delicate.
- Attesa di circa 1,35 s, tutte e tre le bocche sincronizzate al testo, ritorno idle e stabilità del pannello.
- Musica attiva per più di un giro completo, numero di voci entro i limiti verificati, spegnimento e riattivazioni ripetute senza voci residue.
- Rendering PCM stereo a 44,1 kHz: **52 secondi di musica** e **8 secondi di effetti**, campioni finiti e nessun clipping nei segnali controllati, con margine anche al volume massimo.
- Pausa/ripresa verificata anche con evento di visibilità simulato.
- Viewport da **320 a 1920 px**, mixer entro lo schermo, touch emulato a 390 × 844 e nessun overflow orizzontale.
- HTML eseguito in **iframe isolato con soli script consentiti**, senza permesso di inviare form né origine condivisa; consultazione, musica, reset e collegamenti interni funzionanti.
- Audit automatici WCAG A/AA selezionati: nessuna violazione rilevata nel gioco e nel mixer.
- **Zero richieste esterne, errori JavaScript o risorse mancanti** nei test finali.

Risultati e valori PCM: `tests/deluxe-results.json`. Script riproducibile: `tests/deluxe.cjs`. Undici nuovi screenshot reali: `renders/deluxe/`.

## Limiti dichiarati

- Il controllo sulle domande delicate è lessicale e circoscritto, non una moderazione completa o una valutazione medica.
- I controlli mobile sono emulati; non sono stati usati telefoni fisici. Safari e Firefox non sono stati collaudati in questa revisione.
- Il segnale audio è stato renderizzato e misurato, ma **volume e altoparlanti del dispositivo dello stand vanno provati sul posto**. Non viene dichiarato un ascolto su hardware fisico della sandbox.
- Fullscreen e audio possono essere limitati dalle impostazioni del browser o del visualizzatore. Il gioco resta utilizzabile in silenzio; il file scaricato si apre direttamente in un browser moderno con JavaScript attivo.
