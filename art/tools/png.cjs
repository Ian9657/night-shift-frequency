// Minimal PNG codec for the art pipeline: writes indexed or RGBA images and
// reads the 8-bit indexed/RGB/RGBA files Aseprite exports. No dependencies.
'use strict';
const zlib = require('node:zlib');

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, tail]);
}

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// pixels: Uint8Array of palette indices; palette: [[r,g,b,a], ...]
function encodeIndexed(width, height, pixels, palette) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 3;
  const plte = Buffer.alloc(palette.length * 3);
  const trns = Buffer.alloc(palette.length);
  palette.forEach(([r, g, b, a], i) => { plte[i * 3] = r; plte[i * 3 + 1] = g; plte[i * 3 + 2] = b; trns[i] = a; });
  const raw = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0;
    for (let x = 0; x < width; x++) raw[y * (width + 1) + 1 + x] = pixels[y * width + x];
  }
  return Buffer.concat([SIGNATURE, chunk('IHDR', ihdr), chunk('PLTE', plte), chunk('tRNS', trns),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function encodeRGBA(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy ? rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
      : raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
  }
  return Buffer.concat([SIGNATURE, chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

// Returns { width, height, rgba: Uint8Array } for 8-bit non-interlaced PNGs.
function decode(buffer) {
  if (!buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error('Not a PNG');
  let offset = 8, width, height, depth, type, interlace, palette = [], alpha = [];
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const kind = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (kind === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      depth = data[8]; type = data[9]; interlace = data[12];
    } else if (kind === 'PLTE') {
      for (let i = 0; i < data.length; i += 3) palette.push([data[i], data[i + 1], data[i + 2]]);
    } else if (kind === 'tRNS') alpha = [...data];
    else if (kind === 'IDAT') idat.push(data);
    offset += length + 12;
  }
  if (depth !== 8 || interlace) throw new Error('Only 8-bit non-interlaced PNGs are supported');
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  const stride = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const value = raw[y * (stride + 1) + 1 + x];
      const left = x >= channels ? out[y * stride + x - channels] : 0;
      const up = y ? out[(y - 1) * stride + x] : 0;
      const corner = y && x >= channels ? out[(y - 1) * stride + x - channels] : 0;
      const predicted = [0, left, up, (left + up) >> 1, paeth(left, up, corner)][filter];
      out[y * stride + x] = (value + predicted) & 0xff;
    }
  }
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    let r, g, b, a = 255;
    if (type === 3) { [r, g, b] = palette[out[i]]; a = alpha[out[i]] ?? 255; }
    else if (type === 0) r = g = b = out[i];
    else if (type === 4) { r = g = b = out[i * 2]; a = out[i * 2 + 1]; }
    else { r = out[i * channels]; g = out[i * channels + 1]; b = out[i * channels + 2]; if (type === 6) a = out[i * 4 + 3]; }
    rgba.set([r, g, b, a], i * 4);
  }
  return { width, height, rgba };
}

module.exports = { encodeIndexed, encodeRGBA, decode };
