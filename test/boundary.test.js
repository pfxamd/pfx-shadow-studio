import test from "node:test";
import assert from "node:assert/strict";
import { createLayer, createShadow, serializeDeclaration, updateLayer } from "../src/core/shadow.js";
import { parseShadow } from "../src/core/parse.js";

test("unknown properties must not disappear silently", () => {
  assert.throws(() => createLayer({ blurr: 8 }), TypeError);
  assert.throws(() => updateLayer(createShadow(), 0, { opacity: 0.5 }), TypeError);
});

test("maximum 128 layers round-trip", () => {
  const layers = Array.from({ length: 128 }, (_, i) =>
    createLayer({ x: i, y: -i, blur: i / 2, alpha: 0.2 }));
  const shadow = createShadow("box", layers);
  assert.deepEqual(parseShadow("box", serializeDeclaration(shadow)), shadow);
  assert.throws(() => createShadow("box", [...layers, createLayer()]), RangeError);
});
