# GAME DESIGN — Casardi 8-bit: Il segnale fantasma

## Stato del progetto

**Build 0.1 · prototipo narrativo giocabile.** Questa fase realizza apertura, presentazione dei quattro protagonisti, sezione platform, tre micro-sfide e scelta di sicurezza digitale con risultato. Non è ancora la campagna completa da 30 minuti né la demo Open Day rifinita e temporizzata a 7–10 minuti richiesta dalla specifica. I capitoli futuri e la verifica con playtester restano lavoro da fare.

## Direzione creativa

Avventura platform 2D pixel-perfect, fatta con disegno originale su canvas e colori derivati dalle fotografie della facciata centrale. Risoluzione interna 480×270, scala intera tramite CSS, tile/forme su griglia 1–2 px. Palette: cielo azzurro polveroso, pietra avorio, fascia bordeaux, ombre blu-ardesia, accento verde-lime per segnali/interazioni. Nessun logo o personaggio di franchise esistenti.

**Premessa:** il sistema degli annunci dell’Open Day ha corrotto il messaggio e lo trasmette come una schermata di errore. La squadra deve riattivarlo prima che arrivino i visitatori. Il guasto è comico e innocuo; la minaccia è un allegato sospetto nel terminale, non un attacco realistico alla scuola.

## Protagonisti

Aspetto autorizzato: i tre ragazzi hanno capelli scuri spettinati con ciocche frontali; il professor Ranaldo ha capelli grigi simili e una piccola barba. La build implementa silhouette pixel semplificate; gli sprite sono originali e non pretendono di ritrarre fedelmente persone reali.

| Personaggio | Ruolo e carattere fittizio | Silhouette / palette | Momento gameplay |
|---|---|---|---|
| Prof. Ranaldo | Insegnante di matematica, guida calmo e rigoroso. | Capelli grigi e barbina; giacca grigio-ardesia. | Progressione numerica 2, 4, 8, 16, __. Risposta errata costa energia; feedback spiega la regola. |
| Carlo | Compagno pratico e appassionato di basket. | Capelli scuri spettinati, arancio/corallo, dettaglio palla ocra. | Tiro a tempo: barra con finestra di rilascio; alternativa di tiro assistito. |
| Francesco | Compagno attento al ritmo e appassionato di pianoforte. | Capelli scuri, accento viola e dettaglio da tastiera. | Sequenza DO–MI–SOL sui tasti 1–2–3; feedback sonoro sintetizzato. |
| Ruggero | Compagno diretto e appassionato di calcio. | Capelli scuri, accento verde acqua, dettaglio da divisa. | Tiro di precisione a tempo o passaggio sicuro che sblocca il percorso. |

Le animazioni del prototipo sono pose procedurali (idle/camminata alternata); le animazioni complete di salto, vittoria, sconfitta e viste frontale/posteriore sono pianificate ma non ancora prodotte.

## Flusso della build corrente

1. **Menu** — titolo, avvio rapido demo, campagna completa esplicitamente segnata come “prossimamente”.
2. **Atrio/facciata stilizzata** — obiettivo, controlli essenziali e conversazione iniziale.
3. **Incontro Ranaldo** — puzzle matematico con conseguenza sull’energia e variabile fiducia.
4. **Carlo** — tiro a barra temporizzata o soluzione assistita dialogica.
5. **Francesco** — breve sequenza musicale DO–MI–SOL, tasti numerati.
6. **Ruggero** — tiro a tempo o passaggio sicuro.
7. **Terminale** — mail sospetta: scegliere di non aprire l’allegato e verificare tramite canale ufficiale, oppure rischiare; le scelte errate riducono energia e spiegano il perché.
8. **Esito** — segnale ripristinato, riepilogo squadra/fiducia/energia e tasto per riavviare.

## Scelte e stato narrativo

Variabili centralizzate in `game.js`: `flags` per i quattro compagni e terminale; `trust`; `energy` (tre unità); `mode`; `camera`; `player`. Ogni stazione registra il proprio esito e viene letta dal terminale che resta bloccato finché i quattro compagni non sono stati coinvolti. La scelta del quiz cambia energia/feedback e si riflette nel riepilogo. Il tiro assistito costa opportunità narrativa (nessuna penalità), aumenta fiducia; i tiri a tempo sbagliati costano un’unità energia.

## Livelli futuri proposti (non ancora implementati)

1. **Ingresso e atrio — Il segnale fantasma:** demo Open Day, tutorial organico e prima scelta.
2. **Corridoio delle cartelle — L’ordine giusto:** platform con file/cartelle, porte e checkpoint.
3. **Laboratorio digitale — La fonte affidabile:** puzzle di foglio di calcolo/ricerca e verifica delle fonti, da allineare al corso EIPASS reale e a spazi verificati.
4. **Aula della musica — La nota mancante:** enigma di sequenze/ritmo per Francesco, solo se l’ambiente è documentato o chiaramente immaginario.
5. **Finale — Open Day in diretta:** prova di squadra, presentazione digitale riparata e finale alternativo secondo fiducia/sicurezza.

La campagna va dimensionata con sezioni giocabili sostanziali, checkpoint, segreti e percorsi alternativi; la stima dei 30 minuti deve essere misurata con playtest, non dichiarata sulla sola carta.

## Audio

La build usa oscillatori Web Audio generati a runtime: tema arpeggiato semplice in loop e beep per scelta/salto/mini-sfide. È originale e offline, ma è un segnaposto funzionale, non una colonna sonora prodotta/rifinita. Da fare: registrare melodie originali in asset locali (menu/esplorazione/lab/tensione/finale), SFX dedicati, attenuazione dialoghi, slider musica/effetti e test del loop su browser e macchina Open Day.

## Accessibilità e UX

Tastiera: A/D o frecce per muoversi, Spazio per saltare/caricare il tiro, E per interagire, 1–3 per pianoforte, Esc per pausa, R per riavvio dalla schermata finale. I testi stanno in HTML ad alto contrasto; dimensione visuale responsive. Da verificare con tastiera soltanto, schermo grande, dispositivi diversi e utenti che non conoscono il progetto.
