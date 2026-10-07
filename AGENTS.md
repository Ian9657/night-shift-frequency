# Project Maintenance

- Keep only the current playable version. Do not create legacy builds, dated
  backups, copied source trees or unused asset variants unless explicitly asked.
  Git history holds earlier versions.
- After every substantial update, review the affected modules and their callers.
  Remove obsolete code, unused strings/sprites, temporary debug UI and duplicated
  implementations.
- Refactor when it removes real duplication or clarifies ownership. Avoid broad,
  unrelated rewrites and abstractions created only to split a large file.
- Preserve gameplay behavior during cleanup. `tests/art.test.cjs` and
  `tests/content.test.cjs` check sprite and string references; keep them passing
  before deleting resources.
- Keep orders immutable. Derive rescan/decision eligibility from domain history,
  not duplicate UI flags. Preserve observations separately from committed labels,
  and record origin separately from verification method.
- Keep normal gameplay in the counter scene. Record evidence and choices belong
  on the POS; do not add an external HUD or reveal record choices before rescan.
- Keep the root limited to `index.html`, `README.md`, `AGENTS.md`, `CONTRIBUTING.md`,
  `CHANGELOG.md`, `LICENSE`, git configuration and the `art/`, `assets/`, `docs/`, `js/`,
  `tests/` directories. Build tools live in `art/tools/`. Test screenshots and art review
  sheets belong under `tests/artifacts` and are disposable.
- Run the full verification list after major interaction or cleanup changes.
  Check desktop and phone screenshots when presentation changes. Report anything
  not verified.
- Each document has one job; keep it current and don't duplicate between them:
  `README.md` (players), `CONTRIBUTING.md` (workflow), `docs/architecture.md` (how the
  code is organised), `docs/game-design.md` (rules of the current game),
  `docs/worldview.md` (world and story, including the target design),
  `docs/character-assets.md` (the contract for customer artwork: scale, anchors,
  layers, naming, animation; a target, not a description of the build), `CHANGELOG.md`
  (what changed and how it was verified). Add a CHANGELOG entry for every substantial
  change, including what was not verified. Never describe planned or removed features
  as active outside `docs/worldview.md`'s clearly marked target sections.
- `LICENSE` lists which files are code (MIT) and which are artwork, story and text (all
  rights reserved). Classify new files there when they don't fit an existing entry.

## Pixels, art and text

- The world is 480x270 pixels drawn at 2x on a 960x540 canvas. UI text uses the
  960x540 grid. The store is modelled in metres in `js/content/space.js`;
  screen positions derive from it in `js/content/layout.js`. Use integer pixel coordinates.
- Shade with the shared tools: hue-shifted ramps (`js/content/colors.js`), `volume`,
  `light` with normals and `glow` in `art/tools/pixel.cjs`. Outline with each
  material's darkest tone rather than black.
- All sprites are indexed to `art/palette.cjs`. Author them in `art/src`, or put an
  Aseprite edit in `art/overrides/<name>.png` using palette colours only. Never
  hand-edit `assets/sprite-data.js` or `assets/font-data.js`; `art/png/` is an
  untracked export (`build-art.cjs --png`). Rebuild
  with `node art/tools/build-art.cjs` / `python3 art/tools/build-font.py`.
- Customer variety comes from parts plus slot colours (`js/content/customers.js`),
  not copied sprites. Poses are authored parts; runtime code only switches parts
  and attaches props at hand anchors. It must not generate or interpolate limbs.
- The game is English-only. Every player-facing string lives in
  `js/content/strings.js`; rebuild the font after adding characters, and widen the
  subset in `art/font/` if a character falls outside it.
- All waits and motion use `NSF.time` so tests can change speed. Do not add raw
  `setTimeout` for game state (audio texture is the only exception).

## Verification

- `node tests/shift-engine.test.cjs`
- `node tests/content.test.cjs`
- `node tests/art.test.cjs`
- `node tests/browser-flow.cjs`
- `node tests/interaction.test.cjs`
- `node tests/visual.cjs`

Browser tests require Chrome and Playwright; set PLAYWRIGHT_MODULE to an absolute
module path when Playwright is not installed locally.
