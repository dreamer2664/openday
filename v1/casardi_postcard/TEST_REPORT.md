# Report di collaudo · 3.3.1 · Correzione del blocco trascinamenti

**27 novembre 2026 · Linux / Python 3.13 / Chromium Playwright / Go 1.27.4.**
Questo report riassume prove realmente eseguite. I JSON/TXT completi sono in `docs/test-results/`. Il target dei test browser è l’HTML finale con SHA-256 **`8b247a2cd86bd0485f352190590371e83150aa3feb99b2cb5c59fc517d9a09ea`**. Il campo storico «revision: 3.2» del piano `control-ui-tests.json` identifica le regressioni dei controlli precedenti: il file HTML nuovamente provato è quello 3.3.1 fissato dall’hash.

## 0 · Bug segnalato: riproduzione e correzione verificata

La 3.3 rilasciata (`004f06af…`, HTML SHA `e8e28940e478a985e2b5113606045b4eac8677c58c27055a8392b719605a392a`) si blocca se un gesto perde la cattura e termina fuori dalla cartolina: il vecchio `drag` non viene mai chiuso. Personaggio e sticker condividono quel blocco. La prova riproduce entrambi fermi, **senza caricamento o esportazione in corso**. Il contesto/browser e il gesto preciso dell’utente non sono noti: è una causa riprodotta con lo stesso sintomo, non una conferma forense del suo dispositivo.

`drag-recovery-tests.json`: **72 verifiche PASS**, **427 tentativi di gesto**, **240 trascinamenti consecutivi effettivamente verificati**, **6 PNG HD scaricati**, 141.14 s. Con mouse e touch emulato, nei due stili: perdita di cattura, cancel, blur, pagina nascosta, pagehide, Esc; fine gesto fuori dall’overlay anche con cattura indisponibile; riuso di **entrambi** gli oggetti e annullamento senza perdita delle modifiche precedenti. Gli errori di decodifica dell’anteprima sono iniettati esplicitamente; la richiesta obsoleta non può sbloccare quella corrente. I quattro download Canvas dopo le prove sono identici alla ricomposizione indipendente dagli asset; ulteriori due provengono dall’UI Pillow.

Il fix chiude il gesto in ogni via di interruzione, scarta solo lo spostamento incompleto e libera sempre lo stato di attesa dell’anteprima posseduto dalla richiesta corrente. Nessun timer che azzeri la cartolina e nessun allentamento CSP. **473 file di asset identici byte per byte alla 3.3**, compresi sfondi, LPC e logo: `unchanged-assets-3.3.1.json`. Qualità/risoluzione del logo non sono oggetto di questa patch. [Diagnosi ripetibile](docs/BUG_TRASCINAMENTO_3.3.1.md).

## 1 · Funzionalità conservate e nuovamente verificate

- Trascinamento del personaggio con mouse, dito emulato e tastiera, con companion solidale e contenimento nella cornice. Tre taglie effettivamente diverse a passi interi, non una serie di percentuali senza cambiamento dei pixel.
- Ultimo pannello facoltativo: otto sticker, fino a sei presenti; trascinamento, ridimensionamento, inclinazione, rimozione, ordinamento, annullamento. Il logo istituzionale conserva proporzioni e orientamento.
- Targhetta: finitura, simbolo, percorso e angolo opzionali. Senza selezioni non vengono aggiunti elementi o testi. Ripristino della composizione distinto dal reset del visitatore.
- Preview a livelli reali; PNG ricomposto dagli asset a 3000 × 2000. Nessun screenshot del DOM o contorno UI nell’export. NES nativo 600 × 400 ingrandito ×5.
- Logo autentico estratto dalla brochure ufficiale, distinto dal Pegaso generato, attribuito nel PNG quando scelto. Sette sticker originali assistiti da IA; fonte, licenza ed eccezioni documentate.

| Evidenza eseguita | Risultato | Ambito e limite |
|---|---|---|
| `unit-tests.txt` | **76 test PASS**, 11.086 s | 58 regressioni conservate + 18 su composizione, validazione, asset, API, licenze, PNG e opzionalità |
| `composition-audit.json` | **3240 posizionamenti**, **324 geometrie sticker**, **745 validazioni PASS** | Geometria/normalizzazione Canvas-Pillow entro 1e-7; nessun gruppo manuale fuori cornice; non inferisce piani architettonici reali |
| `composition-ui-tests.json` | **26 verifiche PASS**, 70.02 s; **6 prove di export scaricato** | Mouse, frecce/Maiusc, cursori reali, touch CDP a 320/390/768 px, avanti/indietro, annulla, reset, logo/targhetta; file offline e UI Python nei due stili |
| Pixel del PNG dopo drag | **818,903 / 811,950 pixel cambiati** | Due esempi effettivi foto/NES; non una misura universale di qualità percettiva |
| PNG decorati dall’UI | **Identici byte per byte alla ricomposizione dello stesso job** | Entrambi i modi Canvas; testo/attributi e crediti scelti; sprite e dettagli non sono sintetizzati in anteprima |
| Isolamento del file estratto | **Foto + NES decorati PASS** | Solo HTML copiato da solo, rete del browser disattivata, personaggio spostato, sticker e logo incorporati e attribuiti |

