# Test report — build 0.1

**Data:** 26 novembre 2026 · **Fase:** prima verifica tecnica del prototipo.

## Verifiche realizzate

- [x] Sorgenti HTML/CSS/JS senza dipendenze di build.
- [x] Canvas interno 480×270 con scaling pixelated.
- [x] Stato narrativo: flags compagni, fiducia, energia e quiz definiti nel codice.
- [x] Flusso scritto per puzzle di Ranaldo, basket a tempo/aiutato, sequenza pianoforte, calcio a tempo/assistito, terminale EIPASS-style.
- [x] Fonti scolastiche istituzionali consultate; sede centrale distinta dai plessi ulteriori.
- [x] Il PAT non è incluso nel repository; credenziale locale fuori dal progetto con permessi ristretti.

## Da eseguire prima di dichiarare la build pronta

- [x] `node --check game.js` — sintassi JavaScript valida.
- [ ] Revisione console browser e playthrough interattivo.
- [ ] Avvio in browser desktop, mobile e schermo grande; verificare resize/DPR.
- [ ] Playthrough completo: menu → Ranaldo → Carlo → Francesco → Ruggero → terminale → finale.
- [ ] Controllare interazione vicino ad ogni NPC, logica tiri a tempo, sequenza pianoforte, energia e finale per ogni combinazione.
- [ ] Verificare pausa/riprendi e ripartenza rapida; correggere eventuali stati residui.
- [ ] Test audio dopo gesto utente, silenziamento, loop e volume in ambiente rumoroso.
- [ ] Playtest Open Day con persona senza briefing, misurazione durata reale e iterazione fino a 7–10 minuti.
- [ ] Test accessibilità: contrasto, tastiera, focus dialoghi, riduzione movimento e leggibilità.
- [ ] Test offline reale e su computer della postazione.
- [ ] Estendere test/report per campagna completa e finali multipli.

## Limiti noti della build iniziale

- Il tasto Esc può mostrare la pausa, ma l’opzione “riprendi” riattiva la musica; il sistema va verificato e rifinito.
- Il menu campagna è un placeholder intenzionale.
- L’audio è generativo e provvisorio; i controlli separati per musica/SFX non sono ancora presenti.
- Le foto interne e il programma EIPASS del gruppo non sono ancora stati verificati.
- Non è stato effettuato playtest umano; nessuna durata di 7–10 minuti è attestata.
