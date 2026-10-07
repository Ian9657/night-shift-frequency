// One-camera ray caster for the store. Every surface is a rectangle in metres;
// each screen pixel is ray-cast against it with a depth buffer, so perspective,
// occlusion and the amount of visible top face are always consistent.
// Output is palette-indexed Pix layers and sprites; pixel detail goes on top.
'use strict';
const { Pix, colorIndex } = require('./pixel.cjs');
const space = require('../../js/content/space.js');

const { camera, room } = space;
const EYE = space.eye;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => mul(a, 1 / Math.hypot(...a));

// Light: the ceiling tubes over a bright, cold interior.  The tubes are long
// fixtures running into the room, so their influence falls off mostly across
// the ceiling rather than becoming a single point light.
const TUBES = [-0.75, 0.75];
const KEY = norm([0, 0.85, -0.5]);
function lightAt(P, n) {
  let I = 0.46 + 0.36 * Math.max(0, dot(n, KEY));
  for (const tx of TUBES) {
    const across = P[0] - tx;
    const below = room.ceiling - P[1];
    I += 0.34 * Math.exp(-(across * across * 1.8 + below * below) / 1.7);
  }
  return Math.min(1, I * pool(P));
}

// The pool of light on the counter: things on and under it are brightest over the
// checkout mat and fall off toward both ends, so the eye goes to the sale.
const { counter, mat } = space;
function pool(P) {
  if (P[1] > counter.y + 0.5 || P[2] > counter.far + 0.15 || P[0] < -1.4 || P[0] > 1.02) return 1;   // the counter, not the walls or the fridge
  const d = Math.abs(P[0] - mat.x), t = Math.min(1, Math.max(0, (d - 0.36) / 0.9));
  return 1.06 - 0.06 * Math.min(1, d / 0.36) - 0.3 * t * t * (3 - 2 * t);
}

// Cel bands over a 5-tone ramp [outline, dark, mid, light, highlight]; the highlight
// tone is kept for details so lit colour never washes out. Narrow checker seams only.
function shade(ramp, I, sx, sy) {
  const v = Math.max(0, Math.min(2.999, I * 3.2 - 0.55));
  let level = Math.floor(v);
  if (v - level > 0.88 && level < 2 && (sx + sy) % 2 === 0) level += 1;
  return ramp[1 + level];
}

class Stage {
  constructor() {
    this.w = space.screen.width;
    this.h = space.screen.height;
    this.color = new Array(this.w * this.h).fill(null);
    this.depth = new Float64Array(this.w * this.h).fill(Infinity);
    this.owner = new Int32Array(this.w * this.h).fill(-1);
    this.objects = [];
  }

  object(name, props = {}) {
    return this.objects.push({ name, layer: 'main', ...props }) - 1;
  }

  plot(i, z, c, id) {
    if (z >= this.depth[i]) return;
    this.depth[i] = z; this.color[i] = c; this.owner[i] = id;
  }

  // Rectangle O + s*U + t*V (s, t in 0..1) with outward normal n.
  // paint(s, t, P, sx, sy) returns a palette name, or null to leave the pixel.
  quad(O, U, V, n, paint, id) {
    const centre = add(O, add(mul(U, 0.5), mul(V, 0.5)));
    if (dot(n, sub(centre, EYE)) >= 0) return;            // facing away
    const corners = [O, add(O, U), add(O, V), add(add(O, U), V)];
    if (corners.some(c => c[2] < 0.05)) return;
    const pts = corners.map(c => space.project(...c));
    const minX = Math.max(0, Math.floor(Math.min(...pts.map(p => p[0]))) - 1);
    const maxX = Math.min(this.w - 1, Math.ceil(Math.max(...pts.map(p => p[0]))) + 1);
    const minY = Math.max(0, Math.floor(Math.min(...pts.map(p => p[1]))) - 1);
    const maxY = Math.min(this.h - 1, Math.ceil(Math.max(...pts.map(p => p[1]))) + 1);
    const uu = dot(U, U), vv = dot(V, V);
    const planeD = dot(n, sub(O, EYE));
    for (let sy = minY; sy <= maxY; sy++) for (let sx = minX; sx <= maxX; sx++) {
      const d = space.ray(sx, sy);
      const denom = dot(n, d);
      if (Math.abs(denom) < 1e-9) continue;
      const t = planeD / denom;
      if (!(t > 0.05)) continue;
      const P = add(EYE, mul(d, t));
      const rel = sub(P, O);
      const s = dot(rel, U) / uu, tt = dot(rel, V) / vv;
      if (s < 0 || s > 1 || tt < 0 || tt > 1) continue;
      const c = paint(s, tt, P, sx, sy);
      if (c) this.plot(sy * this.w + sx, P[2], c, id);
    }
  }

