/* ============ DIA ALINHADO: quanto do dia já está no ritmo, só com o que dá para medir ============ */
function alignment(k = today()) {
  const tk = k === today(),
    h = nowMin() / 60,
    d = D(k),
    tg = TG(),
    frac = tk ? clamp((h - 6) / 15, 0.1, 1) : 1,
    parts = [],
    r = S.settings.rule1;
  const add = (id, label, pts, f, note) => parts.push({ id, label, pts, f: clamp(f, 0, 1), note });
  add("rule1", "Regra nº 1", 25, d.h[r] ? 1 : 0, (S.habits.find(x => x.id === r) || {}).t || "");
  const others = S.habits.filter(x => x.id !== r && d.h[x.id]).length;
  add(
    "habits",
    "Outros hábitos",
    15,
    S.settings.needOthers ? others / S.settings.needOthers : 1,
    `${others} de ${S.settings.needOthers} para o dia contar`
  );
  add(
    "prot",
    "Proteína no ritmo",
    15,
    dayTotals(k).p / (tg.prot * frac),
    `${Math.round(dayTotals(k).p)} de ${tg.prot} g`
  );
  const w = d.water || 0,
    we = tk ? Math.max(1, waterPace(w)[2]) : S.settings.waterGoal;
  add("water", "Água no ritmo", 15, w / we, `${fmtL(w)} de ${fmtL(S.settings.waterGoal)} L`);
  const tr = instances(k).find(x => x.it.type === "treino");
  if (tr && (tr.done || tr.skip || !tk || nowMin() > tr.min + 90))
    add(
      "train",
      "Treino",
      15,
      tr.done ? 1 : tr.skip ? 0.5 : 0,
      tr.done ? "Feito" : tr.skip ? "Pulado (a sequência não quebra)" : "Não registrado"
    );
  const due = (S.meds || []).flatMap(m => medToday(m.id, k)).filter(x => !tk || x.inst.min <= nowMin());
  if (due.length)
    add(
      "meds",
      "Remédios no horário",
      15,
      due.filter(x => x.taken).length / due.length,
      `${due.filter(x => x.taken).length} de ${due.length} doses`
    );
  const tot = parts.reduce((a, p) => a + p.pts, 0);
  return { pct: Math.round((parts.reduce((a, p) => a + p.pts * p.f, 0) / tot) * 100), parts };
}
