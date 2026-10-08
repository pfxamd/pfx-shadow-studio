import { createLayer, createShadow, addLayer, updateLayer, removeLayer, moveLayer, serializeDeclaration, serializeShadow } from "../core/shadow.js";
import { parseShadow } from "../core/parse.js";
import { createHistory, commitHistory, undo, redo } from "../core/history.js";

const $ = id => document.getElementById(id);
let history = createHistory(createShadow());
let selected = 0;
let previewType = "card";
const fields = ["x", "y", "blur", "spread", "alpha"];
const state = () => history.present;
const notify = value => { $("message").textContent = value; };
const save = next => { history = commitHistory(history, next); render(); };
const layerAt = () => state().layers[selected];
const enable = (id, enabled) => { $(id).disabled = !enabled; };
function renderLayers() {
  const root = $("layers");
  root.replaceChildren();
  $("count").textContent = state().layers.length + (state().layers.length === 1 ? " LAYER" : " LAYERS");
  state().layers.forEach((layer, index) => {
    const item = document.createElement("div");
    item.className = "layer" + (index === selected ? " active" : "");
    const bullet = document.createElement("span");
    bullet.className = "layer-bullet";
    bullet.style.background = layer.color;
    const choose = document.createElement("button");
    choose.className = "layer-select";
    const heading = document.createElement("strong");
    heading.textContent = "Layer " + String(index + 1).padStart(2, "0");
    const detail = document.createElement("small");
    detail.textContent = layer.x + "px / " + layer.y + "px / " + layer.blur + "px";
    choose.append(heading, detail);
    choose.addEventListener("click", () => { selected = index; render(); });
    const actions = document.createElement("div");
    actions.className = "layer-actions";
    const visibility = document.createElement("button");
    visibility.className = "layer-eye";
    visibility.textContent = layer.enabled ? "◉" : "○";
    visibility.title = layer.enabled ? "Hide layer" : "Show layer";
    visibility.setAttribute("aria-pressed", String(layer.enabled));
    visibility.addEventListener("click", () => save(updateLayer(state(), index, { enabled: !layer.enabled })));
    const up = document.createElement("button");
    up.className = "layer-eye";
    up.textContent = "↑";
    up.title = "Move layer up";
    up.disabled = index === 0;
    up.addEventListener("click", () => { save(moveLayer(state(), index, index - 1)); selected = index - 1; render(); });
    const down = document.createElement("button");
    down.className = "layer-eye";
    down.textContent = "↓";
    down.title = "Move layer down";
    down.disabled = index === state().layers.length - 1;
    down.addEventListener("click", () => { save(moveLayer(state(), index, index + 1)); selected = index + 1; render(); });
    const remove = document.createElement("button");
    remove.className = "layer-remove";
    remove.textContent = "×";
    remove.title = "Remove layer";
    remove.addEventListener("click", () => { save(removeLayer(state(), index)); selected = Math.max(0, Math.min(selected, state().layers.length - 1)); render(); });
    actions.append(visibility, up, down, remove);
    item.append(bullet, choose, actions);
    root.append(item);
  });
}
function render() {
  $("kind").value = state().kind;
  if (selected >= state().layers.length) selected = Math.max(0, state().layers.length - 1);
  renderLayers();
  const layer = layerAt();
  $("selectedName").textContent = layer ? "Layer " + String(selected + 1).padStart(2, "0") + " / Active" : "No layer selected";
  $("controls").querySelectorAll("input").forEach(input => input.disabled = !layer);
  $("insetRow").hidden = state().kind !== "box";
  document.querySelector('[data-control="spread"]').hidden = state().kind !== "box";
  if (layer) {
    fields.forEach(key => {
      $(key).value = layer[key];
      $(key + "Value").textContent = key === "alpha" ? Math.round(layer[key] * 100) + "%" : layer[key] + " px";
    });
    $("color").value = layer.color;
    $("colorValue").textContent = layer.color.toUpperCase();
    $("inset").checked = layer.inset;
  }
  $("undo").disabled = history.past.length === 0;
  $("redo").disabled = history.future.length === 0;
  $("add").disabled = state().layers.length >= 128;
  const declaration = serializeDeclaration(state());
  $("code").textContent = declaration;
  const preview = $("preview");
  preview.style.boxShadow = "none";
  preview.style.textShadow = "none";
  preview.style.filter = "none";
  if (state().kind === "box") preview.style.boxShadow = serializeShadow(state());
  else if (state().kind === "text") preview.style.textShadow = serializeShadow(state());
  else preview.style.filter = serializeShadow(state());
  preview.dataset.preview = previewType;
  $("previewContent").querySelector("strong").textContent = previewType === "button" ? "Explore shadow ↗" : previewType === "text" ? "Depth is a detail." : "Depth is a detail.";
}
fields.forEach(key => $(key).addEventListener("input", () => {
  if (!layerAt()) return;
  const next = Number($(key).value);
  save(updateLayer(state(), selected, { [key]: next }));
}));
$("color").addEventListener("input", () => { if (layerAt()) save(updateLayer(state(), selected, { color: $("color").value })); });
$("inset").addEventListener("change", () => { if (layerAt()) save(updateLayer(state(), selected, { inset: $("inset").checked })); });
$("add").addEventListener("click", () => { const index = state().layers.length; save(addLayer(state(), createLayer())); selected = index; render(); });
$("kind").addEventListener("change", () => {
  const kind = $("kind").value;
  const layers = state().layers.map(layer => createLayer({ ...layer, inset: kind === "box" && layer.inset, spread: kind === "box" ? layer.spread : 0 }));
  save(createShadow(kind, layers));
});
$("reset").addEventListener("click", () => { selected = 0; save(createShadow()); notify("Editor reset."); });
$("undo").addEventListener("click", () => { history = undo(history); render(); });
$("redo").addEventListener("click", () => { history = redo(history); render(); });
document.querySelectorAll("[data-preview]").forEach(button => button.addEventListener("click", () => {
  previewType = button.dataset.preview;
  document.querySelectorAll("[data-preview]").forEach(b => b.classList.toggle("active", b === button));
  render();
}));
document.querySelectorAll("[data-background]").forEach(button => button.addEventListener("click", () => {
  $("canvas").dataset.background = button.dataset.background;
  document.querySelectorAll("[data-background]").forEach(b => b.classList.toggle("active", b === button));
}));
async function copyCSS() {
  try { await navigator.clipboard.writeText(serializeDeclaration(state())); notify("CSS copied."); }
  catch { notify("Clipboard blocked. Select and copy the CSS output."); }
}
$("copy").addEventListener("click", copyCSS);
$("copyTop").addEventListener("click", copyCSS);
$("apply").addEventListener("click", () => {
  try {
    const incoming = $("import").value;
    const guessed = /^\s*(box-shadow|text-shadow|filter)\s*:/i.exec(incoming);
    const kind = guessed ? ({ "box-shadow": "box", "text-shadow": "text", filter: "drop" })[guessed[1].toLowerCase()] : state().kind;
    save(parseShadow(kind, incoming));
    selected = 0; render(); notify("CSS imported successfully.");
  } catch (error) { notify("Import error: " + error.message); }
});
$("theme").addEventListener("click", () => {
  const light = document.documentElement.classList.toggle("theme-light");
  $("theme").setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
});
document.addEventListener("keydown", event => {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z" || ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
  event.preventDefault();
  history = event.shiftKey ? redo(history) : undo(history);
  render();
});
render();
