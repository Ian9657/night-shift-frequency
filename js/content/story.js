// Shift content: catalogue, ordinary customer contexts, the two authored
// record orders, the radio schedule and the four endings. Text values are
// string keys from strings.js.
(function (root) {
  'use strict';
  const catalog = Object.freeze([
    { id: 'coffee', sprite: 'coffee', label: 'item.coffee', price: 148 },
    { id: 'onigiri', sprite: 'onigiri', label: 'item.onigiri', price: 132 },
    { id: 'bento', sprite: 'bento', label: 'item.bento', price: 498, heat: true },
    { id: 'tea', sprite: 'tea', label: 'item.tea', price: 128 },
    { id: 'water', sprite: 'water', label: 'item.water', price: 120 },
    { id: 'sandwich', sprite: 'sandwich', label: 'item.sandwich', price: 298 },
    { id: 'juice', sprite: 'juice', label: 'item.juice', price: 158 },
    { id: 'cola', sprite: 'cola', label: 'item.cola', price: 180 },
    { id: 'bread', sprite: 'bread', label: 'item.bread', price: 168 },
  ]);
  const drinks = Object.freeze(['tea', 'water', 'juice', 'cola']);

  const clocks = Object.freeze(['02:12', '02:18', '02:24', '02:30', '02:41', '02:46', '02:52', '02:58']);
  const closingClock = '03:04';

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
      customer: 'wen', decisionKind: 'identity',
      lines: ['say.wen1', 'say.wen2'], exit: 'say.wenExit',
      reactions: { rescan: [{ text: 'say.wenRescan', lock: true }], secondRescan: ['say.wenSecondRescan'], confirmBeforeRescan: ['say.wenConfirmEarly'] },
      afterDecision: { keep: 'say.wenKeep', correct: 'say.wenCorrect' },
    },
    7: {
      customer: 'wenEcho', decisionKind: 'provenance',
      lines: ['say.echo1', 'say.echo2'], exit: 'say.echoExit',
      reactions: { firstScan: ['say.echoScan'], rescan: [{ text: 'say.wenRescan', lock: true }], secondRescan: ['say.wenSecondRescan'], confirmBeforeRescan: ['say.wenConfirmEarly'] },
      afterDecision: {
        'keep-linked': 'say.echoKeepLinked', 'keep-independent': 'say.echoKeepIndependent',
        'correct-linked': 'say.echoCorrectLinked', 'correct-independent': 'say.echoCorrectIndependent',
      },
    },
  });

  // FM 87.6 segments, played once per order while the radio is on that station.
  const radio = Object.freeze({
    intro: ['radio.intro1', 'radio.intro2'],
    orders: [['radio.o1'], ['radio.o2'], ['radio.o3a', 'radio.o3b'], ['radio.o4'],
      ['radio.o5a', 'radio.o5b', 'radio.o5c'], ['radio.o6a', 'radio.o6b'], ['radio.o7'], ['radio.o8a', 'radio.o8b']],
    endings: {
      'keep-linked': ['radio.endKeepLinked1', 'radio.endKeepLinked2'],
      'keep-independent': ['radio.endKeepIndependent1', 'radio.endKeepIndependent2'],
      'correct-linked': ['radio.endCorrectLinked1', 'radio.endCorrectLinked2'],
      'correct-independent': ['radio.endCorrectIndependent1', 'radio.endCorrectIndependent2'],
    },
    signoff: 'radio.signoff',
  });

  const api = { catalog, drinks, clocks, closingClock, contexts, records, radio };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.NSF = root.NSF || {}).story = api;
})(globalThis);
