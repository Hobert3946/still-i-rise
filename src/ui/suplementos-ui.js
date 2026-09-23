/* ============ SAÚDE › SUPLEMENTOS: os de hoje + fichas com qualidade da evidência ============ */
const EV_CLS = { Forte: "ok", Moderada: "acc", Limitada: "warn", Insuficiente: "bad" };
const evPill = ev => `<span class="pill ${EV_CLS[ev] || ""}">Evidência: ${ev}</span>`;
function suppToday() {
  const k = dayK(), d = D(k), at = id => { const x = instances(k).find(i => i.it.type === "suplemento" && i.it.ref === id); return x ? (x.flex ? PERIODS[x.period] : x.at) : "sem horário"; };
  return S.supps.map(s => `<button class="chk lg ${d.s[s.id] ? "on" : ""}" data-act="supp" data-id="${s.id}" aria-pressed="${!!d.s[s.id]}"><span class="box">${ic("check")}</span><span class="grow"><b>${esc(s.n)}</b><small>${esc(s.tip)} · ${at(s.id)}</small></span></button>`).join("") || `<p class="muted small">Nenhum suplemento na sua lista.</p>`;
}
function suppCard(x) {
  const f = SUPP_INFO[x.n] || {}, row = (l, v) => v ? `<div class="kv"><span class="lbl">${l}</span><p>${esc(v)}</p></div>` : "";
  return `<details class="fold supp" data-fold="sp-${normTxt(x.n).replace(/\W/g, "")}"><summary><span class="grow"><b>${esc(x.n)}</b><small class="muted">${esc(f.obj || x.why)}</small></span>${f.ev ? evPill(f.ev) : ""}${ic("down")}</summary><div class="body">
    <div class="row wrap"><span class="pill">Custo ${"$".repeat(x.price)}</span><span class="pill">Ajuda ${x.help}/5</span></div>
    ${row("Possíveis benefícios", f.ben || x.why)}${row("Quando pode fazer sentido", f.quando)}${row("Uso habitual", f.uso)}${row("Efeitos adversos", f.efe)}${row("Interações", f.inter)}${row("Quem deve evitar", f.evitar)}${row("Risco", x.risk)}
    <button class="btn sm ghost" data-act="q-add" data-t="${esc("Faz sentido eu usar " + x.n + "?")}" data-src="Suplementos">Quero perguntar ao médico</button></div></details>`;
}
function suplementosView() {
  const a = SUPP_CATALOG.filter(x => x.t === "S").slice().sort((p, q) => UI.supSort === "price" ? (p.price - q.price || q.help - p.help) : UI.supSort === "ev" ? (EV_LEVELS.indexOf((SUPP_INFO[p.n] || {}).ev) - EV_LEVELS.indexOf((SUPP_INFO[q.n] || {}).ev)) : (q.help - p.help || p.price - q.price));
  return `${sec("Hoje", `<div class="stack">${suppToday()}</div>`)}
    ${sec("", suppsFold())}
    ${sec("Fichas: o que a ciência diz", `<p class="muted small">Qualidade da evidência para o objetivo citado: <b>Forte</b>, <b>Moderada</b>, <b>Limitada</b> ou <b>Insuficiente</b>. Nenhum suplemento substitui alimentação, treino e sono. Informativo: confirme com médico ou nutricionista.</p>
      <div class="seg"><button class="${UI.supSort === "ev" ? "on" : ""}" data-act="sup-sort" data-v="ev">Evidência</button><button class="${UI.supSort === "price" ? "on" : ""}" data-act="sup-sort" data-v="price">Menor custo</button><button class="${UI.supSort === "help" ? "on" : ""}" data-act="sup-sort" data-v="help">Mais ajuda</button></div>
      ${a.map(suppCard).join("")}`)}`;
}
ACT["sup-sort"] = b => { UI.supSort = b.dataset.v; render(); };
ACT["q-add"] = b => { if (questionAdd(b.dataset.t, b.dataset.src)) { render(); toast("Adicionada às perguntas da consulta (Saúde › Remédios)."); } };
