/* ============ NUVEM: cópia automática em um gist secreto do GitHub ============ */
// Gist "secreto" NÃO é privado: quem tiver o link consegue ler. Com a senha da cópia, o conteúdo vai criptografado (AES-GCM).
// Token, gist id e senha ficam só em SEC (este aparelho). A cópia leva todos os perfis via safeState().
// SEC.ghVer = versão do gist que este aparelho viu por último. Se a nuvem mudou desde então (outro aparelho enviou,
// ou este aparelho nunca baixou dela), nada é enviado: a cópia automática para e o app pergunta qual versão vale.
const GIST_FILE = "still-i-rise.json", GH_API = "https://api.github.com/gists", MASK = "********";
const ghHead = () => ({ Authorization: "Bearer " + SEC.ghToken, Accept: "application/vnd.github+json", "Content-Type": "application/json" });
async function ghFetch(path = "", o = {}) {
  const r = await fetch(GH_API + path, Object.assign({ headers: ghHead() }, o)), j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || r.status);
  return j;
}
const gistPath = () => "/" + encodeURIComponent(SEC.ghGistId);
const gistVer = j => (j && j.history && j.history[0] && j.history[0].version) || "";
// versão mais recente do gist, sem baixar o conteúdo
async function cloudHead() { const c = await ghFetch(gistPath() + "/commits?per_page=1"); return { ver: (c && c[0] && c[0].version) || "", at: c && c[0] && c[0].committed_at }; }
const cloudTrusts = ver => !ver || SEC.ghVer === null || ver === SEC.ghVer;

/* ---- senha da cópia: PBKDF2 (SHA-256) → AES-GCM 256. Sal e vetor vão junto com os dados; a senha nunca sai do aparelho ---- */
const KDF_IT = 250000, CRYPT = { pass: null, salt: null, key: null };
const toB64 = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function cloudKey(pass, salt, it) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: it, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
function needCrypto() { if (!(window.crypto && crypto.subtle)) throw new Error("este navegador não tem criptografia (abra o app pelo endereço https)."); }
async function sealState(txt) {
  if (!SEC.ghPass) return txt;
  needCrypto();
  if (CRYPT.pass !== SEC.ghPass) { CRYPT.salt = crypto.getRandomValues(new Uint8Array(16)); CRYPT.key = await cloudKey(SEC.ghPass, CRYPT.salt, KDF_IT); CRYPT.pass = SEC.ghPass; }
  const iv = crypto.getRandomValues(new Uint8Array(12)), ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, CRYPT.key, new TextEncoder().encode(txt));
  return JSON.stringify({ sir: "aes-gcm-v1", it: KDF_IT, salt: toB64(CRYPT.salt), iv: toB64(iv), data: toB64(new Uint8Array(ct)) });
}
async function openState(txt) {
  const o = JSON.parse(txt); if (!o || o.sir !== "aes-gcm-v1") return o;
  if (!SEC.ghPass) throw new Error("esta cópia está protegida por senha. Preencha a senha da cópia.");
  needCrypto();
  let pt;
  try { pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(o.iv) }, await cloudKey(SEC.ghPass, fromB64(o.salt), o.it), fromB64(o.data)); }
  catch (e) { throw new Error("senha da cópia incorreta."); }
  return JSON.parse(new TextDecoder().decode(pt));
}

