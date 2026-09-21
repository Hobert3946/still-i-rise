const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const a = await boot({ state: baseState() }), ev = a.ev;
  a.q("[data-act=quote-next]").click(); T.ok(a.qa("#quote-card").length === 1, "trocar frase mantém um único card");
  ev('go("agua")'); T.ok(a.q("#v-agua .bottle"), "aba Água mostra a garrafa");
  a.q("[data-act=w-add][data-ml='500']").click(); T.ok(ev("D(today()).water") === 500 && ev("D(today()).wlog.length") === 1, "+500 ml registra com horário");
  a.q("[data-act=w-add][data-ml='1000']").click(); a.q("[data-act=w-undo]").click(); T.ok(ev("D(today()).water") === 500, "desfazer remove o último");
  a.q("#wcust").value = "0"; a.q("[data-act=w-custom]").click(); T.ok(ev("D(today()).water") === 500, "valor inválido é recusado");
  a.q("#wcust").value = "2500"; a.q("[data-act=w-custom]").click();
  T.ok(ev("D(today()).h.agua") === true && /100%/.test(a.q("#v-agua").textContent), "bateu a meta: hábito água marcado e 100%");
  a.q("[data-act=w-goal][data-d='250']").click(); T.ok(ev("S.settings.waterGoal") === 3250 && ev("D(today()).h.agua") === false, "meta 3,25 L recalcula o hábito");
  T.ok(Number(a.q("#dropg stop").getAttribute("offset")) > 0.9, "gota do menu enche com o progresso");
  T.ok(a.qa("#v-agua .week .d").length === 7, "gráfico semanal com 7 barras");
  T.ok(!a.errors.length, "sem erros de script"); a.close();
};
