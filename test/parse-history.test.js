import test from "node:test";
import assert from "node:assert/strict";
import { createLayer, createShadow, serializeDeclaration } from "../src/core/shadow.js";
import { parseShadow } from "../src/core/parse.js";
import { createHistory, commitHistory, undo, redo } from "../src/core/history.js";

for (const kind of ["box", "text", "drop"]) {
  test(kind + ": serializer round-trip preserves supported values", () => {
    const layer = createLayer({
      x: -3, y: 5, blur: 12, spread: kind === "box" ? -2 : 0,
      inset: kind === "box", color: "#285aaa", alpha: 0.2
    });
    const shadow = createShadow(kind, [layer, createLayer({ color: "#ffffff", alpha: 1 })]);
    const restored = parseShadow(kind, serializeDeclaration(shadow));
    assert.deepEqual(restored, shadow);
  });
}
test("parses CSS none", () => {
  assert.equal(parseShadow("box", "none").layers.length, 0);
});
test("rejects unsupported expressions without corrupting input", () => {
  assert.throws(() => parseShadow("box", "0 2rem 4px red"), SyntaxError);
  assert.throws(() => parseShadow("box", "0 2px 4px var(--color)"), SyntaxError);
  assert.throws(() => parseShadow("drop", "blur(4px)"), SyntaxError);
});
test("undo/redo maintains independent immutable states", () => {
  const a = createHistory("a", 2);
  const b = commitHistory(a, "b");
  const c = commitHistory(b, "c");
  assert.equal(undo(c).present, "b");
  assert.equal(redo(undo(c)).present, "c");
  assert.equal(commitHistory(undo(c), "d").future.length, 0);
  assert.equal(a.present, "a");
});
test("history remains bounded", () => {
  let h = createHistory(0, 2);
  for (let i = 1; i <= 10; i++) h = commitHistory(h, i);
  assert.equal(h.past.length, 2);
  assert.equal(undo(undo(h)).present, 8);
});
