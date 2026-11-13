import * as THREE from "three";
const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .85, flatShading: true }, o));

export function makeLabel(text, sub) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 128; const x = c.getContext("2d");
  x.font = "700 44px system-ui,sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = "rgba(10,8,25,.62)"; const w = Math.min(500, x.measureText(text).width + 50);
  x.beginPath(); x.roundRect(256 - w / 2, 22, w, 84, 28); x.fill();
  x.fillStyle = "#fff"; x.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
  s.scale.set(3.2, .8, 1); return s;
}

export function makeHuman(o = {}) {
  const { color = 0x888888, skin = 0xe3b48f, hat = "none", scarf = 0xcc2233, hair = 0x2a2018, dress = false, scale = 1, old = false } = o;
  const g = new THREE.Group(), u = {};
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.3, .55, 4, 10), M(color)); body.position.y = 1.08; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.25, 14, 12), M(skin)); head.position.y = 1.78; head.castShadow = true; g.add(head);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 6), M(skin)); nose.position.set(0, 1.76, .24); g.add(nose);
  [-.09, .09].forEach(ex => { const e = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 6), M(0x111111)); e.position.set(ex, 1.82, .22); g.add(e); });
  const sc = new THREE.Mesh(new THREE.TorusGeometry(.27, .07, 6, 14), M(scarf)); sc.position.y = 1.5; sc.rotation.x = Math.PI / 2; g.add(sc);
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(.265, 12, 10, 0, Math.PI * 2, 0, Math.PI * .55), M(old ? 0xdddddd : hair)); hairM.position.y = 1.8; hairM.rotation.x = -.25; g.add(hairM);
  if (hat === "cap") { const c = new THREE.Mesh(new THREE.CylinderGeometry(.27, .29, .14, 12), M(0x333333)); c.position.y = 2.0; g.add(c); const b = new THREE.Mesh(new THREE.BoxGeometry(.3, .03, .2), M(0x222222)); b.position.set(0, 1.97, .27); g.add(b); }
  if (hat === "kalpak") { const c = new THREE.Mesh(new THREE.CylinderGeometry(.24, .29, .32, 12), M(0x6b4a28)); c.position.y = 2.05; g.add(c); }
  if (hat === "scarf") { const c = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 10, 0, Math.PI * 2, 0, Math.PI * .62), M(scarf)); c.position.y = 1.82; c.rotation.x = -.2; g.add(c); const d = new THREE.Mesh(new THREE.ConeGeometry(.3, .5, 8), M(scarf)); d.position.set(0, 1.55, -.12); d.rotation.x = .2; g.add(d); }
  if (hat === "goggles") { const b = new THREE.Mesh(new THREE.TorusGeometry(.26, .03, 6, 14), M(0x222222)); b.position.set(0, 1.98, 0); b.rotation.x = Math.PI / 2; g.add(b); [-.1, .1].forEach(gx => { const l = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 8), M(0x88ccff, { emissive: 0x2a5577 })); l.position.set(gx, 1.98, .22); g.add(l); }); }
  const mk = (x, y, r, l, col) => { const p = new THREE.Group(); p.position.set(x, y, 0); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * .9, l, 8), M(col)); m.position.y = -l / 2; m.castShadow = true; p.add(m); g.add(p); return p; };
  u.legL = mk(-.13, .72, .1, .72, dress ? skin : 0x3a3a48); u.legR = mk(.13, .72, .1, .72, dress ? skin : 0x3a3a48);
  u.armL = mk(-.38, 1.45, .08, .6, color); u.armR = mk(.38, 1.45, .08, .6, color);
  if (dress) { const sk = new THREE.Mesh(new THREE.CylinderGeometry(.28, .5, .7, 10), M(color)); sk.position.y = .8; sk.castShadow = true; g.add(sk); }
  g.scale.setScalar(scale); g.userData = u; return g;
}
export function animateHuman(g, speed, t) {
  const u = g.userData, s = Math.sin(t * 9) * Math.min(1, speed / 3) * .75;
  u.legL.rotation.x = s; u.legR.rotation.x = -s; u.armL.rotation.x = -s * .8; u.armR.rotation.x = s * .8;
}

export function makeCat() {
  const g = new THREE.Group(), u = {}, dark = M(0x1b1b24), gold = M(0xffd34d, { emissive: 0x886600 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(.32, 12, 10), dark); body.scale.set(1, .8, 1.5); body.position.y = .42; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 10), dark); head.position.set(0, .66, .46); g.add(head);
  [-.12, .12].forEach(x => { const e = new THREE.Mesh(new THREE.ConeGeometry(.07, .16, 4), dark); e.position.set(x, .86, .44); g.add(e); const eye = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 8), gold); eye.position.set(x, .7, .64); g.add(eye); });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 8), gold); bell.position.set(0, .5, .6); g.add(bell);
  u.tail = new THREE.Group(); u.tail.position.set(0, .5, -.45); for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.07 - i * .007, 6, 6), dark); s.position.set(0, i * .12, -i * .06); u.tail.add(s); } g.add(u.tail);
  [[-.15, .38], [.15, .38], [-.15, -.3], [.15, -.3]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .3, 6), dark); l.position.set(x, .15, z); g.add(l); });
  g.userData = u; return g;
}
export function animateCat(g, t) { g.userData.tail.rotation.z = Math.sin(t * 2.2) * .5; g.userData.tail.rotation.x = .6 + Math.sin(t * 1.3) * .15; }

export function makeSheep() {
  const g = new THREE.Group(), wool = M(0xf6f3ea), dark = M(0x3a3028);
  [[0, .6, 0, .42], [.25, .55, .1, .3], [-.25, .55, .1, .3], [.12, .55, -.28, .3], [-.12, .55, -.28, .3]].forEach(([x, y, z, r]) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), wool); m.position.set(x, y, z); m.castShadow = true; g.add(m); });
  const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 8), dark); head.position.set(0, .68, .5); g.add(head);
  [[-.2, .3], [.2, .3], [-.2, -.25], [.2, -.25]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .35, 6), dark); l.position.set(x, .17, z); g.add(l); });
  return g;
}

export function makeLantern() {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 2.6, 6), M(0x3b2a1a)); post.position.y = 1.3; post.castShadow = true; g.add(post);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 10), M(0xffe2a0, { emissive: 0xffc060, emissiveIntensity: 0 })); lamp.position.y = 2.7; g.add(lamp);
  g.userData.lamp = lamp; return g;
}
