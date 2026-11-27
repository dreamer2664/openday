# Schede di composizione
# Coordinate e scelte artistiche effettive

Tutte le coordinate fotografiche sono riferite al PNG 3000 × 2000, origine in alto a sinistra. La foto viene ritagliata a 3:2 mantenendo il fondo (`crop_anchor_y=1`). `ground_y` indica la riga delle suole; l’altezza indicata è un obiettivo nominale e viene arrotondata a un fattore intero dello sprite, non forzata con interpolazione. Le posizioni dei companion sono dedicate, non angoli decorativi.

**Revisione LPC 3.0:** il personaggio usa ora il canvas modulare 64 × 64, con centro nativo x=32 conservato attraverso il ritaglio. Il parametro x resta l’ancora del corpo, non il centro variabile di capelli o oggetto. L’armonizzazione conserva questa informazione; le ombre seguono piedi reali e orientamento anche quando il companion è specchiato. La tartaruga usa rapporto d’altezza .10 rispetto alla posa di riferimento, non .22. Il nuovo audit controlla 6048 casi senza uscite dalla cornice o sovrapposizioni fra basi dei piedi, ma non sostituisce l’ispezione del pavimento fotografico.

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
| NES, griglia 600 × 400 | suole y=376; personaggio x=462, h nominale=174; companion x=362 |
| Zona testo NES | `bottom-left` |

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
| Zona testo NES | `top-right` |

## Uniformità NES

Intera composizione nativa 600 × 400: sfondo geometrico originale, sprite, ombre nette, cornice e font con alpha binario vengono composti **prima** dell’ingrandimento ×5. Non si lascia una foto dietro agli sprite. La tavolozza è NES-inspired, non una simulazione dei limiti hardware originali. Biblioteca e Foro usano testi scuri per il contrasto contro intonaco/pavimento chiaro; le altre scene usano testi chiari nelle rispettive zone dedicate.

Le architetture sono sei disegni distinti, non un unico tempio ricolorato: scuola razionalista, interno a cupola, arco a fornice, teatro radiale, biblioteca a navate e tempio dorico. I dettagli iscritti sono texture geometriche astratte, non frasi pseudo-latine.

## Modifiche alle foto

Se si cambia inquadratura, tutte queste coordinate devono essere ricontrollate su PNG reali con corporature/pose e companion differenti. Una licenza corretta non rende automaticamente corretta la prospettiva. Le tavole di controllo e i render consegnati sono in `docs/qa` e `renders`; l’ispezione manuale rimane necessaria.
