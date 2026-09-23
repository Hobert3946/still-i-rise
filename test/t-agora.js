// Hoje: o card Agora mostra UMA ação, a mais relevante; "dia alinhado %" só com dados reais.
const { boot, baseState, keyOf } = require("./helpers");
const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
module.exports = async T => {
  const st = baseState(); st.weights.push({ d: keyOf(0), kg: 138, waist: null }); st.days[keyOf(0)] = { h: {}, s: {}, water: 3000, meals: [], sleep: 7 };
  const a = await boot({ v1: st }), ev = a.ev, now = ev("nowMin()");
  const top = () => ev("agoraCard()");
  ev("S.sched.items = []; S.hunger.push({t: Date.now(), d: today(), fome: 3, vontade: 3, perda: false, gat: [], estresse: null}); DW(today()).h[S.settings.rule1] = true; save()");
  T.ok(["end", "next"].includes(top().id), "sem pendências: card de dia fechado ou próximo item");
  // remédio atrasado ganha de refeição
  ev(`S.sched.items.push(schedItem("refeicao", "Almoço", "Almoço", { at: "${hhmm(Math.max(0, now - 10))}" }), schedItem("remedio", S.meds[0].id, "Metformina", { at: "${hhmm(Math.max(0, now - 40))}" }))`);
  T.ok(top().act === "dose-log" && /Metformina/.test(top().title), "dose atrasada é a ação principal");
  a.ev("render()"); a.click(".agora .btn.solid"); T.ok(ev("dosesLate().length") === 0, "um toque no card registra a dose");
  T.ok(top().act === "meal-open" && /Registrar almoço/.test(top().label), "depois vem a refeição do momento");
  a.click(".agora [data-act=snooze]"); T.ok(top().act !== "meal-open", "'Depois' adia o card por 30 min");
  // treino em andamento sempre primeiro
  ev("wkBegin('A')"); T.ok(top().id === "cur", "treino em andamento vem primeiro"); ev("S.cur = null; save()");
  // alinhamento
  const al = ev("alignment()");
  T.ok(al.parts.some(p => p.id === "rule1" && p.f === 1) && al.parts.some(p => p.id === "water") && al.pct > 0 && al.pct <= 100, `dia alinhado ${al.pct}% com partes medidas`);
  ev("DW(today()).h[S.settings.rule1] = false"); T.ok(ev("alignment().pct") < al.pct, "desmarcar a Regra nº 1 baixa o alinhamento");
  a.ev("render()"); a.click(".align"); T.ok(/alinhado/.test(a.q("#sheet").textContent) && a.qa("#sheet .chk").length === 6, "tocar no alinhamento mostra o detalhe e os hábitos");
  // regressão: calorias com ponto de milhar e barra proporcional (antes "2300" e cálculo com 2,3)
  ev("go('hoje')"); T.ok(/\/ 2\.300 kcal/.test(a.q(".meters").textContent) && ev("numBR('1.850')") === 1850 && ev("numBR('1,5')") === 1.5, "meta de calorias formatada e barra correta");
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || "")); a.close();
};
