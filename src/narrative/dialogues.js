// Dialoghi v3.0 — Scrittura naturale in italiano contemporaneo per i 5 protagonisti, i comprimari e il Sofista Digitale
// Espressioni ritratto: 0=neutro, 1=sorridente, 2=sorpreso, 3=pensieroso, 4=determinato, 5=intesa

export const DIALOGUES = {
  // =========================================================================
  // MODALITÀ OPEN DAY (4 ZONE RAPIDE CON TUTTI E 5 I PROTAGONISTI)
  // =========================================================================
  od_intro: {
    id: "od_intro",
    nodes: [
      {
        speaker: "carlo",
        expr: 2,
        text: "Prof, il controllo accessi si è riavviato da solo e sugli schermi girano avvisi che non vengono dalla segreteria.",
      },
      {
        speaker: "ranaldo",
        expr: 3,
        text: "Mancano dieci minuti all'Open Day. Niente panico: prima capiamo da dove è entrato, poi interveniamo.",
      },
      {
        speaker: "sofista",
        expr: 0,
        text: "Non ho forzato nessuna serratura: è bastato un allegato con scritto 'Orario definitivo'.",
      },
      {
        speaker: "carlo",
        expr: 4,
        text: "Daniele e Ruggero sono al primo piano, Francesco in laboratorio. Sblocchiamo il portone e li raggiungiamo.",
      },
      {
        speaker: "ranaldo",
        expr: 4,
        text: "Come procediamo, Carlo?",
        choiceId: "od_entry_choice",
        choices: [
          {
            label: "Controllo il registro accessi prima di aprire (+Scudo)",
            summary: "Verifica preliminare del registro accessi col Prof. Ranaldo",
            effects: { trust: { ranaldo: 10, carlo: 5, daniele: 5 }, shieldDelta: 1, eipassDelta: 6, flagValue: "logic" },
            worldAction: "open_shortcut_gate",
            next: 5,
          },
          {
            label: "Attivo il sensore alto con un tiro (+Punti)",
            summary: "Sblocco manuale del sensore alto dall'esterno",
            effects: { trust: { carlo: 12, ranaldo: 4 }, scoreDelta: 250, flagValue: "basket" },
            worldAction: "spawn_bonus_tokens",
            next: 6,
          },
          {
            label: "Riavvio la centralina alla cieca (-1 Energia)",
            summary: "Riavvio forzato della centralina senza diagnosi",
            effects: { trust: { ranaldo: -7, daniele: -4 }, hpDelta: -1, eipassDelta: -6, flagValue: "rush" },
            worldAction: "spawn_guard_drone",
            next: 7,
          },
        ],
      },
      {
        speaker: "ranaldo",
        expr: 1,
        text: "Così si lavora: varco secondario libero e un margine in più. Alterniamoci.",
        end: true,
      },
      {
        speaker: "carlo",
        expr: 1,
        text: "Preso al primo tentativo. I sensori alti li sblocco io a rimbalzo, lei pensi agli appoggi.",
        end: true,
      },
      {
        speaker: "ranaldo",
        expr: 2,
        text: "Riavvio alla cieca: allarme secondario. Andiamo avanti, ma leggiamo prima di confermare.",
        end: true,
      },
    ],
  },

  od_meet_daniele: {
    id: "od_meet_daniele",
    unlockChar: "daniele",
    nodes: [
      {
        speaker: "daniele",
        expr: 3,
        text: "Eccovi! Provavo la coreografia, ma la cassa dell'Aula Magna sputa un ritmo sfasato di un battito.",
      },
      {
        speaker: "carlo",
        expr: 0,
        text: "Sfasato? Noi sentiamo solo pop-up che si aprono da soli.",
      },
      {
        speaker: "daniele",
        expr: 1,
        text: "Il segnale corrotto viaggia sul ritmo. Se tengo io il tempo, il rumore non entra: aiutatemi sulla sequenza.",
        end: true,
      },
    ],
  },

  od_meet_ruggero: {
    id: "od_meet_ruggero",
    unlockChar: "ruggero",
    nodes: [
      {
        speaker: "ruggero",
        expr: 4,
        text: "Meno male che siete saliti. Hanno bloccato la rampa del cortile e stavo cercando un passaggio libero di corsa.",
      },
      {
        speaker: "carlo",
        expr: 0,
        text: "Laggiù c'è una paratia già incrinata: da fermo non cede, serve prendere velocità.",
      },
      {
        speaker: "ruggero",
        expr: 1,
        text: "Dammi tre metri di rincorsa: in allungo supero gli ostacoli e apro il passaggio verso la pista.",
        end: true,
      },
    ],
  },

  od_meet_francesco: {
    id: "od_meet_francesco",
    unlockChar: "francesco",
    nodes: [
      {
        speaker: "francesco",
        expr: 0,
        text: "Finalmente. Le ventitré postazioni mandavano segnali fuori sincrono sulle tastiere MIDI.",
      },
      {
        // Daniele entra nel gruppo solo più avanti (od_meet_daniele): qui parla il Prof. Ranaldo.
        speaker: "ranaldo",
        expr: 3,
        text: "Il controller principale blocca l'Aula Magna e sta sovrascrivendo la cartella condivisa: il battito viene da lì.",
      },
      {
        speaker: "francesco",
        expr: 4,
        text: "Prima di sbloccare la tastiera maestra mettiamo al sicuro i file. Come procediamo?",
        choiceId: "od_lab_backup",
        choices: [
          {
            label: "Isolo la cartella e salvo copia esterna (+EIPASS)",
            summary: "Copia di sicurezza su supporto separato prima del ripristino",
            effects: {
              trust: { francesco: 10, daniele: 10, ranaldo: 8, carlo: 5, ruggero: 4 },
              eipassDelta: 10,
              shieldDelta: 1,
              flagValue: "full_backup",
            },
            next: 3,
          },
          {
            label: "Copio solo le slide lasciando la rete aperta (-EIPASS)",
            summary: "Salvataggio parziale senza isolamento della rete",
            effects: {
              trust: { francesco: -4, daniele: -6, ranaldo: -5 },
              eipassDelta: -8,
              hpDelta: -1,
              flagValue: "partial_backup",
            },
            worldAction: "spawn_guard_drone",
            next: 4,
          },
        ],
      },
      {
        speaker: "francesco",
        expr: 1,
        text: "Tutto al sicuro. Ora uso la risonanza sui ponti acustici e rimetto in ordine la tastiera.",
        end: true,
      },
      {
        // Daniele non è ancora stato incontrato in questa zona: la battuta passa a Francesco.
        speaker: "francesco",
        expr: 2,
        text: "Con la condivisione aperta il blocco si è copiato su un altro nodo, come un errore di accordatura. Chiudiamo subito.",
        end: true,
      },
    ],
  },

  od_boss_intro: {
    id: "od_boss_intro",
    nodes: [
      {
        speaker: "sofista",
        expr: 0,
        text: "In Aula Magna, come previsto. Basta riempire uno schermo di avvisi convincenti e nessuno verifica più.",
      },
      {
        speaker: "daniele",
        expr: 4,
        text: "Solo se nessuno legge i dati veri. Tre livelli di offuscamento, ma un ritmo sbagliato si sente.",
      },
      {
        speaker: "francesco",
        expr: 3,
        text: "E tra un'ondata e l'altra lasci sempre la stessa pausa.",
      },
      {
        speaker: "ruggero",
        expr: 4,
        text: "Quando apre un varco ci arrivo io in un attimo.",
      },
      {
        speaker: "carlo",
        expr: 4,
        text: "Restiamo lucidi: studiamo le sue mosse e rispondiamo insieme.",
        end: true,
      },
    ],
  },

  // =========================================================================
  // CAMPAGNA COMPLETA — 6 CAPITOLI CON I 5 PROTAGONISTI E SCELTE CONCRETE
  // =========================================================================
  c1_opening: {
    id: "c1_opening",
    nodes: [
      {
        speaker: "carlo",
        expr: 2,
        text: "Prof. Ranaldo, guardi l'ingresso di Via d'Aragona: i cancelli interni sono rimasti bloccati e sul totem dell'atrio scorrono comunicazioni false sull'Open Day.",
      },
      {
        speaker: "ranaldo",
        expr: 3,
        text: "L'edificio del 1937 è solido, Carlo; il problema è chi ha lasciato una sessione aperta ieri pomeriggio senza disconnettersi.",
      },
      {
        speaker: "sofista",
        expr: 0,
        text: "Chiamatemi pure Sofista. Non ho inventato nulla che non facciate già ogni giorno: inoltrare senza leggere, accettare senza controllare, fidarsi dell'urgenza.",
      },
      {
        speaker: "sofista",
        expr: 3,
        text: "Tra poco entreranno i visitatori. Vediamo se sapete distinguere un documento autentico da una scorciatoia comoda.",
      },
      {
        speaker: "carlo",
        expr: 4,
        text: "Daniele stava verificando gli switch al primo piano, Ruggero era verso la palestra e Francesco in laboratorio. Da dove cominciamo, Prof?",
        choiceId: "c1_strategy",
        choices: [
          {
            label: "Verifichiamo prima il nodo d'ingresso col Prof (+Scudo)",
            summary: "Controllo ordinato dei blocchi all'ingresso principale",
            effects: { trust: { ranaldo: 10, carlo: 5, daniele: 5 }, shieldDelta: 1, eipassDelta: 5, flagValue: "math_plan" },
            worldAction: "open_shortcut_gate",
            next: 5,
          },
          {
            label: "Salgo verso la loggia superiore per sbloccare il relè (+Carlo)",
            summary: "Passaggio alto lungo l'avancorpo in travertino con Carlo",
            effects: { trust: { carlo: 12, ranaldo: 4 }, scoreDelta: 300, flagValue: "hoop_plan" },
            worldAction: "spawn_bonus_tokens",
            next: 6,
          },
          {
            label: "Stacchiamo l'alimentazione del quadro esterno (-1 Energia)",
            summary: "Interruzione brusca senza verifica dei carichi",
            effects: { trust: { ranaldo: -8, daniele: -4 }, hpDelta: -1, eipassDelta: -6, flagValue: "blind_pull" },
            worldAction: "spawn_guard_drone",
            next: 7,
          },
        ],
      },
      {
        speaker: "ranaldo",
        expr: 1,
        text: "Bene. Il primo passaggio è libero: usa pure le mie pedane dove mancano gli appoggi e tieni d'occhio i terminali lungo il portico.",
        end: true,
      },
      {
        speaker: "carlo",
        expr: 1,
        text: "Vado su fino alla loggia delle bandiere: da lì vedo sia il relè del portone sia se è rimasta qualche bozza di Pegaso.",
        end: true,
      },
      {
        speaker: "ranaldo",
        expr: 2,
        text: "Togliere corrente senza guardare cosa c'è collegato serve solo a far scattare le protezioni d'emergenza. Procediamo con ordine adesso.",
        end: true,
      },
    ],
  },

  c1_atrium_clue: {
    id: "c1_atrium_clue",
    nodes: [
      {
        speaker: "carlo",
        expr: 3,
        text: "Siamo nell'atrio. Sulla bacheca digitale hanno confuso apposta gli orari della Sede Centrale con quelli di Via Botticelli e Via Santo Stefano.",
      },
      {
        speaker: "ranaldo",
        expr: 1,
        text: "È il modo più semplice per creare confusione: mescolare un dato vero con due indicazioni sbagliate. Saliamo al primo piano a cercare Daniele.",
        end: true,
      },
    ],
  },

  c2_meet_daniele: {
    id: "c2_meet_daniele",
    unlockChar: "daniele",
    nodes: [
      {
        speaker: "daniele",
        expr: 3,
        text: "Carlo, Prof! Meno male. Sentite anche voi? Il cicalino del corridoio batte come un metronomo impazzito: tre colpi, pausa, poi di nuovo.",
      },
      {
        speaker: "ranaldo",
        expr: 1,
        text: "Interessante. Chi ha alterato i sistemi ha lasciato un ritmo. Ed è regolare, Daniele: una sequenza.",
      },
      {
        speaker: "daniele",
        expr: 4,
        text: "Allora è il mio momento. Ho preparato la coreografia per la festa della scuola: salsa, bachata, cha-cha-chá. Se mi tengo il tempo io, tengo anche il varco. Balliamo fino all'Aula Magna!",
        end: true,
      },
    ],
  },

  c2_corridoio_ruggero: {
    id: "c2_corridoio_ruggero",
    unlockChar: "ruggero",
    nodes: [
      {
        speaker: "ruggero",
        expr: 1,
        text: "Eccovi finalmente! Stavo facendo avanti e indietro lungo il corridoio per avvisare le classi che il tabellone degli orari era stato manomesso.",
      },
      {
        speaker: "carlo",
        expr: 1,
        text: "Buona idea, Ruggero. Hai visto che cosa stanno trasmettendo sugli schermi?",
      },
      {
        speaker: "ruggero",
        expr: 2,
        text: "Una finta circolare urgente che invita tutti a cliccare un link esterno per confermare l'iscrizione all'Open Day.",
      },
      {
        speaker: "carlo",
        expr: 3,
        text: "Il dominio non c'entra nulla con liceocasardi.edu.it. Come fermiamo il passaparola prima che qualcuno inserisca i propri dati?",
        choiceId: "c2_rumor_choice",
        choices: [
          {
            label: "Pubblichiamo la verifica sul portale ufficiale .edu.it (+EIPASS)",
            summary: "Smentita tramite canale istituzionale verificato",
            effects: { trust: { daniele: 10, ranaldo: 9, ruggero: 6 }, eipassDelta: 8, shieldDelta: 1, flagValue: "official_verify" },
            worldAction: "open_shortcut_gate",
            next: 4,
          },
          {
            label: "Ruggero passa di corsa nelle aule ad avvisare di persona (+Ruggero)",
            summary: "Avviso rapido di persona lungo il piano con Ruggero",
            effects: { trust: { ruggero: 12, carlo: 6 }, scoreDelta: 300, flagValue: "sprint_alert" },
            worldAction: "spawn_bonus_tokens",
            next: 5,
          },
          {
            label: "Apriamo il link per vedere chi c'è dietro (-1 Energia)",
            summary: "Apertura imprudente di un collegamento sospetto",
            effects: { trust: { daniele: -7, ranaldo: -6 }, hpDelta: -1, eipassDelta: -8, flagValue: "clicked_spam" },
            worldAction: "spawn_guard_drone",
            next: 6,
          },
        ],
      },
      {
        speaker: "ruggero",
        expr: 1,
        text: "Avviso pubblicato sul dominio corretto e porta laterale sbloccata. Con me nel gruppo superiamo le barriere incrinate: la squadra ora ha le gambe giuste.",
        end: true,
      },
      {
        speaker: "ruggero",
        expr: 4,
        text: "Giro fatto in trenta secondi netti. Quando trovate un ostacolo crepato o un salto lungo, lasciate fare a me.",
        end: true,
      },
      {
        speaker: "carlo",
        expr: 2,
        text: "Aprire direttamente un link sospetto conferma subito che la postazione è attiva. Chiudiamo la finestra e ripartiamo, con un promemoria in più.",
        end: true,
      },
    ],
  },

  c3_cortile_intro: {
    id: "c3_cortile_intro",
    nodes: [
      {
        speaker: "carlo",
        expr: 1,
        text: "Siamo fuori in cortile. Hanno tolto tensione all'ala dei laboratori, ma i sensori ausiliari vicino al campo e alla pista sono ancora raggiungibili.",
      },
      {
        speaker: "ruggero",
        expr: 1,
        text: "Perfetto: tu copri i bersagli alti a canestro, io prendo il tempo sulla corsia ad ostacoli per riattivare la linea di fondo.",
      },
      {
        speaker: "ranaldo",
        expr: 1,
        text: "Che sia la parabola di un tiro o il passo tra due ostacoli, conta sempre la precisione del ritmo. Andiamo.",
        end: true,
      },
    ],
  },

  c4_lab_francesco: {
    id: "c4_lab_francesco",
    unlockChar: "francesco",
    nodes: [
      {
        speaker: "francesco",
        expr: 1,
        text: "Meno male che ci siete tutti. Sono riuscito a scollegare in tempo la postazione principale, ma sulle altre ventidue è comparso un blocco di cifratura.",
      },
      {
        speaker: "carlo",
        expr: 0,
        text: "Ora siamo davvero tutti e cinque. Daniele, si riesce a recuperare il lavoro senza toccare i file bloccati?",
      },
      {
        speaker: "daniele",
        expr: 3,
        text: "Sì, se isoliamo subito lo switch locale dal resto della rete e ripartiamo dalla copia pulita. Voi cosa dite?",
        choiceId: "c4_ransom_choice",
        choices: [
          {
            label: "Scolleghiamo lo switch locale e ripristiniamo il backup (+EIPASS)",
            summary: "Isolamento della rete e ripristino da copia verificata",
            effects: {
              trust: { daniele: 12, francesco: 11, ranaldo: 10 },
              eipassDelta: 10,
              shieldDelta: 1,
              flagValue: "clean_restore",
            },
            worldAction: "open_shortcut_gate",
            next: 3,
          },
          {
            label: "Usiamo il segnale MIDI di Francesco per resettare i ponti (+Francesco)",
            summary: "Ricalibrazione acustica dei ponti del laboratorio",
            effects: {
              trust: { francesco: 13, carlo: 5, ruggero: 5 },
              scoreDelta: 350,
              flagValue: "harmonic_override",
            },
            worldAction: "spawn_bonus_tokens",
            next: 4,
          },
          {
            label: "Inseriamo le credenziali nella finestra di sblocco (-1 Energia)",
            summary: "Errore grave: inserimento credenziali su schermata malevola",
            effects: {
              trust: { ranaldo: -9, daniele: -8, francesco: -5 },
              hpDelta: -1,
              eipassDelta: -10,
              flagValue: "paid_ransom",
            },
            worldAction: "spawn_guard_drone",
            next: 5,
          },
        ],
      },
      {
        speaker: "ranaldo",
        expr: 1,
        text: "Procedura impeccabile: isolare i nodi compromessi evita che il blocco si estenda e il backup pulito ci restituisce le partiture e i materiali.",
        end: true,
      },
      {
        speaker: "francesco",
        expr: 1,
        text: "Frequenza agganciata. Con la risonanza attiva possiamo attraversare le passerelle sonore del laboratorio e arrivare alla console centrale.",
        end: true,
      },
      {
        speaker: "francesco",
        expr: 2,
        text: "Quella finestra serviva solo a rubare un'altra password. Isoliamo manualmente i cavi e andiamo avanti con prudenza.",
        end: true,
      },
    ],
  },

  c5_biblioteca_intro: {
    id: "c5_biblioteca_intro",
    nodes: [
      {
        speaker: "francesco",
        expr: 3,
        text: "Qui in biblioteca hanno alterato l'indice digitale: le collocazioni rimandano a sezioni inesistenti e l'archivio di Pegaso è sparpagliato.",
      },
      {
        speaker: "daniele",
        expr: 0,
        text: "Se sistemiamo la struttura dei titoli e salviamo l'impaginato in un formato stabile, il catalogo torna consultabile in pochi minuti.",
      },
      {
        speaker: "carlo",
        expr: 4,
        text: "Dividiamoci gli scaffali alti: recuperiamo le pagine mancanti per Sofia e saliamo verso l'Aula Magna.",
        end: true,
      },
    ],
  },

  c5_chase_warning: {
    id: "c5_chase_warning",
    nodes: [
      {
        speaker: "sofista",
        expr: 3,
        text: "Avete rimesso ordine nell'archivio più in fretta del previsto. Vediamo se mantenete la stessa calma mentre il corridoio si chiude dietro di voi.",
      },
      {
        speaker: "ruggero",
        expr: 4,
        text: "Non fermiamoci adesso: passo lungo sui rettilinei, pedane del Prof sui vuoti e dritti fino alla porta dell'Aula Magna.",
        end: true,
      },
    ],
  },

  c6_council: {
    id: "c6_council",
    nodes: [
      {
        speaker: "ranaldo",
        expr: 4,
        text: "Eccoci davanti all'Aula Magna. Dal cortile si sentono già le prime famiglie che chiedono indicazioni in portineria.",
      },
      {
        speaker: "carlo",
        expr: 4,
        text: "Siamo tutti qui: Daniele ai tracciati, Francesco al pianoforte, Ruggero pronto sullo scatto e il Prof sulle traiettorie. Come impostiamo l'intervento?",
        choiceId: "c6_leader_choice",
        choices: [
          {
            label: "Carlo guida i colpi di precisione con il supporto di tutti (+Scudo)",
            summary: "Coordinamento centrale affidato a Carlo",
            effects: { trust: { carlo: 12, ruggero: 5 }, shieldDelta: 1, flagValue: "lead_carlo" },
            next: 2,
          },
          {
            label: "Daniele e Francesco aprono varchi leggendo gli schemi (+Scudo)",
            summary: "Analisi dei pattern affidata a Daniele e Francesco",
            effects: { trust: { daniele: 10, francesco: 10 }, shieldDelta: 1, flagValue: "lead_francesco" },
            next: 3,
          },
          {
            label: "Ruggero e il Prof. Ranaldo tengono ritmo e geometria (+Scudo)",
            summary: "Pressione rapida e geometria con Ruggero e Ranaldo",
            effects: { trust: { ruggero: 10, ranaldo: 10 }, shieldDelta: 1, flagValue: "lead_tactical" },
            next: 4,
          },
        ],
      },
      {
        speaker: "carlo",
        expr: 1,
        text: "Ci siamo. Nessuna mossa affrettata: leggiamo i suoi schemi e chiudiamo questa storia prima che suoni la campanella d'inizio.",
        end: true,
      },
      {
        speaker: "daniele",
        expr: 1,
        text: "Io segno il passo e le aperture sicure, Francesco pulisce le onde più fitte e Carlo chiude sul bersaglio. Uno, due, tre: entriamo.",
        end: true,
      },
      {
        speaker: "ruggero",
        expr: 1,
        text: "Ritmo costante dall'inizio alla fine. Appena abbassa le difese non gli lasciamo il tempo di ricaricare.",
        end: true,
      },
    ],
  },

  c6_boss_intro: {
    id: "c6_boss_intro",
    nodes: [
      {
        speaker: "sofista",
        expr: 0,
        text: "Guardate questa sala: bastano tre dati fuori contesto su uno schermo grande perché metà del pubblico smetta di fare domande.",
      },
      {
        speaker: "carlo",
        expr: 4,
        text: "Per questo verifichiamo le cose una per una invece di crederti sulla parola. Cominciamo.",
        end: true,
      },
    ],
  },

  // =========================================================================
  // COMPRIMARI DELL'ISTITUTO & MID-BOSS DI CAPITOLO
  // =========================================================================
  npc_mimmo_atrio: {
    id: "npc_mimmo_atrio",
    nodes: [
      {
        speaker: "mimmo",
        expr: 2,
        text: "Ragazzi, Prof, meno male che vi vedo. Avevano bloccato perfino i lettori vicino alla portineria proprio stamattina che arrivano i genitori.",
      },
      {
        speaker: "ranaldo",
        expr: 1,
        text: "Stiamo rimettendo a posto piano per piano, Mimmo. Hai visto quali stanze sono rimaste accessibili?",
      },
      {
        speaker: "mimmo",
        expr: 1,
        text: "Ho aperto io le porte interne con le chiavi di servizio: se vedete il sopraluce acceso potete entrare a controllare le postazioni e la redazione.",
        choiceId: "mimmo_help",
        choices: [
          {
            label: "Grazie Mimmo, controlliamo anche i locali interni (+Scudo)",
            summary: "Controllo accurato dei locali interni aperti da Mimmo",
            effects: { trust: { ranaldo: 5, carlo: 5, daniele: 4 }, shieldDelta: 1, scoreDelta: 150, flagValue: "polite_mimmo" },
            next: 3,
          },
          {
            label: "Passiamo subito al piano superiore per guadagnare tempo (+Punti)",
            summary: "Salita rapida verso i corridoi superiori",
            effects: { trust: { ruggero: 6 }, scoreDelta: 250, flagValue: "fast_mimmo" },
            worldAction: "spawn_bonus_tokens",
            next: 3,
          },
        ],
      },
      {
        speaker: "mimmo",
        expr: 1,
        text: "Buon lavoro ragazzi. Appena finite sopra faccio entrare i primi gruppi nell'atrio.",
        end: true,
      },
    ],
  },

  npc_sofia_pegaso: {
    id: "npc_sofia_pegaso",
    nodes: [
      {
        speaker: "sofia",
        expr: 0,
        text: "Meno male che siete passati in redazione. Stavamo chiudendo il numero di Pegaso per l'Open Day quando sono spariti i file dal server condiviso.",
      },
      {
        speaker: "francesco",
        expr: 1,
        text: "Stiamo recuperando le bozze lungo i piani, Sofia, e Daniele ha già isolato la cartella corrotta.",
      },
      {
        speaker: "sofia",
        expr: 1,
        text: "Perfetto. Che taglio diamo all'articolo di apertura che distribuiremo stamattina ai visitatori?",
        choiceId: "sofia_headline",
        choices: [
          {
            label: "Raccontiamo la storia e i laboratori reali dell'istituto (+Fiducia)",
            summary: "Apertura di Pegaso dedicata a storia, indirizzi e laboratori del Casardi",
            effects: {
              trust: { carlo: 6, ranaldo: 6, daniele: 6, francesco: 6, ruggero: 6 },
              eipassDelta: 5,
              scoreDelta: 250,
              flagValue: "team_headline",
            },
            next: 3,
          },
          {
            label: "Aggiungiamo un riquadro pratico sulla verifica delle fonti (+EIPASS)",
            summary: "Focus pratico sulla verifica delle fonti e sicurezza digitale",
            effects: { trust: { daniele: 8, ranaldo: 7 }, eipassDelta: 9, shieldDelta: 1, flagValue: "eipass_headline" },
            next: 3,
          },
        ],
      },
      {
        speaker: "sofia",
        expr: 1,
        text: "Ottima scelta: esporto il file definitivo in PDF/A così non salta neanche un margine in stampa.",
        end: true,
      },
    ],
  },

  c2_midboss_bufala: {
    id: "c2_midboss_bufala",
    nodes: [
      {
        speaker: "ruggero",
        expr: 4,
        text: "Fermi un secondo: davanti all'uscita per il cortile c'è il ripetitore automatico che sta diffondendo i falsi avvisi su tutte le LIM.",
      },
      {
        speaker: "carlo",
        expr: 4,
        text: "Se disattiviamo quello liberiamo l'intero piano. Aspettiamo la pausa tra un segnale e l'altro e colpiamolo insieme.",
        end: true,
      },
    ],
  },

  c4_midboss_kraken: {
    id: "c4_midboss_kraken",
    nodes: [
      {
        speaker: "daniele",
        expr: 4,
        text: "Ecco il processo principale che teneva bloccate le postazioni del laboratorio: si è agganciato all'armadio di rete, ma batteva fuori tempo. Ora è fuori scena.",
      },
      {
        speaker: "ranaldo",
        expr: 4,
        text: "Manteniamo la distanza dai tentacoli e colpiamo il nucleo centrale finché non rilascia il controllo dello switch.",
        end: true,
      },
    ],
  },
};
