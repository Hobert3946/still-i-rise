// Portão de qualidade: build + docs em dia + todos os testes. Use: npm test
const { execSync } = require("child_process"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const { T } = require("./helpers");

(async () => {
  execSync("node build.js", { cwd: root, stdio: "ignore" });
  let stale = false;
  try { execSync("git diff --quiet HEAD -- docs", { cwd: root }); } catch (e) { stale = true; }
  console.log("== docs");
  if (process.argv.includes("--strict")) T.ok(!stale, "docs/ commitado é igual ao que o build gera (se falhar: rode npm run build e faça commit de docs/)");
  else if (stale) console.log("  aviso: docs/ tem mudanças não commitadas (o push exige commit)");
  const files = fs.readdirSync(__dirname).filter(f => /^t-.*\.js$/.test(f)).sort();
  for (const f of files) {
    console.log("== " + f.replace(/^t-|\.js$/g, ""));
    try { await require("./" + f)(T); } catch (e) { T.ok(false, "exceção em " + f + ": " + (e.stack || e).toString().split("\n").slice(0, 3).join(" | ")); }
  }
  console.log(`\n${T.total - T.fails}/${T.total} verificações passaram.`);
  process.exit(T.fails ? 1 : 0);
})();
