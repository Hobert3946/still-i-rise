/* ============ COMER: uma seção por refeição, favoritos, sugestões e arrastar para excluir ============ */
const MEALS = [
  ["Café da manhã", "Comece com proteína: ovos, iogurte, queijo.", ["Ovo de galinha cozido", "Omelete simples (2 ovos)", "Ovo mexido", "Crepioca (1 ovo + 2 col. goma)", "Tapioca (goma hidratada)", "Iogurte grego natural", "Queijo cottage", "Queijo minas frescal", "Pão de forma integral", "Aveia em flocos", "Banana prata", "Mamão papaia", "Albumina (pó)", "Café sem açúcar"]],
  ["Almoço", "Metade do prato de vegetais, uma palma de proteína.", ["Arroz branco cozido", "Arroz integral cozido", "Feijão carioca cozido", "Peito de frango grelhado", "Patinho grelhado", "Tilápia grelhada", "Carne moída refogada", "Alcatra grelhada", "Batata-doce cozida", "Brócolis cozido", "Salada de folhas com azeite", "Lentilha cozida", "Azeite de oliva"]],
  ["Lanche", "Proteína com fruta ou castanha. Zero açúcar.", ["Iogurte natural desnatado", "Iogurte grego natural", "Banana prata", "Maçã", "Castanha-do-pará", "Amendoim torrado", "Pasta de amendoim", "Queijo cottage", "Ovo de galinha cozido", "Atum em conserva (natural)", "Barra de proteína", "Albumina (pó)"]],
  ["Jantar", "Leve, com proteína. Termine 2 a 3 h antes de dormir.", ["Peito de frango grelhado", "Tilápia grelhada", "Salmão grelhado", "Patinho grelhado", "Omelete simples (2 ovos)", "Peito de frango cozido desfiado", "Batata-doce cozida", "Abobrinha cozida", "Brócolis cozido", "Couve refogada", "Salada de folhas com azeite", "Arroz branco cozido"]],
  ["Ceia", "Opcional e leve.", ["Iogurte natural desnatado", "Queijo cottage", "Leite desnatado", "Clara de ovo cozida", "Chá sem açúcar", "Mamão papaia", "Morango", "Albumina (pó)"]]
];
const foodIdx = n => FOODS.findIndex(f => f[0] === n);
const favsOf = m => (S.favs && S.favs[m]) || [];
function favToggle(i) {
  S.favs = S.favs || {}; const a = S.favs[UI.meal] = S.favs[UI.meal] || [], n = FOODS[i][0], j = a.indexOf(n);
  if (j < 0) a.push(n); else a.splice(j, 1); save();
}
function favBtn(i) {
  const on = favsOf(UI.meal).includes(FOODS[i][0]);
  return `<button class="btn sm ghost full" id="favbtn" data-act="fav-tog" data-i="${i}">${on ? "★ Favorito em " : "☆ Favoritar em "}${UI.meal}</button>`;
}
const normTxt = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function foodListHTML() {
  const nq = normTxt(UI.q.trim());
  if (!nq) return `<p class="muted" style="padding:12px 0">Digite o nome do alimento.</p>`;
  const items = FOODS.map((f, i) => [f, i]).filter(([f]) => normTxt(f[0]).includes(nq));
  if (!items.length) return `<p class="muted" style="padding:12px 0">Nada encontrado. Use "Adicionar por rótulo".</p>`;
  return items.slice(0, 40).map(([f, i]) => `<button class="food" data-act="food" data-i="${i}"><div class="grow"><div style="font-weight:600">${esc(f[0])}</div><div class="muted" style="font-size:14px">${f[3]} (${f[4]} g) · ${Math.round(f[1] * f[4] / 100)} kcal · ${r1(f[2] * f[4] / 100)} g prot</div></div>${ic("plus")}</button>`).join("") + (items.length > 40 ? `<p class="muted" style="font-size:14px;padding:8px 0">Mostrando 40 de ${items.length}. Refine a busca.</p>` : "");
}
function findSheet(m) {
  UI.meal = m; UI.q = "";
  openSheet(`<h3 class="mid">Buscar em ${m}</h3>
  <input class="field" id="q" type="search" placeholder="Digite o alimento" autocomplete="off">
  <div class="list" id="foodlist">${foodListHTML()}</div>
  <button class="btn full" data-act="quick">${ic("plus")} Adicionar por rótulo (kcal e proteína)</button>`);
  const q = $("#q"); q && q.focus();
}
function mealRow(x, i) {
  return `<div class="swipe" data-i="${i}"><div class="swipe-bg">${ic("trash")}<span>Excluir</span>${ic("trash")}</div><div class="swipe-in li"><div class="grow"><div style="font-weight:600">${esc(x.n)}</div><div class="muted" style="font-size:14px">${x.g ? x.g + " g · " : ""}${Math.round(x.k)} kcal · ${r1(x.p)} g prot</div></div></div></div>`;
}
/* repetir a mesma refeição da última vez em que ela foi registrada */
function lastMealItems(m) {
  const k = today();
  for (const dk of Object.keys(S.days).sort().reverse()) { if (dk >= k) continue; const it = (S.days[dk].meals || []).filter(x => x.m === m); if (it.length) return it; }
  return [];
}
function repeatBtn(m) { const it = lastMealItems(m); return it.length ? `<button class="btn sm ghost full" data-act="meal-repeat" data-m="${m}">Repetir a última vez (${it.length} ${it.length === 1 ? "item" : "itens"}, ${Math.round(it.reduce((a, x) => a + x.k, 0))} kcal)</button>` : ""; }
function mealCard([m, hint, sug], d) {
  const it = d.meals.map((x, i) => [x, i]).filter(([x]) => x.m === m);
  const kk = it.reduce((a, [x]) => a + x.k, 0), pp = it.reduce((a, [x]) => a + x.p, 0);
  const fv = favsOf(m).map(foodIdx).filter(i => i >= 0);
  const sg = sug.map(foodIdx).filter(i => i >= 0 && !fv.includes(i));
  const chip = (i, star) => `<button class="chip" data-act="food" data-i="${i}" data-m="${m}">${star ? "★ " : ""}${esc(FOODS[i][0].replace(/ \(.*\)/, ""))}</button>`;
  return `<section class="card meal">
    <div class="row between"><h3 class="mid">${m}</h3><span class="lbl tabnum">${it.length ? Math.round(kk) + " kcal · " + Math.round(pp) + " g" : ""}</span></div>
    <p class="muted" style="font-size:15px;margin-top:-6px">${hint}</p>
    ${it.length ? `<div class="list">${it.map(([x, i]) => mealRow(x, i)).join("")}</div>` : ""}
    ${fv.length ? `<div><div class="lbl" style="margin-bottom:4px">Favoritos</div><div class="chips">${fv.map(i => chip(i, true)).join("")}</div></div>` : ""}
    <div><div class="lbl" style="margin-bottom:4px">Sugestões</div><div class="chips">${sg.map(i => chip(i, false)).join("")}</div></div>
    ${it.length ? "" : repeatBtn(m)}
    <button class="btn sm full" data-act="find" data-m="${m}">${ic("plus")} Buscar outro alimento</button>
  </section>`;
}
function rComer() {
  const k = today(), d = D(k), tg = TG(), tot = dayTotals(k), rem = tg.kcal - tot.k, adv = getMetabolicAdvice(k), fib = d.fiber || 0;
  $("#v-comer").innerHTML = `
  <section class="card" style="background:transparent;box-shadow:none;padding:0"><h2 class="h1">Comer</h2><p class="muted">Meta: ${fmtInt(tg.kcal)} kcal e ${tg.prot} g de proteína. Toque num alimento para registrar; arraste um item para o lado para excluir.</p></section>
  <section class="card">
    <div class="row" style="justify-content:space-around">
      ${ring(tot.k / tg.kcal, 104, 8, "grad", `<div><div class="mid tabnum">${fmtInt(tot.k)}</div><div class="lbl">kcal</div></div>`)}
      ${ring(tot.p / tg.prot, 104, 8, "var(--ok)", `<div><div class="mid tabnum">${Math.round(tot.p)}</div><div class="lbl">g prot</div></div>`)}
    </div>
    <p class="muted" style="text-align:center">${rem >= 0 ? `Restam ${fmtInt(rem)} kcal e ${Math.max(0, Math.round(tg.prot - tot.p))} g de proteína.` : `${fmtInt(-rem)} kcal acima da meta. Um dia acima não desfaz uma semana. A próxima refeição é normal.`}</p>
    ${fotoBtn()}
  </section>
  <section class="card tipcard"><div class="lbl" style="color:var(--text)">Dica para o resto do dia</div><div style="font-size:15px;line-height:1.5;color:var(--muted)">${adv.diet}</div></section>
  <section class="card">
    <div class="row between"><div class="lbl">Fibras (meta 30 g, registro manual)</div><b class="tabnum">${fib} g</b></div>
    <div class="bar"><i style="width:${Math.min(100, fib / 30 * 100)}%;background:var(--ok)"></i></div>
    <div class="grid2"><button class="btn sm" data-act="fiber-add" data-g="5">+5 g</button><button class="btn sm ghost" data-act="fiber-add" data-g="-5">−5 g</button></div>
  </section>
  ${MEALS.map(m => mealCard(m, d)).join("")}
  <button class="btn full" data-act="quick">${ic("plus")} Adicionar por rótulo (kcal e proteína)</button>
  <section class="card">
    <div class="lbl">Comer na rua</div>
    ${STREET.map(s => `<details class="fold"><summary>${s.t}${ic("down")}</summary><div class="body">${banner("ok", "check", "Escolha certa", s.ok.d)}${banner("bad", "x", "Armadilha", s.bad.d)}</div></details>`).join("")}
  </section>`;
}

