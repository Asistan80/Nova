import * as THREE from "three";
import { NPCS, NPC_IDS, QUESTS, MIRMIR, GIFT, MUHTAR, GENERIC, N, fallbackReply, ACH, SIDE } from "./data.js";
import { initSystems } from "./systems.js";
import { INT } from "./interior.js";
import { buildWorld, terrainH, PLACES, SPOTS, POND, rng, BENCH_POS } from "./world.js";
import { makeHuman, animateHuman, makeCat, animateCat, makeSheep, makeLabel } from "./chars.js";
import { Sound } from "./audio.js";

const $ = id => document.getElementById(id);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; return d; };
const SAVE = "koy_save_v1", SET = "koy_settings_v1";
const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const toastEl = m => { if (window.toast) window.toast(m); };

/* ================= durum ================= */
const fresh = () => ({ v: 1, name: "", t: 8, day: 1, hearts: {}, met: {}, inv: { wheat: 0, page: 0, gear: 0, flower: 0, simit: 0, shard: 0, mush: 0, fish: 0, letter: 0, medal: 0, antika: 0 }, q: { zehra: 0, hacer: 0, cemal: 0, kemal: 0, mirmir: 0, mektup: 0, mantar: 0, balik: 0, hazine: 0 }, coins: 0, earned: 0, owned: {}, fishBag: [], codex: {}, fishTotal: 0, dug: { day: 1, ids: [] }, medalDug: [], digTotal: 0, letters: {}, riddle: { day: 0, done: false }, riddles: 0, entered: false,
  intro: false, collected: [], fl: { day: 1, ids: [] }, flowersTotal: 0, gifted: {}, secrets: {}, mem: {}, chatDay: {}, ach: [], steps: 0, chats: 0, restored: false, sheep: "lost", pos: [PLACES.start[0], PLACES.start[1]], yaw: Math.PI });
const S = (() => { const o = LS.get(SAVE, null); if (!o || !o.v) return fresh(); const f = fresh(); const m = Object.assign(f, o); m.inv = Object.assign(fresh().inv, o.inv); m.q = Object.assign(fresh().q, o.q); return m; })();
const resetS = () => { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, fresh()); };
const API = window.KOY_API || ""; const STATIC = !!window.KOY_STATIC && !API;
const settings = Object.assign({ master: .8, music: .5, sfx: .9, quality: "high", ai: !STATIC, sens: 1 }, LS.get(SET, {}));
if (STATIC) settings.ai = false;
const save = () => LS.set(SAVE, S), saveSet = () => LS.set(SET, settings);

