// Turns the indexed sprite bundle into cached canvases. Colour slots are
// remapped per customer and whole-scene moods are applied at this stage, so
// artwork never needs per-variant copies.
(function (root) {
  'use strict';
  const data = root.NSF.spriteData;
  const base = data.palette.map(hex => {
    const v = hex.replace('#', '');
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16), v.length > 6 ? parseInt(v.slice(6, 8), 16) : 255];
  });
  const nameIndex = Object.fromEntries(data.names.map((name, i) => [name, i]));
  const indices = {};
  for (const [name, sprite] of Object.entries(data.sprites)) {
    const raw = atob(sprite.data);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    indices[name] = bytes;
  }
  const cache = new Map();

  const MOODS = {
    normal: c => c,
    // The neighbouring frequency: colder, flatter, slightly lifted.
    echo: ([r, g, b, a]) => {
      const l = 0.3 * r + 0.59 * g + 0.11 * b;
      return [Math.round(l * 0.45 + 20), Math.round(l * 0.85 + 30), Math.round(l * 0.95 + 40), a];
    },
    dim: ([r, g, b, a]) => [Math.round(r * 0.72), Math.round(g * 0.74), Math.round(b * 0.8), a],
  };

  function hexToRgba(hex) {
    const v = hex.replace('#', '');
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16), 255];
  }

  function paletteFor(slots, mood) {
    const colors = base.map(c => c.slice());
    for (const [slot, hex] of Object.entries(slots || {})) colors[nameIndex[slot]] = hexToRgba(hex);
    const transform = MOODS[mood] || MOODS.normal;
    return colors.map((c, i) => (i === 0 ? c : transform(c)));
  }

  function slotKey(slots) {
    return slots ? Object.entries(slots).map(([k, v]) => k + v).join('') : '';
  }

  // options: { slots, mood, outline: '#rrggbb' }
  function get(name, options = {}) {
    const sprite = data.sprites[name];
    if (!sprite) throw new Error('Unknown sprite: ' + name);
    const key = [name, slotKey(options.slots), options.mood || 'normal', options.outline || ''].join('|');
    if (cache.has(key)) return cache.get(key);
    const pad = options.outline ? 1 : 0;
    const canvas = document.createElement('canvas');
    canvas.width = sprite.w + pad * 2;
    canvas.height = sprite.h + pad * 2;
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(canvas.width, canvas.height);
    const pixels = indices[name];
    if (options.outline) {
      const color = hexToRgba(options.outline);
      const opaque = (x, y) => x >= 0 && y >= 0 && x < sprite.w && y < sprite.h && pixels[y * sprite.w + x];
      for (let y = -1; y <= sprite.h; y++) for (let x = -1; x <= sprite.w; x++) {
        if (opaque(x, y)) continue;
        if (opaque(x + 1, y) || opaque(x - 1, y) || opaque(x, y + 1) || opaque(x, y - 1)) {
          image.data.set(color, ((y + 1) * canvas.width + x + 1) * 4);
        }
      }
    } else {
      const colors = paletteFor(options.slots, options.mood);
      for (let i = 0; i < pixels.length; i++) if (pixels[i]) image.data.set(colors[pixels[i]], i * 4);
    }
    ctx.putImageData(image, 0, 0);
    cache.set(key, canvas);
    return canvas;
  }

  function size(name) {
    const sprite = data.sprites[name];
    return { w: sprite.w, h: sprite.h };
  }
  function anchor(name, key) { return data.sprites[name].anchors?.[key] || null; }
  // True when the sprite has an opaque pixel at local (x, y).
  function opaqueAt(name, x, y) {
    const sprite = data.sprites[name];
    if (x < 0 || y < 0 || x >= sprite.w || y >= sprite.h) return false;
    return Boolean(indices[name][y * sprite.w + x]);
  }
  // A palette entry's authored colour as '#rrggbb'.
  function color(name) { return data.palette[nameIndex[name]].slice(0, 7); }
  root.NSF.sprites = { get, size, anchor, opaqueAt, color };
})(globalThis);
