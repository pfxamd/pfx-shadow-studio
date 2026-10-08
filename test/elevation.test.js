import test from "node:test";
import assert from "node:assert/strict";
import { createElevationPalette } from "../src/core/elevation.js";
import { serializeDeclaration } from "../src/core/shadow.js";

test("creates distinct immutable elevation levels", () => {
  const palette = createElevationPalette();
  assert.equal(palette.length, 6);
  assert.equal(palette[0].layers.length, 0);
  assert.equal(palette[1].layers.length, 3);
  assert.ok(Object.isFrozen(palette));
  assert.ok(Object.isFrozen(palette[1]));
  assert.notEqual(serializeDeclaration(palette[1]), serializeDeclaration(palette[5]));
});

test("offset and blur increase as elevation increases", () => {
  const palette = createElevationPalette({ levels: 10 });
  for (let i = 2; i < palette.length; i++) {
    assert.ok(palette[i].layers[2].y >= palette[i - 1].layers[2].y);
    assert.ok(palette[i].layers[2].blur >= palette[i - 1].layers[2].blur);
  }
});

test("generates deterministic editable palette", () => {
  assert.deepEqual(createElevationPalette({ color: "#336699" }),
    createElevationPalette({ color: "#336699" }));
});

test("rejects invalid elevation options", () => {
  assert.throws(() => createElevationPalette({ levels: 1 }), RangeError);
  assert.throws(() => createElevationPalette({ layers: 0 }), RangeError);
  assert.throws(() => createElevationPalette({ maxAlpha: Infinity }), RangeError);
  assert.throws(() => createElevationPalette({ color: "blue" }), TypeError);
});
