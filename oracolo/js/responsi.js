/* L'ORACOLO DI DELFI — Archivio locale dei responsi.
 * 50 responsi unici in 5 famiglie. Nessuna rete, nessuna AI:
 * solo il fato (e Math.random). */

'use strict';

const ORACOLO_RESPONSI = [
  // ——— AFFERMATIVI (10) ———
  'Sì. Il destino ti è favorevole.',
  'Le porte si apriranno davanti a te.',
  "L'Olimpo approva il tuo cammino.",
  'Il segno è positivo. Procedi pure.',
  'Sì: le stelle si sono allineate per te.',
  'La via è sgombra. Va\' e non temere.',
  'Gli dèi sorridono al tuo proposito.',
  'Il vento gonfia le tue vele. Salpa.',
  'Sì, senza ombra di dubbio.',
  "L'alloro ti attende in fondo al sentiero.",

  // ——— NEGATIVI (10) ———
  'No. Non è la strada giusta.',
  'Gli dèi non concedono il loro favore.',
  'Fermati: il presagio è contrario.',
  'Non cercare oltre in questa direzione.',
  'La risposta è no. Accettalo con saggezza.',
  'Il filo si spezza: lascia perdere.',
  'Le porte restano chiuse, per ora.',
  'No. Il cielo scuote il capo.',
  'Abbandona questo pensiero: non porta frutti.',
  "L'ombra copre questo cammino. Scegline un altro.",

  // ——— INCERTI (10) ———
  'Il destino non ha ancora deciso.',
  'Le nebbie impediscono di vedere chiaro.',
  'Non è ancora giunto il momento.',
  'Il responso rimane sospeso tra due venti.',
  'Attendi che il tempo riveli il suo disegno.',
  'Forse sì, forse no: la bilancia oscilla.',
  'Gli dèi tacciono. Interroga di nuovo il tuo cuore.',
  'La risposta è avvolta nella nebbia del domani.',
  'Dipende da ciò che farai da qui in avanti.',
  'Il dado rotola ancora. Non affrettare il fato.',

  // ——— INVITO AD AGIRE (10) ———
  'Provaci. Il primo passo spetta a te.',
  'Osa, e il cammino apparirà sotto i tuoi piedi.',
  'La fortuna favorisce chi agisce.',
  'Non attendere un altro segno: agisci ora.',
  'Il destino apre la porta, ma devi attraversarla.',
  'Muoviti: la corrente è dalla tua parte.',
  'Chi tenta, conquista. Chi esita, contempla.',
  'Getta il cuore oltre il dubbio e vai.',
  'È il giorno di alzare la vela. Non rimandare.',
  'Bussa con coraggio: ti sarà aperto.',

  // ——— INVITO ALLA PRUDENZA (10) ———
  'Rifletti ancora prima di scegliere.',
  "Non agire nell'impeto del momento.",
  'La pazienza sarà la tua migliore alleata.',
  'Attendi un momento più propizio.',
  'Chi osserva prima di agire vede più lontano.',
  'Pesa ogni passo: il terreno è scivoloso.',
  'La fretta è nemica del buon consiglio.',
  'Custodisci il tuo proposito ancora un poco.',
  'Guarda due volte prima di saltare.',
  'Il saggio aspetta che le acque si calmino.'
];

/* Protezione locale e volutamente circoscritta, non una valutazione clinica.
 * Le espressioni intercettano termini espliciti; non comprendono il contesto. */
const ORACOLO_SAFETY_PATTERNS = [
  /\b(suicid\w*|autolesion\w*|impiccarmi|overdose|over dose|avvelen\w*)\b/,
  /\b(uccid\w*|ammazz\w*|accoltell\w*|farla finita|togliermi la vita|smettere di vivere)\b/,
  /\b(farmi del male|farmi male|ferirmi)\b/,
  /\btagliarmi\b(?!\s+(i capelli|le unghie|la frangia))/,
  /\b(emergenza|ambulanza|pronto soccorso|ospedale|112|118|emorragia|emoragia|infarto|ictus)\b/,
  /\b(non riesco a respirare|non respiro|dolore al petto|perdo molto sangue|ho perso conoscenza)\b/,
  /\b(farmac\w*|pillol\w*|antibiotic\w*|antidepressiv\w*|insulina|dosaggio|dose|dosi|chemioterapia)\b/,
  /\b(sospend\w*|sospes\w*|smett\w*|smess\w*|interromp\w*|prend\w*|assum\w*|aument\w*|diminu\w*|salt\w*).{0,45}\b(terapi\w*|cur[ae]|medicin[ae])\b/,
  /\b(tumore|cancro|operarmi|operazione chirurgica|aborto|abortire|morire)\b/,
  /\b(stupr\w*|violenza|picchiat\w*|picchiar\w*|droga|cocaina|eroina|anfetamin\w*|metanfetamin\w*)\b/
];

const ORACOLO_SAFETY_RESPONSE =
  "Una questione così importante merita l'aiuto di una persona competente, non di un oracolo.";

/* Un sacchetto mescolato contiene le cinque famiglie, una volta ciascuna.
 * La frase viene poi estratta casualmente, escludendo gli ultimi otto responsi.
 * Questo garantisce varietà ed equilibrio senza analizzare la domanda. */
const OracoloMotore = (() => {
  const FAMIGLIA_SIZE = 10;
  const NUM_FAMIGLIE = ORACOLO_RESPONSI.length / FAMIGLIA_SIZE;
  const MEMORIA = 8;
  const recenti = [];
  let famiglie = [];
  let ultimaFamiglia = -1;

  function domandaDelicata(testo) {
    const t = testo.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
      .replace(/[’'\-]/g, ' ').replace(/\s+/g, ' ');
    return ORACOLO_SAFETY_PATTERNS.some((pattern) => pattern.test(t));
  }

  function prossimaFamiglia() {
    if (!famiglie.length) {
      famiglie = Array.from({ length: NUM_FAMIGLIE }, (_, i) => i);
      for (let i = famiglie.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [famiglie[i], famiglie[j]] = [famiglie[j], famiglie[i]];
      }
      if (famiglie[famiglie.length - 1] === ultimaFamiglia) {
        [famiglie[0], famiglie[famiglie.length - 1]] = [famiglie[famiglie.length - 1], famiglie[0]];
      }
    }
    ultimaFamiglia = famiglie.pop();
    return ultimaFamiglia;
  }

  function estrai() {
    const base = prossimaFamiglia() * FAMIGLIA_SIZE;
    const candidati = [];
    for (let i = 0; i < FAMIGLIA_SIZE; i++) {
      if (!recenti.includes(base + i)) candidati.push(base + i);
    }
    const scelto = candidati[Math.floor(Math.random() * candidati.length)];
    recenti.push(scelto);
    if (recenti.length > MEMORIA) recenti.shift();
    return ORACOLO_RESPONSI[scelto];
  }

  return { estrai, domandaDelicata, totale: ORACOLO_RESPONSI.length };
})();
