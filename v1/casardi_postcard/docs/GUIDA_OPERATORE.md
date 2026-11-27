# Guida operatore dello stand · Windows
## Liceo Alfredo Casardi · Open Day 2026/27 · Barletta

Questa guida riguarda **AVVIA_CARTOLINA_WINDOWS.exe + HTML**, l’edizione consigliata senza terminale. Le istruzioni dell’edizione Python, distinta e facoltativa, sono nel README. Non confondere il QR del creatore con il QR del PNG finito.

## Prima dell’evento: preparazione

1. Estrarre tutto lo ZIP in una cartella del PC Windows x64. Non avviare dentro lo ZIP. Lasciare l’EXE e `Cartolina_Casardi_PC_e_Telefono.html` **affiancati**, con gli stessi nomi.
2. Far verificare all’IT l’eseguibile **non firmato**, i sorgenti/hash e le policy del PC. Non disattivare SmartScreen, antivirus o firewall per aggirare un blocco. Il binario è cross-compilato: il suo avvio su questo Windows deve essere provato realmente.
3. Collegare il PC alla LAN autorizzata. Doppio clic sull’EXE: si apre il browser. Nessuna installazione Python/Go e nessun comando. Se necessario aprire `http://127.0.0.1:8080/`; se occupata da un altro programma, l’app prova 8787 e 8899. Se il browser non si apre, la finestra di errore indica l’indirizzo.
4. Alla richiesta firewall, autorizzare soltanto la rete privata prevista e secondo le indicazioni IT. Non aprire porte sul router.
5. Aprire **Inizia → Info → Servizio dello stand**. Controllare scheda di rete e URL. Scegliere l’IP privato della LAN corretta se ci sono VPN/schede multiple. Dopo un cambio Wi-Fi/IP, arrestare e riavviare il servizio.
6. Facoltativo: `F11` per schermo intero. Una sola scheda principale. Un altro doppio clic riapre l’istanza, ma il caricamento della pagina principale avvia una sessione pulita e può revocare il QR corrente: non farlo durante un download.

## Collaudo con telefono separato — obbligatorio

I collaudi della sandbox **non** certificano Windows, firewall o Wi-Fi della scuola. Compilare solo dopo le prove reali:

- [ ] Data, PC e operatore annotati: ______________________________
- [ ] EXE aperto con doppio clic, browser funzionante, nessuna dipendenza richiesta.
- [ ] IP LAN e porta effettiva annotati: ___________________________
- [ ] Telefono fisico collegato alla stessa rete locale comunicante, non alla sola rete mobile.
- [ ] In Info aperto il **QR distinto del creatore telefono**: sul telefono compare l’app completa con «Inizia». Questo prova la raggiungibilità preliminare, non il trasferimento di una cartolina pronta.
- [ ] Creata cartolina **fotografica**, premuto **Genera PNG**, scansionato il **QR nella scheda “Dal PC al telefono”**.
- [ ] Scaricato e aperto il PNG sul telefono; dimensioni 3000 × 2000; salvataggio verificato in Foto/Download.
- [ ] Ripetuto con **Pixel art NES**.
- [ ] Premuto **Nuova cartolina**: il vecchio link mostra «non è più valido» e non consegna più il PNG.
- [ ] Provato «Scarica PNG» sul PC, anche senza telefono connesso.
- [ ] Provato **Info → Arresta servizio locale**, poi nuovo doppio clic e riapertura corretta.
- [ ] Provata la scadenza dopo 5–10 minuti senza reset, secondo il tempo configurato dall’IT.
- [ ] Provati telefono/browser effettivamente usati allo stand, compresa tastiera virtuale.

Il PC può essere Ethernet e il telefono Wi-Fi se le due reti comunicano. **Stesso SSID non significa assenza di isolamento**. Se il link non si apre, chiedere all’IT connettività telefono → IP del PC sulla porta TCP scelta e una rete autorizzata non isolata. Non aggirare policy scolastiche, non disabilitare globalmente il firewall, non usare port forwarding Internet.

## Durante ogni visita

