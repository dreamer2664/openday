# Cartolina Casardi · Consegna 3.2

Open Day 2026/27 · Liceo Alfredo Casardi · Barletta

## File pronti

- **Cartolina_Casardi_Windows_LPC_QR_2026-27.zip** — pacchetto completo: 679 file, sorgenti integrali, EXE/HTML pronti, asset e licenze, guide, test, screenshot e campioni. Estrarre tutto; su Windows x64 doppio clic su **AVVIA_CARTOLINA_WINDOWS.exe**, con l’HTML affiancato.
- **Cartolina_Casardi_PC_e_Telefono.html** — creatore completo autonomo, 24,3 MB. Scaricare e aprire in un browser recente. Il visualizzatore di allegati può limitare JavaScript o download: non equivale all’apertura del file nel browser.
- **Guida_Casardi_3.2.pdf** — istruzioni A4 di una pagina.
- **Verifica_pubblicazione_Casardi_3.2.json** — commit, confronti e download pubblici verificati senza autenticazione.

I sorgenti completi sono nello ZIP, sotto `casardi_postcard/`, e nel repository. Non occorre ricostruire l’app per usarla.

## Aggiornamento

**12 luoghi / 24 combinazioni** foto + illustrazione pixel: i sei precedenti più Colosseo, Acropoli, Pompei, Taormina, Castel del Monte e Castello di Barletta. Le sei illustrazioni precedenti sono identiche byte per byte. Famiglia LPC mantenuta; pantaloncini e colori corretti; alternative senza effetto sui pixel visibili spiegate, scopertura esplicita e zoom del viso reale.

Le illustrazioni sono assistite da IA e rifinite su griglia/palette, non dichiarate interamente manuali o rilievi filologici. Foto Casardi autentica ma **1936**, non attuale. Crediti per foto e sprite nei PNG e nei documenti del pacchetto; LPC non tutto CC0.

## QR: distinzione importante

Il solo HTML crea/salva il PNG sul dispositivo che lo esegue. Non può consegnarlo a un altro telefono con un normale QR senza un servizio raggiungibile. Il servizio Windows incluso fornisce il QR LAN del PNG finito: è una soluzione separata, non Android-only. Nessun cloud o sistema a due QR non approvato è stato aggiunto.

PC e telefono sulla stessa LAN comunicante; prova fisica con IT sul posto obbligatoria. Nessun collaudo Windows nativo o telefono fisico è stato eseguito nella sandbox.

## Prove

58 unitari; 26 principali Go con race detector; 3250 confronti degli effetti; 137 alternative cliccate in nove categorie; 7716 casi asset; 12096 layout; 938 confronti sprite esatti. Tutte le 24 esportazioni nei due renderer, PNG 3000 × 2000. Scadenza del QR attesa per 300 secondi reali. ZIP estratto e verificato separatamente: 520 file runtime identici, HTML isolato offline, PNG/QR e reset reali. Limiti e risultati completi nel TEST_REPORT dello ZIP.

## Repository autorizzato

Solo **dreamer2664/openday · branch v1 · cartella v1/**. Commit **de2c3ae57dffd5e2a40463fbdaceccf89a5edd14**. I 117 elementi fuori da v1/ e il riferimento main osservato durante la pubblicazione non sono modificati.

- [Repository, consegna v1](https://github.com/dreamer2664/openday/tree/v1/v1)
- [ZIP diretto verificato](https://raw.githubusercontent.com/dreamer2664/openday/de2c3ae57dffd5e2a40463fbdaceccf89a5edd14/v1/Cartolina_Casardi_Windows_LPC_QR_2026-27.zip)
- [HTML diretto verificato](https://raw.githubusercontent.com/dreamer2664/openday/de2c3ae57dffd5e2a40463fbdaceccf89a5edd14/v1/casardi_postcard/Cartolina_Casardi_PC_e_Telefono.html)
- [24 anteprime reali](https://github.com/dreamer2664/openday/blob/de2c3ae57dffd5e2a40463fbdaceccf89a5edd14/v1/casardi_postcard/docs/qa/07_browser_24_cartoline.jpg)

SHA-256 ZIP: `b03b5f3c5e80f49cc60be8961334cabfb4c3700bf3115850763fbf24be01ab5d`.

SHA-256 HTML: `48cca47603d4eb53db38680ace4151c9b3dac134b38c02bbd7f0849403d7e049`.
