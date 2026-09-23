// Lembretes: arquivo .ics para o calendário do celular.
const { boot, baseState } = require("./helpers");
module.exports = async T => {
  const a = await boot({ v1: baseState() });
  a.ev("openPage('ajustes')"); a.click("[data-act=rem-open]"); T.ok(a.qa("[data-rem]").length === 11, "folha lista 11 lembretes");
  a.q('[data-remt="treino"]').value = "05:00"; a.click("[data-act=rem-gen]"); T.ok(a.w.__dl === "still-i-rise-lembretes.ics", "baixa o .ics");
  const t = await new Promise(r => { const fr = new a.w.FileReader(); fr.onload = () => r(fr.result); fr.readAsText(a.w.__blob); });
  T.ok(t.startsWith("BEGIN:VCALENDAR\r\n") && t.trim().endsWith("END:VCALENDAR"), "estrutura VCALENDAR com CRLF");
  T.ok((t.match(/BEGIN:VEVENT/g) || []).length === 9 && (t.match(/BEGIN:VALARM/g) || []).length === 9, "9 eventos padrão, cada um com alarme");
  const tr = t.split("BEGIN:VEVENT")[1], ds = tr.match(/DTSTART:(\d{4})(\d\d)(\d\d)T(\d{4})/), dow = new Date(+ds[1], +ds[2] - 1, +ds[3]).getDay();
  T.ok(ds[4] === "0500" && /BYDAY=MO,TU,WE,TH,FR/.test(tr) && dow >= 1 && dow <= 5, "treino 05:00 seg-sex, primeira ocorrência em dia útil");
  T.ok(a.ev("S.settings.rem.treino.t") === "05:00", "horário salvo"); T.ok(!a.errors.length, "sem erros de script"); a.close();
};
