// Postazioni Interattive EIPASS v3.0 (7 Moduli User) — Scenari pratici rigorosi, linguaggio naturale e verifica contestuale

export const EIPASS_CHALLENGES = {
  // === MODULO 4: ISPETTORE EMAIL — MITTENTE + CONTESTO + VERA ESTENSIONE ===
  qz_phishing_gate: {
    id: "qz_phishing_gate",
    uiMode: "phishing_inspector",
    moduleIndex: 4,
    badge: "EIPASS MOD. 4 - SICUREZZA IT",
    title: "Posta Portineria: Verifica Messaggio e Allegato",
    simData: {
      from: "segreteria-avvisi@istruzione-verifica.xyz",
      subject: "URGENTE: Apri subito Circolare_Ingressi.pdf.exe",
      attachment: "Circolare_Ingressi.pdf.exe (2.4 MB)",
    },
    prompt: "Valuta insieme dominio del mittente, tono urgente e nome completo del file:",
    options: [
      {
        label: "Apro il file: compare '.pdf' nel nome quindi è sicuramente un documento.",
        previewTag: "ERRORE: l'estensione reale è .exe + mittente esterno",
        correct: false,
      },
      {
        label: "Metto in quarantena: dominio non istituzionale e doppia estensione finale .exe.",
        previewTag: "CORRETTO: verificati mittente, contesto ed estensione reale",
        correct: true,
      },
      {
        label: "Inoltro il messaggio a tutta la rubrica per chiedere se è autentico.",
        previewTag: "ERRORE: espone altri utenti allo stesso allegato malevolo",
        correct: false,
      },
    ],
    speakerRight: "daniele",
    feedbackRight:
      "Ben visto: non basta leggere '.pdf' a metà del nome. Il dominio '.xyz' non appartiene alla scuola e l'estensione finale '.exe' indica un eseguibile.",
    speakerWrong: "ranaldo",
    feedbackWrong:
      "Attenzione alle scorciatoie: bisogna controllare sempre sia la provenienza del messaggio sia l'ultima estensione reale del file.",
    rewardDesc: "Accesso sbloccato +1 Scudo",
    penaltyDesc: "-1 Energia + Unità di guardia attivata",
  },

  // === MODULO 1: CENTRALINA HARDWARE RAM / SSD ===
  qz_ict_ram_ssd: {
    id: "qz_ict_ram_ssd",
    moduleIndex: 1,
    uiMode: "hardware_switch",
    badge: "EIPASS MOD. 1 - FONDAMENTI ICT",
    title: "Quadro Atrio: Continuità Elettrica",
    simData: {
      nodes: ["CPU 3.4GHz", "RAM 16GB (Volatile)", "SSD 512GB (Non volatile)"],
      alert: "SBALZO DI TENSIONE SULLA LINEA",
    },
    prompt: "Quale componente perde subito i dati di lavoro non ancora salvati se manca corrente?",
    options: [
      {
        label: "L'unità SSD: ogni spegnimento azzera tutti i file archiviati sul disco.",
        previewTag: "SSD = memoria di massa permanente",
        correct: false,
      },
      {
        label: "La memoria RAM: è una memoria di lavoro volatile legata all'alimentazione.",
        previewTag: "CORRETTO: il gruppo UPS protegge i dati ancora in RAM",
        correct: true,
      },
      {
        label: "Le cartelle compresse .ZIP salvate nella partizione documenti.",
        previewTag: "ZIP = archivio già registrato su memoria permanente",
        correct: false,
      },
    ],
    speakerRight: "carlo",
    feedbackRight:
      "Esatto: i file già salvati su SSD restano lì, mentre ciò che è aperto solo in RAM va perso se salta l'alimentazione senza gruppo di continuità.",
    speakerWrong: "ranaldo",
    feedbackWrong:
      "Confusione classica: l'SSD conserva i dati anche a computer spento; è la RAM ad essere volatile.",
    rewardDesc: "Gruppo UPS agganciato +1 Scudo",
    penaltyDesc: "-1 Energia + Allarme secondario",
  },

  // === IDENTITÀ CASARDI & MODULO 2: VERIFICA FONTI STORICHE ===
  qz_casardi_1937: {
    id: "qz_casardi_1937",
    uiMode: "browser_verifier",
    moduleIndex: 2,
    badge: "STORIA ISTITUTO & MOD. 2 WEB",
    title: "Scheda Storica di Via Ferdinando I d'Aragona 100",
    simData: {
      url: "https://www.liceocasardi.edu.it/luogo/sede-casardi/",
      https: true,
      cardTitle: "CRONOLOGIA VERIFICATA SEDE CENTRALE",
    },
    prompt: "Quale scheda ricostruisce correttamente la storia documentata dell'edificio?",
    options: [
      {
        label: "Progetto razionalista dell'ing. Boccassini (delibera 1932), inaugurato nel 1937 dopo la sede di Palazzo Della Marra.",
        previewTag: "FONTE ISTITUZIONALE COERENTE ✓",
        correct: true,
      },
      {
        label: "Edificio moderno di sette piani costruito alla fine degli anni Novanta.",
        previewTag: "DATO SMENTITO: fabbricato storico a 2 piani",
        correct: false,
      },
      {
        label: "Sede originaria situata in Via Botticelli 1 fin dagli anni Venti.",
        previewTag: "ERRORE SEDI: Via Botticelli è la succursale",
        correct: false,
      },
    ],
    speakerRight: "ranaldo",
    feedbackRight:
      "Cronologia precisa: dagli anni a Palazzo Della Marra al progetto dell'ing. Boccassini deliberato nel 1932 e inaugurato nel 1937.",
    speakerWrong: "carlo",
    feedbackWrong:
      "Conviene distinguere bene date e plessi: qui siamo nella Sede Centrale di Via d'Aragona 100, inaugurata nel 1937.",
    rewardDesc: "Passaggio storico aperto +1 Scudo",
    penaltyDesc: "-1 Energia + Controllo fallito",
  },

  // === MODULO 2: BROWSER HTTPS & FONTI ISTITUZIONALI ===
  qz_web_sources: {
    id: "qz_web_sources",
    uiMode: "browser_verifier",
    moduleIndex: 2,
    badge: "EIPASS MOD. 2 - FONTI & HTTPS",
    title: "Schermo Corridoio: Verifica Avviso Sospetto",
    simData: {
      url: "AVVISO: 'Open Day rinviato: registrati sul link esterno'",
      https: false,
      cardTitle: "CONTROLLO ATTENDIBILITÀ FONTE",
    },
    prompt: "Qual è il modo corretto per verificare subito se una comunicazione scolastica è autentica?",
    options: [
      {
        label: "Controllo direttamente sul dominio ufficiale https://www.liceocasardi.edu.it verificando connessione HTTPS e comunicati.",
        previewTag: "DOMINIO UFFICIALE .EDU.IT + HTTPS ✓",
        correct: true,
      },
      {
        label: "Mi fido perché lo screenshot è stato inoltrato molte volte nelle chat.",
        previewTag: "NESSUNA VERIFICA DELLA FONTE ORIGINARIA",
        correct: false,
      },
      {
        label: "Apro il link accorciato nel messaggio e inserisco le credenziali per controllare.",
        previewTag: "RISCHIO FURTO CREDENZIALI SU SITO CLONATO",
        correct: false,
      },
    ],
    speakerRight: "sofia",
    feedbackRight:
      "Regola base anche in redazione: si risale sempre al portale istituzionale '.edu.it' digitandolo direttamente, mai dagli screenshot inoltrati.",
    speakerWrong: "daniele",
    feedbackWrong:
      "Il numero di inoltri non dimostra che un avviso sia vero, e i link accorciati nascondono l'indirizzo reale di destinazione.",
    rewardDesc: "Nodo corridoio riallineato +1 Scudo",
    penaltyDesc: "-1 Energia + Segnale di disturbo",
  },

  // === MODULO 3: COMPOSITORE WEBMAIL SEGRETERIA (CC vs CCN) ===
  qz_pec_ccn: {
    id: "qz_pec_ccn",
    uiMode: "mail_composer",
    moduleIndex: 3,
    badge: "EIPASS MOD. 3 - COMUNICARE IN RETE",
    title: "Posta Segreteria: Invio Multiplo alle Famiglie",
    simData: {
      recipients: "150 indirizzi email di genitori esterni",
      subject: "Orari accoglienza Open Day - Via d'Aragona 100",
    },
    prompt: "Quale campo usi per inviare la comunicazione senza esporre gli indirizzi privati tra destinatari?",
    options: [
      {
        label: "Campo [CC] — Copia Conoscenza visibile a tutti i destinatari.",
        previewTag: "ERRORE PRIVACY: tutti vedono i 150 indirizzi",
        correct: false,
      },
      {
        label: "Campo [CCN / BCC] — Copia Conoscenza Nascosta per proteggere la riservatezza.",
        previewTag: "CORRETTO: indirizzi riservati nel rispetto della privacy ✓",
        correct: true,
      },
      {
        label: "Inserisco l'elenco degli indirizzi nel testo dell'oggetto.",
        previewTag: "FORMATO ERRATO E DATI PERSONALI ESPOSTI",
        correct: false,
      },
    ],
    speakerRight: "daniele",
    feedbackRight:
      "Perfetto: nelle comunicazioni verso gruppi esterni si usa sempre il campo CCN (BCC), così nessun destinatario legge gli indirizzi altrui.",
    speakerWrong: "ranaldo",
    feedbackWrong:
      "Inserire decine di contatti esterni in CC rende visibili a tutti dati personali che vanno invece protetti con il campo CCN.",
    rewardDesc: "Varco segreteria aperto +1 Scudo",
    penaltyDesc: "-1 Energia + Blocco sicurezza",
  },

  // === MODULO 6: FOGLIO DI CALCOLO LIVE (MEDIA) ===
  qz_excel_formula: {
    id: "qz_excel_formula",
    uiMode: "spreadsheet_live",
    moduleIndex: 6,
    badge: "EIPASS MOD. 6 - FOGLIO DI CALCOLO",
    title: "Cronometraggio Sportivo: Media Prove",
    simData: {
      headers: ["PROVA", "PUNTEGGIO (B)"],
      rows: [
        ["B2 Carlo P1", "24"],
        ["B3 Ruggero", "22"],
        ["B4 Staffetta", "20"],
        ["B5 Finale", "26"],
      ],
      resultLabel: "B6 MEDIA =",
    },
    prompt: "Quale sintassi calcola correttamente la media aritmetica dell'intervallo da B2 a B5?",
    options: [
      {
        label: "MEDIA(B2-B5)",
        previewTag: "Manca '=' iniziale e '-' esegue una sottrazione",
        calcPreview: "MEDIA(B2-B5)",
        correct: false,
      },
      {
        label: "=MEDIA(B2:B5)",
        previewTag: "CORRETTO: '=' iniziale e due punti ':' per l'intervallo",
        calcPreview: "23.0 ✓",
        correct: true,
      },
      {
        label: "=SOMMA(B2;B5)/100",
        previewTag: "Considera solo due celle estreme e divide per 100",
        calcPreview: "0.50 (ERR)",
        correct: false,
      },
    ],
    speakerRight: "ranaldo",
    feedbackRight:
      "Sintassi pulita: ogni formula si apre con '=' e l'operatore ':' include tutte le celle comprese tra B2 e B5.",
    speakerWrong: "ranaldo",
    feedbackWrong:
      "Senza il segno '=' iniziale il foglio interpreta la scritta come semplice testo, e per indicare un intervallo continuo servono i due punti ':'.",
    rewardDesc: "Tabellone riattivato +1 Scudo",
    penaltyDesc: "-1 Energia + Errore calcolo",
  },

  // === MODULO 6: RIFERIMENTO ASSOLUTO $C$1 ===
  qz_excel_abs_ref: {
    id: "qz_excel_abs_ref",
    uiMode: "spreadsheet_live",
    moduleIndex: 6,
    badge: "EIPASS MOD. 6 - RIFERIMENTI $C$1",
    title: "Palestra: Coefficiente Fisso in Cella C1",
    simData: {
      headers: ["CELLA", "VALORE"],
      rows: [
        ["C1 Coeff.", "1.25"],
        ["B2 Prova 1", "20"],
        ["B3 Prova 2", "24"],
        ["Copia giù", "B2..B10"],
      ],
      resultLabel: "FORMULA =",
    },
    prompt: "Trascinando la formula verso il basso, come mantieni fisso il riferimento alla cella C1?",
    options: [
      {
        label: "=B2*$C$1  (Riferimento assoluto con simbolo $ su colonna e riga)",
        previewTag: "C1 RESTA FISSO DURANTE IL TRASCINAMENTO ✓",
        calcPreview: "25.0 -> 30.0 ✓",
        correct: true,
      },
      {
        label: "=B2*C1#   (Simbolo cancelletto in coda)",
        previewTag: "ERRORE SINTASSI: '#' non blocca i riferimenti",
        calcPreview: "#NOME?",
        correct: false,
      },
      {
        label: "=B2*C1    (Riferimento relativo che scorre su C2, C3...)",
        previewTag: "IL RIFERIMENTO SCIVOLA SULLE CELLE VUOTE",
        calcPreview: "0.0 (ERR)",
        correct: false,
      },
    ],
    speakerRight: "carlo",
    feedbackRight:
      "Perfetto: con '$C$1' blocchi sia colonna sia riga, così puoi copiare la formula su tutta la colonna senza perdere il coefficiente.",
    speakerWrong: "ranaldo",
    feedbackWrong:
      "Un riferimento relativo come 'C1' cambia automaticamente in 'C2', 'C3' quando trascini la cella: per fissarlo serve '$C$1'.",
    rewardDesc: "Pedana palestra attiva +1 Scudo",
    penaltyDesc: "-1 Energia + Scarica sul quadro",
  },

  // === SEDE CENTRALE & MODULO 1: RETE 23 PC + MIDI ===
  qz_lab_23pc: {
    id: "qz_lab_23pc",
    uiMode: "hardware_switch",
    moduleIndex: 1,
    badge: "LAB MULTIMEDIALE & MOD. 1 RETE",
    title: "Configurazione Laboratorio Sede Centrale",
    simData: {
      nodes: ["SWITCH LOCALE", "23 PC + MASTER KEYBOARD", "LIM + STAMPANTE"],
      alert: "VERIFICA INVENTARIO RETE LOCALE",
    },
    prompt: "Quale profilo corrisponde alla dotazione documentata del laboratorio multimediale-musicale?",
    options: [
      {
        label: "Rete locale di 23 postazioni PC con master keyboard, software di notazione e LIM.",
        previewTag: "PROFILO RETE VERIFICATO ✓",
        correct: true,
      },
      {
        label: "Postazioni isolate prive di collegamento di rete e senza periferiche musicali.",
        previewTag: "PROFILO INCOMPLETO: mancano rete e MIDI",
        correct: false,
      },
      {
        label: "Server esterno pubblico senza firewall né controllo accessi locale.",
        previewTag: "CONFIGURAZIONE ERRATA E INSICURA",
        correct: false,
      },
    ],
    speakerRight: "francesco",
    feedbackRight:
      "Profilo riconosciuto: le ventitré postazioni in rete con le tastiere MIDI e la LIM tornano a comunicare regolarmente.",
    speakerWrong: "daniele",
    feedbackWrong:
      "Il profilo non coincide con la rete reale del laboratorio: qui lavorano 23 postazioni collegate alle master keyboard e alla LIM.",
    rewardDesc: "Linea laboratorio attiva +1 Scudo",
    penaltyDesc: "-1 Energia + Nodo bloccato",
  },

  // === MODULO 4: AUTENTICAZIONE 2FA & BACKUP ===
  qz_2fa_backup: {
    id: "qz_2fa_backup",
    uiMode: "hardware_switch",
    moduleIndex: 4,
    badge: "EIPASS MOD. 4 - ACCESSI & BACKUP",
    title: "Console Laboratorio: Protezione Account e Copie",
    simData: {
      nodes: ["CREDENZIALI UNICHE", "VERIFICA 2FA", "COPIA ESTERNA ISOLATA"],
      alert: "TENTATIVI RIPETUTI DI ACCESSO REMOTO",
    },
    prompt: "Quale configurazione mette realmente al sicuro gli account e i materiali dell'Open Day?",
    options: [
      {
        label: "Stessa password semplice su tutte le macchine e unica copia salvata sul Desktop.",
        previewTag: "ALTO RISCHIO: nessun isolamento né secondo fattore",
        correct: false,
      },
      {
        label: "Password robusta dedicata, autenticazione a due fattori (2FA) e backup su supporto separato.",
        previewTag: "PROTEZIONE ACCESSI E COPIA DI RIPRISTINO ATTIVE ✓",
        correct: true,
      },
      {
        label: "Rimozione temporanea delle password per velocizzare l'avvio delle postazioni.",
        previewTag: "ACCESSO NON AUTORIZZATO IMMEDIATO",
        correct: false,
      },
    ],
    speakerRight: "daniele",
    feedbackRight:
      "Così siamo coperti su entrambi i fronti: la 2FA blocca gli accessi con credenziali rubate e il backup separato protegge dai blocchi.",
    speakerWrong: "carlo",
    feedbackWrong:
      "Usare password deboli o toglierle per fare prima è esattamente ciò che ha permesso l'intrusione iniziale.",
    rewardDesc: "Console protetta +1 Scudo",
    penaltyDesc: "-1 Energia + Allarme su switch",
  },

  // === MODULO 5: STUDIO IMPAGINAZIONE (STILI & SOMMARIO) ===
  qz_word_styles: {
    id: "qz_word_styles",
    uiMode: "layout_studio",
    moduleIndex: 5,
    badge: "EIPASS MOD. 5 - ELABORAZIONE TESTI",
    title: "Catalogo della Biblioteca Scolastica",
    simData: {
      docKind: "catalog",
      docTitle: "INDICE FONDO LIBRARIO CASARDI",
    },
    prompt: "Come imposti un documento lungo affinché il sommario si aggiorni da solo se cambiano le pagine?",
    options: [
      {
        label: "Scrivo a mano numeri di pagina e file di puntini riga per riga.",
        previewTag: "INDICE STATICO: si disallinea a ogni modifica",
        layoutState: "messy",
        correct: false,
      },
      {
        label: "Applico gli Stili di titolo ('Titolo 1', 'Titolo 2') e inserisco il Sommario automatico.",
        previewTag: "STRUTTURA GERARCHICA E SOMMARIO DINAMICO ✓",
        layoutState: "clean",
        correct: true,
      },
      {
        label: "Uso decine di 'Invio' consecutivi per spingere i capitoli alla pagina successiva.",
        previewTag: "IMPAGINAZIONE INSTABILE: testo traslato",
        layoutState: "shifted",
        correct: false,
      },
    ],
    speakerRight: "francesco",
    feedbackRight:
      "Ordine pulito: usando gli Stili per i titoli e le interruzioni di pagina, il sommario si ricalcola in un istante senza errori.",
    speakerWrong: "ranaldo",
    feedbackWrong:
      "Andare a capo quaranta volte o scrivere i numeri a mano costringe a rifare tutto appena aggiungi un paragrafo. Servono gli Stili.",
    rewardDesc: "Catalogo riordinato +1 Scudo",
    penaltyDesc: "-1 Energia + Indice fuori posto",
  },

  // === MODULO 5: ESPORTAZIONE PDF/A DI PEGASO ===
  qz_library_casardi: {
    id: "qz_library_casardi",
    uiMode: "layout_studio",
    moduleIndex: 5,
    badge: "REDAZIONE PEGASO & MOD. 5 PDF",
    title: "Impaginato del Giornale Studentesco 'Pegaso'",
    simData: {
      docKind: "pegaso",
      docTitle: "PEGASO - NUMERO OPEN DAY",
    },
    prompt: "In quale formato esporti il giornale per mantenere identici margini, font e colonne su ogni dispositivo?",
    options: [
      {
        label: "Esporto in PDF (o PDF/A per la conservazione d'archivio).",
        previewTag: "LAYOUT FISSO E LEGGIBILE OVUNQUE ✓",
        layoutState: "clean",
        correct: true,
      },
      {
        label: "Salvo come file di solo testo .TXT non formattato.",
        previewTag: "PERDITA DI COLONNE, IMMAGINI E STILI",
        layoutState: "messy",
        correct: false,
      },
      {
        label: "Copio solo il collegamento locale al file temporaneo di lavoro.",
        previewTag: "COLLEGAMENTO NON LEGGIBILE SU ALTRI PC",
        layoutState: "shifted",
        correct: false,
      },
    ],
    speakerRight: "sofia",
    feedbackRight:
      "Perfetto: in PDF/A il numero di Pegaso mantiene esattamente la nostra impaginazione sia in stampa sia online.",
    speakerWrong: "sofia",
    feedbackWrong:
      "In formato '.txt' o con un collegamento locale perdiamo tutta la messa in pagina della redazione.",
    rewardDesc: "Archivio Pegaso pronto +1 Scudo",
    penaltyDesc: "-1 Energia + Errore esportazione",
  },

  // === MODULO 7: STUDIO PRESENTAZIONI (SLIDE MASTER AULA MAGNA) ===
  qz_ppt_openday: {
    id: "qz_ppt_openday",
    uiMode: "layout_studio",
    moduleIndex: 7,
    badge: "EIPASS MOD. 7 - PRESENTAZIONI",
    title: "Proiezione Aula Magna: Presentazione Open Day",
    simData: {
      docKind: "slide",
      docTitle: "ACCOGLIENZA LICEO A. CASARDI",
    },
    prompt: "Le diapositive sono state rese illeggibili con testo chiaro su fondo bianco. Come le correggi tutte in modo uniforme?",
    options: [
      {
        label: "Aggiungo transizioni sonore diverse e testo lunghissimo su ogni singola slide.",
        previewTag: "DIAPOSITIVE SOVRACCARICHE E CONFUSE",
        layoutState: "shifted",
        correct: false,
      },
      {
        label: "Imposto lo Schema Diapositiva (Slide Master) con contrasto netto, font leggibile e sintesi.",
        previewTag: "COERENZA GRAFICA E ALTA LEGGIBILITÀ IN SALA ✓",
        layoutState: "clean",
        correct: true,
      },
      {
        label: "Riduco ancora il corpo del testo per far entrare intere pagine copiate.",
        previewTag: "TESTO ILLEGGIBILE DALLA PLATEA",
        layoutState: "messy",
        correct: false,
      },
    ],
    speakerRight: "ranaldo",
    feedbackRight:
      "Ottimo lavoro: lo Schema Diapositiva uniforma subito tutte le slide e toglie al Sofista il controllo dello schermo principale (-25% difesa Boss).",
    speakerWrong: "carlo",
    feedbackWrong:
      "Una presentazione proiettata in sala deve essere chiara e sintetica, non un muro di testo illeggibile.",
    rewardDesc: "Schermo Aula Magna ripristinato (-25% HP Boss)",
    penaltyDesc: "-1 Energia + Difesa Boss intatta",
  },
};
