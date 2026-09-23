/* ============ SAÚDE: Corpo · Remédios · Suplementos · Tratamento ============ */
VIEWS.saude = () => {
  const s = UI.seg.saude;
  return `${segBar("saude", [["corpo", "Corpo"], ["remedios", "Remédios"], ["suplementos", "Suplementos"], ["tratamento", "Tratamento"]])}
    ${s === "remedios" ? remediosView() : s === "suplementos" ? suplementosView() : s === "tratamento" ? tratamentoView() : corpoView()}`;
};
