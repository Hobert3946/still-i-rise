/* ============ TECLADO DE ALIMENTOS: bandeja da refeição + teclas (favoritos, sugestões, recentes) ============ */
// toque = +1 porção (toques seguidos somam no mesmo item) · segurar = escolher gramas · arrastar item da bandeja = excluir
const shortName = n => n.replace(/ \(.*\)/, "");
function trayHTML(m, k) {
  const it = mealItems(m, k);
  if (!it.length) return "";
  return `<div class="tray" aria-label="Itens de ${m}">${it.map(([x, i]) => `<div class="swipe" data-i="${i}"><div class="swipe-bg">${ic("trash")}<span>Excluir</span>${ic("trash")}</div>
    <div class="swipe-in"><div class="grow"><b>${esc(x.n)}</b><small class="muted">${x.g ? x.g + " g · " : ""}${Math.round(x.k)} kcal · ${r1(x.p)} g prot</small></div><button class="icon-btn" data-act="meal-del" data-i="${i}" aria-label="Excluir ${esc(x.n)}">${ic("x")}</button></div></div>`).join("")}</div>`;
}
function keysOf(m) {
  const fv = favsOf(m).map(foodIdx).filter(i => i >= 0);
  const sg = MEALS.find(x => x[0] === m)[2].map(foodIdx).filter(i => i >= 0 && !fv.includes(i));
  return { fv, sg };
}
const keyBtn = (i, m, star) => { const f = FOODS[i]; return `<button class="fkey ${star ? "fav" : ""}" data-act="fkey" data-i="${i}" data-m="${m}" data-hold="fhold" aria-label="${esc(f[0])}: ${f[3]}, ${Math.round(f[1] * f[4] / 100)} kcal. Segure para escolher gramas"><b>${star ? "★ " : ""}${esc(shortName(f[0]))}</b><small>${f[3]} · ${Math.round(f[2] * f[4] / 100)} g</small></button>`; };
function keyboardHTML(m, k) {
  const { fv, sg } = keysOf(m), it = mealItems(m, k), last = it.length ? [] : lastMealItems(m, k), t = sumItems(it), tg = TG();
  const rec = recentFoods(8).map(x => foodIdx(x.n)).filter(i => i >= 0 && !fv.includes(i) && !sg.includes(i)).slice(0, 4);
  return `<div class="kb" data-meal="${m}">
    <div class="kb-sum tabnum"><span>${Math.round(t.k)} kcal · ${Math.round(t.p)} g prot</span><span class="muted">dia: ${Math.round(dayTotals(k).p)}/${tg.prot} g</span></div>
    ${trayHTML(m, k)}
    ${last.length ? `<button class="btn sm full" data-act="meal-repeat" data-m="${m}">${ic("repeat")} Repetir a última vez (${last.length} ${last.length === 1 ? "item" : "itens"}, ${Math.round(last.reduce((a, x) => a + x.k, 0))} kcal)</button>` : ""}
    <div class="keys" role="group" aria-label="Teclado de alimentos">${fv.map(i => keyBtn(i, m, true)).join("")}${sg.map(i => keyBtn(i, m, false)).join("")}${rec.map(i => keyBtn(i, m, false)).join("")}</div>
    <div class="kb-tools"><button class="btn sm" data-act="find" data-m="${m}">${ic("search")} Buscar</button><button class="btn sm" data-act="quick" data-m="${m}">${ic("tag")} Rótulo</button><button class="btn sm" data-act="foto" data-m="${m}">${ic("camera")} Foto</button></div>
    <p class="muted xs">Toque = 1 porção (toque de novo para somar). Segure para escolher gramas ou favoritar. Arraste um item para o lado para excluir.</p>
  </div>`;
}
ACT.fkey = b => {
  const i = +b.dataset.i, m = b.dataset.m, f = FOODS[i], it = foodTap(i, m, dayK()); if (!it) return;
  haptic(12); render(); b = $(`.fkey[data-i="${i}"][data-m="${m}"]`); if (b) { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
  if (isSugarDrink(f)) toast("Bebida com açúcar: quebra a Regra nº 1 de hoje. O app não julga, amanhã continua normal.");
};
ACT.fhold = b => { UI.meal = b.dataset.m; foodSheet(+b.dataset.i); };
/* ---- gramas ajustáveis ---- */
function foodSheet(i) {
  const f = FOODS[i];
  openSheet(`<h3 class="h3">${esc(f[0])}</h3><div class="muted small">${f[1]} kcal e ${f[2]} g de proteína por 100 g · fonte ${f[6] === "T" ? "TACO 4ª ed." : "estimativa/rótulo"} · ${f[5]}</div>
  ${isSugarDrink(f) ? banner("warn", "info", "Bebida com açúcar", "Quebra a Regra nº 1 de hoje. Pode registrar: o app não julga, amanhã continua normal.") : ""}
  <div class="stepper"><button class="icon-btn" data-act="g-adj" data-s="-10" aria-label="Menos 10 g">${ic("minus")}</button><input id="g" class="field tabnum" inputmode="numeric" value="${f[4]}" data-i="${i}" aria-label="Gramas"><span class="muted">g</span><button class="icon-btn" data-act="g-adj" data-s="10" aria-label="Mais 10 g">${ic("plus")}</button></div>
  <div class="grid3"><button class="chip" data-act="g-set" data-g="${f[4]}">1 porção</button><button class="chip" data-act="g-set" data-g="${f[4] * 2}">2 porções</button><button class="chip" data-act="g-set" data-g="100">100 g</button></div>
  <div class="muted small">${f[3]} = ${f[4]} g</div>${mealChips(UI.meal, "meal-sel")}<div id="favslot">${favBtn(i)}</div>
  <div class="tile"><span id="g-sum" class="h3 tabnum"></span></div>
  <button class="btn solid full" data-act="food-add" data-i="${i}">ADICIONAR</button>`);
  gSum(i);
}
const favBtn = i => { const on = favsOf(UI.meal).includes(FOODS[i][0]); return `<button class="btn sm ghost full" data-act="fav-tog" data-i="${i}" aria-pressed="${on}">${on ? "★ Favorito em " : "☆ Favoritar em "}${UI.meal}</button>`; };
function gSum(i) { const f = FOODS[i], g = num($("#g").value), e = $("#g-sum"); if (e) e.textContent = `${Math.round(f[1] * g / 100)} kcal · ${r1(f[2] * g / 100)} g prot`; }
ACT["g-adj"] = b => { const inp = $("#g"); inp.value = Math.max(0, num(inp.value) + num(b.dataset.s)); gSum(+inp.dataset.i); };
ACT["g-set"] = b => { const inp = $("#g"); inp.value = b.dataset.g; gSum(+inp.dataset.i); };
ACT["meal-sel"] = b => { UI.meal = b.dataset.m; $$("#sheet [data-act=meal-sel]").forEach(x => { x.classList.toggle("on", x.dataset.m === UI.meal); x.setAttribute("aria-pressed", x.dataset.m === UI.meal); }); const g = $("#g"), fs = $("#favslot"); if (g && fs) fs.innerHTML = favBtn(+g.dataset.i); };
ACT["fav-tog"] = b => { const on = favToggle(+b.dataset.i, UI.meal); $("#favslot").innerHTML = favBtn(+b.dataset.i); render(); toast(on ? "Favoritado em " + UI.meal + "." : "Removido dos favoritos."); };
ACT["food-add"] = b => { const gm = num($("#g").value); if (gm <= 0) return toast("Informe os gramas."); foodAdd(+b.dataset.i, gm, UI.meal, dayK()); closeSheet(); render(); toast("Adicionado em " + UI.meal + "."); haptic(); };
/* ---- busca na tabela ---- */
function findSheet(m) {
  UI.meal = m;
  openSheet(`<h3 class="h3">Buscar em ${m}</h3><input class="field" id="q" type="search" placeholder="Digite o alimento" autocomplete="off" enterkeyhint="search" aria-label="Buscar alimento">
  <div class="list" id="foodlist">${foodListHTML("")}</div>
  <button class="btn full" data-act="quick" data-m="${m}">${ic("tag")} Adicionar por rótulo (kcal e proteína)</button>`);
  const q = $("#q"); if (q) q.focus();
}
function foodListHTML(q) {
  if (!q.trim()) return `<p class="muted small">Digite o nome do alimento. A busca ignora acentos.</p>`;
  const r = foodSearch(q, 41); if (!r.length) return `<p class="muted small">Nada encontrado. Use "Adicionar por rótulo".</p>`;
  return r.slice(0, 40).map(i => { const f = FOODS[i]; return `<button class="food" data-act="fhold" data-i="${i}" data-m="${UI.meal}"><div class="grow"><b>${esc(f[0])}</b><small class="muted">${f[3]} (${f[4]} g) · ${Math.round(f[1] * f[4] / 100)} kcal · ${r1(f[2] * f[4] / 100)} g prot</small></div>${ic("plus")}</button>`; }).join("") + (r.length > 40 ? `<p class="muted xs">Mostrando 40. Refine a busca.</p>` : "");
}
ACT.find = b => findSheet(b.dataset.m || UI.meal);
/* ---- por rótulo ---- */
function quickSheet(m) {
  UI.meal = m || UI.meal;
  openSheet(`<h3 class="h3">Adicionar por rótulo</h3><input class="field" id="qn" placeholder="Nome (ex.: Barra de proteína)" aria-label="Nome">
  <div class="grid2"><input class="field" id="qk" inputmode="decimal" placeholder="kcal totais" aria-label="kcal totais"><input class="field" id="qp" inputmode="decimal" placeholder="proteína (g)" aria-label="proteína em gramas"></div>
  ${mealChips(UI.meal, "meal-sel")}<button class="btn solid full" data-act="quick-add">ADICIONAR</button>`);
}
ACT.quick = b => quickSheet(b.dataset.m);
ACT["quick-add"] = () => { const it = labelAdd($("#qn").value.trim(), num($("#qk").value), num($("#qp").value), UI.meal, dayK()); if (!it) return toast("Informe as kcal."); closeSheet(); render(); toast("Adicionado."); };
ACT["meal-repeat"] = b => { const n = mealRepeat(b.dataset.m, dayK()); render(); toast(`${n} ${n === 1 ? "item adicionado" : "itens adicionados"}.`); };
ACT["meal-del"] = b => removeWithUndo(+b.dataset.i);
function removeWithUndo(i) {
  const k = dayK(), it = mealRemove(i, k); if (!it) return; render(); haptic(15);
  toast("Removido. Toque aqui para desfazer.", () => { mealRestore(i, it, k); render(); });
}
