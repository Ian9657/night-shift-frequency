# Night Shift Frequency

A short pixel-art night-shift game about ordinary checkout work and unreliable
register records. The current playable build contains eight orders.

## Play

Open `index.html` or `greybox.html` in a browser, then click START SHIFT.
No development server or build step is required. Sound starts after interaction.

Use `greybox.html?seed=review-01` for a reproducible shift. Reload resets the game;
there is no save across refreshes.

## Current Gameplay

- Scan physical items, take cash/card/phone payments, heat requested food after
  payment, then bag or hand over the order.
- Identical purchases scan independently and aggregate as quantities on the POS
  and receipt.
- Ordinary orders vary by product, payment, service and conversational style.
- Order five separates physical rescan evidence from the final record choice.
  Click the POS screen for evidence. Leave the panel, select the item and use the
  actual scanner; choices appear only after that check.
- Order eight references the saved fifth-order record as new evidence.
- Both decisions have two valid paths. Closing totals derive from the ledger.
- Order input is immutable. Original scanner observations, saved labels, record
  origin and verification method remain separate throughout both conflict orders.

## Project Map

- `greybox.html`: scene and register markup; `index.html`: default entry redirect.
- `js/shift-engine.js`: deterministic orders, investigation, decisions and ledger.
- `js/register-ui.js`: record evidence, choices and archive UI.
- `js/pixel-world.js`: 640x360 coordinates, fixed sprite sizes and snapped motion.
- `js/payment-motion.js`: authored payment poses and anchored card/phone props.
- `js/greybox.js`: scene, dialogue, sound and checkout orchestration.
- `css/`: scene and record-panel styles.
- `assets/pixel-sprites/`: current SVG artwork, including ten customer pose sets.
- `tests/`: engine, browser-flow, placement and payment regression tests.
- `docs/`: design, build notes and review material.

The current visual pass keeps the authored SVG silhouettes intact while adding
crisp pixel scaling, restrained CRT edge shading, stepped interaction pulses,
and a cool-to-warm night-shift lighting grade across the scene. Product sprites
use contained sizing so their native proportions remain stable at desktop and
mobile viewports.

## Verification

Run `node tests/shift-engine.test.cjs` for deterministic generation and ledger tests.
Run `node tests/pixel-world.test.cjs` for sprite sizing and movement invariants.
Browser tests require Chrome and Playwright:

```sh
node tests/browser-flow.cjs
node tests/product-layout.cjs
node tests/payment-visual.cjs
node tests/pixel-world-browser.cjs
```

Set `PLAYWRIGHT_MODULE` to the absolute Playwright module path if necessary.
Screenshots are generated under `tests/artifacts/`; these are disposable test
outputs, not retained versions of the game.

## Design And Maintenance

[Gameplay blueprint](docs/gameplay-blueprint-v2.md) defines the eight-order
experiment. [Build notes](docs/eight-order-build.md) describe implementation,
verification and open playtest questions.

[AGENTS.md](AGENTS.md) records the maintenance agreement: review and simplify
affected code after substantial updates, remove obsolete implementations, run
regressions and keep only the current build. No legacy executable or asset
archives are maintained.

The main controller still owns several systems. Future extraction should follow
real ownership boundaries, with tests, rather than creating files merely to lower
its line count.
