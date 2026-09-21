/* ============ MOTOR METABÓLICO: dica de proteína e água para o resto do dia ============ */
const gramsFor = (nome, alvoProt) => { const f = FOODS[foodIdx(nome)]; return f ? Math.round(alvoProt / (f[2] / 100)) : 0; };
function getMetabolicAdvice(k) {
  const d = D(k), tg = TG(), tot = dayTotals(k), now = new Date(), h = now.getHours(), endOfDay = 22;
  if (h >= endOfDay) return { diet: "Dia finalizado. Hora de descansar o sistema digestivo.", water: "Beba água com moderação agora para não prejudicar o sono." };
  if (h < 5) return { diet: "Madrugada. Se estiver acordado, mantenha-se hidratado.", water: "Beba água se tiver sede." };

  const remainingProt = Math.max(0, tg.prot - tot.p), hoursLeft = endOfDay - h;
  const mealsLeft = Math.max(1, Math.floor(hoursLeft / 3.5)), protPerMeal = Math.round(remainingProt / mealsLeft);
  const timed = (d.meals || []).filter(m => m.t);
  const lastMealTime = timed.length ? new Date(timed[timed.length - 1].t) : null;
  let dietAdvice;
  if (remainingProt <= 0) dietAdvice = "Meta de proteína batida. Se comer mais tarde, priorize fibras e vegetais.";
  else if (lastMealTime) {
    const diffHrs = (now - lastMealTime) / 36e5;
    if (diffHrs < 2) {
      const nx = new Date(lastMealTime.getTime() + 3.5 * 36e5);
      dietAdvice = `Você comeu há pouco. Próxima refeição sugerida às ${String(nx.getHours()).padStart(2, "0")}:${String(nx.getMinutes()).padStart(2, "0")}. Faltam ${Math.round(remainingProt)} g de proteína no dia.`;
    } else if (diffHrs >= 3.5) dietAdvice = `Já dá para comer de novo. Faltam ${Math.round(remainingProt)} g no dia: tente ${protPerMeal} g na próxima refeição.`;
    else dietAdvice = `Faltam ${Math.round(remainingProt)} g no dia. Sugestão para a próxima refeição: ${protPerMeal} g de proteína.`;
  } else dietAdvice = `Primeira refeição do dia? Faltam ${Math.round(remainingProt)} g. Comece com ${protPerMeal} g de proteína.`;

  if (remainingProt > 0) {
    const t = protPerMeal > 0 ? protPerMeal : Math.round(remainingProt), ovo = FOODS[foodIdx("Ovo de galinha cozido")];
    const li = (a, b) => `<div style="color:var(--muted)">${a}</div>`;
    dietAdvice += `<details class="fold" style="margin-top:12px;background:var(--surface2)"><summary style="font-size:14px;font-weight:600;color:var(--accent-ink)">Como bater ${t} g de proteína?</summary><div class="body" style="font-size:14px;line-height:1.6">
      ${li("~" + gramsFor("Peito de frango grelhado", t) + " g de frango grelhado")}${li("~" + gramsFor("Patinho grelhado", t) + " g de patinho")}
      ${li("~" + Math.round(t / (ovo[2] * ovo[4] / 100)) + " ovos cozidos")}${li("~" + gramsFor("Queijo mussarela", t) + " g de queijo mussarela")}${li("~" + gramsFor("Albumina (pó)", t) + " g de albumina em pó")}
      <div class="muted" style="font-size:13px;margin-top:6px">Valores aproximados pela tabela do app.</div></div></details>`;
  }

  const remainingWater = Math.max(0, (S.settings.waterGoal || 3000) - (d.water || 0));
  let waterAdvice;
  if (remainingWater <= 0) waterAdvice = "Meta de hidratação batida.";
  else { const mlh = Math.round(remainingWater / hoursLeft); waterAdvice = mlh > 600 ? "Você está atrasado na água para este horário. Beba 500 ml agora." : `Ritmo ideal: cerca de ${mlh} ml por hora até as ${endOfDay}h.`; }
  return { diet: dietAdvice, water: waterAdvice };
}
