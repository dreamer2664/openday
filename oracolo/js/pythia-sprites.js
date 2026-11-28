/* Pizia NES: stesso personaggio in ogni posa.
 * Le immagini sono allineate sui piedi, così il corpo non salta. */
'use strict';

const PIZIA_FRAMES = {
  riposo: 'assets/pizia/riposo.png',
  battito: 'assets/pizia/battito.png',
  sorriso: 'assets/pizia/sorriso.png',
  attesa: 'assets/pizia/attesa.png',
  parla: 'assets/pizia/parla.png',
  media: 'assets/pizia/media.png',
  aperta: 'assets/pizia/aperta.png'
};

class PiziaSprite {
  constructor(canvas, reducedMotion = false) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.root = canvas.parentElement;
    this.state = 'idle';
    this.mouth = 0;
    this.reducedMotion = reducedMotion;
    this.smileUntil = 0;
    this.lastKey = '';
    this.running = true;
    this.images = {};
    this.ready = false;
    canvas.width = 160;
    canvas.height = 326;
    this.context.imageSmoothingEnabled = false;
    this.load();
    this.tick = this.tick.bind(this);
    this.tick(0);
  }

  load() {
    const entries = Object.entries(PIZIA_FRAMES);
    let left = entries.length;
    for (const [name, src] of entries) {
      const image = new Image();
      image.onload = () => {
        this.images[name] = image;
        if (--left === 0) {
          this.ready = true;
          this.render(performance.now(), true);
        }
      };
      image.onerror = () => { if (--left === 0) this.ready = true; };
      image.src = src;
    }
  }

  setState(state) {
    if (this.state === 'speaking' && state === 'idle') this.smileUntil = performance.now() + 2400;
    this.state = state;
    this.mouth = 0;
    if (this.root) {
      this.root.dataset.pose = state;
      const descriptions = {
        idle: 'La Pizia, sacerdotessa di Delfi, in attesa della tua domanda',
        waiting: 'La Pizia chiude gli occhi e si concentra',
        speaking: 'La Pizia pronuncia il responso, muovendo la bocca insieme alle parole'
      };
      this.root.setAttribute('aria-label', descriptions[state] || descriptions.idle);
    }
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

  choose(time) {
    if (this.state === 'waiting') {
      return { name: 'attesa', eyes: 'closed', dy: this.reducedMotion ? 0 : (Math.floor(time / 680) % 2) * 2 };
    }
    if (this.state === 'speaking') {
      let name = 'riposo';
      if (this.mouth === 1) name = 'media';
      else if (this.mouth === 2) name = Math.floor(time / 170) % 2 ? 'aperta' : 'parla';
      return { name, eyes: 'open', dy: 0 };
    }
    const blink = !this.reducedMotion && time % 5200 > 4980;
    const smile = time < this.smileUntil;
    return {
      name: smile ? 'sorriso' : blink ? 'battito' : 'riposo',
      eyes: blink ? 'closed' : 'open',
      dy: this.reducedMotion ? 0 : -(Math.floor(time / 1700) % 2)
    };
  }

  render(time, force = false) {
    const choice = this.choose(time);
    const key = [this.state, this.mouth, choice.name, choice.dy, this.ready].join(':');
    if (key === this.lastKey && !force) return;
    this.lastKey = key;
    this.canvas.dataset.mouth = String(this.mouth);
    this.canvas.dataset.eyes = choice.eyes;
    this.canvas.dataset.frame = choice.name;
    const ctx = this.context;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const image = this.images[choice.name] || this.images.riposo;
    if (!image) return;
    ctx.drawImage(image, 0, choice.dy);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.frameRequest);
  }
}
