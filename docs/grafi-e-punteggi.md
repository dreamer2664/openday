# Blueprint dei quiz — grafi, banche di domande e risultati

**Versione:** 2 · 27 novembre 2026<br>
**Dipendenza:** `docs/ricerca-e-progettazione.md`<br>
**Stato:** dieci dataset giocabili in `data/quizzes/`; pagine HTML in `quizzes/`; test quantitativi in `tests/quiz-engine.cjs`. Restano playtest con visitatori e verifica editoriale/normativa.

## Regole comuni del motore

- Ogni quiz possiede **16 nodi unici** e una sessione standard di **8 domande**.
- Grafo nominale: `Q01 → un Q02–Q05 → Q06 → un Q07–Q10 → Q11 → un Q12–Q14 → Q15 → Q16`.
- Le scelte a Q01, Q06 e Q11 determinano tre snodi. Le sei risposte di Q01 e Q06 instradano verso quattro rami; quelle di Q11 verso tre rami (due opzioni diverse possono convergere sullo stesso nodo). Le alternative sono decisioni distinguibili e i loro punteggi non si perdono alla convergenza. Q02–Q05 confluiscono in Q06; Q07–Q10 in Q11; Q12–Q14 in Q15.
- Si visitano 8 nodi senza ripetizioni; il motore ha guardia anti-ciclo, target di fallback esplicito e controlli automatici su ogni arco.
- Ogni opzione contribuisce ad almeno due dimensioni, con delta differenziati; le sei strategie di risposta hanno anche uno stile identificabile. Il risultato somma il match delle dimensioni e 1,5 punti per ogni risposta coerente con lo stile, usando i tre snodi come spareggio. Nessuna risposta singola decide il profilo. I vettori sono normalizzati per il numero di risposte effettive; si mostrano i tre tratti maggiori e una tensione, non una misura scientifica.
- Ogni nodo non fotografico presenta sei risposte strategiche con immagini SVG distinte. Q01 e Q06 mappano le sei strategie su quattro rami; Q11 le mappa su tre rami: alternative diverse possono convergere, mantenendo punteggi distinti. Ogni domanda aggiunge un vincolo/conseguenza specifica. Dopo ogni risposta, una schermata riflessiva riassume la strategia, i tratti influenzati e la tappa successiva; l'ordine delle opzioni viene rimescolato. Nel quiz fotografico restano due scelte (fotografia/AI), scala di confidenza 1–4 e rotta basata su risposta+confidenza. Ogni domanda, risposta e risultato ha alt text e record nel manifest.

---

## 1 — Umano o AI?

**Scoring:** 9 risultati per numero di risposte corrette (da 0 a 8); mostra anche accuratezza per macro-categoria, confidenza media dichiarata e scarto medio fra confidenza e correttezza. Il livello non diagnostica capacità e non pretende che un indizio visivo sia prova certa. Ogni risposta produce feedback con fonte e licenza; la provenienza della singola immagine non compare nel DOM prima della scelta. Le immagini usate come campione sono reali o sintetiche di terzi, non generate dall'agente.

**Percorsi:** Q01 e Q06 instradano verso quattro item diversi in base a risposta e confidenza; Q11 ha due risposte binarie ma tre destinazioni distinte via combinazione di etichetta e confidenza. Q02–Q05 convergono su Q06, Q07–Q10 su Q11, Q12–Q14 su Q15. Nessun item si ripete nella sessione.

**Banca (16 immagini-test, una per nodo):**
1. Q01 — Gatto domestico a pelo lungo (foto).
2. Q02 — Cuffie wireless su fondo chiaro (AI).
3. Q03 — Fiori primaverili davanti a un edificio (foto).
4. Q04 — Smartphone color bronzo (AI).
5. Q05 — Bicicletta a Jabalpur (foto).
6. Q06 — Oggetti su un tavolo con interfaccia fotografica (AI).
7. Q07 — Sentiero tra alberi vicino a Williamsburg (foto).
8. Q08 — Automobile con neve sul cofano (AI).
9. Q09 — Gatto fra foglie autunnali (AI).
10. Q10 — Vetrina di una libreria (foto).
11. Q11 — Orologio da polso in luce naturale (AI).
12. Q12 — Panetteria con dolci esposti (foto).
13. Q13 — Sushi da vicino (AI).
14. Q14 — Costa erbosa affacciata sul mare (foto).
15. Q15 — Interno vicino a una finestra (AI).
16. Q16 — Dolci siciliani (foto).

