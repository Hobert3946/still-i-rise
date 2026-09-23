/* ============ COMIDA: registrar, favoritos por refeição, repetir, fibras, busca ============ */
// FOODS: [nome, kcal/100g, prot/100g, medida caseira, gramas da porção, categoria, fonte]
const foodIdx = n => FOODS.findIndex(f => f[0] === n);
const isSugarDrink = f => f[5] === "Bebidas" && /COM açúcar/.test(f[0]);
const favsOf = m => (S.favs && S.favs[m]) || [];
function favToggle(i, m) {
  S.favs = S.favs || {}; const a = S.favs[m] = S.favs[m] || [], n = FOODS[i][0], j = a.indexOf(n);
  if (j < 0) a.push(n); else a.splice(j, 1); save();
  return j < 0;
}
// bebida com açúcar quebra a Regra nº 1 do dia (desmarca o hábito ligado a "acucar")
function foodAdd(i, g, m, k = today()) {
  const f = FOODS[i]; if (!f || !(g > 0)) return null;
  const d = DW(k), it = { t: Date.now(), n: f[0], g, k: f[1] * g / 100, p: f[2] * g / 100, m };
  d.meals.push(it);
  if (isSugarDrink(f)) setLinked(k, "acucar", false);
  save(); return it;
}
// toques seguidos na mesma tecla (até 5 s) somam mais uma porção no mesmo item
function foodTap(i, m, k = today()) {
  const f = FOODS[i], d = DW(k), last = d.meals[d.meals.length - 1];
  if (last && last.n === f[0] && last.m === m && Date.now() - last.t < 5000 && last.g) {
    last.g += f[4]; last.k = f[1] * last.g / 100; last.p = f[2] * last.g / 100; last.t = Date.now(); save(); return last;
  }
  return foodAdd(i, f[4], m, k);
}
function labelAdd(n, kcal, p, m, k = today()) {
  if (!(kcal > 0)) return null;
  const it = { t: Date.now(), n: n || "Item de rótulo", g: 0, k: kcal, p: p || 0, m }; DW(k).meals.push(it); save(); return it;
}
const mealItems = (m, k) => D(k).meals.map((x, i) => [x, i]).filter(([x]) => x.m === m);
const sumItems = it => it.reduce((a, [x]) => ({ k: a.k + x.k, p: a.p + x.p }), { k: 0, p: 0 });
// repetir a mesma refeição da última vez em que ela foi registrada
function lastMealItems(m, k = today()) {
  for (const dk of Object.keys(S.days).sort().reverse()) { if (dk >= k) continue; const it = (S.days[dk].meals || []).filter(x => x.m === m); if (it.length) return it; }
  return [];
}
function mealRepeat(m, k = today()) { const it = lastMealItems(m, k), d = DW(k); it.forEach(x => d.meals.push({ ...x, m, t: Date.now() })); save(); return it.length; }
function mealRemove(i, k = today()) { const it = DW(k).meals.splice(i, 1)[0]; save(); return it; }
function mealRestore(i, it, k = today()) { DW(k).meals.splice(i, 0, it); save(); }
function fiberAdd(g, k = today()) { const d = DW(k); d.fiber = Math.max(0, (d.fiber || 0) + g); save(); return d.fiber; }
const FIBER_GOAL = 30;
// busca sem acento; nomes que começam com o termo vêm primeiro
function foodSearch(q, n = 40) {
  const nq = normTxt(q.trim()); if (!nq) return [];
  const words = nq.split(/\s+/);
  return FOODS.map((f, i) => [f, i, normTxt(f[0])]).filter(([, , t]) => words.every(w => t.includes(w)))
    .sort((a, b) => (b[2].startsWith(words[0]) - a[2].startsWith(words[0])) || a[2].length - b[2].length).slice(0, n).map(x => x[1]);
}
function recentFoods(n = 8) {
  const seen = new Set(), out = [];
  Object.keys(S.days).sort().reverse().slice(0, 30).forEach(k => D(k).meals.slice().reverse().forEach(m => { if (!seen.has(m.n) && out.length < n) { seen.add(m.n); out.push(m); } }));
  return out;
}
// refeição pelo horário (para registros rápidos pela paleta)
function mealByTime(min = nowMin()) {
  if (min < toMin("10:30")) return "Café da manhã";
  if (min < toMin("14:30")) return "Almoço";
  if (min < toMin("18:00")) return "Lanche";
  if (min < toMin("21:00")) return "Jantar";
  return "Ceia";
}
