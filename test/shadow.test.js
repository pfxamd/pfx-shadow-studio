import test from "node:test";
import assert from "node:assert/strict";
import {
  createLayer, createShadow, addLayer, updateLayer, removeLayer,
  moveLayer, serializeShadow, serializeDeclaration
} from "../src/core/shadow.js";

test("default layer is immutable and valid", () => {
  const layer = createLayer();
  assert.equal(layer.blur, 24);
  assert.ok(Object.isFrozen(layer));
});

test("rejects invalid values and unsupported combinations", () => {
  assert.throws(() => createLayer({ alpha: 2 }), RangeError);
  assert.throws(() => createLayer({ blur: -1 }), RangeError);
  assert.throws(() => createLayer({ x: Infinity }), TypeError);
  assert.throws(() => createLayer({ color: "red" }), TypeError);
  assert.throws(() => createShadow("text", [createLayer({ spread: 1 })]), RangeError);
  assert.throws(() => createShadow("drop", [createLayer({ inset: true })]), RangeError);
});

test("layers are updated without mutating prior state", () => {
  const first = createShadow();
  const second = updateLayer(first, 0, { blur: 12 });
  assert.equal(first.layers[0].blur, 24);
  assert.equal(second.layers[0].blur, 12);
});

test("add, reorder and remove layers", () => {
  const one = createShadow("box", [createLayer({ x: 1 })]);
  const two = addLayer(one, createLayer({ x: 2 }));
  const moved = moveLayer(two, 0, 1);
  assert.deepEqual(moved.layers.map(l => l.x), [2, 1]);
  assert.equal(removeLayer(moved, 1).layers.length, 1);
  assert.equal(one.layers.length, 1);
  assert.throws(() => removeLayer(one, 2), RangeError);
});

test("serializes box shadow and skips disabled layers", () => {
  const shadow = createShadow("box", [
    createLayer({ x: -2, y: 3, blur: 6, spread: -1, inset: true, alpha: .2 }),
    createLayer({ enabled: false })
  ]);
  assert.equal(serializeShadow(shadow),
    "inset -2px 3px 6px -1px rgb(0 0 0 / 0.2)");
  assert.match(serializeDeclaration(shadow), /^box-shadow:/);
});

test("serializes text and drop shadows using correct syntax", () => {
  const l = createLayer({ x: 2, y: 4, blur: 8 });
  assert.match(serializeDeclaration(createShadow("text", [l])), /^text-shadow: 2px 4px 8px /);
  assert.match(serializeDeclaration(createShadow("drop", [l])), /^filter: drop-shadow\(/);
  assert.equal(serializeShadow(createShadow("box", [])), "none");
});

test("limits layer count", () => {
  assert.throws(() => createShadow("box", Array.from({ length: 129 }, () => createLayer())), RangeError);
});
