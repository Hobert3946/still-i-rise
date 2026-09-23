// Abre o app, percorre rio, paleta, arena e todas as lentes; confere que nada quebra nem mostra lixo (undefined, NaN).
const fs = require("fs"), path = require("path");
const { boot, baseState } = require("./helpers");
const SRC = path.join(__dirname, "..", "src");
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const lixo = t => /undefined|NaN|\[object/.test(t);
module.exports = async T => {
  const a = await boot({ v1: baseState() });
  T.ok(a.errors.length === 0, "abre sem erro de script " + (a.errors[0] || ""));
  const rv = a.q("#river").textContent;
  T.ok(/restam/.test(rv) && /AGORA/.test(rv) && /Regra nº 1/.test(rv) && !lixo(rv), "rio mostra anéis, Regra nº 1, linha AGORA e nada de lixo");
  T.ok(!a.q(".dock") && !a.q("nav[aria-label='Navegação']"), "não existe barra de abas fixa");
  for (const l of ["corpo", "treino", "nutri", "agua", "aura", "sistema"]) {
    a.ev(`openLens("${l}")`); const t = a.q("#lens-body").textContent;
    T.ok(t.trim().length > 200 && !lixo(t), `lente ${l} renderiza sem lixo`);
  }
  a.click("[data-act=lens-close]"); await a.wait(20);
  T.ok(!a.q("#lens").classList.contains("on"), "fechar lente volta ao rio");
  a.click("#orb"); T.ok(a.q("#palette").classList.contains("on") && /Água agora/.test(a.q("#pal-res").textContent), "orbe abre a paleta com atalhos");
  a.click("[data-act=orb-close]"); await a.wait(20);
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
