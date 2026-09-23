/* ============ SAÚDE › REMÉDIOS: área sóbria; o app registra o que o médico prescreveu, nunca sugere dose ============ */
function medCard(m) {
  const a = adherence(m.id), doses = medToday(m.id), times = medTimes(m.id);
  const dz = doses.map(({ inst, taken }) => `<div class="dose ${taken ? "ok" : ""}"><span class="grow"><b class="tabnum">${inst.at || PERIODS[inst.period]}</b><small>${taken ? `Tomada ${taken === "—" ? "(registro antigo)" : "às " + taken}` : inst.min <= nowMin() ? "Pendente" : "Mais tarde"}</small></span>
    ${taken ? `<button class="btn sm" data-act="dose-undo" data-id="${inst.id}">Desfazer</button>` : `<button class="btn sm solid" data-act="dose-log" data-id="${inst.id}">Registrar dose</button>`}</div>`).join("");
  return `<article class="med"><header class="row between"><div><h3 class="h3">${esc(m.n)}</h3><p class="muted small">${m.dose ? esc(m.dose) : "Dose não informada"}${m.withMeal ? " · com refeição" : ""}${times.length ? " · " + times.join(", ") : ""}</p></div><button class="icon-btn" data-act="med-edit" data-id="${m.id}" aria-label="Editar ${esc(m.n)}">${ic("edit")}</button></header>
    ${dz || `<p class="muted small">Sem dose na agenda de hoje.</p>`}
    <div class="med-foot"><span>Adesão (30 dias): <b class="tabnum">${a.pct == null ? "—" : a.pct + "%"}</b> <span class="muted">${a.due ? `${a.ok} de ${a.due} doses` : ""}</span></span>${m.doctor ? `<span class="muted">Prescrito por ${esc(m.doctor)}</span>` : ""}</div>
    ${m.notes ? `<p class="muted xs">${esc(m.notes)}</p>` : ""}</article>`;
}
function remediosView() {
  const qs = questionsOpen();
  return `<section class="notice">${ic("shield")}<p>Registre exatamente o que seu médico prescreveu. O app não sugere, não calcula e não altera doses. Dúvida ou efeito estranho: fale com o médico.</p></section>
    ${(S.meds || []).map(medCard).join("") || `<p class="muted">Nenhum remédio cadastrado.</p>`}
    <button class="btn full" data-act="med-edit">${ic("plus")} Adicionar remédio</button>
    ${sec(`Perguntas para a próxima consulta (${qs.length})`, `${qs.map(q => `<div class="li"><button class="ck-btn" data-act="q-done" data-id="${q.id}" aria-label="Marcar como perguntada">${ic("check")}</button><span class="grow">${esc(q.text)}${q.src ? `<small class="muted">${esc(q.src)}</small>` : ""}</span></div>`).join("")}
      <form class="row" data-form="q"><input class="field" id="q-new" maxlength="240" placeholder="Escreva uma pergunta" aria-label="Nova pergunta para o médico"><button class="btn solid" type="submit">Adicionar</button></form>
      ${qs.length ? `<button class="btn ghost full" data-act="q-share">Copiar lista para levar</button>` : ""}`)}`;
}
function medSheet(id) {
  const m = id ? medById(id) : { n: "", dose: "", withMeal: false, doctor: "", notes: "" }, times = id ? medTimes(id) : ["08:00"];
  UI.medTimes = times.slice();
  openSheet(`<div class="kick">Remédio</div><h3 class="h2">${id ? esc(m.n) : "Novo remédio"}</h3>
    <label class="lbl" for="md-n">Nome</label><input class="field" id="md-n" maxlength="60" value="${esc(m.n)}">
    <label class="lbl" for="md-d">Dose (como está na receita)</label><input class="field" id="md-d" maxlength="80" value="${esc(m.dose)}" placeholder="Ex.: 1 comprimido de 850 mg">
    <div class="lbl">Horários</div><div id="md-times">${medTimesHTML()}</div><button class="btn sm ghost" data-act="md-time-add">${ic("plus")} Outro horário</button>
    <div class="row between set-row"><span class="grow">Tomar com refeição</span>${tog(m.withMeal, "md-meal", "Tomar com refeição")}</div>
    <label class="lbl" for="md-doc">Médico (opcional)</label><input class="field" id="md-doc" maxlength="60" value="${esc(m.doctor || "")}">
    <label class="lbl" for="md-no">Observações</label><input class="field" id="md-no" maxlength="200" value="${esc(m.notes || "")}">
    <button class="btn solid full" data-act="med-save" data-id="${id || ""}">SALVAR</button>${id ? `<button class="btn danger full" data-act="med-del" data-id="${id}">Remover remédio</button>` : ""}`);
}
const medTimesHTML = () => UI.medTimes.map((t, i) => `<div class="row"><input class="field" type="time" data-mt="${i}" value="${t}" aria-label="Horário ${i + 1}"><button class="icon-btn bad" data-act="md-time-del" data-i="${i}" aria-label="Remover horário">${ic("x")}</button></div>`).join("");
const readMedTimes = () => $$("[data-mt]").map(i => i.value).filter(v => /^\d\d:\d\d$/.test(v));
ACT["med-edit"] = b => medSheet(b.dataset.id);
ACT["md-time-add"] = () => { UI.medTimes = readMedTimes().concat("12:00"); $("#md-times").innerHTML = medTimesHTML(); };
ACT["md-time-del"] = b => { UI.medTimes = readMedTimes(); UI.medTimes.splice(+b.dataset.i, 1); $("#md-times").innerHTML = medTimesHTML(); };
ACT["md-meal"] = b => { b.classList.toggle("on"); b.setAttribute("aria-checked", b.classList.contains("on")); };
ACT["med-save"] = b => {
  const n = $("#md-n").value.trim().slice(0, 60); if (!n) return toast("Informe o nome.");
  medSave({ id: b.dataset.id || undefined, n, dose: $("#md-d").value.trim().slice(0, 80), withMeal: $("[data-act=md-meal]").classList.contains("on"), doctor: $("#md-doc").value.trim().slice(0, 60), notes: $("#md-no").value.trim().slice(0, 200) }, [...new Set(readMedTimes())]);
  closeSheet(); render(); toast("Remédio salvo. Horários na agenda.");
};
ACT["med-del"] = b => { if (!confirm("Remover este remédio? As doses já registradas continuam no histórico.")) return; medRemove(b.dataset.id); closeSheet(); render(); };
ACT["q-done"] = b => { const q = S.questions.find(x => x.id === b.dataset.id); if (q) { q.done = true; save(); render(); toast("Marcada como perguntada.", () => { q.done = false; save(); render(); }); } };
ACT["q-share"] = () => { const t = "Perguntas para a consulta:\n" + questionsOpen().map(q => "• " + q.text).join("\n"); try { navigator.clipboard.writeText(t).then(() => toast("Lista copiada."), () => toast("Não consegui copiar.")); } catch (e) { toast("Não consegui copiar."); } };
