/* ============ NUVEM: cópia dos dados em um gist secreto do GitHub + estado sem segredos ============ */
// Gist "secreto" NÃO é privado: quem tiver o link consegue ler. Os dados de saúde vão para lá.
const GIST_FILE = "still-i-rise.json", SECRETS = ["gemKey", "ghToken"];
function safeState() {
  const c = JSON.parse(JSON.stringify(S)); SECRETS.forEach(k => delete c.settings[k]); delete c.settings.ghGistId; return c;
}
const ghHead = () => ({ Authorization: "Bearer " + S.settings.ghToken, Accept: "application/vnd.github+json", "Content-Type": "application/json" });
let cloudT = null;
function cloudQueue() { if (!S || !S.settings.ghToken || !S.settings.ghGistId) return; clearTimeout(cloudT); cloudT = setTimeout(() => syncToCloud(false), 8000); }
async function syncToCloud(manual) {
  if (!S.settings.ghToken) return manual && toast("Cole o token do GitHub primeiro.");
  const body = { description: "Still I Rise: cópia dos dados", files: { [GIST_FILE]: { content: JSON.stringify(safeState()) } } };
  try {
    let r;
    if (S.settings.ghGistId) r = await fetch("https://api.github.com/gists/" + encodeURIComponent(S.settings.ghGistId), { method: "PATCH", headers: ghHead(), body: JSON.stringify(body) });
    else r = await fetch("https://api.github.com/gists", { method: "POST", headers: ghHead(), body: JSON.stringify({ ...body, public: false }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.message || r.status);
    if (!S.settings.ghGistId) { S.settings.ghGistId = j.id; save(); if (UI.tab === "mais") rMais(); }
    S.settings.cloudAt = Date.now(); localStorage.setItem(KEY, JSON.stringify(S));
    if (manual) toast("Dados enviados para a nuvem.");
  } catch (e) { if (manual) toast("Falha ao enviar: " + e.message); }
}
async function syncFromCloud() {
  if (!S.settings.ghToken || !S.settings.ghGistId) return toast("Informe o token e o Gist ID.");
  try {
    const r = await fetch("https://api.github.com/gists/" + encodeURIComponent(S.settings.ghGistId), { headers: ghHead() }), j = await r.json();
    if (!r.ok) throw new Error(j.message || r.status);
    const f = j.files && j.files[GIST_FILE]; if (!f) throw new Error("arquivo não encontrado no gist");
    const o = JSON.parse(f.truncated ? await (await fetch(f.raw_url)).text() : f.content);
    if (!o || !o.profile || !o.days) throw new Error("dados inválidos");
    if (!confirm("Substituir os dados deste aparelho pela cópia da nuvem?")) return;
    const keep = {}; SECRETS.concat("ghGistId").forEach(k => keep[k] = S.settings[k]);
    S = mergeDefaults(o); Object.assign(S.settings, keep); save(); applyTheme(); go("deck"); toast("Dados restaurados da nuvem.");
  } catch (e) { toast("Falha ao baixar: " + e.message); }
}
