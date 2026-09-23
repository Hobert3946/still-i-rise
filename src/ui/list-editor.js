/* ============ EDITORES: hábitos e suplementos (adicionar, editar, remover, reordenar, Regra nº 1) ============ */
const LISTS = { habits: () => S.habits, supps: () => S.supps };
function rowTools(kind, i, n, label) {
  return `<span class="grip" data-grip="${kind}" data-i="${i}" aria-hidden="true">${ic("grip")}</span>
    <button class="icon-btn" data-act="li-edit" data-k="${kind}" data-i="${i}" aria-label="Editar ${esc(label)}">${ic("edit")}</button>`;
}
function habitsFold() {
  const s = S.settings, n = S.habits.length;
  const rows = S.habits.map((h, i) => `<div class="li ed" data-row="habits" data-i="${i}"><span class="n-ic">${esc(h.icon)}</span><div class="grow"><b>${esc(h.t)}</b><small class="muted">${h.id === s.rule1 ? "Regra nº 1 · " : ""}${h.at ? "às " + h.at : "o dia todo"}${h.link ? " · automático" : ""}</small></div>${rowTools("habits", i, n, h.t)}</div>`).join("");
  return fold("Hábitos diários", `<div class="list" data-list="habits">${rows}</div><button class="btn full" data-act="li-new" data-k="habits">${ic("plus")} Novo hábito</button>
    <label class="lbl" for="rule1">Regra nº 1 (obrigatória para o dia contar)</label><select class="field" id="rule1" data-change="rule1">${S.habits.map(h => `<option value="${h.id}" ${h.id === s.rule1 ? "selected" : ""}>${esc(h.icon)} ${esc(h.t)}</option>`).join("")}</select>
    <div class="row between set-row"><span class="grow">Outros hábitos necessários para dia ativo</span><div class="stepper sm"><button class="icon-btn" data-act="need" data-d="-1" aria-label="Menos um">${ic("minus")}</button><b class="tabnum">${s.needOthers}</b><button class="icon-btn" data-act="need" data-d="1" aria-label="Mais um">${ic("plus")}</button></div></div>
    <p class="muted xs">Dia ativo = Regra nº 1 + ${s.needOthers} outros. Arraste pela alça ou use as setas para reordenar. Com horário, o hábito aparece no rio; sem horário, no trilho "O dia todo".</p>`, UI.lensSub === "habitos", "habitos");
}
function suppsFold() {
  const n = S.supps.length, row = (x, i) => `<div class="li ed" data-row="supps" data-i="${i}"><div class="grow"><b>${esc(x.n)}</b><small class="muted">${esc(x.tip)}${x.at ? " · " + x.at : ""}</small></div>${rowTools("supps", i, n, x.n)}</div>`;
  const grp = t => S.supps.map((x, i) => [x, i]).filter(([x]) => x.type === t).map(([x, i]) => row(x, i)).join("") || `<p class="muted small">Nenhum.</p>`;
  return fold("Suplementos e remédios do dia", `<div class="lbl">Suplementos</div><div class="list" data-list="supps">${grp("S")}</div><div class="lbl">Remédios prescritos</div><div class="list" data-list="supps">${grp("M")}</div>
    <button class="btn full" data-act="li-new" data-k="supps">${ic("plus")} Novo item</button><p class="muted xs">Itens com o mesmo horário aparecem juntos no rio.</p>`, UI.lensSub === "supps", "supps");
}
function habitSheet(i) {
  const h = i >= 0 ? S.habits[i] : { icon: "✦", t: "", desc: "", at: "", link: "" };
  openSheet(`<h3 class="h3">${i >= 0 ? "Editar hábito" : "Novo hábito"}</h3>
  <div class="row"><div style="width:84px"><label class="lbl" for="hi">Ícone</label><input class="field center" id="hi" maxlength="4" value="${esc(h.icon)}"></div><div class="grow"><label class="lbl" for="ht">Texto</label><input class="field" id="ht" maxlength="60" value="${esc(h.t)}" placeholder="Ex.: Alongar 10 min"></div></div>
  <label class="lbl" for="hd">Descrição (opcional)</label><input class="field" id="hd" maxlength="120" value="${esc(h.desc || "")}">
  <div class="row"><div><label class="lbl" for="ha">Horário no rio (opcional)</label><input class="field time" id="ha" type="time" value="${esc(h.at || "")}"></div><div class="grow"><label class="lbl" for="hl">Automático</label><select class="field" id="hl">${LINKS.map(([v, n]) => `<option value="${v}" ${v === h.link ? "selected" : ""}>${n}</option>`).join("")}</select></div></div>
  ${i >= 0 ? moveRow("habits", i) : ""}<button class="btn solid full" data-act="li-save" data-k="habits" data-i="${i}">SALVAR</button>${i >= 0 ? `<button class="btn danger full" data-act="li-del" data-k="habits" data-i="${i}">Remover hábito</button>` : ""}`);
}
function suppSheet(i) {
  const x = i >= 0 ? S.supps[i] : { n: "", tip: "", type: "S", at: "" };
  openSheet(`<h3 class="h3">${i >= 0 ? "Editar item" : "Novo suplemento ou remédio"}</h3>
  <label class="lbl" for="sn">Nome</label><input class="field" id="sn" maxlength="60" value="${esc(x.n)}">
  <label class="lbl" for="st">Dica de quando tomar</label><input class="field" id="st" maxlength="120" value="${esc(x.tip)}">
  <div class="row"><div><label class="lbl" for="sa">Horário no rio</label><input class="field time" id="sa" type="time" value="${esc(x.at || "")}"></div><div class="grow"><label class="lbl">Tipo</label><div class="seg" id="sty">${[["S", "Suplemento"], ["M", "Remédio"]].map(([v, n]) => `<button class="${x.type === v ? "on" : ""}" data-act="sty" data-v="${v}">${n}</button>`).join("")}</div></div></div>
  ${i >= 0 ? moveRow("supps", i) : ""}<button class="btn solid full" data-act="li-save" data-k="supps" data-i="${i}">SALVAR</button>${i >= 0 ? `<button class="btn danger full" data-act="li-del" data-k="supps" data-i="${i}">Remover</button>` : ""}`);
}
const moveRow = (k, i) => `<div class="grid2"><button class="btn sm" data-act="li-move" data-k="${k}" data-i="${i}" data-d="-1" ${i === 0 ? "disabled" : ""}>${ic("up")} Subir</button><button class="btn sm" data-act="li-move" data-k="${k}" data-i="${i}" data-d="1" ${i === LISTS[k]().length - 1 ? "disabled" : ""}>${ic("down")} Descer</button></div>`;
const txt = (id, max) => ($("#" + id).value || "").trim().slice(0, max);
function listSave(k, i) {
  const a = LISTS[k]();
  if (k === "habits") {
    const o = { icon: txt("hi", 4) || "✦", t: txt("ht", 60), desc: txt("hd", 120), at: /^\d\d:\d\d$/.test(txt("ha", 5)) ? txt("ha", 5) : "", link: LINKS.some(l => l[0] === $("#hl").value) ? $("#hl").value : "" };
    if (!o.t) return toast("Escreva o hábito.");
    if (i >= 0) Object.assign(a[i], o); else a.push(Object.assign({ id: uid("h") }, o));
  } else {
    const ty = $("#sty .on"), o = { n: txt("sn", 60), tip: txt("st", 120), at: /^\d\d:\d\d$/.test(txt("sa", 5)) ? txt("sa", 5) : "", type: ty && ty.dataset.v === "M" ? "M" : "S" };
    if (!o.n) return toast("Escreva o nome.");
    if (i >= 0) Object.assign(a[i], o); else a.push(Object.assign({ id: uid("s") }, o));
  }
  save(); closeSheet(); render(); toast("Salvo.");
}
function listMove(k, from, to) { const a = LISTS[k](); if (to < 0 || to >= a.length || from === to) return; a.splice(to, 0, a.splice(from, 1)[0]); save(); render(); haptic(); }
ACT["li-new"] = b => b.dataset.k === "habits" ? habitSheet(-1) : suppSheet(-1);
ACT["li-edit"] = b => b.dataset.k === "habits" ? habitSheet(+b.dataset.i) : suppSheet(+b.dataset.i);
ACT["li-save"] = b => listSave(b.dataset.k, +b.dataset.i);
// subir/descer pelo painel de edição (acessível sem arrastar); o painel continua aberto no item movido
ACT["li-move"] = b => { const k = b.dataset.k, i = +b.dataset.i, j = i + num(b.dataset.d); listMove(k, i, j); if (j >= 0 && j < LISTS[k]().length) (k === "habits" ? habitSheet : suppSheet)(j); };
ACT.sty = b => $$("#sty button").forEach(x => x.classList.toggle("on", x === b));
ACT["li-del"] = b => {
  const k = b.dataset.k, i = +b.dataset.i, a = LISTS[k](), it = a[i]; if (!it) return;
  if (k === "habits" && it.id === S.settings.rule1) return toast("Escolha outra Regra nº 1 antes de remover este hábito.");
  if (k === "habits" && a.length < 2) return toast("Mantenha pelo menos um hábito.");
  if (!confirm(`Remover "${it.t || it.n}"? O histórico dos dias passados continua salvo.`)) return;
  a.splice(i, 1); save(); closeSheet(); render(); toast("Removido.");
};
ACT.need = b => { S.settings.needOthers = clamp(S.settings.needOthers + num(b.dataset.d), 0, Math.max(0, S.habits.length - 1)); save(); render(); };
