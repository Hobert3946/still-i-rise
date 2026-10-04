/* ============ PERSISTÊNCIA: localStorage (camada 1) + espelho em IndexedDB (camada 2) ============ */
const IDB = {
  // v2 do banco: "kv" (espelho do estado) + "photos" (fotos de progresso, só no aparelho)
  // uma conexão só, reaproveitada; se falhar ou o navegador fechar, a próxima chamada abre de novo
  db: null,
  open() {
    if (this.db) return this.db;
    const p = (this.db = new Promise((res, rej) => {
      const r = indexedDB.open("sir-db", 2);
      r.onupgradeneeded = () =>
        ["kv", "photos"].forEach(n => {
          if (!r.result.objectStoreNames.contains(n)) r.result.createObjectStore(n);
        });
      r.onsuccess = () => {
        const db = r.result;
        db.onversionchange = () => {
          db.close();
          if (IDB.db === p) IDB.db = null;
        };
        db.onclose = () => {
          if (IDB.db === p) IDB.db = null;
        };
        res(db);
      };
      r.onerror = () => rej(r.error);
    }));
    p.catch(() => {
      if (IDB.db === p) IDB.db = null;
    });
    return p;
  },
  async put(v, k = "state2") {
    try {
      const db = await this.open();
      db.transaction("kv", "readwrite").objectStore("kv").put(v, k);
    } catch (e) {}
  },
  async get(k = "state2") {
    try {
      const db = await this.open();
      return await new Promise(res => {
        const q = db.transaction("kv").objectStore("kv").get(k);
        q.onsuccess = () => res(q.result);
        q.onerror = () => res(null);
      });
    } catch (e) {
      return null;
    }
  }
};
const lsGet = k => {
  try {
    return localStorage.getItem(k);
  } catch (e) {
    return null;
  }
};
const parse = raw => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};
let idbTimer = null;
function save() {
  const j = JSON.stringify(R);
  try {
    localStorage.setItem(KEY, j);
  } catch (e) {}
  clearTimeout(idbTimer);
  idbTimer = setTimeout(() => IDB.put(j), 300);
  if (typeof cloudQueue === "function") cloudQueue();
}
function saveSec() {
  try {
    localStorage.setItem(KEY_SEC, JSON.stringify(SEC));
  } catch (e) {}
}
// ordem: v2 local → v2 IndexedDB → v1 local → v1 IndexedDB → perfil novo. A chave sir_v1 nunca é apagada (rollback).
async function loadState() {
  const sv = parse(lsGet(KEY_SEC));
  SEC = Object.assign(secDefault(), sv);
  if (sv && sv.ghGistId && !("ghVer" in sv)) SEC.ghVer = null; // aparelho ligado à nuvem antes da checagem de versão: confia na cópia atual
  const tries = [() => lsGet(KEY), () => IDB.get("state2"), () => lsGet(KEY_V1), () => IDB.get("state")];
  for (const t of tries) {
    R = rootFrom(parse(await t()));
    if (R) break;
  }
  if (!R) R = mergeRoot({ profiles: {} }); // instalação nova
  useProfile(R.active);
  saveSec();
  save();
}
