/* ============ LENTE AURA: chat com o Gemini (chave local, fotos não guardadas, 40 mensagens) ============ */
const gemSelect = () => `<select class="field" id="gemModel" aria-label="Modelo do Gemini">${GEM_MODELS.map(([v, t]) => `<option value="${v}" ${v === gemModel() ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
const KEY_NOTE = `<p class="muted small">A chave fica só neste aparelho e não entra no backup nem na nuvem. Ela é enviada ao Google quando você faz uma pergunta, junto com o texto e as fotos que você mandar. Crie uma no Google AI Studio.</p>`;
function auraSetup() {
  return sec("Chave API do Gemini", `<input class="field" id="gemKey" type="password" autocomplete="off" placeholder="Cole a chave aqui" aria-label="Chave API do Gemini">
    <label class="lbl" for="gemModel">Modelo</label>${gemSelect()}<button class="btn solid full" data-act="gem-save">Conectar IA</button>${KEY_NOTE}`);
}
const md = t => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
LENS_R.aura = () => {
  if (!SEC.gemKey) return `<div class="aura-hero"><div class="aura-core"></div><h3 class="h3">Sou a Aura, assistente de IA do app</h3><p class="muted">Conecte o Gemini para analisar seus treinos, sua dieta e fotos de comida.</p></div>${auraSetup()}`;
  const chat = S.chat || [];
  const msgs = chat.length ? chat.map(m => `<div class="msg ${m.role} ${m.err ? "err" : ""}">${md(m.text || "")}${m.img ? `<img alt="Foto enviada" src="data:image/jpeg;base64,${m.img}">` : ""}</div>`).join("")
    : `<div class="aura-hero"><div class="aura-core"></div><h3 class="h3">Sou a Aura, assistente de IA do app</h3><p class="muted">Conheço suas metas e o que você registrou hoje e nos últimos 7 dias. Pergunte sobre comida, treino ou mande a foto de um prato ou rótulo. Não substituo médico nem nutricionista.</p></div>`;
  return `${fold("Modelo e chave", `${gemSelect()}<div class="grid2"><button class="btn sm solid" data-act="gem-save">Salvar modelo</button><button class="btn sm" data-act="gem-check">Verificar modelos</button></div><button class="btn sm danger full" data-act="gem-clear">Remover chave deste aparelho</button>${KEY_NOTE}`, false, "gem")}
    <div class="chat" id="chat" aria-live="polite">${msgs}${IA_STATE.busy ? `<div class="msg ai typing"><i></i><i></i><i></i></div>` : ""}</div>
    <form class="chat-bar" data-form="chat"><button type="button" class="icon-btn bad" data-act="ia-clear" aria-label="Limpar conversa">${ic("trash")}</button><button type="button" class="icon-btn" data-act="ia-cam" aria-label="Enviar foto">${ic("camera")}</button>
      <textarea class="field" id="ia-input" rows="1" placeholder="Pergunte algo…" enterkeyhint="send" aria-label="Mensagem para a Aura"></textarea><button type="submit" class="icon-btn send" aria-label="Enviar">${ic("up")}</button></form>`;
};
function auraScroll() { requestAnimationFrame(() => { const b = $("#lens-body"); if (b) b.scrollTop = b.scrollHeight; }); }
function auraSend() { const i = $("#ia-input"); if (!i) return; const t = i.value.trim(); if (!t) return; i.value = ""; askAura(t); auraScroll(); }
ACT["gem-save"] = () => { const k = $("#gemKey"), m = $("#gemModel"), kv = k ? k.value.trim() : ""; if (kv) { SEC.gemKey = kv; saveSec(); } if (m) S.settings.gemModel = m.value; save(); render(); toast(kv ? "Chave configurada." : "Modelo atualizado."); };
ACT["gem-check"] = () => gemCheck();
ACT["gem-clear"] = () => { SEC.gemKey = ""; saveSec(); S.settings.gemAck = false; save(); render(); toast("Chave removida."); };
ACT["ia-cam"] = () => $("#ia-foto").click();
ACT["ia-send"] = () => auraSend();
ACT["ia-clear"] = () => openSheet(`<h3 class="h3">Limpar a conversa?</h3><p class="muted">Todo o histórico com a Aura deste perfil será apagado.</p><div class="grid2"><button class="btn" data-act="close">Cancelar</button><button class="btn danger" data-act="ia-clear-ok">Sim, apagar</button></div>`);
ACT["ia-clear-ok"] = () => { S.chat = []; save(); closeSheet(); render(); toast("Conversa apagada."); };
function iaFoto(f) { const i = $("#ia-input"), t = i ? i.value.trim() : ""; if (i) i.value = ""; askAura(t, f); auraScroll(); }
