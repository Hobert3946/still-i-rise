/* ============ PAPEL DE PAREDE: presets ou foto sua (só no aparelho, fora do backup) ============ */
const WALLS = [["none", "Nenhum", ""],
  ["aurora", "Aurora", "radial-gradient(90% 60% at 10% 0%,rgba(139,124,246,.35),transparent 70%),radial-gradient(80% 60% at 100% 100%,rgba(91,140,255,.3),transparent 70%)"],
  ["noite", "Noite", "linear-gradient(160deg,rgba(60,40,140,.45),rgba(20,30,90,.35) 60%,transparent)"],
  ["mar", "Mar", "radial-gradient(120% 70% at 50% 110%,rgba(47,111,224,.45),transparent 70%),linear-gradient(180deg,rgba(91,140,255,.12),transparent)"],
  ["violeta", "Violeta", "conic-gradient(from 200deg at 70% 20%,rgba(139,124,246,.35),rgba(91,140,255,.2),rgba(139,124,246,.35))"]];
async function applyWall() {
  const w = R.wall || "none", b = document.body; let bg = (WALLS.find(x => x[0] === w) || WALLS[0])[2];
  if (w === "foto") { const u = await photoGet("wall"); bg = u ? `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url("${u}") center/cover` : ""; }
  b.style.backgroundImage = ""; b.style.background = bg ? `${bg} fixed, var(--bg)` : "";
  b.classList.toggle("has-wall", !!bg);
}
function wallHTML() {
  const cur = R.wall || "none", op = (id, n, bg) => `<button class="wall-op ${cur === id ? "on" : ""}" data-act="wall" data-v="${id}" aria-pressed="${cur === id}"><span style="background:${bg || "var(--bg)"},var(--bg)"></span>${n}</button>`;
  return `<div class="lbl">Papel de parede</div><div class="wall-grid">${WALLS.map(w => op(...w)).join("")}${op("foto", "Sua foto", "var(--surface3)")}</div>`;
}
ACT.wall = b => { if (b.dataset.v === "foto") return $("#wallfile").click(); R.wall = b.dataset.v; save(); applyWall(); render(); };
async function wallSet(file) {
  const b64 = await fotoDownscale(file, 1600); await photoPut("wall", "data:image/jpeg;base64," + b64);
  R.wall = "foto"; save(); await applyWall(); render(); toast("Papel de parede trocado.");
}