1. Premere **Inizia**. Stile, luogo, nome facoltativo, personaggio, animale facoltativo, anteprima.
2. Il visitatore può scegliere rapidamente uno dei quattro look e modificarlo. Le opzioni non compatibili sono disabilitate. Il dettaglio ingrandito a lato **non** è la scala finale; controllare l’anteprima.
3. Non chiedere cognome, email o contatti. Nome/nickname facoltativo, massimo 28 caratteri.
4. Non c’è un limite di tempo per creare. Il timer parte soltanto dopo **Genera PNG**.
5. Attendere la comparsa del QR nella scheda **Dal PC al telefono — Scansiona e scarica**. **Questo è il QR del PNG già finito.**
6. Il telefono apre la pagina della cartolina e preme **Scarica il PNG**. Se non salva: **Apri l’immagine**, pressione prolungata o menu Condividi del browser, secondo il dispositivo.
7. Verificare che il visitatore abbia salvato il PNG, **poi** premere **Ho finito · Nuova cartolina** o Ricomincia. La pagina torna all’inizio e il vecchio collegamento è revocato.

Non fare reset prima che il download sia completato. Il link dura **10 minuti** di default; quando scade la copia del servizio viene eliminata e il QR nascosto. Il PNG resta salvabile sul PC finché non si resetta la pagina. «Crea un nuovo QR per questo PNG» produce un nuovo token senza ricomporre l’immagine.

## Se qualcosa non funziona

| Problema | Azione utile |
|---|---|
| QR non visibile dopo export | Leggere il messaggio; controllare rete/IP in Info. Salvare comunque il PNG sul PC. Non mostrare il QR del creatore come sostituto di quello del file |
| Nessuna scheda di rete privata | Collegare il PC alla LAN, arrestare il servizio e riavviare. Il programma non inventa un URL raggiungibile |
| Telefono non apre il link | Stessa LAN, IP/porta corretti, autorizzazione firewall e client isolation con l’IT. Il link HTTP locale non funziona da rete mobile o da fuori sede |
| Servizio non risponde | **Scarica PNG** sul PC prima di perdere il lavoro; poi riaprire l’avvio Windows e ricaricare. Il vecchio link non va promesso come ancora valido |
| Errore di generazione | Il messaggio è in italiano; riprovare, chiudere schede pesanti se manca memoria. Non perdere il PNG già disponibile |
| Reset non confermato | Non affidare la postazione al prossimo visitatore. Ripristinare il servizio, ricaricare la pagina principale e verificare il vecchio link revocato |
| File HTML non trovato | Estrarre tutto lo ZIP; EXE e HTML devono restare accanto con i nomi originali |
| Tutte le porte occupate | Verificare con l’IT i programmi attivi; non lanciare copie incontrollate. Le porte alternative sono 8787 e 8899 |
| HTML su iPhone mostra solo un’anteprima | File/Quick Look può non eseguire JavaScript. Usare `/telefono` tramite il QR creatore in Info; nessun comando sul telefono |
| Blocco antivirus/policy | Chiedere la verifica IT del binario non firmato; non aggirare il blocco. L’HTML autonomo può ancora esportare localmente ma non creare un servizio QR |

## Fine evento e riservatezza

1. Premere Ricomincia / Nuova cartolina.
2. Aprire Info e premere **Arresta servizio locale**, confermando. Chiudere poi il browser. Chiudere soltanto la finestra del browser lascia il servizio attivo.
3. Il servizio Go non ha una cartella PNG da svuotare: conserva una sola copia temporanea in RAM e la azzera alla revoca/arresto. Non è una promessa di cancellazione forense del sistema operativo.
4. Gestire separatamente i file salvati volontariamente in **Download** sul PC e la cronologia del browser condiviso. Il reset non può cancellare copie già scaricate sui telefoni.
5. Non archiviare cartoline di visitatori, non inviarle al cloud e non includerle in nuovi ZIP. I campioni in `renders/` usano solo nomi fittizi.

Per l’edizione Python: avvio `start.cmd` / `bash start.sh` dopo installazione; **Ctrl+C** per arrestare e controllare `var/exports` vuota. Non applicare questa procedura terminale all’EXE Windows.

**Riferimenti:** README.md · TEST_REPORT.md · GUIDA_RAPIDA.pdf · GUIDA_FILE_UNICO_E_TELEFONO.md · SOURCES_AND_LICENSES.md.
