// Sisli Pınar Köyü: ek sistemler (hava, balık, kazı, dükkân, ev, şenlik, fotoğraf, bilmece, yan görevler)
import * as THREE from "three";
import { FISH, SHOP, BUY_ITEMS, SELL_PRICE, RIDDLES, SIDE, LETTER_TO, NPCS } from "./data.js";
import { INT, buildInterior } from "./interior.js";
import { POND, SPOTS, rng, terrainH } from "./world.js";

const hash = n => { const h = Math.sin(n * 127.1 + 311.7) * 43758.5453; return h - Math.floor(h); };
const $ = id => document.getElementById(id);

export function initSystems(c) {
  const { scene, camera, renderer, S, P, W, snd, toast, save, award, addItem, addHeart, say, setChoices, objMenu, menu, rest, isNight, hudInv, hudObj } = c;
  const X = {};
  const owned = () => S.owned;
  const coin = n => { S.coins += n; if (n > 0) { S.earned += n; if (S.earned >= 300) award("zengin"); } hudInv(); };
  X.coin = coin;

  /* ---------- hava ---------- */
  const RN = 1500, rg = new THREE.BufferGeometry(), rp = new Float32Array(RN * 3);
  for (let i = 0; i < RN; i++) { rp[i * 3] = (Math.random() - .5) * 34; rp[i * 3 + 1] = Math.random() * 24; rp[i * 3 + 2] = (Math.random() - .5) * 34; }
  rg.setAttribute("position", new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.Points(rg, new THREE.PointsMaterial({ color: 0xbfd8ff, size: .09, transparent: true, opacity: 0, depthWrite: false })); rain.frustumCulled = false; scene.add(rain);
  const wx = { I: 0, flash: 0, thunderIn: -1 };
  const rainFor = (day, t) => { if (hash(day * 3.1) > .32) return 0; const st = 7 + hash(day + 7) * 9, len = 3 + hash(day + 3) * 5; return t >= st && t < st + len ? 1 : 0; };
  X.rain = {
    get I() { return wx.I; },
    update(dt) {
      const tg = P.inside ? 0 : rainFor(S.day, S.t); wx.I += (tg - wx.I) * Math.min(1, dt * .35);
      rain.material.opacity = wx.I * .65; rain.visible = wx.I > .02; snd.setRain(wx.I);
      if (rain.visible) { const a = rg.attributes.position; for (let i = 0; i < RN; i++) { let y = a.getY(i) - dt * 22; if (y < 0) y += 24; a.setY(i, y); a.setX(i, a.getX(i) - dt * 2.2); } a.needsUpdate = true; rain.position.set(camera.position.x, camera.position.y - 6, camera.position.z); }
      if (wx.I > .8 && wx.thunderIn < 0 && Math.random() < dt * .04) { wx.flash = 1; wx.thunderIn = .6 + Math.random(); }
      if (wx.thunderIn >= 0) { wx.thunderIn -= dt; if (wx.thunderIn < 0) { snd.thunder(); } }
      wx.flash = Math.max(0, wx.flash - dt * 2.5); renderer.toneMappingExposure = 1.05 + wx.flash * 1.4;
    },
  };

  /* ---------- balık tutma ---------- */
  const fish = { st: "idle", t: 0, biteT: 0 };
  const bob = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0x551111 })); bob.visible = false; scene.add(bob);
  const stick = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]), new THREE.LineBasicMaterial({ color: 0xffffff })); stick.visible = false; scene.add(stick);
  const fui = $("fishUI");
  const fsay = t => { fui.hidden = !t; fui.textContent = t || ""; };
  const nearPond = () => { const d = Math.hypot(P.x - POND.x, P.z - POND.z); return d > POND.r - 1.5 && d < POND.r + 4.2; };
  X.fish = {
    get active() { return fish.st !== "idle"; },
    can: () => owned().olta && nearPond() && !P.inside,
    label: () => fish.st === "bite" ? "ÇEK!" : fish.st === "wait" ? "Bekle... (çıkmak için ESC/E)" : "Olta at 🎣",
    press() {
      if (fish.st === "idle") { if (!X.fish.can()) return; const dx = P.x - POND.x, dz = P.z - POND.z, d = Math.hypot(dx, dz) || 1; bob.position.set(POND.x + dx / d * (POND.r - 2), W.pondY + .05, POND.z + dz / d * (POND.r - 2)); bob.visible = stick.visible = true; fish.st = "wait"; fish.t = (2 + Math.random() * 3.5) * (wx.I > .3 ? .65 : 1); fsay("🎣 Olta atıldı... balık bekleniyor"); snd.blip(); }
      else if (fish.st === "wait") { fsay("Çok erken çektin, balık ürktü."); X.fish.end(1.4); snd.bad(); }
      else if (fish.st === "bite") X.fish.catchIt();
    },
    end(delay = 0) { fish.st = "idle"; bob.visible = stick.visible = false; if (delay) setTimeout(() => { if (fish.st === "idle") fsay(""); }, delay * 1000); else fsay(""); },
    catchIt() {
      const w = Object.entries(FISH).map(([k, f]) => { let x = f.w; if (f.night && !isNight()) x = 0; if (f.rain && wx.I > .3) x *= f.rain; if (owned().olta2 && f.p >= 22) x *= 1.7; if (owned().olta2 && f.junk) x *= .4; return [k, x]; });
      let r = Math.random() * w.reduce((a, b) => a + b[1], 0), key = "hamsi"; for (const [k, x] of w) { r -= x; if (r <= 0) { key = k; break; } }
      const f = FISH[key]; fish.st = "idle"; bob.visible = stick.visible = false;
      if (f.junk) { fsay(`${f.e} ${f.n} çıktı... Olsun.`); snd.bad(); setTimeout(() => fsay(""), 1800); return; }
      S.fishBag.push(key); S.codex[key] = (S.codex[key] || 0) + 1; S.fishTotal++; addItem("fish"); snd.shard();
      fsay(`${f.e} ${f.n} yakaladın! (${f.p} altın)`); setTimeout(() => fsay(""), 2400);
      if (S.fishTotal >= 10) award("balik"); if (key === "altin") award("altin"); if (wx.I > .3) award("yagmur"); save(); hudObj();
    },
    update(dt) {
      if (fish.st === "idle") return;
      if (Math.hypot(P.x - bob.position.x, P.z - bob.position.z) > 9 || P.inside) { fsay("Olta toplandı."); X.fish.end(1); return; }
      stick.geometry.setFromPoints([new THREE.Vector3(P.x, P.y + 1.6, P.z), bob.position.clone()]);
      const T = performance.now() / 1000;
      if (fish.st === "wait") { bob.position.y = W.pondY + .05 + Math.sin(T * 3) * .02; fish.t -= dt; if (fish.t <= 0) { fish.st = "bite"; fish.biteT = owned().olta2 ? 1.4 : 1.0; fsay("❗ BALIK VURDU! Şimdi E!"); snd.blip(); } }
      else if (fish.st === "bite") { bob.position.y = W.pondY - .12 + Math.sin(T * 30) * .04; fish.biteT -= dt; if (fish.biteT <= 0) { fsay("Balık kaçtı..."); X.fish.end(1.4); snd.bad(); } }
    },
  };
  const takeFish = n => { S.fishBag.sort((a, b) => FISH[a].p - FISH[b].p); S.fishBag.splice(0, n); S.inv.fish = S.fishBag.length; hudInv(); };
  const fishValue = () => S.fishBag.reduce((a, k) => a + FISH[k].p, 0);

  /* ---------- kazı ---------- */
  const digs = [];
  const mound = (x, z, glow) => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.ConeGeometry(.7, .45, 7), new THREE.MeshStandardMaterial({ color: 0x6b4a2a, flatShading: true })); m.position.y = .2; g.add(m);
    const r = new THREE.Mesh(new THREE.RingGeometry(.65, .85, 20), new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: .6, side: THREE.DoubleSide, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.position.y = .06; g.add(r); g.userData = { r, x, z }; g.position.set(x, terrainH(x, z), z); scene.add(g); return g; };
  X.dig = {
    spawn() {
      digs.splice(0).forEach(d => scene.remove(d));
      const R = rng(S.day * 913 + 5);
      for (let i = 0; i < 3; i++) { const a = R() * 6.283, r = 14 + R() * 52, x = Math.cos(a) * r, z = Math.sin(a) * r, id = "d" + i; if (Math.hypot(x - POND.x, z - POND.z) < 11 || S.dug.ids.includes(id) || W.houses.some(h => Math.hypot(h.position.x - x, h.position.z - z) < 5)) continue; const d = mound(x, z, 0xffe27a); d.userData.id = id; digs.push(d); }
      if (S.q.hazine === 1) SPOTS.medal.forEach(([x, z], i) => { if (S.medalDug.includes(i)) return; const d = mound(x, z, 0x66d9ff); d.userData.id = "m" + i; d.userData.medal = i; digs.push(d); });
    },
    near() { return !P.inside && digs.find(d => Math.hypot(d.userData.x - P.x, d.userData.z - P.z) < 2.2); },
    list: digs,
    async dig(d) {
      const u = d.userData; c.lock(true); toast("⛏️ Kazıyorsun..."); for (let i = 0; i < 4; i++) { snd.noise(.15, 400, .12); await c.wait(300); }
      scene.remove(d); digs.splice(digs.indexOf(d), 1);
      if (u.medal != null) { S.medalDug.push(u.medal); addItem("medal"); toast("🏅 Madalyon parçası bulundu! (" + S.inv.medal + "/3)"); snd.quest(); }
      else { S.dug.ids.push(u.id); S.digTotal++; const r = Math.random(); if (r < .5) { const n = 10 + Math.floor(Math.random() * 26); coin(n); toast(`🪙 ${n} altın buldun!`); } else if (r < .8) { addItem("antika"); toast("🏺 Eski bir antika buldun! (dükkânda 60 altın)"); } else if (r < .93) { addItem("mush"); toast("🍄 Toprağın altında bir mantar çıktı."); } else { toast("Sadece eski bir taş..."); } snd.pickup(); if (S.digTotal >= 5) award("hazine"); }
      c.lock(false); save(); hudObj();
    },
  };

  /* ---------- dükkân ---------- */
  const sellList = () => {
    const l = []; const fv = fishValue();
    if (fv > 0) l.push({ t: `🐟 Tüm balıklar (${S.fishBag.length}) +${fv}🪙`, f: () => { coin(fv); S.fishBag.length = 0; S.inv.fish = 0; hudInv(); snd.pickup(); save(); sellMenu(); } });
    Object.entries(SELL_PRICE).forEach(([k, p]) => { const n = S.inv[k] || 0; if (n > 0) l.push({ t: `${k === "mush" ? "🍄 Mantar" : k === "antika" ? "🏺 Antika" : "🌸 Çiçek"} ×${n} +${n * p}🪙`, f: () => { coin(n * p); addItem(k, -n); snd.pickup(); save(); sellMenu(); } }); });
    return l;
  };
  function shopText(extra) { return `${extra || "Buyur, ne lazım?"}  (🪙 ${S.coins})`; }
  function sellMenu() { const l = sellList(); c.dq.tx.textContent = shopText(l.length ? "Neyi satıyorsun?" : "Satacak bir şeyin yok."); l.push({ t: "← Geri", f: () => shopHome() }); setChoices(l); }
  function buyMenu() {
    const l = []; SHOP.forEach(it => { if (S.owned[it.id]) return; if (it.req && !S.owned[it.req]) return; l.push({ t: `${it.e} ${it.n} ${it.p}🪙`, f: () => { if (S.coins < it.p) { toast("Yeterli altının yok."); snd.bad(); return; } S.coins -= it.p; S.owned[it.id] = true; hudInv(); X.house.refresh(); snd.quest(); toast(`${it.e} ${it.n} satın alındı. ${it.home ? "Evinde seni bekliyor." : ""}`); save(); buyMenu(); } }); });
    BUY_ITEMS.forEach(it => l.push({ t: `${it.e} ${it.n} ${it.p}🪙`, f: () => { if (S.coins < it.p) { toast("Yeterli altının yok."); snd.bad(); return; } S.coins -= it.p; addItem(it.k); snd.pickup(); save(); buyMenu(); } }));
    c.dq.tx.textContent = shopText("Hangisini alıyorsun?"); l.push({ t: "← Geri", f: () => shopHome() }); setChoices(l);
  }
  function shopHome() { c.dq.tx.textContent = shopText(); setChoices([{ t: "💰 Sat", f: sellMenu }, { t: "🛒 Satın al", f: buyMenu }, { t: "← Menü", f: () => menu("sukru") }]); }
  X.shop = { open: shopHome };

  /* ---------- ev ---------- */
  const I = buildInterior(scene); X.I = I;
  let gramo = { on: false, t: 0 };
  X.house = {
    refresh() { I.setDecor(S.owned); },
    doorDist() { return Math.hypot(P.x - W.home.doorX, P.z - W.home.doorZ); },
    async enter() { c.lock(true); await c.fadeOut(); P.inside = true; P.x = 0; P.z = 2.4; P.y = INT.y; P.yaw = Math.PI; c.cam.yaw = 0; c.cam.pitch = .72; S.entered = true; award("ev"); X.fish.end(); await c.fadeIn(); c.lock(false); toast("🏠 Evin sıcacık."); },
    async exit() { c.lock(true); await c.fadeOut(); P.inside = false; P.x = W.home.doorX; P.z = W.home.doorZ; P.y = terrainH(P.x, P.z); P.yaw = W.home.rot; c.cam.yaw = W.home.rot + Math.PI; gramo.on = false; await c.fadeIn(); c.lock(false); },
    target() { for (const it of I.items) { if (it.need && !S.owned[it.need]) continue; if (Math.hypot(P.x - it.x, P.z - it.z) < it.r) return { kind: "in_" + it.id, label: it.label }; } return null; },
    act(kind) {
      if (kind === "in_door") return X.house.exit();
      if (kind === "in_bed") return objMenu("🛏️", "Yatak", `Saat ${c.hhmm(S.t)}. Dinlenmek ister misin?`, [[18, "🌆 Akşama kadar yat (18:00)"], [22, "🌙 Geceye kadar yat (22:00)"], [7, "☀️ Sabaha kadar uyu (07:00)"]].map(([h, t]) => ({ t, f: () => { c.closeObj(); rest(h); } })).concat([{ t: "← Vazgeç", f: () => c.closeObj() }]));
      if (kind === "in_tea") return objMenu("☕", "Semaver", "Taze çay demlendi. İçince bir saat geçer.", [{ t: "☕ Çay iç (+1 saat)", f: () => { c.closeObj(); S.t = (S.t + 1) % 24; c.updateTime(); toast("☕ Çay güzeldi."); snd.heart(); save(); } }, { t: "← Vazgeç", f: () => c.closeObj() }]);
      if (kind === "in_shelf") { const cd = Object.entries(FISH).filter(([k, f]) => !f.junk).map(([k, f]) => `${f.e} ${f.n}: ${S.codex[k] || 0}`).join("   "); return objMenu("🗄️", "Koleksiyon Rafı", `Balık defteri → ${cd}. Kazı: ${S.digTotal}, bilmece: ${S.riddles}, altın: ${S.coins}.`, [{ t: "← Kapat", f: () => c.closeObj() }]); }
      if (kind === "in_gramo") { gramo.on = !gramo.on; toast(gramo.on ? "📻 Müzik çalıyor" : "📻 Müzik durdu"); }
    },
    update(dt) {
      if (!P.inside) return; I.light.intensity = 26 * (S.owned.lamba ? 1.35 : 1); I.winM.emissiveIntensity = .3 + (1 - (c.nightF())) * .6;
      if (gramo.on) { gramo.t -= dt; if (gramo.t <= 0) { gramo.t = .42; const sc = [261.6, 293.7, 329.6, 392, 440, 523.3]; snd.tone(sc[Math.floor(Math.random() * 6)], .5, "triangle", .07); } }
    },
  };

  /* ---------- şenlik ---------- */
  const FW = []; for (let k = 0; k < 4; k++) { const n = 90, g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.2, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffffff, fog: false })); p.frustumCulled = false; scene.add(p); FW.push({ p, v: new Float32Array(n * 3), life: 0, n }); }
  const burst = (x, y, z, col) => { const f = FW.find(a => a.life <= 0) || FW[0]; const a = f.p.geometry.attributes.position; for (let i = 0; i < f.n; i++) { a.setXYZ(i, x, y, z); const u = Math.random() * 6.283, v = Math.acos(2 * Math.random() - 1), s = 6 + Math.random() * 6; f.v[i * 3] = Math.sin(v) * Math.cos(u) * s; f.v[i * 3 + 1] = Math.cos(v) * s; f.v[i * 3 + 2] = Math.sin(v) * Math.sin(u) * s; } a.needsUpdate = true; f.life = 2; f.p.material.color.setHex(col); snd.firework(); };
  let fT = 1, fAt = 0, fDay = 0;
  X.fest = {
    on: () => S.restored && S.t >= 19 && S.t < 23,
    update(dt) {
      FW.forEach(f => { if (f.life <= 0) { f.p.material.opacity = 0; return; } f.life -= dt; const a = f.p.geometry.attributes.position; for (let i = 0; i < f.n; i++) { f.v[i * 3 + 1] -= dt * 6; a.setXYZ(i, a.getX(i) + f.v[i * 3] * dt, a.getY(i) + f.v[i * 3 + 1] * dt, a.getZ(i) + f.v[i * 3 + 2] * dt); } a.needsUpdate = true; f.p.material.opacity = Math.max(0, f.life / 2); });
      if (!X.fest.on()) { fAt = 0; return; }
      if (fDay !== S.day) { fDay = S.day; toast("🎆 Köy şenliği başladı! Meydana gel."); snd.quest(); }
      fT -= dt; if (fT <= 0) { fT = 1.4 + Math.random() * 2; const a = Math.random() * 6.283, r = 6 + Math.random() * 12; burst(Math.cos(a) * r, 22 + Math.random() * 14, Math.sin(a) * r, [0xff5c7a, 0xffd36b, 0x66d9ff, 0xb78bff, 0x7dffb0][Math.floor(Math.random() * 5)]); }
      if (!P.inside && Math.hypot(P.x, P.z) < 15) { fAt += dt; if (fAt > 6) award("senlik"); }
    },
  };

  /* ---------- fotoğraf ---------- */
  let ph = 0;
  X.photo = { start() { if (ph) return; ph = 3; $("hud").style.visibility = "hidden"; },
    after() { if (!ph) return; ph--; if (ph === 0) { try { const a = document.createElement("a"); a.href = renderer.domElement.toDataURL("image/png"); a.download = "sisli-pinar-koyu.png"; a.click(); toast("📷 Fotoğraf kaydedildi"); award("foto"); } catch (e) { toast("Fotoğraf alınamadı"); } $("hud").style.visibility = ""; } } };

  /* ---------- bilmece ---------- */
  X.riddle = function (id) {
    const t = S.riddle; if (t.day === S.day && t.done) return say(["Bu gecelik bilmecem bitti miyav. Yarın gece yenisi var."], () => menu(id));
    const R = RIDDLES[(S.day + S.riddles) % RIDDLES.length];
    say(["Bir bilmece: " + R.q], () => { c.dq.tx.textContent = "Bir bilmece: " + R.q; setChoices(R.o.map((o, i) => ({ t: o, f: () => { S.riddle = { day: S.day, done: true }; if (i === R.a) { S.riddles++; coin(15); addHeart(id, 1, true); snd.quest(); toast("🧩 Doğru! +15 altın"); if (S.riddles >= 3) award("bilmece"); say(["Miyav! Zekisin. Al sana biraz altın."], () => { save(); menu(id); }); } else { snd.bad(); say(["Hımm, değil. Yarın tekrar dene miyav."], () => { save(); menu(id); }); } } }))); });
  };

  /* ---------- yan görevler ---------- */
  const unlocked = k => k === "mektup" ? S.intro : S.q[SIDE[k].giver] === 2;
  const have = k => { const q = SIDE[k]; if (k === "mektup") return Object.keys(S.letters).length >= q.to.length; return (S.inv[q.item] || 0) >= q.need; };
  function finish(k, id) {
    const q = SIDE[k]; say(q.done, () => { if (k === "mektup") { } else if (k === "balik") takeFish(q.need); else addItem(q.item, -q.need); S.q[k] = 2; coin(q.coin); if (k === "mantar") addItem("simit", 2); addHeart(id, 1, true); snd.quest(); toast(`🪙 +${q.coin} altın · görev tamam`); if (k === "mektup") award("mektup"); if (k === "mantar") award("mantar"); X.checkAll(); hudObj(); save(); menu(id); });
  }
  function start(k, id) {
    const q = SIDE[k]; say(q.offer, () => { S.q[k] = 1; if (k === "mektup") { S.letters = {}; addItem("letter", q.to.length); } if (k === "balik") { S.owned.olta = true; toast("🎣 Olta aldın! Pınar kenarında E'ye bas."); } if (k === "hazine") X.dig.spawn(); toast("📜 Yeni görev: " + q.label); snd.quest(); hudObj(); save(); menu(id); });
  }
  X.sideItems = function (id) {
    const l = [];
    Object.entries(SIDE).forEach(([k, q]) => { if (q.giver !== id) return; const st = S.q[k] || 0; if (st === 0 && unlocked(k)) l.push({ t: `${q.icon} Bir işin var mı?`, f: () => start(k, id) }); else if (st === 1) l.push({ t: have(k) ? `✅ ${q.icon} Teslim et` : `❓ ${q.icon} Görev nasıl?`, f: () => have(k) ? finish(k, id) : say(q.remind, () => menu(id)) }); });
    if (S.q.mektup === 1 && LETTER_TO.includes(id) && !S.letters[id] && S.inv.letter > 0) l.unshift({ t: "✉️ Mektubu ver", f: () => { addItem("letter", -1); S.letters[id] = 1; coin(10); addHeart(id, 1, true); snd.pickup(); const n = Object.keys(S.letters).length; say([SIDE.mektup.letter[id], n >= 4 ? "(Tüm mektuplar teslim edildi. Muhtar'a dönebilirsin.)" : `(${n}/4 mektup)`], () => { hudObj(); save(); menu(id); }); } });
    return l;
  };
  X.sideObjective = function () {
    for (const [k, q] of Object.entries(SIDE)) { const st = S.q[k] || 0; if (st === 1) return `${q.icon} ${q.label}` + (k === "mektup" ? ` (${Object.keys(S.letters).length}/4 verildi)` : ` ${S.inv[q.item] || 0}/${q.need}`) + (have(k) ? " · teslim et" : ""); }
    for (const [k, q] of Object.entries(SIDE)) if ((S.q[k] || 0) === 0 && unlocked(k)) return `${q.icon} ${NPCS[q.giver].name}'ın yeni bir işi olabilir`;
    return null;
  };
  X.checkAll = function () { if (Object.keys(SIDE).every(k => S.q[k] === 2) && ["zehra", "hacer", "cemal", "kemal", "mirmir"].every(k => S.q[k] === 2) && S.restored) award("tum"); };
  X.spawnMush = function () {
    const R = rng(S.day * 31 + 11); for (let i = 0; i < 8; i++) { const a = R() * 6.283, r = 14 + R() * 46, x = Math.cos(a) * r, z = Math.sin(a) * r, id = "m" + i; if (S.fl.ids.includes(id) || Math.hypot(x - POND.x, z - POND.z) < 10 || W.houses.some(h => Math.hypot(h.position.x - x, h.position.z - z) < 5)) continue; W.makePickup("mush", x, z).userData.id = id; }
  };
  return X;
}
