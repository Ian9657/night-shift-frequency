// Company in the night: what the clerk has heard on the radio, and how the people at
// the counter notice it. Someone whose frequency the clerk listened to says so when
// they come in; after a song on Night Ferry, the next customer is humming it.
// Listening changes what people say, never a record.
(function (root) {
  'use strict';
  const { story, radio, outside } = root.NSF;
  const heard = new Set();                 // people ('walt') and songs ('song:slowTide') heard
  let hummed = false;

  radio.setListener(view => {
    // June reading the clerk's text or answering their call: the window across the bay answers.
    if ([...story.messages.presets.map(p => p.onAir), ...story.messages.calls.map(c => c.reply)].includes(view.key)) outside.answer();
    if (view.song) heard.add('song:' + view.song);
    if (view.kind === 'signal' && view.key !== 'radio.static') {
      const signal = story.tonight.signals.find(s => s.freq === view.freq);
      if (signal) heard.add(signal.person);
    }
  });

  // Lines a customer says before their own as they reach the counter.
  function greeting(order) {
    if (order.mismatch) return [];
    const known = story.tonight.stayed[order.customer];
    if (known && heard.has(order.customer)) return [known];
    if (!hummed && [...heard].some(h => h.startsWith('song:'))) {
      hummed = true;
      return ['say.hum'];
    }
    return [];
  }

  root.NSF.company = { greeting, heard: id => heard.has(id) };
})(globalThis);
