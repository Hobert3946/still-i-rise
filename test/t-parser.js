// Paleta: texto livre vira ação.
const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() });
  const first = q => a.ev(`(parseCommand(${JSON.stringify(q)})[0] || {}).label || ""`);
  const run = q => a.ev(`parseCommand(${JSON.stringify(q)})[0].run()`);
  T.ok(first("água 500") === "Água +500 ml" && first("500") === "Água +500 ml" && first("garrafa") === "Água +500 ml", "água por número ou tamanho");
  T.ok(first("frango 150") === "Peito de frango grelhado · 150 g", "alimento + gramas, priorizando sugestões e favoritos: " + first("frango 150"));
  T.ok(/Jantar/.test(a.ev(`parseCommand("arroz 100 @jantar")[0].sub`)), "refeição explícita com @");
  T.ok(/Almoço/.test(a.ev(`parseCommand("feijao 100 almoco")[0].sub`)), "refeição no fim do texto");
  run("peso 118,4 cintura 121"); T.ok(a.ev("S.weights[S.weights.length-1].kg") === 118.4 && a.ev("S.weights[S.weights.length-1].waist") === 121, "peso com cintura");
  T.ok(a.ev("S.settings.calcWeight") === 118.4, "peso 4+ kg abaixo recalcula as metas");
  run("cardio 30 6,5 5"); T.ok(a.ev("D(today()).cardios[0].min") === 30 && a.ev("D(today()).cardios[0].inc") === 5, "cardio com velocidade e inclinação");
  run("fibra 5"); T.ok(a.ev("D(today()).fiber") === 5, "fibras");
  run("dor 3"); T.ok(a.ev("S.pain[S.pain.length-1].v") === 3, "dor no ombro");
  run("pescoço 4"); T.ok(a.ev("S.neck[S.neck.length-1].v") === 4, "termômetro do pescoço");
  T.ok(first("dor 11") !== "Dor no ombro 11/10", "dor fora da escala ignorada");
  T.ok(/Coach/.test(first("?posso comer pizza")), "? pergunta para o Coach");
  T.ok(/Corpo/.test(first("corpo")) && /Arena/.test(first("treino")) && /fome/i.test(first("fome")) && /Agenda/.test(first("agenda")) && /backup/i.test(first("backup")), "comandos e lentes");
  T.ok(/rua/i.test(first("rua")), "atalho para comer na rua");
  T.ok(!a.errors.length, "sem erros de script"); a.close();
};
