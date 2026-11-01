// Motor: durum, yazı efekti, akıl sistemi, jumpscare, kayıt.
const $ = s => document.querySelector(s);
const S = { san: 100, items: new Set(), flags: new Set(), scene: null, seen: new Set(), scared: new Set(), steps: 0 };
const ITEMS = { demir_mil: "Demir mil", tuz: "Tuz", muska: "Muska", anahtar: "Mahzen anahtarı", nazar: "Nazar boncuğu" };
let cv, cx, tStart = performance.now(), curArt = "black", typing = null, whisperT = null, busy = false;

function save() { try { localStorage.setItem("sessiz_konak", JSON.stringify({ san: S.san, items: [...S.items], flags: [...S.flags], scene: S.scene, seen: [...S.seen], scared: [...S.scared] })); } catch (e) { } }
function loadSave() { try { const d = JSON.parse(localStorage.getItem("sessiz_konak")); if (d && STORY.scenes[d.scene] && !STORY.scenes[d.scene].ending) return d; } catch (e) { } return null; }
function clearSave() { try { localStorage.removeItem("sessiz_konak"); } catch (e) { } }

function reset() { S.san = 100; S.items = new Set(); S.flags = new Set(); S.seen = new Set(); S.scared = new Set(); S.steps = 0; }
function applySave(d) { S.san = d.san; S.items = new Set(d.items); S.flags = new Set(d.flags); S.seen = new Set(d.seen); S.scared = new Set(d.scared); }

function glitch(text, san) {
  if (san >= 55) return text;
  const p = (55 - san) / 55 * 0.07, sub = "▒░#?¿ǂ"; let o = "";
  for (const ch of text) o += (/\S/.test(ch) && Math.random() < p) ? sub[Math.floor(Math.random() * sub.length)] : ch; return o;
}
function addSan(d) { if (!d) return; S.san = Math.max(0, Math.min(100, S.san + d)); updateHud(); if (d < 0) { const h = $("#hud"); h.classList.remove("hit"); void h.offsetWidth; h.classList.add("hit"); } }
function updateHud() {
  $("#sanfill").style.width = S.san + "%"; $("#sanfill").style.background = S.san > 60 ? "#8fae7a" : S.san > 30 ? "#d1a04a" : "#c0392b";
  $("#inv").innerHTML = [...S.items].map(i => `<span class="it">${ITEMS[i]}</span>`).join("") || '<span class="dim">Eşya yok</span>';
  document.body.classList.toggle("low", S.san < 40); document.body.classList.toggle("vlow", S.san < 20);
  Snd.setSanity(S.san);
}

function scare(sc) {
  const k = sc.kind, key = sc.id + ":" + k; if (sc.once && S.scared.has(key)) return Promise.resolve(); S.scared.add(key);
  return new Promise(res => {
    const el = $("#scare"), c = $("#scarecv").getContext("2d"); Snd.stinger(k); el.className = "on " + k; let n = 0;
    const iv = setInterval(() => { n++; Art.draw(c, k === "flash" || k === "lights" ? "black" : k === "knock" ? "black" : k, n / 10); if (k === "flash") { c.fillStyle = n % 2 ? "#fff" : "#000"; c.fillRect(0, 0, 800, 450); } if (k === "lights") { c.fillStyle = "#000"; c.fillRect(0, 0, 800, 450); } }, 50);
    const dur = k === "face" ? 1100 : k === "knock" ? 1200 : 700;
    setTimeout(() => { clearInterval(iv); el.className = ""; if (sc.san) addSan(sc.san); res(); }, dur);
    if (k === "face") { document.body.classList.add("shake"); setTimeout(() => document.body.classList.remove("shake"), 700); }
  });
}

function typeText(el, text, whisper) {
  if (typing) typing.stop(); let i = 0, done = false; el.textContent = "";
  const full = text;
  return new Promise(res => {
    const finish = () => { if (done) return; done = true; clearInterval(iv); el.textContent = glitch(full, S.san); typing = null; res(); };
    const iv = setInterval(() => { i += 2; el.textContent = full.slice(0, i); if (i >= full.length) finish(); }, 18);
    typing = { stop: finish };
  });
}

