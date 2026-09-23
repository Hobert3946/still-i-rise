/* ============ SESSÃO DE TREINO (dados; a tela fica em ui/arena.js) ============ */
// S.cur = { day, date, i (etapa atual), mode ("set" = 1 toque por série | "end" = registrar ao final), data: { slotId: { vid, sets, hint, ghost } } }
const stepsOf = L => { const st = []; if (PLAN[L].cuff) CUFF.forEach(c => st.push({ t: "warm", c })); PLAN[L].ex.forEach(e => st.push({ t: "ex", e })); return st; };
const curStep = () => stepsOf(S.cur.day)[S.cur.i];
function wkData(step) {
  const c = S.cur;
  if (step.t === "warm") { c.data[step.c.id] = c.data[step.c.id] || { sets: Array.from({ length: step.c.sets }, () => ({ done: false })) }; return c.data[step.c.id]; }
  const slot = step.e; let dd = c.data[slot.id];
  if (!dd) { const vid = varId(slot), pf = prefill(slot, vid); dd = c.data[slot.id] = { vid, sets: pf.sets, hint: pf.hint, ghost: pf.ghost }; }
  return dd;
}
function wkBegin(L) { S.cur = { day: L, date: today(), i: 0, mode: S.settings.logMode, data: {} }; save(); }
// ajusta kg ou reps da série indicada e das pendentes seguintes (a carga costuma se repetir)
function wkAdjust(dd, i, f, d) {
  for (let j = i; j < dd.sets.length; j++) if (j === i || !dd.sets[j].done) dd.sets[j][f] = Math.max(0, r1(num(dd.sets[j][f]) + d));
}
// grava os exercícios com séries feitas, calcula a próxima carga e marca o hábito ligado ao treino
function wkCommit() {
  const c = S.cur, rows = [];
  PLAN[c.day].ex.forEach(slot => {
    const d = c.data[slot.id]; if (!d) return;
    const sets = d.sets.filter(s => s.done).map(s => ({ kg: num(s.kg), reps: num(s.reps) })); if (!sets.length) return;
    const nx = nextLoad(slot, sets);
    (S.logs[d.vid] = S.logs[d.vid] || []).push({ date: c.date, day: c.day, sets });
    rows.push({ slot, vid: d.vid, nx, stag: stagnant(slot, d.vid) });
  });
  const dd = DW(c.date); dd.wk = c.day; setLinked(c.date, "treino", true);
  S.cur = null; save();
  return rows;
}
// dor no ombro (0–10) registrada depois dos treinos A, D e E
const PAIN_DAYS = ["A", "D", "E"];
function painLog(v, L) { S.pain.push({ d: today(), day: L || (S.days[today()] || {}).wk || "", v }); save(); return painAvg(); }
function cardioAdd(min, spd, inc, k = today()) {
  if (!(min > 0)) return false;
  const d = DW(k); d.cardios = d.cardios || []; d.cardios.push({ min, spd: spd || 0, inc: inc || 0 }); save(); return true;
}
const cardioMin = k => (D(k).cardios || []).reduce((a, c) => a + (c.min || 0), 0);
