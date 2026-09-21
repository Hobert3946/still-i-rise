// Abre o app, percorre todas as abas e confere que nada quebra nem mostra lixo (undefined, NaN).
const fs = require("fs"), path = require("path");
const { boot, baseState } = require("./helpers");
const SRC = path.join(__dirname, "..", "src");
module.exports = async T => {
  const a = await boot({ state: baseState() });
  T.ok(a.errors.length === 0, "abre sem erro de script " + (a.errors[0] || ""));
  for (const tab of ["deck", "treino", "agua", "comer", "evol", "ia", "mais", "deck"]) {
    a.ev(`go("${tab}")`);
    const txt = a.q("#v-" + tab).textContent;
    T.ok(txt.trim().length > 20 && !/undefined|NaN|\[object/.test(txt), `aba ${tab} renderiza sem lixo`);
  }
  T.ok(a.errors.length === 0, "nenhum erro de script após percorrer as abas " + (a.errors[0] || ""));

  // toda ação data-act escrita no código tem um tratador (ACT ou case do switch principal)
  const files = fs.readdirSync(SRC).filter(f => /\.(js|html)$/.test(f));
  const used = new Set(), handled = new Set(a.ev("Object.keys(ACT)"));
  for (const f of files) {
    const t = fs.readFileSync(path.join(SRC, f), "utf8");
    for (const m of t.matchAll(/data-act="([a-z0-9-]+)"/g)) used.add(m[1]);
    if (f === "app.js") for (const m of t.matchAll(/case "([a-z0-9-]+)"/g)) handled.add(m[1]);
  }
  const missing = [...used].filter(x => !handled.has(x));
  T.ok(!missing.length, "toda ação data-act tem tratador" + (missing.length ? ": faltam " + missing.join(", ") : ""));

  // um único ouvinte de clique no documento (os módulos usam ACT)
  const n = fs.readdirSync(SRC).filter(f => f.endsWith(".js")).reduce((c, f) => c + (fs.readFileSync(path.join(SRC, f), "utf8").match(/document\.addEventListener\("click"/g) || []).length, 0);
  T.ok(n === 1, `um único ouvinte de clique no documento (achou ${n})`);
  const defs = fs.readFileSync(path.join(SRC, "app.js"), "utf8") + fs.readdirSync(SRC).filter(f => f.endsWith(".js") && f !== "app.js").map(f => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n");
  for (const fn of ["rDeck", "rComer", "rTreino", "rAgua", "rIA", "rEvol", "rMais"]) T.ok((defs.match(new RegExp("^function " + fn + "[(]", "gm")) || []).length === 1, `${fn} é definida uma única vez`);
  a.close();
};
