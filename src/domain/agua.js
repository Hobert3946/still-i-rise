/* ============ ÁGUA: registro, ritmo por hora (6h–21h), sequência na meta ============ */
const WSIZES = [["Gole", 100], ["Copo", 200], ["Copo grande", 300], ["Garrafa", 500], ["Squeeze", 750], ["1 litro", 1000]];
const W_FROM = 6, W_TO = 21;
function waterAdd(ml, k = today()) {
  const d = DW(k), goal = S.settings.waterGoal, before = d.water || 0;
  d.wlog = d.wlog || [];
  if (ml > 0) d.wlog.push({ t: k === today() ? hhmm(new Date()) : "—", ml });
  d.water = Math.max(0, before + ml);
  setLinked(k, "agua", d.water >= goal); save(); haptic(ml > 0 ? 12 : 8);
  return before < goal && d.water >= goal;
}
function waterUndo(k = today()) {
  const d = DW(k); d.wlog = d.wlog || [];
  const last = d.wlog.pop(); d.water = Math.max(0, (d.water || 0) - (last ? last.ml : 250));
  setLinked(k, "agua", d.water >= S.settings.waterGoal); save();
  return last;
}
function waterGoalAdj(delta) {
  S.settings.waterGoal = clamp(S.settings.waterGoal + delta, 1000, 8000);
  const d = DW(today()); setLinked(today(), "agua", (d.water || 0) >= S.settings.waterGoal); save();
}
function waterStreak() {
  let n = 0, k = today(); if ((D(k).water || 0) < S.settings.waterGoal) k = addDays(k, -1);
  while ((D(k).water || 0) >= S.settings.waterGoal) { n++; k = addDays(k, -1); }
  return n;
}
// quanto deveria ter bebido até a hora h (linear das 6h às 21h, arredondado a 50 ml)
const waterExpected = h => Math.round(S.settings.waterGoal * clamp((h - W_FROM) / (W_TO - W_FROM), 0, 1) / 50) * 50;
// hora do dia em que o volume bebido "estaria no ritmo" (usada para desenhar a maré no rio)
const waterHourFor = ml => W_FROM + (W_TO - W_FROM) * clamp(ml / S.settings.waterGoal, 0, 1);
function waterPace(w) {
  const now = new Date(), h = now.getHours() + now.getMinutes() / 60, goal = S.settings.waterGoal;
  const exp = waterExpected(h), diff = w - exp;
  if (w >= goal) return ["ok", "Meta batida. Agora é só beber quando sentir sede.", exp];
  if (h < W_FROM) return ["acc", "Comece o dia com um copo grande ao acordar.", exp];
  if (diff >= 0) return ["ok", `No ritmo: ${diff ? "+" + diff + " ml à frente" : "exatamente no alvo"} (esperado até agora: ${exp} ml).`, exp];
  return [diff < -700 ? "warn" : "acc", `${-diff} ml atrás do ritmo. Um copo agora resolve (esperado até agora: ${exp} ml).`, exp];
}
const waterWeek = () => { const mon = mondayOf(today()); return Array.from({ length: 7 }, (_, i) => { const k = addDays(mon, i); return { k, v: D(k).water || 0 }; }); };
const waterAvg7 = () => Math.round(Array.from({ length: 7 }, (_, i) => D(addDays(today(), -i)).water || 0).reduce((a, b) => a + b, 0) / 7);
