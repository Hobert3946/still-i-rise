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
  weights: [], days: {}, logs: {}, sel: {}, pain: [], neck: [], cur: null, chat: [],
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
function toast(t) { const e = $("#toast"); e.textContent = t; e.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove("on"), 2600); }
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
function orig_rDeck() {
  const k = today(), d = D(k), L = planLetter(k), tg = TG(), tot = dayTotals(k), h = new Date().getHours();
  const hi = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const week = activeInWeek(mondayOf(k)), ds = dayStreak(), ws = weekStreak(), abs = daysAbsent();
  const ban = [];
  const ab = ABSENCE.find(a => abs >= a.min);
  if (ab) ban.push(banner("acc", "leaf", `${abs} dias sem registro`, ab.txt));
  if (S.cur) ban.push(banner("acc", "play", "Treino em andamento", `Você começou o treino ${S.cur.day}. Continue de onde parou.`, `<div style="margin-top:8px"><button class="btn sm solid" data-act="wk-resume">Continuar treino</button></div>`));
  const pa = painAvg(); if (pa !== null && pa >= 4) ban.push(banner("bad", "shield", "Dor no ombro em alta", `Média das 3 últimas: ${r1(pa)}/10. Procure um fisioterapeuta antes de aumentar carga de empurrar.`));
  if (deloadSignal()) ban.push(banner("warn", "info", "Sinal de deload", "3 ou mais exercícios falharam 2 sessões seguidas com a mesma carga. Reduza cerca de 20% nesta semana e reavalie."));
  const bk = S.settings.lastBackup, bdays = bk ? diffDays(k, bk) : (Object.keys(S.days).length ? diffDays(k, firstDay()) : 0);
  if (bdays > 21) ban.push(banner("warn", "download", "Backup atrasado", `${bk ? `Último backup há ${bdays} dias.` : "Você nunca exportou um backup."} O arquivo .json é o único que sobrevive à troca de celular.`, `<div style="margin-top:8px"><button class="btn sm" data-act="export">Exportar agora</button></div>`));
  const isMon = parseKey(k).getDay() === 1, wk = mondayOf(k);
  if (isMon && !S.weights.some(w => w.d >= wk)) ban.push(banner("acc", "scale", "Dia de pesagem", "Segunda: ao acordar, depois do banheiro, antes de comer. Meça a cintura junto.", `<div style="margin-top:8px"><button class="btn sm solid" data-act="weigh">Registrar peso</button></div>`));

  const bars = Array.from({ length: 7 }, (_, i) => { const kk = addDays(k, i - 6), c = habitCount(kk); const dd = parseKey(kk); return `<div class="d ${kk === k ? "t" : ""}"><i style="height:${Math.max(8, c / 6 * 100)}%;background:${isActive(kk) ? "var(--ok)" : c ? "var(--accent)" : "var(--surface2)"}"></i><span>${DOW[dd.getDay()][0]}</span></div>`; }).join("");
  const wtxt = week >= 5 ? "Meta da semana cumprida." : week === 4 ? "Semana amarela: um dia a mais e fecha." : `Faltam ${5 - week} dia(s) ativos para a meta.`;

  const habits = HABITS.map(([id, t]) => `<button class="chk ${d.h[id] ? "on" : ""} ${id === "acucar" ? "key" : ""}" data-act="habit" data-id="${id}"><span class="box">${ic("check")}</span><span class="t">${t}${id === "acucar" ? `<span class="s">Regra nº 1. Se cumprir uma só, que seja esta.</span>` : ""}</span></button>`).join("");

  const doneToday = !!D(k).wk && !S.cur;
  let wk2;
  if (L && doneToday) {
    const nl = seqNext();
    wk2 = `<div class="sec-t"><span class="dot ok"></span><span class="lbl">Treino de hoje</span></div><h3 class="mid">${L} · ${PLAN[L].name} concluído</h3><p class="muted">As cargas do próximo treino já foram atualizadas. Próximo: <b>${nl} · ${PLAN[nl].name}</b>.</p><button class="btn full" data-act="goto-treino" data-day="${nl}">Ver próximo treino</button>`;
  } else if (L) {
    const p = PLAN[L];
    wk2 = `<div class="row between"><div><div class="sec-t"><span class="dot"></span><span class="lbl" style="color:var(--accent-ink)">Sessão do amanhecer · ${DOW[parseKey(k).getDay()]}</span></div><h3 class="mid" style="margin-top:4px">${L} · ${p.name}</h3></div><span class="pill">05:00 · ${estMin(L)} min</span></div>
      <p class="muted">${p.focus}. ${p.cuff ? "Começa com aquecimento de manguito." : "Sem aquecimento de manguito hoje."} ${inAdapt() ? "Semana " + weekNo() + " de adaptação: carga leve." : ""}</p>
      <button class="btn solid full" data-act="${S.cur ? "wk-resume" : "wk-start"}" data-day="${L}">${ic("play", "fill")} ${S.cur ? "CONTINUAR TREINO" : "INICIAR TREINO DO DIA"}</button>`;
  } else wk2 = `<div class="sec-t"><span class="dot sage"></span><span class="lbl">Descanso ativo</span></div><h3 class="mid">Fim de semana</h3><p class="muted">Sem treino de academia. Caminhada livre de 30 minutos conta como hábito. Se quiser treinar, escolha um dia na aba Treino.</p>`;

  const pw = Math.min(1, d.water / S.settings.waterGoal);
  const nextM = MILESTONES.find(m => !m.test(S.profile.startWeight, Math.min(...S.weights.map(w => w.kg), S.profile.startWeight)));
  const sup = SUPP_BASE.map(([id, n, s]) => `<button class="chk ${d.s[id] ? "on" : ""}" data-act="supp" data-id="${id}"><span class="box">${ic("check")}</span><span class="t">${n}<span class="s">${s}</span></span></button>`).join("");

  $("#v-deck").innerHTML = `
  <section class="card hero" style="gap:8px">
    <div class="row between"><span class="pill">${DOW[parseKey(k).getDay()]} · ${dispDate(k)}</span><span class="lbl">Semana ${weekNo()}${inAdapt() ? " · adaptação" : ""}</span></div>
    <div class="row" style="gap:14px;margin-top:4px"><img class="avatar lg" src="%%AVATAR%%" alt="" width="56" height="56"><h2 class="h1 grow">${hi}, ${esc(S.profile.name)}.</h2></div>
    <p class="quote">"Still I Rise. O crescimento é orgânico, como raízes antigas que se aprofundam calmas na terra morna."</p>
  </section>
  ${ban.length ? `<section style="order:1;display:flex;flex-direction:column;gap:10px">${ban.join("")}</section>` : ""}
  <section class="card" style="order:4">
    <div class="row between"><div class="sec-t"><span class="dot sage"></span><span class="lbl">Ritmo semanal</span></div><span class="pill ok">Não-punitivo</span></div>
    <div class="row" style="gap:16px">
      ${ring(week / 5, 112, 8, "var(--sage)", `<div><div class="big tabnum">${week}<span class="muted" style="font-size:16px">/5</span></div><div class="lbl">dias ativos</div></div>`)}
      <div class="grow" style="display:flex;flex-direction:column;gap:10px">
        <div class="tile row between"><div><div class="lbl">Sequência de dias</div><div class="mid tabnum">${ds}</div></div>${ic("flame")}</div>
        <div class="tile row between"><div><div class="lbl">Sequência de semanas</div><div class="mid tabnum">${ws}</div></div>${ic("trend")}</div>
      </div>
    </div>
    <div class="week">${bars}</div>
    <p class="muted" style="font-size:15px">${wtxt} Dia ativo = zero açúcar + 2 outros hábitos. Semana verde: 5+ dias. Semana amarela (4) não quebra a sequência. Só 2 semanas ruins seguidas zeram.</p>
  </section>
  <section class="card" style="order:3">
    <div class="row between"><div class="sec-t"><span class="dot ok"></span><span class="lbl">Hábitos de hoje</span></div><span class="pill">${habitCount(k)}/6</span></div>
    <div style="display:flex;flex-direction:column;gap:10px">${habits}</div>
  </section>
  <section class="card" style="order:2">${wk2}</section>
  <section class="card" style="order:5">
    <div class="row between"><div class="sec-t"><span class="dot" style="background:var(--sage)"></span><span class="lbl">Hidratação</span></div><span class="lbl">Meta ${S.settings.waterGoal / 1000} L</span></div>
    <div class="row between" style="align-items:baseline"><div><span class="big tabnum">${(d.water / 1000).toFixed(2)}</span><span class="muted"> / ${(S.settings.waterGoal / 1000).toFixed(2)} litros</span></div><span class="lbl">${Math.round(pw * 100)}%</span></div>
    <div class="bar"><i style="width:${pw * 100}%"></i></div>
    <div class="grid3"><button class="btn sm" data-act="water" data-ml="250">+250 ml</button><button class="btn sm" data-act="water" data-ml="500">+500 ml</button><button class="btn sm ghost" data-act="water" data-ml="-250">−250</button></div>
  </section>
  <section class="card" style="order:6">
    <div class="row between"><div class="sec-t"><span class="dot"></span><span class="lbl">Nutrição de hoje</span></div><button class="lbl" style="color:var(--accent-ink)" data-go="comer">Registrar comida</button></div>
    <div class="row" style="justify-content:space-around">
      ${ring(tot.k / tg.kcal, 104, 8, "grad", `<div><div class="mid tabnum">${fmtInt(tot.k)}</div><div class="lbl">/ ${fmtInt(tg.kcal)} kcal</div></div>`)}
      ${ring(tot.p / tg.prot, 104, 8, "var(--ok)", `<div><div class="mid tabnum">${Math.round(tot.p)}</div><div class="lbl">/ ${tg.prot} g prot</div></div>`)}
    </div>
  </section>
  <details class="fold card" style="order:7;padding:0 14px"><summary><span class="row"><span class="dot sage"></span><span class="lbl">Suplementos de hoje · ${Object.values(d.s).filter(Boolean).length}/${SUPP_BASE.length}</span></span>${ic("down")}</summary><div class="body">${sup}</div></details>
  ${nextM ? `<section class="card flat" style="order:8"><div class="lbl">Próximo marco</div><div class="mid">${nextM.nm} · ${nextM.lbl(S.profile.startWeight)}</div><p class="muted">${nextM.txt}</p></section>` : ""}
  <section class="card flat row" style="order:9;align-items:flex-start"><span style="color:var(--accent-ink)">${ic("sun")}</span><div><div class="lbl" style="color:var(--text)">Dica do dia</div><p class="muted" style="margin-top:2px">${tipOfDay()}</p></div></section>`;
}

