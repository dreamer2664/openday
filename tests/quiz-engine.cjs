const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('../scripts/quiz-engine.js');
const quizzesDir=path.join(__dirname,'../data/quizzes');
const key=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/human-ai-answer-key.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/asset-manifest.json'),'utf8'));
const manifestById=new Map(manifest.map(x=>[x.id,x]));
assert.equal(manifestById.size,manifest.length,'manifest asset IDs must be unique');
assert.equal(new Set(manifest.map(x=>x.localPath)).size,manifest.length,'manifest image paths must be unique');
for(const asset of manifest){
 assert.ok(asset.sourcePage&&asset.sourceUrl&&asset.creator&&asset.license&&asset.attribution,`incomplete provenance: ${asset.id}`);
 const filePath=path.resolve(__dirname,'../',asset.localPath);
 assert.ok(fs.existsSync(filePath),`asset file missing: ${asset.localPath}`);
 assert.equal(fs.statSync(filePath).size,asset.bytes,`stale byte count: ${asset.localPath}`);
 assert.ok(asset.width>0&&asset.height>0,`missing dimensions: ${asset.id}`);
}
const files=fs.readdirSync(quizzesDir).filter(x=>x.endsWith('.json'));
assert.equal(files.length,10,'there must be ten playable quiz datasets');
function seeded(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function choose(rng,list){return list[Math.floor(rng()*list.length)];}
function runNonbinary(quiz,forcedResult=null,rng=Math.random){
 const session=QuizEngine.createSession(quiz);
 const byId=new Map(quiz.questions.map(q=>[q.id,q]));
 while(!session.done){
  const q=byId.get(session.current);assert.ok(q,`missing node ${session.current}`);
  assert.ok(!session.seen.includes(q.id),`repeated node ${q.id}`);
  const wanted=forcedResult?.branchMatch?.[q.id];
  const style=forcedResult?.scoreStyle;
  const option=wanted?q.options.find(o=>o.id===wanted):(style?q.options.find(o=>o.id===style):choose(rng,q.options));
  assert.ok(option,`option missing at ${q.id}`);
  QuizEngine.answer(quiz,session,option.id);
 }
 return session;
}
function runPhoto(quiz,rng,forcedRoutes={}){
 const session=QuizEngine.createSession(quiz);const byId=new Map(quiz.questions.map(q=>[q.id,q]));
 while(!session.done){
  const q=byId.get(session.current);assert.ok(q);assert.ok(!session.seen.includes(q.id));
  const forced=forcedRoutes[q.id];let option,confidence,routeKey;
  if(forced){routeKey=forced;const [id,band]=forced.split('-');option=q.options.find(o=>o.id===id);confidence=band==='high'?3:1;}
  else{option=choose(rng,q.options);confidence=1+Math.floor(rng()*4);const band=confidence>=3?'high':'low';routeKey=`${option.id}-${band}`;}
  const correct=key[q.id].label===option.id;
  QuizEngine.answer(quiz,session,option.id,{routeKey,guess:option.id,confidence,correct});
 }
 return session;
}
const reports={};
function routeSignature(session,quiz){return session.answers.filter(a=>quiz.branchQuestions.includes(a.questionId)).map(a=>`${a.questionId}:${a.optionId}${quiz.binary?`-${a.confidence>=3?'high':'low'}`:''}`).join(' | ');}
for(const file of files){
 const randomResultDistribution={};const routeDistribution={};
 const quiz=JSON.parse(fs.readFileSync(path.join(quizzesDir,file),'utf8'));
 const issues=QuizEngine.validate(quiz);assert.deepEqual(issues,[],`${file}: ${issues.join('; ')}`);
 assert.equal(QuizEngine.reachable(quiz).size,16,`${file}: all sixteen nodes must be reachable`);
 for(const q of quiz.questions){
  if(!quiz.binary){assert.equal(q.options.length,6,`${file}/${q.id}: every dilemma needs six distinct responses`);assert.equal(new Set(q.options.map(o=>o.label)).size,6,`${file}/${q.id}: repeated response label`);assert.ok(q.tradeoff&&q.tradeoff.length>30,`${file}/${q.id}: missing dilemma trade-off`);assert.ok(q.options.every(o=>o.feedback&&o.feedback.length>40),`${file}/${q.id}: missing tailored reflection feedback`);if(quiz.branchQuestions.includes(q.id))assert.equal(new Set(q.options.map(o=>o.text)).size,6,`${file}/${q.id}: branch responses must be question-specific`);}
  assert.ok(q.image.sourceId&&manifestById.has(q.image.sourceId),`${file}/${q.id} question art absent from manifest`);
  assert.ok(fs.existsSync(path.resolve(__dirname,'../',q.image.src.replace(/^\.\.\//,''))),`${file}/${q.id} question file missing`);
  for(const option of q.options){
   assert.ok(option.image.sourceId&&manifestById.has(option.image.sourceId),`${file}/${q.id}/${option.id} option art absent from manifest`);
   assert.ok(fs.existsSync(path.resolve(__dirname,'../',option.image.src.replace(/^\.\.\//,''))),`${file}/${q.id}/${option.id} option image missing`);
  }
 }
 for(const r of quiz.results){assert.ok(manifestById.has(r.image.sourceId),`${file}/${r.id} result art absent from manifest`);assert.ok(fs.existsSync(path.resolve(__dirname,'../',r.image.src.replace(/^\.\.\//,''))));}
 const seenResults=new Set();let exhaustiveBranchCombinations=0;
 if(!quiz.binary){
  for(const result of quiz.results){
   const session=runNonbinary(quiz,result,()=>0.1);
   assert.equal(session.answers.length,8);assert.equal(new Set(session.seen).size,8);
   const picked=QuizEngine.pickResult(quiz,session).result;assert.equal(picked.id,result.id,`${file}: profile ${result.id} should be reachable`);seenResults.add(picked.id);
  }
  const branchOptions=['Q01','Q06','Q11'].map(id=>quiz.questions.find(q=>q.id===id).options.map(o=>o.id));
  for(const a of branchOptions[0])for(const b of branchOptions[1])for(const c of branchOptions[2]){
   const forced={branchMatch:{Q01:a,Q06:b,Q11:c}};const session=runNonbinary(quiz,forced,seeded(exhaustiveBranchCombinations+91));
   assert.equal(session.answers.length,8);assert.equal(new Set(session.seen).size,8);assert.equal(routeSignature(session,quiz),`Q01:${a} | Q06:${b} | Q11:${c}`);exhaustiveBranchCombinations++;
  }
  for(let i=0;i<500;i++){
   const session=runNonbinary(quiz,null,seeded(Math.imul(i+1,2654435761)>>>0));assert.equal(session.answers.length,8);assert.equal(new Set(session.seen).size,8);const result=QuizEngine.pickResult(quiz,session).result;assert.ok(result);randomResultDistribution[result.id]=(randomResultDistribution[result.id]||0)+1;const route=routeSignature(session,quiz);routeDistribution[route]=(routeDistribution[route]||0)+1;
  }
 }else{
  const branchRoutes=[['real-low','real-high','ai-low','ai-high'],['real-low','real-high','ai-low','ai-high'],['real-low','real-high','ai-low']];
  for(const a of branchRoutes[0])for(const b of branchRoutes[1])for(const c of branchRoutes[2]){
   const session=runPhoto(quiz,seeded(exhaustiveBranchCombinations+1001),{Q01:a,Q06:b,Q11:c});
   assert.equal(session.answers.length,8);assert.equal(new Set(session.seen).size,8);assert.equal(routeSignature(session,quiz),`Q01:${a} | Q06:${b} | Q11:${c}`);exhaustiveBranchCombinations++;
  }
  for(let i=0;i<20000;i++){
   const session=runPhoto(quiz,seeded(Math.imul(i+1,2654435761)>>>0));assert.equal(session.answers.length,8);assert.equal(new Set(session.seen).size,8);
   const count=session.answers.filter(a=>a.correct).length;
   const result=quiz.results.find(r=>r.exactCorrect===count);assert.ok(result);seenResults.add(result.id);randomResultDistribution[result.id]=(randomResultDistribution[result.id]||0)+1;const route=routeSignature(session,quiz);routeDistribution[route]=(routeDistribution[route]||0)+1;
  }
 }
 assert.equal(seenResults.size,quiz.results.length,`${file}: not all profiles/results reached`);
 reports[quiz.id]={nodes:quiz.questions.length,results:quiz.results.length,forcedResultReachability:quiz.results.map(r=>r.id),exhaustiveBranchCombinations,randomSimulations:quiz.binary?20000:500,randomResultDistribution,routeDistribution};
}
const report={date:new Date().toISOString().slice(0,10),description:'Simulazioni deterministiche ripetibili; i risultati sono conteggi di test sintetici, non stime di visitatori o validazione psicometrica.',quizzes:reports};
fs.writeFileSync(path.join(__dirname,'../docs/report-simulazioni.json'),JSON.stringify(report,null,2)+'\n');
console.log('PASS: dieci dataset, 16 nodi, sei risposte, trade-off e feedback riflessivo per le domande narrative, manifest completo, 8 domande e tutti i risultati raggiungibili.');
console.log(JSON.stringify(Object.fromEntries(Object.entries(reports).map(([slug,r])=>[slug,{results:r.results,randomSimulations:r.randomSimulations,distinctRoutes:Object.keys(r.routeDistribution).length}])),null,2));
