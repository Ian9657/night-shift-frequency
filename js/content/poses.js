// Customer poses at the counter: what each arm does, where the eyes look, how the
// shoulders sit and how the upper body leans. The art build (art/src/people.cjs)
// renders every pose a customer needs; the game picks them by name. Arm uses:
//   'rest'     the hand lies on the counter at [x, z], optionally turned onto its side
//   'hang'     the arm hangs, the hand below the counter
//   'ear'      an open flip phone held to the ear
//   'hold'     both hands hold an open flip phone low in front, thumbs on the keys
//   'hold1'    one hand holds the open flip phone low in front, thumb on the keys
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
  });
  // A customer waits at the counter, throughout the sale, in their own first pose
  // (customers.js person.poses): money and goods change hands through the change
  // tray, the terminal's slot and the far edge of the counter, not their hands.
  const api = { poses };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.NSF = root.NSF || {}).poses = api;
})(globalThis);
