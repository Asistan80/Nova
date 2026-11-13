import * as THREE from "three";
import { makeLantern } from "./chars.js";

const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .9, flatShading: true }, o));
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hs = (x, z) => { const h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return h - Math.floor(h); };
const vn = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf); return lerp(lerp(hs(xi, zi), hs(xi + 1, zi), u), lerp(hs(xi, zi + 1), hs(xi + 1, zi + 1), u), v); };
const fbm = (x, z) => vn(x * .04, z * .04) + vn(x * .1, z * .1) * .4 + vn(x * .25, z * .25) * .12;
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export const POND = { x: 0, z: -34, r: 7 };
export function terrainH(x, z) {
  const r = Math.hypot(x, z);
  let h = (fbm(x + 100, z - 50) - .75) * 7 * smooth(24, 60, r);
  h += (fbm(x * 2, z * 2) - .7) * .5 * (1 - smooth(20, 40, r));
  h += smooth(68, 98, r) * (30 + vn(x * .08, z * .08) * 18);
  const pd = ((x - POND.x) ** 2 + (z - POND.z) ** 2);
  h *= 1 - Math.exp(-pd / 500) * .9;
  h -= 2.6 * Math.exp(-pd / 52);
  return h;
}

export const PLACES = {
  start: [4, 46], plaza: [0, 0], fountain: [7, 5], pond: [POND.x, POND.z],
  bakery: [-18, -6], hall: [16, -8], hacer: [-15, 15], cafe: [18, 11], shop: [28, -12], mill: [34, -22], pen: [-31, -22], hut: [-39, -30],
  bench: [14, 16],
};
export const HOME = [12, 37];
export const BENCH_POS = [[14, 16, 3.14], [11, 5, 1.2], [-10, 12, 0], [-6, 6, -.6], [-8, -27, 1.57]];
export const SPOTS = {
  medal: [[40, -6], [-44, -12], [22, 41]],
  wheat: [[-34, 24], [-26, 33], [-40, 10]],
  page: [[-26, -3], [31, -17], [-18, -36]],
  gear: [[36, 3], [19, -34], [-26, -28]],
  sheep: [44, 20],
};

