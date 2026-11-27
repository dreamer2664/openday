// Font Bitmap Pixel-Art Originale 8-Bit (5x7 + accenti italiani completi e simboli arcade)
// Elimina il font di sistema monospace sfocato e garantisce nitidezza al pixel su qualsiasi OS/browser!

const GLYPHS_5X7 = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "#": ["01010", "11111", "01010", "01010", "11111", "01010", "00000"],
  "$": ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "%": ["11001", "11010", "00100", "01000", "10110", "00110", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "'": ["00100", "00100", "00000", "00000", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "*": ["00000", "00100", "10101", "01110", "10101", "00100", "00000"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  ",": ["00000", "00000", "00000", "00000", "00000", "00100", "01000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00000", "00100"],
  "/": ["00001", "00010", "00100", "01000", "10000", "00000", "00000"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  ":": ["00000", "00100", "00000", "00000", "00100", "00000", "00000"],
  ";": ["00000", "00100", "00000", "00000", "00100", "00100", "01000"],
  "<": ["00010", "00100", "01000", "10000", "01000", "00100", "00010"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  ">": ["01000", "00100", "00010", "00001", "00010", "00100", "01000"],
  "?": ["01110", "10001", "00010", "00100", "00100", "00000", "00100"],
  "@": ["01110", "10001", "10111", "10101", "10110", "10000", "01110"],
  "\u2014": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "\u2013": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "\u2018": ["00100", "00100", "00000", "00000", "00000", "00000", "00000"],
  "\u2019": ["00100", "00100", "00000", "00000", "00000", "00000", "00000"],
  "\u201C": ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "\u201D": ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "\u2026": ["00000", "00000", "00000", "00000", "00000", "00000", "10101"],
  "\u00B7": ["00000", "00000", "00000", "00100", "00000", "00000", "00000"],
  "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  "C": ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  "D": ["11100", "10010", "10001", "10001", "10001", "10010", "11100"],
  "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  "G": ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
  "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "I": ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  "J": ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "[": ["01110", "01000", "01000", "01000", "01000", "01000", "01110"],
  "]": ["01110", "00010", "00010", "00010", "00010", "00010", "01110"],
  "_": ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  "a": ["00000", "00000", "01110", "00001", "01111", "10001", "01111"],
  "b": ["10000", "10000", "11110", "10001", "10001", "10001", "11110"],
  "c": ["00000", "00000", "01110", "10000", "10000", "10001", "01110"],
  "d": ["00001", "00001", "01111", "10001", "10001", "10001", "01111"],
  "e": ["00000", "00000", "01110", "10001", "11111", "10000", "01110"],
  "f": ["00110", "01001", "01000", "11100", "01000", "01000", "01000"],
  "g": ["00000", "01111", "10001", "10001", "01111", "00001", "01110"],
  "h": ["10000", "10000", "11110", "10001", "10001", "10001", "10001"],
  "i": ["00100", "00000", "01100", "00100", "00100", "00100", "01110"],
  "j": ["00010", "00000", "00110", "00010", "00010", "10010", "01100"],
  "k": ["10000", "10000", "10010", "10100", "11000", "10100", "10010"],
  "l": ["01100", "00100", "00100", "00100", "00100", "00100", "01110"],
  "m": ["00000", "00000", "11010", "10101", "10101", "10001", "10001"],
  "n": ["00000", "00000", "11110", "10001", "10001", "10001", "10001"],
  "o": ["00000", "00000", "01110", "10001", "10001", "10001", "01110"],
  "p": ["00000", "00000", "11110", "10001", "11110", "10000", "10000"],
  "q": ["00000", "00000", "01111", "10001", "01111", "00001", "00001"],
  "r": ["00000", "00000", "10110", "11001", "10000", "10000", "10000"],
  "s": ["00000", "00000", "01111", "10000", "01110", "00001", "11110"],
  "t": ["01000", "01000", "11100", "01000", "01000", "01001", "00110"],
  "u": ["00000", "00000", "10001", "10001", "10001", "10011", "01101"],
  "v": ["00000", "00000", "10001", "10001", "10001", "01010", "00100"],
  "w": ["00000", "00000", "10001", "10101", "10101", "10101", "01010"],
  "x": ["00000", "00000", "10001", "01010", "00100", "01010", "10001"],
  "y": ["00000", "00000", "10001", "10001", "01111", "00001", "01110"],
  "z": ["00000", "00000", "11111", "00010", "00100", "01000", "11111"],
  // Vocali italiane accentate minuscole e maiuscole!
  "à": ["01000", "00100", "01110", "00001", "01111", "10001", "01111"],
  "è": ["01000", "00100", "01110", "10001", "11111", "10000", "01110"],
  "é": ["00010", "00100", "01110", "10001", "11111", "10000", "01110"],
  "ì": ["01000", "00100", "00000", "01100", "00100", "00100", "01110"],
  "ò": ["01000", "00100", "01110", "10001", "10001", "10001", "01110"],
  "ù": ["01000", "00100", "10001", "10001", "10001", "10011", "01101"],
  "À": ["01000", "00100", "01110", "10001", "11111", "10001", "10001"],
  "È": ["01000", "00100", "11111", "10000", "11110", "10000", "11111"],
  "É": ["00010", "00100", "11111", "10000", "11110", "10000", "11111"],
  "Ì": ["01000", "00100", "01110", "00100", "00100", "00100", "01110"],
  "Ò": ["01000", "00100", "01110", "10001", "10001", "10001", "01110"],
  "Ù": ["01000", "00100", "10001", "10001", "10001", "10001", "01110"],
  "Á": ["00010", "00100", "01110", "10001", "11111", "10001", "10001"],
  "Í": ["00010", "00100", "01110", "00100", "00100", "00100", "01110"],
  "Ó": ["00010", "00100", "01110", "10001", "10001", "10001", "01110"],
  "Ú": ["00010", "00100", "10001", "10001", "10001", "10001", "01110"],
  "^": ["00010", "00101", "01010", "00000", "00000", "00000", "00000"],
  "²": ["00110", "00001", "00110", "00001", "00110", "00000", "00000"],
  "°": ["01100", "10010", "01100", "00000", "00000", "00000", "00000"],
  "€": ["00111", "01000", "11110", "01000", "11110", "01000", "00111"],
  "▼": ["00000", "11111", "01110", "00100", "00000", "00000", "00000"],
  "▲": ["00000", "00000", "00100", "01110", "11111", "00000", "00000"],
  "→": ["00000", "00100", "00010", "11111", "00010", "00100", "00000"],
  "←": ["00000", "00100", "01000", "11111", "01000", "00100", "00000"],
  "↑": ["00100", "01110", "10101", "00100", "00100", "00100", "00000"],
  "↓": ["00100", "00100", "00100", "10101", "01110", "00100", "00000"],
  "×": ["00000", "10001", "01010", "00100", "01010", "10001", "00000"],
  // Simboli speciali arcade, musicali e greci!
  "•": ["00000", "00000", "00100", "01110", "00100", "00000", "00000"],
  "·": ["00000", "00000", "00000", "00100", "00000", "00000", "00000"],
  "★": ["00100", "10101", "01110", "11111", "01110", "10001", "00000"],
  "▶": ["01000", "01100", "01110", "01111", "01110", "01100", "01000"],
  "◀": ["00010", "00110", "01110", "11110", "01110", "00110", "00010"],
  "✓": ["00001", "00010", "00010", "10100", "10100", "01000", "00000"],
  "✗": ["10001", "01010", "00100", "00100", "01010", "10001", "00000"],
  "♪": ["00111", "00101", "00100", "00100", "01100", "11100", "01000"],
  "Ω": ["01110", "10001", "10001", "10001", "01010", "01010", "11011"],
  "°": ["00110", "01001", "00110", "00000", "00000", "00000", "00000"],
  "²": ["01100", "00010", "00100", "01110", "00000", "00000", "00000"],
  "—": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "–": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "|": ["00100", "00100", "00100", "00100", "00100", "00100", "00100"],
  "\\": ["10000", "10000", "01000", "00100", "00010", "00001", "00001"],
  "’": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "“": ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "”": ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "…": ["00000", "00000", "00000", "00000", "00000", "00000", "10101"],
};

// Precompila ogni glifo in una lista di rettangoli orizzontali [rx, ry, rw] per rendering ultra-rapido
const COMPILED_GLYPHS = {};
for (const [ch, rows] of Object.entries(GLYPHS_5X7)) {
  const runs = [];
  for (let ry = 0; ry < rows.length; ry++) {
    const line = rows[ry];
    let rx = 0;
    while (rx < line.length) {
      if (line[rx] === "1") {
        let rw = 1;
        while (rx + rw < line.length && line[rx + rw] === "1") rw++;
        runs.push([rx, ry, rw]);
        rx += rw;
      } else {
        rx++;
      }
    }
  }
  COMPILED_GLYPHS[ch] = runs;
}

/** Larghezza reale in pixel (glifo 5px + 1px di spaziatura). */
/** Risolve un carattere nel glifo giusto: mai un "?" al posto di una lettera accentata. */
function resolveGlyph(ch) {
  if (COMPILED_GLYPHS[ch]) return COMPILED_GLYPHS[ch];
  const lower = ch.toLowerCase();
  if (COMPILED_GLYPHS[lower]) return COMPILED_GLYPHS[lower];
  const upper = ch.toUpperCase();
  if (COMPILED_GLYPHS[upper]) return COMPILED_GLYPHS[upper];
  // Accentate e lettere speciali -> lettera base senza segno diacritico
  const base = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (COMPILED_GLYPHS[base]) return COMPILED_GLYPHS[base];
  if (COMPILED_GLYPHS[base.toUpperCase()]) return COMPILED_GLYPHS[base.toUpperCase()];
  if (COMPILED_GLYPHS[base.toLowerCase()]) return COMPILED_GLYPHS[base.toLowerCase()];
  return COMPILED_GLYPHS["?"];
}

export function measurePixelText(text, scale = 1) {
  const str = String(text ?? "");
  if (!str.length) return 0;
  return (str.length * 6 - 1) * scale;
}

/**
 * Manda a capo il testo in base ai pixel disponibili.
 * `hyphenate = true` spezza anche le parole troppo lunghe per la riga
 * (così niente più testo tagliato fuori dal pannello).
 */
export function wrapPixelText(text, maxWidthPx, scale = 1, hyphenate = true) {
  const limit = Math.max(6 * scale, Math.floor(maxWidthPx));
  const maxChars = Math.max(1, Math.floor((limit + scale) / (6 * scale)));
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";

  const pushWord = (w) => {
    if (!w) return;
    const test = cur ? `${cur} ${w}` : w;
    if (measurePixelText(test, scale) <= limit) {
      cur = test;
      return;
    }
    if (cur) {
      lines.push(cur);
      cur = "";
    }
    let rest = w;
    while (rest.length > maxChars) {
      if (!hyphenate) break;
      lines.push(`${rest.slice(0, maxChars - 1)}-`);
      rest = rest.slice(maxChars - 1);
    }
    cur = rest;
  };

  for (const w of words) pushWord(w);
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

/**
 * Testo con "coda" centrata: restituisce le righe che ci stanno davvero
 * nell'altezza disponibile, senza mai lasciare metà pannello vuoto.
 */
export function fitPixelText(text, maxWidthPx, maxLines, scale = 1) {
  const lines = wrapPixelText(text, maxWidthPx, scale, true);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  const lastIdx = kept.length - 1;
  const lastMax = Math.max(6 * scale, Math.floor(maxWidthPx));
  const budget = Math.max(1, Math.floor((lastMax + scale) / (6 * scale)));
  let last = kept[lastIdx];
  if (last.length > budget - 1) last = last.slice(0, budget - 1);
  kept[lastIdx] = `${last.replace(/[\s,-]+$/, "")}…`;
  return kept;
}

/** Riduce automaticamente la scala finché il testo entra nello spazio dato. */
export function autoScaleFor(text, maxWidthPx, baseScale = 1, minScale = 1) {
  let scale = baseScale;
  while (scale > minScale && wrapPixelText(text, maxWidthPx / scale, 1, false).length > 1) {
    scale -= 1;
  }
  return Math.max(minScale, scale);
}

/** true se il carattere ha un glifo proprio o risolvibile (accenti comprese). */
/** Vero solo se il carattere ha davvero un glifo disegnabile (niente quadratini vuoti). */
export function glyphAvailable(ch) {
  if (!ch || ch === " ") return true;
  if (COMPILED_GLYPHS[ch]) return true;
  const lower = ch.toLowerCase();
  const upper = ch.toUpperCase();
  const base = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return !!(
    COMPILED_GLYPHS[lower] ||
    COMPILED_GLYPHS[upper] ||
    (base !== ch && (COMPILED_GLYPHS[base] || COMPILED_GLYPHS[base.toUpperCase()]))
  );
}

/** Elenca i caratteri di un testo che il font non sa disegnare (usato dai QA). */
export function missingGlyphs(text) {
  const out = new Set();
  for (const ch of text) if (!glyphAvailable(ch)) out.add(ch);
  return [...out];
}

/**
 * Disegna testo bitmap 8-bit nitidissimo al pixel (coordinate top-left x, y).
 */
export function drawPixelText(ctx, text, x, y, color = "#f8fafc", scale = 1, shadowColor = "#090d1a") {
  const str = String(text ?? "");
  if (!str) return;
  const ix = Math.round(x);
  const iy = Math.round(y);
  const step = 6 * scale;

  if (shadowColor) {
    ctx.fillStyle = shadowColor;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      const runs = resolveGlyph(ch);
      const gx = ix + i * step + 1;
      const gy = iy + 1;
      for (let r = 0; r < runs.length; r++) {
        const [rx, ry, rw] = runs[r];
        ctx.fillRect(gx + rx * scale, gy + ry * scale, rw * scale, scale);
      }
    }
  }

  ctx.fillStyle = color;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const runs = resolveGlyph(ch);
    const gx = ix + i * step;
    for (let r = 0; r < runs.length; r++) {
      const [rx, ry, rw] = runs[r];
      ctx.fillRect(gx + rx * scale, iy + ry * scale, rw * scale, scale);
    }
  }
}

export function drawPixelTextCentered(ctx, text, centerX, y, color = "#f8fafc", scale = 1, shadowColor = "#090d1a") {
  const w = measurePixelText(text, scale);
  drawPixelText(ctx, text, Math.round(centerX - w / 2), y, color, scale, shadowColor);
}

/**
 * Disegna una cornice arcade pixel-art a doppio bordo smussato 8-bit!
 */
export function drawPixelPanel(ctx, x, y, w, h, bg = "rgba(11, 17, 32, 0.94)", border = "#ffd147", inner = "#1e293b") {
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.round(w);
  const rh = Math.round(h);
  // Ombra solida pixel
  ctx.fillStyle = "rgba(4, 7, 15, 0.78)";
  ctx.fillRect(rx + 3, ry + 3, rw, rh);
  // Bordo esterno
  ctx.fillStyle = "#090d1a";
  ctx.fillRect(rx, ry, rw, rh);
  ctx.fillStyle = border;
  ctx.fillRect(rx + 1, ry + 1, rw - 2, rh - 2);
  // Bordo interno + sfondo
  ctx.fillStyle = inner;
  ctx.fillRect(rx + 3, ry + 3, rw - 6, rh - 6);
  ctx.fillStyle = bg;
  ctx.fillRect(rx + 4, ry + 4, rw - 8, rh - 8);
  // Rivetti angolari 8-bit
  ctx.fillStyle = border;
  ctx.fillRect(rx + 3, ry + 3, 2, 2);
  ctx.fillRect(rx + rw - 5, ry + 3, 2, 2);
  ctx.fillRect(rx + 3, ry + rh - 5, 2, 2);
  ctx.fillRect(rx + rw - 5, ry + rh - 5, 2, 2);
}
