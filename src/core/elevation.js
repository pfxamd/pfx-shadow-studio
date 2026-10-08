import { createLayer, createShadow } from "./shadow.js";

/**
 * Deterministic elevation palettes. No third-party easing or dependencies.
 * Each level is a complete, independently editable box shadow.
 */
export function createElevationPalette(options = {}) {
  const {
    levels = 6, layers = 3, maxOffset = 18, maxBlur = 40,
    maxAlpha = 0.22, color = "#000000"
  } = options;
  if (!Number.isInteger(levels) || levels < 2 || levels > 24) {
    throw new RangeError("levels must be an integer from 2 to 24");
  }
  if (!Number.isInteger(layers) || layers < 1 || layers > 16) {
    throw new RangeError("layers must be an integer from 1 to 16");
  }
  for (const [key, value] of Object.entries({ maxOffset, maxBlur, maxAlpha })) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new RangeError(key + " must be non-negative and finite");
    }
  }
  if (maxAlpha > 1) throw new RangeError("maxAlpha must not exceed 1");
  // Validate color through the canonical layer model.
  createLayer({ color });
  const result = [];
  for (let level = 0; level < levels; level++) {
    if (level === 0) {
      result.push(createShadow("box", []));
      continue;
    }
    const depth = level / (levels - 1);
    const easedDepth = depth * depth * (3 - 2 * depth);
    const items = [];
    for (let index = 1; index <= layers; index++) {
      const fraction = index / layers;
      const distance = easedDepth * fraction;
      items.push(createLayer({
        x: 0,
        y: maxOffset * distance,
        blur: maxBlur * distance,
        spread: 0,
        alpha: Math.min(1, maxAlpha * easedDepth * (1 - 0.55 * fraction) / layers),
        color
      }));
    }
    result.push(createShadow("box", items));
  }
  return Object.freeze(result);
}
