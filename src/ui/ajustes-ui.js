/* ============ AJUSTES (tocar no avatar): perfis, metas, hábitos, aparência, lembretes, nuvem, backup ============ */
function goalsFold() {
  const p = S.profile, s = S.settings, tg = TG(), f = (id, l, v, mode = "decimal") => `<div><label class="lbl" for="${id}">${l}</label><input class="field" id="${id}" inputmode="${mode}" value="${esc(v)}"></div>`;
  return fold("Perfil e metas", `<div class="grid2 tiles4"><div class="tile"><div class="lbl">TMB</div><div class="h3 tabnum">${fmtInt(tg.tmb)}</div></div><div class="tile"><div class="lbl">Gasto total</div><div class="h3 tabnum">${fmtInt(tg.tdee)}</div></div><div class="tile"><div class="lbl">Meta diária</div><div class="h3 tabnum">${fmtInt(tg.kcal)} kcal</div></div><div class="tile"><div class="lbl">Proteína</div><div class="h3 tabnum">${tg.prot} g</div></div></div>
    <p class="muted small">Mifflin-St Jeor para ${r1(s.calcWeight)} kg: TMB × ${s.activity}, déficit de ${fmtInt(s.deficit)} kcal, piso de ${fmtInt(s.floor)}. Proteína 1,2 g/kg. Recalcula sozinho a cada 4 kg de variação.</p>
    ${f("pn", "Nome", p.name, "text")}<div class="grid2">${f("ps", "Peso inicial (kg)", p.startWeight)}${f("pg", "Meta (kg)", p.goal)}${f("ph", "Altura (cm)", p.height, "numeric")}${f("pa", "Idade", p.age, "numeric")}
    ${f("pdef", "Déficit (kcal)", s.deficit, "numeric")}${f("pact", "Fator de atividade", s.activity)}${f("pfloor", "Piso calórico (kcal)", s.floor, "numeric")}${f("pwater", "Meta de água (ml)", s.waterGoal, "numeric")}</div>
    <button class="btn solid full" data-act="profile-save">SALVAR PERFIL E METAS</button>`, UI.openFold === "metas", "metas");
}
function prefsFold() {
  const s = S.settings;
  return fold("Aparência, notificações e lembretes", `<div class="lbl">Tema</div><div class="seg">${[["auto", "Auto"], ["light", "Claro"], ["dark", "Escuro"]].map(([v, n]) => `<button class="${R.theme === v ? "on" : ""}" data-act="theme" data-v="${v}">${n}</button>`).join("")}</div>
    ${lookHTML()}
    ${wallHTML()}
    <div class="row between set-row"><span class="grow">Avisar fim do descanso e próximo exercício</span>${tog(s.notif, "notif", "Notificações")}</div>
    ${banner("warn", "info", "Com o app fechado", "Um app web não consegue disparar alarme sozinho (05:00, água). Por isso o app gera lembretes para o calendário do seu celular, que tocam mesmo com ele fechado. O aviso de fim de descanso só funciona com o app aberto.")}
    <button class="btn full" data-act="rem-open">${ic("download")} Criar lembretes no calendário</button>
    `, false, "prefs");
}
function cloudFold() {
  const at = S.settings.cloudAt;
  return fold("Nuvem (GitHub Gist, automático)", `<p class="muted small">Grava um gist secreto no seu GitHub a cada alteração (todos os perfis). Gist secreto não é privado: quem tiver o link consegue ler. Token e Gist ID ficam só neste aparelho.${at ? ` Última cópia: ${new Date(at).toLocaleString("pt-BR")}.` : ""}</p>
    <label class="lbl" for="ghToken">Token pessoal (GitHub PAT, escopo "gist")</label><input class="field" id="ghToken" type="password" placeholder="ghp_..." autocomplete="off" value="${SEC.ghToken ? "********" : ""}">
    <label class="lbl" for="ghGistId">Gist ID (o app cria se estiver vazio)</label><input class="field" id="ghGistId" type="text" placeholder="Ex.: 5b4e72a..." autocomplete="off" value="${esc(SEC.ghGistId || "")}">
    <div class="grid2"><button class="btn solid" data-act="gh-save">Salvar e enviar</button><button class="btn" data-act="gh-sync">${ic("download")} Baixar da nuvem</button></div>
    <p class="muted xs">Guarde o Gist ID para restaurar seus dados em outro aparelho.</p>`, false, "nuvem");
}
function backupFold() {
  const bk = S.settings.lastBackup;
  return fold("Dados e backup", `<p class="muted small">Camada 1: localStorage. Camada 2: espelho em IndexedDB. Camada 3: arquivo .json, o único que sobrevive à troca de celular. ${bk ? `Último backup: ${dispDate(bk)} (${diffDays(today(), bk)} dias).` : "Nenhum backup exportado ainda."} <span id="persist"></span></p>
    <div class="grid2"><button class="btn" data-act="export">${ic("download")} Exportar</button><button class="btn" data-act="import">${ic("upload")} Importar</button></div>
    <button class="btn danger full" data-act="reset">Apagar os dados do perfil ${esc(S.profile.name)}</button>`, UI.openFold === "backup", "backup");
}
const APP_VERSION = "3.2.0"; // suba junto com V em src/sw.js ao publicar
PAGES.ajustes = { t: "Perfil e ajustes", r: () => {
  setTimeout(() => { if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(p => { const e = $("#persist"); if (e) e.textContent = p ? "Armazenamento persistente ativo." : "Armazenamento persistente não concedido: exporte backups."; }); }, 0);
  return `${sec("", profilesListHTML())}${sec("", goalsFold() + habitsFold() + prefsFold() + cloudFold() + backupFold())}
    <section class="card logo-card"><img src="%%LOGO%%" alt="Still I Rise, por Hobert Silva Santos, Salvador BR" width="200" height="200"></section>
    <p class="powered">Powered by Hobert Silva</p><p class="powered small">Versão ${APP_VERSION}</p>`;
} };
ACT.notif = () => {
  if (S.settings.notif) { S.settings.notif = false; save(); return render(); }
  if (!("Notification" in window)) return toast("Este navegador não suporta notificações.");
  Notification.requestPermission().then(p => { S.settings.notif = p === "granted"; save(); render(); toast(p === "granted" ? "Notificações ativadas." : "Permissão negada."); });
};
ACT.export = () => exportData();
ACT.import = () => $("#file").click();
ACT.reset = () => {
  if (!confirm(`Apagar TODOS os dados do perfil ${S.profile.name} neste aparelho? Exporte um backup antes.`)) return;
  const id = S.id, p = newProfile(S.profile.name, { startWeight: S.profile.startWeight, goal: S.profile.goal, height: S.profile.height, age: S.profile.age, avatar: S.profile.avatar });
  p.id = id; R.profiles[id] = p; useProfile(id); save(); closeAll(); render(); toast("Dados do perfil apagados.");
};
