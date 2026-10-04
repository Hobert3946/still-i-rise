/* ============ BACKUP: camada 3 (arquivo .json) e estado sem segredos ============ */
// Todo backup e toda cópia na nuvem passam por safeState(): nunca levam chave do Gemini, token nem gist id.
function safeState() {
  const c = JSON.parse(JSON.stringify(R));
  Object.values(c.profiles).forEach(p => SECRET_KEYS.forEach(k => delete p.settings[k]));
  return c;
}
function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
// no celular, compartilhar entrega o arquivo direto ao WhatsApp, Drive ou Calendário (baixar, num app
// instalado no iPhone, costuma só abrir um visualizador). Sem suporte, ou se a pessoa pedir, baixa.
// cada navegador aceita tipos diferentes (o Chrome do Android não compartilha .json nem .ics; o Safari aceita)
function shareFiles(name = "x.json", type = "application/json") {
  try {
    return !!(
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [new File(["x"], name, { type })] })
    );
  } catch (e) {
    return false;
  }
}
async function deliverFile(blob, name, mode = "share") {
  if (mode === "share" && shareFiles(name, blob.type)) {
    try {
      await navigator.share({ files: [new File([blob], name, { type: blob.type })], title: name });
      return "shared";
    } catch (e) {
      if (e && e.name === "AbortError") return null; // a pessoa fechou o menu
    }
  }
  download(blob, name);
  return "downloaded";
}
async function exportData(mode = "share") {
  const how = await deliverFile(
    new Blob([JSON.stringify(safeState(), null, 1)], { type: "application/json" }),
    `still-i-rise-backup-${today()}.json`,
    mode
  );
  if (!how) return;
  Object.values(R.profiles).forEach(p => (p.settings.lastBackup = today()));
  save();
  toast(how === "shared" ? "Backup compartilhado." : "Backup baixado.");
  render();
}
// aceita backup v2 (todos os perfis) ou v1 (um perfil: substitui o perfil ativo)
function importObject(o) {
  if (o && o.v === 2 && o.profiles) {
    R = mergeRoot(o);
    useProfile(R.active);
    return "todos os perfis";
  }
  if (o && o.profile && o.days) {
    const id = R.active,
      p = mergeProfile(o);
    p.id = id;
    R.profiles[id] = p;
    useProfile(id);
    return "perfil " + p.profile.name;
  }
  throw new Error("formato desconhecido");
}
function importFile(f) {
  return f
    .text()
    .then(tx => {
      const o = JSON.parse(tx);
      if (!(o && (o.profiles || (o.profile && o.days)))) throw 0;
      askConfirm(
        "Importar este backup?",
        "Os dados atuais deste aparelho serão substituídos pelos do arquivo.",
        "Importar",
        () => {
          const what = importObject(o);
          save();
          applyTheme();
          closeAll();
          render();
          toast("Backup importado: " + what + ".");
        }
      );
    })
    .catch(() => toast("Arquivo inválido."));
}
// alerta quando o último backup .json passou de 21 dias
function backupDays() {
  const bk = S.settings.lastBackup;
  return bk ? diffDays(today(), bk) : Object.keys(S.days).length ? diffDays(today(), firstDay()) : 0;
}
