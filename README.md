# Cartolina Casardi — Deluxe, PC e QR Internet

Branch **`cartolina`** di `dreamer2664/openday`. Contiene le versioni richieste, sorgenti, asset, guide, diagnostica e il nuovo servizio facoltativo **`qr-internet-1`**.

## Novità: un solo QR, anche con il telefono in 4G/5G

Il pacchetto Windows aggiornato consente **PC e telefono su reti diverse**: il QR HTTPS apre il **PNG già pronto**, non il creatore. Usa un Cloudflare Quick Tunnel temporaneo, attivato dall’operatore con conferma; non richiede account del visitatore, terminale o stessa Wi-Fi.

### Scaricare e usare il nuovo pacchetto

1. Nella vecchia app, se ancora aperta: **Info → Arresta servizio locale**. Chiudere soltanto il browser non basta.
2. Scaricare **[il nuovo ZIP Windows](Cartolina_Casardi_Windows_LPC_QR_2026-27.zip)**, estrarre tutto in una cartella separata e avviare **`AVVIA_CARTOLINA_WINDOWS.exe`**. Non mescolare EXE e HTML di revisioni diverse.
3. Aprire **Info → Attiva QR Internet · anche 4G/5G**, leggere e confermare l’avviso. Attendere **«QR Internet attivo»**.
4. **Genera PNG → scansiona QR INTERNET → Scarica il PNG** sul telefono.

Primo uso: download del componente ufficiale Cloudflare, circa **55 MB**, verificato con SHA-256 e poi riutilizzato dalla cache utente. **PC, programma e Internet devono restare attivi; anche il telefono deve avere Internet.** Windows 10/11 x64; EXE non firmato. Non disattivare protezioni o aggirare policy della rete.

**[Guida QR Internet](Guida_QR_Internet_Casardi.md)** · **[Soluzione stabile gratuita: ricerca e condizioni](SOLUZIONE_STABILE_GRATUITA_QR.md)** · **[Verifiche e hash della funzione](Verifica_QR_Internet_Casardi.json)** · **[SHA-256 dello ZIP](Cartolina_Casardi_Windows_LPC_QR_2026-27.zip.sha256)**

## Le due versioni

| Versione | File | Avvio |
|---|---|---|
| **Deluxe · creatore completo PC/telefono** | **[Cartolina_Casardi_PC_e_Telefono.html](Cartolina_Casardi_PC_e_Telefono.html)** | Scaricare e aprire nel browser: completo offline, con asset incorporati. Da solo non avvia un servizio o tunnel. |
| **PC · Windows + QR del PNG** | **[Cartolina_Casardi_Windows_LPC_QR_2026-27.zip](Cartolina_Casardi_Windows_LPC_QR_2026-27.zip)** | Estrarre tutto, avviare l’EXE e attivare QR Internet se il telefono è su un’altra rete. Resta disponibile il QR LAN. |

Deluxe è l’HTML completo confermato dall’utente, **non** A1 o Canvas. Il creatore resta basato sulla 3.3.1: questa revisione aggiorna servizio e interfaccia del trasferimento, senza modificare renderer, trascinamenti, dati incorporati, font o i **473 asset**.

## Sicurezza, privacy e disponibilità

- La modalità Internet espone **soltanto un listener di download separato e di sola lettura**, non creatore, pagina principale, file del PC, chiavi o controlli di reset/esportazione/arresto.
- Il PNG finito transita da **Cloudflare**, fornitore esterno. Non è cifratura end-to-end rispetto al fornitore, né una promessa di assenza dei suoi log. L’uso deve essere autorizzato dalla scuola.
- Token casuale 192 bit, massimo 10 minuti, revoca con Nuova cartolina/reset/sessione nuova/arresto. Una sola copia nella RAM del servizio; nessun PNG scritto su disco. Chi possiede il link può scaricare il PNG finché è valido.
- Il QR pubblico compare solo dopo il controllo del vero indirizzo HTTPS; se il tunnel cade viene nascosto. Il salvataggio sul PC resta disponibile. Non si passa di nascosto a un QR LAN spacciato per Internet.
- Quick Tunnels è temporaneo, senza garanzia di disponibilità e destinato a test/demo. La ricerca della soluzione più stabile è documentata; **nessun account, dominio, DNS o servizio persistente è stato creato o modificato**.

Verificati vero tunnel Cloudflare, PNG byte-identico, QR decodificato, revoca pubblica, isolamento, browser PC + telefono touch emulato e interruzione reale del componente. **Non verificati nativamente:** Windows/Job Object/SmartScreen/antivirus, telefono fisico 4G/5G, iOS/Safari o rete scolastica. Non sono richiesti ulteriori test Android all’utente.

## Sorgenti, prove e storia

**[v1/casardi_postcard/](v1/casardi_postcard/)** contiene i **747 file del nuovo pacchetto**: sorgenti browser, Go e Python, asset/licenze, vendor QR, script, test e documentazione. In questo branch alcuni sorgenti sono ora aggiornati per QR Internet; **il branch `v1` non viene modificato**.

La base 3.3.1 originale resta nel commit `1b627eeb721826bf9b628753e81fa8c2b1088ad9` e nello [ZIP storico in v1/](v1/Cartolina_Casardi_Windows_LPC_QR_2026-27.zip). I README/report originali della cartolina sono anche archiviati in [docs/storico/](v1/casardi_postcard/docs/storico/). Le guide PDF e i report 3.2/3.3/3.3.1 alla radice sono documenti storici, non istruzioni aggiornate del tunnel.

- **[Report della revisione QR Internet](v1/casardi_postcard/TEST_REPORT.md)** · [prove correnti `qr-internet-*`](v1/casardi_postcard/docs/test-results/) · [screenshot](v1/casardi_postcard/docs/screenshots-qr-internet/).
- **[Analisi del blocco Android/Arena](Analisi_blocco_Android_Arena.md)** e [stato della diagnosi](casardi_diagnostica/STATO_DIAGNOSI.md): il problema fisico **non è dichiarato risolto**. La nuova funzione QR non cambia questa conclusione.
- [A1 diagnostica](Cartolina_Casardi_DIAGNOSTICA_ANDROID_A1.html), [dossier tecnico](casardi_diagnostica/audit_agente/README.md), [ZIP delle prove](casardi_diagnostica/audit_agente/prove_audit.zip), script/report/log e screenshot dell’indagine sono conservati, inclusi FAIL/PARTIAL. I loro riferimenti/hash di produzione riguardano la base storica, non il nuovo ZIP QR Internet.
- **[esperimenti/](esperimenti/)** contiene Canvas e la candidata HTTP, separati e **NON RELEASE**. Non sostituiscono Deluxe/PC e non sono fix Android confermati.
- [Manifesto della pubblicazione](PUBBLICAZIONE_CARTOLINA.json): file e hash aggiornati, compresi tutti i sorgenti/asset correnti. Credenziali, cache, toolchain, browser QA, componenti Cloudflare scaricati e helper operativi Git sono esclusi.

`main`, `quiz` e `v1` rimangono invariati. Nessun merge, tag, release o cambio Pages. Il gioco preesistente resta per conservare la storia; il precedente README del gioco è in [archivio_cartolina/](archivio_cartolina/). Per la cartolina non usare il vecchio `index.html` o `AVVIA_OPEN_DAY.bat` del gioco.
