/* ============ AGENDA: rotina ≠ horário fixo ============ */
// item = { id, type, ref, title, days:[0..6] (recorrente) | date:"AAAA-MM-DD" (evento único), at:"HH:MM" ("" = flexível), period, dur }
// type: treino | refeicao | remedio | suplemento | habito | atividade | consulta
// S.sched.ov[dia][id] = exceções só daquele dia: { at, dur, period, skip, done }
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
const occurs = (it, k) => it.date ? it.date === k : it.days.includes(parseKey(k).getDay()) && (!it.from || k >= it.from) && (!it.until || k <= it.until);
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
  return S.sched.items.filter(it => occurs(it, k)).map(it => {
    const o = ovOf(k, it.id), at = o.at != null ? o.at : it.at, period = o.period != null ? o.period : it.period;
    const skip = !!o.skip || (it.type === "treino" && !!D(k).skipWk);
    return { id: it.id, it, k, at, period, dur: o.dur || it.dur, skip, done: instDone(it, k, o), min: at ? toMin(at) : PERIOD_MIN[period], flex: !at, moved: o.at != null && o.at !== it.at };
  }).sort((a, b) => a.min - b.min);
}
const hasTrainItem = k => instances(k).some(x => x.it.type === "treino");
// editar: "só hoje" vira exceção do dia; "sempre" muda a rotina (a partir de hoje)
function schedEdit(k, id, patch, always) {
  const it = S.sched.items.find(x => x.id === id); if (!it) return;
  if (always || it.date) { Object.assign(it, patch); if (S.sched.ov[k] && S.sched.ov[k][id]) ["at", "dur", "period"].forEach(f => { if (f in patch) delete S.sched.ov[k][id][f]; }); save(); }
  else setOv(k, id, patch);
}
function schedSkip(k, id, v = true) {
  const it = S.sched.items.find(x => x.id === id); if (!it) return;
  setOv(k, id, { skip: v }); if (it.type === "treino") { DW(k).skipWk = v; save(); }
}
function schedDone(k, id, v = true) { setOv(k, id, { done: v }); }
function schedAdd(o) { const it = schedItem(o.type || "atividade", o.ref, o.title, o); S.sched.items.push(it); save(); return it; }
// excluir: evento único some; recorrente pode sair só hoje (pular) ou da rotina
function schedRemove(k, id, always) {
  const i = S.sched.items.findIndex(x => x.id === id); if (i < 0) return;
  if (always || S.sched.items[i].date) { S.sched.items.splice(i, 1); save(); } else schedSkip(k, id, true);
}
function schedDuplicate(k, id) {
  const it = S.sched.items.find(x => x.id === id); if (!it) return null;
  const o = ovOf(k, id), c = Object.assign({}, it, { days: [], date: k, at: o.at != null ? o.at : it.at }); delete c.id;
  return schedAdd(c);
}
function schedReschedule(k, id, toDay, at) { schedSkip(k, id, true); const c = schedDuplicate(k, id); if (c) { c.date = toDay; c.at = at; save(); } return c; }
const nextInst = (k = today(), from = nowMin()) => instances(k).filter(x => !x.done && !x.skip && x.min >= from - 30);
