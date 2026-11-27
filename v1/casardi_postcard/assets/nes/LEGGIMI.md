# Sei nuovi scenari · NES Retro 3.1

Questi **sei PNG nativi 600 × 400** sono le sorgenti canoniche modificabili usate sia da Canvas sia da Pillow. Sono illustrazioni architettoniche **assistite da IA**, rifinite su griglia e con una palette di 64 colori per sfondo. Non sono disegni interamente manuali, rilievi storici, foto attuali o asset di giochi commerciali. I personaggi LPC conservano palette e licenze proprie: il limite di 64 colori riguarda lo sfondo, non l’intera cartolina.

Le foto di riferimento autentiche, i loro autori e le licenze sono in `../photos/photo_metadata.json` e `../../SOURCES_AND_LICENSES.md`. Per Casardi il riferimento è del **1936**: la versione illustrata a colori non rappresenta una fotografia della scuola di oggi. L’oculo del Pantheon è fuori dall’inquadratura scelta; i dettagli minori sono interpretativi.

## File e integrità

`manifest.json` conserva dimensioni, hash SHA-256, tavolozza, fonte/licenza del riferimento, elementi architettonici e hash dei master di lavorazione. I master non sono inclusi e **non sono una dipendenza runtime**. `../../app/nes_art.py` verifica il PNG prima del rendering. Un file cambiato senza aggiornare il manifest genera un errore esplicito, non un ritorno silenzioso al vecchio fondale.

`../../scripts/import_nes_art.py --masters CARTELLA` documenta come sono stati rifiniti i master se il manutentore ne dispone. Non scarica né genera nuove immagini. I PNG consegnati possono invece essere aperti direttamente in un editor pixel art.

## Modifiche locali, a servizio fermo

1. Conservare una copia del PNG e del manifest prima della modifica.
2. Disegnare sulla griglia **600 × 400**; mantenere al massimo 64 colori, opacità piena, formato PNG. Niente testo pseudo-latino, marchi o asset senza licenza.
3. Conservare nei metadati provenienza, licenze e dichiarazione IA applicabile. Per una nuova fonte acquisire prima i diritti, senza attribuire automaticamente la licenza del vecchio riferimento.
4. Aggiornare consapevolmente nel record di `manifest.json` l’hash SHA-256 del file e le lavorazioni. Se cambia la fonte, aggiornare anche autore/link/licenza/hash del riferimento. **Non ricalcolare hash per nascondere un file corrotto o inatteso.**
5. Rivedere `NES_SCENES` in `app/scenes.py`: piedi, scala, posizione del companion e zona della targhetta sono specifici dell’inquadratura. Il builder incorpora questi layout nel browser.
6. Rigenerare campioni e HTML con `scripts/render_gallery.py`, `scripts/build_examples.py`, `scripts/build_standalone.py`; rieseguire test, audit e confezionamento. `build_examples.py` preserva i sei PNG canonici e non li ridisegna.

Tutti gli elementi della cartolina sono composti a 600 × 400 **prima** dell’ingrandimento nearest-neighbor ×5 a 3000 × 2000. Nessun filtro o modello generativo viene eseguito durante la visita; nessuna connessione Internet è necessaria.

Riuso prudenziale come adattamenti **CC BY-SA 4.0** con attribuzione del riferimento e conservazione dei suoi obblighi. Nessuna rivendicazione di esclusiva sugli elementi generati automaticamente. Il codice MIT e gli sprite LPC hanno regimi distinti: leggere `../../SOURCES_AND_LICENSES.md`.