**Fonti:** 8 immagini AI hanno metadati del modello e licenza CC BY 4.0 dichiarata dal benchmark WasItAIGenerated. Per le 8 fotografie sono stati controllati i record Commons individuali; licenze selezionate: CC0, pubblico dominio o CC BY 4.0. Fonti e crediti puntuali in `data/asset-manifest.json` e `data/human-ai-assets.json`. Il benchmark è una fonte di campioni, non una validazione scientifica; i 16 item non bastano a misurare capacità generali.

**Trasparenza:** avviso generale prima della prova, nessuna etichetta della singola immagine durante la domanda, fonte individuale dopo la risposta — decisione editoriale richiesta dal committente. Il caso concreto di disclosure ai sensi dell'Articolo 50 resta da verificare prima di una pubblicazione esterna; vedere `docs/ricerca-e-progettazione.md`.

---

## 2 — Che tipo di mente hai?

**Dimensioni:** analisi, immaginazione, apertura all'ambiguità, orientamento all'azione, ascolto, pianificazione, revisione delle convinzioni, collaborazione.

**Banca:** Q01 — Un progetto parte con un brief incompleto: da dove inizi?; Q02 — Un indizio contraddice la prima ipotesi: come reagisci?; Q03 — Il gruppo ha molte idee ma poco tempo: come sblocchi?; Q04 — Davanti a un problema senza una risposta ovvia, cosa annoti?; Q05 — Un piano funziona ma una persona resta esclusa: quale priorità scegli?; Q06 — Un dato nuovo cambia lo scenario a metà lavoro: come aggiorni la rotta?; Q07 — Due spiegazioni plausibili competono: quale prova cerchi?; Q08 — La squadra chiede una decisione immediata: come riduci l'incertezza?; Q09 — Hai un pomeriggio libero e un'idea da sviluppare: che forma le dai?; Q10 — Un risultato inatteso è promettente ma fragile: cosa fai?; Q11 — Un compagno propone un metodo opposto al tuo: come lo valuti?; Q12 — Una regola impedisce un esito utile: la interpreti, la contesti o la aggiri?; Q13 — Devi raccontare un'idea complessa a chi non la conosce: come la traduci?; Q14 — Dopo un errore, come decidi se correggere o ripartire?; Q15 — In una scelta importante, quale informazione pesa di più?; Q16 — Quale frase descrive il tuo modo di cambiare idea?

**Rami:** Q01 seleziona bisogno di struttura (Q02), contraddizione (Q03), creatività (Q04) o impatto umano (Q05). Q06 instrada verso prova (Q07), decisione (Q08), esplorazione (Q09) o prototipo (Q10). Q11 indirizza a norma/principio (Q12), comunicazione (Q13) o iterazione (Q14).

**Profili:** Stratega, Visionario, Analista, Creativo, Osservatore, Idealista, Pragmatico, Diplomatico. Ogni profilo contiene: leva preferita, costo/tensione, comportamento quando sotto pressione e suggerimento non prescrittivo.

---

## 3 — Sopravviveresti all'apocalisse?

**Dimensioni:** preparazione, cooperazione, leadership condivisa, rischio, riparazione, esplorazione, calma, gestione risorse.

