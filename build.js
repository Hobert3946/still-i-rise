// Junta src/ num único docs/index.html (GitHub Pages). A ordem dos arquivos importa: dados e regras antes das telas.
const fs = require("fs"), path = require("path");
const src = f => fs.readFileSync(path.join(__dirname, "src", f), "utf8");
const asset = f => path.join(__dirname, "src", "assets", f);
const out = path.join(__dirname, "docs"); fs.mkdirSync(out, { recursive: true });
const b64 = f => "data:image/jpeg;base64," + fs.readFileSync(asset(f)).toString("base64");

const CSS = ["tokens", "base", "river", "orb", "keyboard", "arena", "lenses"].map(n => `css/${n}.css`);
const JS = [
  "core/util", "data/foods", "data/plan", "data/content", "data/defaults", "core/store", "core/rules",
  "domain/progressao", "domain/treino", "domain/agua", "domain/comida", "domain/metabolico",
  "svc/backup", "svc/nuvem", "svc/ia", "svc/foto", "svc/lembretes",
  "ui/shell", "ui/river", "ui/nodes", "ui/keyboard", "ui/parser", "ui/orb", "ui/rest", "ui/arena", "ui/arena-act",
  "ui/lens", "ui/lens-corpo", "ui/lens-treino", "ui/lens-nutri", "ui/lens-agua", "ui/lens-aura", "ui/lens-sistema",
  "ui/profiles", "ui/list-editor", "ui/events", "ui/gestures", "core/init"
].map(n => n + ".js");

let html = src("template.html")
  .replace("/*CSS*/", () => CSS.map(src).join("\n"))
  .replace("/*JS*/", () => JS.map(src).join("\n"));
html = html.split("%%AVATAR%%").join(b64("avatar.jpg")).split("%%LOGO%%").join(b64("logo-256.jpg"));
fs.writeFileSync(path.join(out, "index.html"), html, "utf8");
["sw.js", "manifest.json"].forEach(f => fs.copyFileSync(path.join(__dirname, "src", f), path.join(out, f)));
["icon-192.png", "icon-512.png", "icon-180.png"].forEach(f => fs.copyFileSync(asset(f), path.join(out, f)));
fs.rmSync(path.join(out, "icon.svg"), { force: true });
console.log("index.html:", (fs.statSync(path.join(out, "index.html")).size / 1024).toFixed(0), "KB");