/* ================= sahne ================= */
const stage = $("stage");
const renderer = new THREE.WebGLRenderer({ antialias: settings.quality === "high", powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, settings.quality === "high" ? 1.5 : 1));
renderer.shadowMap.enabled = settings.quality === "high"; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, .2, 700);
const W = buildWorld(scene, { shadow: settings.quality === "high" ? 2048 : 512, seg: settings.quality === "high" ? 190 : 120 });
const snd = new Sound(); snd.vol = { master: settings.master, music: settings.music, sfx: settings.sfx };
function resize() { const w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();

/* ================= oyuncu ================= */
const P = { x: S.pos[0], z: S.pos[1], y: 0, vy: 0, yaw: S.yaw, moving: false, run: false };
const player = makeHuman({ color: 0x2f9aa8, scarf: 0xe0364a, hat: "cap", skin: 0xe8b894 }); scene.add(player);
const lantern = new THREE.PointLight(0xffcf8a, 0, 14, 1.5); lantern.position.set(.5, 2, .3); player.add(lantern);
const cam = { yaw: Math.PI, pitch: .38, dist: 7.5, tdist: 7.5 };
P.y = terrainH(P.x, P.z);

/* ================= NPC'ler ================= */
const NPC = {};
NPC_IDS.forEach(id => {
  const d = NPCS[id]; let g;
  if (d.cat) g = makeCat(); else if (d.tree) g = new THREE.Group(); else g = makeHuman({ color: d.color, scarf: d.scarf, hat: d.hat, dress: id === "zehra" || id === "hacer", old: id === "hacer" || id === "muhtar", scale: id === "hacer" ? .92 : 1 });
  const lb = makeLabel((d.tree ? "" : "") + d.name.replace(" (Kedi)", "")); lb.position.y = d.cat ? 1.4 : d.tree ? 14 : 2.9; g.add(lb);
  const e = { id, d, g, x: d.work[0], z: d.work[1], tx: d.work[0], tz: d.work[1], yaw: 0, wait: Math.random() * 3, label: lb, moving: false, talking: false, ph: Math.random() * 6 };
  if (d.tree) { e.x = 0; e.z = 0; } else { g.position.set(e.x, terrainH(e.x, e.z), e.z); scene.add(g); }
  NPC[id] = e;
});
const inWindow = (t, a, b) => a < b ? (t >= a && t < b) : (t >= a || t < b);
const npcActive = (e, t) => inWindow(t, e.d.hours[0], e.d.hours[1]);
function npcPlan(e, dt) {
  const d = e.d; if (d.tree) return;
  const active = npcActive(e, S.t);
  if (d.cat) { if (!active) { e.tx = 3.6; e.tz = 3.6; e.sleep = true; } else { e.sleep = false; } }
  if (e.talking) { e.moving = false; return; }
  const fest = !d.cat && X.fest.on(); const act2 = active || fest;
  if (!act2 && !d.cat) { e.homing = true; e.tx = d.home[0]; e.tz = d.home[1]; if (Math.hypot(e.x - e.tx, e.z - e.tz) < 1.2 || e.stuck > 3) { e.g.visible = false; e.hidden = true; e.stuck = 0; return; } }
  else if (act2) e.homing = false;
  if (fest && !e.hidden && e.wait <= 0 && Math.hypot(e.x - e.tx, e.z - e.tz) < .6) { const a = Math.random() * 6.283, r = 5.5 + Math.random() * 5; e.tx = Math.cos(a) * r; e.tz = Math.sin(a) * r; e.wait = 4 + Math.random() * 6; }
  if (e.hidden && act2) { e.hidden = false; e.g.visible = true; e.x = d.home[0]; e.z = d.home[1]; }
  if (act2 || d.cat) {
    e.wait -= dt;
    if (Math.hypot(e.x - e.tx, e.z - e.tz) < .5 && e.wait <= 0 && !e.sleep && !fest) { const a = Math.random() * 6.283, r = 1 + Math.random() * (d.cat ? 9 : 3.5), c = d.work; e.tx = c[0] + Math.cos(a) * r; e.tz = c[1] + Math.sin(a) * r; e.wait = 3 + Math.random() * 6; }
  }
}
function npcMove(e, dt) {
  const dx = e.tx - e.x, dz = e.tz - e.z, dist = Math.hypot(dx, dz); e.moving = false;
  if (dist > .3 && !e.talking && !(e.d.cat && e.sleep && dist < .6)) { const sp = (e.d.cat ? 2.2 : 1.35) * dt; e.x += dx / dist * Math.min(sp, dist); e.z += dz / dist * Math.min(sp, dist); e.yaw = Math.atan2(dx, dz); e.moving = true; const ox = e.x, oz = e.z; if (!e.homing) W.resolve(e, .4); const mv = Math.hypot(e.x - ox, e.z - oz); e.stuck = (mv < sp * .25) ? (e.stuck || 0) + dt : 0; if (e.stuck > 2.5 && !e.homing) { e.tx = e.d.work[0] + (Math.random() - .5) * 3; e.tz = e.d.work[1] + (Math.random() - .5) * 3; e.stuck = 0; e.wait = 2; } }
  e.g.position.set(e.x, terrainH(e.x, e.z), e.z); e.g.rotation.y = lerpAng(e.g.rotation.y, e.yaw, Math.min(1, dt * 8));
  if (e.d.cat) { animateCat(e.g, T); e.g.scale.setScalar(e.sleep ? .85 : 1); e.g.position.y += e.sleep ? 0 : Math.abs(Math.sin(T * 8)) * (e.moving ? .08 : 0); }
  else animateHuman(e.g, e.moving ? 3 : 0, T + e.ph);
  e.g.children.forEach(c => { if (c === e.label) c.visible = Math.hypot(e.x - P.x, e.z - P.z) < 24; });
}
const lerpAng = (a, b, t) => a + angDiff(a, b) * t;
// Ağaç Dede, kedi gündüz uyur
NPC.dede.label.position.set(0, terrainH(0, 0) + 13.5, 0); scene.add(NPC.dede.label);

/* ================= koyunlar ================= */
const sheeps = []; const pen = PLACES.pen;
for (let i = 0; i < 8; i++) { const g = makeSheep(); const a = i / 8 * 6.283, r = 1.5 + Math.random() * 3; const s = { g, x: pen[0] + Math.cos(a) * r, z: pen[1] + Math.sin(a) * r, tx: 0, tz: 0, yaw: Math.random() * 6, wait: Math.random() * 4, c: pen }; s.tx = s.x; s.tz = s.z; g.position.set(s.x, terrainH(s.x, s.z), s.z); scene.add(g); sheeps.push(s); }
const pamuk = (() => { const g = makeSheep(); g.scale.setScalar(.75); const s = { g, x: SPOTS.sheep[0], z: SPOTS.sheep[1], tx: 0, tz: 0, yaw: 0, wait: 0, pamuk: true, c: SPOTS.sheep }; s.tx = s.x; s.tz = s.z; scene.add(g); g.position.set(s.x, terrainH(s.x, s.z), s.z); const lb = makeLabel("Pamuk"); lb.position.y = 1.7; g.add(lb); return s; })();
if (S.sheep === "home") { pamuk.x = pen[0] + 1; pamuk.z = pen[1] + 1; pamuk.c = pen; pamuk.tx = pamuk.x; pamuk.tz = pamuk.z; }
sheeps.push(pamuk);
function sheepUpdate(s, dt) {
  if (s.pamuk && S.sheep === "follow") { const dx = P.x - s.x, dz = P.z - s.z, d = Math.hypot(dx, dz); if (d > 2.4) { const sp = Math.min(d - 2.4, (d > 8 ? 7 : 4.2) * dt); s.x += dx / d * sp; s.z += dz / d * sp; s.yaw = Math.atan2(dx, dz); W.resolve(s, .4); } if (Math.hypot(s.x - pen[0], s.z - pen[1]) < 5) { S.sheep = "home"; s.c = pen; s.tx = s.x; s.tz = s.z; toast("Pamuk ağılda! Çoban Kemal'e haber ver 🐑"); snd.pickup(); save(); } }
  else { s.wait -= dt; if (s.wait <= 0 && Math.hypot(s.x - s.tx, s.z - s.tz) < .4) { const a = Math.random() * 6.283, r = Math.random() * 4.2; s.tx = s.c[0] + Math.cos(a) * r; s.tz = s.c[1] + Math.sin(a) * r; s.wait = 2 + Math.random() * 5; } const dx = s.tx - s.x, dz = s.tz - s.z, d = Math.hypot(dx, dz); if (d > .3) { const sp = Math.min(d, .9 * dt); s.x += dx / d * sp; s.z += dz / d * sp; s.yaw = Math.atan2(dx, dz); } }
  s.g.position.set(s.x, terrainH(s.x, s.z) + Math.abs(Math.sin(T * 6 + s.x)) * (Math.hypot(s.x - s.tx, s.z - s.tz) > .3 ? .05 : 0), s.z); s.g.rotation.y = lerpAng(s.g.rotation.y, s.yaw, .1);
}

/* ================= toplanabilirler ================= */
const ITEMS = { mush: ["🍄", "Mantar"], fish: ["🐟", "Balık"], letter: ["✉️", "Mektup"], medal: ["🏅", "Madalyon parçası"], antika: ["🏺", "Antika"], wheat: ["🌾", "Buğday demeti"], page: ["📜", "Masal sayfası"], gear: ["⚙️", "Dişli çark"], flower: ["🌸", "Çiçek"], simit: ["🥯", "Simit"], shard: ["💧", "Pınar damlası"] };
const NEEDQ = { wheat: "zehra", page: "hacer", gear: "cemal" };
function spawnPickups() {
  W.pickups.slice().forEach(p => W.removePickup(p));
  ["wheat", "page", "gear"].forEach(t => SPOTS[t].forEach(([x, z], i) => { const id = t + i; if (!S.collected.includes(id)) W.makePickup(t, x, z).userData.id = id; }));
  X.spawnMush(); X.dig.spawn();
  const fr = rng(777); for (let i = 0; i < 30; i++) { const a = fr() * 6.283, r = 8 + Math.sqrt(fr()) * 48, x = Math.cos(a) * r, z = Math.sin(a) * r, id = "f" + i; if (Math.hypot(x - POND.x, z - POND.z) < 9) continue; if (!S.fl.ids.includes(id)) W.makePickup("flower", x, z).userData.id = id; }
}
function addItem(t, n = 1) { S.inv[t] = Math.max(0, (S.inv[t] || 0) + n); hudInv(); }
function collect(p) {
  const t = p.userData.type, id = p.userData.id; W.removePickup(p);
  if (t === "flower") { S.fl.ids.push(id); S.flowersTotal++; if (S.flowersTotal >= 10) award("cicek"); } else if (t === "mush") S.fl.ids.push(id); else S.collected.push(id);
  addItem(t); snd.pickup(); const q = NEEDQ[t]; const need = q ? QUESTS[q].need : (t === "mush" && S.q.mantar === 1 ? 4 : 0);
  toast(`${ITEMS[t][0]} ${ITEMS[t][1]} (${S.inv[t]}${need ? "/" + need : ""})`); save(); hudObj();
}

/* ================= zaman ve görevler ================= */
let T = 0, sis = 1, glow = 0, cine = false, resting = false;
const shardsGot = () => S.inv.shard + (S.restored ? 4 : 0);
const sisTarget = () => S.restored ? .05 : clamp(1 - S.inv.shard * .18, .25, 1);
const hhmm = t => `${String(Math.floor(t)).padStart(2, "0")}:${String(Math.floor(t % 1 * 60)).padStart(2, "0")}`;
const isNight = () => S.t >= 21.5 || S.t < 5;
function award(id) { if (S.ach.includes(id)) return; S.ach.push(id); const a = ACH[id]; toast(`${a[0]} Başarım: ${a[1]}`); snd.quest(); save(); }
let toastQ = []; const toast = m => { toastEl(m); };

/* ================= HUD ================= */
function hudInv() { $("inv").innerHTML = `<span class="chip2" title="Altın">🪙 ${S.coins}</span>` + Object.entries(S.inv).filter(([k, v]) => v > 0).map(([k, v]) => `<span class="chip2" title="${ITEMS[k][1]}">${ITEMS[k][0]} ${v}</span>`).join(""); }
function objective() {
  if (S.restored) return X.sideObjective() || "✨ Pınar uyandı. Balık tut, define ara, evini süsle, dostluklarını geliştir.";
  if (!S.intro) return "Köy meydanındaki Muhtar Rıza Amca ile konuş.";
  if (S.inv.shard >= 4) return isNight() ? "🌙 Gece! Pınar'a git ve dört damlayı bırak." : "🌙 Dört damla tamam. Geceyi bekle (kahvehane bankında dinlen) ve pınara git.";
  const parts = [];
  const qs = [["zehra", "wheat", "Zehra: buğday"], ["hacer", "page", "Hacer Nine: sayfa"], ["cemal", "gear", "Cemal: çark"]];
  qs.forEach(([q, it, lb]) => { if (S.q[q] === 1) parts.push(`${lb} ${S.inv[it]}/3`); else if (S.q[q] === 0) parts.push(`${NPCS[q].name.split(" ").slice(-2).join(" ")} ile konuş`); });
  if (S.q.kemal === 1) parts.push(S.sheep === "home" ? "Kemal'e haber ver" : "Pamuk'u bul"); else if (S.q.kemal === 0) parts.push("Çoban Kemal ile konuş");
  return `💧 Damla ${S.inv.shard}/4 · ` + parts.slice(0, 3).join(" · ");
}
function hudObj() { $("obj").textContent = objective(); }
function hudClock() { $("clock").textContent = `${X.rain.I > .3 ? "🌧️" : isNight() ? "🌙" : "☀️"} ${hhmm(S.t)} · Gün ${S.day}${X.fest.on() ? " · 🎆" : ""}`; }
const mini = $("mini").getContext("2d");
function drawMini() {
  const c = mini, w = 130, R = 60, sc = w / 2 / R; c.clearRect(0, 0, w, w); c.save(); c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 1, 0, 6.283); c.clip();
  c.fillStyle = "rgba(20,40,30,.85)"; c.fillRect(0, 0, w, w);
  const m = (x, z) => [w / 2 + (x - P.x) * sc, w / 2 + (z - P.z) * sc];
  let [px, pz] = m(POND.x, POND.z); c.fillStyle = "#3b8fd0"; c.beginPath(); c.arc(px, pz, POND.r * sc, 0, 6.283); c.fill();
  c.fillStyle = "#b9a98a"; W.houses.forEach(h => { const [x, z] = m(h.position.x, h.position.z); c.fillRect(x - 3, z - 3, 6, 6); });
  c.fillStyle = "#3f7a38"; [px, pz] = m(0, 0); c.beginPath(); c.arc(px, pz, 5, 0, 6.283); c.fill();
  W.pickups.forEach(p => { const [x, z] = m(p.userData.x, p.userData.z); const need = NEEDQ[p.userData.type] && S.q[NEEDQ[p.userData.type]] === 1; if (p.userData.type === "flower" && Math.hypot(p.userData.x - P.x, p.userData.z - P.z) > 25) return; c.fillStyle = need ? "#ffe066" : p.userData.type === "flower" ? "#ff9bc0" : "#bbbbbb"; c.beginPath(); c.arc(x, z, need ? 3 : 2, 0, 6.283); c.fill(); });
  if (S.sheep === "lost" && S.q.kemal === 1) { const [x, z] = m(pamuk.x, pamuk.z); c.fillStyle = "#fff"; c.beginPath(); c.arc(x, z, 3.2, 0, 6.283); c.fill(); }
  { const [hx, hz] = m(W.home.x, W.home.z); c.font = "12px sans-serif"; c.textAlign = "center"; c.fillText("🏠", hx, hz + 4); X.dig.list.forEach(d => { if (Math.hypot(d.userData.x - P.x, d.userData.z - P.z) > 40 && d.userData.medal == null) return; const [x, z] = m(d.userData.x, d.userData.z); c.fillStyle = d.userData.medal != null ? "#66d9ff" : "#ffe27a"; c.fillRect(x - 2, z - 2, 4, 4); }); }
  c.font = "11px sans-serif"; c.textAlign = "center"; NPC_IDS.forEach(id => { const e = NPC[id]; if (e.hidden || (e.d.cat && e.sleep && false)) return; const [x, z] = m(e.x, e.z); c.fillText(e.d.emoji, x, z + 4); });
  c.translate(w / 2, w / 2); c.rotate(-P.yaw + Math.PI); c.fillStyle = "#ff5c7a"; c.beginPath(); c.moveTo(0, -7); c.lineTo(5, 6); c.lineTo(-5, 6); c.closePath(); c.fill(); c.restore();
}

