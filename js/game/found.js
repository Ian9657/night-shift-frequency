// Lost and found: what people leave behind in the night, in the box under the
// counter. Its contents derive from how far the shift has got and who has been in;
// clicking the box shows them close up and pauses the shift, like the phone.
(function (root) {
  'use strict';
  const { story, time, audio } = root.NSF;
  const view = { open: false };
  let game = null, lastCount = 0;

  // An item is in the box once the order it arrives with has begun (`at`), or once the
  // person it belongs to (`after`) has left the counter.
  function items() {
    if (!game || game.state.phase === 'title' || game.state.phase === 'signin') return [];
    const { state, orders } = game;
    const left = index => state.eventIndex > index || (state.eventIndex === index && state.bagged);
    return story.found.filter(item => {
      if (item.at !== undefined) return state.eventIndex >= item.at;
      const index = orders.findIndex(o => o.customer === item.after);
      return index >= 0 && left(index);
    });
  }

  // Something new in the box: a soft drop.
  function update() {
    const count = items().length;
    if (count > lastCount) audio.boxDrop();
    lastCount = count;
  }

  function open() {
    if (view.open) return;
    view.open = true;
    time.paused = true;
    audio.boxDrop();
  }
  function close() {
    if (!view.open) return;
    view.open = false;
    time.paused = false;
  }

  root.NSF.found = {
    view, items, update, open, close,
    attach(controller) { game = controller; lastCount = 0; },
    key(name) {
      if (!view.open) return false;
      if (name === 'Escape' || name === 'Enter' || name === ' ') close();
      return true;
    },
  };
})(globalThis);
