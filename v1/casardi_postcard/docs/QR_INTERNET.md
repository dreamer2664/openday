# Cartolina Casardi · QR Internet
## Telefono in 4G/5G o su una Wi-Fi diversa dal PC

**Aggiornamento del servizio Windows: `qr-internet-1`.** Il creatore rimane basato sulla 3.3.1; non è una nuova correzione del trascinamento Android/Arena.

## Aggiornare la copia già aperta

1. Nella **vecchia applicazione**, aprire **Info → Arresta servizio locale**. Chiudere soltanto la scheda del browser non arresta il programma.
2. Estrarre **tutto il nuovo ZIP** in una cartella separata. Non avviare dall’interno dello ZIP e non mescolare il nuovo EXE con il vecchio HTML.
3. Fare doppio clic su **`AVVIA_CARTOLINA_WINDOWS.exe`**, non su `start.cmd` (l’edizione Python facoltativa) e non sul solo HTML.
4. Il nuovo programma riconosce una precedente istanza ancora attiva e mostra come arrestarla, invece di riaprire silenziosamente la vecchia versione senza QR Internet.

Windows 10/11 x64. L’EXE è non firmato digitalmente; non disattivare SmartScreen, antivirus, firewall o policy. Eventuali autorizzazioni vanno gestite dall’IT.

## Attivazione senza terminale

1. Collegare il **PC a Internet** con una connessione autorizzata. Il telefono può usare **4G/5G, un’altra Wi-Fi o qualsiasi altra connessione Internet**: non serve la stessa rete del PC.
2. Aprire **Info → Servizio dello stand → Attiva QR Internet · anche 4G/5G** e leggere/confermare l’avviso. Lo stesso comando è disponibile accanto al QR del PNG.
3. Al primo uso il programma scarica il componente ufficiale **Cloudflare `cloudflared` 2026.11.2**, circa **55 MB**, nella cache dell’utente. Non richiede Go, Python, terminale o installazione amministrativa. Il componente viene eseguito soltanto se dimensione e SHA-256 corrispondono alla versione fissata; anche la copia in cache viene ricontrollata.
4. Attendere **«QR Internet attivo»**. Il programma controlla davvero il proprio indirizzo HTTPS pubblico prima di usarlo. La sola assegnazione di un hostname non è considerata sufficiente.
5. Creare la cartolina e premere **Genera PNG**. Il QR contrassegnato **QR INTERNET** apre **il download del PNG già pronto**, non il creatore.
6. Sul telefono scansionare il QR, aprire il collegamento e premere **Scarica il PNG**. Nessun account, app aggiuntiva o comando sul telefono.

**Lasciare accesi PC, programma e Internet fino al termine del download.** Il tunnel non trasforma il PC spento in un server disponibile.

## Scadenza, nuova cartolina e arresto

- Il collegamento usa un token casuale di **192 bit**, dura al massimo **10 minuti** e viene revocato con **Nuova cartolina**, Ricomincia, modifica che invalida l’export, nuova sessione del PC o arresto.
- Il PNG originale resta nella RAM del PC; il servizio non ne crea una copia su disco. Le copie già scaricate non possono essere cancellate a distanza.
- **Disattiva QR Internet · torna a LAN** chiude il tunnel. Da quel momento il QR LAN torna a richiedere la stessa rete locale; non viene presentato come QR per il 4G.
- **Arresta servizio locale** ferma anche il tunnel. Su Windows il componente è associato a un Job Object privato con chiusura dei processi figli quando termina il programma padre.
- Se il tunnel cade, il QR Internet viene nascosto e compare un messaggio: **Scarica PNG sul PC** resta disponibile. La scadenza non viene prolungata automaticamente.
- Il QR distinto del **creatore telefono** in Info resta **solo LAN**: il tunnel non pubblica quella funzione.

## Cosa passa su Internet

L’attivazione è facoltativa e richiede conferma. Il download del PNG **transita da Cloudflare**, un fornitore esterno che può elaborare il contenuto e metadati del traffico. HTTPS non significa cifratura end-to-end rispetto a quel fornitore. Non si promette assenza o cancellazione dei suoi log; la scuola deve approvare l’uso del servizio e l’informativa appropriata.

Sul PC viene aperto un listener separato, **solo loopback e sola lettura**. Sono pubblicati unicamente la pagina di download e il PNG del token valido, più una verifica di disponibilità con nonce casuale. **Non vengono esposti** creatore, pagina principale, sorgenti, chiavi owner, API di esportazione/reset/arresto o file del disco. Richieste di scrittura pubbliche sono rifiutate. Risposte del download: `no-store` e `noindex`.

Chiunque riceva o fotografi il link può scaricare quella cartolina finché è valido. Non inserire cognomi, contatti o dati sensibili nell’immagine.

## Se non si collega

- La prima attivazione richiede il download da GitHub Releases e il collegamento a Cloudflare. Un download incompleto o un hash errato non vengono eseguiti.
- L’interfaccia mostra lo stato: preparazione, collegamento, attivo, ripristino o errore. Un errore non provoca un passaggio nascosto a un QR LAN spacciato per Internet.
- Le policy della rete possono bloccare Cloudflare Tunnel. **Non aggirarle**: l’IT deve autorizzare il servizio se appropriato. Non serve aprire porte in ingresso sul router.
- In caso di mancata connessione usare il salvataggio locale del PNG. Non viene promesso il funzionamento su ogni rete scolastica.

## Limiti e verifiche

Quick Tunnels fornisce URL temporanei senza account o dominio, ma **non ha garanzia di disponibilità ed è destinato a test/demo**. Il nome pubblico cambia a ogni nuovo tunnel. [1](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)

Qui verificati: vero tunnel pubblico HTTPS, QR decodificato indipendentemente, PNG originale scaricato byte per byte, revoca, isolamento dei controlli e flusso reale Chromium PC/telefono emulato. **Non eseguiti**: Windows nativo, SmartScreen/antivirus, telefono fisico 4G/5G, iOS/Safari o rete della scuola. I dettagli e i primi tentativi incompleti sono in `docs/test-results/qr-internet-*`.

Per una strada più stabile e gratuita: [Soluzione stabile](SOLUZIONE_STABILE_GRATUITA_QR.md). Nessun account o servizio persistente è stato creato a nome dell’utente.
