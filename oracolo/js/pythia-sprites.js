/* Pizia NES: stesso personaggio in ogni posa.
 * Le immagini sono allineate sui piedi. La scatola è il vano del tempio,
 * non l'intera scena: ingrandirla la fa uscire dalla cornice. */
'use strict';

const CLOAK_COUNT = 12;
const CLOAK_STEP = 170;

function cloakPurple(r, g, b, a) {
  return a && b > g + 20 && r > g + 8 && b > 45 && b < 190 && g < 95 && r < 170;
}

// Dodici fotogrammi del mantello, calcolati sui pixel già nel gioco.
// Viso, mani, veste e piedi non vengono ridisegnati.
function buildCloakCycle(image) {
  const w = image.width;
  const h = image.height;
  const sample = document.createElement('canvas');
  sample.width = w;
  sample.height = h;
  const sampleContext = sample.getContext('2d', { willReadFrequently: true });
  sampleContext.imageSmoothingEnabled = false;
  sampleContext.drawImage(image, 0, 0);
  const source = sampleContext.getImageData(0, 0, w, h).data;
  const purple = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const offset = i * 4;
    if (cloakPurple(source[offset], source[offset + 1], source[offset + 2], source[offset + 3])) purple[i] = 1;
  }
  const seen = new Uint8Array(w * h);
  const panels = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const start = y * w + x;
      if (seen[start] || !purple[start]) continue;
      const cells = [];
      const stack = [start];
      seen[start] = 1;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      while (stack.length) {
        const index = stack.pop();
        const cx = index % w;
        const cy = (index / w) | 0;
        cells.push(cx, cy);
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        if (cx > 0 && !seen[index - 1] && purple[index - 1]) { seen[index - 1] = 1; stack.push(index - 1); }
        if (cx + 1 < w && !seen[index + 1] && purple[index + 1]) { seen[index + 1] = 1; stack.push(index + 1); }
        if (cy > 0 && !seen[index - w] && purple[index - w]) { seen[index - w] = 1; stack.push(index - w); }
        if (cy + 1 < h && !seen[index + w] && purple[index + w]) { seen[index + w] = 1; stack.push(index + w); }
      }
      if (minY >= 160 && maxY - minY >= 54 && maxX - minX >= 22 && cells.length >= 400) {
        panels.push({ cells, minX, maxX, minY, maxY, right: minX + maxX > w });
      }
    }
  }
  if (!panels.length) return null;
  const cloak = new Uint8Array(w * h);
  panels.forEach((panel) => {
    for (let i = 0; i < panel.cells.length; i += 2) cloak[panel.cells[i + 1] * w + panel.cells[i]] = 1;
  });
  const behind = new Uint8ClampedArray(source);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!cloak[y * w + x]) continue;
      const toward = x < w / 2 ? 1 : -1;
      let found = -1;
      for (let step = 1; step < 32 && found < 0; step++) {
        const nx = x + toward * step;
        if (nx < 0 || nx >= w) break;
        if (cloak[y * w + nx]) continue;
        const offset = (y * w + nx) * 4;
        if (source[offset + 3]) found = offset;
      }
      const dst = (y * w + x) * 4;
      if (found < 0) {
        behind[dst] = 236; behind[dst + 1] = 220; behind[dst + 2] = 176; behind[dst + 3] = 255;
      } else {
        behind[dst] = source[found];
        behind[dst + 1] = source[found + 1];
        behind[dst + 2] = source[found + 2];
        behind[dst + 3] = source[found + 3];
      }
    }
  }
  const frames = [];
  for (let phase = 0; phase < CLOAK_COUNT; phase++) {
    const out = new Uint8ClampedArray(behind);
    const angle = Math.PI * 2 * phase / CLOAK_COUNT;
    const sway = Math.sin(angle);
    const curl = Math.sin(angle * 2);
    panels.forEach((panel) => {
      const top = panel.minY;
      const bot = panel.maxY;
      const span = Math.max(1, bot - top);
      const amp = panel.maxX - panel.minX > 28 ? 6 : 4;
      const rows = new Map();
      for (let i = 0; i < panel.cells.length; i += 2) {
        const cx = panel.cells[i];
        const cy = panel.cells[i + 1];
        if (!rows.has(cy)) rows.set(cy, []);
        rows.get(cy).push(cx);
      }
      let previous = 0;
      const shifts = new Int16Array(h);
      for (let y = top; y <= bot; y++) {
        const t = (y - top) / span;
        const fall = t < 0.12 ? 0 : ((t - 0.12) / 0.88) ** 1.4;
        let desired = Math.round(sway * amp * fall + curl * fall * (t > 0.62 ? 1.5 : 0.4));
        desired = Math.max(previous - 1, Math.min(previous + 1, desired));
        shifts[y] = desired;
        previous = desired;
      }
      rows.forEach((xs, y) => {
        const dx = shifts[y];
        const dy = y > bot - 8 && Math.abs(sway) > 0.65 ? -1 : 0;
        const ny = y + dy;
        if (ny < 0 || ny >= h) return;
        xs.sort((a, b) => a - b);
        xs.forEach((cx) => {
          const nx = cx + dx;
          if (nx < 0 || nx >= w) return;
          const from = (y * w + cx) * 4;
          const to = (ny * w + nx) * 4;
          out[to] = source[from];
          out[to + 1] = source[from + 1];
          out[to + 2] = source[from + 2];
          out[to + 3] = source[from + 3];
        });
        let extra = 0;
        if (y > top + span * 0.55) {
          extra = sway > 0.35 ? 1 : sway < -0.35 ? -1 : 0;
          if (panel.right && curl > 0.4 && y > bot - 14) extra += 1;
        }
        if (extra > 0 && xs.length) {
          const edge = panel.right ? xs[xs.length - 1] : xs[0];
          const sign = panel.right ? 1 : -1;
          const from = (y * w + edge) * 4;
          for (let k = 1; k <= extra; k++) {
            const nx = edge + dx + sign * k;
            if (nx < 0 || nx >= w) continue;
            const to = (ny * w + nx) * 4;
            out[to] = source[from];
            out[to + 1] = source[from + 1];
            out[to + 2] = source[from + 2];
            out[to + 3] = source[from + 3];
          }
        }
      });
    });
    for (let y = 0; y < h; y++) {
      for (let x = 1; x < w - 1; x++) {
        const offset = (y * w + x) * 4;
        if (cloakPurple(out[offset], out[offset + 1], out[offset + 2], out[offset + 3])) continue;
        const left = offset - 4;
        const right = offset + 4;
        if (cloakPurple(out[left], out[left + 1], out[left + 2], out[left + 3]) && cloakPurple(out[right], out[right + 1], out[right + 2], out[right + 3])) {
          out[offset] = out[left];
          out[offset + 1] = out[left + 1];
          out[offset + 2] = out[left + 2];
          out[offset + 3] = out[left + 3];
        }
      }
    }
    const frame = document.createElement('canvas');
    frame.width = w;
    frame.height = h;
    const frameContext = frame.getContext('2d');
    frameContext.imageSmoothingEnabled = false;
    frameContext.putImageData(new ImageData(out, w, h), 0, 0);
    frames.push(frame);
  }
  return frames;
}

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
    this.cloak = {};
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
        try { this.cloak[name] = buildCloakCycle(image); } catch (_) { this.cloak[name] = null; }
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

  cloakPhase(time) {
    if (this.reducedMotion) return 0;
    return Math.floor(time / CLOAK_STEP) % CLOAK_COUNT;
  }

  render(time, force = false) {
    const choice = this.choose(time);
    const phase = this.cloakPhase(time);
    const key = [this.state, this.mouth, choice.name, phase, this.ready].join(':');
    if (key === this.lastKey && !force) return;
    this.lastKey = key;
    this.canvas.dataset.mouth = String(this.mouth);
    this.canvas.dataset.eyes = choice.eyes;
    this.canvas.dataset.frame = choice.name;
    this.canvas.dataset.cloak = String(phase);
    const ctx = this.context;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const cycle = this.cloak[choice.name];
    const image = (cycle && cycle[phase]) || this.images[choice.name] || this.images.riposo;
    if (!image) return;
    ctx.drawImage(image, 0, 0);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.frameRequest);
    if (this.fitObserver) this.fitObserver.disconnect();
  }
}
