/* Fondale originale a pixel: cielo inciso, rocce illuminate, cipressi e valle.
 * Tutte le coordinate vengono quantizzate; la trama è deterministica. */
'use strict';

class SantuarioScena {
  constructor({stars, landscape, fx, reducedMotion=false}) {
    this.stars=stars;
    this.landscape=landscape;
    this.fx=fx;
    this.reducedMotion=reducedMotion;
    this.particles=[];
    this.mode='idle';
    this.animating=false;
    this.lastFrame=0;
    this.lastEmission=0;
    this.animate=this.animate.bind(this);
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    [stars,landscape,fx].forEach(canvas=>this.resizeObserver.observe(canvas));
    this.resize();
  }

  random(seed) {
    return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  }

  size(canvas, scale=2) {
    const box=canvas.getBoundingClientRect();
    const width=Math.max(1,Math.round(box.width/scale));
    const height=Math.max(1,Math.round(box.height/scale));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    const context=canvas.getContext('2d');
    context.imageSmoothingEnabled=false;
    return [width,height,context];
  }

  resize() {
    this.drawStars();
    this.drawLandscape();
    this.size(this.fx,2);
  }

  drawStars() {
    const [w,h,ctx]=this.size(this.stars,2);
    const rand=this.random(531);
    ctx.clearRect(0,0,w,h);
    for(let i=0;i<95;i++){
      const x=Math.floor(rand()*w), y=Math.floor(rand()*h);
      ctx.fillStyle=['#dfc994','#8da8bc','#c3b5a2','#62748c'][i%4];
      ctx.globalAlpha=.2+rand()*.55;
      ctx.fillRect(x,y,1,1);
      if(i%21===0){
        ctx.globalAlpha=.6;ctx.fillRect(x-2,y,5,1);ctx.fillRect(x,y-2,1,5);
        ctx.globalAlpha=.28;ctx.fillRect(x-1,y-1,3,3);
      }
    }
    // Due costellazioni sottili ai margini dell'insegna.
    [[[.08,.10],[.14,.16],[.12,.27],[.18,.30]],[[.82,.12],[.88,.18],[.85,.29],[.92,.33]]].forEach(points=>{
      const vertices=points.map(([x,y])=>[Math.round(x*w),Math.round(y*h)]);
      ctx.fillStyle='#69768c';ctx.globalAlpha=.18;
      for(let i=1;i<vertices.length;i++){
        let [x,y]=vertices[i-1];const [endX,endY]=vertices[i];
        const dx=Math.abs(endX-x),dy=-Math.abs(endY-y),sx=x<endX?1:-1,sy=y<endY?1:-1;
        let error=dx+dy;
        while(true){
          ctx.fillRect(x,y,1,1);if(x===endX&&y===endY)break;
          const twice=2*error;if(twice>=dy){error+=dy;x+=sx;}if(twice<=dx){error+=dx;y+=sy;}
        }
      }
      ctx.fillStyle='#dac38f';ctx.globalAlpha=.7;
      vertices.forEach(([x,y])=>ctx.fillRect(x,y,2,2));
    });
    ctx.globalAlpha=1;
  }

