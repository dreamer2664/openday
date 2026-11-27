(function(){
  'use strict';
  const root=document.querySelector('[data-quiz]');
  const app=document.getElementById('quiz-app');
  if(!root||!app||!window.QuizEngine)return;
  const slug=root.dataset.quiz;
  const text=(tag,value,cls)=>{const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=value||'';return el;};
  const link=(href,label,cls)=>{const a=document.createElement('a');a.href=href;a.textContent=label;if(cls)a.className=cls;return a;};
  const image=(item,cls)=>{const img=document.createElement('img');img.src=item.src;img.alt=item.alt||'';img.className=cls||'';img.loading='eager';return img;};
  const shuffled=items=>{const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;};
  const button=(label,cls,onClick)=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.addEventListener('click',onClick);return b;};
  let quiz,session,answerKey=null,pending=null,selectedChoice=null,selectedConfidence=null;
  function shell(){app.replaceChildren();}
  async function loadKey(){
    if(answerKey)return answerKey;
    const response=await fetch('../data/human-ai-answer-key.json',{cache:'no-store'});
    if(!response.ok)throw new Error('Archivio delle fonti non raggiungibile.');
    answerKey=await response.json();return answerKey;
  }
  function showStart(){
    shell();const panel=document.createElement('section');panel.className='quiz-panel start-panel';panel.setAttribute('aria-labelledby','quiz-title');
    const eyebrow=text('p',quiz.category,'quiz-eyebrow');const h=text('h1',quiz.title);h.id='quiz-title';
    panel.append(eyebrow,h,text('p',quiz.intro,'quiz-intro'));
    if(quiz.binary){const notice=document.createElement('aside');notice.className='disclosure';notice.setAttribute('aria-label','Informazione sulle immagini');notice.append(text('strong','Prima di iniziare: '),document.createTextNode('questa prova include fotografie e immagini sintetiche. Non indicheremo la provenienza della singola immagine durante la domanda; la sveleremo dopo la tua risposta. Ogni immagine sintetica sarà attribuita nel feedback.'));panel.append(notice);}
    const safety=text('p',quiz.binary?'Il risultato descrive questa sessione e il campione selezionato; non certifica che una fotografia o un’immagine sia autentica.':'Il risultato è un gioco narrativo, non una diagnosi, una valutazione psicologica o un verdetto di orientamento.','small-note');panel.append(safety);
    const start=button('INIZIA · 8 DOMANDE','arcade-button primary',()=>{session=QuizEngine.createSession(quiz);showQuestion();});panel.append(start);
    panel.append(link('../index.html#giochi','← Torna alla sala giochi','back-link'));
    app.append(panel);
  }
  function progress(reflection=false){
    const wrap=document.createElement('div');wrap.className='progress-wrap';
    const p=document.createElement('progress');p.max=quiz.sessionLength;p.value=session.answers.length;p.setAttribute('aria-label',`Avanzamento: ${session.answers.length} di ${quiz.sessionLength} domande`);
    const steps=document.createElement('div');steps.className='progress-steps';steps.setAttribute('aria-hidden','true');
    for(let i=0;i<quiz.sessionLength;i++){const step=document.createElement('span');if(i<session.answers.length)step.className='is-complete';else if(!reflection&&i===session.answers.length)step.className='is-current';steps.append(step);}
    const number=reflection?Math.max(1,session.answers.length):Math.min(session.answers.length+1,quiz.sessionLength);
    wrap.append(p,steps,text('span',`${reflection?'RIFLESSIONE':'DOMANDA'} ${String(number).padStart(2,'0')} / ${String(quiz.sessionLength).padStart(2,'0')}`,'progress-label'));return wrap;
  }
  function renderBinary(q,content){
    const fs=document.createElement('fieldset');fs.className='binary-choices';const legend=text('legend','Scegli la tua risposta');fs.append(legend);
    shuffled(q.options).forEach(opt=>{
      const label=document.createElement('label');label.className='binary-choice';
      const input=document.createElement('input');input.type='radio';input.name='answer';input.value=opt.id;input.addEventListener('change',()=>{selectedChoice=opt.id;updateSubmit();});
      label.append(input,image(opt.image,'choice-image'),text('span',opt.label,'choice-title'),text('small',opt.text,'choice-description'));fs.append(label);
    });content.append(fs);
    const confidence=document.createElement('fieldset');confidence.className='confidence';confidence.append(text('legend','Quanto ne sei sicuro?'));
    const scale=document.createElement('div');scale.className='confidence-scale';
    ['Vado a intuito','Poco','Abbastanza','Molto'].forEach((label,i)=>{
      const b=button(`${i+1} · ${label}`,'confidence-button',()=>{selectedConfidence=i+1;scale.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');updateSubmit();});b.setAttribute('aria-pressed','false');scale.append(b);
    });confidence.append(scale);content.append(confidence);
    const submit=button('CONFERMA E SCOPRI','arcade-button primary',()=>submitBinary(q,submit));submit.disabled=true;submit.id='binary-submit';content.append(submit);
  }
  function updateSubmit(){const b=document.getElementById('binary-submit');if(b)b.disabled=!(selectedChoice&&selectedConfidence);}
  async function submitBinary(q,submit){
    if(!selectedChoice||!selectedConfidence||submit.disabled)return;
    submit.disabled=true;submit.textContent='VERIFICO…';
    try{
      const key=await loadKey();const correct=key[q.id];if(!correct)throw new Error('Fonte dell’immagine non trovata.');
      const isCorrect=correct.label===selectedChoice;
      pending={correct,isCorrect,guess:selectedChoice,confidence:selectedConfidence};
      const band=selectedConfidence>=3?'high':'low';
      QuizEngine.answer(quiz,session,selectedChoice,{routeKey:`${selectedChoice}-${band}`,guess:selectedChoice,confidence:selectedConfidence,correct:isCorrect});
      showPhotoFeedback(q,pending);
    }catch(error){submit.disabled=false;submit.textContent='RIPROVA';const err=text('p',error.message,'inline-error');submit.after(err);}
  }
  function showPhotoFeedback(q,result){
    shell();const panel=document.createElement('section');panel.className='quiz-panel feedback-panel';panel.setAttribute('aria-labelledby','feedback-title');
    panel.append(progress(true),text('p','RISPOSTA REGISTRATA','quiz-eyebrow'));
    const h=text('h2',result.isCorrect?'Hai indovinato':'Questa volta no');h.id='feedback-title';panel.append(h);
    const correctLabel=result.correct.label==='ai'?'Immagine generata dall’AI':'Fotografia';panel.append(text('p',`La classificazione verificata è: ${correctLabel}. Hai indicato ${result.guess==='ai'?'AI':'fotografia'} con confidenza ${result.confidence} su 4.`,'feedback-copy'));
    panel.append(image(q.image,'feedback-photo'));
    const attribution=text('p',result.correct.attribution,'attribution');panel.append(attribution);
    const src=link(result.correct.sourcePage,'Apri la fonte e la licenza ↗','source-link');src.target='_blank';src.rel='noreferrer noopener';panel.append(src);
    if(result.correct.generator)panel.append(text('p',`Modello dichiarato nel dataset: ${result.correct.generator}.`,'source-detail'));
    const feedbackActions=document.createElement('div');feedbackActions.className='result-actions';feedbackActions.append(button(session.answers.length>=quiz.sessionLength?'VEDI IL RISULTATO':'PROSSIMA IMMAGINE →','arcade-button primary',()=>{pending=null;selectedChoice=null;selectedConfidence=null;if(session.done)showResult();else showQuestion();}),button('AZZERA E RICOMINCIA','arcade-button secondary',resetSession),link('../index.html#giochi','SALA GIOCHI','back-link'));panel.append(feedbackActions);
    app.append(panel);
  }
  function showChoiceFeedback(q,option,move){
    shell();const panel=document.createElement('section');panel.className='quiz-panel choice-feedback-panel';panel.setAttribute('aria-labelledby','choice-feedback-title');
    panel.append(progress(true),text('p','SCELTA REGISTRATA · RIFLESSIONE','quiz-eyebrow'));
    const h=text('h2',option.label,'question-prompt');h.id='choice-feedback-title';panel.append(h);
    panel.append(text('p',option.text,'feedback-copy'));
    const reflection=document.createElement('aside');reflection.className='decision-lens response-reflection';reflection.setAttribute('aria-label','Riflessione sulla scelta');reflection.append(text('strong','COSA METTE AL CENTRO'),text('p',option.feedback||'La tua scelta contribuisce al profilo insieme agli altri tratti e alle decisioni successive.'));panel.append(reflection);
    panel.append(text('p',`Tratti influenzati: ${Object.keys(option.scores||{}).join(' · ')}.`,'small-note'));
    if(q.tradeoff)panel.append(text('p',`Vincolo del dilemma: ${q.tradeoff}`,'small-note'));
    const nextQuestion=move.next&&quiz.questions.find(item=>item.id===move.next);
    if(nextQuestion){const route=document.createElement('aside');route.className='route-preview';route.append(text('strong','PROSSIMA TAPPA'),text('p',nextQuestion.prompt));panel.append(route);}
    const actions=document.createElement('div');actions.className='result-actions';actions.append(button(move.done?'VEDI IL RISULTATO':'PROSSIMA DOMANDA →','arcade-button primary',()=>{if(move.done)showResult();else showQuestion();}),button('AZZERA E RICOMINCIA','arcade-button secondary',resetSession),link('../index.html#giochi','SALA GIOCHI','back-link'));panel.append(actions);app.append(panel);
  }
  function showQuestion(){
    shell();selectedChoice=null;selectedConfidence=null;
    const q=quiz.questions.find(x=>x.id===session.current);if(!q){showFatal('Percorso domanda non trovato.');return;}
    const panel=document.createElement('section');panel.className='quiz-panel question-panel';panel.append(progress());
    if(quiz.binary){
      const h=text('h2',q.prompt,'question-prompt');h.id='question-title';panel.append(text('p','OSSERVA · FORMULA UN’IPOTESI','quiz-eyebrow'),h);
      const stage=document.createElement('div');stage.className='question-stage binary-stage';stage.append(image(q.image,'question-image'));stage.firstChild.setAttribute('alt','Immagine-test. La fonte non viene mostrata prima della risposta.');panel.append(stage);renderBinary(q,panel);
    }else{
      const board=document.createElement('div');board.className='scenario-board';
      const copy=document.createElement('div');copy.className='scenario-copy';copy.append(text('p','SCENARIO · DECISIONE','quiz-eyebrow'));
      const h=text('h2',q.prompt,'question-prompt');h.id='question-title';copy.append(h);
      const lens=document.createElement('aside');lens.className='decision-lens';lens.id=`${q.id}-tradeoff`;lens.setAttribute('aria-label','Vincolo e posta in gioco');lens.append(text('strong','IL VINCOLO'),text('p',q.tradeoff));copy.append(lens);
      const stage=document.createElement('div');stage.className='question-stage scenario-stage';stage.append(image(q.image,'question-image'));
      board.append(copy,stage);panel.append(board);
      const choiceIntro=document.createElement('div');choiceIntro.className='choice-intro';choiceIntro.append(text('p','SEI APPROCCI · NESSUNA RISPOSTA AUTOMATICA','quiz-eyebrow'));
      const choiceTitle=text('h3','Qual è la tua prima mossa?','choice-prompt');choiceTitle.id='choices-title';choiceIntro.append(choiceTitle,text('p','Scegli l’azione che faresti per prima; potrai rivedere il ragionamento dopo la scelta.','choice-hint'));panel.append(choiceIntro);
      const choices=document.createElement('div');choices.className='answer-grid';choices.setAttribute('role','group');choices.setAttribute('aria-labelledby','choices-title');choices.setAttribute('aria-describedby',`${q.id}-tradeoff`);
      shuffled(q.options).forEach((opt,index)=>{const b=document.createElement('button');b.type='button';b.className='answer-option';b.append(text('span',String(index+1).padStart(2,'0'),'choice-order'),image(opt.image,'choice-image'),text('span',opt.label,'choice-title'),text('span',opt.text,'choice-description'));b.addEventListener('click',()=>{const move=QuizEngine.answer(quiz,session,opt.id);showChoiceFeedback(q,opt,move);});choices.append(b);});panel.append(choices);
    }
    const actions=document.createElement('div');actions.className='result-actions question-actions';actions.append(button('AZZERA E RICOMINCIA','arcade-button secondary',resetSession),link('../index.html#giochi','ESCI · Torna alla sala giochi','back-link'));panel.append(actions);app.append(panel);
  }
  function showResult(){
    shell();let result,ranked;
    if(quiz.binary){const correct=session.answers.filter(x=>x.correct).length;result=quiz.results.find(x=>x.exactCorrect===correct)||quiz.results[0];ranked=[];}
    else{const picked=QuizEngine.pickResult(quiz,session);result=picked.result;ranked=picked.ranked;}
    if(!result){showFatal('Non è stato possibile calcolare il risultato.');return;}
    const panel=document.createElement('section');panel.className='quiz-panel result-panel';panel.setAttribute('aria-labelledby','result-title');
    panel.append(text('p','FINE LIVELLO · RISULTATO','quiz-eyebrow'));
    const h=text('h1',result.title);h.id='result-title';panel.append(h,image(result.image,'result-image'),text('p',result.summary,'result-summary'));
    if(quiz.binary){
      const correct=session.answers.filter(x=>x.correct).length;const meanConfidence=session.answers.reduce((sum,a)=>sum+a.confidence,0)/session.answers.length;
      const confidenceProb={1:0.55,2:0.70,3:0.85,4:0.95};
      const calibration=session.answers.reduce((sum,a)=>sum+Math.abs(confidenceProb[a.confidence]-(a.correct?1:0)),0)/session.answers.length;
      const card=document.createElement('div');card.className='score-card';card.append(text('strong',`${correct} / ${session.answers.length} corrette`),text('span',`Confidenza media dichiarata: ${meanConfidence.toFixed(1)} / 4.`),text('span',`Scarto medio fra confidenza dichiarata e risposte corrette: ${(calibration*100).toFixed(0)} punti percentuali. Otto immagini sono un campione piccolo: non è una misura stabile.`));
      const categories={AI:0,fotografie:0};const grouped={};session.answers.forEach(a=>{const qkey=(answerKey||{})[a.questionId];if(qkey){categories[qkey.label==='ai'?'AI':'fotografie']++;grouped[qkey.category]??={n:0,correct:0};grouped[qkey.category].n++;grouped[qkey.category].correct+=a.correct?1:0;}});card.append(text('span',`Campione: ${categories.fotografie} fotografie · ${categories.AI} immagini sintetiche.`));
      Object.entries(grouped).forEach(([name,value])=>card.append(text('span',`${name}: ${value.correct}/${value.n} corrette.`)));panel.append(card);
    }else{
      const traits=document.createElement('div');traits.className='trait-list';traits.append(text('h2','Tratti emersi dalle tue risposte'));ranked.slice(0,3).forEach((item,i)=>{const row=document.createElement('div');row.className='trait-row';row.append(text('span',`${i+1}. ${item.dimension}`),text('span',item.score.toFixed(1),'trait-score'));traits.append(row);});panel.append(traits);
      const styleCounts={};session.answers.forEach(answer=>{styleCounts[answer.optionId]=(styleCounts[answer.optionId]||0)+1;});
      const frequent=Object.entries(styleCounts).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([id,count])=>{const option=quiz.questions.flatMap(question=>question.options).find(item=>item.id===id);return `${option?.label||id} (${count})`;});
      panel.append(text('p',`Stili ricorrenti: ${frequent.join(' · ')}. Il risultato combina questi pattern, i tratti accumulati e le scelte di percorso.`,'small-note'));
      panel.append(text('p',result.strength,'result-detail'),text('p',`Tensione da tenere a mente: ${result.tension}`,'result-detail'),text('p',result.nudge,'result-nudge'));
      panel.append(text('p',`Snodi del percorso: ${session.answers.filter(a=>quiz.branchQuestions.includes(a.questionId)).map(a=>`${a.questionId} → ${a.optionId}`).join(' · ')}.`,'small-note'));
    }
    const sources=document.createElement('details');sources.className='result-sources';sources.append(text('summary','Fonti e note'));const ul=document.createElement('ul');(result.sources||[]).forEach(source=>ul.append(text('li',source)));sources.append(ul);if((result.sourceLinks||[]).length){const links=document.createElement('ul');result.sourceLinks.forEach(item=>{const li=document.createElement('li');const a=link(item.url,`${item.label} ↗`);a.target='_blank';a.rel='noopener noreferrer';li.append(a);links.append(li);});sources.append(links);}panel.append(sources);
    const actions=document.createElement('div');actions.className='result-actions';actions.append(button('RIPROVA · NUOVA SESSIONE','arcade-button primary',()=>{session=null;showStart();}),link('../index.html#giochi','SALA GIOCHI','arcade-button secondary'));panel.append(actions);
    app.append(panel);
  }
  function resetSession(){session=null;pending=null;selectedChoice=null;selectedConfidence=null;showStart();}
  function showFatal(message){shell();const p=document.createElement('section');p.className='quiz-panel';p.append(text('h1','Ops, qualcosa non va'),text('p',message),link('../index.html#giochi','Torna alla sala giochi','back-link'));app.append(p);}
  fetch(`../data/quizzes/${encodeURIComponent(slug)}.json`).then(r=>{if(!r.ok)throw new Error('Dati quiz non disponibili.');return r.json();}).then(data=>{quiz=data;const issues=QuizEngine.validate(quiz);if(issues.length)throw new Error(issues.join(' · '));showStart();}).catch(err=>showFatal(err.message));
})();
