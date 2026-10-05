// World layout in 480x270 world pixels. Shared by the runtime and the art
// build, so fixture positions live in exactly one place.
(function (root) {
  'use strict';
  const layout = Object.freeze({
    world: { width: 480, height: 270 },
    screen: { width: 960, height: 540, scale: 2 },
    counterTop: 153,
    window: { x: 156, y: 27, w: 156, h: 126, mullion: { x: 231, w: 6 } },
    towerLight: { x: 282, y: 50 },
    clock: { x: 327, y: 44, hour: 6, minute: 9 },
    fixtures: Object.freeze({
      microwave: { sprite: 'microwave', x: 3, y: 130 },
      pos: { sprite: 'pos', x: 80, y: 113, screen: { x: 88, y: 119, w: 72, h: 40 } },
      scanner: { sprite: 'scanner', x: 170, y: 147, beam: { x: 183, y: 158 } },
      terminal: { sprite: 'terminal', x: 282, y: 149, contact: { x: 296, y: 154 } },
      tray: { sprite: 'tray', x: 312, y: 175, drop: { x: 330, y: 180 } },
      radio: { sprite: 'radio', x: 346, y: 134, display: { x: 378, y: 149, w: 19, h: 7 } },
      bags: { sprite: 'bags', x: 354, y: 176, packing: { x: 358, y: 151 } },
      printer: { sprite: 'printer', x: 414, y: 147, slot: { x: 422, y: 149 } },
      caddy: { sprite: 'caddy', x: 460, y: 155 },
    }),
    lane: { x: 198, width: 80, incomingFoot: 171, scannedFoot: 187, gap: 4 },
    customer: { x: 183, y: 50, w: 120, h: 120, walk: 225 },
    microwaveCavity: { x: 30, y: 156 },
    drawer: { x: 84, y: 199 },
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = layout;
  else (root.NSF = root.NSF || {}).layout = layout;
})(globalThis);
