// What the radio carries tonight: Night Ferry's schedule on 87.6 and what the
// neighbouring frequency reads back on 87.7. The checkout reports the shift's
// progress; this module decides what is on air.
(function (root) {
  'use strict';
  const { radio, story, messages, signin } = root.NSF;
  let game = null;

  // 87.7 reads the register's records back from the other side.
  function echo() {
    const { state, shift, orders } = game;
    const i = state.eventIndex;
    if (state.phase !== 'shift' && state.phase !== 'report') return { key: 'radio.static' };
    if (i < 4) return { key: i >= 2 ? 'radio.staticReg' : 'radio.static' };
    const first = shift.decisionFor(orders[4].id);
    if (!first) return { key: 'radio.echoRecord', vars: { time: orders[4].clock, label: '@item.spareKey' } };
    if (i === 7 && !shift.decisionFor(orders[7].id)) return { key: 'radio.echoDoor' };
    // It reads back the record you did not save.
    const kept = first.decision === 'keep';
    return { key: 'radio.echoOpposite', vars: { label: kept ? '@item.cola' : '@item.spareKey', origin: kept ? '@origin.MANUAL' : '@origin.REGISTER' } };
  }

  // Between the stations: someone's frequency, once the night has reached them, each
  // line in turn; before that, static.
  const heard = new Map();
  function signal(freq) {
    const s = story.radio.signals.find(entry => entry.freq === freq);
    const live = ['shift', 'report', 'ending'].includes(game.state.phase);
    if (!s || !live || game.state.eventIndex < s.from) return null;
    const n = heard.get(freq) || 0;
    heard.set(freq, n + 1);
    return { key: s.lines[n % s.lines.length] };
  }

  root.NSF.broadcast = {
    attach(controller) {
      game = controller;
      radio.setEchoProvider(echo);
      radio.setSignalProvider(signal);
    },
    shiftStarted() { radio.play([...story.radio.intro, ...story.radio.orders[0]]); },
    // A text the clerk sent is read before the segment.
    orderStarted(index) { radio.play([messages.takeOnAir(index, signin.name), ...story.radio.orders[index]].filter(Boolean)); },
    // The closing letter and sign-off on 87.6: `done` resolves once they have been
    // heard; `duration` is how long they take on air.
    shiftClosed(ending) {
      if (radio.view.kind !== 'ferry') radio.tune('87.6');
      const text = messages.takeOnAir(game.state.eventIndex, signin.name);
      const keys = [...story.radio.endings[ending], story.radio.signoff];
      return { done: radio.play([text, ...keys].filter(Boolean)), duration: radio.duration(keys) + (text ? radio.duration([text]) : 0) };
    },
    offAir() { radio.signOff(); },
  };
})(globalThis);
