/* ============ NUVEM: cópia automática em um gist secreto do GitHub ============ */
// Gist "secreto" NÃO é privado: quem tiver o link consegue ler. Os dados de saúde vão para lá.
// Token e gist id ficam só em SEC (este aparelho). A cópia leva todos os perfis via safeState().
const GIST_FILE = "still-i-rise.json";
const ghHead = () => ({ Authorization: "Bearer " + SEC.ghToken, Accept: "application/vnd.github+json", "Content-Type": "application/json" });
let cloudT = null;
function cloudQueue() { if (!R || !SEC.ghToken || !SEC.ghGistId) return; clearTimeout(cloudT); cloudT = setTimeout(() => syncToCloud(false), 8000); }
async function syncToCloud(manual) {
  if (!SEC.ghToken) return manual && toast("Cole o token do GitHub primeiro.");
  const body = { description: "Still I Rise: cópia dos dados", files: { [GIST_FILE]: { content: JSON.stringify(safeState()) } } };
  try {
    const id = SEC.ghGistId, r = await fetch(id ? "https://api.github.com/gists/" + encodeURIComponent(id) : "https://api.github.com/gists",
      { method: id ? "PATCH" : "POST", headers: ghHead(), body: JSON.stringify(id ? body : { ...body, public: false }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.message || r.status);
    if (!SEC.ghGistId) { SEC.ghGistId = j.id; saveSec(); }
    S.settings.cloudAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(R)); } catch (e) { }
    if (manual) { toast("Dados enviados para a nuvem."); render(); }
  } catch (e) { if (manual) toast("Falha ao enviar: " + e.message); }
}
async function syncFromCloud() {
  if (!SEC.ghToken || !SEC.ghGistId) return toast("Informe o token e o Gist ID.");
  try {
    const r = await fetch("https://api.github.com/gists/" + encodeURIComponent(SEC.ghGistId), { headers: ghHead() }), j = await r.json();
    if (!r.ok) throw new Error(j.message || r.status);
    const f = j.files && j.files[GIST_FILE]; if (!f) throw new Error("arquivo não encontrado no gist");
    const o = JSON.parse(f.truncated ? await (await fetch(f.raw_url)).text() : f.content);
    if (!o || !(o.profiles || (o.profile && o.days))) throw new Error("dados inválidos");
    if (!confirm("Substituir os dados deste aparelho pela cópia da nuvem?")) return;
    importObject(o); save(); applyTheme(); closeAll(); render(); toast("Dados restaurados da nuvem.");
  } catch (e) { toast("Falha ao baixar: " + e.message); }
}
ACT["gh-save"] = () => {
  const t = $("#ghToken"), g = $("#ghGistId"), tv = t ? t.value.trim() : "";
  if (tv && tv !== "********") SEC.ghToken = tv; else if (!tv) SEC.ghToken = "";
  SEC.ghGistId = g ? g.value.trim() : ""; saveSec(); toast("Nuvem configurada!"); render();
  if (SEC.ghToken) syncToCloud(true);
};
ACT["gh-sync"] = () => syncFromCloud();
ACT["gh-push"] = () => syncToCloud(true);
