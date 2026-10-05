// Bitmap text on the 640x360 screen grid, from the baked Fusion Pixel glyphs.
(function (root) {
  'use strict';
  const font = root.NSF.fontData;
  const cache = new Map();

  function glyph(ch) { return font.glyphs[ch] || font.glyphs['?']; }

  function glyphCanvas(ch, color) {
    const key = ch + color;
    if (cache.has(key)) return cache.get(key);
    const data = glyph(ch);
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = font.rows;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    for (let y = 0; y < font.rows; y++) {
      const bits = data[y + 1];
      for (let x = 0; x < 16; x++) if (bits & (1 << x)) ctx.fillRect(x, y, 1, 1);
    }
    cache.set(key, canvas);
    return canvas;
  }

  function width(text) {
    let total = 0;
    for (const ch of text) total += glyph(ch)[0];
    return total;
  }

  // Wraps by words for Latin text and by character for CJK. Never breaks
  // before closing punctuation.
  function wrap(text, maxWidth) {
    const tokens = text.match(/[　-鿿＀-￯“”‘’…—·]|[^\s　-鿿＀-￯“”‘’…—·]+|\s+/g) || [];
    const lines = [];
    let line = '';
    for (const token of tokens) {
      const candidate = line + token;
      if (line && width(candidate.trimEnd()) > maxWidth && !/^[，。、？！：；”’…）]$/.test(token)) {
        lines.push(line.trimEnd());
        line = token.trimStart();
      } else {
        line = candidate;
      }
    }
    if (line.trim()) lines.push(line.trimEnd());
    return lines.length ? lines : [''];
  }

  // Draws text with its top-left at (x, y).
  // Options: align, shadow, maxChars, clipWidth, scale (integer).
  function draw(ctx, text, x, y, color, options = {}) {
    const scale = options.scale || 1;
    let chars = [...text];
    if (options.maxChars !== undefined) chars = chars.slice(0, options.maxChars);
    const full = width(text) * scale;
    let cursor = Math.round(options.align === 'right' ? x - full : options.align === 'center' ? x - Math.floor(full / 2) : x);
    const limit = options.clipWidth ? cursor + options.clipWidth : Infinity;
    const top = Math.round(y);
    for (const ch of chars) {
      const advance = glyph(ch)[0] * scale;
      if (cursor + advance > limit) break;
      if (ch !== ' ') {
        if (options.shadow) ctx.drawImage(glyphCanvas(ch, options.shadow), cursor + scale, top + scale, 16 * scale, font.rows * scale);
        ctx.drawImage(glyphCanvas(ch, color), cursor, top, 16 * scale, font.rows * scale);
      }
      cursor += advance;
    }
    return cursor;
  }

  root.NSF.text = { draw, width, wrap };
})(globalThis);
