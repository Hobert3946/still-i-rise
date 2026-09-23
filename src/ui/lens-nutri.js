/* ============ LENTE NUTRIÇÃO: metas, motor metabólico, fibras, 5 refeições e comer na rua ============ */
function nutriTop(k) {
  const tg = TG(), tot = dayTotals(k), rem = tg.kcal - tot.k;
  return sec("", `<div class="row around">${ring(tot.k / tg.kcal, 120, 10, "grad", `<div class="h3 tabnum">${fmtInt(tot.k)}</div><div class="lbl">de ${fmtInt(tg.kcal)} kcal</div>`)}${ring(tot.p / tg.prot, 120, 10, "var(--ok)", `<div class="h3 tabnum">${Math.round(tot.p)}</div><div class="lbl">de ${tg.prot} g prot</div>`)}</div>
    <p class="muted center small">${rem >= 0 ? `Restam ${fmtInt(rem)} kcal e ${Math.max(0, Math.round(tg.prot - tot.p))} g de proteína.` : `${fmtInt(-rem)} kcal acima da meta. Um dia acima não desfaz uma semana. A próxima refeição é normal.`}</p>
    <div class="grid2"><button class="btn solid" data-act="foto" data-m="${mealByTime()}">${ic("camera")} Foto</button><button class="btn" data-act="quick" data-m="${mealByTime()}">${ic("tag")} Por rótulo</button></div>`);
}
function adviceSec(k) {
  if (k !== today()) return "";
  const a = getMetabolicAdvice(k);
  return sec("Motor metabólico", `<p class="small">${a.diet}</p><p class="small muted">${a.water}</p>
    ${a.ex.length ? fold(`Como bater ${a.per} g de proteína?`, `<ul class="exl">${a.ex.map(x => `<li>${x}</li>`).join("")}</ul><p class="muted xs">Valores aproximados pela tabela do app.</p>`, false, "prot-ex") : ""}`, "glow");
}
function fiberSec(k) {
  const fib = D(k).fiber || 0;
  return sec(`Fibras · meta ${FIBER_GOAL} g, registro manual`, `<div class="row between"><div class="bar grow"><i style="width:${Math.min(100, fib / FIBER_GOAL * 100)}%;background:var(--ok)"></i></div><b class="tabnum">${fib} g</b></div>
    <div class="grid2"><button class="btn sm" data-act="fiber-add" data-g="5">+5 g</button><button class="btn sm ghost" data-act="fiber-add" data-g="-5">−5 g</button></div>`);
}
function mealsSec(k) {
  return MEALS.map(([m, hint]) => { const it = mealItems(m, k), t = sumItems(it);
    return `<section class="card meal"><details class="fold" data-fold="m-${normTxt(m).replace(/\s/g, "")}" ${UI.meal === m ? "open" : ""}><summary><span class="grow"><b class="h3">${m}</b><small class="muted">${it.length ? `${Math.round(t.k)} kcal · ${Math.round(t.p)} g` : esc(hint)}</small></span>${ic("down")}</summary>
      <div class="body"><p class="muted small">${esc(hint)}</p>${keyboardHTML(m, k)}</div></details></section>`; }).join("");
}
function streetSec() {
  return sec("", fold("Comer na rua · 7 situações", `<p class="muted small">Toque no cartão para ver a armadilha.</p><div class="street">${STREET.map((s, i) => `<button class="flip" data-act="flip" aria-label="${esc(s.t)}: ver escolha certa e armadilha">
    <span class="face ok"><span class="lbl">${esc(s.t)} · escolha certa</span><b>${esc(s.ok.d)}</b></span><span class="face bad"><span class="lbl">${esc(s.t)} · armadilha</span><b>${esc(s.bad.d)}</b></span></button>`).join("")}</div>`, UI.lensSub === "rua", "rua"));
}
LENS_R.nutri = () => { const k = dayK(); return `${k !== today() ? `<div class="pastnote">${ic("info")} Editando ${dispDate(k)}.</div>` : ""}${nutriTop(k)}${adviceSec(k)}${fiberSec(k)}${mealsSec(k)}${streetSec()}`; };
ACT.flip = b => { b.classList.toggle("on"); haptic(); };
