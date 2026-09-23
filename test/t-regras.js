// Hábitos parametrizáveis, dia ativo, semanas e metas (Mifflin-St Jeor).
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() }), k = keyOf(0);
  a.ev("S.habits.forEach(h => DW(today()).h[h.id] = false)");
  a.click(".align"); a.click('#sheet [data-act=habit][data-id=acucar]'); T.ok(a.ev("D(today()).h.acucar") === true && /Regra nº 1/.test(a.q("#sheet").textContent), "detalhe do alinhamento marca a Regra nº 1");
  a.ev("DW(today()).h.proteina = true"); T.ok(a.ev("isActive(today())") === false, "Regra nº 1 + 1 não é dia ativo");
  a.ev("DW(today()).h.sono = true"); T.ok(a.ev("isActive(today())") === true, "Regra nº 1 + 2 é dia ativo");
  a.ev("DW(today()).h.acucar = false"); T.ok(a.ev("isActive(today())") === false, "sem a Regra nº 1 nunca é ativo");
  a.ev("S.settings.rule1 = 'treino'; DW(today()).h.treino = true"); T.ok(a.ev("isActive(today())") === true, "Regra nº 1 configurável");
  a.ev("S.settings.needOthers = 3"); T.ok(a.ev("isActive(today())") === false, "N outros hábitos configurável");
  a.ev("S.settings.rule1 = 'acucar'; S.settings.needOthers = 2");
  // editor: novo hábito com horário aparece no rio; sem horário, no trilho
  a.ev("closeAll(); UI.openFold = 'habitos'; openPage('ajustes')"); await a.wait(20); a.click("[data-act=li-new][data-k=habits]");
  a.q("#hi").value = "🧘"; a.q("#ht").value = "Alongar 10 min"; a.click("[data-act=li-save]");
  T.ok(a.ev("S.habits.length") === 7 && a.ev("S.habits[6].icon") === "🧘", "adiciona hábito com ícone");
  a.ev("listMove('habits', 6, 0)"); T.ok(a.ev("S.habits[0].t") === "Alongar 10 min", "reordena");
  a.ev("ACT['li-del']({dataset:{k:'habits', i:'0'}})"); T.ok(a.ev("S.habits.length") === 6, "remove");
  const r1i = a.ev("S.habits.findIndex(h => h.id === 'acucar')");
  a.ev(`ACT['li-del']({dataset:{k:'habits', i:'${r1i}'}})`); T.ok(a.ev("S.habits.length") === 6, "não remove a Regra nº 1");
  // suplementos customizáveis
  a.ev("go('saude','suplementos')"); a.click("[data-act=li-new][data-k=supps]"); a.q("#sn").value = "B12"; a.q("#st").value = "Com o café"; a.q("#sa").value = "07:00"; a.click("[data-act=li-save]");
  T.ok(a.ev("instances(today()).some(x => x.it.type === 'suplemento' && x.it.title === 'B12' && x.at === '07:00')") && a.ev("S.supps.every(s => s.type === 'S')"), "suplemento novo entra na agenda; remédios ficam em área própria");
  // semanas: 5 ativos = verde; 4 não quebra; 2 ruins seguidas zeram
  const on = off => a.ev(`DW("${keyOf(off)}").h = {acucar:true, proteina:true, sono:true}`);
  a.ev("S.days = {}; S.settings.start = addDays(mondayOf(today()), -35)");
  const mon = off => a.ev(`diffDays(addDays(mondayOf(today()), ${off}), today())`);
  for (let w = 1; w <= 3; w++) for (let i = 0; i < (w === 2 ? 4 : 5); i++) on(mon(-7 * w) + i);
  T.ok(a.ev("weekStreak()") === 2, "semana amarela (4) no meio não quebra a sequência");
  // metas
  T.ok(a.ev("TG().tmb") === Math.round(10 * 140 + 6.25 * 179 - 5 * 24 + 5), "TMB = 10×peso + 6,25×altura − 5×idade + 5");
  T.ok(a.ev("TG().prot") === 170, "proteína 1,2 × peso em múltiplo de 5");
  T.ok(a.ev("recalcIfNeeded(137)") === false && a.ev("recalcIfNeeded(136)") === true && a.ev("S.settings.calcWeight") === 136, "recalcula só a cada 4 kg");
  T.ok(!a.errors.length, "sem erros de script"); a.close();
};