## 2 · Regressioni conservate e nuovamente eseguite

| File / prova | Risultato |
|---|---|
| `asset-audit.json` | **7716 controlli PASS**; 56 parti LPC, 255 PNG sorgente, 85 atlanti verificati |
| `browser-sprite-audit.json` | **938 confronti RGBA esatti PASS**, nessuna differenza; non è identità completa dei due compositori fotografici |
| `layout-audit.json` | **12096 layout consigliati PASS**, nessuna uscita o sovrapposizione fra basi dei piedi |
| `nes-art-audit.json` | 12 sfondi canonici 600 × 400, massimo 64 colori; **6 sfondi 3.1 invariati byte per byte** |
| `control-effects-audit.json` | **3250 confronti PASS**; 563 alternative zero-pixel misurate e spiegate, non contate come effetti riusciti |
| `control-ui-tests.json` | **9 verifiche PASS**, **137 alternative effettivamente cliccate** in nove categorie; zoom, scopertura e parità effetti |
| `nes-retro-ui.json` | **8 verifiche PASS**, responsive 320–1366 px, note foto/NES distinte e disclosure IA |
| `standalone-browser-tests.json` | **22 verifiche + 24 export HD PASS**, 43.97 s; un solo tab offline, 12 NES esattamente ×5, opacità/300 dpi/crediti |
| `browser-tests.json` | **16 verifiche UI Python PASS**; errori/retry/reset, tastiera, scadenza, responsive |
| `hd-http-regression.json` | **24 PNG HD HTTP PASS**, 98.61 s; reset conclusivo, nessuna cartolina attiva |
| `go-service-tests.txt` | **26 test principali Go con race detector PASS**; nessuna modifica al sorgente del servizio rispetto alla base verificata |
| `go-service-browser.json` | **15 verifiche PASS**, 21.68 s; QR di una cartolina decorata decodificato, due contesti indipendenti, download identico, revoca e fallback |
| `go-real-expiry.json` | **Scadenza reale 300 secondi PASS**, osservata dopo **301.48 s**; landing/file/image 410, copia RAM rimossa; nessun salto del clock server |
| `go-launch-lifecycle.json` | **7 verifiche PASS** con configurazione standard senza eccezione preview: HTML affiancato, cwd diversa, seconda istanza, errori, host/origin/key e arresto browser/socket |

I test del clock UI e della scadenza reale sono distinti: solo il secondo attende il tempo del backend. La copia del servizio Windows resta in RAM; la distinta edizione Python facoltativa conserva il suo storage temporaneo su disco e la pulizia prevista, documentati nel README.

## 3 · Materiali e ispezioni

- 12 fotografie e 12 illustrazioni architettoniche, 24 combinazioni; famiglia LPC/sci-fi e otto companion conservati.
- 13 PNG HD di base + **2 PNG HD decorati** con nomi fittizi (`renders/Z_33_*`), 24 JPG attribuiti. I due esempi nuovi provengono dai download reali dell’UI, non da un mockup.
- Tavole 01–13 precedenti conservate o rigenerate dai rispettivi test; **14** mostra tutti gli otto sticker, **15** il nuovo editor nei due stili, **16** il touch emulato a 390 px. Screenshot aggiuntivi dei tre sistemi UI nei rispettivi percorsi.
- Sette sticker e stemma ufficiale visivamente controllati; esempi PNG decorati, schermata mobile e guida A4 di una pagina aperti durante lo sviluppo. Non è approvazione grafica del committente o dell’istituto.
- L’identificazione dello stemma è riscontrata in brochure, intestazione storica e documento scolastico corrente. Il pittogramma Studente atleta, la copertina del giornalino e lo stemma della Repubblica sono stati scartati.

## 4 · Integrità e pacchetto estratto