export function buildWorld(scene, opts = {}) {
  const W = { colliders: [], updaters: [], windows: [], lanterns: [], pickups: [] };
  const R = rng(20261112);
  const addCol = (x, z, r) => W.colliders.push({ x, z, r });
  W.terrainH = terrainH;

  // ---- ışıklar ve gökyüzü
  const hemi = new THREE.HemisphereLight(0xbcd8ff, 0x556b3a, .9); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.4); sun.castShadow = true; const q = opts.shadow || 2048;
  sun.shadow.mapSize.set(q, q); Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 1, far: 220 }); sun.shadow.bias = -.0006; sun.shadow.normalBias = .04;
  scene.add(sun, sun.target);
  const moon = new THREE.DirectionalLight(0x7f9bff, .0); scene.add(moon);
  const amb = new THREE.AmbientLight(0x404060, .2); scene.add(amb);
  const skyU = { top: { value: new THREE.Color(0x4a90e2) }, bot: { value: new THREE.Color(0xbfe4ff) } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(520, 24, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: "varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: "uniform vec3 top;uniform vec3 bot;varying float h;void main(){gl_FragColor=vec4(mix(bot,top,pow(clamp(h,0.,1.),.55)),1.);}" }));
  scene.add(sky);
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(14, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false })); scene.add(sunDisc);
  const moonDisc = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 12), new THREE.MeshBasicMaterial({ color: 0xe8eeff, fog: false })); scene.add(moonDisc);
  const sp = new Float32Array(900 * 3); for (let i = 0; i < 900; i++) { const a = R() * 6.283, b = Math.acos(R() * .95), r = 480; sp[i * 3] = Math.sin(b) * Math.cos(a) * r; sp[i * 3 + 1] = Math.cos(b) * r; sp[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r; }
  const starG = new THREE.BufferGeometry(); starG.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(starG, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); scene.add(stars);
  const puff = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); const g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const clouds = []; for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, transparent: true, opacity: .75, depthWrite: false, fog: false })); s.scale.set(90 + R() * 80, 28 + R() * 14, 1); s.position.set((R() - .5) * 700, 90 + R() * 40, (R() - .5) * 700); scene.add(s); clouds.push(s); }

  // ---- arazi
  const SZ = 280, SEG = opts.seg || 190;
  const geo = new THREE.PlaneGeometry(SZ, SZ, SEG, SEG); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position; const col = new Float32Array(pos.count * 3);
  const paths = [[PLACES.start, [0, 14]], [[0, 14], [0, 3]], [[0, 0], [-15, -4]], [[0, 0], [15, -5]], [[0, 0], [-11, 10]], [[0, 0], [15, 8]], [[0, 0], [26, -9]], [[26, -9], [32, -19]], [[0, 0], [0, -27]], [[0, 0], [-27, -20]], [[-27, -20], [-36, -28]]];
  const dseg = (px, pz, a, b) => { const vx = b[0] - a[0], vz = b[1] - a[1], t = clamp(((px - a[0]) * vx + (pz - a[1]) * vz) / (vx * vx + vz * vz)); return Math.hypot(px - (a[0] + vx * t), pz - (a[1] + vz * t)); };
  const cG1 = new THREE.Color(0x6aa84f), cG2 = new THREE.Color(0x93b552), cDry = new THREE.Color(0xb7a85a), cRock = new THREE.Color(0x7a746b), cDirt = new THREE.Color(0x9c7f58), cSand = new THREE.Color(0xc9b98a), cSnow = new THREE.Color(0xdfe6ee), tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = terrainH(x, z); pos.setY(i, h);
    const n = vn(x * .15, z * .15); tmp.copy(cG1).lerp(cG2, n).lerp(cDry, smooth(.55, .9, vn(x * .03 + 9, z * .03)) * .6);
    tmp.lerp(cRock, smooth(8, 16, h)); tmp.lerp(cSnow, smooth(24, 32, h));
    const pd = ((x - POND.x) ** 2 + (z - POND.z) ** 2); tmp.lerp(cSand, smooth(95, 40, pd) * .85);
    let dm = 99; for (const [a, b] of paths) dm = Math.min(dm, dseg(x, z, a, b)); tmp.lerp(cDirt, smooth(2.2, 1.0, dm));
    tmp.lerp(cDirt, smooth(10, 7, Math.hypot(x, z)) * .35 * (1 - smooth(0, 4, Math.hypot(x, z) - 6)));
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: false })); terrain.receiveShadow = true; scene.add(terrain);

  const gy = (x, z) => terrainH(x, z);
  const face = (x, z, tx = 0, tz = 0) => Math.atan2(tx - x, tz - z);

  // ---- ev
  const winM = []; // pencere malzemeleri (gece parlar)
  function house(o) {
    const { x, z, w = 6, d = 5, h = 3.2, wall = 0xe9dfc8, roof = 0xa8472f, base = 0x8a8478, name } = o; const g = new THREE.Group(); const y = gy(x, z);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 1.4, d), M(base)); b.position.y = .3; b.castShadow = b.receiveShadow = true; g.add(b);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w - .25, h, d - .25), M(wall)); m.position.y = 1 + h / 2; m.castShadow = m.receiveShadow = true; g.add(m);
    const rh = 2.4, r = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) * .62, rh, 4), M(roof)); r.rotation.y = Math.PI / 4; r.scale.set(w / Math.hypot(w, d) * 1.45, 1, d / Math.hypot(w, d) * 1.45); r.position.y = 1 + h + rh / 2 - .05; r.castShadow = true; g.add(r);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.1, .2), M(0x5a3a22)); door.position.set(0, 1.05 + .4, d / 2 - .05); g.add(door);
    const wm = M(0xffd890, { emissive: 0xffb050, emissiveIntensity: 0 }); winM.push(wm);
    [-w / 3, w / 3].forEach(wx => { const wn = new THREE.Mesh(new THREE.BoxGeometry(.9, .9, .15), wm); wn.position.set(wx, 1 + h * .62, d / 2 - .1); g.add(wn); const fr = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, .1), M(0x5a3a22)); fr.position.set(wx, 1 + h * .62, d / 2 - .14); g.add(fr); });
    const ch = new THREE.Mesh(new THREE.BoxGeometry(.7, 1.8, .7), M(0x70685c)); ch.position.set(w * .25, 1 + h + 1.4, -d * .15); ch.castShadow = true; g.add(ch);
    g.position.set(x, y, z); g.rotation.y = o.rot != null ? o.rot : face(x, z, 0, 0) + (o.flip || 0); scene.add(g); addCol(x, z, Math.max(w, d) / 2 + .5); W.pickups; g.userData.chimney = new THREE.Vector3(x + Math.cos(g.rotation.y) * w * .25 + Math.sin(g.rotation.y) * d * .15, y + 1 + h + 2.4, z - Math.sin(g.rotation.y) * w * .25 + Math.cos(g.rotation.y) * d * .15);
    return g;
  }
  const H = [];
  H.push(house({ x: -18, z: -6, w: 6.5, d: 5, wall: 0xf1dcc0, roof: 0xb5442c, name: "bakery" }));
  H.push(house({ x: 16, z: -8, w: 7, d: 5, wall: 0xd8d2c4, roof: 0x8f3b2b, name: "hall" }));
  H.push(house({ x: -15, z: 15, w: 5.2, d: 4.6, wall: 0xf3e6c8, roof: 0x9c4a30, name: "hacer" }));
  H.push(house({ x: 18, z: 11, w: 8, d: 5, wall: 0xcdb892, roof: 0x7d3a28, name: "cafe" }));
  H.push(house({ x: 28, z: -12, w: 6, d: 5, wall: 0xc5c9cf, roof: 0x6a4a3a, name: "shop" }));
  [[-28, 3, 0xefe2c7], [-5, 25, 0xe7d6b5], [9, 27, 0xdccfae], [33, 9, 0xe9d9bd], [-26, -16, 0xd9cdb0], [6, -20, 0xefe0c0], [24, 26, 0xe3d3b2], [-30, 22, 0xeadbbd]].forEach(([x, z, c], i) => H.push(house({ x, z, w: 5 + (i % 3), d: 4.4 + (i % 2), wall: c, roof: [0xa8472f, 0x944030, 0xb85a36][i % 3], name: "d" + i })));
  const homeRot = face(HOME[0], HOME[1], 4, 46); const home = house({ x: HOME[0], z: HOME[1], w: 6.4, d: 5.4, wall: 0xe6c9a0, roof: 0x2f6f8f, base: 0x77706a, rot: homeRot }); H.push(home); W.home = { x: HOME[0], z: HOME[1], rot: homeRot, doorX: HOME[0] + Math.sin(homeRot) * 4.3, doorZ: HOME[1] + Math.cos(homeRot) * 4.3 };
  { const lx = W.home.doorX + Math.cos(homeRot) * 2.2, lz = W.home.doorZ - Math.sin(homeRot) * 2.2; const l = makeLantern(); l.position.set(lx, gy(lx, lz), lz); scene.add(l); W.lanterns.push(l); const pl = new THREE.PointLight(0xffc878, 0, 14, 1.6); pl.position.set(lx, gy(lx, lz) + 2.8, lz); scene.add(pl); W.lanterns.push(pl); }
  const hut = house({ x: -39, z: -30, w: 3.8, d: 3.4, h: 2.3, wall: 0xb89a6e, roof: 0x6a4a3a, rot: face(-39, -30, -31, -22) }); H.push(hut);

  // ---- değirmen
  const mill = new THREE.Group(); { const my = gy(34, -22);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 9, 10), M(0xd8cdb4)); t.position.y = 4.5; t.castShadow = true; mill.add(t);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.6, 10), M(0x8f3b2b)); cap.position.y = 10.3; cap.castShadow = true; mill.add(cap);
    const hub = new THREE.Group(); hub.position.set(0, 8, 2.4); mill.add(hub); const hm = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .6, 8), M(0x4a3020)); hm.rotation.x = Math.PI / 2; hub.add(hm);
    for (let i = 0; i < 4; i++) { const bl = new THREE.Group(); bl.rotation.z = i * Math.PI / 2; const arm = new THREE.Mesh(new THREE.BoxGeometry(.25, 7.5, .2), M(0x5a3a22)); arm.position.y = 3.8; bl.add(arm); const sail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 5, .08), M(0xf2ead2)); sail.position.set(.9, 4.2, .1); bl.add(sail); hub.add(bl); }
    mill.position.set(34, my, -22); mill.rotation.y = face(34, -22, 20, -12); scene.add(mill); addCol(34, -22, 3.6); W.mill = { hub, speed: 0 }; }

  // ---- büyük çınar (Ağaç Dede)
  const dede = new THREE.Group(); { const dy = gy(0, 0);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.2, 7, 12), M(0x5a3b1a)); tr.position.y = 3.5; tr.castShadow = true; dede.add(tr);
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283, c = new THREE.Mesh(new THREE.IcosahedronGeometry(3.6 + R() * 1.4, 1), M(new THREE.Color().setHSL(.27 + R() * .04, .5, .3 + R() * .08))); c.position.set(Math.cos(a) * 3.4, 8.4 + R() * 2.2, Math.sin(a) * 3.4); c.castShadow = true; dede.add(c); }
    const top = new THREE.Mesh(new THREE.IcosahedronGeometry(4.6, 1), M(0x3f7a38)); top.position.y = 11; top.castShadow = true; dede.add(top);
    const eyeM = M(0xaaffcc, { emissive: 0x44ffaa, emissiveIntensity: 0 }); const eyes = [-.7, .7].map(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(.28, 10, 10), eyeM); e.scale.set(1, 1.3, .6); e.position.set(x, 4.6, 1.75); dede.add(e); return e; });
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(.55, .09, 6, 14, Math.PI), eyeM); mouth.position.set(0, 3.7, 1.9); mouth.rotation.z = Math.PI; dede.add(mouth);
    dede.position.set(0, dy, 0); scene.add(dede); addCol(0, 0, 2.8); W.dede = { g: dede, eyeM, light: new THREE.PointLight(0x66ffbb, 0, 18) }; W.dede.light.position.set(0, dy + 4.6, 2.5); scene.add(W.dede.light); }

  // ---- çeşme, pano, bankler, fenerler
  { const fy = gy(7, 5); const f = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, .8, 12), M(0x9a958a)); b.position.y = .4; b.castShadow = true; f.add(b);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, .1, 12), M(0x4aa0d8, { transparent: true, opacity: .85 })); w.position.y = .78; f.add(w); const p = new THREE.Mesh(new THREE.CylinderGeometry(.2, .28, 2, 8), M(0xb0aa9e)); p.position.y = 1.5; p.castShadow = true; f.add(p);
    f.position.set(7, fy, 5); scene.add(f); addCol(7, 5, 1.9); }
  const bench = (x, z, rot) => { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.BoxGeometry(2, .12, .6), M(0x6b4a28)); s.position.y = .55; s.castShadow = true; g.add(s); const bk = new THREE.Mesh(new THREE.BoxGeometry(2, .5, .08), M(0x6b4a28)); bk.position.set(0, .9, -.28); g.add(bk); [-.8, .8].forEach(lx => { const l = new THREE.Mesh(new THREE.BoxGeometry(.1, .55, .5), M(0x4a3320)); l.position.set(lx, .27, 0); g.add(l); }); g.position.set(x, gy(x, z), z); g.rotation.y = rot; scene.add(g); addCol(x, z, 1.0); };
  BENCH_POS.forEach(b => bench(b[0], b[1], b[2]));
  [[4, 8], [-4, 8], [-9, -3], [10, -4], [4, -6], [-4, -8]].forEach(([x, z]) => { const l = makeLantern(); l.position.set(x, gy(x, z), z); scene.add(l); W.lanterns.push(l); addCol(x, z, .3); });
  for (let i = 0; i < 4; i++) { const pl = new THREE.PointLight(0xffc878, 0, 16, 1.6); const [x, z] = [[4, 8], [-9, -3], [10, -4], [-4, -8]][i]; pl.position.set(x, gy(x, z) + 2.8, z); scene.add(pl); W.lanterns.push(pl); }

  // ---- pınar (havuz, taş, rünler)
  const pondY = -1.1 + gy(POND.x, POND.z) * 0 ; W.pondY = -1.0;
  const water = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 48), new THREE.MeshStandardMaterial({ color: 0x2f86c6, roughness: .12, metalness: .25, transparent: true, opacity: .88, emissive: 0x0a2a55, emissiveIntensity: .5 }));
  water.rotation.x = -Math.PI / 2; water.position.set(POND.x, W.pondY, POND.z); scene.add(water);
  const ripples = [0, 1, 2].map(i => { const r = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 32), new THREE.MeshBasicMaterial({ color: 0xaee0ff, transparent: true, opacity: .5, side: THREE.DoubleSide, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.position.set(POND.x, W.pondY + .03, POND.z); r.userData.ph = i / 3; scene.add(r); return r; });
  const stone = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 1.6, 8), M(0x8a8780)); stone.position.set(POND.x, W.pondY + .5, POND.z); stone.castShadow = true; scene.add(stone);
  const runes = []; for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + .4; const rm = M(0x66d9ff, { emissive: 0x33aaff, emissiveIntensity: 0 }); const r = new THREE.Mesh(new THREE.BoxGeometry(.35, .6, .08), rm); r.position.set(POND.x + Math.cos(a) * 1.55, W.pondY + .8, POND.z + Math.sin(a) * 1.55); r.rotation.y = -a + Math.PI / 2; scene.add(r); runes.push(rm); }
  for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283, rr = POND.r + 1.0 + R() * .6; const s = new THREE.Mesh(new THREE.DodecahedronGeometry(.8 + R() * .5, 0), M(0x8a8780)); const x = POND.x + Math.cos(a) * rr, z = POND.z + Math.sin(a) * rr; s.position.set(x, gy(x, z) + .3, z); s.rotation.set(R() * 3, R() * 3, R() * 3); s.castShadow = true; scene.add(s); addCol(x, z, .9); }
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.2, 60, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x88e0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); pillar.position.set(POND.x, W.pondY + 30, POND.z); scene.add(pillar);
  const pondLight = new THREE.PointLight(0x66d9ff, 0, 30); pondLight.position.set(POND.x, W.pondY + 2.5, POND.z); scene.add(pondLight);
  W.spring = { runes, pillar, light: pondLight, water, set(shards, glow) { runes.forEach((r, i) => r.emissiveIntensity = i < shards ? 2.2 : 0); water.material.emissiveIntensity = .5 + shards * .25 + glow * 2; pondLight.intensity = shards * 1.2 + glow * 8; pillar.material.opacity = glow * .45; } };

  // ---- koyun ağılı
  const penPts = []; for (let i = 0; i < 24; i++) { const t = i / 24 * 6.283, x = -31 + Math.cos(t) * 6.5, z = -22 + Math.sin(t) * 5.2; if (Math.abs(t - 4.0) < .35) continue; penPts.push([x, z]); const p = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, 1.3, 6), M(0x5a3b1a)); p.position.set(x, gy(x, z) + .6, z); p.castShadow = true; scene.add(p); addCol(x, z, .55); }
  for (let i = 0; i < penPts.length - 1; i++) { const a = penPts[i], b = penPts[i + 1]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 3) continue; for (const yy of [.45, .95]) { const r = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(a[0] - b[0], a[1] - b[1]), .1, .08), M(0x7a5230)); r.position.set((a[0] + b[0]) / 2, gy(a[0], a[1]) + yy, (a[1] + b[1]) / 2); r.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); scene.add(r); } }

  // ---- tarla ve buğday
  const wheatFields = [[-34, 24], [-26, 33], [-40, 10]]; const wI = new THREE.InstancedMesh(new THREE.ConeGeometry(.06, .9, 4), M(0xe8c35a), 900); let wc = 0; const dum = new THREE.Object3D();
  wheatFields.forEach(([cx, cz]) => { for (let i = 0; i < 300 && wc < 900; i++) { const a = R() * 6.283, r = Math.sqrt(R()) * 6.5, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; dum.position.set(x, gy(x, z) + .45, z); dum.rotation.set((R() - .5) * .3, 0, (R() - .5) * .3); dum.scale.setScalar(.8 + R() * .6); dum.updateMatrix(); wI.setMatrixAt(wc++, dum.matrix); } });
  wI.count = wc; scene.add(wI);

  // ---- ağaçlar, kayalar, otlar, çiçekler
  const okSpot = (x, z) => { const r = Math.hypot(x, z); if (r < 9 || r > 94) return false; if (H.some(h => Math.hypot(h.position.x - x, h.position.z - z) < 7)) return false; if (Math.hypot(x - POND.x, z - POND.z) < 12) return false; if (Math.hypot(x - 34, z + 22) < 7) return false; if (Math.hypot(x + 31, z + 22) < 10) return false; if (Math.hypot(x + 39, z + 30) < 6) return false; if (BENCH_POS.some(b => Math.hypot(b[0] - x, b[1] - z) < 5)) return false; for (const [a, b] of paths) if (dseg(x, z, a, b) < 3) return false; for (const f of wheatFields) if (Math.hypot(x - f[0], z - f[1]) < 8) return false; return true; };
  const treeSpots = []; for (let i = 0; i < 9000 && treeSpots.length < 300; i++) { const a = R() * 6.283, r = 12 + Math.sqrt(R()) * 80, x = Math.cos(a) * r, z = Math.sin(a) * r; if (okSpot(x, z)) treeSpots.push([x, z, R()]); }
  const nPine = treeSpots.filter(t => t[2] < .55), nLeaf = treeSpots.filter(t => t[2] >= .55);
  const mkInst = (g, mat, arr, f) => { const m = new THREE.InstancedMesh(g, mat, arr.length); arr.forEach((t, i) => { f(dum, t); dum.updateMatrix(); m.setMatrixAt(i, dum.matrix); m.setColorAt(i, new THREE.Color().setHSL(.28 + R() * .06, .45, .22 + R() * .1)); }); m.castShadow = true; scene.add(m); return m; };
  const trunkM = M(0x5a3b1a);
  { const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .32, 2.4, 6), trunkM, treeSpots.length); treeSpots.forEach((t, i) => { const s = .8 + t[2] * .7; dum.position.set(t[0], gy(t[0], t[1]) + 1.1 * s, t[1]); dum.rotation.set(0, 0, 0); dum.scale.setScalar(s); dum.updateMatrix(); tr.setMatrixAt(i, dum.matrix); if (Math.hypot(t[0], t[1]) < 75) addCol(t[0], t[1], .55 * s); }); tr.castShadow = true; scene.add(tr); }
  mkInst(new THREE.ConeGeometry(1.7, 5.6, 7), M(0xffffff), nPine, (d, t) => { const s = .8 + t[2] * .9; d.position.set(t[0], gy(t[0], t[1]) + 3.6 * s, t[1]); d.rotation.set(0, t[2] * 6, 0); d.scale.setScalar(s); });
  mkInst(new THREE.IcosahedronGeometry(2, 1), M(0xffffff), nLeaf, (d, t) => { const s = .8 + t[2] * .6; d.position.set(t[0], gy(t[0], t[1]) + 3.4 * s, t[1]); d.rotation.set(t[2], t[2] * 6, 0); d.scale.set(s * 1.1, s, s * 1.1); });
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), M(0x84807a), 140); for (let i = 0; i < 140; i++) { const a = R() * 6.283, r = 10 + R() * 82, x = Math.cos(a) * r, z = Math.sin(a) * r, s = .4 + R() * 1.3; if (BENCH_POS.some(b => Math.hypot(b[0] - x, b[1] - z) < 6.5) || Math.hypot(x - HOME[0], z - HOME[1]) < 9) { dum.position.set(0, -50, 0); dum.scale.setScalar(0); dum.updateMatrix(); rocks.setMatrixAt(i, dum.matrix); continue; } dum.position.set(x, gy(x, z) + s * .3, z); dum.rotation.set(R() * 3, R() * 3, R() * 3); dum.scale.set(s, s * .7, s); dum.updateMatrix(); rocks.setMatrixAt(i, dum.matrix); if (s > 1.0 && Math.hypot(x, z) < 75) addCol(x, z, s * .8); } rocks.castShadow = true; scene.add(rocks);
  const gr = new THREE.InstancedMesh(new THREE.ConeGeometry(.12, .55, 4), M(0xffffff), 2200); for (let i = 0; i < 2200; i++) { const a = R() * 6.283, r = Math.sqrt(R()) * 70, x = Math.cos(a) * r, z = Math.sin(a) * r; let dm = 99; if (r < 40) for (const [p, q] of paths) dm = Math.min(dm, dseg(x, z, p, q)); dum.position.set(x, gy(x, z) + .25, z); dum.rotation.set(0, R() * 3, 0); dum.scale.setScalar(dm < 2 ? 0 : .7 + R() * .9); dum.updateMatrix(); gr.setMatrixAt(i, dum.matrix); gr.setColorAt(i, new THREE.Color().setHSL(.24 + R() * .08, .5, .32 + R() * .12)); } scene.add(gr);
  const fl = new THREE.InstancedMesh(new THREE.SphereGeometry(.12, 6, 5), M(0xffffff), 500); const fc = [0xff6b8a, 0xffd34d, 0xffffff, 0xb78bff, 0xff9a4d]; for (let i = 0; i < 500; i++) { const a = R() * 6.283, r = 6 + Math.sqrt(R()) * 52, x = Math.cos(a) * r, z = Math.sin(a) * r; dum.position.set(x, gy(x, z) + .3, z); dum.scale.setScalar(.8 + R() * .6); dum.rotation.set(0, 0, 0); dum.updateMatrix(); fl.setMatrixAt(i, dum.matrix); fl.setColorAt(i, new THREE.Color(fc[i % 5])); } scene.add(fl);

  // ---- duman, ateşböcekleri
  const smoke = []; const smokeSrc = [H[0], H[3], H[1]].map(h => h.userData.chimney);
  for (let i = 0; i < 24; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, transparent: true, opacity: 0, depthWrite: false, color: 0xdddddd })); s.userData = { ph: i / 24, src: smokeSrc[i % 3] }; scene.add(s); smoke.push(s); }
  const FF = 140, fg = new THREE.BufferGeometry(), fpos = new Float32Array(FF * 3), fph = []; for (let i = 0; i < FF; i++) { const near = i < 70; const a = R() * 6.283, r = near ? 3 + R() * 9 : 10 + R() * 35; const cx = near ? POND.x : 0, cz = near ? POND.z : 0; fpos[i * 3] = cx + Math.cos(a) * r; fpos[i * 3 + 1] = 1 + R() * 3; fpos[i * 3 + 2] = cz + Math.sin(a) * r; fph.push([R() * 6.28, R() * 6.28, .3 + R() * .6]); }
  fg.setAttribute("position", new THREE.BufferAttribute(fpos, 3)); const ff = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xd8ff7a, size: .28, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(ff); const fbase = fpos.slice();

  // ---- toplanabilirler
  const pm = { wheat: () => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .9, 5), M(0xe8c35a, { emissive: 0x6a5010 })); s.position.set((i - 2) * .06, .45, 0); s.rotation.z = (i - 2) * .08; g.add(s); const e = new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 6), M(0xf2d56a, { emissive: 0x8a6a10 })); e.scale.y = 2; e.position.set((i - 2) * .12, 1, 0); g.add(e); } return g; },
    page: () => { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.PlaneGeometry(.6, .8), M(0xfff6d8, { emissive: 0xaa9a60, emissiveIntensity: .8, side: THREE.DoubleSide, flatShading: false })); p.position.y = .6; p.rotation.x = -.3; g.add(p); return g; },
    gear: () => { const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.TorusGeometry(.32, .1, 6, 10), M(0xb8bcc4, { emissive: 0x3a4048, metalness: .6 })); t.position.y = .5; t.rotation.x = Math.PI / 2; g.add(t); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, c = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, .16), M(0xb8bcc4, { emissive: 0x3a4048 })); c.position.set(Math.cos(a) * .42, .5, Math.sin(a) * .42); c.rotation.y = -a; g.add(c); } return g; },
    flower: () => { const g = new THREE.Group(); const c = [0xff6b8a, 0xffd34d, 0xb78bff, 0xff9a4d][Math.floor(Math.random() * 4)]; const s = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .5, 5), M(0x3f8a3a)); s.position.y = .25; g.add(s); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283, p = new THREE.Mesh(new THREE.SphereGeometry(.1, 6, 6), M(c, { emissive: c, emissiveIntensity: .25 })); p.position.set(Math.cos(a) * .13, .52, Math.sin(a) * .13); g.add(p); } const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 6), M(0xffe48a)); m.position.y = .52; g.add(m); return g; },
    mush: () => { const g = new THREE.Group(); const st = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, .28, 6), M(0xf2e8d0)); st.position.y = .14; g.add(st); const cp = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(0xd8352f, { emissive: 0x400808 })); cp.position.y = .27; g.add(cp); for (let i = 0; i < 4; i++) { const a = i * 1.57, d = new THREE.Mesh(new THREE.SphereGeometry(.035, 5, 5), M(0xffffff)); d.position.set(Math.cos(a) * .12, .42, Math.sin(a) * .12); g.add(d); } return g; },
    shard: () => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.OctahedronGeometry(.3, 0), M(0x66d9ff, { emissive: 0x33aaff, emissiveIntensity: 1.6 })); m.scale.y = 1.6; m.position.y = .8; g.add(m); return g; },
  };
  W.makePickup = (type, x, z, extraY = 0) => { const g = pm[type](); g.position.set(x, gy(x, z) + extraY, z); const halo = new THREE.Mesh(new THREE.RingGeometry(.5, .62, 20), new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: .45, side: THREE.DoubleSide, depthWrite: false })); halo.rotation.x = -Math.PI / 2; halo.position.y = .05; g.add(halo); g.userData = { type, x, z, ph: Math.random() * 6, halo }; scene.add(g); W.pickups.push(g); return g; };
  W.removePickup = g => { scene.remove(g); W.pickups = W.pickups.filter(p => p !== g); };

  // ---- zaman, sis, ışık
  const KEYS = { night: [new THREE.Color(0x04061a), new THREE.Color(0x14183a)], dawn: [new THREE.Color(0x4a5a9a), new THREE.Color(0xff9a6b)], day: [new THREE.Color(0x3f86d8), new THREE.Color(0xbfe4ff)], dusk: [new THREE.Color(0x3a3a7a), new THREE.Color(0xff6a4d)] };
  const topC = new THREE.Color(), botC = new THREE.Color(), fogC = new THREE.Color();
  scene.fog = new THREE.FogExp2(0xbfe4ff, .02);
  W.sunOff = new THREE.Vector3(60, 100, 40);
  W.setTime = (t, sis, glow = 0) => {
    const ang = (t - 6) / 12 * Math.PI, e = Math.sin(ang); const night = clamp(-e * 5 + .2), dayF = clamp(e * 3 + .3), twi = 1 - Math.abs(clamp(e * 3, -1, 1)); const twiKey = t < 12 ? KEYS.dawn : KEYS.dusk;
    topC.copy(KEYS.night[0]).lerp(KEYS.day[0], dayF).lerp(twiKey[0], twi * .6); botC.copy(KEYS.night[1]).lerp(KEYS.day[1], dayF).lerp(twiKey[1], twi * .75);
    skyU.top.value.copy(topC); skyU.bot.value.copy(botC);
    fogC.copy(botC).lerp(new THREE.Color(0x8a93a6), sis * .55 * dayF).lerp(new THREE.Color(0x10132a), night * .3); scene.fog.color.copy(fogC); scene.fog.density = .004 + sis * .026 + night * .004 * (1 - sis);
    W.sunOff.set(Math.cos(ang) * 120, Math.sin(ang) * 120 + 5, 40); sun.intensity = clamp(e * 3, 0, 1) * 2.6 * (1 - sis * .55); sun.color.setHSL(.1, .5 + twi * .4, .8 - twi * .15);
    moon.position.set(-Math.cos(ang) * 120, -Math.sin(ang) * 120 + 20, -30); moon.intensity = night * .55;
    hemi.intensity = .25 + dayF * .8; hemi.color.copy(topC).lerp(new THREE.Color(0xffffff), .5); amb.intensity = .12 + night * .18;
    sunDisc.position.set(Math.cos(ang) * 440, Math.sin(ang) * 440, 120); moonDisc.position.set(-Math.cos(ang) * 440, -Math.sin(ang) * 440, -110); sunDisc.visible = e > -.08; moonDisc.visible = e < .08;
    stars.material.opacity = clamp(night * 1.2 - sis * .5); W.night = night; const wi = clamp(night * 1.6); winM.forEach(m => m.emissiveIntensity = wi * 1.2);
    W.lanterns.forEach(l => { if (l.isPointLight) l.intensity = night * 14; else l.userData.lamp.material.emissiveIntensity = night * 2.2 + .15; });
    ff.material.opacity = clamp(night * 1.1 - sis * .3) * (.55 + glow * .4); clouds.forEach(c => { c.material.color.copy(botC).lerp(new THREE.Color(0xffffff), dayF * .9); c.material.opacity = (.35 + dayF * .45) * (1 - sis * .3); });
    W.dede.eyeM.emissiveIntensity = clamp(night * 1.3 + glow * 1.2) * 2; W.dede.light.intensity = clamp(night * 1.3 + glow) * 4;
  };
  W.update = (dt, t, player) => {
    sun.target.position.set(player.x, 0, player.z); sun.position.set(W.sunOff.x + player.x, W.sunOff.y, W.sunOff.z + player.z); sun.target.updateMatrixWorld();
    if (W.mill.speed > 0) W.mill.hub.rotation.z -= dt * W.mill.speed;
    ripples.forEach(r => { r.userData.ph = (r.userData.ph + dt * .22) % 1; const k = r.userData.ph; r.scale.setScalar(1 + k * 6); r.material.opacity = (1 - k) * .45; });
    W.spring.water.material.emissiveIntensity += Math.sin(t * 2) * .0015;
    W.pickups.forEach(p => { p.rotation.y += dt * 1.4; p.position.y = gy(p.userData.x, p.userData.z) + Math.sin(t * 2 + p.userData.ph) * .08 + (p.userData.type === "shard" ? .3 : 0); p.userData.halo.rotation.z += dt; });
    smoke.forEach(s => { const u = s.userData; u.ph = (u.ph + dt * .13) % 1; const k = u.ph; s.position.set(u.src.x + Math.sin(k * 9 + u.src.x) * .6 + k * 3, u.src.y + k * 7, u.src.z + Math.cos(k * 7) * .4); s.scale.setScalar(.6 + k * 3.2); s.material.opacity = Math.sin(k * Math.PI) * .35; });
    const fp = fg.attributes.position; for (let i = 0; i < FF; i++) { const f = fph[i]; fp.setXYZ(i, fbase[i * 3] + Math.sin(t * f[2] + f[0]) * 1.4, fbase[i * 3 + 1] + Math.sin(t * f[2] * 1.3 + f[1]) * .7, fbase[i * 3 + 2] + Math.cos(t * f[2] + f[1]) * 1.4); } fp.needsUpdate = true;
    clouds.forEach(c => { c.position.x += dt * 1.2; if (c.position.x > 380) c.position.x = -380; });
  };
  W.resolve = (p, r) => { for (const c of W.colliders) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + r; if (d < m && d > 1e-4) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; } } const rr = Math.hypot(p.x, p.z); if (rr > 86) { p.x *= 86 / rr; p.z *= 86 / rr; } if (Math.hypot(p.x - POND.x, p.z - POND.z) < POND.r - 1.2) { const dx = p.x - POND.x, dz = p.z - POND.z, d = Math.hypot(dx, dz); p.x = POND.x + dx / d * (POND.r - 1.2); p.z = POND.z + dz / d * (POND.r - 1.2); } };
  W.houses = H; W.terrain = terrain; W.sun = sun;
  return W;
}
