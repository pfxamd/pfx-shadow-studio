# PFx Shadow Studio

An original, dependency-free CSS shadow editor project by pfxamd.

## Current stage

Phase 1: headless editing core. No UI or third-party runtime or development packages.

- Immutable shadow model for box, text and drop shadows
- Add, edit, remove and reorder layers
- Validate offsets, blur, spread, color and opacity
- Serialize CSS declarations using browser-native shadow properties
- Strict CSS parsing for supported px and RGB/hex shadow syntax\n- Immutable bounded undo/redo history\n- Node.js native tests

## Test

With Node.js 22 or newer:

```sh
npm test
```

No package installation is required.

## Structure

- `src/core/shadow.js` — shadow model, layer operations and CSS serialization
- `test/shadow.test.js` — native Node.js unit tests

## Next milestones

Elevation presets, automated browser checks, then UI.\n\nParser scope is deliberately strict: unsupported CSS expressions cause explicit errors, rather than silently discarding styling.

All source code in this repository is written specifically for PFx Shadow Studio. The CSS syntax itself follows web platform standards.
