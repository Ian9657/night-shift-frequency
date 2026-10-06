# Character Asset Specification

Status: production contract for the next asset pass, **not a description of the
playable build**. Implementation phases belong to the clearly marked
[target section in worldview.md](worldview.md#target-character-asset-pipeline).
Current runtime organisation belongs to [architecture.md](architecture.md).

## Scope and acceptance

New customers are assembled from a body preset, authored pose parts, hair, outfit,
slot colours, face and props. Sharing a skeleton shares joint names and pose rules;
it does not make one rendered arm fit every garment or body preset.

The generated ten-person lineup (local, untracked:
`tests/artifacts/body-reference/`) is a **style reference only**: its proportions,
calm faces and readable outfits guide the drawing. It is not an indexed sprite
bundle, has not passed native-pixel, palette, anchor, layering or animation checks,
and its designs are not assigned to anyone. Every customer's identity (outfit,
hair, build, height, colours), including Nell and her other half, is defined in
worldview.md and customers.js. The images are AI-generated; do not commit them or
ship them without settling their licence.

## Native pixel grid: the first-person counter

Customers are seen across the counter from the clerk's eye, so they are authored at
that scale, in world pixels (the 480 × 270 world, drawn at 2× on 960 × 540). The
grid and camera live in `js/content/space.js`.

| Property | Contract |
| --- | --- |
| Customer canvas | `space.customer.canvas`: 176 × 210 world pixels |
| Placement | Canvas top-left at `space.customerOrigin()`; taller or shorter figures shift by `space.figureOffset(height)` |
| Scale | 151.5 px per metre in the customer plane (z = 1.32 m) |
| Centre axis | X = 88 (mirror axis 87.5) |
| Standard figure | 1.68 m: crown at Y = 40, chin at Y = 73 |
| Head budget | 33 px crown to chin, about 36 px with hair; about 7 heads tall, as in the reference lineup |
| Counter top | 1.05 m (`space.counter.y`): at the navel of the standard figure, just below its hanging elbow; the belt or lower belly of a tall figure, the upper belly of a short one, never the chest |
| Occlusion line | Seen from the clerk, the counter's far edge hides the body below about 0.97 m, canvas row ≈ 148 for the standard figure: lower than the counter top, because the customer stands back from the edge |
| Scaling | None. Pixels are authored at this size; no filtered, non-integer or stretched resampling |

Keep the two counter heights apart. Garment lines (waist, belt, hem) follow the
body's own landmarks, never the occlusion line on screen; a pose that touches the
counter reaches the counter top, not the occlusion line.

Heights are real: the head stays the same size and height changes go mostly into
the legs (the trunk takes about a quarter of the difference), so taller people
show more hip and thigh above the counter and shorter people less. Do not author a
squat, big-headed figure (about 5 heads): it reads as a child next to the store.

## Body presets and anchors

Builds are `slim`, `average`, `broad` and `heavy` (art/src/people.cjs `BUILDS`):
they set shoulder, chest, waist and hip widths and depths, neck and arm thickness,
measured against the fixed head and the reference body: the shoulders' outline about
2.5 head widths across, the neck about 0.65, the hanging arms a little off the body.
As in the reference, the trunk is drawn at about 0.87 of anatomical length and the
arms at about 0.86 (still long enough to rest a hand on the counter); short tops end
just above the hip bones. Height, arm length and thickness and hand length and width
are each person's own (`person.height`, `arms`, `hands` in customers.js). Age is a
face, hair and posture attribute, not a build. Do not introduce a child build
without a story requirement, and do not hard-code gender into animation rules.

Every frame carries integer local anchors. Left/right mean the character's
anatomical left/right (front view: character-left is screen-right). The table
freezes the **standard (average, 1.68 m) neutral reference with both arms
hanging**, computed from the rig; pose frames and other figures author their own
coordinates with the same anchor names, and moving hands must move their anchors.

| Anchor | Standard neutral coordinate | Purpose |
| --- | --- | --- |
| crown | (88, 40) | Placement and height |
| chin | (88, 73) | Head attachment |
| neck | (88, 85) | Neck/torso connection (base of the neck) |
| chest | (88, 107) | Torso reference |
| waist | (88, 132) | Garment fit |
| pelvis | (88, 150) | Lower-body reference |
| shoulder_l / shoulder_r | (109, 91) / (67, 91) | Sleeve roots |
| elbow_l / elbow_r | (116, 132) / (60, 132) | Arm bends |
| wrist_l / wrist_r | (120, 168) / (56, 168) | Hand attachment (hidden by the counter when hanging) |
| hip_l / hip_r | (99, 157) / (77, 157) | Leg roots |
| knee_l / knee_r | (100, 227) / (76, 227) | Below the canvas; for reference only |

Hanging hands reach the upper-to-middle thigh. Inspect joints with a temporary
review overlay (`art-rig-flat.png`); never show that overlay during gameplay.
Existing singular `hand` anchors remain valid for the old caller until an
integration adapter deliberately selects `hand_l` or `hand_r`.

## Parts and occlusion

Separate hair-back, lower-body, torso, back-arm, front-arm, head, hair-front,
face/extras and prop assets only when separation enables real pose reuse. Avoid
splitting every finger or facial feature into its own sprite.

