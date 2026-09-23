/* ============ AGORA: a ação mais relevante do momento + "dia alinhado %" ============ */
// cada candidato: { id, pri, kick, title, text, act, data, label, alt } — o de maior prioridade vira o card AGORA
const cand = (id, pri, kick, title, text, act, label, data = {}, alt = null) => ({ id, pri, kick, title, text, act, label, data, alt });
function candSignals(k) {
  const out = [], abs = daysAbsent(), ab = ABSENCE.find(a => abs >= a.min), pa = painAvg();
  if (ab) out.push(cand("abs", 95, "Bem-vindo de volta", `${abs} dias sem registro`, ab.txt, "habit", "Marcar a Regra nº 1", { id: S.settings.rule1 }));
  if (pa !== null && pa >= 4) out.push(cand("pain", 45, "Ombro", "Dor em alta", `Média das 3 últimas: ${r1(pa)}/10. Procure um fisioterapeuta antes de aumentar carga de empurrar.`, "go", "Ver treino", { tab: "treino" }));
  if (deloadSignal()) out.push(cand("deload", 44, "Treino", "Sinal de deload", "3 ou mais exercícios falharam 2 sessões seguidas com a mesma carga. Reduza cerca de 20% nesta semana e reavalie.", "go", "Ver treino", { tab: "treino" }));
  if (backupDays() > 21) out.push(cand("backup", 35, "Seus dados", "Backup atrasado", `${S.settings.lastBackup ? `Último backup há ${backupDays()} dias.` : "Você nunca exportou um backup."} O arquivo .json é o único que sobrevive à troca de celular.`, "export", "Exportar agora"));
  if (parseKey(k).getDay() === 1 && !S.weights.some(w => w.d >= mondayOf(k)) && new Date().getHours() < 12) out.push(cand("weigh", 75, "Segunda-feira", "Dia de pesagem", "Ao acordar, depois do banheiro, antes de comer. Meça a cintura junto.", "weigh", "Registrar peso"));
  return out;
}
function candInst(x, now) {
  const t = x.it.type, when = x.flex ? PERIODS[x.period].toLowerCase() : x.at, soon = x.min - now, late = soon < -30;
  const kick = late ? "Ficou para trás" : soon > 0 && !x.flex ? `Em ${soon} min · ${x.at}` : x.flex ? `Hoje · ${when}` : `Agora · ${x.at}`;
  const pri = late ? 60 : 70;
  if (t === "treino") { const L = planLetter(x.k) || seqNext(); return cand("i" + x.id, late ? 62 : 85, kick, `Treino ${L} · ${PLAN[L].name}`, `≈ ${estMin(L)} min. ${PLAN[L].cuff ? "Começa com aquecimento de manguito." : "Sem aquecimento de manguito hoje."}`, "wk-start", "Entrar na Arena", { day: L }, ["wk-skip", "Não vou hoje"]); }
  if (t === "refeicao") { const a = getMetabolicAdvice(x.k); return cand("i" + x.id, pri, kick, x.it.title, a.per > 0 ? `Faltam ${Math.round(Math.max(0, TG().prot - dayTotals(x.k).p))} g de proteína hoje. Mire ${a.per} g nesta refeição.` : MEALS.find(m => m[0] === x.it.ref)[1], "meal-open", `Registrar ${x.it.title.toLowerCase()}`, { m: x.it.ref }, ["inst-skip", "Pular", { id: x.id }]); }
  if (t === "remedio") { const m = medById(x.it.ref) || {}; return cand("i" + x.id, late ? 90 : 88, kick, x.it.title, `${m.dose ? m.dose + ". " : ""}${m.withMeal ? "Tomar com a refeição." : ""}`, "dose-log", "Registrar dose", { id: x.id }); }
  if (t === "suplemento") { const s = S.supps.find(y => y.id === x.it.ref) || {}; return cand("i" + x.id, pri - 5, kick, x.it.title, s.tip || "", "supp", "Marcar como tomado", { id: x.it.ref }); }
  if (t === "habito") return cand("i" + x.id, pri - 5, kick, x.it.title, "", "habit", "Marcar como feito", { id: x.it.ref });
  return cand("i" + x.id, pri, kick, x.it.title, x.it.type === "consulta" ? "Leve suas perguntas para o médico." : "", "inst-done", "Concluir", { id: x.id }, ["inst-skip", "Pular", { id: x.id }]);
}
function candidates(k = today()) {
  const now = nowMin(), h = now / 60, d = D(k), out = candSignals(k);
  if (S.cur) out.push(cand("cur", 100, "Treino em andamento", `Treino ${S.cur.day} · ${PLAN[S.cur.day].name}`, "Continue de onde parou.", "wk-resume", "Continuar na Arena"));
  if (h >= 4 && h < 12 && d.sleep == null) out.push(cand("sleep", 80, "Bom dia", "Como você dormiu?", "Horas de sono ajudam o Coach a entender sua fome e seu treino.", "sleep-open", "Registrar sono"));
  instances(k).filter(x => !x.done && !x.skip && x.min - now <= 45 && x.min - now >= -180 && !(x.flex && h < 11 && x.period === "noite")).forEach(x => out.push(candInst(x, now)));
  const w = d.water || 0, [, , exp] = waterPace(w);
  if (h >= 7 && h < 21 && exp - w > 400) out.push(cand("water", 65, "Hidratação", `Faltam ${fmtL(S.settings.waterGoal - w)} L para sua meta`, `${exp - w} ml atrás do ritmo de agora.`, "w-add", "Beber 300 ml", { ml: 300 }, ["plus-water", "Outro valor"]));
  if (h >= 20.5 && !hungerOn(k).length) out.push(cand("hunger", 55, "Fim do dia", "Como está sua fome hoje?", "Leva 5 segundos e ajuda a achar padrões.", "hunger-open", "Registrar fome"));
  if (h >= 19 && !d.h[S.settings.rule1]) { const r = S.habits.find(x => x.id === S.settings.rule1); if (r) out.push(cand("rule1", 50, "Regra nº 1", r.t + "?", "Se cumprir uma regra só hoje, que seja esta.", "habit", "Sim, cumpri", { id: r.id })); }
  return out.sort((a, b) => b.pri - a.pri);
}
function agoraCard(k = today()) {
  const c = candidates(k).find(x => !(UI.snooze[x.id] > Date.now()));
  if (c) return c;
  const nx = nextInst(k)[0];
  return nx ? cand("next", 1, "A seguir", nx.it.title, nx.flex ? `Hoje, ${PERIODS[nx.period].toLowerCase()}.` : `Às ${nx.at}.`, "agenda-open", "Ver agenda")
    : cand("end", 0, "Dia fechado", "Nada pendente agora", "Tudo registrado. Descanse bem.", "agenda-open", "Ver agenda");
}
/* ---- dia alinhado: só entra o que já dá para medir ---- */
function alignment(k = today()) {
  const tk = k === today(), h = nowMin() / 60, d = D(k), tg = TG(), frac = tk ? clamp((h - 6) / 15, 0.1, 1) : 1, parts = [], r = S.settings.rule1;
  const add = (id, label, pts, f, note) => parts.push({ id, label, pts, f: clamp(f, 0, 1), note });
  add("rule1", "Regra nº 1", 25, d.h[r] ? 1 : 0, (S.habits.find(x => x.id === r) || {}).t || "");
  const others = S.habits.filter(x => x.id !== r && d.h[x.id]).length;
  add("habits", "Outros hábitos", 15, S.settings.needOthers ? others / S.settings.needOthers : 1, `${others} de ${S.settings.needOthers} para o dia contar`);
  add("prot", "Proteína no ritmo", 15, dayTotals(k).p / (tg.prot * frac), `${Math.round(dayTotals(k).p)} de ${tg.prot} g`);
  const w = d.water || 0, we = tk ? Math.max(1, waterPace(w)[2]) : S.settings.waterGoal;
  add("water", "Água no ritmo", 15, w / we, `${fmtL(w)} de ${fmtL(S.settings.waterGoal)} L`);
  const tr = instances(k).find(x => x.it.type === "treino");
  if (tr && (tr.done || tr.skip || !tk || nowMin() > tr.min + 90)) add("train", "Treino", 15, tr.done ? 1 : tr.skip ? 0.5 : 0, tr.done ? "Feito" : tr.skip ? "Pulado (a sequência não quebra)" : "Não registrado");
  const due = (S.meds || []).flatMap(m => medToday(m.id, k)).filter(x => !tk || x.inst.min <= nowMin());
  if (due.length) add("meds", "Remédios no horário", 15, due.filter(x => x.taken).length / due.length, `${due.filter(x => x.taken).length} de ${due.length} doses`);
  const tot = parts.reduce((a, p) => a + p.pts, 0);
  return { pct: Math.round(parts.reduce((a, p) => a + p.pts * p.f, 0) / tot * 100), parts };
}
