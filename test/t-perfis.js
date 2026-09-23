// Perfis: criar, trocar, editar metas, excluir; dados isolados entre perfis.
const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() });
  a.ev("waterAdd(500)");
  a.click(".who"); T.ok(/Hobert/.test(a.q("#page").textContent) && /Perfis/.test(a.q("#page").textContent), "avatar abre Perfil e ajustes com a lista de perfis");
  a.click("#page [data-act=profile-new]");
  a.q("#nn").value = "Mãe"; a.q("#ns").value = "90"; a.q("#ng").value = "75"; a.q("#nh").value = "160"; a.q("#na").value = "55";
  a.click("[data-act=profile-create]"); await a.wait(30);
  T.ok(a.ev("S.profile.name") === "Mãe" && a.ev("Object.keys(R.profiles).length") === 2, "cria e entra no novo perfil");
  T.ok(a.ev("D(today()).water") === 0 && a.ev("S.weights.length") === 0 && a.ev("S.habits.length") === 6, "novo perfil começa vazio, com hábitos padrão");
  T.ok(a.ev("TG().kcal") === 1800 && a.ev("TG().prot") === 110, "metas calculadas para os dados dela (piso 1.800, 1,2 g/kg)");
  T.ok(/Mãe/.test(a.q("#top").textContent), "header mostra o perfil ativo");
  a.ev("waterAdd(300)");
  a.ev("switchProfile('p1')"); T.ok(a.ev("S.profile.name") === "Hobert" && a.ev("D(today()).water") === 500, "trocar de volta traz a água do Hobert (500), não a da Mãe");
  // editar metas parametrizáveis
  a.ev("UI.openFold = 'metas'; openPage('ajustes')");
  a.q("#pdef").value = "500"; a.q("#pact").value = "1,55"; a.q("#pfloor").value = "2000"; a.q("#pwater").value = "3500";
  a.click("[data-act=profile-save]");
  const exp = Math.max(2000, Math.round(((10 * 140 + 6.25 * 179 - 5 * 24 + 5) * 1.55 - 500) / 50) * 50);
  T.ok(a.ev("TG().kcal") === exp && a.ev("S.settings.waterGoal") === 3500, `déficit, fator, piso e água editáveis (${exp} kcal)`);
  a.q("#pa").value = "5"; a.click("[data-act=profile-save]"); T.ok(a.ev("S.profile.age") === 24, "idade inválida é recusada");
  const other = a.ev("Object.keys(R.profiles).find(id => id !== 'p1')");
  a.ev(`ACT['profile-del']({dataset:{id:'${other}'}})`);
  T.ok(a.ev("Object.keys(R.profiles).length") === 1 && a.ev("S.profile.name") === "Hobert", "excluir perfil (com confirmação)");
  T.ok(a.ev("profileDelete('p1')") === false, "não exclui o último perfil");
  T.ok(!a.errors.length, "sem erros de script"); a.close();
  // regressão: instalação nova sem dados tinha metas NaN (perfil padrão sobrescrito na mescla)
  const b = await boot({}); T.ok(b.ev("TG().kcal") > 1000 && b.ev("S.profile.height") === 179 && !/NaN/.test(b.q("#view").textContent), "instalação nova: metas calculadas, sem NaN");
  b.ev("R.wall = 'aurora'; save()"); T.ok(b.ev("mergeRoot(JSON.parse(JSON.stringify(R))).wall") === "aurora", "papel de parede sobrevive ao recarregar"); b.close();
};
