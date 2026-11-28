/* Pizia NES: stesso personaggio in ogni posa.
 * Le immagini sono allineate sui piedi. La scatola è il vano del tempio,
 * non l'intera scena: ingrandirla la fa uscire dalla cornice. */
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
    this.fitToFrame = this.fitToFrame.bind(this);
    this.fitObserver = new ResizeObserver(this.fitToFrame);
    const slot = this.root.closest('.sanctuary-slot');
    const zone = this.root.closest('.pythia-zone');
    if (slot) this.fitObserver.observe(slot);
    if (zone) this.fitObserver.observe(zone);
    this.fitToFrame();
    this.load();
    this.tick = this.tick.bind(this);
    this.tick(0);
  }

  // Cornice a y=61, piedi sul gradino a y=154, apertura tra le colonne x=33..103.
  fitToFrame() {
    const slot = this.root.closest('.sanctuary-slot');
    const stage = this.root.closest('.stage');
    if (!slot || !stage) return;
    const slotBox = slot.getBoundingClientRect();
    const stageBox = stage.getBoundingClientRect();
    if (slotBox.width < 40 || slotBox.height < 40) return;

    const head = 67 / 164;
    const feet = 154 / 164;
    let height = slotBox.height * (feet - head);
    let width = height * (160 / 326);
    const opening = slotBox.width * (68 / 152);
    if (width > opening) {
      width = opening;
      height = width * (326 / 160);
    }

    let bottom = slotBox.height * (1 - feet);
    let top = slotBox.bottom - bottom - height;
    const limitTop = stageBox.top + 4;
    const limitBottom = stageBox.bottom - 4;
    if (top < limitTop) {
      height -= limitTop - top;
      width = height * (160 / 326);
      top = limitTop;
    }
    if (top + height > limitBottom) {
      const lost = top + height - limitBottom;
      height -= lost;
      width = height * (160 / 326);
      bottom += lost;
    }
    if (!(height >= 32) || !(width >= 16)) return;

    const nextHeight = `${Math.round(height)}px`;
    const nextWidth = `${Math.round(width)}px`;
    const nextBottom = `${Math.round(Math.max(0, bottom))}px`;
    if (this.root.style.height === nextHeight && this.root.style.width === nextWidth && this.root.style.bottom === nextBottom) return;
    this.root.style.height = nextHeight;
    this.root.style.width = nextWidth;
    this.root.style.bottom = nextBottom;
    this.root.style.maxWidth = 'none';
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
    if (this.state === 'waiting') return { name: 'attesa', eyes: 'closed' };
    if (this.state === 'speaking') {
      let name = 'riposo';
      if (this.mouth === 1) name = 'media';
      else if (this.mouth === 2) name = Math.floor(time / 170) % 2 ? 'aperta' : 'parla';
      return { name, eyes: 'open' };
    }
    const blink = !this.reducedMotion && time % 5200 > 4980;
    const smile = time < this.smileUntil;
    return {
      name: smile ? 'sorriso' : blink ? 'battito' : 'riposo',
      eyes: blink ? 'closed' : 'open'
    };
  }

  render(time, force = false) {
    const choice = this.choose(time);
    const key = [this.state, this.mouth, choice.name, this.ready].join(':');
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
    ctx.drawImage(image, 0, 0);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.frameRequest);
    if (this.fitObserver) this.fitObserver.disconnect();
  }
}
