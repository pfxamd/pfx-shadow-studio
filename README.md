# PFx Shadow Studio

An original, dependency-free CSS shadow editor project by pfxamd.

## Current stage

Phase 1: headless editing core. No UI or third-party runtime or development packages.

- Immutable shadow model for box, text and drop shadows
- Add, edit, remove and reorder layers
- Validate offsets, blur, spread, color and opacity
- Serialize CSS declarations using browser-native shadow properties
- Node.js native tests

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

CSS parser, history manager, elevation presets, automated browser checks, then UI.

All source code in this repository is written specifically for PFx Shadow Studio. The CSS syntax itself follows web platform standards.
