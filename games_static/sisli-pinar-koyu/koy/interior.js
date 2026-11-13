import * as THREE from "three";
import { makeLabel } from "./chars.js";
const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .9, flatShading: true }, o));
export const INT = { x: 0, y: 260, z: 0, hx: 4.3, hz: 3.7 };

export function buildInterior(scene) {
  const g = new THREE.Group(); g.position.set(INT.x, INT.y, INT.z); scene.add(g);
  const add = (m, x, y, z, p = g) => { m.position.set(x, y, z); p.add(m); return m; };
  const box = (w, h, d, c, o) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, o));
  // oda
  add(box(10, .2, 9, 0x9a6b3f), 0, -.1, 0);
  const room = new THREE.Mesh(new THREE.BoxGeometry(10, 4.4, 9), M(0xe9d8b4, { side: THREE.BackSide })); room.position.y = 2.0; g.add(room);
  add(box(10, .25, .12, 0x6b4a28), 0, .12, -4.45); add(box(.12, .25, 9, 0x6b4a28), -4.95, .12, 0); add(box(.12, .25, 9, 0x6b4a28), 4.95, .12, 0);
  for (let i = -3; i <= 3; i++) add(box(.04, .01, 9, 0x7a5430), i * 1.4, .012, 0);
  // kapı (+z duvarı)
  add(box(1.4, 2.4, .16, 0x5a3a22), 0, 1.2, 4.42); add(box(.14, .14, .2, 0xd8b050), .5, 1.2, 4.3);
  // pencere (arka duvar)
  const winM = M(0xbfe4ff, { emissive: 0x88bbee, emissiveIntensity: .6 });
  add(box(1.8, 1.3, .12, 0x5a3a22), -1.2, 2.3, -4.42); add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, .14), winM), -1.2, 2.3, -4.40, g);
  // yatak
  const bed = new THREE.Group(); add(box(2, .4, 3.2, 0x6b4a28), 0, .3, 0, bed); add(box(1.8, .3, 2.9, 0xf3efe6), 0, .65, 0, bed); add(box(1.8, .34, 1.8, 0xc2527a), 0, .8, .5, bed); add(box(1.2, .28, .6, 0xffffff), 0, .85, -1.1, bed); add(box(2, 1.1, .15, 0x5a3a22), 0, .85, -1.65, bed); bed.position.set(-3.4, 0, -2.6); g.add(bed);
  // masa + semaver
  const tb = new THREE.Group(); add(box(2.2, .15, 1.2, 0x7a5430), 0, .85, 0, tb); [[-.95, -.45], [.95, -.45], [-.95, .45], [.95, .45]].forEach(([x, z]) => add(box(.12, .85, .12, 0x5a3a22), x, .42, z, tb));
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, .35, 10), M(0xb8bcc4, { metalness: .6 })); add(pot, -.4, 1.1, 0, tb); add(new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .25, 8), M(0xb8bcc4, { metalness: .6 })), -.4, 1.4, 0, tb);
  [.3, .75].forEach(x => add(new THREE.Mesh(new THREE.CylinderGeometry(.09, .07, .12, 8), M(0xf5f0e0)), x, .98, .1, tb)); tb.position.set(2.6, 0, -3); g.add(tb);
  // gramofon (dekor)
  const gr = new THREE.Group(); add(box(.5, .3, .5, 0x4a3020), 0, 0, 0, gr); const horn = new THREE.Mesh(new THREE.ConeGeometry(.3, .6, 10, 1, true), M(0xd8b050, { side: THREE.DoubleSide, metalness: .5 })); horn.rotation.z = -1.2; add(horn, .25, .45, 0, gr); gr.position.set(3.4, .85 + .15, -3.0); gr.scale.setScalar(1); gr.visible = false; g.add(gr);
  // raf
  const shelf = new THREE.Group(); add(box(.3, 2.2, 2.6, 0x6b4a28), 0, 1.1, 0, shelf); [.5, 1.1, 1.7].forEach((y, i) => { add(box(.5, .06, 2.4, 0x7a5430), 0, y, 0, shelf); for (let k = 0; k < 4; k++) add(box(.25, .22, .3, [0xff8a65, 0x66d9ff, 0xffd34d, 0xb78bff][(i + k) % 4]), 0, y + .16, -.9 + k * .6, shelf); }); shelf.position.set(4.6, 0, .6); g.add(shelf);
  // dekorlar
  const dec = {};
  dec.hali = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, .03, 24), M(0xc2527a)); dec.hali.position.set(0, .03, .3); const hr = new THREE.Mesh(new THREE.TorusGeometry(1.3, .05, 4, 28), M(0xffd34d)); hr.rotation.x = Math.PI / 2; hr.position.y = .03; dec.hali.add(hr); g.add(dec.hali);
  dec.tablo = new THREE.Group(); add(box(1.6, 1.1, .08, 0x5a3a22), 0, 0, 0, dec.tablo); add(box(1.4, .9, .1, 0x6aa84f), 0, 0, .01, dec.tablo); add(new THREE.Mesh(new THREE.CircleGeometry(.22, 14), M(0xffe27a, { emissive: 0x886600 })), .35, .2, .07, dec.tablo); add(box(1.2, .3, .11, 0x3f7aa8), 0, -.28, .02, dec.tablo); dec.tablo.position.set(1.8, 2.4, -4.42); g.add(dec.tablo);
  dec.saksi = new THREE.Group(); add(new THREE.Mesh(new THREE.CylinderGeometry(.3, .22, .45, 8), M(0xb5442c)), 0, .22, 0, dec.saksi); for (let i = 0; i < 5; i++) { const a = i * 1.26; add(new THREE.Mesh(new THREE.SphereGeometry(.2, 6, 5), M(i % 2 ? 0x4aa84a : 0x6ac45a)), Math.cos(a) * .15, .65 + (i % 3) * .1, Math.sin(a) * .15, dec.saksi); } add(new THREE.Mesh(new THREE.SphereGeometry(.12, 6, 5), M(0xff6b8a, { emissive: 0x551020 })), 0, 1.1, 0, dec.saksi); dec.saksi.position.set(-4.2, 0, 3.4); g.add(dec.saksi);
  dec.lamba = new THREE.Group(); const lb = new THREE.Mesh(new THREE.OctahedronGeometry(.28, 0), M(0xffe27a, { emissive: 0xffc040, emissiveIntensity: 1.5 })); add(lb, 0, 0, 0, dec.lamba); add(box(.02, 1, .02, 0x333333), 0, .6, 0, dec.lamba); dec.lamba.position.set(0, 3.3, 0); g.add(dec.lamba);
  dec.gramofon = gr;
  // ışıklar
  const l1 = new THREE.PointLight(0xffc880, 26, 16, 1.4); l1.position.set(0, 3.6, 0); g.add(l1); const l2 = new THREE.PointLight(0xfff0d8, 8, 12, 1.5); l2.position.set(0, 2.2, 3.2); g.add(l2);
  const label = makeLabel("Çıkış"); label.position.set(0, 2.9, 4.2); label.scale.set(2, .5, 1); g.add(label);
  // etkileşimli noktalar (yerel = dünya xz, çünkü INT.x = INT.z = 0)
  const items = [
    { id: "bed", x: -3.0, z: -1.2, r: 2.2, label: "Yatakta dinlen" },
    { id: "tea", x: 2.6, z: -2.0, r: 1.8, label: "Çay demle ☕" },
    { id: "shelf", x: 3.7, z: .6, r: 1.9, label: "Koleksiyon rafı" },
    { id: "gramo", x: 3.4, z: -2.4, r: 1.2, label: "Gramofonu çal / durdur", need: "gramofon" },
    { id: "door", x: 0, z: 3.5, r: 1.6, label: "Dışarı çık" },
  ];
  const cols = [[-3.4, -2.6, 1.5], [2.6, -3, 1.3], [4.4, .6, .6]];
  const setDecor = owned => { Object.keys(dec).forEach(k => dec[k].visible = !!owned[k]); };
  return { group: g, items, cols, setDecor, winM, light: l1 };
}
