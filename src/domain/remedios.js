/* ============ MEDICAMENTOS: prescrição informada pelo usuário, doses registradas com horário, adesão ============ */
// S.meds = [{ id, n, dose, withMeal, doctor, start, notes }] · horários = itens "remedio" da agenda (ref = id)
// dose tomada: D(dia).med[idDoItemDaAgenda] = "HH:MM"
const medById = id => (S.meds || []).find(m => m.id === id);
const medItems = id => S.sched.items.filter(x => x.type === "remedio" && x.ref === id);
const medTimes = id => medItems(id).map(x => x.at).filter(Boolean).sort();
function medSave(o, times) {
  if (!o.id) delete o.id;
  let m = o.id && medById(o.id);
  if (m) Object.assign(m, o); else { m = Object.assign({ id: uid("m"), start: today() }, o); S.meds.push(m); }
  // horários: mantém os itens que continuam, cria os novos, remove os que saíram
  const keep = medItems(m.id);
  keep.filter(x => !times.includes(x.at)).forEach(x => S.sched.items.splice(S.sched.items.indexOf(x), 1));
  times.filter(t => !keep.some(x => x.at === t)).forEach(t => S.sched.items.push(schedItem("remedio", m.id, m.n, { at: t, dur: 5 })));
  medItems(m.id).forEach(x => x.title = m.n);
  save(); return m;
}
function medRemove(id) { S.meds = S.meds.filter(m => m.id !== id); S.sched.items = S.sched.items.filter(x => !(x.type === "remedio" && x.ref === id)); save(); }
function doseLog(k, itemId, t = hhmm(new Date())) { const d = DW(k); d.med = d.med || {}; d.med[itemId] = t; save(); }
function doseUndo(k, itemId) { const d = DW(k); if (d.med) delete d.med[itemId]; save(); }
// doses de hoje de um remédio: [{ inst, taken }]
const medToday = (id, k = today()) => instances(k).filter(x => x.it.type === "remedio" && x.it.ref === id && !x.skip).map(x => ({ inst: x, taken: (D(k).med || {})[x.id] || "" }));
// adesão: doses registradas / doses previstas nos últimos N dias em que o app foi usado (dias pulados não contam)
function adherence(id, n = 30) {
  let due = 0, ok = 0;
  for (let i = 0; i < n; i++) {
    const k = addDays(today(), -i), start = (medById(id) || {}).start;
    if (start && k < start) break;
    if (i > 0 && !hasData(S.days[k])) continue;
    medToday(id, k).forEach(x => { if (i === 0 && x.inst.min > nowMin()) return; due++; if (x.taken) ok++; });
  }
  return { due, ok, pct: due ? Math.round(ok / due * 100) : null };
}
// doses que já passaram do horário hoje e não foram registradas
const dosesLate = (k = today()) => (S.meds || []).flatMap(m => medToday(m.id, k)).filter(x => !x.taken && x.inst.min <= nowMin());
/* ---- perguntas para a próxima consulta ---- */
function questionAdd(text, src = "") { if (!text.trim()) return null; const q = { id: uid("q"), text: text.trim().slice(0, 240), src, done: false, d: today() }; S.questions.push(q); save(); return q; }
const questionsOpen = () => S.questions.filter(q => !q.done);
