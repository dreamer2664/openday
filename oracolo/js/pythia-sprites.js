/* Pizia Deluxe: pixel art originale su griglia 120 × 160.
 * Una base condivisa per tutte le pose: capelli intrecciati, diadema d'alloro,
 * peplo ricamato, mantello, gioielli e sandali. Nessuna immagine esterna. */
'use strict';

class PiziaSprite {
  constructor(canvas, reducedMotion = false) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.root = canvas.parentElement;
    this.state = 'idle';
    this.mouth = 0;
    this.reducedMotion = reducedMotion;
    this.face = canvas.dataset.face || '';
    this.lastKey = '';
    this.running = true;
    canvas.width = 120;
    canvas.height = 160;
    this.tick = this.tick.bind(this);
    this.tick(0);
  }

  setState(state) {
    this.state = state;
    this.mouth = 0;
    this.root.dataset.pose = state;
    const descriptions = {
      idle: 'La Pizia, con diadema d’alloro, mantello viola e peplo ricamato, riposa nel santuario',
      waiting: 'La Pizia abbassa appena il capo e chiude gli occhi per concentrarsi',
      speaking: 'La Pizia pronuncia il responso: la bocca segue le parole che appaiono'
    };
    this.root.setAttribute('aria-label', descriptions[state]);
    this.render(performance.now(), true);
  }

  setMouth(frame) {
    this.mouth = this.state === 'speaking' ? frame : 0;
    this.render(performance.now(), true);
  }

  tick(time) {
    if (!this.running) return;
    this.render(time);
    this.frameRequest = requestAnimationFrame(this.tick);
  }

  render(time, force = false) {
    const blink = this.state === 'waiting' || (!this.reducedMotion && this.state === 'idle' && time % 5100 > 4920);
    const breath = !this.reducedMotion && this.state === 'idle' ? Math.floor(time / 1800) % 2 : 0;
    const glint = !this.reducedMotion && (this.state === 'speaking' ? Math.floor(time / 390) % 4 === 0 : time % 7400 > 7130);
    const key = [this.state, this.mouth, blink, breath, glint].join(':');
    if (key === this.lastKey && !force) return;
    this.lastKey = key;
    this.canvas.dataset.mouth = String(this.mouth);
    this.canvas.dataset.eyes = blink ? 'closed' : 'open';
    this.canvas.dataset.breath = String(breath);
    PiziaSprite.drawFrame(this.context, {state:this.state, mouth:this.mouth, blink, breath, glint, face:this.face});
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.frameRequest);
  }

  static drawFrame(ctx, {state='idle', mouth=0, blink=false, breath=0, glint=false, face=''} = {}) {
    const c = {
      ink:'#28263d', hair:'#362c43', hairMid:'#534054', hairLight:'#795867',
      skin:'#e4ae8d', skinLight:'#ffd5a8', skinShade:'#bd8278', blush:'#e89f8e',
      ivory:'#fff0cc', cream:'#edddb0', fold:'#cbb58c', foldDark:'#a08779',
      violet:'#8178b4', violetLight:'#b5a5d6', violetMid:'#9a8ac3', violetShade:'#575581',
      gold:'#e8be73', goldLight:'#fff0b0', bronze:'#b38755', goldDark:'#7d6357',
      jade:'#86b6a4', jadeDark:'#487e79', mouth:'#854c60'
    };
    const r = (x,y,w,h,color) => {ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
    const p = (points,color) => {
      ctx.fillStyle=color;ctx.beginPath();
      points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
      ctx.closePath();ctx.fill();
    };
    ctx.clearRect(0,0,120,160);
    ctx.imageSmoothingEnabled=false;

    // Ombra a tre gradini e sandali: restano fermi mentre la veste respira.
    r(28,149,64,2,'#0c172a45');r(33,151,54,2,'#0c172a75');r(40,153,41,1,'#0c172a30');
    r(41,144,13,4,c.skin);r(66,144,13,4,c.skin);
    r(39,148,16,2,c.goldDark);r(65,148,16,2,c.goldDark);
    r(41,146,12,2,c.bronze);r(66,146,13,2,c.bronze);
    r(43,144,2,4,c.bronze);r(49,144,2,3,c.bronze);r(69,144,2,4,c.bronze);r(75,144,2,3,c.bronze);
    r(40,148,14,1,c.gold);r(66,148,14,1,c.gold);
    ctx.save();ctx.translate(0,-breath);

    // Nimbo inciso: piccoli archi a gradini, con il centro lasciato trasparente.
    const halo='#e7bc6b32';
    r(48,13,24,1,halo);r(40,17,8,1,halo);r(72,17,8,1,halo);
    r(35,22,1,8,halo);r(84,22,1,8,halo);r(31,32,1,20,halo);r(88,32,1,20,halo);
    r(35,54,1,8,halo);r(84,54,1,8,halo);r(40,65,8,1,halo);r(72,65,8,1,halo);
    r(26,40,3,1,'#d8b77e55');r(27,39,1,3,'#d8b77e55');r(91,40,3,1,'#d8b77e55');r(92,39,1,3,'#d8b77e55');

    // Mantello posteriore, con pieghe oblique e bordo consumato.
    p([[45,60],[73,60],[73,63],[80,63],[80,69],[84,69],[84,92],[87,92],[87,112],[91,112],[91,128],[95,128],[95,140],[99,140],[99,146],[27,146],[27,142],[23,142],[23,134],[26,134],[26,118],[30,118],[30,91],[34,91],[34,71],[39,71],[39,65],[45,65]],c.ink);
    p([[72,63],[78,63],[78,69],[82,69],[82,94],[85,94],[85,114],[89,114],[89,130],[93,130],[93,141],[97,141],[97,144],[77,144],[77,132],[75,132],[75,112],[73,112]],c.violetShade);
    p([[76,69],[80,69],[80,95],[83,95],[83,116],[87,116],[87,132],[91,132],[91,141],[95,141],[95,144],[84,144],[84,136],[81,136],[81,122],[78,122]],c.violet);
    p([[79,94],[81,94],[81,117],[84,117],[84,132],[88,132],[88,141],[91,141],[91,143],[85,143],[85,136],[82,136],[82,122],[79,122]],c.violetMid);
    r(92,141,3,2,c.violetLight);r(78,99,1,11,c.violetLight);

    // Peplo: orlo a greca, pieghe lunghe e piccoli punti di tessitura.
    p([[48,62],[70,62],[70,66],[77,66],[77,77],[73,77],[73,94],[76,94],[76,109],[80,109],[80,126],[84,126],[84,139],[88,139],[88,144],[31,144],[31,137],[35,137],[35,121],[39,121],[39,104],[43,104],[43,87],[46,87],[46,70],[48,70]],c.cream);
    p([[57,65],[66,65],[66,91],[69,91],[69,111],[72,111],[72,129],[76,129],[76,140],[78,140],[78,143],[62,143],[62,122],[60,122],[60,99],[58,99]],c.ivory);
    p([[49,72],[53,72],[53,89],[50,89],[50,104],[47,104],[47,124],[43,124],[43,139],[40,139],[40,143],[34,143],[34,138],[38,138],[38,121],[42,121],[42,104],[46,104],[46,87],[49,87]],c.fold);
    p([[69,88],[72,88],[72,105],[75,105],[75,123],[79,123],[79,137],[82,137],[82,142],[77,142],[77,137],[74,137],[74,123],[71,123],[71,106],[69,106]],c.fold);
    p([[54,96],[56,96],[56,115],[54,115],[54,133],[52,133],[52,141],[49,141],[49,134],[51,134],[51,115],[53,115]],c.fold);
    r(57,119,1,20,c.foldDark);r(65,132,1,10,c.fold);r(40,127,1,11,c.foldDark);
    r(46,109,1,6,c.ivory);r(72,116,1,8,c.ivory);r(78,132,1,7,c.ivory);
    [[49,101],[46,119],[42,134],[66,108],[68,129],[73,138],[53,128],[61,138]].forEach(([x,y])=>r(x,y,1,1,c.fold));
    r(32,140,55,4,c.bronze);r(33,140,53,1,c.goldLight);r(33,143,53,1,c.goldDark);
    for(let x=35;x<84;x+=7){r(x,141,4,2,c.gold);r(x+1,141,2,1,c.cream);r(x+3,142,2,1,c.goldDark);}

    // Drapé traversant le buste, ceinture et pendeloque de bronze.
    p([[47,66],[53,66],[53,70],[58,70],[58,74],[64,74],[64,77],[72,77],[72,81],[63,81],[63,79],[57,79],[57,76],[51,76],[51,72],[47,72]],c.fold);
    p([[49,65],[53,65],[53,69],[58,69],[58,73],[64,73],[64,76],[72,76],[72,78],[64,78],[64,76],[58,76],[58,73],[53,73],[53,69],[49,69]],c.ivory);
    r(44,87,30,4,c.bronze);r(45,87,28,2,c.gold);r(47,88,23,1,c.goldLight);
    r(57,85,8,7,c.goldDark);r(58,85,6,6,c.gold);r(59,86,4,4,c.goldLight);r(60,87,2,2,c.jadeDark);
    r(59,92,3,12,c.bronze);r(59,92,1,10,c.goldLight);r(58,103,5,3,c.gold);r(59,106,3,2,c.goldDark);

    // Il mantello sinistro è tessuto a fasce, non una massa piatta.
    p([[44,62],[50,62],[50,69],[47,69],[47,85],[43,85],[43,104],[40,104],[40,121],[36,121],[36,137],[33,137],[33,144],[26,144],[26,135],[29,135],[29,118],[32,118],[32,94],[36,94],[36,73],[40,73],[40,66],[44,66]],c.violet);
    p([[43,65],[47,65],[47,72],[44,72],[44,86],[40,86],[40,105],[37,105],[37,123],[33,123],[33,138],[30,138],[30,143],[27,143],[27,135],[31,135],[31,117],[34,117],[34,94],[38,94],[38,73],[41,73],[41,67],[43,67]],c.violetLight);
    p([[44,78],[46,78],[46,89],[42,89],[42,108],[39,108],[39,126],[35,126],[35,140],[32,140],[32,144],[29,144],[29,141],[33,141],[33,125],[36,125],[36,107],[39,107],[39,89],[42,89]],c.violetShade);
    r(36,97,1,10,c.violetMid);r(33,118,1,7,c.violetMid);r(29,136,1,5,c.ivory);
    // Filo dorato e motivi a greca sul bordo del mantello.
    [[43,74],[41,87],[38,103],[35,119],[31,136]].forEach(([x,y])=>{
      r(x,y,1,7,c.bronze);r(x-2,y+2,2,1,c.gold);r(x-2,y+2,1,3,c.gold);r(x-3,y+4,2,1,c.goldLight);
    });
    r(25,142,8,2,c.bronze);r(26,142,6,1,c.goldLight);
    r(44,65,7,5,c.goldDark);r(45,64,5,5,c.gold);r(46,65,3,3,c.goldLight);r(47,66,1,1,c.jadeDark);

    // Braccio sinistro appoggiato sul drappo, bracciale e dita separate.
    p([[38,75],[42,75],[42,80],[45,80],[45,85],[50,85],[50,88],[55,88],[55,92],[48,92],[48,90],[43,90],[43,87],[39,87],[39,84],[36,84],[36,78],[38,78]],c.skinShade);
    r(38,77,3,7,c.skin);r(39,77,2,5,c.skinLight);r(41,82,3,5,c.skin);
    r(44,86,7,3,c.skin);r(49,88,6,2,c.skinLight);r(51,90,3,1,c.skinShade);
    r(42,84,3,4,c.bronze);r(43,84,2,3,c.goldLight);r(48,86,1,2,c.skinLight);

    // Braccio destro e alloro: lievissimo raccoglimento durante l'attesa.
    ctx.save();if(state==='waiting')ctx.translate(-1,1);
    p([[71,65],[77,65],[77,70],[81,70],[81,77],[85,77],[85,81],[90,81],[90,77],[94,77],[94,74],[98,74],[98,81],[96,81],[96,84],[92,84],[92,87],[83,87],[83,84],[78,84],[78,79],[74,79],[74,74],[71,74]],c.skinShade);
    p([[73,66],[76,66],[76,71],[79,71],[79,78],[83,78],[83,83],[90,83],[90,81],[94,81],[94,77],[96,77],[96,81],[94,81],[94,84],[90,84],[90,85],[84,85],[84,83],[79,83],[79,79],[76,79],[76,74],[73,74]],c.skin);
    r(76,71,2,6,c.skinLight);r(81,79,2,3,c.skinLight);r(88,83,4,1,c.skinLight);
    r(85,81,3,5,c.bronze);r(85,81,2,4,c.gold);r(85,81,1,2,c.goldLight);
    r(72,66,4,7,c.cream);r(73,66,3,2,c.ivory);r(96,74,1,4,c.skinLight);
    r(94,57,1,20,'#9b9e6c');r(95,51,1,8,'#9b9e6c');r(96,47,1,6,'#8b8d62');
    [[91,57,-1],[96,62,1],[91,66,-1],[97,54,1],[94,49,-1]].forEach(([x,y,dir])=>{
      p([[x,y],[x+3*dir,y],[x+3*dir,y+2],[x+5*dir,y+2],[x+5*dir,y+4],[x+2*dir,y+4],[x+2*dir,y+3],[x,y+3]],'#82a58b');
      r(dir<0?x-3:x+1,y+1,2,1,'#c1c38d');
    });
    ctx.restore();

    if (face && window.PiziaFaces && PiziaFaces.has(face)) {
      PiziaFaces.draw(face, ctx, r, p, c, {state, mouth, blink});
      if (glint) r(59, 86, 2, 1, c.ivory);
      ctx.restore();
      return;
    }
    // Collo proporzionato al nuovo viso, né a stelo né a blocco.
    r(55,56,11,9,c.skinShade);r(56,57,9,7,c.skin);r(58,58,4,5,c.skinLight);
    r(54,63,3,2,c.gold);r(57,64,2,1,c.goldLight);r(59,65,3,2,c.gold);
    r(62,64,2,1,c.goldLight);r(64,63,3,2,c.gold);r(60,66,1,1,c.jadeDark);
    ctx.save();if(state==='waiting')ctx.translate(0,1);

    // Capelli raccolti: incorniciano senza stringere le guance.
    p([[51,16],[69,16],[69,19],[72,19],[72,25],[70,25],[70,30],[50,30],[50,25],[48,25],[48,19],[51,19]],c.hair);
    r(54,18,12,3,c.hairLight);r(51,23,18,3,c.hairMid);r(56,21,8,2,c.hairLight);
    p([[46,31],[52,31],[52,36],[50,36],[50,48],[48,48],[48,56],[46,56],[46,40]],c.hair);
    p([[68,31],[74,31],[74,40],[72,40],[72,50],[70,50],[70,42],[68,38],[68,32]],c.hair);
    r(47,34,2,14,c.hairMid);r(71,34,2,14,c.hairLight);

    // Via di mezzo: circa 18 pixel di larghezza, mento rotondo, niente ovale gonfio.
    p([[53,30],[67,30],[70,35],[70,43],[68,49],[64,53],[60,56],[56,53],[52,49],[50,43],[50,35]],c.skinShade);
    p([[54,31],[66,31],[68,35],[68,43],[66,49],[63,53],[60,55],[57,53],[54,49],[52,43],[52,35]],c.skin);
    r(57,32,6,3,c.skinLight);
    r(53,44,2,3,'#e7b09a');r(65,44,2,3,'#e7b09a');
    r(54,50,2,2,c.skinShade);r(64,50,2,2,c.skinShade);

    // Sopracciglia leggere e occhi della stessa misura, rivolti in avanti.
    r(53,36,5,1,c.hairMid);r(54,35,3,1,c.hair);
    r(62,36,5,1,c.hairMid);r(63,35,3,1,c.hair);
    if(blink||state==='waiting'){
      r(53,39,6,1,c.hairMid);r(62,39,6,1,c.hairMid);
    }else{
      r(53,38,6,3,c.ivory);r(62,38,6,3,c.ivory);
      r(53,38,6,1,c.skin);r(62,38,6,1,c.skin);
      r(55,39,2,2,c.hair);r(64,39,2,2,c.hair);
      r(55,39,1,1,'#fff6e4');r(64,39,1,1,'#fff6e4');
      r(53,41,6,1,c.skinShade);r(62,41,6,1,c.skinShade);
    }

    // Naso breve e bocca morbida, larga quanto lo spazio tra gli occhi.
    r(59,42,2,3,c.skinShade);r(58,44,1,1,c.skinShade);r(61,44,1,1,c.skinShade);
    if(mouth===2&&state==='speaking'){
      r(57,48,6,3,c.mouth);r(58,48,4,1,c.ivory);r(58,50,4,1,'#d9a094');
    }else if(mouth===1&&state==='speaking'){
      r(57,48,6,2,c.mouth);r(58,49,4,1,'#d7a197');
    }else{
      r(57,48,6,1,c.mouth);r(58,49,4,1,'#e4b6a8');
    }
    r(58,53,4,2,c.skinLight);

    // Alloro sui capelli, orecchio e orecchino senza allargare il cranio.
    r(50,28,20,2,c.bronze);r(51,28,18,1,c.gold);
    [[50,26],[54,25],[59,24],[64,25],[68,26]].forEach(([x,y])=>{r(x,y,2,2,c.gold);r(x,y,1,1,c.goldLight);});
    r(58,25,4,4,c.gold);r(59,26,2,2,c.jade);r(60,26,1,1,'#d7eccf');
    r(69,39,2,5,c.skin);r(70,40,1,2,c.skinLight);
    r(70,44,2,3,c.gold);r(71,46,1,2,c.jade);
    ctx.restore();
    for(let y=55;y<72;y+=5){r(46,y,3,3,c.hairMid);r(45,y+2,3,2,c.hairLight);}
    r(46,72,3,2,c.gold);
    if(glint){r(45,65,5,1,c.ivory);r(47,63,1,5,c.ivory);r(59,86,2,1,c.ivory);}
    ctx.restore();
  }
}