/* ============ TREINO ============ */
function rTreino() {
  const k = today(), L = UI.pickDay || (D(k).wk ? seqNext() : (planLetter(k) || seqNext()));
  const p = PLAN[L], vol = weekVolume();
  const list = p.ex.map(e => { const v = findV(e, varId(e)); return `<div class="li"><div class="grow"><div style="font-weight:700">${v[1]}</div><div class="muted" style="font-size:14px">${e.sets} × ${e.reps[0] === e.reps[1] ? e.reps[0] : e.reps[0] + "–" + e.reps[1]}${e.unit ? " s" : ""} · descanso ${e.rest}s${e.inc ? ` · +${e.inc} kg` : ""}</div></div>${nextBadge(e, v[0])}<span class="tag">${e.v.length} variações</span></div>`; }).join("");
  const warm = p.cuff ? CUFF.map(c => `<div class="li"><div class="grow"><div style="font-weight:700">${c.name}</div><div class="muted" style="font-size:14px">${c.sets} × ${c.reps[0]}</div></div><span class="tag">AQUEC.</span></div>`).join("") : "";
  const pa = painAvg();
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
const CATS = ["Todos", ...Array.from(new Set(FOODS.map(f => f[5])))];
function foodListHTML() {
  const q = UI.q.trim().toLowerCase(), norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const nq = norm(q);
  const items = FOODS.map((f, i) => [f, i]).filter(([f]) => (UI.cat === "Todos" || f[5] === UI.cat) && (!nq || norm(f[0]).includes(nq)));
  if (!items.length) return `<p class="muted" style="padding:12px 0">Nada encontrado. Use "Adicionar por rótulo" abaixo.</p>`;
  return items.slice(0, 60).map(([f, i]) => `<button class="food" data-act="food" data-i="${i}"><div class="grow"><div style="font-weight:600">${esc(f[0])}</div><div class="muted" style="font-size:14px">${f[3]} (${f[4]} g) · ${Math.round(f[1] * f[4] / 100)} kcal · ${r1(f[2] * f[4] / 100)} g prot</div></div><span class="tag">${f[6]}</span>${ic("plus")}</button>`).join("") + (items.length > 60 ? `<p class="muted" style="font-size:14px;padding:8px 0">Mostrando 60 de ${items.length}. Refine a busca.</p>` : "");
}
function orig_rComer() {
  const k = today(), d = D(k), tg = TG(), tot = dayTotals(k);
  const meals = ["Café da manhã", "Almoço", "Lanche", "Jantar", "Ceia"];
  const groups = meals.map(m => { const it = d.meals.map((x, i) => [x, i]).filter(([x]) => x.m === m); if (!it.length) return ""; const kk = it.reduce((a, [x]) => a + x.k, 0), pp = it.reduce((a, [x]) => a + x.p, 0); return `<div><div class="row between"><span class="lbl">${m}</span><span class="lbl tabnum">${Math.round(kk)} kcal · ${Math.round(pp)} g</span></div><div class="list">${it.map(([x, i]) => `<div class="li"><div class="grow"><div style="font-weight:600">${esc(x.n)}</div><div class="muted" style="font-size:14px">${x.g} g · ${Math.round(x.k)} kcal · ${r1(x.p)} g prot</div></div><button class="circ-btn" style="width:40px;height:40px;color:var(--bad)" data-act="meal-del" data-i="${i}" aria-label="remover">${ic("trash")}</button></div>`).join("")}</div></div>`; }).join("");
  const rem = tg.kcal - tot.k;
  $("#v-comer").innerHTML = `
  <section class="card" style="background:transparent;box-shadow:none;padding:0"><h2 class="h1">Comer</h2><p class="muted">Meta: ${fmtInt(tg.kcal)} kcal e ${tg.prot} g de proteína. Proteína de comida, ovos e albumina.</p></section>
  <section class="card">
    <div class="row" style="justify-content:space-around">
      ${ring(tot.k / tg.kcal, 104, 8, "grad", `<div><div class="mid tabnum">${fmtInt(tot.k)}</div><div class="lbl">kcal</div></div>`)}
      ${ring(tot.p / tg.prot, 104, 8, "var(--ok)", `<div><div class="mid tabnum">${Math.round(tot.p)}</div><div class="lbl">g prot</div></div>`)}
    </div>
    <p class="muted" style="text-align:center">${rem >= 0 ? `Restam ${fmtInt(rem)} kcal e ${Math.max(0, Math.round(tg.prot - tot.p))} g de proteína.` : `${fmtInt(-rem)} kcal acima da meta. Um dia acima não desfaz uma semana. A próxima refeição é normal.`}</p>
    ${groups || `<p class="muted" style="text-align:center">Nada registrado hoje.</p>`}
  </section>
  <section class="card">
    <div class="row between"><span class="lbl">Tabela de alimentos (${FOODS.length})</span><span class="muted" style="font-size:13px">T = TACO · R = estimativa</span></div>
    ${fotoBtn()}
    ${recentesHTML()}
    <input class="field" id="q" type="search" placeholder="Buscar alimento" value="${esc(UI.q)}" autocomplete="off">
    <div class="chips">${CATS.map(c => `<button class="chip ${UI.cat === c ? "on" : ""}" data-act="cat" data-c="${c}">${c}</button>`).join("")}</div>
    <div class="list" id="foodlist">${foodListHTML()}</div>
    <button class="btn full" data-act="quick">${ic("plus")} Adicionar por rótulo (kcal e proteína)</button>
  </section>
  <section class="card">
    <div class="lbl">Comer na rua</div>
    ${STREET.map(s => `<details class="fold"><summary>${s.t}${ic("down")}</summary><div class="body">${banner("ok", "check", "Escolha certa", s.ok.d)}${banner("bad", "x", "Armadilha", s.bad.d)}</div></details>`).join("")}
  </section>`;
}
function foodSheet(i) {
  const f = FOODS[i], sug = f[5] === "Bebidas" && /COM açúcar/.test(f[0]);
  const chips = ["Café da manhã", "Almoço", "Lanche", "Jantar", "Ceia"].map(m => `<button class="chip ${UI.meal === m ? "on" : ""}" data-act="meal-sel" data-m="${m}">${m}</button>`).join("");
  openSheet(`<h3 class="mid">${esc(f[0])}</h3><div class="muted">${f[1]} kcal e ${f[2]} g de proteína por 100 g · fonte ${f[6] === "T" ? "TACO 4ª ed." : "estimativa/rótulo"}</div>
  ${sug ? banner("warn", "info", "Bebida com açúcar", "Quebra a Regra nº 1 de hoje. Pode registrar: o app não julga, amanhã continua normal.") : ""}
  <div class="row"><div class="stepper grow"><button data-act="g-adj" data-s="-10">−</button><input id="g" inputmode="numeric" value="${f[4]}" data-i="${i}"><button data-act="g-adj" data-s="10">+</button><span class="muted">g</span></div></div>
  <div class="grid3"><button class="chip" data-act="g-set" data-g="${f[4]}">1 porção</button><button class="chip" data-act="g-set" data-g="${f[4] * 2}">2 porções</button><button class="chip" data-act="g-set" data-g="100">100 g</button></div>
  <div class="muted">${f[3]} = ${f[4]} g</div><div class="chips">${chips}</div>
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
  let a = SUPP_CATALOG.filter(x => UI.supType === "all" || x.t === UI.supType);
  a = a.slice().sort((p, q) => UI.supSort === "price" ? (p.price - q.price || q.help - p.help) : (q.help - p.help || p.price - q.price));
  return a.map(x => `<div class="tile" style="display:flex;flex-direction:column;gap:6px"><div class="row between"><b>${x.n}</b><span class="tag">${x.t === "M" ? "LEVAR AO MÉDICO" : "SUPLEMENTO"}</span></div>
    <div class="row wrap gap6"><span class="pill acc">Custo ${"$".repeat(x.price)}</span><span class="pill ok">Ajuda ${x.help}/5</span></div>
    <div style="font-size:16px">${x.why}</div><div class="muted" style="font-size:15px"><b>Risco:</b> ${x.risk}</div></div>`).join("");
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
    <div class="seg"><button class="${UI.supType === "all" ? "on" : ""}" data-act="sup-type" data-v="all">Todos</button><button class="${UI.supType === "S" ? "on" : ""}" data-act="sup-type" data-v="S">Suplementos</button><button class="${UI.supType === "M" ? "on" : ""}" data-act="sup-type" data-v="M">Levar ao médico</button></div>
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
    ${banner("warn", "info", "Limite honesto", "Sem servidor de Web Push, o app não consegue disparar alarme com ele fechado (05:00, lembrete de água). Para isso use o despertador do celular. As notificações funcionam com o app aberto ou em segundo plano recente.")}
  </section>
  ${gemCard()}
  <section class="card">
    <div class="lbl">Dados e backup</div>
    <p class="muted" style="font-size:15px">Camada 1: localStorage. Camada 2: espelho em IndexedDB. Camada 3: arquivo .json, o único que sobrevive à troca de celular. ${bk ? `Último backup: ${dispDate(bk)} (${diffDays(k, bk)} dias).` : "Nenhum backup exportado ainda."} <span id="persist"></span></p>
    <div class="grid2"><button class="btn" data-act="export">${ic("download")} Exportar</button><button class="btn" data-act="import">${ic("upload")} Importar</button></div>
    <input type="file" id="file" accept="application/json,.json" hidden>
  </section>
  <section class="card">
    <div class="lbl">Protocolo de recaída</div>
    <p class="muted" style="font-size:16px"><b>Furou uma refeição:</b> a próxima é normal. Não compensa pulando nem treina dobrado.<br><b>Furou um dia:</b> entra como dia ruim e amanhã segue o plano. Um dia de 4.000 kcal numa semana de 2.000 ainda é déficit.<br><b>Furou uma semana:</b> volte pelo menor degrau: só não beber açúcar. Os outros hábitos voltam depois.<br><b>Nunca se pese após furar.</b></p>
  </section>
  <section class="card"><button class="btn danger full" data-act="reset">Apagar todos os dados</button></section>`;
  if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(p => { const e = $("#persist"); if (e) e.textContent = p ? "Armazenamento persistente ativo." : "Armazenamento persistente não concedido: exporte backups."; });
}

/* ============ ações ============ */
function exportData() {
  const safe = JSON.parse(JSON.stringify(S)); delete safe.settings.gemKey;
  const blob = new Blob([JSON.stringify(safe, null, 1)], { type: "application/json" });
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
  switch (a) {
    case "habit": {
      const d = DW(k), wasA = isActive(k), wasW = activeInWeek(mondayOf(k)) >= 5; d.h[b.dataset.id] = !d.h[b.dataset.id]; save(); render(); haptic();
      if (!wasA && isActive(k)) toast(activeInWeek(mondayOf(k)) >= 5 && !wasW ? "Meta da semana cumprida. Isso é ritmo." : "Dia ativo. Este dia conta.");
      break;
    }
    case "supp": { const d = DW(k); d.s[b.dataset.id] = !d.s[b.dataset.id]; save(); render(); haptic(); break; }
    case "water": waterAdd(num(b.dataset.ml)); render(); break;
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
    case "food": foodSheet(+b.dataset.i); break;
    case "meal-sel": UI.meal = b.dataset.m; $$("[data-act=meal-sel]").forEach(x => x.classList.toggle("on", x.dataset.m === UI.meal)); break;
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
    case "gem-save": { const kv = $("#gemKey").value.trim(), mv = $("#gemModel").value.trim(); if (kv) S.settings.gemKey = kv; S.settings.gemModel = mv || GEM_DEFAULT_MODEL; save(); rMais(); toast(kv ? "Chave salva neste aparelho." : "Modelo salvo."); break; }
    case "gem-clear": S.settings.gemKey = ""; S.settings.gemAck = false; save(); rMais(); toast("Chave removida."); break;
    case "ia-del": IA.items.splice(+b.dataset.i, 1); if (!IA.items.length) closeSheet(); else iaSheet(); break;
    case "ia-add": { const d = DW(k); IA.items.forEach(x => d.meals.push({ t: Date.now(), n: "IA: " + x.nome, g: x.g, k: x.k, p: x.p, m: UI.meal })); save(); closeSheet(); render(); toast("Adicionado. Lembre: é estimativa."); haptic(); break; }
    case "recent": recenteSheet(+b.dataset.i); break;
    case "recent-add": { const m = IA.rec; if (!m) break; DW(k).meals.push({ t: Date.now(), n: m.n, g: m.g, k: m.k, p: m.p, m: UI.meal }); save(); closeSheet(); render(); toast("Adicionado."); haptic(); break; }
    case "export": exportData(); break;
    case "import": $("#file").click(); break;
    case "reset": if (confirm("Apagar TODOS os dados deste aparelho? Exporte um backup antes.")) { S = defaults(); save(); go("deck"); toast("Dados apagados."); } break;
  }
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#sheet").classList.contains("on")) closeSheet(); });
document.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset.ia !== undefined) { const f = t.dataset.ia, it = IA.items[+t.dataset.i]; if (it) { it[f] = f === "nome" ? t.value : num(t.value); iaTotal(); } }
  else if (t.id === "q") { UI.q = t.value; $("#foodlist").innerHTML = foodListHTML(); }
  else if (t.id === "g") gSum(+t.dataset.i);
  else if (t.dataset.f && S.cur) { const st = stepsOf(S.cur.day)[S.cur.i], dd = st.t === "ex" ? S.cur.data[st.e.id] : null; if (dd) { dd.sets[+t.dataset.i][t.dataset.f] = num(t.value); save(); } }
});
document.addEventListener("change", e => {
  if (e.target.id === "foto") { const f = e.target.files[0]; e.target.value = ""; if (f) fotoAnalisar(f); return; }
  if (e.target.id !== "file") return;
  const f = e.target.files[0]; if (!f) return;
  f.text().then(tx => { const o = JSON.parse(tx); if (!o || typeof o !== "object" || !o.profile || !o.days) throw 0; if (!confirm("Importar substitui os dados atuais deste aparelho. Continuar?")) return; const oldKey = S.settings.gemKey; S = mergeDefaults(o); S.settings.gemKey = oldKey; save(); applyTheme(); go("deck"); toast("Backup importado."); }).catch(() => toast("Arquivo inválido."));
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
  go("deck");
  if (S.cur) toast("Treino em andamento. Abra pelo Deck.");
})();


