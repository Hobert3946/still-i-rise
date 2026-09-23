/* ============ INTERPRETADOR DA PALETA: texto livre → ações ============ */
// Entende: "água 500", "500", "garrafa", "peso 118,4 cintura 121", "cardio 30 6,5 5", "fibra 5", "dor 3", "pescoço 4",
// "repetir almoço", "frango 150 @almoço" (refeição pelo horário se omitida), "?pergunta" para a Aura, e comandos/lentes.
const MEAL_ALIAS = { cafe: "Café da manhã", "cafe da manha": "Café da manhã", manha: "Café da manhã", almoco: "Almoço", alm: "Almoço", lanche: "Lanche", jantar: "Jantar", janta: "Jantar", ceia: "Ceia" };
const cmd = (icon, label, sub, run) => ({ icon, label, sub, run });
function mealIn(t) {
  const m = t.match(/@\s*([a-z ]+)$/) || t.match(/\b(cafe da manha|cafe|almoco|alm|lanche|jantar|janta|ceia)\s*$/);
  return m ? { meal: MEAL_ALIAS[m[1].trim()] || null, rest: t.slice(0, m.index).trim() } : { meal: null, rest: t };
}
function parseWater(t) {
  let m = t.match(/^(?:agua|beber|bebi)\s*\+?\s*(\d{2,4})\s*(?:ml)?$/) || t.match(/^\+?(\d{2,4})\s*(?:ml)?\s*(?:de\s+)?(?:agua)?$/);
  if (m && +m[1] > 0 && +m[1] <= 3000) return [cmd("drop", `Água +${m[1]} ml`, "Registrar agora", () => waterDo(+m[1]))];
  const sz = WSIZES.find(([n]) => normTxt(n) === t.replace(/^agua\s+/, ""));
  return sz ? [cmd("drop", `Água +${sz[1]} ml`, sz[0], () => waterDo(sz[1]))] : [];
}
function parseNumbers(t) {
  let m;
  if ((m = t.match(/^peso\s+([\d.,]+)(?:\s*kg)?(?:\s+cintura\s+([\d.,]+))?/))) return [cmd("scale", `Peso ${m[1]} kg${m[2] ? ` · cintura ${m[2]} cm` : ""}`, "Registrar pesagem de hoje", () => weighSave(num(m[1]), num(m[2])))];
  if ((m = t.match(/^cardio\s+(\d+)(?:\s+([\d.,]+))?(?:\s+([\d.,]+))?/))) return [cmd("flame", `Cardio ${m[1]} min`, `${m[2] ? m[2] + " km/h " : ""}${m[3] ? "· " + m[3] + "% " : ""}`, () => { cardioAdd(+m[1], num(m[2]), num(m[3]), dayK()); toast("Cardio registrado."); })];
  if ((m = t.match(/^fibras?\s+(-?\d+)/))) return [cmd("leaf", `Fibras ${+m[1] > 0 ? "+" : ""}${m[1]} g`, "Registro manual", () => { fiberAdd(+m[1], dayK()); toast("Fibras: " + D(dayK()).fiber + " g."); })];
  if ((m = t.match(/^dor\s+(\d{1,2})$/)) && +m[1] <= 10) return [cmd("shield", `Dor no ombro ${m[1]}/10`, "Registrar agora", () => painDo(+m[1]))];
  if ((m = t.match(/^pesco[c]?o\s+([1-5])$/))) return [cmd("sun", `Pescoço ${m[1]}/5`, "Termômetro da acantose", () => neckSave(+m[1]))];
  if ((m = t.match(/^repetir\s+(.+)$/))) { const ml = MEAL_ALIAS[m[1].trim()] || MEAL_NAMES.find(x => normTxt(x).startsWith(m[1].trim())); if (ml) return [cmd("repeat", `Repetir ${ml}`, `${lastMealItems(ml, dayK()).length} itens da última vez`, () => { const n = mealRepeat(ml, dayK()); toast(n ? `${n} itens adicionados.` : "Nada para repetir."); })]; }
  return [];
}
function parseFood(t) {
  const { meal, rest } = mealIn(t), gm = rest.match(/(\d+[.,]?\d*)\s*(g|gramas?)?\b/), g = gm ? num(gm[1]) : 0;
  const q = (gm ? rest.replace(gm[0], " ") : rest).replace(/\s+de\s+/g, " ").trim(); if (q.length < 2) return [];
  const m = meal || mealByTime();
  // seus favoritos, recentes e as sugestões das refeições vêm antes (ex.: "frango" → peito grelhado, não frango frito)
  const mine = new Set([...recentFoods(20).map(x => x.n), ...Object.values(S.favs || {}).flat(), ...MEALS.flatMap(x => x[2])]);
  const hits = foodSearch(q, 40), top = hits.filter(i => mine.has(FOODS[i][0])).concat(hits.filter(i => !mine.has(FOODS[i][0]))).slice(0, 5);
  return top.map(i => { const f = FOODS[i], gg = g > 0 && g < 2000 ? g : f[4];
    return cmd("fork", `${shortName(f[0])} · ${gg} g`, `${m} · ${Math.round(f[1] * gg / 100)} kcal · ${r1(f[2] * gg / 100)} g prot`, () => { foodAdd(i, gg, m, dayK()); toast(`Adicionado em ${m}.`); if (isSugarDrink(f)) toast("Bebida com açúcar: quebra a Regra nº 1 de hoje."); }); });
}
function staticCommands() {
  const L = (l, n, icon) => cmd(icon, "Lente " + n, "Abrir", () => openLens(l));
  return [
    [["treino", "arena", "academia"], cmd("dumb", S.cur ? "Continuar treino na Arena" : "Entrar na Arena", "Modo Treino", () => S.cur ? wkOpen() : wkStart(planLetter(today()) || seqNext()))],
    [["peso", "pesagem", "balanca"], cmd("scale", "Registrar peso", "Pesagem semanal", () => weighSheet())],
    [["cardio", "esteira", "caminhada"], cmd("flame", "Registrar cardio", "Minutos, velocidade e inclinação", () => cardioSheet())],
    [["foto", "prato", "camera"], cmd("camera", "Foto do prato", "Estimativa pelo Gemini", () => fotoStart())],
    [["rotulo", "label", "kcal"], cmd("tag", "Adicionar por rótulo", "kcal e proteína", () => quickSheet(mealByTime()))],
    [["desfazer", "undo"], cmd("drop", "Desfazer última água", "Remove o último registro", () => { waterUndo(dayK()); toast("Último registro de água desfeito."); })],
    [["backup", "exportar"], cmd("download", "Exportar backup .json", "Camada 3", () => exportData())],
    [["importar", "restaurar"], cmd("upload", "Importar backup .json", "Substitui os dados", () => $("#file").click())],
    [["nuvem", "gist", "sync"], cmd("cloud", "Enviar para a nuvem agora", "GitHub Gist", () => syncToCloud(true))],
    [["rua", "restaurante", "comer fora"], cmd("fork", "Comer na rua", "7 situações: boa × armadilha", () => openLens("nutri", "rua"))],
    [["lembrete", "alarme", "calendario"], cmd("download", "Lembretes no calendário", ".ics", () => remSheet())],
    [["resumo", "semana"], cmd("trend", "Resumo da semana", "Últimos 7 dias", () => reviewOpen())],
    [["recaida", "furei", "furou"], cmd("leaf", "Protocolo de recaída", "Refeição, dia, semana", () => openLens("corpo", "recaida"))],
    [["tema"], cmd("moon", "Alternar tema", "Claro / escuro", () => ACT["theme-flip"]())],
    [["corpo", "evolucao", "marcos"], L("corpo", "Corpo", "trend")], [["nutri", "comida", "comer", "dieta"], L("nutri", "Nutrição", "fork")],
    [["agua", "hidrat"], L("agua", "Água", "drop")], [["plano", "treino"], L("treino", "Treino", "dumb")],
    [["aura", "ia", "chat"], L("aura", "Aura (IA)", "sparkles")], [["sistema", "config", "ajuste", "perfil", "habito", "suplemento", "catalogo"], L("sistema", "Sistema", "gear")]
  ];
}
function parseCommand(raw) {
  const t = normTxt(raw.trim()).replace(/\s+/g, " "); if (!t) return [];
  if (t.startsWith("?")) return [cmd("sparkles", "Perguntar à Aura", raw.trim().slice(1), () => { openLens("aura"); askAura(raw.trim().slice(1).trim()); })];
  const direct = [...parseWater(t), ...parseNumbers(t)];
  const pm = t.match(/^perfil\s+(.+)$/), prof = pm ? Object.values(R.profiles).filter(p => normTxt(p.profile.name).includes(pm[1])).map(p => cmd("user", "Trocar para " + p.profile.name, "Perfil", () => switchProfile(p.id))) : [];
  const stat = staticCommands().filter(([ks]) => ks.some(k => k.startsWith(t) || t.startsWith(k))).map(x => x[1]);
  return [...direct, ...prof, ...parseFood(t), ...stat].slice(0, 9);
}
