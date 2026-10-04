// Números na tela no padrão brasileiro (vírgula decimal) e sem textos de versões antigas.
const fs = require("fs"),
  path = require("path");
const { boot, baseState, keyOf } = require("./helpers");
module.exports = async T => {
  const st = baseState({
    weights: [
      { d: keyOf(-7), kg: 140, waist: 132.5 },
      { d: keyOf(0), kg: 138.5, waist: 130 }
    ]
  });
  st.logs = { a1_halt: [{ date: keyOf(-1), day: "A", sets: [{ kg: 22.5, reps: 10 }] }] };
  const a = await boot({ v1: st }),
    ev = a.ev;
  T.ok(
    ev("fmtN(138.5)") === "138,5" && ev("fmtN(1.375, 3)") === "1,375" && ev("fmtN(140)") === "140",
    "fmtN: vírgula decimal, sem zeros sobrando"
  );
  ev("go('saude', 'corpo')");
  const v = () => a.q("#view").textContent + a.q("#top").textContent;
  T.ok(
    /138,5 kg/.test(v()) && /cintura 132,5 cm/.test(v()) && !/\d\.\d+ kg|\d\.\d+ cm/.test(v()),
    "Corpo e cabeçalho: peso e cintura com vírgula"
  );
  T.ok(/IMC \d+,\d/.test(v()), "IMC com vírgula");
  ev("go('treino')");
  T.ok(
    !/\d\.\d+ kg/.test(a.q("#view").textContent) && /22,5 kg/.test(a.q("#view").textContent),
    "Treino: cargas com vírgula"
  );
  ev("UI.openFold = 'metas'; openPage('ajustes')");
  T.ok(
    /TMB × 1,375/.test(a.q("#page").textContent) && !/\d\.\d+ kg/.test(a.q("#page").textContent),
    "Ajustes: fator de atividade e pesos com vírgula"
  );
  ev("closeAll()");
  await a.wait(20);
  ev("wkStart('A'); S.cur.i = 2; arenaRender()");
  T.ok(!/\d\.\d+ kg/.test(a.q("#arena").textContent), "Arena: sem ponto decimal nas cargas");
  a.click("[data-act=wk-exit]");
  T.ok(!/rio|orbe/.test(a.q("#toast").textContent), "minimizar o treino não fala em rio ou orbe");
  const src = fs
    .readdirSync(path.join(__dirname, "..", "src", "ui"))
    .map(f => fs.readFileSync(path.join(__dirname, "..", "src", "ui", f), "utf8"))
    .join("\n");
  T.ok(!/com a Aura|pelo orbe|lente Sistema/.test(src), "telas sem nomes de versões antigas (Aura, orbe, lente)");
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || ""));
  a.close();
};
