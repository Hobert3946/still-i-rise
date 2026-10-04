// Atualização automática: versão gerada no build, procura sozinha e recarrega só na hora segura.
const fs = require("fs"),
  path = require("path");
const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const sw = fs.readFileSync(path.join(__dirname, "..", "docs", "sw.js"), "utf8");
  const a = await boot({ v1: baseState() }),
    ev = a.ev;
  const build = ev("APP_BUILD");
  T.ok(
    /^[0-9a-f]{8}$/.test(build) && sw.includes(`const V = "sir-${build}"`),
    `versão do build gerada sozinha e igual na página e no service worker (${build})`
  );
  T.ok(
    /cache: "reload"/.test(sw) && /cache: "no-cache"/.test(sw),
    "service worker ignora o cache HTTP velho (instalação e página)"
  );
  ev("UPD.reload = () => { window.__recarregou = (window.__recarregou || 0) + 1; }");
  // com painel aberto ou digitando: espera
  ev("UPD.ready = true; alignSheet(); updApply()");
  T.ok(!ev("window.__recarregou"), "com um painel aberto, não recarrega no meio do uso");
  ev("closeAll()");
  await a.wait(20);
  ev("openPage('coach')");
  ev("closeAll()");
  await a.wait(20);
  ev("go('nutri', 'agua')");
  a.q("#wcust").focus();
  ev("updApply()");
  T.ok(!ev("window.__recarregou"), "com alguém digitando, não recarrega");
  a.q("#wcust").blur();
  ev("tick()");
  T.ok(
    ev("window.__recarregou") === 1 && a.w.localStorage.getItem("sir_upd") === "1",
    "na hora segura (o relógio de 1 min confere), recarrega sozinho"
  );
  // em segundo plano é seguro mesmo com painel aberto
  ev("UPD.ready = true; alignSheet()");
  Object.defineProperty(a.d, "hidden", { value: true, configurable: true });
  a.d.dispatchEvent(new a.w.Event("visibilitychange"));
  T.ok(ev("window.__recarregou") === 2, "app em segundo plano: atualiza sem atrapalhar");
  // trava contra repetição
  Object.defineProperty(a.d, "hidden", { value: false, configurable: true });
  ev("closeAll()");
  await a.wait(20);
  ev("UPD.ready = true; updApply(); UPD.ready = true; updApply()");
  T.ok(ev("window.__recarregou") === 3, "no máximo 3 recargas em 5 minutos");
  T.ok(
    /Versão \d+\.\d+\.\d+ · [0-9a-f]{8}/.test((ev("openPage('ajustes')"), a.q("#page").textContent)) &&
      a.q("[data-act=upd-check]"),
    "Ajustes mostra a versão com o build e o botão de procurar atualização"
  );
  a.close();
  // depois de recarregar: avisa que atualizou (uma vez)
  const b = await boot({ v1: baseState(), ls: { sir_upd: "1" } });
  T.ok(
    /App atualizado: versão/.test(b.q("#toast").textContent) && !b.w.localStorage.getItem("sir_upd"),
    "ao abrir a versão nova, avisa que atualizou"
  );
  T.ok(!a.errors.length && !b.errors.length, "sem erros de script " + (a.errors[0] || b.errors[0] || ""));
  b.close();
};
