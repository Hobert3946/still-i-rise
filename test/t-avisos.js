// Confirmações no próprio app (nada de janela do navegador) e "Desfazer" no que dá para voltar atrás.
const fs = require("fs"),
  path = require("path");
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const src = path.join(__dirname, "..", "src"),
    walk = d =>
      fs
        .readdirSync(d, { withFileTypes: true })
        .flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const nativos = walk(src).filter(
    f => f.endsWith(".js") && /(^|[^\w.])(confirm|alert|prompt)\(/.test(fs.readFileSync(f, "utf8"))
  );
  T.ok(
    !nativos.length,
    "nenhuma janela do navegador (confirm/alert/prompt)" +
      (nativos.length ? ": " + nativos.map(f => path.basename(f)).join(", ") : "")
  );
  const a = await boot({ v1: baseState() }),
    ev = a.ev;
  a.w.confirm = () => {
    throw new Error("confirm nativo chamado");
  };
  // cancelar não faz nada
  ev("ACT.reset()");
  T.ok(
    /Apagar os dados de Hobert/.test(a.q("#sheet").textContent) && a.q("#sheet .btn.danger.fill"),
    "painel de confirmação com o botão de apagar em destaque"
  );
  a.click("[data-act=confirm-no]");
  T.ok(ev("S.weights.length") === 2 && !a.q("#sheet").classList.contains("on"), "cancelar não apaga nada");
  // tirar da rotina → desfazer
  const alm = ev("S.sched.items.find(x => x.ref === 'Almoço').id");
  ev("openPage('agenda')");
  a.click(`[data-act=inst-open][data-id="${alm}"]`);
  a.click(`#sheet [data-act=inst-del]`);
  T.ok(
    !ev(`instances(today()).some(x => x.id === "${alm}")`) && /saiu da rotina/.test(a.q("#toast").textContent),
    "tirar da rotina é imediato e avisa"
  );
  a.click("#toast");
  T.ok(
    ev(`instances(today()).some(x => x.id === "${alm}")`) && !ev(`S.sched.items.find(x => x.id === "${alm}").until`),
    "Desfazer devolve o item à rotina"
  );
  ev("closeAll()");
  await a.wait(20);
  // remédio → desfazer (com os horários na agenda)
  const mid = ev("S.meds[0].id");
  ev(`medSheet("${mid}")`);
  a.click("#sheet [data-act=med-del]");
  T.ok(ev("S.meds.length") === 0 && !ev("S.sched.items.some(x => x.type === 'remedio')"), "remover remédio é imediato");
  a.click("#toast");
  T.ok(ev("S.meds.length") === 1 && ev(`medTimes("${mid}").length`) === 1, "Desfazer devolve o remédio e o horário");
  // meta diária e suplemento → desfazer
  ev("S.goals.push({ id: 'g1', n: 'Passos', target: 8000, unit: 'passos', step: 1000 }); openPage('agenda')");
  a.click("[data-act=goal-del]");
  T.ok(ev("S.goals.length") === 0, "excluir meta é imediato");
  a.click("#toast");
  T.ok(ev("S.goals.length") === 1, "Desfazer devolve a meta");
  ev("closeAll()");
  await a.wait(20);
  ev("suppSheet(0)");
  const sn = ev("S.supps[0].n");
  a.click("#sheet [data-act=li-del]");
  T.ok(!ev(`S.supps.some(s => s.n === "${sn}")`), "remover suplemento é imediato");
  a.click("#toast");
  T.ok(
    ev(`S.supps[0].n`) === sn && ev(`S.sched.items.some(x => x.type === "suplemento" && x.ref === S.supps[0].id)`),
    "Desfazer devolve o suplemento e o horário"
  );
  // consentimento da foto do prato
  ev("SEC.gemKey = 'k'; S.settings.gemAck = false; fotoStart('Almoço')");
  T.ok(/Enviar a foto ao Google/.test(a.q("#sheet").textContent), "foto do prato pede consentimento no próprio app");
  a.click("[data-act=confirm-ok]");
  T.ok(ev("S.settings.gemAck") === true, "consentimento guardado");
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || ""));
  a.close();
};
