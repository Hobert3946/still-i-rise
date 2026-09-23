/* ============ FOTO DO PRATO (Gemini): estimativa por item, revisada antes de entrar no dia ============ */
const GEM_PROMPT = "Você é um nutricionista brasileiro. Analise a foto de uma refeição e liste cada alimento visível separadamente. Para cada um estime o peso já preparado (gramas), kcal e proteína (g) desse peso, usando valores típicos da TACO/comida brasileira. Seja conservador e realista com óleo, molhos e porções. Se houver bebida, inclua. Se a imagem não mostrar comida, devolva a lista vazia. Responda somente em JSON.";
const GEM_SCHEMA = {
  type: "OBJECT",
  properties: {
    itens: { type: "ARRAY", items: { type: "OBJECT", properties: { nome: { type: "STRING" }, gramas: { type: "NUMBER" }, kcal: { type: "NUMBER" }, proteina_g: { type: "NUMBER" } }, required: ["nome", "gramas", "kcal", "proteina_g"] } },
    observacao: { type: "STRING" }
  },
  required: ["itens"]
};
const FOTO = { items: [], obs: "", meal: "Almoço" };
// reduz a foto para no máximo 1024 px e devolve base64 (vai inline na requisição, não é guardada)
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
function fotoStart(meal) {
  if (!SEC.gemKey) { toast("Cole sua chave do Gemini no Coach para usar a foto."); return openPage("coach"); }
  if (!S.settings.gemAck) {
    if (!confirm("A foto do prato será enviada ao Google (Gemini) para análise. Continuar?")) return;
    S.settings.gemAck = true; save();
  }
  FOTO.meal = meal || mealByTime(); $("#foto").click();
}
async function fotoAnalyze(file) {
  openSheet(`<h3 class="h3">Analisando o prato…</h3><p class="muted">Enviando a foto ao Gemini. Costuma levar poucos segundos.</p><div class="shimmer"></div>`);
  try {
    const data = await fotoDownscale(file);
    const txt = await gemPost({ contents: [{ parts: [{ text: GEM_PROMPT }, { inlineData: { mimeType: "image/jpeg", data } }] }], generationConfig: { responseMimeType: "application/json", responseSchema: GEM_SCHEMA, temperature: 0.2 } });
    const o = JSON.parse(txt);
    FOTO.items = (o.itens || []).map(x => ({ nome: String(x.nome || "Item").slice(0, 60), g: Math.round(num(x.gramas)), k: Math.round(num(x.kcal)), p: r1(num(x.proteina_g)) })).filter(x => x.k > 0 || x.g > 0);
    FOTO.obs = String(o.observacao || "");
    if (!FOTO.items.length) throw new Error("Não identifiquei comida nessa foto. Tente de novo com o prato inteiro à vista.");
    fotoSheet();
  } catch (e) {
    const msg = e.name === "AbortError" ? "Demorou demais. Tente de novo." : !navigator.onLine ? "Sem conexão com o Gemini. Registre pelo teclado de alimentos." : e.message;
    openSheet(`<h3 class="h3">Não deu certo</h3><p class="muted">${esc(msg)}</p><button class="btn full" data-act="close">Fechar</button>`);
  }
}
function fotoSheet() {
  openSheet(`<h3 class="h3">Estimativa da foto</h3>
  ${banner("warn", "info", "Confira antes de adicionar", "Foto de prato costuma errar, principalmente em gramas de arroz, óleo e molhos. Ajuste o que estiver fora.")}
  ${FOTO.obs ? `<p class="muted">${esc(FOTO.obs)}</p>` : ""}
  ${FOTO.items.map((x, i) => `<div class="tile col"><div class="row"><input class="field" data-foto="nome" data-i="${i}" value="${esc(x.nome)}" aria-label="nome"><button class="icon-btn bad" data-act="foto-del" data-i="${i}" aria-label="remover">${ic("trash")}</button></div>
    <div class="grid3"><label class="lbl">g<input class="field" inputmode="decimal" data-foto="g" data-i="${i}" value="${x.g}"></label><label class="lbl">kcal<input class="field" inputmode="decimal" data-foto="k" data-i="${i}" value="${x.k}"></label><label class="lbl">prot g<input class="field" inputmode="decimal" data-foto="p" data-i="${i}" value="${x.p}"></label></div></div>`).join("")}
  ${mealChips(FOTO.meal, "foto-meal")}
  <div class="tile"><span id="foto-total" class="h3 tabnum"></span></div>
  <button class="btn solid full" data-act="foto-add">ADICIONAR AO DIA</button>`);
  fotoTotal();
}
function fotoTotal() { const k = FOTO.items.reduce((a, x) => a + x.k, 0), p = FOTO.items.reduce((a, x) => a + x.p, 0), e = $("#foto-total"); if (e) e.textContent = `${fmtInt(k)} kcal · ${r1(p)} g prot`; }
ACT.foto = b => fotoStart(b.dataset.m);
ACT["foto-del"] = b => { FOTO.items.splice(+b.dataset.i, 1); if (!FOTO.items.length) closeSheet(); else fotoSheet(); };
ACT["foto-meal"] = b => { FOTO.meal = b.dataset.m; fotoSheet(); };
ACT["foto-add"] = () => { const d = DW(dayK()); FOTO.items.forEach(x => d.meals.push({ t: Date.now(), n: "IA: " + x.nome, g: x.g, k: x.k, p: x.p, m: FOTO.meal })); save(); closeSheet(); render(); toast("Adicionado. Lembre: é estimativa."); haptic(); };