Default neutral draw order is hair-back → back-arm → lower-body → torso → head →
face → hair-front → front-arm → accessories. Each authored pose specifies its
ordered parts and prop insertion point; an accessory behind the face belongs
before the face, and a held prop may sit between palm and fingers.

Counter poses require explicit `behind`, `counter-contact` and `over-device` passes;
the rig renders them as the `back` and `front` layers (behind the counter, under and
over the hair), `counter` and `over` layers. The room and devices remain scene-owned
occluders. Do not draw the whole customer above the counter. Test hair, sleeve, palm
and prop occlusion in the actual counter scene, not just on a blank sheet.

Runtime may switch authored parts, translate them on integer coordinates, mirror
approved symmetric parts, attach props at grip anchors and swap palette slots.
It must not synthesize limbs, interpolate joints, stretch sprites or rotate limbs
by arbitrary angles. Turns use authored views. Build-time rig/IK tools may assist
pose construction; their output still requires pixel-cluster review.

## Palette and detail

Base sprite pixels must be indices from art/palette.cjs. Preserve the existing
skin/hair/cloth/under/accent slot recolouring in customers.js; slot colours are
resolved by that API, not baked into a separate image per NPC.

Use compact clusters and a few tones per material. Outline with the material's
darkest tone. Use shared hue-shift ramps and pixel shading tools. No gradients,
antialiasing, fabric noise, individual hair strands or details that disappear at
native resolution. A mouth or eye change must remain legible at 1×.

## Naming and authoring

New sprite keys follow:
`npc-{part}-{variant}-{build}-{view}-{action}-{frame}`.
Fields are joined by hyphens, so no field may contain one: write several words in
camelCase. Frame numbers are zero-padded from `00`; view is `front`, `side` or
`back`. Example: `npc-armFront-crewneck-average-front-idle-00`.
Keep existing sprite names until their callers migrate; no mass renaming.

Pose definitions and compatibility metadata belong in the content layer; sprite
authors belong in art/src. New helper build tools belong in art/tools. Palette-only
manual edits belong in art/overrides/<sprite-key>.png. Rebuild sprite-data.js through
the art tool; never edit the bundle by hand. Review images in tests/artifacts are
disposable, not canonical asset sources.

## Animation contract (reserved; not an implemented API)

A clip declaration contains `action`, `view`, `bodyPreset`, `frames`, `loop`,
`compatibleOutfits` and `requiredProps`. Each frame contains `durationMs`, ordered
parts, authored anchors and optional event markers. These field names specify the
next implementation, not functions available in the current build.

Timing uses NSF.time. Clip switching resets the local frame clock. A finite clip
finishes once, releases its prop/event state and returns to idle. Shared clips
fall back to that preset's neutral frame when an outfit has not been validated;
never borrow another preset's limb parts silently.

| Clip | Unique frames | Initial timing | Behaviour |
| --- | --- | --- | --- |
| idle | 3 | 300/200/300/200 ms in sequence 0–1–2–1 | 4 playback steps; <=1 px authored breathing |
| talk | 3 | 120 ms per frame | Mouth states layered over idle; stop with dialogue |
| handover | 4 | 160 ms per frame | Finite; grip/release markers exactly once |
| walk | 6 per approved view | 100 ms per frame | Deferred; 600 ms cycle |
| turn | 3 authored views | Static front/side/back selection | Not a smooth rotation clip |

Animation is not synonymous with new full-body images: unchanged parts can be
referenced in many frames. Outfit-specific silhouettes still need authored variants.
Do not count a reversed playback step as a new asset.

Initial movement target for a future walk integration: 24 native world px per
second, or 14.4 px per six-frame cycle. Tune only against an in-scene route test.
Accumulate motion in time-based state and draw at integer coordinates; align foot
contact to travel to avoid sliding. This value does not replace current movement.
Mirroring a side view is allowed only if hair, garment and prop asymmetry survive;
otherwise author the opposite side explicitly.

Face states: neutral, tired, concerned and faint smile, plus closed/open mouth and
blink. Keep the same face identity and head geometry. Ordinary night-shift fatigue
should lead the expressions; avoid exaggerated cartoon reactions. Mouth and body
clips run together rather than creating separate full-body talk animations.

## Compatibility and acceptance gate

Each outfit declares supported body presets and views; each pose declares required
hand/prop variants. Random stress combinations are drawn only from compatible
sets. Start with five hair variants, five tops and five lower-body variants, then
exercise the ten approved looks and supported combinations across idle, talk and
handover. Invalid combinations must be rejected or use an explicit fallback.

Review native pixels and nearest-neighbour enlargements for neck continuity,
shoulder/elbow/wrist alignment, sleeve fit, hip/hem continuity, ground contact,
clipping, anchor drift, face readability, palette validity and counter occlusion.
Review desktop and phone scenes after runtime presentation changes. Test motion
at natural speed as well as accelerated test speed.

For runtime integration run shift-engine, content, art, browser-flow and visual
checks listed in AGENTS.md. Report failures and unverified checks; never declare
an asset production-ready solely because an image generation prompt requested it.
