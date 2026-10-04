// Perfis: criar, trocar, editar metas, excluir; dados isolados entre perfis.
const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() });
  a.ev("waterAdd(500)");
  a.click(".who");
  T.ok(
    /Hobert/.test(a.q("#page").textContent) && /Perfis/.test(a.q("#page").textContent),
    "avatar abre Perfil e ajustes com a lista de perfis"
  );
  a.click("#page [data-act=profile-new]");
  a.q("#nn").value = "Mãe";
  a.q("#ns").value = "90";
  a.click("[data-act=profile-create]");
  T.ok(
    a.ev("Object.keys(R.profiles).length") === 1 && /sexo/.test(a.q("#toast").textContent),
    "novo perfil exige o sexo biológico"
  );
  a.q("#nsx").value = "F";
  a.q("#ng").value = "75";
  a.q("#nh").value = "160";
  a.q("#na").value = "55";
  a.click("[data-act=profile-create]");
  await a.wait(30);
  T.ok(a.ev("S.profile.name") === "Mãe" && a.ev("Object.keys(R.profiles).length") === 2, "cria e entra no novo perfil");
  T.ok(
    a.ev("D(today()).water") === 0 && a.ev("S.weights.length") === 0 && a.ev("S.habits.length") === 6,
    "novo perfil começa vazio, com hábitos padrão"
  );
  T.ok(
    a.ev("S.meds.length") === 0 && a.ev("S.supps.length") === 5,
    "novo perfil começa sem remédios (só os suplementos padrão)"
  );
  T.ok(
    a.ev("TG().kcal") === 1800 && a.ev("TG().prot") === 110,
    "metas calculadas para os dados dela (piso 1.800, 1,2 g/kg)"
  );
  T.ok(
    a.ev("S.profile.sex") === "F" && a.ev("TG().tmb") === Math.round(10 * 90 + 6.25 * 160 - 5 * 55 - 161),
    "fórmula feminina de Mifflin-St Jeor (−161)"
  );
  T.ok(/Mãe/.test(a.q("#top").textContent), "header mostra o perfil ativo");
  a.ev("waterAdd(300)");
  a.ev("switchProfile('p1')");
  T.ok(
    a.ev("S.profile.name") === "Hobert" && a.ev("D(today()).water") === 500,
    "trocar de volta traz a água do Hobert (500), não a da Mãe"
  );
  // editar metas parametrizáveis
  a.ev("UI.openFold = 'metas'; openPage('ajustes')");
  a.q("#pdef").value = "500";
  a.q("#pact").value = "1,55";
  a.q("#pfloor").value = "2000";
  a.q("#pwater").value = "3500";
  a.click("[data-act=profile-save]");
  const exp = Math.max(2000, Math.round(((10 * 140 + 6.25 * 179 - 5 * 24 + 5) * 1.55 - 500) / 50) * 50);
  T.ok(
    a.ev("TG().kcal") === exp && a.ev("S.settings.waterGoal") === 3500,
    `déficit, fator, piso e água editáveis (${exp} kcal)`
  );
  a.ev("render()");
  a.q("#psex").value = "F";
  a.click("[data-act=profile-save]");
  T.ok(
    a.ev("S.profile.sex") === "F" && a.ev("TG().tmb") === Math.round(10 * 140 + 6.25 * 179 - 5 * 24 - 161),
    "Ajustes: trocar o sexo recalcula a TMB"
  );
  a.q("#pa").value = "5";
  a.click("[data-act=profile-save]");
  T.ok(a.ev("S.profile.age") === 24, "idade inválida é recusada");
  const other = a.ev("Object.keys(R.profiles).find(id => id !== 'p1')");
  a.ev(`ACT['profile-del']({dataset:{id:'${other}'}})`);
  T.ok(
    a.ev("Object.keys(R.profiles).length") === 1 && a.ev("S.profile.name") === "Hobert",
    "excluir perfil (com confirmação)"
  );
  T.ok(a.ev("profileDelete('p1')") === false, "não exclui o último perfil");
  T.ok(!a.errors.length, "sem erros de script");
  a.close();
  // regressão: instalação nova sem dados tinha metas NaN (perfil padrão sobrescrito na mescla)
  const b = await boot({});
  T.ok(
    b.ev("TG().kcal") > 1000 && b.ev("S.profile.height") === 179 && !/NaN/.test(b.q("#view").textContent),
    "instalação nova: metas calculadas, sem NaN"
  );
  b.ev("R.wall = 'aurora'; save()");
  T.ok(b.ev("mergeRoot(JSON.parse(JSON.stringify(R))).wall") === "aurora", "papel de parede sobrevive ao recarregar");
  // instalação nova não traz dados de outra pessoa e pede os dados nas boas-vindas
  T.ok(
    b.q("#sheet").classList.contains("on") && /Bem-vindo/.test(b.q("#sheet").textContent),
    "instalação nova abre as boas-vindas"
  );
  T.ok(
    b.ev("S.profile.name") === "Você" && !b.ev("S.profile.avatar") && !/Hobert/.test(b.q("#top").textContent),
    "sem nome nem foto de outra pessoa"
  );
  T.ok(
    b.ev("S.meds.length") === 0 &&
      !b.ev("S.sched.items.some(x => x.type === 'remedio')") &&
      b.ev("candidates()[0].id") === "setup",
    "sem remédio cadastrado; card Agora pede para completar o perfil"
  );
  b.q("#nn").value = "Ana";
  b.q("#nsx").value = "F";
  b.q("#ns").value = "80";
  b.q("#ng").value = "65";
  b.q("#nh").value = "165";
  b.q("#na").value = "40";
  b.click("[data-act=welcome-save]");
  T.ok(
    b.ev("S.profile.name") === "Ana" &&
      b.ev("S.profile.sex") === "F" &&
      !b.ev("S.profile.todo") &&
      b.ev("S.settings.calcWeight") === 80 &&
      !b.q("#sheet").classList.contains("on"),
    "boas-vindas salvam os dados e fecham"
  );
  T.ok(
    /Ana/.test(b.q("#top").textContent) && !b.ev("candidates().some(c => c.id === 'setup')"),
    "cabeçalho com o nome e sem pedido de perfil"
  );
  b.ev("go('treino')");
  T.ok(
    /Seg a sex às 05:00, na sequência/.test(b.q("#view").textContent),
    "Treino mostra os dias e o horário da agenda"
  );
  b.ev("schedEdit(today(), S.sched.items.find(x => x.type === 'treino').id, { at: '18:30' }, true); render()");
  T.ok(/às 18:30, na sequência/.test(b.q("#view").textContent), "mudar o horário na agenda muda o texto do Treino");
  b.ev("S.settings.painAsk = false; summarySheet('A', [])");
  b.click("[data-act=sum-next]");
  T.ok(!b.q("#sheet").classList.contains("on"), "pergunta de dor no ombro pode ser desligada");
  T.ok(!b.errors.length, "sem erros de script " + (b.errors[0] || ""));
  b.close();
};
