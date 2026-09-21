"use strict";
/* ============ utilidades ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const fmtKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const today = () => fmtKey(new Date());
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return fmtKey(d); };
const diffDays = (a, b) => Math.round((parseKey(a) - parseKey(b)) / 864e5);
const mondayOf = k => { const d = parseKey(k); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return fmtKey(d); };
const ic = (n, c = "") => `<svg class="icon ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const num = (v, d = 0) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? d : n; };
const r1 = n => Math.round(n * 10) / 10;
const DOW = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const dispDate = k => { const d = parseKey(k); return `${pad(d.getDate())} ${MESES[d.getMonth()]}`; };
const fmtInt = n => Math.round(n).toLocaleString("pt-BR");

/* ============ estado e persistência (3 camadas) ============ */
const KEY = "sir_v1";
const defaults = () => ({
  v: 1,
  profile: { name: "Hobert", startWeight: 140, goal: 105, height: 179, age: 24 },
  weights: [], days: {}, logs: {}, sel: {}, pain: [], neck: [], cur: null, chat: [], favs: {},
  settings: { theme: "auto", start: today(), logMode: "set", rotate: true, lastBackup: null, notif: false, calcWeight: 140, waterGoal: 3000, gemKey: "", gemModel: "gemini-2.5-flash-lite", gemAck: false }
});
let S = null;
const mergeDefaults = o => { const d = defaults(); const s = Object.assign(d, o || {}); s.profile = Object.assign(d.profile, (o || {}).profile); s.settings = Object.assign(defaults().settings, (o || {}).settings); return s; };

