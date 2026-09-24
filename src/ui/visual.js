/* ============ VISUAL: paleta de cor e fonte (por aparelho, fora do perfil e do backup do perfil) ============ */
// cada paleta: id, nome, premium?, escuro [accent, accent-hi, accent-ink, blue], claro [idem]. 2º stop do gradiente = blue.
const PALETTES = [
  ["padrao", "Violeta", 0, ["#8B7CF6", "#B4A8FF", "#B4A8FF", "#5B8CFF"], ["#6A55E0", "#8B7CF6", "#5B46D6", "#2F6FE0"]],
  ["azul", "Azul", 0, ["#4F8BFF", "#8FB4FF", "#8FB4FF", "#38BDF8"], ["#2563EB", "#4F8BFF", "#1D4FC4", "#0E8FC7"]],
  ["verde", "Verde", 0, ["#34C98A", "#7FE0B5", "#7FE0B5", "#2BB3A3"], ["#15935F", "#34C98A", "#0F7A4E", "#0E8A80"]],
  ["laranja", "Laranja", 0, ["#FF8A3D", "#FFB27D", "#FFB27D", "#F2566B"], ["#D9621A", "#FF8A3D", "#B54E10", "#D63A50"]],
  ["rosa", "Rosa", 0, ["#F0609E", "#F79BC2", "#F79BC2", "#B06CF0"], ["#D23C7E", "#F0609E", "#B02A67", "#8B45D0"]],
  ["grafite", "Grafite", 0, ["#8C93A3", "#C3C8D2", "#C3C8D2", "#5E6677"], ["#4A5263", "#6B7384", "#3A4150", "#2A303C"]],
  ["ouro", "Ouro", 1, ["#D4AF6A", "#EBD3A0", "#E3C78E", "#A8793A"], ["#9C7328", "#C09A55", "#7E5C1C", "#6E4E18"]],
  ["esmeralda", "Esmeralda", 1, ["#2FAF8C", "#7DD8BC", "#7DD8BC", "#C9A45C"], ["#0D6E55", "#2FAF8C", "#0A5A45", "#9C7328"]],
  ["safira", "Safira noturna", 1, ["#5A7BD8", "#A3B6EC", "#A3B6EC", "#C9A45C"], ["#1F3A8A", "#3E5BB8", "#1A3175", "#8C6A2A"]],
  ["bordo", "Bordô", 1, ["#C2566E", "#E49AAB", "#E49AAB", "#D4AF6A"], ["#7A1F35", "#A33A52", "#6A1A2E", "#9C7328"]],
  ["rosegold", "Rose gold", 1, ["#E0A290", "#F2CBBE", "#EFC2B3", "#B77E6E"], ["#A8604E", "#C98470", "#8C4C3C", "#7E4A3E"]],
  ["titanio", "Titânio", 1, ["#A9B4C2", "#DCE2EA", "#DCE2EA", "#6F8096"], ["#3F4A5A", "#5C6878", "#2E3744", "#1E2530"]]
];
// fontes: id, nome, display, corpo, família no Google Fonts ("" = já carregada ou do sistema)
const FONTS = [
  ["padrao", "Atual", '"Sora"', '"Geist"', ""],
  ["arredondada", "Arredondada", '"Nunito"', '"Nunito"', "Nunito:wght@400..800"],
  ["elegante", "Elegante", '"Fraunces"', '"Manrope"', "Fraunces:opsz,wght@9..144,500..800&family=Manrope:wght@400..700"],
  ["moderna", "Moderna", '"Space Grotesk"', '"DM Sans"', "Space+Grotesk:wght@500..700&family=DM+Sans:wght@400..700"],
  ["sistema", "Sistema", "system-ui", "system-ui", ""]
];
const VIS_VARS = ["--accent", "--accent-hi", "--accent-ink", "--blue"];
const palOf = id => PALETTES.find(p => p[0] === id) || PALETTES[0];
const fontOf = id => FONTS.find(f => f[0] === id) || FONTS[0];

function loadFont(f) {
  if (!f[4] || document.getElementById("font-" + f[0])) return;
  const l = document.createElement("link"); l.id = "font-" + f[0]; l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${f[4]}&display=swap`; document.head.appendChild(l);
}
// chamado por applyTheme: a paleta depende de claro/escuro
function applyLook() {
  const st = document.documentElement.style, dark = document.documentElement.dataset.theme === "dark";
  const p = palOf(R.accent), c = dark ? p[3] : p[4];
  VIS_VARS.forEach((v, i) => p[0] === "padrao" ? st.removeProperty(v) : st.setProperty(v, c[i]));
  const f = fontOf(R.font); loadFont(f);
  if (f[0] === "padrao") { st.removeProperty("--f-display"); st.removeProperty("--f-body"); }
  else { st.setProperty("--f-display", `${f[2]},system-ui,sans-serif`); st.setProperty("--f-body", `${f[3]},system-ui,-apple-system,sans-serif`); }
}
function lookHTML() {
  const dark = document.documentElement.dataset.theme === "dark", cur = palOf(R.accent)[0];
  const sw = p => { const c = dark ? p[3] : p[4]; return `<button class="pal-op ${cur === p[0] ? "on" : ""}" data-act="look-pal" data-v="${p[0]}" aria-pressed="${cur === p[0]}"><span style="background:linear-gradient(135deg,${c[0]},${c[3]})"></span>${p[1]}</button>`; };
  const fc = fontOf(R.font)[0];
  return `<div class="lbl">Cor</div><div class="pal-grid">${PALETTES.filter(p => !p[2]).map(sw).join("")}</div>
    <div class="lbl">Cor · premium</div><div class="pal-grid">${PALETTES.filter(p => p[2]).map(sw).join("")}</div>
    <div class="lbl">Fonte</div><div class="font-list">${FONTS.map(f => `<button class="font-op ${fc === f[0] ? "on" : ""}" data-act="look-font" data-v="${f[0]}" aria-pressed="${fc === f[0]}" style="font-family:${f[2]},system-ui"><b>${f[1]}</b><small style="font-family:${f[3]},system-ui">Still I Rise · 118,4 kg</small></button>`).join("")}</div>`;
}
ACT["look-pal"] = b => { R.accent = palOf(b.dataset.v)[0]; save(); applyLook(); render(); };
ACT["look-font"] = b => { const f = fontOf(b.dataset.v); R.font = f[0]; save(); loadFont(f); applyLook(); render(); };
