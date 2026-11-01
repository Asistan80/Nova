// Sahne resimleri: kodla çizilir (dosya yok). 800x450.
const W = 800, H = 450;
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const Art = {
  draw(ctx, key, t) {
    const f = Art[key] || Art.black; ctx.save(); ctx.clearRect(0, 0, W, H);
    f(ctx, t || 0, rng(key.length * 977 + 13)); Art.post(ctx, t || 0, key); ctx.restore();
  },
  post(ctx, t, key) {
    const r = rng(Math.floor(t * 12) + 5);   // film greni, yavaş titreşir
    ctx.globalAlpha = 0.07; ctx.fillStyle = "#fff";
    for (let i = 0; i < 700; i++) ctx.fillRect(r() * W, r() * H, 1.5, 1.5);
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.88)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },
  bg(ctx, c1, c2) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); },
  rain(ctx, t, n = 140, a = 0.25) {
    const r = rng(7); ctx.strokeStyle = "rgba(170,190,210," + a + ")"; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < n; i++) { const x = r() * W, y = ((r() * H) + t * 520) % H; ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 18); } ctx.stroke();
  },
  house(ctx, x, y, w, h, lit) {
    ctx.fillStyle = "#0a0908"; ctx.fillRect(x, y, w, h);
    ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x + w / 2, y - h * 0.45); ctx.lineTo(x + w + 20, y); ctx.fill();
    ctx.fillStyle = "#0a0908"; ctx.fillRect(x + w * 0.72, y - h * 0.6, 24, h * 0.4);
    for (let i = 0; i < 3; i++) { const wx = x + 30 + i * (w - 80) / 2, wy = y + 40; ctx.fillStyle = (lit && i === 1) ? "#e8b45a" : "#14110e"; ctx.fillRect(wx, wy, 36, 54); ctx.strokeStyle = "#000"; ctx.strokeRect(wx, wy, 36, 54); ctx.beginPath(); ctx.moveTo(wx + 18, wy); ctx.lineTo(wx + 18, wy + 54); ctx.stroke(); }
    ctx.fillStyle = "#050403"; ctx.fillRect(x + w / 2 - 22, y + h - 90, 44, 90);
  },
  tree(ctx, x, y, s) {
    ctx.strokeStyle = "#050504"; ctx.lineWidth = 8 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 120 * s); ctx.stroke();
    ctx.lineWidth = 3 * s; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x, y - (50 + i * 14) * s); ctx.lineTo(x + (i % 2 ? 40 : -40) * s, y - (90 + i * 16) * s); ctx.stroke(); }
  },
  moon(ctx, x, y) { const g = ctx.createRadialGradient(x, y, 4, x, y, 90); g.addColorStop(0, "rgba(220,225,240,.9)"); g.addColorStop(.15, "rgba(160,175,200,.35)"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(x - 90, y - 90, 180, 180); },
  // --- sahneler
  gate(ctx, t) {
    Art.bg(ctx, "#0b1118", "#111a14"); Art.moon(ctx, 620, 90); Art.house(ctx, 280, 180, 300, 190, true);
    Art.tree(ctx, 120, 400, 1.3); Art.tree(ctx, 700, 410, 1.0);
    ctx.fillStyle = "#050607"; ctx.fillRect(0, 370, W, 80);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 5; for (let x = 140; x < 700; x += 36) { ctx.beginPath(); ctx.moveTo(x, 420); ctx.lineTo(x, 360); ctx.stroke(); }
    Art.rain(ctx, t, 220);
  },
  road(ctx, t) { Art.bg(ctx, "#05070a", "#0b0f0c"); ctx.fillStyle = "#090a08"; ctx.beginPath(); ctx.moveTo(340, 190); ctx.lineTo(460, 190); ctx.lineTo(800, 450); ctx.lineTo(0, 450); ctx.fill(); Art.tree(ctx, 60, 440, 1.5); Art.tree(ctx, 720, 440, 1.4); Art.tree(ctx, 300, 215, .5); Art.rain(ctx, t, 260); Art.moon(ctx, 400, 70); },
  courtyard(ctx, t) {
    Art.bg(ctx, "#0b1016", "#0d130f"); Art.moon(ctx, 150, 80);
    Art.house(ctx, 440, 140, 340, 230, false);
    ctx.fillStyle = "#17191a"; ctx.beginPath(); ctx.ellipse(250, 370, 80, 26, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#08090a"; ctx.fillRect(176, 300, 148, 66); ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(250, 304, 70, 18, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#24282a"; ctx.fillRect(170, 290, 40, 8);
    Art.rain(ctx, t, 220);
  },
  well(ctx, t) {
    Art.bg(ctx, "#06090c", "#0b0e10");
    ctx.fillStyle = "#1a1c1d"; ctx.beginPath(); ctx.ellipse(400, 300, 230, 70, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(400, 296, 190, 52, 0, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(400, 300, 5, 400, 296, 190); g.addColorStop(0, "rgba(120,150,160,.25)"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(400, 296, 190, 52, 0, 0, 7); ctx.fill();
    // su yüzünde yüz
    const a = 0.12 + 0.1 * Math.sin(t * 1.5); ctx.fillStyle = "rgba(200,210,215," + a + ")"; ctx.beginPath(); ctx.ellipse(400, 296, 26, 18, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#000"; ctx.fillRect(388, 292, 6, 4); ctx.fillRect(406, 292, 6, 4); ctx.fillRect(397, 303, 8, 3);
    Art.rain(ctx, t, 120, .18);
  },
  shed(ctx, t) { Art.bg(ctx, "#0d0b08", "#15110c"); ctx.fillStyle = "#1b150f"; for (let x = 0; x < W; x += 46) ctx.fillRect(x, 0, 3, H); ctx.fillStyle = "#222"; ctx.fillRect(500, 80, 12, 300); ctx.fillStyle = "#555"; ctx.fillRect(498, 70, 16, 14); const g = ctx.createRadialGradient(506, 180, 5, 506, 180, 200); g.addColorStop(0, "rgba(160,170,180,.2)"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(300, 0, 400, 400); Art.rain(ctx, t, 40, .08); },
  hall(ctx, t) {
    Art.bg(ctx, "#14100c", "#0a0806");
    ctx.fillStyle = "#1b150f"; ctx.fillRect(0, 330, W, 120);
    ctx.fillStyle = "#0a0805"; ctx.fillRect(60, 120, 90, 210); ctx.fillRect(650, 120, 90, 210);
    ctx.fillStyle = "#050403"; ctx.fillRect(370, 90, 60, 240);
    ctx.fillStyle = "#2a1f14"; ctx.fillRect(180, 80, 70, 250); ctx.fillStyle = "#b99955"; ctx.beginPath(); ctx.arc(215, 125, 20, 0, 7); ctx.fill(); ctx.strokeStyle = "#000"; ctx.beginPath(); ctx.moveTo(215, 125); ctx.lineTo(215, 110); ctx.moveTo(215, 125); ctx.lineTo(227, 125); ctx.stroke();
    ctx.strokeStyle = "#21160c"; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(500, 330); ctx.lineTo(650, 220); ctx.lineTo(650, 330); ctx.stroke();
    const g = ctx.createRadialGradient(400, 200, 10, 400, 200, 330); g.addColorStop(0, "rgba(230,170,80,.18)"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(30,60,80,.5)"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(300 + i * 40, 380 - i * 8, 10, 5, 0, 0, 7); ctx.fill(); }
  },
  kitchen(ctx, t) {
    Art.bg(ctx, "#1a120a", "#0c0805"); ctx.fillStyle = "#26180d"; ctx.fillRect(0, 340, W, 110);
    ctx.fillStyle = "#0a0705"; ctx.fillRect(520, 120, 220, 220); const f = 0.5 + 0.5 * Math.sin(t * 9) * Math.sin(t * 4.3);
    const g = ctx.createRadialGradient(630, 300, 5, 630, 280, 180 + f * 30); g.addColorStop(0, "rgba(255,150,50," + (0.5 + f * 0.2) + ")"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(400, 100, 400, 340);
    ctx.fillStyle = "#35210f"; ctx.fillRect(130, 280, 280, 18); ctx.fillRect(150, 298, 10, 52); ctx.fillRect(380, 298, 10, 52);
    ctx.fillStyle = "#ddd2b5"; ctx.beginPath(); ctx.ellipse(210, 276, 34, 9, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(320, 276, 34, 9, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#9a1c14"; ctx.beginPath(); ctx.ellipse(210, 274, 22, 5, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(320, 274, 22, 5, 0, 0, 7); ctx.fill();
  },
  living(ctx, t) {
    Art.bg(ctx, "#101419", "#0a0b0d"); ctx.fillStyle = "#171108"; ctx.fillRect(0, 340, W, 110);
    ctx.fillStyle = "#d4d0c4"; ctx.beginPath(); ctx.moveTo(300, 60); ctx.lineTo(500, 60); ctx.lineTo(520, 340); ctx.lineTo(280, 340); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.35)"; for (let i = 0; i < 6; i++) ctx.fillRect(300 + i * 36, 60, 6, 280);
    ctx.fillStyle = "#2a1c12"; ctx.fillRect(560, 250, 190, 100); ctx.fillRect(40, 270, 150, 80);
    const a = 0.1 + 0.08 * Math.sin(t * 2); ctx.fillStyle = "rgba(180,200,220," + a + ")"; ctx.fillRect(300, 60, 200, 280);
  },
  mirror(ctx, t) {
    Art.bg(ctx, "#0c0e12", "#06070a"); ctx.fillStyle = "#3a2a14"; ctx.fillRect(200, 20, 400, 410);
    const g = ctx.createLinearGradient(0, 40, 0, 410); g.addColorStop(0, "#15222a"); g.addColorStop(1, "#06090c"); ctx.fillStyle = g; ctx.fillRect(220, 40, 360, 370);
    const s = (x, a) => { ctx.fillStyle = "rgba(210,215,220," + a + ")"; ctx.beginPath(); ctx.ellipse(x, 240, 38, 52, 0, 0, 7); ctx.fill(); ctx.fillRect(x - 56, 285, 112, 130); };
    s(400, 0.16);
    const d = Math.sin(t * 2) * 6; ctx.fillStyle = "#000"; ctx.fillRect(382 + d, 232, 10, 7); ctx.fillRect(408 + d, 232, 10, 7);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(400 + d / 2, 262, 14, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.fillStyle = "rgba(200,210,215,.05)"; ctx.fillRect(220, 40, 360, 370);
  },
  mirror_broken(ctx, t) {
    Art.bg(ctx, "#0b0c10", "#050608"); ctx.fillStyle = "#3a2a14"; ctx.fillRect(200, 20, 400, 410); ctx.fillStyle = "#050607"; ctx.fillRect(220, 40, 360, 370);
    const r = rng(31); ctx.strokeStyle = "rgba(210,225,235,.6)"; ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo(400, 230); let x = 400, y = 230, a = r() * 6.28; for (let k = 0; k < 5; k++) { a += (r() - .5) * .8; x += Math.cos(a) * 50; y += Math.sin(a) * 50; ctx.lineTo(x, y); } ctx.stroke(); }
    ctx.fillStyle = "rgba(180,40,30,.18)"; ctx.fillRect(220, 40, 360, 370);
  },
  corridor(ctx, t) {
    Art.bg(ctx, "#0d0b0a", "#050404"); ctx.fillStyle = "#17110c"; ctx.beginPath(); ctx.moveTo(260, 140); ctx.lineTo(540, 140); ctx.lineTo(800, 450); ctx.lineTo(0, 450); ctx.fill();
    ctx.fillStyle = "#0a0807"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(260, 140); ctx.lineTo(260, 330); ctx.lineTo(0, 450); ctx.fill(); ctx.beginPath(); ctx.moveTo(800, 0); ctx.lineTo(540, 140); ctx.lineTo(540, 330); ctx.lineTo(800, 450); ctx.fill();
    ctx.fillStyle = "#000"; ctx.fillRect(330, 160, 140, 170); const a = 0.5 + 0.5 * Math.sin(t * 7) * Math.sin(t * 2.3); ctx.fillStyle = "rgba(230,170,90," + (0.12 * a) + ")"; ctx.fillRect(250, 150, 300, 200);
  },
  bedroom(ctx, t) {
    Art.bg(ctx, "#15120f", "#0a0908"); ctx.fillStyle = "#1e1710"; ctx.fillRect(0, 340, W, 110);
    ctx.fillStyle = "#3b2a1a"; ctx.fillRect(120, 240, 360, 110); ctx.fillStyle = "#cfc6b0"; ctx.fillRect(130, 220, 340, 40);
    ctx.fillStyle = "#1f1a14"; ctx.fillRect(560, 240, 140, 110); ctx.fillStyle = "#b02a22"; ctx.fillRect(610, 232, 14, 18);
    ctx.fillStyle = "#07090c"; ctx.fillRect(570, 60, 120, 120); ctx.strokeStyle = "#2a1c10"; ctx.lineWidth = 4; ctx.strokeRect(570, 60, 120, 120); Art.rain(ctx, t, 30, .15);
  },
  diary(ctx, t) { Art.bg(ctx, "#120d08", "#080604"); ctx.fillStyle = "#cdbf9a"; ctx.fillRect(160, 80, 220, 290); ctx.fillRect(420, 80, 220, 290); ctx.fillStyle = "#4a3a22"; for (let i = 0; i < 15; i++) { ctx.fillRect(180, 110 + i * 16, 180 - (i % 4) * 22, 3); ctx.fillRect(440, 110 + i * 16, 180 - ((i + 2) % 5) * 22, 3); } ctx.fillStyle = "rgba(120,0,0,.55)"; ctx.fillRect(470, 280, 80, 4); },
  attic(ctx, t) {
    Art.bg(ctx, "#0e0c0a", "#050403"); ctx.strokeStyle = "#1d160f"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 220); ctx.lineTo(400, 20); ctx.lineTo(800, 220); ctx.stroke(); ctx.fillStyle = "#17120d"; ctx.fillRect(0, 380, W, 70);
    ctx.fillStyle = "#2a1c12"; ctx.fillRect(80, 300, 160, 80); ctx.fillRect(520, 320, 120, 60);
    ctx.fillStyle = "#e5d9c0"; ctx.beginPath(); ctx.arc(400, 330, 26, 0, 7); ctx.fill(); ctx.fillRect(374, 356, 52, 50);
    ctx.fillStyle = "#000"; ctx.fillRect(388, 324, 9, 9); ctx.fillRect(405, 324, 9, 9); ctx.fillStyle = "#6d1511"; ctx.fillRect(390, 342, 22, 3);
    const g = ctx.createRadialGradient(400, 200, 10, 400, 200, 250); g.addColorStop(0, "rgba(180,190,220,.12)"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },
  cellar_door(ctx, t) { Art.bg(ctx, "#0d0b09", "#050403"); ctx.fillStyle = "#2c1d11"; ctx.fillRect(280, 60, 240, 340); ctx.strokeStyle = "#140d07"; ctx.lineWidth = 3; for (let x = 310; x < 520; x += 40) { ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, 400); ctx.stroke(); } ctx.fillStyle = "#6a5a3a"; ctx.beginPath(); ctx.arc(490, 240, 9, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(230,170,80,.18)"; ctx.fillRect(280, 396, 240, 6); },
  cellar(ctx, t) {
    Art.bg(ctx, "#0a0b0c", "#040404"); ctx.fillStyle = "#14130f"; for (let x = 0; x < W; x += 80) for (let y = 0; y < 330; y += 40) ctx.fillRect(x + ((y / 40) % 2) * 40, y, 76, 36);
    ctx.fillStyle = "#08090a"; ctx.fillRect(0, 330, W, 120);
    const f = 0.7 + 0.3 * Math.sin(t * 11); const g = ctx.createRadialGradient(560, 280, 4, 560, 280, 220); g.addColorStop(0, "rgba(255,170,70," + (0.55 * f) + ")"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(300, 60, 500, 380);
    ctx.fillStyle = "#e8e0c0"; ctx.fillRect(555, 300, 10, 30);
    ctx.fillStyle = "#1b1814"; ctx.beginPath(); ctx.ellipse(300, 330, 46, 20, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#2a2622"; ctx.beginPath(); ctx.arc(300, 240, 24, 0, 7); ctx.fill(); ctx.fillRect(270, 262, 60, 68);
  },
  ritual(ctx, t) {
    Art.bg(ctx, "#070a0d", "#0b0f0c"); ctx.fillStyle = "#16191a"; ctx.beginPath(); ctx.ellipse(400, 310, 260, 80, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(400, 305, 170, 46, 0, 0, 7); ctx.fill();
    const p = 0.5 + 0.5 * Math.sin(t * 3); ctx.strokeStyle = "rgba(230,230,220," + (0.25 + 0.2 * p) + ")"; ctx.lineWidth = 3; ctx.setLineDash([2, 6]); ctx.beginPath(); ctx.ellipse(400, 316, 220, 62, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,60,40," + (0.2 + p * 0.25) + ")"; ctx.beginPath(); ctx.ellipse(400, 305, 60, 16, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#222"; ctx.fillRect(396, 180, 10, 130);
    for (let i = 0; i < 40; i++) { const r = rng(i + 3); ctx.fillStyle = "rgba(160,170,180,.2)"; ctx.fillRect(250 + r() * 300, 80 + ((r() * 300 + t * 40 * (0.5 + r())) % 220), 2, 2); }
    Art.rain(ctx, t, 60, .1);
  },
  dawn(ctx, t) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#3c4a68"); g.addColorStop(.55, "#e5a86a"); g.addColorStop(1, "#2a1d12"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "rgba(255,230,170,.9)"; ctx.beginPath(); ctx.arc(560, 270, 40, 0, 7); ctx.fill(); Art.house(ctx, 140, 220, 320, 190, true); Art.tree(ctx, 700, 410, 1.2); ctx.fillStyle = "#18110a"; ctx.fillRect(0, 400, W, 50); },
  black(ctx, t) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); const r = rng(Math.floor(t * 3) + 2); ctx.fillStyle = "rgba(150,20,20,.12)"; for (let i = 0; i < 6; i++) ctx.fillRect(r() * W, r() * H, 80, 2); ctx.fillStyle = "rgba(255,255,255,.04)"; ctx.beginPath(); ctx.ellipse(400 + Math.sin(t) * 4, 220, 90, 130, 0, 0, 7); ctx.fill(); },
  // --- jumpscare yüzü (tam ekran)
  face(ctx, t) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); const j = () => (Math.random() - .5) * 8;
    ctx.fillStyle = "#cfc8b8"; ctx.beginPath(); ctx.ellipse(400 + j(), 230 + j(), 170, 220, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#050000"; ctx.beginPath(); ctx.ellipse(335, 190, 38, 56, 0.1, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(465, 190, 38, 56, -0.1, 0, 7); ctx.fill();
    ctx.fillStyle = "#050000"; ctx.beginPath(); ctx.ellipse(400, 345, 70, 90, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#e0d8c4"; for (let i = 0; i < 8; i++) ctx.fillRect(345 + i * 15, 280, 9, 26);
    ctx.fillStyle = "#900"; ctx.fillRect(335, 238, 3, 90); ctx.fillRect(465, 238, 3, 90);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(400, 215); ctx.lineTo(392, 270); ctx.lineTo(412, 270); ctx.stroke();
  },
  shadow(ctx, t) { ctx.fillStyle = "#050000"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(400, 210, 120, 260, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(360, 130, 14, 8, 0, 0, 7); ctx.ellipse(440, 130, 14, 8, 0, 0, 7); ctx.fill(); },
  hand(ctx, t) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#cfc8b8"; for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(400, 450); ctx.rotate(-0.6 + i * 0.3); ctx.fillRect(-12, -380, 24, 380); ctx.restore(); } }
};
