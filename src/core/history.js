/**
 * Immutable undo/redo history. Changes are recorded only when distinct.
 * History is independent of the interface and shadow implementation.
 */
export function createHistory(initial, limit = 100) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
    throw new RangeError("history limit must be an integer from 1 to 1000");
  }
  return Object.freeze({
    past: Object.freeze([]),
    present: initial,
    future: Object.freeze([]),
    limit
  });
}

export function commitHistory(history, next) {
  if (Object.is(history.present, next)) return history;
  return Object.freeze({
    past: Object.freeze([...history.past, history.present].slice(-history.limit)),
    present: next,
    future: Object.freeze([]),
    limit: history.limit
  });
}

export function undo(history) {
  if (history.past.length === 0) return history;
  const past = history.past.slice(0, -1);
  return Object.freeze({
    past: Object.freeze(past),
    present: history.past.at(-1),
    future: Object.freeze([history.present, ...history.future]),
    limit: history.limit
  });
}

export function redo(history) {
  if (history.future.length === 0) return history;
  return Object.freeze({
    past: Object.freeze([...history.past, history.present].slice(-history.limit)),
    present: history.future[0],
    future: Object.freeze(history.future.slice(1)),
    limit: history.limit
  });
}
