// Redesenhar a tela (relógio de 1 min, voltar ao app, resposta da IA) não apaga o que a pessoa está digitando.
const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState(), sec: { gemKey: "k" } });
  a.ev("openPage('coach')"); a.q("#ia-input").value = "pergunta pela metade"; a.q("#ia-input").focus();
  a.ev("render()");
  T.ok(a.q("#ia-input").value === "pergunta pela metade", "Coach: texto digitado sobrevive ao redesenho");
  T.ok(a.d.activeElement === a.q("#ia-input"), "Coach: o foco volta para o campo");
  a.ev("const s = document.createElement('i'); s.id = 'sentinela'; document.getElementById('page-body').appendChild(s); tick()");
  T.ok(!!a.q("#sentinela"), "relógio de 1 min não redesenha enquanto a pessoa digita");
  a.q("#ia-input").blur(); a.ev("tick()"); T.ok(!a.q("#sentinela"), "sem ninguém digitando, o relógio redesenha");
  a.ev("openPage('ajustes')"); a.q("#pn").value = "Nome novo"; a.q("#pdef").value = "700";
  a.ev("render()"); T.ok(a.q("#pn").value === "Nome novo" && a.q("#pdef").value === "700", "Ajustes: campos editados sobrevivem ao redesenho");
  a.click("[data-act=profile-save]"); T.ok(a.ev("S.profile.name") === "Nome novo" && a.q("#pn").value === "Nome novo" && a.q("#pdef").defaultValue === "700", "depois de salvar, o campo mostra o valor salvo");
  a.ev("closeAll()"); await a.wait(20);
  // campos consumidos por uma ação ficam vazios
  a.ev("go('saude', 'remedios')"); a.q("#q-new").value = "Pergunta 1"; a.q("[data-form=q]").dispatchEvent(new a.w.Event("submit", { bubbles: true, cancelable: true }));
  T.ok(a.ev("questionsOpen().length") === 1 && a.q("#q-new").value === "", "pergunta guardada limpa o campo");
  a.ev("go('nutri', 'agua')"); a.q("#wcust").value = "250"; a.click("#view [data-act=w-custom]");
  T.ok(a.ev("D(today()).water") === 250 && a.q("#wcust").value === "", "água em ml: registra e limpa o campo");
  a.ev("openActions('water')"); a.q("#wcust-act").value = "300"; a.click("#actions [data-act=w-custom]");
  T.ok(a.ev("D(today()).water") === 550, "Registrar › Água lê o próprio campo (não o da aba Água)");
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || "")); a.close();
};
