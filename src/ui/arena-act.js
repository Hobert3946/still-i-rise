/* ============ ARENA: ações ============ */
const arenaDD = () => wkData(curStep());
ACT["wk-start"] = b => wkStart(b.dataset.day || planLetter(today()) || seqNext());
ACT["wk-resume"] = () => wkOpen();
ACT["wk-exit"] = () => { dropLayer("arena"); toast("Treino salvo. Continue pelo rio ou pelo orbe."); };
ACT["wk-prev"] = () => { if (S.cur.i > 0) { S.cur.i--; save(); arenaRender(); } };
ACT["wk-next"] = () => wkNext();
ACT["wk-mode"] = () => { const c = S.cur; c.mode = c.mode === "set" ? "end" : "set"; S.settings.logMode = c.mode; save(); arenaRender(); };
ACT["wk-warmset"] = b => { const dd = arenaDD(), i = +b.dataset.i; dd.sets[i].done = !dd.sets[i].done; save(); arenaRender(); haptic(); };
// série feita: marca, dispara o descanso do exercício (ou 60 s antes do próximo exercício)
ACT["wk-set"] = () => {
  const c = S.cur, st = stepsOf(c.day), step = st[c.i], dd = wkData(step), i = focusOf(dd), s = dd.sets[i];
  s.done = true; dd.f = null; save(); arenaRender(); haptic(15);
  const pips = $$(".pip"); if (pips[i]) pips[i].classList.add("pop");
  if (dd.sets.some(x => !x.done)) startRest(step.e.rest, `Próxima: série ${focusOf(dd) + 1} de ${dd.sets.length}`);
  else { const nx = st[c.i + 1]; if (nx) startRest(60, `Próximo: ${nx.t === "warm" ? nx.c.name : findV(nx.e, varId(nx.e))[1]}`); }
};
// tocar numa série: foca nela; se já estava feita, desfaz para corrigir
ACT["wk-focus"] = b => { const dd = arenaDD(), i = +b.dataset.i; if (S.cur.mode !== "set") return; if (dd.sets[i].done) dd.sets[i].done = false; dd.f = i; save(); arenaRender(); };
ACT["wk-adj"] = b => wkAdjFocus(b.dataset.f, num(b.dataset.d));
function wkAdjFocus(f, d) { const dd = arenaDD(); wkAdjust(dd, focusOf(dd), f, d); save(); arenaRender(); haptic(6); }
// digitar a carga de uma série copia o valor para as séries pendentes seguintes (no modo 1 toque por série)
function arenaInput(t) {
  const st = curStep(), dd = st.t === "ex" ? S.cur.data[st.e.id] : null; if (!dd) return;
  const i = +t.dataset.i, f = t.dataset.f, v = num(t.value); dd.sets[i][f] = v;
  if (f === "kg" && S.cur.mode === "set") for (let j = i + 1; j < dd.sets.length; j++) if (!dd.sets[j].done) dd.sets[j].kg = v;
  save();
}
ACT["wk-allset"] = () => { const dd = arenaDD(); dd.sets.forEach(s => s.done = true); save(); notify("Exercício registrado", "Próximo exercício."); wkNext(); };
ACT["wk-var"] = b => { const st = curStep(); S.sel[st.e.id] = b.dataset.v; delete S.cur.data[st.e.id]; save(); arenaRender(); };
ACT["wk-skip"] = () => { DW(today()).skipWk = true; save(); render(); toast("Tudo bem. A sequência não quebra."); };
ACT["wk-unskip"] = () => { DW(today()).skipWk = false; save(); render(); };
ACT["sum-next"] = b => { if (PAIN_DAYS.includes(b.dataset.day)) painSheet(b.dataset.day); else closeSheet(); render(); };
ACT.pain = b => { closeSheet(); painDo(+b.dataset.v, b.dataset.day); render(); };
// deslizar para os lados na arena troca de exercício
function arenaSwipe(dir) { const c = S.cur; if (!c) return; if (dir > 0 && c.i > 0) { c.i--; save(); arenaRender(); } else if (dir < 0 && c.i < stepsOf(c.day).length - 1) { c.i++; save(); arenaRender(); } }
