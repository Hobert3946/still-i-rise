// Aura (Gemini): modelos atuais, contexto do dia, memória, fotos não guardadas, 40 mensagens e foto do prato.
const { boot, baseState } = require("./helpers");
const reply = t => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: t }] } }] }) });
module.exports = async T => {
  const calls = []; let next = "Resposta de teste";
  const a = await boot({ v1: baseState(), sec: { gemKey: "chave" }, fetch: async (url, o) => { calls.push({ url, o }); return reply(next); } });
  a.ev("openPage('coach')");
  T.ok(a.ev("GEM_MODELS.map(m => m[0]).join()") === "gemini-3.8-flash,gemini-3.5-flash-lite", "só modelos atuais: 3.8 Flash e 3.5 Flash-Lite");
  T.ok(a.q("#gemModel").value === "gemini-3.8-flash", "padrão: Gemini 3.8 Flash");
  a.q("#ia-input").value = "posso comer pizza?"; a.click(".chat-bar .send") ; await a.wait(60);
  T.ok(calls.length === 1 && /gemini-3.8-flash:generateContent/.test(calls[0].url) && calls[0].o.headers["x-goog-api-key"] === "chave", "chama o modelo com a chave no cabeçalho");
  const sys = JSON.parse(calls[0].o.body).systemInstruction.parts[0].text;
  T.ok(/você é o coach, um assistente de ia/i.test(sys) && /profissional de saúde/.test(sys) && /2 ou 3 parágrafos/.test(sys) && /macros restantes/.test(sys), "regras: IA, até 3 parágrafos, não diagnostica, usa macros restantes"); T.ok(/não sugira nem ajuste medicação ou dose/.test(sys) && /Remédios de hoje/.test(sys) && /Sono de hoje/.test(sys), "contexto inclui remédios, sono e fome, sem sugerir dose");
  T.ok(/Calorias: 0 de 2300/.test(sys) && /Fibras/.test(sys) && /Últimos 7 dias/.test(sys) && /Hábitos:/.test(sys), "contexto do dia e dos últimos 7 dias");
  T.ok(a.ev("S.chat.length") === 2 && /Resposta de teste/.test(a.q("#chat").textContent), "guarda e mostra pergunta e resposta");
  a.q("#ia-input").value = "e sem queijo?"; a.click(".chat-bar .send"); await a.wait(60);
  const c2 = JSON.parse(calls[1].o.body).contents; T.ok(c2.map(x => x.role).join() === "user,model,user", "envia o histórico (memória)");
  a.ev("S.chat.push({role:'user',text:'x',img:'AAAA'}); save()");
  a.q("#ia-input").value = "oi"; a.click(".chat-bar .send"); await a.wait(60);
  T.ok(a.ev("S.chat.every(m => !m.img)"), "fotos não ficam guardadas");
  a.ev("S.chat = Array.from({length: 60}, (_, i) => ({role: i % 2 ? 'ai' : 'user', text: 'm' + i}))");
  a.q("#ia-input").value = "fim"; a.click(".chat-bar .send"); await a.wait(60); T.ok(a.ev("S.chat.length") === 40, "histórico limitado a 40 mensagens");
  // foto do prato: estimativa editável antes de entrar no dia
  next = JSON.stringify({ itens: [{ nome: "Arroz", gramas: 150, kcal: 190, proteina_g: 4 }, { nome: "Frango", gramas: 120, kcal: 200, proteina_g: 38 }], observacao: "ok" });
  a.ev("fotoDownscale = async () => 'BASE64'");
  await a.ev("fotoAnalyze({})"); await a.wait(20);
  T.ok(/Estimativa da foto/.test(a.q("#sheet").textContent) && a.qa("[data-foto=nome]").length === 2, "foto do prato lista os itens estimados");
  const body = JSON.parse(calls[calls.length - 1].o.body); T.ok(body.contents[0].parts[1].inlineData.data === "BASE64" && body.generationConfig.responseMimeType === "application/json", "envia a foto inline e pede JSON");
  a.click("[data-act=foto-del][data-i='0']"); a.click("[data-act=foto-add]");
  T.ok(a.ev("D(today()).meals.some(m => m.n === 'IA: Frango' && m.p === 38)"), "adiciona os itens revisados ao dia");
  T.ok(a.q(".kb-tools [data-act=foto]") || a.ev("typeof fotoStart") === "function", "botão de foto disponível no teclado");
  a.ev("SEC.gemKey = ''; render()"); T.ok(/enviada ao Google/.test(a.q("#page").textContent), "sem chave, explica que chave e mensagens vão ao Google");
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || "")); a.close();
};
