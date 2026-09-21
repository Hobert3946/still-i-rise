/* ============ A.I. (Aura): chat com o Gemini ============ */
const GEM_MODELS = [
  ["gemini-2.5-flash-lite", "gemini-2.5-flash-lite (rápido e barato, padrão)"],
  ["gemini-2.5-flash", "gemini-2.5-flash (equilibrado)"],
  ["gemini-2.5-pro", "gemini-2.5-pro (avançado, pode exigir plano pago)"]
];
function gemSelect() {
  const cur = S.settings.gemModel || GEM_MODELS[0][0], list = GEM_MODELS.some(m => m[0] === cur) ? GEM_MODELS : [[cur, cur + " (personalizado)"], ...GEM_MODELS];
  return `<select class="field" id="gemModel" style="margin-bottom:10px">${list.map(([v, t]) => `<option value="${esc(v)}" ${v === cur ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
}
function rIA() {
  const v = $("#v-ia"); if (!v) return;
  if (!S.settings.gemKey) {
    v.innerHTML = `<section class="card" style="background:transparent;box-shadow:none;padding:0"><h2 class="h1">A.I. Pessoal</h2><p class="muted">Conecte uma IA para analisar seus treinos, sua dieta e fotos de comida.</p></section>
    <section class="card">
      <div class="lbl">Chave API do Gemini</div>
      <input class="field" id="gemKey" type="password" autocomplete="off" placeholder="Cole a chave aqui">
      <label class="lbl">Modelo</label>${gemSelect()}
      <button class="btn solid full" data-act="gem-save">Conectar IA</button>
      <p class="muted" style="font-size:14px">A chave fica só neste aparelho e não entra no backup. Ela é enviada ao Google quando você faz uma pergunta, junto com o texto e as fotos que você mandar. Crie uma no Google AI Studio.</p>
    </section>`;
    return;
  }
  const chat = S.chat || [];
  const msgs = chat.length
    ? `<div class="chat-container">${chat.map(m => `<div class="chat-msg ${m.role}">${esc(m.text || "").replace(/\n/g, "<br>")}${m.img ? `<div class="chat-msg img"><img alt="Foto enviada" src="data:image/jpeg;base64,${m.img}"></div>` : ""}</div>`).join("")}<div id="ai-typing" style="display:none" class="chat-msg ai typing">Pensando...</div></div>`
    : `<div style="text-align:center;padding:40px 20px"><div class="ia-spark">${ic("sparkles")}</div><h3 class="mid">Sou a Aura, assistente de IA do app</h3><p class="muted" style="margin-top:10px">Conheço suas metas e o que você registrou hoje. Pergunte sobre comida, treino ou mande a foto de um rótulo. Não substituo médico nem nutricionista.</p></div>`;
  v.innerHTML = `
  <section class="card" style="background:transparent;box-shadow:none;padding:0;margin-bottom:10px">
    <div class="row between"><h2 class="h1">A.I. Pessoal</h2>
      <details class="fold" style="background:transparent;box-shadow:none;padding:0"><summary style="min-height:auto;font-size:13px;color:var(--accent-ink)">Modelo</summary>
        <div class="body" style="padding:10px;margin-top:5px;background:var(--surface2);border-radius:8px"><div class="lbl">Modelo atual</div>${gemSelect()}<button class="btn sm solid full" data-act="gem-save">Salvar modelo</button></div>
      </details></div>
  </section>
  <div id="chat-messages" style="padding-bottom:70px">${msgs}</div>
  <div class="chat-input-area">
    <button class="chat-btn" data-act="ia-clear" style="color:var(--bad)" aria-label="Limpar conversa">${ic("trash")}</button>
    <button class="chat-btn" data-act="ia-cam" aria-label="Enviar foto">${ic("camera")}</button>
    <textarea class="field" id="ia-input" placeholder="Pergunte algo..." rows="1" style="resize:none;padding-top:12px;max-height:120px;overflow-y:auto"></textarea>
    <button class="chat-btn primary" data-act="ia-send" aria-label="Enviar">${ic("right")}</button>
    <input type="file" id="ia-foto" accept="image/*" hidden>
  </div>`;
  window.scrollTo(0, document.body.scrollHeight);
}
function buildAuraContext() {
  const k = today(), d = D(k), tg = TG(), tot = dayTotals(k), L = planLetter(k) || "descanso";
  return `Você é a Aura, uma assistente de IA integrada ao app Still I Rise (treino, dieta e hábitos para manter o peso). Seja direta, objetiva e encorajadora, em português do Brasil.
Dados do usuário hoje:
- Nome: ${S.profile.name || "Usuário"}
- Calorias: ${Math.round(tot.k)} de ${tg.kcal} kcal
- Proteína: ${Math.round(tot.p)} de ${tg.prot} g
- Água: ${(d.water / 1000).toFixed(1)} de ${(S.settings.waterGoal / 1000).toFixed(1)} L
- Treino do dia: ${L}
- Fibras registradas: ${d.fiber || 0} g
- Horário: ${new Date().toLocaleTimeString("pt-BR")}
Regras:
1. Responda em no máximo 2 ou 3 parágrafos curtos.
2. Em fotos de comida, estime os macros como aproximação e diga como encaixar no que resta do dia.
3. Se perguntarem se podem comer algo, use os macros restantes para responder.
4. Você é uma IA e pode errar. Não faça diagnóstico nem ajuste medicação. Para dor, sintomas, glicemia alterada ou dúvida clínica, oriente a procurar um profissional de saúde.`;
}
async function askAuraIA(text, file = null) {
  if (!S.settings.gemKey) return toast("Configure a chave do Gemini na aba A.I. primeiro.");
  const base64 = file && typeof fotoDownscale === "function" ? await fotoDownscale(file) : null;
  S.chat = S.chat || []; S.chat.push({ role: "user", text, img: base64 }); rIA();
  const typing = $("#ai-typing"); if (typing) typing.style.display = "block"; window.scrollTo(0, document.body.scrollHeight);
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 30000);
    const parts = [{ text: text || "O que acha dessa foto para a minha dieta hoje?" }];
    if (base64) parts.push({ inlineData: { mimeType: "image/jpeg", data: base64 } });
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(S.settings.gemModel || GEM_MODELS[0][0])}:generateContent`, {
      method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": S.settings.gemKey },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: buildAuraContext() }] }, contents: [{ parts }] })
    });
    clearTimeout(t);
    const j = await r.json();
    if (!r.ok) throw new Error(j.error ? j.error.message : "Erro na IA");
    S.chat.push({ role: "ai", text: j.candidates[0].content.parts[0].text });
  } catch (e) { S.chat.push({ role: "ai", text: "Não consegui responder agora: " + e.message }); }
  S.chat.forEach(m => delete m.img);        // fotos não ficam guardadas (pesam no armazenamento e no backup)
  S.chat = S.chat.slice(-40); save(); rIA();
}
ACT["ia-cam"] = () => { const f = $("#ia-foto"); if (f) f.click(); };
ACT["ia-clear"] = () => openSheet(`<div style="text-align:center;padding:10px 0"><h3 class="mid" style="margin-bottom:10px">Limpar a conversa?</h3><p class="muted" style="margin-bottom:20px">Todo o histórico com a A.I. será apagado.</p>
  <div class="row" style="gap:10px"><button class="btn grow" data-act="close">Cancelar</button><button class="btn solid grow" style="background:var(--bad);color:#fff" data-act="ia-clear-confirm">Sim, apagar</button></div></div>`);
ACT["ia-clear-confirm"] = () => { S.chat = []; save(); closeSheet(); render(); toast("Conversa apagada."); };
ACT["ia-send"] = () => { const i = $("#ia-input"); if (!i) return; const t = i.value.trim(); if (t) { i.value = ""; i.style.height = "auto"; askAuraIA(t); } };
function iaFoto(e) {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  const i = $("#ia-input"), t = i ? i.value.trim() : ""; if (i) { i.value = ""; i.style.height = "auto"; }
  askAuraIA(t, f);
}
