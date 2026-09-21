/* ============ ÁGUA (aba própria) e FRASE DO DIA ============ */
const FRASES = [
  ["Você pode me pisotear na própria lama, mas, ainda assim, como a poeira, eu me levanto.", "Maya Angelou, Still I Rise"],
  ["Somos aquilo que fazemos repetidamente. A excelência, portanto, não é um ato, mas um hábito.", "Will Durant, sobre Aristóteles"],
  ["A gota d'água cava a pedra, não pela força, mas pela constância.", "Ovídio"],
  ["Água mole em pedra dura, tanto bate até que fura.", "Provérbio popular"],
  ["Não é porque as coisas são difíceis que não ousamos; é porque não ousamos que elas são difíceis.", "Sêneca"],
  ["Primeiro diga a si mesmo o que você quer ser; depois faça o que tem de fazer.", "Epicteto"],
  ["O que está no caminho torna-se o caminho.", "Marco Aurélio, Meditações"],
  ["Uma jornada de mil milhas começa com um único passo.", "Lao Tsé"],
  ["Tudo vale a pena se a alma não é pequena.", "Fernando Pessoa"],
  ["Disciplina é a ponte entre metas e realizações.", "Jim Rohn"],
  ["Não se trata de quão forte você bate, e sim de quão forte aguenta apanhar e continuar em frente.", "Rocky Balboa"],
  ["A força não vem da vitória. Suas lutas desenvolvem suas forças.", "Arnold Schwarzenegger"],
  ["Você pode não controlar tudo o que acontece com você, mas pode decidir não ser reduzido por isso.", "Maya Angelou"],
  ["Odiei cada minuto do treino, mas disse a mim mesmo: não desista. Sofra agora e viva o resto da vida como campeão.", "Muhammad Ali"]
];
function fraseIdx() {
  const n = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
  return (n + (UI.qOff || 0)) % FRASES.length;
}
function fraseHTML() {
  const [t, a] = FRASES[fraseIdx()];
  return `<section class="card quote-card" id="quote-card">
    <div class="q-mark" aria-hidden="true">“</div>
    <p class="q-txt">${esc(t)}</p>
    <div class="row between" style="align-items:center"><span class="lbl">${a ? esc(a) : "Frase do dia"}</span><button class="btn sm ghost" data-act="quote-next" aria-label="Outra frase">Outra frase</button></div>
  </section>`;
}
function fraseInject() {
  const v = $("#v-deck"); if (!v || $("#quote-card", v)) return;
  const tmp = document.createElement("div"); tmp.innerHTML = fraseHTML();
  const el = tmp.firstElementChild, ref = $("#aura-container", v);
  ref && ref.nextSibling ? v.insertBefore(el, ref.nextSibling) : v.appendChild(el);
}