**Banca:** Q01 — Il gruppo ha una sola ora prima di lasciare il rifugio: cosa metti in sicurezza?; Q02 — L'acqua basta per tutti o per più giorni se razionata: come negozi la regola?; Q03 — La mappa è incompleta: quale dato cerchi prima?; Q04 — Un generatore si ferma durante la notte: come organizzi il lavoro?; Q05 — Due gruppi chiedono la stessa risorsa: che proposta fai?; Q06 — Una via più breve è incerta, quella lunga è nota: cosa cambia la tua decisione?; Q07 — Il kit ha un guasto riparabile ma non sai quanto durerà: come procedi?; Q08 — Una persona non è d'accordo con il piano comune: come affronti il dissenso?; Q09 — Trovate tracce recenti di un altro gruppo: cosa verifichi prima di avvicinarti?; Q10 — Un imprevisto costringe a lasciare un oggetto utile: quale criterio usi?; Q11 — Le scorte stanno calando più rapidamente del previsto: quale ipotesi controlli?; Q12 — Un compagno è stanco e il gruppo deve scegliere il ritmo: cosa proponi?; Q13 — Un segnale potrebbe essere una richiesta d'aiuto o un'esca narrativa: quale approccio prudente scegli?; Q14 — Il gruppo ti affida la decisione per un tratto breve: cosa deleghi?; Q15 — La missione riesce ma con un costo inatteso: come fai il debrief?; Q16 — Quale risorsa di squadra hai protetto meglio?

**Rami:** Q01 porta a razionamento (Q02), ricognizione (Q03), riparazione (Q04) o negoziazione (Q05); Q06 porta a rischio/percorsi (Q07), consenso (Q08), esplorazione cauta (Q09) o gestione carico (Q10); Q11 instrada a scorte (Q12), segnali (Q13) o delega (Q14).

**Profili:** Leader, Lupo solitario, Stratega, Tecnico, Diplomatico, Esploratore, Impulsivo, Primo a cedere. Il titolo dell'ultimo è autoironico e accompagnato da punti di forza reali (es. chiedere supporto) per non trasformare la pressione in umiliazione.

---

## 4 — Che tipo di villain saresti?

**Dimensioni:** controllo, spettacolo, pazienza, imprevedibilità, innovazione, lealtà, empatia, propensione al confronto.

**Banca:** Q01 — Il tuo piano di scena viene scoperto prima del finale: improvvisi o lo trasformi?; Q02 — Un rivale ti offre un'alleanza temporanea: quale condizione poni?; Q03 — La città non capisce il tuo manifesto: come lo comunichi?; Q04 — Il tuo congegno perfetto ha un difetto buffo: lo nascondi o lo adotti?; Q05 — La squadra è divisa fra efficienza e spettacolo: chi ascolti?; Q06 — Un imprevisto mette in luce il costo del tuo piano: cosa cambi?; Q07 — Un alleato sbaglia per un motivo comprensibile: come reagisci?; Q08 — Il protagonista rifiuta lo scontro previsto: qual è la tua contromossa?; Q09 — Hai una notte per preparare la scena del confronto: cosa curi?; Q10 — Un successo è possibile solo condividendo il merito: come ti comporti?; Q11 — La tua reputazione cresce per un motivo che non controlli: la sfrutti o la smentisci?; Q12 — La macchina narrativa del piano richiede una pausa: cosa fai mentre aspetti?; Q13 — Ti accorgi che il tuo obiettivo iniziale non regge più: lo ammetti?; Q14 — Un rivale propone un finale meno distruttivo: quale compromesso accetti?; Q15 — Il sipario cala: quale dettaglio il pubblico ricorderà?; Q16 — Quale difetto del tuo personaggio è anche la sua firma?

**Rami:** Q01 seleziona controllo (Q02), comunicazione (Q03), autoironia (Q04) o squadra (Q05); Q06 porta a imprevisto (Q07), scontro (Q08), scena (Q09) o collaborazione (Q10); Q11 sceglie fama (Q12), attesa (Q13) o compromesso (Q14).

**Profili:** Genio manipolatore, Tiranno, Burattinaio, Mente caotica, Antieroe, Visionario senza scrupoli, Stratega nell'ombra, Distruttore. I profili sono archetipi immaginari originali, non imitazioni di personaggi noti; ogni scheda prevede motivazione, scena iconica originale, forza, punto cieco e immagine propria.