/* ================= etkileşim ================= */
const BENCHES = BENCH_POS;
let target = null;
function findTarget() {
  if (P.inside) return X.house.target();
  if (X.fish.active) return { kind: "fishing", label: X.fish.label() };
  let best = null, bd = 99;
  const consider = (d, o) => { if (d < bd) { bd = d; best = o; } };
  NPC_IDS.forEach(id => { const e = NPC[id]; if (e.hidden) return; const d = Math.hypot(e.x - P.x, e.z - P.z), r = e.d.tree ? 6 : 3.4; if (d < r) consider(d - 1, { kind: "npc", id, label: `Konuş: ${e.d.name}` }); });
  if (S.sheep === "lost" && Math.hypot(pamuk.x - P.x, pamuk.z - P.z) < 3.2) consider(Math.hypot(pamuk.x - P.x, pamuk.z - P.z), { kind: "sheep", label: "Pamuk'u çağır" });
  const dp = Math.hypot(P.x - POND.x, P.z - POND.z); if (dp < POND.r + 3.5 && (S.inv.shard >= 4 || !S.owned.olta || S.restored)) consider(dp - 4, { kind: "pond", label: S.restored ? "Pınar" : "Pınar'a bak" });
  { const d = X.house.doorDist(); if (d < 2.8) consider(d - 1, { kind: "house", label: "Eve gir 🏠" }); }
  if (X.fish.can()) consider(1, { kind: "fish", label: "Olta at 🎣" });
  { const dg = X.dig.near(); if (dg) consider(.5, { kind: "dig", dg, label: dg.userData.medal != null ? "Kaz (parlayan toprak) ⛏️" : "Kaz ⛏️" }); }
  BENCHES.forEach(b => { const d = Math.hypot(P.x - b[0], P.z - b[1]); if (d < 2.6) consider(d, { kind: "bench", label: "Bankta dinlen" }); });
  return best;
}
function interact() {
  if (!playing || dlg.open || cine || resting || lockInput) return; if (X.fish.active) { snd.init(); return X.fish.press(); } const t = target || findTarget(); if (!t) return;
  snd.init(); if (t.kind === "fish") return X.fish.press(); if (t.kind === "house") return X.house.enter(); if (t.kind === "dig") return X.dig.dig(t.dg); if (t.kind.startsWith("in_")) return X.house.act(t.kind); if (t.kind === "npc") openDialog(t.id); else if (t.kind === "sheep") { S.sheep = "follow"; toast("🐑 Pamuk seni takip edecek. Onu ağıla götür."); snd.pickup(); save(); } else if (t.kind === "bench") benchMenu(); else if (t.kind === "pond") pondInteract();
}

