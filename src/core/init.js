/* ============ INICIALIZAÇÃO ============ */
// a cada minuto: relógio, card Agora e virada do dia (espera se a pessoa estiver digitando)
function tick() {
  updApply();
  if (!typing() && !STACK.includes("arena") && !STACK.includes("sheet") && !STACK.includes("actions")) {
    applyTheme();
    render();
  }
  setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
}
/* ---- atualização automática ---- */
// O navegador só procura versão nova quando o app abre do zero; instalado no celular, ele volta do segundo plano sem
// recarregar. Então o app procura sozinho: ao voltar para a tela, ao reconectar e a cada 30 min. Achou: o service worker
// novo instala, e a página recarrega na hora segura (app em segundo plano, ou sem treino, painel aberto ou alguém digitando).
const UPD = { reg: null, ready: false, last: 0, reload: () => location.reload() };
const updSafe = () => document.hidden || (!typing() && !STACK.length);
function updCheck(force) {
  if (!UPD.reg || (!force && Date.now() - UPD.last < 60000)) return;
  UPD.last = Date.now();
  UPD.reg.update().catch(() => {});
}
function updApply() {
  if (!UPD.ready || !updSafe()) return;
  // trava contra repetição: no máximo 3 recargas em 5 min
  let log = [];
  try {
    log = JSON.parse(sessionStorage.getItem("sir_upd_log") || "[]").filter(t => Date.now() - t < 3e5);
  } catch (e) {}
  if (log.length >= 3) return;
  UPD.ready = false;
  try {
    sessionStorage.setItem("sir_upd_log", JSON.stringify(log.concat(Date.now())));
    localStorage.setItem("sir_upd", "1");
  } catch (e) {}
  UPD.reload();
}
function registerSW() {
  if (!("serviceWorker" in navigator) || !location.protocol.startsWith("http")) return;
  navigator.serviceWorker
    .register("sw.js")
    .then(r => (UPD.reg = r))
    .catch(() => {});
  let had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (had) {
      UPD.ready = true;
      updApply();
    }
    had = true;
  });
  setInterval(() => updCheck(true), 30 * 60000);
  window.addEventListener("online", () => updCheck(true));
}
(async function init() {
  await loadState();
  Object.values(R.profiles).forEach(p => {
    if (!GEM_MODELS.some(m => m[0] === p.settings.gemModel)) p.settings.gemModel = GEM_DEFAULT;
  });
  save();
  applyTheme();
  applyWall();
  try {
    navigator.storage && navigator.storage.persist && navigator.storage.persist();
  } catch (e) {}
  registerSW();
  try {
    history.replaceState({ layer: null }, "");
  } catch (e) {}
  render();
  setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
  if (S.profile.todo) welcomeSheet();
  if (lsGet("sir_upd")) {
    try {
      localStorage.removeItem("sir_upd");
    } catch (e) {}
    toast(`App atualizado: versão ${APP_VERSION}.`);
  }
  if (S.cur) toast("Treino em andamento. Continue pelo card Agora.");
  setTimeout(maybeReview, 1000);
})();
