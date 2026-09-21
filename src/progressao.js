/* ============ PROGRESSÃO AUTOMÁTICA (carga e sequência de treinos) ============ */
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
function seqNext() { const l = lastSession(); return l ? DAY_ORDER[(DAY_ORDER.indexOf(l.day) + 1) % DAY_ORDER.length] : "A"; }
function planLetter(k) {
  const w = parseKey(k).getDay(); if (w < 1 || w > 5) return null;
  const l = lastSession(); if (!l) return "A";
  return l.date === k ? l.day : seqNext();
}
function nextBadge(slot, vid) {
  const h = S.logs[vid] || [], last = h[h.length - 1]; if (!last || !(last.sets[0] && last.sets[0].kg > 0)) return "";
  const nx = nextLoad(slot, last.sets), col = nx.dir === "up" ? "var(--ok)" : nx.dir === "down" ? "var(--warn)" : "var(--muted)";
  return `<span class="tag" style="color:${col}">${nx.dir === "up" ? "↑" : nx.dir === "down" ? "↓" : "="} ${nx.kg} kg</span>`;
}
function summarySheet(L, rows) {
  const nl = seqNext();
  const line = r => {
    const v = findV(r.slot, r.vid), nx = r.nx;
    const t = nx.dir === "up" ? `<b style="color:var(--ok)">↑ ${nx.kg} kg</b>` : nx.dir === "down" ? `<b style="color:var(--warn)">↓ ${nx.kg} kg</b>` : `<b class="muted">${nx.kg ? "= " + nx.kg + " kg" : "="}</b>`;
    const sub = r.stag ? `Estagnado há 3 treinos: teste a variação ${esc(r.stag)}.` : nx.dir === "up" ? `${nx.why} Sobe ${nx.inc} kg.` : nx.dir === "down" ? `${nx.why} Desce ${nx.inc} kg.` : nx.why;
    return `<div class="li"><div class="grow"><div style="font-weight:700">${esc(v[1])}</div><div class="muted" style="font-size:14px">${sub}</div></div><div class="tabnum">${t}</div></div>`;
  };
  openSheet(`<h3 class="mid">Treino ${L} registrado</h3>
  <p class="muted">Cargas da próxima vez, já calculadas:</p>
  <div class="list">${rows.length ? rows.map(line).join("") : `<p class="muted" style="padding:8px 0">Nenhuma série marcada como feita, então nada mudou.</p>`}</div>
  <div class="tile in"><div class="lbl">Próximo treino</div><div class="mid">${nl} · ${PLAN[nl].name}</div></div>
  <p class="muted" style="font-size:14px">Agora, 10 min de esteira inclinada.</p>
  <button class="btn solid full" data-act="sum-next" data-day="${L}">CONTINUAR</button>`);
}
