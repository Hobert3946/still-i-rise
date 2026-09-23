/* ============ HERO do Hoje: frase motivacional em destaque com a foto de quem escreveu ============ */
// autor da frase → página da Wikipédia (foto buscada na hora e guardada no aparelho; sem internet, iniciais)
const AUTHOR_WIKI = { "Maya Angelou": "Maya_Angelou", "Will Durant": "Will_Durant", "Ovídio": "Ovídio", "Sêneca": "Sêneca", "Epicteto": "Epicteto",
  "Marco Aurélio": "Marco_Aurélio", "Lao Tsé": "Lao_Tsé", "Fernando Pessoa": "Fernando_Pessoa", "Jim Rohn": "Jim_Rohn",
  "Rocky Balboa": "Rocky_Balboa", "Arnold Schwarzenegger": "Arnold_Schwarzenegger", "Muhammad Ali": "Muhammad_Ali" };
const authorName = a => a.split(",")[0].trim();
const initials = n => n.split(/\s+/).filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "✦";
async function authorPhoto(n) {
  const t = AUTHOR_WIKI[n]; if (!t) return null;
  const k = "au:" + n, c = await photoGet(k); if (c) return c;
  try {
    const r = await fetch("https://pt.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(t)); if (!r.ok) return null;
    const u = ((await r.json()).thumbnail || {}).source; if (!/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(u || "")) return null;
    await photoPut(k, u); return u;
  } catch (e) { return null; }
}
function heroHTML() {
  const [ft, fa] = FRASES[fraseIdx()], n = authorName(fa);
  setTimeout(heroHydrate, 0);
  return `<section class="hero"><div class="hero-av" aria-hidden="true"><span>${esc(initials(n))}</span><img alt="" data-author="${esc(n)}" hidden></div>
    <blockquote class="hero-q">“${esc(ft)}”</blockquote><div class="hero-a">— ${esc(fa)}</div>
    <button class="btn ghost hero-next" data-act="quote-next">Outra frase ${ic("right")}</button></section>`;
}
function heroHydrate() { $$("img[data-author]").forEach(async img => { const u = await authorPhoto(img.dataset.author); if (u && img.isConnected) { img.onload = () => { img.hidden = false; }; img.src = u; } }); }
