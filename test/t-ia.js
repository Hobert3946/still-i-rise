const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const st = baseState(); st.settings.gemKey = "chave"; st.settings.gemModel = "gemini-2.5-flash";
  const calls = [];
  const a = await boot({ state: st, fetch: async (url, o) => { calls.push({ url, o }); return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: "Resposta de teste" }] } }] }) }; } });
  a.ev('go("ia")');
  const opt = a.q("#gemModel option[selected]"); T.ok(opt && opt.value === "gemini-2.5-flash", "seletor marca o modelo salvo");
  a.ev('S.settings.gemModel = "modelo-estranho"; render()'); T.ok(a.q("#gemModel").value === "modelo-estranho", "modelo fora da lista continua selecionado");
  a.ev('S.settings.gemModel = "gemini-2.5-flash-lite"; render()');
  a.q("#ia-input").value = "posso comer pizza?"; a.q("[data-act=ia-send]").click(); await a.wait(60);
  T.ok(calls.length === 1 && /gemini-2.5-flash-lite:generateContent/.test(calls[0].url), "chama o modelo escolhido");
  const sys = JSON.parse(calls[0].o.body).systemInstruction.parts[0].text;
  T.ok(/você é a aura, uma assistente de ia/i.test(sys) && !/NUNCA diga que é uma IA/i.test(sys) && /profissional de saúde/.test(sys), "a Aura se apresenta como IA e recomenda profissional de saúde");
  T.ok(a.ev("S.chat.length") === 2 && a.ev("S.chat[1].text") === "Resposta de teste", "guarda pergunta e resposta");
  // memória: a 2ª pergunta leva a 1ª pergunta e a resposta junto
  a.q("#ia-input").value = "e se for sem queijo?"; a.q("[data-act=ia-send]").click(); await a.wait(60);
  const c2 = JSON.parse(calls[1].o.body).contents;
  T.ok(c2.length === 3 && c2.map(x => x.role).join() === "user,model,user", "2ª pergunta envia o histórico (user, model, user)");
  T.ok(c2[0].parts[0].text === "posso comer pizza?" && c2[1].parts[0].text === "Resposta de teste" && c2[2].parts[0].text === "e se for sem queijo?", "histórico na ordem certa");
  T.ok(/Últimos 7 dias/.test(JSON.parse(calls[1].o.body).systemInstruction.parts[0].text), "contexto inclui o resumo dos últimos 7 dias");
  // erro não entra no histórico e não gera turnos consecutivos do mesmo papel
  a.ev("S.chat.push({role:'user',text:'q',img:null},{role:'ai',err:true,text:'falhou'},{role:'user',text:'de novo'}); save()");
  const cc = a.ev("chatContents()"); T.ok(!JSON.stringify(cc).includes("falhou") && cc.every((x, i) => i === 0 || x.role !== cc[i - 1].role), "erro fica fora do histórico e papéis alternam");
  a.ev("S.chat = S.chat.slice(0, 4)"); 
  a.ev("S.chat.push({role:'user',text:'x',img:'AAAA'}); save(); render()");
  a.q("#ia-input").value = "oi"; a.q("[data-act=ia-send]").click(); await a.wait(60);
  T.ok(a.ev("S.chat.every(m => !m.img)"), "fotos não ficam guardadas no histórico");
  a.ev('S.settings.gemKey = ""; render()');
  T.ok(/enviada ao Google/.test(a.q("#v-ia").textContent) && !/nunca vai para a internet/.test(a.q("#v-ia").textContent), "sem chave, o texto explica que chave e mensagens vão ao Google");
  T.ok(!a.errors.length, "sem erros de script"); a.close();
};
