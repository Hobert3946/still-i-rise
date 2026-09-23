/* ============ ARENA (Modo Treino): um exercício por vez, carga gigante, séries em pontos, tela acesa ============ */
let wakeLock = null;
const lockScreen = () => { try { navigator.wakeLock && navigator.wakeLock.request("screen").then(l => wakeLock = l).catch(() => { }); } catch (e) { } };
function wkStart(L) { wkBegin(L); wkOpen(); }
function wkOpen() { if (!S.cur) return; closeAll(); UI.day = null; $("#arena").classList.add("on"); $("#arena").style.setProperty("--hue", WK_HUE[S.cur.day]); pushLayer("arena"); lockScreen(); arenaRender(); }
HIDE.arena = () => { $("#arena").classList.remove("on"); try { wakeLock && wakeLock.release(); } catch (e) { } wakeLock = null; closeRest(); render(); };
const focusOf = dd => dd.f != null && dd.sets[dd.f] ? dd.f : Math.max(0, dd.sets.findIndex(s => !s.done));
function warmBody(step, dd) {
  return `<span class="pill acc">AQUECIMENTO DE MANGUITO</span><h2 class="ar-name">${step.c.name}</h2><p class="how">${step.c.how}</p>
    <div class="lbl">${step.c.sets} séries de ${step.c.reps[0]} repetições, carga leve</div>
    <div class="stack">${dd.sets.map((s, i) => `<button class="chk lg ${s.done ? "on" : ""}" data-act="wk-warmset" data-i="${i}" aria-pressed="${s.done}"><span class="box">${ic("check")}</span><span class="grow"><b>Série ${i + 1}</b></span></button>`).join("")}</div>`;
}
function dialHTML(slot, dd, fi) {
  const s = dd.sets[fi], ks = slot.inc ? Math.min(slot.inc, 5) : 0, rs = slot.unit ? 5 : 1, unit = slot.unit ? "seg" : "reps";
  return `<div class="dial-wrap" aria-label="Série ${fi + 1}">
    <div class="dial ${ks ? "" : "noload"}">${ks ? `<button class="icon-btn" data-act="wk-adj" data-f="kg" data-d="${-ks}" aria-label="Menos ${ks} kg">${ic("minus")}</button>` : ""}
      <label class="dial-v" data-dial="kg" data-step="${ks || 0.5}"><input class="tabnum" inputmode="decimal" data-f="kg" data-i="${fi}" value="${s.kg || ""}" placeholder="0" aria-label="Carga em kg da série ${fi + 1}"><span>kg</span></label>
      ${ks ? `<button class="icon-btn" data-act="wk-adj" data-f="kg" data-d="${ks}" aria-label="Mais ${ks} kg">${ic("plus")}</button>` : ""}</div>
    <div class="dial small"><button class="icon-btn" data-act="wk-adj" data-f="reps" data-d="${-rs}" aria-label="Menos ${rs} ${unit}">${ic("minus")}</button>
      <label class="dial-v" data-dial="reps" data-step="${rs}"><input class="tabnum" inputmode="numeric" data-f="reps" data-i="${fi}" value="${s.reps}" aria-label="${unit} da série ${fi + 1}"><span>${unit}</span></label>
      <button class="icon-btn" data-act="wk-adj" data-f="reps" data-d="${rs}" aria-label="Mais ${rs} ${unit}">${ic("plus")}</button></div>
    <p class="muted xs">Arraste o número para cima ou para baixo, ou toque para digitar.</p></div>`;
}
function setsEndHTML(dd, unit) {
  return `<div class="setrows">${dd.sets.map((s, i) => `<div class="setrow"><span class="n">${i + 1}</span><input class="field tabnum" inputmode="decimal" data-f="kg" data-i="${i}" value="${s.kg || ""}" placeholder="kg" aria-label="carga série ${i + 1}"><input class="field tabnum" inputmode="numeric" data-f="reps" data-i="${i}" value="${s.reps}" aria-label="${unit} série ${i + 1}"></div>`).join("")}</div>`;
}
function exBody(step, dd) {
  const slot = step.e, v = findV(slot, dd.vid), c = S.cur, fi = focusOf(dd), done = dd.sets.filter(s => s.done).length, unit = slot.unit ? "seg" : "reps";
  const pips = `<div class="pips" role="group" aria-label="Séries">${dd.sets.map((s, i) => `<button class="pip ${s.done ? "done" : ""} ${i === fi && c.mode === "set" ? "cur" : ""}" data-act="wk-focus" data-i="${i}" aria-label="Série ${i + 1}: ${s.kg || 0} kg × ${s.reps}${s.done ? ", feita" : ""}"><i>${s.done ? ic("check") : i + 1}</i><small class="tabnum">${s.kg || 0}×${s.reps}</small></button>`).join("")}</div>`;
  return `<div class="row between wrap"><span class="pill">${slot.sets} × ${repsTxt(slot)} · descanso ${slot.rest}s${slot.inc ? ` · +${slot.inc} kg` : ""}</span><button class="chip" data-act="wk-mode">${c.mode === "set" ? "1 toque por série" : "Registrar ao final"}</button></div>
    <h2 class="ar-name">${esc(v[1])}</h2>
    ${dd.ghost ? `<p class="ghost">Última vez ${esc(dd.ghost)}</p>` : ""}<p class="hint">${esc(dd.hint)}</p>
    ${c.mode === "set" ? dialHTML(slot, dd, fi) + pips : setsEndHTML(dd, unit)}
    ${slot.id === "a2" && dd.vid === "a2_incl_barra" && painAvg() !== null && painAvg() >= 2 ? banner("warn", "shield", "Atenção ao ombro", "Sua dor recente está acima de 2. Prefira halteres hoje.") : ""}
    <p class="muted small">${done}/${dd.sets.length} séries. Termine sentindo que faria mais 3 repetições.</p>
    ${fold("Como fazer", `<p class="how">${esc(v[2])}</p>`, false)}
    ${fold(`Variações (${slot.v.length})`, `<div class="chips">${slot.v.map(x => `<button class="chip ${x[0] === dd.vid ? "on" : ""}" data-act="wk-var" data-v="${x[0]}">${esc(x[1].replace(/ \(.*\)/, ""))}</button>`).join("")}</div>`)}`;
}
function arenaCTA(step, dd, last) {
  const pend = step.t === "ex" ? dd.sets.findIndex(s => !s.done) : -1, c = S.cur;
  if (step.t === "ex" && c.mode === "set" && pend >= 0) return `<button class="btn solid cta grow" data-act="wk-set">${ic("check")} SÉRIE ${focusOf(dd) + 1} FEITA</button>`;
  if (step.t === "ex" && c.mode === "end" && pend >= 0) return `<button class="btn solid cta grow" data-act="wk-allset">${ic("check")} REGISTRAR (${dd.sets.length} séries)</button>`;
  return `<button class="btn solid cta grow" data-act="wk-next">${last ? "FINALIZAR TREINO" : "PRÓXIMO"} ${ic(last ? "check" : "right")}</button>`;
}
function arenaRender() {
  const c = S.cur; if (!c) return;
  const st = stepsOf(c.day), step = st[c.i], last = c.i === st.length - 1, dd = wkData(step);
  const seg = st.map((x, i) => `<i class="${i < c.i ? "done" : i === c.i ? "cur" : ""}"></i>`).join("");
  $("#arena-in").innerHTML = `<header class="ar-top"><button class="icon-btn" data-act="wk-exit" aria-label="Minimizar treino (fica salvo)">${ic("down")}</button>
      <div class="grow ar-title"><b>Treino ${c.day} · ${PLAN[c.day].name}</b><small>${c.i + 1} de ${st.length}</small></div><span class="ar-letter" aria-hidden="true">${c.day}</span></header>
    <div class="ar-prog" aria-hidden="true">${seg}</div>
    <div class="ar-stage" data-swipe-x="wk">${step.t === "warm" ? warmBody(step, dd) : exBody(step, dd)}</div>
    <footer class="ar-bar"><button class="icon-btn lg" data-act="wk-prev" ${c.i === 0 ? "disabled" : ""} aria-label="Etapa anterior">${ic("left")}</button>${arenaCTA(step, dd, last)}
      ${step.t === "ex" && dd.sets.some(s => !s.done) ? `<button class="icon-btn lg" data-act="wk-next" aria-label="${last ? "Finalizar treino" : "Próximo exercício"}">${ic(last ? "check" : "right")}</button>` : ""}</footer>`;
}
function wkNext() { const c = S.cur, st = stepsOf(c.day); if (c.i >= st.length - 1) return wkFinish(); c.i++; save(); arenaRender(); const s = $(".ar-stage"); if (s) s.scrollTop = 0; }
function wkFinish() { const L = S.cur.day, rows = wkCommit(); dropLayer("arena"); haptic(30); summarySheet(L, rows); }
function summarySheet(L, rows) {
  const nl = seqNext(), line = r => {
    const v = findV(r.slot, r.vid), nx = r.nx;
    const t = nx.dir === "up" ? `<b class="up">↑ ${nx.kg} kg</b>` : nx.dir === "down" ? `<b class="down">↓ ${nx.kg} kg</b>` : `<b class="muted">${nx.kg ? "= " + nx.kg + " kg" : "="}</b>`;
    const sub = r.stag ? `Estagnado há 3 treinos: teste a variação ${esc(r.stag)}.` : nx.dir === "up" ? `${nx.why} Sobe ${nx.inc} kg.` : nx.dir === "down" ? `${nx.why} Desce ${nx.inc} kg.` : nx.why;
    return `<div class="li"><div class="grow"><b>${esc(v[1])}</b><small class="muted">${sub}</small></div><div class="tabnum">${t}</div></div>`;
  };
  openSheet(`<h3 class="h2">Treino ${L} registrado</h3><p class="muted">Cargas da próxima vez, já calculadas:</p>
  <div class="list receipt">${rows.length ? rows.map(line).join("") : `<p class="muted">Nenhuma série marcada como feita, então nada mudou.</p>`}</div>
  <div class="tile"><div class="lbl">Próximo treino</div><div class="h3">${nl} · ${PLAN[nl].name}</div></div>
  <p class="muted small">Agora, 10 min de esteira inclinada.</p><button class="btn solid full" data-act="sum-next" data-day="${L}">CONTINUAR</button>`);
}
function painSheet(L) {
  openSheet(`<h3 class="h3">Dor no ombro esquerdo</h3><p class="muted">De 0 (nenhuma) a 10 (muito forte), agora, ao final do treino ${L}.</p>
  <div class="painscale" role="group" aria-label="Escala de dor">${Array.from({ length: 11 }, (_, i) => `<button style="--p:${i / 10}" data-act="pain" data-v="${i}" data-day="${L}">${i}</button>`).join("")}</div>
  <button class="btn ghost full" data-act="close">Pular</button>`);
}
function painDo(v, L) { const avg = painLog(v, L); toast(`Dor ${v}/10 registrada.`); if (avg !== null && avg >= 4) setTimeout(() => toast("Média de dor ≥ 4: procure um fisioterapeuta."), 1400); }
