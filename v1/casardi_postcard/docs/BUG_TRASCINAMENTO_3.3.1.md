# Blocco di personaggi e sticker · diagnosi e correzione 3.3.1

**Liceo Alfredo Casardi · Open Day 2026/27 · 27 novembre 2026**

## Esito in breve

È stato riprodotto e corretto **un difetto nel gestore di trascinamento condiviso**. Se il gesto perdeva la cattura del puntatore e terminava fuori dalla cartolina, la 3.3 poteva restare convinta che ci fosse ancora un trascinamento attivo. I tentativi successivi venivano rifiutati **sia per il personaggio sia per gli sticker**.

Il difetto riprodotto non è un limite al numero di sticker, né un problema del logo. Tutti i **473 file di asset**, compreso il logo ufficiale, sono identici byte per byte a quelli della 3.3. Questa patch **non interviene sulla qualità/risoluzione del logo**.

**Limite della diagnosi:** non sono noti dispositivo, browser e gesto preciso della segnalazione. La prova controllata riproduce lo stesso blocco sulla versione rilasciata, ma non certifica che quello fosse l’unico possibile innesco sul dispositivo dell’utente.

## 1 · Il meccanismo del blocco

Nel precedente `browser/layout-editor.js`:

- Un solo oggetto `drag` conservava il gesto attivo di personaggi e sticker.
- Un nuovo `pointerdown` veniva ignorato se `drag` risultava già occupato.
- Il gesto veniva chiuso da `pointerup` e `pointercancel` **ascoltati soltanto sull’overlay della cartolina**.
- Non c’era una gestione di `lostpointercapture`, finestra inattiva o pagina nascosta. Se il rilascio non arrivava all’overlay, `drag` rimaneva occupato a tempo indefinito.

Questa è la ragione per cui il sintomo può essere comune a tutti gli elementi pur avendo iniziato a trascinarne uno solo. Non serve un errore JavaScript per produrlo.

## 2 · Riproduzione sulla 3.3 rilasciata

Base immutata: commit **`004f06afe7c0b33be85d42fa0b08aba696b22f17`**, HTML SHA-256:

```text
e8e28940e478a985e2b5113606045b4eac8677c58c27055a8392b719605a392a
```

Sequenza eseguita nel browser di collaudo:

1. Aprire il vero HTML 3.3 offline e arrivare all’anteprima con un personaggio e due sticker.
2. Iniziare un trascinamento con veri eventi touch Chromium/CDP.
3. **Iniettare esplicitamente la perdita della cattura** mediante `releasePointerCapture`; continuare e terminare il gesto fuori dalla cartolina.
4. Provare di nuovo a trascinare il personaggio, poi uno sticker.

**Risultato sulla base:** entrambi immobili, indicatore di caricamento nascosto, pulsante di esportazione abilitato. Quindi non era semplicemente il normale blocco temporaneo durante il rendering/export. Il tracciato degli eventi mostra la perdita della cattura, il rilascio fuori dall’overlay e nuovi gesti che non spostano più gli elementi.

L’interruzione è provocata in modo controllato: **non si dichiara che una semplice sequenza qualunque di trascinamenti provochi sempre il bug**. Un primo sondaggio di 40 trascinamenti mouse regolari non lo aveva riprodotto. La prova determinante è quella del gesto interrotto, non il solo numero di movimenti.

Evidenza ripetibile e traccia: `docs/test-results/drag-recovery-tests.json`, sezione `baseline`.

## 3 · Correzione applicata

Il medesimo editor corretto è incorporato nell’HTML autonomo e copiato nell’interfaccia Python:

- Fine gesto ascoltata sulla finestra anche per rilasci fuori dall’overlay.
- Gestione di **perdita della cattura, cancel, blur, pagina nascosta, pagehide ed Esc**.
- Pulizia idempotente: un normale rilascio seguito da `lostpointercapture` non annulla una modifica già confermata.
- In caso di interruzione viene annullato **solo il gesto incompleto**. La composizione precedente e la cronologia restano utilizzabili; non serve Ricomincia.
- Se il browser non concede la cattura, il percorso di rilascio globale continua a funzionare. Un evento obsoleto o un bersaglio rimosso non lascia il gestore occupato.
- L’inizio di un’altra azione/anteprima/esportazione chiude ordinatamente il gesto pendente prima di bloccare i controlli.

