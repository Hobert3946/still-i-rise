// Segredos nunca saem do aparelho; a nuvem (gist) e a importação preservam os locais.
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const st = baseState(); st.settings.gemKey = "AIza-SEGREDO-1"; st.settings.ghToken = "ghp_SEGREDO_2"; st.settings.ghGistId = "abc123";
  st.days[keyOf(0)] = { h: {}, s: {}, water: 1200, meals: [] };
  const calls = [];
  const fetchMock = async (url, o = {}) => {
    calls.push({ url, o });
    if (url.includes("/gists/abc123") && (!o.method || o.method === "GET")) return { ok: true, json: async () => ({ files: { "still-i-rise.json": { content: JSON.stringify(Object.assign(baseState(), { weights: [{ d: keyOf(-1), kg: 120, waist: 100 }] })) } } }) };
    return { ok: true, json: async () => ({ id: "novoid" }) };
  };
  const a = await boot({ state: st, fetch: fetchMock });
  T.ok(!/SEGREDO|ghp_|AIza|abc123/.test(JSON.stringify(a.ev("safeState()"))), "safeState (backup e nuvem) não contém chave do Gemini, token nem gist id");
  a.ev("exportData()");
  const txt = await new Promise(r => { const fr = new a.w.FileReader(); fr.onload = () => r(fr.result); fr.readAsText(a.w.__blob); });
  T.ok(!/SEGREDO|ghp_|AIza/.test(txt) && /"waterGoal"/.test(txt), "arquivo exportado não vaza segredos e mantém os dados");
  await a.ev("syncToCloud(true)");
  const patch = calls.find(c => c.o.method === "PATCH"); T.ok(patch && /gists\/abc123/.test(patch.url), "com gist id, envia PATCH para o gist");
  T.ok(patch && patch.o.headers.Authorization === "Bearer ghp_SEGREDO_2" && !/SEGREDO|AIza/.test(patch.o.body), "token só vai no cabeçalho, nunca no conteúdo do gist");
  a.ev('S.settings.ghGistId = ""'); await a.ev("syncToCloud(true)");
  const post = calls.find(c => c.o.method === "POST"); T.ok(post && JSON.parse(post.o.body).public === false && a.ev("S.settings.ghGistId") === "novoid", "sem gist id, cria gist não listado e guarda o id");
  a.ev('S.settings.ghGistId = "abc123"'); await a.ev("syncFromCloud()"); await a.wait(50);
  T.ok(a.ev("S.weights[0].kg") === 120, "restaurar da nuvem traz os dados");
  T.ok(a.ev("S.settings.gemKey") === "AIza-SEGREDO-1" && a.ev("S.settings.ghToken") === "ghp_SEGREDO_2", "restaurar preserva as chaves locais");
  T.ok(!a.errors.length, "sem erros de script"); a.close();
};
