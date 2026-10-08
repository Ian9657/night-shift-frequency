// Boot: canvas scaling, the frame loop and input routing.
(function (root) {
  'use strict';
  const { time, layout, world, ui, game, records, sprites, dialogue, radio, phone, signin, outside, drift, messages, found, overlay } = root.NSF;
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
  function worldTarget(point, slop = 1) {
    if (game.state.phase !== 'shift' || records.view.open || phone.view.open || found.view.open || radio.view.dialOpen) return null;
    const x = Math.floor(point.x / K), y = Math.floor(point.y / K);
    const list = game.targets();
    const ordered = [...list.filter(t => t.product).reverse(), ...list.filter(t => !t.product).reverse()];
    const exact = ordered.find(t => sprites.opaqueAt(t.sprite, x - t.x, y - t.y));
    if (exact) return exact;
    // Expand only after exact hits; choose the closest visible pixel and reject ties.
    const candidates = ordered.map(target => {
      let distance = Infinity;
      for (let dx = -slop; dx <= slop; dx++) for (let dy = -slop; dy <= slop; dy++) {
        const d = dx * dx + dy * dy;
        if (d <= slop * slop && d < distance && sprites.opaqueAt(target.sprite, x - target.x + dx, y - target.y + dy)) distance = d;
      }
      return { target, distance };
    }).filter(c => Number.isFinite(c.distance)).sort((a, b) => a.distance - b.distance);
    if (!candidates.length || (candidates[1] && candidates[0].distance === candidates[1].distance)) return null;
    return candidates[0].target;
  }

  function targetAt(point, slop = 1) {
    const hit = ui.hitTest(point.x, point.y);
    if (hit) return { ui: hit };
    const target = worldTarget(point, slop);
    return target ? { world: target } : null;
  }

  // Touch commits on release. Holding world objects inspects them without acting.
  let dragging = null, press = null, touchHoverUntil = 0;
  const touches = new Set();
  function cancelGesture() {
    press = null; dragging = null; touchHoverUntil = 0; game.setHover(null);
  }
  function dispatch(hit, point) {
    if (hit?.ui) hit.ui.action(point);
    else if (hit?.world) game.activate(hit.world.name);
    else if (game.state.phase === 'shift' && !overlay.view.active) game.tap(null);
  }
  function capture(event) { try { if (event.isTrusted) canvas.setPointerCapture?.(event.pointerId); } catch (_) { /* synthetic tests and cancelled pointers */ } }
  const identity = hit => hit?.world?.name || hit?.ui?.name;
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' && event.button !== 0) return;
    event.preventDefault();
    if (event.pointerType === 'touch') {
      touches.add(event.pointerId);
      if (touches.size > 1) { cancelGesture(); return; }
    }
    game.clearFocus();
    render();
    const point = toScreen(event), hit = targetAt(point, event.pointerType === 'touch' ? 3 : 1);
    if (event.pointerType === 'touch') {
      press = { id: event.pointerId, hit, x: event.clientX, y: event.clientY,
        until: time.uiNow + 450, held: false, order: game.state.eventIndex, phase: game.state.phase };
      capture(event);
      touchHoverUntil = 0;
    }
    if (hit?.ui?.drag) {
      dragging = { id: event.pointerId, drag: hit.ui.drag };
      capture(event);
      dispatch(hit, point);
    } else if (event.pointerType !== 'touch') dispatch(hit, point);
  });
  canvas.addEventListener('pointermove', event => {
    if (dragging?.id === event.pointerId) { dragging.drag(toScreen(event)); return; }
    if (event.pointerType === 'touch') {
      if (press?.id === event.pointerId && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) cancelGesture();
      return;
    }
    const hit = targetAt(toScreen(event));
    game.setHover(identity(hit) || null);
    canvas.style.cursor = hit ? 'pointer' : 'default';
  });
  canvas.addEventListener('pointerup', event => {
    touches.delete(event.pointerId);
    if (dragging?.id === event.pointerId) { dragging = null; press = null; return; }
    if (press?.id !== event.pointerId) return;
    const pending = press; press = null;
    if (pending.order !== game.state.eventIndex || pending.phase !== game.state.phase) return;
    const point = toScreen(event), hit = targetAt(point, 3);
    const moved = Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > 10;
    const held = pending.held || (pending.hit?.world && time.uiNow >= pending.until);
    if (!moved && !held && identity(hit) === identity(pending.hit)) dispatch(hit, point);
    if (!moved && pending.hit?.world) {
      game.setHover(pending.hit.world.name);
      touchHoverUntil = time.uiNow + (held ? 1600 : 450);
    }
  });
  canvas.addEventListener('pointercancel', event => { touches.delete(event.pointerId); cancelGesture(); });
  canvas.addEventListener('lostpointercapture', event => {
    if (press?.id === event.pointerId || dragging?.id === event.pointerId) cancelGesture();
  });
  canvas.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'touch') { game.setHover(null); canvas.style.cursor = 'default'; }
  });
  root.addEventListener('blur', () => { touches.clear(); cancelGesture(); });
  canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
    if (touches.size) return;
    cancelGesture();
    if (phone.view.open) phone.close();
    else if (found.view.open) found.close();
    else if (records.view.open) records.close();
    else if (radio.view.dialOpen) radio.closeDial();
  });
  root.addEventListener('keydown', event => {
    if (signin.key(event.key) || found.key(event.key) || phone.key(event.key) || records.key(event.key) || radio.key(event.key)) { event.preventDefault(); return; }
    if (game.state.phase === 'shift' && !overlay.view.active) {
      if (event.key === 'Tab' || event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault(); game.focusTarget(event.key === 'Tab' && event.shiftKey ? -1 : 1); return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault(); game.focusTarget(-1); return;
      }
      if (event.key === 'Escape') { event.preventDefault(); game.cancelSelection(); return; }
      if ((event.key === 'Enter' || event.key === ' ') && game.state.focusTarget) {
        event.preventDefault(); if (!event.repeat) game.activateFocused(); return;
      }
    }
    if ((event.key === 'Enter' || event.key === ' ') && game.state.phase === 'title') game.startShift();
  });

  // Mirror speech and radio into a live region for screen readers.
  let lastLive = '';
  function announce() {
    const value = [ui.interactionAnnouncement(game), dialogue.fullText(), radio.caption()].filter(Boolean).join(' / ');
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
    if (press?.hit?.world && !press.held && time.uiNow >= press.until) {
      press.held = true;
      game.setHover(press.hit.world.name);
    }
    if (touchHoverUntil && time.uiNow >= touchHoverUntil) {
      touchHoverUntil = 0;
      game.setHover(null);
    }
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
