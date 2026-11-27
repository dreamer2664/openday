# Schede di composizione
# Coordinate e scelte artistiche effettive

Tutte le coordinate fotografiche sono riferite al PNG 3000 × 2000, origine in alto a sinistra. La foto viene ritagliata a 3:2 mantenendo il fondo (`crop_anchor_y=1`). `ground_y` indica la riga delle suole; l’altezza indicata è un obiettivo nominale e viene arrotondata a un fattore intero dello sprite, non forzata con interpolazione. Le posizioni dei companion sono dedicate, non angoli decorativi.

**Revisione 3.2 · Dodici luoghi, personaggi LPC mantenuti:** il personaggio usa ora il canvas modulare 64 × 64, con centro nativo x=32 conservato attraverso il ritaglio. Il parametro x resta l’ancora del corpo, non il centro variabile di capelli o oggetto. L’armonizzazione conserva questa informazione; le ombre seguono piedi reali e orientamento anche quando il companion è specchiato. La tartaruga usa rapporto d’altezza .10 rispetto alla posa di riferimento, non .22. Il nuovo audit controlla 12096 casi senza uscite dalla cornice o sovrapposizioni fra basi dei piedi, ma non sostituisce l’ispezione del pavimento fotografico.

## Pipeline comune fotografica

1. Sorgente locale → crop → lieve contrasto e tinta ambientale → desaturazione controllata, vignetta debole e grana minima.
2. Sprite con fattore intero nearest-neighbor; tinta ambiente, leggero sollevamento delle ombre e calore sulle alte luci. L’alpha resta netto: si sfocano solo le ombre.
3. Ellisse di contatto sotto la zona effettiva dei piedi e proiezione affine della silhouette, opposta alla luce; ombra anche per ogni companion. Non è un’ombra CSS del pannello di dettaglio.
4. Nei luoghi che lo richiedono, una piccola occlusione da porzioni reali del primo piano: a Paestum solo fili d’erba sulle suole, mai una striscia opaca sulle gambe.
5. Gerarchia tipografica essenziale. Colore adattato alla luminanza della zona foto, traccia di contrasto sottile e, su sfondi scuri/dettagliati, un alone locale sfumato senza rettangoli visibili. Il Foro riceve una bruciatura locale un poco più forte sul selciato.

Non si simula una ricostruzione 3D o una stima automatica della luce: sono layout e parametri artistici dedicati. Non si rimuovono passanti dalla fotografia. I soggetti stilizzati rimangono volutamente pixel art. La colonna live del creator è una vista ingrandita di dettaglio, non questa composizione finale.

## Liceo Alfredo Casardi

Piano di appoggio: pavimentazione davanti alla facciata. Soggetto in primo piano, non sulla scalinata o davanti alle finestre in scala architettonica. La foto è storica e piccola: si mantiene una resa quasi monocromatica coerente, senza inventare dettagli con AI. Tipo scuro nel cielo chiaro in alto a sinistra; nessuna occlusione artificiale.

| Parametro | Valore |
|---|---|
| Appoggio fotografico | y=1770 |
| Personaggio | x=1390; altezza nominale 1100 |
| Companion | x=1900; stessa riga delle suole; specchiato=False |
| Luce | dx=-1, dy=0.32, intensità=0.5; alte luci RGB (250, 242, 227) |
| Ambiente | RGB (220, 222, 222), forza 0.14 |
| Cromia sprite | saturazione relativa 0.24 |
| Finitura | vignetta 0.09; grana 0.0 |
| Occlusori | nessuno: appoggio in area libera |
| Zona testo foto | `top-left` |
| NES, griglia 600 × 400 | suole y=354; personaggio x=272, h nominale=176; companion x=378 |
| Zona testo NES | `top-left` |

## Pantheon

Piano: marmo libero nel settore anteriore destro. Personaggio davanti alla zona dei passanti, non sospeso contro la cupola. Companion alla sua sinistra e rivolto verso il centro. La luce interna è diffusa: ombre corte e poco intense, riflesso caldo. Scritta chiara nel settore alto sinistro più scuro, senza nascondere l’area centrale riconoscibile.

| Parametro | Valore |
|---|---|
| Appoggio fotografico | y=1880 |
| Personaggio | x=2180; altezza nominale 1080 |
| Companion | x=1670; stessa riga delle suole; specchiato=True |
| Luce | dx=-0.15, dy=0.15, intensità=0.26; alte luci RGB (250, 242, 227) |
| Ambiente | RGB (214, 205, 189), forza 0.17 |
| Cromia sprite | saturazione relativa 0.86 |
| Finitura | vignetta 0.09; grana 0.002 |
| Occlusori | nessuno: appoggio in area libera |
| Zona testo foto | `top-left` |
| NES, griglia 600 × 400 | suole y=372; personaggio x=424, h nominale=176; companion x=326 |
| Zona testo NES | `top-left` |

