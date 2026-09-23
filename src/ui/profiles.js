/* ============ PERFIS: trocar, criar, editar e excluir (cada perfil tem dados totalmente isolados) ============ */
function profileRows() {
  return Object.values(R.profiles).map(p => `<div class="li prof ${p.id === R.active ? "on" : ""}">
    <button class="grow row" data-act="profile-use" data-id="${p.id}" aria-pressed="${p.id === R.active}">${avatarHTML(p)}<span class="grow"><b>${esc(p.profile.name)}</b><small class="muted">${r1(p.weights.length ? p.weights[p.weights.length - 1].kg : p.profile.startWeight)} kg · meta ${p.profile.goal} kg</small></span>${p.id === R.active ? `<span class="pill ok">ativo</span>` : ""}</button>
    ${Object.keys(R.profiles).length > 1 ? `<button class="icon-btn bad" data-act="profile-del" data-id="${p.id}" aria-label="Excluir perfil ${esc(p.profile.name)}">${ic("trash")}</button>` : ""}</div>`).join("");
}
const profilesListHTML = () => `<div class="lbl sec-t">Perfis</div><div class="list">${profileRows()}</div><button class="btn full" data-act="profile-new">${ic("plus")} Novo perfil</button>`;
function switchProfile(id) {
  if (!R.profiles[id] || id === R.active) return;
  if (S.cur && STACK.includes("arena")) dropLayer("arena");
  useProfile(id); UI.day = null; UI.open = null; save(); render(); toast("Perfil: " + S.profile.name + ".");
}
function profileNewSheet() {
  openSheet(`<h3 class="h3">Novo perfil</h3><p class="muted small">Cada perfil tem os próprios dias, treinos, pesos, hábitos, suplementos, favoritos e conversa com a Aura.</p>
  <label class="lbl" for="nn">Nome</label><input class="field" id="nn" placeholder="Ex.: Mãe" autocomplete="off">
  <div class="grid2"><div><label class="lbl" for="ns">Peso atual (kg)</label><input class="field" id="ns" inputmode="decimal" placeholder="90"></div><div><label class="lbl" for="ng">Meta (kg)</label><input class="field" id="ng" inputmode="decimal" placeholder="75"></div>
  <div><label class="lbl" for="nh">Altura (cm)</label><input class="field" id="nh" inputmode="numeric" placeholder="165"></div><div><label class="lbl" for="na">Idade</label><input class="field" id="na" inputmode="numeric" placeholder="50"></div></div>
  <p class="muted xs">Começa com os hábitos e suplementos padrão. Ajuste tudo na lente Sistema.</p>
  <button class="btn solid full" data-act="profile-create">CRIAR E ENTRAR</button>`);
}
ACT.profiles = () => openSheet(`<h3 class="h3">Perfis</h3><div class="list">${profileRows()}</div><div class="grid2"><button class="btn" data-act="profile-new">${ic("plus")} Novo</button><button class="btn" data-act="page" data-p="ajustes">${ic("edit")} Editar</button></div>`);
ACT["profile-use"] = b => { if (STACK.includes("sheet")) closeSheet(); switchProfile(b.dataset.id); };
ACT["profile-new"] = () => profileNewSheet();
ACT["profile-create"] = () => {
  const name = $("#nn").value.trim(); if (!name) return toast("Informe o nome.");
  const sw = num($("#ns").value, 0), g = num($("#ng").value, 0), h = num($("#nh").value, 0), a = num($("#na").value, 0);
  if (!(sw >= 30 && sw <= 300) || !(g >= 30 && g <= 300) || !(h >= 100 && h <= 250) || !(a >= 10 && a <= 110)) return toast("Confira peso, meta, altura e idade.");
  if (S.cur && STACK.includes("arena")) dropLayer("arena");
  const p = profileCreate(name, { startWeight: sw, goal: g, height: h, age: a }); p.settings.calcWeight = sw; save();
  closeAll(); UI.day = null; render(); toast(`Perfil ${name} criado.`);
};
ACT["profile-del"] = b => {
  const p = R.profiles[b.dataset.id]; if (!p) return;
  if (!confirm(`Excluir o perfil ${p.profile.name} e TODOS os dados dele? Não dá para desfazer.`)) return;
  if (profileDelete(p.id)) { closeSheet(); render(); toast("Perfil excluído."); }
};
ACT["profile-save"] = () => {
  const p = S.profile, s = S.settings, v = (id, d) => num($("#" + id).value, d);
  const vals = { sw: v("ps", p.startWeight), g: v("pg", p.goal), h: v("ph", p.height), a: v("pa", p.age), def: v("pdef", s.deficit), act: v("pact", s.activity), fl: v("pfloor", s.floor), w: v("pwater", s.waterGoal) };
  if (!(vals.sw >= 30 && vals.sw <= 300 && vals.g >= 30 && vals.g <= 300 && vals.h >= 100 && vals.h <= 250 && vals.a >= 10 && vals.a <= 110)) return toast("Confira peso, meta, altura e idade.");
  if (!(vals.def >= 0 && vals.def <= 1500 && vals.act >= 1.1 && vals.act <= 2 && vals.fl >= 1000 && vals.fl <= 4000 && vals.w >= 1000 && vals.w <= 8000)) return toast("Déficit 0–1500, fator 1,1–2, piso 1000–4000, água 1000–8000 ml.");
  p.name = $("#pn").value.trim() || p.name; p.startWeight = vals.sw; p.goal = vals.g; p.height = vals.h; p.age = vals.a;
  Object.assign(s, { deficit: vals.def, activity: vals.act, floor: vals.fl, waterGoal: Math.round(vals.w) });
  if (!S.weights.length) s.calcWeight = p.startWeight;
  setLinked(today(), "agua", (D(today()).water || 0) >= s.waterGoal);
  save(); render(); toast(`Salvo. Meta: ${fmtInt(TG().kcal)} kcal e ${TG().prot} g de proteína.`);
};
