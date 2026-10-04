/* ============ AVISOS: confirmar no próprio app, desfazer e toast ============ */
/* ---- confirmar no próprio app (sem a janela do navegador): o botão diz o que acontece ---- */
// para o que dá para voltar atrás, prefira fazer e oferecer "Desfazer" no aviso (veja undoable)
let confirmFn = null;
function askConfirm(title, text, okLabel, fn, danger = true) {
  confirmFn = fn;
  openSheet(`<h3 class="h3" tabindex="-1">${esc(title)}</h3>${text ? `<p class="muted">${esc(text)}</p>` : ""}
    <div class="grid2"><button class="btn" data-act="confirm-no">Cancelar</button><button class="btn ${danger ? "danger fill" : "solid"}" data-act="confirm-ok">${esc(okLabel)}</button></div>`);
}
ACT["confirm-ok"] = () => {
  const fn = confirmFn;
  confirmFn = null;
  closeSheet();
  if (fn) fn();
};
ACT["confirm-no"] = () => {
  confirmFn = null;
  closeSheet();
};
// depois de mudar, oferece "Desfazer"; snapshot = cópia (clone) tirada ANTES da mudança
function undoable(msg, snapshot, restore) {
  toast(msg, () => {
    restore(snapshot);
    save();
    render();
    toast("Desfeito.");
  });
}
ACT.scrim = () => {
  const top = STACK[STACK.length - 1];
  if (top === "sheet" || top === "actions") dropLayer(top);
};

/* ---- toast (com ação opcional: desfazer, aplicar sempre...) ---- */
let toastT = null;
function toast(t, fn, label = "Desfazer") {
  const e = $("#toast");
  e.innerHTML = `<span>${esc(t)}</span>${fn ? `<b>${esc(label)}</b>` : ""}`;
  e.onclick = fn
    ? () => {
        clearTimeout(toastT);
        e.classList.remove("on", "act");
        fn();
      }
    : null;
  e.classList.toggle("act", !!fn);
  e.classList.add("on");
  clearTimeout(toastT);
  toastT = setTimeout(() => e.classList.remove("on", "act"), fn ? 5500 : 2600);
}
