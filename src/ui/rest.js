/* ============ DESCANSO: anel que esvazia, bipe (AudioContext), vibração e notificação ============ */
const RT = { end: 0, total: 0, paused: null, iv: null, next: "" };
let AC = null;
function beep() {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t = AC.currentTime;
    [0, .25, .5].forEach(o => { const os = AC.createOscillator(), g = AC.createGain(); os.frequency.value = 880; os.connect(g); g.connect(AC.destination); g.gain.setValueAtTime(.0001, t + o); g.gain.exponentialRampToValueAtTime(.4, t + o + .02); g.gain.exponentialRampToValueAtTime(.0001, t + o + .18); os.start(t + o); os.stop(t + o + .2); });
  } catch (e) { }
}
function unlockAudio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { } }
function startRest(sec, next) {
  unlockAudio(); clearInterval(RT.iv); RT.total = sec; RT.end = Date.now() + sec * 1000; RT.paused = null; RT.next = next || "";
  $("#rest").classList.add("on"); restDraw(true); RT.iv = setInterval(restTick, 250);
}
const restLeft = () => RT.paused !== null ? RT.paused : Math.max(0, Math.ceil((RT.end - Date.now()) / 1000));
function restDraw(full) {
  const l = restLeft(), p = RT.total ? l / RT.total : 0, hue = S.cur ? WK_HUE[S.cur.day] : "var(--accent)";
  const t = $("#rest-time"), arc = $("#rest .arc");
  if (!full && t && arc) { t.textContent = `${Math.floor(l / 60)}:${pad(l % 60)}`; const c = +arc.getAttribute("stroke-dasharray"); arc.setAttribute("stroke-dashoffset", c * (1 - p)); return; }
  $("#rest-in").innerHTML = `<div class="lbl">Descanso</div>${ring(p, 260, 12, hue, `<div class="rest-time tabnum" id="rest-time" aria-live="off">${Math.floor(l / 60)}:${pad(l % 60)}</div>`)}
    <p class="rest-next">${esc(RT.next)}</p>
    <div class="grid2 rest-btns"><button class="btn" data-act="rest-adj" data-s="-15">−15 s</button><button class="btn" data-act="rest-adj" data-s="15">+15 s</button>
    <button class="btn" data-act="rest-pause">${ic(RT.paused !== null ? "play" : "pause")} ${RT.paused !== null ? "Retomar" : "Pausar"}</button><button class="btn solid" data-act="rest-skip">Pular</button></div>`;
}
function restTick() { if (RT.paused !== null) return; if (restLeft() <= 0) return restDone(); restDraw(); }
function restDone() {
  clearInterval(RT.iv); beep(); try { navigator.vibrate && navigator.vibrate([200, 100, 200, 100, 200]); } catch (e) { }
  notify("Descanso acabou", RT.next || "Hora da próxima série.");
  const t = $("#rest-time"); if (t) t.textContent = "Vai!";
  setTimeout(closeRest, 900);
}
function closeRest() { clearInterval(RT.iv); RT.iv = null; $("#rest").classList.remove("on"); }
function notify(title, body) {
  if (!S.settings.notif) return;
  try { if ("Notification" in window && Notification.permission === "granted") { if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r => r.showNotification(title, { body, tag: "sir-rest", icon: "icon-192.png", vibrate: [200, 100, 200] })).catch(() => new Notification(title, { body })); else new Notification(title, { body }); } } catch (e) { }
}
ACT["rest-adj"] = b => { const s = num(b.dataset.s); if (RT.paused !== null) RT.paused = Math.max(1, RT.paused + s); else RT.end += s * 1000; RT.total = Math.max(1, RT.total + s); restDraw(); };
ACT["rest-pause"] = () => { if (RT.paused === null) RT.paused = restLeft(); else { RT.end = Date.now() + RT.paused * 1000; RT.paused = null; } restDraw(true); };
ACT["rest-skip"] = () => closeRest();
