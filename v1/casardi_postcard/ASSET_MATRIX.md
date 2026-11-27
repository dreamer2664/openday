# Matrice effettiva degli asset · revisione 3.1 NES Retro
## Liceo Alfredo Casardi · Open Day 2026/27 · Barletta

Inventario della versione consegnata, **27 novembre 2026**. I colori, i prodotti cartesiani, i preset, le icone derivate e le copie nei due renderer **non vengono contati come nuovi disegni**.

## 1 · Personaggi LPC mantenuti dalla revisione precedente

I personaggi LPC già accettati **non sono stati sostituiti nella 3.1**. La vecchia base procedurale è esclusa dalla consegna. Si mantiene il lavoro modulare degli artisti **Universal LPC Spritesheet Character Generator**, revisione fissata:

```text
86a3719ee4a7e2e9fb27c7c152e29a741d3e930a
```

- Canvas del personaggio **64 × 64**, ancoraggio orizzontale nativo **x=32** e suole di riferimento **y=62**. Il ritaglio trasparente conserva l’ancora del corpo: capelli, oggetti e pose non spostano arbitrariamente il centro della persona nella scena.
- **56 moduli LPC curati**, **85 atlanti compatti di quattro pose** e **255 PNG sorgenti non modificati**. Questi numeri sono file/moduli tecnici, **non** 56 look completi o 255 personaggi. Un modulo di naso di riserva e alcuni strati posteriori possono non essere visibili nella vista frontale selezionata.
- Autori/licenze/URL/hash, definizioni JSON e rettangoli di estrazione sono conservati in `assets/characters/lpc/manifest.json`. Crediti leggibili in `assets/characters/CREDITI_LPC.txt` e in Info.
- Renderer originale indipendente, non il JavaScript GPL del generatore LPC. Codice originale MIT; i disegni LPC **non sono tutti CC0**.
- Equipaggiamento fantascientifico originale in `app/cyber_layers.py`: disegni senza marchi, non costumi o asset copiati da Cyberpunk 2077 / ARK. Le aggiunte non cancellano gli obblighi delle basi LPC.
- Companion originali su canvas **74 × 100**, distinti dai personaggi LPC. Non sono emoji o icone di libreria.

### Le quattro pose reali

| UI | Frame LPC frontale selezionato | Carattere visivo |
|---|---|---|
| Rilassata | walk, colonna 0, direzione/riga 2 | Braccia ai lati, appoggio stabile |
| In movimento | slash, colonna 4, riga 2 | Braccio esteso e gambe differenti; frame riutilizzato come posa statica senza arma |
| Braccia aperte | spellcast, colonna 5, riga 2 | Entrambe le braccia sollevate, silhouette ampia |
| Mani davanti | spellcast, colonna 2, riga 2 | Presa frontale; oggetto dedicato sovrapposto alle mani |

Non sono rotazioni/deformazioni della posa rilassata e non sono quattro cicli animati. L’idle incluso è soltanto il battito delle palpebre facoltativo; il PNG è statico. Lo stile NES è ispirato al rétro, non una simulazione dei limiti hardware Nintendo.

## 2 · Opzioni di forma effettivamente selezionabili

I numeri includono l’opzione «nessuno» dove indicata. Tutte le categorie supportano le quattro pose salvo le incompatibilità esplicite sotto.

| Categoria | Numero | Contenuto / limite reale |
|---|---:|---|
| Corporatura | **3** | Slanciata (`female` LPC), Ampia (`male` LPC), Compatta (`teen` LPC); basi disegnate separatamente, etichette UI non vincolate al genere |
| Forma del viso | **4** | Delicato, Marcato, Affilato, Pieno: quattro teste LPC, con differenze volutamente sottili su scala nativa |
| Forma degli occhi | **3** | Classici; due piccoli interventi originali su palpebre/pupille. Non sostituiscono i sei disegni d’espressione; non aggiungono pupille agli occhi chiusi |
| Colori degli occhi | **6** | Palette, non nuove anatomie |
| Sopracciglia | **3** | Naturali nella faccia, folte e sottili da livelli LPC |
| Naso | **3** | Piccolo nella testa, largo e aquilino come livelli LPC; il modulo button di riserva non è un quarto naso UI |
| Bocca | **2** | Sottile / piena; ritocco visibile soprattutto con neutra, seria e curiosa, non forzato sul sorriso a occhi chiusi |
| Espressioni | **6** | Neutra, sorriso, entusiasta, seria, curiosa, sorpresa; autentici livelli LPC, compresi occhi, guance e bocca secondo il disegno |
| Acconciatura | **15** | **14 disegni** e senza capelli: corti asimmetrici, caschetto, ricci corti, lunghi lisci, coda alta, crocchia, treccia, ondulati, cresta corta/lunga, treccine aderenti, dreadlocks, afro, rasati |
| Barba / baffi | **4** | Nessuno, baffi, barba corta, barba lunga; tre livelli LPC, non quattro barbe nuove |
| Capi superiori | **10** | Sette capi LPC e tre look tecnici basati su capi LPC con pannelli originali: dettagli sotto |
| Capi inferiori | **6** | Cargo tecnici, jeans risvoltati, pantaloni, pantaloncini, gonna corta, gonna dritta; cargo = jeans LPC + tasche/ginocchiere originali |
| Scarpe | **5** | Quattro basi LPC: sneakers, stivaletti, scarpe basse, sandali; stivali tecnici = stivaletti + segmenti originali |
| Copricapo / cuffie | **6** | Nessuno; cuffie tecniche, berretto, bandana LPC, cappuccio LPC, corona d’alloro |
| Occhiali | **5** | Nessuno; tondi, da sole e spessi LPC; visore HUD originale |
| Accessorio / borsa | **6** | Nessuno; zaino a celle, collana, sciarpa LPC, zaino, tracolla |
| Oggetto in mano | **6** | Niente; libro aperto, tablet, pergamena, cetra, oloproiettore. Cinque disegni originali, tutti in presa frontale |
| Posa | **4** | Quattro frame artistici distinti, non quattro traslazioni |

