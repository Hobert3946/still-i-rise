// Nuvem: aparelho novo baixa antes de enviar, conflito entre aparelhos para a cópia automática, senha criptografa.
const { boot, baseState, keyOf } = require("./helpers");
// gist falso: guarda o conteúdo e a versão, como a API do GitHub
function fakeGist(content) {
  const g = { content, ver: "v1", n: 1, calls: [] };
  g.fetch = async (url, o = {}) => {
    const method = o.method || "GET";
    g.calls.push({ url, method, body: o.body });
    const gist = () => ({
      id: "abc123",
      history: [{ version: g.ver }],
      files: { "still-i-rise.json": { content: g.content } }
    });
    if (/\/commits/.test(url))
      return { ok: true, json: async () => [{ version: g.ver, committed_at: "2026-10-01T12:00:00Z" }] };
    if (method === "PATCH") {
      g.content = JSON.parse(o.body).files["still-i-rise.json"].content;
      g.ver = "v" + ++g.n;
    }
    return { ok: true, json: async () => gist() };
  };
  return g;
}
module.exports = async T => {
  const cloud = baseState({ weights: [{ d: keyOf(-1), kg: 120, waist: 100 }] });
  const g = fakeGist(JSON.stringify(cloud));
  // 1) aparelho novo: salvar token e gist NÃO envia nada; pergunta e baixa
  const a = await boot({ fetch: g.fetch });
  a.ev("UI.openFold = 'nuvem'; openPage('ajustes')");
  a.q("#ghToken").value = "ghp_x";
  a.q("#ghGistId").value = "abc123";
  a.click("[data-act=gh-save]");
  await a.wait(50);
  T.ok(
    !g.calls.some(c => c.method === "PATCH" || c.method === "POST"),
    "aparelho novo: Salvar não sobrescreve a nuvem"
  );
  T.ok(
    a.q("#sheet").classList.contains("on") && /Qual versão vale/.test(a.q("#sheet").textContent),
    "pergunta qual versão vale"
  );
  a.click("#sheet [data-act=gh-sync]");
  await a.wait(50);
  T.ok(
    a.ev("S.weights[0].kg") === 120 && a.ev("SEC.ghVer") === "v1" && !a.ev("SEC.ghConflict"),
    "baixa os dados da nuvem e liga o aparelho"
  );
  // 2) mudança local: envia (a nuvem está na versão que este aparelho viu)
  a.ev("waterAdd(500)");
  await a.ev("syncToCloud(false)");
  T.ok(
    g.calls.filter(c => c.method === "PATCH").length === 1 && a.ev("SEC.ghVer") === "v2",
    "mudança local é enviada e a versão é guardada"
  );
  // 3) outro aparelho envia: este para de enviar e avisa
  g.ver = "v9";
  a.ev("waterAdd(200)");
  await a.ev("syncToCloud(false)");
  T.ok(
    g.calls.filter(c => c.method === "PATCH").length === 1 && a.ev("SEC.ghConflict") === true,
    "nuvem alterada por outro aparelho: não sobrescreve"
  );
  T.ok(a.ev("candidates().some(c => c.id === 'cloud')"), "card Agora avisa que a cópia automática parou");
  a.ev("clearTimeout(cloudT); cloudT = 'parado'; cloudQueue()");
  T.ok(a.ev("cloudT") === "parado", "com conflito, a fila automática não agenda envio");
  a.ev("closeAll()");
  await a.wait(20);
  a.ev("conflictSheet()");
  a.click("#sheet [data-act=gh-force]");
  await a.wait(50);
  T.ok(
    g.calls.filter(c => c.method === "PATCH").length === 2 && !a.ev("SEC.ghConflict") && /"water":700/.test(g.content),
    "escolher 'enviar deste aparelho' sobrescreve de propósito"
  );
  // 4) senha: o conteúdo vai criptografado e só abre com a senha certa
  a.ev("SEC.ghPass = 'senha forte'");
  await a.ev("syncToCloud(true)");
  await a.wait(50);
  T.ok(
    /aes-gcm-v1/.test(g.content) && !/Hobert|"weights"|"water"/.test(g.content),
    "com senha, a nuvem só guarda dados criptografados"
  );
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || ""));
  a.close();
  const b = await boot({ fetch: g.fetch, sec: { ghToken: "ghp_x", ghGistId: "abc123", ghVer: "", ghPass: "errada" } });
  await b.ev("syncFromCloud()");
  await b.wait(50);
  T.ok(
    b.ev("S.weights.length") === 0 && /senha da cópia incorreta/.test(b.q("#toast").textContent),
    "senha errada não restaura nada"
  );
  b.ev("SEC.ghPass = 'senha forte'");
  await b.ev("syncFromCloud()");
  await b.wait(50);
  T.ok(b.ev("S.weights[0].kg") === 120 && b.ev("D(today()).water") === 700, "senha certa restaura em outro aparelho");
  T.ok(!b.errors.length, "sem erros de script " + (b.errors[0] || ""));
  b.close();
  // 5) aparelho ligado antes desta versão (sem ghVer guardado) continua enviando normalmente
  const c = await boot({ v1: baseState(), fetch: g.fetch, sec: { ghToken: "ghp_x", ghGistId: "abc123" } });
  const n = g.calls.filter(x => x.method === "PATCH").length;
  await c.ev("syncToCloud(false)");
  T.ok(
    g.calls.filter(x => x.method === "PATCH").length === n + 1 && !c.ev("SEC.ghConflict"),
    "aparelho já configurado antes da atualização segue enviando"
  );
  c.close();
};
