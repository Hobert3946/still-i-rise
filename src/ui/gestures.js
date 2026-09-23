/* ============ GESTOS DE TOQUE (celular primeiro) ============ */
// alça (reordenar) > número da carga (arrastar ajusta) > item da bandeja (arrastar exclui) > tecla (segurar)
// > nó do rio (deslizar para a direita conclui) > palco da arena (deslizar troca de exercício)
let G = null;
const moved = (e, g) => [e.clientX - g.x, e.clientY - g.y];
function gStart(e) {
  const t = e.target, base = { x: e.clientX, y: e.clientY, id: e.pointerId, on: false };
  let el;
  if ((el = t.closest("[data-agdrag]"))) return Object.assign(base, { type: "agdrag", el, row: el.closest(".ag-row") });
  if ((el = t.closest("[data-grip]"))) return Object.assign(base, { type: "grip", el, row: el.closest("[data-row]") });
  if ((el = t.closest("[data-dial]"))) return Object.assign(base, { type: "dial", el, acc: 0 });
  if ((el = t.closest(".swipe-in"))) return Object.assign(base, { type: "del", el });
  const hold = t.closest("[data-hold]"), sw = t.closest("[data-swipe]"), ax = t.closest("[data-swipe-x]");
  if (hold) { const g = Object.assign(base, { type: "hold", el: hold }); g.timer = setTimeout(() => holdFire(g), 450); return g; }
  if (sw && !t.closest("input,textarea,select")) return Object.assign(base, { type: "done", el: sw, body: sw.querySelector(".n-body") || sw });
  if (ax && !t.closest("input,textarea,select,.chips")) return Object.assign(base, { type: "arena", el: ax });
  return null;
}
function holdFire(g) {
  if (G !== g || g.on) return;
  G = null; haptic(25); suppressClick = Date.now() + 700; ACT[g.el.dataset.hold](g.el);
}
const snap = (el, x, ms) => { el.style.transition = ms ? `transform ${ms}ms var(--ease)` : "none"; el.style.transform = x ? `translateX(${x}px)` : ""; };
document.addEventListener("pointerdown", e => { if (e.button > 0) return; G = gStart(e); });
document.addEventListener("pointermove", e => {
  if (!G || e.pointerId !== G.id) return;
  const [dx, dy] = moved(e, G);
  if (!G.on) {
    const far = Math.abs(dx) > 10 || Math.abs(dy) > 10; if (!far) return;
    if (G.type === "hold") { clearTimeout(G.timer); G = null; return; }
    const horiz = Math.abs(dx) > Math.abs(dy);
    if (["del", "done", "arena"].includes(G.type) && !horiz) { G = null; return; }
    if (G.type === "done" && dx < 0) { G = null; return; }
    if (G.type === "agdrag" && horiz) { G = null; return; }
    if (G.type === "dial" && document.activeElement === G.el.querySelector("input")) { G = null; return; }
    G.on = true; try { G.el.setPointerCapture(e.pointerId); } catch (x) { }
  }
  gMove(e, dx, dy);
});
function gMove(e, dx, dy) {
  const g = G;
  if (g.type === "dial") { const n = Math.trunc((-dy - g.acc) / 22); if (n) { g.acc += n * 22; wkAdjFocus(g.el.dataset.dial, n * num(g.el.dataset.step)); G = Object.assign(g, { el: $(`[data-dial="${g.el.dataset.dial}"]`) || g.el }); } e.preventDefault(); return; }
  if (g.type === "del") { snap(g.el, dx, 0); g.el.parentNode.classList.toggle("armed", Math.abs(dx) > Math.min(120, g.el.offsetWidth * 0.35)); return; }
  if (g.type === "done") { snap(g.body, Math.min(dx, 160), 0); g.el.classList.toggle("armed", dx > 90); return; }
  if (g.type === "agdrag") { const at = dragAt(g, dy); g.row.style.transform = `translateY(${dy}px)`; g.row.classList.add("dragging"); let lb = g.row.querySelector(".drag-t"); if (!lb) { lb = document.createElement("span"); lb.className = "drag-t"; g.row.appendChild(lb); } lb.textContent = "→ " + at; e.preventDefault(); return; }
  if (g.type === "grip") { g.row.style.transform = `translateY(${dy}px)`; g.row.classList.add("dragging"); }
}
function gEnd(e) {
  const g = G; if (!g || e.pointerId !== g.id) return; G = null; clearTimeout(g.timer);
  if (!g.on) return;
  suppressClick = Date.now() + 350;
  const [dx, dy] = moved(e, g), ok = e.type === "pointerup";
  if (g.type === "del") { const w = g.el.offsetWidth, i = +g.el.parentNode.dataset.i; if (ok && Math.abs(dx) > Math.min(120, w * 0.35)) { snap(g.el, dx < 0 ? -w : w, 160); setTimeout(() => removeWithUndo(i), 170); } else { snap(g.el, 0, 200); g.el.parentNode.classList.remove("armed"); } }
  if (g.type === "done") { snap(g.body, 0, 220); g.el.classList.remove("armed"); if (ok && dx > 90) { const [act, id] = g.el.dataset.swipe.split(/:(.+)/); ACT[act]({ dataset: { id } }); } }
  if (g.type === "arena" && ok && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) arenaSwipe(dx > 0 ? 1 : -1);
  if (g.type === "grip") gripDrop(g, e);
  if (g.type === "agdrag") { g.row.style.transform = ""; g.row.classList.remove("dragging"); const at = dragAt(g, dy); if (ok && at !== hhmm(new Date(0, 0, 0, 0, +g.el.dataset.min))) instMove(g.el.dataset.agdrag, at); else render(); }
}
// arrastar a alça de um item da agenda: 2 px = 1 min, encaixa de 15 em 15
const dragAt = (g, dy) => { const m = clamp(Math.round((+g.el.dataset.min + dy / 2) / 15) * 15, 0, 23 * 60 + 45); return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };
function gripDrop(g, e) {
  g.row.style.transform = ""; g.row.classList.remove("dragging");
  g.row.style.pointerEvents = "none"; const under = document.elementFromPoint(e.clientX, e.clientY); g.row.style.pointerEvents = "";
  const tgt = under && under.closest(`[data-row="${g.el.dataset.grip}"]`);
  if (tgt) listMove(g.el.dataset.grip, +g.el.dataset.i, +tgt.dataset.i);
}
document.addEventListener("pointerup", gEnd); document.addEventListener("pointercancel", gEnd);
document.addEventListener("contextmenu", e => { if (e.target.closest("[data-hold]")) e.preventDefault(); });