/* ================= diyalog ================= */
const dlg = { open: false, id: null, queue: [], done: null, typing: false, timer: null, mode: "" };
const dq = { box: $("dlg"), em: $("dEmoji"), nm: $("dName"), hr: $("dHearts"), tx: $("dText"), ch: $("dChoices"), form: $("dForm"), inp: $("dIn"), note: $("dNote") };
function hearts(id) { return S.hearts[id] || 0; }
function showHearts(id) { const h = hearts(id); dq.hr.textContent = id === "dede" || id === "muhtar" && false ? "" : "♥".repeat(h) + "♡".repeat(5 - h); }
function typeText(text, cb) { clearInterval(dlg.timer); dlg.typing = true; let i = 0; dq.tx.textContent = ""; dlg.full = text; dlg.timer = setInterval(() => { i += 2; dq.tx.textContent = text.slice(0, i); if (i % 6 === 0) snd.talk(); if (i >= text.length) { clearInterval(dlg.timer); dlg.typing = false; cb && cb(); } }, 22); }
function setChoices(list) { dq.ch.innerHTML = ""; dq.form.hidden = true; list.forEach((c, i) => { const b = document.createElement("button"); b.className = "btn sm " + (c.cls || "ghost"); b.textContent = (i + 1) + ". " + c.t; b.onclick = () => { snd.blip(); c.f(); }; dq.ch.appendChild(b); }); }
function say(lines, done) { dlg.queue = lines.slice(); dlg.done = done; dlg.mode = "lines"; next(); }
function next() {
  if (dlg.typing) { clearInterval(dlg.timer); dlg.typing = false; dq.tx.textContent = dlg.full; if (dlg.mode === "lines") lineChoices(); return; }
  if (!dlg.queue.length) { const d = dlg.done; dlg.done = null; if (d) d(); return; }
  const l = dlg.queue.shift(); dq.ch.innerHTML = ""; dq.form.hidden = true; typeText(N(l, S.name), () => lineChoices());
}
function lineChoices() { setChoices([{ t: dlg.queue.length ? "Devam ▸" : "Tamam ▸", cls: "", f: next }]); }
function openDialog(id) {
  const e = NPC[id], d = e.d; dlg.open = true; dlg.id = id; e.talking = true; dq.box.hidden = false; dq.em.textContent = d.emoji; dq.nm.textContent = d.name; showHearts(id); dq.note.textContent = "";
  if (!S.met[id]) { S.met[id] = true; if (Object.keys(S.met).length >= NPC_IDS.length) award("tanis"); }
  const asleep = (d.cat || d.tree) && !isNight() || (d.tree && !S.intro && false);
  if (asleep) return say([d.tree ? "Zzz... (Ağaç Dede'nin yaprakları usulca hışırdıyor. Gece uyanacak gibi.)" : "Zzz... (Mırmır bir gözünü açıp kapattı. Belli ki geceyi bekliyor.)"], closeDialog);
  if (id === "muhtar") return muhtarFlow();
  const first = !S.gifted["g_" + id + "_met"]; S.gifted["g_" + id + "_met"] = true;
  const greet = (X.fest.on() && !d.cat && !d.tree) ? N(GENERIC.fest[Math.floor(Math.random() * GENERIC.fest.length)], S.name) : first ? (d.cat ? "Miyav. Yeni bir yüz... gece misafirleri her zaman ilginçtir." : d.tree ? "Hmmm... kim var orada? Bir insan... küçük, ama kalbi güçlü." : N(GENERIC.hello[Math.floor(Math.random() * 3)], S.name)) : N(GENERIC.hello[Math.floor(Math.random() * 3)], S.name);
  say([greet], () => menu(id));
}
let muhtarMenu = null;
function menu(id) {
  if (id === "muhtar" && muhtarMenu) return muhtarMenu();
  const d = NPCS[id], list = [];
  dlg.mode = "menu"; showHearts(id); dq.tx.textContent = dq.tx.textContent || "";
  list.push({ t: "💬 Sohbet et", f: () => chatMode(id) });
  const q = QUESTS[id];
  if (q) {
    if (S.q[id] === 0) list.push({ t: "📜 Derdin ne?", cls: "", f: () => say(q.offer, () => { S.q[id] = 1; toast("📜 Yeni görev: " + q.label); snd.quest(); hudObj(); save(); if (hasAll(id)) tryTurnIn(id); else menu(id); }) });
    else if (S.q[id] === 1) { list.push({ t: hasAll(id) ? "✅ Teslim et" : "❓ Görev nasıl?", cls: hasAll(id) ? "" : "ghost", f: () => hasAll(id) ? tryTurnIn(id) : say(q.remind, () => menu(id)) }); }
  }
  if (id === "mirmir") { if (S.q.mirmir === 0) list.unshift({ t: "🥯 Ne istiyorsun?", cls: "", f: () => say(MIRMIR.ask, () => { S.q.mirmir = 1; toast("📜 Yeni görev: Mırmır'a bir simit getir"); snd.quest(); save(); if (S.inv.simit > 0) giveMirmir(); else menu(id); }) }); else if (S.q.mirmir === 1 && S.inv.simit > 0) list.unshift({ t: "🥯 Simiti ver", cls: "", f: giveMirmir }); }
  if (id === "sukru") list.unshift({ t: "🛒 Alışveriş", cls: "", f: () => X.shop.open() });
  if (id === "mirmir" && S.q.mirmir === 2) list.unshift({ t: "🧩 Gece bilmecesi", f: () => X.riddle(id) });
  X.sideItems(id).reverse().forEach(it => list.splice(1, 0, it));
  if (id === "dede") { list.unshift({ t: "🌳 Pınar hakkında sor", f: () => say(dedeLines(), () => menu(id)) }); }
  if (S.inv.flower > 0 || S.inv.simit > 0) list.push({ t: "🎁 Hediye ver", f: () => giftMenu(id) });
  if (hearts(id) >= 3 && !S.secrets[id]) list.push({ t: "🗝️ Sırrını sor", cls: "", f: () => say([d.secret], () => { S.secrets[id] = true; award("sirr"); save(); menu(id); }) });
  list.push({ t: "👋 Hoşça kal", f: () => say([N(GENERIC.bye[Math.floor(Math.random() * 3)], S.name)], closeDialog) });
  setChoices(list);
}
const hasAll = id => id === "kemal" ? S.sheep === "home" : S.inv[QUESTS[id].item] >= QUESTS[id].need;
function tryTurnIn(id) {
  const q = QUESTS[id]; if (!hasAll(id)) return menu(id);
  say(q.done, () => { if (q.item !== "sheep") addItem(q.item, -q.need); S.q[id] = 2; addItem("shard"); if (id === "zehra") addItem("simit", 2); addHeart(id, 2, true); toast("💧 Pınar damlası alındı! (" + S.inv.shard + "/4)"); snd.shard(); hudObj(); updateSpring(); if (id === "cemal") W.mill.speed = 1.6; if (S.inv.shard >= 4) setTimeout(() => toast("🌙 Dört damla tamam! Geceyi bekle ve pınara git."), 1800); save(); menu(id); });
}
function giveMirmir() { addItem("simit", -1); say(MIRMIR.done, () => { S.q.mirmir = 2; addHeart("mirmir", 2, true); snd.quest(); save(); menu("mirmir"); }); }
function dedeLines() { if (S.restored) return ["Pınar yeniden nefes alıyor... teşekkürler evlat. Uzun bir uykudan uyandık hepimiz."]; if (S.inv.shard >= 4) return ["Dört damla sende... Pınara git evlat, taşın başında dur.", "Damlaları bırak. Gerisini ben hallederim."]; return ["Pınar uykuda. Dört emektar yürek, dört damla... Henüz hepsi yok: " + S.inv.shard + "/4.", "Köylülerin dertlerine derman ol, sabırlı ol evlat."]; }
function giftMenu(id) {
  const l = []; ["flower", "simit"].forEach(k => { if (S.inv[k] > 0) l.push({ t: `${ITEMS[k][0]} ${ITEMS[k][1]} ver (${S.inv[k]})`, cls: "", f: () => { addItem(k, -1); const key = "d" + S.day + id + k; const got = !S.gifted[key]; S.gifted[key] = true; if (got) addHeart(id, GIFT[k].hearts, true); say([GIFT[k].lines[id]], () => { save(); menu(id); }); } }); });
  l.push({ t: "← Geri", f: () => menu(id) }); setChoices(l);
}
function addHeart(id, n, show) { const o = hearts(id); S.hearts[id] = clamp(o + n, 0, 5); if (S.hearts[id] > o) { if (show) { toast(`💖 ${NPCS[id].name.split(" ")[0]} ile dostluk: ${S.hearts[id]}/5`); snd.heart(); } if (S.hearts[id] >= 5) award("dost"); } showHearts(id); }
function muhtarFlow() {
  const intro = !S.intro;
  const opts = () => { const l = [];
    l.push({ t: "💬 Sohbet et", f: () => chatMode("muhtar") }); X.sideItems("muhtar").forEach(it => l.push(it)); l.push({ t: "❓ Neler oluyor?", f: () => say(MUHTAR.story, () => menu2()) });
    l.push({ t: "💧 Damlalar nasıl?", f: () => say([S.restored ? MUHTAR.finale[0] : S.inv.shard >= 4 ? MUHTAR.allDone : MUHTAR.remind.replace("{shards}", S.inv.shard)], () => menu2()) });
    if (S.inv.flower > 0 || S.inv.simit > 0) l.push({ t: "🎁 Hediye ver", f: () => giftMenu("muhtar") });
    if (hearts("muhtar") >= 3 && !S.secrets.muhtar) l.push({ t: "🗝️ Sırrını sor", f: () => say([NPCS.muhtar.secret], () => { S.secrets.muhtar = true; award("sirr"); save(); menu2(); }) });
    l.push({ t: "👋 Hoşça kal", f: () => say([N(GENERIC.bye[0], S.name)], closeDialog) }); return l; };
  const menu2 = () => { dlg.mode = "menu"; showHearts("muhtar"); setChoices(opts()); };
  muhtarMenu = menu2;
  if (intro) { say(MUHTAR.intro.concat(MUHTAR.story), () => { S.intro = true; toast("📜 Görev: 4 Pınar damlası topla"); snd.quest(); hudObj(); save(); menu2(); }); }
  else if (S.restored && !S.gifted.finaleThanks) { S.gifted.finaleThanks = true; say(MUHTAR.finale, () => menu2()); }
  else say([N(GENERIC.hello[1], S.name)], () => menu2());
}
function chatMode(id) {
  dlg.mode = "chat"; dq.ch.innerHTML = ""; dq.form.hidden = false; dq.tx.textContent = "Bir şey yaz ve gönder. (Esc: geri)"; dq.inp.value = ""; dq.inp.focus();
  const back = document.createElement("button"); back.className = "btn sm ghost"; back.textContent = "← Geri"; back.onclick = () => { dq.form.hidden = true; menu(id); }; dq.ch.appendChild(back);
}
dq.form.addEventListener("submit", async ev => {
  ev.preventDefault(); const text = dq.inp.value.trim().slice(0, 160); if (!text || dlg.mode !== "chat" && dlg.mode !== "wait") return; const id = dlg.id; dq.inp.value = ""; dlg.mode = "wait"; snd.blip();
  S.chats++; const dayKey = id + S.day; if (!S.chatDay[dayKey]) { S.chatDay[dayKey] = 1; addHeart(id, 1, true); }
  const mem = S.mem[id] = S.mem[id] || []; mem.push(["p", text]); dq.tx.textContent = "💭 " + NPCS[id].name.split(" ")[0] + " düşünüyor..."; dq.note.textContent = "";
  let reply = null, note = "";
  if (settings.ai) { try { const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch(API + "/api/koy/chat", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.signal, body: JSON.stringify({ npc: id, text, ctx: { name: S.name, hearts: hearts(id), hour: Math.floor(S.t), sis: Math.round(sis * 100), shards: S.inv.shard, q: S.q, restored: S.restored, intro: S.intro, holding: S.inv, mem: mem.slice(-7, -1) } }) });
    clearTimeout(to); const j = await r.json(); if (j.mode === "ai" && j.text) reply = j.text; else note = j.note || ""; } catch (e) { note = "Bağlantı yok, hazır diyaloglar kullanılıyor."; } }
  if (!reply) { reply = fallbackReply(id, text); if (!note && settings.ai) note = ""; }
  mem.push(["n", reply]); if (mem.length > 12) mem.splice(0, mem.length - 12); save();
  dq.note.textContent = note; dlg.mode = "chat"; typeText(reply, () => { dq.form.hidden = false; dq.inp.focus(); });
});
function closeDialog() { clearInterval(dlg.timer); dlg.open = false; dq.box.hidden = true; dq.form.hidden = true; const e = NPC[dlg.id]; if (e) e.talking = false; dlg.id = null; save(); }

