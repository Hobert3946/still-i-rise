// Hábitos parametrizáveis, dia ativo, semanas e metas (Mifflin-St Jeor).
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() }), k = keyOf(0);
  a.ev("S.habits.forEach(h => DW(today()).h[h.id] = false)");
  a.click('.rule1[data-act=habit]'); T.ok(a.ev("D(today()).h.acucar") === true, "tocar na Regra nº 1 marca o hábito");
  a.ev("DW(today()).h.proteina = true"); T.ok(a.ev("isActive(today())") === false, "Regra nº 1 + 1 não é dia ativo");
  a.ev("DW(today()).h.sono = true"); T.ok(a.ev("isActive(today())") === true, "Regra nº 1 + 2 é dia ativo");
  a.ev("DW(today()).h.acucar = false"); T.ok(a.ev("isActive(today())") === false, "sem a Regra nº 1 nunca é ativo");
  a.ev("S.settings.rule1 = 'treino'; DW(today()).h.treino = true"); T.ok(a.ev("isActive(today())") === true, "Regra nº 1 configurável");
  a.ev("S.settings.needOthers = 3"); T.ok(a.ev("isActive(today())") === false, "N outros hábitos configurável");
  a.ev("S.settings.rule1 = 'acucar'; S.settings.needOthers = 2");
  // editor: novo hábito com horário aparece no rio; sem horário, no trilho
  a.ev("openLens('sistema','habitos')"); a.click("[data-act=li-new][data-k=habits]");
  a.q("#hi").value = "🧘"; a.q("#ht").value = "Alongar 10 min"; a.q("#ha").value = "06:30"; a.click("[data-act=li-save]");
  T.ok(a.ev("S.habits.length") === 7 && a.ev("S.habits[6].at") === "06:30", "adiciona hábito com ícone e horário");
  a.ev("dropLayer('lens')"); await a.wait(20);
  T.ok(/Alongar 10 min/.test(a.q(".timeline").textContent), "hábito com horário aparece como nó no rio");
  a.ev("listMove('habits', 6, 0)"); T.ok(a.ev("S.habits[0].t") === "Alongar 10 min", "reordena");
  a.ev("ACT['li-del']({dataset:{k:'habits', i:'0'}})"); T.ok(a.ev("S.habits.length") === 6, "remove");
  const r1i = a.ev("S.habits.findIndex(h => h.id === 'acucar')");
  a.ev(`ACT['li-del']({dataset:{k:'habits', i:'${r1i}'}})`); T.ok(a.ev("S.habits.length") === 6, "não remove a Regra nº 1");
  // suplementos customizáveis
  a.ev("S.supps.push({id:'b12', n:'B12', tip:'Com o café', type:'S', at:'07:00'}); render()");
  T.ok(/B12|Suplementos/.test(a.q(".timeline").textContent) && a.ev("S.supps.filter(s=>s.type==='M').length") === 1, "suplemento novo entra no rio e remédios ficam separados");
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
