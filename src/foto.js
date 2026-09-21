/* ============ FOTO DO PRATO (Gemini, opcional) e RECENTES ============ */
// Interruptor: mude para true para religar a foto do prato com Gemini (botao em Comer e cartao da chave em Mais).
const FOTO_IA = false;
const GEM_DEFAULT_MODEL = "gemini-2.5-flash-lite";
const GEM_PROMPT = "Você é um nutricionista brasileiro. Analise a foto de uma refeição e liste cada alimento visível separadamente. Para cada um estime o peso já preparado (gramas), kcal e proteína (g) desse peso, usando valores típicos da TACO/comida brasileira. Seja conservador e realista com óleo, molhos e porções. Se houver bebida, inclua. Se a imagem não mostrar comida, devolva a lista vazia. Responda somente em JSON.";
const GEM_SCHEMA = {
  type: "OBJECT",
  properties: {
    itens: { type: "ARRAY", items: { type: "OBJECT", properties: { nome: { type: "STRING" }, gramas: { type: "NUMBER" }, kcal: { type: "NUMBER" }, proteina_g: { type: "NUMBER" } }, required: ["nome", "gramas", "kcal", "proteina_g"] } },
    observacao: { type: "STRING" }
  },
  required: ["itens"]
};
const IA = { items: [], obs: "" };

