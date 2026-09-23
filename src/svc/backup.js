/* ============ BACKUP: camada 3 (arquivo .json) e estado sem segredos ============ */
// Todo backup e toda cópia na nuvem passam por safeState(): nunca levam chave do Gemini, token nem gist id.
function safeState() {
  const c = JSON.parse(JSON.stringify(R));
  Object.values(c.profiles).forEach(p => SECRET_KEYS.forEach(k => delete p.settings[k]));
  return c;
}
function download(blob, name) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function exportData() {
  download(new Blob([JSON.stringify(safeState(), null, 1)], { type: "application/json" }), `still-i-rise-backup-${today()}.json`);
  Object.values(R.profiles).forEach(p => p.settings.lastBackup = today());
  save(); toast("Backup exportado."); render();
}
// aceita backup v2 (todos os perfis) ou v1 (um perfil: substitui o perfil ativo)
function importObject(o) {
  if (o && o.v === 2 && o.profiles) { R = mergeRoot(o); useProfile(R.active); return "todos os perfis"; }
  if (o && o.profile && o.days) { const id = R.active, p = mergeProfile(o); p.id = id; R.profiles[id] = p; useProfile(id); return "perfil " + p.profile.name; }
  throw new Error("formato desconhecido");
}
function importFile(f) {
  return f.text().then(tx => {
    const o = JSON.parse(tx);
    if (!(o && (o.profiles || (o.profile && o.days)))) throw 0;
    if (!confirm("Importar substitui os dados atuais deste aparelho. Continuar?")) return;
    const what = importObject(o); save(); applyTheme(); closeAll(); render(); toast("Backup importado: " + what + ".");
  }).catch(() => toast("Arquivo inválido."));
}
// alerta quando o último backup .json passou de 21 dias
function backupDays() {
  const bk = S.settings.lastBackup;
  return bk ? diffDays(today(), bk) : (Object.keys(S.days).length ? diffDays(today(), firstDay()) : 0);
}
