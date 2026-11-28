# L'ORACOLO DI DELFI — Report di consegna

**Versione 1.0.0 · 27 novembre 2026**  
Esperienza arcade autonoma per l'Open Day. Codice, risorse, font, screenshot e verifiche sono inclusi nel progetto.

## 1. Esperienza completata

Il percorso è completo: **domanda → consultazione → rivelazione → nuova domanda**, senza ricaricare la pagina.

- Santuario notturno originale in pixel art: tempio, colonne, montagne a gradini, luna, cipressi, allori e bracieri. Pizia e tavoletta appartengono alla stessa scena.
- Titoli pixel, domanda e responso in un font di sistema leggibile; pulsanti arcade con stati hover, pressione, focus e disabilitazione.
- Campo da **140 caratteri**, contatore, gestione di stringhe vuote o composte da spazi, invio da tastiera e supporto touch.
- **50 responsi unici**, organizzati in cinque famiglie da dieci. Ogni blocco di cinque estrazioni visita le cinque famiglie in ordine mescolato. Le ultime otto frasi vengono escluse dai candidati.
- Nessuna risposta viene generata o scelta in base al significato della domanda. Non sono presenti chatbot, modelli, chiavi, account o API esterne.
- Controllo locale su termini espliciti di emergenza e scelte mediche: al posto del sorteggio compare una **frase fissa**, con invito a chiedere aiuto competente e indicazione del 112 in caso di pericolo immediato.
- Suoni originali facoltativi, **spenti all'avvio**, e comando schermo intero quando consentito dal browser.
- Nessuna domanda salvata o inviata. La memoria dei responsi recenti è soltanto in RAM; la cache offline contiene file statici.

## 2. Animazioni implementate

La Pizia è disegnata su un Canvas **96 × 128**, scalato senza interpolazione, con un'unica base grafica condivisa:

| Stato | Comportamento |
|---|---|
| **Idle** | Respiro di un pixel e breve battito di ciglia; bocca chiusa |
| **Consultazione** | Occhi chiusi, posa di concentrazione, aura, sigillo e scintille; attesa di circa **1,35 s** |
| **Parlato** | Tre fotogrammi della bocca — chiusa, intermedia, aperta — alternati durante la comparsa delle lettere; chiusura sugli spazi e sulla punteggiatura |
| **Conclusione** | Fine della scrittura, bocca chiusa, ritorno idle e comparsa del pulsante per ricominciare |

Il pannello riserva lo spazio del responso prima della rivelazione; nel test del ciclo ordinario la variazione di altezza è inferiore a 2 pixel. Le domande lunghe e la nota di sicurezza possono invece allargare verticalmente il pannello, senza tagliare il contenuto.

Con **riduzione del movimento** attiva, il testo appare subito dopo una breve transizione di stato, senza animazioni decorative o macchina da scrivere. Non è prevista una voce registrata: il parlato è visivo, come richiesto per la rivelazione del testo.

## 3. Verifiche effettuate

**Esito finale: 5/5 gruppi di test del motore, 19/19 nel browser, 3/3 di portabilità.**

Browser reale: **Chromium 159.0.8154.6**, pilotato con Playwright. I render sono stati acquisiti dall'app avviata e controllati visivamente, non ricostruiti a mano.

| Verifica obbligatoria | Esito |
|---|---|
| Apertura della schermata principale | Superata; risorse e font locali caricati |
| Inserimento della domanda e consultazione | Superata con clic, tocco emulato e Invio |
| Estrazione e visualizzazione del responso | Superata; frasi appartenenti all'archivio locale |
| Pizia in attesa | Superata; occhi chiusi e stato di concentrazione osservati |
| Bocca sincronizzata alla rivelazione | Superata; rilevati tutti e tre i fotogrammi insieme all'avanzamento del testo |
| Ritorno idle | Superata; bocca chiusa e nuova consultazione disponibile |
| Reset senza ricaricare | Superata; **13 cicli** consecutivi nel test browser |
| Assenza di ripetizioni immediate | Superata; esclusione degli ultimi otto responsi anche su **10.000 estrazioni** |
| Campo vuoto e soli spazi | Superata; avviso, focus sul campo, nessun sorteggio |
| Domande lunghe | Superata; limite a 140, contatore ed eco completa senza overflow |
| Desktop e mobile | Superata; viewport da **320 a 1920 px**, touch emulato a **390 × 844**, controlli anche ai limiti 640/641 px |
| Consultazione senza rete | Superata; anche ricaricamento dalla cache e apertura diretta del file offline |
| Audio | Superata la creazione degli effetti Web Audio, l'attivazione e il silenziamento; nessun nuovo oscillatore dopo OFF |

