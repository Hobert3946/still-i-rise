// No celular, backup sai pelo menu de compartilhar (WhatsApp, Drive); sem suporte, baixa o arquivo.
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const a = await boot({
      v1: baseState({ settings: Object.assign(baseState().settings, { lastBackup: keyOf(-30) }) })
    }),
    ev = a.ev;
  ev("UI.openFold = 'backup'; openPage('ajustes')");
  T.ok(
    !a.q("[data-act=export][data-m=share]") && /Exportar/.test(a.q("[data-act=export][data-m=file]").textContent),
    "sem suporte a compartilhar: só Exportar (baixa)"
  );
  // navegador que compartilha arquivos (Safari do iPhone)
  ev("navigator.canShare = () => true; navigator.share = async d => { window.__shared = d.files[0].name; }; render()");
  T.ok(
    !!a.q("[data-act=export][data-m=share]") &&
      /Baixar arquivo/.test(a.q("[data-act=export][data-m=file]").textContent),
    "com suporte: Compartilhar backup em destaque e Baixar como alternativa"
  );
  a.click("[data-act=export][data-m=share]");
  await a.wait(30);
  T.ok(
    ev("window.__shared") === `still-i-rise-backup-${keyOf(0)}.json` && ev("S.settings.lastBackup") === keyOf(0),
    "compartilhar entrega o arquivo e conta como backup"
  );
  // fechar o menu sem escolher não conta como backup
  ev(
    "S.settings.lastBackup = addDays(today(), -30); navigator.share = async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; }"
  );
  a.click("[data-act=export][data-m=share]");
  await a.wait(30);
  T.ok(ev("S.settings.lastBackup") === keyOf(-30), "fechar o menu de compartilhar não marca backup");
  // erro no compartilhar: cai para o download
  ev("navigator.share = async () => { throw new Error('falhou'); }; window.__dl = ''");
  a.click("[data-act=export][data-m=share]");
  await a.wait(30);
  T.ok(a.w.__dl === `still-i-rise-backup-${keyOf(0)}.json`, "se compartilhar falhar, baixa o arquivo");
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || ""));
  a.close();
};