---

## 5 — In quale epoca saresti nato?

**Dimensioni:** rapporto con tradizione/novità, mobilità, comunità, gerarchia, tecnologia, ritmi, sapere, autonomia. L'esito non è una preferenza dichiarata ma il contesto storico che corrisponde ai compromessi accettati.

**Banca:** Q01 — Una giornata ideale: piazza vivace, officina, biblioteca, viaggio o casa? (le opzioni descrivono attività, non nomi di epoche); Q02 — Quanto contano le consuetudini condivise?; Q03 — Ti trovi meglio con cambiamenti rapidi o strumenti affidabili?; Q04 — Una conoscenza preziosa è custodita da pochi: la rendi accessibile?; Q05 — Preferisci un percorso stabile o la possibilità di spostarti?; Q06 — Un'innovazione migliora la produzione ma cambia il lavoro: quale domanda poni?; Q07 — In una comunità locale, quale ruolo ti viene naturale?; Q08 — Una nuova idea mette in discussione l'autorità: che prova chiedi?; Q09 — La vita pubblica è animata da scambi, gare e dibattiti: cosa ti coinvolge?; Q10 — Una rotta lontana apre possibilità ma anche rischi per altri: come la valuti?; Q11 — Una società valorizza ordine e continuità: quale libertà cerchi?; Q12 — Le macchine accelerano il lavoro: come giudichi il progresso?; Q13 — Una città unisce arte, tecnica e patronato: dove ti collochi?; Q14 — Una crisi politica ridisegna la vita comune: proteggi stabilità o cambiamento?; Q15 — Il tuo ideale di tempo libero include studio, festival, bottega o esplorazione?; Q16 — Quale costo storico saresti meno disposto ad accettare?

**Rami:** Q01 entra in vita civica (Q02), strumenti/cambiamento (Q03), accesso al sapere (Q04) o mobilità (Q05); Q06 instrada verso bottega/innovazione (Q07), prova e autorità (Q08), piazza (Q09) o esplorazione (Q10); Q11 porta a gerarchia/autonomia (Q12), tecnica/lavoro (Q13) o crisi/istituzioni (Q14).

**Profili:** almeno 10, coprendo Grecia antica, Repubblica romana, Impero romano, Medioevo europeo, Rinascimento, Età delle esplorazioni, Illuminismo, Rivoluzione industriale, Età vittoriana/Belle Époque e XX secolo. Il risultato riporta intervallo e luogo indicativi, condizioni concrete e una cautela contro il presentismo; le aree cronologiche si sovrappongono e non sono mondi uniformi.

---

## 6 — Quale dio greco sei?

**Dimensioni:** strategia, autorità, cura, autonomia, armonia/arti, comunicazione, conflitto, trasformazione, artigianato, ospitalità.

**Banca:** Q01 — Un patto fra divinità viene infranto: come ristabilisci un ordine credibile?; Q02 — Due comunità chiedono entrambe il tuo aiuto: come scegli la forma di sostegno?; Q03 — Un viaggio richiede una guida e una parola persuasiva: quale ruolo assumi?; Q04 — Un'opera creata da te viene rifiutata: la difendi, la trasformi o la condividi?; Q05 — Una festa si interrompe per un conflitto: come riporti l'attenzione sul bene comune?; Q06 — Un'offesa pubblica richiede una risposta: quale costo sei disposto a pagare?; Q07 — Un viandante arriva senza risorse: quale gesto definisce la tua ospitalità?; Q08 — Una decisione deve unire ragione, coraggio e conseguenze: da dove cominci?; Q09 — Una promessa contrasta con un dovere più grande: come sciogli il nodo?; Q10 — Un luogo naturale è minacciato da un progetto utile: che equilibrio cerchi?; Q11 — Una comunità affronta una carestia: quale aiuto avvii per primo?; Q12 — Un conflitto si risolve con strategia o forza: quale limite non superi?; Q13 — Il tuo lavoro manuale è indispensabile ma invisibile: che riconoscimento chiedi?; Q14 — Il cambiamento ti toglie una posizione comoda: cosa proteggi?; Q15 — Un messaggio deve attraversare mondi diversi: come lo rendi comprensibile?; Q16 — Quale ambivalenza divina ti somiglia più di una virtù semplice?

