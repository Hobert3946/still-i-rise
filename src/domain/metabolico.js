/* ============ MOTOR METABÓLICO: proteína e água para o resto do dia ============ */
const END_OF_DAY = 22;
const gramsFor = (nome, alvoProt) => { const f = FOODS[foodIdx(nome)]; return f ? Math.round(alvoProt / (f[2] / 100)) : 0; };
// quanto comer de cada fonte para bater t gramas de proteína (valores da tabela do app)
function protExamples(t) {
  const ovo = FOODS[foodIdx("Ovo de galinha cozido")];
  return [
    `~${gramsFor("Peito de frango grelhado", t)} g de frango grelhado`, `~${gramsFor("Patinho grelhado", t)} g de patinho`,
    `~${Math.round(t / (ovo[2] * ovo[4] / 100))} ovos cozidos`, `~${gramsFor("Queijo mussarela", t)} g de queijo mussarela`,
    `~${gramsFor("Albumina (pó)", t)} g de albumina em pó`
  ];
}
function dietAdvice(d, now, remP, perMeal) {
  const timed = (d.meals || []).filter(m => m.t), last = timed.length ? new Date(timed[timed.length - 1].t) : null;
  if (remP <= 0) return { txt: "Meta de proteína batida. Se comer mais tarde, priorize fibras e vegetais.", next: null };
  if (!last) return { txt: `Primeira refeição do dia? Faltam ${Math.round(remP)} g. Comece com ${perMeal} g de proteína.`, next: now };
  const diffHrs = (now - last) / 36e5, nx = new Date(last.getTime() + 3.5 * 36e5);
  if (diffHrs < 2) return { txt: `Você comeu há pouco. Próxima refeição sugerida às ${hhmm(nx)}. Faltam ${Math.round(remP)} g de proteína no dia.`, next: nx };
  if (diffHrs >= 3.5) return { txt: `Já dá para comer de novo. Faltam ${Math.round(remP)} g no dia: tente ${perMeal} g na próxima refeição.`, next: now };
  return { txt: `Faltam ${Math.round(remP)} g no dia. Sugestão para a próxima refeição: ${perMeal} g de proteína.`, next: nx };
}
function getMetabolicAdvice(k = today()) {
  const d = D(k), tg = TG(), tot = dayTotals(k), now = new Date(), h = now.getHours();
  if (h >= END_OF_DAY) return { diet: "Dia finalizado. Hora de descansar o sistema digestivo.", water: "Beba água com moderação agora para não prejudicar o sono.", ex: [], next: null, per: 0 };
  if (h < 5) return { diet: "Madrugada. Se estiver acordado, mantenha-se hidratado.", water: "Beba água se tiver sede.", ex: [], next: null, per: 0 };
  const remP = Math.max(0, tg.prot - tot.p), hoursLeft = END_OF_DAY - h;
  const perMeal = Math.round(remP / Math.max(1, Math.floor(hoursLeft / 3.5)));
  const da = dietAdvice(d, now, remP, perMeal), t = perMeal > 0 ? perMeal : Math.round(remP);
  const remW = Math.max(0, S.settings.waterGoal - (d.water || 0)), mlh = Math.round(remW / hoursLeft);
  const water = remW <= 0 ? "Meta de hidratação batida." : mlh > 600 ? "Você está atrasado na água para este horário. Beba 500 ml agora." : `Ritmo ideal: cerca de ${mlh} ml por hora até as ${END_OF_DAY}h.`;
  return { diet: da.txt, water, ex: remP > 0 ? protExamples(t) : [], per: t, next: da.next };
}
