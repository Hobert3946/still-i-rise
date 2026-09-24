// Visual: paleta de cor e fonte por aparelho, reagindo a claro/escuro.
const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() }), st = () => a.w.document.documentElement.style;
  a.ev("openPage('ajustes')");
  T.ok(a.qa("[data-act=look-pal]").length === 12 && a.qa("[data-act=look-font]").length === 5, "12 paletas e 5 fontes");
  T.ok(st().getPropertyValue("--accent") === "", "padrão não sobrescreve os tokens");
  a.click('[data-act=look-pal][data-v="ouro"]'); a.ev("R.theme='dark'; applyTheme()");
  T.ok(a.ev("R.accent") === "ouro" && st().getPropertyValue("--accent") === "#D4AF6A", "ouro no escuro");
  a.ev("R.theme='light'; applyTheme()");
  T.ok(st().getPropertyValue("--accent") === "#9C7328", "ouro troca de tom no claro");
  a.click('[data-act=look-font][data-v="elegante"]');
  T.ok(/Fraunces/.test(st().getPropertyValue("--f-display")) && a.q("#font-elegante"), "fonte aplicada e carregada uma vez");
  a.click('[data-act=look-pal][data-v="padrao"]'); a.click('[data-act=look-font][data-v="padrao"]');
  T.ok(st().getPropertyValue("--accent") === "" && st().getPropertyValue("--f-display") === "", "voltar ao padrão limpa tudo");
  T.ok(a.ev("mergeRoot({profiles:{},accent:'bordo',font:'moderna'}).accent") === "bordo", "escolha sobrevive à normalização");
  T.ok(!a.errors.length, "sem erros de script"); a.close();
};
