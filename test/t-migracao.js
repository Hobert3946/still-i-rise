// Dados reais do v1 (sir_v1) viram o perfil "Hobert" do v2 sem perder nada; segredos saem do estado.
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const st = baseState();
  st.settings.gemKey = "AIza-X"; st.settings.ghToken = "ghp_Y"; st.settings.ghGistId = "gist1"; st.settings.theme = "light";
  st.days[keyOf(-1)] = { h: { acucar: true, agua: true, sono: true }, s: { creatina: true }, water: 3100, meals: [{ t: 1, n: "Ovo", g: 50, k: 70, p: 6, m: "Café da manhã" }], fiber: 10, cardios: [{ min: 20, spd: 6, inc: 5 }] };
  st.logs = { a1_halt: [{ date: keyOf(-3), day: "A", sets: [{ kg: 20, reps: 10 }] }] }; st.pain = [{ d: keyOf(-3), day: "A", v: 2 }]; st.neck = [{ d: keyOf(-5), v: 3 }];
  st.favs = { "Almoço": ["Arroz branco cozido"] }; st.chat = [{ role: "user", text: "oi" }, { role: "ai", text: "olá" }];
  const a = await boot({ v1: st });
  T.ok(a.ev("R.v") === 2 && a.ev("R.active") === "p1" && a.ev("S.profile.name") === "Hobert", "v1 vira o perfil p1 (Hobert) do v2");
  T.ok(a.ev("S.weights.length") === 2 && a.ev(`S.days["${keyOf(-1)}"].water`) === 3100 && a.ev(`S.days["${keyOf(-1)}"].fiber`) === 10, "pesos, água e fibras preservados");
  T.ok(a.ev("S.logs.a1_halt[0].sets[0].kg") === 20 && a.ev("S.pain.length") === 1 && a.ev("S.neck.length") === 1, "cargas, dor e pescoço preservados");
  T.ok(a.ev("S.favs['Almoço'][0]") === "Arroz branco cozido" && a.ev("S.chat.length") === 2, "favoritos e conversa preservados");
  T.ok(a.ev(`isActive("${keyOf(-1)}")`) === true, "dia antigo continua ativo (Regra nº 1 + 2)");
  T.ok(a.ev("S.habits.length") === 6 && a.ev("S.supps.length") === 5 && a.ev("S.meds.length") === 1 && a.ev("S.settings.rule1") === "acucar", "ganha 6 hábitos, 5 suplementos e a metformina como remédio");
  T.ok(a.ev("S.settings.deficit") === 1000 && a.ev("S.settings.activity") === 1.375 && a.ev("S.settings.floor") === 1800 && a.ev("S.settings.needOthers") === 2 && a.ev("S.settings.rotateWeeks") === 4, "parâmetros novos com os valores de antes");
  T.ok(a.ev("R.theme") === "light", "tema vai para a raiz");
  T.ok(a.ev("SEC.gemKey") === "AIza-X" && a.ev("SEC.ghToken") === "ghp_Y" && a.ev("SEC.ghGistId") === "gist1", "segredos migram para sir_secrets");
  const saved = a.w.localStorage.getItem("sir_v2");
  T.ok(saved && !/AIza-X|ghp_Y|gist1/.test(saved), "estado v2 salvo não contém segredos");
  T.ok(!!a.w.localStorage.getItem("sir_v1"), "chave sir_v1 fica intacta (rollback)");
  T.ok(a.ev("gemModel()") === "gemini-3.8-flash", "modelo antigo (2.5) troca para o Gemini 3.8 Flash");
  T.ok(!a.errors.length, "sem erros de script"); a.close();
  // reabrir: agora lê o v2, não migra de novo
  const b = await boot({ v2: JSON.parse(saved), sec: { gemKey: "k" } });
  T.ok(b.ev("S.days && Object.keys(S.days).length") === 1 && b.ev("SEC.gemKey") === "k", "reabre pelo v2");
  b.close();
};
