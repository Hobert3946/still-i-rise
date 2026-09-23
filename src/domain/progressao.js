/* ============ PROGRESSÃO AUTOMÁTICA (carga, variações e sequência A a E) ============ */
// Regra aplicada ao fim de cada treino, por exercício:
//  - fechou todas as repetições do topo da faixa em todas as séries: sobe um degrau (fora da adaptação)
//  - falhou na 1ª série ou em 2+ séries abaixo do mínimo da faixa: desce um degrau
//  - senão: mantém e busca o topo da faixa
function nextLoad(slot, sets, adapt = inAdapt()) {
  const kg = sets[0] ? sets[0].kg : 0, inc = slot.inc || 0;
  const top = sets.length >= slot.sets && sets.every(s => s.reps >= slot.reps[1]);
  const low = sets.filter(s => s.reps < slot.reps[0]).length;
  const fail = sets.length && (sets[0].reps < slot.reps[0] || low >= 2);
  if (top && inc && !adapt) return { dir: "up", kg: r1(kg + inc), inc, why: "Fechou todas as repetições." };
  if (fail && inc && kg > 0) return { dir: "down", kg: r1(Math.max(0, kg - inc)), inc, why: "Não fechou as repetições." };
  return { dir: "hold", kg, inc: 0, why: top && adapt ? "Adaptação: sem subir ainda." : `Busque ${slot.reps[1]} ${slot.unit ? "s" : "reps"} em todas as séries.` };
}
function stagnant(slot, vid) {
  if (inAdapt()) return null;
  const h = S.logs[vid] || []; if (h.length < 3 || slot.v.length < 2) return null;
  const l = h.slice(-3), same = l.every(x => x.sets[0].kg === l[0].sets[0].kg);
  const anyTop = l.some(x => x.sets.length >= slot.sets && x.sets.every(s => s.reps >= slot.reps[1]));
  if (!same || anyTop) return null;
  const i = slot.v.findIndex(x => x[0] === vid);
  return slot.v[(i + 1) % slot.v.length][1].replace(/ \(.*\)/, "");
}
function lastSession() {
  let best = null;
  Object.values(S.logs).forEach(a => a.forEach(l => { if (l.day && (!best || l.date > best.date)) best = l; }));
  return best;
}
// a sequência não quebra: se faltar um dia, o próximo treino continua de onde parou
function seqNext() { const l = lastSession(); return l ? DAY_ORDER[(DAY_ORDER.indexOf(l.day) + 1) % DAY_ORDER.length] : "A"; }
function planLetter(k) {
  const w = parseKey(k).getDay(); if (w < 1 || w > 5) return null;
  const l = lastSession(); if (!l) return "A";
  return l.date === k ? l.day : seqNext();
}
const findV = (slot, vid) => slot.v.find(x => x[0] === vid) || slot.v[0];
// rodízio de variações: a cada N semanas (padrão 4) depois da adaptação, salvo escolha manual
function varId(slot) {
  if (S.sel[slot.id]) return S.sel[slot.id];
  const n = Math.max(1, S.settings.rotateWeeks || 4);
  if (S.settings.rotate && !inAdapt()) return slot.v[Math.floor((weekNo() - 3) / n) % slot.v.length][0];
  return slot.v[0][0];
}
const estMin = L => { const p = PLAN[L]; let s = p.cuff ? 8 : 5; p.ex.forEach(e => s += e.sets * (45 + e.rest) / 60); return Math.round(s / 5) * 5 + 10; };
const repsTxt = e => (e.reps[0] === e.reps[1] ? e.reps[0] : e.reps[0] + "–" + e.reps[1]) + (e.unit ? " s" : "");
function prefill(slot, vid) {
  const hist = S.logs[vid] || [], last = hist[hist.length - 1];
  const out = []; let hint = "Sem histórico: escolha uma carga leve.";
  if (!last) { for (let i = 0; i < slot.sets; i++) out.push({ kg: 0, reps: slot.reps[0], done: false }); return { sets: out, hint, ghost: null }; }
  const nx = nextLoad(slot, last.sets), delta = nx.kg - (last.sets[0] ? last.sets[0].kg : 0);
  for (let i = 0; i < slot.sets; i++) { const ls = last.sets[i] || last.sets[last.sets.length - 1]; out.push({ kg: r1(Math.max(0, ls.kg + delta)), reps: nx.dir === "hold" ? ls.reps : slot.reps[0], done: false }); }
  hint = `${nx.dir === "up" ? `Hoje +${nx.inc} kg` : nx.dir === "down" ? `Hoje −${nx.inc} kg` : "Mantenha a carga"}. ${nx.why}`;
  return { sets: out, hint, ghost: `${dispDate(last.date)}: ${last.sets.map(s => `${s.kg}×${s.reps}`).join(" · ")}` };
}
// deload só por sinal: 3+ exercícios falharam 2 sessões seguidas com a mesma carga
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
function maxLoads(n = 6) {
  return Object.entries(S.logs).map(([vid, a]) => {
    let best = 0, nm = vid; a.forEach(l => l.sets.forEach(x => best = Math.max(best, x.kg)));
    DAY_ORDER.forEach(L => PLAN[L].ex.forEach(e => e.v.forEach(v => { if (v[0] === vid) nm = v[1]; })));
    return [nm, best, a.length];
  }).filter(r => r[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, n);
}
