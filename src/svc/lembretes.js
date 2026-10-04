/* ============ LEMBRETES: gera um arquivo .ics para o calendário do celular (toca com o app fechado) ============ */
// Os horários vêm da Agenda: remédios, treino, consultas, suplementos, hábitos, refeições e atividades com hora marcada.
// Itens flexíveis (sem hora) não entram. Fora da agenda: pesagem semanal e copos de água (metas sem horário).
// Configuração em S.settings.rem: { "ag:<id do item>": { on }, pesagem: { on, t }, a1: { on, t }, ... } e S.settings.remLead (min antes).
const REM_EXTRA = [
  [
    "pesagem",
    "Pesagem (segunda, ao acordar)",
    "06:30",
    "MO",
    "Dia de pesagem: depois do banheiro, antes de comer. Meça a cintura junto."
  ],
  ...["07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00"].map((t, i) => [
    `a${i + 1}`,
    `Água ${i + 1}`,
    t,
    null,
    i === 6 ? "Última água do dia. Feche a meta." : "Beba um copo de água."
  ])
];
const REM_EXTRA_ON = { pesagem: 1, a1: 1, a3: 1, a4: 1, a5: 1, a7: 1 };
const REM_TYPE_ON = { remedio: 1, treino: 1, consulta: 1 };
const REM_LEADS = [
  [0, "Na hora"],
  [10, "10 min antes"],
  [30, "30 min antes"]
];
const REM_ORDER = ["remedio", "treino", "consulta", "suplemento", "habito", "refeicao", "atividade"];
const DAYCODE = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

// itens da agenda com horário fixo que ainda vão acontecer
const remItems = () =>
  S.sched.items
    .map(x => defOn(x, today()))
    .filter(x => live(x) && x.at && (x.date ? x.date >= today() : x.days.length))
    .sort((a, b) => REM_ORDER.indexOf(a.type) - REM_ORDER.indexOf(b.type) || toMin(a.at) - toMin(b.at));
