/* ============ AGENDA: adicionar (atividade, consulta, hábito, suplemento, refeição, treino) e metas diárias ============ */
const ADD_TYPES = [["atividade", "Atividade", "Caminhada, alongamento, compromisso"], ["consulta", "Consulta", "Médico, exame, avaliação"], ["habito", "Hábito", "Liga um hábito a um horário"],
  ["suplemento", "Suplemento", "Horário de um suplemento"], ["refeicao", "Refeição", "Uma refeição extra ou em outro horário"], ["treino", "Treino", "Mais um dia de treino na semana"]];
function addTypeSheet() {
  openSheet(`<h3 class="h2">Adicionar à agenda</h3><div class="tiles">${ADD_TYPES.map(([v, n, s]) => `<button class="tile-btn" data-act="inst-new-type" data-t="${v}">${ic(TYPES[v][1])}<b>${n}</b><small>${s}</small></button>`).join("")}
    <button class="tile-btn" data-act="goal-new">${ic("trend")}<b>Meta diária</b><small>Ex.: passos, alongamento em minutos</small></button><button class="tile-btn" data-act="go" data-tab="saude" data-seg="remedios">${ic("pill")}<b>Remédio</b><small>Cadastre em Saúde › Remédios</small></button></div>`);
}
function refPicker(t) {
  if (t === "habito") return `<label class="lbl" for="n-ref">Hábito</label><select class="field" id="n-ref">${S.habits.map(h => `<option value="${h.id}">${esc(h.icon)} ${esc(h.t)}</option>`).join("")}</select>`;
  if (t === "suplemento") return `<label class="lbl" for="n-ref">Suplemento</label><select class="field" id="n-ref">${S.supps.map(s => `<option value="${s.id}">${esc(s.n)}</option>`).join("")}</select>`;
  if (t === "refeicao") return `<label class="lbl" for="n-ref">Refeição</label><select class="field" id="n-ref">${MEAL_NAMES.map(m => `<option>${m}</option>`).join("")}</select>`;
  if (t === "treino") return "";
  return `<label class="lbl" for="n-title">Nome</label><input class="field" id="n-title" maxlength="60" placeholder="${t === "consulta" ? "Ex.: Endocrinologista" : "Ex.: Caminhada"}">`;
}
function addSheet(t) {
  const once = t === "consulta"; UI.edit = { days: once ? [] : EVERY.slice(), t };
  openSheet(`<div class="kick">Novo item</div><h3 class="h2">${TYPES[t][0]}</h3>${refPicker(t)}
    <div class="lbl">Repetição</div><div class="seg" id="rmode"><button class="${once ? "" : "on"}" data-act="rmode" data-v="rec">Repetir</button><button class="${once ? "on" : ""}" data-act="rmode" data-v="once">Só uma data</button></div>
    <div id="r-rec" ${once ? "hidden" : ""}>${daysPick(once ? [] : EVERY)}</div><div id="r-once" ${once ? "" : "hidden"}><label class="lbl" for="n-date">Data</label><input class="field" id="n-date" type="date" value="${dayK()}"></div>
    ${timeFields(t === "atividade" ? "" : "08:00", t === "atividade" ? "" : "", t === "treino" ? 60 : 30)}
    <button class="btn solid full" data-act="inst-add">ADICIONAR</button>`);
}
ACT["inst-new"] = () => addTypeSheet();
ACT["inst-new-type"] = b => addSheet(b.dataset.t);
ACT.rmode = b => { $$("#rmode button").forEach(x => x.classList.toggle("on", x === b)); $("#r-rec").hidden = b.dataset.v !== "rec"; $("#r-once").hidden = b.dataset.v === "rec"; };
ACT["inst-add"] = () => {
  const t = UI.edit.t, p = readTime(), once = $("#rmode .on").dataset.v === "once", ref = $("#n-ref") ? $("#n-ref").value : "";
  if ($("#tmode .on").dataset.v === "fix" && !p.at) return toast("Escolha um horário ou marque Flexível.");
  const title = t === "habito" ? (S.habits.find(h => h.id === ref) || {}).t : t === "suplemento" ? (S.supps.find(s => s.id === ref) || {}).n : t === "refeicao" ? ref : t === "treino" ? "Treino" : ($("#n-title").value || "").trim().slice(0, 60);
  if (!title) return toast("Dê um nome.");
  const date = once ? $("#n-date").value : "";
  if (once && !/^\d{4}-\d\d-\d\d$/.test(date)) return toast("Escolha a data.");
  if (!once && !UI.edit.days.length) return toast("Escolha pelo menos um dia.");
  schedAdd(Object.assign({ type: t, ref, title, days: once ? [] : UI.edit.days.slice(), date }, p));
  closeSheet(); render(); toast("Adicionado à agenda.");
};
/* ---- metas diárias personalizadas (ex.: passos) ---- */
ACT["goal-new"] = () => openSheet(`<h3 class="h2">Nova meta diária</h3><p class="muted small">Sem horário: aparece em "Metas do dia" e você soma ao longo do dia.</p>
  <label class="lbl" for="g-n">Nome</label><input class="field" id="g-n" maxlength="40" placeholder="Ex.: Passos"><div class="grid3"><div><label class="lbl" for="g-t">Meta</label><input class="field" id="g-t" inputmode="decimal" placeholder="8000"></div><div><label class="lbl" for="g-u">Unidade</label><input class="field" id="g-u" maxlength="10" placeholder="passos"></div><div><label class="lbl" for="g-s">Botão +</label><input class="field" id="g-s" inputmode="decimal" placeholder="1000"></div></div>
  <button class="btn solid full" data-act="goal-save">CRIAR META</button>`);
ACT["goal-save"] = () => {
  const n = $("#g-n").value.trim().slice(0, 40), t = num($("#g-t").value), s = num($("#g-s").value) || 1;
  if (!n || !(t > 0)) return toast("Informe nome e meta."); S.goals.push({ id: uid("g"), n, target: t, unit: $("#g-u").value.trim().slice(0, 10), step: s }); save(); closeSheet(); render();
};
ACT["goal-add"] = b => { const d = DW(dayK()), g = S.goals.find(x => x.id === b.dataset.id); if (!g) return; d.g = d.g || {}; d.g[g.id] = r1((d.g[g.id] || 0) + g.step); save(); render(); haptic(); };
ACT["goal-del"] = b => { if (!confirm("Excluir esta meta?")) return; S.goals = S.goals.filter(g => g.id !== b.dataset.id); save(); render(); };
/* ---- ações rápidas usadas pelo Hoje e pela agenda ---- */
ACT["dose-log"] = b => { const k = dayK(), id = b.dataset.id; doseLog(k, id); closeSheetIf(); render(); haptic(20); toast(`Dose registrada às ${hhmm(new Date())}.`, () => { doseUndo(k, id); render(); }); };
ACT["dose-undo"] = b => { doseUndo(dayK(), b.dataset.id); closeSheetIf(); render(); };
ACT["meal-open"] = b => { UI.meal = b.dataset.m; UI.openMeal = b.dataset.m; go("nutri", "refeicoes"); setTimeout(() => { const e = $(`[data-fold="m-${normTxt(b.dataset.m).replace(/\s/g, "")}"]`); if (e) { e.open = true; e.scrollIntoView({ block: "start", behavior: "smooth" }); } }, 60); };