### Controlli aggiuntivi

- Distribuzione su 10.000 estrazioni: **2.000 per famiglia**, tutte le 50 frasi raggiunte. Verificati anche i valori estremi del generatore casuale.
- Doppio clic reale e invii duplicati: una sola estrazione, nessuno stato bloccato.
- Domande delicate: risposta fissa senza chiamare il sorteggio; reset ripristinato. Controllati anche accenti, maiuscole e alcuni casi ordinari da non intercettare.
- Nessuna interpretazione HTML del testo inserito; nessun dato della domanda nelle richieste, nei cookie o nello storage.
- Audit automatici axe-core sulle regole WCAG A/AA selezionate: **zero violazioni rilevate**, sia sul modulo sia sul responso. Questo non equivale a una certificazione completa di accessibilità.
- Schermo intero: entrata e uscita verificate nel browser di test.
- **Nessun errore JavaScript o risorsa mancante** nelle esecuzioni finali.

I risultati riproducibili sono in `tests/engine-results.json`, `tests/browser-results.json` e `tests/portable-results.json`. Gli script sono inclusi; le dipendenze di test non servono all'applicazione.

## 4. Screenshot e risorse

La cartella `renders/` contiene **10 screenshot reali**: schermata iniziale, dettaglio idle, consultazione, parlato, responso completo, mobile iniziale e finale, validazione e protezione locale su desktop/mobile. La mappa dei file è in `renders/README.md`.

Pizia, fondali, SVG e animazioni sono costruiti in Canvas/SVG/CSS su una griglia di pixel. **Nessun generatore d'immagini e nessun asset di videogiochi di terzi.** I font Press Start 2P e VT323 sono inclusi localmente insieme alle licenze OFL: vedi `CREDITI.md`.

## 5. Avvio e consegna

Il progetto non richiede build o dipendenze runtime. Dopo l'estrazione dello ZIP:

- **Avvio diretto:** aprire `index.html`; verificato in Chromium con rete disattivata.
- **Server locale:** dalla cartella eseguire `python3 serve.py` e aprire `http://127.0.0.1:8080`. Su Windows è possibile usare `py -3 serve.py`.
- La cache per ricaricare una pagina HTTP offline richiede **localhost o HTTPS**. Il badge «PRONTO ANCHE OFFLINE» appare dopo l'attivazione della cache.

Lo ZIP di consegna contiene la cartella completa e non include dipendenze installate, cache Python o percorsi assoluti della sandbox. Il controllo di rilascio ne verifica integrità, corrispondenza dei file, estrazione in una nuova cartella e avvio della copia estratta, sia da file sia tramite il server incluso.

Non sono stati creati repository, branch o pubblicazioni esterne del progetto.

## 6. Limiti dichiarati e controllo allo stand

- Il filtro locale è intenzionalmente limitato: **può avere falsi positivi e non intercettare parafrasi**. Non è uno strumento di moderazione completa o di valutazione sanitaria. La nota ludica resta visibile nell'esperienza.
- Le verifiche mobile sono effettuate mediante viewport e touch emulati in Chromium, **non su telefoni fisici**. Safari e Firefox non sono stati collaudati in questa consegna.
- Gli eventi e lo stato di Web Audio sono verificati; **gli altoparlanti fisici e il volume della sala non sono verificabili nella sandbox**. Provare il volume sul dispositivo dello stand.
- Il fullscreen dipende dai permessi del browser; in alcuni iframe può non essere disponibile. Il gioco resta utilizzabile.
- La cache può essere cancellata dal browser. Conservare una copia estratta dei file, anziché affidarsi soltanto alla cache.
- La domanda rimane visibile fino al reset, pur non venendo salvata. Prima della persona successiva premere **PONI UN'ALTRA DOMANDA**.

Non risultano problemi aperti nel ciclo principale nelle configurazioni collaudate.
