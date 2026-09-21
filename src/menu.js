/* ============ MENU RECOLHÍVEL (aba A.I.): puxe a alça para cima para mostrar o menu, arraste o menu para baixo para esconder ============ */
const setDock = open => document.body.classList.toggle("dock-open", open);
ACT["dock-toggle"] = () => { if (UI.dockSwipe && Date.now() - UI.dockSwipe < 350) return; setDock(!document.body.classList.contains("dock-open")); }; // ignora o clique que vem logo após um arrasto
(function () {
  let g = null;
  document.addEventListener("pointerdown", e => { const h = e.target.closest(".dock-handle, nav.dock"); if (h && document.body.classList.contains("chat-mode")) g = { y: e.clientY, id: e.pointerId, moved: false }; });
  document.addEventListener("pointermove", e => { if (g && e.pointerId === g.id && Math.abs(e.clientY - g.y) > 12) g.moved = true; });
  document.addEventListener("pointerup", e => {
    if (!g || e.pointerId !== g.id) return;
    const dy = e.clientY - g.y, moved = g.moved; g = null;
    if (!moved) return;
    setDock(dy < 0);          // arrastou para cima: mostra; para baixo: esconde
    UI.dockSwipe = Date.now();
  });
})();