/* === ANTIGRAVITY INJECTIONS === */
function applyTimeTheme() {
    const hr = new Date().getHours();
    document.body.classList.remove('theme-morning', 'theme-night');
    if(hr >= 4 && hr < 10) document.body.classList.add('theme-morning');
    else if(hr >= 19 || hr < 4) document.body.classList.add('theme-night');
}
applyTimeTheme();

function rDeck() {
    orig_rDeck();
    const vDeck = document.getElementById("v-deck");
    if(!vDeck || document.getElementById("agy-deck-ext")) return;
    
    const ext = document.createElement("div");
    ext.id = "agy-deck-ext";
    ext.innerHTML = `
      <div class="card">
        <h3 class="h1" style="font-size:20px;">Cardio Detalhado</h3>
        <button class="btn solid full" onclick="document.getElementById('cardioSheet').classList.add('on')">
          <svg class="icon"><use href="#i-flame"/></svg> Registrar Cardio
        </button>
      </div>
    `;
    vDeck.insertBefore(ext, vDeck.firstChild.nextSibling); 
}

function rComer() {
    orig_rComer();
    const vComer = document.getElementById("v-comer");
    if(!vComer || document.getElementById("agy-comer-ext")) return;
    
    const d = DW(today());
    if(!d.fiber) d.fiber = 0;
    
    const ext = document.createElement("div");
    ext.id = "agy-comer-ext";
    ext.innerHTML = `
      <div class="card">
        <h3 class="h1" style="font-size:20px;">Meta Fibras & Refeição Rápida</h3>
        <div class="row between"><div class="lbl">Fibras (Meta: 30g)</div><div style="font-weight:700">${d.fiber}g</div></div>
        <div class="bar"><i style="width:${Math.min((d.fiber/30)*100, 100)}%; background:var(--ok)"></i></div>
        <div class="alert-glicose" id="agyWalkAlert" style="display:none; background:var(--warn-soft); border-left:4px solid var(--warn); padding:12px; border-radius:8px; margin-top:12px;">
            <strong>Pico Glicêmico!</strong> Caminhe 10-15 min para regular.
            <button class="btn sm ghost" style="margin-top:10px" onclick="document.getElementById('agyWalkAlert').style.display='none'">Fiz a caminhada ✅</button>
        </div>
        <button class="btn solid full" style="margin-top:10px;" id="btnStdLunch">🍱 Meu Almoço Padrão (40g P / 10g F)</button>
      </div>
    `;
    vComer.appendChild(ext);

    document.getElementById("btnStdLunch").addEventListener("click", () => {
        d.meals.push({ t: Date.now(), n: "Almoço Padrão (Antigravity)", g: 0, k: 450, p: 40, m: "Almoço" });
        d.fiber += 10;
        save();
        rComer(); 
        setTimeout(() => {
           const alert = document.getElementById("agyWalkAlert");
           if(alert) alert.style.display = "block";
           if(window.haptic) haptic(50);
        }, 100);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const saveCardio = document.getElementById("saveCardioBtn");
  if(saveCardio) {
    saveCardio.addEventListener("click", () => {
        const d = DW(today());
        if(!d.cardios) d.cardios = [];
        d.cardios.push({
           min: num(document.getElementById("cardioMins").value),
           spd: num(document.getElementById("cardioSpd").value),
           inc: num(document.getElementById("cardioInc").value)
        });
        save();
        document.getElementById("cardioSheet").classList.remove("on");
        toast("Cardio Registrado!");
        rDeck();
    });
  }

  setTimeout(() => {
      if(new Date().getDay() === 1 && !sessionStorage.getItem("revSeen")) {
          sessionStorage.setItem("revSeen", "1");
          const rW = document.getElementById("revW");
          const rS = document.getElementById("revSug");
          if(rW) rW.innerText = "Semana " + weekNo() + "/8";
          if(weekNo() >= 8 && rS) rS.innerText = "Semana de Manutenção! Teste cargas máximas.";
          const sheet = document.getElementById("reviewSheet");
          if(sheet) sheet.classList.add("on");
      }
  }, 1000);
});


// Update Header Clock and Name
function updateTopHeader() {
  const now = new Date();
  const hr = now.getHours();
  let greet = "Boa noite";
  if (hr >= 5 && hr < 12) greet = "Bom dia";
  else if (hr >= 12 && hr < 18) greet = "Boa tarde";
  
  const greetingEl = document.getElementById("topGreeting");
  if(greetingEl) greetingEl.innerText = greet;
  
  const clockEl = document.getElementById("topClock");
  if(clockEl) clockEl.innerText = now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
  
  const nameEl = document.getElementById("topName");
  if(nameEl && typeof S !== 'undefined' && S.profile) {
     nameEl.innerText = S.profile.name || "Praticante";
  }
}
setInterval(updateTopHeader, 1000);
setTimeout(updateTopHeader, 200); // Initial call after state loads


// AURA CORE UPDATE LOGIC
function updateAuraCore() {
    const vDeck = document.getElementById("v-deck");
    if(!vDeck) return;
    
    let auraContainer = document.getElementById("aura-container");
    if(!auraContainer) {
        auraContainer = document.createElement("div");
        auraContainer.id = "aura-container";
        vDeck.insertBefore(auraContainer, vDeck.firstChild);
    }
    if(!document.getElementById("auraCoreEl")) {
        auraContainer.className = "aura-container";
        auraContainer.innerHTML = `
            <div class="aura-core" id="auraCoreEl"></div>
            <div class="aura-msg" id="auraMsgEl">O núcleo está ocioso. Vamos alimentar essa máquina?</div>
        `;
    }
    
    const d = typeof DW === 'function' ? DW(today()) : (S.days && S.days[today()] ? S.days[today()] : null);
    if(!d) return;

    // Calculate states
    const prot = d.meals ? d.meals.reduce((a, m) => a + (m.p || 0), 0) : 0;
    const water = d.water || 0;
    const hasCardio = d.cardios && d.cardios.length > 0;
    
    const core = document.getElementById("auraCoreEl");
    const msg = document.getElementById("auraMsgEl");
    
    if(prot >= 160 && hasCardio) {
        core.className = "aura-core overdrive";
        msg.innerText = "Overdrive ativado. Suas fibras e proteínas estão otimizadas.";
        msg.style.color = "var(--accent)";
    } else if (prot >= 40 || water > 1000) {
        core.className = "aura-core fed";
        msg.innerText = "O núcleo absorveu energia. Mantenha o fluxo de proteína e hidratação.";
        msg.style.color = "var(--text)";
    } else {
        core.className = "aura-core";
        msg.innerText = "Sua aura precisa fluir. Tome um copo grande de água agora.";
        msg.style.color = "var(--muted)";
    }
}

// Hook into rDeck
const agy_orig_rDeck = typeof orig_rDeck === 'function' ? orig_rDeck : rDeck;
rDeck = function() {
    if(typeof orig_rDeck === 'function' && orig_rDeck !== rDeck) {
       orig_rDeck();
    } else {
       agy_orig_rDeck();
    }
    
    // Inject Cardio Button if not exists
    const vDeck = document.getElementById("v-deck");
    if(vDeck && !document.getElementById("agy-deck-ext")) {
        const ext = document.createElement("div");
        ext.id = "agy-deck-ext";
        ext.innerHTML = `
          <div class="card" style="margin-top:10px;">
            <h3 class="h1" style="font-size:20px;">Cardio Detalhado</h3>
            <button class="btn solid full" onclick="document.getElementById('cardioSheet').classList.add('on')">
              <svg class="icon"><use href="#i-flame"/></svg> Registrar Cardio
            </button>
          </div>
        `;
        // Insert after aura
        vDeck.insertBefore(ext, vDeck.children[1] || vDeck.firstChild); 
    }
    
    updateAuraCore();
}


/* --- AURA CORE & NEXUS REST DAY PATCH --- */
const agy_orig_rTreino = typeof orig_rTreino === 'function' ? orig_rTreino : (typeof rTreino !== 'undefined' ? rTreino : function(){});
if (typeof rTreino !== 'undefined') {
    window.orig_rTreino = agy_orig_rTreino; // Keep a reference
    rTreino = function() {
        const k = today();
        const d = typeof DW === 'function' ? DW(k) : (S.days && S.days[k] ? S.days[k] : null);
        
        if (d && d.skipWk && !UI.pickDay) {
            const L = (typeof planLetter === 'function' ? planLetter(k) : null) || (typeof seqNext === 'function' ? seqNext() : "A");
            const pName = typeof PLAN !== 'undefined' && PLAN[L] ? PLAN[L].name : "";
            
            const vTreino = document.getElementById("v-treino");
            if (vTreino) {
                vTreino.innerHTML = `
                <section class="card" style="background:transparent;box-shadow:none;padding:0"><h2 class="h1">Treino</h2><p class="muted">Segunda a sexta às 5h, seguindo a sequência A a E.</p></section>
                <section class="card" style="text-align:center; padding: 40px 20px;">
                    <div style="font-size:50px; margin-bottom:15px; animation: aura-levitate 3s infinite;">🛡️</div>
                    <h3 class="mid" style="font-size: 22px; color: var(--text);">Tudo bem, o foco hoje é na dieta.</h3>
                    <p class="muted" style="margin-top: 10px; line-height: 1.5;">Você marcou que não conseguiu ir hoje. O seu treino <b style="color:var(--text);">${L} - ${pName}</b> está guardado para amanhã. A sua sequência não foi quebrada.</p>
                    <button class="btn ghost full" style="margin-top:25px; border: 1px solid var(--line);" data-act="wk-unskip">Desfazer (Vou treinar sim!)</button>
                </section>`;
            }
            return;
        }

        // Call original rendering
        orig_rTreino();
        
        // Inject the skip button if not already started and not picking a day
        if (!S.cur && !UI.pickDay) {
            const vTreino = document.getElementById("v-treino");
            if (vTreino) {
                const cards = vTreino.querySelectorAll("section.card");
                if (cards.length >= 2) {
                    const btnContainer = cards[1];
                    if (!btnContainer.querySelector('[data-act="wk-skip"]')) {
                       const skipBtn = document.createElement("button");
                       skipBtn.className = "btn ghost full";
                       skipBtn.style.marginTop = "12px";
                       skipBtn.style.color = "var(--muted)";
                       skipBtn.dataset.act = "wk-skip";
                       skipBtn.innerText = "Não consegui ir hoje";
                       btnContainer.appendChild(skipBtn);
                    }
                }
            }
        }
    }
}

document.addEventListener("click", e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const a = b.dataset.act;
    if (a === "wk-skip") {
        const d = typeof DW === 'function' ? DW(today()) : (S.days && S.days[today()] ? S.days[today()] : null);
        if(d) {
            d.skipWk = true;
            if(typeof save === 'function') save();
            rTreino();
        }
    } else if (a === "wk-unskip") {
        const d = typeof DW === 'function' ? DW(today()) : (S.days && S.days[today()] ? S.days[today()] : null);
        if(d) {
            d.skipWk = false;
            if(typeof save === 'function') save();
            rTreino();
        }
    }
});


