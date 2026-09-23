/* ============ REGRAS: dia, hábitos, sequências, ausência e metas (Mifflin-St Jeor) ============ */
const newDay = () => ({ h: {}, s: {}, water: 0, meals: [] });
const D = k => S.days[k] || newDay();
function DW(k) { if (!S.days[k]) S.days[k] = newDay(); return S.days[k]; }
const hasData = d => d && (Object.values(d.h || {}).some(Boolean) || Object.values(d.s || {}).some(Boolean) || d.water > 0 || (d.meals || []).length);
const habitCount = k => { const h = D(k).h; return S.habits.filter(x => h[x.id]).length; };
const habitByLink = l => S.habits.find(h => h.link === l);
function setLinked(k, link, v) { const h = habitByLink(link); if (h) DW(k).h[h.id] = v; }
// dia ativo = Regra nº 1 marcada + pelo menos N outros hábitos (N configurável, padrão 2)
function isActive(k) {
  const h = D(k).h, r = S.settings.rule1;
  const others = S.habits.filter(x => x.id !== r && h[x.id]).length;
  return !!h[r] && others >= S.settings.needOthers;
}
const firstDay = () => { const ks = Object.keys(S.days).filter(k => hasData(S.days[k])); ks.push(S.settings.start); return ks.sort()[0]; };
function dayStreak() { let k = today(); if (!isActive(k)) k = addDays(k, -1); let n = 0; const f = firstDay(); while (k >= f && isActive(k)) { n++; k = addDays(k, -1); } return n; }
const activeInWeek = mk => { let n = 0; for (let i = 0; i < 7; i++) if (isActive(addDays(mk, i))) n++; return n; };
// semana verde = 5+ dias ativos; amarela (4) não quebra; só 2 semanas ruins seguidas zeram
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
  if (S.cur) return 0;
  const ks = Object.keys(S.days).filter(k => hasData(S.days[k])).concat(S.weights.map(w => w.d));
  Object.values(S.logs).forEach(a => a.forEach(l => ks.push(l.date)));
  if (!ks.length) return 0;
  ks.sort(); return Math.max(0, diffDays(today(), ks[ks.length - 1]));
}
const weekNo = () => Math.floor(diffDays(mondayOf(today()), mondayOf(S.settings.start)) / 7) + 1;
const inAdapt = () => weekNo() <= 2;

/* ---- metas nutricionais: TMB = 10×peso + 6,25×altura − 5×idade + 5; gasto = TMB × fator; meta = gasto − déficit (piso) ---- */
const curWeight = () => S.weights.length ? S.weights[S.weights.length - 1].kg : S.profile.startWeight;
function targets(w) {
  const p = S.profile, s = S.settings;
  const tmb = 10 * w + 6.25 * p.height - 5 * p.age + 5;
  const tdee = tmb * s.activity;
  const kcal = Math.max(s.floor, Math.round((tdee - s.deficit) / 50) * 50);
  return { tmb: Math.round(tmb), tdee: Math.round(tdee), kcal, prot: Math.round(1.2 * w / 5) * 5 };
}
const TG = () => targets(S.settings.calcWeight);
const dayTotals = k => D(k).meals.reduce((a, m) => ({ k: a.k + m.k, p: a.p + m.p }), { k: 0, p: 0 });
// recalcula as metas a cada 4 kg de variação em relação ao peso usado no cálculo
function recalcIfNeeded(kg) {
  if (Math.abs(kg - S.settings.calcWeight) < 4) return false;
  S.settings.calcWeight = r1(kg); return true;
}
