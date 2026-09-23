// Checklist de completude: nenhum dado, regra ou conteúdo do app original pode faltar.
const fs = require("fs"), path = require("path");
const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() }), ev = a.ev;
  T.ok(ev("FOODS.length") === 189 && ev("new Set(FOODS.map(f => f[5])).size") === 14, "tabela com 189 alimentos em 14 categorias");
  const orig = fs.readFileSync(path.join(__dirname, "..", "src", "data", "foods.js"), "utf8");
  T.ok(ev("FOODS.every(f => f.length === 7 && (f[6] === 'T' || f[6] === 'R'))") && orig.includes('["Arroz branco cozido",128,2.5,"1 escumadeira",100,"Cereais","T"]'), "formato [nome, kcal, prot, medida, g, categoria, fonte]");
  T.ok(ev("DAY_ORDER.join('')") === "ABCDE", "plano A a E");
  const slots = { A: 5, B: 6, C: 6, D: 5, E: 6 };
  T.ok(Object.entries(slots).every(([L, n]) => ev(`PLAN.${L}.ex.length`) === n), "exercícios por treino: A5 B6 C6 D5 E6");
  T.ok(ev("['A','D','E'].every(L => PLAN[L].cuff) && !PLAN.B.cuff && !PLAN.C.cuff") && ev("CUFF.length") === 2, "aquecimento de manguito em A, D e E (2 exercícios)");
  T.ok(ev("DAY_ORDER.every(L => PLAN[L].ex.every(e => e.v.every(v => v[2] && v[2].length > 10)))"), "toda variação tem 'como fazer'");
  T.ok(ev("PLAN.A.ex[0].rest") === 120 && ev("PLAN.C.ex[0].inc") === 10 && ev("PLAN.D.ex[0].inc") === 1, "descanso e incrementos preservados");
  T.ok(ev("S.habits.map(h => h.id).join()") === "treino,acucar,proteina,caminhada,agua,sono", "6 hábitos padrão do Hobert");
  T.ok(ev("S.supps.map(s => s.id).join()") === "metformina,creatina,d3,psyllium,omega3,magnesio" && ev("S.supps[0].type") === "M", "6 suplementos padrão (metformina como remédio)");
  T.ok(ev("SUPP_CATALOG.length") >= 17 && ev("SUPP_CATALOG.every(x => x.price && x.help && x.risk)"), "catálogo com custo, ajuda e risco");
  T.ok(ev("FRASES.length") === 14 && ev("TIPS.length") === 12, "14 frases e 12 dicas");
  T.ok(ev("STREET.length") === 7 && ev("MILESTONES.length") === 6 && ev("ABSENCE.map(x => x.min).join()") === "8,4,2", "comer na rua (7), marcos (6), ausência (2, 4, 8+)");
  T.ok(ev("WSIZES.map(x => x[1]).join()") === "100,200,300,500,750,1000", "tamanhos de água");
  T.ok(ev("MEALS.map(m => m[0]).join()") === "Café da manhã,Almoço,Lanche,Jantar,Ceia", "5 refeições com sugestões");
  const fns = ["nextLoad", "stagnant", "deloadSignal", "painAvg", "weekVolume", "maxLoads", "waterPace", "waterStreak", "getMetabolicAdvice", "protExamples", "weekStreak", "dayStreak", "daysAbsent", "chartSVG", "milestone", "weekReview", "safeState", "exportData", "importFile", "syncToCloud", "syncFromCloud", "askAura", "fotoAnalyze", "buildICS", "beep", "notify", "lockScreen", "startRest", "mealRepeat", "favToggle", "labelAdd", "removeWithUndo", "fiberAdd", "cardioAdd", "neckSave", "weighSave", "profileCreate", "profileDelete"];
  const miss = fns.filter(f => ev(`typeof ${f}`) !== "function");
  T.ok(!miss.length, "todas as funções de domínio existem" + (miss.length ? ": faltam " + miss.join(", ") : ""));
  ev("S.days = {}; S.weights = [{d: addDays(today(), -9), kg: 130}]; S.logs = {}; render()");
  T.ok(/9 dias sem registro/.test(a.q("#river").textContent) && /menor degrau/.test(a.q("#river").textContent), "alerta de ausência de 8+ dias");
  T.ok(!a.errors.length, "sem erros de script"); a.close();
};