/* === PROGRESSIVE DISCLOSURE DECK REDESIGN === */
function orig_rDeck() {
    const k = today(), d = typeof DW === 'function' ? DW(k) : D(k), L = typeof planLetter === 'function' ? planLetter(k) : null;
    const tg = typeof TG === 'function' ? TG() : {kcal:2000, prot:160};
    const tot = typeof dayTotals === 'function' ? dayTotals(k) : {k:0, p:0};
    const week = activeInWeek(mondayOf(k)), ds = dayStreak(), ws = weekStreak(), abs = daysAbsent();
    const ban = [];
    const ab = ABSENCE.find(a => abs >= a.min);
    if (ab) ban.push(banner("acc", "leaf", `${abs} dias sem registro`, ab.txt));
    if (S.cur) ban.push(banner("acc", "play", "Treino em andamento", `Você começou o treino ${S.cur.day}.`, '<div style="margin-top:8px"><button class="btn sm solid" data-act="wk-resume">Continuar treino</button></div>'));
    
    const waterL = (d.water / 1000).toFixed(1);
    const habitsList = HABITS.map(([id, t]) => `<button class="chk ${d.h[id] ? "on" : ""} ${id === "acucar" ? "key" : ""}" data-act="habit" data-id="${id}"><span class="box">${ic("check")}</span><span class="t">${t}</span></button>`).join("");
    const supList = SUPP_BASE.map(([id, n, s]) => `<button class="chk ${d.s[id] ? "on" : ""}" data-act="supp" data-id="${id}"><span class="box">${ic("check")}</span><span class="t">${n}</span></button>`).join("");

    $("#v-deck").innerHTML = `
    ${ban.length ? '<section style="display:flex;flex-direction:column;gap:10px;margin-bottom:15px;">' + ban.join("") + '</section>' : ""}
    
    <!-- Aura Core Anchor -->
    <div id="aura-container"></div>
    
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom: 20px;">
       <div class="card" style="padding:15px; text-align:center; cursor:pointer; background:var(--surface2);" data-go="agua">
          <div style="font-size:24px; margin-bottom:5px;">💧</div>
          <div style="font-weight:700; font-size:16px;">${waterL} L</div>
          <div class="lbl">Água · ${Math.round(Math.min(1, d.water / S.settings.waterGoal) * 100)}%</div>
       </div>
       <div class="card" style="padding:15px; text-align:center; cursor:pointer; background:var(--surface2);" data-go="comer">
          <div style="font-size:24px; margin-bottom:5px;">🍱</div>
          <div style="font-weight:700; font-size:16px;">${Math.round(tot.p)}g</div>
          <div class="lbl">+ Dieta</div>
       </div>
       <div class="card" style="padding:15px; text-align:center; cursor:pointer; background:var(--surface2);" data-go="treino">
          <div style="font-size:24px; margin-bottom:5px;">🏋️‍♂️</div>
          <div style="font-weight:700; font-size:16px;">${L || "Descanso"}</div>
          <div class="lbl">Treino Hoje</div>
       </div>
       <div class="card" style="padding:15px; text-align:center; cursor:pointer; background:var(--surface2);" onclick="document.getElementById('cardioSheet').classList.add('on')">
          <div style="font-size:24px; margin-bottom:5px;">🔥</div>
          <div style="font-weight:700; font-size:16px;">Cardio</div>
          <div class="lbl">Registrar</div>
       </div>
    </div>
    
    <details class="fold card" style="padding:0 14px; margin-bottom:10px;"><summary><span class="row"><span class="dot ok"></span><span class="lbl" style="font-size:15px; font-weight:600;">Hábitos Diários (${habitCount(k)}/6)</span></span>${ic("down")}</summary><div class="body" style="display:flex;flex-direction:column;gap:10px">${habitsList}</div></details>
    
    <details class="fold card" style="padding:0 14px; margin-bottom:10px;"><summary><span class="row"><span class="dot sage"></span><span class="lbl" style="font-size:15px; font-weight:600;">Suplementação (${Object.values(d.s).filter(Boolean).length}/${SUPP_BASE.length})</span></span>${ic("down")}</summary><div class="body">${supList}</div></details>
    
    <details class="fold card" style="padding:0 14px; margin-bottom:10px;"><summary><span class="row"><span class="dot" style="background:var(--accent)"></span><span class="lbl" style="font-size:15px; font-weight:600;">Ritmo Semanal (${week}/5)</span></span>${ic("down")}</summary><div class="body">
       <div class="row" style="gap:16px; margin-top:10px;">
          ${ring(week / 5, 80, 6, "var(--sage)", '<div><div class="big tabnum">' + week + '<span class="muted" style="font-size:12px">/5</span></div></div>')}
          <div class="grow" style="display:flex;flex-direction:column;gap:10px">
            <div class="tile row between"><div><div class="lbl">Sequência de dias</div><div class="mid tabnum">${ds}</div></div>${ic("flame")}</div>
            <div class="tile row between"><div><div class="lbl">Sequência de semanas</div><div class="mid tabnum">${ws}</div></div>${ic("trend")}</div>
          </div>
        </div>
    </div></details>
    `;
}

