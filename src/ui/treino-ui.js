/* ============ TREINO: o treino de hoje, plano A–E, variações, regras de carga, dor, deload, recordes ============ */
function nextBadge(slot, vid) {
  const h = S.logs[vid] || [], last = h[h.length - 1]; if (!last || !(last.sets[0] && last.sets[0].kg > 0)) return "";
  const nx = nextLoad(slot, last.sets);
  return `<span class="pill ${nx.dir === "up" ? "ok" : nx.dir === "down" ? "warn" : ""}">${nx.dir === "up" ? "↑" : nx.dir === "down" ? "↓" : "="} ${nx.kg} kg</span>`;
}
function planList(L) {
  const p = PLAN[L];
  const warm = p.cuff ? CUFF.map(c => `<div class="li"><div class="grow"><b>${c.name}</b><small class="muted">${c.sets} × ${c.reps[0]} · ${esc(c.how)}</small></div><span class="pill acc">AQUEC.</span></div>`).join("") : "";
  const ex = p.ex.map(e => { const v = findV(e, varId(e));
    return `<details class="fold ex" data-fold="ex-${e.id}"><summary><span class="grow"><b>${esc(v[1])}</b><small class="muted">${e.sets} × ${repsTxt(e)} · descanso ${e.rest}s${e.inc ? ` · +${e.inc} kg` : ""}</small></span>${nextBadge(e, v[0])}${ic("down")}</summary>
      <div class="body"><p class="how">${esc(v[2])}</p><div class="lbl">Variação (${e.v.length})</div><div class="chips">${e.v.map(x => `<button class="chip ${x[0] === v[0] ? "on" : ""}" data-act="sel-var" data-s="${e.id}" data-v="${x[0]}">${esc(x[1].replace(/ \(.*\)/, ""))}</button>`).join("")}${S.sel[e.id] ? `<button class="chip" data-act="sel-var" data-s="${e.id}" data-v="">Automático</button>` : ""}</div></div></details>`; }).join("");
  return `<div class="list">${warm}</div>${ex}`;
}
VIEWS.treino = () => {
  const k = today(), L = UI.pickDay || (D(k).wk ? seqNext() : (planLetter(k) || seqNext())), p = PLAN[L], vol = weekVolume(), pa = painAvg(), kd = D(k);
  const skip = kd.skipWk && !UI.pickDay && !S.cur && !kd.wk;
  const head = `${S.cur ? banner("acc", "play", "Treino em andamento", `Treino ${S.cur.day} aberto.`, `<div class="sig-act"><button class="btn sm solid" data-act="wk-resume">Continuar</button></div>`) : ""}
    ${pa !== null && pa >= 4 ? banner("bad", "shield", "Dor no ombro em alta", `Média das 3 últimas: ${r1(pa)}/10. Procure um fisioterapeuta.`) : ""}
    ${deloadSignal() ? banner("warn", "info", "Sinal de deload", "3 ou mais exercícios falharam 2 sessões seguidas com a mesma carga. Reduza cerca de 20% nesta semana e reavalie.") : ""}
    <div class="daychips" role="group" aria-label="Escolher treino">${DAY_ORDER.map(x => `<button class="dchip ${x === L ? "on" : ""}" style="--hue:${WK_HUE[x]}" data-act="pickday" data-day="${x}"><b>${x}</b><small>${PLAN[x].name}</small></button>`).join("")}</div>`;
  const main = skip ? sec("", `<h3 class="h3">Tudo bem, o foco hoje é a dieta.</h3><p class="muted">O treino <b>${L} · ${p.name}</b> fica guardado para amanhã. Sua sequência não quebra.</p><button class="btn full" data-act="wk-unskip">Desfazer (vou treinar)</button>`)
    : sec("", `<div class="row between"><div><div class="lbl" style="color:${WK_HUE[L]}">Treino ${L}</div><h3 class="h2">${p.name}</h3></div><span class="pill">≈ ${estMin(L)} min</span></div>
      <p class="muted small">${p.focus}. Segunda a sexta às 5h, na sequência A a E: se faltar um dia, o treino continua de onde parou. Termina com 10 min de esteira inclinada (4–6%), ritmo de conversa.</p>
      ${planList(L)}<button class="btn solid full" data-act="${S.cur ? "wk-resume" : "wk-start"}" data-day="${L}">${ic("play", "fill")} ${S.cur ? "CONTINUAR NA ARENA" : `ENTRAR NA ARENA · ${L}`}</button>
      ${!S.cur && !UI.pickDay && !kd.wk ? `<button class="btn ghost full" data-act="wk-skip">Não consegui ir hoje</button>` : ""}`);
  const recs = maxLoads();
  return todayTrain(k) + head + main + painSec() + (recs.length ? sec("Maiores cargas registradas", `<div class="list">${recs.map(r => `<div class="li"><span class="grow">${esc(r[0])}</span><b class="tabnum">${r[1]} kg</b></div>`).join("")}</div>`) : "") + prefsSec(vol);
};
function prefsSec(vol) {
  const s = S.settings;
  return sec("Balanço semanal de séries", `<div class="grid2"><div class="tile"><div class="lbl">Empurrar</div><div class="h2 tabnum">${vol.push}</div></div><div class="tile"><div class="lbl">Puxar</div><div class="h2 tabnum">${vol.pull}</div></div></div>
    <p class="muted small">Puxar ≥ empurrar protege o ombro. Aquecimento de manguito antes de peito, ombro e braço.</p>`) +
  sec("Regras de carga", `<p class="small"><b>Semanas 1–2:</b> adaptação com carga leve. <b>Depois, ao fim de cada treino:</b> fechou todas as repetições em todas as séries, sobe a carga; falhou na 1ª série ou em 2 ou mais séries, desce um degrau; senão mantém. <b>Deload só por sinal</b> (2 sessões falhando ou dor ≥ 4).<br><b>Regra do RIR:</b> termine sentindo que faria mais 3. Se faria mais de 4, estava leve. Se não completou, estava pesada.<br>${INCS_TXT}</p>
    <div class="row between set-row"><span class="grow">Rodízio automático de variações</span>${tog(s.rotate, "tog-rotate", "Rodízio automático de variações")}</div>
    <div class="row between set-row"><span class="grow">Trocar variação a cada</span><div class="stepper sm"><button class="icon-btn" data-act="rot-weeks" data-d="-1" aria-label="Menos uma semana">${ic("minus")}</button><b class="tabnum">${s.rotateWeeks} sem.</b><button class="icon-btn" data-act="rot-weeks" data-d="1" aria-label="Mais uma semana">${ic("plus")}</button></div></div>
    <div class="lbl">Registro na Arena</div><div class="seg"><button class="${s.logMode === "set" ? "on" : ""}" data-act="logmode" data-v="set">1 toque por série</button><button class="${s.logMode === "end" ? "on" : ""}" data-act="logmode" data-v="end">Ao final</button></div>
    <p class="muted xs">Semana ${weekNo()} desde ${dispDate(s.start)}${inAdapt() ? " · adaptação" : ""}.</p>`);
}
function painSec() {
  const pa = painAvg(), l = S.pain.slice(-8);
  return sec("Dor no ombro (0–10)", `<p class="muted small">Registrada ao fim dos treinos A, D e E. Média das 3 últimas ≥ 4 mostra alerta.</p>
    ${l.length ? `<div class="painhist">${l.map(p => `<span style="--p:${p.v / 10}" title="${dispDate(p.d)}"><b>${p.v}</b><small>${p.day || ""}</small></span>`).join("")}</div>` : `<p class="muted small">Sem registros ainda.</p>`}
    ${pa !== null ? `<p class="small">Média das 3 últimas: <b>${r1(pa)}</b>/10</p>` : ""}<button class="btn sm full" data-act="pain-open">Registrar dor agora</button>`);
}
ACT.pickday = b => { UI.pickDay = UI.pickDay === b.dataset.day ? null : b.dataset.day; render(); };
// card do dia: quando é o treino (vem da agenda), se já foi feito, ou se hoje é descanso
function todayTrain(k) {
  const x = instances(k).find(i => i.it.type === "treino"), d = D(k);
  if (S.cur) return "";
  if (d.wk) return `<section class="hero-card ok"><div class="kick">Hoje · feito</div><h2 class="h2">${d.wk} · ${PLAN[d.wk].name} concluído</h2><p class="muted small">Cargas do próximo já calculadas. Próximo: ${seqNext()} · ${PLAN[seqNext()].name}.</p></section>`;
  if (!x) return `<section class="hero-card"><div class="kick">Hoje</div><h2 class="h2">Dia sem treino na agenda</h2><p class="muted small">Caminhada livre conta como hábito. Para treinar mesmo assim, escolha o treino abaixo.</p><button class="btn full" data-act="agenda-open">Ajustar dias de treino na agenda</button></section>`;
  return `<section class="hero-card"><div class="kick">Hoje · ${x.flex ? PERIODS[x.period] : x.at}${x.skip ? " · pulado" : ""}</div><h2 class="h2">Próximo: ${planLetter(k) || seqNext()} · ${PLAN[planLetter(k) || seqNext()].name}</h2><button class="btn ghost full" data-act="inst-open" data-id="${x.id}">Mudar horário, pular ou reagendar</button></section>`;
}
ACT["sel-var"] = b => { if (b.dataset.v) S.sel[b.dataset.s] = b.dataset.v; else delete S.sel[b.dataset.s]; save(); render(); };
ACT["tog-rotate"] = () => { S.settings.rotate = !S.settings.rotate; save(); render(); };
ACT["rot-weeks"] = b => { S.settings.rotateWeeks = clamp((S.settings.rotateWeeks || 4) + num(b.dataset.d), 1, 12); save(); render(); };
ACT.logmode = b => { S.settings.logMode = b.dataset.v; save(); render(); };
ACT["pain-open"] = () => painSheet((D(today()).wk) || "");
