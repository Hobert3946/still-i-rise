// Utilitários dos testes: carrega docs/index.html no jsdom, como o celular faria.
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs"), path = require("path");
const HTML = fs.readFileSync(path.join(__dirname, "..", "docs", "index.html"), "utf8");

const pad = n => String(n).padStart(2, "0");
const keyOf = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

// opts.v1: estado antigo (sir_v1). opts.v2: estado novo (sir_v2). opts.sec: segredos. opts.fetch: substitui fetch.
async function boot(opts = {}) {
  const errors = [], vc = new VirtualConsole();
  vc.on("jsdomError", e => errors.push((e.detail && e.detail.message) || e.message));
  const dom = new JSDOM(HTML, {
    runScripts: "dangerously", url: "http://localhost/", pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: true, addEventListener() { } });
      w.scrollTo = () => { }; w.HTMLElement.prototype.scrollTo = () => { }; w.HTMLElement.prototype.scrollIntoView = () => { };
      w.confirm = () => true; w.indexedDB = undefined;
      w.URL.createObjectURL = b => { w.__blob = b; return "blob:x"; }; w.URL.revokeObjectURL = () => { };
      w.HTMLAnchorElement.prototype.click = function () { w.__dl = this.download; };
      if (opts.v1) w.localStorage.setItem("sir_v1", JSON.stringify(opts.v1));
      if (opts.v2) w.localStorage.setItem("sir_v2", JSON.stringify(opts.v2));
      if (opts.sec) w.localStorage.setItem("sir_secrets", JSON.stringify(opts.sec));
      if (opts.fetch) w.fetch = opts.fetch;
    }
  });
  const w = dom.window, d = w.document;
  await new Promise(r => setTimeout(r, 300));
  const click = s => { const e = typeof s === "string" ? d.querySelector(s) : s; if (!e) throw new Error("não achei " + s); e.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); };
  return { w, d, errors, ev: c => w.eval(c), q: s => d.querySelector(s), qa: s => [...d.querySelectorAll(s)], click, wait: ms => new Promise(r => setTimeout(r, ms)), close: () => w.close() };
}

// estado v1 (formato antigo, um perfil só) com um pouco de histórico; sobrescreva partes com `over`
function baseState(over = {}) {
  const k0 = keyOf(0), st = {
    v: 1, profile: { name: "Hobert", startWeight: 140, goal: 105, height: 179, age: 24 },
    weights: [{ d: keyOf(-14), kg: 140, waist: 132 }, { d: keyOf(-7), kg: 138.5, waist: 130 }], days: {}, logs: {}, sel: {}, pain: [], neck: [], cur: null, chat: [], favs: {},
    settings: { theme: "dark", start: keyOf(-40), logMode: "set", rotate: true, lastBackup: k0, notif: false, calcWeight: 140, waterGoal: 3000, gemKey: "", gemModel: "gemini-2.5-flash-lite", gemAck: false }
  };
  return Object.assign(st, over);
}

let fails = 0, total = 0;
const T = { ok(c, m) { total++; if (!c) fails++; console.log((c ? "  ok    " : "  FALHA ") + m); }, get fails() { return fails; }, get total() { return total; } };
module.exports = { boot, baseState, keyOf, T };
