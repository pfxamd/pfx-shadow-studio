/**
 * PFx Shadow Studio — independent shadow model and CSS serializer.
 * No runtime dependencies. All functions are pure.
 */
export const SHADOW_KINDS = Object.freeze(["box", "text", "drop"]);

const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
const requireFinite = (value, name) => {
  if (!isFiniteNumber(value)) throw new TypeError(name + " must be a finite number");
  return value;
};
const requireNumberAtLeast = (value, min, name) => {
  requireFinite(value, name);
  if (value < min) throw new RangeError(name + " must be >= " + min);
  return value;
};
const requireAlpha = (value) => {
  requireFinite(value, "alpha");
  if (value < 0 || value > 1) throw new RangeError("alpha must be between 0 and 1");
  return value;
};
const requireColor = (value) => {
  if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new TypeError("color must be a six-digit hex color");
  }
  return value.toLowerCase();
};

export function createLayer(values = {}) {
  if (values === null || typeof values !== "object" || Array.isArray(values)) {
    throw new TypeError("layer values must be an object");
  }
  const allowed = new Set(["x", "y", "blur", "spread", "color", "alpha", "inset", "enabled"]);\n  for (const key of Object.keys(values)) {\n    if (!allowed.has(key)) throw new TypeError("unknown layer property: " + key);\n  }\n  const { x = 0, y = 8, blur = 24, spread = 0, color = "#000000",
    alpha = 0.15, inset = false, enabled = true } = values;
  if (typeof inset !== "boolean" || typeof enabled !== "boolean") {
    throw new TypeError("inset and enabled must be booleans");
  }
  return Object.freeze({
    x: requireFinite(x, "x"), y: requireFinite(y, "y"),
    blur: requireNumberAtLeast(blur, 0, "blur"),
    spread: requireFinite(spread, "spread"),
    color: requireColor(color), alpha: requireAlpha(alpha), inset, enabled
  });
}

export function createShadow(kind = "box", layers = [createLayer()]) {
  if (!SHADOW_KINDS.includes(kind)) throw new RangeError("unsupported shadow kind");
  if (!Array.isArray(layers) || layers.length > 128) {
    throw new RangeError("layers must be an array with at most 128 entries");
  }
  const normalized = layers.map(layer => createLayer(layer));
  if (kind !== "box" && normalized.some(layer => layer.inset || layer.spread !== 0)) {
    throw new RangeError("text and drop shadows do not support inset or spread");
  }
  return Object.freeze({ kind, layers: Object.freeze(normalized) });
}

export function addLayer(shadow, layer = createLayer()) {
  const normalized = createShadow(shadow.kind, shadow.layers);
  return createShadow(normalized.kind, [...normalized.layers, layer]);
}

export function updateLayer(shadow, index, patch) {
  const normalized = createShadow(shadow.kind, shadow.layers);
  assertIndex(index, normalized.layers.length);
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new TypeError("patch must be an object");
  }
  const next = normalized.layers.map((layer, i) =>
    i === index ? createLayer({ ...layer, ...patch }) : layer
  );
  return createShadow(normalized.kind, next);
}

export function removeLayer(shadow, index) {
  const normalized = createShadow(shadow.kind, shadow.layers);
  assertIndex(index, normalized.layers.length);
  return createShadow(normalized.kind, normalized.layers.filter((_, i) => i !== index));
}

export function moveLayer(shadow, fromIndex, toIndex) {
  const normalized = createShadow(shadow.kind, shadow.layers);
  assertIndex(fromIndex, normalized.layers.length);
  assertIndex(toIndex, normalized.layers.length);
  const layers = [...normalized.layers];
  const [layer] = layers.splice(fromIndex, 1);
  layers.splice(toIndex, 0, layer);
  return createShadow(normalized.kind, layers);
}

function assertIndex(index, length) {
  if (!Number.isInteger(index) || index < 0 || index >= length) {
    throw new RangeError("layer index out of range");
  }
}

function formatNumber(value) {
  return Number(value.toFixed(4)).toString();
}

function rgba({ color, alpha }) {
  const digits = color.slice(1);
  const r = parseInt(digits.slice(0, 2), 16);
  const g = parseInt(digits.slice(2, 4), 16);
  const b = parseInt(digits.slice(4, 6), 16);
  return `rgb(${r} ${g} ${b} / ${formatNumber(alpha)})`;
}

export function serializeShadow(shadow) {
  const normalized = createShadow(shadow.kind, shadow.layers);
  const layers = normalized.layers.filter(layer => layer.enabled);
  if (!layers.length) return "none";
  const px = n => formatNumber(n) + "px";
  return layers.map(layer => {
    const base = `${px(layer.x)} ${px(layer.y)} ${px(layer.blur)}`;
    const color = rgba(layer);
    if (normalized.kind === "box") {
      return `${layer.inset ? "inset " : ""}${base} ${px(layer.spread)} ${color}`;
    }
    if (normalized.kind === "text") return `${base} ${color}`;
    return `drop-shadow(${base} ${color})`;
  }).join(normalized.kind === "drop" ? " " : ", ");
}

export function serializeDeclaration(shadow) {
  const normalized = createShadow(shadow.kind, shadow.layers);
  const property = normalized.kind === "box" ? "box-shadow" :
    normalized.kind === "text" ? "text-shadow" : "filter";
  return `${property}: ${serializeShadow(normalized)};`;
}
