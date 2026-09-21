// Aba A.I.: menu recolhido, campo de digitar no fim da tela, alça para puxar o menu.
const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const st = baseState(); st.settings.gemKey = "chave";
  const a = await boot({ state: st }), ptr = (el, type, y) => { const e = new a.w.Event(type, { bubbles: true }); e.clientX = 100; e.clientY = y; e.pointerId = 1; el.dispatchEvent(e); };
  const body = a.d.body.classList;
  T.ok(!body.contains("chat-mode"), "fora da A.I. o menu fica normal");
  a.ev('go("ia")'); T.ok(body.contains("chat-mode") && !body.contains("dock-open"), "na A.I. o menu começa recolhido");
  T.ok(a.q(".chat-input-area .dock-handle") && a.q("#ia-input"), "campo de digitar e alça existem");
  a.q(".dock-handle").click(); T.ok(body.contains("dock-open"), "tocar na alça mostra o menu");
  a.q(".dock-handle").click(); T.ok(!body.contains("dock-open"), "tocar de novo esconde");
  ptr(a.q(".dock-handle"), "pointerdown", 500); ptr(a.q(".dock-handle"), "pointermove", 440); ptr(a.q(".dock-handle"), "pointerup", 440);
  T.ok(body.contains("dock-open"), "arrastar a alça para cima mostra o menu");
  ptr(a.q("nav.dock"), "pointerdown", 400); ptr(a.q("nav.dock"), "pointermove", 460); ptr(a.q("nav.dock"), "pointerup", 460);
  T.ok(!body.contains("dock-open"), "arrastar o menu para baixo esconde");
  a.q(".dock-handle").click(); a.q('nav.dock [data-tab="comer"]').click();
  T.ok(a.ev("UI.tab") === "comer" && !body.contains("chat-mode"), "escolher outra aba volta ao menu normal");
  a.ev('go("ia")'); T.ok(!body.contains("dock-open"), "ao voltar para a A.I. o menu recolhe de novo");
  T.ok(!a.errors.length, "sem erros de script"); a.close();
};
