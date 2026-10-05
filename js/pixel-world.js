(function (root) {
  'use strict';
  const WIDTH = 640, HEIGHT = 360;
  const snap = (value, grid = 1) => Math.round(value / grid) * grid;
  const sprites = Object.freeze({
    coffee: { nativeW: 48, nativeH: 56, footY: 52, targetH: 28 },
    drink: { nativeW: 44, nativeH: 56, footY: 52, targetH: 28 },
    'canned-drink': { nativeW: 40, nativeH: 56, footY: 52, targetH: 28 },
    onigiri: { nativeW: 56, nativeH: 56, footY: 50, targetH: 20 },
    bento: { nativeW: 72, nativeH: 48, footY: 44, targetH: 20 },
    bread: { nativeW: 56, nativeH: 48, footY: 44, targetH: 18 },
    sandwich: { nativeW: 56, nativeH: 48, footY: 44, targetH: 18 },
  });
  const customer = Object.freeze({ x: 346, y: 66, nativeW: 96, nativeH: 160, targetH: 140 });
  const fixtures = Object.freeze({
    '.back-wall': [0,0,640,230], '.cctv-monitor': [-42,0,160,69],
    '.hot-warmer': [432,95,166,106], '.clock': [518,-1,173,62],
    '.store-entry': [14,45,186,139], '.shelves': [6,18,624,134],
    '.customer-aisle': [0,144,640,86],
    '.pos': [169,128,116,82], '.scanner': [266,155,57,63],
    '.payment-terminal': [408,163,70,56], '.coin-tray': [387,197,78,33],
    '.microwave': [12,121,192,107], '.bag-stack': [428,187,137,40],
    '.receipt-printer': [485,158,77,68], '.cutlery-caddy': [573,149,40,58],
    '.clutter-note': [357,216,48,43], '.clutter-receipt': [529,182,54,36],
    '.customer': [customer.x, customer.y, 84, customer.targetH],
    '.countertop': [-5,157,640,203],
  });
  function size(sprite, scale = 1) {
    const spec = sprites[sprite];
    if (!spec) throw new Error('Unknown world sprite: ' + sprite);
    const height = snap(spec.targetH * scale);
    return { width: snap(spec.nativeW / spec.nativeH * height), height,
      foot: snap(spec.footY / spec.nativeH * height) };
  }
  function layout(items) {
    const gap = 4, laneWidth = 60;
    const natural = items.map(item => size(item.sprite).width);
    const total = natural.reduce((a,b) => a+b,0);
    const scale = Math.min(1, (laneWidth - gap * (items.length - 1)) / total);
    if (scale < .94) throw new RangeError('Order exceeds the counter lane capacity');
    const sizes = items.map(item => size(item.sprite, scale));
    const span = sizes.reduce((sum,s) => sum+s.width,0) + gap*(items.length-1);
    let x = 325 + snap((laneWidth-span)/2);
    return sizes.map(s => { const result = { ...s, x }; x += s.width + gap; return result; });
  }
  function place(node, box) {
    for (const [key,value] of Object.entries(box)) {
      if (!['left','top','width','height'].includes(key)) continue;
      node.style.setProperty(key, snap(value) + 'px', 'important');
    }
  }
  function frames(points, duration, grid = 2) {
    const count = Math.max(1, Math.ceil(duration / 70));
    const offsets = [...new Set([0,1,...points.map(p=>p.t),...Array.from({length:count},(_,i)=>i/count)])].sort((a,b)=>a-b);
    return offsets.map(t => {
      const end = points.findIndex((p,i)=>i && p.t >= t);
      const b = points[end < 0 ? points.length-1 : end], a = points[Math.max(0,end-1)];
      const fraction = (t-a.t)/(b.t-a.t || 1);
      const x = snap(a.x+(b.x-a.x)*fraction, grid), y = snap(a.y+(b.y-a.y)*fraction, grid);
      return { offset:t, translate:x+'px '+y+'px', easing:'steps(1, end)' };
    });
  }
  async function move(node, points, duration) {
    const keys = frames(points, duration);
    const final = keys.at(-1).translate;
    if (root.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      node.style.translate = final;
      return;
    }
    const animation = node.animate(keys, {duration, fill:'forwards', easing:'linear'});
    try { await animation.finished; node.style.translate = final; }
    finally { animation.cancel(); }
  }
  function mount(frame) {
    const layer = document.createElement('div');
    layer.className = 'pixel-world';
    layer.append(...frame.childNodes);
    frame.append(layer);
    const update = () => { layer.style.transform = 'scale(' + frame.clientWidth/WIDTH + ')'; };
    update();
    new ResizeObserver(update).observe(frame);
    for (const [selector,[left,top,width,height]] of Object.entries(fixtures)) {
      place(layer.querySelector(selector), {left,top,width,height});
    }
    // Convert viewport measurements only at this boundary; animations use world units.
    const rect = node => {
      const origin = layer.getBoundingClientRect(), r = node.getBoundingClientRect();
      const scale = origin.width/WIDTH;
      const left = snap((r.left-origin.left)/scale), top = snap((r.top-origin.top)/scale);
      const width = snap(r.width/scale), height = snap(r.height/scale);
      return {left,top,width,height,right:left+width,bottom:top+height};
    };
    return { layer, rect };
  }
  const api = {WIDTH,HEIGHT,snap,sprites,customer,fixtures,size,layout,place,frames,move,mount};
  if (typeof module !== 'undefined') module.exports = api;
  else root.PixelWorld = Object.freeze(api);
})(globalThis);