let lockInput = false;
function objMenu(em, nm, text, list) { dlg.open = true; dlg.id = null; dq.box.hidden = false; dq.em.textContent = em; dq.nm.textContent = nm; dq.hr.textContent = ""; dq.note.textContent = ""; dlg.mode = "menu"; dq.tx.textContent = text; setChoices(list); }
const closeObj = () => closeDialog();
const fadeOut = async () => { $("fade").classList.add("on"); await wait(800); };
const fadeIn = async () => { $("fade").classList.remove("on"); await wait(500); };
/* ================= bank, pınar, final ================= */
function benchMenu() {
  dlg.open = true; dlg.id = null; dq.box.hidden = false; dq.em.textContent = "🪑"; dq.nm.textContent = "Bank"; dq.hr.textContent = ""; dq.note.textContent = ""; dlg.mode = "menu"; dq.tx.textContent = `Saat ${hhmm(S.t)}. Biraz dinlenmek ister misin?`;
  const l = []; [[18, "🌆 Akşama kadar dinlen (18:00)"], [22, "🌙 Geceye kadar dinlen (22:00)"], [7, "☀️ Sabaha kadar uyu (07:00)"]].forEach(([h, t]) => l.push({ t, f: () => { closeDialog(); rest(h); } })); l.push({ t: "← Vazgeç", f: closeDialog }); setChoices(l);
}
async function rest(h) { resting = true; const f = $("fade"); f.classList.add("on"); await wait(900); if (h <= S.t) { S.day++; } S.t = h; updateTime(); f.classList.remove("on"); await wait(600); resting = false; toast(`🕐 Saat ${hhmm(S.t)}`); save(); }
const wait = ms => new Promise(r => setTimeout(r, ms));
function pondInteract() {
  if (S.restored) return toast("💧 Pınar huzurla parlıyor.");
  if (S.inv.shard < 4) return toast(S.inv.shard ? `Pınar sessiz. ${S.inv.shard}/4 damla topladın, gerisini bul.` : "Pınar sessiz ve soğuk. Işığı sönmüş...");
  if (!isNight()) return toast("🌙 Pınar yalnız karanlıkta uyanıyor. Kahvehane bankında dinlenip geceyi bekle.");
  finale();
}
async function finale() {
  cine = true; const cn = $("cine"); const say2 = async (t, ms) => { cn.textContent = t; cn.classList.add("on"); await wait(ms); cn.classList.remove("on"); await wait(400); };
  snd.finale(); await say2("Dört damla pınara bırakıldı...", 2200);
  for (let i = 0; i < 4; i++) { const sh = W.makePickup("shard", POND.x + Math.cos(i * 1.57 + .4) * 4, POND.z + Math.sin(i * 1.57 + .4) * 4, 3); await wait(500); W.removePickup(sh); S.inv.shard--; hudInv(); snd.shard(); S.restoredShards = (S.restoredShards || 0) + 1; W.spring.set(S.restoredShards, 0.2); }
  await say2("Pınar nefes alıyor...", 1800);
  const t0 = performance.now(); await new Promise(res => { const f = () => { const k = clamp((performance.now() - t0) / 9000, 0, 1); glow = k; sis = lerp(sis, .05, .02 + k * .03); W.spring.set(4, k); if (k < 1) requestAnimationFrame(f); else res(); }; f(); });
  S.restored = true; award("kurtar"); W.mill.speed = Math.max(W.mill.speed, 1.2); await say2("Sis çekildi. Işık geri döndü.", 2800); save();
  fetch(API + "/api/koy/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "finish" }) }).catch(() => {});
  cine = false; hudObj(); showEnd();
}
function showEnd() {
  const hs = Object.values(S.hearts).reduce((a, b) => a + b, 0);
  const txt = `🏘️ Sisli Pınar Köyü: pınarı ${S.day}. günde uyandırdım! ${hs}/40 kalp, ${Object.keys(S.secrets).length} sır, ${S.chats} sohbet.`;
  $("end").hidden = false; $("eBody").innerHTML = `<h2>✨ Pınar Uyandı!</h2><p class="muted">Sis çekildi, köy yeniden nefes alıyor. Teşekkürler ${S.name || "Misafir"}.</p>
    <div class="stats"><div class="stat"><b>${S.day}</b><span>gün</span></div><div class="stat"><b>${hs}/40</b><span>kalp</span></div><div class="stat"><b>${Object.keys(S.secrets).length}/8</b><span>sır</span></div><div class="stat"><b>${S.chats}</b><span>sohbet</span></div><div class="stat"><b>${S.coins}</b><span>altın</span></div><div class="stat"><b>${Math.round(S.steps / 10) * 10}</b><span>adım</span></div></div>
    <div class="row"><button class="btn" id="eCont">🌅 Köyde gezmeye devam et</button><button class="btn ghost" id="eShare">📤 Paylaş</button></div>`;
  $("eCont").onclick = () => { $("end").hidden = true; S.t = 5.8; updateTime(); }; $("eShare").onclick = () => { navigator.clipboard && navigator.clipboard.writeText(txt + " " + location.href); toast("Sonuç kopyalandı ✓"); };
}
function updateSpring() { W.spring.set(S.restored ? 4 : S.inv.shard, S.restored ? 1 : 0); }

/* ================= paneller ================= */
const NPCS_Q = { mektup: "muhtar", mantar: "zehra", balik: "kemal", hazine: "hacer" };
function journal() {
  const st = (q, extra) => S.q[q] === 2 ? "✅ Tamamlandı" : S.q[q] === 1 ? "🟡 " + extra : "⚪ Henüz alınmadı";
  const hr = id => "♥".repeat(hearts(id)) + "♡".repeat(5 - hearts(id));
  $("jBody").innerHTML = `<h2>📖 Günlük</h2><p><b>Hedef:</b> ${objective()}</p>
    <h3>Görevler</h3><ul class="jl"><li>🌾 <b>Zehra Abla</b> (fırın): ${st("zehra", `buğday ${S.inv.wheat}/3, tarlalar batıda`)}</li><li>📜 <b>Hacer Nine</b>: ${st("hacer", `sayfa ${S.inv.page}/3: eski kuyu, değirmen, yamaç taşları`)}</li><li>⚙️ <b>Cemal Usta</b> (değirmen): ${st("cemal", `çark ${S.inv.gear}/3: araba, dere kenarı, ağıl yanı`)}</li><li>🐑 <b>Çoban Kemal</b>: ${st("kemal", S.sheep === "home" ? "Kemal'e haber ver" : "Pamuk doğu yamacında")}</li><li>🐱 <b>Mırmır</b> (gece): ${st("mirmir", "bir simit getir")}</li></ul>
    <h3>Yan görevler</h3><ul class="jl">${Object.entries(SIDE).map(([k, q]) => `<li>${q.icon} <b>${NPCS[q.giver].name.split(" ").slice(-2).join(" ")}</b>: ${S.q[k] === 2 ? "✅ Tamamlandı" : S.q[k] === 1 ? "🟡 " + q.label : "⚪ " + (k === "mektup" ? (S.intro ? "Muhtar'la konuş" : "Önce Muhtar ile tanış") : S.q[NPCS_Q[k]] === 2 ? "Yeni iş var, konuş" : "Önce ana görevi bitir")}</li>`).join("")}</ul>
    <h3>Cüzdan ve evim</h3><p>🪙 ${S.coins} altın · 🐟 ${S.fishTotal} balık · ⛏️ ${S.digTotal} kazı · ${S.entered ? "🏠 Evin hazır (güney yol, mavi çatılı ev)" : "🏠 Güneydeki mavi çatılı ev senin"}</p>
    <h3>Dostluklar</h3><div class="friends">${NPC_IDS.map(id => `<div><span>${NPCS[id].emoji} ${NPCS[id].name}</span><span class="hr">${hr(id)}</span>${S.secrets[id] ? " 🗝️" : ""}</div>`).join("")}</div>
    <h3>Başarımlar</h3><div class="ach">${Object.entries(ACH).map(([k, a]) => `<div class="${S.ach.includes(k) ? "on" : ""}" title="${a[2]}"><span>${a[0]}</span><b>${a[1]}</b><small>${a[2]}</small></div>`).join("")}</div>
    <p class="muted small">İpucu: Pınar yalnızca geceleri uyanır. Banklarda ya da evinde (yatak) dinlenerek zamanı ilerletebilirsin. F: fotoğraf. Yağmurda balık daha çok vurur.</p>`;
}
function menuPanel() {
  const sl = (k, l) => `<label>${l} <input type="range" min="0" max="1" step=".05" value="${settings[k]}" data-k="${k}"></label>`;
  $("mBody").innerHTML = `<h2>⏸️ Duraklatıldı</h2><div class="mgrid">${sl("master", "Genel ses")}${sl("music", "Müzik")}${sl("sfx", "Efektler")}${sl("sens", "Kamera hassasiyeti").replace('max="1"', 'max="2"')}</div>
    <div class="row"><button class="btn sm ${settings.quality === "high" ? "" : "ghost"}" data-q="high">Kalite: Yüksek</button><button class="btn sm ${settings.quality === "low" ? "" : "ghost"}" data-q="low">Kalite: Düşük</button><button class="btn sm ${settings.ai ? "" : "ghost"}" id="mAI">🤖 Yapay zekâ sohbet: ${settings.ai ? "açık" : "kapalı"}</button></div>
    <p class="muted small">Kalite değişikliği sayfa yenilenince uygulanır.</p>
    <details class="rules"><summary>Kontroller</summary><ul><li>W A S D / ok tuşları: yürü · Shift: koş · Boşluk: zıpla</li><li>Fare sürükle ya da tıklayıp kilitle: kamera · E: konuş / etkileşim</li><li>F: fotoğraf · J: günlük · P veya Esc: duraklat · Mobil: sol joystick + sağ tarafı sürükle</li></ul></details>
    <div class="row"><button class="btn" id="mBack">▶️ Devam et</button><button class="btn ghost" id="mSave">💾 Kaydet</button><button class="btn danger" id="mNew">🗑️ Yeni oyun</button></div>`;
  $$("#mBody input[type=range]").forEach(r => r.oninput = () => { settings[r.dataset.k] = +r.value; snd.vol = { master: settings.master, music: settings.music, sfx: settings.sfx }; snd.apply(); saveSet(); });
  $$("#mBody [data-q]").forEach(b => b.onclick = () => { settings.quality = b.dataset.q; saveSet(); menuPanel(); });
  $("mAI").onclick = () => { if (STATIC) return toast("Bu sürümde yapay zekâ sohbeti kapalı; hazır diyaloglar kullanılıyor."); settings.ai = !settings.ai; saveSet(); menuPanel(); };
  $("mBack").onclick = () => togglePanel("menu", false); $("mSave").onclick = () => { save(); toast("Kaydedildi ✓"); };
  $("mNew").onclick = () => { if (confirm("Tüm ilerleme silinecek. Emin misin?")) { localStorage.removeItem(SAVE); location.reload(); } };
}
const $$ = s => [...document.querySelectorAll(s)];
function togglePanel(name, on) { const p = $(name); const open = on == null ? p.hidden : on; if (name === "journal" && open) journal(); if (name === "menu" && open) menuPanel(); p.hidden = !open; paused = $("menu").hidden === false || $("journal").hidden === false; if (open && document.pointerLockElement) document.exitPointerLock(); }

/* ================= girdi ================= */
const keys = {}; let playing = false, paused = false, started = false;
const joy = { x: 0, y: 0, id: null }; const touchLook = { id: null, x: 0, y: 0 };
addEventListener("keydown", e => {
  if (e.target === dq.inp) { if (e.key === "Escape") { dq.inp.blur(); const id = dlg.id; dq.form.hidden = true; dlg.mode = "menu"; menu(id); } return; }
  keys[e.code] = true; if (!playing) return;
  if (dlg.open) { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); if (dlg.mode === "lines") next(); } if (/^Digit[1-9]$/.test(e.code)) { const b = dq.ch.children[+e.code.slice(5) - 1]; if (b) b.click(); } if (e.code === "Escape" && dlg.mode !== "chat") closeDialog(); return; }
  if (e.code === "Escape" && X.fish.active) { X.fish.end(); return; } if (e.code === "KeyE") interact(); else if (e.code === "KeyJ") togglePanel("journal"); else if (e.code === "KeyF") X.photo.start(); else if (e.code === "KeyP" || e.code === "Escape") togglePanel("menu");
  if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
});
addEventListener("keyup", e => keys[e.code] = false);
dq.ch.addEventListener("click", () => { });
dq.tx.addEventListener("click", () => { if (dlg.open && dlg.mode === "lines") next(); });
let drag = null;
stage.addEventListener("pointerdown", e => {
  if (!playing) return; if (e.pointerType === "touch") { const r = stage.getBoundingClientRect(); if (e.clientX - r.left > r.width * .4 && touchLook.id == null) { touchLook.id = e.pointerId; touchLook.x = e.clientX; touchLook.y = e.clientY; } return; }
  drag = { x: e.clientX, y: e.clientY }; if (!paused && !dlg.open && e.button === 0 && !(e.target.closest && e.target.closest(".ui"))) { /* tıklayınca fare kilidi */ stage.requestPointerLock && stage.requestPointerLock(); }
});
addEventListener("pointerup", e => { drag = null; if (e.pointerId === touchLook.id) touchLook.id = null; if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; $("knob").style.transform = ""; } });
addEventListener("pointermove", e => {
  if (!playing || paused) return; const s = .005 * settings.sens;
  if (document.pointerLockElement === stage) { cam.yaw -= e.movementX * s; cam.pitch = clamp(cam.pitch + e.movementY * s, .05, 1.2); return; }
  if (e.pointerId === touchLook.id) { cam.yaw -= (e.clientX - touchLook.x) * s * 1.4; cam.pitch = clamp(cam.pitch + (e.clientY - touchLook.y) * s * 1.4, .05, 1.2); touchLook.x = e.clientX; touchLook.y = e.clientY; return; }
  if (e.pointerId === joy.id) { const r = $("joy").getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const m = Math.hypot(dx, dy), mx = r.width / 2; if (m > mx) { dx *= mx / m; dy *= mx / m; } joy.x = dx / mx; joy.y = dy / mx; $("knob").style.transform = `translate(${dx}px,${dy}px)`; return; }
  if (drag && e.pointerType !== "touch") { cam.yaw -= (e.clientX - drag.x) * s; cam.pitch = clamp(cam.pitch + (e.clientY - drag.y) * s, .05, 1.2); drag.x = e.clientX; drag.y = e.clientY; }
});
stage.addEventListener("wheel", e => { cam.tdist = clamp(cam.tdist + e.deltaY * .01, 3.5, 13); }, { passive: true });
document.addEventListener("pointerlockchange", () => { if (!document.pointerLockElement && playing && !dlg.open && !cine && !$("end").hidden === false && $("menu").hidden && $("journal").hidden && started && P.lockWas) togglePanel("menu", true); P.lockWas = !!document.pointerLockElement; });
$("joy").addEventListener("pointerdown", e => { joy.id = e.pointerId; e.target.setPointerCapture && $("joy").setPointerCapture(e.pointerId); e.stopPropagation(); joyMove(e); }); const joyMove = e => { const r = $("joy").getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const m = Math.hypot(dx, dy), mx = r.width / 2; if (m > mx) { dx *= mx / m; dy *= mx / m; } joy.x = dx / mx; joy.y = dy / mx; $("knob").style.transform = `translate(${dx}px,${dy}px)`; };
$("btnE").addEventListener("click", interact); $("btnP").addEventListener("click", () => X.photo.start()); $("btnJ").addEventListener("click", () => togglePanel("journal")); $("btnM").addEventListener("click", () => togglePanel("menu"));
$("btnJump").addEventListener("pointerdown", () => { if (P.y <= (P.inside ? INT.y : terrainH(P.x, P.z)) + .05) P.vy = 6.2; });
$("jClose").onclick = () => togglePanel("journal", false);

