/* ============ REGISTRAR (botão da logo): ações grandes, com texto, em no máximo 2 toques ============ */
const ACTIONS = [
  ["water", "drop", "Água", "Copo, garrafa…"], ["meal", "fork", "Refeição", "Teclado de alimentos"],
  ["train", "dumb", "Treino", "Abrir a Arena"], ["weigh", "scale", "Peso", "Pesagem e cintura"],
  ["hunger", "smile", "Fome", "Como está agora"], ["meds", "pill", "Remédio ou suplemento", "Doses de hoje"],
  ["sched", "cal", "Agenda", "Nova atividade"], ["cardio", "flame", "Cardio", "Minutos e ritmo"]
];
function actionsHome() {
  return `<div class="act-grid">${ACTIONS.map(([k, i, n, s]) => `<button class="act-tile" data-act="act-go" data-k="${k}">${ic(i)}<b>${n}</b><small>${s}</small></button>`).join("")}</div>
    <button class="act-wide" data-act="page" data-p="coach">${ic("sparkles")}<span class="grow"><b>Perguntar ao Coach</b><small>Comida, treino, foto de prato</small></span>${ic("right")}</button>`;
}
function actionsWater() {
  return `<button class="act-back" data-act="act-go" data-k="">${ic("left")} Voltar</button><h3 class="h2">Quanto você bebeu?</h3>
    <div class="water-grid">${WSIZES.map(([n, ml]) => `<button class="wbtn lg" data-act="act-water" data-ml="${ml}"><b>+${ml} ml</b><small>${n}</small></button>`).join("")}</div>
    <div class="row"><input id="wcust" class="field" type="number" inputmode="numeric" placeholder="Outro valor em ml" aria-label="Quantidade em ml"><button class="btn solid" data-act="w-custom">Adicionar</button></div>
    <p class="muted small center">${fmtL(D(dayK()).water || 0, 2)} de ${fmtL(S.settings.waterGoal)} L hoje</p>`;
}
function actionsMeal() {
  const cur = mealByTime();
  return `<button class="act-back" data-act="act-go" data-k="">${ic("left")} Voltar</button><h3 class="h2">Qual refeição?</h3>
    <div class="stack">${MEAL_NAMES.map(m => { const it = mealItems(m, dayK()); return `<button class="act-wide ${m === cur ? "hi" : ""}" data-act="meal-open" data-m="${m}">${ic("fork")}<span class="grow"><b>${m}</b><small>${it.length ? `${it.length} itens registrados` : m === cur ? "Sugerida para agora" : "Nada ainda"}</small></span>${ic("right")}</button>`; }).join("")}</div>
    <div class="grid2"><button class="btn" data-act="foto" data-m="${cur}">${ic("camera")} Foto do prato</button><button class="btn" data-act="quick" data-m="${cur}">${ic("tag")} Por rótulo</button></div>`;
}
function actionsMeds() {
  const k = dayK(), doses = (S.meds || []).flatMap(m => medToday(m.id, k).map(x => ({ m, x })));
  const sup = S.supps.map(s => `<button class="chk lg ${D(k).s[s.id] ? "on" : ""}" data-act="supp" data-id="${s.id}" aria-pressed="${!!D(k).s[s.id]}"><span class="box">${ic("check")}</span><span class="grow"><b>${esc(s.n)}</b><small>${esc(s.tip)}</small></span></button>`).join("");
  return `<button class="act-back" data-act="act-go" data-k="">${ic("left")} Voltar</button><h3 class="h2">Remédios</h3>
    ${doses.length ? doses.map(({ m, x }) => `<div class="dose ${x.taken ? "ok" : ""}"><span class="grow"><b>${esc(m.n)}</b><small>${m.dose ? esc(m.dose) + " · " : ""}${x.inst.at || PERIODS[x.inst.period]}</small></span>${x.taken ? `<button class="btn sm" data-act="dose-undo" data-id="${x.inst.id}">Tomei às ${x.taken} · desfazer</button>` : `<button class="btn sm solid" data-act="dose-log" data-id="${x.inst.id}">Registrar dose</button>`}</div>`).join("") : `<p class="muted small">Nenhuma dose na agenda de hoje.</p>`}
    <h3 class="h2">Suplementos</h3><div class="stack">${sup || `<p class="muted small">Nenhum suplemento cadastrado.</p>`}</div>`;
}
function actionsResults(q) {
  PAL.items = parseCommand(q);
  return PAL.items.length ? PAL.items.map((c, i) => `<button class="act-wide ${i ? "" : "hi"}" data-act="pal-run" data-i="${i}">${ic(c.icon)}<span class="grow"><b>${esc(c.label)}</b><small>${esc(c.sub || "")}</small></span>${i ? "" : ic("check")}</button>`).join("")
    : `<p class="muted small">Não entendi. Tente "água 300", "ovo 2", "peso 118,4".</p>`;
}
const PAL = { items: [] };
function rActions() {
  const v = UI.act, body = v === "water" ? actionsWater() : v === "meal" ? actionsMeal() : v === "meds" ? actionsMeds() : actionsHome();
  $("#actions").innerHTML = `<div class="act-in"><div class="act-head"><h2 class="h3">Registrar</h2><button class="icon-btn" data-act="actions-close" aria-label="Fechar">${ic("x")}</button></div>
    ${v ? "" : `<form class="act-search" data-form="pal">${ic("search")}<input id="pal-q" type="text" autocomplete="off" autocapitalize="off" enterkeyhint="go" placeholder="ou escreva: água 500, frango 150…" aria-label="Escrever um registro"></form><div id="pal-res"></div>`}
    <div class="act-body" id="act-body">${body}</div></div>`;
}
function openActions(view = null) { UI.act = view; $("#actions").classList.add("on"); pushLayer("actions"); scrimSync(); rActions(); }
HIDE.actions = () => { $("#actions").classList.remove("on"); scrimSync(); };
function palResults(q) { const r = $("#pal-res"), b = $("#act-body"); if (!r) return; r.innerHTML = q.trim() ? actionsResults(q) : ""; if (b) b.hidden = !!q.trim(); }
function palRun(i) { const c = PAL.items[i]; if (!c) return; dropLayer("actions"); c.run(); haptic(12); render(); }
ACT.actions = () => openActions();
ACT["actions-close"] = () => dropLayer("actions");
ACT["pal-run"] = b => palRun(+b.dataset.i);
ACT["act-go"] = b => {
  const k = b.dataset.k, direct = { train: () => S.cur ? wkOpen() : wkStart(planLetter(today()) || seqNext()), weigh: weighSheet, hunger: hungerSheet, sched: addTypeSheet, cardio: cardioSheet };
  if (direct[k]) { dropLayer("actions"); return direct[k](); }
  UI.act = k || null; rActions();
};
ACT["act-water"] = b => { const ml = num(b.dataset.ml); dropLayer("actions"); waterDo(ml); render(); };
ACT["plus-water"] = () => openActions("water");
