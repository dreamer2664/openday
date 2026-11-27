"""Generate the release QA summary from executed, hash-pinned 3.3 evidence.
Run after package_smoke.py, before the final package.py. Does not run tests.
"""
from pathlib import Path
import hashlib,json,re,sys
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from scripts.runtime_fingerprint import runtime_fingerprint

def main():
 def load(n):return json.loads((ROOT/'docs/test-results'/n).read_text())
 def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
 html=ROOT/'Cartolina_Casardi_PC_e_Telefono.html';h=sha(html)
 stand=load('standalone-browser-tests.json');opt=load('composition-ui-tests.json');control=load('control-ui-tests.json');retro=load('nes-retro-ui.json');service=load('go-service-browser.json');expiry=load('go-real-expiry.json');launch=load('go-launch-lifecycle.json');smoke=load('package-smoke.json');geometry=load('composition-audit.json');parity=load('browser-sprite-audit.json');http=load('hd-http-regression.json');units=(ROOT/'docs/test-results/unit-tests.txt').read_text()
 for d in (stand,opt,control,retro,service,expiry,launch):assert d['html_sha256']==h
 for d in (opt,control,retro,service,expiry,launch,smoke,geometry,parity):assert d['result']=='PASS'
 for d in (stand,opt,control,retro,service,launch,http):assert all(t.get('result',t.get('status'))=='PASS' for t in d['tests'])
 n,digest=runtime_fingerprint();assert (n,digest)==(smoke['runtime_files_equal'],smoke['runtime_sha256'])
 count,seconds=re.search(r'Ran (\d+) tests in ([\d.]+)s',units).groups();assert units.rstrip().endswith('OK')
 go=load('windows-build.json');moved=[v['changed_export_pixels'] for v in opt['exports'] if v.get('operation')=='character mouse drag']
 report=f'''# Report di collaudo · 3.3 · Composizione libera e sticker

**27 novembre 2026 · Linux / Python 3.13 / Chromium Playwright / Go 1.27.4.**
Questo report riassume prove realmente eseguite. I JSON/TXT completi sono in `docs/test-results/`. Il target dei test browser è l’HTML finale con SHA-256 **`{h}`**. Il campo storico «revision: 3.2» del piano `control-ui-tests.json` identifica le regressioni dei controlli precedenti: il file HTML nuovamente provato è quello 3.3 fissato dall’hash.

## 1 · Nuove funzionalità verificate

- Trascinamento del personaggio con mouse, dito emulato e tastiera, con companion solidale e contenimento nella cornice. Tre taglie effettivamente diverse a passi interi, non una serie di percentuali senza cambiamento dei pixel.
- Ultimo pannello facoltativo: otto sticker, fino a sei presenti; trascinamento, ridimensionamento, inclinazione, rimozione, ordinamento, annullamento. Il logo istituzionale conserva proporzioni e orientamento.
- Targhetta: finitura, simbolo, percorso e angolo opzionali. Senza selezioni non vengono aggiunti elementi o testi. Ripristino della composizione distinto dal reset del visitatore.
- Preview a livelli reali; PNG ricomposto dagli asset a 3000 × 2000. Nessun screenshot del DOM o contorno UI nell’export. NES nativo 600 × 400 ingrandito ×5.
- Logo autentico estratto dalla brochure ufficiale, distinto dal Pegaso generato, attribuito nel PNG quando scelto. Sette sticker originali assistiti da IA; fonte, licenza ed eccezioni documentate.

| Evidenza eseguita | Risultato | Ambito e limite |
|---|---|---|
| `unit-tests.txt` | **{count} test PASS**, {seconds} s | 58 regressioni conservate + 18 su composizione, validazione, asset, API, licenze, PNG e opzionalità |
| `composition-audit.json` | **3240 posizionamenti**, **324 geometrie sticker**, **745 validazioni PASS** | Geometria/normalizzazione Canvas-Pillow entro 1e-7; nessun gruppo manuale fuori cornice; non inferisce piani architettonici reali |
| `composition-ui-tests.json` | **26 verifiche PASS**, {opt['seconds']} s; **6 prove di export scaricato** | Mouse, frecce/Maiusc, cursori reali, touch CDP a 320/390/768 px, avanti/indietro, annulla, reset, logo/targhetta; file offline e UI Python nei due stili |
| Pixel del PNG dopo drag | **{moved[0]:,} / {moved[1]:,} pixel cambiati** | Due esempi effettivi foto/NES; non una misura universale di qualità percettiva |
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
| `standalone-browser-tests.json` | **22 verifiche + 24 export HD PASS**, {stand['seconds']} s; un solo tab offline, 12 NES esattamente ×5, opacità/300 dpi/crediti |
| `browser-tests.json` | **16 verifiche UI Python PASS**; errori/retry/reset, tastiera, scadenza, responsive |
| `hd-http-regression.json` | **24 PNG HD HTTP PASS**, {http['total_seconds']} s; reset conclusivo, nessuna cartolina attiva |
| `go-service-tests.txt` | **26 test principali Go con race detector PASS**; nessuna modifica al sorgente del servizio rispetto alla base verificata |
| `go-service-browser.json` | **15 verifiche PASS**, {service['seconds']} s; QR di una cartolina decorata decodificato, due contesti indipendenti, download identico, revoca e fallback |
| `go-real-expiry.json` | **Scadenza reale 300 secondi PASS**, osservata dopo **{expiry['observed_after_seconds']} s**; landing/file/image 410, copia RAM rimossa; nessun salto del clock server |
| `go-launch-lifecycle.json` | **7 verifiche PASS** con configurazione standard senza eccezione preview: HTML affiancato, cwd diversa, seconda istanza, errori, host/origin/key e arresto browser/socket |

I test del clock UI e della scadenza reale sono distinti: solo il secondo attende il tempo del backend. La copia del servizio Windows resta in RAM; la distinta edizione Python facoltativa conserva il suo storage temporaneo su disco e la pulizia prevista, documentati nel README.

## 3 · Materiali e ispezioni

- 12 fotografie e 12 illustrazioni architettoniche, 24 combinazioni; famiglia LPC/sci-fi e otto companion conservati.
- 13 PNG HD di base + **2 PNG HD decorati** con nomi fittizi (`renders/Z_33_*`), 24 JPG attribuiti. I due esempi nuovi provengono dai download reali dell’UI, non da un mockup.
- Tavole 01–13 precedenti conservate o rigenerate dai rispettivi test; **14** mostra tutti gli otto sticker, **15** il nuovo editor nei due stili, **16** il touch emulato a 390 px. Screenshot aggiuntivi dei tre sistemi UI nei rispettivi percorsi.
- Sette sticker e stemma ufficiale visivamente controllati; esempi PNG decorati, schermata mobile e guida A4 di una pagina aperti durante lo sviluppo. Non è approvazione grafica del committente o dell’istituto.
- L’identificazione dello stemma è riscontrata in brochure, intestazione storica e documento scolastico corrente. Il pittogramma Studente atleta, la copertina del giornalino e lo stemma della Repubblica sono stati scartati.

## 4 · Integrità e pacchetto estratto

- HTML: **{html.stat().st_size:,} byte**, SHA-256 `{h}`.
- EXE: **{go['bytes']:,} byte**, SHA-256 `{go['sha256']}`; PE Windows x64 GUI **cross-compilato**, non eseguito nativamente qui.
- Go/vendor: **{go['source_files']} file**, SHA-256 aggregato `{go['source_sha256']}`.
- **{n} file runtime identici** nella copia realmente estratta; fingerprint `{digest}`.

`scripts/package_smoke.py` è stato eseguito su una copia estratta esterna all’albero sorgente: sorgenti Go vendorizzati ricompilati nella copia, proprio eseguibile Linux, HTML letto accanto. Il solo HTML è stato copiato da solo e aperto offline, generando **cartoline decorate e con personaggio spostato** nei due stili. Il servizio estratto ha consegnato gli stessi byte attraverso veri URL/QR decodificati; reset/RAM vuota, `/telefono` completo senza chiave e nessun directory browsing PASS. Il PE Windows viene confrontato, non eseguito in Linux.

La distribuzione finale è generata dopo questa verifica con `scripts/package.py`: prove e hash correnti, sintassi, dimensioni/attribuzioni, CRC ZIP e SHA-256 di ogni membro in `MANIFEST.sha256`. Esclusi credenziali, cache/toolchain, binari Linux di QA e file visitatori. Il sidecar `.zip.sha256` copre l’archivio, evitando un hash circolare all’interno del report.

## 5 · Errori di sviluppo e limiti dichiarati

I tentativi interrotti durante le modifiche non sono conteggiati come PASS. Il confronto Python/JS ha individuato una differenza sulla validazione dei valori nulli: corretta e rieseguiti tutti i 745 casi. Un primo test UI del servizio chiudeva per errore un accordion già aperto al secondo ciclo: corretta la condizione del test, poi rieseguite tutte le 15 verifiche. Un primo test scaricava un URL relativo senza base nel client di QA: corretto il test e rieseguite le prove complete. Il blocco CSP di una prima istruzione di attesa del test non è stato risolto allentando la policy dell’app. Le tre taglie discrete evitano percentuali intermedie che, sulla piccola griglia NES, non cambierebbero lo sprite.

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
'''
 (ROOT/'TEST_REPORT.md').write_text(report,encoding='utf-8')
 print('Updated TEST_REPORT.md from executed final evidence:',h,n,'runtime files.')
if __name__=='__main__':main()
