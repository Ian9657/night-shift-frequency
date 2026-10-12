// The pointer as a pixel cursor (art/src/cursors.cjs): an arrow, a pointing hand over
// something that can be used, a closed hand while an item is held, and the tuning knob
// over the radio. It is handed to the browser as a CSS cursor, so it moves at the
// system's own speed; each dot is two screen pixels, kept crisp on a high-density
// display, and the system's cursor stands in where an image cursor is refused.
(function (root) {
  'use strict';
  const { sprites } = root.NSF;
  const SPRITES = { arrow: 'cursor-arrow', hand: 'cursor-hand', grab: 'cursor-grab', tune: 'cursor-tune' };
  const FALLBACK = { arrow: 'default', hand: 'pointer', grab: 'grabbing', tune: 'ew-resize' };
  const SCALE = 2;
  const cache = new Map();
  let shown = null;

  // CSS cursor values to try, best first.
  function values(name) {
    const density = Math.max(1, Math.min(3, Math.round(root.devicePixelRatio || 1)));
    const key = name + '@' + density;
    if (cache.has(key)) return cache.get(key);
    const image = sprites.get(SPRITES[name]), [hx, hy] = sprites.anchor(SPRITES[name], 'hot');
    const draw = k => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width * k; canvas.height = image.height * k;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      return `url(${canvas.toDataURL()})`;
    };
    const sharp = draw(SCALE * density), plain = draw(SCALE), hot = `${hx * SCALE} ${hy * SCALE}`;
    const list = [
      `image-set(${sharp} ${density}x) ${hot}, ${FALLBACK[name]}`,
      `-webkit-image-set(${sharp} ${density}x) ${hot}, ${FALLBACK[name]}`,
      `${plain} ${hot}, ${FALLBACK[name]}`,
      FALLBACK[name],
    ];
    cache.set(key, list);
    return list;
  }

  // Show cursor `name` ('arrow', 'hand', 'grab' or 'tune') over `element`.
  function set(element, name) {
    if (shown === name && element.style.cursor) return;
    shown = name;
    for (const value of values(name)) {
      element.style.cursor = '';                                    // a refused value would leave the last one
      element.style.cursor = value;
      if (element.style.cursor) return;
    }
  }

  root.NSF.cursor = { set, get shown() { return shown; } };
})(globalThis);
