/* ============ FOTOS DE PROGRESSO: só neste aparelho (IndexedDB), fora do backup .json e da nuvem ============ */
// S.photos = [{ id, d }] (só a lista vai no estado); a imagem fica em IndexedDB "photos"[id]
const PHOTO_MEM = {};
async function photoPut(id, dataUrl) { try { const db = await IDB.open(); db.transaction("photos", "readwrite").objectStore("photos").put(dataUrl, id); } catch (e) { } PHOTO_MEM[id] = dataUrl; }
async function photoGet(id) {
  if (PHOTO_MEM[id]) return PHOTO_MEM[id];
  try { const db = await IDB.open(); return await new Promise(res => { const q = db.transaction("photos").objectStore("photos").get(id); q.onsuccess = () => res(PHOTO_MEM[id] = q.result || null); q.onerror = () => res(null); }); } catch (e) { return null; }
}
async function photoDel(id) { try { const db = await IDB.open(); db.transaction("photos", "readwrite").objectStore("photos").delete(id); } catch (e) { } delete PHOTO_MEM[id]; S.photos = S.photos.filter(p => p.id !== id); save(); }
async function photoAdd(file) {
  const b64 = await fotoDownscale(file, 1080), id = uid("f");
  await photoPut(id, "data:image/jpeg;base64," + b64); S.photos.push({ id, d: today() }); save(); return id;
}
// preenche as <img data-photo="id"> depois de desenhar a tela
function photosHydrate() { $$("img[data-photo]").forEach(async img => { const u = await photoGet(img.dataset.photo); if (u) img.src = u; else img.closest(".ph")?.classList.add("missing"); }); }
function photosSec() {
  const list = S.photos.slice().reverse();
  setTimeout(photosHydrate, 0);
  return sec("Fotos de progresso", `<p class="muted small">Ficam só neste aparelho: não vão para o backup .json nem para a nuvem. Tire sempre no mesmo lugar e luz.</p>
    ${list.length ? `<div class="photos">${list.slice(0, 9).map(p => `<button class="ph" data-act="photo-open" data-id="${p.id}"><img data-photo="${p.id}" alt="Foto de ${dispDate(p.d)}"><small>${dispDate(p.d)}</small></button>`).join("")}</div>` : ""}
    <button class="btn full" data-act="photo-add">${ic("camera")} Adicionar foto</button>`);
}
function photoSheet(id) {
  const p = S.photos.find(x => x.id === id), first = S.photos[0]; if (!p) return;
  openSheet(`<h3 class="h3">Comparar</h3><div class="compare"><figure><img data-photo="${first.id}" alt="Primeira foto"><figcaption>${dispDate(first.d)}</figcaption></figure><figure><img data-photo="${p.id}" alt="Foto escolhida"><figcaption>${dispDate(p.d)}</figcaption></figure></div>
    <button class="btn danger full" data-act="photo-del" data-id="${id}">Apagar esta foto</button>`);
  photosHydrate();
}
ACT["photo-add"] = () => $("#fotoprog").click();
ACT["photo-open"] = b => photoSheet(b.dataset.id);
ACT["photo-del"] = b => { if (!confirm("Apagar esta foto deste aparelho?")) return; photoDel(b.dataset.id); closeSheet(); render(); };
