// Headless state-flow smoke test for the browser game; no third-party packages needed.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
let frame;
const listeners = {};
class Element {
  constructor(id = '') { this.id=id; this.hidden=false; this.textContent=''; this.style={}; this.children=[]; this._html=''; this.onclick=null; this.className=''; }
  set innerHTML(value) { this._html=value; if (value==='') this.children=[]; }
  get innerHTML() { return this._html; }
  appendChild(node) { this.children.push(node); }
  click() { this.onclick?.(); }
}
const selectors=['#game','#overlay','#dialog','#audioToggle','#campaignBtn','#startDemo','#pauseBtn','#closeDialog','#chapterLabel','#stageHint','#objective','#menuActions','#statusCard','#panelEyebrow','#panelTitle','#panelText','#dialogSpeaker','#dialogTitle','#dialogText','#dialogNote','#dialogChoices','#heartDisplay','#statusLine'];
const nodes=Object.fromEntries(selectors.map(s=>[s,new Element(s)]));
const fakeCtx=new Proxy({}, {set(o,k,v){o[k]=v;return true},get(o,k){return o[k]||(()=>{})}});
nodes['#game'].getContext=()=>fakeCtx;
const window={
 addEventListener(type,fn){(listeners[type]??=[]).push(fn)},
 dispatchEvent(event){(listeners[event.type]||[]).forEach(fn=>fn(event))},
 AudioContext:class{constructor(){this.currentTime=0;this.destination={}}createOscillator(){return{frequency:{},connect(){},start(){},stop(){},type:''}}createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}}}
};
const document={querySelector:s=>nodes[s]??(nodes[s]=new Element(s)),createElement:()=>new Element()};
const sandbox={document,window,performance:{now:()=>Date.now()},requestAnimationFrame:fn=>{frame=fn},setInterval:()=>1,clearInterval(){},setTimeout:fn=>{fn();return 1},console};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8'),sandbox);
function tick(n){for(let i=0;i<n;i++){const fn=frame;frame=null;fn?.()}}
function key(type,value){window.dispatchEvent({type,key:value,preventDefault(){}})}
function choose(index=0){const button=nodes['#dialogChoices'].children[index];if(!button)throw Error(`Missing choice ${index} in ${nodes['#dialogTitle'].textContent}`);button.onclick()}
let x=38, campaignChapter=0;
function stepMove(target,jump=false){const delta=target-x;if(!delta)return;const direction=delta>0?'d':'a';key('keydown',direction);if(jump)key('keydown',' ');const n=Math.ceil(Math.abs(delta)/1.8);tick(n);if(jump)key('keyup',' ');key('keyup',direction);x+=Math.sign(delta)*n*1.8}
function moveTo(target){if(campaignChapter>0&&target>x){const pits=[[460,500],[650,690],[840,880],[1010,1055],[1190,1235],[1380,1425],[1570,1610]];for(const [a,b] of pits){if(x<a-24&&target>b+6){stepMove(a-24);stepMove(b+7,true)}}}stepMove(target)}
function interact(){key('keydown','e')}
function freshX(){x=38}

// Demonstration mission: all four protagonists, gameplay beats, safety choice and ending.
nodes['#startDemo'].click(); choose();
moveTo(265); interact(); choose(0); tick(2);
moveTo(650); interact(); choose(0); tick(66); key('keydown',' '); key('keyup',' '); tick(1);
moveTo(1040); interact(); choose(0); key('keydown','1'); key('keydown','2'); key('keydown','3'); tick(1);
moveTo(1430); interact(); choose(1); tick(2);
moveTo(1782); interact(); choose(0); tick(2);
if(!nodes['#chapterLabel'].textContent.includes('MISSIONE COMPLETATA'))throw Error('Demo ending was not reached');

// Campaign: stage transition, chapter tasks, incorrectness-safe progression and full finale.
nodes['#campaignBtn'].click(); choose(); freshX();
moveTo(265); interact(); choose(0); tick(2);
moveTo(650); interact(); choose(0); tick(66); key('keydown',' '); key('keyup',' '); tick(1);
moveTo(1040); interact(); choose(0); key('keydown','1'); key('keydown','2'); key('keydown','3'); tick(1);
moveTo(1430); interact(); choose(1); tick(2);
moveTo(1782); interact(); choose(0); tick(2);
if(!nodes['#chapterLabel'].textContent.includes('CAPITOLO 2/5'))throw Error('Campaign did not enter chapter two');
campaignChapter=1;
for(let chapter=1;chapter<=4;chapter++){ 
  choose(0); freshX();
  moveTo(205); interact(); choose(0); tick(1);
  moveTo(805); interact(); choose(0); tick(2);
  moveTo(1770); interact(); choose(0); tick(2);
  const expected=chapter+2;
  if(chapter<4&&!nodes['#chapterLabel'].textContent.includes(`CAPITOLO ${expected}/5`))throw Error(`Campaign did not advance after chapter ${chapter+1}`);campaignChapter=chapter+1;
}
if(!nodes['#panelEyebrow'].textContent.includes('CAMPAGNA COMPLETATA'))throw Error('Campaign finale not reached');
console.log('PASS: demo flow, four character moments, timed basket, piano sequence, security choice, five-chapter campaign, chapter puzzles and finale.');
