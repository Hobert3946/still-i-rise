// Leitor de tela e teclado: o foco vai para o painel que abre e volta ao fechar; só a camada de cima recebe toque;
// botões de escolha dizem qual está marcado.
const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() }),
    ev = a.ev,
    d = a.d;
  // painel a partir da tela: foco no título e volta para o botão
  const al = a.q(".align");
  al.focus();
  a.click(al);
  T.ok(
    d.activeElement && d.activeElement.id === "sheet-t" && a.q("#sheet").getAttribute("aria-labelledby") === "sheet-t",
    "abrir um painel leva o foco ao título dele"
  );
  a.click("#sheet [data-act=close]");
  await a.wait(20);
  T.ok(d.activeElement && d.activeElement.classList.contains("align"), "fechar devolve o foco ao botão que abriu");
  // painel sobre uma página: a página fica inerte enquanto o painel está aberto
  ev("openPage('agenda')");
  a.q("[data-act=inst-new]").focus(); // no navegador, tocar no botão já dá o foco a ele
  a.click("[data-act=inst-new]");
  T.ok(a.q("#page").inert === true && a.q("#sheet").inert === false, "página embaixo do painel fica inerte");
  a.click("#sheet [data-act=close]");
  await a.wait(20);
  T.ok(
    a.q("#page").inert === false && d.activeElement && d.activeElement.dataset.act === "inst-new",
    "fechar o painel reativa a página e devolve o foco"
  );
  // botões de escolha
  a.click("[data-act=inst-new]");
  a.click("#sheet [data-act=inst-new-type][data-t=atividade]");
  const segs = a.qa("#sheet .seg button");
  T.ok(
    segs.length >= 4 && segs.every(b => b.getAttribute("aria-pressed") === String(b.classList.contains("on"))),
    "botões de escolha anunciam qual está marcado"
  );
  a.click("#sheet [data-act=rmode][data-v=once]");
  T.ok(
    a.q("#sheet [data-act=rmode][data-v=once]").getAttribute("aria-pressed") === "true" &&
      a.q("#sheet [data-act=rmode][data-v=rec]").getAttribute("aria-pressed") === "false",
    "trocar a escolha atualiza o estado"
  );
  ev("closeAll()");
  await a.wait(20);
  ev("UI.openFold = 'prefs'; openPage('ajustes')");
  T.ok(
    a.qa("#page .seg button").every(b => b.hasAttribute("aria-pressed")),
    "tema e outras escolhas em Ajustes também"
  );
  ev("closeAll()");
  await a.wait(20);
  // Registrar: foco no título do painel
  a.click(".tb-logo");
  T.ok(
    d.activeElement && /Registrar/.test(d.activeElement.textContent) && a.q("#view").inert === true,
    "Registrar recebe o foco e a tela atrás fica inerte"
  );
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || ""));
  a.close();
};
