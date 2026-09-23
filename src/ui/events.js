/* ============ EVENTOS: o ÚNICO ouvinte de clique do app + teclado, campos e formulários ============ */
let suppressClick = 0;
document.addEventListener("click", e => {
  if (Date.now() < suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
  const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
  const a = b.dataset.act;
  if (!ACT[a]) return;
  if (b.tagName === "A") e.preventDefault();
  ACT[a](b, e);
  // o painel Registrar continua aberto em sub-telas (ex.: doses de hoje): redesenha depois da ação
  if (STACK.includes("actions") && b.closest("#actions") && UI.act) rActions();
});
document.addEventListener("keydown", e => {
  const t = e.target;
  if (e.key === "Escape" && STACK.length) { dropLayer(STACK[STACK.length - 1]); return; }
  if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(t.tagName) && !STACK.length)) { e.preventDefault(); openActions(); setTimeout(() => { const i = $("#pal-q"); if (i) i.focus(); }, 50); return; }
  if ((e.key === "Enter" || e.key === " ") && t.getAttribute && t.getAttribute("role") === "button" && t.dataset.act) { e.preventDefault(); t.click(); return; }
  if (e.key === "Enter" && !e.shiftKey && t.id === "ia-input") { e.preventDefault(); auraSend(); return; }
  if (e.key === "Enter" && t.id === "pal-q") { e.preventDefault(); palRun(0); return; }
  if (!STACK.includes("arena") || /INPUT|TEXTAREA/.test(t.tagName)) return;
  if (e.key === "ArrowRight") arenaSwipe(-1); else if (e.key === "ArrowLeft") arenaSwipe(1);
});
document.addEventListener("submit", e => {
  e.preventDefault();
  if (e.target.dataset.form === "chat") auraSend();
  if (e.target.dataset.form === "pal") palRun(0);
  if (e.target.dataset.form === "q") { const i = $("#q-new"); if (i && questionAdd(i.value)) { render(); toast("Pergunta guardada."); } }
});
document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "pal-q") return palResults(t.value);
  if (t.id === "q") { const l = $("#foodlist"); if (l) l.innerHTML = foodListHTML(t.value); return; }
  if (t.id === "g") return gSum(+t.dataset.i);
  if (t.id === "ia-input") { t.style.height = "auto"; t.style.height = Math.min(140, t.scrollHeight) + "px"; return; }
  if (t.dataset.foto !== undefined) { const f = t.dataset.foto, it = FOTO.items[+t.dataset.i]; if (it) { it[f] = f === "nome" ? t.value : num(t.value); fotoTotal(); } return; }
  if (t.dataset.f && S.cur && t.closest("#arena")) arenaInput(t);
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.id === "ia-foto") { const f = t.files[0]; t.value = ""; if (f) iaFoto(f); return; }
  if (t.id === "foto") { const f = t.files[0]; t.value = ""; if (f) fotoAnalyze(f); return; }
  if (t.id === "file") { const f = t.files[0]; t.value = ""; if (f) importFile(f); return; }
  if (t.id === "wallfile") { const f = t.files[0]; t.value = ""; if (f) wallSet(f).catch(() => toast("Não consegui ler essa foto.")); return; }
  if (t.id === "fotoprog") { const f = t.files[0]; t.value = ""; if (f) photoAdd(f).then(() => { render(); toast("Foto guardada só neste aparelho."); }).catch(() => toast("Não consegui ler essa foto.")); return; }
  if (t.dataset.change === "rule1" && S.habits.some(h => h.id === t.value)) { S.settings.rule1 = t.value; S.settings.needOthers = Math.min(S.settings.needOthers, S.habits.length - 1); save(); render(); toast("Regra nº 1 atualizada."); }
  if (t.dataset.f && S.cur && t.closest("#arena")) arenaRender();
});
matchMedia("(prefers-color-scheme:dark)").addEventListener && matchMedia("(prefers-color-scheme:dark)").addEventListener("change", () => R && applyTheme());
document.addEventListener("visibilitychange", () => {
  if (document.hidden || !R) return;
  if (RT.iv) restTick();
  if (S.cur && STACK.includes("arena")) lockScreen();
  applyTheme(); if (!STACK.includes("arena")) render();
});
