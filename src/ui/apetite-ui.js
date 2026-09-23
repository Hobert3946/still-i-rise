/* ============ APETITE: registrar fome em ~5 s, sono, histórico e padrões ============ */
const scale = (id, v) => `<div class="scale" id="${id}" role="radiogroup">${Array.from({ length: 11 }, (_, i) => `<button role="radio" aria-checked="${i === v}" class="${i === v ? "on" : ""}" style="--p:${i / 10}" data-act="scale" data-s="${id}" data-v="${i}">${i}</button>`).join("")}</div>`;
function hungerSheet() {
  UI.hg = { fome: 5, vontade: 5, perda: false, gat: [], estresse: null };
  openSheet(`<h3 class="h2">Como está sua fome?</h3><p class="muted small">Agora, ${hhmm(new Date())}. Leva 5 segundos.</p>
    <div class="lbl">Fome (0 = nenhuma · 10 = muita)</div>${scale("sc-fome", 5)}
    <div class="lbl">Vontade de comer algo específico</div>${scale("sc-vontade", 5)}
    <div class="lbl">Perdeu o controle ao comer hoje?</div><div class="seg" id="sc-perda"><button class="on" data-act="perda" data-v="0">Não</button><button data-act="perda" data-v="1">Sim</button></div>
    <div class="lbl">O que pesou? (opcional)</div><div class="chips lg">${GATILHOS.map(g => `<button class="chip" data-act="gat" data-g="${esc(g)}" aria-pressed="false">${esc(g)}</button>`).join("")}</div>
    ${fold("Estresse (opcional)", scale("sc-estresse", -1), false, "stress")}
    <button class="btn solid xl full" data-act="hunger-save">SALVAR</button>`);
}
function sleepSheet() {
  const v = D(today()).sleep != null ? D(today()).sleep : 7;
  openSheet(`<h3 class="h2">Quantas horas você dormiu?</h3><div class="stepper"><button class="icon-btn lg" data-act="sleep-adj" data-d="-0.5" aria-label="Menos meia hora">${ic("minus")}</button><input class="field tabnum" id="sl-h" inputmode="decimal" value="${v}" aria-label="Horas de sono"><button class="icon-btn lg" data-act="sleep-adj" data-d="0.5" aria-label="Mais meia hora">${ic("plus")}</button></div>
    <div class="grid3">${[5, 6, 7, 7.5, 8, 9].map(h => `<button class="chip" data-act="sleep-set" data-h="${h}">${String(h).replace(".", ",")} h</button>`).join("")}</div>
    <button class="btn solid xl full" data-act="sleep-save">SALVAR</button>`);
}
function apetiteView() {
  const k = dayK(), today_ = hungerOn(k), ins = hungerInsights(), days = new Set(S.hunger.map(x => x.d)).size;
  const log = today_.slice().reverse().map(x => `<div class="li"><time class="tabnum">${hhmm(new Date(x.t))}</time><span class="grow">Fome <b>${x.fome}</b> · vontade <b>${x.vontade}</b>${x.perda ? ` · <span class="bad">perda de controle</span>` : ""}${x.gat.length ? `<small class="muted">${x.gat.map(esc).join(", ")}</small>` : ""}</span></div>`).join("");
  const week = Array.from({ length: 7 }, (_, i) => { const d = addDays(today(), i - 6), a = hungerOn(d), m = a.length ? Math.max(...a.map(x => x.fome)) : null; return `<div class="d"><i style="height:${m == null ? 6 : Math.max(8, m * 10)}%;background:${m == null ? "var(--surface3)" : a.some(x => x.perda) ? "var(--bad)" : "var(--accent)"}"></i><span>${DOW[parseKey(d).getDay()][0]}</span></div>`; }).join("");
  return `<section class="hero-card"><div class="kick">Apetite</div><h2 class="h2">Como está sua fome?</h2><button class="btn solid xl full" data-act="hunger-open">Registrar fome agora</button>
      <button class="btn ghost full" data-act="sleep-open">${D(today()).sleep != null ? `Sono de hoje: ${String(D(today()).sleep).replace(".", ",")} h · alterar` : "Registrar horas de sono"}</button></section>
    ${sec(`Hoje · ${today_.length} ${today_.length === 1 ? "registro" : "registros"}`, log ? `<div class="list">${log}</div>` : `<p class="muted small">Nada registrado hoje.</p>`)}
    ${sec("Fome máxima por dia", `<div class="week">${week}</div><p class="muted xs">Barra vermelha = dia com perda de controle.</p>`)}
    ${sec("Padrões que o Coach percebeu", ins.length ? ins.map(t => `<p class="insight">${ic("sparkles")} ${esc(t)}</p>`).join("") : `<p class="muted small">Ainda não há dados suficientes (${days} ${days === 1 ? "dia" : "dias"} com registro). Os padrões aparecem com cerca de 10 dias de registros de fome e sono.</p>`)}`;
}
ACT["hunger-open"] = () => hungerSheet();
ACT["sleep-open"] = () => sleepSheet();
ACT.scale = b => { const s = b.dataset.s, v = +b.dataset.v; $$(`#${s} button`).forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); }); UI.hg[s.slice(3)] = v; haptic(6); };
ACT.perda = b => { $$("#sc-perda button").forEach(x => x.classList.toggle("on", x === b)); UI.hg.perda = b.dataset.v === "1"; };
ACT.gat = b => { const g = b.dataset.g, a = UI.hg.gat, i = a.indexOf(g); if (i < 0) a.push(g); else a.splice(i, 1); b.classList.toggle("on", i < 0); b.setAttribute("aria-pressed", i < 0); };
ACT["hunger-save"] = () => { hungerLog(UI.hg); closeSheet(); render(); toast("Registrado. Obrigado pela honestidade."); haptic(15); };
ACT["sleep-adj"] = b => { const i = $("#sl-h"); i.value = clamp(num(i.value, 7) + num(b.dataset.d), 0, 16); };
ACT["sleep-set"] = b => { $("#sl-h").value = b.dataset.h; };
ACT["sleep-save"] = () => { if (!sleepLog(num($("#sl-h").value, -1))) return toast("Informe entre 0 e 16 horas."); closeSheet(); render(); toast("Sono registrado."); };
