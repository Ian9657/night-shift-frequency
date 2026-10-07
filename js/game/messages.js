// Texts on the clerk's flip phone: what has arrived, what they sent Night Ferry, and
// what June has read out. Arrivals are derived from the shift's progress; a new one
// buzzes the phone on the counter.
(function (root) {
  'use strict';
  const { story, audio, time, night } = root.NSF;
  const M = story.messages;
  let game = null;
  const inbox = [];                         // { id, from, text, clock, read }, newest first
  let sent = null;                          // { preset, clock, readOnAir: order index or null }
  let buzzedAt = -Infinity;

  function deliver(entry) {
    if (inbox.some(m => m.id === entry.id)) return;
    inbox.unshift({ id: entry.id, from: entry.from, text: entry.text, clock: night.clock(), read: false });
    buzzedAt = time.now;
    audio.phoneBuzz();
  }

  // Due texts arrive once the shift has reached them.
  function update() {
    if (game.state.phase !== 'shift') return;
    const i = game.state.eventIndex;
    for (const entry of M.incoming) if (entry.at <= i) deliver(entry);
    if (sent?.readOnAir !== null && sent?.readOnAir !== undefined && i > sent.readOnAir) deliver(M.reply);
  }

  function send(id) {
    const preset = M.presets.find(p => p.id === id);
    if (!preset || sent) return false;
    sent = { preset, clock: night.clock(), readOnAir: null };
    audio.phoneSent();
    return true;
  }

  // June reads a sent text once, at the next segment (a request is followed by its
  // song); returns the lines for the radio, empty if there is nothing to read.
  function takeOnAir(index, name) {
    if (!sent || sent.readOnAir !== null) return [];
    sent.readOnAir = index;
    return [{ key: sent.preset.onAir, vars: { name } }, ...(sent.preset.song ? [{ song: sent.preset.song }] : [])];
  }

  root.NSF.messages = {
    attach(controller) { game = controller; },
    update, send, takeOnAir, presets: M.presets,
    inbox: () => inbox,
    get sent() { return sent; },
    unread: () => inbox.filter(m => !m.read).length,
    open(id) { const m = inbox.find(entry => entry.id === id); if (m) m.read = true; return m; },
    // The phone on the counter shakes for a moment when a text arrives.
    buzzing: () => time.now - buzzedAt < 700,
  };
})(globalThis);
