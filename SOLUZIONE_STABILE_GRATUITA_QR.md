# QR su reti diverse · soluzione più stabile e gratuita

## Risultato della ricerca

**Per ora è integrato Cloudflare Quick Tunnel, come richiesto.** La soluzione stabile non è già attiva: richiede almeno una configurazione sotto un account autorizzato della scuola. Non sono stati creati account, acquistati domini, modificati DNS o attivati piani a pagamento.

La raccomandazione dipende da una condizione concreta:

| Situazione | Strada consigliata | Costo e requisito |
|---|---|---|
| La scuola dispone già di un dominio utilizzabile su Cloudflare | **Cloudflare Tunnel nominativo**, con hostname permanente e solo listener download | Il tunnel base è gratuito; servono account e autorizzazione su un dominio già disponibile. Un eventuale nuovo dominio non è incluso gratuitamente. |
| Non è disponibile un dominio autorizzato | **Cloudflare Worker Free con URL `workers.dev` e relay dedicato** | Piano gratuito entro le quote; servono account e una nuova implementazione/deploy del relay. Non è un servizio già distribuito da questa consegna. |

### 1. Preferenza se esiste già il dominio: tunnel nominativo

È il passaggio più piccolo dall’integrazione attuale: il PC conserva il PNG in RAM e rende pubblico **solo il canale download**, ma il tunnel e il nome sono persistenti e riconnettibili. Il token casuale, la scadenza e la revoca della singola cartolina restano necessari: un indirizzo stabile non deve diventare una galleria pubblica.

Cloudflare documenta la creazione del tunnel sotto account e l’associazione di hostname/dominio; il servizio base di connessione outbound è offerto senza costo separato. [1](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/) [2](https://blog.cloudflare.com/tunnel-for-everyone/)

**Condizioni:** disponibilità e controllo autorizzato del dominio, approvazione IT, PC acceso e connesso. Non è una garanzia di funzionamento quando il PC o Internet si spengono. Non suggerisco di trasferire indiscriminatamente i DNS della scuola per aggiungere questa sola funzione. L’implementazione corrente accetta esclusivamente Quick Tunnels; il supporto al tunnel nominativo va aggiunto con gestione sicura della relativa credenziale, mai nel repository.

### 2. Senza dominio: Worker Free + relay

Un Worker dispone di un indirizzo assegnato del tipo **`nome-progetto.sottodominio-account.workers.dev`**, che non dipende dal nome casuale di un Quick Tunnel. Non richiede l’onboarding di un dominio proprio. Cloudflare raccomanda però un dominio/route dedicato per servizi di produzione critici: `workers.dev` non va venduto come hosting con SLA. [3](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)

Architettura proposta, **non ancora implementata o distribuita**:

1. L’app Windows apre una connessione in uscita autenticata verso un piccolo relay HTTPS/WebSocket.
2. Il QR continua a contenere **un solo link al PNG già composto**, non parametri per ricrearlo e non un secondo QR di accoppiamento.
3. Il relay inoltra soltanto le richieste del download autorizzato. Il PC mantiene PNG, scadenza e revoca; non occorre una galleria né pubblicare file nel repository.
4. Un Durable Object coordina la connessione e i token. La Hibernation API consente di mantenere connessioni WebSocket senza tenere permanentemente attivo l’oggetto quando è inattivo. Il codice deve ripristinare correttamente lo stato, gestire disconnessioni, richieste simultanee, limiti e revoche. [4](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)

**Quote verificate nella documentazione ufficiale:** Workers Free include **100.000 richieste al giorno** e **10 ms di CPU per invocazione**; non deve ricomporre o elaborare il PNG HD. I Durable Objects del piano Free sono limitati al backend SQLite, con **100.000 richieste al giorno** e **13.000 GB-s al giorno** di durata. Superare una quota Free causa errori: non è disponibilità illimitata. [5](https://developers.cloudflare.com/workers/platform/pricing/) [6](https://developers.cloudflare.com/durable-objects/platform/pricing/)

È una candidata gratuita con endpoint stabile, **non una promessa di SLA o di conformità privacy già certificata**. Richiede sviluppo, collaudo, account autorizzato e controllo dell’uso; il PNG transiterebbe comunque dal fornitore. Non è stata predisposta una finta URL attiva.

### Perché non scelgo ngrok Free come alternativa principale

ngrok Free ha effettivamente un dominio assegnato stabile e nessun timeout della sessione, ma include **1 GB/mese di traffico in uscita**, **20.000 richieste/mese** e una pagina di avviso davanti al traffico HTML dei browser. Un PNG HD può essere trasferito sia per l’anteprima sia per il download: la quota di traffico va valutata sui bytes reali, non sul solo numero di visitatori. Per uno stand fotografico non lo considero automaticamente un miglioramento. [7](https://ngrok.com/docs/pricing-limits/free-plan-limits)

## Decisione operativa

**Adesso:** usare il nuovo pulsante QR Internet, senza account. **Per stabilizzare:** prima scelta tunnel nominativo su dominio già autorizzato; in assenza di quel dominio, relay Worker Free con account della scuola.

Il costo zero dei piani non equivale a garanzia di disponibilità. Non risultano autorizzati interventi su account/DNS della scuola: la ricerca è conclusa, il servizio persistente non è stato attivato. Non serve configurarlo per utilizzare intanto il Quick Tunnel incluso.
