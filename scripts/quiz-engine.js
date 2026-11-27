/* Motore locale dei quiz: validazione dei grafi, sessioni e punteggio multidimensionale. */
(function (root) {
  'use strict';
  const STANDARD_LENGTH = 8;
  const targetsOf = option => [...new Set([option.next, ...Object.values(option.nextBy || {})].filter(Boolean))];
  function validate(quiz) {
    const issues = [];
    if (!quiz || !quiz.id || !Array.isArray(quiz.questions)) return ['Dataset quiz mancante o malformato.'];
    const byId = new Map(quiz.questions.map(q => [q.id, q]));
    if (byId.size !== quiz.questions.length) issues.push('ID domanda duplicati.');
    if (!byId.has(quiz.startQuestion)) issues.push('Domanda iniziale inesistente.');
    const results = new Set((quiz.results || []).map(r => r.id));
    if (results.size < (quiz.minimumResults || 8)) issues.push(`Servono almeno ${quiz.minimumResults || 8} risultati unici.`);
    const imagePaths = new Map();
    const addImage = (image, owner) => {
      if (!image || !image.src) { issues.push(`${owner}: immagine assente.`); return; }
      if (imagePaths.has(image.src)) issues.push(`Immagine ripetuta: ${image.src} (${owner}; già usata da ${imagePaths.get(image.src)}).`);
      else imagePaths.set(image.src, owner);
      if (!image.sourceId) issues.push(`${owner}: manca l'ID del manifest asset.`);
    };
    for (const q of quiz.questions) {
      if (!q.id || !q.prompt) issues.push(`Domanda senza ID o testo: ${q.id || '(sconosciuta)'}`);
      addImage(q.image, `Domanda ${q.id}`);
      const minimumOptions = q.minimumOptions || (quiz.binary ? 2 : 4);
      if (!Array.isArray(q.options) || q.options.length < minimumOptions) issues.push(`${q.id}: numero opzioni insufficiente.`);
      for (const [i, o] of (q.options || []).entries()) {
        if (!o.id || !o.label || !o.text) issues.push(`${q.id}: opzione ${i + 1} incompleta.`);
        addImage(o.image, `Opzione ${q.id}/${o.id || i + 1}`);
        const targets = targetsOf(o);
        if (!q.terminal && targets.length === 0) issues.push(`${q.id}/${o.id}: arco di continuazione assente.`);
        for (const target of targets) if (!byId.has(target)) issues.push(`${q.id}: arco verso domanda inesistente (${target}).`);
        if (!quiz.binary && (!o.scores || Object.keys(o.scores).length < 2)) issues.push(`${q.id}/${o.id}: deve influire su almeno due dimensioni.`);
      }
      if (quiz.binary && q.confidenceRequired && !q.options.every(o => o.next || Object.keys(o.nextBy || {}).length || q.terminal)) issues.push(`${q.id}: routing confidenza non definito.`);
    }
    for (const r of quiz.results || []) {
      if (!r.id || !r.title || !r.summary || !r.nudge) issues.push(`Risultato ${r.id || '(senza ID)'}: scheda incompleta.`);
      addImage(r.image, `Risultato ${r.id}`);
    }
    if (quiz.sessionLength !== STANDARD_LENGTH) issues.push('La sessione standard deve contenere 8 domande.');
    if (byId.has(quiz.startQuestion)) {
      const seen = new Set();
      const terminalDepths = [];
      let foundCycles = false;
      const visit = (id, path) => {
        if (path.includes(id)) { foundCycles = true; issues.push(`Ciclo nel grafo: ${[...path, id].join(' → ')}.`); return; }
        if (path.length >= quiz.sessionLength) { issues.push(`Percorso oltre ${quiz.sessionLength} domande.`); return; }
        const q = byId.get(id); if (!q) return;
        seen.add(id);
        const targets = [...new Set((q.options || []).flatMap(targetsOf))];
        if (q.terminal || targets.length === 0) { terminalDepths.push(path.length + 1); return; }
        for (const target of targets) visit(target, [...path,id]);
      };
      visit(quiz.startQuestion, []);
      for (const depth of terminalDepths) if (depth !== quiz.sessionLength) issues.push(`Percorso terminale di ${depth} domande; attese ${quiz.sessionLength}.`);
      for (const id of byId.keys()) if (!seen.has(id)) issues.push(`Nodo irraggiungibile: ${id}.`);
      const branches = [...byId.values()].filter(q => new Set((q.options || []).flatMap(targetsOf)).size > 1);
      if (branches.length < 3) issues.push('Il grafo deve avere almeno tre punti di diramazione.');
    }
    for (const r of quiz.results || []) for (const [qid,oid] of Object.entries(r.branchMatch || {})) {
      const q=byId.get(qid); if (!q || !q.options.some(o=>o.id===oid)) issues.push(`Risultato ${r.id}: regola ramo non valida (${qid}/${oid}).`);
    }
    return [...new Set(issues)];
  }
  function reachable(quiz) {
    const byId=new Map(quiz.questions.map(q=>[q.id,q])); const seen=new Set();
    const walk=(id,path=[])=>{if(!id||path.includes(id))return;seen.add(id);const q=byId.get(id);if(!q||q.terminal)return;for(const o of q.options||[])for(const t of targetsOf(o))walk(t,[...path,id]);};
    walk(quiz.startQuestion); return seen;
  }
  function createSession(quiz) {
    const problems=validate(quiz); if(problems.length) throw new Error(`Quiz non valido:\n- ${problems.join('\n- ')}`);
    return {quizId:quiz.id,current:quiz.startQuestion,seen:[],answers:[],scores:Object.fromEntries((quiz.dimensions||[]).map(d=>[d,0])),done:false};
  }
  function answer(quiz,session,optionId,extra={}) {
    if(session.done)throw new Error('Sessione già terminata.');
    const q=quiz.questions.find(x=>x.id===session.current);const option=q&&q.options.find(x=>x.id===optionId);
    if(!option)throw new Error('Risposta non valida per la domanda corrente.');
    session.seen.push(q.id); session.answers.push({questionId:q.id,optionId,...extra});
    for(const [dimension,value] of Object.entries(option.scores||{}))session.scores[dimension]=(session.scores[dimension]||0)+value;
    const next=(extra.routeKey&&option.nextBy&&option.nextBy[extra.routeKey])||option.next||null;
    if(next&&session.seen.includes(next))throw new Error(`Rilevato ciclo durante la sessione: ${next}.`);
    if(!q.terminal&&!next)throw new Error('Percorso della sessione non definito.');
    session.done=Boolean(q.terminal||!next||session.answers.length>=(quiz.sessionLength||STANDARD_LENGTH));
    if(!session.done)session.current=next;
    return {done:session.done,questionId:q.id,optionId,next:session.done?null:next};
  }
  function rankedScores(session) {
    const n=Math.max(1,session.answers.length);
    return Object.entries(session.scores).map(([dimension,score])=>({dimension,score:score/n})).sort((a,b)=>b.score-a.score);
  }
  function pickResult(quiz,session) {
    const ranked=rankedScores(session);
    const answerMap=new Map(session.answers.map(a=>[a.questionId,a.optionId]));
    const resultScore=result=>{
      const branchPoints=Object.entries(result.branchMatch||{}).reduce((sum,[qid,oid])=>sum+(answerMap.get(qid)===oid?1:0),0);
      const dimensionPoints=(result.match||[]).reduce((sum,d,index)=>sum+((session.scores[d]||0)/(index+1)),0);
      const approachPoints=result.scoreStyle?session.answers.filter(answer=>answer.optionId===result.scoreStyle).length:0;
      return {branchPoints,dimensionPoints,approachPoints,total:dimensionPoints+approachPoints*1.5};
    };
    const sorted=[...(quiz.results||[])].sort((a,b)=>{const x=resultScore(a),y=resultScore(b);return y.total-x.total||y.branchPoints-x.branchPoints||y.dimensionPoints-x.dimensionPoints;});
    return {result:sorted[0]||null,ranked};
  }
  root.QuizEngine={STANDARD_LENGTH,validate,reachable,createSession,answer,rankedScores,pickResult};
})(typeof window!=='undefined'?window:globalThis);
