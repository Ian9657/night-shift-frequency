// The time of night: what the store's clock says, how far it is toward dawn, and
// the colours of the view outside at that hour. Derived from the shift's phase and
// order; the ending's dawn runs on the game clock while Night Ferry signs off.
(function (root) {
  'use strict';
  const { story, time, sprites } = root.NSF;
  const minutes = clock => { const [h, m] = clock.split(':').map(Number); return h * 60 + m; };
  const format = total => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  const START = minutes(story.night.start), CLOSING = minutes(story.night.closing), DAWN = minutes(story.night.dawn);
  let game = null;
  const dawn = { from: 0, span: 1 };

  function clock() {
    const { phase } = game.state;
    if (phase === 'title' || phase === 'signin') return story.night.start;
    if (phase === 'shift') return game.order().clock;
    if (phase === 'report') return story.night.closing;
    if (phase === 'ending') {
      const f = Math.min(1, Math.max(0, (time.now - dawn.from) / dawn.span));
      return format(CLOSING + Math.floor((DAWN - CLOSING) * f));
    }
    return story.night.dawn;
  }

  // 0 at sign-in, 1 at dawn.
  const progress = () => (minutes(clock()) - START) / (DAWN - START);

  // The view outside, keyed by minutes after 01:00: the night deepens toward 03:30,
  // greys from 04:30 and is a cold dawn at 05:00. The street lamp and the town's
  // windows stay lit until just before five. `null` is the authored palette.
  const SKY = ['night0', 'night1', 'night2', 'night3', 'night4', 'night5', 'sea0', 'sea1', 'sea2', 'sea3', 'rain'];
  const LAMP = ['lamp0', 'lamp1', 'lamp2', 'lamp3', 'haze0', 'haze1', 'haze2'];
  const SKY_KEYS = [
    [0, null],
    [150, ['#070b16', '#0c1525', '#122035', '#1a2e4b', '#253f62', '#3a5a80', '#060f19', '#0b1b2b', '#12283e', '#1c3a50', '#5d7ea2']],
    [210, ['#121a2c', '#1b263c', '#25344f', '#34486a', '#4b6286', '#677fa0', '#0d1724', '#152536', '#1f364d', '#2f4c64', '#7a92b0']],
    [240, ['#3b4763', '#55607c', '#7a7f96', '#a8909a', '#c4a6a2', '#d9c2b2', '#283244', '#39445a', '#566078', '#878a9c', '#a3afc0']],
  ];
  const LAMP_KEYS = [
    [0, null],
    [228, null],
    [240, ['#4c5470', '#58617c', '#677088', '#7a8196', '#55607c', '#5a647f', '#616a84']],
  ];
  const hex = v => '#' + v.map(c => Math.round(c).toString(16).padStart(2, '0')).join('');
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

  function track(names, keys, at) {
    const values = keys.map(([m, list]) => [m, list || names.map(sprites.color)]);
    let i = 1;
    while (i < values.length - 1 && values[i][0] < at) i++;
    const [m0, a] = values[i - 1], [m1, b] = values[i];
    const f = Math.min(1, Math.max(0, (at - m0) / Math.max(1, m1 - m0)));
    return Object.fromEntries(names.map((name, k) => {
      const ca = rgb(a[k]), cb = rgb(b[k]);
      return [name, hex(ca.map((c, j) => c + (cb[j] - c) * f))];
    }));
  }

  // Palette slots for the back wall's view. Quantised to two minutes so the sprite
  // cache holds only a few dozen variants over the night.
  let skyCache = { at: -1, slots: null };
  function sky() {
    const at = Math.floor((minutes(clock()) - START) / 2) * 2;
    if (at !== skyCache.at) skyCache = { at, slots: at <= 0 ? null : { ...track(SKY, SKY_KEYS, at), ...track(LAMP, LAMP_KEYS, at) } };
    return skyCache.slots;
  }

  root.NSF.night = {
    attach(controller) { game = controller; },
    clock, progress, sky, minutes,
    // The ending's dawn: from the report's closing time to five over `ms` of game time.
    beginDawn(ms) { dawn.from = time.now; dawn.span = Math.max(1, ms); },
  };
})(globalThis);
