/* VENTO SUL PARNASO — composizione originale, 78 BPM, 16 battute.
 * Lira a due voci, arpeggi, basso morbido e un pad tenuto.
 * Gli effetti sonori restano sul proprio bus e non cambiano.
 * Solo Web Audio: nessun file audio, campione esterno o richiesta di rete. */
'use strict';

const OracoloAudio = (() => {
  const TEMPO=78;
  const BEAT=60/TEMPO;
  const STEP=BEAT/4;
  const LOOP_STEPS=256;
  const MUSIC_LEVEL=.70;
  const FX_LEVEL=.65;
  const PROGRESSION=[
    {root:38,notes:[53,57,60,64]}, // Dm9
    {root:34,notes:[50,53,57,60]}, // Bbmaj9
    {root:41,notes:[52,57,60,67]}, // Fmaj9
    {root:36,notes:[52,55,62,67]}, // Cadd9
    {root:38,notes:[53,57,60,64]},
    {root:34,notes:[50,53,57,60]},
    {root:41,notes:[52,57,60,67]},
    {root:33,notes:[55,59,62,64]}  // A sospeso, ritorno morbido a Dm
  ];
  const MELODY=[
    [[0,69,1.25],[6,72,1.05],[12,74,1.55]],
    [[2,77,1.7],[10,74,1.35]],
    [[0,72,1.15],[6,69,1.05],[12,67,1.6]],
    [[4,65,2.1],[14,69,.85]],
    [[0,69,1.05],[5,72,.9],[10,76,1.65]],
    [[2,74,1.45],[10,72,1.5]],
    [[0,67,1.45],[8,65,1.85]],
    [[4,62,2.15],[14,65,.75]],
    [[0,69,1.15],[6,74,1.05],[11,77,1.7]],
    [[2,76,1.45],[9,74,1.15],[14,72,1.05]],
    [[2,69,1.4],[8,72,1.55]],
    [[4,67,1.75],[12,65,1.25]],
    [[0,72,1.15],[6,76,1.45],[12,74,1.2]],
    [[2,69,1.65],[10,67,1.4]],
    [[0,65,1.5],[8,64,1.7]],
    [[2,62,1.9],[12,69,1.45]]
  ];
  const COUNTER=[
    [[8,62,1.4]],
    [[4,65,1.5]],
    [[8,60,1.6]],
    [[6,57,1.8]],
    [[0,65,1.3],[8,62,1.4]],
    [[4,60,1.6]],
    [[2,64,1.3],[10,60,1.5]],
    [[6,57,2]],
    [[0,65,1.2],[8,69,1.5]],
    [[4,67,1.4],[12,65,1.2]],
    [[2,64,1.5],[10,60,1.4]],
    [[6,62,1.6]],
    [[0,67,1.3],[8,64,1.5]],
    [[4,60,1.6]],
    [[2,57,1.7]],
    [[8,62,1.8]]
  ];
  let graph=null;
  let effectsEnabled=false;
  let musicEnabled=false;
  let volume=.45;
  let ducked=false;
  let effectsRevision=0;
  let musicRevision=0;
  let timer=null;
  let idleTimer=null;
  let stepIndex=0;
  let nextAt=0;
  let scheduledSteps=0;

  const hz=midi=>440*Math.pow(2,(midi-69)/12);
  const random=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

  function ramp(param,target,at,duration=.12) {
    if(typeof param.cancelAndHoldAtTime==='function')param.cancelAndHoldAtTime(at);
    else {const current=param.value;param.cancelScheduledValues(at);param.setValueAtTime(current,at);}
    param.linearRampToValueAtTime(target,at+duration);
  }

  function impulse(context,seconds,seed) {
    const length=Math.ceil(context.sampleRate*seconds);
    const buffer=context.createBuffer(2,length,context.sampleRate);
    const rand=random(seed);
    for(let channel=0;channel<2;channel++){
      const samples=buffer.getChannelData(channel);
      let smooth=0;
      for(let i=0;i<length;i++){
        smooth=smooth*.36+(rand()*2-1)*.64;
        const t=i/length;
        samples[i]=i<context.sampleRate*.018?0:smooth*Math.pow(1-t,3.6)*(.8+.2*Math.sin(i*.00019+channel));
      }
    }
    return buffer;
  }

  function makeBus(context,destination,seconds,delayTime,seed) {
    const input=context.createGain();
    const dry=context.createGain();dry.gain.value=.86;
    const output=context.createGain();output.gain.value=0;
    const duck=context.createGain();duck.gain.value=1;
    input.connect(dry);dry.connect(output);
    const send=context.createGain();send.gain.value=.23;
    const reverb=context.createConvolver();reverb.buffer=impulse(context,seconds,seed);
    const wet=context.createGain();wet.gain.value=.33;
    input.connect(send);send.connect(reverb);reverb.connect(wet);wet.connect(output);
    const delaySend=context.createGain();delaySend.gain.value=.14;
    const delay=context.createDelay(2);delay.delayTime.value=delayTime;
    const feedback=context.createGain();feedback.gain.value=.23;
    const damp=context.createBiquadFilter();damp.type='lowpass';damp.frequency.value=2200;damp.Q.value=.4;
    const delayReturn=context.createGain();delayReturn.gain.value=.35;
    const delayPan=context.createStereoPanner();delayPan.pan.value=.28;
    input.connect(delaySend);delaySend.connect(delay);delay.connect(damp);damp.connect(feedback);feedback.connect(delay);
    delay.connect(delayReturn);delayReturn.connect(delayPan);delayPan.connect(output);
    output.connect(duck);duck.connect(destination);
    return {input,output,duck,voices:new Set()};
  }

  function createGraph(context,initialVolume) {
    const master=context.createGain();master.gain.value=initialVolume;
    const compressor=context.createDynamicsCompressor();
    compressor.threshold.value=-12;compressor.knee.value=14;compressor.ratio.value=2.4;
    compressor.attack.value=.008;compressor.release.value=.28;
    const makeup=context.createGain();makeup.gain.value=2.4;
    compressor.connect(makeup);makeup.connect(master);master.connect(context.destination);
    const noise=context.createBuffer(1,context.sampleRate,context.sampleRate);
    const samples=noise.getChannelData(0),rand=random(84621);
    let smooth=0;
    for(let i=0;i<samples.length;i++){smooth=.4*smooth+.6*(rand()*2-1);samples[i]=smooth;}
    return {
      context,master,compressor,noise,
      music:makeBus(context,compressor,2.5,BEAT*.75,3514),
      fx:makeBus(context,compressor,1.5,.18,9147),
      notesScheduled:0
    };
  }

  function trackVoice(bus,sources,nodes) {
    const voice={sources,nodes};
    let remaining=sources.length;
    bus.voices.add(voice);
    sources.forEach(source=>{
      source.onended=()=>{
        remaining--;
        if(remaining===0){
          bus.voices.delete(voice);
          [...sources,...nodes].forEach(node=>{try{node.disconnect();}catch(_){/* già scollegato */}});
        }
      };
    });
  }

  function stopVoices(bus,at) {
    bus.voices.forEach(voice=>voice.sources.forEach(source=>{try{source.stop(at);}catch(_){/* sorgente conclusa */}}));
  }

  function note(engine,bus,midi,at,duration,level,kind='pluck',pan=0) {
    const context=engine.context;
    const filter=context.createBiquadFilter();filter.type='lowpass';filter.Q.value=.45;
    const envelope=context.createGain();envelope.gain.value=0;
    const position=context.createStereoPanner();position.pan.value=Math.max(-.8,Math.min(.8,pan));
    filter.connect(envelope);envelope.connect(position);position.connect(bus.input);
    let partials,attack,tail,cutoff;
    if(kind==='pad'){
      partials=[['sine',1,.74,-4],['triangle',1,.26,3]];attack=.75;tail=1.15;cutoff=1150;
    }else if(kind==='bass'){
      partials=[['sine',1,.9,0],['triangle',1,.22,0]];attack=.026;tail=.16;cutoff=410;
    }else if(kind==='bell'){
      partials=[['sine',1,1,0],['sine',2.002,.27,0],['sine',3.98,.055,0]];attack=.009;tail=.2;cutoff=4800;
    }else if(kind==='lyre'){
      partials=[['sine',1,.74,-3],['triangle',1,.2,5],['sine',2,.07,1]];attack=.012;tail=.42;cutoff=2100;
    }else{
      partials=[['triangle',1,.76,-1],['sine',1,.3,2],['square',1,.055,0]];attack=.012;tail=.15;cutoff=2100;
    }
    const end=at+duration+tail;
    filter.frequency.setValueAtTime(cutoff,at);
    if(kind==='pluck')filter.frequency.exponentialRampToValueAtTime(750,at+Math.max(.2,duration));
    envelope.gain.setValueAtTime(.00001,at);
    envelope.gain.linearRampToValueAtTime(level,at+attack);
    if(kind==='pad'){
      envelope.gain.linearRampToValueAtTime(level*.82,at+duration);
      envelope.gain.linearRampToValueAtTime(.00001,end);
    }else{
      envelope.gain.exponentialRampToValueAtTime(.00001,end);
    }
    const sources=[],weights=[];
    partials.forEach(([type,multiple,weight,detune])=>{
      const oscillator=context.createOscillator();oscillator.type=type;
      oscillator.frequency.setValueAtTime(hz(midi)*multiple,at);oscillator.detune.value=detune;
      const gain=context.createGain();gain.gain.value=weight;
      oscillator.connect(gain);gain.connect(filter);sources.push(oscillator);weights.push(gain);
    });
    trackVoice(bus,sources,[filter,envelope,position,...weights]);
    sources.forEach(source=>{source.start(at);source.stop(end+.025);});
    engine.notesScheduled++;
  }

  function noiseHit(engine,bus,at,duration,level,kind='hat',offset=0) {
    const context=engine.context;
    const source=context.createBufferSource();source.buffer=engine.noise;
    const filter=context.createBiquadFilter();
    filter.type=kind==='air'?'bandpass':'highpass';
    filter.frequency.setValueAtTime(kind==='hat'?5500:kind==='brush'?1250:500,at);
    filter.Q.value=kind==='air'?.5:.4;
    if(kind==='air')filter.frequency.exponentialRampToValueAtTime(1800,at+duration);
    const soften=context.createBiquadFilter();soften.type='lowpass';soften.frequency.value=kind==='hat'?8500:3500;soften.Q.value=.3;
    const gain=context.createGain();gain.gain.value=0;
    gain.gain.setValueAtTime(.00001,at);gain.gain.linearRampToValueAtTime(level,at+(kind==='air'?.08:.004));
    gain.gain.exponentialRampToValueAtTime(.00001,at+duration);
    source.connect(filter);filter.connect(soften);soften.connect(gain);gain.connect(bus.input);
    trackVoice(bus,[source],[filter,soften,gain]);
    source.start(at,Math.max(0,Math.min(.3,offset)));source.stop(at+duration+.02);
  }

  function kick(engine,at,level=.14) {
    const context=engine.context;
    const oscillator=context.createOscillator();oscillator.type='sine';
    const gain=context.createGain();gain.gain.value=0;
    oscillator.frequency.setValueAtTime(118,at);oscillator.frequency.exponentialRampToValueAtTime(46,at+.13);
    gain.gain.setValueAtTime(.00001,at);gain.gain.linearRampToValueAtTime(level,at+.006);gain.gain.exponentialRampToValueAtTime(.00001,at+.32);
    oscillator.connect(gain);gain.connect(engine.music.input);trackVoice(engine.music,[oscillator],[gain]);
    oscillator.start(at);oscillator.stop(at+.35);
  }

  function composeStep(engine,index,at) {
    const step=index%16,bar=Math.floor(index/16)%16;
    const chord=PROGRESSION[Math.floor(bar/2)];
    const bus=engine.music;
    const answer=bar>=8;
    if(step===0&&bar%2===0){
      chord.notes.forEach((midi,i)=>note(engine,bus,midi,at+i*.016,BEAT*7.5,.026,'pad',(i-1.5)*.2));
    }
    if(step===0)note(engine,bus,chord.root,at,BEAT*1.7,.1,'bass',-.06);
    if(step===8)note(engine,bus,chord.notes[1]-12,at,BEAT*1.15,.055,'bass',-.04);
    if(step===14&&bar%2===1)note(engine,bus,chord.root+2,at,BEAT*.65,.04,'bass');
    if(step===0&&bar%4===0)kick(engine,at,.055);
    if(step===8)noiseHit(engine,bus,at,.11,.014,'brush',(bar%4)*.04);
    if(step===4||step===12)noiseHit(engine,bus,at,.035,.006,'hat',.08);
    [2,7,11].forEach((arpStep,i)=>{
      if(step!==arpStep)return;
      const tone=chord.notes[(bar+i)%chord.notes.length]+(i===2?12:0);
      note(engine,bus,tone,at,BEAT*.8,answer?.03:.024,'lyre',i===0?-.22:.18);
    });
    const melody=MELODY[bar].find(item=>item[0]===step);
    if(melody)note(engine,bus,melody[1],at,BEAT*melody[2],answer?.095:.085,'lyre',answer?.1:-.06);
    const counter=COUNTER[bar].find(item=>item[0]===step);
    if(counter)note(engine,bus,counter[1],at,BEAT*counter[2],.04,'lyre',-.3);
    if([3,7,11,15].includes(bar)&&step===0)note(engine,bus,81,at+.05,BEAT*2,.018,'bell',.32);
  }

  function effect(engine,kind,at) {
    const bus=engine.fx;
    if(kind==='enable'){
      note(engine,bus,74,at,.22,.16,'bell',-.15);note(engine,bus,81,at+.09,.36,.12,'bell',.15);
    }else if(kind==='consult'){
      [[62,0,.15],[65,.075,.12],[69,.15,.105],[72,.24,.075]].forEach(([midi,offset,level])=>note(engine,bus,midi,at+offset,.5,level,'pluck',offset-.12));
      noiseHit(engine,bus,at,.55,.035,'air');
    }else if(kind==='reveal'){
      note(engine,bus,62,at,.8,.08,'pad',0);
      [[74,0,.18],[81,.12,.13],[86,.30,.075]].forEach(([midi,offset,level],i)=>note(engine,bus,midi,at+offset,.85+i*.2,level,'bell',i===0?-.25:.25));
      noiseHit(engine,bus,at+.05,.48,.016,'air');
    }else if(kind==='reset'){
      note(engine,bus,57,at,.1,.11,'pluck',-.12);note(engine,bus,62,at+.055,.17,.085,'pluck',.12);
    }else if(kind==='empty'){
      note(engine,bus,62,at,.13,.08,'pluck');note(engine,bus,60,at+.12,.19,.055,'pluck');
    }
  }

  async function ensureContext() {
    clearTimeout(idleTimer);
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return false;
    try{
      if(!graph||graph.context.state==='closed'){
        graph=createGraph(new AudioContext(),volume);
        graph.music.duck.gain.value=ducked?.52:1;
      }
      await graph.context.resume();
      return graph.context.state==='running';
    }catch(_){return false;}
  }

  function idleIfMuted() {
    clearTimeout(idleTimer);
    if(!effectsEnabled&&!musicEnabled&&graph){
      idleTimer=setTimeout(()=>{
        if(!effectsEnabled&&!musicEnabled&&graph&&graph.context.state==='running')graph.context.suspend().catch(()=>{});
      },650);
    }
  }

  function pauseTransport() {
    clearInterval(timer);timer=null;
    if(!graph)return;
    const now=graph.context.currentTime;
    ramp(graph.music.output.gain,0,now,.22);
    stopVoices(graph.music,now+.25);
  }

  function schedule() {
    if(!graph||!musicEnabled||document.hidden||graph.context.state!=='running'){pauseTransport();return;}
    const now=graph.context.currentTime;
    // Dopo una sospensione lunga non accumula centinaia di note arretrate.
    if(nextAt<now-.25){nextAt=now+.07;stepIndex=(Math.ceil(stepIndex/16)*16)%LOOP_STEPS;}
    while(nextAt<now+.24){
      composeStep(graph,stepIndex,nextAt);
      scheduledSteps++;stepIndex=(stepIndex+1)%LOOP_STEPS;nextAt+=STEP;
    }
  }

  function startTransport() {
    if(!graph||!musicEnabled||document.hidden||graph.context.state!=='running'||timer!==null)return;
    stepIndex=0;nextAt=graph.context.currentTime+.07;
    ramp(graph.music.output.gain,MUSIC_LEVEL,graph.context.currentTime,.7);
    schedule();timer=setInterval(schedule,70);
  }

  async function setEnabled(value) {
    const revision=++effectsRevision;
    if(!value){
      effectsEnabled=false;
      if(graph){const now=graph.context.currentTime;ramp(graph.fx.output.gain,0,now,.035);stopVoices(graph.fx,now+.045);}
      idleIfMuted();return false;
    }
    const ready=await ensureContext();
    if(revision!==effectsRevision){idleIfMuted();return effectsEnabled;}
    effectsEnabled=ready;
    if(ready)ramp(graph.fx.output.gain,FX_LEVEL,graph.context.currentTime,.05);
    else idleIfMuted();
    return effectsEnabled;
  }

  async function setMusicEnabled(value) {
    const revision=++musicRevision;
    if(!value){musicEnabled=false;pauseTransport();idleIfMuted();return false;}
    const ready=await ensureContext();
    if(revision!==musicRevision){idleIfMuted();return musicEnabled;}
    musicEnabled=ready;
    if(ready)startTransport();else idleIfMuted();
    return musicEnabled;
  }

  function setVolume(value) {
    const number=Number(value);
    volume=Number.isFinite(number)?Math.max(0,Math.min(1,number)):.45;
    if(graph)ramp(graph.master.gain,volume,graph.context.currentTime,.08);
    return volume;
  }

  function setDucked(value) {
    ducked=Boolean(value);
    if(graph)ramp(graph.music.duck.gain,ducked?.52:1,graph.context.currentTime,ducked?.25:.75);
  }

  function play(kind) {
    if(!effectsEnabled||!graph||graph.context.state!=='running'||document.hidden)return;
    try{effect(graph,kind,graph.context.currentTime+.008);}catch(_){/* L'audio non deve interrompere il gioco. */}
  }

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)pauseTransport();
    else if(musicEnabled)ensureContext().then(ready=>{if(ready&&musicEnabled&&!document.hidden)startTransport();});
  });
  window.addEventListener('pagehide',()=>{
    pauseTransport();
    if(graph)stopVoices(graph.fx,graph.context.currentTime+.03);
  });
  window.addEventListener('pageshow',event=>{
    if(event.persisted&&musicEnabled)ensureContext().then(ready=>{if(ready&&musicEnabled)startTransport();});
  });

  // La stessa partitura può essere renderizzata offline per il collaudo del PCM.
  // Non viene chiamata dall'interfaccia e non avvia la riproduzione.
  async function renderPreview(seconds=16,kind='music') {
    const OfflineContext=window.OfflineAudioContext||window.webkitOfflineAudioContext;
    if(!OfflineContext)throw new Error('Rendering audio offline non disponibile');
    const length=Math.max(8,Math.min(60,Number(seconds)||16));
    const context=new OfflineContext(2,Math.ceil(44100*length),44100);
    const offline=createGraph(context,.45);
    if(kind==='effects'){
      offline.fx.output.gain.value=FX_LEVEL;
      [['enable',.2],['consult',1.4],['reveal',3.3],['reset',6.2]].forEach(([name,at])=>effect(offline,name,at));
    }else{
      offline.music.output.gain.value=MUSIC_LEVEL;
      for(let index=0,at=.1;at<length-1.2;index++,at+=STEP)composeStep(offline,index%LOOP_STEPS,at);
    }
    offline.master.gain.setValueAtTime(.45,Math.max(0,length-1.1));
    offline.master.gain.linearRampToValueAtTime(0,length-.03);
    return context.startRendering();
  }

  return {
    setEnabled,setMusicEnabled,setVolume,setDucked,play,renderPreview,
    get enabled(){return effectsEnabled;},
    get musicEnabled(){return musicEnabled;},
    get volume(){return volume;},
    track:{title:'Vento sul Parnaso',bpm:TEMPO,bars:16,loopSeconds:STEP*LOOP_STEPS},
    diagnostics:()=>({effectsEnabled,musicEnabled,volume,ducked,transportRunning:timer!==null,contextState:graph?graph.context.state:'uninitialized',activeMusicVoices:graph?graph.music.voices.size:0,activeEffectVoices:graph?graph.fx.voices.size:0,scheduledSteps,notesScheduled:graph?graph.notesScheduled:0})
  };
})();