## Foro Romano · Arco di Tito

Piano: selciato/terra del primissimo piano destro, evitando i grossi frammenti lapidei visibili. Personaggio a x=2350 e companion più a destra, x=2590; non sopra il blocco di pietra in centro-basso. La scala più contenuta è calibrata sui passanti reali, per non trasformare l’avatar in un gigante. Il fornice rimane leggibile. Luce da sinistra, ombra verso destra; testo in basso a sinistra con contrasto dedicato. Nessuna maschera di roccia finta: gli appoggi evitano gli ostacoli reali.

| Parametro | Valore |
|---|---|
| Appoggio fotografico | y=1935 |
| Personaggio | x=2350; altezza nominale 500 |
| Companion | x=2590; stessa riga delle suole; specchiato=True |
| Luce | dx=-0.8, dy=0.2, intensità=0.52; alte luci RGB (250, 242, 227) |
| Ambiente | RGB (224, 218, 202), forza 0.16 |
| Cromia sprite | saturazione relativa 0.9 |
| Finitura | vignetta 0.09; grana 0.002 |
| Occlusori | nessuno: appoggio in area libera |
| Zona testo foto | `bottom-left` |
| NES, griglia 600 × 400 | suole y=376; personaggio x=342, h nominale=156; companion x=242 |
| Zona testo NES | `top-left` |

## Teatro di Epidauro

Piano: ghiaia dell’orchestra. Avatar sulla destra, companion a sinistra, gradinate e scale radiali non vengono nascoste. Ombra corta con luce dall’alto/sinistra e tinta leggermente vegetale. Tipografia centrata nella finestra di cielo libera, non dentro i rami dell’angolo destro.

| Parametro | Valore |
|---|---|
| Appoggio fotografico | y=1810 |
| Personaggio | x=2040; altezza nominale 1100 |
| Companion | x=1530; stessa riga delle suole; specchiato=True |
| Luce | dx=-0.8, dy=0.18, intensità=0.52; alte luci RGB (250, 242, 227) |
| Ambiente | RGB (220, 223, 207), forza 0.15 |
| Cromia sprite | saturazione relativa 0.9 |
| Finitura | vignetta 0.09; grana 0.002 |
| Occlusori | nessuno: appoggio in area libera |
| Zona testo foto | `top-center` |
| NES, griglia 600 × 400 | suole y=366; personaggio x=414, h nominale=174; companion x=310 |
| Zona testo NES | `top-left` |

## Biblioteca Malatestiana

Piano: cotto del corridoio centrale, davanti ai plutei. Nessun soggetto collocato sui banchi. Fonte di luce laterale diffusa, ombre morbide e calore del cotto; tinta ambiente più calda rispetto agli esterni. Testo chiaro alto a sinistra sulla volta, nome su fondo scuro. La foto sorgente è un panorama assemblato, documentato nelle fonti.

| Parametro | Valore |
|---|---|
| Appoggio fotografico | y=1880 |
| Personaggio | x=1660; altezza nominale 1110 |
| Companion | x=1200; stessa riga delle suole; specchiato=True |
| Luce | dx=0.2, dy=0.12, intensità=0.22; alte luci RGB (250, 242, 227) |
| Ambiente | RGB (217, 201, 180), forza 0.2 |
| Cromia sprite | saturazione relativa 0.82 |
| Finitura | vignetta 0.13; grana 0.002 |
| Occlusori | nessuno: appoggio in area libera |
| Zona testo foto | `top-left` |
| NES, griglia 600 × 400 | suole y=378; personaggio x=335, h nominale=172; companion x=242 |
| Zona testo NES | `top-left` |

## Tempio di Hera II, Paestum

Piano: prato e sentiero davanti al recinto, non sui gradini del tempio. Personaggio a sinistra del centro e companion alla sua destra. Sole da sinistra, ombre verso destra; tinta calda della pietra. Piccole lame d’erba campionate dalla foto passano solo davanti alle suole. Testi nel cielo alto a sinistra per non sovrapporre il nome al timpano.

