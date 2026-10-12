// The counter radio, tuned along the bottom of the FM band. 87.6 plays Night
// Ferry's scheduled segments; 87.7 picks up the neighbouring frequency, which reads
// the register's records back with a different history; between them lie faint
// signals and static. Frequencies are in hundredths of a megahertz. Captions are
// string keys resolved at draw time.
(function (root) {
  'use strict';
  const { time, audio, strings, story, night, overlay, voice } = root.NSF;
  const BAND = story.radio.band;
  const label = freq => (freq % 10 ? (freq / 100).toFixed(2) : (freq / 100).toFixed(1));
  // Night Ferry's stings before a segment's first line: the ident, or on the hour the
  // time signal. The line waits for them.
  const STING_MS = { ident: 900, pips: 3600 };
  // A transmitter comes in over a window either side of its frequency: clear on it,
  // fainter and noisier a step or two off, gone three hundredths away.
  const WINDOW = 3;

  // `kind`: 'ferry' (87.6), 'echo' (87.7), 'signal' (someone's frequency) or 'static'.
  // `target` is the transmitter in range and `clarity` (0–1) how cleanly it comes in.
  const view = {
    freq: BAND.ferry, station: label(BAND.ferry), kind: 'ferry', target: BAND.ferry, clarity: 1, song: null,
    key: null, vars: {}, startedAt: 0, duration: 0, echo: false, offAir: false, dialOpen: false,
  };
  // Queued Night Ferry entries: { key, vars } or { song }; `keep` marks the clerk's own
  // moments on air (their text read out, the song it asked for, their call), which a
  // new order's segment never discards. `current` is the entry on air.
  let queue = [];
  let current = null;
  // A line interrupted by tuning away resumes with its remaining time when the
  // player returns to Night Ferry; it must not be queued as a fresh announcement.
  let resumeLine = null;
  let lineTimer = null;
  let echoProvider = () => null;
  let signalProvider = () => null;
  let listener = () => {};
  let finished = [];
  // Songs are a short interlude so an order never waits on a full arrangement: as many
  // whole bars as fit in 15 s. The synth is stopped by the next line.
  const songLength = id => {
    const song = story.radio.songs[id], bar = 4 * 60000 / song.tempo;
    return Math.min(song.chords.length, Math.max(1, Math.floor(15000 / bar))) * bar;
  };
  // Queue entries are copies: a song entry notes once its `intro` line has been said.
  const entry = line => (typeof line === 'string' ? { key: line, vars: {} } : { ...line });

  // A recorded line lasts as long as its recording, plus a beat; otherwise long enough to
  // read the caption.
  function lineDuration(key, vars) {
    const recorded = voice.length(key);
    if (recorded) return recorded + 900;
    return Math.max(2600, strings.t(key, vars).length * 52 + 1200);
  }

  // What is heard now: a line, a song (`song` its id) or nothing. Everything heard is
  // reported to the listener (js/game/company.js).
  function show(key, vars = {}, song = null, sting = null, durationOverride = null, audioOffset = 0) {
    if (view.song && !song) audio.stopSong();
    voice.stop();
    const delay = sting ? STING_MS[sting] : 0;
    if (sting) audio.radioSting(sting);
    view.key = key;
    view.vars = vars;
    view.song = song;
    view.echo = view.kind === 'echo';
    view.startedAt = time.now;
    view.duration = durationOverride ?? (song ? songLength(song) : key ? lineDuration(key, vars) + delay : 0);
    if (song) audio.playSong(story.radio.songs[song]);
    else if (key && key !== 'radio.static') voice.speak(key, vars, view.kind, view.duration - delay - 600, delay, audioOffset);
    if (key) listener(view);
    bed();
  }

  // Night Ferry's music bed: under June's talk and between items, not under songs, and
  // not while the shift is paused or the station is off the air.
  function bed() {
    audio.stationBed(view.kind === 'ferry' && !view.offAir && !view.song && !held && (Boolean(view.key) || queue.length > 0));
  }

  // The background hiss and hum for what the dial is on and how cleanly.
  function tuneBed() {
    audio.radioStation(view.offAir && view.kind === 'ferry' ? 'static' : view.kind, night.progress(), view.clarity);
  }

  // Off Night Ferry, a provider says what is on this frequency now; static repeats.
  function other() {
    const line = view.kind === 'echo' ? echoProvider() : view.kind === 'signal' ? signalProvider(view.target) : null;
    show(line?.key || 'radio.static', line?.vars);
    lineTimer = time.after(view.duration + (line ? 2400 : 1500), advance);
  }

  function advance() {
    time.cancel(lineTimer);
    lineTimer = null;
    if (view.kind !== 'ferry' || view.offAir) return other();
    const next = resumeLine || queue.shift();
    resumeLine = null;
    current = next || null;
    if (!next) {
      show(null);
      const callbacks = finished;
      finished = [];
      callbacks.forEach(fn => fn());
      return;
    }
    // A song with an `intro` is announced first; the two go (or are dropped) together.
    if (next.resume) {
      current = next;
      show(next.key, next.vars, null, null, next.remaining, next.offset);
    } else if (next.song && next.intro && !next.introSaid) {
      next.introSaid = true;
      queue.unshift(next);
      show(next.intro, {});
    } else if (next.song) show('radio.song', { title: '@' + story.radio.songs[next.song].title }, next.song);
    else show(next.key, next.vars, null, next.pips ? 'pips' : next.ident ? 'ident' : null);
    lineTimer = time.after(view.duration, advance);
  }

  // Queue Night Ferry lines (string keys, { key, vars } or { song }); resolves when
  // they have all been heard on 87.6.
  function play(lines) {
    queue.push(...lines.map(entry));
    const done = new Promise(resolve => finished.push(resolve));
    if (view.kind === 'ferry' && !lineTimer) advance();
    return done;
  }

  // A new order's segment follows what is left of the last one, and whatever is on air
  // (a line or a song) finishes, so the radio keeps up with the counter without cutting
  // June off. Older leftovers are let go, and so are songs that haven't started, each with
  // its intro; a night's segments run longer than a quick clerk's night. Never let go: the
  // clerk's own moments (`keep`), the record orders' lines (`story`) and the lines that
  // tell the clerk what they can do (the night's `mustHear`). They also go first, in that
  // order, ahead of ordinary lines, right after what is on air; within a rank lines keep
  // their order. On another frequency the queue just waits for the clerk to tune back.
  // The segment's first line gets the station's ident, or `pips` on the hour.
  let segment = 0;
  function beginOrder(lines, { onTime = false, pips = false } = {}) {
    segment += 1;
    const kept = queue.filter(line => line.keep);
    const carried = queue.filter(line => !line.keep && !line.song && (line.story || line.must || line.segment === segment - 1));
    // An on-time segment carries the story (the key's message): it is never let go.
    const fresh = lines.map(line => {
      const e = entry(line);
      return { ...e, segment, ...(onTime ? { story: true } : {}), ...(story.tonight.mustHear.includes(e.key) ? { must: true } : {}) };
    });
    const first = fresh.find(line => line.key);
    if (first) first[pips ? 'pips' : 'ident'] = true;
    const rank = line => (line.keep ? 0 : line.story ? 1 : line.must ? 2 : 3);
    queue = [...kept, ...carried, ...fresh].map((line, i) => [rank(line), i, line]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
    if (view.kind !== 'ferry' || view.offAir || current?.keep) return;
    if (view.key) return;                                          // let what is on air finish
    time.cancel(lineTimer);
    lineTimer = null;
    advance();
  }

  // Before the closing letter: what is left of the night's segments is let go, except the
  // clerk's own moments, the story's lines and what the clerk must hear, which come first.
  function clearSegments() {
    queue = queue.filter(line => line.keep || line.story || line.must);
  }

  // While the phone, records or lost and found are open the shift is paused: Night
  // Ferry goes quiet. A song in progress is let go, unless the clerk asked for it, in
  // which case it starts again from the top afterwards.
  let held = false;
  function hold() {
    if (held) return;
    held = true;
    audio.radioHeld = true;
    voice.stop();
    bed();
    if (view.song) {
      if (current?.keep) queue.unshift(current);
      time.cancel(lineTimer);
      lineTimer = null;
      show(null);
    }
  }
  function release() {
    if (!held) return;
    held = false;
    audio.radioHeld = false;
    bed();
    if (!lineTimer) advance();
    // A line interrupted by the pause goes on speaking for the time it has left.
    else if (view.key && !view.song && view.key !== 'radio.static') {
      const elapsed = time.now - view.startedAt;
      voice.speak(view.key, view.vars, view.kind, view.duration - elapsed - 600, 0, elapsed / 1000);
    }
  }

  // What the dial picks up at `freq`: the nearest transmitter within the window.
  function reception(freq) {
    const transmitters = [[BAND.ferry, 'ferry'], [BAND.echo, 'echo'], ...story.tonight.signals.map(s => [s.freq, 'signal'])];
    let best = { kind: 'static', target: null, clarity: 0 };
    for (const [at, kind] of transmitters) {
      const clarity = 1 - Math.abs(freq - at) / WINDOW;
      if (clarity > best.clarity) best = { kind, target: at, clarity };
    }
    return best;
  }

  // Turn the dial to `freq`: to the band's steps (the step keys), or, `fine`, to the
  // hundredth (dragging the needle). Moving within the same transmitter's window only
  // changes how cleanly it comes in; crossing to another starts what is on there.
  function setFrequency(freq, { fine = false } = {}) {
    const grain = fine ? 1 : BAND.step;
    const next = Math.max(BAND.low, Math.min(BAND.high, Math.round(freq / grain) * grain));
    if (next === view.freq) return;
    const heard = reception(next);
    if (heard.kind === view.kind && heard.target === view.target) {
      Object.assign(view, { freq: next, station: label(next), clarity: heard.clarity });
      audio.radioTune(true);
      tuneBed();
      return;
    }
    // The current Night Ferry line (or song, from the top) is replayed when the player
    // tunes back.
    // (A song cut during its intro is announced again.)
    if (view.kind === 'ferry' && view.key && !view.offAir) {
      if (view.song) {
        queue.unshift(current ? { ...current, introSaid: Boolean(current.song && view.song) } : { song: view.song });
      } else {
        const elapsed = Math.max(0, time.now - view.startedAt);
        resumeLine = { ...(current || {}), key: view.key, vars: view.vars, remaining: Math.max(0, view.duration - elapsed), offset: elapsed / 1000, resume: true };
      }
    }
    Object.assign(view, { freq: next, station: label(next), kind: heard.kind, target: heard.target, clarity: heard.clarity });
    audio.radioTune();
    tuneBed();
    show(null);
    time.cancel(lineTimer);
    lineTimer = time.after(300, advance);
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
    tuneBed();
    time.cancel(lineTimer);
    other();
  }

  // The step keys move to the next detent of the band (from 87.63, up is 87.65).
  function step(direction) {
    const detent = direction > 0 ? Math.floor(view.freq / BAND.step) + 1 : Math.ceil(view.freq / BAND.step) - 1;
    setFrequency(detent * BAND.step);
  }

  // Two fingers on a trackpad (or a mouse wheel) over the radio turn the dial: about
  // SCROLL.step pixels of travel a hundredth, so a slow slide tunes finely and a swipe
  // sweeps the band. Landing on a transmitter catches the dial there: the rest of that
  // gesture (a trackpad's glide after the fingers lift) is absorbed, and leaving it takes a
  // longer pull. A pause of SCROLL.idle ms ends a gesture.
  const SCROLL = { step: 28, hold: 150, idle: 260 };
  const scrolling = { travel: 0, at: -Infinity, caught: false };
  function scroll(amount) {
    if (time.uiNow - scrolling.at > SCROLL.idle) Object.assign(scrolling, { travel: 0, caught: false });
    scrolling.at = time.uiNow;
    if (scrolling.caught) return;
    scrolling.travel += amount;
    for (;;) {
      const direction = Math.sign(scrolling.travel), need = reception(view.freq).clarity === 1 ? SCROLL.hold : SCROLL.step;
      if (!direction || Math.abs(scrolling.travel) < need) return;
      const before = view.freq;
      scrolling.travel -= direction * need;
      setFrequency(view.freq + direction, { fine: true });
      if (view.freq === before) { scrolling.travel = 0; return; }            // the end of the band
      if (reception(view.freq).clarity === 1) { scrolling.caught = true; scrolling.travel = 0; return; }
    }
  }

  function closeDial() { view.dialOpen = false; overlay.close('radio'); }

  root.NSF.radio = {
    view, band: BAND, label, play, beginOrder, clearSegments, hold, release, tune, setFrequency, skip, signOff,
    step, scroll,
    openDial() {
      if (view.dialOpen) return closeDial();
      if (!overlay.open('radio', { pause: false })) return;
      view.dialOpen = true;
      audio.phoneKey();
    },
    closeDial,
    // Arrow keys tune while the dial is open; Escape puts it away.
    key(name) {
      if (!view.dialOpen) return false;
      if (name === 'ArrowLeft' || name === 'ArrowRight') step(name === 'ArrowLeft' ? -1 : 1);
      else if (name === 'Escape') closeDial();
      else return false;
      return true;
    },
    setEchoProvider(fn) { echoProvider = fn; },
    setSignalProvider(fn) { signalProvider = fn; },
    setListener(fn) { listener = fn; },
    // How long a run of Night Ferry lines takes on air.
    duration: lines => lines.reduce((sum, line) => sum + (typeof line === 'string' ? lineDuration(line)
      : line.song ? songLength(line.song) + (line.intro ? lineDuration(line.intro) : 0) : lineDuration(line.key, line.vars)), 0),
    // Off the centre of a transmitter, some of what is said is lost in the noise: the
    // same letters each time for a line and a clarity, so it doesn't shimmer.
    caption() {
      if (!view.key) return '';
      const text = strings.t(view.key, view.vars);
      if (view.clarity >= 1 || view.key === 'radio.static') return text;
      const lost = (1 - view.clarity) * 0.85;
      return [...text].map((ch, i) => (ch !== ' ' && ((i * 2654435761 + view.key.length * 97) >>> 0) % 1000 / 1000 < lost ? '·' : ch)).join('');
    },
    // Fraction of the caption revealed, for a slow typewriter; a song's title shows at once.
    progress() {
      if (!view.key) return 0;
      return view.song ? 1 : Math.min(1, (time.now - view.startedAt) / Math.max(1, view.duration * 0.55));
    },
  };
})(globalThis);
