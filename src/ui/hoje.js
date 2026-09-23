/* ============ HOJE: o que importa agora (uma ação), o dia em um número, o que vem a seguir ============ */
function tipOfDay() { const n = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5); return TIPS[n % TIPS.length]; }
const fraseIdx = () => (Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5) + UI.qOff) % FRASES.length;
const dataAttrs = o => Object.entries(o || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ");
function agoraHTML() {
  const c = agoraCard();
  return `<section class="agora" aria-labelledby="ag-t"><div class="ag-kick">${esc(c.kick)}</div><h2 class="ag-t" id="ag-t">${esc(c.title)}</h2>${c.text ? `<p class="ag-p">${esc(c.text)}</p>` : ""}
    <button class="btn solid xl full" data-act="${c.act}" ${dataAttrs(c.data)}>${esc(c.label)}</button>
    <div class="ag-alt">${c.alt ? `<button class="btn ghost" data-act="${c.alt[0]}" ${dataAttrs(c.alt[2])}>${c.alt[1]}</button>` : ""}${c.pri > 1 ? `<button class="btn ghost" data-act="snooze" data-id="${c.id}">Depois</button>` : ""}</div></section>`;
}
ACT.snooze = b => { UI.snooze[b.dataset.id] = Date.now() + 30 * 6e4; render(); toast("Lembro de novo em 30 min."); };
function alignHTML() {
  const a = alignment(), col = a.pct >= 80 ? "var(--ok)" : a.pct >= 50 ? "var(--accent)" : "var(--warn)";
  return `<button class="align" data-act="align-open" aria-label="Seu dia está ${a.pct}% alinhado. Ver detalhes"><span class="al-t">Seu dia está <b class="tabnum">${a.pct}%</b> alinhado</span>${ic("right")}<span class="bar"><i style="width:${a.pct}%;background:linear-gradient(90deg,var(--accent),${col})"></i></span></button>`;
}
// detalhe do alinhamento: o que conta e quanto, com os hábitos marcáveis ali mesmo
function alignSheet() {
  const a = alignment(), d = D(today());
  const parts = a.parts.map(p => `<div class="li"><div class="grow"><b>${p.label}</b><small class="muted">${esc(p.note)}</small></div><span class="tabnum ${p.f >= 1 ? "ok" : ""}">${Math.round(p.pts * p.f)}/${p.pts}</span></div>`).join("");
  const habs = S.habits.map(h => `<button class="chk ${d.h[h.id] ? "on" : ""}" data-act="habit" data-id="${h.id}" aria-pressed="${!!d.h[h.id]}"><span class="box">${ic("check")}</span><span class="grow"><b>${esc(h.icon)} ${esc(h.t)}</b>${h.id === S.settings.rule1 ? `<small>Regra nº 1. Se cumprir uma só, que seja esta.</small>` : ""}</span></button>`).join("");
  openSheet(`<h3 class="h2">${a.pct}% alinhado</h3><p class="muted small">Só entra o que já dá para medir agora. Dia ativo = Regra nº 1 + ${S.settings.needOthers} outros hábitos.</p>
    <div class="list">${parts}</div><h4 class="lbl">Hábitos de hoje</h4><div class="stack">${habs}</div>
    <div class="grid2"><div class="tile"><div class="lbl">Sequência</div><div class="h3 tabnum">${dayStreak()} dias</div></div><div class="tile"><div class="lbl">Esta semana</div><div class="h3 tabnum">${activeInWeek(mondayOf(today()))}/5 ativos</div></div></div>
    <button class="btn full" data-act="go" data-tab="saude" data-seg="corpo">Ver ritmo das semanas</button>`);
}
ACT["align-open"] = () => alignSheet();
function nextHTML() {
  const k = today(), list = instances(k).filter(x => !x.done && !x.skip && (x.flex || x.min >= nowMin() - 30)).slice(0, 4);
  const row = x => `<button class="nx" data-act="inst-open" data-id="${x.id}"><time class="tabnum">${x.flex ? PERIODS[x.period] : x.at}</time><span class="grow">${esc(x.it.title)}</span><span class="nx-ty">${TYPES[x.it.type][0]}</span></button>`;
  return `<section class="block"><div class="row between"><h3 class="lbl">A seguir</h3><button class="link" data-act="agenda-open">Agenda ${ic("right")}</button></div>
    ${list.length ? list.map(row).join("") : `<p class="muted small">Nada mais na agenda de hoje.</p>`}</section>`;
}
function metersHTML() {
  const d = D(today()), tg = TG(), t = dayTotals(today());
  return `<section class="block meters">${meter("Água", fmtL(d.water || 0), fmtL(S.settings.waterGoal), "L", "var(--water)", "go", 'data-tab="nutri" data-seg="agua"')}
    ${meter("Proteína", Math.round(t.p), tg.prot, "g", "var(--accent)", "go", 'data-tab="nutri" data-seg="refeicoes"')}
    ${meter("Calorias", fmtInt(t.k), fmtInt(tg.kcal), "kcal", "var(--blue)", "go", 'data-tab="nutri" data-seg="refeicoes"')}</section>`;
}
function footHTML() {
  const [ft, fa] = FRASES[fraseIdx()], nm = MILESTONES.map(milestone).find(m => !m.ok);
  return `<section class="foot">${fold("Frase, dica e próximo marco", `<button class="quote" data-act="quote-next" aria-label="Outra frase"><p>“${esc(ft)}”</p><small>${esc(fa)}</small></button>
    <p class="small"><b>Dica do dia:</b> ${tipOfDay()}</p>${nm ? `<p class="small"><b>Próximo marco:</b> ${nm.nm} · ${nm.lbl}. <span class="muted">${nm.txt}</span></p>` : ""}`, false, "foot")}</section>`;
}
VIEWS.hoje = () => `${agoraHTML()}${alignHTML()}${metersHTML()}${nextHTML()}${footHTML()}`;
ACT["quote-next"] = () => { UI.qOff++; render(); const f = $('[data-fold="foot"]'); if (f) f.open = true; };
ACT.habit = b => {
  const k = dayK(), d = DW(k), id = b.dataset.id, wasA = isActive(k), wasW = activeInWeek(mondayOf(k)) >= 5;
  d.h[id] = !d.h[id]; save(); render(); haptic(); if (STACK.includes("sheet") && $("#sheet .chk[data-act=habit]")) alignSheet();
  if (!wasA && isActive(k)) toast(activeInWeek(mondayOf(k)) >= 5 && !wasW ? "Meta da semana cumprida. Isso é ritmo." : "Dia ativo. Este dia conta.");
};
ACT.supp = b => { const d = DW(dayK()); d.s[b.dataset.id] = !d.s[b.dataset.id]; save(); render(); haptic(); };
ACT["fiber-add"] = b => { fiberAdd(num(b.dataset.g), dayK()); render(); haptic(); };
