# Project Maintenance

- Keep only the current playable version. Do not create legacy builds, dated
  backups, copied source trees or unused asset variants unless explicitly asked.
- After every substantial update, review the affected modules and their callers.
  Remove obsolete code, unused imports/assets, temporary debug UI and duplicated
  implementations. Do not leave an old implementation hidden behind CSS.
- Refactor when it removes real duplication or clarifies ownership. Avoid broad,
  unrelated rewrites and abstractions created only to split a large file.
- Preserve gameplay behavior during cleanup. Verify static and dynamically
  generated asset references before deleting resources.
- Keep orders immutable. Derive rescan/decision eligibility from domain history,
  not duplicate UI flags. Preserve observations separately from committed labels,
  and record origin separately from verification method.
- Keep normal gameplay in the counter scene. Secondary evidence controls belong
  on the POS; do not add an external HUD or reveal record choices before rescan.
- Keep the root limited to entry pages, README, project instructions/configuration
  and active source/assets/docs/tests directories. Test screenshots belong under
  tests/artifacts and are disposable, not version archives.
- Run the engine, full browser flow, product layout and payment visual tests after
  major interaction or cleanup changes. Check desktop/mobile screenshots when
  presentation changes. Report anything not verified.
- Update README and current build notes with the actual implementation; do not
  describe planned or removed features as active.
- Use PixelWorld's 640x360 coordinates for scene objects and motion. Keep native
  sprite proportions, fixed world heights and integer foot anchors. Resize the
  entire world uniformly; do not reintroduce per-product depth/pose stretching.
- Payment silhouettes belong in authored SVG poses. Code switches poses and
  anchored props; it must not generate or interpolate anatomical outlines.

## Verification

- `node tests/shift-engine.test.cjs`
- `node tests/browser-flow.cjs`
- `node tests/product-layout.cjs`
- `node tests/payment-visual.cjs`
- `node tests/pixel-world.test.cjs`
- `node tests/pixel-world-browser.cjs`

Browser tests require Chrome and Playwright; set PLAYWRIGHT_MODULE to an absolute
module path when Playwright is not installed locally.
