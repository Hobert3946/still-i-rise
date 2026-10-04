/* ============ CASCA: 4 seções + barra com a logo, páginas, painéis, voltar do Android, toast, tema ============ */
const UI = {
  tab: "hoje",
  seg: { nutri: "refeicoes", saude: "corpo" },
  page: null,
  day: null,
  meal: "Café da manhã",
  open: null,
  supSort: "price",
  qOff: 0,
  pickDay: null,
  snooze: {},
  act: null
};
const dayK = () => UI.day || today();
const isToday = () => dayK() === today();
const TABS = {
  hoje: ["Hoje", "sun"],
  treino: ["Treino", "dumb"],
  nutri: ["Nutrição", "fork"],
  saude: ["Saúde", "heart"]
};

/* ---- pilha de camadas: cada camada aberta vira uma entrada no histórico (o "voltar" do celular fecha a de cima) ---- */
const STACK = [],
  HIDE = {};
// só a camada de cima recebe toque, teclado e leitor de tela; as de baixo (inclusive uma página sob um painel) ficam inertes
const LAYER_EL = { page: "#page", sheet: "#sheet", actions: "#actions", arena: "#arena" };
const syncInert = () => {
  ["#top", "#view", "#tabbar"].forEach(s => {
    const e = $(s);
    if (e) e.inert = STACK.length > 0;
  });
  Object.entries(LAYER_EL).forEach(([id, s]) => {
    const e = $(s);
    if (e) e.inert = STACK.includes(id) && STACK[STACK.length - 1] !== id;
  });
};
// foco: ao abrir uma camada, guarda onde estava; ao fechar, volta para lá (ou para o botão equivalente, se a tela foi redesenhada)
const FOCUS = {};
const qv = v => String(v).replace(/["\\]/g, "\\$&");
const focusKey = e => {
  if (!e || e === document.body) return null;
  if (e.id) return `[id="${qv(e.id)}"]`;
  const d = e.dataset || {};
  if (!d.act) return null;
  return ["act", "id", "k", "m", "tab", "seg", "p", "v", "i"]
    .filter(k => d[k] != null)
    .map(k => `[data-${k}="${qv(d[k])}"]`)
    .join("");
};
function focusBack(id) {
  const f = FOCUS[id];
  delete FOCUS[id];
  if (!f) return;
  const e = f.el.isConnected ? f.el : f.key && $(f.key);
  if (e && !e.closest("[inert]")) e.focus({ preventScroll: true });
}
// leva o foco para o título da camada recém-aberta (o leitor de tela anuncia o que abriu)
function focusLayer(root) {
  const t = root && (root.querySelector("h2, h3") || root.querySelector("button, input, select, textarea"));
  if (!t) return;
  if (/^H\d$/.test(t.tagName)) t.tabIndex = -1;
  t.focus({ preventScroll: true });
}
let skipPop = 0;
function pushLayer(id) {
  if (STACK.includes(id)) return;
  const a = document.activeElement;
  FOCUS[id] = { el: a, key: focusKey(a) };
  STACK.push(id);
  document.body.classList.add("lock");
  syncInert();
  try {
    history.pushState({ layer: id }, "");
  } catch (e) {}
}
function dropLayer(id, fromPop) {
  const i = STACK.lastIndexOf(id);
  if (i < 0) return;
  STACK.splice(i, 1);
  HIDE[id]();
  if (!STACK.length) document.body.classList.remove("lock");
  syncInert();
  focusBack(id);
  if (!fromPop) {
    skipPop++;
    try {
      history.back();
    } catch (e) {
      skipPop--;
    }
  }
}
window.addEventListener("popstate", () => {
  if (skipPop) {
    skipPop--;
    return;
  }
  const top = STACK[STACK.length - 1];
  if (top) dropLayer(top, true);
});
function closeAll() {
  while (STACK.length) dropLayer(STACK[STACK.length - 1]);
}
const scrimSync = () =>
  $("#scrim").classList.toggle(
    "on",
    STACK.some(x => x === "sheet" || x === "actions")
  );

/* ---- seções (barra de baixo) ---- */
function go(tab, seg) {
  if (seg) UI.seg[tab] = seg;
  if (STACK.length) closeAll();
  UI.tab = tab;
  render();
  window.scrollTo({ top: 0 });
  const v = $("#view");
  if (v) v.focus({ preventScroll: true });
}
ACT.go = b => go(b.dataset.tab, b.dataset.seg);
ACT.seg = b => {
  UI.seg[UI.tab] = b.dataset.seg;
  render();
  window.scrollTo({ top: 0 });
};
function rTabbar() {
  const b = ([k, [n, i]]) =>
    `<button class="tb ${UI.tab === k ? "on" : ""}" data-act="go" data-tab="${k}" aria-current="${UI.tab === k ? "page" : "false"}">${ic(i)}<span>${n}</span></button>`;
  const t = Object.entries(TABS);
  $("#tabbar").innerHTML =
    `${t.slice(0, 2).map(b).join("")}<button class="tb-logo" data-act="actions" aria-label="Registrar: água, refeição, treino, peso, fome, remédio"><img src="%%MARK%%" alt="" width="64" height="64"><span>Registrar</span></button>${t.slice(2).map(b).join("")}`;
}
const segBar = (tab, opts) =>
  `<div class="segbar" role="tablist" aria-label="Partes">${opts.map(([k, n]) => `<button role="tab" class="${UI.seg[tab] === k ? "on" : ""}" aria-selected="${UI.seg[tab] === k}" data-act="seg" data-seg="${k}">${n}</button>`).join("")}</div>`;

/* ---- páginas cheias (agenda, coach, ajustes) ---- */
const PAGES = {}; // cada página registra PAGES.nome = { t: "Título", r: () => html, right: () => html }
function openPage(name) {
  if (STACK.includes("sheet")) dropLayer("sheet");
  if (STACK.includes("actions")) dropLayer("actions");
  UI.page = name;
  $("#page").classList.add("on");
  pushLayer("page");
  rPage(true);
}
HIDE.page = () => {
  $("#page").classList.remove("on");
  UI.page = null;
};
function rPage(first) {
  const p = PAGES[UI.page],
    body = $("#page-body"),
    y = body && !first ? body.scrollTop : 0;
  const opened = first ? [] : $$("#page details[data-fold][open]").map(e => e.dataset.fold);
  const html = `<div class="page-in"><header class="page-top"><button class="icon-btn" data-act="page-close" aria-label="Voltar">${ic("left")}</button><h2 class="h2 grow" id="page-t" tabindex="-1">${p.t}</h2>${p.right ? p.right() : ""}</header><div class="page-body" id="page-body">${p.r()}</div></div>`;
  if (first) $("#page").innerHTML = html;
  else
    keepFields($("#page"), () => {
      $("#page").innerHTML = html;
    });
  opened.forEach(f => {
    const e = $(`#page details[data-fold="${f}"]`);
    if (e) e.open = true;
  });
  $("#page-body").scrollTop = y;
  if (first) {
    const t = $("#page-t");
    if (t) t.focus({ preventScroll: true });
  }
  ariaSeg($("#page"));
  if (p.after) p.after(first);
}
ACT.page = b => openPage(b.dataset.p);
ACT["page-close"] = () => dropLayer("page");

/* ---- painel inferior ---- */
function openSheet(html) {
  const s = $("#sheet");
  s.innerHTML = `<button class="sheet-x icon-btn" data-act="close" aria-label="Fechar">${ic("x")}</button>` + html;
  s.classList.add("on");
  pushLayer("sheet");
  scrimSync();
  s.scrollTop = 0;
  const h = s.querySelector("h2, h3");
  if (h) {
    h.id = "sheet-t";
    s.setAttribute("aria-labelledby", "sheet-t");
    s.removeAttribute("aria-label");
  } else {
    s.removeAttribute("aria-labelledby");
    s.setAttribute("aria-label", "Detalhes");
  }
  ariaSeg(s);
  focusLayer(s);
}
HIDE.sheet = () => {
  $("#sheet").classList.remove("on");
  scrimSync();
};
function closeSheet() {
  dropLayer("sheet");
}
ACT.close = () => closeSheet();

/* ---- tema: auto / claro / escuro (global) ---- */
function applyTheme() {
  const t = R.theme;
  const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme:dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const m = $("meta[name=theme-color]");
  if (m) m.content = dark ? "#0D0D0F" : "#F5F5FA";
  applyLook();
  const hr = new Date().getHours();
  document.body.dataset.hour = hr >= 4 && hr < 10 ? "morning" : hr >= 19 || hr < 4 ? "night" : "day";
}
ACT.theme = b => {
  R.theme = b.dataset.v;
  save();
  applyTheme();
  render();
};
