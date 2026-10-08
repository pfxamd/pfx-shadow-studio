import { createLayer, createShadow } from "./shadow.js";

/**
 * Parses the canonical CSS syntax emitted by the PFx serializer, plus
 * standard px lengths, hex colors, rgb() and rgba() colors.
 * Rejects unfamiliar constructs rather than silently losing information.
 */
export function parseShadow(kind, input) {
  if (typeof input !== "string" || input.length > 65536) {
    throw new TypeError("CSS input must be a string up to 65536 characters");
  }
  let value = input.trim().replace(/;\s*$/, "");
  const property = { box: "box-shadow", text: "text-shadow", drop: "filter" }[kind];
  if (!property) throw new RangeError("unsupported shadow kind");
  const declaration = /^([a-z-]+)\s*:\s*([\s\S]+)$/i.exec(value);
  if (declaration) {
    if (declaration[1].toLowerCase() !== property) {
      throw new SyntaxError("unexpected CSS property");
    }
    value = declaration[2].trim();
  }
  if (value.toLowerCase() === "none") return createShadow(kind, []);
  const parts = kind === "drop" ? splitDropFilters(value) : splitTopLevel(value, ",");
  if (parts.length > 128) throw new RangeError("too many shadow layers");
  return createShadow(kind, parts.map(part => parseLayer(kind, part.trim())));
}

function splitTopLevel(value, separator) {
  const parts = [];
  let depth = 0, start = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "(") depth++;
    if (value[i] === ")") {
      depth--;
      if (depth < 0) throw new SyntaxError("unbalanced parentheses");
    }
    if (value[i] === separator && depth === 0) {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (depth !== 0) throw new SyntaxError("unbalanced parentheses");
  parts.push(value.slice(start).trim());
  if (parts.some(part => !part)) throw new SyntaxError("empty shadow layer");
  return parts;
}

function splitDropFilters(value) {
  const matches = [];
  let remainder = value.trim();
  while (remainder) {
    if (!/^drop-shadow\(/i.test(remainder)) throw new SyntaxError("only drop-shadow() filters are supported");
    let i = remainder.indexOf("(") + 1, depth = 1;
    for (; i < remainder.length && depth; i++) {
      if (remainder[i] === "(") depth++;
      else if (remainder[i] === ")") depth--;
    }
    if (depth) throw new SyntaxError("unclosed drop-shadow()");
    matches.push(remainder.slice(remainder.indexOf("(") + 1, i - 1));
    remainder = remainder.slice(i).trim();
  }
  return matches;
}

function parseLayer(kind, source) {
  const inset = /^inset\s+/i.test(source);
  if (inset && kind !== "box") throw new SyntaxError("inset only works for box shadows");
  source = source.replace(/^inset\s+/i, "");
  const colorMatch = /(#[\da-f]{6}|rgba?\([^()]*\))\s*$/i.exec(source);
  if (!colorMatch) throw new SyntaxError("missing or unsupported color");
  const { color, alpha } = parseColor(colorMatch[1]);
  const lengths = source.slice(0, colorMatch.index).trim().split(/\s+/);
  const expected = kind === "box" ? [2, 3, 4] : [2, 3];
  if (!expected.includes(lengths.length)) throw new SyntaxError("invalid number of lengths");
  const numbers = lengths.map(length => {
    const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(px)?$/i.exec(length);
    if (!match || (!match[2] && Number(match[1]) !== 0)) {
      throw new SyntaxError("only px values are supported");
    }
    return Number(match[1]);
  });
  return createLayer({
    x: numbers[0], y: numbers[1], blur: numbers[2] ?? 0,
    spread: kind === "box" ? (numbers[3] ?? 0) : 0,
    inset, color, alpha
  });
}

function parseColor(input) {
  if (input.startsWith("#")) return { color: input.toLowerCase(), alpha: 1 };
  const inner = input.slice(input.indexOf("(") + 1, -1).trim();
  let channels, alpha = 1;
  if (inner.includes(",")) {
    const pieces = inner.split(",").map(s => s.trim());
    if (pieces.length < 3 || pieces.length > 4) throw new SyntaxError("invalid color");
    channels = pieces.slice(0, 3);
    if (pieces.length === 4) alpha = Number(pieces[3]);
  } else {
    const pieces = inner.split(/\s*\/\s*/);
    if (pieces.length > 2) throw new SyntaxError("invalid color");
    channels = pieces[0].trim().split(/\s+/);
    if (pieces.length === 2) alpha = Number(pieces[1]);
  }
  if (channels.length !== 3 || channels.some(s => !/^\d+$/.test(s))) {
    throw new SyntaxError("unsupported RGB channels");
  }
  const rgb = channels.map(Number);
  if (rgb.some(n => n > 255)) throw new RangeError("RGB channel out of range");
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
    throw new RangeError("alpha out of range");
  }
  return {
    color: "#" + rgb.map(n => n.toString(16).padStart(2, "0")).join(""),
    alpha
  };
}