rDeck = function() {
    orig_rDeck();
    if(typeof updateAuraCore === 'function') updateAuraCore();
    fraseInject();
}


/* === METABOLIC ENGINE === */
function getMetabolicAdvice(k) {
    const d = typeof DW === 'function' ? DW(k) : D(k);
    const tg = typeof TG === 'function' ? TG() : {kcal:2000, prot:160};
    const tot = typeof dayTotals === 'function' ? dayTotals(k) : {k:0, p:0};
    
    const now = new Date();
    const h = now.getHours();
    const endOfDay = 22; // 22:00
    
    if (h >= endOfDay) return { diet: "Dia finalizado. Hora de descansar o sistema digestivo.", water: "Beba água com moderação agora para não prejudicar o sono." };
    if (h < 5) return { diet: "Madrugada. Se estiver acordado, mantenha-se hidratado.", water: "Beba água se tiver sede." };
    
    // 1. Diet Advice
    let dietAdvice = "";
    const remainingProt = Math.max(0, tg.prot - tot.p);
    let lastMealTime = null;
    
    if (d.meals && d.meals.length > 0) {
        for (let i = d.meals.length - 1; i >= 0; i--) {
            if (d.meals[i].t) {
                lastMealTime = new Date(d.meals[i].t);
                break;
            }
        }
    }
    
    const hoursLeft = endOfDay - h;
    const mealsLeft = Math.max(1, Math.floor(hoursLeft / 3.5)); // estimate 1 meal every 3.5 hours
    const protPerMeal = Math.round(remainingProt / mealsLeft);
    
    if (remainingProt <= 0) {
        dietAdvice = "✅ Meta de proteína batida! Se for comer mais tarde, priorize fibras e vegetais.";
    } else if (lastMealTime) {
        const diffHrs = (now - lastMealTime) / (1000 * 60 * 60);
        if (diffHrs < 2) {
            let nextH = Math.floor(lastMealTime.getHours() + 3.5);
            let nextM = Math.floor((lastMealTime.getHours() + 3.5 - nextH) * 60);
            let nextTimeStr = String(nextH).padStart(2, '0') + ":" + String(nextM).padStart(2, '0');
            dietAdvice = "⏳ Você comeu há pouco tempo. Próxima janela anabólica sugerida: " + nextTimeStr + ". Faltam " + Math.round(remainingProt) + "g no dia.";
        } else if (diffHrs >= 3.5) {
            dietAdvice = "🔥 Janela anabólica aberta! Faltam " + Math.round(remainingProt) + "g no dia. Tente bater " + protPerMeal + "g na próxima refeição.";
        } else {
            dietAdvice = "⏳ Faltam " + Math.round(remainingProt) + "g no dia. Sugestão para a próxima refeição: " + protPerMeal + "g de proteína.";
        }
    } else {
        dietAdvice = "🌅 Primeira refeição do dia? Faltam " + Math.round(remainingProt) + "g. Comece forte com " + protPerMeal + "g de proteína!";
    }
    
    // 2. Water Advice
    let waterAdvice = "";
    const goalWater = (S.settings.waterGoal || 3000);
    const remainingWater = Math.max(0, goalWater - d.water);
    if (remainingWater <= 0) {
        waterAdvice = "✅ Meta de hidratação batida!";
    } else {
        const mlPerHour = Math.round(remainingWater / hoursLeft);
        if (mlPerHour > 600) {
            waterAdvice = "⚠️ Você está desidratado para esse horário. Tome 500ml de água agora.";
        } else {
            waterAdvice = "💧 Ritmo ideal: tome aprox. " + mlPerHour + "ml de água por hora até as " + endOfDay + "h.";
        }
    }
    
    return { diet: dietAdvice, water: waterAdvice };
}