**Rami:** Q01 sceglie ordine/accordo (Q02), cura della comunità (Q03), opera/abilità (Q04) o rituale/relazione (Q05); Q06 porta a conflitto (Q07), ospitalità (Q08), scelta di giustizia (Q09) o ambiente (Q10); Q11 seleziona nutrimento (Q12), strategia (Q13) o mutamento/viaggio (Q14).

**Risultati:** 14 schede distinte, una per ogni divinità richiesta dal brief. L'abbinamento usa molte dimensioni e comprende un controtratto; i riferimenti mitici provengono da testi e repertori verificati. Note esplicite: «mito, non biografia», varianti locali/poetiche, e Hades/Hestia trattati senza forzare una lista fissa dei Dodici.

---

## 7 — Che parola latina sei?

**Dimensioni:** iniziativa, coraggio misurato, giudizio, fermezza, libertà, riconoscimento, cura/legame, affidabilità, misura/equità.

**Banca:** Q01 — Hai promesso un risultato ma le circostanze sono cambiate: cosa salvi per prima cosa?; Q02 — Un'occasione richiede coraggio ma anche prudenza: come valuti il rischio?; Q03 — Una regola sembra ingiusta nel caso concreto: come argomenti?; Q04 — Una persona si fida di te con un compito delicato: quale principio guida l'azione?; Q05 — Un successo pubblico mette in ombra il lavoro altrui: come redistribuisci il merito?; Q06 — Una decisione corretta è impopolare: quale forma di fermezza usi?; Q07 — Ricevi autorità senza averla cercata: come la rendi legittima?; Q08 — Hai tempo per studiare o agire subito: cosa ti fa scegliere?; Q09 — La libertà di uno limita quella di un altro: quale criterio applichi?; Q10 — Una relazione attraversa un disaccordo: cosa significa restare leali?; Q11 — Un obiettivo richiede disciplina quotidiana: quale ritmo sostieni?; Q12 — Una gloria effimera compete con un risultato utile: quale riconoscimento desideri?; Q13 — L'audacia può essere coraggio o temerarietà: quale indizio distingue i due?; Q14 — Una posizione rispettata non è automaticamente giusta: come la interroghi?; Q15 — Una comunità ti affida una responsabilità: quale patto proponi?; Q16 — Quale valore regge anche quando nessuno lo vede?

**Rami:** Q01 impegno (Q02), giustizia (Q03), affidamento (Q04) o credito (Q05); Q06 porta a fermezza (Q07), sapere (Q08), libertà (Q09) o relazione (Q10); Q11 sceglie disciplina (Q12), fama/ambizione (Q13) o autorità/critica (Q14).

**Risultati:** 14 parole del brief. Le schede includono forma lessicale corretta, traduzione contestualizzata, almeno una sfumatura, abbinamento e fonte di dizionario. *Audacia* deve mantenere la doppia possibilità di valore eccessivo/positivo; *auctoritas* non si riduce a comando; *fides* non soltanto «fede» religiosa; *aequitas* può indicare equità e, in certi contesti, equilibrio d'animo.

---

## 8 — Quale filosofo ti somiglia?

**Dimensioni:** ricerca di definizioni, forma di conoscenza, bene umano, piacere/dolore, autocontrollo, giustizia, natura, dubbio e vita pubblica.

