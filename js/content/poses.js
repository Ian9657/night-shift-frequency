// Customer poses at the counter: what each arm does, where the eyes look, how the
// shoulders sit and how the upper body leans. The art build (art/src/people.cjs)
// renders every pose a customer needs; the game picks them by name. Arm uses:
//   'rest'     the hand lies on the counter at [x, z], optionally turned onto its side
//   'hang'     the arm hangs, the hand below the counter
//   'ear'      an open flip phone held to the ear
//   'hold'     both hands hold an open flip phone low in front, thumbs on the keys
//   'hold1'    one hand holds the open flip phone low in front, thumb on the keys
//   'reach'    a bank card (or, with 'bill', a banknote) held out toward the clerk
//   'swipe'    a bank card standing in the card terminal's top slot, held by its edge
//   'take'     an open hand out over the counter, palm up, for change or a receipt
// drop: [left, right] shoulder drop in metres; forward: shoulders forward; lean:
// [toward the viewer's right, toward the counter] in radians; shift: sideways
// metres; headFollow: how much of the lean the head sprite follows.
(function (root) {
  'use strict';
  const poses = Object.freeze({
    'stand': { gaze: 'clerk', left: ['hang'], right: ['hang'] },
    'one-rest': { gaze: 'down', left: ['rest', [-0.07, 1.04]], right: ['hang'], lean: [0, 0.03], shift: -0.007 },
    'both-rest': { gaze: 'downLeft', left: ['rest', [-0.15, 1.06]], right: ['rest', [0.16, 1.08]], drop: [0, 0.01], lean: [0.015, 0.05] },
    'phone-call': { gaze: 'phoneSide', left: ['rest', [-0.07, 1.04]], right: ['ear'], drop: [0.012, 0.011], lean: [0.035, 0], shift: 0.007, headFollow: 0.5 },
    'phone-check': { gaze: 'phone', left: ['hold'], right: ['hold'], drop: [0.01, 0.01], forward: 0.02, lean: [0, 0.05] },
    'phone-one': { gaze: 'phone', left: ['hang'], right: ['hold1'], drop: [0.008, 0], lean: [0.01, 0.05], shift: 0.004 },
    'card': { gaze: 'clerk', left: ['hang'], right: ['reach'], drop: [0.006, 0], lean: [0, 0.06] },
    'cash': { gaze: 'clerk', left: ['hang'], right: ['reach', 'bill'], drop: [0.006, 0], lean: [0, 0.06] },
    'card-reader': { gaze: 'downRight', left: ['rest', [-0.08, 1.05]], right: ['swipe'], drop: [0.004, 0], lean: [0, 0.03] },
    'receive': { gaze: 'clerk', left: ['rest', [-0.09, 1.06]], right: ['take'], lean: [0, 0.05], shift: 0.004 },
  });
  // What the game asks a customer to do, and the pose that shows it. Waiting at the
  // counter uses the customer's own first pose (customers.js person.poses).
  const actions = Object.freeze({ card: 'card-reader', cash: 'cash', receive: 'receive' });
  const api = { poses, actions };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.NSF = root.NSF || {}).poses = api;
})(globalThis);
