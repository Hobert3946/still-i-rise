// Cores e letras: contraste mínimo (WCAG AA) no claro e no escuro, em todas as paletas; brilhos seguem a cor escolhida.
const fs = require("fs"),
  path = require("path");
const css = f => fs.readFileSync(path.join(__dirname, "..", "src", "css", f), "utf8");
const lum = h => {
  const c = [1, 3, 5]
    .map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
module.exports = async T => {
  const tok = css("tokens.css"),
    dark = tok.slice(0, tok.indexOf('[data-theme="light"]')),
    light = tok.slice(tok.indexOf('[data-theme="light"]'));
  const v = (blk, n) => blk.match(new RegExp(`--${n}:(#[0-9A-Fa-f]{6})`))[1];
  const falhas = [];
  for (const [nome, blk] of [
    ["escuro", dark],
    ["claro", light]
  ]) {
    for (const bg of ["surface", "surface2"])
      for (const fg of ["text", "muted", "accent-ink", "ok", "warn", "bad", "water"])
        if (cr(v(blk, fg), v(blk, bg)) < 4.5)
          falhas.push(`${nome} ${fg}/${bg} ${cr(v(blk, fg), v(blk, bg)).toFixed(2)}`);
    for (const bg of ["surface", "surface2"])
      if (cr(v(blk, "faint"), v(blk, bg)) < 3) falhas.push(`${nome} faint/${bg}`);
  }
  T.ok(
    !falhas.length,
    "texto e ícones com contraste AA nos dois temas" + (falhas.length ? ": " + falhas.join(", ") : "")
  );
  const PALETTES = eval(
    fs
      .readFileSync(path.join(__dirname, "..", "src", "ui", "visual.js"), "utf8")
      .match(/const PALETTES = (\[[\s\S]*?\n\]);/)[1]
  );
  const pf = [];
  for (const [id, , , dk, lt] of PALETTES) {
    if (cr("#0E0B1F", dk[0]) < 4.5 || cr("#0E0B1F", dk[1]) < 4.5) pf.push(id + " escuro");
    if (cr("#FFFFFF", lt[0]) < 4.5 || cr("#FFFFFF", lt[2]) < 4.5 || cr(lt[2], "#EFEFF7") < 4.5) pf.push(id + " claro");
  }
  T.ok(
    !pf.length,
    `as ${PALETTES.length} paletas passam AA nos botões e textos` + (pf.length ? ": " + pf.join(", ") : "")
  );
  T.ok(
    /\[data-theme="light"\] \.btn\.solid\{background:linear-gradient\(135deg,var\(--accent\),var\(--accent-ink\)\)/.test(
      css("base.css")
    ),
    "botão sólido no claro usa só os tons que passam com texto branco"
  );
  const all = ["tokens", "base", "layout", "sections", "keyboard", "arena"].map(f => css(f + ".css")).join("\n");
  const fixos = all.match(/rgba\((139,124,246|91,140,255|180,168,255|169,155,224|106,85,224|47,111,224),/g) || [];
  T.ok(
    !fixos.length,
    "brilhos derivam da cor escolhida (sem roxo/azul fixo)" + (fixos.length ? ": " + fixos.length : "")
  );
  const pequenas = all.match(/font(?:-size)?:[^;}]*?(?<![\d.])([0-9]|1[01])(\.\d+)?px/g) || [];
  T.ok(!pequenas.length, "nenhuma letra menor que 12 px" + (pequenas.length ? ": " + pequenas.join(" | ") : ""));
};
