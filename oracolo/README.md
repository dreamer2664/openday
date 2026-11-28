# L'ORACOLO DI DELFI — Pixel & Chill

Un piccolo santuario arcade per l'Open Day: 50 responsi locali, Pizia animata e musica originale. Non è un chatbot e non comprende la domanda.

## Aprire il gioco — un solo HTML

Apri **`Oracolo-di-Delfi-Deluxe.html`** direttamente nel browser. Nel pacchetto sorgente è un livello sopra questa cartella, accanto a `standalone-build.py`.

**Quel file contiene già tutto:** grafica, font, stili, codice, licenze ed effetti sonori. Puoi copiarlo da solo su una chiavetta, spostarlo o rinominarlo. Non richiede altre cartelle, un server, Python, Node, Internet o un account.

Il file autonomo è stato verificato da solo in una cartella vuota, con la rete disattivata, e in un visualizzatore HTML isolato. Usa un browser moderno con JavaScript attivo, non l'anteprima testuale di un editor.

## Suoni e soundtrack

All'apertura **tutto l'audio è spento**.

- **SUONI:** attiva o silenzia gli effetti del gioco.
- **MUSICA:** attiva o silenzia *Vento sul Parnaso*, composizione originale a 78 BPM. Su mobile il pulsante mostra la scritta MUSICA e un indicatore.
- **Icona dei cursori:** apre il pannello del volume. Lo slider funziona con mouse, touch e frecce della tastiera. Esc chiude il pannello.

Musica ed effetti sono indipendenti. La musica si abbassa durante la consultazione e riparte più presente al termine; va in pausa quando la pagina è nascosta. Non c'è una voce registrata: il parlato della Pizia è simulato dalla bocca e dalla rivelazione del testo.

## Come si gioca

1. Scrivi una domanda breve, meglio se da sì/no, entro **140 caratteri**.
2. Premi **CONSULTA L'ORACOLO** o **Invio**. Maiusc+Invio va a capo.
3. La Pizia chiude gli occhi; dopo circa 1,35 secondi il responso appare insieme al movimento della bocca.
4. **PONI UN'ALTRA DOMANDA** cancella il testo e ripristina il gioco senza ricaricare.

La preferenza di sistema «riduci movimento» disattiva gli effetti visivi e la scrittura progressiva. Lo schermo intero è disponibile quando consentito dal browser.

## Prima dello stand

Prova il file sul dispositivo definitivo, fai una consultazione e verifica il volume. La sandbox non può verificare gli altoparlanti della sala. Per la persona successiva premi il pulsante di nuova domanda: il testo non viene registrato, ma resta visibile finché non viene azzerato.

## Offline e privacy

Il sorteggio, i font, gli sprite, la soundtrack e gli effetti sono locali. La musica viene sintetizzata in Web Audio: nessun MP3 esterno, streaming o campione da scaricare. Nessuna domanda viene trasmessa, salvata in cookie/storage o scritta in un log. La memoria delle ultime otto frasi dura soltanto finché la pagina resta aperta.

Un controllo lessicale intercetta termini espliciti di emergenza e alcune decisioni mediche; in quei casi mostra una frase fissa, senza sorteggio. Non è una moderazione completa né una valutazione sanitaria: può avere falsi positivi o non riconoscere parafrasi. Il gioco non serve a prendere decisioni reali.

## Sorgenti — solo per chi vuole modificarli

La cartella `oracolo-di-delfi` contiene la versione a file separati:

```text
index.html                 Struttura della scena e controlli
css/style.css              Layout responsive e animazioni di base
css/detail.css             Finiture pixel e mixer audio
js/app.js                  Stati, validazione, rivelazione e sincronizzazione
js/responsi.js             Archivio dei 50 responsi e controllo locale
js/pythia-sprites.js       Pose NES della Pizia, 160 × 326, in assets/pizia/
js/scenery.js              Paesaggio e particelle
js/audio.js                Partitura, sintesi, effetti e trasporto audio
assets/                    SVG originali e font con licenze
renders/deluxe/            Undici screenshot reali della nuova versione
tests/deluxe.cjs           Collaudo completo del file autonomo
tests/deluxe-results.json  Risultati, incluso il rendering PCM
serve.py                   Server statico locale facoltativo
sw.js                      Cache della sola versione servita via HTTP
CREDITI.md                 Attribuzioni e licenze
REPORT_DELUXE.md           Modifiche, verifiche e limiti
```

`index.html` è invece il sorgente a file separati: non spostarlo senza `css`, `js` e `assets`. Per provarlo puoi aprirlo con la cartella completa oppure eseguire dalla cartella:

```sh
python3 serve.py
```

Su Windows: `py -3 serve.py`. Poi apri `http://127.0.0.1:8080`. Il server non serve al file **Deluxe autonomo**. Per fermarlo premi Ctrl+C. Se la porta è occupata usa `--port 8081`.

La versione HTTP usa un service worker su localhost o HTTPS; il badge «PRONTO ANCHE OFFLINE» appare quando la cache è pronta. Il singolo HTML non usa service worker e non dipende dalla cache.

## Ricreare il file unico

Dalla cartella principale del pacchetto, dove si trova `standalone-build.py`:

```sh
python3 standalone-build.py
```

Lo script incorpora tutte le risorse e le licenze in `Oracolo-di-Delfi-Deluxe.html`, controllando che non rimangano dipendenze esterne. La versione precedente `Oracolo-di-Delfi.html`, se presente, non viene sovrascritta.

Dopo modifiche ai sorgenti rigenera sempre il file unico. Se usi la versione HTTP, aggiorna anche il nome `CACHE` e la lista `SHELL` in `sw.js`.

## Ripetere i test — facoltativo

Non serve per usare il gioco. Richiede Node.js 20 o successivo e, per il test del server locale, Python 3.

```sh
npm ci
npx playwright install chromium
# Su Linux, se servono le librerie di sistema:
npx playwright install-deps chromium
node tests/engine.cjs
node tests/deluxe.cjs ../Oracolo-di-Delfi-Deluxe.html
node tests/portable.cjs
```

Il test Deluxe dura circa un minuto, perché verifica anche una ripetizione reale dell'intera soundtrack. Produce gli screenshot e il file JSON dei risultati. Le dipendenze npm sono **solo di sviluppo** e non vengono incluse nell'HTML.

Per dettagli e limiti verificati: [REPORT_DELUXE.md](REPORT_DELUXE.md). Per font e risorse: [CREDITI.md](CREDITI.md).
