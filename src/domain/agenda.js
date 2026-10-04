/* ============ AGENDA: rotina ≠ horário fixo ============ */
// item = { id, type, ref, title, days:[0..6] (recorrente) | date:"AAAA-MM-DD" (evento único), at:"HH:MM" ("" = flexível), period, dur,
//          from, until (primeiro e último dia na rotina), hist: [{ until, days, at, period, dur }] (como era até aquele dia) }
// type: treino | refeicao | remedio | suplemento | habito | atividade | consulta
// S.sched.ov[dia][id] = exceções só daquele dia: { at, dur, period, skip, done }
// Mudar "sempre" vale do dia escolhido em diante: o que valia antes vira histórico, com o mesmo id. Assim os dias
// passados (e as doses registradas neles, que apontam para o id) continuam como eram.
const TYPES = {
  treino: ["Treino", "dumb"], refeicao: ["Refeição", "fork"], remedio: ["Remédio", "pill"], suplemento: ["Suplemento", "leaf"],
  habito: ["Hábito", "check"], atividade: ["Atividade", "flame"], consulta: ["Consulta", "user"]
};
const PERIODS = { "": "Qualquer hora", manha: "Manhã", tarde: "Tarde", noite: "Noite" };
const PERIOD_MIN = { "": 12 * 60, manha: 9 * 60, tarde: 15 * 60, noite: 20 * 60 };
const EVERY = [0, 1, 2, 3, 4, 5, 6], WEEKDAYS = [1, 2, 3, 4, 5];
const schedItem = (type, ref, title, o = {}) => Object.assign({ id: uid("a"), type, ref: ref || "", title, days: EVERY.slice(), date: "", at: "", period: "", dur: 15 }, o);
// rotina inicial a partir do perfil (usada na migração e em perfis novos)
function defaultSched(p) {
  const hb = id => p.habits.find(h => h.id === id), it = [];
  it.push(schedItem("treino", "", "Treino", { days: WEEKDAYS.slice(), at: (hb("treino") || {}).at || "05:00", dur: 60 }));
  MEAL_NAMES.forEach(m => it.push(schedItem("refeicao", m, m, { at: MEAL_AT[m], dur: 30 })));
  p.supps.forEach(s => it.push(schedItem("suplemento", s.id, s.n, { at: s.at || "", period: s.at ? "" : "manha", dur: 5 })));
  (p.meds || []).forEach(m => (m.times || []).forEach(t => it.push(schedItem("remedio", m.id, m.n, { at: t, dur: 5 }))));
  p.habits.filter(h => h.at && h.link !== "treino").forEach(h => it.push(h.id === "caminhada"
    ? schedItem("habito", h.id, h.t, { period: "noite", dur: 30 }) : schedItem("habito", h.id, h.t, { at: h.at, dur: 15 })));
  return { items: it, ov: {} };
}
const ovOf = (k, id) => ((S.sched.ov[k] || {})[id]) || {};
function setOv(k, id, patch) { const d = S.sched.ov[k] = S.sched.ov[k] || {}; d[id] = Object.assign(d[id] || {}, patch); save(); }
const SCHED_F = ["days", "at", "period", "dur"];
const defOn = (it, k) => { const h = (it.hist || []).find(x => k <= x.until); return h ? Object.assign({}, it, h) : it; };
const live = (it, k = today()) => !it.until || it.until >= k;
const occurs = (it, k) => it.date ? it.date === k : (!it.from || k >= it.from) && (!it.until || k <= it.until) && defOn(it, k).days.includes(parseKey(k).getDay());
// feito? cada tipo olha o registro real do dia (refeição registrada, dose tomada, hábito marcado...)
function instDone(it, k, o) {
  const d = D(k);
  if (o.done) return true;
  if (it.type === "refeicao") return mealItems(it.ref, k).length > 0;
  if (it.type === "treino") return !!d.wk;
  if (it.type === "remedio") return !!(d.med && d.med[it.id]);
  if (it.type === "suplemento") return !!d.s[it.ref];
  if (it.type === "habito") return !!d.h[it.ref];
  return false;
}
function instances(k = dayK()) {
  return S.sched.items.filter(it => occurs(it, k)).map(item => {
    const it = defOn(item, k), o = ovOf(k, it.id), at = o.at != null ? o.at : it.at, period = o.period != null ? o.period : it.period;
    const skip = !!o.skip || (it.type === "treino" && !!D(k).skipWk);
    return { id: it.id, it, k, at, period, dur: o.dur || it.dur, skip, done: instDone(it, k, o), min: at ? toMin(at) : PERIOD_MIN[period], flex: !at, moved: o.at != null && o.at !== it.at };
  }).sort((a, b) => a.min - b.min);
}
const hasTrainItem = k => instances(k).some(x => x.it.type === "treino");
// muda a rotina do dia k em diante; o que valia na véspera vira histórico
function schedChange(it, k, patch) {
  const prev = addDays(k, -1), cur = defOn(it, prev), hs = it.hist || [], cp = v => Array.isArray(v) ? v.slice() : v;
  const changes = SCHED_F.some(f => f in patch && JSON.stringify(patch[f]) !== JSON.stringify(cur[f]));
  if (changes && (!it.from || it.from <= prev) && !hs.some(h => h.until === prev)) {
    const snap = { until: prev }; SCHED_F.forEach(f => snap[f] = cp(cur[f]));
    hs.push(snap); hs.sort((a, b) => a.until < b.until ? -1 : 1);
  }
  hs.filter(h => h.until >= k).forEach(h => SCHED_F.forEach(f => { if (f in patch) h[f] = cp(patch[f]); }));
  Object.assign(it, patch); if (hs.length) it.hist = hs;
}
// editar: "só neste dia" vira exceção do dia; "sempre" muda a rotina a partir do dia k
function schedEdit(k, id, patch, always) {
  const it = S.sched.items.find(x => x.id === id); if (!it) return;
  if (always || it.date) { if (it.date) Object.assign(it, patch); else schedChange(it, k, patch); if (S.sched.ov[k] && S.sched.ov[k][id]) ["at", "dur", "period"].forEach(f => { if (f in patch) delete S.sched.ov[k][id][f]; }); save(); }
  else setOv(k, id, patch);
}
function schedSkip(k, id, v = true) {
  const it = S.sched.items.find(x => x.id === id); if (!it) return;
  setOv(k, id, { skip: v }); if (it.type === "treino") { DW(k).skipWk = v; save(); }
}
function schedDone(k, id, v = true) { setOv(k, id, { done: v }); }
// item recorrente novo começa hoje (ou no dia informado em o.from): não aparece nos dias passados
function schedAdd(o) { const it = schedItem(o.type || "atividade", o.ref, o.title, o.date ? o : Object.assign({ from: today() }, o)); S.sched.items.push(it); save(); return it; }
// excluir: evento único some; recorrente pode sair só neste dia (pular) ou da rotina do dia k em diante
function schedRemove(k, id, always) {
  const i = S.sched.items.findIndex(x => x.id === id); if (i < 0) return;
  const it = S.sched.items[i];
  if (!always && !it.date) return schedSkip(k, id, true);
  if (it.date || (it.from && it.from >= k)) S.sched.items.splice(i, 1); else it.until = addDays(k, -1);
  save();
}
function schedDuplicate(k, id) {
  const it = S.sched.items.find(x => x.id === id); if (!it) return null;
  const d = defOn(it, k), o = ovOf(k, id), c = Object.assign({}, d, { days: [], date: k, at: o.at != null ? o.at : d.at });
  ["id", "hist", "from", "until"].forEach(f => delete c[f]);
  return schedAdd(c);
}
function schedReschedule(k, id, toDay, at) { schedSkip(k, id, true); const c = schedDuplicate(k, id); if (c) { c.date = toDay; c.at = at; save(); } return c; }
const nextInst = (k = today(), from = nowMin()) => instances(k).filter(x => !x.done && !x.skip && x.min >= from - 30);
