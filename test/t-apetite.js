// Apetite: registro rápido, sono e padrões (só com dados suficientes, dizendo em quantos se baseia).
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() }), ev = a.ev;
  ev("go('nutri','apetite')"); a.click("[data-act=hunger-open]");
  a.click("#sc-fome [data-v='8']"); a.click("#sc-vontade [data-v='9']"); a.click("#sc-perda [data-v='1']"); a.click("[data-act=gat][data-g='Estresse']");
  a.click("[data-act=hunger-save]");
  const h = ev("S.hunger[0]");
  T.ok(h.fome === 8 && h.vontade === 9 && h.perda === true && h.gat[0] === "Estresse" && h.d === ev("today()"), "registro de fome com intensidade, vontade, perda de controle e gatilho");
  a.click("[data-act=sleep-open]"); a.click("[data-act=sleep-set][data-h='5']"); a.click("[data-act=sleep-save]");
  T.ok(ev("D(today()).sleep") === 5, "horas de sono");
  T.ok(/Ainda não há dados suficientes/.test(a.q("#view").textContent), "sem dados suficientes, não inventa padrão");
  // 8 dias: 4 com pouco sono e fome alta à noite, 4 com sono bom e fome baixa
  ev(`S.hunger = []; for (let i = 1; i <= 8; i++) { const k = addDays(today(), -i), t = parseKey(k).getTime() + 21 * 36e5, low = i <= 4; DW(k).sleep = low ? 5 : 7.5; S.hunger.push({ t, d: k, fome: low ? 8 : 4, vontade: 5, perda: false, gat: [], estresse: null }); } save()`);
  const ins = ev("hungerInsights()");
  T.ok(ins.some(t => /Nos 4 dias em que você dormiu menos de 6 h, sua fome à noite foi em média 8, contra 4 nos 4 dias/.test(t)), "padrão sono × fome noturna com números reais");
  T.ok(ins.some(t => /entre 21h e 24h|entre 18h e 21h/.test(t)), "horário de maior fome");
  ev(`S.hunger.push({ t: Date.now(), d: today(), fome: 7, vontade: 8, perda: true, gat: ["Tédio"], estresse: 7 }, { t: Date.now(), d: today(), fome: 6, vontade: 8, perda: true, gat: ["Tédio"], estresse: 7 })`);
  T.ok(ev("hungerInsights()").some(t => /gatilho marcado foi "Tédio"/.test(t)), "gatilho mais frequente nos episódios de perda de controle");
  ev("openPage('coach')"); T.ok(/dormiu menos de 6 h/.test(a.q("#page").textContent), "o Coach mostra os padrões percebidos");
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || "")); a.close();
};
