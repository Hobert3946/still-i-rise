/* ============ LENTES: telas de profundidade sobre o rio ============ */
const LENSES = { corpo: ["Corpo", "trend"], treino: ["Treino", "dumb"], nutri: ["Nutrição", "fork"], agua: ["Água", "drop"], aura: ["Aura", "sparkles"], sistema: ["Sistema", "gear"] };
const LENS_R = {};   // cada lente registra LENS_R.nome = () => html
function openLens(name, sub = null) {
  if (STACK.includes("orb")) dropLayer("orb");
  if (STACK.includes("sheet")) dropLayer("sheet");
  UI.lens = name; UI.lensSub = sub;
  const l = $("#lens"); l.classList.add("on"); pushLayer("lens"); rLens(true);
  const t = $("#lens-t"); if (t) { t.tabIndex = -1; t.focus({ preventScroll: true }); }
  if (sub) setTimeout(() => { const e = $(`[data-fold="${sub}"]`, l); if (e) { e.open = true; e.scrollIntoView({ block: "start", behavior: "smooth" }); } }, 80);
}
HIDE.lens = () => { $("#lens").classList.remove("on"); UI.lens = null; UI.pickDay = null; };
function rLens(first) {
  const l = $("#lens"), [t] = LENSES[UI.lens], body = $("#lens-body"), y = body && !first ? body.scrollTop : 0;
  const opened = first ? [] : $$("#lens details[data-fold][open]").map(e => e.dataset.fold);
  l.innerHTML = `<div class="lens-in"><header class="lens-top"><button class="icon-btn" data-act="lens-close" aria-label="Fechar lente">${ic("left")}</button><h2 class="h2 grow" id="lens-t">${t}</h2>${avatarHTML(S, "avatar sm")}</header>
    <nav class="lens-rail" aria-label="Lentes">${Object.entries(LENSES).map(([k, [n, i]]) => `<button class="lr ${k === UI.lens ? "on" : ""}" data-act="lens" data-l="${k}" aria-current="${k === UI.lens}">${ic(i)}<span>${n}</span></button>`).join("")}</nav>
    <div class="lens-body" id="lens-body">${LENS_R[UI.lens]()}</div></div>`;
  opened.forEach(f => { const e = $(`#lens details[data-fold="${f}"]`); if (e) e.open = true; });
  $("#lens-body").scrollTop = y;
  if (UI.lens === "aura") auraScroll();
}
ACT.lens = b => { if (UI.lens && STACK.includes("lens")) { UI.lens = b.dataset.l; rLens(true); } else openLens(b.dataset.l); };
ACT["lens-close"] = () => dropLayer("lens");
const sec = (title, body, cls = "") => `<section class="card ${cls}">${title ? `<div class="lbl sec-t">${title}</div>` : ""}${body}</section>`;
