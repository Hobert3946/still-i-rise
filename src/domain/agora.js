/* ============ AGORA: a ação mais relevante do momento (sinais em sinais.js, dia alinhado em alinhamento.js) ============ */
// cada candidato: { id, pri, kick, title, text, act, data, label, alt } — o de maior prioridade vira o card AGORA
const cand = (id, pri, kick, title, text, act, label, data = {}, alt = null) => ({
  id,
  pri,
  kick,
  title,
  text,
  act,
  label,
  data,
  alt
});
function candInst(x, now) {
  const t = x.it.type,
    when = x.flex ? PERIODS[x.period].toLowerCase() : x.at,
    soon = x.min - now,
    late = soon < -30;
  const kick = late
    ? "Ficou para trás"
    : soon > 0 && !x.flex
      ? `Em ${soon} min · ${x.at}`
      : x.flex
        ? `Hoje · ${when}`
        : `Agora · ${x.at}`;
  const pri = late ? 60 : 70;
  if (t === "treino") {
    const L = planLetter(x.k) || seqNext();
    return cand(
      "i" + x.id,
      late ? 62 : 85,
      kick,
      `Treino ${L} · ${PLAN[L].name}`,
      `≈ ${estMin(L)} min. ${PLAN[L].cuff ? "Começa com aquecimento de manguito." : "Sem aquecimento de manguito hoje."}`,
      "wk-start",
      "Entrar na Arena",
      { day: L },
      ["wk-skip", "Não vou hoje"]
    );
  }
  if (t === "refeicao") {
    const a = getMetabolicAdvice(x.k);
    return cand(
      "i" + x.id,
      pri,
      kick,
      x.it.title,
      a.per > 0
        ? `Faltam ${Math.round(Math.max(0, TG().prot - dayTotals(x.k).p))} g de proteína hoje. Mire ${a.per} g nesta refeição.`
        : MEALS.find(m => m[0] === x.it.ref)[1],
      "meal-open",
      `Registrar ${x.it.title.toLowerCase()}`,
      { m: x.it.ref },
      ["inst-skip", "Pular", { id: x.id }]
    );
  }
  if (t === "remedio") {
    const m = medById(x.it.ref) || {};
    return cand(
      "i" + x.id,
      late ? 90 : 88,
      kick,
      x.it.title,
      `${m.dose ? m.dose + ". " : ""}${m.withMeal ? "Tomar com a refeição." : ""}`,
      "dose-log",
      "Registrar dose",
      { id: x.id }
    );
  }
  if (t === "suplemento") {
    const s = S.supps.find(y => y.id === x.it.ref) || {};
    return cand("i" + x.id, pri - 5, kick, x.it.title, s.tip || "", "supp", "Marcar como tomado", { id: x.it.ref });
  }
  if (t === "habito")
    return cand("i" + x.id, pri - 5, kick, x.it.title, "", "habit", "Marcar como feito", { id: x.it.ref });
  return cand(
    "i" + x.id,
    pri,
    kick,
    x.it.title,
    x.it.type === "consulta" ? "Leve suas perguntas para o médico." : "",
    "inst-done",
    "Concluir",
    { id: x.id },
    ["inst-skip", "Pular", { id: x.id }]
  );
}
function candidates(k = today()) {
  const now = nowMin(),
    h = now / 60,
    d = D(k),
    out = candSignals(k);
  if (S.cur)
    out.push(
      cand(
        "cur",
        100,
        "Treino em andamento",
        `Treino ${S.cur.day} · ${PLAN[S.cur.day].name}`,
        "Continue de onde parou.",
        "wk-resume",
        "Continuar na Arena"
      )
    );
  if (h >= 4 && h < 12 && d.sleep == null)
    out.push(
      cand(
        "sleep",
        80,
        "Bom dia",
        "Como você dormiu?",
        "Horas de sono ajudam o Coach a entender sua fome e seu treino.",
        "sleep-open",
        "Registrar sono"
      )
    );
  instances(k)
    .filter(
      x => !x.done && !x.skip && x.min - now <= 45 && x.min - now >= -180 && !(x.flex && h < 11 && x.period === "noite")
    )
    .forEach(x => out.push(candInst(x, now)));
  const w = d.water || 0,
    [, , exp] = waterPace(w);
  if (h >= 7 && h < 21 && exp - w > 400)
    out.push(
      cand(
        "water",
        65,
        "Hidratação",
        `Faltam ${fmtL(S.settings.waterGoal - w)} L para sua meta`,
        `${exp - w} ml atrás do ritmo de agora.`,
        "w-add",
        "Beber 300 ml",
        { ml: 300 },
        ["plus-water", "Outro valor"]
      )
    );
  if (h >= 20.5 && !hungerOn(k).length)
    out.push(
      cand(
        "hunger",
        55,
        "Fim do dia",
        "Como está sua fome hoje?",
        "Leva 5 segundos e ajuda a achar padrões.",
        "hunger-open",
        "Registrar fome"
      )
    );
  if (h >= 19 && !d.h[S.settings.rule1]) {
    const r = S.habits.find(x => x.id === S.settings.rule1);
    if (r)
      out.push(
        cand(
          "rule1",
          50,
          "Regra nº 1",
          r.t + "?",
          "Se cumprir uma regra só hoje, que seja esta.",
          "habit",
          "Sim, cumpri",
          { id: r.id }
        )
      );
  }
  return out.sort((a, b) => b.pri - a.pri);
}
function agoraCard(k = today()) {
  const c = candidates(k).find(x => !(UI.snooze[x.id] > Date.now()));
  if (c) return c;
  const nx = nextInst(k)[0];
  return nx
    ? cand(
        "next",
        1,
        "A seguir",
        nx.it.title,
        nx.flex ? `Hoje, ${PERIODS[nx.period].toLowerCase()}.` : `Às ${nx.at}.`,
        "agenda-open",
        "Ver agenda"
      )
    : cand(
        "end",
        0,
        "Dia fechado",
        "Nada pendente agora",
        "Tudo registrado. Descanse bem.",
        "agenda-open",
        "Ver agenda"
      );
}
