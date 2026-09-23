// Água: tamanhos, valor livre, desfazer, meta, hábito automático, ritmo, sequência, semana e gota.
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() });
  a.ev("openLens('agua')");
  T.ok(a.qa("#lens [data-act=w-add]").length === 6, "6 tamanhos rápidos (100 a 1000 ml)");
  a.click("#lens [data-act=w-add][data-ml='500']"); T.ok(a.ev("D(today()).water") === 500 && a.ev("D(today()).wlog.length") === 1, "garrafa soma 500 ml com horário");
  a.q("#wcust").value = "250"; a.click("[data-act=w-custom]"); T.ok(a.ev("D(today()).water") === 750, "valor livre");
  a.q("#wcust").value = "5000"; a.click("[data-act=w-custom]"); T.ok(a.ev("D(today()).water") === 750, "valor absurdo recusado");
  a.click("#lens [data-act=w-undo]"); T.ok(a.ev("D(today()).water") === 500, "desfazer remove o último registro");
  a.ev("waterAdd(2500)"); T.ok(a.ev("D(today()).h.agua") === true, "bater a meta marca o hábito de água");
  a.ev("waterGoalAdj(500)"); T.ok(a.ev("S.settings.waterGoal") === 3500 && a.ev("D(today()).h.agua") === false, "subir a meta desmarca se não bateu");
  a.ev("waterGoalAdj(-500); render()");
  const stop = a.q("#dropg stop").getAttribute("offset"); T.ok(stop === "1", "gota do header cheia com a meta batida");
  a.ev(`DW("${keyOf(-1)}").water = 3000; DW("${keyOf(-2)}").water = 3200; DW("${keyOf(-3)}").water = 100`);
  T.ok(a.ev("waterStreak()") === 3, "sequência de dias na meta");
  T.ok(a.ev("waterExpected(6)") === 0 && a.ev("waterExpected(13.5)") === 1500 && a.ev("waterExpected(21)") === 3000, "ritmo esperado linear das 6h às 21h");
  T.ok(a.ev("waterHourFor(1500)") === 13.5, "maré do rio: 1,5 L corresponde às 13h30");
  a.ev("render()"); T.ok(a.qa("#lens .week .d").length === 7, "gráfico semanal com 7 barras");
  // paleta
  a.ev("dropLayer('lens')"); await a.wait(20); a.ev("D(today()).water = 0; save()");
  a.click("#orb"); a.q("#pal-q").value = "água 300"; a.q("#pal-q").dispatchEvent(new a.w.Event("input", { bubbles: true }));
  a.q("#pal-q").dispatchEvent(new a.w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  T.ok(a.ev("D(today()).water") === 300, "paleta: 'água 300' + Enter registra");
  T.ok(!a.errors.length, "sem erros de script"); a.close();
};