  drawLandscape() {
    const [w,h,ctx]=this.size(this.landscape,2);
    const rand=this.random(972);
    const r=(x,y,width,height,color)=>{
      ctx.fillStyle=color;
      ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(width)),Math.max(1,Math.round(height)));
    };
    ['#18263b','#1b2a40','#1e2d43','#203147','#24364a','#263b4d','#2a414f','#2e4752'].forEach((color,i)=>r(0,Math.floor(h*i/8),w,Math.ceil(h/8),color));
    for(let i=0;i<90;i++){
      const x=Math.floor(rand()*w), y=Math.floor(rand()*h*.45);
      r(x,y,1,1,['#566981','#8c98a7','#bcb794','#667e91'][i%4]);
      if(i%25===0){r(x-1,y,3,1,'#d0c29d');r(x,y-1,1,3,'#d0c29d');r(x,y,1,1,'#f5dfad');}
    }

    // Luna scavata a pixel: alone a gradini, zone d'ombra e piccoli crateri.
    const mx=Math.max(19,Math.min(w-19,Math.round(w*.057))), my=Math.max(19,Math.min(h-19,Math.round(Math.min(30,h*.12))));
    if(w>=40&&h>=40){
    for(let y=-19;y<=19;y++)for(let x=-19;x<=19;x++){
      const d=x*x+y*y;
      if(d<=361&&d>225)r(mx+x,my+y,1,1,d>289?'#c8bc8510':'#d4c28b15');
      if(d<=196&&(x-6)**2+(y+5)**2>183){
        const lit=x<-5||y<-6;
        r(mx+x,my+y,1,1,lit?'#f2dda7':y>6?'#afac8d':'#d2c49a');
        if((x*7+y*13)%19===0)r(mx+x,my+y,1,1,lit?'#d0bf93':'#969e8b');
      }
    }
    [[-9,0,2,3],[-5,8,3,2],[-10,-5,2,2]].forEach(([x,y,a,b])=>r(mx+x,my+y,a,b,'#adac8a'));
    r(mx-9,my-6,2,1,'#fff0bd');
    }

    // Nuvole di foschia orizzontali, a densità bassa, senza sfocare i pixel.
    for(let i=0;i<6;i++){
      const x=rand()*w,y=h*(.17+rand()*.25),length=9+rand()*25;
      r(x,y,length,1,'#7787a01a');r(x+4,y-1,length*.55,1,'#8291a313');
    }

    const ridge=(points,base,palette,texture)=>{
      let segment=0;
      const heights=new Int32Array(w+3);
      ctx.beginPath();ctx.moveTo(0,h);
      let previous=h;
      for(let x=0;x<=w+2;x+=2){
        const t=x/w;
        while(segment<points.length-2&&t>points[segment+1][0])segment++;
        const a=points[segment],b=points[segment+1];
        const y=Math.round((base+a[1]+(b[1]-a[1])*(t-a[0])/(b[0]-a[0]))*h);
        heights[x]=y;if(x+1<heights.length)heights[x+1]=y;
        ctx.lineTo(x,previous);ctx.lineTo(x,y);previous=y;
      }
      ctx.lineTo(w+2,h);ctx.closePath();ctx.fillStyle=palette[0];ctx.fill();
      ctx.save();ctx.clip();
      // Petites facettes et stries, toujours à l'intérieur de la silhouette.
      for(let x=2;x<w;x+=4){
        const top=heights[x];
        if(x+4<w&&heights[x+4]<top)r(x,top,3,1,palette[1]);
      }
      for(let i=0;i<texture;i++){
        const x=Math.floor(rand()*w),top=heights[x],y=top+rand()*(h-top);
        r(x,y,rand()<.75?1:3,1,i%3?palette[2]:palette[1]);
      }
      points.slice(1,-1).forEach(([px,py],i)=>{
        if(i%2===0)return;
        let x=Math.round(px*w),y=Math.round((base+py)*h)+3;
        for(let j=0;j<Math.min(24,h*.12);j+=3){r(x+j*.45,y+j,2,2,palette[2]);r(x+j*.45-1,y+j,1,2,palette[1]);}
      });
      ctx.restore();
      return heights;
    };
    ridge([[0,.10],[.07,.02],[.13,.10],[.22,-.09],[.3,-.17],[.37,.01],[.44,-.04],[.54,.09],[.65,-.13],[.74,.04],[.85,-.06],[1,.12]],.49,['#41445f','#5c5870','#494a65'],260);
    ridge([[0,.05],[.09,-.04],[.17,.02],[.27,-.14],[.39,.02],[.51,-.07],[.6,.01],[.72,-.1],[.83,.03],[.93,-.04],[1,.04]],.66,['#304252','#475266','#354757'],210);
    ridge([[0,-.02],[.12,.02],[.25,-.07],[.4,.03],[.52,-.02],[.65,.02],[.77,-.08],[.9,.01],[1,-.04]],.81,['#294149','#3a5157','#30484d'],150);

    // Santuario lontano, lungo il sentiero sul crinale.
    const tx=Math.round(w*.88),ty=Math.round(h*.49);
    for(let row=0;row<5;row++)r(tx-row*3-2,ty+row*2,row*6+5,2,row%2?'#8b8792':'#b2a398');
    r(tx-16,ty+10,33,2,'#a09795');r(tx-14,ty+12,29,2,'#67677d');
    for(let x=-12;x<=12;x+=6){r(tx+x,ty+14,3,13,'#99938f');r(tx+x+2,ty+14,1,13,'#5e6379');}
    r(tx-17,ty+27,35,2,'#7a8290');r(tx-20,ty+29,41,2,'#586d7d');
    r(tx-1,ty+5,3,3,'#d3b384');
    for(let i=0;i<7;i++)r(tx+14+i*4,ty+31+i*2,5,1,'#687b8577');

    // Valle e minuscole luci, la cui scala rende il tempio vicino più grande.
    for(let i=0;i<12;i++){
      const x=rand()*w,y=h*(.78+rand()*.12);
      r(x,y,3,2,'#344650');r(x+1,y-1,1,1,'#a49671');
    }
    for(let i=0;i<12;i++)r(w*.18+i*3,h*.82+i*.9,4,1,i%3?'#65878425':'#93a49830');

    const cypress=(x,y,height,shade,light)=>{
      const width=Math.max(5,Math.round(height*.13));
      r(x-1,y+height*.3,3,height*.71,'#4c554d');
      for(let row=0;row<height-3;row++){
        const t=row/height;
        const half=Math.max(1,Math.round(Math.sin(Math.PI*Math.min(.98,t*1.08))**.55*width));
        const offset=row%13===0?1:0;
        r(x-half+offset,y+row,half*2+1-offset,1,shade);
        if(row%3!==1)r(x-half+1,y+row,Math.max(1,Math.floor(half*.68)),1,light);
        if(row%7===2)r(x+Math.floor(half*.3),y+row,2,1,'#416058');
        if(row%11===0&&half>3)r(x-half+3,y+row,2,1,'#739072');
      }
      r(x-2,y+height-2,6,2,'#253c41');
    };
    cypress(Math.round(w*.025),Math.round(h*.52),Math.round(h*.43),'#17333b','#355347');
    cypress(Math.round(w*.973),Math.round(h*.47),Math.round(h*.48),'#153039','#345046');
    cypress(Math.round(w*.936),Math.round(h*.64),Math.round(h*.3),'#1d3941','#3f5b50');
    r(0,h-7,w,7,'#253744');
    for(let i=0;i<65;i++){
      const x=rand()*w,y=h-9+rand()*6;
      r(x,y,1+rand()*3,1,i%4?'#617267':'#98a080');
      if(i%7===0){r(x,y-3,1,4,'#6a806a');r(x-1,y-2,3,1,'#7b916f');}
    }
  }

  setMode(mode) {
    this.mode=mode;
    if(this.reducedMotion){
      this.particles=[];
      this.fx.getContext('2d').clearRect(0,0,this.fx.width,this.fx.height);
      return;
    }
    if(mode==='speaking')for(let i=0;i<30;i++)this.emit(true);
    if(!this.animating&&mode!=='idle'){
      this.animating=true;this.lastFrame=performance.now();requestAnimationFrame(this.animate);
    }
  }

  emit(burst=false) {
    const w=this.fx.width,h=this.fx.height;
    const edge=Math.random()<.65;
    this.particles.push({
      x:edge?(Math.random()<.5?w*.07:w*.93)+(Math.random()-.5)*w*.08:Math.random()*w,
      y:burst?h*(.1+Math.random()*.75):h*.86,
      vx:(Math.random()-.5)*(burst?12:5),vy:-7-Math.random()*13,
      life:1,decay:.42+Math.random()*.45,
      color:burst?['#efd59b','#c8d7b5','#dca764'][Math.floor(Math.random()*3)]:'#b9a9dd',
      kind:Math.random()<.2?'star':Math.random()<.25?'diamond':'dust',
      size:Math.random()<.18?2:1
    });
  }

  animate(time) {
    const ctx=this.fx.getContext('2d');
    const dt=Math.min((time-this.lastFrame)/1000,.05);this.lastFrame=time;
    ctx.clearRect(0,0,this.fx.width,this.fx.height);
    if(!this.reducedMotion&&this.mode==='consulting'&&time-this.lastEmission>95){this.emit();this.lastEmission=time;}
    this.particles=this.particles.filter(p=>p.life>0);
    for(const p of this.particles){
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=p.decay*dt;
      const x=Math.round(p.x),y=Math.round(p.y);
      ctx.globalAlpha=Math.max(0,p.life)*.7;ctx.fillStyle=p.color;
      ctx.fillRect(x,y,p.size,p.size);
      if(p.kind==='star'){
        ctx.globalAlpha*=.55;ctx.fillRect(x-2,y,5,1);ctx.fillRect(x,y-2,1,5);
      }else if(p.kind==='diamond'){
        ctx.fillRect(x-1,y+1,1,1);ctx.fillRect(x+1,y+1,1,1);ctx.fillRect(x,y+2,1,1);
      }
    }
    ctx.globalAlpha=1;
    if(this.particles.length||(!this.reducedMotion&&this.mode==='consulting'))requestAnimationFrame(this.animate);
    else this.animating=false;
  }
}
