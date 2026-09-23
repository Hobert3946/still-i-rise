// Junta src/ num único docs/index.html (GitHub Pages). A ordem dos arquivos importa: dados e regras antes das telas.
const fs = require("fs"), path = require("path");
const src = f => fs.readFileSync(path.join(__dirname, "src", f), "utf8");
const asset = f => path.join(__dirname, "src", "assets", f);
const out = path.join(__dirname, "docs"); fs.mkdirSync(out, { recursive: true });
const b64 = f => `data:image/${f.endsWith(".png") ? "png" : "jpeg"};base64,` + fs.readFileSync(asset(f)).toString("base64");

const CSS = ["tokens", "base", "layout", "sections", "keyboard", "arena"].map(n => `css/${n}.css`);
const JS = [
  "core/util", "data/foods", "data/plan", "data/content", "data/defaults", "data/suplementos", "data/tratamento", "core/store", "core/rules",
  "domain/progressao", "domain/treino", "domain/agua", "domain/comida", "domain/metabolico", "domain/agenda", "domain/remedios", "domain/apetite", "domain/agora",
  "svc/backup", "svc/nuvem", "svc/ia", "svc/foto", "svc/fotos", "svc/lembretes",
  "ui/shell", "ui/parts", "ui/hoje", "ui/hero", "ui/agenda-ui", "ui/agenda-add", "ui/acoes", "ui/parser", "ui/keyboard", "ui/rest", "ui/arena", "ui/arena-act",
  "ui/treino-ui", "ui/nutri-ui", "ui/agua-ui", "ui/apetite-ui", "ui/saude-ui", "ui/corpo-ui", "ui/remedios-ui", "ui/suplementos-ui", "ui/tratamento-ui",
  "ui/coach-ui", "ui/ajustes-ui", "ui/wallpaper", "ui/profiles", "ui/list-editor", "ui/events", "ui/gestures", "core/init"
].map(n => n + ".js");

let html = src("template.html")
  .replace("/*CSS*/", () => CSS.map(src).join("\n"))
  .replace("/*JS*/", () => JS.map(src).join("\n"));
html = html.split("%%AVATAR%%").join(b64("avatar.jpg")).split("%%LOGO%%").join(b64("logo-256.jpg")).split("%%MARK%%").join(b64("logo-mark.png"));
fs.writeFileSync(path.join(out, "index.html"), html, "utf8");
["sw.js", "manifest.json"].forEach(f => fs.copyFileSync(path.join(__dirname, "src", f), path.join(out, f)));
["icon-192.png", "icon-512.png", "icon-180.png"].forEach(f => fs.copyFileSync(asset(f), path.join(out, f)));
fs.rmSync(path.join(out, "icon.svg"), { force: true });
console.log("index.html:", (fs.statSync(path.join(out, "index.html")).size / 1024).toFixed(0), "KB");
