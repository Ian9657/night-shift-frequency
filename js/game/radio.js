// The counter radio, tuned along the bottom of the FM band. 87.6 plays Night
// Ferry's scheduled segments; 87.7 picks up the neighbouring frequency, which reads
// the register's records back with a different history; between them lie faint
// signals and static. Frequencies are in hundredths of a megahertz. Captions are
// string keys resolved at draw time.
(function (root) {
  'use strict';
  const { time, audio, strings, story, night, overlay } = root.NSF;
  const BAND = story.radio.band;
  const label = freq => (freq % 10 ? (freq / 100).toFixed(2) : (freq / 100).toFixed(1));

  // `kind`: 'ferry' (87.6), 'echo' (87.7), 'signal' (someone's frequency) or 'static'.
  const view = {
    freq: BAND.ferry, station: label(BAND.ferry), kind: 'ferry', song: null,
    key: null, vars: {}, startedAt: 0, duration: 0, echo: false, offAir: false, dialOpen: false,
  };
  let queue = [];
  let lineTimer = null;
  let echoProvider = () => null;
  let signalProvider = () => null;
  let listener = () => {};
  let finished = [];
  const songLength = id => { const song = story.radio.songs[id]; return song.chords.length * 4 * 60000 / song.tempo; };

  function lineDuration(key, vars) {
    return Math.max(2600, strings.t(key, vars).length * 52 + 1200);
  }

  // What is heard now: a line, a song (`song` its id) or nothing. Everything heard is
  // reported to the listener (js/game/company.js).
  function show(key, vars = {}, song = null) {
    if (view.song && !song) audio.stopSong();
    view.key = key;
    view.vars = vars;
    view.song = song;
    view.echo = view.kind === 'echo';
    view.startedAt = time.now;
    view.duration = song ? songLength(song) : key ? lineDuration(key, vars) : 0;
    if (song) audio.playSong(story.radio.songs[song]);
    else if (key && key !== 'radio.static') audio.radioVoice(Math.min(view.duration - 600, 5200), view.kind !== 'ferry');
    if (key) listener(view);
  }

  // Off Night Ferry, a provider says what is on this frequency now; static repeats.
  function other() {
    const line = view.kind === 'echo' ? echoProvider() : view.kind === 'signal' ? signalProvider(view.freq) : null;
    show(line?.key || 'radio.static', line?.vars);
    lineTimer = time.after(view.duration + (line ? 2400 : 1500), advance);
  }

  function advance() {
    time.cancel(lineTimer);
    lineTimer = null;
    if (view.kind !== 'ferry' || view.offAir) return other();
    const next = queue.shift();
    if (!next) {
      show(null);
      const callbacks = finished;
      finished = [];
      callbacks.forEach(fn => fn());
      return;
    }
    if (next.song) show('radio.song', { title: '@' + story.radio.songs[next.song].title }, next.song);
    else show(next.key, next.vars);
    lineTimer = time.after(view.duration, advance);
  }

  // Queue Night Ferry lines (string keys, { key, vars } or { song }); resolves when
  // they have all been heard on 87.6.
  function play(lines) {
    queue.push(...lines.map(line => (typeof line === 'string' ? { key: line, vars: {} } : line)));
    const done = new Promise(resolve => finished.push(resolve));
    if (view.kind === 'ferry' && !lineTimer) advance();
    return done;
  }

  // Start a fresh order segment. Anything ordinary left from the previous customer
  // is no longer relevant, so discard it and the currently playing line/song before
  // putting the new segment on air.
  function beginOrder(lines) {
    time.cancel(lineTimer);
    lineTimer = null;
    queue = [];
    if (view.key || view.song) show(null);
    queue.push(...lines.map(line => (typeof line === 'string' ? { key: line, vars: {} } : line)));
    if (view.kind === 'ferry' && !view.offAir) advance();
  }

  function kindOf(freq) {
    if (freq === BAND.ferry) return 'ferry';
    if (freq === BAND.echo) return 'echo';
    return story.tonight.signals.some(s => s.freq === freq) ? 'signal' : 'static';
  }

  // Turn the dial to `freq` (snapped to the band's steps).
  function setFrequency(freq) {
    const next = Math.max(BAND.low, Math.min(BAND.high, Math.round(freq / BAND.step) * BAND.step));
    if (next === view.freq) return;
    // The current Night Ferry line (or song, from the top) is replayed when the player
    // tunes back.
    if (view.kind === 'ferry' && view.key && !view.offAir) queue.unshift(view.song ? { song: view.song } : { key: view.key, vars: view.vars });
    view.freq = next;
    view.station = label(next);
    view.kind = kindOf(next);
    audio.radioTune();
    audio.radioStation(view.offAir && view.kind === 'ferry' ? 'static' : view.kind, night.progress());
    show(null);
    time.cancel(lineTimer);
    // The dial is a paused overlay, so a game-clock timer would never fire while
    // it is open. Start the tuned station immediately; its normal line timer then
    // resumes when the panel closes.
    advance();
  }

  // Tune straight to a station by its label ('87.6'), as the ending does.
  function tune(station) {
    setFrequency(Math.round(Number(station) * 100));
  }

  // Skip the current Night Ferry line (used when the ending is clicked through).
  function skip() {
    if (view.kind === 'ferry' && view.key && !view.offAir) advance();
  }

  // After Night Ferry signs off, 87.6 carries only static.
  function signOff() {
    view.offAir = true;
    if (view.kind !== 'ferry') return;
    audio.radioStation('static');
    time.cancel(lineTimer);
    other();
  }

  root.NSF.radio = {
    view, band: BAND, label, play, beginOrder, tune, setFrequency, skip, signOff,
    step(direction) { setFrequency(view.freq + direction * BAND.step); },
    openDial() {
      if (view.dialOpen) return closeDial();
      if (!overlay.open('radio')) return;
      view.dialOpen = true;
      audio.phoneKey();
    },
    closeDial() { view.dialOpen = false; overlay.close('radio'); },
    // Arrow keys tune while the dial is open; Escape puts it away.
    key(name) {
      if (!view.dialOpen) return false;
      if (name === 'ArrowLeft' || name === 'ArrowRight') setFrequency(view.freq + (name === 'ArrowLeft' ? -1 : 1) * BAND.step);
      else if (name === 'Escape') closeDial();
      else return false;
      return true;
    },
    setEchoProvider(fn) { echoProvider = fn; },
    setSignalProvider(fn) { signalProvider = fn; },
    setListener(fn) { listener = fn; },
    // How long a run of Night Ferry lines takes on air.
    duration: lines => lines.reduce((sum, line) => sum + (typeof line === 'string' ? lineDuration(line)
      : line.song ? songLength(line.song) : lineDuration(line.key, line.vars)), 0),
    caption() {
      if (!view.key) return '';
      return strings.t(view.key, view.vars);
    },
    // Fraction of the caption revealed, for a slow typewriter; a song's title shows at once.
    progress() {
      if (!view.key) return 0;
      return view.song ? 1 : Math.min(1, (time.now - view.startedAt) / Math.max(1, view.duration * 0.55));
    },
  };
})(globalThis);
