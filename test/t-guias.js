// Passo a passo para quem não é da área: chave do Gemini e token do GitHub com link direto.
const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() }),
    ev = a.ev;
  ev("openPage('coach')");
  const g = a.q("#page a[href^='https://aistudio.google.com/apikey']");
  T.ok(
    g && g.target === "_blank" && /noopener/.test(g.rel) && a.qa("#page ol.steps li").length === 3,
    "Coach sem chave: 3 passos com link para criar a chave"
  );
  ev("closeAll()");
  await a.wait(20);
  ev("UI.openFold = 'nuvem'; openPage('ajustes')");
  const t = a.q("#page a[href*='github.com/settings/tokens/new?scopes=gist']");
  T.ok(
    t && t.target === "_blank" && a.q("#page details[data-fold=nuvem-passos]").open,
    "Nuvem: passo a passo aberto e link do token já com a permissão gist"
  );
  ev("SEC.ghToken = 'x'; closeAll()");
  await a.wait(20);
  ev("UI.openFold = 'nuvem'; openPage('ajustes')");
  T.ok(!a.q("#page details[data-fold=nuvem-passos]").open, "com a nuvem ligada, o passo a passo fica fechado");
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || ""));
  a.close();
};