/* ================= giriş ekranı ================= */
const intro = $("intro"); const hasSave = !!LS.get(SAVE, null) && S.name;
$("iName").value = S.name || ""; if (hasSave) $("iCont").hidden = false;
function begin() { snd.init(); snd.apply(); intro.hidden = true; cam.tdist = 7.5; cam.dist = 7.5; cam.pitch = .38; cam.yaw = P.yaw - Math.PI; playing = true; started = true; $("hud").hidden = false; document.body.classList.add("ingame"); P.lockWas = false; if (!S.name) S.name = ($("iName").value.trim() || "Misafir").slice(0, 16); save(); hudInv(); hudObj(); hudClock(); toast("W A S D ile yürü, E ile konuş 🏘️"); if (!S.intro) setTimeout(() => toast("Önce meydandaki Muhtar Rıza Amca ile konuş."), 3500); }
$("iStart").onclick = () => { if (hasSave) { if (!confirm("Kayıtlı oyun silinip yeni oyun başlayacak. Emin misin?")) return; resetS(); Object.assign(P, { x: PLACES.start[0], z: PLACES.start[1], yaw: Math.PI }); spawnPickups(); updateSpring(); } begin(); };
$("iCont").onclick = begin; $("iName").addEventListener("keydown", e => { if (e.key === "Enter") $("iStart").click(); });