const remCfg = () => S.settings.rem || {};
const remOnAg = it => {
  const r = remCfg()["ag:" + it.id];
  return r ? !!r.on : !!REM_TYPE_ON[it.type];
};
const remExtra = (id, def) => remCfg()[id] || { on: !!REM_EXTRA_ON[id], t: def };
function remSheet() {
  const ag = remItems(),
    lead = S.settings.remLead || 0;
  const agRow = it =>
    `<div class="li"><label class="grow row"><input type="checkbox" class="cbx" data-rem="ag:${it.id}" ${remOnAg(it) ? "checked" : ""}><span class="grow"><b>${esc(TYPES[it.type][0])}: ${esc(it.title)}</b><small class="muted">${recTxt(it)} às ${it.at}</small></span></label></div>`;
  const exRow = ([id, nm, def]) => {
    const r = remExtra(id, def);
    return `<div class="li"><label class="grow row"><input type="checkbox" class="cbx" data-rem="${id}" ${r.on ? "checked" : ""}><span>${nm}</span></label><input type="time" class="field time" data-remt="${id}" value="${esc(r.t)}" aria-label="Horário: ${nm}"></div>`;
  };
  openSheet(`<h3 class="h3">Lembretes no calendário</h3>
  <p class="muted">Os horários vêm da sua Agenda. O app cria um arquivo que o calendário do celular importa e passa a tocar mesmo com o app fechado. Mudou a agenda? Gere o arquivo de novo.</p>
  <div class="lbl">Da agenda</div><div class="list">${ag.map(agRow).join("") || `<p class="muted small">Nenhum item com horário na agenda.</p>`}</div>
  <p class="muted xs">Itens sem horário fixo não entram. Para mudar um horário, edite na Agenda.</p>
  <div class="lbl">Fora da agenda</div><div class="list">${REM_EXTRA.map(exRow).join("")}</div>
  <label class="lbl" for="rem-lead">Avisar</label><select class="field" id="rem-lead">${REM_LEADS.map(([v, n]) => `<option value="${v}" ${v === lead ? "selected" : ""}>${n}</option>`).join("")}</select>
  <p class="muted" style="font-size:14px">O som e a vibração vêm das configurações do calendário. Ao importar de novo, apague os eventos antigos para não duplicar.</p>
  <button class="btn solid full" data-act="rem-gen">${ic("download")} BAIXAR E ADICIONAR AO CALENDÁRIO</button>`);
}
// primeira ocorrência a partir de agora (ou do primeiro dia da rotina), nos dias da semana pedidos
function nextStart(days, hhmm, from) {
  const [h, m] = hhmm.split(":").map(Number),
    now = new Date(),
    f = from && from > today() ? parseKey(from) : now;
  const c = new Date(f.getFullYear(), f.getMonth(), f.getDate(), h, m),
    ok = d => !days || days.split(",").includes(DAYCODE[d.getDay()]);
  if (c <= now) c.setDate(c.getDate() + 1);
  while (!ok(c)) c.setDate(c.getDate() + 1);
  return c;
}
const icsLocal = d =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const icsEsc = s => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
function icsEvent(uid, title, desc, st, dur, rrule, lead, stamp) {
  const en = new Date(st.getTime() + Math.max(5, dur || 10) * 60000);
  return [
    "BEGIN:VEVENT",
    `UID:sir-${uid}@still-i-rise`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsLocal(st)}`,
    `DTEND:${icsLocal(en)}`,
    ...(rrule ? [`RRULE:${rrule}`] : []),
    `SUMMARY:${icsEsc(title)}`,
    `DESCRIPTION:${icsEsc(desc)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEsc(title)}`,
    `TRIGGER:${lead ? `-PT${lead}M` : "PT0M"}`,
    "END:VALARM",
    "END:VEVENT"
  ].join("\r\n");
}
// título e texto do aviso de cada tipo de item da agenda
function remText(it) {
  if (it.type === "remedio") {
    const m = medById(it.ref) || {};
    return [
      `Remédio: ${it.title}`,
      [m.dose, m.withMeal ? "Tomar com a refeição." : "", "Registre a dose no app."].filter(Boolean).join(" ")
    ];
  }
  if (it.type === "suplemento") {
    const s = S.supps.find(x => x.id === it.ref) || {};
    return [`Suplemento: ${it.title}`, s.tip || "Marque no app quando tomar."];
  }
  if (it.type === "consulta") return [`Consulta: ${it.title}`, "Leve suas perguntas para o médico (Saúde › Remédios)."];
  if (it.type === "treino") return ["Treino", "Hora de se preparar para o treino. Água, tênis e vamos."];
  if (it.type === "refeicao") return [it.title, "Registre a refeição no app."];
  return [it.title, ""];
}
function buildICS(keys, lead = 0) {
  const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d+Z/, "Z"),
    ev = [];
  keys.forEach(key => {
    if (key.startsWith("ag:")) {
      const raw = S.sched.items.find(x => x.id === key.slice(3));
      if (!raw || !live(raw)) return;
      const it = defOn(raw, today()),
        [title, desc] = remText(it);
      if (it.date) {
        const st = new Date(`${it.date}T${it.at}:00`);
        if (st > new Date()) ev.push(icsEvent(it.id, title, desc, st, it.dur, "", lead, stamp));
        return;
      }
      const days = it.days.map(d => DAYCODE[d]).join(","),
        until = it.until ? `;UNTIL=${it.until.replace(/-/g, "")}T235959` : "";
      ev.push(
        icsEvent(
          it.id,
          title,
          desc,
          nextStart(days, it.at, it.from),
          it.dur,
          (it.days.length === 7 ? "FREQ=DAILY" : "FREQ=WEEKLY;BYDAY=" + days) + until,
          lead,
          stamp
        )
      );
    } else {
      const r = REM_EXTRA.find(x => x[0] === key);
      if (!r) return;
      const t = remExtra(key, r[2]).t,
        title = key === "pesagem" ? "Pesagem" : "Água";
      ev.push(
        icsEvent(
          key,
          title,
          r[4],
          nextStart(r[3], t),
          10,
          r[3] ? "FREQ=WEEKLY;BYDAY=" + r[3] : "FREQ=DAILY",
          lead,
          stamp
        )
      );
    }
  });
  return {
    n: ev.length,
    txt:
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Still I Rise//PT-BR//",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Still I Rise",
        ...ev,
        "END:VCALENDAR"
      ].join("\r\n") + "\r\n"
  };
}
ACT["rem-open"] = remSheet;
ACT["rem-gen"] = () => {
  const cfg = {},
    sel = [];
  $$("#sheet [data-rem]").forEach(c => {
    const id = c.dataset.rem,
      t = $(`#sheet [data-remt="${id}"]`);
    cfg[id] = t
      ? { on: c.checked, t: /^\d\d:\d\d$/.test(t.value) ? t.value : REM_EXTRA.find(x => x[0] === id)[2] }
      : { on: c.checked };
    if (c.checked) sel.push(id);
  });
  S.settings.rem = cfg;
  S.settings.remLead = num($("#rem-lead").value, 0);
  save();
  if (!sel.length) return toast("Marque pelo menos um lembrete.");
  const ics = buildICS(sel, S.settings.remLead);
  download(new Blob([ics.txt], { type: "text/calendar;charset=utf-8" }), "still-i-rise-lembretes.ics");
  closeSheet();
  toast(`${ics.n} lembretes gerados. Abra o arquivo para adicionar.`);
};