/* --- excluir arrastando para o lado (com desfazer) --- */
function mealRemove(i) {
  const d = DW(today()), it = d.meals.splice(i, 1)[0]; if (!it) return; save(); render(); haptic(15);
  toast("Removido. Toque aqui para desfazer.", () => { DW(today()).meals.splice(i, 0, it); save(); render(); });
}
(function () {
  let g = null;
  const snap = (el, x, ms) => { el.style.transition = ms ? `transform ${ms}ms ease` : "none"; el.style.transform = `translateX(${x}px)`; };
  document.addEventListener("pointerdown", e => {
    const el = e.target.closest(".swipe-in"); if (!el) return;
    g = { el, x: e.clientX, y: e.clientY, dx: 0, on: false, id: e.pointerId };
  });
  document.addEventListener("pointermove", e => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.on) { if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { g = null; return; } if (Math.abs(dx) < 10) return; g.on = true; try { g.el.setPointerCapture(e.pointerId); } catch (x) { } }
    g.dx = dx; snap(g.el, dx, 0);
    g.el.parentNode.classList.toggle("armed", Math.abs(dx) > Math.min(120, g.el.offsetWidth * 0.35));
  });
  const end = e => {
    if (!g || e.pointerId !== g.id) return;
    const { el, dx, on } = g; g = null; if (!on) return;
    const w = el.offsetWidth, i = +el.parentNode.dataset.i;
    if (e.type === "pointerup" && Math.abs(dx) > Math.min(120, w * 0.35)) { snap(el, dx < 0 ? -w : w, 160); setTimeout(() => mealRemove(i), 170); }
    else { snap(el, 0, 200); el.parentNode.classList.remove("armed"); }
  };
  document.addEventListener("pointerup", end); document.addEventListener("pointercancel", end);
})();
ACT.find = b => findSheet(b.dataset.m);
ACT["fav-tog"] = b => { favToggle(+b.dataset.i); const n = $("#favbtn"); if (n) n.outerHTML = favBtn(+b.dataset.i); render(); };
ACT["fiber-add"] = b => { const d = DW(today()); d.fiber = Math.max(0, (d.fiber || 0) + num(b.dataset.g)); save(); render(); };
ACT["meal-repeat"] = b => { const m = b.dataset.m, d = DW(today()), it = lastMealItems(m); it.forEach(x => d.meals.push({ ...x, t: Date.now() })); save(); render(); toast(`${it.length} ${it.length === 1 ? "item adicionado" : "itens adicionados"}.`); };
