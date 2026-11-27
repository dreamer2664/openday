# Cartolina Casardi · v1

**Versione v1 della cartolina digitale Open Day 2026/27 — Liceo Alfredo Casardi, Barletta.**

Consegna del 27 novembre 2026: nuovi personaggi modulari Universal LPC con equipaggiamento fantascientifico, creatore completo PC/telefono, sei ambientazioni in stile fotografico e NES, companion facoltativi, export PNG 3000 × 2000 e **QR temporaneo del PNG già finito** tramite servizio LAN.

Questa versione è isolata nel **branch `v1`**, cartella **`v1/`**. Il gioco e i file preesistenti del repository, come il branch `main`, non vengono modificati da questa consegna. I nomi interni di EXE/HTML restano quelli previsti dall'applicazione: non rinominarli separatamente.

## Scaricare e avviare

- **[ZIP completo Windows e sorgenti (53,2 MB)](Cartolina_Casardi_Windows_LPC_QR_2026-27.zip)** — dalla pagina GitHub del file usare **Download raw**.
- [SHA-256 dello ZIP](Cartolina_Casardi_Windows_LPC_QR_2026-27.zip.sha256).
- [Sorgenti e file pronti](casardi_postcard/).
- [Guida operatore PDF](casardi_postcard/docs/GUIDA_RAPIDA.pdf).
- [Anteprima dei nuovi personaggi](casardi_postcard/docs/qa/01_personaggi.png).

1. Estrarre tutto lo ZIP sul PC Windows x64.
2. Lasciare `AVVIA_CARTOLINA_WINDOWS.exe` e `Cartolina_Casardi_PC_e_Telefono.html` nella stessa cartella.
3. Fare doppio clic sull'EXE. Non servono terminale, Go, Python o Node.
4. Dopo **Genera PNG**, usare il QR **Dal PC al telefono**. PC e telefono devono essere sulla stessa LAN comunicante.

Il solo [HTML autonomo completo](casardi_postcard/Cartolina_Casardi_PC_e_Telefono.html), una volta scaricato e aperto nel browser, crea ed esporta offline sul dispositivo ma **non avvia il server LAN**. Il QR distinto in Info apre invece il creatore telefono completo; non è il QR del PNG finito.

## Contenuto e verifiche

`casardi_postcard/` conserva i **625 file esatti del pacchetto verificato**, compresi sorgenti, EXE, HTML, fotografie, sprite, font, licenze, test, report, guide, screenshot e campioni. Non include credenziali, cartoline dei visitatori, cache o ambienti virtuali.

La copia estratta è stata provata su Linux/Chromium: HTML isolato offline, entrambi gli stili 3000 × 2000, QR decodificati indipendentemente, download identici byte per byte, reset e scadenza reale. Il manifest interno e CRC/SHA-256 dello ZIP sono stati verificati.

**Limiti dichiarati:** EXE Windows x64 cross-compilato e non firmato; non sono stati eseguiti Windows nativo, telefono fisico o Wi-Fi della scuola. Il collaudo sul posto e la verifica IT restano necessari. La fotografia Casardi inclusa è autentica ma storica (1936), non attuale. Non sono risorse ufficiali di Cyberpunk 2077 o ARK.

## Documentazione e licenze

- [README completo e istruzioni di rete/reset](casardi_postcard/README.md)
- [Guida file unico e telefono](casardi_postcard/docs/GUIDA_FILE_UNICO_E_TELEFONO.md)
- [Report dei test](casardi_postcard/TEST_REPORT.md)
- [Inventario effettivo degli asset](casardi_postcard/ASSET_MATRIX.md)
- [Fonti e licenze](casardi_postcard/SOURCES_AND_LICENSES.md)
- [Crediti LPC per parte](casardi_postcard/assets/characters/CREDITI_LPC.txt)
- [Licenza del codice e ambiti distinti](casardi_postcard/LICENSE)

Codice originale MIT; arte LPC con licenze per parte (**non tutta CC0**); fotografie con licenze specifiche; sfondi NES/composizioni CC BY-SA 4.0 con attribuzioni e obblighi dei materiali originali conservati. Attenersi ai documenti inclusi per la redistribuzione.

**SHA-256 ZIP:** `a1a88cd5fcf71f532877024f250f65a704dbbd77ad1560e329aa741da231b42b`.
