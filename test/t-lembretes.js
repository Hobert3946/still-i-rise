// Lembretes: arquivo .ics gerado a partir da Agenda (remédios, treino, consultas...) + pesagem e água.
const { boot, baseState, keyOf } = require("./helpers");
const ler = a =>
  new Promise(r => {
    const fr = new a.w.FileReader();
    fr.onload = () => r(fr.result);
    fr.readAsText(a.w.__blob);
  });
module.exports = async T => {
  const a = await boot({ v1: baseState() }),
    ev = a.ev;
  ev(
    `const m = S.meds[0]; m.dose = "1 comprimido de 850 mg"; schedAdd({ type: "consulta", title: "Endocrinologista", date: "${keyOf(5)}", at: "14:30", days: [] })`
  );
  ev("openPage('ajustes')");
  a.click("[data-act=rem-open]");
  const rows = a.qa("#sheet [data-rem^='ag:']");
  T.ok(
    rows.length >= 8 &&
      /Remédio: Metformina/.test(a.q("#sheet").textContent) &&
      /Consulta: Endocrinologista/.test(a.q("#sheet").textContent),
    "folha lista os itens com horário da agenda"
  );
  T.ok(!/Caminhada/.test(a.q("#sheet").textContent), "itens flexíveis (sem hora) não entram");
  const on = rows.filter(r => r.checked).map(r => r.closest(".li").textContent);
  T.ok(
    on.length === 3 &&
      on.some(t => /Metformina/.test(t)) &&
      on.some(t => /Treino/.test(t)) &&
      on.some(t => /Endocrinologista/.test(t)),
    "remédio, treino e consulta vêm marcados"
  );
  T.ok(a.qa("#sheet [data-remt]").length === 8, "pesagem e 7 copos de água fora da agenda");
  a.q("#rem-lead").value = "10";
  a.click("[data-act=rem-gen]");
  T.ok(a.w.__dl === "still-i-rise-lembretes.ics", "baixa o .ics");
  const t = await ler(a),
    evs = t.split("BEGIN:VEVENT").slice(1);
  T.ok(t.startsWith("BEGIN:VCALENDAR\r\n") && t.trim().endsWith("END:VCALENDAR"), "estrutura VCALENDAR com CRLF");
  T.ok(
    evs.length === 9 && (t.match(/BEGIN:VALARM/g) || []).length === 9,
    "9 eventos (3 da agenda + pesagem + 5 águas), cada um com alarme"
  );
  T.ok((t.match(/TRIGGER:-PT10M/g) || []).length === 9, "aviso 10 min antes");
  const med = evs.find(e => /Metformina/.test(e));
  T.ok(
    med && /RRULE:FREQ=DAILY/.test(med) && /DTSTART:\d{8}T1200/.test(med) && /850 mg/.test(med),
    "remédio: todo dia às 12:00, com a dose da receita"
  );
  const tr = evs.find(e => /SUMMARY:Treino/.test(e)),
    ds = tr.match(/DTSTART:(\d{4})(\d\d)(\d\d)T(\d{4})/),
    dow = new Date(+ds[1], +ds[2] - 1, +ds[3]).getDay();
  T.ok(
    ds[4] === "0500" && /BYDAY=MO,TU,WE,TH,FR/.test(tr) && dow >= 1 && dow <= 5,
    "treino da agenda: 05:00 seg-sex, primeira ocorrência em dia útil"
  );
  const co = evs.find(e => /Endocrinologista/.test(e));
  T.ok(
    co && !/RRULE/.test(co) && new RegExp("DTSTART:" + keyOf(5).replace(/-/g, "") + "T1430").test(co),
    "consulta: evento único no dia e hora marcados"
  );
  T.ok(ev("S.settings.remLead") === 10 && ev("S.settings.rem.pesagem.on") === true, "escolhas salvas");
  // mudar o horário na agenda muda o lembrete; item que saiu da rotina some
  const tid = ev("S.sched.items.find(x => x.type === 'treino').id");
  ev(
    `schedEdit(today(), "${tid}", { at: "06:15" }, true); schedRemove(today(), S.sched.items.find(x => x.type === 'remedio').id, true)`
  );
  const t2 = ev(`buildICS(["ag:${tid}", "ag:" + S.sched.items.find(x => x.type === 'remedio').id]).txt`);
  T.ok(/DTSTART:\d{8}T0615/.test(t2) && !/Metformina/.test(t2), "segue a agenda: horário novo e sem o item que saiu");
  T.ok(!a.errors.length, "sem erros de script " + (a.errors[0] || ""));
  a.close();
};