/* === OVERRIDE ORIG_RDECK TO INJECT METABOLIC ADVICE === */
const old_orig_rDeck_meta = orig_rDeck;
orig_rDeck = function() {
    old_orig_rDeck_meta();
    
    const k = today();
    const advice = getMetabolicAdvice(k);
    
    const vDeck = document.getElementById("v-deck");
    const auraContainer = document.getElementById("aura-container");
    if(vDeck && auraContainer) {
        const metaBanner = document.createElement("div");
        metaBanner.id = "meta-deck-banner";
        metaBanner.style.marginTop = "10px";
        metaBanner.style.marginBottom = "20px";
        metaBanner.style.padding = "12px 16px";
        metaBanner.style.borderRadius = "12px";
        metaBanner.style.background = "var(--surface2)";
        metaBanner.style.borderLeft = "4px solid var(--accent)";
        metaBanner.innerHTML = '<div style="font-size:14px; font-weight:600; margin-bottom:4px;">🧠 Dica do Núcleo</div><div style="font-size:14px; color:var(--muted); line-height:1.4;">' + advice.diet + ' <br><span style="color:var(--text);">' + advice.water + '</span></div>';
        
        // Insert right after aura container
        vDeck.insertBefore(metaBanner, auraContainer.nextSibling);
    }
}

