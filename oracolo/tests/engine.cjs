/* Test del motore senza dipendenze: node tests/engine.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/responsi.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(source + '\nthis.engine = OracoloMotore; this.answers = ORACOLO_RESPONSI; this.safety = ORACOLO_SAFETY_RESPONSE;', context);
const { engine, answers } = context;
const results = [];
function test(name, callback) {
  callback(); results.push({ test: name, status: 'PASS' }); console.log('PASS', name);
}

test('50 responsi distinti, verificati e non vuoti', () => {
  assert.equal(answers.length, 50);
  assert.equal(new Set(answers).size, 50);
  assert.ok(answers.every(answer => typeof answer === 'string' && answer.length > 10 && answer.length < 100));
});

test('10.000 estrazioni: equilibrio esatto e nessuna ripetizione nelle ultime 8', () => {
  const recent = [];
  const distribution = [0, 0, 0, 0, 0];
  const seen = new Set();
  let block = [];
  for (let i = 0; i < 10000; i++) {
    const answer = engine.estrai();
    const index = answers.indexOf(answer);
    assert.ok(index >= 0, 'Il responso deve appartenere all’archivio');
    assert.ok(!recent.includes(answer), 'Ripetizione troppo ravvicinata');
    recent.push(answer); if (recent.length > 8) recent.shift();
    const family = Math.floor(index / 10);
    distribution[family]++;
    block.push(family);
    seen.add(answer);
    if (block.length === 5) { assert.equal(new Set(block).size, 5); block = []; }
  }
  assert.deepEqual(distribution, [2000, 2000, 2000, 2000, 2000]);
  assert.equal(seen.size, 50);
});

test('Selezione robusta anche agli estremi del generatore casuale', () => {
  for (const random of [0, 0.999999999]) {
    const customMath = Object.create(Math);
    customMath.random = () => random;
    const sandbox = vm.createContext({ Math: customMath });
    vm.runInContext(source + '\nthis.engine = OracoloMotore;', sandbox);
    const recent = [];
    for (let i = 0; i < 500; i++) {
      const answer = sandbox.engine.estrai();
      assert.ok(answers.includes(answer));
      assert.ok(!recent.includes(answer));
      recent.push(answer); if (recent.length > 8) recent.shift();
    }
  }
});

test('Termini espliciti di emergenza e scelte mediche attivano la risposta fissa', () => {
  const delicate = [
    'Devo chiamare il 112?', 'È un infarto?', 'Non riesco a respirare, aspetto?',
    'Ho una emorragia', 'Dovrei prendere altri farmaci?', 'Smetto la terapia?',
    'Devo aumentare la dose?', 'Sospendere la cura è una buona idea?',
    'Devo prendere questa insulina?', 'Dovrei farmi del male?',
    'Voglio suicidarmi', 'Sto pensando di farla finita', 'Dovrei tagliarmi?',
    'Cosa fare per un over-dose?', 'Chiedo aiuto per la violenza?',
    'Devo prendere questi FÁRMACI?', 'Devo andare al pronto   soccorso?'
  ];
  for (const question of delicate) assert.equal(engine.domandaDelicata(question), true, question);
  assert.match(context.safety, /persona competente/);
});

test('Le normali domande non attivano il controllo locale', () => {
  const ordinary = [
    'Dovrei provarci?', 'Riuscirò a superare l’esame?', 'Troverò quello che cerco?',
    'Mi conviene partire?', 'Dovrei fidarmi?', 'Andrà bene domani?',
    'Dovrei tagliarmi i capelli?', 'Dovrei studiare medicina?',
    'Dovrei tagliarmi le unghie?', 'Dovrei parlargli?', 'È il momento giusto?'
  ];
  for (const question of ordinary) assert.equal(engine.domandaDelicata(question), false, question);
});

if (process.env.TEST_REPORT) {
  fs.writeFileSync(process.env.TEST_REPORT, JSON.stringify({ suite: 'engine', runtime: process.version, results }, null, 2));
}
console.log(`\n${results.length}/${results.length} gruppi di test superati.`);
