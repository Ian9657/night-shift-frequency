// What the radio carries tonight: Night Ferry's schedule on 87.6 and what the
// neighbouring frequency reads back on 87.7. The checkout reports the shift's
// progress; this module decides what is on air.
(function (root) {
  'use strict';
  const { radio, story } = root.NSF;
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

  root.NSF.broadcast = {
    attach(controller) {
      game = controller;
      radio.setEchoProvider(echo);
    },
    shiftStarted() { radio.play([...story.radio.intro, ...story.radio.orders[0]]); },
    orderStarted(index) { radio.play(story.radio.orders[index]); },
    // Resolves once the closing letter and sign-off have been heard on 87.6.
    shiftClosed(ending) {
      if (radio.view.station !== '87.6') radio.tune('87.6');
      return radio.play([...story.radio.endings[ending], story.radio.signoff]);
    },
  };
})(globalThis);