### Capi superiori: cosa cambia davvero

| Opzione | Base e interventi |
|---|---|
| Giacca cyber | Cardigan LPC; collo alto, revers asimmetrico, zip segmentata, spalline, polsini e piccolo indicatore di colore originale |
| Tuta da esplorazione | Maglia LPC; piastra toracica articolata, protezioni delle spalle, inserti tecnici e polsini originali. Non un modello 3D di esoscheletro |
| Gilet tecnico | T-shirt LPC; gilet tattico originale con tasche, zip e spalle differenziate |
| Cappotto da pilota | Collared coat LPC; bordi, revers e minuteria originali; solo corporatura Ampia |
| Trench tecnico | Trench coat LPC; bordi e minuteria originali; solo Ampia |
| T-shirt | T-shirt LPC |
| Camicia | Longsleeve buttoned LPC |
| Maglia sportiva | Longsleeve 2 LPC |
| Maglione | Longsleeve LPC |
| Cardigan | Cardigan LPC |

I look **Urbano / Esplorazione / Neon / Pilota** sono quattro configurazioni modificabili delle opzioni, non altri quattro sprite esclusivi. Alcuni dettagli sono parzialmente coperti dagli oggetti o dallo zaino, come avverrebbe con veri livelli sovrapposti.

## 3 · Colori, separati dai disegni

| Campo | Palette uniche disponibili |
|---|---:|
| Pelle | **7** |
| Capelli / barba | **13** |
| Occhi | **6** |
| Capo superiore | **18** |
| Inserti / strato interno | **18** |
| Capo inferiore | **22** |
| Cintura | **6** |
| Scarpe | **6** |
| Copricapo | **18** |
| Accessori | **22** |

Le palette originali LPC e quelle del progetto sono salvate localmente. Il colore dell’accessorio è interpretato secondo il materiale: la collana usa la rampa metallica; non ogni tono tessile corrisponde a un metallo distinto. Gli inserti sono più evidenti sui tre capi tecnici; non si dichiarano 18 nuovi capi perché cambia una cucitura.

In modalità fotografica i colori vengono poi armonizzati con luce/tinta della scena. Il Casardi storico è volutamente molto desaturato. I due stili usano **la stessa nuova famiglia di personaggi**, non due inventari separati. Gli animali hanno una propria resa di palette coerente.

## 4 · Compatibilità e ordine dei livelli

1. Zaino/borsa posteriori.
2. Moduli LPC ordinati per `zPos`: corpo, gambe/scarpe, testa e volto, capi, capelli e accessori secondo la definizione.
3. Equipaggiamento tecnico originale con ancore per le braccia della posa, dettagli facciali, tracolle, cuffie/copricapo/visore.
4. Oggetto in presa e piccoli pixel delle mani davanti all’oggetto.
5. Ritaglio trasparente con ancora del corpo conservata; scala nearest-neighbor, armonizzazione e ombre nel compositore.

**Regole esplicite, non compatibilità universale inventata:**

- Cappotto e trench dispongono solo della variante LPC `male`: sono abilitati **solo su Ampia**. Cambiando corporatura verso una non supportata si passa a Giacca cyber. Non si incolla il cappotto maschile su un corpo differente.
- Gonna dritta è disponibile su **Slanciata / Compatta**; su Ampia si normalizza a gonna corta.
- Cappuccio e berretto nascondono i capelli; non cancellano l’acconciatura selezionata. Cuffie e alloro restano compatibili con i capelli, che possono coprirli parzialmente.
- Oggetto diverso da niente → Mani davanti. Mani davanti senza oggetto → libro. Altra posa selezionata → oggetto riposto.
- Il sorriso/entusiasmo LPC ha occhi chiusi: il selettore forma/colore occhi resta memorizzato, non crea pupille sopra palpebre chiuse. Il visore può coprire parte dell’espressione.
- Cinture/pantaloni e collane possono essere nascosti dai capi lunghi. Cambiare un dettaglio nascosto non è un nuovo disegno visibile.
- Capelli, cappuccio e lenti LPC hanno trasparenze intenzionali. Ora sono composti **sulla griglia nativa con vero alpha-over**, preservato nella rimappatura; la sagoma finale è alpha binario. Non creano buchi trasparenti nella testa e non vengono sfocati.

