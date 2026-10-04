// Junta src/ num único docs/index.html (GitHub Pages). A ordem dos arquivos importa: dados e regras antes das telas.
const fs = require("fs"),
  path = require("path"),
  crypto = require("crypto");
const src = f => fs.readFileSync(path.join(__dirname, "src", f), "utf8");
const asset = f => path.join(__dirname, "src", "assets", f);
const out = path.join(__dirname, "docs");
fs.mkdirSync(out, { recursive: true });
const b64 = f =>
  `data:image/${f.endsWith(".png") ? "png" : "jpeg"};base64,` + fs.readFileSync(asset(f)).toString("base64");

const CSS = ["tokens", "base", "layout", "sections", "keyboard", "arena"].map(n => `css/${n}.css`);
const JS = [
  "core/util",
  "data/foods",
  "data/plan",
  "data/content",
  "data/defaults",
  "data/suplementos",
  "data/tratamento",
  "core/store",
  "core/rules",
  "domain/progressao",
  "domain/treino",
  "domain/agua",
  "domain/comida",
  "domain/metabolico",
  "domain/agenda",
  "domain/remedios",
  "domain/apetite",
  "domain/agora",
  "domain/sinais",
  "domain/alinhamento",
  "svc/backup",
  "svc/nuvem",
  "svc/ia",
  "svc/foto",
  "svc/fotos",
  "svc/lembretes",
  "ui/shell",
  "ui/parts",
  "ui/hoje",
  "ui/hero",
  "ui/agenda-ui",
  "ui/agenda-add",
  "ui/acoes",
  "ui/parser",
  "ui/keyboard",
  "ui/rest",
  "ui/arena",
  "ui/arena-act",
  "ui/treino-ui",
  "ui/nutri-ui",
  "ui/agua-ui",
  "ui/apetite-ui",
  "ui/saude-ui",
  "ui/corpo-ui",
  "ui/remedios-ui",
  "ui/suplementos-ui",
  "ui/tratamento-ui",
  "ui/coach-ui",
  "ui/ajustes-ui",
  "ui/wallpaper",
  "ui/visual",
  "ui/profiles",
  "ui/list-editor",
  "ui/events",
  "ui/gestures",
  "core/init"
].map(n => n + ".js");

let html = src("template.html")
  .replace("/*CSS*/", () => CSS.map(src).join("\n"))
  .replace("/*JS*/", () => JS.map(src).join("\n"));
html = html
  .split("%%AVATAR%%")
  .join(b64("avatar.jpg"))
  .split("%%LOGO%%")
  .join(b64("logo-256.jpg"))
  .split("%%MARK%%")
  .join(b64("logo-mark.png"));
// CSP: só rodam os scripts deste arquivo (hash de cada um, sem 'unsafe-inline') e a rede só fala com o Gemini,
// o GitHub (nuvem), a Wikipédia (foto do autor da frase) e o Google Fonts. Novo serviço externo? Inclua aqui.
const scriptHashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
  m => `'sha256-${crypto.createHash("sha256").update(m[1], "utf8").digest("base64")}'`
);
const CSP = [
  "default-src 'self'",
  `script-src 'self' ${scriptHashes.join(" ")}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://upload.wikimedia.org https://thumb.wikimedia.org",
  "connect-src 'self' https://generativelanguage.googleapis.com https://api.github.com https://gist.githubusercontent.com https://pt.wikipedia.org",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'"
].join("; ");
html = html.replace("%%CSP%%", CSP);
fs.writeFileSync(path.join(out, "index.html"), html, "utf8");
["sw.js", "manifest.json"].forEach(f => fs.copyFileSync(path.join(__dirname, "src", f), path.join(out, f)));
["icon-192.png", "icon-512.png", "icon-180.png"].forEach(f => fs.copyFileSync(asset(f), path.join(out, f)));
fs.rmSync(path.join(out, "icon.svg"), { force: true });
console.log("index.html:", (fs.statSync(path.join(out, "index.html")).size / 1024).toFixed(0), "KB");
