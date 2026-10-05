// Hue-shifted colour ramps. Shadows drift toward blue and gain saturation;
// highlights drift toward warm yellow and lose a little. Shared by the art
// palette and per-customer slot colours so both shade the same way.
(function (root) {
  'use strict';
  function hexToHsl(hex) {
    const v = hex.replace('#', '');
    const [r, g, b] = [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }

  function hslToHex([h, s, l]) {
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return '#' + [f(0), f(8), f(4)].map(x => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0')).join('');
  }

  function toward(h, target, amount) {
    const diff = ((target - h + 540) % 360) - 180;
    return (h + diff * amount + 360) % 360;
  }

  // n tones from darkest to lightest; base sits at index `at` (default middle).
  function ramp(base, n = 5, options = {}) {
    const [h, s, l] = hexToHsl(base);
    const at = options.at ?? (l < 0.28 ? 1 : Math.floor((n - 1) / 2));
    const spread = options.spread ?? 0.16;
    const shift = options.shift ?? 0.1;
    const result = [];
    for (let i = 0; i < n; i++) {
      const t = i - at;
      const lightness = Math.max(0.03, Math.min(0.97, l + t * spread * (t < 0 ? 0.9 : 0.75)));
      const hue = s < 0.04 ? h : toward(h, t < 0 ? 235 : 55, Math.min(1, Math.abs(t) * shift / Math.max(1, n - 1 - at, at)));
      const sat = Math.max(0, Math.min(1, s * (t < 0 ? 1 + 0.03 * -t : 1 - 0.12 * t)));
      result.push(i === at ? base : hslToHex([hue, sat, lightness]));
    }
    return result;
  }

  const api = { ramp, hexToHsl, hslToHex };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.NSF = root.NSF || {}).colors = api;
})(globalThis);
