// The night staff sign-in sheet: the clerk writes their name on it at 01:00 and signs
// out on it at 05:00. Typed with the keyboard or the letter keys drawn under the
// sheet. The name comes back on the radio and the phone.
(function (root) {
  'use strict';
  const { audio, strings } = root.NSF;
  const MAX = 10;
  const view = { open: false, mode: 'in', draft: '', name: '', signedOut: false };
  let onDone = null;

  function open(mode, done) {
    Object.assign(view, { open: true, mode, signedOut: false });
    onDone = done;
  }
  function type(ch) {
    if (!view.open || view.mode !== 'in' || view.draft.length >= MAX) return;
    const letter = ch.toUpperCase();
    if (!/^[A-Z]$/.test(letter) && !(letter === ' ' && view.draft && !view.draft.endsWith(' '))) return;
    view.draft += letter;
    audio.pen();
  }
  function erase() {
    if (!view.open || view.mode !== 'in' || !view.draft) return;
    view.draft = view.draft.slice(0, -1);
    audio.phoneKey();
  }
  // Signs the row: the name (or the default) at sign-in, the out time at the end.
  function sign() {
    if (!view.open || view.signedOut) return;
    if (view.mode === 'in') view.name = view.draft.trim() || strings.t('sheet.defaultName');
    else view.signedOut = true;
    audio.stamp();
    const done = onDone;
    onDone = null;
    if (view.mode === 'in') view.open = false;
    if (done) done();
  }

  function key(name) {
    if (!view.open) return false;
    if (name === 'Enter') sign();
    else if (name === 'Backspace') erase();
    else if (name.length === 1) type(name);
    else return false;
    return true;
  }

  root.NSF.signin = {
    view, open, type, erase, sign, key, letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    get name() { return view.name || strings.t('sheet.defaultName'); },
  };
})(globalThis);
