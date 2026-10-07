// Shift content: catalogue, ordinary customer contexts, the two authored record
// orders, the radio's songs and four endings, the phone's texts and calls, and each
// night of the week (`nights`; `tonight` is the one played). Text values are string
// keys from strings.js.
(function (root) {
  'use strict';
  // Prices are in cents, shown with two decimals and no currency sign: Lowtide is in no
  // particular country.
  const catalog = Object.freeze([
    { id: 'coffee', sprite: 'coffee', label: 'item.coffee', price: 148 },
    { id: 'lasagne', sprite: 'lasagne', label: 'item.lasagne', price: 498, heat: true },
    { id: 'tea', sprite: 'tea', label: 'item.tea', price: 128 },
    { id: 'water', sprite: 'water', label: 'item.water', price: 120 },
    { id: 'sandwich', sprite: 'sandwich', label: 'item.sandwich', price: 298 },
    { id: 'juice', sprite: 'juice', label: 'item.juice', price: 158 },
    { id: 'cola', sprite: 'cola', label: 'item.cola', price: 180 },
    { id: 'bread', sprite: 'bread', label: 'item.bread', price: 168 },
  ]);
  const drinks = Object.freeze(['tea', 'water', 'juice', 'cola']);


  const contexts = Object.freeze([
    { name: 'quiet', style: 'quiet', lines: [] },
    { name: 'tired', style: 'quiet', lines: [] },
    { name: 'rain', style: 'chatty', lines: ['say.rain1', 'say.rain2'], scan: 'say.rainScan', exit: 'say.rainExit' },
    { name: 'boat', style: 'brief', lines: ['say.boat1'], exit: 'say.boatExit' },
    { name: 'milk', style: 'chatty', lines: ['say.milk1'], scan: 'say.milkScan', exit: 'say.milkExit' },
    { name: 'awake', style: 'brief', lines: ['say.awake1'] },
    { name: 'radio', style: 'chatty', lines: ['say.radio1'], scan: 'say.radioScan', exit: 'say.radioExit' },
    { name: 'tower', style: 'brief', lines: ['say.tower1'], exit: 'say.towerExit' },
  ]);

  // Orders five and eight. Both put a cola on the counter that the register reads as a spare key.
  const records = Object.freeze({
    4: {
      customer: 'nell', decisionKind: 'identity',
      lines: ['say.nell1', 'say.nell2'], exit: 'say.nellExit',
      reactions: { rescan: [{ text: 'say.nellRescan', lock: true }], secondRescan: ['say.nellSecondRescan'], confirmBeforeRescan: ['say.nellConfirmEarly'] },
      afterDecision: { keep: 'say.nellKeep', correct: 'say.nellCorrect' },
    },
    7: {
      customer: 'nellStayed', decisionKind: 'provenance',
      lines: ['say.stayed1', 'say.stayed2'], exit: 'say.stayedExit',
      reactions: { firstScan: ['say.stayedScan'], rescan: [{ text: 'say.nellRescan', lock: true }], secondRescan: ['say.nellSecondRescan'], confirmBeforeRescan: ['say.nellConfirmEarly'] },
      afterDecision: {
        'keep-linked': 'say.stayedKeepLinked', 'keep-independent': 'say.stayedKeepIndependent',
        'correct-linked': 'say.stayedCorrectLinked', 'correct-independent': 'say.stayedCorrectIndependent',
      },
    },
  });

  // FM 87.6 segments, played once per order while the radio is on that station.
  const radio = Object.freeze({
    intro: ['radio.intro1', 'radio.intro2'],
    endings: {
      'keep-linked': ['radio.endKeepLinked1', 'radio.endKeepLinked2'],
      'keep-independent': ['radio.endKeepIndependent1', 'radio.endKeepIndependent2'],
      'correct-linked': ['radio.endCorrectLinked1', 'radio.endCorrectLinked2'],
      'correct-independent': ['radio.endCorrectIndependent1', 'radio.endCorrectIndependent2'],
    },
    signoff: 'radio.signoff',
    // The dial, in hundredths of a megahertz.
    band: { low: 8750, high: 8810, step: 5, ferry: 8760, echo: 8770 },
    // Songs Night Ferry plays (js/game/audio.js synthesises them): a tempo, a chord per
    // bar (MIDI notes) and a melody of [note or null, beats]. One follows order 2's
    // request for the night clerk, one a text request, one the rain easing.
    songs: {
      slowTide: {
        title: 'song.slowTide', tempo: 76,
        chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62], [60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]],
        melody: [[64, 1], [67, 1], [69, 1], [67, 1], [64, 2], [60, 1], [62, 1], [65, 1], [69, 1], [72, 1.5], [69, 0.5], [67, 3], [null, 1],
          [64, 1], [67, 1], [69, 1], [72, 1], [69, 2], [67, 1], [64, 1], [65, 1], [64, 1], [62, 1], [60, 1], [62, 2], [60, 2]],
      },
      lastFerry: {
        title: 'song.lastFerry', tempo: 68,
        chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [52, 56, 59], [57, 60, 64], [53, 57, 60], [48, 52, 55], [52, 56, 59]],
        melody: [[69, 2], [72, 1], [71, 1], [69, 2], [65, 2], [67, 1], [64, 1], [67, 1], [72, 1], [71, 3], [68, 1],
          [69, 1], [72, 1], [76, 1], [74, 1], [72, 2], [69, 2], [67, 1], [69, 1], [71, 1], [72, 1], [71, 2], [68, 1], [64, 1]],
      },
      harbourLights: {
        title: 'song.harbourLights', tempo: 84,
        chords: [[53, 57, 60], [50, 53, 57], [46, 50, 53], [48, 52, 55], [53, 57, 60], [50, 53, 57], [46, 50, 53], [48, 52, 55]],
        melody: [[69, 1], [72, 1], [77, 1], [76, 1], [74, 2], [72, 2], [74, 1], [77, 1], [74, 1], [70, 1], [72, 3], [null, 1],
          [69, 1], [72, 1], [77, 1], [79, 1], [81, 2], [77, 2], [79, 1], [77, 1], [74, 1], [70, 1], [72, 2], [65, 2]],
      },
    },
  });

  // The clerk's flip phone and Night Ferry (which texts arrive is per night, below). The
  // clerk can send one text a night; June reads it at the start of the next segment, and
  // someone who heard it writes back an order later. Once the lines are open they can
  // call in once and say one of `calls`: on air go their words, then June's reply.
  const messages = Object.freeze({
    presets: [
      { id: 'request', text: 'text.request', label: 'text.requestLabel', onAir: 'radio.textRequest', song: 'lastFerry' },
      { id: 'anyone', text: 'text.anyone', label: 'text.anyoneLabel', onAir: 'radio.textAnyone' },
      { id: 'rain', text: 'text.rain', label: 'text.rainLabel', onAir: 'radio.textRain' },
    ],
    reply: { id: 'heard', from: 'unknown', text: 'text.heard' },
    calls: [
      { id: 'hello', label: 'call.helloLabel', said: 'call.hello', reply: 'radio.replyHello' },
      { id: 'rain', label: 'call.rainLabel', said: 'call.rain', reply: 'radio.replyRain' },
      { id: 'thanks', label: 'call.thanksLabel', said: 'call.thanks', reply: 'radio.replyThanks' },
    ],
    // Before signing off June thanks the clerk by name if they texted or called.
    thanks: 'radio.thanks',
  });



  // One entry per night of the week the clerk will work; the build plays the first.
  // Everything that changes from night to night lives here: the date, the clocks, Night
  // Ferry's segments, the frequencies between the stations, the texts that arrive, who
  // stayed, what is left in lost and found and how the readings drift.
  const nights = Object.freeze([{
    // The sheet shows the nights before (`earlier`) and tonight's `date`.
    date: '10/14', earlier: ['10/09', '10/10', '10/11', '10/12', '10/13'],
    // 01:00 sign-in to 05:00 sign-out; each order's clock; the report is printed at `closing`.
    times: { start: '01:00', closing: '04:44', dawn: '05:00' },
    clocks: ['01:14', '01:42', '02:09', '02:27', '02:41', '03:23', '03:58', '04:31'],
    // Night Ferry's segment for each order: lines, and songs from radio.songs.
    segments: [['radio.o1'], ['radio.o2', { song: 'slowTide' }], ['radio.o3a', 'radio.o3b'], ['radio.o4'],
      ['radio.o5a', 'radio.o5b', 'radio.o5c'], ['radio.o6a', 'radio.o6b', 'radio.linesOpen'], ['radio.o7', { song: 'harbourLights' }], ['radio.o8a', 'radio.o8b']],
    // Faint signals between the stations that belong to people who stayed, audible from
    // the order `from` (an index) on, each cycling through its lines.
    signals: [
      { freq: 8785, from: 1, person: 'walt', lines: ['radio.taxi1', 'radio.taxi2', 'radio.taxi3'] },
      { freq: 8795, from: 2, person: 'ana', lines: ['radio.ward1', 'radio.ward2', 'radio.ward3'] },
      { freq: 8805, from: 3, person: 'hal', lines: ['radio.ferry1', 'radio.ferry2', 'radio.ferry3'] },
    ],
    // Texts that arrive when the order with index `at` begins; 'self' is the clerk's own number.
    incoming: [
      { id: 'light', at: 3, from: 'unknown', text: 'text.light' },
      { id: 'ferry', at: 5, from: 'unknown', text: 'text.ferry' },
      { id: 'home', at: 7, from: 'self', text: 'text.home' },
    ],
    // June opens the phone lines with this order's segment.
    linesOpen: 5,
    // The people who stayed who may come to the counter after three (orders 6 and 7),
    // and what they say first if the clerk has been listening to their frequency.
    stayed: { walt: 'say.heardWalt', ana: 'say.heardAna', hal: 'say.heardHal' },
    // Lost and found: the left rain boot June mentions turns up with order 4; each person
    // who stayed leaves something; the right boot is there by order 8, and nobody
    // brought it in.
    found: [
      { id: 'boot', at: 3, icon: 'boot', tag: 'found.boot' },
      { id: 'taxi', after: 'walt', icon: 'receipt', tag: 'found.taxi' },
      { id: 'band', after: 'ana', icon: 'band', tag: 'found.band' },
      { id: 'ticket', after: 'hal', icon: 'ticket', tag: 'found.ticket' },
      { id: 'bootRight', at: 7, icon: 'bootRight', tag: 'found.bootRight' },
    ],
    // Drift (js/game/drift.js): `skips` of the `skipFrom` orders lose ten minutes on the
    // wall clock; one of `ghost` flashes a count of five; `borrow` leaves with the
    // previous customer's words.
    drift: { skipFrom: [3, 5, 6], skips: 2, ghost: [5, 6], borrow: 5 },
  }]);
  const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  freeze(nights);
  const tonight = nights[0];

  const api = { catalog, drinks, contexts, records, radio, messages, nights, tonight };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.NSF = root.NSF || {}).story = api;
})(globalThis);