async function show(id, notice) {
  if (busy) return; busy = true;
  const sc = STORY.scenes[id]; S.scene = id; sc.id = id;
  const first = !S.seen.has(id); S.seen.add(id);
  if (first && sc.onEnter) sc.onEnter(S);
  curArt = sc.art; Snd.ambient(sc.amb || "drone");
  $("#title").textContent = sc.title || ""; $("#notice").textContent = notice || ""; $("#choices").innerHTML = ""; $("#whisper").textContent = ""; $("#end").className = "";
  document.body.classList.toggle("ending", !!sc.ending);
  updateHud();
  if (sc.scare && (first || !sc.scare.once)) await scare({ ...sc.scare, id });
  if (S.san <= 0 && !sc.ending) { busy = false; return show("e_deli"); }
  const txt = typeof sc.text === "function" ? sc.text(S) : sc.text;
  await typeText($("#text"), txt);
  if (sc.w && S.san < 55) { $("#whisper").textContent = sc.w; Snd.whisper(); }
  if (S.san < 70 && Math.random() < 0.5) Snd.whisper();
  if (sc.ending) { $("#end").className = "on " + sc.end; Snd.end(sc.end); clearSave(); try { const r = JSON.parse(localStorage.getItem("sk_ends") || "[]"); if (!r.includes(id)) { r.push(id); localStorage.setItem("sk_ends", JSON.stringify(r)); } } catch (e) { } $("#endcount").textContent = endsText(); }
  else save();
  renderChoices(sc);
  busy = false;
}
function endsText() { try { const r = JSON.parse(localStorage.getItem("sk_ends") || "[]"); return "Bulunan son: " + r.length + " / 7"; } catch (e) { return ""; } }

function renderChoices(sc) {
  const box = $("#choices"); box.innerHTML = "";
  if (sc.ending) {
    const b = document.createElement("button"); b.textContent = "Yeniden oyna"; b.onclick = () => { Snd.click(); newGame(); }; box.appendChild(b);
    const m = document.createElement("button"); m.textContent = "Ana menü"; m.onclick = () => { Snd.click(); menu(); }; box.appendChild(m); return;
  }
  for (const c of sc.choices) {
    if (c.if && !c.if(S)) continue;
    const b = document.createElement("button"); b.textContent = c.t;
    b.onclick = async () => {
      if (busy) return; Snd.click(); S.steps++;
      let notice = "";
      if (c.do) { c.do(S); Snd.item(); }
      if (c.msg) notice = c.msg; if (c.heal) addSan(c.heal); if (c.san) addSan(c.san);
      if (S.san <= 0) return show("e_deli");
      return show(c.to, notice);
    };
    box.appendChild(b);
  }
}

function draw() {
  const t = (performance.now() - tStart) / 1000;
  if (cx) { Art.draw(cx, curArt, t); if (S.san < 50 && Math.random() < 0.02) { cx.fillStyle = "rgba(160,0,0,.12)"; cx.fillRect(0, 0, 800, 450); } }
  requestAnimationFrame(draw);
}
function newGame() { clearSave(); reset(); $("#menu").className = ""; Snd.init(); show(STORY.start); }
function menu() { $("#menu").className = "on"; const d = loadSave(); $("#cont").style.display = d ? "" : "none"; $("#endcount2").textContent = endsText(); Snd.init(); Snd.ambient("rain"); curArt = "gate"; document.body.classList.remove("ending"); $("#end").className = ""; $("#text").textContent = ""; $("#choices").innerHTML = ""; $("#title").textContent = ""; }
window.addEventListener("DOMContentLoaded", () => {
  cv = $("#cv"); cx = cv.getContext("2d"); requestAnimationFrame(draw);
  $("#newbtn").onclick = () => { Snd.init(); newGame(); };
  $("#cont").onclick = () => { Snd.init(); const d = loadSave(); if (!d) return newGame(); reset(); applySave(d); $("#menu").className = ""; show(d.scene); };
  $("#snd").onclick = () => { Snd.init(); Snd.setOn(!Snd.on); $("#snd").textContent = Snd.on ? "Ses: Açık" : "Ses: Kapalı"; };
  $("#text").onclick = () => { if (typing) typing.stop(); };
  $("#homebtn").onclick = () => { if (confirm("Ana menüye dönülsün mü? İlerleme kayıtlı kalır.")) menu(); };
  document.addEventListener("keydown", e => { if (e.key >= "1" && e.key <= "9") { const b = document.querySelectorAll("#choices button")[+e.key - 1]; if (b) b.click(); } else if (e.key === " " && typing) { typing.stop(); e.preventDefault(); } });
  menu();
  window.__S = S; window.__show = show;
});
