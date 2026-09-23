/* ============ LENTE CORPO: peso, marcos, pescoço, ritmo, cargas, sequências e recaída ============ */
// o último marco segue a meta do perfil (padrão 105 kg)
function milestone(m) {
  const s = S.profile.startWeight, g = S.profile.goal, minW = Math.min(s, ...S.weights.map(w => w.kg)), fin = m.id === 6;
  return { nm: m.nm, lbl: fin ? `${g} kg` : m.lbl(s), txt: m.txt, ok: fin ? minW <= g : m.test(s, minW) };
}
function chartSVG() {
  const pts = S.weights.slice(-16); if (pts.length < 2) return `<p class="muted small">O gráfico aparece a partir da segunda pesagem.</p>`;
  const W = 340, H = 150, pl = 30, pr = 10, pt = 12, pb = 22, goal = S.profile.goal;
  const all = pts.map(p => p.kg).concat(goal), mn = Math.floor(Math.min(...all) - 1), mx = Math.ceil(Math.max(...all) + 1);
  const x = i => pl + i * (W - pl - pr) / (pts.length - 1), y = v => pt + (mx - v) / (mx - mn) * (H - pt - pb);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H - pb} L${pl},${H - pb}Z`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de peso das últimas ${pts.length} pesagens"><defs><linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".35"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    <line x1="${pl}" x2="${W - pr}" y1="${y(goal)}" y2="${y(goal)}" stroke="var(--ok)" stroke-dasharray="4 4"/><text x="${pl + 2}" y="${y(goal) - 4}" fill="var(--ok)">meta ${goal}</text>
    <path d="${area}" fill="url(#wfill)"/><path class="draw" d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.kg)}" r="3.5" fill="var(--bg)" stroke="var(--accent)" stroke-width="2"/>`).join("")}
    <text x="0" y="${y(mx) + 8}">${mx}</text><text x="0" y="${y(mn)}">${mn}</text><text x="${pl}" y="${H - 5}">${dispDate(pts[0].d)}</text><text x="${W - pr}" y="${H - 5}" text-anchor="end">${dispDate(pts[pts.length - 1].d)}</text></svg>`;
}
function weightSec() {
  const w = curWeight(), s = S.profile.startWeight, g = S.profile.goal, prog = clamp((s - w) / (s - g || 1), 0, 1), dv = r1(w - s);
  return sec("", `<div class="row between"><div><div class="lbl">Peso atual</div><div class="big tabnum">${r1(w)}<small class="unit"> kg</small></div></div><div class="right"><div class="lbl">Desde o início</div><div class="h3 tabnum" style="color:${w <= s ? "var(--ok)" : "var(--bad)"}">${dv > 0 ? "+" : ""}${dv} kg</div></div></div>
    <div class="bar"><i style="width:${prog * 100}%"></i></div><div class="row between"><span class="lbl">${s} kg</span><span class="lbl">Meta ${g} kg · faltam ${r1(Math.max(0, w - g))}</span></div>
    ${chartSVG()}<button class="btn solid full" data-act="weigh">${ic("scale")} REGISTRAR PESO</button>
    <p class="muted small">Pesagem semanal: segunda, ao acordar. Nunca se pese depois de furar: o número vem inflado por sódio e água e você vai ler como gordura.</p>
    ${S.weights.length ? `<div class="list">${S.weights.slice(-6).reverse().map(x => `<div class="li"><b class="tabnum grow">${x.kg} kg${x.waist ? `<span class="muted"> · cintura ${x.waist} cm</span>` : ""}</b><span class="muted small">${dispDate(x.d)}</span></div>`).join("")}</div>` : ""}`);
}
function rhythmSec() {
  const k = today(), wk = activeInWeek(mondayOf(k)), ds = dayStreak(), ws = weekStreak();
  const sq = Array.from({ length: 8 }, (_, i) => { const a = activeInWeek(addDays(mondayOf(k), (i - 7) * 7)); return `<div class="wsq"><i style="background:${a >= 5 ? "var(--ok)" : a === 4 ? "var(--warn)" : a ? "var(--bad)" : "var(--surface3)"}"></i><span class="lbl">${a}</span></div>`; }).join("");
  return sec("Ritmo", `<div class="row">${ring(wk / 5, 104, 9, "var(--ok)", `<div class="h2 tabnum">${wk}<small class="muted">/5</small></div><div class="lbl">ativos</div>`)}
    <div class="grow stack"><div class="tile row between"><div><div class="lbl">Sequência de dias</div><div class="h3 tabnum">${ds}</div></div>${ic("flame")}</div><div class="tile row between"><div><div class="lbl">Semanas verdes</div><div class="h3 tabnum">${ws}</div></div>${ic("trend")}</div></div></div>
    <p class="muted small">Dia ativo = Regra nº 1 + ${S.settings.needOthers} outros hábitos. Semana verde: 5+ dias. Semana amarela (4) não quebra a sequência. Só 2 semanas ruins seguidas zeram.</p>
    <div class="lbl">Últimas 8 semanas</div><div class="weeks8">${sq}</div><p class="muted xs">Verde = 5+ dias ativos · amarelo = 4 · vermelho = menos.</p>
    <button class="btn sm full" data-act="review-open">Ver resumo da semana</button>`);
}
function neckSec() {
  const last = S.neck[S.neck.length - 1];
  return sec("Termômetro do pescoço (acantose)", `<p class="muted small">Compare a mancha com o espelho, a cada 2 semanas. 1 = bem escura, 5 = quase sumiu. O pescoço clareia antes da balança.</p>
    <div class="seg neck">${[1, 2, 3, 4, 5].map(v => `<button class="${last && last.v === v && last.d === today() ? "on" : ""}" data-act="neck" data-v="${v}" style="--n:${v}">${v}</button>`).join("")}</div>
    ${S.neck.length ? `<p class="muted small">${S.neck.slice(-6).map(n => `${dispDate(n.d)}: ${n.v}`).join(" · ")}${diffDays(today(), last.d) >= 14 ? " · hora de uma nova leitura" : ""}</p>` : ""}`);
}
LENS_R.corpo = () => {
  const ms = MILESTONES.map(milestone).map(m => `<div class="li ${m.ok ? "ok" : ""}"><span class="ms-box">${ic("check")}</span><div class="grow"><b>${m.nm} · ${m.lbl}</b><small class="muted">${m.txt}</small></div></div>`).join("");
  const recs = maxLoads();
  return `${weightSec()}${rhythmSec()}${sec("Marcos", `<div class="list">${ms}</div>`)}${neckSec()}
    ${recs.length ? sec("Maiores cargas registradas", `<div class="list">${recs.map(r => `<div class="li"><span class="grow">${esc(r[0])}</span><b class="tabnum">${r[1]} kg</b></div>`).join("")}</div>`) : ""}
    ${sec("", fold("Protocolo de recaída", `<p class="small"><b>Furou uma refeição:</b> a próxima é normal. Não compensa pulando nem treina dobrado.<br><br><b>Furou um dia:</b> entra como dia ruim e amanhã segue o plano. Um dia de 4.000 kcal numa semana de 2.000 ainda é déficit.<br><br><b>Furou uma semana:</b> volte pelo menor degrau: só a Regra nº 1. Os outros hábitos voltam depois.<br><br><b>Nunca se pese após furar.</b></p>`, UI.lensSub === "recaida", "recaida"))}`;
};
/* ---- registros: peso, pescoço, cardio, resumo semanal ---- */
function weighSheet() {
  const k = today(), y = !isActive(addDays(k, -1)) && S.weights.length;
  openSheet(`<h3 class="h3">Registrar peso</h3><p class="muted">Ao acordar, depois do banheiro, antes de comer. Sempre nas mesmas condições.</p>
  ${y ? banner("warn", "info", "Ontem foi um dia difícil", "O número pode estar inflado por sódio e água. Se puder, espere a próxima segunda.") : ""}
  <label class="lbl" for="wkg">Peso (kg)</label><input class="field big-in" id="wkg" inputmode="decimal" placeholder="${r1(curWeight())}">
  <label class="lbl" for="wwaist">Cintura (cm, opcional)</label><input class="field" id="wwaist" inputmode="decimal" placeholder="ex.: 128">
  <button class="btn solid full" data-act="weigh-save">SALVAR</button>`);
}
function weighSave(kg, waist) {
  if (!(kg >= 40 && kg <= 300)) return toast("Peso inválido."), false;
  const k = today(); S.weights = S.weights.filter(x => x.d !== k); S.weights.push({ d: k, kg: r1(kg), waist: waist || null }); S.weights.sort((a, b) => a.d < b.d ? -1 : 1);
  const re = recalcIfNeeded(kg); save(); render();
  toast(re ? `Peso registrado. Metas recalculadas: ${fmtInt(TG().kcal)} kcal e ${TG().prot} g de proteína.` : "Peso registrado."); return true;
}
function neckSave(v) { const k = today(); S.neck = S.neck.filter(n => n.d !== k); S.neck.push({ d: k, v }); save(); render(); toast(`Pescoço ${v}/5 registrado.`); }
function cardioSheet() {
  openSheet(`<h3 class="h3">Registrar cardio</h3><div class="grid3"><input type="number" inputmode="decimal" id="cardioMins" placeholder="Minutos" class="field" aria-label="Minutos"><input type="number" inputmode="decimal" id="cardioSpd" placeholder="km/h" class="field" aria-label="Velocidade em km/h"><input type="number" inputmode="decimal" id="cardioInc" placeholder="Incl. %" class="field" aria-label="Inclinação em porcentagem"></div>
  <button class="btn solid full" data-act="cardio-save">SALVAR</button>`);
}
function weekReview() {
  const k = today(), prot = []; let cardio = 0, act = 0;
  for (let i = 1; i <= 7; i++) { const dk = addDays(k, -i), p = (D(dk).meals || []).reduce((a, m) => a + (m.p || 0), 0); if (p > 0) prot.push(p); cardio += cardioMin(dk); if (isActive(dk)) act++; }
  const avg = prot.length ? Math.round(prot.reduce((a, b) => a + b, 0) / prot.length) : 0, tp = TG().prot;
  const sug = !prot.length ? "Sem comida registrada na semana. Registre ao menos o almoço para o app poder ajudar." : avg < tp * 0.85 ? `Proteína média de ${avg} g, abaixo da meta de ${tp} g. Coloque uma fonte de proteína em cada refeição.` : act >= 5 ? "Semana verde: 5 ou mais dias ativos. Mantenha o ritmo." : `${act} dias ativos. Faltam ${5 - act} para a meta: escolha o hábito mais fácil e repita amanhã.`;
  return { avg, cardio, act, sug, prot: prot.length };
}
function reviewOpen() {
  const r = weekReview();
  openSheet(`<h3 class="h2">Resumo da semana</h3><p class="muted">Últimos 7 dias · semana ${weekNo()}</p>
  <div class="grid2"><div class="tile"><div class="h2 tabnum">${r.prot ? r.avg + " g" : "—"}</div><div class="lbl">Proteína/dia</div></div><div class="tile"><div class="h2 tabnum">${r.cardio} min</div><div class="lbl">Cardio</div></div></div>
  <div class="tile"><div class="h3">${r.act} de 7 dias ativos</div><p class="muted small">${r.sug}</p></div><button class="btn solid full" data-act="close">Entendido</button>`);
}
function maybeReview() { const k = today(); if (parseKey(k).getDay() === 1 && S.settings.revSeen !== k && Object.values(S.days).some(hasData)) { S.settings.revSeen = k; save(); reviewOpen(); } }
ACT.weigh = () => weighSheet();
ACT["weigh-save"] = () => { if (weighSave(num($("#wkg").value), num($("#wwaist").value))) closeSheet(); };
ACT.neck = b => neckSave(+b.dataset.v);
ACT["cardio-open"] = () => cardioSheet();
ACT["cardio-save"] = () => { if (!cardioAdd(num($("#cardioMins").value), num($("#cardioSpd").value), num($("#cardioInc").value), dayK())) return toast("Informe os minutos."); closeSheet(); render(); toast("Cardio registrado."); };
ACT["review-open"] = () => reviewOpen();
