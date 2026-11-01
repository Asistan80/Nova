// Ses: tamamen WebAudio ile üretilir. Kullanıcı tıklayınca başlar.
const Snd = {
  ctx: null, master: null, on: true, amb: null, ambName: "", hb: null, hbRate: 0,
  init() {
    if (this.ctx) return; try {
      const C = window.AudioContext || window.webkitAudioContext; this.ctx = new C();
      this.master = this.ctx.createGain(); this.master.gain.value = this.on ? 0.8 : 0; this.master.connect(this.ctx.destination);
      const n = this.ctx.sampleRate * 3, b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
      let last = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      for (let i = 0; i < 4000; i++) { const k = i / 4000; d[i] *= k; d[n - 1 - i] *= k; }   // dikişsiz döngü
      this.noise = b;
      const nb = this.ctx.createBuffer(1, n, this.ctx.sampleRate), e = nb.getChannelData(0); for (let i = 0; i < n; i++) e[i] = Math.random() * 2 - 1; this.white = nb;
      this.hbTimer = setInterval(() => this.beat(), 200);
    } catch (e) { this.ctx = null; }
  },
  setOn(v) { this.on = v; if (this.master) this.master.gain.value = v ? 0.8 : 0; },
  _loop(buf, type, freq, q, vol) {
    const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(this.master); s.start();
    g.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 2); return { s, g };
  },
  ambient(name) {
    if (!this.ctx || name === this.ambName) return; this.ambName = name;
    if (this.amb) { const a = this.amb; a.g.forEach(x => x.g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5)); setTimeout(() => a.g.forEach(x => { try { x.s.stop(); } catch (e) { } }), 1700); }
    const L = [];
    if (name === "rain") { L.push(this._loop(this.white, "bandpass", 3500, 0.4, 0.16), this._loop(this.noise, "lowpass", 400, 0.5, 0.35)); }
    else if (name === "birds") { L.push(this._loop(this.noise, "lowpass", 300, 0.5, 0.1)); this.birdT = setInterval(() => this.chirp(), 900); }
    else { L.push(this._loop(this.noise, "lowpass", 160, 0.5, 0.45)); const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = "sine"; o.frequency.value = 55; g.gain.value = 0; o.connect(g); g.connect(this.master); o.start(); g.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 3); L.push({ s: o, g }); }
    if (name !== "birds" && this.birdT) { clearInterval(this.birdT); this.birdT = null; }
    this.amb = { g: L };
  },
  tone(f, d, type = "sine", v = 0.2, f2 = null, delay = 0) {
    if (!this.ctx) return; const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + 0.05);
  },
  burst(d, v, type = "lowpass", f = 800, delay = 0) {
    if (!this.ctx) return; const t = this.ctx.currentTime + delay, s = this.ctx.createBufferSource(); s.buffer = this.white;
    const fl = this.ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; const g = this.ctx.createGain();
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(fl); fl.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + d + 0.05);
  },
  chirp() { if (this.ambName !== "birds") return; const f = 2200 + Math.random() * 1500; this.tone(f, 0.12, "sine", 0.04, f * 1.4); this.tone(f * 1.1, 0.1, "sine", 0.03, f * 1.5, 0.15); },
  click() { this.tone(520, 0.05, "triangle", 0.05); },
  item() { this.tone(660, 0.2, "sine", 0.1); this.tone(990, 0.3, "sine", 0.08, null, 0.1); },
  knock() { for (let i = 0; i < 3; i++) { this.burst(0.09, 0.9, "lowpass", 260, i * 0.28); this.tone(90, 0.12, "sine", 0.5, 50, i * 0.28); } },
  stinger(kind) {
    if (!this.ctx) return;
    if (kind === "face") { this.burst(0.9, 1.0, "bandpass", 1800); this.tone(70, 1.2, "sawtooth", 0.5, 30); this.tone(1400, 0.8, "sawtooth", 0.2, 3000); this.tone(1480, 0.8, "square", 0.12, 2900); }
    else if (kind === "shadow") { this.burst(0.5, 0.8, "lowpass", 400); this.tone(48, 1.0, "sine", 0.6, 30); }
    else if (kind === "flash") { this.burst(0.3, 1.0, "highpass", 3000); this.tone(100, 0.5, "square", 0.3, 40); }
    else if (kind === "knock") this.knock();
    else if (kind === "lights") { this.burst(0.15, 0.6, "highpass", 5000); this.tone(60, 1.5, "sine", 0.4, 40, 0.1); }
    else this.burst(0.4, 0.5, "lowpass", 600);
  },
  whisper() { this.burst(1.6, 0.18, "bandpass", 2600); this.burst(1.6, 0.14, "bandpass", 3300, 0.2); },
  setSanity(san) { this.hbRate = san < 70 ? (70 - san) / 70 : 0; },
  beat() { if (!this.ctx || !this.on || this.hbRate <= 0) return; this._acc = (this._acc || 0) + 0.2 * (0.8 + this.hbRate * 1.8); if (this._acc >= 1) { this._acc = 0; this.tone(52, 0.18, "sine", 0.45 * this.hbRate + 0.1, 36); this.tone(48, 0.16, "sine", 0.35 * this.hbRate, 34, 0.18); } },
  end(kind) { if (kind === "good") { this.tone(392, 1.5, "sine", 0.12); this.tone(523, 1.8, "sine", 0.1, null, 0.4); this.tone(659, 2.2, "sine", 0.1, null, 0.8); } else if (kind === "ok") { this.tone(330, 2, "sine", 0.1); } else { this.stinger("face"); } }
};
