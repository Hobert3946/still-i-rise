/* ============ SAÚDE › TRATAMENTO: educação por nível de intervenção (não é recomendação) ============ */
function treatItem(x, lvl) {
  const row = (l, v) => v ? `<div class="kv"><span class="lbl">${l}</span><p>${esc(v)}</p></div>` : "";
  return `<details class="fold tr" data-fold="tr-${lvl}-${normTxt(x.n).replace(/\W/g, "")}"><summary><span class="grow"><b>${esc(x.n)}</b><small class="muted">${esc(x.obj)}</small></span>${x.ev && x.ev !== "Varia" ? evPill(x.ev) : ""}${ic("down")}</summary><div class="body">
    ${row("Como age", x.mec)}${row("Benefícios e evidência", x.ben)}${row("Efeitos adversos", x.efe)}${row("Contraindicações", x.contra)}${row("Interações", x.inter)}${row("Acompanhamento", x.acomp)}${row("Precisa de receita?", x.rx)}
    <button class="btn sm ghost" data-act="q-add" data-t="${esc(`${x.n}: faz sentido no meu caso? Quais riscos para mim?`)}" data-src="Tratamento · nível ${lvl}">Quero perguntar ao médico</button></div></details>`;
}
// catálogo original de remédios (custo e ajuda) continua disponível para comparação
function medCatalog() {
  const a = SUPP_CATALOG.filter(x => x.t === "M");
  return fold(`Comparativo rápido (custo × ajuda) · ${a.length} opções`, a.map(x => `<div class="tile col"><b>${esc(x.n)}</b><div class="row wrap"><span class="pill">Custo ${"$".repeat(x.price)}</span><span class="pill">Ajuda ${x.help}/5</span></div><div class="small">${esc(x.why)}</div><div class="muted xs"><b>Risco:</b> ${esc(x.risk)}</div></div>`).join(""), false, "medcat");
}
function tratamentoView() {
  return `<section class="notice">${ic("info")}<p>Área educativa. Explica e compara opções; <b>não</b> recomenda, não indica dose e não promete perda de peso. Os números citados são médias de estudos, não expectativa individual. Toda decisão é com seu médico.</p></section>
    ${TREAT.map(L => `<section class="card lvl"><div class="lvl-h"><span class="lvl-n">${L.lvl}</span><div><h3 class="h3">${esc(L.t)}</h3><p class="muted small">${esc(L.sub)}</p></div></div>${L.items.map(x => treatItem(x, L.lvl)).join("")}${L.lvl === 2 ? medCatalog() : ""}</section>`).join("")}
    <button class="btn full" data-act="go" data-tab="saude" data-seg="remedios">Ver minhas perguntas para o médico (${questionsOpen().length})</button>`;
}