function fotoDownscale(file, max = 1024) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", 0.8).split(",")[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Não consegui ler essa imagem.")); };
    img.src = url;
  });
}
function gemErro(status, msg) {
  if (status === 400 && /API key/i.test(msg)) return "Chave inválida. Confira a chave em Mais.";
  if (status === 401 || status === 403) return "A chave foi recusada ou não tem permissão. Confira em Mais.";
  if (status === 404) return "Modelo não encontrado. Em Mais, troque o nome do modelo.";
  if (status === 429) return "Limite de uso da chave atingido. Tente de novo em alguns minutos.";
  return `Erro ${status}: ${msg || "tente de novo."}`;
}
async function fotoAnalisar(file) {
  const key = S.settings.gemKey, model = S.settings.gemModel || GEM_DEFAULT_MODEL;
  openSheet(`<h3 class="mid">Analisando o prato...</h3><p class="muted">Enviando a foto ao Gemini. Costuma levar poucos segundos.</p>`);
  try {
    const data = await fotoDownscale(file);
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 30000);
    let r;
    try {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST", signal: ctl.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ parts: [{ text: GEM_PROMPT }, { inlineData: { mimeType: "image/jpeg", data } }] }], generationConfig: { responseMimeType: "application/json", responseSchema: GEM_SCHEMA, temperature: 0.2 } })
      });
    } finally { clearTimeout(t); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(gemErro(r.status, j.error && j.error.message));
    const txt = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts[0].text;
    if (!txt) throw new Error("A IA não devolveu resposta. Tente outra foto.");
    const o = JSON.parse(txt);
    IA.items = (o.itens || []).map(x => ({ nome: String(x.nome || "Item").slice(0, 60), g: Math.round(num(x.gramas)), k: Math.round(num(x.kcal)), p: r1(num(x.proteina_g)) })).filter(x => x.k > 0 || x.g > 0);
    IA.obs = String(o.observacao || "");
    if (!IA.items.length) throw new Error("Não identifiquei comida nessa foto. Tente de novo com o prato inteiro à vista.");
    iaSheet();
  } catch (e) {
    const off = !navigator.onLine || e.name === "TypeError";
    const msg = e.name === "AbortError" ? "Demorou demais. Tente de novo." : off && !e.message.startsWith("Chave") ? "Sem conexão com o Gemini. Registre manualmente pela tabela." : e.message;
    openSheet(`<h3 class="mid">Não deu certo</h3><p class="muted">${esc(msg)}</p><button class="btn full" data-act="close">Fechar</button>`);
  }
}
function iaSheet() {
  const chips = ["Café da manhã", "Almoço", "Lanche", "Jantar", "Ceia"].map(m => `<button class="chip ${UI.meal === m ? "on" : ""}" data-act="meal-sel" data-m="${m}">${m}</button>`).join("");
  openSheet(`<h3 class="mid">Estimativa da foto</h3>
  <div class="banner warn"><svg class="icon"><use href="#i-info"/></svg><div class="grow"><b>Confira antes de adicionar</b>Foto de prato costuma errar, principalmente em gramas de arroz, óleo e molhos. Ajuste o que estiver fora.</div></div>
  ${IA.obs ? `<p class="muted">${esc(IA.obs)}</p>` : ""}
  ${IA.items.map((x, i) => `<div class="tile" style="display:flex;flex-direction:column;gap:8px"><div class="row"><input class="field" data-ia="nome" data-i="${i}" value="${esc(x.nome)}" aria-label="nome"><button class="circ-btn" style="color:var(--bad);flex:none" data-act="ia-del" data-i="${i}" aria-label="remover"><svg class="icon"><use href="#i-trash"/></svg></button></div>
    <div class="grid3"><label class="lbl">g<input class="field" inputmode="decimal" data-ia="g" data-i="${i}" value="${x.g}"></label><label class="lbl">kcal<input class="field" inputmode="decimal" data-ia="k" data-i="${i}" value="${x.k}"></label><label class="lbl">prot g<input class="field" inputmode="decimal" data-ia="p" data-i="${i}" value="${x.p}"></label></div></div>`).join("")}
  <div class="chips">${chips}</div>
  <div class="tile in"><span id="ia-total" class="mid tabnum"></span></div>
  <button class="btn solid full" data-act="ia-add">ADICIONAR AO DIA</button>`);
  iaTotal();
}
function iaTotal() { const k = IA.items.reduce((a, x) => a + x.k, 0), p = IA.items.reduce((a, x) => a + x.p, 0), e = $("#ia-total"); if (e) e.textContent = `${fmtInt(k)} kcal · ${r1(p)} g prot`; }
function fotoIniciar() {
  if (!S.settings.gemKey) { toast("Cole sua chave do Gemini em Mais para usar a foto."); return go("mais"); }
  if (!S.settings.gemAck) {
    if (!confirm("A foto do prato será enviada ao Google (Gemini) para análise. Continuar?")) return;
    S.settings.gemAck = true; save();
  }
  $("#foto").click();
}
function fotoBtn() { return FOTO_IA ? `<button class="btn solid full" data-act="foto"><svg class="icon"><use href="#i-camera"/></svg> FOTO DO PRATO</button><input type="file" id="foto" accept="image/*" hidden>` : ""; }
function gemCard() { return ""; }
function recentesHTML() {
  const seen = new Set(), out = [];
  Object.keys(S.days).sort().reverse().slice(0, 30).forEach(k => D(k).meals.slice().reverse().forEach(m => { if (!seen.has(m.n) && out.length < 8) { seen.add(m.n); out.push(m); } }));
  if (!out.length) return "";
  RECENTES = out;
  return `<div><div class="lbl" style="margin-bottom:6px">Recentes</div><div class="chips">${out.map((m, i) => `<button class="chip" data-act="recent" data-i="${i}">${esc(m.n.replace(/ \(.*\)/, "").slice(0, 26))}</button>`).join("")}</div></div>`;
}
let RECENTES = [];
function recenteSheet(i) {
  const m = RECENTES[i]; if (!m) return;
  IA.rec = m;
  const chips = ["Café da manhã", "Almoço", "Lanche", "Jantar", "Ceia"].map(x => `<button class="chip ${UI.meal === x ? "on" : ""}" data-act="meal-sel" data-m="${x}">${x}</button>`).join("");
  openSheet(`<h3 class="mid">${esc(m.n)}</h3><p class="muted">${m.g ? m.g + " g · " : ""}${Math.round(m.k)} kcal · ${r1(m.p)} g de proteína</p><div class="chips">${chips}</div><button class="btn solid full" data-act="recent-add">ADICIONAR DE NOVO</button>`);
}
