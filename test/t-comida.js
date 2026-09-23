// Teclado de alimentos: porção por toque, toques somam, gramas, favoritos, repetir, rótulo, excluir com desfazer, fibras, açúcar.
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const st = baseState(); st.days[keyOf(-1)] = { h: {}, s: {}, water: 0, meals: [{ t: 1, n: "Arroz branco cozido", g: 100, k: 128, p: 2.5, m: "Almoço" }, { t: 2, n: "Feijão carioca cozido", g: 100, k: 76, p: 4.8, m: "Almoço" }] };
  const a = await boot({ v1: st });
  a.ev("ACT['meal-open']({dataset:{m:'Almoço'}})"); await a.wait(80);
  const alm = () => a.q('[data-fold="m-almoco"]');
  T.ok(a.ev("UI.tab") === "nutri" && alm().open && alm().querySelectorAll(".fkey").length >= 10, "Registrar almoço abre Nutrição com o teclado do almoço");
  T.ok(/Repetir a última vez \(2 itens, 204 kcal\)/.test(alm().textContent), "oferece repetir o almoço anterior");
  const fr = a.ev("foodIdx('Peito de frango grelhado')");
  a.click(`.fkey[data-i="${fr}"][data-m="Almoço"]`);
  T.ok(a.ev("D(today()).meals.length") === 1 && a.ev("D(today()).meals[0].g") === a.ev(`FOODS[${fr}][4]`), "toque adiciona 1 porção");
  a.click(`.fkey[data-i="${fr}"][data-m="Almoço"]`);
  T.ok(a.ev("D(today()).meals.length") === 1 && a.ev("D(today()).meals[0].g") === 2 * a.ev(`FOODS[${fr}][4]`), "segundo toque soma no mesmo item (×2)");
  a.ev(`ACT.fhold({dataset:{i:'${fr}', m:'Almoço'}})`); T.ok(/kcal e .* g de proteína por 100 g/.test(a.q("#sheet").textContent), "segurar abre as gramas");
  a.q("#g").value = "150"; a.click("#sheet [data-act=meal-sel][data-m='Jantar']"); a.click("#sheet [data-act=fav-tog]");
  T.ok(a.ev("favsOf('Jantar').includes('Peito de frango grelhado')"), "favorita na refeição escolhida");
  a.click("#sheet [data-act=food-add]"); T.ok(a.ev("D(today()).meals.some(m => m.m === 'Jantar' && m.g === 150)"), "adiciona 150 g no jantar");
  T.ok(a.q('[data-fold="m-jantar"] .fkey.fav'), "favorito aparece com estrela no teclado do jantar");
  a.ev("ACT['meal-repeat']({dataset:{m:'Almoço'}})");
  T.ok(a.ev("D(today()).meals.filter(m => m.m === 'Almoço').length") === 3, "repetir traz os 2 itens da última vez");
  const n = a.ev("D(today()).meals.length"); a.ev("removeWithUndo(0)"); T.ok(a.ev("D(today()).meals.length") === n - 1, "excluir item da bandeja");
  a.click("#toast"); T.ok(a.ev("D(today()).meals.length") === n, "desfazer pelo toast devolve o item");
  a.ev("quickSheet('Lanche')"); a.q("#qn").value = "Barra"; a.q("#qk").value = "200"; a.q("#qp").value = "20"; a.click("[data-act=quick-add]");
  T.ok(a.ev("D(today()).meals.some(m => m.n === 'Barra' && m.k === 200 && m.m === 'Lanche')"), "adicionar por rótulo");
  a.ev("DW(today()).h.acucar = true"); a.ev("foodAdd(foodIdx(FOODS.find(f => /COM açúcar/.test(f[0]) && f[5]==='Bebidas')[0]), 200, 'Lanche')");
  T.ok(a.ev("D(today()).h.acucar") === false, "bebida com açúcar desmarca a Regra nº 1");
  a.click("#view [data-act=fiber-add][data-g='5']"); a.click("#view [data-act=fiber-add][data-g='5']"); T.ok(a.ev("D(today()).fiber") === 10, "fibras +5 g (manual, meta 30)");
  T.ok(a.ev("FOODS[foodSearch('feijao')[0]][0]").startsWith("Feijão"), "busca ignora acento");
  a.ev("go('nutri','refeicoes')"); T.ok(a.qa("#view .flip").length === 7, "Comer na rua: 7 situações (boa × armadilha)");
  T.ok(/Como bater|Meta de proteína batida|Dia finalizado|Madrugada/.test(a.q("#view").textContent), "motor metabólico em Nutrição");
  // registrar em outro dia
  a.ev("openPage('agenda')"); a.click("[data-act=day-pick][data-k='" + a.ev("addDays(today(), -1)") + "']"); a.ev("dropLayer('page')"); await a.wait(20); a.ev("go('nutri','refeicoes')");
  T.ok(a.ev("dayK()") === a.ev("addDays(today(), -1)") && /Registrando em/.test(a.q("#view").textContent), "escolher ontem na agenda deixa registrar no dia anterior");
  a.ev("waterAdd(200, dayK()); render()"); T.ok(a.ev(`D("${keyOf(-1)}").water`) === 200, "registra no dia exibido");
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || "")); a.close();
};