- HTML: **24,820,033 byte**, SHA-256 `8b247a2cd86bd0485f352190590371e83150aa3feb99b2cb5c59fc517d9a09ea`.
- EXE: **10,467,840 byte**, SHA-256 `f49fcf7d0d69b01e0d52f0bceb6893722c7598cbc7bff28504b1ea3a7b87d465`; PE Windows x64 GUI **cross-compilato**, non eseguito nativamente qui.
- Go/vendor: **21 file**, SHA-256 aggregato `a2d19278837a05e253a2a7dd35874720651c21b5f262b754fe11d330ee994122`.
- **538 file runtime identici** nella copia realmente estratta; fingerprint `c4e76ad1e82228b2ef83298b20c8b5e00bb0a7b6cd5908e42dec4d74f3352c20`.

`scripts/package_smoke.py` è stato eseguito su una copia estratta esterna all’albero sorgente: sorgenti Go vendorizzati ricompilati nella copia, proprio eseguibile Linux, HTML letto accanto. Il solo HTML è stato copiato da solo e aperto offline, generando **cartoline decorate e con personaggio spostato** nei due stili. Il servizio estratto ha consegnato gli stessi byte attraverso veri URL/QR decodificati; reset/RAM vuota, `/telefono` completo senza chiave e nessun directory browsing PASS. Il PE Windows viene confrontato, non eseguito in Linux.

EXE e `start.sh` mantengono i permessi eseguibili sul filesystem, nello ZIP e nell’albero Git; il packager rifiuta un file senza questi bit.

La distribuzione finale è generata dopo questa verifica con `scripts/package.py`: prove e hash correnti, sintassi, dimensioni/attribuzioni, CRC ZIP e SHA-256 di ogni membro in `MANIFEST.sha256`. Esclusi credenziali, cache/toolchain, binari Linux di QA e file visitatori. Il sidecar `.zip.sha256` copre l’archivio, evitando un hash circolare all’interno del report.

## 5 · Errori di sviluppo e limiti dichiarati

I tentativi interrotti durante le modifiche non sono conteggiati come PASS. Nella prima catena 3.3.1 Chromium ha restituito `Target crashed` durante una prova con più servizi e memoria di collaudo attivi: quella catena non è dichiarata riuscita; la suite editor è stata rieseguita separatamente dopo l’arresto dei servizi non necessari. Questo episodio non dimostra che il blocco segnalato dall’utente fosse un esaurimento di memoria. Il confronto Python/JS ha individuato una differenza sulla validazione dei valori nulli: corretta e rieseguiti tutti i 745 casi. Un primo test UI del servizio chiudeva per errore un accordion già aperto al secondo ciclo: corretta la condizione del test, poi rieseguite tutte le 15 verifiche. Un primo test scaricava un URL relativo senza base nel client di QA: corretto il test e rieseguite le prove complete. Il blocco CSP di una prima istruzione di attesa del test non è stato risolto allentando la policy dell’app. Le tre taglie discrete evitano percentuali intermedie che, sulla piccola griglia NES, non cambierebbero lo sprite.

La finitura foto, i font e le ombre dei renderer non sono pixel-identici; la parità esatta attestata riguarda sprite e geometria. Posizionamento libero non significa supporto fisicamente credibile in ogni punto. Le fotografie mantengono licenze proprie; il Casardi fotografico è **1936, 707 × 491**, non una foto attuale. Il logo è soggetto alle eccezioni delle note legali e ai diritti di marchio: nessuna approvazione istituzionale o liberatoria generale inventata.

| Aspetto | Stato / azione residua |
|---|---|
| Windows reale, associazione browser, SmartScreen e firewall | **NON ESEGUITI**; prova sul PC dello stand con IT, eseguibile non firmato |
| Telefono fisico Android/iOS e Wi-Fi/VLAN scolastica | **NON ESEGUITI**; touch e secondo contesto sono emulazione Linux, non hardware |
| Safari/Firefox, Web Share nativo e tastiera virtuale reale | **NON ESEGUITI** |
| Solo HTML locale → normale QR → altro telefono | **NON REALIZZABILE senza servizio raggiungibile**; nessun cloud/WebRTC/due-QR non approvato aggiunto |
| Prestazioni e RAM su ogni telefono / molti client | Non certificate; rendering seriale, rilasci Canvas espliciti, TMPDIR su disco nei test; 8 GB RAM consigliati per il PC |
| Copie già scaricate / cache OS / cancellazione forense | Non eliminabili da remoto; si revocano i successivi accessi e si azzerano i buffer posseduti |
| Diritti extra-copyright, beni culturali e marchio scolastico | Da verificare per l’uso effettivo; attribuzioni/licenze non sono clearance universale |

**Prima del pubblico:** compilare la checklist della guida operatore sul Windows e sulla rete dello stand, includendo una cartolina decorata salvata da un vero secondo telefono. Nessuna prova della sandbox la sostituisce.
