# Cartolina Casardi — Deluxe e PC

Branch **`cartolina`** del repository `dreamer2664/openday`: raccolta delle due versioni richieste, dei sorgenti completi, degli asset, delle guide e del lavoro diagnostico prodotto.

## Le due versioni

| Versione | File da scaricare | Avvio |
|---|---|---|
| **Deluxe · creatore completo PC e telefono** | **[Cartolina_Casardi_PC_e_Telefono.html](Cartolina_Casardi_PC_e_Telefono.html)** | Scaricare il file completo e aprirlo in un browser. Funziona offline e incorpora gli asset. Non è un launcher. |
| **PC · Windows con servizio locale e QR del PNG** | **[Cartolina_Casardi_Windows_LPC_QR_2026-27.zip](Cartolina_Casardi_Windows_LPC_QR_2026-27.zip)** | Estrarre tutto lo ZIP e avviare `AVVIA_CARTOLINA_WINDOWS.exe`. Non estrarre o spostare soltanto l’EXE. |

**Deluxe** indica l’HTML completo sopra, come confermato dall’utente: non è il prototipo Canvas e non è stata inventata una nuova revisione del programma.

- [Guida PC stampabile 3.3.1](Guida_Casardi_3.3.1.pdf)
- [Istruzioni complete 3.3.1](LEGGIMI_CASARDI_3.3.1.md)
- [SHA-256 del pacchetto PC](Cartolina_Casardi_Windows_LPC_QR_2026-27.zip.sha256)

Il solo HTML crea/esporta il PNG sul dispositivo, ma non ospita un QR per trasferirlo ad altri telefoni. Il servizio Windows richiede una LAN comunicante per il QR del PNG. L’EXE è quello già prodotto, x64 non firmato: non è stato ricompilato né eseguito nativamente su Windows per questa pubblicazione.

## Sorgenti completi e asset

**[v1/casardi_postcard/](v1/casardi_postcard/)** contiene tutti i **717 file** del pacchetto verificato, inclusi i **473 asset**, i sorgenti del browser/renderer, l’edizione Flask, il servizio Go, il vendor QR, script di build, test, licenze ed esempi.

Questi file sono ereditati dal commit di produzione `1b627eeb721826bf9b628753e81fa8c2b1088ad9` e sono mantenuti identici. Non vengono duplicate inutilmente le intere cartelle dei sorgenti: Deluxe e PC condividono quel progetto. Anche lo ZIP originale nel percorso `v1/` rimane presente e invariato.

## Stato del problema Android/Arena

**La revisione di produzione resta 3.3.1. Il blocco segnalato su Android/Arena non è dichiarato risolto.** La creazione di questo branch è una pubblicazione/archiviazione del materiale richiesto, non una nuova release correttiva.

Il vecchio README 3.3.1 e la vecchia diagnosi contengono la precedente conclusione sulla perdita di cattura: sono conservati come documenti storici, non come certificazione della causa originale. Il riferimento aggiornato è:

- **[Analisi_blocco_Android_Arena.md](Analisi_blocco_Android_Arena.md)** — conclusioni, difetto di riselezione dimostrato, limiti e verifiche incomplete.
- **[Stato vincolante della diagnosi](casardi_diagnostica/STATO_DIAGNOSI.md)** — nessuna richiesta di ulteriori prove all’utente.
- [A1 diagnostica](Cartolina_Casardi_DIAGNOSTICA_ANDROID_A1.html) — copia diagnostica, non una Deluxe o un fix.
- [Dossier tecnico](casardi_diagnostica/audit_agente/README.md) · [ZIP delle prove](casardi_diagnostica/audit_agente/prove_audit.zip) · [prove sfogliabili](casardi_diagnostica/audit_agente/prove/) · [screenshot di laboratorio](casardi_diagnostica/screenshot_laboratorio/).

I report sono mantenuti nel loro contesto temporale: la dicitura «nessuna pubblicazione» nei rapporti dell’audit descrive quel momento, precedente alla successiva richiesta di archiviare il lavoro in questo branch. I FAIL/PARTIAL non sono stati trasformati in PASS.

## Esperimenti separati

**[esperimenti/](esperimenti/)** contiene l’HTML Canvas, i quattro sorgenti modificati, la patch/build proof e la candidata HTTP. Sono esplicitamente **NON RELEASE**, non sostituiscono le versioni Deluxe/PC e non sono presentati come riparazione fisica Android confermata.

## Cosa è conservato e cosa è escluso

- Conservati: versioni utilizzabili, sorgenti/asset/licenze, guide 3.2/3.3/3.3.1, risultati delle pubblicazioni precedenti, diagnostica A1, script/report/log dell’audit, screenshot salvati e prototipi separati.
- Esclusi: credenziali e allegati di autenticazione, helper operativi Git, cache di pacchetti, browser/toolchain scaricati, ambienti virtuali, `__pycache__` e copie HTML temporanee dei test rigenerabili dai relativi script.
- [Manifesto dei file aggiunti e degli hash](PUBBLICAZIONE_CARTOLINA.json).
- `main`, `quiz` e `v1` non vengono aggiornati. Nessun merge, tag, release o cambio di GitHub Pages è richiesto o effettuato.
- Il gioco preesistente resta nel branch per conservare la storia; il suo precedente README è in [archivio_cartolina/README_GIOCO_ORIGINALE.md](archivio_cartolina/README_GIOCO_ORIGINALE.md). Per la cartolina usare i file indicati sopra, non il vecchio `index.html` del gioco.
