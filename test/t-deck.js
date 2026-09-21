// Deck: alertas de segurança, treino concluído/próximo, pular treino, cardio, resumo semanal, frase.
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const day = (o = {}) => Object.assign({ h: {}, s: {}, water: 0, meals: [] }, o);
  // alertas
  const st = baseState({ pain: [{ d: keyOf(-3), day: "A", v: 6 }, { d: keyOf(-2), day: "A", v: 5 }, { d: keyOf(-1), day: "A", v: 6 }] });
  st.settings.lastBackup = keyOf(-40); st.days[keyOf(-1)] = day({ water: 500 });
  let a = await boot({ state: st }); a.ev('go("deck")');
  let t = a.q("#v-deck").textContent;
  T.ok(/Dor no ombro em alta/.test(t), "alerta de dor no ombro (média ≥ 4) aparece no Deck");
  T.ok(/Backup atrasado/.test(t), "alerta de backup atrasado aparece");
  T.ok(/Dica do dia/.test(t) && /Sequência de dias/.test(t) && /Próximo marco/.test(t), "dica do dia, sequência e próximo marco aparecem");
  T.ok(a.qa("#quote-card").length === 1, "exatamente um card de frase");
  T.ok(a.qa(".qstrip .qtile").length === 4 && /Água/.test(a.q(".qstrip").textContent) && /Dias? seguidos?/.test(a.q(".qstrip").textContent), "faixa de resumo com água, proteína, cardio e sequência");
  T.ok(a.qa(".aura-core").length === 1 && !a.q(".fab") && !a.q("[data-act='fab-open']"), "uma Aura e sem o botão flutuante \"+\"");
  a.close();

  // sem alertas quando está tudo bem
  a = await boot({ state: baseState() }); a.ev('go("deck")');
  T.ok(!/Dor no ombro|Backup atrasado/.test(a.q("#v-deck").textContent), "sem dor e com backup em dia: sem alertas");

  // cardio
  a.q("[data-act=cardio-open]").click(); T.ok(a.q("#cardioSheet").classList.contains("on"), "abre o cardio");
  a.q("[data-act=cardio-save]").click(); T.ok(!a.ev("(D(today()).cardios||[]).length"), "cardio sem minutos não grava");
  a.q("#cardioMins").value = "30"; a.q("#cardioSpd").value = "5.5"; a.q("[data-act=cardio-save]").click();
  T.ok(a.ev("D(today()).cardios[0].min") === 30 && !a.q("#cardioSheet").classList.contains("on"), "cardio de 30 min gravado e fecha");

  // pular treino (só vale em dia útil; força a letra com pickDay não é necessário)
  a.ev('DW(today()).skipWk = true; save(); render()');
  T.ok(/foco é a dieta|fim de semana|Fim de semana/i.test(a.q("#v-deck").textContent), "treino pulado (ou fim de semana) mostra o aviso sem quebrar");
  a.ev('DW(today()).skipWk = false; save()');

  // resumo semanal com números reais
  const st2 = baseState(); [1, 2, 3].forEach(i => { st2.days[keyOf(-i)] = day({ meals: [{ n: "x", g: 100, k: 500, p: 100, m: "Almoço" }], cardios: [{ min: 20 }] }); });
  const b = await boot({ state: st2 }); b.ev("reviewOpen()");
  T.ok(/100 g/.test(b.q("#revP").textContent) && /60 min/.test(b.q("#revC").textContent), "resumo mostra proteína média 100 g e 60 min de cardio: " + b.q("#revP").textContent + " / " + b.q("#revC").textContent);
  T.ok(/abaixo da meta/.test(b.q("#revSug").textContent), "sugestão aponta proteína abaixo da meta");
  b.q("[data-act=review-close]").click(); T.ok(!b.q("#reviewSheet").classList.contains("on"), "fecha o resumo");
  const css = require("fs").readFileSync(require("path").join(__dirname, "..", "src", "styles.css"), "utf8");
  T.ok(/--dock-h:/.test(css), "--dock-h está definida (botão flutuante e barra da A.I. dependem dela)");
  T.ok(!a.errors.length && !b.errors.length, "sem erros de script");
  a.close(); b.close();
};
