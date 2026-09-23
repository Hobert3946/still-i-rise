/* ============ AURA (Gemini): chat com contexto do dia e memória de 7 dias ============ */
// Modelos estáveis e atuais em set/2026 (ai.google.dev/gemini-api/docs/models). A família 2.5 ficou restrita a quem já usava.
const GEM_MODELS = [
  ["gemini-3.8-flash", "Gemini 3.8 Flash · recomendado (melhor em fotos e respostas)"],
  ["gemini-3.5-flash-lite", "Gemini 3.5 Flash-Lite · mais rápido e barato"]
];
const GEM_DEFAULT = GEM_MODELS[0][0];
const gemModel = () => GEM_MODELS.some(m => m[0] === S.settings.gemModel) ? S.settings.gemModel : GEM_DEFAULT;
const GEM_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
function gemErro(status, msg) {
  if (status === 400 && /API key/i.test(msg)) return "Chave inválida. Confira a chave no Coach.";
  if (status === 401 || status === 403) return "A chave foi recusada ou não tem permissão.";
  if (status === 404) return "Modelo indisponível para esta chave. Toque em \"Verificar modelos\".";
  if (status === 429) return "Limite de uso da chave atingido. Tente de novo em alguns minutos.";
  return `Erro ${status}: ${msg || "tente de novo."}`;
}
async function gemPost(body, ms = 30000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(GEM_URL + encodeURIComponent(gemModel()) + ":generateContent", { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json", "x-goog-api-key": SEC.gemKey }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(gemErro(r.status, j.error && j.error.message));
    const txt = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts[0].text;
    if (!txt) throw new Error("A IA não devolveu resposta.");
    return txt;
  } finally { clearTimeout(t); }
}
/* memória: resumo dos últimos 7 dias, calculado dos registros reais do app */
function weekMemory() {
  const k = today(), prot = [], agua = []; let treinos = 0, cardio = 0, ativos = 0;
  for (let i = 1; i <= 7; i++) {
    const dk = addDays(k, -i), d = D(dk), p = (d.meals || []).reduce((a, m) => a + (m.p || 0), 0);
    if (p > 0) prot.push(p); if (d.water) agua.push(d.water); if (d.wk) treinos++; cardio += cardioMin(dk); if (isActive(dk)) ativos++;
  }
  const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0, w = S.weights, ult = w.length ? w[w.length - 1] : null;
  return `Últimos 7 dias: proteína média ${avg(prot)} g/dia (${prot.length} dias com registro), água média ${(avg(agua) / 1000).toFixed(1)} L, ${treinos} treinos, ${cardio} min de cardio, ${ativos} dias ativos.` + (ult ? ` Último peso: ${ult.kg} kg em ${ult.d} (meta ${S.profile.goal} kg).` : "");
}
function buildAuraContext() {
  const k = today(), d = D(k), tg = TG(), tot = dayTotals(k), L = planLetter(k) || "descanso";
  const hab = S.habits.map(h => `${h.t}${d.h[h.id] ? " (feito)" : ""}`).join("; ");
  return `Você é o Coach, um assistente de IA integrado ao app Still I Rise (treino, dieta, saúde e hábitos para manter o peso). Seja direta, objetiva e encorajadora, em português do Brasil.
Dados do usuário hoje:
- Nome: ${S.profile.name || "Usuário"}
- Calorias: ${Math.round(tot.k)} de ${tg.kcal} kcal (restam ${Math.max(0, Math.round(tg.kcal - tot.k))})
- Proteína: ${Math.round(tot.p)} de ${tg.prot} g (restam ${Math.max(0, Math.round(tg.prot - tot.p))})
- Água: ${(d.water / 1000).toFixed(1)} de ${(S.settings.waterGoal / 1000).toFixed(1)} L
- Treino do dia: ${L}${d.wk ? " (concluído)" : ""}; cardio hoje: ${cardioMin(k)} min
- Fibras registradas: ${d.fiber || 0} g de ${FIBER_GOAL} g
- Hábitos: ${hab}
- Sono de hoje: ${d.sleep != null ? d.sleep + " h" : "não registrado"}; fome registrada hoje: ${hungerOn(k).map(x => `${x.fome}/10${x.perda ? " (perda de controle)" : ""}`).join(", ") || "nenhum registro"}
- Remédios de hoje: ${(S.meds || []).map(m => `${m.n}: ${medToday(m.id).filter(x => x.taken).length}/${medToday(m.id).length} doses`).join("; ") || "nenhum cadastrado"}
- Padrões observados nos registros: ${hungerInsights().join(" ") || "ainda sem dados suficientes"}
- Horário: ${new Date().toLocaleTimeString("pt-BR")}
- ${weekMemory()}
Regras:
1. Responda em no máximo 2 ou 3 parágrafos curtos.
2. Em fotos de comida, estime os macros como aproximação e diga como encaixar no que resta do dia.
3. Se perguntarem se podem comer algo, use os macros restantes para responder.
4. Você tem o histórico desta conversa: use o que já foi dito e não peça de novo o que o usuário já informou.
5. Você é uma IA e pode errar. Não faça diagnóstico, não sugira nem ajuste medicação ou dose, não prometa perda de peso. Para dor, sintomas, glicemia alterada ou dúvida clínica, oriente a procurar um profissional de saúde.`;
}
/* histórico no formato do Gemini (papéis user/model, sem erros, sem turnos repetidos) */
function chatContents() {
  const out = [];
  (S.chat || []).filter(m => !m.err && (m.text || m.img)).slice(-24).forEach(m => {
    const role = m.role === "ai" ? "model" : "user", parts = [{ text: m.text || "O que acha dessa foto para a minha dieta hoje?" }];
    if (m.img) parts.push({ inlineData: { mimeType: "image/jpeg", data: m.img } });
    const last = out[out.length - 1];
    if (last && last.role === role) last.parts.push(...parts); else out.push({ role, parts });
  });
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}
const IA_STATE = { busy: false };
async function askAura(text, file = null) {
  if (!SEC.gemKey) return toast("Configure a chave do Gemini no Coach primeiro.");
  const img = file ? await fotoDownscale(file) : null;
  S.chat = S.chat || []; S.chat.push({ role: "user", text, img }); IA_STATE.busy = true; render();
  try { S.chat.push({ role: "ai", text: await gemPost({ systemInstruction: { parts: [{ text: buildAuraContext() }] }, contents: chatContents() }) }); }
  catch (e) { S.chat.push({ role: "ai", err: true, text: "Não consegui responder agora: " + (e.name === "AbortError" ? "demorou demais." : e.message) }); }
  S.chat.forEach(m => delete m.img);        // fotos não ficam guardadas (pesam no armazenamento e no backup)
  S.chat = S.chat.slice(-40); IA_STATE.busy = false; save(); render();
}
// confere, com a chave do usuário, quais dos modelos da lista respondem
async function gemCheck() {
  if (!SEC.gemKey) return toast("Cole a chave primeiro.");
  try {
    const r = await fetch(GEM_URL + "?pageSize=200", { headers: { "x-goog-api-key": SEC.gemKey } }), j = await r.json();
    if (!r.ok) throw new Error(gemErro(r.status, j.error && j.error.message));
    const names = (j.models || []).map(m => m.name.replace("models/", "")), ok = GEM_MODELS.filter(m => names.includes(m[0]));
    if (!ok.length) return toast("Nenhum dos modelos está liberado para esta chave.");
    if (!ok.some(m => m[0] === gemModel())) { S.settings.gemModel = ok[0][0]; save(); render(); }
    toast("Disponíveis: " + ok.map(m => m[0]).join(", "));
  } catch (e) { toast("Falha ao verificar: " + e.message); }
}