/* ================= ana döngü ================= */
function updateTime() { W.setTime(S.t, sis, glow); hudClock(); }
let last = performance.now(), stepT = 0, saveT = 0, hudT = 0, tm = 0, fpsC = 0, fpsT = 0, lastDay = S.day;
function frame(now) {
  requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
  fpsC++; fpsT += dt; if (fpsT > 1) { window.__fps = fpsC; fpsC = 0; fpsT = 0; }
  if (!started) { cam.yaw += dt * .08; cam.pitch = .32; cam.tdist = 40; camUpdate(0, 8, 8, true); W.setTime(S.t, sis); W.update(dt, T, { x: 0, z: 0 }); renderer.render(scene, camera); return; }
  if (playing && !paused && !cine) {
    if (!dlg.open && !resting) S.t += dt * (24 / 720); if (S.t >= 24) { S.t -= 24; S.day++; }
    if (S.day !== lastDay) { lastDay = S.day; S.fl = { day: S.day, ids: [] }; S.dug = { day: S.day, ids: [] }; spawnPickups(); }
    if (!dlg.open && !resting && !lockInput) movePlayer(dt);
  }
  sis = lerp(sis, sisTarget(), Math.min(1, dt * .5)); if (!cine) glow = lerp(glow, S.restored ? 1 : 0, Math.min(1, dt * .5));
  tm += dt; if (tm > .1) { tm = 0; W.setTime(S.t, sis, glow); }
  NPC_IDS.forEach(id => { const e = NPC[id]; if (e.d.tree) return; npcPlan(e, dt); npcMove(e, dt); });
  const ng = NPC.dede; ng.talking = dlg.open && dlg.id === "dede"; sheeps.forEach(s => sheepUpdate(s, dt));
  // konuşma: NPC ve oyuncu birbirine döner
  if (dlg.open && dlg.id && !NPC[dlg.id].d.tree) { const e = NPC[dlg.id]; e.yaw = Math.atan2(P.x - e.x, P.z - e.z); P.yaw = lerpAng(P.yaw, Math.atan2(e.x - P.x, e.z - P.z), .12); }
  W.update(dt, T, P); updateSpring2(); X.rain.update(dt); X.fish.update(dt); X.house.update(dt); X.fest.update(dt);
  player.position.set(P.x, P.y, P.z); player.rotation.y = P.yaw; animateHuman(player, P.moving ? (P.run ? 6 : 3) : 0, T); lantern.intensity = (P.inside ? 0 : (W.night || 0) * 9 * (S.owned.fener ? 1.9 : 1)); lantern.distance = S.owned.fener ? 24 : 14;
  camUpdate(dt);
  if (playing) { target = (!dlg.open && !cine && !resting && !paused) ? findTarget() : null; const pr = $("prompt"); if (target) { pr.hidden = false; pr.textContent = `[E] ${target.label}`; } else pr.hidden = true; $("btnE").classList.toggle("on", !!target); }
  snd.ambient(dt, W.night || 0, sis, Math.hypot(P.x - POND.x, P.z - POND.z), P.moving);
  hudT += dt; if (hudT > .25) { hudT = 0; hudClock(); drawMini(); if ((S.t >= 2 && S.t < 4.5) && !dlg.open) award("gece"); if (S.steps >= 5000) award("yuru"); if (document.activeElement !== dq.inp) hudObj(); }
  saveT += dt; if (saveT > 15 && playing) { saveT = 0; S.pos = P.inside ? [W.home.doorX, W.home.doorZ] : [P.x, P.z]; S.yaw = P.yaw; save(); }
  renderer.render(scene, camera); X.photo.after();
}
let springShown = -1; function updateSpring2() { const v = S.restored ? 4 : S.inv.shard; if (v !== springShown) { springShown = v; updateSpring(); } }
function movePlayer(dt) {
  let ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x, iz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y;
  const m = Math.hypot(ix, iz); if (m > 1) { ix /= m; iz /= m; }
  const run = keys.ShiftLeft || keys.ShiftRight || m > .85 && joy.id != null; P.run = run && m > .1; P.moving = m > .08;
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
  const sp = (run ? 7 : 3.9) * (S.owned.cizme ? 1.25 : 1) * dt;
  if (P.moving) { const dx = (fx * iz + rx * ix), dz = (fz * iz + rz * ix); P.x += dx * sp; P.z += dz * sp; P.yaw = lerpAng(P.yaw, Math.atan2(dx, dz), Math.min(1, dt * 12)); S.steps += sp * 1.3; stepT -= dt; if (stepT <= 0) { stepT = run ? .26 : .38; snd.step(run); } }
  let gy; if (P.inside) { P.x = clamp(P.x, -INT.hx, INT.hx); P.z = clamp(P.z, -INT.hz, INT.hz + .5); X.I.cols.forEach(([x, z, r]) => { const dx = P.x - x, dz = P.z - z, d = Math.hypot(dx, dz), m = r + .4; if (d < m && d > 1e-4) { P.x = x + dx / d * m; P.z = z + dz / d * m; } }); gy = INT.y; } else { W.resolve(P, .45); gy = terrainH(P.x, P.z); }
  if ((keys.Space) && P.y <= gy + .05) P.vy = 6.2; P.vy -= 16 * dt; P.y += P.vy * dt; if (P.y < gy) { P.y = gy; P.vy = 0; }
  W.collectNear = null; if (!P.inside) W.pickups.slice().forEach(p => { if (Math.hypot(p.userData.x - P.x, p.userData.z - P.z) < 1.5) collect(p); });
}
function camUpdate(dt, ox = 0, oy = 0, snap = false) {
  cam.dist = lerp(cam.dist, dlg.open && dlg.id ? 4.4 : cam.tdist, snap ? 1 : Math.min(1, (dt || .016) * 3));
  const tx = P.x, ty = P.y + 1.6, tz = P.z; let cx, cy, cz;
  if (!started) { cx = Math.sin(cam.yaw) * 55; cz = Math.cos(cam.yaw) * 55; cy = 28; camera.position.set(cx, cy, cz); camera.lookAt(0, 4, 0); return; }
  if (cine) { const k = performance.now() / 5000; cx = POND.x + Math.cos(k) * 16; cz = POND.z + Math.sin(k) * 16; cy = 6 + glow * 4; camera.position.lerp(new THREE.Vector3(cx, cy, cz), .05); camera.lookAt(POND.x, 1.5 + glow * 3, POND.z); return; }
  const cp = Math.cos(cam.pitch); cx = tx + Math.sin(cam.yaw) * cp * cam.dist; cz = tz + Math.cos(cam.yaw) * cp * cam.dist; cy = ty + Math.sin(cam.pitch) * cam.dist;
  if (P.inside) { cx = clamp(cx, -4.7, 4.7); cz = clamp(cz, -4.2, 4.2); cy = clamp(cy, INT.y + .8, INT.y + 3.9); camera.position.set(cx, cy, cz); camera.lookAt(tx, ty, tz); return; }
  for (const c of W.colliders) { if (c.r < 2) continue; const dx = cx - c.x, dz = cz - c.z, d = Math.hypot(dx, dz); if (d < c.r + .6 && cy < terrainH(c.x, c.z) + 9) { cx = c.x + dx / (d || 1) * (c.r + .6); cz = c.z + dz / (d || 1) * (c.r + .6); } }
  cy = Math.max(cy, terrainH(cx, cz) + .9); camera.position.set(cx, cy, cz); camera.lookAt(tx, ty, tz);
}