È stata inoltre corretta la proprietà dello stato di attesa delle anteprime nei due controller: **solo la richiesta corrente** può aggiornarne la disponibilità; errori e interruzioni della decodifica non devono lasciare `rendering` attivo senza un’operazione in corso. Una richiesta vecchia che fallisce non può sbloccarne una nuova ancora pendente. Questi percorsi sono stati provati con errori iniettati esplicitamente, non attribuiti senza evidenza al dispositivo dell’utente.

**Non sono stati aggiunti** timer di reset della cartolina, persistenza dei dati del visitatore, richieste Internet o deroghe alla Content Security Policy. Il PNG resta ricomposto dagli asset, non catturato dall’interfaccia.

## 4 · Prove eseguite sulla 3.3.1

HTML provato, SHA-256:

```text
8b247a2cd86bd0485f352190590371e83150aa3feb99b2cb5c59fc517d9a09ea
```

`drag-recovery-tests.json`: **72 verifiche PASS, 427 tentativi di gesto, 6 PNG HD scaricati**, 141,14 secondi.

- Fotografia e NES, mouse e touch emulato a 390 px.
- Interruzioni iniziate sia sul personaggio sia su uno sticker; dopo ciascuna si muovono nuovamente **entrambi** e due annullamenti recuperano le posizioni precedenti senza perdere le altre modifiche.
- **240 trascinamenti consecutivi effettivamente verificati**: quattro sessioni da 60 con sei sticker presenti, senza reset del visitatore.
- Cattura indisponibile e vero rilascio fuori dalla cartolina.
- `AbortError` della decodifica dell’anteprima e due anteprime concorrenti: errori iniettati e ripresa verificata.
- Quattro download Canvas dopo le prove, **3000 × 2000**, identici alla ricomposizione indipendente dello stesso job; ulteriori due export effettivi dell’UI Python/Pillow dopo gesti interrotti.
- Nessuna eccezione JavaScript non gestita, nessuna richiesta HTTP nel file autonomo offline.

Rieseguite anche le precedenti **26 verifiche dell’editor con sei prove di export**, oltre alle regressioni generali elencate in `TEST_REPORT.md`. Le prove sono su **Linux/Chromium**, con touch CDP: **non equivalgono a Windows nativo, telefono fisico, Safari/Firefox o Wi-Fi scolastica**.

Un primo collaudo generale è stato interrotto da `Target crashed` di Chromium mentre erano attivi più servizi di test; quella catena non è conteggiata come riuscita. La suite editor è stata poi rieseguita separatamente. Nel nuovo harness sono stati corretti due errori del test: un tentativo di colpire l’attore sotto l’overlay di caricamento e una coordinata touch al bordo di uno sticker vicino. Il test finale sceglie punti interni e controlla il vero destinatario di ciascun `pointerdown`, per non scambiare un tocco sullo sticker per un attore bloccato.

## 5 · Ripetere il collaudo

Per manutentori con dipendenze QA e Chromium Playwright installati, avviare l’edizione Python su porta 8080. Eseguire `scripts/drag_recovery_test.py`; l’opzione `--baseline` accetta una copia dell’HTML 3.3 identificato sopra e richiede che riproduca il difetto originale prima di provare la correzione. `--only` serve per sonde parziali: non produce l’evidenza completa richiesta dal packager.

Il packager rifiuta la distribuzione se il report delle 72 verifiche, la riproduzione della base, gli hash dei tre sorgenti di interazione o il confronto dei 473 asset non corrispondono.

**Prima dell’evento:** aprire la nuova 3.3.1 sul dispositivo effettivamente usato, provare movimenti ripetuti e un’interruzione/ripresa, quindi verificare il PNG salvato. Se compare ancora un blocco, annotare browser/versione, dispositivo e se anche gli altri pulsanti rispondono: sono informazioni necessarie per distinguere un’altra interruzione del gesto da un problema diverso.
