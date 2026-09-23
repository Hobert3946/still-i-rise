"use strict";
/* ============ UTILIDADES ============ */
// Cada módulo registra ACT["nome-da-acao"] = (botao, evento) => { ... }.
// O ÚNICO ouvinte de clique (ui/events.js) despacha por data-act. Não crie outros ouvintes de clique.
const ACT = {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const fmtKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const today = () => fmtKey(new Date());
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return fmtKey(d); };
const diffDays = (a, b) => Math.round((parseKey(a) - parseKey(b)) / 864e5);
const mondayOf = k => { const d = parseKey(k); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return fmtKey(d); };
const ic = (n, c = "") => `<svg class="icon ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const num = (v, d = 0) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? d : n; };
const r1 = n => Math.round(n * 10) / 10;
const DOW = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const dispDate = k => { const d = parseKey(k); return `${pad(d.getDate())} ${MESES[d.getMonth()]}`; };
const fmtInt = n => Math.round(n).toLocaleString("pt-BR");
const fmtL = (ml, d = 1) => (ml / 1000).toFixed(d).replace(".", ",");
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const toMin = t => { const [h, m] = String(t || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const normTxt = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const haptic = (ms = 10) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