  // Box standing on y (default: the counter), centred on x/z, rotated by yaw.
  // decorate(face, s, t) -> ramp (lit), palette name (fixed) or null (body ramp).
  // Faces: 'top', 'front' (toward the camera at yaw 0), 'back', 'left', 'right'.
  box(spec, ramp, decorate = null, props = {}) {
    const { x, z, w, h, d, y = space.counter.y, yaw = 0 } = spec;
    const id = this.object(props.name || 'box', { ramp, footprint: { x, z, w, d, yaw }, y, ...props });
    const c = Math.cos(yaw), sn = Math.sin(yaw);
    const ax = [c * w, 0, -sn * w], az = [sn * d, 0, c * d], ay = [0, h, 0];
    const O = [x - ax[0] / 2 - az[0] / 2, y, z - ax[2] / 2 - az[2] / 2]; // front-left-bottom corner
    const nx = norm(ax), nz = norm(az);
    const paint = face => (s, t, P, sx, sy) => {
      const n = face === 'top' ? [0, 1, 0] : face === 'front' ? mul(nz, -1) : face === 'back' ? nz : face === 'left' ? mul(nx, -1) : nx;
      const r = (decorate && decorate(face, s, t)) || ramp;
      return typeof r === 'string' ? r : shade(r, lightAt(P, n), sx, sy);
    };
    this.quad(add(O, ay), ax, az, [0, 1, 0], paint('top'), id);
    this.quad(O, ax, ay, mul(nz, -1), paint('front'), id);
    this.quad(add(O, az), ax, ay, nz, paint('back'), id);
    this.quad(O, az, ay, mul(nx, -1), (s, t, P, sx, sy) => paint('left')(1 - s, t, P, sx, sy), id);
    this.quad(add(O, ax), az, ay, nx, paint('right'), id);
    return id;
  }

  // Occlusion outlines: where an object meets something farther away, its edge
  // pixel takes the object's darkest tone.
  outline() {
    const out = this.color.slice();
    for (let sy = 0; sy < this.h; sy++) for (let sx = 0; sx < this.w; sx++) {
      const i = sy * this.w + sx, o = this.owner[i];
      if (o < 0 || !this.objects[o].ramp || this.objects[o].outline === false) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = sx + dx, ny = sy + dy;
        if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) { continue; }
        const j = ny * this.w + nx;
        if (this.owner[j] !== o && this.depth[j] > this.depth[i] + 0.004) { out[i] = this.objects[o].ramp[0]; break; }
      }
    }
    this.color = out;
  }

  // Darken counter pixels near the footprints of objects standing on it.
  contactShadows(surfaceId, footprints) {
    for (let i = 0; i < this.color.length; i++) {
      if (this.owner[i] !== surfaceId) continue;
      const P = space.counterPoint(i % this.w, Math.floor(i / this.w));
      if (!P) continue;
      for (const f of footprints) {
        const c = Math.cos(f.yaw || 0), s = Math.sin(f.yaw || 0);
        const lx = (P.x - f.x) * c - (P.z - f.z) * s, lz = (P.x - f.x) * s + (P.z - f.z) * c;
        const dist = Math.hypot(Math.max(Math.abs(lx) - f.w / 2, 0), Math.max(Math.abs(lz) - f.d / 2, 0));
        if (dist < 0.008) { this.color[i] = 'top1'; break; }
        if (dist < 0.022) { this.color[i] = 'top2'; break; }
      }
    }
  }

  // Pixels won by objects in `layer`, as a full-screen Pix.
  layer(name) {
    const p = new Pix(this.w, this.h);
    for (let i = 0; i < this.color.length; i++) {
      const o = this.owner[i];
      if (o >= 0 && this.objects[o].layer === name && this.color[i]) p.data[i] = colorIndex(this.color[i]);
    }
    return p;
  }

  // Everything drawn, cropped to its bounding box, with the crop origin as anchor 'at'.
  sprite() {
    let x0 = this.w, y0 = this.h, x1 = -1, y1 = -1;
    for (let i = 0; i < this.color.length; i++) {
      if (!this.color[i]) continue;
      const x = i % this.w, y = Math.floor(i / this.w);
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    if (x1 < 0) throw new Error('empty sprite');
    const p = new Pix(x1 - x0 + 1, y1 - y0 + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const c = this.color[y * this.w + x];
      if (c) p.data[(y - y0) * p.width + (x - x0)] = colorIndex(c);
    }
    return p.anchor('at', x0, y0);
  }
}

// Sample an authored Pix as a face decoration: s runs left->right, t bottom->top.
function stamp(pix) {
  return (s, t) => {
    const x = Math.min(pix.width - 1, Math.floor(s * pix.width));
    const y = Math.min(pix.height - 1, Math.floor((1 - t) * pix.height));
    const v = pix.data[y * pix.width + x];
    return v ? v : null;
  };
}

module.exports = { Stage, shade, lightAt, pool, stamp, TUBES };