const IDB = {
  open() { return new Promise((res, rej) => { const r = indexedDB.open("sir-db", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async put(v) { try { const db = await this.open(); db.transaction("kv", "readwrite").objectStore("kv").put(v, "state"); } catch (e) { } },
  async get() { try { const db = await this.open(); return await new Promise(res => { const q = db.transaction("kv").objectStore("kv").get("state"); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); } catch (e) { return null; } }
};
let idbTimer = null;
function save() {
  const j = JSON.stringify(S);
  try { localStorage.setItem(KEY, j); } catch (e) { }
  clearTimeout(idbTimer); idbTimer = setTimeout(() => IDB.put(j), 300);
  cloudQueue();
}
async function loadState() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { }
  if (!raw) raw = await IDB.get();
  try { S = mergeDefaults(raw ? JSON.parse(raw) : null); } catch (e) { S = defaults(); }
  save();
}

/* ============ dia / hábitos ============ */
const newDay = () => ({ h: {}, s: {}, water: 0, meals: [] });
const D = k => S.days[k] || newDay();
function DW(k) { if (!S.days[k]) S.days[k] = newDay(); return S.days[k]; }
const hasData = d => d && (Object.values(d.h || {}).some(Boolean) || Object.values(d.s || {}).some(Boolean) || d.water > 0 || (d.meals || []).length);
const habitCount = k => Object.values(D(k).h).filter(Boolean).length;
const isActive = k => { const h = D(k).h; return !!h.acucar && habitCount(k) >= 3; };
const firstDay = () => { const ks = Object.keys(S.days).filter(k => hasData(S.days[k])); ks.push(S.settings.start); return ks.sort()[0]; };
function dayStreak() { let k = today(); if (!isActive(k)) k = addDays(k, -1); let n = 0; const f = firstDay(); while (k >= f && isActive(k)) { n++; k = addDays(k, -1); } return n; }
const activeInWeek = mk => { let n = 0; for (let i = 0; i < 7; i++) if (isActive(addDays(mk, i))) n++; return n; };
function weekStreak() {
  const cur = mondayOf(today()), first = mondayOf(firstDay());
  let n = activeInWeek(cur) >= 5 ? 1 : 0, reds = 0;
  for (let mk = addDays(cur, -7); mk >= first; mk = addDays(mk, -7)) {
    const a = activeInWeek(mk);
    if (a >= 5) { n++; reds = 0; } else if (a === 4) { reds = 0; } else { reds++; if (reds >= 2) break; }
  }
  return n;
}
function daysAbsent() {
  const ks = Object.keys(S.days).filter(k => hasData(S.days[k])).concat(S.weights.map(w => w.d));
  if (S.cur) return 0;
  const hasLogs = Object.values(S.logs).some(a => a.length);
  if (hasLogs) Object.values(S.logs).forEach(a => a.forEach(l => ks.push(l.date)));
  if (!ks.length) return 0;
  ks.sort(); return Math.max(0, diffDays(today(), ks[ks.length - 1]));
}
const weekNo = () => Math.floor(diffDays(mondayOf(today()), mondayOf(S.settings.start)) / 7) + 1;
const inAdapt = () => weekNo() <= 2;

/* ============ metas nutricionais (Mifflin-St Jeor) ============ */
const curWeight = () => S.weights.length ? S.weights[S.weights.length - 1].kg : S.profile.startWeight;
function targets(w) {
  const p = S.profile;
  const tmb = 10 * w + 6.25 * p.height - 5 * p.age + 5;
  const tdee = tmb * 1.375;
  const kcal = Math.max(1800, Math.round((tdee - 1000) / 50) * 50);
  return { tmb: Math.round(tmb), tdee: Math.round(tdee), kcal, prot: Math.round(1.2 * w / 5) * 5 };
}
const TG = () => targets(S.settings.calcWeight);
const dayTotals = k => D(k).meals.reduce((a, m) => ({ k: a.k + m.k, p: a.p + m.p }), { k: 0, p: 0 });

/* ============ treino: helpers ============ */
const dayLetter = k => { const w = parseKey(k).getDay(); return w >= 1 && w <= 5 ? DAY_ORDER[w - 1] : null; };
const findV = (slot, vid) => slot.v.find(x => x[0] === vid) || slot.v[0];
function varId(slot) {
  if (S.sel[slot.id]) return S.sel[slot.id];
  if (S.settings.rotate && !inAdapt()) return slot.v[Math.floor((weekNo() - 3) / 4) % slot.v.length][0];
  return slot.v[0][0];
}
const estMin = L => { const p = PLAN[L]; let s = p.cuff ? 8 : 5; p.ex.forEach(e => s += e.sets * (45 + e.rest) / 60); return Math.round(s / 5) * 5 + 10; };
function prefill(slot, vid) {
  const hist = S.logs[vid] || [], last = hist[hist.length - 1];
  const out = []; let hint = "Sem histórico: escolha uma carga leve.";
  if (last) {
    const nx = nextLoad(slot, last.sets), delta = nx.kg - (last.sets[0] ? last.sets[0].kg : 0);
    for (let i = 0; i < slot.sets; i++) { const ls = last.sets[i] || last.sets[last.sets.length - 1]; out.push({ kg: r1(Math.max(0, ls.kg + delta)), reps: nx.dir === "up" ? slot.reps[0] : nx.dir === "down" ? slot.reps[0] : ls.reps, done: false }); }
    hint = `Última vez (${dispDate(last.date)}): ${last.sets.map(s => `${s.kg}×${s.reps}`).join(" · ")} → ${nx.dir === "up" ? `hoje +${nx.inc} kg` : nx.dir === "down" ? `hoje −${nx.inc} kg` : "mantenha a carga"}. ${nx.why}`;
  } else for (let i = 0; i < slot.sets; i++) out.push({ kg: 0, reps: slot.reps[0], done: false });
  return { sets: out, hint };
}
function deloadSignal() {
  let n = 0;
  DAY_ORDER.forEach(L => PLAN[L].ex.forEach(slot => slot.v.forEach(v => {
    const h = S.logs[v[0]] || []; if (h.length < 2) return;
    const [a, b] = h.slice(-2);
    const fail = l => l.sets.some(s => s.reps < slot.reps[0]);
    if (fail(a) && fail(b) && a.sets[0].kg === b.sets[0].kg) n++;
  })));
  return n >= 3;
}
const painAvg = () => { const l = S.pain.slice(-3); return l.length >= 3 ? l.reduce((a, b) => a + b.v, 0) / 3 : null; };
const weekVolume = () => { let push = 0, pull = 0; DAY_ORDER.forEach(L => PLAN[L].ex.forEach(e => { push += (e.push || 0); pull += (e.pull || 0); })); return { push, pull }; };

/* ============ UI base ============ */
const UI = { tab: "deck", cat: "Todos", q: "", meal: "Café da manhã", supSort: "price", supType: "all", pickDay: null };
let toastT = null;
function toast(t, fn) { const e = $("#toast"); e.textContent = t; e.onclick = fn ? () => { clearTimeout(toastT); e.classList.remove("on", "act"); fn(); } : null; e.classList.toggle("act", !!fn); e.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove("on", "act"), fn ? 5000 : 2600); }
function applyTheme() {
  const t = S.settings.theme; const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme:dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  $("meta[name=theme-color]").content = dark ? "#121316" : "#f7f5f2";
  $("#themeBtn").innerHTML = ic(dark ? "sun" : "moon");
}
let RID = 0;
const haptic = (ms = 10) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };
function ring(p, size, stroke, color, inner) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, p)));
  let defs = "";
  if (color === "grad") { const id = "rg" + (++RID); defs = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--terra)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs>`; color = `url(#${id})`; }
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" aria-hidden="true">${defs}<circle class="trk" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/><circle class="arc" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"/></svg><div class="c">${inner}</div></div>`;
}
const banner = (cls, icon, title, txt, extra = "") => `<div class="banner ${cls}">${ic(icon)}<div class="grow"><b>${title}</b>${txt}${extra}</div></div>`;
function openSheet(html) { const o = $("#sheet"); $(".sheet", o).innerHTML = html; o.classList.add("on"); }
function closeSheet() { $("#sheet").classList.remove("on"); }

/* ============ render: navegação ============ */
function go(tab) {
  UI.tab = tab;
  $$(".view").forEach(v => v.classList.toggle("on", v.id === "v-" + tab));
  $$(".tab").forEach(t => t.classList.toggle("on", t.dataset.tab === tab));
  render(); window.scrollTo({ top: 0 });
}
function render() {
  ({ deck: rDeck, treino: rTreino, agua: rAgua, comer: rComer, evol: rEvol, mais: rMais, ia: rIA })[UI.tab]();
  dockWater();
}

/* ============ DECK ============ */
function tipOfDay() { const n = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5); return TIPS[n % TIPS.length]; }

/* ============ TREINO ============ */
function rTreino() {
  const k = today(), L = UI.pickDay || (D(k).wk ? seqNext() : (planLetter(k) || seqNext()));
  const p = PLAN[L], vol = weekVolume();
  const list = p.ex.map(e => { const v = findV(e, varId(e)); return `<div class="li"><div class="grow"><div style="font-weight:700">${v[1]}</div><div class="muted" style="font-size:14px">${e.sets} × ${e.reps[0] === e.reps[1] ? e.reps[0] : e.reps[0] + "–" + e.reps[1]}${e.unit ? " s" : ""} · descanso ${e.rest}s${e.inc ? ` · +${e.inc} kg` : ""}</div></div>${nextBadge(e, v[0])}<span class="tag">${e.v.length} variações</span></div>`; }).join("");
  const warm = p.cuff ? CUFF.map(c => `<div class="li"><div class="grow"><div style="font-weight:700">${c.name}</div><div class="muted" style="font-size:14px">${c.sets} × ${c.reps[0]}</div></div><span class="tag">AQUEC.</span></div>`).join("") : "";
  const pa = painAvg(), kd = D(k), skipped = kd.skipWk && !UI.pickDay && !S.cur && !kd.wk;
  if (skipped) { $("#v-treino").innerHTML = `
  <section class="card" style="background:transparent;box-shadow:none;padding:0"><h2 class="h1">Treino</h2><p class="muted">Segunda a sexta às 5h, seguindo a sequência A a E.</p></section>
  <section class="card" style="text-align:center;padding:36px 20px"><h3 class="mid">Tudo bem, o foco hoje é a dieta.</h3><p class="muted" style="margin-top:10px">O treino <b>${L} · ${p.name}</b> fica guardado para amanhã. Sua sequência não quebra.</p><button class="btn ghost full" style="margin-top:20px" data-act="wk-unskip">Desfazer (vou treinar)</button></section>`; return; }
  $("#v-treino").innerHTML = `
  <section class="card" style="background:transparent;box-shadow:none;padding:0"><h2 class="h1">Treino</h2><p class="muted">Segunda a sexta às 5h, seguindo a sequência A a E: se você faltar um dia, o treino continua de onde parou. As cargas da próxima vez são recalculadas ao fim de cada treino.</p></section>
  ${S.cur ? banner("acc", "play", "Treino em andamento", `Treino ${S.cur.day} aberto.`, `<div style="margin-top:8px"><button class="btn sm solid" data-act="wk-resume">Continuar</button></div>`) : ""}
  ${pa !== null && pa >= 4 ? banner("bad", "shield", "Dor no ombro em alta", `Média das 3 últimas: ${r1(pa)}/10. Procure um fisioterapeuta.`) : ""}
  <div class="chips">${DAY_ORDER.map(x => `<button class="chip ${x === L ? "on" : ""}" data-act="pickday" data-day="${x}">${x} · ${PLAN[x].name}</button>`).join("")}</div>
  <section class="card">
    <div class="row between"><div><div class="lbl" style="color:var(--accent-ink)">Treino ${L}</div><h3 class="mid">${p.name}</h3></div><span class="pill">≈ ${estMin(L)} min</span></div>
    <p class="muted">${p.focus}. Termina com 10 min de esteira inclinada (4–6%), ritmo de conversa.</p>
    <div class="list">${warm}${list}</div>
    <button class="btn solid full" data-act="${S.cur ? "wk-resume" : "wk-start"}" data-day="${L}">${ic("play", "fill")} ${S.cur ? "CONTINUAR" : `INICIAR TREINO ${L}`}</button>
    ${!S.cur && !UI.pickDay && !kd.wk ? `<button class="btn ghost full" style="color:var(--muted)" data-act="wk-skip">Não consegui ir hoje</button>` : ""}
  </section>
  <section class="card flat">
    <div class="lbl">Balanço semanal de séries</div>
    <div class="grid2"><div class="tile in"><div class="lbl">Empurrar</div><div class="big tabnum">${vol.push}</div></div><div class="tile in"><div class="lbl">Puxar</div><div class="big tabnum">${vol.pull}</div></div></div>
    <p class="muted" style="font-size:15px">Puxar ≥ empurrar protege o ombro. Aquecimento de manguito antes de peito, ombro e braço.</p>
  </section>
  <section class="card flat">
    <div class="lbl">Regras de carga</div>
    <p class="muted" style="font-size:16px"><b>Semanas 1–2:</b> adaptação com carga leve. <b>Depois, ao fim de cada treino:</b> fechou todas as repetições em todas as séries, sobe a carga; falhou na 1ª série ou em 2 ou mais séries, desce um degrau; senão mantém. <b>Deload só por sinal</b> (2 sessões falhando ou dor ≥ 4).<br><b>Regra do RIR:</b> termine sentindo que faria mais 3. Se faria mais de 4, estava leve. Se não completou, estava pesada.<br>${INCS_TXT}</p>
    <div class="row between"><span class="grow">Rodízio automático de variações (a cada 4 semanas)</span><button class="tog ${S.settings.rotate ? "on" : ""}" data-act="tog-rotate" aria-label="alternar"><i></i></button></div>
  </section>`;
}

/* ---- Modo Treino ---- */
let wakeLock = null;
const stepsOf = L => { const st = []; if (PLAN[L].cuff) CUFF.forEach(c => st.push({ t: "warm", c })); PLAN[L].ex.forEach(e => st.push({ t: "ex", e })); return st; };
function wkStart(L) {
  S.cur = { day: L, date: today(), i: 0, mode: S.settings.logMode, data: {} };
  save(); wkOpen();
}
function wkOpen() {
  $("#screen-wk").classList.add("on"); document.body.style.overflow = "hidden";
  try { navigator.wakeLock && navigator.wakeLock.request("screen").then(l => wakeLock = l).catch(() => { }); } catch (e) { }
  wkRender();
}
function wkClose() { $("#screen-wk").classList.remove("on"); document.body.style.overflow = ""; try { wakeLock && wakeLock.release(); } catch (e) { } wakeLock = null; closeRest(); render(); }
function wkData(step) {
  const c = S.cur;
  if (step.t === "warm") { c.data[step.c.id] = c.data[step.c.id] || { sets: Array.from({ length: step.c.sets }, () => ({ done: false })) }; return c.data[step.c.id]; }
  const slot = step.e; let dd = c.data[slot.id];
  if (!dd) { const vid = varId(slot), pf = prefill(slot, vid); dd = c.data[slot.id] = { vid, sets: pf.sets, hint: pf.hint }; }
  return dd;
}
function wkRender() {
  const c = S.cur; if (!c) return;
  const st = stepsOf(c.day), step = st[c.i], last = c.i === st.length - 1;
  const dd = wkData(step);
  let body = "";
  if (step.t === "warm") {
    body = `<span class="pill acc">AQUECIMENTO DE MANGUITO</span><h2 class="mid">${step.c.name}</h2>
      <p class="how">${step.c.how}</p>
      <div class="lbl">${step.c.sets} séries de ${step.c.reps[0]} repetições, carga leve</div>
      <div style="display:flex;flex-direction:column;gap:8px">${dd.sets.map((s, i) => `<button class="chk ${s.done ? "on" : ""}" data-act="wk-warmset" data-i="${i}"><span class="box">${ic("check")}</span><span class="t">Série ${i + 1}</span></button>`).join("")}</div>`;
  } else {
    const slot = step.e, v = findV(slot, dd.vid), unit = slot.unit ? "seg" : "reps";
    const done = dd.sets.filter(s => s.done).length;
    const pend = dd.sets.findIndex(s => !s.done);
    const rows = dd.sets.map((s, i) => `<div class="setrow ${s.done ? "done" : ""} ${i === pend && c.mode === "set" ? "cur" : ""}"><span class="n">${i + 1}</span>
      <input inputmode="decimal" data-f="kg" data-i="${i}" value="${s.kg || ""}" placeholder="kg" aria-label="carga série ${i + 1}">
      <input inputmode="numeric" data-f="reps" data-i="${i}" value="${s.reps}" aria-label="${unit} série ${i + 1}">
      ${c.mode === "set" ? `<button class="ok" data-act="wk-set" data-i="${i}" aria-label="feito">${ic("check")}</button>` : `<span></span>`}</div>`).join("");
    const kstep = slot.inc ? Math.min(slot.inc, 5) : 0, rstep = slot.unit ? 5 : 1; const ru = slot.unit ? "s" : "rep";
    const adj = c.mode === "set" && pend >= 0 ? `<div class="chips" style="justify-content:center" aria-label="ajuste rápido da próxima série">${kstep ? `<button class="chip" data-act="wk-adj" data-f="kg" data-d="${-kstep}">− ${kstep} kg</button><button class="chip" data-act="wk-adj" data-f="kg" data-d="${kstep}">+ ${kstep} kg</button>` : ""}<button class="chip" data-act="wk-adj" data-f="reps" data-d="${-rstep}">− ${rstep} ${ru}</button><button class="chip" data-act="wk-adj" data-f="reps" data-d="${rstep}">+ ${rstep} ${ru}</button></div>` : "";
    body = `<div class="row between"><span class="pill">${slot.sets} × ${slot.reps[0] === slot.reps[1] ? slot.reps[0] : slot.reps[0] + "–" + slot.reps[1]}${slot.unit ? " s" : ""} · descanso ${slot.rest}s</span><button class="chip" data-act="wk-mode">${c.mode === "set" ? "1 toque por série" : "Registrar ao final"}</button></div>
      <h2 class="mid">${v[1]}</h2>
      <p class="muted" style="font-size:15px">${dd.hint}</p>
      <div class="grid3" style="grid-template-columns:30px 1fr 1fr 76px;gap:8px;margin-bottom:-6px"><span></span><span class="mini">kg</span><span class="mini">${unit}</span><span class="mini">${c.mode === "set" ? "feito" : ""}</span></div>
      ${rows}
      ${adj}
      ${c.mode === "end" ? `<button class="btn solid full" data-act="wk-allset">${ic("check")} REGISTRAR EXERCÍCIO (${dd.sets.length} séries)</button>` : ""}
      <details class="fold" open><summary>Como fazer ${ic("down")}</summary><div class="body"><p class="how">${v[2]}</p></div></details>
      <div><div class="lbl" style="margin-bottom:6px">Variações (para não enjoar)</div><div class="chips">${slot.v.map(x => `<button class="chip ${x[0] === dd.vid ? "on" : ""}" data-act="wk-var" data-v="${x[0]}">${x[1].replace(/ \(.*\)/, "")}</button>`).join("")}</div></div>
      ${slot.id === "a2" && dd.vid === "a2_incl_barra" && painAvg() !== null && painAvg() >= 2 ? banner("warn", "shield", "Atenção ao ombro", "Sua dor recente está acima de 2. Prefira halteres hoje.") : ""}
      <p class="muted" style="font-size:14px">${done}/${dd.sets.length} séries. Termine sentindo que faria mais 3 repetições.</p>`;
  }
  const pIdx = step.t === "ex" ? dd.sets.findIndex(s => !s.done) : -1;
  const cta = step.t === "ex" && c.mode === "set" && pIdx >= 0
    ? `<button class="btn solid big-cta grow" data-act="wk-set" data-i="${pIdx}">${ic("check")} SÉRIE ${pIdx + 1} FEITA</button><button class="btn" data-act="wk-next" aria-label="${last ? "finalizar treino" : "próximo exercício"}">${ic(last ? "check" : "right")}</button>`
    : `<button class="btn solid big-cta grow" data-act="wk-next">${last ? "FINALIZAR TREINO" : "PRÓXIMO"} ${ic(last ? "check" : "right")}</button>`;
  const pct = (c.i + 1) / st.length * 100;
  $("#wk-body").innerHTML = `
    <div class="row between"><button class="circ-btn" data-act="wk-back" aria-label="voltar">${ic("left")}</button><div class="grow" style="text-align:center"><div class="lbl">Treino ${c.day} · ${PLAN[c.day].name}</div><div class="muted" style="font-size:14px">${c.i + 1} de ${st.length}</div></div><button class="circ-btn" data-act="wk-exit" aria-label="sair">${ic("x")}</button></div>
    <div class="prog"><i style="width:${pct}%"></i></div>
    ${body}
    <div class="stickybar">
      <button class="btn" data-act="wk-prev" ${c.i === 0 ? "disabled" : ""} aria-label="anterior">${ic("left")}</button>
      ${cta}
    </div>`;
}
function wkNext() {
  const c = S.cur, st = stepsOf(c.day);
  if (c.i >= st.length - 1) return wkFinish();
  c.i++; save(); wkRender(); $("#screen-wk").scrollTo({ top: 0 });
}
function wkFinish() {
  const c = S.cur, rows = [];
  PLAN[c.day].ex.forEach(slot => {
    const d = c.data[slot.id]; if (!d) return;
    const sets = d.sets.filter(s => s.done).map(s => ({ kg: num(s.kg), reps: num(s.reps) })); if (!sets.length) return;
    const nx = nextLoad(slot, sets);
    (S.logs[d.vid] = S.logs[d.vid] || []).push({ date: c.date, day: c.day, sets });
    rows.push({ slot, vid: d.vid, nx, stag: stagnant(slot, d.vid) });
  });
  DW(c.date).h.treino = true; DW(c.date).wk = c.day;
  const L = c.day; S.cur = null; save(); wkClose(); haptic(30);
  summarySheet(L, rows);
}
function painSheet(L) {
  openSheet(`<h3 class="mid">Dor no ombro esquerdo</h3><p class="muted">De 0 (nenhuma) a 10 (muito forte), agora, ao final do treino ${L}.</p>
  <div class="grid3" style="grid-template-columns:repeat(6,1fr)">${Array.from({ length: 11 }, (_, i) => `<button class="chip" style="padding:0" data-act="pain" data-v="${i}">${i}</button>`).join("")}</div>
  <button class="btn ghost full" data-act="close">Pular</button>`);
}

/* ---- descanso ---- */
const RT = { end: 0, total: 0, paused: null, iv: null };
let AC = null;
function beep() {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t = AC.currentTime;
    [0, .25, .5].forEach(o => { const os = AC.createOscillator(), g = AC.createGain(); os.frequency.value = 880; os.connect(g); g.connect(AC.destination); g.gain.setValueAtTime(.0001, t + o); g.gain.exponentialRampToValueAtTime(.4, t + o + .02); g.gain.exponentialRampToValueAtTime(.0001, t + o + .18); os.start(t + o); os.stop(t + o + .2); });
  } catch (e) { }
}
function unlockAudio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { } }
function startRest(sec, next) {
  unlockAudio(); clearInterval(RT.iv); RT.total = sec; RT.end = Date.now() + sec * 1000; RT.paused = null; RT.next = next || "";
  $("#rest").classList.add("on"); restDraw(); RT.iv = setInterval(restTick, 250);
}
function restLeft() { return RT.paused !== null ? RT.paused : Math.max(0, Math.ceil((RT.end - Date.now()) / 1000)); }
function restDraw() {
  const l = restLeft(), p = RT.total ? l / RT.total : 0;
  $("#rest-in").innerHTML = `<div class="lbl">Descanso</div>${ring(p, 200, 10, "var(--accent)", `<div class="time">${Math.floor(l / 60)}:${pad(l % 60)}</div>`)}
  <div class="muted">${RT.next ? esc(RT.next) : ""}</div>
  <div class="grid2" style="width:100%"><button class="btn" data-act="rest-adj" data-s="-15">−15 s</button><button class="btn" data-act="rest-adj" data-s="15">+15 s</button><button class="btn" data-act="rest-pause">${RT.paused !== null ? "Retomar" : "Pausar"}</button><button class="btn solid" data-act="rest-skip">Pular</button></div>`;
}
function restTick() { if (RT.paused !== null) return; if (restLeft() <= 0) return restDone(); restDraw(); }
function restDone() {
  clearInterval(RT.iv); beep(); try { navigator.vibrate && navigator.vibrate([200, 100, 200, 100, 200]); } catch (e) { }
  notify("Descanso acabou", RT.next || "Hora da próxima série.");
  setTimeout(closeRest, 900);
}
function closeRest() { clearInterval(RT.iv); $("#rest").classList.remove("on"); }
function notify(title, body) {
  try { if ("Notification" in window && Notification.permission === "granted") { if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r => r.showNotification(title, { body, tag: "sir-rest", icon: "icon-192.png", vibrate: [200, 100, 200] })).catch(() => new Notification(title, { body })); else new Notification(title, { body }); } } catch (e) { }
}

/* ============ COMER ============ */
function foodSheet(i) {
  const f = FOODS[i], sug = f[5] === "Bebidas" && /COM açúcar/.test(f[0]);
  const chips = ["Café da manhã", "Almoço", "Lanche", "Jantar", "Ceia"].map(m => `<button class="chip ${UI.meal === m ? "on" : ""}" data-act="meal-sel" data-m="${m}">${m}</button>`).join("");
  openSheet(`<h3 class="mid">${esc(f[0])}</h3><div class="muted">${f[1]} kcal e ${f[2]} g de proteína por 100 g · fonte ${f[6] === "T" ? "TACO 4ª ed." : "estimativa/rótulo"}</div>
  ${sug ? banner("warn", "info", "Bebida com açúcar", "Quebra a Regra nº 1 de hoje. Pode registrar: o app não julga, amanhã continua normal.") : ""}
  <div class="row"><div class="stepper grow"><button data-act="g-adj" data-s="-10">−</button><input id="g" inputmode="numeric" value="${f[4]}" data-i="${i}"><button data-act="g-adj" data-s="10">+</button><span class="muted">g</span></div></div>
  <div class="grid3"><button class="chip" data-act="g-set" data-g="${f[4]}">1 porção</button><button class="chip" data-act="g-set" data-g="${f[4] * 2}">2 porções</button><button class="chip" data-act="g-set" data-g="100">100 g</button></div>
  <div class="muted">${f[3]} = ${f[4]} g</div><div class="chips">${chips}</div>${favBtn(i)}
  <div class="tile in row between"><span id="g-sum" class="mid tabnum"></span></div>
  <button class="btn solid full" data-act="food-add" data-i="${i}">ADICIONAR</button>`);
  gSum(i);
}
function gSum(i) { const f = FOODS[i], g = num($("#g").value); $("#g-sum").textContent = `${Math.round(f[1] * g / 100)} kcal · ${r1(f[2] * g / 100)} g prot`; }

/* ============ EVOLUÇÃO ============ */
function chartSVG() {
  const pts = S.weights.slice(-16); if (pts.length < 2) return `<p class="muted">O gráfico aparece a partir da segunda pesagem.</p>`;
  const W = 320, H = 130, pl = 30, pr = 8, pt = 10, pb = 20, goal = S.profile.goal;
  const all = pts.map(p => p.kg).concat(goal), mn = Math.floor(Math.min(...all) - 1), mx = Math.ceil(Math.max(...all) + 1);
  const x = i => pl + i * (W - pl - pr) / (pts.length - 1), y = v => pt + (mx - v) / (mx - mn) * (H - pt - pb);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(" ");
  return `<svg class="svg-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de peso"><line x1="${pl}" x2="${W - pr}" y1="${y(goal)}" y2="${y(goal)}" stroke="var(--ok)" stroke-dasharray="4 4"/><text x="${pl + 2}" y="${y(goal) - 3}">meta ${goal}</text><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.kg)}" r="3.5" fill="var(--accent)"/>`).join("")}<text x="0" y="${y(mx) + 8}">${mx}</text><text x="0" y="${y(mn)}">${mn}</text><text x="${pl}" y="${H - 4}">${dispDate(pts[0].d)}</text><text x="${W - pr}" y="${H - 4}" text-anchor="end">${dispDate(pts[pts.length - 1].d)}</text></svg>`;
}
function rEvol() {
  const w = curWeight(), s = S.profile.startWeight, g = S.profile.goal, minW = Math.min(s, ...S.weights.map(x => x.kg));
  const prog = Math.max(0, Math.min(1, (s - w) / (s - g)));
  const ms = MILESTONES.map(m => { const ok = m.test(s, minW); return `<div class="li"><span class="box" style="width:30px;height:30px;border-radius:10px;display:grid;place-items:center;flex:none;${ok ? "background:var(--ok);color:#fff" : "box-shadow:var(--inset);color:transparent"}">${ic("check")}</span><div class="grow"><div style="font-weight:700">${m.nm} · ${m.lbl(s)}</div><div class="muted" style="font-size:14px">${m.txt}</div></div></div>`; }).join("");
  const wkSq = Array.from({ length: 8 }, (_, i) => { const mk = addDays(mondayOf(today()), (i - 7) * 7), a = activeInWeek(mk); return `<div style="flex:1;text-align:center"><div style="height:34px;border-radius:10px;background:${a >= 5 ? "var(--ok)" : a === 4 ? "var(--warn)" : a ? "var(--bad)" : "var(--surface2)"};opacity:${a ? 1 : .6}"></div><div class="lbl" style="margin-top:4px">${a}</div></div>`; }).join("");
  const recs = Object.entries(S.logs).map(([vid, a]) => { let best = 0; a.forEach(l => l.sets.forEach(x => best = Math.max(best, x.kg))); let nm = vid; PLAN && DAY_ORDER.forEach(L => PLAN[L].ex.forEach(e => e.v.forEach(v => { if (v[0] === vid) nm = v[1]; }))); return [nm, best, a.length]; }).filter(r => r[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const lastNeck = S.neck[S.neck.length - 1];
  $("#v-evol").innerHTML = `
  <section class="card" style="background:transparent;box-shadow:none;padding:0"><h2 class="h1">Evolução</h2><p class="muted">Pesagem semanal, segunda ao acordar. O pescoço clareia antes da balança.</p></section>
  <section class="card">
    <div class="row between"><div><div class="lbl">Peso atual</div><div class="big tabnum">${r1(w)} <span class="muted" style="font-size:16px">kg</span></div></div><div style="text-align:right"><div class="lbl">Desde o início</div><div class="mid tabnum" style="color:${w <= s ? "var(--ok)" : "var(--bad)"}">${r1(w - s) > 0 ? "+" : ""}${r1(w - s)} kg</div></div></div>
    <div class="bar acc"><i style="width:${prog * 100}%"></i></div><div class="row between"><span class="lbl">${s} kg</span><span class="lbl">Meta ${g} kg · faltam ${r1(Math.max(0, w - g))}</span></div>
    ${chartSVG()}
    <button class="btn solid full" data-act="weigh">${ic("scale")} REGISTRAR PESO</button>
    <p class="muted" style="font-size:15px">Nunca se pese depois de furar: o número vem inflado por sódio e água e você vai ler como gordura.</p>
    ${S.weights.length ? `<div class="list">${S.weights.slice(-6).reverse().map(x => `<div class="li"><div class="grow"><b class="tabnum">${x.kg} kg</b>${x.waist ? `<span class="muted"> · cintura ${x.waist} cm</span>` : ""}</div><span class="muted">${dispDate(x.d)}</span></div>`).join("")}</div>` : ""}
  </section>
  <section class="card"><div class="lbl">Marcos</div><div class="list">${ms}</div></section>
  <section class="card">
    <div class="lbl">Termômetro do pescoço (acantose)</div>
    <p class="muted">Compare a mancha com o espelho, a cada 2 semanas. 1 = bem escura, 5 = quase sumiu.</p>
    <div class="seg">${[1, 2, 3, 4, 5].map(v => `<button class="${lastNeck && lastNeck.v === v && lastNeck.d === today() ? "on" : ""}" data-act="neck" data-v="${v}">${v}</button>`).join("")}</div>
    ${S.neck.length ? `<div class="muted" style="font-size:15px">${S.neck.slice(-6).map(n => `${dispDate(n.d)}: ${n.v}`).join(" · ")}</div>` : ""}
  </section>
  <section class="card"><div class="lbl">Ritmo das últimas 8 semanas</div><div class="row" style="gap:6px;align-items:flex-start">${wkSq}</div><p class="muted" style="font-size:14px">Verde = 5+ dias ativos · amarelo = 4 · vermelho = menos.</p></section>
  ${recs.length ? `<section class="card"><div class="lbl">Maiores cargas registradas</div><div class="list">${recs.map(r => `<div class="li"><div class="grow">${esc(r[0])}</div><b class="tabnum">${r[1]} kg</b></div>`).join("")}</div></section>` : ""}`;
}

/* ============ MAIS ============ */
function suppCatalogHTML() {
  let a = SUPP_CATALOG.slice().sort((p, q) => UI.supSort === "price" ? (p.price - q.price || q.help - p.help) : (q.help - p.help || p.price - q.price));
  
  let sups = a.filter(x => x.t === "S");
  let meds = a.filter(x => x.t === "M");
  
  const renderItem = (x) => `<div class="tile" style="display:flex;flex-direction:column;gap:6px; margin-bottom:10px; background:var(--surface);"><div class="row between"><b style="color:var(--text); font-size:15px;">${x.n}</b></div><div class="row wrap gap6"><span class="pill acc" style="font-size:11px;">Custo ${"$".repeat(x.price)}</span><span class="pill ok" style="font-size:11px;">Ajuda ${x.help}/5</span></div><div style="font-size:14px; color:var(--text); line-height:1.4;">${x.why}</div><div class="muted" style="font-size:13px"><b>Risco:</b> ${x.risk}</div></div>`;
  
  return `
    <details class="fold" style="margin-bottom:10px; background:var(--surface2);">
        <summary style="font-weight:600; font-size:14px; color:var(--text);">💊 Suplementos</summary>
        <div class="body" style="padding:10px 10px 0 10px;">${sups.map(renderItem).join("")}</div>
    </details>
    <details class="fold" style="background:var(--surface2);">
        <summary style="font-weight:600; font-size:14px; color:var(--text);">👨‍⚕️ Remédios (Levar ao médico)</summary>
        <div class="body" style="padding:10px 10px 0 10px;">${meds.map(renderItem).join("")}</div>
    </details>
  `;
}

function rMais() {
  const tg = TG(), s = S.settings, k = today(), bk = s.lastBackup;
  $("#v-mais").innerHTML = `
  <section class="card" style="background:transparent;box-shadow:none;padding:0"><h2 class="h1">Mais</h2></section>
  <section class="card"><img class="logo-card" src="%%LOGO%%" alt="Still I Rise, por Hobert Silva Santos, Salvador BR" width="240" height="240"></section>
  <section class="card">
    <div class="lbl">Metas nutricionais (Mifflin-St Jeor)</div>
    <div class="grid2"><div class="tile in"><div class="lbl">TMB</div><div class="mid tabnum">${fmtInt(tg.tmb)}</div></div><div class="tile in"><div class="lbl">Gasto total</div><div class="mid tabnum">${fmtInt(tg.tdee)}</div></div><div class="tile in"><div class="lbl">Meta diária</div><div class="mid tabnum">${fmtInt(tg.kcal)} kcal</div></div><div class="tile in"><div class="lbl">Proteína</div><div class="mid tabnum">${tg.prot} g</div></div></div>
    <p class="muted" style="font-size:15px">Calculado para ${r1(s.calcWeight)} kg, déficit de 1.000 kcal, piso de 1.800. Recalcula sozinho a cada 4 kg de variação.</p>
    <div class="row between"><span class="grow">${esc(S.profile.name)} · ${S.profile.height} cm · ${S.profile.age} anos</span><button class="btn sm" data-act="profile">${ic("edit")} Editar</button></div>
  </section>
  <section class="card">
    <div class="lbl">Suplementos e remédios</div>
    <p class="muted" style="font-size:15px">Informativo, sem doses de remédio. Tudo que é prescrição deve ser decidido com seu médico. GLP-1 ficou de fora por decisão sua.</p>
    <div class="seg"><button class="${UI.supSort === "price" ? "on" : ""}" data-act="sup-sort" data-v="price">Menor custo</button><button class="${UI.supSort === "help" ? "on" : ""}" data-act="sup-sort" data-v="help">Mais ajuda</button></div>
    
    <div style="display:flex;flex-direction:column;gap:10px" id="supcat">${suppCatalogHTML()}</div>
  </section>
  <section class="card">
    <div class="lbl">Aparência</div>
    <div class="seg"><button class="${s.theme === "auto" ? "on" : ""}" data-act="theme" data-v="auto">Auto</button><button class="${s.theme === "light" ? "on" : ""}" data-act="theme" data-v="light">Claro</button><button class="${s.theme === "dark" ? "on" : ""}" data-act="theme" data-v="dark">Escuro</button></div>
    <div class="lbl" style="margin-top:6px">Registro no Modo Treino</div>
    <div class="seg"><button class="${s.logMode === "set" ? "on" : ""}" data-act="logmode" data-v="set">1 toque por série</button><button class="${s.logMode === "end" ? "on" : ""}" data-act="logmode" data-v="end">Ao final</button></div>
  </section>
  <section class="card">
    <div class="lbl">Notificações</div>
    <div class="row between"><span class="grow">Avisar fim do descanso e próximo exercício</span><button class="tog ${s.notif ? "on" : ""}" data-act="notif" aria-label="notificações"><i></i></button></div>
    ${banner("warn", "info", "Com o app fechado", "Um app web não consegue disparar alarme sozinho (05:00, água). Por isso o app gera lembretes para o calendário do seu celular, que tocam mesmo com ele fechado. O aviso de fim de descanso acima só funciona com o app aberto.")}
    <button class="btn full" data-act="rem-open">${ic("download")} Criar lembretes no calendário</button>
  </section>
  
  <section class="card">
    <div class="row between">
        <h2 class="h1">Backup em Nuvem (Automático)</h2>
        <span class="badge" style="background:var(--accent); color:#fff; font-size:10px;">Cloud Sync (Gist)</span>
      </div>
      <p class="muted" style="font-size:14px">Gera um Gist secreto no seu GitHub automaticamente a cada alteração no app.</p>
      
      <label class="lbl" style="margin-top:10px">Seu Token Pessoal (GitHub PAT - escopo 'gist')</label>
      <input class="field" id="ghToken" type="password" placeholder="ghp_..." autocomplete="off" value="${s.ghToken ? '********' : ''}">
      
      <label class="lbl">Gist ID (O app cria se estiver vazio)</label>
      <input class="field" id="ghGistId" type="text" placeholder="Ex: 5b4e72a..." autocomplete="off" value="${esc(s.ghGistId || '')}">
      
      <div class="grid2" style="margin-top:10px;">
        <button class="btn solid" data-act="gh-save">Salvar Token</button>
        <button class="btn" data-act="gh-sync">⬇️ Forçar Download</button>
      </div>
      <p class="muted" style="margin-top:10px; font-size:12px;">Dica: Salve o Gist ID gerado se quiser restaurar seus dados em outro aparelho.</p>
    </section>

    <section class="card">
      <div class="lbl">Dados e backup (Manual)</div>
    <p class="muted" style="font-size:15px">Camada 1: localStorage. Camada 2: espelho em IndexedDB. Camada 3: arquivo .json, o único que sobrevive à troca de celular. ${bk ? `Último backup: ${dispDate(bk)} (${diffDays(k, bk)} dias).` : "Nenhum backup exportado ainda."} <span id="persist"></span></p>
    <div class="grid2"><button class="btn" data-act="export">${ic("download")} Exportar</button><button class="btn" data-act="import">${ic("upload")} Importar</button></div>
    <input type="file" id="file" accept="application/json,.json" hidden>
  </section>
  <section class="card">
    <div class="lbl">Protocolo de recaída</div>
    <p class="muted" style="font-size:16px"><b>Furou uma refeição:</b> a próxima é normal. Não compensa pulando nem treina dobrado.<br><b>Furou um dia:</b> entra como dia ruim e amanhã segue o plano. Um dia de 4.000 kcal numa semana de 2.000 ainda é déficit.<br><b>Furou uma semana:</b> volte pelo menor degrau: só não beber açúcar. Os outros hábitos voltam depois.<br><b>Nunca se pese após furar.</b></p>
  </section>
  <section class="card"><button class="btn danger full" data-act="reset">Apagar todos os dados</button></section>
    <div style="text-align:center; padding:30px 0 20px; color:var(--muted); font-size:12px; font-weight:600; letter-spacing:1px; text-transform:uppercase;">
      ⚡ Powered by Hobert Silva
    </div>`;
  if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(p => { const e = $("#persist"); if (e) e.textContent = p ? "Armazenamento persistente ativo." : "Armazenamento persistente não concedido: exporte backups."; });
}

/* ============ ações ============ */
function exportData() {
  const blob = new Blob([JSON.stringify(safeState(), null, 1)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `still-i-rise-backup-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  S.settings.lastBackup = today(); save(); toast("Backup exportado."); render();
}
function weighSheet() {
  const k = today(), y = !isActive(addDays(k, -1)) && S.weights.length;
  openSheet(`<h3 class="mid">Registrar peso</h3>
  <p class="muted">Ao acordar, depois do banheiro, antes de comer. Sempre nas mesmas condições.</p>
  ${y ? banner("warn", "info", "Ontem foi um dia difícil", "O número pode estar inflado por sódio e água. Se puder, espere a próxima segunda.") : ""}
  <label class="lbl">Peso (kg)</label><input class="field" id="wkg" inputmode="decimal" placeholder="${r1(curWeight())}">
  <label class="lbl">Cintura (cm, opcional)</label><input class="field" id="wwaist" inputmode="decimal" placeholder="ex.: 128">
  <button class="btn solid full" data-act="weigh-save">SALVAR</button>`);
}
function profileSheet() {
  const p = S.profile;
  openSheet(`<h3 class="mid">Perfil</h3>
  <label class="lbl">Nome</label><input class="field" id="pn" value="${esc(p.name)}">
  <div class="grid2"><div><label class="lbl">Peso inicial (kg)</label><input class="field" id="ps" inputmode="decimal" value="${p.startWeight}"></div><div><label class="lbl">Meta (kg)</label><input class="field" id="pg" inputmode="decimal" value="${p.goal}"></div><div><label class="lbl">Altura (cm)</label><input class="field" id="ph" inputmode="numeric" value="${p.height}"></div><div><label class="lbl">Idade</label><input class="field" id="pa" inputmode="numeric" value="${p.age}"></div></div>
  <button class="btn solid full" data-act="profile-save">SALVAR</button>`);
}
function quickSheet() {
  openSheet(`<h3 class="mid">Adicionar por rótulo</h3>
  <input class="field" id="qn" placeholder="Nome (ex.: Barra de proteína)">
  <div class="grid2"><input class="field" id="qk" inputmode="decimal" placeholder="kcal totais"><input class="field" id="qp" inputmode="decimal" placeholder="proteína (g)"></div>
  <div class="chips">${["Café da manhã", "Almoço", "Lanche", "Jantar", "Ceia"].map(m => `<button class="chip ${UI.meal === m ? "on" : ""}" data-act="meal-sel" data-m="${m}">${m}</button>`).join("")}</div>
  <button class="btn solid full" data-act="quick-add">ADICIONAR</button>`);
}

document.addEventListener("click", e => {
  const g = e.target.closest("[data-go]"); if (g) return go(g.dataset.go);
  const t = e.target.closest("[data-tab]"); if (t) return go(t.dataset.tab);
  const b = e.target.closest("[data-act]"); if (!b) { if (e.target.id === "sheet") closeSheet(); return; }
  const a = b.dataset.act, k = today(), c = S.cur;
  if (ACT[a]) return ACT[a](b, e);
  switch (a) {
    case "habit": {
      const d = DW(k), wasA = isActive(k), wasW = activeInWeek(mondayOf(k)) >= 5; d.h[b.dataset.id] = !d.h[b.dataset.id]; save(); render(); haptic();
      if (!wasA && isActive(k)) toast(activeInWeek(mondayOf(k)) >= 5 && !wasW ? "Meta da semana cumprida. Isso é ritmo." : "Dia ativo. Este dia conta.");
      break;
    }
    case "supp": { const d = DW(k); d.s[b.dataset.id] = !d.s[b.dataset.id]; save(); render(); haptic(); break; }
    case "water": waterAdd(num(b.dataset.ml)); render(); break;
    case "wk-skip": DW(k).skipWk = true; save(); render(); break;
    case "wk-unskip": DW(k).skipWk = false; save(); render(); break;
    case "pickday": UI.pickDay = b.dataset.day; render(); break;
    case "tog-rotate": S.settings.rotate = !S.settings.rotate; save(); render(); break;
    case "wk-start": wkStart(b.dataset.day); break;
    case "wk-resume": wkOpen(); break;
    case "wk-back": case "wk-exit": wkClose(); break;
    case "wk-prev": if (c.i > 0) { c.i--; save(); wkRender(); } break;
    case "wk-next": wkNext(); break;
    case "wk-mode": c.mode = c.mode === "set" ? "end" : "set"; S.settings.logMode = c.mode; save(); wkRender(); break;
    case "wk-warmset": { const st = stepsOf(c.day)[c.i], dd = wkData(st), i = +b.dataset.i; dd.sets[i].done = !dd.sets[i].done; save(); wkRender(); break; }
    case "wk-set": {
      const st = stepsOf(c.day)[c.i], dd = wkData(st), i = +b.dataset.i, s = dd.sets[i]; s.done = !s.done; save(); wkRender(); haptic(15);
      if (s.done && i < dd.sets.length - 1) startRest(st.e.rest, `Próxima: série ${i + 2} de ${dd.sets.length}`);
      else if (s.done) { const st2 = stepsOf(c.day); const nx = st2[c.i + 1]; if (nx) startRest(60, `Próximo: ${nx.t === "warm" ? nx.c.name : findV(nx.e, varId(nx.e))[1]}`); }
      break;
    }
    case "goto-treino": UI.pickDay = b.dataset.day; go("treino"); break;
    case "sum-next": if (["A", "D", "E"].includes(b.dataset.day)) painSheet(b.dataset.day); else closeSheet(); render(); break;
    case "wk-adj": { const st = stepsOf(c.day)[c.i], dd = wkData(st), f = b.dataset.f, d = num(b.dataset.d), p = dd.sets.findIndex(x => !x.done); if (p < 0) break; for (let i = p; i < dd.sets.length; i++) if (!dd.sets[i].done) dd.sets[i][f] = Math.max(0, r1(num(dd.sets[i][f]) + d)); save(); wkRender(); haptic(); break; }
    case "wk-allset": { const st = stepsOf(c.day)[c.i], dd = wkData(st); dd.sets.forEach(s => s.done = true); save(); notify("Exercício registrado", "Próximo exercício."); wkNext(); break; }
    case "wk-var": { const st = stepsOf(c.day)[c.i]; S.sel[st.e.id] = b.dataset.v; delete c.data[st.e.id]; save(); wkRender(); break; }
    case "rest-adj": { const s = num(b.dataset.s); if (RT.paused !== null) RT.paused = Math.max(1, RT.paused + s); else RT.end += s * 1000; RT.total = Math.max(1, RT.total + s); restDraw(); break; }
    case "rest-pause": if (RT.paused === null) RT.paused = restLeft(); else { RT.end = Date.now() + RT.paused * 1000; RT.paused = null; } restDraw(); break;
    case "rest-skip": closeRest(); break;
    case "pain": S.pain.push({ d: today(), day: S.days[today()]?.wk || "", v: +b.dataset.v }); save(); closeSheet(); toast(`Dor ${b.dataset.v}/10 registrada.`); if (painAvg() >= 4) toast("Média de dor ≥ 4: procure um fisioterapeuta."); break;
    case "close": closeSheet(); break;
    case "cat": UI.cat = b.dataset.c; rComer(); break;
    case "food": if (b.dataset.m) UI.meal = b.dataset.m; foodSheet(+b.dataset.i); break;
    case "meal-sel": UI.meal = b.dataset.m; $$("[data-act=meal-sel]").forEach(x => x.classList.toggle("on", x.dataset.m === UI.meal)); { const fb = $("#favbtn"); if (fb) fb.outerHTML = favBtn(+fb.dataset.i); } break;
    case "g-adj": { const inp = $("#g"); inp.value = Math.max(0, num(inp.value) + num(b.dataset.s)); gSum(+inp.dataset.i); break; }
    case "g-set": { const inp = $("#g"); inp.value = b.dataset.g; gSum(+inp.dataset.i); break; }
    case "food-add": { const f = FOODS[+b.dataset.i], gm = num($("#g").value); if (gm <= 0) return; const d = DW(k); d.meals.push({ t: Date.now(), n: f[0], g: gm, k: f[1] * gm / 100, p: f[2] * gm / 100, m: UI.meal }); if (f[5] === "Bebidas" && /COM açúcar/.test(f[0])) d.h.acucar = false; save(); closeSheet(); render(); toast("Adicionado."); break; }
    case "meal-del": { DW(k).meals.splice(+b.dataset.i, 1); save(); render(); break; }
    case "quick": quickSheet(); break;
    case "quick-add": { const kc = num($("#qk").value), pr = num($("#qp").value), nm = $("#qn").value.trim() || "Item de rótulo"; if (kc <= 0) return toast("Informe as kcal."); DW(k).meals.push({ t: Date.now(), n: nm, g: 0, k: kc, p: pr, m: UI.meal }); save(); closeSheet(); render(); break; }
    case "weigh": weighSheet(); break;
    case "weigh-save": {
      const kg = num($("#wkg").value), waist = num($("#wwaist").value); if (kg < 40 || kg > 300) return toast("Peso inválido.");
      S.weights = S.weights.filter(x => x.d !== k); S.weights.push({ d: k, kg: r1(kg), waist: waist || null }); S.weights.sort((x, y) => x.d < y.d ? -1 : 1);
      let msg = "Peso registrado.";
      if (Math.abs(kg - S.settings.calcWeight) >= 4) { S.settings.calcWeight = r1(kg); msg = `Peso registrado. Metas recalculadas: ${fmtInt(TG().kcal)} kcal e ${TG().prot} g de proteína.`; }
      save(); closeSheet(); render(); toast(msg); break;
    }
    case "neck": S.neck = S.neck.filter(n => n.d !== k); S.neck.push({ d: k, v: +b.dataset.v }); save(); render(); break;
    case "profile": profileSheet(); break;
    case "profile-save": { const p = S.profile; p.name = $("#pn").value.trim() || p.name; p.startWeight = num($("#ps").value, p.startWeight); p.goal = num($("#pg").value, p.goal); p.height = num($("#ph").value, p.height); p.age = num($("#pa").value, p.age); if (!S.weights.length) S.settings.calcWeight = p.startWeight; save(); closeSheet(); render(); break; }
    case "sup-sort": UI.supSort = b.dataset.v; rMais(); break;
    case "sup-type": UI.supType = b.dataset.v; rMais(); break;
    case "theme": S.settings.theme = b.dataset.v; save(); applyTheme(); rMais(); break;
    case "logmode": S.settings.logMode = b.dataset.v; save(); rMais(); break;
    case "notif": {
      if (S.settings.notif) { S.settings.notif = false; save(); rMais(); break; }
      if (!("Notification" in window)) return toast("Este navegador não suporta notificações.");
      Notification.requestPermission().then(p => { S.settings.notif = p === "granted"; save(); rMais(); toast(p === "granted" ? "Notificações ativadas." : "Permissão negada."); });
      break;
    }
    case "foto": fotoIniciar(); break;
    case "gem-save": { const kEl = $("#gemKey"), mEl = $("#gemModel"), kv = kEl ? kEl.value.trim() : null, mv = mEl ? mEl.value.trim() : null; if (kv) S.settings.gemKey = kv; if (mv) S.settings.gemModel = mv; save(); render(); toast(kv ? "Chave configurada." : "Modelo atualizado."); break; }
    case "gem-clear": S.settings.gemKey = ""; S.settings.gemAck = false; save(); rMais(); toast("Chave removida."); break;
    case "ia-del": IA.items.splice(+b.dataset.i, 1); if (!IA.items.length) closeSheet(); else iaSheet(); break;
    case "ia-add": { const d = DW(k); IA.items.forEach(x => d.meals.push({ t: Date.now(), n: "IA: " + x.nome, g: x.g, k: x.k, p: x.p, m: UI.meal })); save(); closeSheet(); render(); toast("Adicionado. Lembre: é estimativa."); haptic(); break; }
    case "recent": recenteSheet(+b.dataset.i); break;
    case "recent-add": { const m = IA.rec; if (!m) break; DW(k).meals.push({ t: Date.now(), n: m.n, g: m.g, k: m.k, p: m.p, m: UI.meal }); save(); closeSheet(); render(); toast("Adicionado."); haptic(); break; }
    
    case "gh-save": {
        const tEl = document.getElementById("ghToken"), gEl = document.getElementById("ghGistId");
        const tVal = tEl ? tEl.value.trim() : "";
        if (tVal && tVal !== "********") S.settings.ghToken = tVal;
        else if (!tVal) S.settings.ghToken = "";
        
        const gVal = gEl ? gEl.value.trim() : "";
        S.settings.ghGistId = gVal;
        
        save();
        toast("Nuvem configurada!");
        render();
        if (S.settings.ghToken && !S.settings.ghGistId) {
            syncToCloud(true);
        } else if (S.settings.ghToken && S.settings.ghGistId) {
            syncToCloud(true);
        }
        break;
    }
    case "gh-sync": {
        syncFromCloud();
        break;
    }

    case "export": exportData(); break;
    case "import": $("#file").click(); break;
    case "reset": if (confirm("Apagar TODOS os dados deste aparelho? Exporte um backup antes.")) { S = defaults(); save(); go("deck"); toast("Dados apagados."); } break;
  }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && $("#sheet").classList.contains("on")) closeSheet();
  if (e.key === "Enter" && !e.shiftKey && e.target.id === "ia-input") { e.preventDefault(); ACT["ia-send"](); }
});
document.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset.ia !== undefined) { const f = t.dataset.ia, it = IA.items[+t.dataset.i]; if (it) { it[f] = f === "nome" ? t.value : num(t.value); iaTotal(); } }
  else if (t.id === "ia-input") { t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }
  else if (t.id === "q") { UI.q = t.value; $("#foodlist").innerHTML = foodListHTML(); }
  else if (t.id === "g") gSum(+t.dataset.i);
  else if (t.dataset.f && S.cur) { const st = stepsOf(S.cur.day)[S.cur.i], dd = st.t === "ex" ? S.cur.data[st.e.id] : null; if (dd) { dd.sets[+t.dataset.i][t.dataset.f] = num(t.value); save(); } }
});
document.addEventListener("change", e => {
  if (e.target.id === "ia-foto") return iaFoto(e);
  if (e.target.id === "foto") { const f = e.target.files[0]; e.target.value = ""; if (f) fotoAnalisar(f); return; }
  if (e.target.id !== "file") return;
  const f = e.target.files[0]; if (!f) return;
  f.text().then(tx => { const o = JSON.parse(tx); if (!o || typeof o !== "object" || !o.profile || !o.days) throw 0; if (!confirm("Importar substitui os dados atuais deste aparelho. Continuar?")) return; const keep = {}; ["gemKey", "ghToken", "ghGistId"].forEach(k => keep[k] = S.settings[k]); S = mergeDefaults(o); Object.assign(S.settings, keep); save(); applyTheme(); go("deck"); toast("Backup importado."); }).catch(() => toast("Arquivo inválido."));
  e.target.value = "";
});
$("#themeBtn").addEventListener("click", () => { const dark = document.documentElement.dataset.theme === "dark"; S.settings.theme = dark ? "light" : "dark"; save(); applyTheme(); if (UI.tab === "mais") rMais(); });
matchMedia("(prefers-color-scheme:dark)").addEventListener && matchMedia("(prefers-color-scheme:dark)").addEventListener("change", () => S && applyTheme());
document.addEventListener("visibilitychange", () => { if (!document.hidden && S) { if (RT.iv && $("#rest").classList.contains("on")) restTick(); if (S.cur && $("#screen-wk").classList.contains("on")) { try { navigator.wakeLock && navigator.wakeLock.request("screen").then(l => wakeLock = l).catch(() => { }); } catch (e) { } } if (UI.tab === "deck") rDeck(); } });

/* ============ init ============ */
(async function init() {
  await loadState(); applyTheme();
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) { navigator.serviceWorker.register("sw.js").catch(() => { }); let had = !!navigator.serviceWorker.controller; navigator.serviceWorker.addEventListener("controllerchange", () => { if (had && !sessionStorage.getItem("sir_reloaded")) { sessionStorage.setItem("sir_reloaded", "1"); location.reload(); } had = true; }); }
  applyTimeTheme(); tickHeader(); go("deck");
  if (S.cur) toast("Treino em andamento. Abra pelo Deck.");
  setTimeout(maybeReview, 1000);
})();
