/* ============ INICIALIZAÇÃO ============ */
// a cada minuto: relógio, linha AGORA, maré e virada do dia
function tick() {
  if (!STACK.includes("arena") && !STACK.includes("sheet") && !STACK.includes("orb")) { applyTheme(); render(); }
  setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
}
function registerSW() {
  if (!("serviceWorker" in navigator) || !location.protocol.startsWith("http")) return;
  navigator.serviceWorker.register("sw.js").catch(() => { });
  let had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (had && !sessionStorage.getItem("sir_reloaded")) { sessionStorage.setItem("sir_reloaded", "1"); location.reload(); } had = true; });
}
(async function init() {
  await loadState();
  Object.values(R.profiles).forEach(p => { if (!GEM_MODELS.some(m => m[0] === p.settings.gemModel)) p.settings.gemModel = GEM_DEFAULT; });
  applyTheme();
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
  registerSW();
  try { history.replaceState({ layer: null }, ""); } catch (e) { }
  render(); orbSync();
  setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
  if (S.cur) toast("Treino em andamento. Toque no nó do treino para continuar.");
  setTimeout(maybeReview, 1000);
})();
