# Screenshot dell’edizione stand con QR del PNG

Set reale Chromium/Playwright del servizio Go (stesso sorgente del launcher Windows), con nuova arte LPC. Nomi e PNG sintetici; i token mostrati sono revocati al termine del test. Gli URL loopback negli screenshot sono **indirizzi di collaudo**, non link raggiungibili da telefoni esterni.

1. Benvenuto e nuovi campioni.
2. Anteprima pixel art allo stand.
3. **QR del PNG finito** dopo l’esportazione, con conto alla rovescia e fallback sul PC.
4. Pagina di download in contesto touch separato.
5. Info, scheda di rete e QR **distinto** del creatore telefono.
6. Pagina italiana di link revocato.
7. Errore di rete iniettato; il PNG locale resta salvabile.

Generatore: `scripts/service_ui_test.py`, report `docs/test-results/go-service-browser.json`. JPEG di interfaccia, non i PNG HD esportati. Alcune catture sono a pagina intera: la barra di navigazione fissa viene catturata nella posizione del viewport.

Non sono screenshot di Windows nativo o di un telefono fisico. Il download è stato realmente eseguito tra due contesti Chromium, confrontando i bytes con il PNG PC e decodificando il QR indipendentemente. La prova hardware e sulla Wi-Fi scolastica resta da fare.