**Banca:** Q01 — Una convinzione molto popolare non ha prove chiare: come inizi a discuterla?; Q02 — Se due persone usano la stessa parola in modi diversi, cosa fai?; Q03 — Una scelta piacevole oggi può creare problemi domani: quale criterio usi?; Q04 — È più importante conoscere il mondo o imparare a vivere bene?; Q05 — Una regola della città contrasta con ciò che ti pare giusto: come la giudichi?; Q06 — Una persona soffre per qualcosa fuori dal suo controllo: che aiuto è utile?; Q07 — Un argomento elegante porta a una conclusione incerta: cosa ti convince?; Q08 — Un desiderio è forte ma non necessario: come lo valuti?; Q09 — La vita buona richiede amici, beni e partecipazione pubblica?; Q10 — Un'apparenza inganna i sensi: quale passaggio aggiungi prima di credere?; Q11 — Una convenzione sembra naturale solo perché è antica: la segui?; Q12 — Un'ingiustizia porta vantaggio a molti: come reagisci?; Q13 — Il dolore non si può evitare: cosa rimane sotto il tuo controllo?; Q14 — Il cosmo sembra in mutamento: quale immagine lo descrive meglio?; Q15 — Un modello numerico promette ordine: che ruolo ha nella realtà?; Q16 — Quando è saggio sospendere il giudizio?

**Rami:** Q01 seleziona esame dialogico (Q02), etica del desiderio (Q03), teoria della vita buona (Q04) o giustizia (Q05); Q06 instrada a cura/controllo (Q07), piacere (Q08), politica (Q09) o conoscenza (Q10); Q11 porta a convenzione/natura (Q12), giustizia (Q13) o cosmologia (Q14). Q15–Q16 consolidano matematica/dubbio senza un esito automatico.

**Profili:** Socrate, Platone, Aristotele, Epicuro, Diogene, Zenone di Cizio, Marco Aurelio, Seneca, Eraclito, Pitagora, con due slot aggiuntivi (es. Pirrone e Anassimandro) solo dopo verifica contenutistica. Ogni risultato nomina un'affinità e una differenza storicamente documentate; non è un test d'orientamento né richiede di conoscere i filosofi.

---

## 9 — Quale personaggio dell'antichità saresti?

**Dimensioni:** capacità di coalizione, strategia, eloquenza, costruzione istituzionale, studio, diplomazia, ambizione, costo umano delle decisioni.

**Banca:** Q01 — Una città deve decidere in assemblea mentre una crisi si avvicina: come prepari la proposta?; Q02 — Due alleati non si fidano: che garanzia offri?; Q03 — Le risorse militari sono inferiori ma conosci il terreno: che strategia consideri?; Q04 — Una riforma utile minaccia il tuo consenso: come la presenti?; Q05 — Una lettera può cambiare un'alleanza: chi deve leggerla e perché?; Q06 — La vittoria lascia una popolazione divisa: come governi il giorno dopo?; Q07 — Una spedizione attraversa culture e lingue diverse: che cosa impari prima?; Q08 — Un rivale possiede la legittimità ma non il piano migliore: come agisci?; Q09 — Un discorso deve convincere senza deformare i fatti: quale prova mostri?; Q10 — Una leadership richiede delega e controllo: cosa affidi ad altri?; Q11 — La memoria pubblica celebra un'impresa ma omette il prezzo: cosa correggi?; Q12 — Un comandante deve scegliere tra rischio e attesa: cosa pesa di più?; Q13 — Un sapere tecnico può cambiare la politica: come lo rendi accessibile?; Q14 — Una successione apre un vuoto di potere: quale istituzione proteggi?; Q15 — Un successo personale dipende da una rete di persone: come ne riconosci il contributo?; Q16 — Quale compromesso non accetteresti in nome della fama?

**Rami:** Q01 assemblea (Q02), strategia/terreno (Q03), riforma (Q04) o diplomazia (Q05); Q06 porta a convivenza (Q07), legittimità (Q08), retorica/fatti (Q09) o delega (Q10); Q11 instrada a memoria/costo (Q12), comando (Q13) o istituzioni (Q14).

**Risultati:** almeno 12 schede verificate; base: Alessandro, Cesare, Annibale, Pericle, Cicerone, Augusto, Cleopatra, Leonida più figure di culture e ruoli diversi. Le schede non attribuiscono tratti psicologici non documentati: spiegano l'analogia attraverso ruolo/decisione storica, segnalano fonti e controesempi e non glorificano conquista o imperialismo.