| Parametro | Valore |
|---|---|
| Appoggio fotografico | y=1880 |
| Personaggio | x=1230; altezza nominale 1000 |
| Companion | x=1690; stessa riga delle suole; specchiato=False |
| Luce | dx=-1, dy=0.2, intensità=0.6; alte luci RGB (250, 242, 227) |
| Ambiente | RGB (230, 219, 194), forza 0.17 |
| Cromia sprite | saturazione relativa 0.91 |
| Finitura | vignetta 0.09; grana 0.002 |
| Occlusori | grass |
| Zona testo foto | `top-left` |
| NES, griglia 600 × 400 | suole y=370; personaggio x=242, h nominale=174; companion x=344 |
| Zona testo NES | `top-left` |

## Colosseo

Anfiteatro Flavio al crepuscolo: arcate illuminate, piazzale anteriore. Luce artificiale calda e cielo blu; il personaggio resta sul percorso libero a destra.

Riferimento: https://commons.wikimedia.org/wiki/File:Colosseum_in_Rome,_Italy_-_April_2007.jpg. Versione pixel: Colosseo a tre ordini di arcate e attico, anello esterno superstite a sinistra e profilo interrotto; crepuscolo e piazzale.

| Parametro | Valore |
|---|---|
| Appoggio fotografico | y=1920 |
| Personaggio foto | x=2320, h nominale=650 |
| Ritaglio foto | coordinate normalizzate (0.0, 0.0, 1.0, 1.0); centratura 3:2, ancora verticale 1.0 |
| Occlusori | Nessun livello aggiuntivo; piano fotografico mantenuto |
| Companion foto | x=2650; specchiato=True |
| Luce foto | dx=-0.55, dy=0.18, intensità=0.18; alte luci RGB (255, 215, 155) |
| Ambiente foto | RGB (149, 171, 209), forza 0.26 |
| Cromia / finitura | saturazione relativa 0.82; vignetta 0.08; grana 0.0015 |
| Testo foto | top-right |
| NES, griglia 600 × 400 | suole y=374; personaggio x=430, h nominale=150; companion x=328 |
| Testo NES | top-left |

## Acropoli di Atene · Partenone

Fronte orientale del Partenone: gradini e frammenti marmorei. Appoggio sul percorso ghiaioso nell’angolo inferiore destro, esterno allo stilobate.

Riferimento: https://commons.wikimedia.org/wiki/File:East_Facade_of_the_Parthenon_on_July_23,_2019.jpg. Versione pixel: Fronte orientale e colonnato laterale del Partenone, stilobate e trabeazione lacunosa; rocce dell’Acropoli.

| Parametro | Valore |
|---|---|
| Appoggio fotografico | y=1900 |
| Personaggio foto | x=2440, h nominale=670 |
| Ritaglio foto | coordinate normalizzate (0.0, 0.0, 1.0, 1.0); centratura 3:2, ancora verticale 1.0 |
| Occlusori | Nessun livello aggiuntivo; piano fotografico mantenuto |
| Companion foto | x=2080; specchiato=False |
| Luce foto | dx=-0.85, dy=0.22, intensità=0.52; alte luci RGB (255, 239, 207) |
| Ambiente foto | RGB (228, 220, 201), forza 0.16 |
| Cromia / finitura | saturazione relativa 0.9; vignetta 0.08; grana 0.0015 |
| Testo foto | top-left |
| NES, griglia 600 × 400 | suole y=372; personaggio x=425, h nominale=158; companion x=323 |
| Testo NES | top-left |

## Pompei · Foro

Foro di Pompei, colonnato superstite e Vesuvio: personaggio sul selciato libero, non sull’area verde o sulle rovine. Sole dall’alto a sinistra.

Riferimento: https://commons.wikimedia.org/wiki/File:Forum_in_Pompeii_3.jpg. Versione pixel: Foro di Pompei: colonnato e trabeazione frammentaria, basi in laterizio, selciato e profilo del Vesuvio.

| Parametro | Valore |
|---|---|
| Appoggio fotografico | y=1880 |
| Personaggio foto | x=2210, h nominale=880 |
| Ritaglio foto | coordinate normalizzate (0.0, 0.0, 1.0, 1.0); centratura 3:2, ancora verticale 1.0 |
| Occlusori | Nessun livello aggiuntivo; piano fotografico mantenuto |
| Companion foto | x=1740; specchiato=False |
| Luce foto | dx=-0.85, dy=0.25, intensità=0.5; alte luci RGB (255, 240, 209) |
| Ambiente foto | RGB (223, 218, 201), forza 0.16 |
| Cromia / finitura | saturazione relativa 0.88; vignetta 0.08; grana 0.0015 |
| Testo foto | top-right |
| NES, griglia 600 × 400 | suole y=374; personaggio x=428, h nominale=158; companion x=326 |
| Testo NES | top-left |

