// Mudar a rotina não reescreve o passado: horário de remédio trocado mantém a adesão; "sempre" vale do dia em diante.
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() }), ev = a.ev;
  ev(`const m = medSave({ n: "Teste", dose: "1" }, ["08:00"]); m.start = addDays(today(), -10); medItems(m.id)[0].from = addDays(today(), -10);
      for (let i = 1; i <= 5; i++) { const k = addDays(today(), -i); DW(k).water = 500; doseLog(k, medItems(m.id)[0].id, "08:05"); }
      DW(addDays(today(), -6)).water = 500; window.__m = m.id;`);
  // 6 dias passados com o app usado (5 doses tomadas) + a dose de hoje, se o horário já passou
  const due = at => 6 + (ev(`nowMin() >= toMin("${at}")`) ? 1 : 0), before = ev("adherence(__m)");
  T.ok(before.ok === 5 && before.due === due("08:00"), `adesão antes: ${before.ok} de ${before.due}`);
  ev(`medSave(Object.assign({}, medById(__m)), ["09:00"])`);
  const after = ev("adherence(__m)");
  T.ok(after.ok === 5 && after.due === due("09:00"), `trocar 08:00 → 09:00 mantém a adesão (${after.ok} de ${after.due})`);
  T.ok(ev(`medToday(__m)[0].inst.at`) === "09:00" && ev(`medToday(__m, "${keyOf(-1)}")[0].inst.at`) === "08:00" && ev(`medToday(__m, "${keyOf(-1)}")[0].taken`) === "08:05", "hoje às 09:00; ontem continua 08:00 com a dose tomada");
  T.ok(ev("medTimes(__m).join()") === "09:00", "a ficha mostra o horário novo");
  ev(`medSave(Object.assign({}, medById(__m)), ["09:00", "20:00"])`);
  T.ok(ev(`medToday(__m, "${keyOf(-1)}").length`) === 1 && ev("medToday(__m).length") === 2, "horário novo começa hoje (não cria doses perdidas no passado)");
  T.ok(ev("adherence(__m).ok") === 5 && ev("adherence(__m).due") === due("09:00") + (ev(`nowMin() >= toMin("20:00")`) ? 1 : 0), "adesão continua igual depois de acrescentar horário");
  ev(`medSave(Object.assign({}, medById(__m)), ["20:00"])`);
  T.ok(ev("medTimes(__m).join()") === "20:00" && ev(`medToday(__m, "${keyOf(-1)}")[0].taken`) === "08:05", "tirar um horário não apaga as doses passadas");
  // agenda: "sempre" a partir de hoje não muda ontem
  const tr = ev("S.sched.items.find(x => x.type === 'treino').id"), y = keyOf(-1);
  ev(`schedEdit(today(), "${tr}", { at: "06:30" }, true)`);
  T.ok(ev(`instances(today()).find(x => x.id === "${tr}") ? instances(today()).find(x => x.id === "${tr}").at : "06:30"`) === "06:30", "treino muda de hoje em diante");
  const yi = ev(`instances("${y}").find(x => x.id === "${tr}")`);
  T.ok(!yi || yi.at === "05:00", "ontem o treino continua às 05:00");
  ev(`schedEdit(today(), "${tr}", { at: "07:00" }, true)`);
  T.ok(ev(`S.sched.items.find(x => x.id === "${tr}").hist.length`) === 1, "duas mudanças no mesmo dia guardam um histórico só");
  ev(`schedEdit("${keyOf(-3)}", "${tr}", { days: [0,1,2,3,4,5,6] }, true)`);
  T.ok(ev(`instances("${keyOf(-2)}").some(x => x.id === "${tr}" && x.at === "05:00")`) && ev(`instances("${keyOf(-4)}").every(x => x.id !== "${tr}" || [1,2,3,4,5].includes(parseKey("${keyOf(-4)}").getDay()))`), "mudar a partir de um dia passado mantém o horário de cada trecho");
  // tirar da rotina: some de hoje em diante, os dias passados ficam
  const alm = ev("S.sched.items.find(x => x.ref === 'Almoço').id");
  ev(`schedRemove(today(), "${alm}", true)`);
  T.ok(!ev(`instances(today()).some(x => x.id === "${alm}")`) && ev(`instances("${y}").some(x => x.id === "${alm}")`), "tirar da rotina mantém o item nos dias passados");
  // novo item recorrente não aparece no passado; duplicar não copia histórico
  ev(`schedAdd({ type: "atividade", title: "Alongar", at: "10:00", days: [0,1,2,3,4,5,6] })`);
  T.ok(ev(`instances(today()).some(x => x.it.title === "Alongar")`) && !ev(`instances("${y}").some(x => x.it.title === "Alongar")`), "item novo começa hoje");
  const dup = ev(`schedDuplicate(today(), "${tr}")`);
  T.ok(dup && !dup.hist && !dup.until && dup.date === ev("today()"), "duplicar cria um evento único limpo");
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || "")); a.close();
};