/* === OVERRIDE ORIG_RCOMER TO INJECT METABOLIC ADVICE === */
const agy_orig_rComer_meta = orig_rComer;
orig_rComer = function() {
    agy_orig_rComer_meta();
    
    const k = today();
    const advice = getMetabolicAdvice(k);
    const vComer = document.getElementById("v-comer");
    if(vComer) {
        // Insert right after the header section
        const metaBanner = document.createElement("section");
        metaBanner.className = "card";
        metaBanner.style.background = "var(--surface2)";
        metaBanner.style.borderTop = "4px solid var(--ok)";
        metaBanner.innerHTML = '<h3 class="h1" style="font-size:18px; display:flex; align-items:center; gap:8px;">🧠 Inteligência Metabólica</h3><p class="muted" style="margin-top:8px;">' + advice.diet + '</p>';
        
        vComer.insertBefore(metaBanner, vComer.children[1]);
    }
}


/* === AURA IA CHAT === */
function rIA() {
    const vIA = document.getElementById("v-ia");
    if (!vIA) return;
    
    let msgsHTML = "";
    if (!S.chat || S.chat.length === 0) {
        msgsHTML = `<div style="text-align:center; padding:40px 20px;">
           <div style="font-size:48px; margin-bottom:15px; animation:aura-levitate 3s infinite;">✨</div>
           <h3 class="mid">Sou o seu assistente Aura</h3>
           <p class="muted" style="margin-top:10px;">Eu conheço a sua dieta, seus treinos e seu histórico. Me pergunte qualquer coisa, peça para eu montar seu prato ou tire foto de um rótulo.</p>
        </div>`;
    } else {
        msgsHTML = '<div class="chat-container">' + S.chat.map(m => `<div class="chat-msg ${m.role}">${esc(m.text || "").replace(/\n/g, "<br>")}${m.img ? `<div class="chat-msg img"><img src="data:image/jpeg;base64,${m.img}"></div>` : ""}</div>`).join("") + '<div id="ai-typing" style="display:none;" class="chat-msg ai typing">Pensando...</div></div>';
    }
    
    vIA.innerHTML = `
    <section class="card" style="background:transparent;box-shadow:none;padding:0;margin-bottom:10px;">
       <h2 class="h1">A.I. Pessoal</h2>
    </section>
    <div id="chat-messages" style="padding-bottom: 70px;">${msgsHTML}</div>
    
    <div class="chat-input-area">
       <button class="chat-btn" data-act="ia-cam"><svg class="icon"><use href="#i-camera"/></svg></button>
       <textarea class="field" id="ia-input" placeholder="Pergunte algo..." rows="1" style="resize:none; padding-top:12px;"></textarea>
       <button class="chat-btn primary" data-act="ia-send"><svg class="icon"><use href="#i-right"/></svg></button>
       <input type="file" id="ia-foto" accept="image/*" hidden>
    </div>
    `;
    
    // Auto-resize textarea
    setTimeout(() => {
        const inp = document.getElementById("ia-input");
        if(inp) {
            inp.addEventListener("input", function() {
                this.style.height = "auto";
                this.style.height = (this.scrollHeight) + "px";
            });
            inp.addEventListener("keypress", function(e) {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); document.querySelector('[data-act="ia-send"]').click(); }
            });
        }
        window.scrollTo(0, document.body.scrollHeight);
    }, 50);
}

