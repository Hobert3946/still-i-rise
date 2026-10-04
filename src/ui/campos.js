/* ============ CAMPOS: redesenhar sem perder o que a pessoa digitou ============ */
// guarda os campos alterados (valor ≠ o de quando foram desenhados) e o foco, redesenha e devolve tudo,
// a não ser que o valor salvo por trás do campo tenha mudado (aí vale o novo)
const fieldDef = e =>
  e.tagName === "SELECT"
    ? ([...e.options].find(o => o.defaultSelected) || e.options[0] || {}).value
    : /^(checkbox|radio)$/.test(e.type)
      ? e.defaultChecked
      : e.defaultValue;
const fieldVal = e => (/^(checkbox|radio)$/.test(e.type) ? e.checked : e.value);
function keepFields(root, draw) {
  if (!root) return draw();
  const a = document.activeElement,
    kept = $$("input[id],textarea[id],select[id]", root)
      .filter(e => e.type !== "file" && fieldVal(e) !== fieldDef(e))
      .map(e => ({ id: e.id, def: fieldDef(e), val: fieldVal(e) }));
  const focus = a && a.id && root.contains(a) ? { id: a.id, s: a.selectionStart, e: a.selectionEnd } : null;
  draw();
  kept.forEach(k => {
    const e = document.getElementById(k.id);
    if (!e || !root.contains(e) || fieldDef(e) !== k.def) return;
    if (/^(checkbox|radio)$/.test(e.type)) e.checked = k.val;
    else e.value = k.val;
  });
  const f = focus && document.getElementById(focus.id);
  if (f && root.contains(f) && document.activeElement !== f) {
    f.focus({ preventScroll: true });
    try {
      f.setSelectionRange(focus.s, focus.e);
    } catch (x) {}
  }
}
// alguém digitando num campo da tela ou de uma página: o redesenho automático (relógio, voltar ao app) espera
const typing = () => {
  const a = document.activeElement;
  return !!a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !!a.closest("#view,#page");
};
