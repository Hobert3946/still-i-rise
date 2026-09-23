// Segredos nunca saem do aparelho; backup .json, importação v1/v2 e nuvem (gist) preservam os segredos locais.
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const st = baseState(); st.days[keyOf(0)] = { h: {}, s: {}, water: 1200, meals: [] };
  const calls = [], cloud = baseState({ weights: [{ d: keyOf(-1), kg: 120, waist: 100 }] });
  const fetchMock = async (url, o = {}) => {
    calls.push({ url, o });
    if (url.includes("/gists/abc123") && (!o.method || o.method === "GET")) return { ok: true, json: async () => ({ files: { "still-i-rise.json": { content: JSON.stringify(cloud) } } }) };
    return { ok: true, json: async () => ({ id: "novoid" }) };
  };
  const a = await boot({ v1: st, sec: { gemKey: "AIza-SEGREDO-1", ghToken: "ghp_SEGREDO_2", ghGistId: "abc123" }, fetch: fetchMock });
  a.ev("S.settings.gemKey = 'AIza-VAZOU'"); // mesmo se algo gravar um segredo no perfil, safeState remove
  T.ok(!/SEGREDO|VAZOU|ghp_|AIza|abc123/.test(JSON.stringify(a.ev("safeState()"))), "safeState não contém chave do Gemini, token nem gist id");
  a.ev("exportData()");
  const txt = await new Promise(r => { const fr = new a.w.FileReader(); fr.onload = () => r(fr.result); fr.readAsText(a.w.__blob); });
  T.ok(!/SEGREDO|VAZOU|ghp_|AIza/.test(txt) && /"waterGoal"/.test(txt) && /"profiles"/.test(txt), "arquivo exportado (todos os perfis) não vaza segredos");
  T.ok(a.w.__dl === `still-i-rise-backup-${keyOf(0)}.json` && a.ev("S.settings.lastBackup") === keyOf(0), "nome do arquivo e data do último backup");
  await a.ev("syncToCloud(true)");
  const patch = calls.find(c => c.o.method === "PATCH"); T.ok(patch && /gists\/abc123/.test(patch.url), "com gist id, envia PATCH");
  T.ok(patch && patch.o.headers.Authorization === "Bearer ghp_SEGREDO_2" && !/SEGREDO|AIza/.test(patch.o.body), "token só no cabeçalho, nunca no conteúdo");
  a.ev('SEC.ghGistId = ""'); await a.ev("syncToCloud(true)");
  const post = calls.find(c => c.o.method === "POST"); T.ok(post && JSON.parse(post.o.body).public === false && a.ev("SEC.ghGistId") === "novoid", "sem gist id, cria gist secreto e guarda o id");
  a.ev('SEC.ghGistId = "abc123"'); await a.ev("syncFromCloud()"); await a.wait(50);
  T.ok(a.ev("S.weights[0].kg") === 120, "restaurar da nuvem (backup v1) traz os dados");
  T.ok(a.ev("SEC.gemKey") === "AIza-SEGREDO-1" && a.ev("SEC.ghToken") === "ghp_SEGREDO_2", "restaurar preserva as chaves locais");
  a.ev("profileCreate('Irmão', {startWeight: 80})"); const v2 = a.ev("JSON.stringify(safeState())");
  a.ev("importObject(JSON.parse(" + JSON.stringify(v2) + "))"); T.ok(a.ev("Object.keys(R.profiles).length") === 2, "importar v2 traz todos os perfis");
  a.ev("S.settings.lastBackup = addDays(today(), -30); render()"); T.ok(/Backup atrasado/.test(a.q("#river").textContent), "alerta de backup com mais de 21 dias");
  T.ok(!a.errors.length, "sem erros de script"); a.close();
};