---

## 10 — Dovresti scegliere il Classico?

**Dimensioni:** curiosità per lingue/testi, pazienza di lettura, ragionamento, interesse storico, metodo, autonomia, disponibilità a esercitarsi, motivazione intrinseca.

**Banca:** Q01 — Un testo ha una parola misteriosa: cosa ti incuriosisce di più?; Q02 — Hai un compito lungo e non sai da dove iniziare: quale metodo provi?; Q03 — Due versioni di un mito si contraddicono: cosa vorresti scoprire?; Q04 — Una lingua nuova sembra difficile: quale piccolo progresso ti motiva?; Q05 — Un dibattito su un tema attuale richiama idee antiche: come lo esplori?; Q06 — La traduzione letterale non restituisce il tono: cosa confronti?; Q07 — Una settimana è piena di verifiche e attività: come pianifichi lo studio?; Q08 — Un ragionamento contiene una premessa nascosta: come la trovi?; Q09 — Una materia non ti riesce subito: quando chiedi aiuto e come?; Q10 — Puoi scegliere fra leggere, discutere, tradurre o costruire un progetto: cosa cerchi?; Q11 — Un percorso richiede esercizio regolare oltre alla curiosità: come reagisci?; Q12 — La storia mostra un'idea moderna in un contesto molto diverso: che domanda poni?; Q13 — Una grammatica sembra un sistema di regole: ti interessa cercarne la logica?; Q14 — Vuoi scegliere la scuola per aspettative altrui o per motivazione tua: come distingui le due?; Q15 — Quale cosa ti piacerebbe imparare anche se richiede tempo?; Q16 — Se il Classico non fosse adatto, quale bisogno di studio vorresti comunque trovare in un'altra scuola?

**Rami:** Q01 porta a lessico (Q02), metodo (Q03), confronto storico (Q04) o curiosità personale (Q05); Q06 instrada a traduzione/registro (Q07), logica (Q08), supporto/metodo (Q09) o forma di attività (Q10); Q11 porta ad abitudine (Q12), contesto (Q13) o motivazione autonoma (Q14).

**Esiti:** otto profili esplorativi: Classico da esplorare, Curioso intellettuale, Razionale in incognito, Potenziale umanista, Curioso da convincere, Metodo da costruire, Altri percorsi da esplorare, Scelta ancora aperta. Ciascuno propone punti da valutare e domande da rivolgere a studenti/docenti. Non misura intelligenza e non costituisce orientamento scolastico.

---

## Output di ogni scheda risultato

Dati distinti per risultato: nome; interpretazione; tensione; punti di forza/limite; suggerimento; fonte; path immagine unico. Nel pannello compare inoltre la classifica dei tre tratti effettivamente accumulati. L'esito integra i punteggi delle dimensioni con la ricorrenza dello stile di risposta (1,5 punti per ogni scelta corrispondente) e usa i tre snodi come spareggio: nessuna risposta singola assegna un profilo. In “Umano o AI?” il risultato è una fascia di accuratezza, non una falsa personalità.

## Verifiche quantitative eseguite

`node tests/quiz-engine.cjs` valida ogni arco, asset, unicità, 16 nodi, sessioni da 8 domande, sei risposte e trade-off per ogni domanda non fotografica, nonché la raggiungibilità dei risultati. Esplora esaustivamente le 216 combinazioni dei tre snodi per ognuno dei nove quiz non fotografici e le 48 combinazioni risposta/confidenza per il quiz fotografico. Verifica poi 500 sessioni deterministiche per ciascun quiz non fotografico e 20.000 per “Umano o AI?”, con distribuzioni in `docs/report-simulazioni.json`. Sono simulazioni sintetiche: non rappresentano le preferenze dei visitatori né validano profili psicometrici. Le nove fasce fotografiche corrispondono a 0–8 risposte corrette.
