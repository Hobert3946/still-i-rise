// Saúde: remédios (dose registrada, adesão, sem sugestão de dose), suplementos com evidência, tratamento em 4 níveis, fotos.
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const st = baseState(); st.days[keyOf(-2)] = { h: {}, s: { metformina: true }, water: 0, meals: [] };
  const a = await boot({ v1: st }), ev = a.ev;
  T.ok(ev("S.meds[0].n") === "Metformina" && ev("S.meds[0].withMeal") === true, "metformina migrou para Remédios (com refeição)");
  T.ok(ev(`Object.values(D("${keyOf(-2)}").med || {}).length`) === 1, "histórico antigo de doses preservado");
  // regressão: adesão só conta dias em que o app foi usado (antes dava 3% com 1 de 30)
  const ad = ev("adherence(S.meds[0].id)"); T.ok(ad.due <= 2 && ad.ok === 1, `adesão ignora dias sem registro (${ad.ok} de ${ad.due})`);
  ev("go('saude','remedios')");
  T.ok(/não sugere, não calcula e não altera doses/.test(a.q("#view").textContent), "aviso: o app não sugere dose");
  a.click("#view [data-act=dose-log]");
  T.ok(ev("medToday(S.meds[0].id).some(x => x.taken)") && /Tomada às/.test(a.q("#view").textContent), "registrar dose guarda o horário");
  a.click("#toast"); T.ok(!ev("medToday(S.meds[0].id).some(x => x.taken)"), "desfazer dose");
  // novo remédio com dois horários (vão para a agenda)
  a.click("#view [data-act=med-edit]:not([data-id])");
  a.q("#md-n").value = "Losartana"; a.q("#md-d").value = "50 mg (receita)"; a.q("[data-mt='0']").value = "08:00";
  a.click("[data-act=md-time-add]"); a.q("[data-mt='1']").value = "20:00"; a.click("[data-act=med-save]");
  const m = ev("S.meds.find(x => x.n === 'Losartana')");
  T.ok(m && m.dose === "50 mg (receita)" && ev(`medTimes("${m.id}").join()`) === "08:00,20:00", "novo remédio com dose informada e 2 horários na agenda");
  T.ok(ev(`adherence("${m.id}").due`) >= 0, "adesão calculada");
  ev(`medRemove("${m.id}")`); T.ok(!ev("S.sched.items.some(x => x.title === 'Losartana')"), "remover o remédio tira da agenda");
  // perguntas para o médico
  a.q("#q-new").value = "Posso trocar para metformina XR?"; a.q("[data-form=q]").dispatchEvent(new a.w.Event("submit", { bubbles: true, cancelable: true }));
  T.ok(ev("questionsOpen().length") === 1 && /metformina XR/.test(a.q("#view").textContent), "perguntas para a próxima consulta");
  // suplementos: evidência
  a.click(".segbar [data-seg=suplementos]");
  T.ok(ev("SUPP_CATALOG.filter(x => x.t === 'S').every(x => SUPP_INFO[x.n] && EV_LEVELS.includes(SUPP_INFO[x.n].ev))"), "todo suplemento do catálogo tem ficha com evidência classificada");
  T.ok(ev("['obj','ben','quando','uso','efe','inter','evitar'].every(f => Object.values(SUPP_INFO).every(x => x[f]))"), "fichas com objetivo, benefícios, quando, uso, efeitos, interações e quem evita");
  T.ok(ev("SUPP_INFO['Creatina 5 g'].ev") === "Forte" && ev("SUPP_INFO['Chá verde / EGCG'].ev") === "Insuficiente", "classificação coerente (creatina forte, chá verde insuficiente)");
  T.ok(/Evidência: Forte/.test(a.q("#view").textContent) && /Custo \$/.test(a.q("#view").textContent), "cartões mostram evidência e custo/ajuda");
  // tratamento
  a.click(".segbar [data-seg=tratamento]"); const tx = a.q("#view").textContent;
  T.ok(ev("TREAT.map(l => l.lvl).join()") === "1,2,3,4" && /não<\/b> recomenda|não recomenda/.test(a.q("#view").innerHTML), "tratamento em 4 níveis, com aviso de que não recomenda");
  T.ok(/Semaglutida/.test(tx) && /Tirzepatida/.test(tx) && /Liraglutida/.test(tx), "GLP-1 incluídos como educação");
  T.ok(ev("TREAT.filter(l => l.lvl === 2)[0].items.every(x => x.mec && x.ben && x.efe && x.contra && x.inter && x.acomp && x.rx)"), "nível 2: mecanismo, evidência, efeitos, contraindicações, interações, acompanhamento e receita");
  T.ok(!/\d+\s?mg/.test(ev("JSON.stringify(TREAT)")), "nenhuma dose de remédio no conteúdo educativo");
  T.ok(ev("SUPP_CATALOG.filter(x => x.t === 'M').length") >= 5 && /Comparativo rápido/.test(tx), "catálogo antigo (custo × ajuda) continua disponível");
  a.click('#view [data-act=q-add]'); T.ok(ev("questionsOpen().length") === 2, "'Quero perguntar ao médico' guarda a pergunta");
  // corpo: IMC e fotos (fora do backup)
  a.click(".segbar [data-seg=corpo]"); T.ok(/IMC \d/.test(a.q("#view").textContent) && /Fotos de progresso/.test(a.q("#view").textContent), "Corpo mostra IMC e fotos de progresso");
  ev("S.photos.push({id:'f1', d: today()}); PHOTO_MEM.f1 = 'data:image/jpeg;base64,AAAA'; save()");
  T.ok(!/AAAA/.test(JSON.stringify(ev("safeState()"))), "a imagem da foto nunca vai para o backup");
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || "")); a.close();
};
