// Boot: canvas scaling, the frame loop and input routing.
(function (root) {
  'use strict';
  const { time, layout, world, ui, game, records, sprites, dialogue, radio, phone, signin, outside, drift, messages, found } = root.NSF;
  const canvas = document.querySelector('[data-game]');
  const ctx = canvas.getContext('2d');
  const live = document.querySelector('[data-live]');
  const { width: W, height: H, scale: K } = layout.screen;
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;

  // Fill the window. Exact whole or half scales (world pixels = 2 canvas pixels)
  // are used when the window is within 4% of one; otherwise the canvas fits, and
  // on high-density screens the nearest-neighbour unevenness is sub-pixel.
  function resize() {
    const fit = Math.min(root.innerWidth / W, root.innerHeight / H);
    const snapped = Math.floor(fit * 2) / 2;
    const scale = snapped >= 1 && fit - snapped < fit * 0.04 ? snapped : fit;
    canvas.style.width = Math.floor(W * scale) + 'px';
    canvas.style.height = Math.floor(H * scale) + 'px';
  }
  // Mobile browsers settle the viewport after the scripts run, without a resize.
  root.addEventListener('resize', resize);
  root.addEventListener('load', resize);
  if (root.visualViewport) root.visualViewport.addEventListener('resize', resize);
  resize();

  function toScreen(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
  }

  // World targets under a screen point, tested against their pixels with a pixel of
  // slack: goods first, then machines from the nearest-drawn back, since machines
  // overlap in the first-person view.
  function worldTarget(point) {
    if (game.state.phase !== 'shift' || records.view.open || phone.view.open || found.view.open) return null;
    const x = Math.floor(point.x / K), y = Math.floor(point.y / K);
    const list = game.targets();
    const hit = target => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]
      .some(([dx, dy]) => sprites.opaqueAt(target.sprite, x - target.x + dx, y - target.y + dy));
    return list.filter(t => t.product).reverse().find(hit) || list.filter(t => !t.product).reverse().find(hit) || null;
  }

  function targetAt(point) {
    const hit = ui.hitTest(point.x, point.y);
    if (hit) return { ui: hit };
    const target = worldTarget(point);
    return target ? { world: target } : null;
  }

  // A UI region with `drag` (the radio's dial) follows the pointer while it is held.
  let dragging = null;
  canvas.addEventListener('pointerdown', event => {
    event.preventDefault();
    render(); // hit regions must reflect the current state, not the last frame
    const point = toScreen(event);
    const found = targetAt(point);
    if (found?.ui) {
      found.ui.action(point);
      if (found.ui.drag) { dragging = found.ui; canvas.setPointerCapture?.(event.pointerId); }
    } else if (found?.world) game.activate(found.world.name);
  });
  canvas.addEventListener('pointermove', event => {
    const point = toScreen(event);
    if (dragging) { dragging.drag(point); return; }
    canvas.style.cursor = targetAt(point) ? 'pointer' : 'default';
  });
  const release = () => { dragging = null; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  root.addEventListener('keydown', event => {
    if (signin.key(event.key) || found.key(event.key) || phone.key(event.key) || records.key(event.key) || radio.key(event.key)) { event.preventDefault(); return; }
    if ((event.key === 'Enter' || event.key === ' ') && game.state.phase === 'title') game.startShift();
  });

  // Mirror speech and radio into a live region for screen readers.
  let lastLive = '';
  function announce() {
    const value = [dialogue.fullText(), radio.caption()].filter(Boolean).join(' / ');
    if (value !== lastLive) { lastLive = value; live.textContent = value; }
  }

  function render() {
    game.update();
    ctx.fillStyle = '#07090f';
    ctx.fillRect(0, 0, W, H);
    world.draw(ctx, game);
    ui.draw(ctx, game);
  }

  function frame(timestamp) {
    time.tick(timestamp);
    if (game.state.phase !== 'title') outside.update();
    drift.update();
    messages.update();
    found.update();
    render();
    announce();
    root.requestAnimationFrame(frame);
  }
  root.requestAnimationFrame(frame);

  // Test hooks: client-space centres of every clickable target.
  console.info(`Night Shift Frequency · seed ${game.shift.seed} · replay with ?seed=${encodeURIComponent(game.shift.seed)}`);
  root.NSF.debug = {
    game, time, records, radio, dialogue, phone, signin, drift, messages, found, seed: game.shift.seed,
    targets() {
      render();
      const rect = canvas.getBoundingClientRect();
      const sx = rect.width / W, sy = rect.height / H;
      const toClient = (x, y, w, h) => ({ x: rect.left + (x + w / 2) * sx, y: rect.top + (y + h / 2) * sy });
      const result = {};
      for (const t of game.targets()) {
        // Aim at the pixel nearest the centre that really hits this target.
        let x = t.x + t.w / 2, y = t.y + t.h / 2;
        outer: for (let r = 0; r < Math.max(t.w, t.h); r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          const px = Math.floor(t.x + t.w / 2) + dx, py = Math.floor(t.y + t.h / 2) + dy;
          if (worldTarget({ x: (px + 0.5) * K, y: (py + 0.5) * K })?.name === t.name) { x = px + 0.5; y = py + 0.5; break outer; }
        }
        result[t.name] = { x: rect.left + x * K * sx, y: rect.top + y * K * sy };
      }
      for (const t of ui.targets) if (t.name) result['ui:' + t.name] = toClient(t.x, t.y, t.w, t.h);
      return result;
    },
  };
})(globalThis);