/* --- água --- */
const WSIZES = [["Gole", 100], ["Copo", 200], ["Copo grande", 300], ["Garrafa", 500], ["Squeeze", 750], ["1 litro", 1000]];
function waterAdd(ml) {
  const d = DW(today()), goal = S.settings.waterGoal, before = d.water || 0;
  d.wlog = d.wlog || [];
  if (ml > 0) { const n = new Date(); d.wlog.push({ t: String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0"), ml }); }
  d.water = Math.max(0, before + ml);
  d.h.agua = d.water >= goal; save(); haptic(ml > 0 ? 12 : 8);
  return before < goal && d.water >= goal;
}
function waterUndo() {
  const d = DW(today()); d.wlog = d.wlog || [];
  const last = d.wlog.pop(); d.water = Math.max(0, (d.water || 0) - (last ? last.ml : 250));
  d.h.agua = d.water >= S.settings.waterGoal; save();
}
function waterStreak() {
  let n = 0, k = today(); if ((D(k).water || 0) < S.settings.waterGoal) k = addDays(k, -1);
  while ((D(k).water || 0) >= S.settings.waterGoal) { n++; k = addDays(k, -1); }
  return n;
}
function waterPace(w) {
  const now = new Date(), h = now.getHours() + now.getMinutes() / 60, goal = S.settings.waterGoal;
  const exp = Math.round(goal * Math.min(1, Math.max(0, (h - 6) / 15)) / 50) * 50, diff = w - exp;
  if (w >= goal) return ["ok", "Meta batida. Agora é só beber quando sentir sede."];
  if (h < 6) return ["acc", "Comece o dia com um copo grande ao acordar."];
  if (diff >= 0) return ["ok", `No ritmo: ${diff ? "+" + diff + " ml à frente" : "exatamente no alvo"} (esperado até agora: ${exp} ml).`];
  return [diff < -700 ? "warn" : "acc", `${-diff} ml atrás do ritmo. Um copo agora resolve (esperado até agora: ${exp} ml).`];
}
function bottleSVG(p, from) {
  const top = 46, bot = 312, y = bot - (bot - top) * p, y0 = bot - (bot - top) * from;
  const body = "M78 14h44v26c0 14 38 26 38 60v190a24 24 0 0 1-24 24H64a24 24 0 0 1-24-24V100c0-34 38-46 38-60z";
  const wave = "M-100 0q25-9 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0V320H-100z";
  const ticks = [0.25, 0.5, 0.75].map(f => `<line x1="146" x2="160" y1="${bot - (bot - top) * f}" y2="${bot - (bot - top) * f}" stroke="currentColor" opacity=".45" stroke-width="2"/>`).join("");
  return `<svg viewBox="0 0 200 340" class="bottle" aria-hidden="true">
    <defs><clipPath id="bclip"><path d="${body}"/></clipPath>
    <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4e8"/><stop offset="1" stop-color="#2f7fb5"/></linearGradient></defs>
    <path d="${body}" fill="var(--surface2)" opacity=".7"/>
    <g clip-path="url(#bclip)"><g class="wlevel" data-to="${y}" style="transform:translateY(${y0}px)">
      <g class="wwave b"><path d="${wave}" fill="#7cc4e8" opacity=".45"/></g>
      <g class="wwave a"><path d="${wave}" fill="url(#wg)"/></g>
      <circle class="bub" cx="80" cy="330" r="4" fill="#fff" opacity=".5"/><circle class="bub d2" cx="118" cy="330" r="3" fill="#fff" opacity=".5"/><circle class="bub d3" cx="98" cy="330" r="2.5" fill="#fff" opacity=".5"/>
    </g></g>
    <path d="${body}" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linejoin="round"/>
    <rect x="76" y="4" width="48" height="12" rx="4" fill="var(--accent)"/>${ticks}</svg>`;
}
function rAgua() {
  const k = today(), d = D(k), goal = S.settings.waterGoal, w = d.water || 0, p = Math.min(1, w / goal);
  const from = UI.wLast == null ? 0 : UI.wLast; UI.wLast = p;
  const [pc, pt] = waterPace(w), ws = waterStreak();
  const log = (d.wlog || []).slice().reverse();
  const mon = mondayOf(k); const bars = Array.from({ length: 7 }, (_, i) => { const kk = addDays(mon, i), v = D(kk).water || 0, f = Math.min(1, v / goal); return `<div class="d ${kk === k ? "t" : ""}"><i style="height:${Math.max(6, f * 100)}%;background:${v >= goal ? "var(--ok)" : v ? "#5aa9d6" : "var(--surface2)"}"></i><span>${DOW[parseKey(kk).getDay()][0]}</span></div>`; }).join("");
  const wkAvg = Math.round(Array.from({ length: 7 }, (_, i) => D(addDays(k, -i)).water || 0).reduce((a, b) => a + b, 0) / 7);
  $("#v-agua").innerHTML = `
  <section class="card" style="background:transparent;box-shadow:none;padding:0"><h2 class="h1">Água</h2><p class="muted">Cada toque enche a garrafa. A meta é ${(goal / 1000).toFixed(2).replace(".", ",")} L por dia.</p></section>
  <section class="card water-hero">
    <div class="bottle-wrap">${bottleSVG(p, from)}
      <div class="bottle-txt"><div class="big tabnum">${(w / 1000).toFixed(2).replace(".", ",")}<span style="font-size:18px"> L</span></div><div class="lbl" style="color:inherit;opacity:.85">${Math.round(p * 100)}% de ${(goal / 1000).toFixed(1).replace(".", ",")} L</div></div>
    </div>
    <div class="banner ${pc}" style="width:100%">${ic("info")}<div class="grow">${pt}</div></div>
  </section>
  <section class="card">
    <div class="row between"><div class="sec-t"><span class="dot" style="background:#5aa9d6"></span><span class="lbl">Beber agora</span></div><button class="lbl" style="color:var(--accent-ink)" data-act="w-undo">Desfazer último</button></div>
    <div class="grid3">${WSIZES.map(([n, ml]) => `<button class="btn sm wbtn" data-act="w-add" data-ml="${ml}"><span>${n}</span><b>+${ml} ml</b></button>`).join("")}</div>
    <div class="row" style="gap:10px"><input id="wcust" class="winput" type="number" inputmode="numeric" placeholder="Outro valor em ml" aria-label="Quantidade em ml"><button class="btn sm solid" data-act="w-custom">Adicionar</button></div>
  </section>
  <section class="card">
    <div class="row between"><div class="sec-t"><span class="dot ok"></span><span class="lbl">Esta semana</span></div><span class="pill ${ws ? "ok" : ""}">${ws} ${ws === 1 ? "dia" : "dias"} na meta</span></div>
    <div class="week">${bars}</div>
    <p class="muted" style="font-size:15px">Média desta semana: ${(wkAvg / 1000).toFixed(2).replace(".", ",")} L. Barra verde = meta batida.</p>
  </section>
  <section class="card">
    <div class="row between"><div class="sec-t"><span class="dot"></span><span class="lbl">Hoje</span></div><span class="lbl">${log.length} ${log.length === 1 ? "registro" : "registros"}</span></div>
    ${log.length ? `<div class="list">${log.map(l => `<div class="li"><span style="color:#5aa9d6">${ic("drop")}</span><div class="grow">${l.t}</div><b class="tabnum">+${l.ml} ml</b></div>`).join("")}</div>` : `<p class="muted">Nada registrado ainda. Comece com um copo grande ao acordar.</p>`}
  </section>
  <section class="card flat">
    <div class="lbl">Meta diária</div>
    <div class="row between" style="margin-top:6px"><button class="circ-btn" data-act="w-goal" data-d="-250" aria-label="Diminuir meta">${ic("minus")}</button><div class="mid tabnum">${(goal / 1000).toFixed(2).replace(".", ",")} L</div><button class="circ-btn" data-act="w-goal" data-d="250" aria-label="Aumentar meta">${ic("plus")}</button></div>
    <p class="muted" style="font-size:15px;margin-top:6px">Referência comum: 35 ml por kg, cerca de ${(35 * (S.settings.calcWeight || 100) / 1000).toFixed(1).replace(".", ",")} L para ${S.settings.calcWeight || 100} kg. Se tiver dúvida sobre o seu caso (fígado, rins), pergunte ao médico.</p>
  </section>`;
  requestAnimationFrame(() => requestAnimationFrame(() => { const g = $("#v-agua .wlevel"); if (g) g.style.transform = `translateY(${g.dataset.to}px)`; }));
}
/* ícone da gota no menu: enche conforme a meta */
function dockWater() {
  const d = D(today()), p = Math.min(1, (d.water || 0) / S.settings.waterGoal);
  document.querySelectorAll("#dropg stop").forEach(s => s.setAttribute("offset", String(p)));
  const t = $('.tab[data-tab="agua"]'); if (t) t.classList.toggle("full", p >= 1);
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act; let done = false;
  if (a === "w-add") done = waterAdd(num(b.dataset.ml));
  else if (a === "w-custom") { const i = $("#wcust"), v = i ? num(i.value) : 0; if (v <= 0 || v > 3000) return toast("Digite um valor entre 1 e 3000 ml."); done = waterAdd(v); }
  else if (a === "w-undo") waterUndo();
  else if (a === "w-goal") { S.settings.waterGoal = Math.min(8000, Math.max(1000, S.settings.waterGoal + num(b.dataset.d))); const d = DW(today()); d.h.agua = (d.water || 0) >= S.settings.waterGoal; save(); }
  else if (a === "quote-next") { UI.qOff = (UI.qOff || 0) + 1; const c = $("#quote-card"); if (c) { const t = document.createElement("div"); t.innerHTML = fraseHTML(); c.replaceWith(t.firstElementChild); } return; }
  else return;
  render();
  if (done) toast("Meta de água batida. Sua garrafa está cheia.");
});
