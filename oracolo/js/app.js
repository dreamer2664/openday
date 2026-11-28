/* Un solo ciclo controllato: domanda → attesa → parlato → nuova domanda.
 * Nessun dato della domanda viene salvato, inviato o usato dal sorteggio. */
'use strict';

(() => {
  const byId = (id) => document.getElementById(id);
  const cabinet = byId('cabinet');
  const field = byId('domanda');
  const panel = byId('oraclePanel');
  const form = byId('stateAsk');
  const consultView = byId('stateConsult');
  const answerView = byId('stateAnswer');
  const consultButton = byId('btnConsult');
  const againButton = byId('btnAgain');
  const responseText = byId('responseText');
  const responseBox = byId('responseBox');
  const announcer = byId('announcer');
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const pizia = new PiziaSprite(byId('pythiaCanvas'), motionQuery.matches);
  const scene = new SantuarioScena({ stars: byId('stars'), landscape: byId('landscape'), fx: byId('fx'), reducedMotion: motionQuery.matches });
  const timers = new Set();
  let phase = 'ask';
  let currentQuestion = '';
  let utilityTimer = null;

  function later(callback, delay) {
    const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
    timers.add(timer);
    return timer;
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers.clear();
  }

  function setPhase(next) {
    phase = next;
    cabinet.dataset.state = next;
    form.hidden = next !== 'ask';
    consultView.hidden = next !== 'consulting';
    answerView.hidden = !['speaking', 'answered', 'safety'].includes(next);
    panel.setAttribute('aria-busy', String(['consulting', 'speaking'].includes(next)));
    OracoloAudio.setDucked(['consulting', 'speaking', 'safety'].includes(next));
  }

  function clearWarning() {
    byId('emptyWarn').hidden = true;
    byId('keyboardHint').hidden = false;
    byId('questionWrap').classList.remove('invalid');
    field.removeAttribute('aria-invalid');
  }

  function updateField() {
    // maxlength fa già il lavoro; il taglio protegge anche da input programmatici.
    if (field.value.length > 140) field.value = field.value.slice(0, 140).replace(/[\uD800-\uDBFF]$/, '');
    byId('charCount').textContent = `${field.value.length} / 140`;
    byId('charCount').classList.toggle('at-limit', field.value.length >= 140);
    field.style.height = '48px';
    field.style.height = `${Math.min(128, Math.max(48, field.scrollHeight))}px`;
    if (field.value.trim()) clearWarning();
  }

  function focusSceneOnMobile() {
    if (window.innerWidth > 640) return;
    field.blur();
    // Lascia prima chiudere la tastiera virtuale: Pizia e tavoletta tornano nella scena.
    later(() => {
      const top = byId('santuario').getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, top - 10), behavior: motionQuery.matches ? 'instant' : 'smooth' });
    }, 140);
  }

  function finishSpeech(text) {
    responseText.textContent = text;
    byId('caret').hidden = true;
    pizia.setState('idle');
    scene.setMode('idle');
    setPhase('answered');
    byId('pythiaCaption').textContent = 'Il destino ha lasciato un segno';
    byId('sceneStatus').textContent = 'IL RESPONSO È STATO RIVELATO';
    againButton.hidden = false;
    againButton.disabled = false;
    announcer.textContent = `Il responso: ${text}`;
    againButton.focus({ preventScroll: true });
  }

  function reveal(text) {
    setPhase('speaking');
    byId('pythiaCaption').textContent = 'Ascolta il suo responso';
    byId('sceneStatus').textContent = 'LA PIZIA STA PARLANDO';
    responseText.textContent = text;
    byId('caret').hidden = false;
    // Riserva lo spazio dell'intera frase prima della prima lettera: niente salti.
    responseBox.style.minHeight = `${responseBox.getBoundingClientRect().height}px`;
    responseText.textContent = '';
    pizia.setState('speaking');
    scene.setMode('speaking');
    OracoloAudio.play('reveal');
    if (motionQuery.matches) { finishSpeech(text); return; }
    const letters = Array.from(text);
    const mouths = [1, 2, 1, 0, 2, 1];
    let position = 0;

    function typeLetter() {
      if (phase !== 'speaking') return;
      if (motionQuery.matches || position >= letters.length) { finishSpeech(text); return; }
      const character = letters[position++];
      responseText.textContent = letters.slice(0, position).join('');
      const isLetter = /[a-zà-ÿ0-9]/i.test(character);
      pizia.setMouth(isLetter ? mouths[position % mouths.length] : 0);
      const delay = /[.!?;:]/.test(character) ? 125 : character === ',' ? 85 : character === ' ' ? 24 : 37;
      later(typeLetter, delay);
    }
    typeLetter();
  }

  function showSafety() {
    setPhase('safety');
    pizia.setState('idle');
    scene.setMode('idle');
    byId('answerLabel').textContent = 'UNA NOTA IMPORTANTE';
    responseText.textContent = ORACOLO_SAFETY_RESPONSE;
    byId('caret').hidden = true;
    byId('safetyNote').hidden = false;
    byId('answerFootnote').hidden = true;
    byId('pythiaCaption').textContent = 'Qui, la saggezza è chiedere aiuto';
    byId('sceneStatus').textContent = 'LE PERSONE, PRIMA DEI PRESAGI';
    againButton.hidden = false;
    againButton.disabled = false;
    announcer.textContent = `${ORACOLO_SAFETY_RESPONSE} ${byId('safetyNote').textContent}`;
    againButton.focus({ preventScroll: true });
  }

  function consult(event) {
    event.preventDefault();
    if (phase !== 'ask') return;
    updateField();
    currentQuestion = field.value.trim().replace(/\s+/g, ' ');
    if (!currentQuestion) {
      byId('emptyWarn').hidden = false;
      byId('keyboardHint').hidden = true;
      byId('questionWrap').classList.add('invalid');
      field.setAttribute('aria-invalid', 'true');
      OracoloAudio.play('empty');
      field.focus({ preventScroll: true });
      return;
    }
    clearWarning();
    consultButton.disabled = true;
    field.disabled = true;
    panel.style.minHeight = `${panel.getBoundingClientRect().height}px`;
    panel.style.setProperty('--state-height', `${form.getBoundingClientRect().height}px`);
    byId('questionEcho').textContent = currentQuestion;
    byId('questionEcho2').textContent = currentQuestion;
    focusSceneOnMobile();
    if (OracoloMotore.domandaDelicata(currentQuestion)) { showSafety(); return; }
    const response = OracoloMotore.estrai();
    setPhase('consulting');
    pizia.setState('waiting');
    scene.setMode('consulting');
    byId('pythiaCaption').textContent = 'In ascolto degli dèi';
    byId('sceneStatus').textContent = 'CONSULTAZIONE IN CORSO';
    announcer.textContent = 'La Pizia si concentra. Il responso sta arrivando.';
    consultView.focus({ preventScroll: true });
    OracoloAudio.play('consult');
    later(() => reveal(response), motionQuery.matches ? 180 : 1350);
  }

  function reset() {
    if (!['answered', 'safety'].includes(phase)) return;
    clearTimers();
    currentQuestion = '';
    responseText.textContent = '';
    responseBox.style.minHeight = '';
    byId('questionEcho').textContent = '';
    byId('questionEcho2').textContent = '';
    byId('answerLabel').textContent = "L'ORACOLO HA PARLATO";
    byId('answerFootnote').hidden = false;
    byId('safetyNote').hidden = true;
    byId('caret').hidden = true;
    againButton.hidden = true;
    againButton.disabled = true;
    field.disabled = false;
    field.value = '';
    consultButton.disabled = false;
    panel.style.minHeight = '';
    panel.style.removeProperty('--state-height');
    clearWarning();
    setPhase('ask');
    updateField();
    pizia.setState('idle');
    scene.setMode('idle');
    byId('pythiaCaption').textContent = 'Custode dei responsi';
    byId('sceneStatus').textContent = 'IN ATTESA DI UNA DOMANDA';
    announcer.textContent = 'Puoi porre una nuova domanda.';
    OracoloAudio.play('reset');
    field.focus({ preventScroll: true });
    if (window.innerWidth <= 640) field.scrollIntoView({ block: 'center', behavior: motionQuery.matches ? 'instant' : 'smooth' });
  }

  function notice(message) {
    clearTimeout(utilityTimer);
    byId('utilityNotice').textContent = message;
    byId('utilityNotice').hidden = false;
    utilityTimer = setTimeout(() => { byId('utilityNotice').hidden = true; }, 4500);
  }

  form.addEventListener('submit', consult);
  field.addEventListener('input', updateField);
  field.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      if (phase === 'ask') form.requestSubmit();
    }
  });
  againButton.addEventListener('click', reset);

  byId('btnSound').addEventListener('click', async () => {
    const button = byId('btnSound');
    const desired = !OracoloAudio.enabled;
    button.disabled = true;
    const enabled = await OracoloAudio.setEnabled(desired);
    button.disabled = false;
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Disattiva gli effetti sonori' : 'Attiva gli effetti sonori');
    byId('soundState').textContent = enabled ? 'ON' : 'OFF';
    if (enabled) OracoloAudio.play('enable');
    else if (desired) notice("L'audio non è disponibile in questo browser. Puoi continuare senza suoni.");
  });

  byId('btnMusic').addEventListener('click', async () => {
    const button = byId('btnMusic');
    const desired = !OracoloAudio.musicEnabled;
    button.disabled = true;
    const enabled = await OracoloAudio.setMusicEnabled(desired);
    button.disabled = false;
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Disattiva la musica' : 'Attiva la musica');
    byId('musicState').textContent = enabled ? 'ON' : 'OFF';
    cabinet.dataset.music = enabled ? 'on' : 'off';
    if (desired && !enabled) notice('La musica non è disponibile in questo browser. Il gioco funziona anche in silenzio.');
  });

  const volumeRange = byId('volumeRange');
  volumeRange.addEventListener('input', () => {
    const volume = OracoloAudio.setVolume(Number(volumeRange.value) / 100);
    byId('volumeValue').textContent = `${Math.round(volume * 100)}%`;
  });
  const audioSettings = byId('audioSettings');
  document.addEventListener('pointerdown', (event) => {
    if (audioSettings.open && !audioSettings.contains(event.target)) audioSettings.open = false;
  });
  audioSettings.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      audioSettings.open = false;
      audioSettings.querySelector('summary').focus({preventScroll: true});
    }
  });

  const fullscreenButton = byId('btnFullscreen');
  if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) fullscreenButton.hidden = true;
  fullscreenButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (_) {
      notice('Il browser non consente lo schermo intero. Puoi usare i suoi controlli di visualizzazione.');
    }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreenButton.setAttribute('aria-label', document.fullscreenElement ? 'Esci da schermo intero' : 'Attiva schermo intero');
    fullscreenButton.setAttribute('title', document.fullscreenElement ? 'Esci da schermo intero' : 'Schermo intero');
  });
  motionQuery.addEventListener('change', (event) => {
    pizia.reducedMotion = event.matches;
    scene.reducedMotion = event.matches;
    if (event.matches) scene.setMode('idle');
  });

  updateField();
  byId('caret').hidden = true;
  againButton.disabled = true;

  // file:// funziona senza server; la cache per il ricaricamento offline richiede
  // invece localhost o HTTPS, come previsto dal browser per i service worker.
  if ('serviceWorker' in navigator && ['https:', 'http:'].includes(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(() => {
        byId('offlineStatus').textContent = 'PRONTO ANCHE OFFLINE';
      }).catch(() => {
        byId('offlineStatus').textContent = '100% LOCALE';
      });
    });
  }
})();