## Teatro antico di Taormina

Teatro visto dalla cavea superiore: appoggio sul percorso di visita a destra, non nel vuoto sopra l’orchestra. Colori caldi del laterizio e luce da sinistra.

Riferimento: https://commons.wikimedia.org/wiki/File:Taormina_BW_2012-10-05_16-23-05_stitch.jpg. Versione pixel: Cavea curva con scale radiali, orchestra, resti della scena in laterizio e rilievi di Taormina; terrazza anteriore illustrativa.

| Parametro | Valore |
|---|---|
| Appoggio fotografico | y=1880 |
| Personaggio foto | x=2500, h nominale=680 |
| Ritaglio foto | coordinate normalizzate (0.0, 0.0, 1.0, 1.0); centratura 3:2, ancora verticale 1.0 |
| Occlusori | Nessun livello aggiuntivo; piano fotografico mantenuto |
| Companion foto | x=2150; specchiato=False |
| Luce foto | dx=-0.8, dy=0.2, intensità=0.5; alte luci RGB (255, 239, 208) |
| Ambiente foto | RGB (228, 216, 197), forza 0.16 |
| Cromia / finitura | saturazione relativa 0.9; vignetta 0.08; grana 0.0015 |
| Testo foto | top-left |
| NES, griglia 600 × 400 | suole y=374; personaggio x=448, h nominale=152; companion x=348 |
| Testo NES | top-left |

## Castel del Monte

Facciata del castello federiciano in luce coperta: sentiero d’accesso fra arbusti e prato; personaggio sul sentiero e companion sul prato basso accanto al percorso.

Riferimento: https://commons.wikimedia.org/wiki/File:Castel_del_Monte_-_front_view.jpg. Versione pixel: Massa ottagonale, torri angolari ottagonali, portale con timpano e bifore; macchia mediterranea e sentiero.

| Parametro | Valore |
|---|---|
| Appoggio fotografico | y=1870 |
| Personaggio foto | x=690, h nominale=920 |
| Ritaglio foto | coordinate normalizzate (0.0, 0.0, 1.0, 1.0); centratura 3:2, ancora verticale 1.0 |
| Occlusori | Nessun livello aggiuntivo; piano fotografico mantenuto |
| Companion foto | x=1140; specchiato=False |
| Luce foto | dx=-0.5, dy=0.16, intensità=0.25; alte luci RGB (247, 236, 211) |
| Ambiente foto | RGB (214, 217, 199), forza 0.18 |
| Cromia / finitura | saturazione relativa 0.86; vignetta 0.08; grana 0.0015 |
| Testo foto | top-left |
| NES, griglia 600 × 400 | suole y=374; personaggio x=420, h nominale=160; companion x=316 |
| Testo NES | top-left |

## Castello di Barletta

Fortezza e fossato asciutto: personaggio sul piazzale pavimentato anteriore, prima della siepe e del parapetto. La foto risale a ottobre 2008.

Riferimento: https://commons.wikimedia.org/wiki/File:Castello_di_Barletta_01.jpg. Versione pixel: Volumi massicci e bastionati, cortine lapidee, fossato asciutto, piccolo ponte di ingresso e piazzale anteriore.

| Parametro | Valore |
|---|---|
| Appoggio fotografico | y=1880 |
| Personaggio foto | x=2200, h nominale=1010 |
| Ritaglio foto | coordinate normalizzate (0.0, 0.0, 1.0, 1.0); centratura 3:2, ancora verticale 1.0 |
| Occlusori | Nessun livello aggiuntivo; piano fotografico mantenuto |
| Companion foto | x=1710; specchiato=False |
| Luce foto | dx=-0.8, dy=0.2, intensità=0.46; alte luci RGB (251, 240, 219) |
| Ambiente foto | RGB (225, 222, 205), forza 0.16 |
| Cromia / finitura | saturazione relativa 0.88; vignetta 0.08; grana 0.0015 |
| Testo foto | top-left |
| NES, griglia 600 × 400 | suole y=374; personaggio x=426, h nominale=164; companion x=322 |
| Testo NES | top-left |

## Uniformità NES · arte 3.1 preservata + sei aggiunte 3.2

Tutti i vecchi sfondi geometrici procedurali sono sostituiti da **dodici illustrazioni architettoniche assistite da IA e rifinite su griglia nativa**, in `assets/nes/*.png`: 600 × 400, 64 colori per sfondo, opachi. L’arte canonica è identica fra browser e Python. `app/nes_art.py` ne controlla hash/dimensioni/opacità; non esiste un fallback ai disegni rifiutati. Provenienza e licenze in `assets/nes/manifest.json` e SOURCES_AND_LICENSES.md. La riduzione riguarda una nuova illustrazione, non un filtro applicato alla foto originale.

