/* ============ LEMBRETES: gera um arquivo .ics para o calendário do celular ============ */
// id, texto, horário padrão, dias (ICS BYDAY) ou null = todo dia, mensagem
const REMS = [
  ["treino", "Treino (segunda a sexta)", "04:50", "MO,TU,WE,TH,FR", "Hora de se preparar para o treino. Água, tênis e vamos."],
  ["pesagem", "Pesagem (segunda, ao acordar)", "05:15", "MO", "Dia de pesagem: depois do banheiro, antes de comer. Meça a cintura junto."],
  ["supl", "Suplementos", "08:00", null, "Suplementos do dia: creatina, vitamina D e os demais."],
  ["a1", "Água 1", "07:00", null, "Beba um copo de água."],
  ["a2", "Água 2", "09:00", null, "Beba um copo de água."],
  ["a3", "Água 3", "11:00", null, "Beba um copo de água."],
  ["a4", "Água 4", "13:00", null, "Beba um copo de água."],
  ["a5", "Água 5", "15:00", null, "Beba um copo de água."],
  ["a6", "Água 6", "17:00", null, "Beba um copo de água."],
  ["a7", "Água 7", "19:00", null, "Última água do dia. Feche a meta."],
  ["dormir", "Preparar para dormir", "21:00", null, "Telas fora. Deitar às 21:30 para acordar inteiro às 04:50."]
];
const REM_DEF_ON = { treino: 1, pesagem: 1, supl: 1, a1: 1, a3: 1, a4: 1, a5: 1, a7: 1, dormir: 1 };
const REM_TITLE = { treino: "Still I Rise: treino", pesagem: "Still I Rise: pesagem", supl: "Still I Rise: suplementos", dormir: "Still I Rise: hora de dormir" };
const DAYCODE = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function remSaved(id, def) { const r = (S.settings.rem || {})[id]; return r || { on: !!REM_DEF_ON[id], t: def }; }
function remSheet() {
  openSheet(`<h3 class="h3">Lembretes no calendário</h3>
  <p class="muted">Marque o que quer e ajuste o horário. O app cria um arquivo que o calendário do celular importa e passa a tocar todo dia, mesmo com o app fechado.</p>
  <div class="list">${REMS.map(([id, nm, def, days]) => { const r = remSaved(id, def); return `<div class="li"><label class="grow row"><input type="checkbox" data-rem="${id}" ${r.on ? "checked" : ""} class="cbx"><span>${nm}</span></label><input type="time" class="field time" data-remt="${id}" value="${r.t}" aria-label="Horário: ${nm}"></div>`; }).join("")}</div>
  <p class="muted" style="font-size:14px">O som e a vibração vêm das configurações do calendário. Se quiser tocar como despertador, deixe o volume de notificações do calendário alto.</p>
  <button class="btn solid full" data-act="rem-gen">${ic("download")} BAIXAR E ADICIONAR AO CALENDÁRIO</button>`);
}
function nextStart(days, hhmm) {
  const [h, m] = hhmm.split(":").map(Number), now = new Date(), c = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const ok = d => !days || days.split(",").includes(DAYCODE[d.getDay()]);
  if (c <= now) c.setDate(c.getDate() + 1);
  while (!ok(c)) c.setDate(c.getDate() + 1);
  return c;
}
const icsLocal = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
const icsEsc = s => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
function buildICS(sel) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z/, "Z");
  const ev = sel.map(({ id, t }) => {
    const r = REMS.find(x => x[0] === id), days = r[3], st = nextStart(days, t), en = new Date(st.getTime() + 10 * 60000);
    const title = REM_TITLE[id] || "Still I Rise: água";
    return ["BEGIN:VEVENT", `UID:sir-${id}@still-i-rise`, `DTSTAMP:${stamp}`, `DTSTART:${icsLocal(st)}`, `DTEND:${icsLocal(en)}`,
      `RRULE:FREQ=${days ? "WEEKLY;BYDAY=" + days : "DAILY"}`, `SUMMARY:${icsEsc(title)}`, `DESCRIPTION:${icsEsc(r[4])}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(title)}`, "TRIGGER:PT0M", "END:VALARM", "END:VEVENT"].join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Still I Rise//PT-BR//", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Still I Rise", ...ev, "END:VCALENDAR"].join("\r\n") + "\r\n";
}
ACT["rem-open"] = remSheet;
ACT["rem-gen"] = () => {
  const cfg = {}, sel = [];
  REMS.forEach(([id, , def]) => {
    const on = $(`[data-rem="${id}"]`).checked, t = $(`[data-remt="${id}"]`).value || def;
    cfg[id] = { on, t }; if (on) sel.push({ id, t });
  });
  S.settings.rem = cfg; save();
  if (!sel.length) return toast("Marque pelo menos um lembrete.");
  download(new Blob([buildICS(sel)], { type: "text/calendar;charset=utf-8" }), "still-i-rise-lembretes.ics");
  closeSheet(); toast(`${sel.length} lembretes gerados. Abra o arquivo para adicionar.`);
};
