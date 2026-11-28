# Cartolina Casardi · PC con QR Internet

**Creatore 3.3.1 + servizio `qr-internet-1` · Open Day 2026/27.**

Questa consegna aggiunge il **download del PNG con un solo QR anche quando PC e telefono non sono sulla stessa Wi-Fi**. Il telefono può usare 4G/5G o un’altra connessione Internet. La modalità Internet usa Cloudflare Quick Tunnel, è facoltativa e richiede conferma.

**Non è una correzione del blocco Android/Arena.** Renderer, trascinamenti, dati incorporati e tutti i 473 asset sono mantenuti identici alla base 3.3.1; quel problema fisico rimane non dichiarato risolto. Le conclusioni precedenti sulla cattura del puntatore non costituiscono una certificazione della causa originale.

## Avvio rapido

1. Se una vecchia versione è aperta: **Info → Arresta servizio locale**. Chiudere il browser non basta.
2. Estrarre **tutto il nuovo ZIP** in una cartella separata e fare doppio clic su **`AVVIA_CARTOLINA_WINDOWS.exe`**. Tenere l’HTML abbinato accanto all’EXE.
3. Nell’app: **Info → Attiva QR Internet · anche 4G/5G**. Leggere e confermare l’avviso.
4. Attendere **«QR Internet attivo»**. La prima volta viene scaricato il componente ufficiale Cloudflare, circa 55 MB, verificato con SHA-256; poi viene riutilizzata la cache utente verificata.
5. Creare la cartolina → **Genera PNG** → scansionare **QR INTERNET** dal telefono → **Scarica il PNG**.

**Lasciare PC, programma e Internet attivi.** Non servono Python, Go, terminale, account del visitatore o stessa Wi-Fi. Windows 10/11 x64; EXE non firmato. Non disattivare protezioni o aggirare policy: eventuali blocchi vanno gestiti dall’IT.

**[Guida completa QR Internet](docs/QR_INTERNET.md)** · **[Ricerca soluzione stabile gratuita](docs/SOLUZIONE_STABILE_GRATUITA_QR.md)** · **[Verifiche di questa consegna](TEST_REPORT.md)**

## Tre aperture diverse

| Apertura | Risultato |
|---|---|
| EXE + HTML abbinato, QR Internet attivato | Creatore PC + QR HTTPS del **PNG finito**, raggiungibile da altre reti. Internet su entrambi i dispositivi; PC acceso. |
| EXE + HTML, modalità LAN | Creatore PC + QR locale del PNG; PC e telefono devono essere sulla stessa rete comunicante. |
| Solo `Cartolina_Casardi_PC_e_Telefono.html` | Creatore completo offline PC/telefono e salvataggio PNG locale. Il solo HTML **non avvia un tunnel**. |

`start.cmd` avvia soltanto l’edizione Python facoltativa con ambiente già installato; **non è l’avvio ordinario del pacchetto Windows**. Non viene cambiato da questa revisione. Il QR separato del creatore telefono in Info resta LAN, non viene pubblicato dal tunnel.

## Dati, sicurezza e limiti

- Il PNG è **quello già composto**, non viene ricreato sul telefono. Rimane 3000 × 2000, con crediti incorporati e NES 600 × 400 ingrandita ×5 senza interpolazione.
- Una sola copia temporanea nella RAM del servizio, token casuale 192 bit, massimo 10 minuti. Reset, modifica invalidante, nuova sessione o arresto revocano il link. Nessun PNG viene scritto su disco dal servizio Go.
- Con QR Internet il contenuto **transita da Cloudflare**; HTTPS non nasconde il contenuto al fornitore. Non si promette assenza/cancellazione dei suoi log. Chi possiede il link può scaricare il PNG finché è valido.
- Il tunnel raggiunge un listener loopback separato e di sola lettura: **non** la pagina principale, il creatore, i file del PC, le API owner o i comandi di reset/arresto. Non aprire porte in ingresso sul router.
- Nessuna attivazione automatica del tunnel e nessuna nuova raccolta di email/account. La creazione offline non effettua richieste di rete.
- La disponibilità pubblica viene controllata prima di mostrare il QR Internet. Una caduta del tunnel nasconde il QR; il PNG locale resta scaricabile. Nessun fallback LAN nascosto presentato come Internet.
- Quick Tunnels è gratuito senza account/dominio ma è temporaneo e senza SLA, destinato a prove/demo. Non è presentato come servizio definitivo per lo stand. Vedi la ricerca allegata per le alternative e le quote dei piani gratuiti.

## Verifiche effettuate e non effettuate

Test Go con race detector, vero tunnel HTTPS Cloudflare, QR decodificato indipendentemente, confronto SHA-256/bytes del PNG, revoca pubblica, isolamento degli endpoint, browser Chromium desktop e telefono touch emulato, interruzione reale del componente e risposta UI obsoleta trattenuta.

**Non eseguiti:** Windows nativo e Job Object/SmartScreen/antivirus sul dispositivo, telefono fisico 4G/5G, rete scolastica, iOS/Safari/Firefox. La compilazione Windows non equivale a quei test. Nessuna richiesta di nuovi test Android all’utente.

I vecchi report in `docs/test-results/` descrivono la base storica e conservano i propri hash: non vengono etichettati come rieseguiti su questo aggiornamento. Quelli della funzione corrente iniziano con **`qr-internet-`**; sono conservati anche i primi tentativi incompleti del laboratorio.

## Fonti e materiale originale

Sono conservati sorgenti browser/Go/Python, dipendenza QR vendorizzata, tutti gli asset e le relative licenze, esempi e guide. **[Fonti e licenze](SOURCES_AND_LICENSES.md)** · **[Matrice asset](ASSET_MATRIX.md)** · **[README 3.3.1 storico](docs/storico/README_3_3_1_prima_QR_Internet.md)**.

Le fotografie conservano le loro licenze; LPC non è interamente CC0; il logo ufficiale Casardi non è un’immagine generata. Le dodici scene NES sono illustrazioni assistite da IA, non rilievi storici. La foto Casardi resta quella storica del 1936. Si conservano attribuzioni, limiti e documentazione della base.

## Ricompilazione e QA per manutentori

Non necessarie all’operatore:

```sh
cd service
go test -mod=vendor -race -count=1 -v ./...
cd ..
python scripts/build_standalone.py
python scripts/build_service.py --go /percorso/go --native /percorso/casardi-service
python scripts/qr_internet_live_test.py --binary /percorso/casardi-service
python scripts/qr_internet_ui_test.py --binary /percorso/casardi-service
python scripts/package_qr_internet.py
```

Go ≥1.24, qui 1.27.4 verificato; CGO disabilitato per l’EXE e dipendenza QR vendorizzata. I test Go con `-race` richiedono il toolchain C nella macchina QA, non sul PC dello stand. I due test Internet richiedono connessione e autorizzazione a creare un Quick Tunnel, che arrestano a fine prova. Le dipendenze del laboratorio non sono distribuite come runtime; per gli script nuovi servono anche Playwright, requests, OpenCV e NumPy.

Il packager storico `scripts/package.py` riguarda la base 3.3.1 e i suoi report, **non questa revisione**. Per la consegna corrente usare `package_qr_internet.py`, che richiede le nuove verifiche e genera manifesto e SHA-256. Toolchain, browser di QA, componente Cloudflare scaricato, credenziali, cache e dati dei visitatori sono esclusi.
