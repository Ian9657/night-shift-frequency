// Boot: canvas scaling, the frame loop and input routing.
(function (root) {
  'use strict';
  const { time, layout, world, ui, game, records, sprites, i18n, dialogue, radio } = root.NSF;
  const canvas = document.querySelector('[data-game]');
  const ctx = canvas.getContext('2d');
  const live = document.querySelector('[data-live]');
  const { width: W, height: H, scale: K } = layout.screen;
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;

  try {
    const saved = root.localStorage.getItem('nsf-language');
    i18n.setLanguage(saved || (navigator.language?.startsWith('zh') ? 'zh' : 'en'));
  } catch (_) { /* storage unavailable: keep default */ }

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
  root.addEventListener('resize', resize);
  resize();

  function toScreen(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
  }

  // World targets under a screen point, products tested against their pixels.
  function worldTarget(point) {
    if (game.state.phase !== 'shift' || records.view.open) return null;
    const x = Math.floor(point.x / K), y = Math.floor(point.y / K);
    const list = game.targets();
    const products = list.filter(t => t.product).reverse();
    for (const target of products) {
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (sprites.opaqueAt(target.sprite, x - target.x + dx, y - target.y + dy)) return target;
      }
    }
    for (const target of list.filter(t => !t.product)) {
      if (x >= target.x && y >= target.y && x < target.x + target.w && y < target.y + target.h) return target;
    }
    return null;
  }

  function targetAt(point) {
    const hit = ui.hitTest(point.x, point.y);
    if (hit) return { ui: hit };
    const target = worldTarget(point);
    return target ? { world: target } : null;
  }

  canvas.addEventListener('pointerdown', event => {
    event.preventDefault();
    render(); // hit regions must reflect the current state, not the last frame
    const found = targetAt(toScreen(event));
    if (found?.ui) found.ui.action();
    else if (found?.world) game.activate(found.world.name);
  });
  canvas.addEventListener('pointermove', event => {
    canvas.style.cursor = targetAt(toScreen(event)) ? 'pointer' : 'default';
  });
  root.addEventListener('keydown', event => {
    if (records.key(event.key)) { event.preventDefault(); return; }
    if (event.key === 'l' || event.key === 'L') ui.toggleLanguage();
    if ((event.key === 'Enter' || event.key === ' ') && game.state.phase === 'title') game.startShift();
  });

  // Mirror speech and radio into a live region for screen readers.
  let lastLive = '';
  function announce() {
    const value = [dialogue.fullText(), radio.caption()].filter(Boolean).join(' / ');
    if (value !== lastLive) { lastLive = value; live.textContent = value; }
  }

  // Fluorescent flicker: rare, a little more often once the records start disagreeing.
  function scheduleFlicker() {
    time.after(4000 + Math.random() * 9000, () => {
      if (game.scene.mood === 'normal' && game.state.phase === 'shift') {
        game.scene.mood = 'dim';
        time.after(70, () => { if (game.scene.mood === 'dim') game.scene.mood = 'normal'; });
      }
      scheduleFlicker();
    });
  }
  scheduleFlicker();

  function render() {
    game.update();
    ctx.fillStyle = '#07090f';
    ctx.fillRect(0, 0, W, H);
    world.draw(ctx, game);
    ui.draw(ctx, game);
  }

  function frame(timestamp) {
    time.tick(timestamp);
    render();
    announce();
    root.requestAnimationFrame(frame);
  }
  root.requestAnimationFrame(frame);

  // Test hooks: client-space centres of every clickable target.
  root.NSF.debug = {
    game, time, records, radio, dialogue,
    targets() {
      render();
      const rect = canvas.getBoundingClientRect();
      const sx = rect.width / W, sy = rect.height / H;
      const toClient = (x, y, w, h) => ({ x: rect.left + (x + w / 2) * sx, y: rect.top + (y + h / 2) * sy });
      const result = {};
      for (const t of game.targets()) {
        let x = t.x + t.w / 2, y = t.y + t.h / 2;
        if (t.product) {
          // Aim at an opaque pixel near the centre.
          outer: for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const px = Math.floor(t.w / 2) + dx, py = Math.floor(t.h / 2) + dy;
            if (sprites.opaqueAt(t.sprite, px, py)) { x = t.x + px + 0.5; y = t.y + py + 0.5; break outer; }
          }
        }
        result[t.name] = { x: rect.left + x * K * sx, y: rect.top + y * K * sy };
      }
      for (const t of ui.targets) if (t.name) result['ui:' + t.name] = toClient(t.x, t.y, t.w, t.h);
      return result;
    },
  };
})(globalThis);
