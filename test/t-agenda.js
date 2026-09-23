// Agenda: rotina ≠ horário fixo. Recorrente, evento único, flexível, metas; só hoje × sempre; mover, pular, duplicar, reagendar.
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() }), ev = a.ev;
  const tr = () => ev("S.sched.items.find(x => x.type === 'treino')");
  T.ok(JSON.stringify(tr().days) === "[1,2,3,4,5]" && tr().at === "05:00", "migração: treino seg–sex às 05:00 vira rotina");
  T.ok(ev("S.sched.items.filter(x => x.type === 'refeicao').length") === 5 && ev("S.sched.items.some(x => x.type === 'remedio')"), "refeições e metformina viram itens da agenda");
  T.ok(ev("S.sched.items.find(x => x.ref === 'caminhada').at") === "" && ev("S.sched.items.find(x => x.ref === 'caminhada').period") === "noite", "caminhada é flexível (noite, sem hora)");
  // dias de treino editáveis: seg/qua/sex
  const id = tr().id; ev(`schedEdit(today(), "${id}", { days: [1, 3, 5] }, true)`);
  const dow = ev("parseKey(today()).getDay()");
  T.ok(ev("hasTrainItem(today())") === [1, 3, 5].includes(dow), "treino só nos dias escolhidos");
  T.ok(ev(`planLetter(today())`) === ([1, 3, 5].includes(dow) ? "A" : null), "dia sem treino na agenda = sem treino (planLetter)");
  ev(`schedEdit(today(), "${id}", { days: [0,1,2,3,4,5,6] }, true)`);
  // só hoje × sempre
  ev(`schedEdit(today(), "${id}", { at: "06:00" }, false)`);
  T.ok(ev(`instances(today()).find(x => x.id === "${id}").at`) === "06:00" && tr().at === "05:00" && ev(`instances(addDays(today(), 1)).find(x => x.id === "${id}").at`) === "05:00", "mudar só hoje não mexe nos outros dias");
  ev(`schedEdit(today(), "${id}", { at: "05:10" }, true)`);
  T.ok(tr().at === "05:10" && ev(`instances(today()).find(x => x.id === "${id}").at`) === "05:10", "salvar sempre muda a rotina (e limpa a exceção do dia)");
  // pular / concluir / duplicar / reagendar / excluir
  const alm = ev("S.sched.items.find(x => x.ref === 'Almoço').id");
  ev(`schedSkip(today(), "${alm}", true)`); T.ok(ev(`instances(today()).find(x => x.id === "${alm}").skip`) === true, "pular só hoje");
  ev(`schedSkip(today(), "${alm}", false)`);
  ev(`foodAdd(0, 100, "Almoço")`); T.ok(ev(`instances(today()).find(x => x.id === "${alm}").done`) === true, "refeição registrada = item concluído sozinho");
  const dup = ev(`schedDuplicate(today(), "${alm}").id`); T.ok(ev(`instances(today()).filter(x => x.it.ref === "Almoço").length`) === 2 && ev(`instances(addDays(today(),1)).filter(x => x.it.ref === "Almoço").length`) === 1, "duplicar cria um item só neste dia");
  ev(`schedRemove(today(), "${dup}", true)`);
  ev(`schedReschedule(today(), "${alm}", addDays(today(), 2), "13:30")`);
  T.ok(ev(`instances(today()).find(x => x.id === "${alm}").skip`) && ev(`instances(addDays(today(),2)).some(x => x.it.ref === "Almoço" && x.at === "13:30")`), "reagendar tira de hoje e põe no novo dia/horário");
  // evento único e atividade flexível pela interface
  ev("openPage('agenda')"); a.click("[data-act=inst-new]"); a.click("[data-act=inst-new-type][data-t=consulta]");
  a.q("#n-title").value = "Endocrinologista"; a.q("#n-date").value = keyOf(5); a.q("#e-at").value = "14:30"; a.click("[data-act=inst-add]");
  T.ok(ev(`instances("${keyOf(5)}").some(x => x.it.title === "Endocrinologista" && x.at === "14:30")`) && !ev(`instances("${keyOf(6)}").some(x => x.it.title === "Endocrinologista")`), "consulta como evento único (28/09 às 14:30)");
  a.click("[data-act=inst-new]"); a.click("[data-act=inst-new-type][data-t=atividade]");
  a.q("#n-title").value = "Alongar"; a.click("#e-per [data-v=manha]"); a.click("[data-act=inst-add]");
  T.ok(ev(`instances(today()).some(x => x.it.title === "Alongar" && x.flex && x.period === "manha")`), "atividade flexível (manhã, sem hora)");
  // editar pela folha: tocar → editar → só neste dia
  const x = ev(`instances(today()).find(i => i.it.title === "Jantar").id`);
  a.click(`[data-act=inst-open][data-id="${x}"]`); a.q("#e-at").value = "20:15"; a.click(`[data-act=inst-save][data-id="${x}"]:not([data-always])`);
  T.ok(ev(`instances(today()).find(i => i.id === "${x}").at`) === "20:15" && ev(`S.sched.items.find(i => i.id === "${x}").at`) === "19:00", "tocar → editar → salvar só neste dia");
  // mover arrastando (função chamada pelo gesto) com "aplicar sempre" no toast
  ev(`instMove("${x}", "21:00")`); a.click("#toast");
  T.ok(ev(`S.sched.items.find(i => i.id === "${x}").at`) === "21:00", "arrastar move só hoje e o toast aplica à rotina");
  // meta diária personalizada
  ev("closeAll()"); await a.wait(20); ev("openPage('agenda')"); a.click("[data-act=goal-new]"); a.q("#g-n").value = "Passos"; a.q("#g-t").value = "8000"; a.q("#g-u").value = "passos"; a.q("#g-s").value = "1000"; a.click("[data-act=goal-save]");
  a.click("[data-act=goal-add]"); a.click("[data-act=goal-add]");
  T.ok(ev("D(today()).g[S.goals[0].id]") === 2000, "meta diária personalizada soma com o botão +");
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || "")); a.close();
};
