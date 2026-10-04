// CSP: só os scripts do próprio arquivo rodam (hash) e a rede só fala com os serviços que o app usa.
const fs = require("fs"),
  path = require("path"),
  crypto = require("crypto");
const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const html = fs.readFileSync(path.join(__dirname, "..", "docs", "index.html"), "utf8");
  const meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/),
    csp = meta ? meta[1] : "";
  const dir = n =>
    (
      csp
        .split(";")
        .map(s => s.trim())
        .find(s => s.startsWith(n + " ")) || ""
    )
      .split(/\s+/)
      .slice(1);
  T.ok(!!meta && html.indexOf(meta[0]) < html.indexOf("<script"), "CSP no topo da página, antes de qualquer script");
  const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
    m => `'sha256-${crypto.createHash("sha256").update(m[1], "utf8").digest("base64")}'`
  );
  T.ok(
    hashes.length >= 2 && hashes.every(h => dir("script-src").includes(h)),
    `cada script embutido tem seu hash na CSP (${hashes.length})`
  );
  T.ok(
    !dir("script-src").includes("'unsafe-inline'") && !dir("script-src").includes("'unsafe-eval'"),
    "sem 'unsafe-inline' nem 'unsafe-eval' para scripts"
  );
  const src = ["svc/ia.js", "svc/nuvem.js", "ui/hero.js"]
    .map(f => fs.readFileSync(path.join(__dirname, "..", "src", f), "utf8"))
    .join("\n");
  const hosts = [
    ...new Set(
      [...src.matchAll(/fetch\([^)]*?"(https:\/\/[^/"]+)|(?:GEM_URL|GH_API) = "(https:\/\/[^/"]+)/g)].map(
        m => m[1] || m[2]
      )
    )
  ];
  T.ok(
    hosts.length >= 3 && hosts.every(h => dir("connect-src").includes(h)),
    "connect-src cobre os serviços usados: " + hosts.join(", ")
  );
  T.ok(
    dir("object-src").includes("'none'") && dir("base-uri").includes("'none'"),
    "sem plugins e sem trocar a base dos links"
  );
  const a = await boot({ v1: baseState() });
  await a.ev("IDB.open().catch(() => 0)");
  await a.wait(10);
  T.ok(a.ev("IDB.db") === null, "IndexedDB indisponível: a conexão falha sem ficar presa (tenta de novo depois)");
  a.close();
};
