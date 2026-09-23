/* ============ RIO: header, anéis do dia, Regra nº 1, sinais, linha do tempo e trilho "o dia todo" ============ */
function tipOfDay() { const n = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5); return TIPS[n % TIPS.length]; }
const fraseIdx = () => (Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5) + UI.qOff) % FRASES.length;
const greet = () => { const h = new Date().getHours(); return h >= 5 && h < 12 ? "Bom dia" : h >= 12 && h < 18 ? "Boa tarde" : "Boa noite"; };
const avatarHTML = (p, cls = "avatar") => p.profile.avatar ? `<img class="${cls}" src="%%AVATAR%%" alt="" width="40" height="40">` : `<span class="${cls} ini" aria-hidden="true">${esc((p.profile.name || "?").trim()[0] || "?").toUpperCase()}</span>`;

function rHeader() {
  const k = dayK(), d = parseKey(k), wp = Math.min(1, (D(today()).water || 0) / S.settings.waterGoal), dark = document.documentElement.dataset.theme === "dark";
  $("#top").innerHTML = `<div class="top-in">
    <button class="who" data-act="profiles" aria-label="Perfil ${esc(S.profile.name)}. Trocar ou criar perfil">${avatarHTML(S)}<span class="who-t"><small>${greet()}</small><b>${esc(S.profile.name)}</b></span></button>
    <div class="daynav" role="group" aria-label="Dia exibido">
      <button class="icon-btn" data-act="day-go" data-d="-1" aria-label="Dia anterior">${ic("left")}</button>
      <button class="daylbl" data-act="day-go" data-d="0" aria-label="Voltar para hoje"><b>${DOW[d.getDay()]} ${pad(d.getDate())} ${MESES[d.getMonth()].toUpperCase()}</b><small>${isToday() ? hhmm(new Date()) : "ver hoje"}</small></button>
      <button class="icon-btn" data-act="day-go" data-d="1" ${isToday() ? "disabled" : ""} aria-label="Próximo dia">${ic("right")}</button>
    </div>
    <button class="icon-btn drop ${wp >= 1 ? "full" : ""}" data-act="lens" data-l="agua" aria-label="Água: ${Math.round(wp * 100)}% da meta"><svg class="icon" aria-hidden="true"><path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" fill="url(#dropg)"/></svg></button>
    <button class="icon-btn" data-act="theme-flip" aria-label="Alternar tema claro ou escuro">${ic(dark ? "sun" : "moon")}</button>
  </div>`;
  $$("#dropg stop").forEach(s => s.setAttribute("offset", String(wp)));
}
// quatro anéis concêntricos: kcal, proteína, água, hábitos
function heroHTML(k) {
  const tg = TG(), tot = dayTotals(k), d = D(k), hc = habitCount(k), hn = S.habits.length, act = isActive(k);
  const R4 = [[tot.k / tg.kcal, "grad"], [tot.p / tg.prot, "var(--ok)"], [(d.water || 0) / S.settings.waterGoal, "var(--water)"], [hn ? hc / hn : 0, "var(--c-e)"]];
  const rings = R4.map(([p, c], i) => `<div class="rl" style="--s:${i}">${ring(p, 148 - i * 24, 9, c)}</div>`).join("");
  const stat = (l, cls, v, lens) => `<button class="stat" data-act="lens" data-l="${lens}"><i class="dot ${cls}"></i><span class="lbl">${l}</span><b class="tabnum">${v}</b></button>`;
  return `<section class="hero" aria-label="Resumo do dia">
    <button class="rings" data-act="lens" data-l="nutri" aria-label="Abrir nutrição">${rings}<span class="rings-c"><b class="tabnum">${fmtInt(Math.max(0, tg.kcal - tot.k))}</b><small>restam</small></span></button>
    <div class="stats">${stat("kcal", "k", `${fmtInt(tot.k)}<small>/${fmtInt(tg.kcal)}</small>`, "nutri")}${stat("Proteína", "p", `${Math.round(tot.p)}<small>/${tg.prot} g</small>`, "nutri")}
      ${stat("Água", "w", `${fmtL(d.water || 0)}<small>/${fmtL(S.settings.waterGoal)} L</small>`, "agua")}${stat("Hábitos", "h", `${hc}<small>/${hn}${act ? " · ativo" : ""}</small>`, "corpo")}</div>
  </section>`;
}
function streakHTML(k) {
  const ds = dayStreak(), ws = weekStreak(), wk = activeInWeek(mondayOf(k)), wn = weekNo();
  return `<button class="streaks" data-act="lens" data-l="corpo" aria-label="Sequências e ritmo semanal">
    <span class="pill acc">Semana ${wn}${inAdapt() ? " · adaptação" : ""}</span><span class="pill">${ic("flame")} ${ds} ${ds === 1 ? "dia" : "dias"}</span>
    <span class="pill ${wk >= 5 ? "ok" : wk === 4 ? "warn" : ""}">${wk}/5 esta semana</span><span class="pill">${ws} sem. verdes</span></button>`;
}
function rule1HTML(k) {
  const h = S.habits.find(x => x.id === S.settings.rule1); if (!h) return "";
  const on = !!D(k).h[h.id];
  return `<button class="rule1 ${on ? "on" : ""}" data-act="habit" data-id="${h.id}" aria-pressed="${on}"><span class="r1-ic">${ic("shield")}</span><span class="grow"><small>Regra nº 1</small><b>${esc(h.icon)} ${esc(h.t)}</b></span><span class="ck">${ic("check")}</span></button>`;
}
function signals(k) {
  const out = [], abs = daysAbsent(), ab = ABSENCE.find(a => abs >= a.min);
  if (ab) out.push(["acc", "leaf", `${abs} dias sem registro`, ab.txt, ""]);
  if (S.cur) out.push(["acc", "play", "Treino em andamento", `Você começou o treino ${S.cur.day}. Continue de onde parou.`, `<button class="btn sm solid" data-act="wk-resume">Continuar treino</button>`]);
  const pa = painAvg(); if (pa !== null && pa >= 4) out.push(["bad", "shield", "Dor no ombro em alta", `Média das 3 últimas: ${r1(pa)}/10. Procure um fisioterapeuta antes de aumentar carga de empurrar.`, ""]);
  if (deloadSignal()) out.push(["warn", "info", "Sinal de deload", "3 ou mais exercícios falharam 2 sessões seguidas com a mesma carga. Reduza cerca de 20% nesta semana e reavalie.", ""]);
  const bd = backupDays(); if (bd > 21) out.push(["warn", "download", "Backup atrasado", `${S.settings.lastBackup ? `Último backup há ${bd} dias.` : "Você nunca exportou um backup."} O arquivo .json é o único que sobrevive à troca de celular.`, `<button class="btn sm" data-act="export">Exportar agora</button>`]);
  if (parseKey(k).getDay() === 1 && k === today() && !S.weights.some(w => w.d >= mondayOf(k))) out.push(["acc", "scale", "Dia de pesagem", "Segunda: ao acordar, depois do banheiro, antes de comer. Meça a cintura junto.", `<button class="btn sm solid" data-act="weigh">Registrar peso</button>`]);
  return out;
}
function signalsHTML(k) {
  const s = signals(k); if (!s.length) return "";
  const b = x => banner(x[0], x[1], x[2], x[3], x[4] ? `<div class="sig-act">${x[4]}</div>` : "");
  const more = s.length > 1 ? `<button class="sig-more" data-act="sig-toggle" aria-expanded="${UI.sigOpen}">${UI.sigOpen ? "Recolher sinais" : `+${s.length - 1} ${s.length === 2 ? "sinal" : "sinais"}`} ${ic(UI.sigOpen ? "up" : "down")}</button>` : "";
  return `<section class="signals" aria-label="Sinais">${b(s[0])}${UI.sigOpen ? s.slice(1).map(b).join("") : ""}${more}</section>`;
}
ACT["sig-toggle"] = () => { UI.sigOpen = !UI.sigOpen; rRiver(); };
function railHTML(k) {
  const d = D(k), fib = d.fiber || 0, loose = S.habits.filter(h => !h.at && h.id !== S.settings.rule1 && h.link !== "treino");
  const nextM = MILESTONES.map(milestone).find(m => !m.ok);
  const [ft, fa] = FRASES[fraseIdx()];
  return `<section class="rail" aria-label="O dia todo"><div class="lbl rail-t">O dia todo</div>
    ${loose.map(h => habitRow(h, d)).join("")}
    <div class="rail-row"><span class="n-ic">🌾</span><div class="grow"><b>Fibras</b><div class="bar"><i style="width:${Math.min(100, fib / FIBER_GOAL * 100)}%;background:var(--ok)"></i></div><small class="muted">${fib} de ${FIBER_GOAL} g · registro manual</small></div>
      <button class="icon-btn" data-act="fiber-add" data-g="-5" aria-label="Menos 5 g de fibra">${ic("minus")}</button><button class="icon-btn" data-act="fiber-add" data-g="5" aria-label="Mais 5 g de fibra">${ic("plus")}</button></div>
    ${nextM ? `<button class="rail-card" data-act="lens" data-l="corpo"><span class="lbl">Próximo marco</span><b>${nextM.nm} · ${nextM.lbl}</b><small class="muted">${nextM.txt}</small></button>` : ""}
    <div class="rail-card"><span class="lbl">${ic("sun")} Dica do dia</span><p class="muted small">${tipOfDay()}</p></div>
    <button class="quote" data-act="quote-next" aria-label="Outra frase"><span class="q-mark" aria-hidden="true">“</span><p>${esc(ft)}</p><small>${esc(fa)}</small></button>
  </section>`;
}
ACT["quote-next"] = () => { UI.qOff++; rRiver(); };
ACT["fiber-add"] = b => { fiberAdd(num(b.dataset.g), dayK()); render(); haptic(); };
ACT["day-go"] = b => { const n = +b.dataset.d; UI.day = n === 0 ? null : addDays(dayK(), n) >= today() ? null : addDays(dayK(), n); UI.open = null; render(); window.scrollTo({ top: 0 }); };

function rRiver() {
  const k = dayK(), river = $("#river");
  river.innerHTML = `${heroHTML(k)}${streakHTML(k)}${isToday() ? signalsHTML(k) : `<div class="pastnote">${ic("info")} Editando ${dispDate(k)}. Os registros entram neste dia.</div>`}${rule1HTML(k)}
    <section class="timeline" aria-label="Linha do tempo"><div class="spine" aria-hidden="true"><i class="tide"></i></div>${nodesHTML(k)}</section>
    ${railHTML(k)}`;
  requestAnimationFrame(drawTide);
}
