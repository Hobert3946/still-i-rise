// Abre o app e percorre as 4 seções, as partes, as páginas, o Registrar e a Arena: nada quebra nem mostra lixo.
const fs = require("fs"), path = require("path");
const { boot, baseState } = require("./helpers");
const SRC = path.join(__dirname, "..", "src");
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const lixo = t => /undefined|NaN|\[object/.test(t);
module.exports = async T => {
  const a = await boot({ v1: baseState() });
  T.ok(a.errors.length === 0, "abre sem erro de script " + (a.errors[0] || ""));
  const v = () => a.q("#view").textContent;
  T.ok(/alinhado/.test(v()) && /A seguir/.test(v()) && !lixo(v()), "Hoje: dia alinhado e a seguir");
  T.ok(a.qa("#tabbar .tb").length === 4 && a.q("#tabbar .tb-logo img") && /Registrar/.test(a.q("#tabbar").textContent), "barra: 4 seções com nome + logo no centro");
  T.ok(a.qa("#tabbar .tb").every(b => b.textContent.trim().length > 3), "cada seção da barra tem nome escrito");
  const parts = [["treino"], ["nutri", "refeicoes"], ["nutri", "agua"], ["nutri", "apetite"], ["saude", "corpo"], ["saude", "remedios"], ["saude", "suplementos"], ["saude", "tratamento"], ["hoje"]];
  for (const [t, s] of parts) { a.click(`#tabbar [data-tab=${t}]`); if (s) a.click(`.segbar [data-seg=${s}]`); T.ok(v().trim().length > 150 && !lixo(v()) && a.ev("UI.tab") === t, `${t}${s ? " › " + s : ""} renderiza sem lixo`); }
  for (const p of ["agenda", "coach", "ajustes"]) { a.ev(`openPage("${p}")`); T.ok(a.q("#page").classList.contains("on") && !lixo(a.q("#page-body").textContent) && a.q("#page-body").textContent.length > 150, `página ${p} abre sem lixo`); a.click("[data-act=page-close]"); await a.wait(20); }
  T.ok(!a.q("#page").classList.contains("on"), "voltar fecha a página");
  a.click(".tb-logo"); T.ok(a.q("#actions").classList.contains("on") && a.qa(".act-tile").length === 8 && a.qa(".act-tile").every(t => t.querySelector("b").textContent.length > 3), "logo abre Registrar com 8 ações grandes e com nome");
  a.click("[data-act=act-go][data-k=water]"); a.ev("go('saude','suplementos'); openActions('water')");
  // regressão: a classe de texto "big" (44 px) não pode ir em componentes (nomes de suplementos ficavam gigantes)
  T.ok(!a.qa("[class~=big]").some(e => /(^|\s)(chk|wbtn|chips|btn)(\s|$)/.test(e.className)), "nenhum componente usa a classe de texto 'big'");
  a.click("[data-act=actions-close]"); await a.wait(20);
  a.ev("wkStart('A')"); T.ok(a.q("#arena").classList.contains("on") && /AQUECIMENTO DE MANGUITO/.test(a.q("#arena-in").textContent), "arena abre no aquecimento de manguito (treino A)");
  a.click("[data-act=wk-exit]"); await a.wait(20);
  T.ok(a.errors.length === 0, "nenhum erro de script após percorrer tudo " + (a.errors[0] || ""));
  // toda ação data-act escrita no código tem um tratador em ACT
  const files = walk(SRC).filter(f => /\.(js|html)$/.test(f)), handled = new Set(a.ev("Object.keys(ACT)")), used = new Set();
  for (const f of files) for (const m of fs.readFileSync(f, "utf8").matchAll(/data-(?:act|hold)="([a-z0-9-]+)"/g)) used.add(m[1]);
  const missing = [...used].filter(x => !handled.has(x));
  T.ok(!missing.length, "toda ação data-act tem tratador" + (missing.length ? ": faltam " + missing.join(", ") : ""));
  const js = files.filter(f => f.endsWith(".js")).map(f => fs.readFileSync(f, "utf8"));
  const n = js.reduce((c, t) => c + (t.match(/document\.addEventListener\("click"/g) || []).length, 0);
  T.ok(n === 1, `um único ouvinte de clique no documento (achou ${n})`);
  T.ok(!js.some(t => /onclick=/.test(t)), "nenhum onclick inline");
  const big = files.filter(f => !/foods\.js|plan\.js/.test(f) && fs.readFileSync(f, "utf8").split("\n").length > 250).map(f => path.basename(f));
  T.ok(!big.length, "arquivos com menos de 250 linhas" + (big.length ? ": " + big.join(", ") : ""));
  a.close();
};
