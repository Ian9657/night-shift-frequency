// Signed-distance sculpting for figures. A body is a field built from ellipsoids
// and tapered capsules in metres (js/content/space.js units), ray-marched through
// the store camera one pixel at a time. Each hit returns the point, the surface
// normal from the field, a cheap occlusion term and which part it belongs to, so
// joined parts share one surface and one light.
'use strict';
const space = require('../../js/content/space.js');

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = a => Math.hypot(a[0], a[1], a[2]);
const norm = a => mul(a, 1 / len(a));
const vec = { add, sub, mul, dot, len, norm };

// Ellipsoid centred at c with radii r (a close bound, exact for spheres).
function ellipsoid(p, c, r) {
  const q = sub(p, c);
  const k0 = Math.hypot(q[0] / r[0], q[1] / r[1], q[2] / r[2]);
  const k1 = Math.hypot(q[0] / (r[0] * r[0]), q[1] / (r[1] * r[1]), q[2] / (r[2] * r[2]));
  return k1 === 0 ? -Math.min(...r) : k0 * (k0 - 1) / k1;
}

// Capsule from a (radius ra) to b (radius rb), tapering between them.
function cone(p, a, b, ra, rb) {
  const ba = sub(b, a), l2 = dot(ba, ba), rr = ra - rb, a2 = l2 - rr * rr, il2 = 1 / l2;
  const pa = sub(p, a), y = dot(pa, ba), z = y - l2;
  const xv = sub(mul(pa, l2), mul(ba, y)), x2 = dot(xv, xv);
  const y2 = y * y * l2, z2 = z * z * l2, k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - rb;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - ra;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - ra;
}

// Upright cylinder around axis (x, z) between heights y0 and y1.
function cylinder(p, [x, z], r, y0, y1) {
  const dr = Math.hypot(p[0] - x, p[2] - z) - r, dy = Math.max(y0 - p[1], p[1] - y1);
  return Math.min(Math.max(dr, dy), 0) + Math.hypot(Math.max(dr, 0), Math.max(dy, 0));
}

// Rounded box centred at c with half extents `half` along orthonormal `axes`.
function box(p, c, axes, half, round = 0) {
  const q = sub(p, c);
  const d = axes.map((a, i) => Math.abs(dot(q, a)) - half[i] + round);
  return Math.hypot(...d.map(v => Math.max(v, 0))) + Math.min(Math.max(...d), 0) - round;
}

// Coordinates of p in the frame (c, axes).
function local(p, c, axes) {
  const q = sub(p, c);
  return axes.map(a => dot(q, a));
}

// An orthonormal frame from a forward direction f and an approximate up n:
// returns { f, n, r } with r = n x f, flipped to point along `toward` if given.
function frame(f, n, toward) {
  f = norm(f);
  n = norm(sub(n, mul(f, dot(n, f))));
  let r = [n[1] * f[2] - n[2] * f[1], n[2] * f[0] - n[0] * f[2], n[0] * f[1] - n[1] * f[0]];
  if (toward && dot(r, toward) < 0) r = mul(r, -1);
  return { f, n, r };
}

// Smooth minimum: blends two surfaces over a width of k metres.
function smin(a, b, k) {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

// Ray-march `field(p) -> [distance, tag]` for every pixel of a canvas whose top-left
// sits at screen pixel `origin`. Returns hits[] (or null): { P, n, tag, ao }. The
// normal is sampled `normalEps` apart, so lighting follows the broad form rather
// than every small blend.
function render(field, width, height, origin, { zNear = 0.55, zFar = 1.9, normalEps = 0.005 } = {}) {
  const EYE = space.eye;
  const hits = new Array(width * height).fill(null);
  const d0 = p => field(p)[0];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const dir = space.ray(x + origin[0], y + origin[1]);           // z component is 1, so t is depth
    const step = len(dir);
    let t = zNear - EYE[2];
    for (let i = 0; i < 120 && t < zFar - EYE[2]; i++) {
      const P = add(EYE, mul(dir, t));
      const d = d0(P);
      if (d < 0.0005) {
        const e = normalEps;
        const n = norm([
          d0([P[0] + e, P[1], P[2]]) - d0([P[0] - e, P[1], P[2]]),
          d0([P[0], P[1] + e, P[2]]) - d0([P[0], P[1] - e, P[2]]),
          d0([P[0], P[1], P[2] + e]) - d0([P[0], P[1], P[2] - e]),
        ]);
        const ao = Math.max(0, Math.min(1, d0(add(P, mul(n, 0.03))) / 0.03));
        hits[y * width + x] = { P, n, tag: field(P)[1], ao };
        break;
      }
      t += Math.max(d, 0.0004) / step;
    }
  }
  return hits;
}

module.exports = { vec, ellipsoid, cone, cylinder, box, local, frame, smin, render };
