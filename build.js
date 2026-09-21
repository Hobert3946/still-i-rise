const fs = require("fs"), path = require("path");
const src = f => fs.readFileSync(path.join(__dirname, "src", f), "utf8");
const asset = f => path.join(__dirname, "src", "assets", f);
const out = path.join(__dirname, "docs"); fs.mkdirSync(out, { recursive: true });
const b64 = f => "data:image/jpeg;base64," + fs.readFileSync(asset(f)).toString("base64");

let html = src("template.html")
  .replace("/*CSS*/", () => src("styles.css"))
  .replace("/*JS*/", () => [src("foods.js"), src("plan.js"), src("foto.js"), src("progressao.js"), src("agua.js"), src("comer.js"), src("app.js")].join("\n"));
html = html.split("%%AVATAR%%").join(b64("avatar.jpg")).split("%%LOGO%%").join(b64("logo-256.jpg"));
fs.writeFileSync(path.join(out, "index.html"), html, "utf8");
["sw.js", "manifest.json"].forEach(f => fs.copyFileSync(path.join(__dirname, "src", f), path.join(out, f)));
["icon-192.png", "icon-512.png", "icon-180.png"].forEach(f => fs.copyFileSync(asset(f), path.join(out, f)));
fs.rmSync(path.join(out, "icon.svg"), { force: true });
console.log("index.html:", (fs.statSync(path.join(out, "index.html")).size / 1024).toFixed(0), "KB");
