/* ============ PEÇAS VISUAIS REUTILIZADAS + render geral ============ */
let RID = 0;
function ring(p, size, stroke, color, inner = "") {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - clamp(p, 0, 1));
  let defs = "";
  if (color === "grad") { const id = "rg" + (++RID); defs = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--blue)"/></linearGradient></defs>`; color = `url(#${id})`; }
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" aria-hidden="true">${defs}<circle class="trk" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/><circle class="arc" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"/></svg><div class="c">${inner}</div></div>`;
}
const banner = (cls, icon, title, txt, extra = "") => `<div class="banner ${cls}">${ic(icon)}<div class="grow"><b>${title}</b>${txt}${extra}</div></div>`;
const mealChips = (cur, act) => `<div class="chips" role="group" aria-label="Refeição">${MEAL_NAMES.map(m => `<button class="chip ${cur === m ? "on" : ""}" data-act="${act}" data-m="${m}" aria-pressed="${cur === m}">${m}</button>`).join("")}</div>`;
const tog = (on, act, label, extra = "") => `<button class="tog ${on ? "on" : ""}" data-act="${act}" ${extra} role="switch" aria-checked="${!!on}" aria-label="${esc(label)}"><i></i></button>`;
const fold = (title, body, open = false, id = "") => `<details class="fold" ${open ? "open" : ""} ${id ? `data-fold="${id}"` : ""}><summary>${title}${ic("down")}</summary><div class="body">${body}</div></details>`;
const sec = (title, body, cls = "") => `<section class="card ${cls}">${title ? `<h3 class="lbl sec-t">${title}</h3>` : ""}${body}</section>`;
// v e goal chegam formatados (1.850 · 1,2): tira o ponto de milhar antes de calcular a barra
const numBR = v => num(String(v).replace(/\.(?=\d{3}(\D|$))/g, ""));
const meter = (label, v, goal, unit, color, act = "", data = "") => `<button class="meter" ${act ? `data-act="${act}" ${data}` : "disabled"}><span class="m-l">${label}</span><span class="m-v tabnum"><b>${v}</b> / ${goal} ${unit}</span><span class="bar"><i style="width:${Math.min(100, (numBR(v) / numBR(goal)) * 100 || 0)}%;background:${color}"></i></span></button>`;
const pastNote = () => isToday() ? "" : `<button class="pastnote" data-act="day-today">${ic("info")} Registrando em ${dispDate(dayK())}. Toque para voltar a hoje.</button>`;
ACT["day-today"] = () => { UI.day = null; render(); };
const greet = () => { const h = new Date().getHours(); return h >= 5 && h < 12 ? "Bom dia" : h >= 12 && h < 18 ? "Boa tarde" : "Boa noite"; };
const avatarHTML = (p, cls = "avatar") => p.profile.avatar ? `<img class="${cls}" src="%%AVATAR%%" alt="" width="40" height="40">` : `<span class="${cls} ini" aria-hidden="true">${esc((p.profile.name || "?").trim()[0] || "?").toUpperCase()}</span>`;
function headTitle() {
  const d = new Date();
  if (UI.tab === "hoje") return [`${DOW[d.getDay()]}, ${pad(d.getDate())} ${MESES[d.getMonth()].toUpperCase()}`, `${greet()}, ${esc(S.profile.name)}`];
  if (UI.tab === "treino") return [`Semana ${weekNo()}${inAdapt() ? " · adaptação" : ""}`, "Treino"];
  if (UI.tab === "nutri") return [`Meta ${fmtInt(TG().kcal)} kcal · ${TG().prot} g`, "Nutrição"];
  return [`${String(r1(curWeight())).replace(".", ",")} kg · meta ${S.profile.goal} kg`, "Saúde"];
}
function rHeader() {
  const [k, t] = headTitle();
  $("#top").innerHTML = `<div class="top-in"><button class="who" data-act="page" data-p="ajustes" aria-label="Perfil e ajustes (${esc(S.profile.name)})">${avatarHTML(S)}</button>
    <div class="top-t grow"><small>${k}</small><h1>${t}</h1></div>
    <button class="coach-btn" data-act="page" data-p="coach" aria-label="Abrir o Coach">${ic("sparkles")}<span>Coach</span></button></div>`;
}
const VIEWS = {};   // cada seção registra VIEWS.nome = () => html
function render() {
  rHeader(); $("#view").innerHTML = VIEWS[UI.tab](); rTabbar();
  if (UI.page && STACK.includes("page")) rPage();
  if (S.cur && STACK.includes("arena")) arenaRender();
  if (UI.tab === "nutri" && UI.seg.nutri === "agua") waterAnim();
}
