/* ============ CASCA: 4 seções + barra com a logo, páginas, painéis, voltar do Android, toast, tema ============ */
const UI = { tab: "hoje", seg: { nutri: "refeicoes", saude: "corpo" }, page: null, day: null, meal: "Café da manhã", open: null, supSort: "price", qOff: 0, pickDay: null, snooze: {}, act: null };
const dayK = () => UI.day || today();
const isToday = () => dayK() === today();
const TABS = { hoje: ["Hoje", "sun"], treino: ["Treino", "dumb"], nutri: ["Nutrição", "fork"], saude: ["Saúde", "heart"] };

/* ---- pilha de camadas: cada camada aberta vira uma entrada no histórico (o "voltar" do celular fecha a de cima) ---- */
const STACK = [], HIDE = {};
const syncInert = () => ["#top", "#view", "#tabbar"].forEach(s => { const e = $(s); if (e) e.inert = STACK.length > 0; });
let skipPop = 0;
function pushLayer(id) {
  if (STACK.includes(id)) return;
  STACK.push(id); document.body.classList.add("lock"); syncInert();
  try { history.pushState({ layer: id }, ""); } catch (e) { }
}
function dropLayer(id, fromPop) {
  const i = STACK.lastIndexOf(id); if (i < 0) return;
  STACK.splice(i, 1); HIDE[id]();
  if (!STACK.length) document.body.classList.remove("lock");
  syncInert();
  if (!fromPop) { skipPop++; try { history.back(); } catch (e) { skipPop--; } }
}
window.addEventListener("popstate", () => {
  if (skipPop) { skipPop--; return; }
  const top = STACK[STACK.length - 1]; if (top) dropLayer(top, true);
});
function closeAll() { while (STACK.length) dropLayer(STACK[STACK.length - 1]); }
const scrimSync = () => $("#scrim").classList.toggle("on", STACK.some(x => x === "sheet" || x === "actions"));

/* ---- seções (barra de baixo) ---- */
function go(tab, seg) {
  if (seg) UI.seg[tab] = seg;
  if (STACK.length) closeAll();
  UI.tab = tab; render(); window.scrollTo({ top: 0 });
  const v = $("#view"); if (v) v.focus({ preventScroll: true });
}
ACT.go = b => go(b.dataset.tab, b.dataset.seg);
ACT.seg = b => { UI.seg[UI.tab] = b.dataset.seg; render(); window.scrollTo({ top: 0 }); };
function rTabbar() {
  const b = ([k, [n, i]]) => `<button class="tb ${UI.tab === k ? "on" : ""}" data-act="go" data-tab="${k}" aria-current="${UI.tab === k ? "page" : "false"}">${ic(i)}<span>${n}</span></button>`;
  const t = Object.entries(TABS);
  $("#tabbar").innerHTML = `${t.slice(0, 2).map(b).join("")}<button class="tb-logo" data-act="actions" aria-label="Registrar: água, refeição, treino, peso, fome, remédio"><img src="%%MARK%%" alt="" width="64" height="64"><span>Registrar</span></button>${t.slice(2).map(b).join("")}`;
}
const segBar = (tab, opts) => `<div class="segbar" role="tablist" aria-label="Partes">${opts.map(([k, n]) => `<button role="tab" class="${UI.seg[tab] === k ? "on" : ""}" aria-selected="${UI.seg[tab] === k}" data-act="seg" data-seg="${k}">${n}</button>`).join("")}</div>`;

/* ---- páginas cheias (agenda, coach, ajustes) ---- */
const PAGES = {};   // cada página registra PAGES.nome = { t: "Título", r: () => html, right: () => html }
function openPage(name) { if (STACK.includes("sheet")) dropLayer("sheet"); if (STACK.includes("actions")) dropLayer("actions"); UI.page = name; $("#page").classList.add("on"); pushLayer("page"); rPage(true); }
HIDE.page = () => { $("#page").classList.remove("on"); UI.page = null; };
function rPage(first) {
  const p = PAGES[UI.page], body = $("#page-body"), y = body && !first ? body.scrollTop : 0;
  const opened = first ? [] : $$("#page details[data-fold][open]").map(e => e.dataset.fold);
  $("#page").innerHTML = `<div class="page-in"><header class="page-top"><button class="icon-btn" data-act="page-close" aria-label="Voltar">${ic("left")}</button><h2 class="h2 grow" id="page-t" tabindex="-1">${p.t}</h2>${p.right ? p.right() : ""}</header><div class="page-body" id="page-body">${p.r()}</div></div>`;
  opened.forEach(f => { const e = $(`#page details[data-fold="${f}"]`); if (e) e.open = true; });
  $("#page-body").scrollTop = y;
  if (first) { const t = $("#page-t"); if (t) t.focus({ preventScroll: true }); }
  if (p.after) p.after(first);
}
ACT.page = b => openPage(b.dataset.p);
ACT["page-close"] = () => dropLayer("page");

/* ---- painel inferior ---- */
function openSheet(html) { const s = $("#sheet"); s.innerHTML = `<button class="sheet-x icon-btn" data-act="close" aria-label="Fechar">${ic("x")}</button>` + html; s.classList.add("on"); pushLayer("sheet"); scrimSync(); s.scrollTop = 0; }
HIDE.sheet = () => { $("#sheet").classList.remove("on"); scrimSync(); };
function closeSheet() { dropLayer("sheet"); }
ACT.close = () => closeSheet();
ACT.scrim = () => { const top = STACK[STACK.length - 1]; if (top === "sheet" || top === "actions") dropLayer(top); };

/* ---- toast (com ação opcional: desfazer, aplicar sempre...) ---- */
let toastT = null;
function toast(t, fn, label = "Desfazer") {
  const e = $("#toast"); e.innerHTML = `<span>${esc(t)}</span>${fn ? `<b>${esc(label)}</b>` : ""}`;
  e.onclick = fn ? () => { clearTimeout(toastT); e.classList.remove("on", "act"); fn(); } : null;
  e.classList.toggle("act", !!fn); e.classList.add("on"); clearTimeout(toastT);
  toastT = setTimeout(() => e.classList.remove("on", "act"), fn ? 5500 : 2600);
}

/* ---- tema: auto / claro / escuro (global) ---- */
function applyTheme() {
  const t = R.theme; const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme:dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const m = $("meta[name=theme-color]"); if (m) m.content = dark ? "#0D0D0F" : "#F5F5FA";
  const hr = new Date().getHours();
  document.body.dataset.hour = hr >= 4 && hr < 10 ? "morning" : hr >= 19 || hr < 4 ? "night" : "day";
}
ACT.theme = b => { R.theme = b.dataset.v; save(); applyTheme(); render(); };