// IA Context Builder
function buildAuraContext() {
    const k = today();
    const d = typeof DW === 'function' ? DW(k) : D(k);
    const tg = typeof TG === 'function' ? TG() : {kcal:2000, prot:160};
    const tot = typeof dayTotals === 'function' ? dayTotals(k) : {k:0, p:0};
    const L = typeof planLetter === 'function' ? planLetter(k) : "Descanso";
    
    return `Você é a Aura, um assistente de saúde premium, direto, objetivo e amigável, integrado ao aplicativo Still I Rise.
DADOS DO USUÁRIO HOJE:
- Nome: ${S.profile.name || "Usuário"}
- Meta de Calorias: ${Math.round(tot.k)} / ${tg.kcal} kcal
- Meta de Proteína: ${Math.round(tot.p)} / ${tg.prot} g
- Água: ${(d.water/1000).toFixed(1)} / ${(S.settings.waterGoal/1000).toFixed(1)} L
- Treino do Dia: ${L}
- Fibras Consumidas: ${d.fiber || 0}g
- Horário Atual: ${new Date().toLocaleTimeString()}

Regras:
1. Responda de forma extremamente concisa, sem enrolação. Use no máximo 2-3 parágrafos curtos.
2. Analise fotos de comida e sugira como encaixar na dieta restante do dia.
3. Se perguntarem se podem comer algo, avalie se os macros restantes permitem.
4. NUNCA diga que é uma IA. Aja como o núcleo inteligente do aplicativo. Mantenha um tom encorajador e prático.`;
}

// Ask Gemini
async function askAuraIA(text, file = null) {
    if (!S.settings.gemKey) {
        toast("Configure a sua chave do Gemini na aba Mais primeiro!");
        return;
    }
    
    let base64 = null;
    if (file) {
        if (typeof fotoDownscale === 'function') {
            base64 = await fotoDownscale(file);
        }
    }
    
    if (!S.chat) S.chat = [];
    S.chat.push({ role: 'user', text: text, img: base64 });
    rIA();
    
    const typing = document.getElementById("ai-typing");
    if(typing) typing.style.display = "block";
    window.scrollTo(0, document.body.scrollHeight);
    
    try {
        const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 30000);
        const parts = [{ text: text || "O que acha dessa foto para a minha dieta hoje?" }];
        if (base64) {
            parts.push({ inlineData: { mimeType: "image/jpeg", data: base64 } });
        }
        
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${S.settings.gemModel || "gemini-2.5-flash-lite"}:generateContent`, {
            method: "POST", signal: ctl.signal,
            headers: { "Content-Type": "application/json", "x-goog-api-key": S.settings.gemKey },
            body: JSON.stringify({ 
                systemInstruction: { parts: [{ text: buildAuraContext() }] },
                contents: [{ parts: parts }]
            })
        });
        clearTimeout(t);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ? j.error.message : "Erro na IA");
        
        const reply = j.candidates[0].content.parts[0].text;
        S.chat.push({ role: 'ai', text: reply });
        save();
        rIA();
    } catch(e) {
        S.chat.push({ role: 'ai', text: "Desculpe, ocorreu um erro na conexão: " + e.message });
        save();
        rIA();
    }
}

// Inject Event Listeners globally via an IIFE
(function() {
    document.addEventListener("click", e => {
        const b = e.target.closest("[data-act]");
        if (!b) return;
        const act = b.dataset.act;
        
        if (act === "ia-cam") {
            const f = document.getElementById("ia-foto");
            if (f) f.click();
        } else if (act === "ia-send") {
            const inp = document.getElementById("ia-input");
            const text = inp.value.trim();
            if (text) {
                inp.value = "";
                inp.style.height = "auto";
                askAuraIA(text);
            }
        }
    });
    
    document.addEventListener("change", e => {
        if (e.target.id === "ia-foto") {
            const file = e.target.files[0];
            e.target.value = ""; // reset
            if (file) {
                const inp = document.getElementById("ia-input");
                const text = inp ? inp.value.trim() : "";
                if(inp) { inp.value = ""; inp.style.height = "auto"; }
                askAuraIA(text, file);
            }
        }
    });
})();
