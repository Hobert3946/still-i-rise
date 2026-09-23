/* ============ AGENDA: semana, dia, itens editáveis (tocar = editar · segurar e arrastar = mover · + = adicionar) ============ */
const recTxt = it => it.date ? `Só em ${dispDate(it.date)}` : it.days.length === 7 ? "Todo dia" : it.days.length === 5 && WEEKDAYS.every(d => it.days.includes(d)) ? "Seg a sex" : it.days.map(d => DOW[d].slice(0, 3).toLowerCase()).join(", ") || "Nenhum dia";
function weekStrip() {
  const k = dayK(), mon = mondayOf(k);
  return `<div class="week7" role="group" aria-label="Dias da semana"><button class="icon-btn" data-act="day-shift" data-d="-7" aria-label="Semana anterior">${ic("left")}</button>
    ${Array.from({ length: 7 }, (_, i) => { const d = addDays(mon, i), dt = parseKey(d); return `<button class="w7 ${d === k ? "on" : ""} ${d === today() ? "today" : ""}" data-act="day-pick" data-k="${d}" aria-pressed="${d === k}"><small>${DOW[dt.getDay()].slice(0, 3)}</small><b>${dt.getDate()}</b></button>`; }).join("")}
    <button class="icon-btn" data-act="day-shift" data-d="7" aria-label="Próxima semana">${ic("right")}</button></div>`;
}
function instRow(x) {
  const st = x.done ? "done" : x.skip ? "skip" : "", badge = x.done ? `<span class="ag-done" aria-label="feito">${ic("check")}</span>` : x.skip ? `<span class="pill">pulado</span>` : x.moved ? `<span class="pill acc">só hoje</span>` : "";
  return `<div class="ag-row ${st}" data-inst="${x.id}"><button class="ag-main" data-act="inst-open" data-id="${x.id}">
    <time class="tabnum">${x.flex ? PERIODS[x.period] : x.at}</time><span class="ag-ic">${ic(TYPES[x.it.type][1])}</span><span class="grow"><b>${esc(x.it.title)}</b><small>${TYPES[x.it.type][0]} · ${recTxt(x.it)}${x.flex ? "" : ` · ${x.dur} min`}</small></span>${badge}</button>${x.flex ? "" : `<span class="ag-grip" data-agdrag="${x.id}" data-min="${x.min}" title="Arraste para mudar o horário">${ic("grip")}</span>`}</div>`;
}
function goalsHTML(k) {
  const d = D(k), tg = TG(), t = dayTotals(k);
  const custom = S.goals.map(g => `<div class="goal"><span class="grow"><b>${esc(g.n)}</b><small class="muted tabnum">${(d.g || {})[g.id] || 0} / ${g.target} ${esc(g.unit)}</small></span><button class="btn sm" data-act="goal-add" data-id="${g.id}">+${g.step} ${esc(g.unit)}</button><button class="icon-btn" data-act="goal-del" data-id="${g.id}" aria-label="Excluir meta ${esc(g.n)}">${ic("trash")}</button></div>`).join("");
  return `<h3 class="lbl sec-t">Metas do dia</h3>${meter("Água", fmtL(d.water || 0), fmtL(S.settings.waterGoal), "L", "var(--water)", "go", 'data-tab="nutri" data-seg="agua"')}
    ${meter("Proteína", Math.round(t.p), tg.prot, "g", "var(--accent)", "go", 'data-tab="nutri" data-seg="refeicoes"')}${meter("Fibras", d.fiber || 0, FIBER_GOAL, "g", "var(--ok)", "go", 'data-tab="nutri" data-seg="refeicoes"')}${custom}`;
}
PAGES.agenda = {
  t: "Agenda", right: () => `<button class="btn sm solid" data-act="inst-new">${ic("plus")} Adicionar</button>`,
  r: () => { const k = dayK(), all = instances(k), timed = all.filter(x => !x.flex), flex = all.filter(x => x.flex);
    return `${weekStrip()}<p class="muted small center">${k === today() ? "Hoje" : dispDate(k)} · toque para editar · arraste pela alça ⋮⋮ para mudar o horário</p>
      <section class="ag-list">${timed.map(instRow).join("") || `<p class="muted">Sem itens com horário.</p>`}</section>
      ${flex.length ? `<h3 class="lbl sec-t">Sem horário fixo</h3><section class="ag-list">${flex.map(instRow).join("")}</section>` : ""}
      <section class="block">${goalsHTML(k)}<button class="btn sm ghost full" data-act="goal-new">${ic("plus")} Nova meta diária</button></section>`; }
};
ACT["agenda-open"] = () => openPage("agenda");
ACT["day-pick"] = b => { UI.day = b.dataset.k === today() ? null : b.dataset.k; render(); };
ACT["day-shift"] = b => { const k = addDays(dayK(), +b.dataset.d); UI.day = k === today() ? null : k; render(); };
const instById = id => instances(dayK()).find(x => x.id === id);
/* ---- editar um item ---- */
function daysPick(days) { return `<div class="days7" role="group" aria-label="Dias da semana">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button class="${days.includes(d) ? "on" : ""}" data-act="dpick" data-d="${d}" aria-pressed="${days.includes(d)}">${DOW[d].slice(0, 3)}</button>`).join("")}</div>`; }
function timeFields(at, period, dur) {
  return `<div class="seg" id="tmode"><button class="${at ? "on" : ""}" data-act="tmode" data-v="fix">Horário fixo</button><button class="${at ? "" : "on"}" data-act="tmode" data-v="flex">Flexível</button></div>
    <div id="t-fix" ${at ? "" : "hidden"}><label class="lbl" for="e-at">Horário</label><input class="field big-in" id="e-at" type="time" value="${esc(at || "")}"></div>
    <div id="t-flex" ${at ? "hidden" : ""}><div class="lbl">Quando no dia</div><div class="seg" id="e-per">${Object.entries(PERIODS).map(([v, n]) => `<button class="${period === v ? "on" : ""}" data-act="per" data-v="${v}">${n}</button>`).join("")}</div></div>
    <label class="lbl" for="e-dur">Duração (min)</label><div class="stepper"><button class="icon-btn" data-act="dur" data-d="-5" aria-label="Menos 5 minutos">${ic("minus")}</button><input class="field tabnum" id="e-dur" inputmode="numeric" value="${dur}"><button class="icon-btn" data-act="dur" data-d="5" aria-label="Mais 5 minutos">${ic("plus")}</button></div>`;
}
function primaryFor(x) {
  const t = x.it.type;
  if (t === "treino") return `<button class="btn solid full" data-act="wk-start" data-day="${planLetter(x.k) || seqNext()}">${ic("play", "fill")} Entrar na Arena</button>`;
  if (t === "refeicao") return `<button class="btn solid full" data-act="meal-open" data-m="${esc(x.it.ref)}">Registrar ${esc(x.it.title.toLowerCase())}</button>`;
  if (t === "remedio") return (D(x.k).med || {})[x.id] ? `<button class="btn full" data-act="dose-undo" data-id="${x.id}">Desfazer dose (${(D(x.k).med || {})[x.id]})</button>` : `<button class="btn solid full" data-act="dose-log" data-id="${x.id}">Registrar dose</button>`;
  if (t === "suplemento") return `<button class="btn ${x.done ? "" : "solid"} full" data-act="supp" data-id="${x.it.ref}">${x.done ? "Desmarcar" : "Marcar como tomado"}</button>`;
  if (t === "habito") return `<button class="btn ${x.done ? "" : "solid"} full" data-act="habit" data-id="${x.it.ref}">${x.done ? "Desmarcar" : "Marcar como feito"}</button>`;
  return `<button class="btn ${x.done ? "" : "solid"} full" data-act="inst-done" data-id="${x.id}">${x.done ? "Desfazer conclusão" : "Concluir"}</button>`;
}
function instSheet(id) {
  const x = instById(id); if (!x) return; UI.edit = { id, days: x.it.days.slice(), period: x.period };
  openSheet(`<div class="kick">${TYPES[x.it.type][0]} · ${recTxt(x.it)}</div><h3 class="h2">${esc(x.it.title)}</h3>${primaryFor(x)}
    <div class="grid3 acts"><button class="btn sm" data-act="inst-skip" data-id="${id}">${x.skip ? "Desfazer pulo" : "Pular"}</button><button class="btn sm" data-act="inst-dup" data-id="${id}">Duplicar</button><button class="btn sm" data-act="inst-resched" data-id="${id}">Reagendar</button></div>
    ${["atividade", "consulta", "habito"].includes(x.it.type) || x.it.date ? `<label class="lbl" for="e-title">Nome</label><input class="field" id="e-title" maxlength="60" value="${esc(x.it.title)}">` : ""}
    ${timeFields(x.flex ? "" : x.at, x.period, x.dur)}${x.it.date ? "" : `<div class="lbl">Repetir em</div>${daysPick(x.it.days)}`}
    ${x.it.date ? `<button class="btn solid full" data-act="inst-save" data-id="${id}" data-always="1">Salvar</button>` : `<div class="grid2"><button class="btn" data-act="inst-save" data-id="${id}">Salvar só neste dia</button><button class="btn solid" data-act="inst-save" data-id="${id}" data-always="1">Salvar sempre</button></div>`}
    <button class="btn danger full" data-act="inst-del" data-id="${id}">${x.it.date ? "Excluir" : "Tirar da rotina"}</button>`);
}
function readTime() {
  const flex = $("#tmode .on").dataset.v === "flex", at = flex ? "" : ($("#e-at").value || ""), per = ($("#e-per .on") || { dataset: { v: "" } }).dataset.v;
  return { at, period: flex ? per : "", dur: clamp(Math.round(num($("#e-dur").value, 15)), 5, 600) };
}
ACT["inst-open"] = b => instSheet(b.dataset.id);
ACT["inst-save"] = b => {
  const id = b.dataset.id, always = !!b.dataset.always, p = readTime(), t = $("#e-title");
  if (!p.at && $("#tmode .on").dataset.v === "fix") return toast("Escolha um horário ou marque Flexível.");
  if (always) { p.days = UI.edit.days; if (t && t.value.trim()) p.title = t.value.trim().slice(0, 60); }
  schedEdit(dayK(), id, p, always); closeSheet(); render(); toast(always ? "Rotina atualizada." : "Alterado só neste dia.");
};
ACT["inst-done"] = b => { const x = instById(b.dataset.id); schedDone(dayK(), b.dataset.id, !(x && x.done)); closeSheetIf(); render(); haptic(); };
ACT["inst-skip"] = b => { const x = instById(b.dataset.id); schedSkip(dayK(), b.dataset.id, !(x && x.skip)); closeSheetIf(); render(); toast(x && x.skip ? "Voltou para o dia." : "Pulado só neste dia.", x && !x.skip ? () => { schedSkip(dayK(), b.dataset.id, false); render(); } : null); };
ACT["inst-dup"] = b => { schedDuplicate(dayK(), b.dataset.id); closeSheet(); render(); toast("Duplicado neste dia."); };
ACT["inst-del"] = b => { const x = instById(b.dataset.id); if (!x) return; if (!x.it.date && !confirm(`Tirar "${x.it.title}" da rotina? Os dias passados continuam registrados.`)) return; schedRemove(dayK(), b.dataset.id, true); closeSheet(); render(); toast("Removido."); };
ACT["inst-resched"] = b => openSheet(`<h3 class="h3">Reagendar</h3><p class="muted small">Tira deste dia e cria para o dia e horário escolhidos.</p><label class="lbl" for="rs-d">Dia</label><input class="field" id="rs-d" type="date" value="${addDays(dayK(), 1)}"><label class="lbl" for="rs-t">Horário</label><input class="field" id="rs-t" type="time" value="${esc((instById(b.dataset.id) || {}).at || "")}"><button class="btn solid full" data-act="resched-ok" data-id="${b.dataset.id}">Reagendar</button>`);
ACT["resched-ok"] = b => { const d = $("#rs-d").value; if (!/^\d{4}-\d\d-\d\d$/.test(d)) return toast("Escolha o dia."); schedReschedule(dayK(), b.dataset.id, d, $("#rs-t").value || ""); closeSheet(); render(); toast(`Reagendado para ${dispDate(d)}.`); };
const closeSheetIf = () => { if (STACK.includes("sheet")) closeSheet(); };
ACT.tmode = b => { $$("#tmode button").forEach(x => x.classList.toggle("on", x === b)); $("#t-fix").hidden = b.dataset.v !== "fix"; $("#t-flex").hidden = b.dataset.v === "fix"; };
ACT.per = b => $$("#e-per button").forEach(x => x.classList.toggle("on", x === b));
ACT.dur = b => { const i = $("#e-dur"); i.value = clamp(num(i.value, 15) + num(b.dataset.d), 5, 600); };
ACT.dpick = b => { const d = +b.dataset.d, a = UI.edit.days, i = a.indexOf(d); if (i < 0) a.push(d); else a.splice(i, 1); b.classList.toggle("on", i < 0); b.setAttribute("aria-pressed", i < 0); };
// mover arrastando: só neste dia; o toast oferece aplicar à rotina
function instMove(id, at) {
  const k = dayK(); schedEdit(k, id, { at }, false); render(); haptic(15);
  toast(`Movido para ${at} só neste dia.`, () => { schedEdit(k, id, { at }, true); render(); toast("Rotina atualizada."); }, "Aplicar sempre");
}
