/* ============ NÓS DO RIO: cada coisa aparece no horário em que acontece ============ */
// nó = { id, min, kind, done, html }. Tocar no cabeçalho expande; deslizar para a direita conclui (data-swipe).
const node = (id, min, kind, done, head, body = "", swipe = "") => ({ id, min, kind, done, head, body, swipe });
function habitRow(h, d) {
  const on = !!d.h[h.id];
  return `<div class="rail-row ${on ? "done" : ""}" data-swipe="habit:${h.id}"><span class="n-ic">${esc(h.icon)}</span><div class="grow"><b>${esc(h.t)}</b>${h.desc ? `<small class="muted">${esc(h.desc)}</small>` : ""}</div>
    <button class="ck-btn ${on ? "on" : ""}" data-act="habit" data-id="${h.id}" aria-pressed="${on}" aria-label="${esc(h.t)}">${ic("check")}</button></div>`;
}
function suppNodes(d) {
  const by = {};
  S.supps.forEach(s => (by[s.at || "08:00"] = by[s.at || "08:00"] || []).push(s));
  return Object.entries(by).map(([at, list]) => {
    const n = list.filter(s => d.s[s.id]).length, all = n === list.length;
    const items = list.map(s => `<button class="chk ${d.s[s.id] ? "on" : ""}" data-act="supp" data-id="${s.id}" aria-pressed="${!!d.s[s.id]}"><span class="box">${ic("check")}</span><span class="grow"><b>${esc(s.n)}</b><small>${esc(s.tip)}</small></span><span class="pill ${s.type === "M" ? "warn" : ""}">${s.type === "M" ? "Remédio" : "Supl."}</span></button>`).join("");
    const head = `<b>${list.length > 1 ? "Suplementos" : esc(list[0].n)}</b><small>${list.length > 1 ? list.map(s => esc(s.n.split(" ")[0])).join(" · ") : esc(list[0].tip)}</small><span class="n-meta">${n}/${list.length}</span>`;
    return node("sup:" + at, toMin(at), "sup", all, head, `<div class="stack">${items}</div>`, "supp-all:" + list.map(s => s.id).join(","));
  });
}
function habitNodes(d) {
  return S.habits.filter(h => h.at && h.id !== S.settings.rule1 && h.link !== "treino").map(h => {
    const on = !!d.h[h.id];
    return node("hab:" + h.id, toMin(h.at), "hab", on, `<b>${esc(h.icon)} ${esc(h.t)}</b>${h.desc ? `<small>${esc(h.desc)}</small>` : ""}<button class="ck-btn ${on ? "on" : ""}" data-act="habit" data-id="${h.id}" aria-pressed="${on}" aria-label="${esc(h.t)}">${ic("check")}</button>`, "", "habit:" + h.id);
  });
}
function mealNodes(k, d) {
  return MEAL_NAMES.map(m => {
    const it = mealItems(m, k), t = sumItems(it), first = it.length ? new Date(it[0][0].t) : null;
    const min = first && fmtKey(first) === k ? first.getHours() * 60 + first.getMinutes() : toMin(MEAL_AT[m]);
    const meta = it.length ? `${it.length} ${it.length === 1 ? "item" : "itens"} · ${Math.round(t.k)} kcal · ${Math.round(t.p)} g` : MEALS.find(x => x[0] === m)[1];
    return node("meal:" + m, min, "meal", it.length > 0, `<b>${m}</b><small>${meta}</small>`, UI.open === "meal:" + m ? keyboardHTML(m, k) : "");
  });
}
function workoutNode(k, d) {
  const L = planLetter(k), tk = k === today(), hb = habitByLink("treino"), at = toMin((hb && hb.at) || "05:00");
  if (d.wk && !S.cur) return node("wk", at, "wk", true, `<b>${d.wk} · ${PLAN[d.wk].name} concluído</b><small>Cargas do próximo já calculadas. Próximo: ${seqNext()} · ${PLAN[seqNext()].name}</small>`, `<button class="btn full" data-act="lens" data-l="treino">Ver plano e próximo treino</button>`);
  if (d.skipWk && !S.cur) { const nl = L || seqNext(); return node("wk", at, "wk skip", true, `<b>Hoje sem treino · foco na dieta</b><small>${nl} · ${PLAN[nl].name} fica para amanhã. A sequência não quebra.</small>`, `<button class="btn full" data-act="wk-unskip">Desfazer (vou treinar)</button>`); }
  if (!L && !(S.cur && tk)) return node("wk", at, "wk rest", false, `<b>Descanso ativo · fim de semana</b><small>Caminhada livre de 30 min conta como hábito. Para treinar, escolha um dia na lente Treino.</small>`, `<button class="btn full" data-act="lens" data-l="treino">Abrir lente Treino</button>`);
  const Lx = S.cur ? S.cur.day : L, p = PLAN[Lx];
  const list = p.ex.map(e => `<li>${esc(findV(e, varId(e))[1])} <span class="muted">${e.sets}×${repsTxt(e)}</span></li>`).join("");
  const body = `<p class="muted small">${p.focus}. ${p.cuff ? "Começa com aquecimento de manguito." : "Sem aquecimento de manguito hoje."} ${inAdapt() ? `Semana ${weekNo()} de adaptação: carga leve.` : ""}</p><ol class="exl">${list}</ol>
    ${tk ? `<button class="btn solid full" data-act="${S.cur ? "wk-resume" : "wk-start"}" data-day="${Lx}">${ic("play", "fill")} ${S.cur ? "CONTINUAR NA ARENA" : "ENTRAR NA ARENA"}</button>${S.cur ? "" : `<button class="btn ghost full" data-act="wk-skip">Não consegui ir hoje</button>`}` : ""}`;
  return node("wk", at, "wk plan", false, `<b style="color:${WK_HUE[Lx]}">${Lx} · ${p.name}</b><small>Sessão do amanhecer · ≈ ${estMin(Lx)} min${S.cur ? " · em andamento" : ""}</small>`, body);
}
function extraNodes(k, d) {
  const out = [], tk = k === today(), cm = cardioMin(k), wd = parseKey(k).getDay();
  out.push(node("cardio", toMin("06:15"), "cardio", cm > 0, `<b>${ic("flame")} Cardio${cm ? ` · ${cm} min` : ""}</b><small>${wd >= 1 && wd <= 5 ? "10 min de esteira inclinada (4–6%) no fim do treino, ritmo de conversa." : "Caminhada ou esteira."}</small>`, `${(d.cardios || []).map(c => `<div class="li"><span class="grow">${c.min} min</span><span class="muted small">${c.spd ? c.spd + " km/h" : ""} ${c.inc ? "· " + c.inc + "%" : ""}</span></div>`).join("")}<button class="btn full" data-act="cardio-open">${ic("plus")} Registrar cardio</button>`));
  const w = S.weights.find(x => x.d === k);
  if (w || (wd === 1 && tk)) out.push(node("weigh", toMin("05:15"), "weigh", !!w, `<b>${ic("scale")} Pesagem${w ? ` · ${w.kg} kg` : ""}</b><small>${w ? (w.waist ? `Cintura ${w.waist} cm` : "Registrada") : "Ao acordar, depois do banheiro, antes de comer."}</small>`, w ? "" : `<button class="btn solid full" data-act="weigh">Registrar peso</button>`));
  if (tk) { const a = getMetabolicAdvice(k); if (a.next && a.per > 0) { const m = Math.max(nowMin() + 1, a.next.getHours() * 60 + a.next.getMinutes()); out.push(node("next", m, "next", false, `<b>${ic("sparkles")} Próxima refeição sugerida</b><small>${a.diet}</small>`, `<div class="lbl">Como bater ${a.per} g de proteína</div><ul class="exl">${a.ex.map(x => `<li>${x}</li>`).join("")}</ul><p class="muted xs">Valores aproximados pela tabela do app.</p><p class="small">${a.water}</p>`)); } }
  return out;
}
function nodeHTML(n, i, now) {
  const open = UI.open === n.id, past = now !== null && n.min < now;
  return `<article class="node k-${n.kind.split(" ")[0]} ${n.kind} ${n.done ? "done" : ""} ${past ? "past" : ""} ${open ? "open" : ""}" style="--i:${i}" data-min="${n.min}" ${n.swipe ? `data-swipe="${n.swipe}"` : ""}>
    <time class="n-time">${pad(Math.floor(n.min / 60))}:${pad(n.min % 60)}</time><span class="n-dot" aria-hidden="true">${n.done ? ic("check") : ""}</span>
    <div class="n-body"><div class="n-head" data-act="node" data-id="${n.id}" role="button" tabindex="0" aria-expanded="${open}">${n.head}</div>${open && n.body ? `<div class="n-more">${n.body}</div>` : ""}</div></article>`;
}
function nodesHTML(k) {
  const d = D(k), tk = k === today(), now = tk ? nowMin() : null;
  const list = [workoutNode(k, d), ...suppNodes(d), ...habitNodes(d), ...mealNodes(k, d), ...extraNodes(k, d)].sort((a, b) => a.min - b.min);
  let html = "", placed = !tk;
  list.forEach((n, i) => { if (!placed && n.min > now) { html += nowHTML(d); placed = true; } html += nodeHTML(n, i, now); });
  return html + (placed ? "" : nowHTML(d));
}
function nowHTML(d) {
  const w = d.water || 0, exp = waterPace(w)[2];
  return `<div class="now" data-min="${nowMin()}" role="separator" aria-label="Agora"><span class="now-t">AGORA ${hhmm(new Date())}</span><span class="now-w">${ic("drop")} ${fmtInt(w)} / ${fmtInt(exp)} ml esperado</span></div>`;
}
// maré: a espinha se enche de água até o horário em que o volume bebido "estaria no ritmo" (6h–21h)
function drawTide() {
  const tl = $(".timeline"), tide = $(".timeline .tide"); if (!tl || !tide) return;
  const pts = $$(".timeline [data-min]").map(e => [+e.dataset.min, e.offsetTop + (e.classList.contains("now") ? e.offsetHeight / 2 : 29)]); if (pts.length < 2) return;
  const yOf = m => { if (m <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (m <= pts[i][0]) { const [m0, y0] = pts[i - 1], [m1, y1] = pts[i]; return y0 + (y1 - y0) * (m1 === m0 ? 1 : (m - m0) / (m1 - m0)); } return pts[pts.length - 1][1]; };
  const w = D(dayK()).water || 0, top = pts[0][1];
  tide.style.top = top + "px"; tide.style.height = Math.max(0, yOf(waterHourFor(w) * 60) - top) * (w > 0 ? 1 : 0) + "px";
}
ACT.node = b => { const id = b.dataset.id; UI.open = UI.open === id ? null : id; if (id.startsWith("meal:")) UI.meal = id.slice(5); rRiver(); };
ACT.habit = b => {
  const k = dayK(), d = DW(k), id = b.dataset.id, wasA = isActive(k), wasW = activeInWeek(mondayOf(k)) >= 5;
  d.h[id] = !d.h[id]; save(); render(); haptic();
  if (!wasA && isActive(k)) toast(activeInWeek(mondayOf(k)) >= 5 && !wasW ? "Meta da semana cumprida. Isso é ritmo." : "Dia ativo. Este dia conta.");
};
ACT.supp = b => { const d = DW(dayK()); d.s[b.dataset.id] = !d.s[b.dataset.id]; save(); render(); haptic(); };
ACT["supp-all"] = b => { const d = DW(dayK()), ids = b.dataset.id.split(","), all = ids.every(i => d.s[i]); ids.forEach(i => d.s[i] = !all); save(); render(); haptic(15); };