Sfondo, sprite, ombre nette, cornice e font con alpha binario sono composti **prima** dell’ingrandimento nearest-neighbor ×5. Non si lascia una foto dietro agli sprite. La tavolozza è ispirata al rétro, non una simulazione dei limiti hardware originali: i personaggi LPC conservano le proprie palette.

La nuova **targhetta compatta in alto a sinistra**, con bordo a pixel, fondo blu notte e ombra netta, usa testi avorio/menta/oro leggibili in tutte e dodici le scene. Contiene solo istituto, Open Day, città ed eventuale nome: nessun punteggio, slogan, logo o testo aggiuntivo. Evita il vecchio trattamento tipografico variabile di Biblioteca e Foro e lascia libero il centro architettonico.

| Scena NES | Scelte della nuova illustrazione e integrazione |
|---|---|
| Casardi | Facciata razionalista asimmetrica, finestre alte, pietra/intonaco e prospetto laterale; luce calda alto-sinistra, appoggio sul piazzale pavimentato. Colori interpretativi dal riferimento del 1936, **non documentazione della scuola attuale** |
| Pantheon | Parete interna curva, colonne corinzie, edicole e pavimento a intarsi in prospettiva; parte della cupola in alto, oculo fuori campo. Soggetto anteriore destro, gufo/companion a sinistra, ombre corte sul marmo |
| Arco di Tito | Un solo fornice, attico e intradosso, pini e olivo; selciato libero centrale. Avatar spostato a x=342 e altezza nominale ridotta a 156 per evitare pietre/albero sulla destra, companion x=242. Pseudo-iscrizione dell’attico rimossa e pannello lapideo ridipinto |
| Epidauro | Orchestra libera con cavea semicircolare, sedute e scale radiali, fascia alberata e cielo. Soggetto sul piano sabbioso anteriore destro; la cavea rimane riconoscibile |
| Malatestiana | Aula del Nuti, corridoio centrale, plutei, colonne, volte, tiranti e rosone; cotto prospettico con luce laterale calda. Appoggi nell’asse libero davanti ai banchi, non sui piani di legno |
| Hera II | Colonne doriche, colonnato laterale, trabeazione e timpano superstite; pietra calda, prato e sentiero. Soggetti nel primo piano libero; targhetta a sinistra, non sopra il timpano destro |

Rilievi, texture e dettagli minori sono interpretazioni illustrative, non un rilievo filologico certificato; non si presume perfetta corrispondenza di ogni elemento o iscrizione. Nessuna generazione durante la visita. L’adeguatezza artistica è stata verificata sui dodici luoghi composti consegnati, non su ogni combinazione del creator e non come approvazione del committente.

## Modifiche alle foto

Se si cambia inquadratura, tutte queste coordinate devono essere ricontrollate su PNG reali con corporature/pose e companion differenti. Una licenza corretta non rende automaticamente corretta la prospettiva. Le tavole di controllo e i render consegnati sono in `docs/qa` e `renders`; l’ispezione manuale rimane necessaria.


## Spostamento libero facoltativo · 3.3

I layout sopra rimangono le posizioni consigliate. Alla fine il visitatore può sostituirli con un appoggio scelto direttamente sull’anteprima: coordinate normalizzate sulla tela 600×400, non pixel CSS del dispositivo. Il limite tiene insieme personaggio e companion, con ancoraggio dei piedi e dimensioni effettive del ritaglio sprite. Le tre taglie UI passano a scale intere; foto ed export HD usano gli asset originali, non l’immagine di anteprima.

Durante il gesto il ritaglio reale del gruppo si muove su uno sfondo senza la precedente copia. Al rilascio sono ricomposti contatto, ombre e occlusione. Gli sticker sono livelli distinti dalla scena e restano sulla cornice; il PNG finale ricompone quei livelli nel renderer, senza contorni di selezione o screenshot del DOM. Le coordinate, i limiti e le scelte valide sono confrontati fra `app/layout_edit.py` e `browser/composition.js`.

La libertà di spostamento non inferisce supporto reale su ogni superficie: una posizione scelta sul cielo o su una balaustra resta una scelta grafica dell’utente. Usare Posizione consigliata per tornare al layout verificato. Le prove geometriche non attestano plausibilità architettonica di tutti gli spostamenti manuali.
