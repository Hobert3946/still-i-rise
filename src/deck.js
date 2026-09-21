/* ============ DECK, cabeçalho, Aura, cardio e resumo semanal ============ */
function applyTimeTheme() {
  const hr = new Date().getHours();
  document.body.classList.remove("theme-morning", "theme-night");
  if (hr >= 4 && hr < 10) document.body.classList.add("theme-morning");
  else if (hr >= 19 || hr < 4) document.body.classList.add("theme-night");
}
/* cabeçalho: saudação, relógio e nome. Roda 1x por minuto (não a cada segundo). */
function updateTopHeader() {
  const now = new Date(), hr = now.getHours(), set = (id, v) => { const e = document.getElementById(id); if (e && e.textContent !== v) e.textContent = v; };
  set("topGreeting", hr >= 5 && hr < 12 ? "Bom dia" : hr >= 12 && hr < 18 ? "Boa tarde" : "Boa noite");
  set("topClock", now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
  if (S && S.profile) set("topName", S.profile.name || "Praticante");
}
function tickHeader() { updateTopHeader(); setTimeout(tickHeader, 60000 - (Date.now() % 60000) + 50); }

/* Aura: estado visual segundo o dia */
function auraState(d, tg) {
  const p = (d.meals || []).reduce((a, m) => a + (m.p || 0), 0), cardio = (d.cardios || []).length > 0;
  if (p >= tg.prot * 0.9 && cardio) return ["overdrive", "Proteína e cardio do dia em dia. Segue o ritmo.", "var(--accent)"];
  if (p >= 40 || (d.water || 0) > 1000) return ["fed", "O núcleo absorveu energia. Mantenha proteína e água.", "var(--text)"];
  return ["", "Sua aura precisa fluir. Tome um copo grande de água agora.", "var(--muted)"];
}

function deckBanners(k) {
  const ban = [], abs = daysAbsent(), ab = ABSENCE.find(a => abs >= a.min);
  if (ab) ban.push(banner("acc", "leaf", `${abs} dias sem registro`, ab.txt));
  if (S.cur) ban.push(banner("acc", "play", "Treino em andamento", `Você começou o treino ${S.cur.day}. Continue de onde parou.`, `<div style="margin-top:8px"><button class="btn sm solid" data-act="wk-resume">Continuar treino</button></div>`));
  const pa = painAvg(); if (pa !== null && pa >= 4) ban.push(banner("bad", "shield", "Dor no ombro em alta", `Média das 3 últimas: ${r1(pa)}/10. Procure um fisioterapeuta antes de aumentar carga de empurrar.`));
  if (deloadSignal()) ban.push(banner("warn", "info", "Sinal de deload", "3 ou mais exercícios falharam 2 sessões seguidas com a mesma carga. Reduza cerca de 20% nesta semana e reavalie."));
  const bk = S.settings.lastBackup, bdays = bk ? diffDays(k, bk) : (Object.keys(S.days).length ? diffDays(k, firstDay()) : 0);
  if (bdays > 21) ban.push(banner("warn", "download", "Backup atrasado", `${bk ? `Último backup há ${bdays} dias.` : "Você nunca exportou um backup."} O arquivo .json é o único que sobrevive à troca de celular.`, `<div style="margin-top:8px"><button class="btn sm" data-act="export">Exportar agora</button></div>`));
  const wk = mondayOf(k);
  if (parseKey(k).getDay() === 1 && !S.weights.some(w => w.d >= wk)) ban.push(banner("acc", "scale", "Dia de pesagem", "Segunda: ao acordar, depois do banheiro, antes de comer. Meça a cintura junto.", `<div style="margin-top:8px"><button class="btn sm solid" data-act="weigh">Registrar peso</button></div>`));
  return ban.join("");
}
function deckWorkoutCard(k, d, L) {
  const done = !!d.wk && !S.cur;
  if (d.skipWk && !done && !S.cur) {
    const nl = L || seqNext();
    return `<div class="sec-t"><span class="dot sage"></span><span class="lbl">Hoje sem treino</span></div><h3 class="mid">Tudo bem, hoje o foco é a dieta.</h3><p class="muted">O treino <b>${nl} · ${PLAN[nl].name}</b> fica guardado para amanhã. Sua sequência não quebra.</p><button class="btn full" data-act="wk-unskip">Desfazer (vou treinar)</button>`;
  }
  if (L && done) {
    const nl = seqNext();
    return `<div class="sec-t"><span class="dot ok"></span><span class="lbl">Treino de hoje</span></div><h3 class="mid">${L} · ${PLAN[L].name} concluído</h3><p class="muted">As cargas do próximo treino já foram atualizadas. Próximo: <b>${nl} · ${PLAN[nl].name}</b>.</p><button class="btn full" data-act="goto-treino" data-day="${nl}">Ver próximo treino</button>`;
  }
  if (L) {
    const p = PLAN[L];
    return `<div class="row between"><div><div class="sec-t"><span class="dot"></span><span class="lbl" style="color:var(--accent-ink)">Sessão do amanhecer · ${DOW[parseKey(k).getDay()]}</span></div><h3 class="mid" style="margin-top:4px">${L} · ${p.name}</h3></div><span class="pill">05:00 · ${estMin(L)} min</span></div>
      <p class="muted">${p.focus}. ${p.cuff ? "Começa com aquecimento de manguito." : "Sem aquecimento de manguito hoje."} ${inAdapt() ? "Semana " + weekNo() + " de adaptação: carga leve." : ""}</p>
      <button class="btn solid full" data-act="${S.cur ? "wk-resume" : "wk-start"}" data-day="${L}">${ic("play", "fill")} ${S.cur ? "CONTINUAR TREINO" : "INICIAR TREINO DO DIA"}</button>`;
  }
  return `<div class="sec-t"><span class="dot sage"></span><span class="lbl">Descanso ativo</span></div><h3 class="mid">Fim de semana</h3><p class="muted">Sem treino de academia. Caminhada livre de 30 minutos conta como hábito. Se quiser treinar, escolha um dia na aba Treino.</p>`;
}
const qtile = (act, icon, val, lbl) => `<button class="card qtile" ${act}><span class="qi">${ic(icon)}</span><b class="tabnum">${val}</b><span class="lbl">${lbl}</span></button>`;

function rDeck() {
  const k = today(), d = D(k), L = planLetter(k), tg = TG(), tot = dayTotals(k), ds = dayStreak(), ws = weekStreak();
  const week = activeInWeek(mondayOf(k)), advice = getMetabolicAdvice(k), [ac, am, acol] = auraState(d, tg);
  const cardioMin = (d.cardios || []).reduce((a, c) => a + (c.min || 0), 0);
  const habits = HABITS.map(([id, t]) => `<button class="chk ${d.h[id] ? "on" : ""} ${id === "acucar" ? "key" : ""}" data-act="habit" data-id="${id}"><span class="box">${ic("check")}</span><span class="t">${t}${id === "acucar" ? `<span class="s">Regra nº 1. Se cumprir uma só, que seja esta.</span>` : ""}</span></button>`).join("");
  const sup = SUPP_BASE.map(([id, n, s]) => `<button class="chk ${d.s[id] ? "on" : ""}" data-act="supp" data-id="${id}"><span class="box">${ic("check")}</span><span class="t">${n}<span class="s">${s}</span></span></button>`).join("");
  const nextM = MILESTONES.find(m => !m.test(S.profile.startWeight, Math.min(...S.weights.map(w => w.kg), S.profile.startWeight)));
  const ban = deckBanners(k), fold = (dot, t, body) => `<details class="fold card"><summary><span class="row"><span class="dot ${dot}"></span><span class="lbl">${t}</span></span>${ic("down")}</summary><div class="body">${body}</div></details>`;
  $("#v-deck").innerHTML = `
  ${ban ? `<section class="stack">${ban}</section>` : ""}
  <div class="aura-container" id="aura-container"><div class="aura-core ${ac}" id="auraCoreEl"></div><div class="aura-msg" id="auraMsgEl" style="color:${acol}">${am}</div></div>
  <section class="card tipcard"><div class="lbl" style="color:var(--text)">Dica do núcleo</div><div style="font-size:15px;line-height:1.5;color:var(--muted)">${advice.diet}<br><span style="color:var(--text)">${advice.water}</span></div></section>
  ${fraseHTML()}
  <section class="card">${deckWorkoutCard(k, d, L)}</section>
  <div class="qstrip">
    ${qtile('data-go="agua"', "drop", (d.water / 1000).toFixed(1).replace(".", ",") + " L", `Água ${Math.round(Math.min(1, (d.water || 0) / S.settings.waterGoal) * 100)}%`)}
    ${qtile('data-go="comer"', "fork", Math.round(tot.p) + " g", "Proteína")}
    ${qtile('data-act="cardio-open"', "flame", cardioMin ? cardioMin + " min" : "0 min", "Cardio")}
    ${qtile('data-go="evol"', "trend", String(ds), ds === 1 ? "Dia seguido" : "Dias seguidos")}
  </div>
  ${fold("ok", `Hábitos diários (${habitCount(k)}/6)`, `<div class="stack">${habits}</div>`)}
  ${fold("sage", `Suplementos de hoje (${Object.values(d.s).filter(Boolean).length}/${SUPP_BASE.length})`, sup)}
  ${fold("acc", `Ritmo semanal (${week}/5)`, `<div class="row" style="gap:16px;margin-top:10px">${ring(week / 5, 96, 7, "var(--sage)", `<div><div class="big tabnum">${week}<span class="muted" style="font-size:14px">/5</span></div><div class="lbl">ativos</div></div>`)}
      <div class="grow stack"><div class="tile row between"><div><div class="lbl">Sequência de dias</div><div class="mid tabnum">${ds}</div></div>${ic("flame")}</div><div class="tile row between"><div><div class="lbl">Sequência de semanas</div><div class="mid tabnum">${ws}</div></div>${ic("trend")}</div></div></div>
      <p class="muted" style="font-size:15px;margin-top:10px">Dia ativo = zero açúcar + 2 outros hábitos. Semana verde: 5+ dias. Semana amarela (4) não quebra a sequência. Só 2 semanas ruins seguidas zeram.</p>
      <button class="btn sm full" data-act="review-open" style="margin-top:8px">Ver resumo da semana</button>`)}
  ${nextM ? `<section class="card flat"><div class="lbl">Próximo marco</div><div class="mid">${nextM.nm} · ${nextM.lbl(S.profile.startWeight)}</div><p class="muted">${nextM.txt}</p></section>` : ""}
  <section class="card flat row" style="align-items:flex-start"><span style="color:var(--accent-ink)">${ic("sun")}</span><div><div class="lbl" style="color:var(--text)">Dica do dia</div><p class="muted" style="margin-top:2px">${tipOfDay()}</p></div></section>
  `;
}

/* --- cardio --- */
ACT["cardio-open"] = () => { closeSheet(); $("#cardioSheet").classList.add("on"); };
ACT["cardio-close"] = () => $("#cardioSheet").classList.remove("on");
ACT["cardio-save"] = () => {
  const min = num($("#cardioMins").value); if (min <= 0) return toast("Informe os minutos.");
  const d = DW(today()); d.cardios = d.cardios || [];
  d.cardios.push({ min, spd: num($("#cardioSpd").value), inc: num($("#cardioInc").value) });
  ["cardioMins", "cardioSpd", "cardioInc"].forEach(i => $("#" + i).value = "");
  save(); $("#cardioSheet").classList.remove("on"); toast("Cardio registrado."); render();
};

/* --- resumo semanal (últimos 7 dias, com números reais) --- */
function weekReview() {
  const k = today(), prot = [];
  let cardio = 0, act = 0;
  for (let i = 1; i <= 7; i++) {
    const dk = addDays(k, -i), d = D(dk), p = (d.meals || []).reduce((a, m) => a + (m.p || 0), 0);
    if (p > 0) prot.push(p); cardio += (d.cardios || []).reduce((a, c) => a + (c.min || 0), 0); if (isActive(dk)) act++;
  }
  const avg = prot.length ? Math.round(prot.reduce((a, b) => a + b, 0) / prot.length) : 0, tp = TG().prot;
  const sug = !prot.length ? "Sem comida registrada na semana. Registre ao menos o almoço para o app poder ajudar."
    : avg < tp * 0.85 ? `Proteína média de ${avg} g, abaixo da meta de ${tp} g. Coloque uma fonte de proteína em cada refeição.`
    : act >= 5 ? "Semana verde: 5 ou mais dias ativos. Mantenha o ritmo." : `${act} dias ativos. Faltam ${5 - act} para a meta: escolha o hábito mais fácil e repita amanhã.`;
  return { avg, cardio, act, sug, prot: prot.length };
}
function reviewOpen() {
  const r = weekReview();
  $("#revP").textContent = r.prot ? r.avg + " g" : "—"; $("#revC").textContent = r.cardio + " min"; $("#revW").textContent = `${r.act} de 7 dias ativos · semana ${weekNo()}`; $("#revSug").textContent = r.sug;
  $("#reviewSheet").classList.add("on");
}
ACT["review-open"] = reviewOpen;
ACT["review-close"] = () => $("#reviewSheet").classList.remove("on");
function maybeReview() {
  const k = today();
  if (parseKey(k).getDay() === 1 && S.settings.revSeen !== k && Object.values(S.days).some(hasData)) { S.settings.revSeen = k; save(); reviewOpen(); }
}