Nessun audit finito dimostra la bellezza di ogni possibile combinazione teorica. Le tavole consegnate e i test coprono i casi specificati, con le limitazioni dichiarate.

## 5 · Companion originali

**8 animali, 16 anatomie/pose di base, 21 varianti di mantello/palette, 42 abbinamenti variante-posa.** Non 42 specie/anatomie nuove. Due pose per ogni animale, senza animazioni o espressioni aggiuntive fittizie.

| Animale | Varianti | Pose | Rapporto indicativo di altezza rispetto al personaggio* |
|---|---:|---|---:|
| Gatto | 4 — soriano, nero, bianco, grigio | Seduto / in piedi | .30 |
| Cane | 3 — cucciolo, nero, bianco | Seduto / in piedi | .40 |
| Volpe | 2 — rossa, argento | Seduta / accovacciata | .36 |
| Gufo | 2 — comune, neve | Posato / ali aperte | .34 |
| Coniglio | 3 — grigio, bianco, marrone | Seduto / in piedi | .32 |
| Corvo | 2 — nero, blu | Posato / ali aperte | .30 |
| Tartaruga | 2 — verde, marrone | Cammina / ritirata | .10 |
| Piccolo drago | 3 — smeraldo, rubino, ambra | Seduto / ali aperte | .34 |

\*Rapporto rispetto alla posa di riferimento dell’animale e all’altezza effettiva del personaggio; scala intera arrotondata. Una tartaruga ritirata o volpe accovacciata non viene gonfiata fino all’altezza della posa più alta. Il dato è un parametro artistico, non una misura zoologica. Il companion «nessuno» non produce sagome o segnaposto.

Ogni foto ha un appoggio e orientamento dedicati. Ombra di contatto, ombra proiettata e tinta si applicano anche agli animali. Biblioteca fotografica usa ora x=1200, Biblioteca NES x=242: separazione corretta delle basi dei piedi dei cani e del corpo nelle quattro pose.

## 6 · Scenari, campioni e verifiche

- **6 fotografie** autentiche con fonte/licenza, preservate.
- **6 nuovi sfondi NES**, tutti sostituiti: illustrazioni **assistite da IA** e rifinite su griglia **600 × 400, 64 colori per sfondo**, non sei ricolorazioni della stessa scena. Nessuna generazione a runtime e nessun asset commerciale. I PNG canonici sono in `assets/nes/`; `manifest.json` registra provenienza/hash/licenze. Nessuna esclusiva rivendicata sugli elementi generati automaticamente.
- Casardi razionalista asimmetrico, Pantheon interno curvo con intarsi, Arco di Tito a un fornice e selciato, Epidauro dal piano dell’orchestra, Aula del Nuti con volte/plutei, Hera II con colonnato dorico: sei architetture distinte. Piccoli dettagli sono interpretativi, non certificazione filologica.
- Canvas e Pillow usano gli **stessi file di sfondo**, non implementazioni grafiche divergenti. I vecchi poligoni procedurali sono rimossi; `build_examples.py` non sovrascrive più l’arte.
- Soggetti, testo e ombre NES vengono composti sulla stessa griglia prima dell’ingrandimento ×5; niente residui fotografici. Le foto sono ricomposte a 3000 × 2000, indipendenti dal monitor.
- **8 PNG HD** mantenuti e **12 JPG 1200 × 800** in `renders/`. Tutte le 12 scene/stili sono state realmente renderizzate anche dal renderer browser a 3000 × 2000.

Evidenze della revisione attuale (limiti e hash in TEST_REPORT.md):

| Verifica | Risultato | Cosa non dimostra |
|---|---|---|
| Audit asset | **7716 casi**, zero tocchi al bordo, alpha finale 0/255 | Non tutte le combinazioni artistiche |
| Integrità LPC | **255 PNG sorgenti, 56 definizioni, 85 atlanti** con SHA-256 verificato | Non una nuova autorizzazione legale degli autori |
| Audit layout | **6048 casi**, zero fuori cornice / sovrapposizioni fra basi dei piedi | Non riconosce da solo prospettiva o ostacoli in foto |
| Parità Python / JS | **938 confronti RGBA esatti, zero differenze** | Non identità dell’intera cartolina Canvas/Pillow |
| Sei sfondi nativi | **6 PNG, dimensioni/opacità/palette/hash e riferimenti verificati** | Non un voto automatico sulla bellezza o fedeltà storica |
| Tavole visive | `docs/qa/01…04`, render 05, dettaglio Foro 06, render browser 07, nuove architetture 08 | Revisione manuale rappresentativa, non approvazione del committente |

Le tavole sono pixel effettivi del renderer: includono ingrandimenti nearest-neighbor e una striscia 1×, non illustrazioni promozionali o asset diversi dall’app. Per la provenienza completa e le condizioni ShareAlike leggere **SOURCES_AND_LICENSES.md** e i crediti LPC inclusi.
