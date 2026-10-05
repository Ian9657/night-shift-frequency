// The POS record view: evidence for the current sale, the linked sale, paid
// history and, only after a physical re-scan, the record choices.
(function (root) {
  'use strict';
  const view = { open: false, draft: null, focus: 0 };
  let game = null;

  // Everything the panel shows, derived from the engine on each call.
  function model() {
    const { shift, state, order } = game;
    const current = order();
    const scanned = current.items.filter(item => state.scannedIds.includes(item.id));
    const full = scanned.length === current.items.length;
    const decision = shift.decisionFor(current.id);
    const checks = shift.checksFor(current.id);
    const deciding = Boolean(current.mismatch && full && !decision && checks.length);
    const prior = current.linkedOrderId ? shift.decisionFor(current.linkedOrderId) : null;
    const choices = current.decisionKind === 'identity' ? ['keep', 'correct'] : ['linked', 'independent'];
    return {
      order: current, full, decision, checks, deciding, prior,
      choices: deciding ? choices : [],
      conflicting: full && current.items.some(item => item.real && item.real !== item.pos),
      needsRescan: Boolean(current.mismatch && full && !checks.length),
      preview: deciding && view.draft ? shift.previewDecision(current.id, view.draft) : null,
      showHistory: current.decisionKind === 'provenance' || state.reportShown,
      transactions: shift.transactions.slice().reverse(),
    };
  }

  // Focusable controls in keyboard order.
  function controls() {
    const m = model();
    return [...m.choices.map(choice => ({ kind: 'choice', choice })), { kind: 'back' },
      ...(m.deciding ? [{ kind: 'save' }] : [])];
  }

  function open() {
    if (!game.canOpenRecords()) return;
    view.open = true;
    view.draft = null;
    view.focus = 0;
  }
  function close() { view.open = false; }
  function choose(choice) { view.draft = choice; }
  function activate(control) {
    if (!control) return;
    if (control.kind === 'choice') choose(control.choice);
    else if (control.kind === 'back') close();
    else if (control.kind === 'save' && view.draft) game.submitDecision(view.draft);
  }
  function key(name) {
    if (!view.open) return false;
    const list = controls();
    if (name === 'Escape') close();
    else if (name === 'ArrowDown' || name === 'Tab') view.focus = (view.focus + 1) % list.length;
    else if (name === 'ArrowUp') view.focus = (view.focus + list.length - 1) % list.length;
    else if (name === 'Enter' || name === ' ') activate(list[view.focus]);
    else return false;
    return true;
  }

  root.NSF.records = {
    view, model, controls, open, close, choose, activate, key,
    attach(controller) { game = controller; },
  };
})(globalThis);
