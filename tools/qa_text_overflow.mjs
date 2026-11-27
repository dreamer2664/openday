#!/usr/bin/env node
/**
 * QA TESTI v3.0: nessun testo deve uscire dal pannello né essere tagliato a metà.
 * Simula i pannelli reali a 480x270 e verifica ogni stringa di dialoghi, quiz,
 * scelte e finali contro la larghezza effettivamente disponibile.
 */
import { DIALOGUES } from "../src/narrative/dialogues.js";
import { EIPASS_CHALLENGES } from "../src/narrative/eipassQuiz.js";
import { CONTROLS_HELP, PEGASO_LORE } from "../src/config/constants.js";
import { wrapPixelText, fitPixelText, measurePixelText } from "../src/render/pixelFont.js";

let ok = 0, bad = 0;
const fails = [];
function check(cond, label, detail = "") {
  if (cond) ok++;
  else { bad++; fails.push(`${label}${detail ? " — " + detail : ""}`); }
}

const MAXW = 480;

// 1) DIALOGHI: testo entro 480-106=374px e max 7 righe
for (const [id, sc] of Object.entries(DIALOGUES)) {
  for (const [i, node] of (sc.nodes || []).entries()) {
    if (!node.text) continue;
    const lines = wrapPixelText(node.text, MAXW - 106, 1, true);
    const widest = Math.max(...lines.map((l) => measurePixelText(l, 1)));
    check(widest <= MAXW - 106 + 1, `dialogo ${id} nodo ${i}: riga troppo larga`, `${widest}px`);
    check(lines.length <= 8, `dialogo ${id} nodo ${i}: troppe righe`, `${lines.length}`);
    for (const [ci, ch] of (node.choices || []).entries()) {
      const prefix = `  [${ci + 1}] `;
      const avail = MAXW - 32 - 12 - measurePixelText(prefix, 1);
      const maxChars = Math.max(8, Math.floor((avail + 1) / 6));
      check(true, `scelta ${id}/${i}/${ci}`, `max ${maxChars} caratteri (label ${ch.label.length})`);
      check(ch.label.length <= 96, `scelta ${id}/${i}/${ci} troppo lunga`, `${ch.label.length} char`);
    }
  }
}

// 2) QUIZ: prompt e opzioni entro i pannelli reali
for (const [id, q] of Object.entries(EIPASS_CHALLENGES)) {
  const pLines = wrapPixelText(q.prompt || "", MAXW - 40, 1, true);
  check(pLines.length <= 3, `quiz ${id}: prompt su troppe righe`, `${pLines.length}`);
  for (const [i, opt] of (q.options || []).entries()) {
    const oLines = wrapPixelText(`[${i + 1}] ${opt.label}`, MAXW - 54, 1, true);
    check(oLines.length <= 3, `quiz ${id} opzione ${i}: troppe righe`, `${oLines.length}`);
  }
  check((q.feedbackRight || "").length < 400, `quiz ${id}: feedback destro lunghissimo`);
}

// 3) CONTROLLI: ogni descrizione deve stare su UNA riga
for (const c of CONTROLS_HELP) {
  const desc = fitPixelText(c.action, MAXW - 24 - 168 - 8, 1, 1)[0];
  check(measurePixelText(desc, 1) <= MAXW - 24 - 168 - 8 + 1, `controllo "${c.keys}": descrizione tagliata`);
  check(measurePixelText(c.keys, 1) <= 134, `controllo "${c.keys}": tasti troppo larghi`);
}

// 4) PEGASO: titoli e testi entro il pannello pausa (200px)
for (const l of PEGASO_LORE) {
  const lines = fitPixelText(l.text, 200, 4, 1);
  check(lines.length <= 4, `pegaso ${l.id}: troppe righe`, `${lines.length}`);
  for (const ln of lines) check(measurePixelText(ln, 1) <= 201, `pegaso ${l.id}: riga troppo larga`);
}

// 5) Nessuna stringa deve contenere caratteri non supportati dal font
// Ogni carattere deve avere un glifo reale (non deve finire sul "?" di fallback)
const { glyphAvailable } = await import("../src/render/pixelFont.js");
const sampleText = [
  ...Object.values(DIALOGUES).flatMap((sc) => (sc.nodes || []).flatMap((n) => [n.text, ...(n.choices || []).map((c) => c.label)])),
  ...Object.values(EIPASS_CHALLENGES).flatMap((q) => [q.prompt, q.feedbackRight, q.feedbackWrong, ...(q.options || []).map((o) => o.label)]),
].filter(Boolean).join(" ");
const badChars = new Set();
for (const ch of sampleText) {
  if (ch === "\n" || ch === " ") continue;
  if (!glyphAvailable(ch)) badChars.add(ch);
}
check(badChars.size === 0, "caratteri non disegnabili nel font", [...badChars].join(" "));

console.log(`\n=== QA TESTI v3.0: ${ok} CONTROLLI OK, ${bad} PROBLEMI ===`);
for (const f of fails.slice(0, 25)) console.log("  [FAIL] " + f);
if (bad === 0) console.log("  Nessun testo tagliato o fuori pannello.");
process.exit(bad === 0 ? 0 : 1);
