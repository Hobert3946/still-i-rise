/* ============ ESTADO: perfis, migração do v1 e persistência em 3 camadas ============ */
// Camada 1: localStorage (sir_v2). Camada 2: espelho em IndexedDB. Camada 3: arquivo .json exportado (svc/backup.js).
// R = raiz com todos os perfis. S = perfil ativo (mesmo formato do v1 + habits + supps).
// Segredos (chave do Gemini, token e gist do GitHub) ficam em SEC, numa chave própria, fora do estado e de todo backup.
const KEY = "sir_v2", KEY_V1 = "sir_v1", KEY_SEC = "sir_secrets", SECRET_KEYS = ["gemKey", "ghToken", "ghGistId"];
let R = null, S = null, SEC = { gemKey: "", ghToken: "", ghGistId: "" };

const baseSettings = () => ({
  start: today(), logMode: "set", rotate: true, rotateWeeks: 4, lastBackup: null, notif: false, calcWeight: 140, waterGoal: 3000,
  deficit: 1000, activity: 1.375, floor: 1800, rule1: "acucar", needOthers: 2, gemModel: "", gemAck: false
});
const rawProfile = (name, p = {}) => ({
  id: uid("p"), profile: Object.assign({ name, startWeight: 140, goal: 105, height: 179, age: 24, avatar: false }, p),
  weights: [], days: {}, logs: {}, sel: {}, pain: [], neck: [], cur: null, chat: [], favs: {},
  habits: defHabits(), supps: defSupps(), settings: baseSettings()
});
const newProfile = (name, p) => upgradeProfile(rawProfile(name, p));
// v3: remédios saem da lista de suplementos (com o histórico), horários fixos viram rotina editável
function medsFromSupps(p) {
  p.meds = [];
  p.supps.filter(s => s.type === "M").forEach(s => p.meds.push({ id: s.id, n: s.n, dose: "", withMeal: /refei/i.test(s.tip), doctor: "", start: "", notes: s.tip, times: [s.at || "12:00"] }));
  p.supps = p.supps.filter(s => s.type !== "M");
}
function upgradeProfile(p) {
  if (!Array.isArray(p.meds)) medsFromSupps(p);
  if (!p.sched || !Array.isArray(p.sched.items)) {
    p.sched = defaultSched(p);
    p.meds.forEach(m => { const it = p.sched.items.find(x => x.type === "remedio" && x.ref === m.id); if (!it) return;
      Object.values(p.days).forEach(d => { if (d.s && d.s[m.id]) { d.med = d.med || {}; d.med[it.id] = "—"; } }); });
  }
  p.meds.forEach(m => delete m.times);
  ["hunger", "questions", "photos", "goals"].forEach(k => { if (!Array.isArray(p[k])) p[k] = []; });
  return p;
}
function mergeProfile(o) {
  const d = rawProfile("Hobert"), s = Object.assign(d, o || {});
  s.profile = Object.assign(d.profile, (o || {}).profile);
  s.settings = Object.assign(baseSettings(), (o || {}).settings);
  if (!Array.isArray(s.habits) || !s.habits.length) s.habits = defHabits();
  if (!Array.isArray(s.supps)) s.supps = defSupps();
  if (!s.habits.some(h => h.id === s.settings.rule1)) s.settings.rule1 = s.habits[0].id;
  if (!(o && o.settings && o.settings.calcWeight)) s.settings.calcWeight = s.profile.startWeight;
  SECRET_KEYS.forEach(k => delete s.settings[k]);
  return upgradeProfile(s);
}
// v1 (um perfil só, segredos dentro de settings) → v2
function migrateV1(o, keepSecrets = true) {
  const st = o.settings || {};
  if (keepSecrets) SECRET_KEYS.forEach(k => { if (st[k] && !SEC[k]) SEC[k] = st[k]; });
  const p = mergeProfile(o); p.id = "p1"; p.profile.avatar = true;
  return { v: 2, active: "p1", theme: st.theme || "auto", profiles: { p1: p } };
}
function mergeRoot(o) {
  const r = { v: 2, active: o.active, theme: o.theme || "auto", profiles: {} };
  Object.entries(o.profiles || {}).forEach(([id, p]) => { r.profiles[id] = mergeProfile(p); r.profiles[id].id = id; });
  if (!Object.keys(r.profiles).length) { const p = newProfile("Hobert"); p.id = "p1"; r.profiles.p1 = p; }
  if (!r.profiles[r.active]) r.active = Object.keys(r.profiles)[0];
  return r;
}
const rootFrom = o => o && o.v === 2 && o.profiles ? mergeRoot(o) : o && o.profile && o.days ? migrateV1(o) : null;
const useProfile = id => { R.active = id; S = R.profiles[id]; };

const IDB = {
  // v2 do banco: "kv" (espelho do estado) + "photos" (fotos de progresso, só no aparelho)
  open() { return new Promise((res, rej) => { const r = indexedDB.open("sir-db", 2); r.onupgradeneeded = () => ["kv", "photos"].forEach(n => { if (!r.result.objectStoreNames.contains(n)) r.result.createObjectStore(n); }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async put(v, k = "state2") { try { const db = await this.open(); db.transaction("kv", "readwrite").objectStore("kv").put(v, k); } catch (e) { } },
  async get(k = "state2") { try { const db = await this.open(); return await new Promise(res => { const q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); } catch (e) { return null; } }
};
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const parse = raw => { try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };
let idbTimer = null;
function save() {
  const j = JSON.stringify(R);
  try { localStorage.setItem(KEY, j); } catch (e) { }
  clearTimeout(idbTimer); idbTimer = setTimeout(() => IDB.put(j), 300);
  if (typeof cloudQueue === "function") cloudQueue();
}
function saveSec() { try { localStorage.setItem(KEY_SEC, JSON.stringify(SEC)); } catch (e) { } }
// ordem: v2 local → v2 IndexedDB → v1 local → v1 IndexedDB → perfil novo. A chave sir_v1 nunca é apagada (rollback).
async function loadState() {
  SEC = Object.assign({ gemKey: "", ghToken: "", ghGistId: "" }, parse(lsGet(KEY_SEC)));
  const tries = [() => lsGet(KEY), () => IDB.get("state2"), () => lsGet(KEY_V1), () => IDB.get("state")];
  for (const t of tries) { R = rootFrom(parse(await t())); if (R) break; }
  if (!R) R = migrateV1({ profile: { name: "Hobert" }, days: {} }, false);
  useProfile(R.active); saveSec(); save();
}
function profileCreate(name, base) {
  const p = newProfile(name, base); R.profiles[p.id] = p; useProfile(p.id); save(); return p;
}
function profileDelete(id) {
  if (Object.keys(R.profiles).length < 2 || !R.profiles[id]) return false;
  delete R.profiles[id]; if (R.active === id) useProfile(Object.keys(R.profiles)[0]); save(); return true;
}
