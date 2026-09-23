/* ============ APETITE: fome, vontade, perda de controle, gatilhos, sono e estresse → padrões ============ */
// S.hunger = [{ t, d, fome 0–10, vontade 0–10, perda, gat: [...], estresse 0–10 | null }] · D(dia).sleep = horas dormidas
const GATILHOS = ["Fome real", "Cansaço", "Estresse", "Tédio", "Ansiedade", "Social / festa", "Viu ou sentiu cheiro", "Pulei refeição", "Dormi mal", "Recompensa"];
function hungerLog(o) {
  const e = { t: Date.now(), d: today(), fome: clamp(Math.round(num(o.fome)), 0, 10), vontade: clamp(Math.round(num(o.vontade)), 0, 10), perda: !!o.perda, gat: (o.gat || []).filter(g => GATILHOS.includes(g)), estresse: o.estresse == null ? null : clamp(Math.round(num(o.estresse)), 0, 10) };
  S.hunger.push(e); save(); return e;
}
function sleepLog(h, k = today()) { if (!(h >= 0 && h <= 16)) return false; DW(k).sleep = r1(h); save(); return true; }
const hungerOn = k => S.hunger.filter(x => x.d === k);
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const hourOf = t => new Date(t).getHours();
// última refeição antes do registro de fome (horas)
function gapBefore(e) { const ts = D(e.d).meals.map(m => m.t).filter(t => t && t <= e.t); return ts.length ? (e.t - Math.max(...ts)) / 36e5 : null; }
// padrões calculados só com os seus registros; cada um exige um mínimo de dados e diz em quantos se baseou
function insightSleep() {
  const days = [...new Set(S.hunger.map(x => x.d))].map(k => ({ s: D(k).sleep, f: Math.max(-1, ...hungerOn(k).filter(x => hourOf(x.t) >= 18).map(x => x.fome)) })).filter(x => x.s != null && x.f >= 0);
  const lo = days.filter(x => x.s < 6).map(x => x.f), hi = days.filter(x => x.s >= 6).map(x => x.f);
  if (lo.length < 3 || hi.length < 3 || avg(lo) - avg(hi) < 1) return null;
  return `Nos ${lo.length} dias em que você dormiu menos de 6 h, sua fome à noite foi em média ${r1(avg(lo))}, contra ${r1(avg(hi))} nos ${hi.length} dias com 6 h ou mais.`;
}
function insightStress() {
  const s = S.hunger.filter(x => x.estresse != null), hi = s.filter(x => x.estresse >= 6).map(x => x.vontade), lo = s.filter(x => x.estresse < 6).map(x => x.vontade);
  if (hi.length < 4 || lo.length < 4 || avg(hi) - avg(lo) < 1.5) return null;
  return `Com estresse alto (6+), sua vontade de comer foi em média ${r1(avg(hi))}; com estresse menor, ${r1(avg(lo))} (${hi.length + lo.length} registros).`;
}
function insightGap() {
  const g = S.hunger.map(x => [gapBefore(x), x.fome]).filter(x => x[0] != null), long = g.filter(x => x[0] >= 4).map(x => x[1]), short = g.filter(x => x[0] < 4).map(x => x[1]);
  if (long.length < 4 || short.length < 4 || avg(long) - avg(short) < 1.5) return null;
  return `Quando passam 4 h ou mais desde a última refeição, sua fome chega em média a ${r1(avg(long))}, contra ${r1(avg(short))} com intervalos menores (${g.length} registros).`;
}
function insightTrigger() {
  const ep = S.hunger.filter(x => x.perda); if (ep.length < 2) return null;
  const c = {}; ep.forEach(x => x.gat.forEach(g => c[g] = (c[g] || 0) + 1));
  const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] >= 2 ? `Em ${top[1]} dos ${ep.length} episódios de perda de controle, o gatilho marcado foi "${top[0]}".` : null;
}
function insightHour() {
  if (S.hunger.length < 8) return null;
  const b = {}; S.hunger.forEach(x => { const h = Math.floor(hourOf(x.t) / 3) * 3; (b[h] = b[h] || []).push(x.fome); });
  const top = Object.entries(b).filter(([, a]) => a.length >= 3).sort((x, y) => avg(y[1]) - avg(x[1]))[0];
  return top ? `Sua fome costuma ser maior entre ${pad(+top[0])}h e ${pad(+top[0] + 3)}h (média ${r1(avg(top[1]))}, ${top[1].length} registros).` : null;
}
const hungerInsights = () => [insightSleep(), insightStress(), insightGap(), insightTrigger(), insightHour()].filter(Boolean);
