/* ============ ÁGUA: garrafa com onda, ritmo por hora, tamanhos, semana, histórico e meta ============ */
function bottleSVG(p, from) {
  const top = 46, bot = 312, y = bot - (bot - top) * p, y0 = bot - (bot - top) * from;
  const body = "M78 14h44v26c0 14 38 26 38 60v190a24 24 0 0 1-24 24H64a24 24 0 0 1-24-24V100c0-34 38-46 38-60z";
  const wave = "M-100 0q25-9 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0V320H-100z";
  const ticks = [0.25, 0.5, 0.75].map(f => `<line x1="146" x2="160" y1="${bot - (bot - top) * f}" y2="${bot - (bot - top) * f}" stroke="currentColor" opacity=".45" stroke-width="2"/>`).join("");
  return `<svg viewBox="0 0 200 340" class="bottle" aria-hidden="true"><defs><clipPath id="bclip"><path d="${body}"/></clipPath>
    <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd6ee"/><stop offset="1" stop-color="#2f7fb5"/></linearGradient></defs>
    <path d="${body}" fill="var(--surface2)" opacity=".8"/>
    <g clip-path="url(#bclip)"><g class="wlevel" data-to="${y}" style="transform:translateY(${y0}px)"><g class="wwave b"><path d="${wave}" fill="#8fd6ee" opacity=".4"/></g><g class="wwave a"><path d="${wave}" fill="url(#wg)"/></g>
      <circle class="bub" cx="80" cy="330" r="4" fill="#fff" opacity=".5"/><circle class="bub d2" cx="118" cy="330" r="3" fill="#fff" opacity=".5"/><circle class="bub d3" cx="98" cy="330" r="2.5" fill="#fff" opacity=".5"/></g></g>
    <path d="${body}" fill="none" stroke="var(--water)" stroke-width="3" stroke-linejoin="round"/><rect x="76" y="4" width="48" height="12" rx="4" fill="var(--water)"/>${ticks}</svg>`;
}
function aguaView() {
  const k = dayK(), d = D(k), goal = S.settings.waterGoal, w = d.water || 0, p = Math.min(1, w / goal), from = UI.wLast == null ? 0 : UI.wLast; UI.wLast = p;
  const [pc, pt] = waterPace(w), ws = waterStreak(), log = (d.wlog || []).slice().reverse();
  const bars = waterWeek().map(x => { const f = Math.min(1, x.v / goal); return `<div class="d ${x.k === today() ? "t" : ""}"><i style="height:${Math.max(6, f * 100)}%;background:${x.v >= goal ? "var(--ok)" : x.v ? "var(--water)" : "var(--surface3)"}"></i><span>${DOW[parseKey(x.k).getDay()][0]}</span></div>`; }).join("");
  return `<section class="card water-hero"><div class="bottle-wrap">${bottleSVG(p, from)}<div class="bottle-txt"><div class="big tabnum">${fmtL(w, 2)}<small> L</small></div><div class="lbl">${Math.round(p * 100)}% de ${fmtL(goal)} L</div></div></div>
    ${k === today() ? `<div class="banner ${pc}">${ic("info")}<div class="grow">${pt}</div></div>` : ""}</section>
  ${sec("Beber agora", `<div class="grid3">${WSIZES.map(([n, ml]) => `<button class="wbtn" data-act="w-add" data-ml="${ml}"><small>${n}</small><b>+${ml}</b></button>`).join("")}</div>
    <div class="row"><input id="wcust" class="field" type="number" inputmode="numeric" placeholder="Outro valor em ml" aria-label="Quantidade em ml"><button class="btn solid" data-act="w-custom">Adicionar</button></div>
    <button class="btn ghost full" data-act="w-undo">Desfazer último registro</button>`)}
  ${sec("Esta semana", `<div class="row between"><span class="pill ${ws ? "ok" : ""}">${ws} ${ws === 1 ? "dia" : "dias"} seguidos na meta</span></div><div class="week">${bars}</div><p class="muted small">Média dos últimos 7 dias: ${fmtL(waterAvg7(), 2)} L. Barra verde = meta batida.</p>`)}
  ${sec(`Hoje · ${log.length} ${log.length === 1 ? "registro" : "registros"}`, log.length ? `<div class="list">${log.map(l => `<div class="li"><span class="wdrop">${ic("drop")}</span><span class="grow tabnum">${l.t}</span><b class="tabnum">+${l.ml} ml</b></div>`).join("")}</div>` : `<p class="muted">Nada registrado ainda. Comece com um copo grande ao acordar.</p>`)}
  ${sec("Meta diária", `<div class="row between"><button class="icon-btn lg" data-act="w-goal" data-d="-250" aria-label="Diminuir meta">${ic("minus")}</button><div class="h2 tabnum">${fmtL(goal, 2)} L</div><button class="icon-btn lg" data-act="w-goal" data-d="250" aria-label="Aumentar meta">${ic("plus")}</button></div>
    <p class="muted small">Referência comum: 35 ml por kg, cerca de ${fmtL(35 * (S.settings.calcWeight || 100))} L para ${S.settings.calcWeight || 100} kg. Se tiver dúvida sobre o seu caso (fígado, rins), pergunte ao médico.</p>`)}`;
}
// a água sobe na garrafa depois de desenhada
const waterAnim = () => requestAnimationFrame(() => requestAnimationFrame(() => { const g = $("#view .wlevel"); if (g) g.style.transform = `translateY(${g.dataset.to}px)`; }));
function waterDo(ml) { if (waterAdd(ml, dayK())) toast("Meta de água batida. Sua garrafa está cheia."); else toast(`+${ml} ml`, () => { waterUndo(dayK()); render(); }); }
ACT["w-add"] = b => { waterDo(num(b.dataset.ml)); render(); };
ACT["w-custom"] = () => { const i = $("#wcust"), v = i ? num(i.value) : 0; if (v <= 0 || v > 3000) return toast("Digite um valor entre 1 e 3000 ml."); waterDo(v); render(); };
ACT["w-undo"] = () => { const l = waterUndo(dayK()); render(); toast(l ? `Removido: ${l.ml} ml.` : "Nada para desfazer."); };
ACT["w-goal"] = b => { waterGoalAdj(num(b.dataset.d)); render(); };
