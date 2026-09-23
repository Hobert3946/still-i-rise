/* ============ ORBE: paleta de comandos (campo embaixo, perto do polegar; resultados acima) ============ */
const PAL = { items: [] };
// estado visual da Aura no orbe: brilha conforme proteína, água e cardio do dia
function auraState(d, tg) {
  const p = (d.meals || []).reduce((a, m) => a + (m.p || 0), 0), cardio = (d.cardios || []).length > 0;
  if (p >= tg.prot * 0.9 && cardio) return ["overdrive", "Proteína e cardio do dia em dia. Segue o ritmo."];
  if (p >= 40 || (d.water || 0) > 1000) return ["fed", "O núcleo absorveu energia. Mantenha proteína e água."];
  return ["", "Sua aura precisa fluir. Tome um copo grande de água agora."];
}
function orbSync() { const o = $("#orb"); if (o) o.dataset.aura = auraState(D(today()), TG())[0]; }
function palEmptyHTML() {
  const [, msg] = auraState(D(today()), TG());
  const q = (act, icon, t, extra = "") => `<button class="pq" data-act="${act}" ${extra}>${ic(icon)}<span>${t}</span></button>`;
  const lens = [["corpo", "Corpo", "trend"], ["treino", "Treino", "dumb"], ["nutri", "Nutrição", "fork"], ["agua", "Água", "drop"], ["aura", "Aura", "sparkles"], ["sistema", "Sistema", "gear"]];
  return `<p class="pal-aura">${ic("sparkles")} ${msg}</p>
    <div class="lbl">Água agora</div><div class="pal-water">${WSIZES.map(([n, ml]) => `<button class="pw" data-act="w-add" data-ml="${ml}"><b>+${ml}</b><small>${n}</small></button>`).join("")}</div>
    <div class="lbl">Ações</div><div class="pal-grid">${q("pal-treino", "dumb", S.cur ? "Continuar treino" : "Treino")}${q("weigh", "scale", "Peso")}${q("cardio-open", "flame", "Cardio")}${q("foto", "camera", "Foto do prato")}${q("quick", "tag", "Rótulo")}${q("fiber-add", "leaf", "Fibra +5 g", 'data-g="5"')}</div>
    <div class="lbl">Lentes</div><div class="pal-lens">${lens.map(([l, n, i]) => `<button class="pl" data-act="lens" data-l="${l}">${ic(i)}<span>${n}</span></button>`).join("")}</div>
    <p class="muted xs">Escreva: <b>água 500</b> · <b>frango 150</b> · <b>arroz 100 @jantar</b> · <b>peso 118,4 cintura 121</b> · <b>cardio 30 6 5</b> · <b>dor 3</b> · <b>?pergunta para a Aura</b></p>`;
}
function palResults(q) {
  PAL.items = parseCommand(q);
  const box = $("#pal-res"); if (!box) return;
  if (!q.trim()) { box.innerHTML = palEmptyHTML(); return; }
  box.innerHTML = PAL.items.length ? `<div class="lbl">Entendi</div>` + PAL.items.map((c, i) => `<button class="pr ${i ? "" : "first"}" data-act="pal-run" data-i="${i}">${ic(c.icon)}<span class="grow"><b>${esc(c.label)}</b><small>${esc(c.sub || "")}</small></span>${i ? "" : `<kbd>↵</kbd>`}</button>`).join("")
    : `<p class="muted small">Não entendi. Tente "água 300", "ovo 2" ou abra a busca de alimentos.</p><button class="btn full" data-act="find" data-m="${mealByTime()}">${ic("search")} Buscar na tabela</button>`;
}
function openOrb(prefill = "") {
  const p = $("#palette");
  p.innerHTML = `<div class="pal-in"><div class="pal-res" id="pal-res"></div>
    <form class="pal-bar" data-form="pal">${ic("search")}<input id="pal-q" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="água 500 · frango 150 · peso…" aria-label="Comando" value="${esc(prefill)}"><button type="button" class="icon-btn" data-act="orb-close" aria-label="Fechar">${ic("x")}</button></form></div>`;
  p.classList.add("on"); pushLayer("orb"); scrimSync(); palResults(prefill); kbFit();
  setTimeout(() => { const i = $("#pal-q"); if (i) i.focus(); }, 60);
}
HIDE.orb = () => { $("#palette").classList.remove("on"); scrimSync(); const i = $("#pal-q"); if (i) i.blur(); };
function palRun(i) { const c = PAL.items[i]; if (!c) return; dropLayer("orb"); c.run(); haptic(12); render(); }
// iOS não redimensiona a página com o teclado aberto: sobe a paleta pela altura do teclado
function kbFit() { const vv = window.visualViewport, p = $("#palette"); if (!vv || !p) return; p.style.bottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop) + "px"; }
if (window.visualViewport) { visualViewport.addEventListener("resize", kbFit); visualViewport.addEventListener("scroll", kbFit); }
ACT.orb = () => openOrb();
ACT["orb-close"] = () => dropLayer("orb");
ACT["pal-run"] = b => palRun(+b.dataset.i);
ACT["pal-treino"] = () => { if (STACK.includes("orb")) dropLayer("orb"); S.cur ? wkOpen() : wkStart(planLetter(today()) || seqNext()); };
