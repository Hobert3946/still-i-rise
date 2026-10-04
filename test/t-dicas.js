// Dicas de uso: aparecem até "Entendi", ficam guardadas no aparelho e voltam por Ajustes.
const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() }),
    ev = a.ev;
  ev("go('saude', 'corpo')");
  T.ok(
    a.qa("#view .hint").length >= 3 && /Pesagem semanal/.test(a.q("#view").textContent),
    "Corpo mostra as dicas na primeira vez"
  );
  a.click("#view .hint-x[data-id=pesagem]");
  T.ok(
    !/Pesagem semanal/.test(a.q("#view").textContent) && ev("R.ui.hints.pesagem") === true,
    "Entendi esconde a dica"
  );
  T.ok(
    ev("mergeRoot(JSON.parse(localStorage.getItem('sir_v2'))).ui.hints.pesagem") === true,
    "a escolha sobrevive a reabrir o app"
  );
  ev("go('nutri', 'refeicoes'); UI.openMeal = 'Almoço'; render()");
  T.ok(
    a.q("#view .hint.tip") && /Segure/.test(a.q("#view .hint.tip").textContent),
    "teclado de alimentos explica os gestos"
  );
  a.click("#view .hint-x[data-id=teclado]");
  T.ok(!a.q("#view .hint-x[data-id=teclado]"), "dica de gesto some depois de lida");
  ev("openPage('ajustes')");
  a.click("[data-act=hints-reset]");
  T.ok(ev("Object.keys(R.ui.hints).length") === 0, "Ajustes: mostrar as dicas de novo");
  ev("closeAll()");
  await a.wait(20);
  ev("go('saude', 'remedios')");
  T.ok(
    /não sugere, não calcula e não altera doses/.test(a.q("#view").textContent) && !a.q("#view .hint"),
    "aviso de saúde dos remédios não é dica: fica sempre"
  );
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || ""));
  a.close();
};
