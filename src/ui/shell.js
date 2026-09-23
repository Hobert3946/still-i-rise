/* ============ CASCA: camadas (painel, lente, paleta, arena), voltar do Android, toast, tema ============ */
const UI = { day: null, open: null, lens: null, lensSub: null, sigOpen: false, meal: "Café da manhã", supSort: "price", qOff: 0, pickDay: null };
const dayK = () => UI.day || today();
const isToday = () => dayK() === today();

/* ---- pilha de camadas: cada camada aberta vira uma entrada no histórico (o "voltar" do celular fecha a de cima) ---- */
const STACK = [], HIDE = {};
const syncInert = () => ["#top", "#river", "#orb"].forEach(s => { const e = $(s); if (e) e.inert = STACK.length > 0; });
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
const scrimSync = () => $("#scrim").classList.toggle("on", STACK.some(x => x === "sheet" || x === "orb"));

/* ---- painel inferior ---- */
function openSheet(html) { const s = $("#sheet"); s.innerHTML = html; s.classList.add("on"); pushLayer("sheet"); scrimSync(); s.scrollTop = 0; }
HIDE.sheet = () => { $("#sheet").classList.remove("on"); scrimSync(); };
function closeSheet() { dropLayer("sheet"); }
ACT.close = () => closeSheet();
ACT.scrim = () => { const top = STACK[STACK.length - 1]; if (top === "sheet" || top === "orb") dropLayer(top); };

/* ---- toast (com desfazer opcional) ---- */
let toastT = null;
function toast(t, fn) {
  const e = $("#toast"); e.textContent = t;
  e.onclick = fn ? () => { clearTimeout(toastT); e.classList.remove("on", "act"); fn(); } : null;
  e.classList.toggle("act", !!fn); e.classList.add("on"); clearTimeout(toastT);
  toastT = setTimeout(() => e.classList.remove("on", "act"), fn ? 5000 : 2600);
}

/* ---- tema: auto / claro / escuro (global, vale para todos os perfis) ---- */
function applyTheme() {
  const t = R.theme; const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme:dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const m = $("meta[name=theme-color]"); if (m) m.content = dark ? "#0D0D0F" : "#F6F4F0";
  const hr = new Date().getHours();
  document.body.dataset.hour = hr >= 4 && hr < 10 ? "morning" : hr >= 19 || hr < 4 ? "night" : "day";
}
ACT.theme = b => { R.theme = b.dataset.v; save(); applyTheme(); render(); };
ACT["theme-flip"] = () => { R.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; save(); applyTheme(); render(); };

/* ---- peças visuais reutilizadas ---- */
let RID = 0;
function ring(p, size, stroke, color, inner = "") {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - clamp(p, 0, 1));
  let defs = "";
  if (color === "grad") { const id = "rg" + (++RID); defs = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent-hi)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs>`; color = `url(#${id})`; }
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" aria-hidden="true">${defs}<circle class="trk" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/><circle class="arc" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"/></svg><div class="c">${inner}</div></div>`;
}
const banner = (cls, icon, title, txt, extra = "") => `<div class="banner ${cls}">${ic(icon)}<div class="grow"><b>${title}</b>${txt}${extra}</div></div>`;
const mealChips = (cur, act) => `<div class="chips" role="group" aria-label="Refeição">${MEAL_NAMES.map(m => `<button class="chip ${cur === m ? "on" : ""}" data-act="${act}" data-m="${m}" aria-pressed="${cur === m}">${m}</button>`).join("")}</div>`;
const tog = (on, act, label, extra = "") => `<button class="tog ${on ? "on" : ""}" data-act="${act}" ${extra} role="switch" aria-checked="${!!on}" aria-label="${esc(label)}"><i></i></button>`;
const fold = (title, body, open = false, id = "") => `<details class="fold" ${open ? "open" : ""} ${id ? `data-fold="${id}"` : ""}><summary>${title}${ic("down")}</summary><div class="body">${body}</div></details>`;

/* ---- render: o rio sempre; a lente e a arena quando abertas ---- */
function render() {
  rHeader(); rRiver();
  if (UI.lens) rLens();
  if (S.cur && STACK.includes("arena")) arenaRender();
}