/* ---- enviar e baixar ---- */
const CLOUD = { busy: false, again: false, sent: "", head: null };
let cloudT = null;
function cloudQueue() { if (!R || !SEC.ghToken || !SEC.ghGistId || SEC.ghConflict) return; clearTimeout(cloudT); cloudT = setTimeout(() => syncToCloud(false), 8000); }
function cloudConflict(h) { SEC.ghConflict = true; CLOUD.head = h; saveSec(); if (!STACK.includes("arena")) render(); }
// envia os dados; sem force, para (e avisa) se a nuvem mudou desde a última vez que este aparelho a viu
async function syncToCloud(manual, force) {
  if (!SEC.ghToken) return manual && toast("Cole o token do GitHub primeiro.");
  if (CLOUD.busy) { CLOUD.again = true; return; }
  CLOUD.busy = true;
  try {
    const txt = JSON.stringify(safeState());
    if (!manual && !force && txt === CLOUD.sent) return;
    if (SEC.ghGistId && !force) { const h = await cloudHead(); if (!cloudTrusts(h.ver)) { cloudConflict(h); if (manual) conflictSheet(h); return; } }
    const id = SEC.ghGistId, body = { description: "Still I Rise: cópia dos dados", files: { [GIST_FILE]: { content: await sealState(txt) } } };
    const j = await ghFetch(id ? gistPath() : "", { method: id ? "PATCH" : "POST", body: JSON.stringify(id ? body : { ...body, public: false }) });
    if (!id) SEC.ghGistId = j.id;
    SEC.ghVer = gistVer(j) || (await cloudHead()).ver; SEC.ghConflict = false; CLOUD.sent = txt; saveSec();
    S.settings.cloudAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(R)); } catch (e) { }
    if (manual) { toast("Dados enviados para a nuvem."); render(); }
  } catch (e) { if (manual) toast("Falha ao enviar: " + e.message); }
  finally { CLOUD.busy = false; if (CLOUD.again) { CLOUD.again = false; cloudQueue(); } }
}
async function syncFromCloud() {
  readCloudFields();
  if (!SEC.ghToken || !SEC.ghGistId) return toast("Informe o token e o Gist ID.");
  try {
    const j = await ghFetch(gistPath()), f = j.files && j.files[GIST_FILE];
    if (!f) throw new Error("arquivo não encontrado no gist");
    const o = await openState(f.truncated ? await (await fetch(f.raw_url)).text() : f.content);
    if (!o || !(o.profiles || (o.profile && o.days))) throw new Error("dados inválidos");
    if (!confirm("Substituir os dados deste aparelho pela cópia da nuvem?")) return;
    importObject(o); SEC.ghVer = gistVer(j) || (await cloudHead()).ver; SEC.ghConflict = false; CLOUD.sent = JSON.stringify(safeState()); saveSec();
    save(); applyTheme(); closeAll(); render(); toast("Dados restaurados da nuvem.");
  } catch (e) { toast("Falha ao baixar: " + e.message); }
}
// campos da tela → SEC (a máscara ******** mantém o valor guardado; campo vazio apaga)
function readCloudFields() {
  const t = $("#ghToken"), g = $("#ghGistId"), p = $("#ghPass");
  if (t && t.value.trim() !== MASK) SEC.ghToken = t.value.trim();
  if (g && g.value.trim() !== SEC.ghGistId) { SEC.ghGistId = g.value.trim(); SEC.ghVer = ""; SEC.ghConflict = false; }
  if (p && p.value !== MASK) SEC.ghPass = p.value;
  saveSec();
}
// salvar liga este aparelho à nuvem; se o gist já tem dados que este aparelho não viu, pergunta antes de enviar
async function cloudLink() {
  readCloudFields(); render();
  if (!SEC.ghToken) return toast("Nuvem desligada neste aparelho.");
  if (!SEC.ghGistId) return syncToCloud(true, true); // gist novo com os dados deste aparelho
  try { const h = await cloudHead(); if (cloudTrusts(h.ver)) return syncToCloud(true, true); cloudConflict(h); conflictSheet(h); }
  catch (e) { toast("Falha ao conectar: " + e.message); }
}
function conflictSheet(h = CLOUD.head || {}) {
  openSheet(`<h3 class="h3">Qual versão vale?</h3><p class="muted">A cópia na nuvem${h.at ? `, alterada em ${new Date(h.at).toLocaleString("pt-BR")},` : ""} tem dados que este aparelho ainda não baixou: outro aparelho enviou, ou é a primeira vez que este aparelho usa esse gist. Para não apagar nada, a cópia automática parou.</p>
    <button class="btn solid full" data-act="gh-sync">${ic("download")} Baixar da nuvem (substitui este aparelho)</button>
    <button class="btn full" data-act="gh-force">${ic("upload")} Enviar deste aparelho (substitui a nuvem)</button>
    <p class="muted xs">O GitHub guarda as versões anteriores do gist (na página do gist, aba Revisions).</p>`);
}
ACT["gh-save"] = () => cloudLink();
ACT["gh-sync"] = () => syncFromCloud();
ACT["gh-push"] = () => syncToCloud(true);
ACT["gh-force"] = () => { if (!confirm("Substituir a cópia da nuvem pelos dados deste aparelho?")) return; if (STACK.includes("sheet")) closeSheet(); syncToCloud(true, true); };
ACT["cloud-resolve"] = () => conflictSheet();
