/* ============ PADRÕES DO PERFIL: hábitos, suplementos e horários no rio ============ */
// HABITS e SUPP_BASE (plan.js) são a fonte. Aqui só entram ícone, horário no rio e vínculo automático.
// link: "agua" marca sozinho ao bater a meta; "treino" marca ao finalizar o treino; "acucar" desmarca ao registrar bebida com açúcar.
const HABIT_META = {
  treino: { icon: "🏋️", at: "05:00", link: "treino" },
  acucar: { icon: "🚫", at: "", link: "acucar", desc: "Regra nº 1. Se cumprir uma só, que seja esta." },
  proteina: { icon: "🥩", at: "", link: "" },
  caminhada: { icon: "🚶", at: "18:00", link: "" },
  agua: { icon: "💧", at: "", link: "agua" },
  sono: { icon: "🌙", at: "22:00", link: "" }
};
const SUPP_META = {
  metformina: { type: "M", at: "12:00" }, creatina: { type: "S", at: "07:00" }, d3: { type: "S", at: "12:00" },
  psyllium: { type: "S", at: "11:30" }, omega3: { type: "S", at: "12:00" }, magnesio: { type: "S", at: "21:00" }
};
const defHabits = () => HABITS.map(([id, t]) => Object.assign({ id, t, icon: "✦", at: "", link: "", desc: "" }, HABIT_META[id]));
const defSupps = () => SUPP_BASE.map(([id, n, tip]) => Object.assign({ id, n, tip, type: "S", at: "" }, SUPP_META[id]));
// refeições do dia e horário padrão no rio (o horário real vem do primeiro registro)
const MEAL_AT = { "Café da manhã": "07:00", "Almoço": "12:00", "Lanche": "15:30", "Jantar": "19:00", "Ceia": "21:30" };
const MEAL_NAMES = Object.keys(MEAL_AT);
const LINKS = [["", "Nenhum"], ["agua", "Marca ao bater a meta de água"], ["treino", "Marca ao finalizar o treino"], ["acucar", "Desmarca ao registrar bebida com açúcar"]];
// cor de cada treino (A a E) na Arena
const WK_HUE = { A: "var(--c-a)", B: "var(--c-b)", C: "var(--c-c)", D: "var(--c-d)", E: "var(--c-e)" };