/* ================= ek sistemler ================= */
const X = initSystems({ scene, camera, renderer, S, P, W, snd, toast, save, award, addItem, addHeart, say, setChoices, objMenu, closeObj, menu, rest, isNight, hudInv, hudObj, dq, hhmm, cam, wait, fadeOut, fadeIn, updateTime, closeDialog, nightF: () => W.night || 0, lock: v => { lockInput = v; } });
{ const hl = makeLabel("Evim"); hl.position.set(W.home.x, terrainH(W.home.x, W.home.z) + 6.6, W.home.z); scene.add(hl); }
X.house.refresh();
/* ================= başlat ================= */
spawnPickups(); updateSpring(); if (S.q.cemal === 2) W.mill.speed = 1.6; if (S.restored) { W.mill.speed = 1.6; sis = .05; glow = 1; }
sis = S.restored ? .05 : sisTarget(); updateTime(); hudInv(); hudObj(); hudClock(); menuPanel();
requestAnimationFrame(frame);
window.__koy = { X,  S, P, W, NPC, cam, pamuk, snd, settings, ready: true, teleport(x, z) { P.x = x; P.z = z; P.y = terrainH(x, z); }, setTime(t) { S.t = t; updateTime(); }, give(k, n = 1) { addItem(k, n); }, open: openDialog, finale, collect, find: findTarget, interact, begin, say, closeDialog, dlg, journal, togglePanel, rest, spawnPickups, render() { renderer.render(scene, camera); }, setSis(v) { sis = v; }, get playing() { return playing; } };
